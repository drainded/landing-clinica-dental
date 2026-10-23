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

## Fase 6 · US4 — Movimiento reducido, ahorro de datos y fallos (T025–T027)

**Fecha**: 2026-10-22 · `hero.mjs modos` (390 × 844 y 1440 × 900), `hero.mjs red` y `hero.mjs transicion`. Todos los escenarios en OK en ambos tamaños.

- **Movimiento reducido** (perfil `movimiento-reducido`, emulación de `prefers-reduced-motion`): composición final desde el primer pintado (`--apertura` 1, cráneo abierto opacidad 1, póster 0, eslogan y botón 1, botón con `pointer-events: auto`, escenario sin anclaje). Se pide solo la variante del cráneo abierto de ese tamaño (`craneo-abierto-movil` a 390 px, `craneo-abierto-escritorio` a 1440 px), sin `loading="lazy"` y con `fetchpriority="high"`; no se pide `three-dentadura.min.js` ni el `.glb`. **Ningún píxel del escenario cambia** al mover el cursor por el hero ni al hacer scroll y volver (capturas idénticas byte a byte).
- **Reducir movimiento con la página abierta y la transición a medias** (apertura 0,26 y 0,35): pasa a la composición final (`--apertura` 1, sin anclaje) sin recargar.
- **Imagen del cráneo abierto bloqueada** (`*craneo-abierto*`): tras llegar al final del recorrido queda `data-abierto-fallo`, el póster cerrado permanece (opacidad 1), eslogan y botón visibles y pulsables.
- **Modelo 3D bloqueado** (`*.glb`) en un equipo capaz: el hero pasa de `animado` a `estatico` con la composición final; tras cargar el cráneo abierto, póster 0 / abierto 1, sin canvas. **Cabecera, figura y contacto no se mueven** (rectángulos idénticos antes y después).
- **Pérdida del contexto WebGL** (`WEBGL_lose_context`) con el 3D ya mostrado: mismo resultado y mismos rectángulos idénticos.
- **Ahorro de datos**: antes del primer scroll solo se piden el fondo y el cráneo cerrado; el cráneo abierto se pide al empezar a desplazarse (`hero.mjs red --scroll`).
- **Móvil apaisado bajo** (844 × 390): composición final y página normal, sin anclaje (`data-transicion` se retira); el contacto está en la barra fija inferior.
- **Teclado**: Tab llega a «Conoce nuestros servicios» y lo muestra con foco (verificado en la Fase 4; la regla `:focus-visible` gana ahora a `pointer-events: none`).
- **LCP**: Chrome sin interfaz no emitió el evento de LCP; el elemento LCP de cada modo se confirma con Lighthouse en T031.
- **Nota**: en 844 × 390 el botón «Agende su cita» queda bajo el pliegue de la página normal (no se considera «tapado»: es una página con scroll nativo y el contacto sigue en la barra fija).

## Fase 7 · US5 — Relevo del hero estático al 3D (T028–T029)

**Fecha**: 2026-10-22 · `hero.mjs relevo` (red limitada a 80 KB/s para que el 3D tarde en llegar; gesto de rueda largo antes de que cargue), 390 × 844 y 1440 × 900. Todos los escenarios en OK.

- Antes del 3D: póster cerrado visible y eslogan oculto; el cráneo abierto **no** se ha pedido.
- Al abrir con el bloqueo de introducción antes de que cargue el 3D (apertura 0,86–0,88): se pide el cráneo abierto; cuando llega, el cráneo estático sigue la apertura (póster 0, abierto 1, eslogan 1) y no queda el eslogan sobre un cráneo cerrado.
- Al llegar el 3D: póster y abierto pasan a 0 y el canvas queda listo; **cabecera, figura y contacto no se mueven** (rectángulos idénticos antes y después). En 220–230 muestras cada 50 ms ninguna tuvo póster, abierto y canvas a la vez por debajo de 0,5 de opacidad: **sin parpadeo**.
- **Cambio de fondo en el relevo** (riesgo R6b, revisión visual en 1440 × 900): al llegar el 3D, el fondo pasa de la imagen (pálida, hilos finos) a los velos procedimentales del 3D (más saturados) con el fundido de 0,4 s existente. Las posiciones son idénticas y el cambio se lee como un cambio de ambiente, no como un salto. **Decisión pendiente del cliente**: aceptarlo tal cual o abrir una spec para usar la imagen (o sus tonos) también en el 3D.

## Fase 8 · Pesos, carga y Lighthouse (T031)

**Fecha**: 2026-10-22 · pesos con gzip -9 para HTML/CSS/JS (Netlify sirve brotli, algo menor); imágenes y fuentes ya comprimidas. Lighthouse 13 móvil (simulado «4G lenta»), Chrome sin interfaz con render **por software** (SwiftShader), servidor local sin compresión ni caché.

