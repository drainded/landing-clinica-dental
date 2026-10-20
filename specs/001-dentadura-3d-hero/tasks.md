---

description: "Lista de tareas — Cráneo 3D en rayos X sobre velos de luz en el hero"
---

# Tasks: Cráneo 3D en rayos X sobre velos de luz en el hero

**Input**: Documentos de diseño en `/specs/001-dentadura-3d-hero/`

**Revisión 2026-10-12 (D-17)**: cambio de modelo (cráneo en rayos X) y de fondo (velos de luz que siguen al cursor). Las fases 1–2 (hechas el 2026-10-09) se conservan con los nombres de archivo actualizados; las fases 3–7 se reescriben para el nuevo diseño y se marcan las tareas ya implementadas. Las tareas de verificación (T031, T036–T042) siguen pendientes. Ver también la Fase 9.

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

- [X] T001 [P] Generar el bundle de three.js una sola vez: en un directorio temporal fuera del repo, `npm pack three@0.186.1`, extraer, y con `esbuild --bundle --minify --format=esm` (entrada: `WebGLRenderer, Scene, PerspectiveCamera, ShaderMaterial, Mesh, Group, Vector2, Vector3, Color, MathUtils, BackSide` de `build/three.module.js`, `GLTFLoader` de `examples/jsm/loaders/GLTFLoader.js` y `MeshoptDecoder` de `examples/jsm/libs/meshopt_decoder.module.js`; redirigir `three` a `build/three.module.js` y asegurar que resuelva `SkeletonUtils.js`) escribir `assets/js/vendor/three-dentadura.min.js`; añadir `assets/js/vendor/LICENSE-three.txt` (MIT, copiado del paquete) y `assets/js/vendor/README.md` con la versión (0.186.1), el archivo de entrada completo y el comando exacto para regenerarlo. Medido: ≈ 626 KB crudos / ≈ 139 KB brotli (límite del diferido: 1,5 MB). Regenerado el 2026-10-12 con la lista de exportaciones de `assets/js/vendor/README.md` (D-17).
- [X] T002 [P] Descargar Poppins 600 y 700 e Inter 400 y 500 en WOFF2 (subconjunto `latin` + `latin-ext` con á é í ó ú ü ñ ¿ ¡ « » — –) a `assets/fonts/` con nombres `poppins-600.woff2`, `poppins-700.woff2`, `inter-400.woff2`, `inter-500.woff2`; añadir `assets/fonts/LICENSE.txt` (SIL OFL 1.1 de ambas familias). Peso total objetivo ≈ 60–80 KB.
- [X] T003 [P] Crear `assets/models/README.md` documentando la autoría original de `craneo.glb` y `craneo-ligero.glb` (estado pendiente de confirmar con el cliente tras el cambio de modelo, D-17), su jerarquía `craneo-inferior › maxilar | mandibula`, que los materiales `hueso` y `dientes` se sustituyen por shaders, y el peso/triángulos de cada versión (209 KB / 74 KB; ≈ 41 000 / ≈ 12 300 tris). Pedir al cliente/autor los datos de autoría que falten; no inventarlos.
- [X] T004 [P] Evitar la publicación de archivos de desarrollo: crear `netlify.toml` en la raíz con redirecciones `status = 404, force = true` para `/referencias/*`, `/specs/*`, `/.specify/*`, `/.claude/*` y `/SPEC.md`. Si el despliegue usa Cloudflare Pages, documentar el equivalente en un comentario del mismo archivo.

---

## Phase 2: Foundational (bloquea todas las historias)

**Purpose**: hero sin slider, con póster como LCP, fuentes autoalojadas y la lógica de nivel; sin esto ninguna historia puede probarse.

**⚠️ CRITICAL**: ninguna historia empieza hasta terminar esta fase.

