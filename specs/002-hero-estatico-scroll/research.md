# Research — Hero estático rediseñado con transición por scroll

Fase 0 de `/speckit-plan`. Cada punto sigue el formato *Decisión · Motivo · Alternativas*. Las pruebas citadas se hicieron el 2026-10-20 en este equipo (Windows, Chrome y Edge instalados, Python con Pillow 12.3 con WebP/AVIF, Node 24; sin `numpy`).

## R1 — Qué modos del hero existen y cuál se rediseña

**Hallazgo (código actual)**: `index.html` decide en el `<head>` `data-hero="estatico|animado"` (movimiento reducido, ahorro de datos, memoria ≤ 2 GB o ≤ 2 núcleos → `estatico`). `js/principal.js` activa el *bloqueo de introducción* solo con `animado` y el módulo 3D puede degradar a `estatico` en caliente (sin WebGL, modelo fallido, contexto perdido, FPS bajos en ligero). Hoy el CSS mantiene dos disposiciones distintas (`html[data-hero="animado"]` reorganiza la rejilla; el modo base pone eslogan y botón **debajo** de la figura).

**Decisión**: una sola disposición para todos los modos (la del 3D) y tres «fuentes» del progreso `--apertura`:

| Modo | Cuándo | Fuente de `--apertura` | Hero |
|---|---|---|---|
| 3D (`animado`) | equipo capaz | bloqueo de introducción (ya existe) | no anclado; el cráneo estático sigue el progreso mientras el 3D carga |
| Estático con transición | `estatico` decidido en el `<head>` y sin movimiento reducido (ahorro de datos, equipo lento) | scroll nativo | **anclado** (`sticky`) durante el recorrido |
| Estático final | movimiento reducido, sin JS, móvil apaisado bajo, **o degradación en caliente del 3D** | constante `1` | no anclado; composición final sin animación |

**Motivo**: reutiliza el CSS de revelado que ya depende de `--apertura` y garantiza que las posiciones coincidan con el 3D (FR-002) por construcción: es el mismo DOM y las mismas reglas de rejilla.

**Decisión derivada (corrige el spec)**: si el 3D falla *después* de arrancar, **no** se reconfigura el hero para anclarlo (añadir recorrido y `sticky` a mitad de sesión desplazaría el contenido de abajo). Pasa a la composición final. Se ajustaron en `spec.md` el escenario 4 de la historia 4, la regla FR-005 y el caso límite correspondiente. Consecuencia: «sin WebGL» no tiene transición por scroll (solo se descubre tras el primer pintado); sí la tienen ahorro de datos y equipos lentos.

**Alternativas**: (a) detectar WebGL en el `<head>` con un `canvas` de prueba → descartado: crea un contexto GPU en la ruta crítica y arriesga el LCP en gama baja; (b) mantener dos disposiciones → descartado: nunca coincidirían con precisión.

## R2 — Mecanismo del scroll

**Decisión**: **`position: sticky` + progreso calculado en JS con suavizado**, y el CSS consume `--apertura` (0–1):

- `html[data-transicion]` (lo escribe el `<head>`) añade al `.hero` un recorrido de scroll `D` (por defecto `80svh`) y fija `.hero__escenario` con `position: sticky` (`top: 0` en móvil; `top: var(--alto-header)` en ≥ 1024 px, donde el encabezado ya es `sticky`).
- `D` no se duplica en JS: `apertura = clamp(scrollY / (hero.offsetHeight − escenario.offsetHeight), 0, 1)`. Como el hero empieza justo debajo del encabezado, `scrollY = 0` ↔ `apertura = 0` también al cargar con ancla o recargar desplazado.
- Un solo `scroll` pasivo que agenda un `requestAnimationFrame`; el valor mostrado se acerca al objetivo con el mismo suavizado exponencial que usa el 3D (`k = 1 − e^(−12·dt)`), de modo que `End`, anclas o inercia no producen saltos.
- Se detiene (sin rAF) cuando el valor mostrado alcanza el objetivo y cuando el hero sale de pantalla (`IntersectionObserver`).

**Motivo**: funciona en todos los navegadores objetivo; no toca el scroll nativo (principio II: el *bloqueo de introducción* no puede usarse en modo estático); el recorrido y el progreso salen de la misma geometría, así que no hay constantes que desincronizar.

