/**
 * Hero 3D de la landing (specs/001-dentadura-3d-hero): cráneo inferior en rayos X
 * (maxilar + mandíbula) sobre un fondo de velos de luz que se mueven con el cursor.
 *
 * Módulo ES sin efectos al importarse: todo ocurre al llamar a iniciar().
 * Lo carga js/principal.js de forma diferida, después del primer pintado.
 *
 * Un solo canvas a todo el escenario del hero: primero se dibuja el fondo de velos y
 * encima la radiografía, que multiplica el color del fondo (así los velos se ven a través
 * del hueso). Los dientes se dibujan al final con un material propio, blanco y brillante.
 *
 * Estados (data-model.md): cargando | animado | pausado | estatico.
 * Cualquier error se captura y degrada a "estatico" (póster) sin lanzar.
 *
 * Los colores salen de los tokens CSS de :root (constitución, principio I): este archivo
 * no contiene ningún color literal.
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, ShaderMaterial, Mesh, Group, Vector2, Vector3,
  MathUtils, BufferGeometry, BufferAttribute, DoubleSide, CustomBlending, AddEquation,
  ZeroFactor, SrcColorFactor, GLTFLoader, MeshoptDecoder
} from "../assets/js/vendor/three-dentadura.min.js";

const ESTADOS = ["cargando", "animado", "pausado", "estatico"];

const FOV = 28;
const APERTURA_MAX = MathUtils.degToRad(30);   // ángulo de la mandíbula abierta (0° = cerrada)
// El cráneo ya arranca con el tamaño «acercado» (lo fija el CSS con --escala-figura, de modo que
// el póster y el 3D coinciden); el scroll del hero solo abre la mandíbula y difumina el modelo
// bajo los textos. APERTURA_TRAMO es la parte del recorrido que dura la apertura.
const APERTURA_TRAMO = 0.7;
const APERTURA_VEL_MAX = 1.75;                 // progreso máximo por segundo: aunque el scroll salte, la mandíbula tarda ≥ ~0,4 s en abrirse
const BAJA_FOCO_BOCA = 0.35;                   // el punto de mira baja hacia la mitad de la boca (unidades del modelo)
const AJUSTE_ENCUADRE = 0.91;                  // la figura cerrada ocupa este tanto del recuadro del póster
const ABSORCION = 0.66;                        // densidad de la radiografía
const DESVANECE = new Vector2(0.30, 1.15);     // la bóveda del cráneo se desvanece entre estas alturas (y del mundo)
const INCLINA_Y = 0.25;                        // inclinación máxima hacia el cursor (rad)
const INCLINA_X = 0.12;
const SEGUNDOS_MEDICION_FPS = 2;
const CALENTAMIENTO_MS = 1000;                 // tras el primer cuadro no se mide (compilación de shaders, carga de texturas)
const FPS_OBJETIVO = 45;                       // por debajo se baja la resolución un escalón; por debajo de umbralFps se degrada a imágenes
const FPS_MAX = 60;                            // tope de cuadros por segundo: en pantallas de 120/144 Hz no se gasta el doble de GPU
const DPR_MAX = { completo: 2, ligero: 1.5 };
// Presupuesto de píxeles del lienzo: el fondo de velos es un shader por píxel, y en pantallas grandes o de alta densidad
// (4–8 Mpx) satura GPUs integradas y navegadores sin buena aceleración. La relación de píxeles baja hasta caber.
const PIXELES_MAX = { completo: 1.8e6, ligero: 1.0e6 };
const CALIDAD_ESCALON = 0.75;                  // cada escalón de calidad multiplica la resolución por esto (como mucho 2 escalones)
const CALIDAD_MIN = 0.55;
// GPU emulada por software (SwiftShader, llvmpipe…): el 3D iría a pocos cuadros por segundo, se pasa a imágenes de entrada
const GPU_POR_SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i;
// Clic sobre el cráneo: solo cuenta si cae a menos de este radio de algún vértice del modelo ya proyectado
// en pantalla (fracción del ancho de la figura, acotada en píxeles).
const RADIO_CLIC = { fraccion: 0.045, minPx: 18, maxPx: 32 };

/* ---------- Shaders ---------- */

const VERTEX_RAYOS_X = `
  attribute vec4 color;
  varying float vD; varying vec3 vN, vV; varying float vY;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vD = color.r;
    vN = normalMatrix * normal;
    vV = -mv.xyz;
    vY = (modelMatrix * vec4(position, 1.0)).y;
    gl_Position = projectionMatrix * mv;
  }`;