- [X] T005 Autoalojar fuentes en `css/estilos.css` y `index.html`: añadir cuatro `@font-face` (Poppins 600/700, Inter 400/500, `font-display: swap`, `src: url('../assets/fonts/….woff2') format('woff2')`) antes de `:root`; eliminar de `index.html` los tres `<link>` a `fonts.googleapis.com`/`fonts.gstatic.com` (líneas del `preconnect` y la hoja de Google Fonts); añadir `<link rel="preload" as="font" type="font/woff2" crossorigin href="assets/fonts/poppins-700.woff2">` y el equivalente para `inter-400.woff2`. Depende de T002.
- [X] T006 En `<head>` de `index.html`: eliminar `<link rel="preload" as="image" href="assets/img/hero-1.jpg">`; añadir `<link rel="preload" as="image" href="assets/img/craneo-cerrado.webp" fetchpriority="high">`; añadir un script en línea mínimo (≤ ~300 bytes, antes de la hoja de estilos) que fije `document.documentElement.dataset.hero` a `'estatico'` si `matchMedia('(prefers-reduced-motion: reduce)').matches`, o `navigator.connection && navigator.connection.saveData`, o `navigator.deviceMemory <= 2`, o `navigator.hardwareConcurrency <= 2`; en otro caso a `'animado'` (cada API con comprobación de existencia, principio VI). Ver research R3/R4.
- [X] T007 Reestructurar el hero en `index.html` según [contracts/hero-dentadura.md](contracts/hero-dentadura.md) §1: eliminar `#heroSlider`, las tres `img.hero__slide`, `.hero__overlay` y `#heroPuntos`; crear `.hero__escenario` con `.hero__cabecera` (logo 64×64 + `<h1>` con el texto actual, único `<h1>`), `.hero__figura` con `<img class="hero__poster" src="assets/img/craneo-cerrado.webp" alt="" width="524" height="564" fetchpriority="high">`, `.hero__revelado` (`<p class="hero__eslogan">La confianza en tu sonrisa comienza aquí</p>` + `<a class="boton boton--acento hero__servicios" href="#servicios">Servicios</a>`) y `.hero__contacto` (botón «Agende su cita» con `data-campo="whatsapp-href"`, teléfono con `data-campo="telefono-href"`/`telefono-display`, `<p class="hero__horario" data-campo="horario-resumen">`). Conservar todos los `data-campo` y `id="inicio"`. Mantener `<h1>` en el DOM (RF-11).
- [X] T008 Reescribir la sección «5. Hero» de `css/estilos.css` (modo base = estático): quitar `.hero__slider`, `.hero__slide`, `.hero__overlay`, `.hero__puntos`, `.hero__punto`; `.hero` con `background: var(--color-superficie)`, `color: var(--color-texto)`; `.hero__escenario` en columna centrada con `min-height: 100svh`; `.hero__figura` con `aspect-ratio: 524 / 564`, ancho `min(100%, 22rem)` (ajustar para que quepa a 360 px, FR-008), `.hero__poster` al 100 %; `.hero__titulo` en `var(--color-acento-oscuro)`, `.hero__eslogan` en `var(--color-acento-oscuro)`; `.hero__telefono` y `.hero__horario` con `var(--color-texto)`/`var(--color-texto-suave)`; sin ningún color literal (principio I). Eslogan y «Servicios» visibles en este modo. Depende de T007.
- [X] T009 [P] Tokenizar los colores literales que quedan fuera de `:root` en `css/estilos.css` (principio I, deuda previa): `.boton--fantasma:hover` (`rgba(15,110,110,.08)`), `.resenas__estrellas` (`#E8A93A`) y `box-shadow` de `.barra-fija` (`rgba(0,0,0,.12)`) → crear los tokens necesarios en `:root` (p. ej. `--color-acento-suave`, `--color-estrella`, `--sombra-barra`) y usarlos. Verificar con `grep` que no queda `rgba(`/`#hex` fuera de `:root`. Los literales del hero ya se eliminan en T008.
- [X] T010 En `js/principal.js`: eliminar la función `iniciarSliderHero` y su llamada; actualizar el comentario de cabecera ("Sin dependencias externas" → script base; el 3D va en `js/dentadura.js`); añadir `iniciarDentadura()` que, si `document.documentElement.dataset.hero === 'animado'`, programa con `requestIdleCallback` (respaldo `setTimeout(…, 200)`) `import('./dentadura.js')` y llama a su `iniciar({ hero, figura, nivel, rutaModelo })`; decidir aquí `nivel` y `rutaModelo` (research R3): `'ligero'` con `assets/models/craneo-ligero.glb` si `matchMedia('(pointer: coarse)').matches && innerWidth < 768`, `'completo'` con `assets/models/craneo.glb` en otro caso (cada API con comprobación de existencia, principio VI); constantes con nombre al inicio del archivo para los umbrales de equipo lento (memoria, núcleos, fps) de modo que se calibren en T042; capturar el rechazo del `import()` y dejar `data-hero="estatico"`. Depende de T006.
- [X] T011 Borrar `assets/img/hero-1.jpg`, `hero-2.jpg`, `hero-3.jpg` (D-15) y comprobar con `grep -rn "hero-[123]" index.html css js` que no quedan referencias.
- [X] T012 Crear el esqueleto de `js/dentadura.js` (módulo ES sin efectos al importarse): `export async function iniciar({ hero, figura, nivel, rutaModelo })` que devuelve `{ destruir(), estado() }`, y emite el evento `dentadura:estado` en `document` (`detail: { estado, nivel }`) con los estados `cargando | animado | pausado | estatico` de [data-model.md](data-model.md). Cualquier error se captura y degrada a `estatico` (fija `data-hero="estatico"`) sin lanzar. Depende de T010.