**Alternativas**: (a) *scroll-driven animations* de CSS (`animation-timeline`) → soporte desigual hoy y habría que mantener un plan B en JS de todos modos; se deja como mejora futura; (b) reutilizar el bloqueo de introducción → prohibido por la constitución en modo estático; (c) el hero se desplaza normalmente y la imagen cambia durante la salida → el eslogan y el botón se irían antes de leerse.

**Notas de maquetación**: en móvil el encabezado no es fijo (76 px); el escenario se ancla en `top: 0` con **altura constante** (no se redimensiona al anclarse, para no reescalar el cráneo). La franja que queda entre el escenario y la barra fija se rellena con el color de fondo del hero (token `--color-velo-fondo`) y los bordes superior e inferior de las imágenes de fondo deben terminar en ese mismo color (ver R7). Los ancestros del escenario no pueden tener `overflow` distinto de `visible` (comprobar `main` y `body`).

## R3 — Cómo se compone la transición visual

**Hallazgo**: el 3D usa `o = suaviza(clamp(apertura / 0.7))` para abrir la mandíbula y mover la cámara hacia la boca (`focoBoca`), el eslogan aparece entre `0,3` y `0,6` y el botón entre `0,4` y `0,7` (reglas CSS existentes), y el progreso restante (0,7–1) queda como «reposo» con la boca abierta.

**Decisión**: la transición estática usa **las mismas curvas** para que el ritmo sea idéntico al 3D:

- `--t = smoothstep(clamp(apertura / 0.7))` calculado en CSS (`x·x·(3−2x)` con `calc`).
- Imagen del cráneo abierto **debajo** y póster cerrado **encima** con opacidad `1 − t` (fundido).
- **Traslación compensatoria**: entre la pose cerrada y la abierta el 3D desplaza toda la figura porque la cámara baja hacia la boca. Para que no haya «doble perfil» (FR-006) el póster se traslada `t·Δ` y la imagen abierta `−(1 − t)·Δ`, de modo que la parte superior del cráneo coincide en cada instante y solo la mandíbula se funde. `Δ` (en % de la figura) lo calcula la herramienta de captura (R4) a partir de la cámara: `Δ = −foco · alto_px / (2 · distancia · tan(FOV/2))` normalizado al alto de la figura.
- Eslogan y botón: reglas existentes de revelado (`--rev-eslogan`, `--rev-boton`), generalizadas fuera de `html[data-hero="animado"]`.

**Alternativas**: secuencia de fotogramas intermedios (5–8 WebP) → más peso (≈ 150–300 KB) y complejidad; solo se retoma si la revisión visual de SC-003 falla en el punto medio.

## R4 — Cómo se obtiene el cráneo abierto fiel al 3D

**Decisión**: **capturar el propio módulo 3D** con la pose final, en lugar de re-renderizar con otra herramienta.

- Se añade a `iniciar()` en `js/dentadura.js` una opción `captura` (por defecto `false`; sin efecto en producción, ≈ 25 líneas): sin malla de velos, color de fondo blanco opaco, `preserveDrawingBuffer`, y un método `capturar(apertura)` que renderiza ese cuadro y devuelve el PNG del lienzo, el recuadro del cráneo respecto a la figura y `Δ`. Con esto la imagen abierta usa **los mismos shaders, cámara, encuadre y máscara** que el 3D (la máscara depende de las cajas de texto reales de la página).
- Herramienta fuera del sitio, en `referencias/herramientas/` (no se publica: `netlify.toml` ya redirige `/referencias/*` a 404): un script de Node (sin dependencias: Node 24 trae `WebSocket`) que lanza Chrome sin interfaz con CDP, abre `index.html?captura`, fija el tamaño de ventana, llama a `capturar(0)` y `capturar(1)` y guarda los PNG. Un segundo paso en Python (Pillow) recorta y codifica a WebP.
- **Verificado**: Chrome sin interfaz con `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist` devuelve `WebGL 2.0` (prueba del 2026-10-20). Edge sin interfaz no devolvió salida con las mismas opciones: se usa Chrome.
- Mismo recorrido para el cráneo **cerrado**: se regenera con la misma herramienta para que ambas imágenes compartan resolución, encuadre y nitidez (hoy el póster mide 524 × 564 y en escritorio se amplía ≈ 2,1×; el 3D se ve nítido y un salto de nitidez en el relevo se notaría). Se conserva el actual si la regeneración no mejora o supera 60 KB.