**Imágenes del cráneo recodificadas a calidad 80** para ganar margen de LCP (siguen siendo degradados suaves; sin diferencia visible): `craneo-cerrado.webp` 36 KB, `craneo-abierto-movil.webp` 29 KB, `craneo-abierto-escritorio.webp` 31 KB (límite 60 KB). Posición frente al 3D re-comprobada en 390 × 844 y 1440 × 900: silueta ≤ 0,91 %, cajas 0 px.

| Modo (carga crítica) | Peso | Límite |
|---|---|---|
| 3D o estático con transición, escritorio | ≈ 150 KB | 500 KB |
| 3D o estático con transición, móvil | ≈ 140 KB | 500 KB |
| Movimiento reducido, móvil / escritorio (añade el cráneo abierto con prioridad) | ≈ 170 / 175 KB | 500 KB |

(HTML 6 KB + CSS 7 KB + `principal.js` 10 KB + logo/favicon + fuentes 63 KB + póster 36 KB + fondo 32 o 22 KB.) `principal.js` pasó de 6,7 a 10 KB (gzip). Diferida del 3D: escritorio ≈ 377 KB (three.js 158 KB gzip, ≈ 139 KB con brotli, + `dentadura.js` 10 KB + `craneo.glb` 209 KB), móvil ≈ 242 KB (límite 1,5 MB). Diferida del modo estático: cráneo abierto 29 o 31 KB. Dominios externos: 0 (`hero.mjs red`).

**Lighthouse móvil, modo estático** (bandera `--force-prefers-reduced-motion`, que es la composición final; la imagen LCP es el cráneo abierto): Rendimiento 94 – 97 en cinco ejecuciones; Accesibilidad 100, Prácticas recomendadas 100, SEO 100; LCP 2,4 s; FCP 0,9 – 1,5 s; TBT 50 – 130 ms; CLS 0 – 0,003. La versión anterior (póster sobre degradado) daba 99 en el mismo entorno, con LCP 2,0 s: la diferencia son los bytes extra de la segunda imagen del cráneo y del fondo.

**Lighthouse móvil, modo 3D**: no es evaluable en este entorno. Con WebGL por software el Total Blocking Time (compilar shaders y dibujar en CPU) hace oscilar el resultado entre 35 y 69 **también en la versión anterior** (68, 39 y 38 en tres ejecuciones; la actual 35, 69 y 40): es ruido del entorno, no una regresión. Queda para la prueba en móvil real (T032).

**Comprobación entre navegadores del cambio dinámico de `media` en los `<source>`**: verificada en Chrome (en los modos diferidos la imagen real solo se pide tras `habilitarImagenAbierta`, y al cambiar el `media` se pide). **Pendiente**: Firefox y Safari (no disponibles en este equipo; el comportamiento está definido por la especificación de HTML —cambiar el `media` de un `<source>` vuelve a seleccionar la imagen—). Si alguno no la pidiera, plan B del contrato: asignar `srcset` desde `js/principal.js`. Se incluye en la prueba en móvil real (Safari de iOS).

## Fase 8 · Emulación móvil con toques y cierre (T032 parcial, T033)

**Fecha**: 2026-10-22 · batería final completa tras el último cambio de código (`hero.mjs comparar`, `transicion`, `modos`, `relevo`, `tactil`, `cajas`).

- **Posición idéntica al 3D** (seis tamaños, fases 0 y 1): silueta ≤ 1,71 % (fase 0) y ≤ 0,74 % (fase 1) del ancho del póster; cajas de texto 0 px. **Recorrido por scroll**, **modos** (movimiento reducido, activarlo en vivo, imagen abierta bloqueada, `.glb` bloqueado, pérdida de contexto WebGL) y **relevo al 3D** (red limitada): todos en OK en 390 × 844 y 1440 × 900; sin desborde horizontal ni contacto tapado en los seis tamaños; CLS 0 en los seis tamaños.
- **Emulación móvil con toques reales** (`hero.mjs tactil`, 390 × 844, deviceScaleFactor 2, modelo ligero): en el 3D, el primer gesto abre la mandíbula sin desplazar la página y, con la apertura completa, el siguiente gesto la desplaza (bloqueo de introducción intacto); en el modo estático, el scroll táctil recorre la transición con el hero anclado (scrollY 145 → 870, apertura 0,10 → 1,00). En una ejecución previa, con el hilo principal saturado por el render por software, Chrome desplazó 25 px antes de que el bloqueo cancelara el gesto: es una limitación del entorno, por eso la prueba en móvil real sigue pendiente.
- **Regresión del 3D** (captura normal frente a `linea-base/`, 390 × 844 y 1440 × 900, fases 0 y 1): sin diferencias en cráneo, textos ni difuminado; solo cambian los hilos animados de los velos (dependen del tiempo) y píxeles sueltos de borde.
- **Limpieza**: sin colores literales fuera de `:root` ni en el JS del sitio; sin reglas CSS de la disposición estática antigua; tokens sin uso heredados de antes de esta feature (`--color-overlay`, `--espacio-5`, `--espacio-8`) se dejan como estaban; `/referencias/*` redirige a 404 en `netlify.toml`; todo lo de `assets/img/` lo usa el sitio.