**Checkpoint**: la página se ve completa en modo estático: fondo blanco, póster como LCP, fuentes locales, 0 peticiones a Google.

---

## Phase 3: User Story 1 — Ver el cráneo al llegar (Priority: P1) 🎯 MVP

**Goal**: cráneo cerrado en rayos X sobre velos de luz, visible de inmediato (póster sobre degradado CSS) y sustituido sin salto por la versión 3D en el mismo encuadre.

**Independent Test**: E1 (primer pintado, LCP, encuadre), E8 (360 px) y E6 (peso y 0 peticiones externas) de [quickstart.md](quickstart.md). Con solo esta historia el hero ya cumple SC-001, SC-005 y SC-006.

### Implementation for User Story 1

- [X] T013 [US1] En `js/dentadura.js`: `import` estático de `../assets/js/vendor/three-dentadura.min.js`; carga del GLB con `GLTFLoader.setMeshoptDecoder(MeshoptDecoder).loadAsync(rutaModelo)`; `WebGLRenderer({ canvas, antialias: nivel === 'completo', alpha: false })` con `setPixelRatio(min(devicePixelRatio, tope))`; `<canvas class="hero__canvas" aria-hidden="true">` insertado como primer hijo de `.hero__escenario`; `PerspectiveCamera(28, …)`. Si falla (sin WebGL, GLB 404, token ilegible), emitir `estatico`.
- [X] T014 [US1] En `js/dentadura.js`, sustituir los materiales del GLB por nombre: `hueso` → shader de rayos X (de `referencias/demo-rayosx.html`: `DoubleSide`, `CustomBlending` con `src = 0`, `dst = SrcColor`, sin profundidad, `renderOrder 1`; tinte desde `uTinta`); `dientes` → shader propio blanco brillante con iluminación fija (`renderOrder 2`, con profundidad, `transparent: true` para compartir cola con el hueso). `frustumCulled = false`. Sin texturas ni luces de three.js.
- [X] T015 [US1] En `js/dentadura.js`, leer los colores de los tokens (`leerColor`: `#rgb`, `#rrggbb`, `rgb()` → sRGB 0–1 sin conversión de espacio de color): `--color-rayosx`, `--color-rayosx-luz`, `--color-superficie`, `--color-velo-fondo`, `--color-velo-1`, `--color-velo-2`. Definir esos tokens en `:root` de `css/estilos.css`. Sin colores literales en JS, shaders ni CSS fuera de `:root` (principio I).
- [X] T016 [US1] En `js/dentadura.js`, pose y encuadre: `mandibula.rotation.x = 0` (cerrada, FR-003); caja del modelo con `medirCaja`; pivote en el centro de la caja; distancia de cámara para que la figura cerrada ocupe el recuadro `contain` del póster dentro de `.hero__figura` y `camera.setViewOffset` para centrarla en ese recuadro aunque el canvas sea todo el escenario; recalcular con `ResizeObserver` (escenario y figura). Constante `AJUSTE_ENCUADRE` (0,91) calibrada por superposición con el póster (research R6).
- [X] T017 [US1] Sustitución póster → 3D: tras el primer fotograma añadir `is-listo` al canvas y `is-3d` a `.hero__figura`, fijar `data-nivel` y emitir `animado`; en `css/estilos.css`: `.hero__canvas` (absoluto, `inset: 0`, `z-index: -1` dentro de `.hero__escenario { isolation: isolate }`, `opacity: 0`, `pointer-events: none`, `touch-action: pan-y`), `.hero__canvas.is-listo { opacity: 1 }`, `.hero__figura.is-3d .hero__poster { opacity: 0 }`; el póster usa `mix-blend-mode: multiply` (es opaco y blanco). Solo transiciones de `opacity` (CLS ≈ 0).
- [X] T018 [US1] Pausa y limpieza (principio VII, FR-016): `renderer.setAnimationLoop`; `IntersectionObserver` sobre `.hero` (pausar con < 5 % visible) y `visibilitychange`; `destruir()` que cancela el bucle, desuscribe listeners y llama a `dispose()` de geometrías, materiales y renderer (+ `forceContextLoss`); `webglcontextlost` → `preventDefault()` y estado `estatico`.
- [X] T018b [US1] Fondo de velos: shader de pantalla completa (triángulo con `BufferGeometry`, `renderOrder −1`) con 5 capas de velos y 2 hilos finos (research R13); degradado CSS equivalente (tokens `--color-velo-*` y `--velo-*-suave`) en `.hero__escenario` para el modo estático y la carga.

