# Research: Rediseño estético general de la landing

Decisiones técnicas de la Fase 0. Cada una: decisión, motivo, alternativas.

## R1. Fondo que cambia de color con el scroll

- **Decisión**: una capa `.fondo-continuo` (`position: fixed; inset: 0; z-index: -1`) y las secciones sin fondo. Un script calcula la «línea de referencia» (`scrollY + 0,5 · alto de ventana`), localiza el tramo entre dos **paradas** y mezcla linealmente los dos colores (en sRGB) con la fracción del tramo. Las paradas son una tabla `{ ancla, fraccion, token }` en el propio `js/principal.js` y los colores se leen con `getComputedStyle(documentElement).getPropertyValue('--azul-…')` (sin literales). Se recalcula en `scroll` (pasivo, con rAF) y en `resize`/`load`, de modo que la posición actual siempre es suficiente (carga ya desplazada, anclas).
- **Paradas** (línea de referencia en el 100 % de la altura de la ancla = su borde inferior):

  | Ancla | Fracción | Color |
  |---|---|---|
  | servicios | 0 | `--azul-50` `#E6F2FF` |
  | servicios | .25 | `--azul-100` `#B8DBFF` |
  | servicios | .50 | `--azul-300` `#5CADFF` |
  | servicios | .75 | `--azul-600` `#0069D1` |
  | servicios | 1 | `--azul-800` `#003B75` |
  | doctor | .12 | `--color-gris` (gris oscuro) |
  | resenas | .90 | `--color-gris` |
  | ubicacion | .15 | `--color-blanco` |

  Antes de «servicios» el color es el primero (el hero es opaco y cubre la capa); tras «ubicación» queda blanco. Las paradas son datos, se ajustan en la verificación visual.
- **Motivo**: es lo que hace phantom.com (el color de la página cambia al desplazarse, no hay cortes por sección), funciona en todos los navegadores (los `animation-timeline: view()` aún no están en todos), y el scroll sigue siendo el nativo.
- **Alternativas**: (a) degradados espaciales entre secciones solo con CSS: más simple y sin JS, pero cada elemento de texto vive sobre un color distinto y no es el efecto pedido; se conserva como **respaldo** sin JS y con «reducir movimiento» (la sección de servicios lleva un degradado estático de arriba abajo y cada sección su color fijo). (b) `animation-timeline: scroll()` en CSS: soporte desigual. (c) GSAP ScrollTrigger: dependencia nueva, ≈ 25 KB, no justificada.

## R2. Texto legible durante la transición

- **Problema**: interpolar el color del texto a la vez que el fondo pasa por grises medios con contraste ≈ 1 : 1.
- **Decisión**: el texto sobre fondo libre usa `--texto` y `--texto-suave`, que el script **conmuta** entre el juego oscuro y el claro cuando la luminancia relativa del fondo cruza el punto de igual contraste con ambos (≈ 0,18). Con texto claro `#FFFFFF` y texto oscuro de luminancia ≤ 0,0013 (≈ `#00050A`, derivado de `#000D1A`) el contraste mínimo en el cruce es 4,52 : 1; con `#000D1A` literal sería 4,43 : 1 y fallaría el criterio. El valor oscuro es un token propio `--color-texto-oscuro`. La conmutación incluye histéresis de ±0,01 de luminancia para que no parpadee al volver sobre el cruce, y una transición de `color` de 120 ms (ninguna con «reducir movimiento»).
- **Texto suave**: se define como el mismo color con mezcla hacia el fondo (`color-mix`) solo en reposo; en el cruce se usa el color pleno para no perder contraste. Se comprueba por muestreo.
- **Motivo**: es la única forma de garantizar ≥ 4,5 : 1 en todo el recorrido sin depender de que no haya texto a la vista durante el cruce.
- **Alternativas**: interpolar también el texto (falla en el cruce); duplicar los textos con `mix-blend-mode: difference` (inestable en color y rendimiento).

## R3. Header translúcido

- **Decisión**: `.encabezado` con fondo oscuro sólido (`--color-header`) desde el inicio. En ≥ 1024 px ya es `position: sticky`; el script alterna `is-desplazado` (scroll > 8 px) y el CSS transiciona `background-color` hacia `--color-header-vidrio` (el oscuro al 60 % de opacidad) y aplica `backdrop-filter: blur(14px) saturate(120%)`. `@supports not (backdrop-filter: blur(1px))` mantiene un oscuro al 94 %. En < 1024 px no hay estado (no es fijo).
- **Motivo**: replica las capturas 2 y 3 (oscuro, difuminado, se adivina el contenido debajo).
- **Alternativas**: header siempre translúcido (ilegible sobre el hero claro); sin blur (el contenido de debajo estorba el texto del menú).