// Cada capa de la malla (caras delanteras y traseras) multiplica el fondo por el tinte de la
// radiografía; donde hay más capas o la superficie se ve de canto, se oscurece.
// Máscara en pantalla de las zonas de texto (cabecera y eslogan): difumina la parte del modelo
// que se superpone a ellos. Las cajas vienen en píxeles del buffer, con y desde arriba.
const GLSL_MASCARA = `
  uniform vec2 uRes; uniform vec4 uCajaA, uCajaB; uniform float uDifumina;
  float distCaja(vec2 p, vec4 c) {
    vec2 d = abs(p - (c.xy + c.zw) * 0.5) - (c.zw - c.xy) * 0.5;
    return length(max(d, 0.0));
  }
  float mascara() {
    vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
    float f = uRes.y * 0.04;
    float m = max(1.0 - smoothstep(0.0, f, distCaja(p, uCajaA)), 1.0 - smoothstep(0.0, f, distCaja(p, uCajaB)));
    return m * uDifumina;
  }`;

const FRAGMENT_RAYOS_X = GLSL_MASCARA + `
  uniform float uAbs, uAbsT; uniform vec2 uFade; uniform vec3 uTinta;
  varying float vD; varying vec3 vN, vV; varying float vY;
  void main() {
    float ndv = abs(dot(normalize(vN), normalize(vV)));
    float rim = pow(1.0 - ndv, 1.5);
    float edge = smoothstep(0.30, 0.0, ndv);
    float fade = 1.0 - smoothstep(uFade.x, uFade.y, vY);
    float a = clamp(mix(uAbs, uAbsT, vD) * (0.26 + 0.74 * rim + 0.55 * edge), 0.0, 0.92) * fade * (1.0 - 0.92 * mascara());
    gl_FragColor = vec4(mix(vec3(1.0), uTinta, a), 1.0);
  }`;

const VERTEX_DIENTES = `
  varying vec3 vN, vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalMatrix * normal;
    vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }`;

const FRAGMENT_DIENTES = GLSL_MASCARA + `
  uniform vec3 uBlanco, uLuz;
  varying vec3 vN, vV;
  void main() {
    vec3 n = normalize(vN);
    vec3 v = normalize(vV);
    vec3 l1 = normalize(vec3(0.35, 0.5, 1.0));
    vec3 l2 = normalize(vec3(-0.7, 0.2, -0.3));
    float difusa = max(dot(n, l1), 0.0) * 0.55 + max(dot(n, l2), 0.0) * 0.2;
    float cielo = 0.5 + 0.5 * n.y;
    vec3 col = mix(uLuz, uBlanco, clamp(0.3 + 0.35 * cielo + difusa, 0.0, 1.0));
    float brillo = pow(max(dot(n, normalize(l1 + v)), 0.0), 60.0) * 0.8;
    float borde = pow(1.0 - max(dot(n, v), 0.0), 3.0) * 0.3;
    col = mix(col, uLuz, borde) + brillo;
    gl_FragColor = vec4(col, 1.0 - 0.35 * mascara());
  }`;

const VERTEX_VELOS = `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }`;

// Velos translúcidos entrelazados: cada capa es una cinta ondulada de bordes suaves que
// tiñe el fondo; donde se cruzan se acumulan y el pliegue de cada cinta deja un reflejo.
// El cursor desplaza las capas (paralaje, más fuerte en las cercanas) y curva las cintas
// a su alrededor (lente local).
const FRAGMENT_VELOS = `
  precision highp float;
  uniform float uAspect, uTiempo, uInfluencia;
  uniform vec2 uCursor;
  uniform vec3 uFondo, uVelo1, uVelo2, uTinta, uBrillo;
  varying vec2 vUv;

  vec3 velo(vec3 col, vec2 p, float freq, float amp, float fase, float ancho,
            float pend, float paralaje, vec3 tinte, float fuerza, float luz) {
    vec2 dc = p - uCursor;
    float lente = exp(-dot(dc, dc) * 5.0) * uInfluencia;
    vec2 q = p - uCursor * paralaje;
    q -= dc * lente * vec2(0.3, 0.7);
    q.y -= pend * q.x;
    float y = amp * sin(q.x * freq + fase) + 0.45 * amp * sin(q.x * freq * 2.3 - fase * 1.3 + 1.7);
    float d = (q.y - y) / ancho;
    float cuerpo = exp(-d * d * 0.8);
    // pliegues de la tela dentro del velo
    float pliegue = 0.5 + 0.5 * sin(d * 3.0 + q.x * 2.0 + fase * 0.8);
    col = mix(col, tinte, cuerpo * fuerza * (0.25 + 0.75 * pliegue));
    // luz que se desliza por el borde superior del velo y por sus pliegues
    float borde = exp(-(d + 0.9) * (d + 0.9) * 7.0);
    col = mix(col, uBrillo, (borde * 0.8 + pow(cuerpo, 6.0) * pliegue * 0.5) * luz);
    return col;
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    float t = uTiempo;
    vec3 col = uFondo;
    col = velo(col, p, 1.0, 0.24, 1.2 + t * 0.12, 0.60,  0.50, 0.08, uVelo1, 0.55, 0.50);
    col = velo(col, p, 1.4, 0.18, 3.0 - t * 0.17, 0.46, -0.40, 0.14, uVelo2, 0.45, 0.45);
    col = velo(col, p, 2.0, 0.14, 0.0 + t * 0.26, 0.36,  0.15, 0.22, uVelo1, 0.60, 0.60);
    col = velo(col, p, 1.2, 0.20, 5.1 - t * 0.20, 0.50, -0.65, 0.30, uVelo2, 0.40, 0.40);
    col = velo(col, p, 2.6, 0.10, 4.1 + t * 0.34, 0.26,  0.30, 0.38, uVelo1, 0.55, 0.65);
    // hilos finos: tinta y luz
    col = velo(col, p, 1.8, 0.26, 0.7 + t * 0.18, 0.014, -0.35, 0.42, uTinta, 0.55, 0.0);
    col = velo(col, p, 1.5, 0.24, 3.3 - t * 0.22, 0.012,  0.35, 0.50, uBrillo, 0.0, 1.0);
    // ruido mínimo para evitar bandas en los degradados
    col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
    gl_FragColor = vec4(col, 1.0);
  }`;