**Checkpoint**: el cráneo 3D cerrado sobre los velos reemplaza al póster sin salto; páginas sin 3D siguen completas.

---

## Phase 4: User Story 2 — Velos de luz que siguen al cursor (Priority: P1)

**Goal**: velos que se desplazan con paralaje y se curvan junto al cursor/toque, cráneo que se inclina hacia él, balanceo en reposo; recuperación al retirar.

**Independent Test**: E2 de [quickstart.md](quickstart.md) (cursor, salida de ventana, toque con scroll vertical operativo).

### Implementation for User Story 2

- [X] T019 [US2] En el shader de velos de `js/dentadura.js`: uniforms `uCursor` (espacio de pantalla con aspecto), `uInfluencia` y `uTiempo`; por capa, paralaje del cursor (0,06–0,50) y «lente» gaussiana local; flujo del tiempo propio. (Sustituye a la deformación del modelo de la versión anterior, retirada por D-17.)
- [X] T020 [US2] Entrada del puntero: listeners pasivos `pointermove`/`pointerdown` en `window` que normalizan respecto al escenario; `activo = true` con cualquier movimiento (ratón) o toque apoyado; `pointerup`/`pointercancel` de tipo no-mouse, `pointerleave` del documento y `blur` ponen `activo = false`; nunca `preventDefault()` (FR-007).
- [X] T021 [US2] Suavizado y límites en el bucle: lerp con `k = 1 − exp(−dt·9)` para el cursor y la influencia; velocidad del cursor acotada (1,5) que decae y acelera el reloj de los velos (0,7 → ≈ 2,9×); sin deformar el modelo.
- [X] T022 [US2] Inclinación y reposo: `pivote.rotation.y` hacia `ptr.x·0,25·influencia`, `rotation.x` hacia `−ptr.y·0,12·influencia` (lerp); balanceo en reposo `sin(t·0,5)·0,1` rad en Y (FR-006).
- [X] T023 [US2] `css/estilos.css`: el canvas no captura eventos (`pointer-events: none`; el puntero se escucha en `window`); `.hero__contacto` (`z-index: 3`), la barra fija y el botón flotante quedan por encima y siguen pulsables (contrato §5, FR-014).

