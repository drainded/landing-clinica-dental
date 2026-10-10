# Research — Dentadura 3D interactiva en el hero

Fecha: 2026-10-09. Todas las decisiones de "NEEDS CLARIFICATION" del Technical Context quedan resueltas aquí.

## R1. ¿Cómo se vendoriza three.js sin un build en el sitio?

**Hallazgo (medido con `npm pack three@0.186.1`)**: el paquete NO incluye `three.module.min.js` ni `three.core.min.js`; solo trae `build/three.module.js` (663 KB / 131 KB gzip) y `build/three.core.js` (1,46 MB / 286 KB gzip). Con `GLTFLoader` (118 KB / 26 KB gz), `BufferGeometryUtils`, `SkeletonUtils` y `meshopt_decoder.module.js` (29 KB / 8 KB gz) el total sin minificar ronda **~470 KB gzip y ~2,3 MB crudos** de JS a parsear en un móvil de gama media.

**Prueba**: un bundle de una sola vez con esbuild (`WebGLRenderer, Scene, PerspectiveCamera, ShaderMaterial, Mesh, Group, Vector2/3, Color, MathUtils, BackSide` + `GLTFLoader` + `MeshoptDecoder`) da **933 KB crudos / 234 KB gzip / 139 KB brotli**.

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
  5. Pantalla táctil de ancho `< 768 px` (`matchMedia('(pointer: coarse)')` + ancho) → **ligero** (`diente-ligero.glb`, DPR tope 1,5).
  6. En otro caso → **completo** (`diente.glb`, DPR tope 2).
- **Guardia de fluidez**: si durante los primeros 3 s el promedio < 24 fps, bajar DPR a 1; si persiste en el nivel ligero, volver a estático (se muestra el póster y se libera WebGL).
- **Justificación**: el principio VI exige degradación segura cuando una API no existe: cada comprobación usa encadenamiento opcional y el valor por defecto es el nivel completo solo si ninguna señal indica lo contrario. El umbral de memoria/núcleos se calibra en la verificación con un móvil real.

## R4. Progreso de apertura y revelado del eslogan (RF-04 / RF-13)

- **Decisión**: el progreso crudo `0–1` del scroll del hero lo calcula y publica **`js/principal.js`** (script ligero y ya crítico), no el módulo 3D: lo escribe como propiedad CSS `--apertura` en `#inicio`, dispara `CustomEvent('dentadura:apertura', { detail: { progreso } })` en `document` y fija el atributo `data-revelado` en `#inicio` al superar 0,45 (histéresis: se quita por debajo de 0,40). El módulo 3D solo **consume** ese valor: lo suaviza y lo convierte en el ángulo de la mandíbula. El eslogan y el botón «Servicios» se muestran con CSS (`opacity`/`transform` en función de `--apertura`).
- **Por qué en `principal.js`** (hallazgo del análisis U1): si el valor lo escribiera el módulo, mientras este se descarga (o si falla) `--apertura` valdría 0, el eslogan y el botón seguirían ocultos y el usuario recorrería 260svh de scroll sin ver nada. Con `principal.js` como propietario, el revelado funciona aunque el 3D tarde o no cargue; el contenido no depende del 3D (principio VIII).
- **Umbral de revelado**: el eslogan empieza a aparecer en `--apertura ≥ 0,35` y llega a opacidad 1 en `0,70`, cuando la mandíbula completa su apertura (la demo abre en el primer 70 % del recorrido). El botón sigue con un retraso del 10 %.
- **Sin 3D**: `data-hero="estatico"` en `<html>` (script en línea de `<head>` con las reglas 1, 2 y 4 de R3; o fijado después por el módulo si falla) fuerza eslogan y botón visibles, hero sin recorrido y póster fijo.
- **Teclado y toques**: el botón «Servicios» no usa `display:none` ni `visibility:hidden` con el 3D activo; solo `opacity`. Su `pointer-events` es `none` salvo con `data-revelado` o `:focus-visible`, para que el botón invisible no capture toques sobre la dentadura. `:focus-visible` fuerza opacidad 1.
- **Alternativas**: scroll-driven animations de CSS (`animation-timeline: scroll()`) — soporte irregular en móviles de gama baja; descartada como mecanismo principal.

## R5. Composición del hero y recorrido de scroll

