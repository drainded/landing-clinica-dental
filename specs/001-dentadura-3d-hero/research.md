# Research — Cráneo 3D en rayos X sobre velos de luz en el hero

Fecha: 2026-10-09 · revisado 2026-10-12 (D-17: nuevo modelo y fondo de velos; R1, R3, R4, R5, R6, R7, R8 y R10 actualizadas; R13 y R14 nuevas). Todas las decisiones de "NEEDS CLARIFICATION" del Technical Context quedan resueltas aquí.

## R1. ¿Cómo se vendoriza three.js sin un build en el sitio?

**Hallazgo (medido con `npm pack three@0.186.1`)**: el paquete NO incluye `three.module.min.js` ni `three.core.min.js`; solo trae `build/three.module.js` (663 KB / 131 KB gzip) y `build/three.core.js` (1,46 MB / 286 KB gzip). Con `GLTFLoader` (118 KB / 26 KB gz), `BufferGeometryUtils`, `SkeletonUtils` y `meshopt_decoder.module.js` (29 KB / 8 KB gz) el total sin minificar ronda **~470 KB gzip y ~2,3 MB crudos** de JS a parsear en un móvil de gama media.

**Prueba**: un bundle de una sola vez con esbuild (`WebGLRenderer, Scene, PerspectiveCamera, ShaderMaterial, Mesh, Group, Vector2/3, MathUtils, BufferGeometry, BufferAttribute, DoubleSide, CustomBlending, AddEquation, ZeroFactor, SrcColorFactor` + `GLTFLoader` + `MeshoptDecoder`) da ≈ **626 KB crudos / 158 KB gzip / ≈ 139 KB brotli**. El 2026-10-12 se regeneró con esa lista (antes `Color` y `BackSide`, del contorno por casco invertido); mismo peso.

- **Decisión**: vendorizar **un único módulo minificado** `assets/js/vendor/three-dentadura.min.js`, generado una sola vez a partir del paquete npm `three@0.186.1` sin modificar su código, con el comando y la entrada documentados en `assets/js/vendor/README.md` y la licencia MIT copiada en `assets/js/vendor/LICENSE-three.txt`. No hay paso de build en el sitio ni en el despliegue: el artefacto se versiona.
- **Justificación**: cumple el principio IV (descargado en `assets/js/vendor/`, versión y licencia registradas, sin CDN) con ~139 KB brotli en vez de ~370 KB, y menos tiempo de parseo en móvil. Cabe en el presupuesto diferido (≤ 1,5 MB) con holgura.
- **Alternativas**: (a) copiar los módulos sin minificar y usar un `importmap` — más peso y parseo; descartada. (b) `three` completo minificado — no existe oficialmente en 0.186. (c) Renderizador propio en WebGL puro sin three.js — menos peso (~15 KB) pero el GLB meshopt + GLTFLoader + skinning/jerarquía hay que reescribirlos; riesgo y coste altos; descartada para esta feature.
- **Interpretación a confirmar** (ver plan, Complexity Tracking): el principio IV dice "sin build ni frameworks"; el bundle se produce una vez con una herramienta de desarrollo y no forma parte del flujo del sitio. Si se prefiere estrictamente copiar archivos del paquete, la alternativa (a) sigue cumpliendo el presupuesto (≈470 KB gz < 1,5 MB).

## R2. ¿Cómo se carga el módulo sin bloquear el primer pintado?

- **Decisión**: `js/principal.js` (script clásico existente) decide el nivel y, si no es "estático", programa `import('./dentadura.js')` dentro de `requestIdleCallback` (con `setTimeout(…, 200)` como respaldo en Safari). `js/dentadura.js` es un módulo ES propio que importa `../assets/js/vendor/three-dentadura.min.js` y luego busca el GLB.
- **Justificación**: la carga crítica queda en HTML + CSS + `principal.js` + fuentes + póster; todo lo 3D es diferido (principio III).
- **Alternativas**: `<script type="module">` en el HTML con `defer` implícito — arranca la descarga antes de que el navegador esté libre; descartada. `modulepreload` — compite con el LCP; descartada.

