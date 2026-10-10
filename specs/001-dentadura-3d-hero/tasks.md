---

description: "Lista de tareas — Dentadura 3D interactiva en el hero"
---

# Tasks: Dentadura 3D interactiva en el hero

**Input**: Documentos de diseño en `/specs/001-dentadura-3d-hero/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/hero-dentadura.md](contracts/hero-dentadura.md), [quickstart.md](quickstart.md)

**Tests**: no se solicitaron pruebas automatizadas (el proyecto no tiene build ni framework de pruebas, principio IV). La verificación se hace con los escenarios E1–E9 de [quickstart.md](quickstart.md); cada historia indica cuáles aplican.

**Organization**: tareas agrupadas por historia de usuario. Rutas relativas a la raíz del repositorio.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia a la que pertenece (US1–US5)

## Path Conventions

Sitio estático plano: `index.html`, `css/estilos.css`, `js/`, `assets/` (ver "Project Structure" en plan.md). No hay `src/` ni `tests/`.

---

## Phase 1: Setup (activos y estructura)

**Purpose**: dejar en el repositorio los activos locales que exigen la constitución y la spec (nada de terceros en tiempo de ejecución).

- [ ] T001 [P] Generar el bundle de three.js una sola vez: en un directorio temporal fuera del repo, `npm pack three@0.186.1`, extraer, y con `esbuild --bundle --minify --format=esm` (entrada: `WebGLRenderer, Scene, PerspectiveCamera, ShaderMaterial, Mesh, Group, Vector2, Vector3, Color, MathUtils, BackSide` de `build/three.module.js`, `GLTFLoader` de `examples/jsm/loaders/GLTFLoader.js` y `MeshoptDecoder` de `examples/jsm/libs/meshopt_decoder.module.js`; redirigir `three` a `build/three.module.js` y asegurar que resuelva `SkeletonUtils.js`) escribir `assets/js/vendor/three-dentadura.min.js`; añadir `assets/js/vendor/LICENSE-three.txt` (MIT, copiado del paquete) y `assets/js/vendor/README.md` con la versión (0.186.1), el archivo de entrada completo y el comando exacto para regenerarlo. Medido en investigación: ≈ 933 KB crudos / 139 KB brotli (límite del diferido: 1,5 MB).
- [ ] T002 [P] Descargar Poppins 600 y 700 e Inter 400 y 500 en WOFF2 (subconjunto `latin` + `latin-ext` con á é í ó ú ü ñ ¿ ¡ « » — –) a `assets/fonts/` con nombres `poppins-600.woff2`, `poppins-700.woff2`, `inter-400.woff2`, `inter-500.woff2`; añadir `assets/fonts/LICENSE.txt` (SIL OFL 1.1 de ambas familias). Peso total objetivo ≈ 60–80 KB.
- [ ] T003 [P] Crear `assets/models/README.md` documentando la autoría original de `diente.glb` y `diente-ligero.glb` (geometría original, sin licencias de terceros), su jerarquía `dentadura › maxilar | mandibula`, que el material `KHR_materials_unlit` se sustituye por shaders, y el peso/triángulos de cada versión (179 KB / 53 KB; ≤ 50 000 / ≈ 15 000 tris). Pedir al cliente/autor los datos de autoría que falten; no inventarlos.
- [ ] T004 [P] Evitar la publicación de archivos de desarrollo: crear `netlify.toml` en la raíz con redirecciones `status = 404, force = true` para `/referencias/*`, `/specs/*`, `/.specify/*`, `/.claude/*` y `/SPEC.md`. Si el despliegue usa Cloudflare Pages, documentar el equivalente en un comentario del mismo archivo.

---

## Phase 2: Foundational (bloquea todas las historias)

**Purpose**: hero sin slider, con póster como LCP, fuentes autoalojadas y la lógica de nivel; sin esto ninguna historia puede probarse.

**⚠️ CRITICAL**: ninguna historia empieza hasta terminar esta fase.

- [ ] T005 Autoalojar fuentes en `css/estilos.css` y `index.html`: añadir cuatro `@font-face` (Poppins 600/700, Inter 400/500, `font-display: swap`, `src: url('../assets/fonts/….woff2') format('woff2')`) antes de `:root`; eliminar de `index.html` los tres `<link>` a `fonts.googleapis.com`/`fonts.gstatic.com` (líneas del `preconnect` y la hoja de Google Fonts); añadir `<link rel="preload" as="font" type="font/woff2" crossorigin href="assets/fonts/poppins-700.woff2">` y el equivalente para `inter-400.woff2`. Depende de T002.
- [ ] T006 En `<head>` de `index.html`: eliminar `<link rel="preload" as="image" href="assets/img/hero-1.jpg">`; añadir `<link rel="preload" as="image" href="assets/img/diente-poster.webp" fetchpriority="high">`; añadir un script en línea mínimo (≤ ~300 bytes, antes de la hoja de estilos) que fije `document.documentElement.dataset.hero` a `'estatico'` si `matchMedia('(prefers-reduced-motion: reduce)').matches`, o `navigator.connection && navigator.connection.saveData`, o `navigator.deviceMemory <= 2`, o `navigator.hardwareConcurrency <= 2`; en otro caso a `'animado'` (cada API con comprobación de existencia, principio VI). Ver research R3/R4.
- [ ] T007 Reestructurar el hero en `index.html` según [contracts/hero-dentadura.md](contracts/hero-dentadura.md) §1: eliminar `#heroSlider`, las tres `img.hero__slide`, `.hero__overlay` y `#heroPuntos`; crear `.hero__escenario` con `.hero__cabecera` (logo 64×64 + `<h1>` con el texto actual, único `<h1>`), `.hero__figura` con `<img class="hero__poster" src="assets/img/diente-poster.webp" alt="" width="583" height="713" fetchpriority="high">`, `.hero__revelado` (`<p class="hero__eslogan">La confianza en tu sonrisa comienza aquí</p>` + `<a class="boton boton--acento hero__servicios" href="#servicios">Servicios</a>`) y `.hero__contacto` (botón «Agende su cita» con `data-campo="whatsapp-href"`, teléfono con `data-campo="telefono-href"`/`telefono-display`, `<p class="hero__horario" data-campo="horario-resumen">`). Conservar todos los `data-campo` y `id="inicio"`. Mantener `<h1>` en el DOM (RF-11).
- [ ] T008 Reescribir la sección «5. Hero» de `css/estilos.css` (modo base = estático): quitar `.hero__slider`, `.hero__slide`, `.hero__overlay`, `.hero__puntos`, `.hero__punto`; `.hero` con `background: var(--color-superficie)`, `color: var(--color-texto)`; `.hero__escenario` en columna centrada con `min-height: 100svh`; `.hero__figura` con `aspect-ratio: 583 / 713`, ancho `min(100%, 22rem)` (ajustar para que quepa a 360 px, FR-008), `.hero__poster` al 100 %; `.hero__titulo` en `var(--color-acento-oscuro)`, `.hero__eslogan` en `var(--color-acento-oscuro)`; `.hero__telefono` y `.hero__horario` con `var(--color-texto)`/`var(--color-texto-suave)`; sin ningún color literal (principio I). Eslogan y «Servicios» visibles en este modo. Depende de T007.
- [ ] T009 [P] Tokenizar los colores literales que quedan fuera de `:root` en `css/estilos.css` (principio I, deuda previa): `.boton--fantasma:hover` (`rgba(15,110,110,.08)`), `.resenas__estrellas` (`#E8A93A`) y `box-shadow` de `.barra-fija` (`rgba(0,0,0,.12)`) → crear los tokens necesarios en `:root` (p. ej. `--color-acento-suave`, `--color-estrella`, `--sombra-barra`) y usarlos. Verificar con `grep` que no queda `rgba(`/`#hex` fuera de `:root`. Los literales del hero ya se eliminan en T008.
- [ ] T010 En `js/principal.js`: eliminar la función `iniciarSliderHero` y su llamada; actualizar el comentario de cabecera ("Sin dependencias externas" → script base; el 3D va en `js/dentadura.js`); añadir `iniciarDentadura()` que, si `document.documentElement.dataset.hero === 'animado'`, programa con `requestIdleCallback` (respaldo `setTimeout(…, 200)`) `import('./dentadura.js')` y llama a su `iniciar({ hero, figura, nivel, rutaModelo })`; decidir aquí `nivel` y `rutaModelo` (research R3): `'ligero'` con `assets/models/diente-ligero.glb` si `matchMedia('(pointer: coarse)').matches && innerWidth < 768`, `'completo'` con `assets/models/diente.glb` en otro caso (cada API con comprobación de existencia, principio VI); constantes con nombre al inicio del archivo para los umbrales de equipo lento (memoria, núcleos, fps) de modo que se calibren en T042; capturar el rechazo del `import()` y dejar `data-hero="estatico"`. Depende de T006.
- [ ] T011 Borrar `assets/img/hero-1.jpg`, `hero-2.jpg`, `hero-3.jpg` (D-15) y comprobar con `grep -rn "hero-[123]" index.html css js` que no quedan referencias.
- [ ] T012 Crear el esqueleto de `js/dentadura.js` (módulo ES sin efectos al importarse): `export async function iniciar({ hero, figura, nivel, rutaModelo })` que devuelve `{ destruir(), estado() }`, y emite el evento `dentadura:estado` en `document` (`detail: { estado, nivel }`) con los estados `cargando | animado | pausado | estatico` de [data-model.md](data-model.md). Cualquier error se captura y degrada a `estatico` (fija `data-hero="estatico"`) sin lanzar. Depende de T010.

**Checkpoint**: la página se ve completa en modo estático: fondo blanco, póster como LCP, fuentes locales, 0 peticiones a Google.

---

## Phase 3: User Story 1 — Ver la dentadura al llegar (Priority: P1) 🎯 MVP

**Goal**: dentadura cerrada con contorno `#0F6E6E` y relleno blanco visible de inmediato (póster) y sustituida sin salto por la versión 3D en el mismo encuadre.

**Independent Test**: E1 (primer pintado, LCP, color exacto), E8 (360 px) y E6 (peso y 0 peticiones externas) de [quickstart.md](quickstart.md). Con solo esta historia el hero ya cumple SC-001, SC-005 y SC-006.

### Implementation for User Story 1

- [ ] T013 [US1] En `js/dentadura.js`, cargar la librería con `import` estático de `../assets/js/vendor/three-dentadura.min.js` y el GLB con `GLTFLoader.setMeshoptDecoder(MeshoptDecoder)` desde `rutaModelo`; crear `WebGLRenderer({ antialias: true, alpha: true })` con `setPixelRatio(Math.min(devicePixelRatio, 2))`, crear el `<canvas class="hero__canvas" aria-hidden="true">` dentro de `.hero__figura` y una `PerspectiveCamera(28, …)` como en `referencias/demo-contorno.html`. Si falla (sin WebGL, GLB 404), emitir `estatico`.
- [ ] T014 [US1] En `js/dentadura.js`, sustituir el material `KHR_materials_unlit` de cada malla del GLB: material de **relleno** (`ShaderMaterial` sin iluminación cuyo color viene del uniform `uFill`, leído de `--color-superficie`: **no** escribir `vec4(1.0)` ni ningún color literal en el shader, principio I) y una malla hija de **contorno** con `side: BackSide` desplazada en pantalla a lo largo de la normal («casco invertido», ver demo líneas 83–106); `frustumCulled = false` en ambas; `uThick = LINE_PX / (altoCanvas / 2)` con `LINE_PX = 4.5` (grosor constante en px CSS, 4–5 px, FR-001). Sin texturas, sombreado ni degradados.
- [ ] T015 [US1] En `js/dentadura.js`, leer el color del contorno con `getComputedStyle(document.documentElement).getPropertyValue('--color-acento')` → `Color` del uniform `uColor`, y `--color-superficie` → `uFill` (sin literales `#0F6E6E` ni `#FFFFFF` en JS ni en los shaders, principio I) y mantener `#include <colorspace_fragment>` para que el píxel final sea exactamente `#0F6E6E` (risk R7); comprobarlo en E1 paso 3.
- [ ] T016 [US1] En `js/dentadura.js`, pose y encuadre: obtener `mandibula = escena.getObjectByName('mandibula')` y forzar `rotation.x = 0` (cerrada, FR-003); calcular la distancia de cámara para que la figura quepa **a lo ancho** desde 360 px (`dist = max(5.0, 2.7 / (2·tan(fov/2)·aspect))` como en la demo) y se recalcule en `resize` (ResizeObserver sobre `.hero__figura`, también en rotación y zoom 200 %); calibrar posición/escala para que la dentadura cerrada **coincida con el encuadre del póster** (research R6).
- [ ] T017 [US1] En `js/dentadura.js`, sustitución póster → 3D: tras el primer fotograma renderizado añadir `is-listo` al canvas y `is-3d` a `.hero__figura`, fijar `data-nivel` en `.hero__figura` y emitir `dentadura:estado` `animado`; en `css/estilos.css` (`.hero__canvas`: posición absoluta sobre `.hero__figura`, `opacity: 0`, `touch-action: pan-y`, `pointer-events: none` **siempre**; `.hero__canvas.is-listo { opacity: 1 }` y `.hero__figura.is-3d .hero__poster { opacity: 0 }` para ocultar el póster; `transition` solo de `opacity`) sin cambiar el tamaño de la figura (CLS ≈ 0).
- [ ] T018 [US1] En `js/dentadura.js`, pausa y limpieza (principio VII, FR-016): bucle con `renderer.setAnimationLoop`; `IntersectionObserver` (pausar si < 5 % visible) y `visibilitychange`; `destruir()` que cancela el bucle, desuscribe listeners y llama a `dispose()` de geometrías, materiales y renderer; `webglcontextlost` → `preventDefault()` y estado `estatico`.

**Checkpoint**: la dentadura 3D cerrada reemplaza al póster sin salto y con el color exacto; páginas sin 3D siguen completas.

---

## Phase 4: User Story 2 — Deformarla con el cursor o el toque (Priority: P1)

**Goal**: deformación local suave con el cursor/toque, inclinación hacia el cursor, balanceo en reposo; recuperación al retirar.

**Independent Test**: E2 de [quickstart.md](quickstart.md) (cursor, salida de ventana, toque con scroll vertical operativo).

### Implementation for User Story 2

- [ ] T019 [US2] En `js/dentadura.js`, añadir la función `deformView` de la demo (líneas 73–82) a los vertex shaders de relleno y contorno y los uniforms compartidos `uCursor, uPush, uBulge, uWave, uSigma = 0.55, uTime` (mismos para relleno y contorno para que el contorno acompañe la deformación, FR-005).
- [ ] T020 [US2] En `js/dentadura.js`, entrada del puntero: listeners pasivos `pointermove`/`pointerdown` en `window` que convierten a NDC respecto al canvas; `activo = true` con ratón dentro de la figura y con toque apoyado; `pointerup`/`pointercancel` de tipo no-mouse, `pointerleave` del documento y `blur` ponen `activo = false`; nunca llamar a `preventDefault()` (el scroll vertical nativo no se interrumpe, FR-007).
- [ ] T021 [US2] En `js/dentadura.js`, suavizado y límites en el bucle: `ptr.smooth` por lerp con `k = 1 − exp(−dt·9)`; `intensidad` suavizada de `activo`; `uPush = intensidad·(0.13 + min(velocidad·0.03, 0.12))`, `uBulge = intensidad·0.14`, `uWave = intensidad·0.02` (valores máximos de [data-model.md](data-model.md); no superarlos para que la figura nunca se vea rota); `uCursor` en espacio de cámara.
- [ ] T022 [US2] En `js/dentadura.js`, inclinación y reposo: `pivot.rotation.y` hacia `ptr.smooth.x·0.30·intensidad` y `pivot.rotation.x` hacia `−ptr.smooth.y·0.14·intensidad` (lerp); balanceo en reposo `sin(t·0.5)·0.12` rad en Y (FR-006).
- [ ] T023 [US2] En `css/estilos.css`, asegurar que el canvas **no** captura eventos (`.hero__canvas { pointer-events: none; touch-action: pan-y }`; el puntero se escucha en `window`, T020) y que `.hero__contacto`, la barra fija y el botón flotante quedan por encima con `z-index` y siguen siendo pulsables (contrato §5, FR-014).

**Checkpoint**: US1 + US2 funcionan; el scroll nativo no se afecta.

---

## Phase 5: User Story 3 — Abrir la mandíbula con el scroll (Priority: P1)

**Goal**: la mandíbula se abre hasta ≈ 40° con el scroll del hero y se cierra al volver; progreso 0–1 publicado como `--apertura` y evento.

**Independent Test**: E3 y E7 de [quickstart.md](quickstart.md) (scroll lento/rápido/inercia, fps).

### Implementation for User Story 3

- [ ] T024 [US3] En `css/estilos.css`, recorrido de scroll solo en modo animado: `html[data-hero="animado"] .hero { height: 260svh }` con `.hero__escenario { position: sticky; top: 0; height: 100svh; overflow: hidden }`; en `html[data-hero="estatico"]` el hero queda `height: auto` (flujo normal). Comprobar que la barra fija y el botón flotante no se ven afectados.
- [ ] T025 [US3] En `js/principal.js`, **publicar el progreso de scroll** (no depende del 3D, de modo que el eslogan se pueda revelar aunque el módulo tarde o falle): listener `scroll` pasivo + `requestAnimationFrame` que calcula `progreso = clamp((scrollY − heroTop) / (hero.offsetHeight − innerHeight), 0, 1)` solo con `data-hero="animado"`, escribe `--apertura` (3 decimales) en `#inicio` cuando cambia ≥ 0,0005, dispara `CustomEvent('dentadura:apertura', { detail: { progreso } })` en `document` cuando cambia ≥ 0,005, y fija `data-revelado=""` en `#inicio` al superar 0,45 (lo quita por debajo de 0,40: histéresis). No interceptar el scroll (FR-004; contrato §3).
- [ ] T026 [US3] En `js/dentadura.js`, apertura de la mandíbula: escuchar `dentadura:apertura` (guardar `crudo = detail.progreso`; leer `--apertura` una vez al iniciar); en el bucle `suave += (crudo − suave)·k·0.6`; `angulo = 40° · ease(clamp(suave / 0.7))` aplicado a `mandibula.rotation.x`; `ease(x) = x²(3−2x)` (FR-004).
- [ ] T027 [US3] En `js/dentadura.js`, encuadre abierto (FR-008): con la mandíbula abierta, ajustar `zoom` y el punto de mira como la demo (`zoom = 1 + 0.22·o`, `lookAt` bajando `0.2·o`, con `o = ease(clamp(suave / 0.7))`) de modo que la figura **quepa en alto** dentro del viewport; verificar a 360×640 y 1440×900.

**Checkpoint**: los tres P1 completos (MVP funcional del hero 3D).

---

## Phase 6: User Story 4 — Eslogan y botón «Servicios» al abrirse (Priority: P2)

**Goal**: el eslogan y «Servicios» se revelan sincronizados con `--apertura`; accesibles por teclado; el contacto nunca queda tapado.

**Independent Test**: E4 de [quickstart.md](quickstart.md).

### Implementation for User Story 4

- [ ] T028 [US4] En `css/estilos.css`, revelado por CSS puro con `html[data-hero="animado"] .hero__revelado` (la variable `--apertura` la escribe `principal.js`, T025, así que el revelado funciona aunque el 3D no cargue): `--rev-eslogan: clamp(0, (var(--apertura, 0) − 0.35) / 0.35, 1)` y `--rev-boton: clamp(0, (var(--apertura, 0) − 0.45) / 0.30, 1)`; `.hero__eslogan { opacity: var(--rev-eslogan); transform: translateY(calc((1 − var(--rev-eslogan)) · 18px)) }` y `.hero__servicios` análogo con 14 px; solo `opacity`/`transform` (principio VII); `.hero__revelado { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none }`; `.hero__servicios { pointer-events: none }` por defecto y `#inicio[data-revelado] .hero__servicios, .hero__servicios:focus-visible { pointer-events: auto }` (así el botón invisible no captura toques sobre la dentadura); halo `text-shadow` con `var(--color-superficie)` en el eslogan para contraste ≥ 4,5:1 sobre el contorno (research R5). En `data-hero="estatico"` ambos visibles, sin transform y con `pointer-events: auto`.
- [ ] T029 [US4] En `css/estilos.css`, accesibilidad del botón: `.hero__servicios:focus-visible` fuerza `opacity: 1; transform: none` y outline visible con `var(--color-acento-oscuro)`; no usar `display:none` ni `visibility:hidden` en modo animado (el botón sigue en el orden de tabulación, FR-013); área pulsable ≥ 44×44 px.
- [ ] T030 [US4] En `index.html`/`js/principal.js`, el ancla `#servicios` del botón: confirmar que `href="#servicios"` desplaza a la sección (con el header fijo en escritorio no la tapa — reutilizar `scroll-margin-top` existente o añadirlo) y que, con `prefers-reduced-motion`, el desplazamiento no es animado (T-18 de SPEC.md).
- [ ] T031 [US4] Verificación de contacto (principio II): con el hero en 0 %, 50 % y 100 % de apertura, a 360 px y a 1440 px, comprobar que «Agende su cita», teléfono, barra fija (móvil) y botón flotante (≥ 1024 px) están visibles y no tapados; ajustar `z-index`/espaciado en `css/estilos.css` si algo se solapa.

**Checkpoint**: eslogan/botón sincronizados; contacto intacto.

---

## Phase 7: User Story 5 — Dispositivos modestos y movimiento reducido (Priority: P2)

**Goal**: niveles estático/ligero/completo, degradación segura y cero cambio de píxeles con movimiento reducido.

**Independent Test**: E5 y E7 de [quickstart.md](quickstart.md).

### Implementation for User Story 5

- [ ] T032 [US5] En `js/dentadura.js`, tope de resolución según `nivel` (recibido de T010): `setPixelRatio(Math.min(devicePixelRatio, 2))` en `completo` y `Math.min(devicePixelRatio, 1.5)` en `ligero`; confirmar que `ligero` carga `diente-ligero.glb` y que `renderer.info.render.triangles` ≈ 15 000 (≤ 50 000 en `completo`).
- [ ] T033 [US5] En `js/dentadura.js`, guardia de fluidez: si el promedio de fps de los primeros 3 s es < 24 (umbral como constante con nombre, T010), bajar `setPixelRatio` a 1; si persiste en `ligero`, pasar a `estatico` (póster, `destruir()` y `data-hero="estatico"`).
- [ ] T034 [US5] En `js/dentadura.js` y `js/principal.js`, degradación completa (FR-012): `try/catch` + `onError` del `GLTFLoader`; sin WebGL (`getContext` falla) o `webglcontextlost`; `import()` rechazado; en todos los casos mostrar el póster, fijar `data-hero="estatico"` (el CSS de T028 muestra eslogan y botón) y no dejar el canvas visible.
- [ ] T035 [US5] En `js/principal.js`, escuchar `matchMedia('(prefers-reduced-motion: reduce)')` con `change`: si pasa a `reduce` en ejecución, llamar a `destruir()` y fijar `data-hero="estatico"`. Con `reduce` desde el inicio, el script de `<head>` (T006) ya evita cargar `three-dentadura.min.js` y el GLB (FR-010).
- [ ] T036 [US5] Verificar E5 (reduced-motion: 0 píxeles cambian al mover cursor y hacer scroll —comparar capturas antes/después—, bloqueo del GLB, WebGL desactivado y pérdida de contexto) y E7; registrar resultados en `specs/001-dentadura-3d-hero/verificacion.md` (se crea aquí).

**Checkpoint**: las cinco historias son independientes y funcionan.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: cierre de calidad, documentación y verificación de la constitución.

- [ ] T037 [P] Medir y reportar el peso (principio III, E6): crítica (HTML+CSS+`principal.js`+fuentes+póster) ≤ 500 KB; diferido (`three-dentadura.min.js` + GLB) ≤ 1,5 MB; 0 peticiones a otros dominios; `renderer.info.render.triangles` ≤ 50 000 (completo) / ≈ 15 000 (ligero). Anotar en `specs/001-dentadura-3d-hero/verificacion.md`.
- [ ] T038 [P] Lighthouse móvil (E9): Rendimiento ≥ 90, CLS ≈ 0, LCP < 2,5 s con el póster como elemento LCP, contraste ≥ 4,5:1 y sin regresiones de SEO (único `<h1>`, JSON-LD y Open Graph intactos). Ajustar y repetir si no se cumple.
- [ ] T039 [P] Responsive y teclado (E8, principios VIII/IX): 360, 390, 768, 1024, 1440 px, rotación y zoom 200 %; recorrido completo con Tab con foco visible; sin scroll horizontal.
- [ ] T040 [P] Actualizar `SPEC.md`: §4.2 si hubo ajustes de diseño durante la implementación, §9 (marcar T-21 con el peso real) y §11 con cualquier decisión nueva (p. ej. si se opta por copiar los módulos sin minificar en vez del bundle, o los umbrales de «equipo lento» calibrados).
- [ ] T041 Revisión de la constitución v2.1.0: recorrer los nueve principios con el resultado de T031, T036–T039 y completar la tabla de cumplimiento en `specs/001-dentadura-3d-hero/verificacion.md`; confirmar con `grep` que no hay colores literales fuera de `:root` en `css/` ni en `js/dentadura.js`, y que `assets/js/vendor/` y `assets/fonts/` tienen licencias registradas.
- [ ] T042 Ejecutar de punta a punta [quickstart.md](quickstart.md) en un móvil real con 4G limitada (E1–E9) y anotar dispositivo, fecha y resultado en `verificacion.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias; T001–T004 son independientes entre sí.
- **Foundational (Phase 2)**: depende de Setup (T005 necesita T002). Orden: T006 → T007 → T008; T005 con T002; T009 y T011 en paralelo; T010 tras T006; T012 tras T010. **Bloquea** todas las historias.
- **US1 (Phase 3)**: tras Foundational y T001, T003. Es el MVP.
- **US2 (Phase 4)**: depende de US1 (T013–T018) porque comparte `js/dentadura.js`.
- **US3 (Phase 5)**: T025 (`principal.js`) puede hacerse tras Foundational y es lo que consume US4; T026–T027 dependen de US1 y editan el mismo `js/dentadura.js` (secuenciales).
- **US4 (Phase 6)**: depende de T025 (`--apertura` y `data-revelado`) y de T008; no necesita el módulo 3D.
- **US5 (Phase 7)**: depende de US1 (la decisión de nivel ya está en T010); T032–T035 se verifican con todo integrado.
- **Polish (Phase 8)**: tras las historias deseadas.

### User Story Dependencies

- **US1**: tras Foundational — sin dependencias de otras historias.
- **US2**: sobre el módulo de US1.
- **US3**: sobre el módulo de US1.
- **US4**: necesita T025 de US3 (en modo estático funciona sin él).
- **US5**: sobre el módulo de US1 y la decisión de nivel de Foundational.

### Within Each Story

- Cada historia editando `js/dentadura.js` es **secuencial** (mismo archivo, no [P]); las tareas de `css/estilos.css` también se encadenan entre sí.
- Verificar el checkpoint de la historia antes de pasar a la siguiente.

### Parallel Opportunities

- Setup: T001, T002, T003, T004 a la vez.
- Foundational: T009 y T011 en paralelo con el resto (archivos distintos o líneas independientes de `css/estilos.css`).
- Polish: T037, T038, T039, T040 a la vez.
- US2 y US3 pueden desarrollarse en paralelo solo si se separan en ramas y se integran después (mismo archivo).

---

## Parallel Example: Setup

```bash
Task: "T001 Generar el bundle de three.js en assets/js/vendor/three-dentadura.min.js"
Task: "T002 Descargar fuentes WOFF2 a assets/fonts/"
Task: "T003 Crear assets/models/README.md"
Task: "T004 Crear netlify.toml con 404 forzado para archivos de desarrollo"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 (Setup) y Phase 2 (Foundational): hero estático con póster y fuentes locales — ya es publicable.
2. Phase 3 (US1): la dentadura 3D cerrada sustituye al póster.
3. **PARAR y validar** con E1, E6 y E8.

### Incremental Delivery

1. + US2 (deformación) → validar E2.
2. + US3 (apertura con scroll) → validar E3/E7.
3. + US4 (eslogan y «Servicios») → validar E4. Con US1–US4 el hero cumple el diseño completo.
4. + US5 (niveles y degradación) → validar E5. Es requisito de publicación (principios VI y VIII); no se publica sin ella.
5. Polish (peso, Lighthouse, constitución).

### Notes

- [P] = archivos distintos, sin dependencias; ninguna tarea [P] edita `js/dentadura.js`.
- No usar GSAP/Lenis (Spec 2); no tocar el formulario ni nuevas secciones.
- Commit tras cada tarea o grupo lógico; no publicar si alguna verificación del presupuesto falla.
