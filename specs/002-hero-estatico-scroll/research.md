# Research — Hero estático rediseñado con transición por scroll

Fase 0 de `/speckit-plan`. Cada punto sigue el formato *Decisión · Motivo · Alternativas*. Las pruebas citadas se hicieron el 2026-10-20 en este equipo (Windows, Chrome y Edge instalados, Python con Pillow 12.3 con WebP/AVIF, Node 24; sin `numpy`).

## R1 — Qué modos del hero existen y cuál se rediseña

**Hallazgo (código actual)**: `index.html` decide en el `<head>` `data-hero="estatico|animado"` (movimiento reducido, ahorro de datos, memoria ≤ 2 GB o ≤ 2 núcleos → `estatico`). `js/principal.js` activa el *bloqueo de introducción* solo con `animado` y el módulo 3D puede degradar a `estatico` en caliente (sin WebGL, modelo fallido, contexto perdido, FPS bajos en ligero). Hoy el CSS mantiene dos disposiciones distintas (`html[data-hero="animado"]` reorganiza la rejilla; el modo base pone eslogan y botón **debajo** de la figura).

**Decisión** (revisada el 2026-10-23, D-20 y D-21): una sola disposición para los dos modos (la del 3D) y **una sola fuente del progreso `--apertura`: el bloqueo de introducción** del 3D, que ahora se aplica también al hero de imágenes (también con «reducir movimiento»):

| Modo | Cuándo | Fuente de `--apertura` | Hero |
|---|---|---|---|
| 3D (`animado`) | equipo capaz | bloqueo de introducción | no anclado; el cráneo estático sigue el progreso mientras el 3D carga |
| Imágenes (`estatico`) | `estatico` decidido en el `<head>` (ahorro de datos, equipo lento, «reducir movimiento»), o 3D que falla o se descarta | bloqueo de introducción | no anclado; fundido del cráneo cerrado al abierto |
| Composición final (excepción) | móvil apaisado bajo o sin JS | constante `1` | no anclado; sin animación |

**Motivo**: reutiliza el CSS de revelado que ya depende de `--apertura` y garantiza que las posiciones coincidan con el 3D (FR-002) por construcción: es el mismo DOM y las mismas reglas de rejilla.

**Decisión derivada (revisada)**: si el 3D falla *después* de arrancar se pasa al modo de imágenes **en caliente**: se añade `data-transicion` y el espaciador del recorrido queda *bajo* el hero, de modo que el escenario (cráneo, cabecera y contacto) no se mueve; la apertura pasa a salir de la posición de scroll. Se verificó con el modelo bloqueado y con la pérdida del contexto WebGL (rectángulos idénticos antes y después). La versión anterior pasaba a la composición final para no añadir recorrido a mitad de sesión; se descartó al decidir que el cambio de pose debe verse siempre.

**Alternativas**: (a) detectar WebGL en el `<head>` con un `canvas` de prueba → descartado: crea un contexto GPU en la ruta crítica y arriesga el LCP en gama baja; (b) mantener dos disposiciones → descartado: nunca coincidirían con precisión.

## R2 — Mecanismo del scroll (revisado: bloqueo de introducción en los dos modos)

**Primera decisión (2026-10-20, descartada)**: `position: sticky` + progreso calculado con la posición de scroll nativo (recorrido de ≈ 80 svh con un espaciador `.hero::after`). Se implementó y verificó, pero en la prueba en móvil real (2026-10-23) la transición pasaba «de golpe» y obligaba a desplazar mucho la página (el recorrido iba ligado a los píxeles de scroll, con la inercia del teléfono).

**Decisión vigente (D-21)**: reutilizar el **bloqueo de introducción** del hero 3D (D-18, constitución principio II) en el hero de imágenes: las primeras acciones de scroll no desplazan la página, avanzan la apertura con velocidad máxima (≥ ≈ 0,8 s el recorrido completo), el eslogan y el botón aparecen con opacidad creciente y, al completarse, el bloqueo se libera. Es el mismo comportamiento que ya se probó en móvil real para el 3D; el cliente lo pidió explícitamente («como en PC»).

**Consecuencias**: se eliminan el anclaje `sticky`, el espaciador, `--recorrido`, `data-transicion` y `controlarTransicionScroll`; el progreso tiene una sola fuente; si el 3D falla, el bloqueo sigue con el mismo progreso (sin saltos). La constitución v2.6.0 amplía la excepción del principio II a los dos modos y quita la condición «no con movimiento reducido, ahorro de datos, equipo lento ni sin 3D».

**Alternativas**: mantener el scroll nativo anclado y alargar el recorrido → descartado: sigue ligado a los píxeles y a la inercia; *scroll-driven animations* de CSS → soporte desigual.

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
| Cráneo cerrado | crítica | `<img>` actual con `fetchpriority="high"` y `preload` |
| Cráneo abierto | diferida | `<picture>` cuyo `<img>` arranca con un GIF de 1 × 1 en `data:` (sin petición) y cuyos `<source>` llevan `media="not all"`; `habilitarImagenAbierta` cambia el `media` de los `<source>` (a `(min-width: 1024px)` y `all`, atributo `data-media`) y el navegador pide la imagen real. Cuándo: tras `load` + inactividad; con ahorro de datos, en el primer desplazamiento; en modo 3D, solo si `--apertura > 0` antes de que el 3D esté listo; ya, si el 3D falla |
| Cráneo abierto (móvil apaisado bajo) | inmediata | `habilitarImagenAbierta(hero, "inmediato")` al pasar a la composición final |

**Motivo**: un único `<img>` sirve a todos los modos sin `lazy` ni `display: none`. Como «reducir movimiento» ya no tiene un camino propio (eager), el LCP de todos los modos es el póster cerrado y la imagen abierta es siempre diferida. El póster cerrado permanece visible hasta que el abierto carga (`data-abierto-listo`), de modo que el área del cráneo nunca queda vacía, ni siquiera cuando el 3D degrada.

**A verificar** (quickstart E6): que cambiar `source.media` dinámicamente hace que Chrome, Firefox y Safari pidan la imagen; si alguno no lo hiciera, se asigna `srcset` desde `principal.js`.

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