## R3. Detección del nivel de calidad

- **Decisión** (en este orden; la primera regla que aplica gana):
  1. `matchMedia('(prefers-reduced-motion: reduce)')` → **estático** (póster).
  2. `navigator.connection?.saveData === true` → **estático**.
  3. Sin WebGL (`canvas.getContext('webgl2'|'webgl')` falla) o pérdida de contexto → **estático**.
  4. `navigator.deviceMemory <= 2` o `navigator.hardwareConcurrency <= 2` (si existen) → **estático**.
  5. Pantalla táctil de ancho `< 768 px` (`matchMedia('(pointer: coarse)')` + ancho) → **ligero** (`craneo-ligero.glb`, DPR tope 1,5, sin antialias).
  6. En otro caso → **completo** (`craneo.glb`, DPR tope 2).
- **Guardia de fluidez**: si durante los primeros 3 s el promedio < 24 fps, bajar DPR a 1; si persiste en el nivel ligero, volver a estático (se muestra el póster y se libera WebGL).
- **Justificación**: el principio VI exige degradación segura cuando una API no existe: cada comprobación usa encadenamiento opcional y el valor por defecto es el nivel completo solo si ninguna señal indica lo contrario. El umbral de memoria/núcleos se calibra en la verificación con un móvil real.

## R4. Progreso de apertura y revelado del eslogan (RF-04 / RF-13)

- **Decisión**: el progreso crudo `0–1` del scroll del hero lo calcula y publica **`js/principal.js`** (script ligero y ya crítico), no el módulo 3D: lo escribe como propiedad CSS `--apertura` en `#inicio`, dispara `CustomEvent('dentadura:apertura', { detail: { progreso } })` en `document` y fija el atributo `data-revelado` en `#inicio` al superar 0,45 (histéresis: se quita por debajo de 0,40). El módulo 3D solo **consume** ese valor: lo suaviza y lo convierte en el ángulo de la mandíbula. El eslogan y el botón «Servicios» se muestran con CSS (`opacity`/`transform` en función de `--apertura`).
- **Por qué en `principal.js`** (hallazgo del análisis U1): si el valor lo escribiera el módulo, mientras este se descarga (o si falla) `--apertura` valdría 0, el eslogan y el botón seguirían ocultos y el usuario recorrería 260svh de scroll sin ver nada. Con `principal.js` como propietario, el revelado funciona aunque el 3D tarde o no cargue; el contenido no depende del 3D (principio VIII).
- **Umbral de revelado**: el eslogan empieza a aparecer en `--apertura ≥ 0,35` y llega a opacidad 1 en `0,70`, cuando la mandíbula completa su apertura (la demo abre en el primer 70–80 % del recorrido). **Revisión 2026-10-12**: la apertura ocupa el 70 % del recorrido; el eslogan se revela entre `--apertura` 0,3 y 0,6 y el botón entre 0,4 y 0,7; `data-revelado` con 0,50 / 0,45 (histéresis). El hero mide `200svh` (R15).
- **Sin 3D**: `data-hero="estatico"` en `<html>` (script en línea de `<head>` con las reglas 1, 2 y 4 de R3; o fijado después por el módulo si falla) fuerza eslogan y botón visibles, hero sin recorrido y póster fijo.
- **Teclado y toques**: el botón «Conoce nuestros servicios» no usa `display:none` ni `visibility:hidden` con el 3D activo; solo `opacity`. Su `pointer-events` es `none` salvo con `data-revelado` o `:focus-visible`, para que el botón invisible no capture toques sobre la dentadura. `:focus-visible` fuerza opacidad 1.
- **Alternativas**: scroll-driven animations de CSS (`animation-timeline: scroll()`) — soporte irregular en móviles de gama baja; descartada como mecanismo principal.

