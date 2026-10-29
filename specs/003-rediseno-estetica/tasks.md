---

description: "Lista de tareas del rediseño estético general (spec 003)"
---

# Tasks: Rediseño estético general de la landing

**Input**: documentos de diseño en `/specs/003-rediseno-estetica/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/interfaz.md](contracts/interfaz.md), [quickstart.md](quickstart.md)

**Tests**: no se piden pruebas automatizadas (principio IV: sin framework); cada historia lleva una tarea de verificación guiada según el quickstart.

**Formato**: `- [ ] T### [P?] [US?] Descripción con ruta`. `[P]` = se puede hacer en paralelo (archivos distintos, sin dependencias pendientes).

## Phase 1: Setup (gobernanza y activos de partida)

- [x] T001 Enmendar la constitución a **v2.7.0** en `.specify/memory/constitution.md`: añadir informe de impacto; principio I (nueva paleta, Playfair, logo «diente HR», tokens nuevos; los tokens del hero no cambian), IV (Playfair Display autoalojada además de Poppins/Inter) y VII (precisión: un `background-color` de una sola capa fija por scroll está permitido); actualizar versión y fecha de enmienda
- [x] T002 Registrar la decisión **D-23** en `SPEC.md` §11 (rediseño estético: paleta, tipografía, logo, íconos, fondo continuo, header translúcido, efectos del hero) con referencia a la spec 003
- [x] T003 [P] Descargar Playfair Display variable (latin, WOFF2) a `assets/fonts/playfair-display.woff2` y añadir su licencia SIL OFL a `assets/fonts/LICENSE.txt` (indicar fecha y origen)
- [x] T004 [P] Crear `referencias/herramientas/normalizar-svg.py` (Python estándar, sin dependencias) según R4 de [research.md](research.md): quita metadatos Inkscape, aplica la `transform`, redondea coordenadas a 1 decimal, une las dos capas en un solo `<path>` con un único `fill`, centra el dibujo en un `viewBox="0 0 96 96"` con margen de 6 y avisa si supera `--max-kb` (30 KB por defecto)
- [x] T005 [P] Crear `referencias/herramientas/puntos-destellos.py` (Pillow) que lee la máscara alfa de `assets/img/craneo-cerrado-dientes.webp`, `craneo-abierto-escritorio-dientes.webp` y `craneo-abierto-movil-dientes.webp`, elige ≈ 10 puntos por pose sobre píxeles opacos (mín. distancia 6 % del ancho, a ≥ 3 px del borde) y los imprime como bloque CSS en % de `.hero__poster-caja`
- [x] T006 [P] Crear `referencias/herramientas/contraste-scroll.js` (se pega en la consola o con `javascript_tool`; sin Node ni CDP): recorre la página con pasos de 50/100 px a un ancho dado, y devuelve el contraste mínimo de cada texto visible contra su fondo real y el salto máximo de luminosidad entre muestras vecinas (SC-001/SC-002)

**Checkpoint**: constitución y SPEC.md actualizadas; fuente y herramientas listas.

## Phase 2: Foundational (bloquea las historias)

**⚠️ CRÍTICO**: ninguna historia empieza sin estos tokens, la fuente y los activos normalizados.

- [x] T007 Sustituir los tokens de color de `:root` en `css/estilos.css` por los de [data-model.md](data-model.md): `--azul-50` … `--azul-950`, `--color-gris` `#1A1D21`, `--color-gris-claro` `#262B31`, `--color-blanco`, `--color-dorado` `#F5C451`, `--color-texto-oscuro` `#00050A`, `--color-texto-claro` `#FFFFFF`, y redefinir `--color-acento` (= `--azul-600`), `--color-acento-oscuro` (= `--azul-800`), `--color-acento-claro` (= `--azul-300`), `--color-header` y `--color-header-vidrio` (`--azul-950` al 60 %), `--color-estrella` (= dorado); **no tocar** `--color-velo-*`, `--color-rayosx*` ni `--color-whatsapp*`; dejar `--color-borde` y `--color-acento-suave` derivados del azul nuevo
- [x] T008 Declarar en `css/estilos.css` los `@font-face` de Playfair Display (`assets/fonts/playfair-display.woff2`, peso 400 700, `font-display: swap`) y su respaldo `Playfair Fallback` (`local('Georgia')` con `size-adjust`/`ascent-override`), definir `--fuente-titulos: 'Playfair Display', 'Playfair Fallback', Georgia, serif` y retirar el `@font-face` de Poppins que deje de usarse; añadir `<link rel="preload" as="font" …playfair-display.woff2>` en `index.html` y quitar el preload de la fuente retirada
- [x] T009 [P] Normalizar el logo con `normalizar-svg.py`: `assets/logos/LOGO CLINICA.svg` → `assets/img/logo-claro.svg` (`--fill` `#B8DBFF`) y `assets/img/logo-oscuro.svg` (`--fill` `#0052A3`); comprobar el reconocimiento a 40 px y 64 px de alto
- [x] T010 [P] Normalizar los 12 íconos con `normalizar-svg.py` a `assets/img/iconos/*.svg` (`--fill` `#5CADFF`) con la asignación servicio → archivo de [data-model.md](data-model.md) (`parodoncia.svg` ← «Cirugía bucal.svg», `exodoncia.svg` ← «Parodoncia.svg», `cirugia-bucal.svg` ← «Estética dental.svg», `estetica.svg` ← «Exodoncia.svg», el resto por nombre); medir el peso de cada uno (≤ 30 KB) y la suma comprimida (≤ 80 KB con el logo); si alguno se pasa, simplificar el trazado (RDP 0,25 px)
- [x] T011 Hoja de contacto temporal (fuera del repositorio o borrada al terminar) con los 13 SVG normalizados sobre gris `#1A1D21` para comparar con los originales y confirmar mismo tamaño visual