**Checkpoint**: US1 + US2 funcionan; el scroll nativo no se afecta (el único bloqueo es el de introducción, US3).

---

## Phase 5: User Story 3 — Abrir la mandíbula con el scroll (Priority: P1)

**Goal**: la mandíbula se abre hasta ≈ 30° con el scroll del hero y se cierra al volver; progreso 0–1 publicado como `--apertura` y evento.

**Independent Test**: E3 y E7 de [quickstart.md](quickstart.md) (scroll lento/rápido/inercia, fps).

### Implementation for User Story 3

- [X] T024 [US3] `css/estilos.css`: el hero ya no tiene recorrido ni `sticky`; en modo animado `.hero__escenario` mide `100svh − --alto-header-movil − --alto-barra-fija` (escritorio: `100svh − --alto-header`) para verse completo al cargar. (Sustituye al recorrido de scroll de R15, por R16.)
- [X] T025 [US3] `js/principal.js`, `publicarApertura(hero)` con **bloqueo de introducción** (research R16, constitución v2.3.0): intercepta `wheel`, `touchmove` y teclas de desplazamiento mientras la página está en lo alto, las convierte en `objetivo` y publica el progreso a ≤ 0,5/s en `--apertura`, `dentadura:apertura` y `data-revelado` (histéresis 0,50/0,45); libera con Tab, clic en ancla interna, `scroll` externo, `estatico` o carga desplazada; no activo en modo `estatico`. Constantes con nombre: `BLOQUEO_VELOCIDAD`, `DISTANCIA_RUEDA`, `DISTANCIA_TOQUE`, `PASO_TECLA`.
- [X] T026 [US3] `js/dentadura.js`, apertura de la mandíbula (research R15): escuchar `dentadura:apertura` (y leer `--apertura` al iniciar); `suave += (crudo − suave)·k·0,6`; `abierto = ease(clamp(suave / 0,7))`; `mandibula.rotation.x = 30° · abierto`.
- [X] T027 [US3] Cráneo acercado desde el inicio: `--escala-figura` (1,6) en `:root` aplicada con `transform: scale()` a `.hero__figura` (póster y 3D coinciden; `mix-blend-mode: multiply` en la figura); la cámara se ajusta al recuadro escalado y apunta hacia el centro de los dientes superiores (algo más abajo) al abrirse. Sin acercamientos por scroll.
- [X] T027b [US3] Difuminado bajo los textos (FR-014b): cajas de `.hero__cabecera` y `.hero__eslogan` en píxeles del buffer (recalculadas en `medir()`) → uniforms `uCajaA`/`uCajaB`/`uRes`/`uDifumina` de los shaders de hueso y dientes; máscara de borde suave multiplicada por `abierto`.

**Checkpoint**: los tres P1 completos (MVP funcional del hero 3D).

---

## Phase 6: User Story 4 — Eslogan y «Conoce nuestros servicios» al abrirse (Priority: P2)

**Goal**: el eslogan y el botón se revelan sincronizados con `--apertura`; accesibles por teclado; el contacto nunca queda tapado.

**Independent Test**: E4 de [quickstart.md](quickstart.md).

### Implementation for User Story 4