## R5. Composición del hero y recorrido de scroll

- **Decisión**: `.hero` pasa a tener un "recorrido" de `260svh` cuando `data-hero="animado"` (como la demo) con un escenario `position: sticky; top: 0; height: 100svh` que contiene (rejilla de tres filas): logo + `<h1>` arriba, cráneo en la fila central con el eslogan sobre su bóveda y el botón «Conoce nuestros servicios» en el hueco de la boca (se muestran con la mandíbula abierta) y, abajo, «Agende su cita», teléfono y horario. En `estatico` el recorrido es `auto` (≥ 100svh) y se apilan en flujo normal: póster, eslogan, botón, contacto. El escenario mide `100svh − alto de la barra fija` en móvil y `100svh − alto del header` en escritorio (el header de escritorio es fijo).
- **Cambio de altura sin CLS**: la altura del hero se fija con el atributo `data-hero` del script en línea antes del primer pintado; lo que se desplaza queda bajo el pliegue.
- **Contraste**: texto en `--color-texto` / `--color-acento-oscuro` sobre los velos claros; el `<h1>`, el eslogan y el horario llevan un halo `text-shadow` con `--color-superficie` para mantener 4,5:1 sobre las franjas más oscuras de los velos y sobre el hueso translúcido.
- **Móvil 360×640**: pantalla muy ajustada; la dentadura ocupa el ancho disponible y la mandíbula abierta debe caber en alto (RF-08). Se reduce el logo del hero a 48 px y se usa `clamp()` para el `<h1>`. Se valida en la verificación y, si no cabe, el logo del hero se oculta en `< 400 px` de alto (el header ya tiene logo).

## R6. Póster como LCP y transición póster → 3D

- **Hallazgo**: `assets/img/craneo-cerrado.webp` mide **524 × 564 px**, WebP con pérdida **sin alfa** (fondo blanco opaco), 24 KB.
- **Decisión**: `<img class="hero__poster" src="assets/img/craneo-cerrado.webp" width="524" height="564" fetchpriority="high" alt="">` (decorativa: `alt=""`) dentro de `.hero__figura` con `object-fit: contain`. Como el póster es opaco y blanco, se muestra con `mix-blend-mode: multiply`: así deja ver el degradado de velos que hay detrás, igual que el hueso del 3D. El `<canvas aria-hidden="true">` NO está en la misma celda: ocupa **todo el escenario** (`position: absolute; inset: 0; z-index: -1` dentro de un contexto de apilamiento propio), porque dibuja también los velos de fondo. Cuando el primer fotograma 3D está dibujado, se hace `canvas.classList.add('is-listo')` y el póster se oculta con `opacity` (sin salto de tamaño). Se mantiene `<link rel="preload" as="image" href="assets/img/craneo-cerrado.webp" fetchpriority="high">`.
- **Encuadre idéntico**: la cámara se calcula con la caja del modelo cerrado y el recuadro `contain` del póster dentro de `.hero__figura`; `camera.setViewOffset` desplaza la proyección para centrar el cráneo en ese recuadro aunque el canvas sea más grande. Una constante `AJUSTE_ENCUADRE` (0,91) afina la escala; verificado por superposición del póster al 55 % sobre el 3D el 2026-10-12 (desvío de pocos píxeles).
- **Alternativa descartada**: generar el póster desde una captura del propio 3D (garantiza el encuadre exacto, pero obliga a añadir una herramienta de conversión a WebP).
- **`craneo-abierto.webp`** (venía en el zip) no se usa: el respaldo es siempre la pose cerrada (FR-003).

## R7. Lectura de los colores desde los tokens