**Alternativas**: (a) usar el `craneo-abierto.webp` del zip original → no está en el repositorio y no se sabe con qué cámara se hizo; (b) capturas de pantalla manuales → no reproducibles ni exactas; (c) otro motor de render (Blender) → no usa los shaders del sitio.

## R5 — Variantes del cráneo abierto

**Hallazgo**: el recuadro del cráneo respecto a la **figura** no depende del tamaño de la ventana (la cámara se calibra con el recuadro de la figura, `setViewOffset`), pero el difuminado bajo los textos sí (se calcula con las cajas de la cabecera y del eslogan, y su radio es el 4 % del alto del lienzo). La posición del eslogan respecto a la figura cambia en 1024 px (`padding-top` 10 % → 5 %).

**Decisión**: **dos variantes** del cráneo abierto con el difuminado horneado: `craneo-abierto-movil.webp` (< 1024 px, capturada a 390 × 844) y `craneo-abierto-escritorio.webp` (≥ 1024 px, capturada a 1440 × 900). Ambas comparten recuadro y `Δ`. Se eligen con `<picture>` + `media`. El cráneo cerrado no tiene máscara (con la boca cerrada `uDifumina = 0`), así que es una sola imagen.

**Riesgo conocido**: en ventanas intermedias (por ejemplo 430 × 932 o 1280 × 720) el difuminado no coincide exactamente con las cajas de texto. Mitigación: halo claro de los textos (ya existente) y validación de contraste en 360 × 740, 390 × 844, 768 × 1024, 1024 × 768, 1440 × 900 y 1920 × 1080 (quickstart E3).

## R6 — Carga de imágenes

**Decisión**:

| Imagen | Carga | Cómo |
|---|---|---|
| Fondo (PC / móvil) | crítica | `background-image` con `@media (orientation: portrait)` (vertical) / apaisado; `preload` con el mismo `media`; `background-color` = token de fondo como respaldo |
| Cráneo cerrado | crítica | `<img>` actual con `fetchpriority="high"`; `preload` con `media="(prefers-reduced-motion: no-preference)"` |
| Cráneo abierto | diferida | `<picture>` con `loading="lazy"` oculto con `display: none` hasta que JS lo habilita (los navegadores no piden imágenes `lazy` sin caja); JS lo habilita al quedar libre tras `load`, salvo ahorro de datos, que espera al primer desplazamiento; en modo 3D solo si `--apertura > 0` antes de que el 3D esté listo |
| Cráneo abierto (movimiento reducido / sin JS) | crítica | visible por defecto, `preload` con `media="(prefers-reduced-motion: reduce)"`; el cerrado no se pide |

**Motivo**: cada perfil descarga lo mínimo; el LCP de movimiento reducido es la imagen abierta y el del resto es el cráneo cerrado o el fondo.

**A verificar** (quickstart E6): que Chrome, Firefox y Safari no piden las imágenes ocultas con `display: none` + `loading="lazy"`; si alguno las pidiera, se sustituye por `data-src` asignado desde `principal.js`.

## R7 — Fondo: evaluación de la imagen original y decisión

**Medición (2026-10-20)**: `fondo-hero-estatico.jpg` = 735 × 595 px, 25 KB, JPEG progresivo, apaisada (1,24 : 1).

- **PC (16 : 9)**: recorte a 735 × 413 y ampliación Lanczos a 1920 × 1080 (≈ 2,6×) → 27 KB en WebP calidad 75. Al 100 % se aprecia mosaico de compresión JPEG alrededor de los hilos y las líneas finas pierden definición, pero la composición aguanta.
- **Móvil (9 : 19,5)**: recorte vertical de 274 × 595 px ampliado a 828 × 1792 (≈ 3×) → el resultado es utilizable como composición pero con la misma pérdida de definición; la mitad inferior queda en blanco (útil para el contacto).
- **Contraste**: la banda azul oscura horizontal (≈ 47 % del alto) cae justo detrás de la boca y del eslogan, y su equivalente en móvil detrás del cráneo central. Con la tipografía del sitio los umbrales de luminancia relativa del fondo para 4,5 : 1 son: horario `#5A5A5A` → fondo con L ≥ 0,64; título y eslogan `#0B5252` → L ≥ 0,48; teléfono `#2C2C2C` → L ≥ 0,29. `--color-velo-1` (`#8ED2E4`, L ≈ 0,57) solo sirve para título y eslogan; `--color-velo-2` (`#2F86B7`, L ≈ 0,21) no sirve para ningún texto. La banda oscura original **no cumple** y debe aclararse o moverse fuera de las zonas de texto (FR-011).