- [X] T028 [US4] `css/estilos.css`, revelado por CSS puro con `html[data-hero="animado"]`: `--rev-eslogan: clamp(0, (var(--apertura, 0) − 0.2) / 0.3, 1)` y `--rev-boton: clamp(0, (var(--apertura, 0) − 0.3) / 0.3, 1)`; solo `opacity`/`transform`; `.hero__revelado` superpuesto a la figura (rejilla de tres filas: eslogan y botón juntos en el hueco de la boca abierta) con `pointer-events: none`; el botón solo recibe `pointer-events: auto` con `#inicio[data-revelado]` o `:focus-visible`; halos `text-shadow` con `--color-superficie`. En `estatico` ambos visibles, en flujo normal.
- [X] T029 [US4] Accesibilidad del botón: `:focus-visible` fuerza `opacity: 1; transform: none` y mantiene el contorno visible global; sin `display:none` ni `visibility:hidden` (sigue en el orden de tabulación, FR-013); `min-height: 44px` (`.boton`).
- [X] T030 [US4] Confirmar que `href="#servicios"` desplaza a la sección sin que el header fijo de escritorio la tape (`scroll-margin-top` existente) y que con `prefers-reduced-motion` el desplazamiento no es animado (T-18 de SPEC.md).
- [ ] T031 [US4] Verificación de contacto (principio II): con el hero en 0 %, 50 % y 100 % de apertura, a 360 px y a 1440 px, comprobar que «Agende su cita», teléfono, barra fija (móvil) y botón flotante (≥ 1024 px) están visibles y no tapados. *Estado: revisado a 360×640 y 1280×760 el 2026-10-12 (nada tapado; en móvil, con la cabecera visible quedan ≈ 76 px del escenario bajo el pliegue hasta que este se fija); registrado en `verificacion.md` (2026-10-17): 1440 px y 1280 px correctos, 360 px solo con el hero cerrado; falta 360 px con apertura 50 %/100 % en 3D real.*

**Checkpoint**: eslogan/botón sincronizados; contacto intacto.

---

## Phase 7: User Story 5 — Dispositivos modestos y movimiento reducido (Priority: P2)

**Goal**: niveles estático/ligero/completo, degradación segura y cero cambio de píxeles con movimiento reducido.

**Independent Test**: E5 y E7 de [quickstart.md](quickstart.md).

### Implementation for User Story 5

- [X] T032 [US5] Tope de resolución según `nivel`: DPR ≤ 2 (`completo`) / ≤ 1,5 (`ligero`); antialias solo en `completo`; `ligero` carga `craneo-ligero.glb` (≈ 12 300 triángulos; `craneo.glb` ≈ 41 000).
- [X] T033 [US5] Guardia de fluidez: si el promedio de fps de los primeros 3 s es < 24 (`UMBRAL_FPS_MIN`), bajar `setPixelRatio` a 1 y volver a medir; si persiste en `ligero`, pasar a `estatico`.
- [X] T034 [US5] Degradación completa (FR-012): `try/catch` en `iniciar` y `.catch` del `import()`; sin WebGL, GLB 404, token de color ilegible o `webglcontextlost` → póster, `data-hero="estatico"` (el CSS muestra eslogan y botón) y canvas retirado.
- [X] T035 [US5] `js/principal.js`: `matchMedia('(prefers-reduced-motion: reduce)')` con `change`: si pasa a `reduce` en ejecución, `destruir()` y `data-hero="estatico"`. Con `reduce` desde el inicio, el script de `<head>` evita cargar `three-dentadura.min.js` y el GLB (FR-010).
- [ ] T036 [US5] Verificar E5 (reduced-motion: 0 píxeles cambian al mover cursor y hacer scroll —comparar capturas antes/después—, bloqueo del GLB, WebGL desactivado y pérdida de contexto) y E7; registrar resultados en `specs/001-dentadura-3d-hero/verificacion.md` (se crea aquí). *Estado: el modo estático se revisó visualmente el 2026-10-12 forzando `data-hero="estatico"`; `verificacion.md` (2026-10-17) recoge la parte hecha; faltan reduced-motion real, GLB bloqueado, WebGL desactivado y pérdida de contexto.*

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

## Phase 9: Cambio de modelo y de fondo (D-17, 2026-10-12)

**Purpose**: aplicar la nueva dirección visual del cliente (boceto + `modelo-craneo-rayosx-dientes-alineados.zip`).

