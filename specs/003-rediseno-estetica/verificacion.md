# Verificación: Rediseño estético general (spec 003)

Fecha: 2026-10-27. Entorno: panel de vista previa (Chromium) con `python -m http.server`, emulación de 375 × 812 y 1440 × 900. **No se ha probado en móvil real** (principio IX): queda pendiente.

## Resultados medidos

| Escenario | Resultado |
|---|---|
| **E3 · Contraste en todo el recorrido** (`contraste-scroll.js`, paso de 50 px; textos visibles fuera del hero contra su fondo compuesto) | 1440 px: 80 muestras, **0 fallos**, mínimo 4,62 : 1. 375 px: 150 muestras, **0 fallos**, mínimo 4,56 : 1. El mínimo cae en el cruce de grises (el texto conmuta ahí a propósito). |
| **E2 · Continuidad del fondo** (salto de L* entre muestras de 50 px; SC-002 ≤ 8) | 1440 px: máximo **7,9**. 375 px: máximo **3,9**. El fondo termina en `rgb(255,255,255)` al final de la página en ambos tamaños. |
| **E1 · Identidad** | Sin Poppins ni logo «HR» antiguo en el HTML/CSS; sin errores de consola. Barrido de colores literales (`#…`, `rgb(`, `rgba(`, `hsl`) fuera de `:root` en `css/estilos.css`, `js/principal.js` e `index.html`: **ninguno** (SC-003). |
| **E4 · Header** | 1440 px: `is-desplazado` al bajar; fondo oscuro al 76 % con desenfoque; el contenido se adivina debajo (captura revisada). 375 px: oscuro, no fijo. |
| **E5 · Hero** | Botón de cristal visible (modo 3D y de imágenes); destellos azulados sobre los dientes (revisados congelando la animación); el gesto de toque aparece a los ≈ 2,5 s con la mandíbula cerrada y no repite tras interacción. |
| **E6 · Servicios** | 12 `<img>` con el ícono de la tabla; alto uniforme de 64 px en 375 px; texto claro sobre gris. |
| **E7 · Doctor → ubicación** | Gris oscuro hasta reseñas; tarjetas con borde del color del texto; estrellas doradas con brillo; ubicación y pie en blanco. |
| **E8 · Sin JS** | Cargando la página sin `principal.js`: servicios con degradado estático (azul muy claro → oscuro), texto legible, sin `data-fondo`. «Reducir movimiento» no se emuló (el código sigue la misma ruta). |
| **E9 · Peso** (gzip, calculado desde disco) | Carga crítica ≈ **205 KB** escritorio / ≈ **195 KB** móvil (HTML 6,2 + CSS 10,0 + JS 11,2 + Playfair 37,5 + Inter 47,1 + cráneo cerrado 35,5 + dientes 18,1 + fondo + logos 6,8). Íconos (12) **23,2 KB** gz; el mayor pesa 10,3 KB sin comprimir; íconos + logo **26,6 KB** frente al límite de 80 KB. |
| Desplazamiento horizontal | Ninguno a 375 ni a 1440 px. |

## Desviaciones respecto al plan (y por qué)

1. **`--texto-suave` no existe sobre fondo libre.** Un texto atenuado no llega a 4,5 : 1 en el cruce de grises; los párrafos usan el mismo color pleno que los títulos.
2. **Sin transición de `color` en el texto.** Con 120 ms el texto pasaba por grises medios (contraste ≈ 1,9 : 1 en una muestra); la conmutación es instantánea.
3. **Último tramo del fondo** (ajustado a petición del cliente, 2026-10-27): reseñas se mantiene en gris oscuro hasta su final y el paso a blanco ocurre en la ubicación, completándose cuando esta se ve en su mayoría (parada de «ubicación» al 50 %, limitada para alcanzarse con la página al final). Al ser un tramo más corto, el salto de L* llega a ≈ 10 por 50 px en ese tramo (SC-002 pedía ≤ 8; medido a 731 px de ancho, 0 fallos de contraste). Las cifras de E2 de arriba son de antes de este ajuste.
4. **Header translúcido al 76 %** (no al 60 %): con 60 %, sobre fondos claros el texto azul claro bajaba de 4,5 : 1.
5. **Estrellas**: dorado oscuro (`--color-dorado-oscuro`) cuando el fondo es claro; se excluyen de la medición porque son un gráfico decorativo con `aria-label`.
6. **Íconos**: el cliente añadió `blanqueamiento2.svg` (diente con palomita) durante el trabajo; se usa para **Estética dental**, y el diente con pieza separada («Exodoncia.svg») queda sin usar. Cambiarlo es sustituir un archivo y una línea de `index.html`.
7. **Herramienta de contraste** como `.js` para la consola, no `.mjs` con CDP.
8. **Poppins eliminada** (no queda ningún uso): −16 KB.
9. **`assets/logos/` movida a `referencias/logos-originales/`**, que no se publica.