### Revisión de los nueve principios

| # | Principio | Resultado |
|---|---|---|
| I | Identidad y contenido | ✅ colores solo desde tokens (los fondos son activos generados con la paleta); datos del negocio y eslogan sin cambios |
| II | Contacto primero | ✅ scroll nativo en el modo estático (anclaje `sticky`, sin interceptar eventos); «Agende su cita» visible y sin tapar en todo el recorrido; barra fija y botón flotante intactos |
| III | Peso | ✅ crítica ≈ 140–175 KB (límite 500 KB); fondos 32/22 KB; cráneos 29–36 KB; 0 dominios externos; CLS ≈ 0; LCP 2,4 s (simulado, 4G lenta) |
| IV | Dependencias | ✅ ninguna nueva en el sitio; herramientas de desarrollo (Node sin paquetes, Python/Pillow) fuera de la publicación |
| V | Modelo 3D | ✅ el 3D no cambia; imágenes ≤ 60 KB generadas desde el modelo; constitución enmendada a v2.4.0 |
| VI | Adaptación al dispositivo | ✅ cuatro modos con degradación a la composición final; movimiento reducido sin animación |
| VII | Rendimiento en ejecución | ✅ solo `opacity`/`transform`; un `scroll` pasivo con rAF que se detiene al llegar al objetivo o salir de pantalla |
| VIII | Accesibilidad y responsive | ✅ Lighthouse accesibilidad 100; contraste ≥ 4,5 : 1 medido en los seis tamaños; Tab llega al botón; imágenes decorativas; sin desborde en 360–1920 px (a 195 px desborda el documento por el encabezado y las tarjetas, anterior a esta feature) |
| IX | Verificación | ⚠️ **pendiente la prueba en móvil real** (T032): inercia real, barra de direcciones y Safari de iOS / Firefox para el cambio dinámico de `media` en los `<source>` |

## Fase 9 · Ajuste tras la prueba en móvil real: solo dos modos (T034–T037)

**Fecha**: 2026-10-23 · prueba en móvil real (Android, Chrome, `http://192.168.1.69:5173`) hecha por el titular del proyecto: la composición se ve bien (cabecera, cráneo abierto, eslogan, botón, «Agende su cita», teléfono, horario y barra fija inferior), pero **sin el cambio de cráneo cerrado → abierto**: el teléfono tiene «quitar animaciones» activo, que Chrome reporta como `prefers-reduced-motion`, y con la versión anterior eso daba la composición final fija. El cliente necesita ver el cambio de pose siempre.

**Decisión (D-20, constitución v2.5.0)**: solo hay dos modos —3D e imágenes— y el de imágenes lleva siempre la transición por scroll, también con «reducir movimiento». Esa preferencia sigue sin recibir el 3D (ni velos que fluyen ni inclinación con el cursor); la transición avanza solo con el scroll de la persona. Riesgo de accesibilidad aceptado y registrado en spec, plan y constitución.

Resultados (Chrome sin interfaz, `hero.mjs modos` y `hero.mjs transicion --perfil movimiento-reducido`), 390 × 844 y 1440 × 900, todos en OK:
- Movimiento reducido: modo imágenes con el cráneo cerrado, hero anclado (`sticky`) y eslogan/botón ocultos; se pide solo la variante del cráneo abierto de ese tamaño y no se pide three.js ni el `.glb`; mover el cursor no cambia ningún píxel; el scroll lleva `apertura` de 0 a 1 (póster 1 → 0, abierto 0 → 1, eslogan y botón 0 → 1, botón pulsable al final) y vuelve al cerrado al subir.
- Activar «reducir movimiento» con el 3D ya mostrado: pasa al modo imágenes (cráneo cerrado, sin canvas) y la transición por scroll funciona.
- El 3D falla (modelo bloqueado; contexto WebGL perdido): pasa al modo imágenes con el cráneo cerrado, **cabecera, cráneo y contacto no se mueven** (rectángulos idénticos) y el scroll abre al cráneo abierto.
- Imagen del cráneo abierto bloqueada: el póster cerrado se queda y el eslogan y el botón se ven y son pulsables.
- Móvil apaisado bajo (844 × 390): composición final y página normal (única excepción).
- Pendiente: repetir en el móvil real (T038).