**Checkpoint**: la página ya compila con los tokens nuevos; fuente y activos listos para usarse.

## Phase 3: User Story 1 — Identidad: paleta, tipografía y logo (P1) 🎯 MVP

**Objetivo**: toda la página con la paleta, Playfair y el logo nuevos, sin restos del verde azulado ni del «HR» antiguo.

**Prueba independiente**: E1 de [quickstart.md](quickstart.md): recorrer la página; `grep` sin `0F6E6E`, sin colores literales fuera de `:root`, sin el logo antiguo.

- [x] T012 [US1] En `index.html` sustituir el logo del header y del hero: header con `<img src="assets/img/logo-claro.svg" alt="" width="44" height="44">`, hero con `assets/img/logo-oscuro.svg` (`width`/`height` 64) y nombre de la clínica en el header con la clase de título nueva; mantener los `aria-label` del enlace de inicio
- [x] T013 [US1] En `css/estilos.css` aplicar `--fuente-titulos` a `h1`, `h2`, `h3`, `.encabezado__logo` y `.hero__eslogan`; ajustar pesos (400/600/700), `letter-spacing` y tamaños de Playfair; revisar que Poppins/Inter sigan donde corresponde (botones, navegación, texto)
- [x] T014 [US1] En `css/estilos.css` adaptar los colores del hero a la paleta nueva usando solo tokens: `.hero__titulo` y `.hero__eslogan` en `--azul-900`/`--azul-800`, `.hero__horario`, `.hero__telefono`, sombras de texto, bordes del logo; no tocar la composición, `--apertura` ni las imágenes
- [x] T015 [US1] En `css/estilos.css` adaptar botones: `.boton--acento` (fondo `--color-acento`, texto blanco ≥ 4,5 : 1), `.boton--fantasma`, enlace de salto y `:focus-visible` (`--color-foco`); mantener el verde de WhatsApp
- [x] T016 [US1] Hacer una pasada por `css/estilos.css` y `js/` con `grep` de colores literales (`#`, `rgb(`, `rgba(`, `hsl(`) fuera de `:root` y de los tokens del hero, y sustituirlos por tokens (SC-003)
- [x] T017 [P] [US1] Regenerar `favicon.svg` con el logo normalizado a 0 decimales sobre un fondo `--color-gris` redondeado (≤ 6 KB) y comprobar que se reconoce a 16 y 32 px
- [x] T018 [P] [US1] Regenerar `assets/og-image.jpg` (1200 × 630) con Chrome sin interfaz a partir de una página temporal con el logo y el nombre en Playfair sobre degradado azul → gris; peso razonable (≤ 80 KB)
- [x] T019 [US1] Verificar E1 y E9 (parcial) y anotar en `specs/003-rediseno-estetica/verificacion.md`: capturas del header y del hero en 360 y 1440 px, ausencia de restos, CLS al cargar la fuente

**Checkpoint**: la identidad está aplicada; la página ya se puede enseñar al cliente (aún sin fondo continuo).

## Phase 4: User Story 2 — Fondo continuo con el scroll (P1)

**Objetivo**: el fondo cambia de forma suave y continua con el scroll, hero claro → azul muy claro → azules oscuros → gris oscuro → blanco, con texto legible en todo el recorrido.

**Prueba independiente**: E2, E3 y E8: `contraste-scroll.mjs` a 360 y 1440 px, y con «reducir movimiento» y sin JS.