/* ---------- Utilidades ---------- */

/** Lee un token de color de :root como componentes sRGB 0–1 (los shaders no convierten espacio de color). */
function leerColor(nombre) {
  const bruto = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(bruto);
  if (m) {
    const hex = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
    return new Vector3(
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255
    );
  }
  m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(bruto);
  if (m) return new Vector3(m[1] / 255, m[2] / 255, m[3] / 255);
  throw new Error("Token de color ilegible: " + nombre);
}

const acota = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const suaviza = (x) => x * x * (3 - 2 * x);

/** Caja que envuelve a todas las mallas (en espacio del mundo, con la pose actual). */
function medirCaja(raiz) {
  const min = new Vector3(Infinity, Infinity, Infinity);
  const max = new Vector3(-Infinity, -Infinity, -Infinity);
  raiz.updateMatrixWorld(true);
  raiz.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.computeBoundingBox();
    const { min: a, max: b } = o.geometry.boundingBox;
    for (let i = 0; i < 8; i++) {
      const v = new Vector3(i & 1 ? b.x : a.x, i & 2 ? b.y : a.y, i & 4 ? b.z : a.z).applyMatrix4(o.matrixWorld);
      min.min(v);
      max.max(v);
    }
  });
  return { min, max, centro: min.clone().add(max).multiplyScalar(0.5), tam: max.clone().sub(min) };
}

/**
 * `captura` es solo para desarrollo (specs/002-hero-estatico-scroll, contrato §6): sin velos, fondo blanco
 * opaco, sin bucle de animación, y devuelve capturar(apertura) para generar las imágenes del hero estático
 * con los mismos shaders, cámara y encuadre que el 3D. Sin ella el comportamiento no cambia.
 *
 * @param {{ hero: HTMLElement, figura: HTMLElement, nivel: "ligero"|"completo", rutaModelo: string, umbralFps?: number, captura?: boolean }} opciones
 * @returns {Promise<{ destruir(): void, estado(): string, sobreModelo(x: number, y: number, holgura?: number): boolean, capturar?(apertura: number): object }>}
 */