## Enmienda D-24 · Menú desplegable en móvil (2026-10-27)

Verificado a 375 px: el botón «Llamar» ya no está en el header; aparece «Menú» (`aria-expanded` = false/true), el panel muestra las 5 secciones, Escape lo cierra y devuelve el foco al botón, y pulsar «Reseñas» cierra el panel y desplaza a la sección. A 1440 px el botón no se muestra y la navegación sigue en línea. Sin comprobar a mano: foco con Tab dentro del panel y lectores de pantalla.

## Pantalla de presentación (D-25, 2026-10-28)

- **Secuencia**: capturada en 800 × 600 (un diente arriba izquierda y otro abajo derecha → cuadrícula de 4 + 4 → página). Cierre revisado congelando la animación en 375 y 800 px de ancho: las filas se juntan y crecen sobre el logo y el nombre (que se apagan con el cierre).
- **Bloqueo**: con la presentación activa, un `click` sintético en un enlace del menú y un `wheel` salen con `defaultPrevented`, el clic no llega al documento y `--apertura` sigue en 0; los atajos del navegador no se bloquean. Al terminar: 0 elementos `inert`, sin clase `cargando`, el elemento eliminado.
- **Duración** (marca `presentacion-fin`, 1024 px, pestaña visible con 3D listo): **3,27 s** desde el inicio de la navegación. Con el 3D sin responder termina por el tope: 4,5 s + cierre ≈ **5,7 s**.
- **Observado en el panel**: si el panel no se está dibujando no corre `requestAnimationFrame` y el 3D no llega a estar listo; entonces manda el tope de 4,5 s. No es un fallo de la página.
- **Móvil emulado de 375 px**: el 3D no llegó a estar listo en este panel (ni con ni sin presentación), por lo que la presentación acabó por el tope; pendiente comprobar en móvil real.

## Fluidez del 3D en escritorio (2026-10-28)

Pedido del cliente: en algunos navegadores el 3D no iba fluido (en móvil sí). Causa probable: el fondo de velos es un shader por píxel (7 capas con `sin`/`exp`) que se calcula sobre todo el lienzo; en escritorio con pantalla de alta densidad eran hasta ≈ 4–8 Mpx (en móvil, ≈ 0,4–0,7 Mpx), y el 3D solo bajaba de calidad por debajo de 24 fps. Cambios en `js/dentadura.js` y `js/principal.js`:

- **Presupuesto de píxeles** del lienzo (1,8 Mpx completo, 1,0 Mpx ligero): la relación de píxeles baja hasta caber. En móvil no cambia nada.
- **Escalera de calidad**: tras 1 s de calentamiento se miden 2 s; si hay menos de 45 fps la resolución baja un 20 % (mínimo 55 %) y se vuelve a medir; si en el mínimo sigue por debajo de 24 fps se pasa al modo de imágenes.
- **Tope de 60 cuadros por segundo**, para que una pantalla de 120/144 Hz no gaste el doble de GPU.
- **GPU por software** (SwiftShader, llvmpipe…): se pasa directamente al modo de imágenes.
- **Modelo ligero también en escritorio** con 4 núcleos o menos.
- Medido en el panel (que limita `requestAnimationFrame` a ≈ 30 fps): el lienzo de 1231 × 562 pasó a relación 0,8 (0,44 Mpx) tras dos escalones y el 3D siguió funcionando. **No se ha medido en los navegadores donde el cliente lo ve lento**: pendiente.

## Parpadeos al cargar (2026-10-28)

