# Verificación — Hero estático con transición por scroll

Registro de resultados (principio IX). Guía: [quickstart.md](quickstart.md). Herramienta: `referencias/herramientas/hero.mjs`.

## Fase 2 · Herramientas y línea base (T005–T008)

**Fecha**: 2026-10-22 · Chrome sin interfaz con SwiftShader (WebGL 2.0), servidor estático propio de `hero.mjs`.

- Opción `captura` de `js/dentadura.js` y `?captura` de `js/principal.js`: funcionan; sin el parámetro el 3D carga como antes (captura normal `linea-base/base-*.png` a 390 × 844 y 1440 × 900: canvas listo, mandíbula abierta con el evento de apertura, eslogan y botón visibles, sin errores).
- Lección de diseño: las medidas del cráneo deben darse respecto al **rectángulo del póster** (contain, proporción 524:564), no respecto a la caja de la figura (que cambia de proporción con la ventana). Además el cráneo acercado desborda el lienzo (por los lados en móvil, por arriba al abrir la boca), así que `capturar()` ensancha y alarga temporalmente el lienzo (misma escala, máscara de difuminado con la altura original) hasta contener el póster con margen.
- Recuadro del cráneo respecto al póster (% del póster), medido en tres ventanas:

| Ventana | Cerrado (izq / arr / ancho × alto) | Abierto (izq / arr / ancho × alto) | Desplazamiento Δ abierto (x, y) |
|---|---|---|---|
| 360 × 740 | −1,3 / 2,8 / 103,3 × 97,6 | −1,2 / −11,4 / 104,3 × 113,5 | 0,84 ; −13,95 |
| 390 × 844 | −0,6 / 2,3 / 102,0 × 98,8 | −0,6 / −12,0 / 103,5 × 113,9 | 0,85 ; −14,05 |
| 1440 × 900 | 0,3 / 1,8 / 100,4 × 100,5 | 0,1 / −12,8 / 102,1 × 114,5 | 0,86 ; −14,17 |

  Las diferencias entre ventanas son ≤ 2,2 puntos porcentuales (perspectiva distinta por proporción de lienzo); cada variante del abierto usa sus propias constantes.
- Codificación (`codificar-craneo.py`, 800 px de ancho de póster): cráneo cerrado 800 × 861 px ≈ 57 KB; abierto escritorio ≈ 47 KB; abierto móvil ≈ 40 KB (todos ≤ 60 KB).

## Fase 3 · US1 — Hero estático cerrado con la posición del 3D (T009–T012)

**Fecha**: 2026-10-22 · `hero.mjs comparar --fase 0` (hero estático con perfil `equipo-lento` frente al 3D con `?captura`; silueta del cráneo ignorando las zonas de difuminado; criterio ≤ 2 % del ancho del rectángulo del póster y cajas de texto a 0 px).

| Tamaño | Desviación máx. de la silueta (% ancho del póster) | Cajas de texto (px) | Resultado |
|---|---|---|---|
| 360 × 740 | 1,71 | 0,00 | OK |
| 390 × 844 | 0,91 | 0,00 | OK |
| 768 × 1024 | 0,72 | 0,00 | OK |
| 1024 × 768 | 0,93 | 0,00 | OK |
| 1440 × 900 | 0,27 | 0,00 | OK |
| 1920 × 1080 | 0,80 | 0,00 | OK |