- **Decisión**: el módulo lee con `getComputedStyle(document.documentElement).getPropertyValue(...)` los tokens `--color-rayosx` (tinte de la radiografía y de los hilos de tinta), `--color-rayosx-luz` (reflejo de borde de los dientes), `--color-superficie` (dientes y luz de los velos), `--color-velo-fondo`, `--color-velo-1` y `--color-velo-2`. Una función propia (`leerColor`) los convierte a componentes sRGB 0–1 (acepta `#rgb`, `#rrggbb` y `rgb()/rgba()`) y los pasa como `uniform vec3`; **no** se usa `THREE.Color`, así que no hay conversión de espacio de color y el píxel final coincide con el token. Si un token es ilegible se lanza y el hero degrada a estático.
- **Sin literales**: ni los shaders ni el JS contienen colores; el degradado de respaldo del CSS usa los mismos tokens (más dos tokens con alfa para los velos: `--velo-1-suave`, `--velo-2-suave`).

## R8. Reduced-motion y la demo

- La demo (`referencias/demo-rayosx.html`) con `prefers-reduced-motion` desactiva el puntero pero no el resto. La spec pide **póster cerrado y fondo quieto** (FR-010, SC-004). **Decisión**: con reduced-motion no se carga el 3D (nivel estático) y el fondo es el degradado CSS; si la preferencia se activa con la página abierta, `js/principal.js` destruye el módulo y pasa a estático.

## R9. Pausa y limpieza

- **Decisión**: `IntersectionObserver` sobre el escenario (pausa si < 5 % visible), `visibilitychange` (pausa en pestaña oculta), `webglcontextlost` → modo estático (+ `preventDefault` para permitir restauración opcional), y `destroy()` que cancela el bucle, retira listeners y llama a `dispose()` de geometrías, materiales y renderer.

## R10. Entrada del puntero y scroll nativo

- **Decisión**: `touch-action: pan-y` y `pointer-events: none` en el canvas y eventos `pointer*` pasivos en `window`; la posición se normaliza respecto al escenario. En táctiles la reacción se activa con `pointerdown`/`pointermove` y se apaga con `pointerup`/`pointercancel`; con ratón se apaga al salir de la ventana. Nunca se llama a `preventDefault()` en `touchstart/move`.

## R11. Fuentes autoalojadas (D-16)

- **Decisión**: descargar Poppins 600/700 e Inter 400/500 en WOFF2 con subconjunto latino (`latin` + `latin-ext` mínimo para «ñ, á, é, í, ó, ú, ü, ¿, ¡»), a `assets/fonts/`; `@font-face` con `font-display: swap`; `<link rel="preload" as="font" type="font/woff2" crossorigin>` solo para Poppins 700 (el `<h1>`) e Inter 400 (texto base). Peso objetivo ≈ 60–80 KB en total. Licencia OFL registrada en `assets/fonts/LICENSE.txt`.
- **Alternativa**: variable fonts — mayor peso por una sola familia; descartada.

## R12. Estrategia de verificación (sin framework de pruebas en el repositorio)

- El proyecto no tiene build ni dependencias de desarrollo. La verificación es **manual guiada + herramientas ad hoc** (no versionadas): Chrome DevTools (throttling "Fast 4G", CPU 4× slowdown, emulación 360×640 y reduced-motion, panel Rendering), Lighthouse móvil, y, opcionalmente, un script puntual de Playwright para SC-004 (comparación de capturas con reduced-motion). Ver `quickstart.md`.

## R13. Fondo de velos de luz (D-17)