Investigado grabando la carga con `referencias/herramientas/carga-frames.mjs` (Chrome sin interfaz, CDP screencast; 4G emulada y CPU ×4) y con `PerformanceObserver`:

- **Logo que aparecía tarde**: con red lenta el nombre de la clínica se veía ≈ 0,4 s antes que el logo (el `<img>` llegaba después). **Corregido**: `<link rel="preload">` del logo y la animación de la presentación queda en pausa hasta que el logo y Playfair están cargados (máx. 1,2 s; el HTML marca `presentacion--lista` y `principal.js` cuenta los tiempos desde ahí). Tras el cambio logo y nombre entran juntos.
- **Cambio de modo estático a 3D después de la presentación**: si el 3D no está listo a los 4,5 s (red lenta + CPU ×4: ≈ 7 s), la presentación se cierra y el fondo de imágenes se funde con el de velos 3D (≈ 0,7 s). **Sin corregir**: es el tope pensado para no retener la página; subirlo o suavizar el fundido es decisión del cliente.
- **Desplazamiento de diseño (CLS 0,19) en el panel**: era el propio panel cambiando de ancho (985 → 1231 px) al arrancar; no es de la página.
- Sin tareas largas (`longtask`) ni cambios de tipografía visibles en las grabaciones; el cierre y el desvanecimiento de la presentación no mostraron saltos.

## Tres parpadeos del 3D al principio (2026-10-28)

**Causa**: la escalera de calidad añadida el mismo día (fluidez en escritorio) cambiaba el tamaño del lienzo *después* de dibujar el cuadro; redimensionar un lienzo WebGL lo vacía y esa imagen vacía era la que se presentaba: un parpadeo (el cráneo desaparecía un cuadro) por cada escalón. Con escalón de 0,8 y mínimo de 0,55 podían ser tres seguidos en equipos que no llegan a 45 fps.

**Corrección** (`js/dentadura.js`): el cambio de resolución se marca (`recalcular`) y se aplica al inicio del siguiente cuadro, antes de dibujar; el escalón pasa a 0,75 (como mucho 2 escalones) y tras cada uno se espera 0,6 s antes de volver a medir.

**Comprobación** (`carga-frames.mjs`, 1440 × 900, CPU ×4, 14 s, brillo medio de cada fotograma): antes, 2 destellos de un cuadro (≈ 4,3 s y 6,4 s: brillo 167 → 210 → 167, sin cráneo); después, **0 eventos** por encima de 2,2 puntos de brillo.

## Gesto de scroll y modelo en táctil (D-26, 2026-10-28)

- **Gesto**: sustituye al de toque. Ratón → rueda que baja (dos veces) con dos flechas; táctil (`pointer: coarse`) → dedo que desliza hacia arriba con flecha. Placa oscura translúcida detrás para leerse sobre los dientes blancos. Revisado en grabaciones (escritorio 1440 × 900 y táctil 390 × 844). Mismos disparadores que antes (mandíbula cerrada, sin interacción, hasta 3 veces).
- **Error corregido en el camino**: el primer gesto se mostraba *detrás* de la pantalla de presentación y se gastaba un ciclo; ahora espera a que termine.
- **Táctil (ajustado después, mismo día)**: el toque abre/cierra la mandíbula otra vez; la pulsación larga no. Comprobado con emulación táctil y eventos sintéticos: pulsación de 700 ms + clic → la apertura sigue en 0; toque corto → 1; otro toque → 0; el evento `contextmenu` sale con `defaultPrevented`; las imágenes del modelo tienen `pointer-events: none` y `draggable=false`, y `user-select: none`; `role="button"` y `tabindex` presentes. En escritorio no cambia. La inclinación hacia el dedo queda a 0 solo con `pointer: coarse` (revisado en el código; no se ha medido el ángulo).
- Pendiente: probar en móvil real (mantener pulsado el modelo, deslizar).

## Pendiente

- Prueba en **móvil real** (header translúcido, fondo continuo, gesto de toque, destellos sobre el modo 3D).
- Lighthouse móvil y emulación de 4G con CPU ×4 (LCP, CLS, ≥ 30 fps).
- Recorrido por teclado con foco visible sobre cada fondo (`--color-foco` está definido por sección; no se ha recorrido a mano).
- Ajuste fino del aspecto de los destellos del modo 3D tras verlo el cliente.