- **Cráneo cerrado regenerado**: `assets/img/craneo-cerrado.webp` 800 × 861 px, 57 KB (antes 524 × 564, 24 KB; misma proporción 524:564, así que el encuadre del 3D no cambia). Carga crítica ≈ +33 KB. El original queda como copia de seguridad fuera del repositorio.
- **Disposición única** (`css/estilos.css`): rejilla del 3D para todos los modos; `.hero__poster-caja` (rectángulo del póster con unidades de contenedor); `--apertura` por defecto 1 (composición final) y 0 con `data-hero="animado"`/`data-transicion`.
- **Sin desplazamiento horizontal** en los seis tamaños. Con la boca cerrada (`--apertura: 0`): eslogan y botón con opacidad 0; título, contacto y póster con opacidad 1.
- **CLS** de la carga (headless, sin límite de red): ≤ 0,004 en los seis tamaños (la versión anterior daba ≈ 0). Causa de los desplazamientos intermedios: el horario llega por JavaScript (`data-campo`) y la fuente web cambia el ancho de cajas centradas. Se reservó la altura del horario (`min-height: 1.6em`) y se fijó `.hero__revelado` y `.hero__contacto` al ancho de la columna. **No** se fijó `.hero__cabecera` a todo el ancho porque su caja alimenta el difuminado del 3D (cambiaba el modelo).
- **Regresión del 3D** (captura normal frente a `linea-base/`, 1440 × 900 y 390 × 844, fases 0 y 1): las únicas diferencias son los hilos animados de los velos (dependen del tiempo); cráneo, textos y difuminado idénticos.
- Pendiente de esta historia: ver el hero estático cerrado en el navegador con `--apertura: 0` impuesto (se hará al verificar US2).

## Fase 4 · US2 — Transición suave al cráneo abierto (T013–T019)

**Fecha**: 2026-10-22 · Chrome sin interfaz (render por software), perfil `ahorro-datos` (modo `estatico` + `data-transicion`), `hero.mjs comparar` y `hero.mjs transicion`.

- **Imágenes del cráneo abierto** (misma densidad que el cerrado, 800 px de ancho de póster): `craneo-abierto-movil.webp` 828 × 981 px, 48 KB; `craneo-abierto-escritorio.webp` 817 × 986 px, 51 KB (≤ 60 KB). Recuadro (% del póster): móvil −0,62 / −11,96 / 103,47 × 113,90 · escritorio 0,13 / −12,80 / 102,07 × 114,48; Δ (x, y): 0,85 ; −14,05 y 0,86 ; −14,18. Difieren ≤ 1,5 puntos entre variantes (perspectiva distinta por proporción de lienzo), por eso cada variante lleva sus constantes.
- **Posición idéntica al 3D, fase 1** (`comparar --fase 0,1`, seis tamaños): silueta ≤ 0,74 % del ancho del póster (fase 0 ≤ 1,71 %); cajas de texto 0 px.

| Tamaño | Fase 0 (silueta %) | Fase 1 (silueta %) |
|---|---|---|
| 360 × 740 | 1,71 | 0,24 |
| 390 × 844 | 0,91 | 0,00 |
| 768 × 1024 | 0,72 | 0,36 |
| 1024 × 768 | 0,93 | 0,74 |
| 1440 × 900 | 0,27 | 0,14 |
| 1920 × 1080 | 0,80 | 0,70 |

- **Recorrido por scroll** (`transicion`, 0 → 25 → 50 → 75 → 100 → 140 % → 50 → 0 %): `apertura` sigue al scroll; a 50 % póster 0,20 / abierto 0,80 / eslogan 0,67 / botón 0,34; el escenario permanece anclado (`escenarioTop` 0 en móvil, 76 px bajo el encabezado en escritorio) y se desancla tras el recorrido (`--recorrido` = 80 svh); la ida y la vuelta dan los mismos valores (reversible). El botón solo recibe clics con `data-revelado`.
- **Rueda real** (`Input.dispatchMouseEvent`): 200 px de rueda → `scrollY` 200 en todos los tamaños (el scroll nativo no se bloquea).
- **Sin desborde horizontal** y con «Agende su cita» visible y sin tapar en todo el recorrido: 360, 390, 768, 1024, 1440 y 1920 px (0 problemas). A 195 px (zoom 200 % sobre un móvil) hay desborde del documento por el encabezado, los botones y las tarjetas de servicios (fuera del hero; por debajo del mínimo de 360 px de la constitución; anterior a esta feature).
- **Recarga desplazada**: tras recargar al 40 % del recorrido el estado sigue en 0,40. **`#inicio`** con la transición completada: `apertura` 0 y póster 1. **Teclado**: Tab llega a «Conoce nuestros servicios» con `apertura` 0, con opacidad 1, `pointer-events: auto` y alto 53 px.
- **Cuadros** durante un recorrido con gesto real: ≈ 37 fps de media en Chrome sin interfaz con render por software (cifra orientativa, no representa un móvil de gama media; la medición real queda en T031/T032).
- **Punto medio** (revisión visual a 390 × 844 y 1440 × 900): la parte superior del cráneo queda alineada gracias a la traslación compensatoria y solo se mezclan las mandíbulas; se lee como un fundido suave, sin «teletransporte» ni doble perfil de la bóveda. Decisión: no hacen falta fotogramas intermedios.
- **Errores corregidos durante la verificación**: (1) `position: sticky` no anclaba porque el recorrido era un `padding-bottom` (se cambió por el espaciador `.hero::after`); (2) el progreso contaba desde el inicio de la página y tras `#inicio` en móvil quedaba en 0,08 (ahora cuenta desde que el escenario se ancla); (3) `:focus-visible` del botón perdía por especificidad frente a `pointer-events: none`.
- **Pendiente de esta fase**: rotación a mitad de transición y móvil apaisado bajo (T025/T026); el cráneo se ve más pálido en las capturas de depuración por el fondo blanco forzado (no afecta al sitio).