## R4. Logo e íconos SVG

- **Hallazgos**: los 13 SVG son trazados de imagen (Inkscape): dos `<path>` con `fill` azul casi igual (`#0066c2`/`#0763b7`, una capa de trazo y otra de relieve), lienzos distintos (324 × 361 … 799 × 420 px), coordenadas con 5 decimales; pesan 25–190 KB (1,0 MB en total) y mezclan metadatos de edición (`sodipodi`, `inkscape:export-filename`, nombres de archivos del usuario).
- **Decisión**: un script de desarrollo (`normalizar-svg.py`, Python estándar con `re`, sin dependencias) que por archivo: (1) quita metadatos y espacios de nombres de Inkscape; (2) aplica la `transform` del grupo a los puntos (o la conserva en un `<g>`); (3) redondea las coordenadas a 1 decimal en relativo (`c`, `l`, `m`…), quitando los ceros sobrantes; (4) fusiona los dos `<path>` en uno con un solo `fill`; (5) calcula la caja contenedora y centra el dibujo en un `viewBox` cuadrado común de `0 0 96 96` con 6 de margen (los íconos anchos como Ortodoncia y Odontopediatría quedan centrados con aire arriba y abajo; así comparten tamaño visual); (6) escribe el `fill` de la paleta (`#5CADFF` para íconos sobre gris, `#B8DBFF` y `#0052A3` para las dos variantes del logo). Se mide el peso y, si un ícono supera los **30 KB** sin comprimir, se sube el redondeo a 0 decimales en el eje afectado o se simplifica el trazado (Ramer–Douglas–Peucker con tolerancia 0,25 px) hasta cumplir. Meta: cada ícono ≤ 30 KB y el conjunto de los 12 + el logo ≤ 80 KB **comprimidos con gzip**. (La meta de la spec de «15 KB sin comprimir por ícono» se ajusta a 30 KB: el trazado a mano alzada de estos dibujos no cabe en 15 KB sin deformarse; se reporta el dato real.)
- **Publicación**: `<img src="assets/img/iconos/<servicio>.svg" width="96" height="96" alt="" loading="lazy" decoding="async">` en cada tarjeta; el logo del header y del hero con `width`/`height` y sin lazy (críticos). Los originales de `assets/logos/` se mueven fuera de la publicación (`netlify.toml` los bloquea como `/referencias/*`) o se conservan solo en el repositorio.
- **Alternativas**: SVGO por `npx` (dependencia nueva para un solo uso; el script propio basta); `mask-image` con `--color-…` (no admite `loading="lazy"`); convertir a WebP (pierde nitidez y los íconos serían más pesados que el SVG optimizado).

## R5. Tipografía

- **Decisión**: Playfair Display variable (peso 400–700), subset latin, WOFF2, descargada una vez de Google Fonts y guardada en `assets/fonts/playfair-display.woff2`, con la licencia en `LICENSE.txt`. `@font-face` con `font-display: swap` y un `@font-face` de respaldo (`Playfair Fallback`) basado en `local('Georgia')` con `size-adjust`/`ascent-override` calculados para evitar el salto de diseño. Se usa en `h1`, `h2`, `h3` y el nombre de la clínica; Inter se queda en el texto de lectura y Poppins solo en botones y navegación (se evalúa quitar Poppins 600 si no aporta). Preload solo de Playfair (el texto crítico es el `h1` del hero).
- **Motivo**: pedido del cliente. Variable de un solo archivo ≈ 30–40 KB frente a dos estáticos.
- **Alternativas**: Cormorant Garamond (más fina, peor lectura en móvil), Fraunces.

## R6. Botón de cristal del hero

- **Decisión**: `.hero__servicios` con `background: linear-gradient(135deg, rgb(… / .38), rgb(… / .12))` (tokens azules con transparencia), `backdrop-filter: blur(10px) saturate(140%)`, `border: 1px solid` con alfa del blanco, `box-shadow` interior (`inset 0 1px 0 rgb(255 255 255 / .6)`) y un reflejo diagonal con `::before`. Texto en `--azul-900` para ≥ 4,5 : 1 sobre el velo celeste del hero. Respaldo con `@supports not (backdrop-filter)`: fondo `--azul-100` al 70 %. Mantiene `min-height: 44px` y `:focus-visible`.
- **Alternativa**: PNG de textura (peso y no se adapta al fondo).

## R7. Destellos sobre los dientes