- [x] T020 [US2] Añadir en `index.html` `<div class="fondo-continuo" aria-hidden="true"></div>` justo tras `<body>` y en `css/estilos.css` su regla (`position: fixed; inset: 0; z-index: -1; background-color: var(--fondo, var(--azul-50)); pointer-events: none`), con `body` sin fondo propio cuando `html[data-fondo]`
- [x] T021 [US2] En `css/estilos.css` definir el **respaldo estático** (sin JS / «reducir movimiento»): `--fondo-seccion` y `--texto-seccion` por sección (servicios con degradado vertical `--azul-50` → `--azul-800`, texto oscuro arriba y claro abajo según tramo; doctor/galería/reseñas `--color-gris` con texto claro; ubicación y pie `--color-blanco` con texto oscuro) y un tramo corto de degradado entre secciones contiguas para evitar cortes bruscos
- [x] T022 [US2] En `css/estilos.css` activar el modo continuo con `html[data-fondo="continuo"] section:not(.hero), … .pie { background: transparent; }` y hacer que el texto libre de cada sección use `color: var(--texto)` / `var(--texto-suave)` (títulos, `.seccion__intro`, párrafos de doctor, enlaces, `.pie__*`, `.resenas__ver-todas`) con transición de `color` de 120 ms (0 con «reducir movimiento»); el hero conserva su fondo propio
- [x] T023 [US2] En `js/principal.js` implementar el fondo continuo según R1/R2: tabla de paradas `{ ancla, fraccion, token }` de [research.md](research.md); lectura de los tokens con `getComputedStyle`; cálculo de posiciones con recálculo en `resize` y `load`; mezcla lineal sRGB; luminancia relativa; conmutación de `data-tono` y de `--texto`/`--texto-suave` en `0,18 ± 0,01`; un solo `scroll` pasivo con `requestAnimationFrame`; escribir `--fondo` en `<html>`; no activar (no poner `data-fondo`) con `prefers-reduced-motion` ni sin los elementos; no interferir con el bloqueo de introducción del hero
- [x] T024 [US2] En el degradado entre el hero y servicios: añadir en `css/estilos.css` (p. ej. `.hero::after`) una franja inferior que se funde del velo del hero al `--fondo`, sin tapar el contacto, para que no haya corte entre el hero y el azul muy claro
- [x] T025 [US2] Ajustar las paradas y los colores de texto sobre la marcha con `preview_start` y capturas en 360 y 1440 px hasta que el recorrido se vea continuo; ejecutar `contraste-scroll.mjs` y corregir cualquier muestra < 4,5 : 1 o con salto de luminosidad > 8 puntos
- [x] T026 [US2] Verificar E2, E3, E8 y el contacto sobre cada fondo (E10 parcial) y registrar los números en `specs/003-rediseno-estetica/verificacion.md`

**Checkpoint**: la página cambia de color con el scroll y se lee en todo el recorrido; sin JS o con movimiento reducido es estática y legible.

## Phase 5: User Story 3 — Header translúcido y detalles del hero (P1)

**Objetivo**: header oscuro que en PC se vuelve translúcido con desenfoque al bajar; botón de cristal, destellos sobre los dientes y gesto de toque con la mandíbula cerrada.

**Prueba independiente**: E4 y E5.