- **Decisión**: `.hero` pasa a tener un "recorrido" de `260svh` cuando `data-hero="animado"` (como la demo) con un escenario `position: sticky; top: 0; height: 100svh` que contiene: logo + `<h1>` arriba, dentadura al centro, eslogan + «Servicios» superpuestos al centro (se muestran con la mandíbula abierta) y, abajo, «Agende su cita», teléfono y horario. En `estatico` el recorrido es `auto` (≥ 100svh) y se apilan en flujo normal: póster, eslogan, botones.
- **Cambio de altura sin CLS**: la altura del hero se fija con el atributo `data-hero` del script en línea antes del primer pintado; lo que se desplaza queda bajo el pliegue.
- **Contraste**: texto en `--color-texto` / `--color-acento-oscuro` sobre `--color-superficie`; el eslogan lleva un halo `text-shadow` con `--color-superficie` para mantener 4,5:1 sobre el contorno verde cuando se superpone.
- **Móvil 360×640**: pantalla muy ajustada; la dentadura ocupa el ancho disponible y la mandíbula abierta debe caber en alto (RF-08). Se reduce el logo del hero a 48 px y se usa `clamp()` para el `<h1>`. Se valida en la verificación y, si no cabe, el logo del hero se oculta en `< 400 px` de alto (el header ya tiene logo).

## R6. Póster como LCP y transición póster → 3D

- **Hallazgo**: `assets/img/diente-poster.webp` mide **583 × 713 px**, con alfa, 18 KB.
- **Decisión**: `<img class="hero__poster" src="assets/img/diente-poster.webp" width="583" height="713" fetchpriority="high" alt="">` (decorativa: `alt=""`), con `aspect-ratio` fijo; el `<canvas aria-hidden="true">` se superpone en la misma celda. Cuando el primer fotograma 3D está dibujado, se hace `canvas.classList.add('is-listo')` y el póster se oculta con `opacity` (sin salto de tamaño, mismo encuadre). Se añade `<link rel="preload" as="image" href="assets/img/diente-poster.webp" fetchpriority="high">` y se elimina el preload de `hero-1.jpg`.
- **Encuadre idéntico**: la cámara del 3D se calibra para que la dentadura cerrada coincida con el póster (ancho de la figura = ancho del `<img>`); se verifica por superposición durante la implementación.

## R7. Lectura del color del contorno

- **Decisión**: el módulo lee `getComputedStyle(document.documentElement).getPropertyValue('--color-acento')` y lo pasa a un `THREE.Color`; en el shader, el `colorspace_fragment` de la demo mantiene el color exacto `#0F6E6E` en pantalla. La comprobación de SC-001 compara un píxel del contorno con `#0F6E6E`.
- **Riesgo**: gestión de color de three.js (r152+) puede alterar el valor final; se verifica con captura de pantalla.

## R8. Reduced-motion y la demo

- La demo con `prefers-reduced-motion` abre la mandíbula (`target = 1`). La spec pide **póster cerrado** (FR-010, SC-004). **Decisión**: con reduced-motion no se carga el 3D (nivel estático); no se reutiliza ese comportamiento de la demo.

## R9. Pausa y limpieza

- **Decisión**: `IntersectionObserver` sobre el escenario (pausa si < 5 % visible), `visibilitychange` (pausa en pestaña oculta), `webglcontextlost` → modo estático (+ `preventDefault` para permitir restauración opcional), y `destroy()` que cancela el bucle, retira listeners y llama a `dispose()` de geometrías, materiales y renderer.

## R10. Entrada del puntero y scroll nativo

- **Decisión**: `touch-action: pan-y` en el canvas (la demo ya lo hace) y eventos `pointer*` pasivos en `window`; en táctiles la deformación se activa con `pointerdown`/`pointermove` y se apaga con `pointerup`/`pointercancel`. Nunca se llama a `preventDefault()` en `touchstart/move`.

## R11. Fuentes autoalojadas (D-16)

- **Decisión**: descargar Poppins 600/700 e Inter 400/500 en WOFF2 con subconjunto latino (`latin` + `latin-ext` mínimo para «ñ, á, é, í, ó, ú, ü, ¿, ¡»), a `assets/fonts/`; `@font-face` con `font-display: swap`; `<link rel="preload" as="font" type="font/woff2" crossorigin>` solo para Poppins 700 (el `<h1>`) e Inter 400 (texto base). Peso objetivo ≈ 60–80 KB en total. Licencia OFL registrada en `assets/fonts/LICENSE.txt`.
- **Alternativa**: variable fonts — mayor peso por una sola familia; descartada.

## R12. Estrategia de verificación (sin framework de pruebas en el repositorio)

- El proyecto no tiene build ni dependencias de desarrollo. La verificación es **manual guiada + herramientas ad hoc** (no versionadas): Chrome DevTools (throttling "Fast 4G", CPU 4× slowdown, emulación 360×640 y reduced-motion, panel Rendering), Lighthouse móvil, y, opcionalmente, un script puntual de Playwright para SC-004 (comparación de capturas con reduced-motion). Ver `quickstart.md`.