- **Decisión**: shader de fragmentos de pantalla completa (un triángulo que cubre el canvas, `renderOrder -1`, sin prueba de profundidad) que compone 5 capas de «velos» y 2 hilos finos. Cada capa es una cinta ondulada (`y = A·sin(kx+φ) + 0,45·A·sin(2,3kx−1,3φ+1,7)`, inclinada) de bordes gaussianos que tiñe el color de fondo hacia `--color-velo-1` o `--color-velo-2`, con un modulador de «pliegue» y un reflejo claro en su borde superior y en el centro de los pliegues; al apilarse, los cruces se acumulan y dan el aspecto de telas entrelazadas. Ruido de ±0,5/255 contra bandas.
- **Cursor**: el cursor suavizado (espacio de pantalla con relación de aspecto) desplaza cada capa con paralaje (coeficientes 0,06–0,50) y curva las cintas con una «lente» gaussiana local; la influencia (0–1) se suaviza al entrar y salir. El reloj de los velos avanza más rápido con la velocidad del cursor (de 0,7 hasta ≈ 2,9×).
- **Mezcla con el cráneo**: el hueso se dibuja después con `CustomBlending` (`src = 0`, `dst = SrcColor`), es decir `fondo × color`, así que los velos se ven a través del hueso. Los dientes (`transparent: true`, `renderOrder 2`) se dibujan encima con su propio shader.
- **Coste**: un fragment shader de 7 capas a resolución completa del canvas (DPR ≤ 2 en escritorio, ≤ 1,5 en móvil); si el promedio de fps de los primeros 3 s es < 24 se baja el DPR a 1 y, en nivel ligero, se vuelve al póster (R3).
- **Alternativas**: imagen de fondo animada con CSS (sin respuesta fina al cursor y más peso); canvas 2D (menos fluido en móvil); `backdrop-filter` (caro). Descartadas.

## R14. Cambio de modelo (D-17)

- El zip del cliente trae `craneo.glb` (209 KB, ≈ 41 000 triángulos), `craneo-ligero.glb` (74 KB, ≈ 12 300), `craneo-cerrado.webp`, `craneo-abierto.webp` y `referencias/demo-rayosx.html`. Jerarquía `craneo-inferior › maxilar (hueso_sup, dientes_sup) | mandibula (hueso_inf, dientes_inf)`; materiales `hueso` y `dientes` (con `KHR_materials_clearcoat`); `hueso_*` con `COLOR_0` (densidad en el canal `r`).
- Los materiales se sustituyen por nombre (`dientes` → shader de dientes; el resto → rayos X). El material de dientes no usa `MeshPhysicalMaterial` ni luces de three.js (el bundle no las exporta): su iluminación (dos luces fijas, hemisferio, brillo especular y reflejo de borde) está en el shader.
- La apertura es `mandibula.rotation.x` de 0° a 30° (valor de la demo; antes 40°). La cámara se acerca hasta un 30 % y apunta al centro de los dientes superiores (algo más abajo) al abrirse; el acercamiento se limita para que la figura abierta quepa en el ancho (pantallas estrechas).
- **Pendiente**: origen y licencia del escaneo (constitución, principio V).

## R15. Cráneo acercado desde el inicio y difuminado bajo los textos (D-17)

- **Petición del cliente (2026-10-12)**: (1) con el scroll se abre la boca y se difumina lo que choca con los textos; (2, revisión) el modelo debe **empezar con el tamaño del último acercamiento**, por lo que se eliminan los acercamientos por tramos; (3) eslogan y botón más juntos y más abajo; (4) reducir el halo de las letras.
- **Escala fija**: el token `--escala-figura` (1,6) escala `.hero__figura` con `transform: scale()`, de modo que el póster (respaldo y carga) y el 3D coinciden: el módulo mide el recuadro ya escalado con `getBoundingClientRect` y ajusta la cámara a él. `mix-blend-mode: multiply` va en la figura (no en la imagen) porque `transform` crea un contexto de apilamiento propio. La figura se recorta por los lados en pantallas estrechas (`overflow: hidden` del escenario).
- **Scroll**: el hero mide `200svh` (escenario fijo). La apertura de la mandíbula ocupa el 70 % del recorrido (`APERTURA_TRAMO`); el eslogan se revela entre `--apertura` 0,3 y 0,6 y el botón entre 0,4 y 0,7; `data-revelado` con 0,50 / 0,45.
- **Scroll largo (2026-10-13)**: para que un gesto largo no se salte la animación, el recorrido vuelve a ser más largo (`200svh`) y el módulo limita la velocidad de la mandíbula (`APERTURA_VEL_MAX` = 1,75 de progreso por segundo, ajustado el 2026-10-17 porque 0,7 se sentía lento): aunque el scroll salte al final, la boca tarda ≥ ~0,4 s en abrirse. No se retiene el scroll (principio II); si el gesto saca el hero de la pantalla, la animación ya no se ve, por eso el recorrido no se acorta más.
- **Difuminado**: dos cajas en píxeles del buffer (cabecera `.hero__cabecera` y `.hero__eslogan`, medidas con `getBoundingClientRect` en cada `medir()`) entran a los shaders de hueso y dientes. La máscara es `1 − smoothstep(0, 4 % del alto, distancia a la caja)`, multiplicada por la apertura (`uDifumina`). El hueso reduce su absorción hasta un 92 % y los dientes su opacidad hasta un 35 % en esa zona (los dientes se siguen viendo). Es un desvanecimiento con borde suave, no un desenfoque gaussiano (más barato en móvil).
- **Halo de las letras**: `text-shadow` reducido a `0 0 .25–.3rem` con `--color-superficie` (antes dos sombras de hasta .8rem).
- **Alternativas descartadas**: saltos discretos con `scroll-snap` (retiene el scroll del usuario); acercamientos por tramos (sustituidos por la escala fija).