- [x] T027 [US3] En `css/estilos.css` rediseñar `.encabezado`: fondo `--color-header`, texto `--color-texto-claro`, navegación y teléfono con enlaces `--azul-100` y subrayado/hover `--azul-300`, `.encabezado__telefono` y `.encabezado__llamar-movil` con contraste sobre oscuro; en ≥ 1024 px `.encabezado.is-desplazado` con `background-color: var(--color-header-vidrio)`, `backdrop-filter: blur(14px) saturate(120%)` (y `-webkit-`), `transition` de fondo y borde inferior sutil, y `@supports not (backdrop-filter: blur(1px))` con oscuro casi opaco; nada de esto en < 1024 px
- [x] T028 [US3] En `js/principal.js` alternar `is-desplazado` en `.encabezado` con `scrollY > 8` (listener pasivo compartido con el fondo continuo; solo ≥ 1024 px)
- [x] T029 [US3] En `css/estilos.css` aplicar a `.hero__servicios` el aspecto de cristal (R6): degradado translúcido con tokens azules, `backdrop-filter`, borde luminoso, `box-shadow` interior, reflejo con `::before`, texto `--azul-900`, `@supports not` con respaldo, `min-height: 44px` y `:focus-visible`; comprobar contraste ≥ 4,5 : 1 contra el velo del hero
- [x] T030 [US3] Ejecutar `puntos-destellos.py` y añadir en `index.html` una capa `.hero__efectos` (`aria-hidden="true"`) dentro de `.hero__escenario`, con una `.hero__poster-caja` propia y dos grupos de `<i class="destello">` (cerrado y abierto) más la mano SVG del gesto; en `css/estilos.css` pegar las posiciones (variantes escritorio y móvil del abierto), el estilo del destello (radial-gradient de 14–22 px, blanco/`--azul-100`), la animación `opacity`/`transform: scale` con retardos de 3–7 s, y la opacidad de cada grupo ligada a `--t` como las imágenes de dientes; con `prefers-reduced-motion` ocultar los destellos y el gesto
- [x] T031 [US3] En `js/principal.js` implementar el gesto de toque (R8): estados `espera → visible (1..3 ciclos) → descartado`; condiciones `apertura < 0,02`, hero en pantalla, documento visible, sin interacción previa, no móvil apaisado bajo ni «reducir movimiento»; escuchar `dentadura:apertura`; ocultar al empezar a abrirse; la primera interacción lo descarta durante toda la visita (sin `localStorage`)
- [x] T032 [US3] Verificar E4 y E5 en 1440 × 900 y 390 × 844 con los dos modos del hero (3D e imágenes: forzar `data-hero="estatico"`), comprobando que los destellos quedan sobre los dientes y que el gesto no aparece con la mandíbula abierta; registrar capturas en `verificacion.md`

**Checkpoint**: header y hero con los detalles nuevos; el hero sigue funcionando igual (apertura, bloqueo, clic).

## Phase 6: User Story 4 — Servicios con tarjetas oscuras e íconos nuevos (P2)

**Objetivo**: 12 tarjetas gris oscuro con el ícono nuevo y textos claros, sobre el fondo azul que oscurece.

**Prueba independiente**: E6.

- [x] T033 [US4] En `index.html` reemplazar en las 12 tarjetas de `.servicios__rejilla` el `<svg class="servicios__icono">` por `<img class="servicios__icono" src="assets/img/iconos/<archivo>.svg" alt="" width="96" height="96" loading="lazy" decoding="async">` con la asignación de [data-model.md](data-model.md); no cambiar títulos ni descripciones
- [x] T034 [US4] En `css/estilos.css` restilizar `.servicios__tarjeta` (fondo `--color-gris`, borde `--color-gris-claro`, sombra, texto `--color-texto-claro`, descripción en gris claro con contraste ≥ 4,5 : 1), `.servicios__icono` (recuadro de 56–64 px, `object-fit: contain`, mismo alto visual) y el hover/foco; títulos de la sección con `var(--texto)`
- [x] T035 [US4] Verificar E6 (íconos correctos y mismo tamaño visual ± 5 % en 360, 768 y 1440 px), que los íconos no estén en la carga crítica (Network) y que no haya saltos de diseño; registrar en `verificacion.md`

**Checkpoint**: la sección de servicios está terminada y es demostrable por sí sola.

## Phase 7: User Story 5 — Doctor, consultorio, reseñas y ubicación (P2)

**Objetivo**: gris oscuro desde «Sobre el doctor» hasta reseñas, tarjetas de reseña con delineado blanco, estrellas doradas con brillo, ubicación en blanco.

**Prueba independiente**: E7.

- [x] T036 [US5] En `css/estilos.css` adaptar `.doctor` y `.galeria` al gris oscuro (textos con `var(--texto)`/`var(--texto-suave)`, `.doctor__credencial` en `--azul-300`, sombras de fotos, bordes de las imágenes con `--color-gris-claro`)
- [x] T037 [US5] En `css/estilos.css` rediseñar `.resenas__tarjeta` (fondo = `var(--fondo)` o transparente, `border: 1px solid var(--color-blanco)` con transición de color según `data-tono`), `.resenas__estrellas` (`--color-dorado`, `text-shadow` doble, pulso de `opacity` con `animation-delay` por tarjeta, sin animación con «reducir movimiento») y `.resenas__ver-todas`
- [x] T038 [US5] En `css/estilos.css` rediseñar `.pie` y la ubicación sobre blanco: textos `--color-texto-oscuro`, enlaces y teléfono en `--azul-700`, bordes del horario, botón de WhatsApp y aviso de derechos con contraste ≥ 4,5 : 1; `.barra-fija` y `.whatsapp-flotante` legibles sobre fondos claros, oscuros y blanco
- [x] T039 [US5] Verificar E7 y el contacto fijo sobre cada fondo en 360 y 1440 px; registrar en `verificacion.md`