## Fase 5 · US3 — Fondo nítido para PC y móvil (T020–T024)

**Fecha**: 2026-10-22 · `referencias/herramientas/generar-fondo.py` (+ `--medir` con las cajas de `hero.mjs cajas`) y `hero.mjs red`.

- **Decisión camino A / B**: se probó el camino A (ampliar y limpiar la original de 735 × 595 px). Al 100 % los hilos salen blandos y con la textura de bloques de la compresión JPEG en PC (ampliación ×2,6) y claramente dentados en móvil (×3): **no pasa SC-005**. Se adopta el **camino B**: recomposición procedural en el mismo estilo (velos translúcidos sobre blanco, banda oscura lateral que se afila hacia la izquierda, hilos finos que convergen en un punto), con velos suaves a baja resolución y los hilos dibujados a la resolución final con antialiasing (sobremuestreo ×3), usando los colores de los tokens (`--color-velo-fondo`, `--color-velo-1`, `--color-velo-2`, `--color-rayosx`, `--color-superficie`). Cada formato tiene su composición (PC apaisado, móvil vertical). **Aviso para el cliente**: el fondo es una recomposición de su imagen, no la imagen ampliada.
- **Pesos**: `fondo-hero-pc.webp` 1920 × 1080, 32 KB (límite 80 KB); `fondo-hero-movil.webp` 828 × 1792, 22 KB (límite 50 KB). Los bordes superior e inferior (≈ 8 %) terminan en `--color-velo-fondo`; ruido mínimo anti-bandas.
- **Contraste** (`--medir`, fondo real bajo cada caja con el recorte `cover` del escenario; percentil 2 de la luminancia, umbral 4,5 : 1; el botón lleva su propio fondo): en los seis tamaños (360 × 740, 390 × 844, 768 × 1024, 1024 × 768, 1440 × 900, 1920 × 1080) todos los textos cumplen. Mínimos: eslogan 4,98 (p2) / 4,60 (mín.) a 1024 × 768; título ≥ 7,57 (p2); teléfono ≥ 11,5; horario ≥ 5,59.
- **Una sola versión del fondo por dispositivo** (`hero.mjs red`): 1920 × 1080 y 844 × 390 (apaisados) piden `fondo-hero-pc.webp`; 390 × 844 y 768 × 1024 (verticales) piden `fondo-hero-movil.webp`; 0 dominios externos.
- **Revisión visual** (1920 × 1080 y 390 × 844, cerrado y abierto): composición equilibrada, hilos nítidos, textos legibles. En móvil anclado la franja bajo el escenario se funde con el borde inferior del fondo (sin banda visible; al final del anclaje aparece la sección siguiente, como corresponde).
- **Limpieza**: el degradado CSS de velos y los tokens `--velo-1-suave` / `--velo-2-suave` (ya sin uso) se eliminaron; `fondo-hero-estatico.jpg` pasó a `referencias/herramientas/fuentes/` (no se publica).
- **Observación (anterior a esta feature)**: a 1920 × 1080 con el cráneo abierto, el horario del hero se superpone al borde inferior del mentón (misma geometría que el 3D); se mantiene por la exigencia de «misma posición que el 3D».