## R16. Bloqueo de introducción del hero (D-18, constitución v2.3.0)

- **Petición del cliente (2026-10-13)**: enmendar la constitución para permitir un bloqueo y que los primeros scrolls dejen ver bien la animación. Con el recorrido por posición de scroll (R15) un gesto largo se salta la apertura.
- **Decisión**: el progreso de apertura deja de derivarse de la posición de scroll. Mientras la página está en lo alto y el modo es `animado`, `js/principal.js` intercepta `wheel` (no pasivo), `touchmove` (no pasivo) y las teclas de desplazamiento (Espacio, RePág/AvPág, flechas, Inicio/Fin) y los convierte en `objetivo` (rueda: 0,9 alturas de ventana = 1; toque: 0,6; tecla: 0,35). El progreso real persigue al objetivo con velocidad máxima `BLOQUEO_VELOCIDAD` = 0,5/s (≥ 2 s para abrir del todo, aunque el gesto sea largo); el módulo 3D añade su propio límite (0,7/s). Al llegar a 1 se libera el bloqueo y la página se desplaza con normalidad; ocurre una sola vez por visita.
- **Salidas de emergencia** (no debe atrapar nunca): `Tab` (navegación por teclado), clic en un ancla interna (`a[href^="#"]`), cualquier `scroll` con `pageYOffset > 2` (barra de scroll, buscar en la página, ancla en la URL, extensiones), estado `estatico` (reduced-motion, 3D fallido, pérdida de contexto, fps bajos) y carga con la página ya desplazada (recarga con posición restaurada). Con `prefers-reduced-motion`, ahorro de datos o equipo lento ni siquiera se activa (el modo ya es `estatico`). `Ctrl`+rueda (zoom) y los gestos de varios dedos no se interceptan.
- **Lo que NO hace**: no usa `overflow: hidden` en `<html>`/`<body>` ni un scroll simulado (se bloquean eventos de entrada); no toca el contacto (barra fija, botón flotante y teléfono son independientes del scroll); no afecta a lectores de pantalla (el contenido está en el DOM y Tab libera el bloqueo).
- **Consecuencia de diseño**: la altura del hero ya no necesita recorrido: el escenario mide `100svh − header (móvil) − barra fija` (`--alto-header-movil` 76 px) o `100svh − header` (escritorio), de modo que al cargar se ve completo —incluido el contacto del hero— y el sticky desaparece. Las secciones 4–5 y R15 quedan superadas en lo que dicen del recorrido de scroll.
- **Alternativas descartadas**: `scroll-snap` suave (no impide saltarse la animación); animación temporizada disparada por el primer gesto (pierde el control proporcional); alargar más el recorrido (más scroll hasta el contenido y sigue siendo saltable).