**Checkpoint**: las cinco historias están completas.

## Phase 8: Polish y verificación final

- [ ] T040 Ejecutar la batería completa E1–E10 de [quickstart.md](quickstart.md): peso por perfil (carga crítica ≤ 500 KB; íconos + logo ≤ 80 KB gz; total ≤ 2 MB escritorio / ≈ 1,5 MB móvil), LCP < 2,5 s y CLS ≤ 0,1 en 4G emulada, ≥ 30 fps con CPU ×4, navegación por teclado con foco visible sobre cada fondo, sin desplazamiento horizontal desde 360 px, y Lighthouse móvil
- [ ] T041 Revisar los nueve principios de la constitución v2.7.0 contra el resultado y anotar el cumplimiento en `specs/003-rediseno-estetica/verificacion.md`; dejar la prueba en móvil real anotada como pendiente
- [x] T042 [P] Limpiar: `assets/logos/` movido a `referencias/logos-originales/` (no se publica), retirar la fuente o los pesos de Poppins que ya no se usen, borrar hojas de contacto temporales; actualizar `assets/fonts/LICENSE.txt` y `README`/`SPEC.md` si procede
- [x] T043 [P] Redactar `specs/003-rediseno-estetica/pr-descripcion.md` (resumen, decisiones D-23, cifras de peso y contraste, riesgos conocidos y pendiente de móvil real)

## Dependencias y orden de ejecución

- **Phase 1 → Phase 2**: T007–T011 usan la fuente (T003) y las herramientas (T004–T006). T001–T002 antes de escribir el código de la feature.
- **Phase 2 bloquea todas las historias.** Dentro de ella: T007 antes de T008; T009–T011 en paralelo con T007/T008 tras T004.
- **US1 (P1)** es el MVP: no depende de otra historia. **US2** depende de T007 y T021–T022 (necesita los tokens y el respaldo); **US3** depende de T012 (logo) y T007; **US4** depende de T010 (íconos) y se beneficia de US2; **US5** depende de US2 (variables `--texto`).
- **Polish (T040–T043)** al final.

## Oportunidades de paralelismo

- T003, T004, T005 y T006 (archivos distintos) a la vez.
- T009 y T010 (normalización) a la vez una vez listo T004.
- T017 y T018 (favicon y og-image) en paralelo con T013–T016.
- Tras la Phase 2, US3 (T027–T032) y US4 (T033–T035) pueden avanzar en paralelo porque tocan zonas distintas de `index.html` y `css/estilos.css`; evitar editar la misma regla a la vez.

## Estrategia de implementación

1. **MVP**: Phase 1 + Phase 2 + US1 (T001–T019): ya se ve la nueva identidad. Parar y enseñar al cliente.
2. Añadir US2 (el fondo continuo) y comprobar con `contraste-scroll.mjs`; luego US3, US4 y US5.
3. Cerrar con la batería final y la descripción del PR. Cada historia deja la página en un estado funcional y verificable.

## Phase 9: User Story 6 — Pantalla de presentación (P1, añadida 2026-10-28, D-25)

- [x] T044 [US6] Enmendar la constitución a **v2.8.0** (segunda excepción del principio II) y registrar **D-25** en `SPEC.md` §11
- [x] T045 [US6] En `index.html`: marcar `cargando` en el script del `<head>` (sin «reducir movimiento» ni ancla) y añadir `#presentacion` con el `<symbol>` del diente (contorno + relleno) y 4 + 4 dientes con el logo y el nombre
- [x] T046 [US6] En `css/estilos.css`: sección 5a con la entrada de los pares, el cierre (el logo se apaga antes; las filas se acercan y quedan con una ligera separación), el desvanecimiento, el respaldo `presentacion-segura` a 7 s y la versión móvil (< 768 px)
- [x] T047 [US6] En `js/principal.js`: `iniciarPresentacion()` (inert, bloqueo de eventos en captura, espera mínima + hero listo, tope de 4,5 s, marca `presentacion-fin`) y 3D sin retraso mientras dura
- [x] T048 [US6] Verificar en 1440 y 375 px: pasos, cierre sobre el logo, bloqueo de clic/rueda y duración medida; registrar en `verificacion.md`

## Estado al cierre de la implementación (2026-10-27)

- Hechas todas las tareas salvo **T040** y **T041** completas: faltan Lighthouse, la prueba de teclado con foco sobre cada fondo, la emulación de 4G con CPU ×4 y la **prueba en móvil real** (principio IX). Lo medido está en [verificacion.md](verificacion.md).
- Decisiones tomadas durante la implementación: ver «Desviaciones» en [verificacion.md](verificacion.md).