- **Problema**: los dientes cambian de posición entre cráneo cerrado y abierto, y en el modo 3D hay inclinación con el cursor.
- **Decisión**: `python referencias/herramientas/puntos-destellos.py` lee la máscara alfa de `craneo-cerrado-dientes.webp`, `craneo-abierto-escritorio-dientes.webp` y `craneo-abierto-movil-dientes.webp`, escoge ≈ 10 puntos repartidos sobre píxeles opacos de los dientes (Poisson-disk, mín. distancia 6 % del ancho, solo el contorno interior 3 px) y los escribe como porcentajes de la caja del póster en un bloque de CSS (`--p1x: 37.2%` …). Cada destello es un `<i>` con `opacity`/`transform: scale()` y retardos distintos (3–7 s); hay dos juegos (cerrado/abierto, con las variantes de escritorio y móvil del abierto) cuya opacidad sigue `--t` igual que las imágenes de los dientes. En el modo 3D las capas siguen visibles porque la pose en los extremos coincide con la de las imágenes; con inclinación de cursor el desplazamiento es de pocos píxeles y el destello es difuso por diseño (radial-gradient de 14–22 px). Con `prefers-reduced-motion` se ocultan.
- **Alternativas**: un `<canvas>` con partículas (CPU/GPU extra), muestrear los dientes en el 3D (acopla el destello al módulo three.js y a su peso).

## R8. Gesto de toque

- **Decisión**: un SVG de mano en línea (≈ 600 B) con tres anillos de onda, dentro de `.hero__efectos`, centrado en la boca del cráneo cerrado. Se muestra con la clase `is-visible` cuando: `apertura < 0,02`, no hay bloqueo liberado, no se ha interactuado (wheel/touch/click/tecla/foco dentro de la figura), el hero está en pantalla y el documento visible, tras 2,5 s de espera. Animación 2,4 s (`transform: translateY/scale` + `opacity`), repetida hasta 3 veces separadas 5 s; la primera interacción la descarta durante toda la visita (variable en memoria, sin `localStorage`). Se desmonta si la mandíbula empieza a abrirse (`dentadura:apertura` > 0,02). Móvil apaisado bajo: no se monta.
- **Alternativas**: Lottie (dependencia), vídeo (peso).

## R9. Estrellas de reseñas

- **Decisión**: `--color-estrella` pasa al dorado nuevo; `text-shadow: 0 0 6px rgb(dorado / .65), 0 0 16px rgb(dorado / .35)`; pulso de `opacity` .85→1 en 3,5 s alternando por tarjeta (`animation-delay`); sin animación con «reducir movimiento».

## R10. Tokens y colores literales

- **Decisión**: se añaden al `:root`: `--azul-50 … --azul-950` (los 11 de la captura), `--color-gris` `#1A1D21`, `--color-gris-claro` `#262B31`, `--color-blanco` `#FFFFFF`, `--color-dorado` `#F5C451`, `--color-texto-oscuro` `#00050A`, `--color-texto-claro` `#FFFFFF` y los semánticos `--color-acento` (`--azul-600` `#0069D1`, blanco sobre él 5,3 : 1), `--color-acento-oscuro` (`--azul-800`), `--color-acento-claro` (`--azul-300`), `--color-header`, `--color-header-vidrio`. Los velos del hero (`--color-velo-*`, `--color-rayosx*`) quedan **idénticos**. Verde de WhatsApp: se mantiene. Los valores con alfa se declaran como tokens con `rgb(r g b / a)` en `:root` (los tokens son la fuente única); fuera de `:root` solo `var(--…)` y `color-mix`.
- **Contraste verificado** (Python, WCAG): `#5CADFF` sobre `#1A1D21` 7,1 : 1; `#0080FF` sobre `#1A1D21` 4,5 : 1 (solo grande); dorado sobre gris 10,4 : 1; blanco sobre gris 16,9 : 1; `#C9D3DE` sobre gris 11,2 : 1.

## R11. Favicon e imagen para compartir

- **Decisión**: `favicon.svg` se regenera con el logo simplificado a 0 decimales sobre un lienzo de 64 y un fondo oscuro redondeado (`--color-gris`), ≤ 6 KB; `assets/og-image.jpg` (1200 × 630) se regenera con Chrome sin interfaz a partir de una página temporal con el logo y el nombre en Playfair sobre el degradado azul → gris. Ambos activos se generan fuera del sitio (no entran en la carga crítica).

## Riesgos

1. El peso de los SVG trazados puede forzar una simplificación que se note; mitigado con tolerancia progresiva y comparación visual.
2. La conmutación de texto en el cruce puede verse «a saltos» si el fondo pasa muy lento por ese tramo; mitigado con transición de `color` de 120 ms y con paradas que no dejen texto libre a la vista en el cruce.
3. `backdrop-filter` en móviles de gama baja: solo se usa en el header (PC) y en un botón; si baja de 30 fps, se retira en el botón.