- [X] T043 Sustituir los activos: `assets/models/craneo.glb`, `craneo-ligero.glb`, `assets/img/craneo-cerrado.webp` y `referencias/demo-rayosx.html`; retirar `diente.glb`, `diente-ligero.glb`, `diente-poster.webp` y `referencias/demo-contorno.html`; actualizar rutas en `index.html` y `js/principal.js`. (`craneo-abierto.webp` del zip no se incorpora.)
- [X] T044 Regenerar `assets/js/vendor/three-dentadura.min.js` con la nueva lista de exportaciones (sin `Color`/`BackSide`; con `BufferGeometry`, `BufferAttribute`, `DoubleSide`, `CustomBlending`, `AddEquation`, `ZeroFactor`, `SrcColorFactor`) y documentarlo en `assets/js/vendor/README.md`.
- [X] T045 Actualizar la documentación: constitución v2.2.0 (principios I y V; v2.3.0 en T049), `SPEC.md` (§2.1, §4.2, §7 y D-17), `assets/models/README.md` y todos los archivos de esta carpeta (spec, plan, research R1/R3–R8/R10/R13/R14, data-model, contrato, quickstart, checklist y este tasks.md).
- [X] T046 Hero según el boceto: `index.html` (póster 524×564, botón «Conoce nuestros servicios» con flecha), `css/estilos.css` (rejilla de tres filas, canvas a todo el escenario, degradado de velos de respaldo, tokens `--color-velo-*`, `--color-rayosx*`).
- [X] T049 Bloqueo de introducción (D-18): enmendar la constitución a v2.3.0 (principio II) y registrar D-18 en `SPEC.md`; implementar el bloqueo en `js/principal.js` y el hero de alto fijo en `css/estilos.css` (T024/T025); documentar en research R16 y contrato §6.
- [ ] T050 Verificar el bloqueo en móvil real (arrastre táctil, Android e iOS) y con lector de pantalla: salidas de emergencia (Tab, anclas, barra de scroll), contacto pulsable durante el bloqueo, sin bloqueo con reduced-motion (principio IX).
- [X] T051 Clic sobre el cráneo (FR-018): `js/principal.js` (`alternar`, `activarClic`; `role="button"` + `aria-pressed` en `.hero__figura`) y `css/estilos.css` (cursor y foco). Probado el 2026-10-17 en escritorio y 360 px (ver `verificacion.md`). Pendiente: prueba en móvil real y con lector de pantalla (T050).
- [X] T052 Correcciones de la prueba en móvil real (2026-10-19): hero en horizontal bajo (`css/estilos.css`, `apaisadoBajo` en `js/principal.js`), tirar hacia abajo para refrescar y impulso al deslizar rápido. Verificadas en el panel y confirmadas en el móvil real el 2026-10-19.
- [ ] T053 Rediseñar el hero estático (movimiento reducido, ahorro de datos y equipos modestos), hoy un póster con textos sin diseño propio, y revisar la detección de ahorro de datos (`saveData`) en Chrome Android.
- [X] T047 **Confirmar el origen del modelo** y completar `assets/models/README.md` (principio V). Autoría confirmada por el titular del proyecto el 2026-10-20 (creado por drainded con Claude, no es un escaneo de terceros); ya no bloquea la publicación.
- [ ] T048 Afinar el diseño con el cliente sobre el boceto (tamaño del cráneo en escritorio, intensidad de los velos, ubicación del eslogan) y, si se desea un encuadre exacto póster ↔ 3D, regenerar `craneo-cerrado.webp` desde una captura del propio 3D.

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
- **US2**: sobre el módulo de US1 (velos y puntero).
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

1. + US2 (velos con el cursor) → validar E2.
2. + US3 (apertura con scroll) → validar E3/E7.
3. + US4 (eslogan y «Conoce nuestros servicios») → validar E4. Con US1–US4 el hero cumple el diseño completo.
4. + US5 (niveles y degradación) → validar E5. Es requisito de publicación (principios VI y VIII); no se publica sin ella.
5. Polish (peso, Lighthouse, constitución).

### Notes

- [P] = archivos distintos, sin dependencias; ninguna tarea [P] edita `js/dentadura.js`.
- No usar GSAP/Lenis (Spec 2); no tocar el formulario ni nuevas secciones.
- Commit tras cada tarea o grupo lógico; no publicar si alguna verificación del presupuesto falla.