export async function iniciar({ hero, figura, nivel, rutaModelo, umbralFps = 24, captura = false }) {
  let estado = "cargando";
  let destruido = false;
  const limpiezas = [];
  let sobreModelo = () => false;

  function cambiarEstado(nuevo) {
    if (destruido || !ESTADOS.includes(nuevo) || nuevo === estado) return;
    estado = nuevo;
    document.dispatchEvent(new CustomEvent("dentadura:estado", { detail: { estado, nivel } }));
  }

  function degradar() {
    document.documentElement.dataset.hero = "estatico";
    cambiarEstado("estatico");
    destruir();
  }

  function destruir() {
    if (destruido) return;
    limpiezas.splice(0).reverse().forEach((limpiar) => {
      try { limpiar(); } catch (_) { /* la limpieza nunca debe lanzar */ }
    });
    destruido = true;
  }

  document.dispatchEvent(new CustomEvent("dentadura:estado", { detail: { estado, nivel } }));

  try {
    const escenario = hero.querySelector(".hero__escenario");
    const poster = figura.querySelector(".hero__poster");
    if (!escenario) throw new Error("Falta .hero__escenario");

    /* ---- Renderer y canvas ---- */
    const canvas = document.createElement("canvas");
    canvas.className = "hero__canvas";
    canvas.setAttribute("aria-hidden", "true");
    const renderer = new WebGLRenderer({ canvas, antialias: nivel === "completo", alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: captura });
    if (!captura) {
      const gl = renderer.getContext();
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const gpu = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || "") : "";
      if (GPU_POR_SOFTWARE.test(gpu)) throw new Error("GPU por software: " + gpu);
    }
    let calidad = 1;   // escalón de resolución (1 = máxima); baja si los fps no llegan al objetivo
    // Relación de píxeles del lienzo: la del dispositivo, acotada por nivel, por el presupuesto de píxeles y por la calidad
    function relacionPixeles(w, h) {
      if (captura) return Math.min(window.devicePixelRatio || 1, DPR_MAX[nivel] || 1.5);
      const dispositivo = Math.min(window.devicePixelRatio || 1, DPR_MAX[nivel] || 1.5);
      const presupuesto = Math.sqrt((PIXELES_MAX[nivel] || 1.5e6) / Math.max(1, w * h));
      return Math.max(0.5, Math.min(dispositivo, presupuesto) * calidad);
    }
    renderer.setPixelRatio(relacionPixeles(1280, 720));
    escenario.insertBefore(canvas, escenario.firstChild);
    limpiezas.push(() => {
      renderer.setAnimationLoop(null);
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      figura.classList.remove("is-3d");
    });

    const alPerderContexto = (e) => { e.preventDefault(); degradar(); };
    canvas.addEventListener("webglcontextlost", alPerderContexto);

    const escena = new Scene();
    const camara = new PerspectiveCamera(FOV, 1, 0.1, 100);

    /* ---- Materiales (colores desde los tokens de :root) ---- */
    const tinta = leerColor("--color-rayosx");
    const blanco = leerColor("--color-superficie");
    const luzDientes = leerColor("--color-rayosx-luz");

    const uniformsMascara = {
      uRes: { value: new Vector2(1, 1) },
      uCajaA: { value: [0, 0, 0, 0] },
      uCajaB: { value: [0, 0, 0, 0] },
      uDifumina: { value: 0 }
    };
    const matHueso = new ShaderMaterial({
      uniforms: {
        uAbs: { value: ABSORCION }, uAbsT: { value: ABSORCION * 1.6 },
        uFade: { value: DESVANECE }, uTinta: { value: tinta }, ...uniformsMascara
      },
      vertexShader: VERTEX_RAYOS_X,
      fragmentShader: FRAGMENT_RAYOS_X,
      side: DoubleSide, transparent: true, depthTest: false, depthWrite: false,
      blending: CustomBlending, blendEquation: AddEquation, blendSrc: ZeroFactor, blendDst: SrcColorFactor
    });
    // transparent:true los pone en la misma cola que el hueso; renderOrder 2 los dibuja encima.
    const matDientes = new ShaderMaterial({
      uniforms: { uBlanco: { value: blanco }, uLuz: { value: luzDientes }, ...uniformsMascara },
      vertexShader: VERTEX_DIENTES,
      fragmentShader: FRAGMENT_DIENTES,
      transparent: true, depthTest: true, depthWrite: true
    });

    const uniformsVelos = {
      uAspect: { value: 1 }, uTiempo: { value: 0 }, uInfluencia: { value: 0 },
      uCursor: { value: new Vector2() },
      uFondo: { value: leerColor("--color-velo-fondo") },
      uVelo1: { value: leerColor("--color-velo-1") },
      uVelo2: { value: leerColor("--color-velo-2") },
      uTinta: { value: tinta },
      uBrillo: { value: blanco }
    };
    const matVelos = new ShaderMaterial({
      uniforms: uniformsVelos,
      vertexShader: VERTEX_VELOS,
      fragmentShader: FRAGMENT_VELOS,
      transparent: true, depthTest: false, depthWrite: false
    });
    const geoVelos = new BufferGeometry();   // un triángulo que cubre toda la pantalla
    geoVelos.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    const velos = new Mesh(geoVelos, matVelos);
    velos.frustumCulled = false;
    velos.renderOrder = -1;
    if (captura) {
      // Fondo blanco opaco (el color del token de superficie): las imágenes del hero estático se mezclan con multiply
      renderer.setClearColor((Math.round(blanco.x * 255) << 16) | (Math.round(blanco.y * 255) << 8) | Math.round(blanco.z * 255));
    } else {
      escena.add(velos);
    }

    /* ---- Modelo ---- */
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(rutaModelo);
    if (destruido) { geoVelos.dispose(); matVelos.dispose(); matHueso.dispose(); matDientes.dispose(); return { destruir, estado: () => estado }; }

    const modelo = gltf.scene;
    const mandibula = modelo.getObjectByName("mandibula");
    if (!mandibula) throw new Error("El modelo no tiene el nodo «mandibula»");
    mandibula.rotation.x = 0;   // cerrada
    modelo.traverse((o) => {
      if (!o.isMesh) return;
      const esDiente = o.material && o.material.name === "dientes";
      o.material = esDiente ? matDientes : matHueso;
      o.frustumCulled = false;
      o.renderOrder = esDiente ? 2 : 1;
    });
    limpiezas.push(() => {
      geoVelos.dispose(); matVelos.dispose(); matHueso.dispose(); matDientes.dispose();
      modelo.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
    });

    // Pose cerrada: caja total y centro de los dientes superiores (la boca, al abrir)
    const caja = medirCaja(modelo);
    const dientesSup = modelo.getObjectByName("dientes_sup");
    const cajaDientes = medirCaja(dientesSup);
    const focoBoca = cajaDientes.centro.clone().sub(caja.centro);
    focoBoca.y -= BAJA_FOCO_BOCA;

    // El pivote gira alrededor del centro de la figura; el modelo conserva su posición en el mundo.
    const pivote = new Group();
    pivote.rotation.order = "YXZ";
    pivote.position.copy(caja.centro);
    modelo.position.sub(caja.centro);
    pivote.add(modelo);
    escena.add(pivote);

    /* ---- Encuadre: la figura cerrada ocupa el mismo recuadro que el póster ---- */
    const aspectoPoster = poster && poster.naturalWidth ? poster.naturalWidth / poster.naturalHeight : caja.tam.x / caja.tam.y;
    const tanMedio = Math.tan(MathUtils.degToRad(FOV / 2));
    let distancia = 8;

    function medir() {
      const e = escenario.getBoundingClientRect();
      const f = figura.getBoundingClientRect();
      const w = Math.max(1, Math.round(e.width));
      const h = Math.max(1, Math.round(e.height));
      renderer.setPixelRatio(relacionPixeles(w, h));
      renderer.setSize(w, h, false);
      camara.aspect = w / h;
      uniformsVelos.uAspect.value = w / h;

      let rw = f.width;
      let rh = f.height;
      if (rw / rh > aspectoPoster) rw = rh * aspectoPoster; else rh = rw / aspectoPoster;
      const dAlto = (caja.tam.y * h) / (Math.max(rh, 1) * 2 * tanMedio);
      const dAncho = (caja.tam.x * h) / (Math.max(rw, 1) * 2 * tanMedio);
      distancia = Math.max(dAlto, dAncho) * AJUSTE_ENCUADRE;

      // Zonas de texto que difuminan al modelo (en píxeles del buffer, y desde arriba)
      const px = renderer.getPixelRatio();
      const cajaDe = (el) => {
        if (!el) return [0, 0, 0, 0];
        const r = el.getBoundingClientRect();
        return [(r.left - e.left) * px, (r.top - e.top) * px, (r.right - e.left) * px, (r.bottom - e.top) * px];
      };
      uniformsMascara.uRes.value.set(w * px, h * px);
      uniformsMascara.uCajaA.value = cajaDe(hero.querySelector(".hero__cabecera"));
      uniformsMascara.uCajaB.value = cajaDe(hero.querySelector(".hero__eslogan"));

      // Desplaza la proyección para que la figura quede en el centro del recuadro del póster
      const cx = f.left - e.left + f.width / 2;
      const cy = f.top - e.top + f.height / 2;
      camara.setViewOffset(w, h, w / 2 - cx, h / 2 - cy, w, h);
    }

    const observador = new ResizeObserver(medir);
    observador.observe(escenario);
    observador.observe(figura);
    limpiezas.push(() => observador.disconnect());
    medir();

    /* ---- ¿Está el punto (coordenadas de ventana) cerca del modelo? ----
       Proyecta los vértices con la pose y la cámara actuales (mandíbula, inclinación y encuadre incluidos)
       y busca alguno a menos de RADIO_CLIC. Solo se llama al hacer clic o al mover el ratón sobre la figura. */
    const vertice = new Vector3();
    sobreModelo = (clientX, clientY, holgura = 0) => {
      if (destruido) return false;
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      const f = figura.getBoundingClientRect();
      const radio = Math.min(RADIO_CLIC.maxPx, Math.max(RADIO_CLIC.minPx, f.width * RADIO_CLIC.fraccion)) + holgura;
      const radio2 = radio * radio;
      pivote.updateMatrixWorld(true);
      camara.updateMatrixWorld(true);
      let encontrado = false;
      modelo.traverse((o) => {
        if (encontrado || !o.isMesh) return;
        const pos = o.geometry.getAttribute("position");
        for (let i = 0; i < pos.count; i++) {
          vertice.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).project(camara);
          const dx = r.left + (vertice.x * 0.5 + 0.5) * r.width - clientX;
          const dy = r.top + (0.5 - vertice.y * 0.5) * r.height - clientY;
          if (dx * dx + dy * dy <= radio2) { encontrado = true; return; }
        }
      });
      return encontrado;
    };

    /* ---- Modo captura (solo desarrollo): una pose fija por llamada, sin bucle ni entradas ---- */
    if (captura) {
      const puntoFijo = cajaDientes.centro.clone();   // punto del maxilar (no se mueve al abrir la mandíbula)
      const aPantalla = (p, r) => ({
        x: r.left + (p.x * 0.5 + 0.5) * r.width,
        y: r.top + (0.5 - p.y * 0.5) * r.height
      });
      const ponerPose = (apertura) => {
        const o = suaviza(acota(apertura / APERTURA_TRAMO));
        mandibula.rotation.x = APERTURA_MAX * o;
        uniformsMascara.uDifumina.value = o;
        pivote.rotation.set(0, 0, 0);
        const c = caja.centro;
        const fx = focoBoca.x * o;
        const fy = focoBoca.y * o;
        camara.position.set(c.x + fx, c.y + fy, c.z + distancia);
        camara.lookAt(c.x + fx, c.y + fy, c.z);
        camara.updateMatrixWorld(true);
        pivote.updateMatrixWorld(true);
      };
      const capturar = (apertura) => {
        const e = escenario.getBoundingClientRect();
        const caja_f = figura.getBoundingClientRect();
        // Rectángulo que ocupa el póster dentro de la figura (object-fit: contain, proporción fija): las medidas
        // se dan respecto a él porque, a diferencia de la caja de la figura, no cambia de proporción con la ventana
        let pw = caja_f.width;
        let ph = caja_f.height;
        if (pw / ph > aspectoPoster) pw = ph * aspectoPoster; else ph = pw / aspectoPoster;
        const poster = { left: caja_f.left + (caja_f.width - pw) / 2, top: caja_f.top + (caja_f.height - ph) / 2, width: pw, height: ph };

        // El cráneo acercado desborda el lienzo (por los lados en móvil; por arriba al abrir la boca): se agranda el
        // lienzo (misma escala de píxeles, cajas de texto desplazadas, difuminado calculado sobre la altura original)
        // hasta contener el póster entero con margen, por los lados y por arriba
        const h = Math.max(1, Math.round(e.height));
        const izqRel = poster.left - e.left;
        const ex = Math.ceil(Math.max(0, 0.03 * pw - izqRel, izqRel + 1.03 * pw - Math.round(e.width)));
        const W = Math.max(1, Math.round(e.width)) + 2 * ex;
        const ey = Math.ceil(0.2 * ph);
        const H = h + ey;
        const px = renderer.getPixelRatio();
        renderer.setSize(W, H, false);
        camara.aspect = W / H;
        camara.fov = 2 * MathUtils.radToDeg(Math.atan(tanMedio * H / h));   // misma distancia focal en píxeles
        const cx = caja_f.left - e.left + caja_f.width / 2 + ex;
        const cy = caja_f.top - e.top + caja_f.height / 2 + ey;
        camara.setViewOffset(W, H, W / 2 - cx, H / 2 - cy, W, H);
        const desplazar = (c) => [c[0] + ex * px, c[1], c[2] + ex * px, c[3]];
        uniformsMascara.uRes.value.set(W * px, h * px);   // la máscara usa y desde el borde superior original
        uniformsMascara.uCajaA.value = desplazar(uniformsMascara.uCajaA.value);
        uniformsMascara.uCajaB.value = desplazar(uniformsMascara.uCajaB.value);
        const r = { left: e.left - ex, top: e.top - ey, width: W, height: H, right: e.left - ex + W, bottom: e.top - ey + H };

        ponerPose(0);
        const base = aPantalla(puntoFijo.clone().project(camara), r);
        ponerPose(acota(apertura));
        renderer.render(escena, camara);
        const imagen = canvas.toDataURL("image/png");
        // Capas por separado (hueso solo; dientes solos sobre blanco y sobre negro): permiten componer un WebP con
        // transparencia en el que los dientes son opacos, como en el 3D, y el hueso se oscurece como con multiply
        const colorBlanco = (Math.round(blanco.x * 255) << 16) | (Math.round(blanco.y * 255) << 8) | Math.round(blanco.z * 255);
        const dibujarCapa = (hueso, dientes, fondo) => {
          modelo.traverse((o) => { if (o.isMesh) o.visible = o.material === matDientes ? dientes : hueso; });
          renderer.setClearColor(fondo);
          renderer.render(escena, camara);
          return canvas.toDataURL("image/png");
        };
        const capas = {
          hueso: dibujarCapa(true, false, colorBlanco),
          dientesBlanco: dibujarCapa(false, true, colorBlanco),
          dientesNegro: dibujarCapa(false, true, 0x000000)
        };
        modelo.traverse((o) => { if (o.isMesh) o.visible = true; });
        renderer.setClearColor(colorBlanco);
        const fija = aPantalla(puntoFijo.clone().project(camara), r);

        // Caja que envuelve al modelo visible (se descarta la bóveda ya desvanecida), en % del rectángulo del póster
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        modelo.traverse((o) => {
          if (!o.isMesh) return;
          const pos = o.geometry.getAttribute("position");
          for (let i = 0; i < pos.count; i++) {
            vertice.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
            if (vertice.y > DESVANECE.y) continue;
            const p = aPantalla(vertice.project(camara), r);
            if (p.x < x0) x0 = p.x;
            if (p.x > x1) x1 = p.x;
            if (p.y < y0) y0 = p.y;
            if (p.y > y1) y1 = p.y;
          }
        });
        // 2 % del póster alrededor, recortado al lienzo (solo existen los píxeles que se renderizaron)
        const margen = 0.02;
        const cx0 = Math.max(r.left, x0 - margen * pw);
        const cy0 = Math.max(r.top, y0 - margen * ph);
        const cx1 = Math.min(r.right, x1 + margen * pw);
        const cy1 = Math.min(r.bottom, y1 + margen * ph);
        const resultado = {
          imagen,
          capas,
          recuadro: { izq: ((cx0 - poster.left) / pw) * 100, arr: ((cy0 - poster.top) / ph) * 100, ancho: ((cx1 - cx0) / pw) * 100, alto: ((cy1 - cy0) / ph) * 100 },
          desplazamiento: { x: ((fija.x - base.x) / pw) * 100, y: ((fija.y - base.y) / ph) * 100 },
          posterPx: { x: poster.left - r.left, y: poster.top - r.top, w: pw, h: ph },
          lienzoPx: { w: W, h: H },
          dpr: px
        };
        camara.fov = FOV;
        medir();   // devuelve el lienzo, la cámara y las cajas de texto a su estado normal
        return resultado;
      };
      cambiarEstado("pausado");
      return { destruir, estado: () => estado, sobreModelo: (x, y, holgura) => sobreModelo(x, y, holgura), capturar };
    }

    /* ---- Entradas: scroll (apertura) y puntero (velos + inclinación) ---- */
    let apertura = acota(parseFloat(getComputedStyle(hero).getPropertyValue("--apertura")) || 0);
    let aperturaSuave = apertura;
    const alApertura = (e) => { apertura = acota(e.detail.progreso); };
    document.addEventListener("dentadura:apertura", alApertura);
    limpiezas.push(() => document.removeEventListener("dentadura:apertura", alApertura));

    // En pantallas táctiles el modelo no se inclina hacia el dedo (solo los velos de fondo siguen al puntero)
    const inclina = !captura && window.matchMedia && window.matchMedia("(pointer: coarse)").matches ? 0 : 1;
    const ptr = { x: 0, y: 0, sx: 0, sy: 0, activo: false, influencia: 0, velocidad: 0 };
    function leerPuntero(e) {
      const r = escenario.getBoundingClientRect();
      const nx = acota(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      const ny = acota(-(((e.clientY - r.top) / r.height) * 2 - 1), -1, 1);
      ptr.velocidad = Math.min(ptr.velocidad + Math.hypot(nx - ptr.x, ny - ptr.y), 1.5);
      ptr.x = nx;
      ptr.y = ny;
      ptr.activo = true;
    }
    const alSoltar = (e) => { if (e.pointerType !== "mouse") ptr.activo = false; };
    const alSalir = () => { ptr.activo = false; };
    window.addEventListener("pointermove", leerPuntero, { passive: true });
    window.addEventListener("pointerdown", leerPuntero, { passive: true });
    window.addEventListener("pointerup", alSoltar, { passive: true });
    window.addEventListener("pointercancel", alSoltar, { passive: true });
    window.addEventListener("blur", alSalir);
    document.documentElement.addEventListener("pointerleave", alSalir);
    limpiezas.push(() => {
      window.removeEventListener("pointermove", leerPuntero);
      window.removeEventListener("pointerdown", leerPuntero);
      window.removeEventListener("pointerup", alSoltar);
      window.removeEventListener("pointercancel", alSoltar);
      window.removeEventListener("blur", alSalir);
      document.documentElement.removeEventListener("pointerleave", alSalir);
    });

    /* ---- Bucle ---- */
    let ultimo = performance.now();
    let reloj = 0;           // segundos propios del fondo; avanzan más rápido si el cursor se mueve
    let primerCuadro = true;
    let medicion = { inicio: 0, cuadros: 0 };
    let intentosFps = 0;

    let ultimoRender = 0;
    let recalcular = false;   // hay que reajustar el lienzo (cambio de calidad): se hace al empezar el siguiente cuadro
    function cuadro(ahora) {
      if (!captura && ahora - ultimoRender < 1000 / FPS_MAX - 1) return;   // tope de cuadros: el tiempo acumulado sigue en `ultimo`
      ultimoRender = ahora;
      if (recalcular) { recalcular = false; medir(); }   // antes de dibujar: así el cuadro que se presenta nunca sale vacío
      const dt = Math.min((ahora - ultimo) / 1000, 0.1);
      ultimo = ahora;
      const k = 1 - Math.exp(-dt * 9);

      const paso = (apertura - aperturaSuave) * k;
      aperturaSuave += Math.max(-APERTURA_VEL_MAX * dt, Math.min(APERTURA_VEL_MAX * dt, paso));
      const o = suaviza(acota(aperturaSuave / APERTURA_TRAMO));
      mandibula.rotation.x = APERTURA_MAX * o;
      uniformsMascara.uDifumina.value = o;

      ptr.sx += (ptr.x - ptr.sx) * k;
      ptr.sy += (ptr.y - ptr.sy) * k;
      ptr.influencia += ((ptr.activo ? 1 : 0) - ptr.influencia) * k;
      ptr.velocidad *= Math.exp(-dt * 4);

      reloj += dt * (0.7 + 2.2 * ptr.velocidad * ptr.influencia);
      uniformsVelos.uTiempo.value = reloj;
      uniformsVelos.uInfluencia.value = ptr.influencia;
      uniformsVelos.uCursor.value.set(ptr.sx * 0.5 * uniformsVelos.uAspect.value, ptr.sy * 0.5);

      pivote.rotation.y = MathUtils.lerp(pivote.rotation.y, ptr.sx * INCLINA_Y * ptr.influencia * inclina, k);
      pivote.rotation.x = MathUtils.lerp(pivote.rotation.x, -ptr.sy * INCLINA_X * ptr.influencia * inclina, k);

      // Con la boca abierta la cámara apunta hacia la boca
      const c = caja.centro;
      const fx = focoBoca.x * o;
      const fy = focoBoca.y * o;
      const d = distancia;
      camara.position.set(c.x + fx, c.y + fy, c.z + d);
      camara.lookAt(c.x + fx, c.y + fy, c.z);

      renderer.render(escena, camara);

      if (primerCuadro) {
        primerCuadro = false;
        figura.dataset.nivel = nivel;
        canvas.classList.add("is-listo");
        figura.classList.add("is-3d");
        cambiarEstado("animado");
        medicion = { inicio: ahora + CALENTAMIENTO_MS, cuadros: 0 };
      } else if (medicion.inicio && ahora >= medicion.inicio) {
        medicion.cuadros++;
        if (ahora - medicion.inicio >= SEGUNDOS_MEDICION_FPS * 1000) {
          const fps = medicion.cuadros / ((ahora - medicion.inicio) / 1000);
          medicion.inicio = 0;
          if (fps < FPS_OBJETIVO && calidad > CALIDAD_MIN) {
            // Escalera de calidad: se baja la resolución un escalón y se vuelve a medir
            intentosFps++;
            calidad = Math.max(CALIDAD_MIN, calidad * CALIDAD_ESCALON);
            recalcular = true;
            medicion = { inicio: ahora + 600, cuadros: 0 };
          } else if (fps < umbralFps) {
            // Ya en la resolución mínima y aun así no se llega al umbral: mejor las imágenes que un 3D a tirones
            degradar();
          }
        }
      }
    }

    /* ---- Pausa: hero fuera de pantalla o pestaña oculta ---- */
    let enPantalla = true;
    function actualizarBucle() {
      if (destruido) return;
      const activo = enPantalla && !document.hidden;
      if (activo) {
        ultimo = performance.now();
        // El progreso pudo reiniciarse mientras el hero estaba fuera de pantalla: sin animar el salto
        if (Math.abs(apertura - aperturaSuave) > 0.5) aperturaSuave = apertura;
        renderer.setAnimationLoop(cuadro);
        cambiarEstado(primerCuadro ? "cargando" : "animado");
      } else {
        renderer.setAnimationLoop(null);
        medicion.inicio = 0;
        cambiarEstado("pausado");
      }
    }
    const io = new IntersectionObserver((entradas) => {
      enPantalla = entradas[entradas.length - 1].intersectionRatio >= 0.05;
      actualizarBucle();
    }, { threshold: [0, 0.05, 0.5] });
    io.observe(hero);
    document.addEventListener("visibilitychange", actualizarBucle);
    limpiezas.push(() => { io.disconnect(); document.removeEventListener("visibilitychange", actualizarBucle); });

    actualizarBucle();
  } catch (_) {
    degradar();
  }

  return { destruir, estado: () => estado, sobreModelo: (x, y, holgura) => sobreModelo(x, y, holgura) };
}