**Decisión (camino escalonado)**:

1. **Camino A — ampliar y limpiar** la original (suavizar los bloques JPEG, ampliar, volver a afinar los hilos, añadir un ruido mínimo para evitar bandas, aclarar la banda oscura). Se acepta si pasa SC-005 (revisión a tamaño real y al 200 %).
2. **Camino B — recomposición procedural** en el mismo estilo (velos con degradados suavizados + hilos finos dibujados a la resolución final con antialiasing), con los colores de la paleta del sitio. Es el camino **obligatorio para el móvil** si A no pasa (la composición vertical necesita su propia disposición) y para PC si A no pasa.
3. En ambas versiones los bordes superior e inferior (≈ 8 % del alto) terminan en `--color-velo-fondo` (para fundirse con la franja de la zona anclada en móvil) y la luminancia detrás de cada zona de texto cumple los umbrales anteriores.
4. Tamaños de partida: PC 1920 × 1080, móvil 828 × 1792; WebP; límites 80 KB / 50 KB. Los degradados suaves comprimen muy bien (la prueba de ampliación de PC pesó 27 KB).
5. Un script de Python (Pillow) en `referencias/herramientas/` genera los dos archivos y **mide el contraste** de cada caja de texto sobre el compuesto final, de modo que la verificación sea reproducible.

**Alternativas**: usar la imagen original tal cual con `background-size: cover` → borrosa y con la banda oscura detrás del eslogan; generar el fondo con el shader de velos del 3D → daría coherencia con el relevo al 3D, pero el cliente pidió explícitamente adaptar su imagen. Queda anotado como opción para una spec posterior.

## R6b — Fondo estático frente al fondo del 3D

**Hallazgo**: el hero 3D dibuja sus propios velos procedimentales sobre el fondo (el canvas es opaco). Al relevarse, el fondo cambia de imagen a velos del shader con un fundido de 0,4 s (`.hero__canvas { transition: opacity .4s }`).

**Decisión**: se acepta el fundido existente. **Riesgo abierto**: que el cambio de estilo de fondo en el relevo resulte brusco; se revisa visualmente en el quickstart E7 y, si no es aceptable, se abre una spec para usar la imagen también en el 3D.

## R8 — Verificación de la posición «igual que el 3D»

**Decisión**: script de Node (CDP, sin dependencias) en `referencias/herramientas/` que, para cada tamaño de ventana de referencia, captura (a) el hero estático en la fase 0 y en la fase 1 y (b) el hero 3D con `captura` en las mismas fases, y calcula la **caja envolvente de los píxeles no blancos** del cráneo (umbral sobre la luminosidad) y la desviación de sus bordes en % del ancho de la figura (criterio: ≤ 2 %). Para la cabecera, eslogan, botón y contacto compara `getBoundingClientRect()` entre ambos modos (debe ser idéntico: mismo DOM y mismas reglas).

**Motivo**: el criterio SC-001/SC-002 es medible y repetible sin depender del ojo.

## R9 — Presupuesto estimado

| Concepto | Estimación | Límite |
|---|---|---|
| Carga crítica actual (HTML + CSS + `principal.js` + 4 fuentes + póster, gzip) | ≈ 107 KB | — |
| + fondo PC o móvil (uno) | +27–80 KB | 80 / 50 KB |
| + póster regenerado | +0–35 KB | 60 KB |
| **Carga crítica total** | **≈ 140–230 KB** | **500 KB** |
| Diferida: cráneo abierto (una variante) | ≈ 40–60 KB | 60 KB |
| JS nuevo en `principal.js` (transición + carga diferida) | ≈ +1,2 KB gzip | — |

Los límites generales de la constitución (diferido ≤ 1,5 MB; total escritorio ≈ 2 MB; móvil ≈ 1,5 MB) no se ven afectados: el 3D no se carga en los modos estáticos.

## R10 — Preguntas resueltas de «Technical Context»

Ninguna quedó como «NEEDS CLARIFICATION». Las decisiones que dependen de medir (distancia `D`, calidad del fondo, divergencia del difuminado en ventanas intermedias) se registran como riesgos en `plan.md` y se validan en `quickstart.md`.
