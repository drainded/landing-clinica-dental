---

description: "Lista de tareas — Hero estático rediseñado con transición por scroll"
---

# Tasks: Hero estático rediseñado con transición por scroll

**Input**: Documentos de diseño en `/specs/002-hero-estatico-scroll/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/hero-estatico.md](contracts/hero-estatico.md) (el «contrato»), [quickstart.md](quickstart.md)

**Tests**: no se solicitaron pruebas automatizadas (principio IV: sin build ni framework de pruebas). La verificación usa los escenarios E1–E9 del quickstart y la herramienta `referencias/herramientas/hero.mjs`.

**Organization**: tareas agrupadas por historia. Rutas relativas a la raíz del repositorio. US1, US2 y US3 son las tres de prioridad P1: el **MVP publicable es US1 + US2 + US3**.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizable (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia a la que pertenece (US1–US5)

## Path Conventions

Sitio estático plano: `index.html`, `css/estilos.css`, `js/`, `assets/img/`. Herramientas de desarrollo (no se publican) en `referencias/herramientas/`.

---

## Phase 1: Setup y gobernanza

**Purpose**: rama, enmienda constitucional y decisión registradas **antes** de escribir código de la feature.

- [X] T001 Crear la rama `002-hero-estatico-scroll` desde `001-dentadura-3d-hero` (`git switch -c 002-hero-estatico-scroll`) y hacer un commit inicial con `specs/002-hero-estatico-scroll/`, `.specify/feature.json` y `assets/img/fondo-hero-estatico.jpg` (hoy sin versionar).
- [X] T002 [P] Enmendar `.specify/memory/constitution.md` a **v2.4.0** (informe de impacto al inicio): principio V → el límite de 60 KB aplica a **cada** imagen de cráneo (cerrado y abierto, con dos variantes del abierto) y se admiten fondos de imagen por formato; principio VI(a) → el nivel estático incluye la composición final y, con ahorro de datos o equipo lento sin movimiento reducido, una transición por scroll de `opacity`/`transform` (no es scroll suave). Corregir también el pie de página, que aún dice «Version: 2.1.0».
- [X] T003 [P] Registrar la decisión **D-19** en `SPEC.md` §11 (hero estático rediseñado: composición del 3D, fondo de imagen PC/móvil, transición por scroll en modo estático, cráneo abierto generado desde el modelo) y actualizar en `SPEC.md` la descripción del hero y la línea «Respaldo» (hoy: póster cerrado sobre degradado CSS).
- [X] T004 [P] Crear `referencias/herramientas/README.md` con prerrequisitos (Node ≥ 22; Chrome en `C:\Program Files\Google\Chrome\Application\chrome.exe`; Python con Pillow ≥ 12 con WebP; servidor `python -m http.server 5173`), las banderas de Chrome verificadas el 2026-10-20 (`--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`) y que la carpeta no se publica; añadir a `.gitignore` (crearlo si falta) `referencias/herramientas/linea-base/`, `salida/` y `perfil-chrome/`; comprobar que `netlify.toml` ya redirige `/referencias/*` a 404.

---

## Phase 2: Foundational (bloquea todas las historias)

**Purpose**: opción de captura del 3D y herramientas que generan y miden las imágenes.

**⚠️ CRITICAL**: ninguna historia empieza antes de terminar esta fase.

- [ ] T005 Implementar la opción `captura` (contrato §6 y §5 «Con `?captura`»): en `js/dentadura.js`, `iniciar({ …, captura: true })` no añade la malla de velos, limpia a blanco opaco con `preserveDrawingBuffer: true`, no inicia el bucle ni el pausado, y devuelve `capturar(apertura)` → `{ imagen (data URL PNG), recuadro, desplazamiento, figuraPx, lienzoPx, dpr }`; `recuadro` = caja envolvente de los vértices proyectados en % de la figura; `desplazamiento` = `Δ = −foco · alto_px / (2 · distancia · tan(FOV/2))` normalizado al alto de la figura (x, y en %). En `js/principal.js`, con `?captura` en la URL no se registra el bloqueo ni se espera `RETRASO_3D_TRAS_CARGA_MS`, se llama a `iniciar` con `captura: true` y se expone `window.__craneo` (≈ 8 líneas, comentadas como código de desarrollo). Sin `captura` el comportamiento debe quedar idéntico al actual.
- [ ] T006 [P] Crear `referencias/herramientas/hero.mjs` (Node sin dependencias, `WebSocket` global; Chrome sin interfaz con CDP; contrato §7): perfiles `--perfil normal | movimiento-reducido | equipo-lento | ahorro-datos` (inyecta `navigator.deviceMemory = 1`, `navigator.connection.saveData = true` o emula `prefers-reduced-motion`) y subcomandos **`capturar`** (`--ancho --alto --fase 0|1`: abre `index.html?captura`, llama a `__craneo.capturar(fase)` y guarda PNG + JSON en `salida/`) y **`cajas`** (para 360×740, 390×844, 768×1024, 1024×768, 1440×900 y 1920×1080 guarda `salida/cajas-<ancho>x<alto>.json` con los rectángulos de `.hero__cabecera`, `.hero__eslogan`, `.hero__servicios`, `.hero__telefono` y `.hero__horario`).
- [ ] T007 [P] Crear `referencias/herramientas/codificar-craneo.py`: lee PNG + JSON de `salida/`, recorta con `figuraPx`/`lienzoPx`/`dpr` y el `recuadro`, reescala a `--ancho-final` (800 px por defecto, Lanczos) y escribe un WebP en `assets/img/` bajando la calidad hasta quedar **≤ 60 KB**; imprime peso, dimensiones y calidad.
- [ ] T008 Guardar la línea base del 3D (E9) y comprobar que sin `?captura` nada cambió: con `hero.mjs capturar` en 390×844 y 1440×900, fases 0 y 1, y una captura de pantalla del escenario con el 3D normal, en `referencias/herramientas/linea-base/`; cargar la página con el servidor local y verificar canvas, apertura con el scroll de introducción y consola sin errores. Crear `specs/002-hero-estatico-scroll/verificacion.md` con estos resultados. Depende de T005, T006.

**Checkpoint**: se pueden generar PNG/WebP del cráneo en cualquier fase y la línea base del 3D está guardada.

---

## Phase 3: User Story 1 — Hero estático con el cráneo cerrado y la misma posición que el 3D (Priority: P1) 🎯 MVP (con US2 y US3)

**Goal**: el hero estático usa la disposición del 3D y muestra el cráneo cerrado acercado, con cabecera y contacto donde estarían en el 3D.

**Independent Test**: con `--perfil equipo-lento` y `--apertura: 0` impuesto, en los seis tamaños de referencia la silueta del cráneo difiere del 3D ≤ 2 % del ancho de la figura y las cajas de cabecera, botón y contacto son idénticas (E1, fase 0).

- [ ] T009 [US1] En `css/estilos.css` unificar la disposición del hero (contrato §4.1): quitar `html[data-hero="animado"]` de las reglas de rejilla (escenario `height: calc(100svh − var(--alto-barra-fija) − var(--alto-header-movil))`; `.hero__figura` `height: auto`; `.hero__revelado` superpuesto en `grid-row: 2` con `padding-top` 10 % y 5 % desde 1024 px; `.hero__contacto` en `grid-row: 3`), eliminar la disposición estática antigua (`height: min(56svh, 32rem)`, eslogan debajo) y conservar la variante de móvil apaisado bajo. Generalizar el revelado (`--rev-eslogan`, `--rev-boton`, `pointer-events`, `:focus-visible` del botón) para que dependa de `--apertura` sin `data-hero="animado"`. Valor por defecto de `--apertura`: `0` con `html[data-hero="animado"]` y `html[data-transicion]`, `1` en el resto (contrato §3). Sin colores literales nuevos.
- [ ] T010 [US1] Regenerar el cráneo cerrado: `hero.mjs capturar --ancho 1440 --alto 900 --fase 0` y `codificar-craneo.py` → `assets/img/craneo-cerrado.webp` **≤ 60 KB** (densidad ≈ 1,5× la actual; conservar el actual, con copia de seguridad fuera de `assets/`, si no mejora o supera el límite); actualizar en `index.html` `width`/`height` del `<img class="hero__poster">` (mantener `fetchpriority="high"`, `alt=""`). Depende de T006, T007.
- [ ] T011 [US1] Añadir el subcomando **`comparar`** a `referencias/herramientas/hero.mjs`: para cada tamaño de referencia y cada fase (0 y 1) compara el hero estático (perfil `equipo-lento`, fondo en blanco, textos ocultos, `--apertura` impuesto) con la captura 3D de `?captura`: caja envolvente de los píxeles no blancos, **ignorando los píxeles dentro de las cajas de cabecera y eslogan ampliadas un 4 % del alto del lienzo** (donde actúa el difuminado), y desviación de cada borde en % del ancho de la figura (criterio ≤ 2 %); además compara `getBoundingClientRect()` de cabecera, eslogan, botón y contacto entre modo estático y 3D (criterio 0 px). Devuelve código de salida ≠ 0 si algo falla. Depende de T006.
- [ ] T012 [US1] Ejecutar `hero.mjs comparar` (fase 0) en los 6 tamaños y corregir en `css/estilos.css` / `index.html` cualquier desviación (`--escala-figura`, recuadro del póster; tocar el encuadre del 3D solo si se demuestra que es él quien se desvía). Verificar a 360 px: sin desplazamiento horizontal ni saltos de diseño, y con `--apertura: 0` el eslogan y el botón no se ven mientras `<h1>`, «Agende su cita», teléfono y horario sí. Registrar resultados y pesos en `verificacion.md`. Depende de T009–T011.

**Checkpoint**: el hero estático cerrado coincide con el 3D en posición. Con la transición sin construir, el modo estático por defecto (`--apertura: 1`) muestra el eslogan sobre el cráneo cerrado: **no publicar** hasta completar US2.

---

## Phase 4: User Story 2 — Transición suave al cráneo abierto con eslogan y botón (Priority: P1)

**Goal**: en modo estático con transición el hero se mantiene anclado, el cráneo cerrado se funde con el abierto (con traslación compensatoria), aparecen eslogan y botón en la boca; continuo, reversible, sin bloquear el scroll nativo.

**Independent Test**: con `--perfil ahorro-datos`, desplazar de 0 a 100 % y volver (0, 25, 50, 75, 100 %): transición continua, sin saltos ni doble perfil; tras `--recorrido` el hero se desancla y sigue «Servicios» sin salto (E1 fase 1 y E2).

- [ ] T013 [US2] Generar el cráneo abierto en sus dos variantes: `hero.mjs capturar --fase 1` a **390 × 844** (móvil, < 1024 px) y a **1440 × 900** (escritorio, ≥ 1024 px); comprobar que `recuadro` y `desplazamiento` coinciden entre ambas (≤ 0,1 puntos porcentuales; si no, investigar antes de seguir) y anotarlos en `verificacion.md`; codificar con `codificar-craneo.py` → `assets/img/craneo-abierto-movil.webp` y `assets/img/craneo-abierto-escritorio.webp`, cada una **≤ 60 KB**. Depende de T006, T007.
- [ ] T014 [US2] En `index.html`: (a) dentro de `.hero__figura` y **antes** del póster, añadir el `<picture class="hero__abierto" aria-hidden="true">` exactamente como el contrato §1 (dos `<source>` con `media` de movimiento reducido y `data-media`, `<img>` con GIF de 1 × 1 en `data:`, `alt=""`, `width`/`height` de T013, `decoding="async"`, `fetchpriority="high"`, `onload` que marca `data-abierto-listo`; **sin** `loading="lazy"` ni `display: none`); (b) en el script en línea del `<head>` poner `data-transicion` solo cuando el modo resultante sea `estatico` y no haya movimiento reducido (≈ +80 bytes). Depende de T013.
- [ ] T015 [US2] En `css/estilos.css` (contrato §3 y §4.2–4.3): `--listo: 0` en `html` y `1` con `html[data-abierto-listo]`; constantes `--abierto-izq/-arr/-ancho/-alto` y `--despl-x/-y` en `.hero__figura` con los valores de T013; `--t = smoothstep(clamp(var(--apertura) / .7))` con `calc` en `.hero`; póster `opacity: calc(1 − var(--t) * var(--listo))` y traslación `t·Δ` (conservando su `transition: opacity`); `.hero__abierto` posicionado con `--abierto-*`, `opacity: var(--t)` y traslación `(t − 1)·Δ`; con `.hero__figura.is-3d` ambos a `opacity: 0`. Anclaje: `html[data-transicion] .hero { padding-bottom: var(--recorrido); background-color: var(--color-velo-fondo) }` con `--recorrido: 80svh` (admitido 60–100 svh) y `html[data-transicion] .hero__escenario { position: sticky; top: 0 }` (`top: var(--alto-header)` desde 1024 px), altura constante del escenario. Verificar que `main`, `body` y los ancestros no tengan `overflow` distinto de `visible` y que `.hero__contacto`, la barra fija y el botón flotante conserven `z-index`/`position: fixed`. Solo `opacity` y `transform` animados. Depende de T009, T014.
- [ ] T016 [US2] En `js/principal.js` crear `controlarTransicionScroll(hero)` (contrato §5, data-model §3): si `html[data-transicion]`, `D = hero.offsetHeight − escenario.offsetHeight`, `objetivo = acotar(pageYOffset / D)` (**siempre acotado a [0, 1]**), valor mostrado que se acerca con `k = 1 − Math.exp(−12·dt)` mientras `|dif| > 0.0005`, escritura de `--apertura` en `.hero` con `toFixed(3)` y de `data-revelado` con la histéresis existente (`UMBRAL_REVELADO_ON` 0,5 / `UMBRAL_REVELADO_OFF` 0,45); un solo `scroll` pasivo que agenda un `requestAnimationFrame`; pausa con `IntersectionObserver` cuando el hero sale de pantalla; recalcula `D` con `ResizeObserver`. Sin tocar el scroll nativo. Depende de T015.
- [ ] T017 [US2] En `js/principal.js` crear `habilitarImagenAbierta(hero, motivo)` (contrato §5): recorre los `<source>` de `.hero__abierto` y hace `s.media = s.dataset.media`; cuándo: tras `load` + inactividad (`requestIdleCallback` con respaldo de `setTimeout`), y con ahorro de datos (`navigator.connection.saveData`) en el primer `scroll`; escuchar `error` del `<img>` y, si la imagen era real, marcar `data-abierto-fallo`. Conectar ambas funciones en `iniciarDentadura()` para el modo `estatico` con `data-transicion`, sin alterar la ruta del 3D ni el bloqueo de introducción. Depende de T016.
- [ ] T018 [US2] Ejecutar `hero.mjs comparar` (fase 1) en los 6 tamaños (silueta del abierto ≤ 2 %; cajas de eslogan y botón idénticas) y corregir `--despl-*`, `--abierto-*` o el CSS donde haga falta. Depende de T017.
- [ ] T019 [US2] Verificar E2 con `--perfil ahorro-datos` y el navegador: 0/25/50/75/100 % y regreso, scroll rápido y con inercia, `Espacio`/`Fin`, barra de scroll, «Servicios» del menú a mitad de transición; **casos límite**: zoom 200 %, 768 × 1024 y 1024 × 768, rotación a mitad, recarga ya desplazada, regreso por `#inicio`, 360 px en las tres fases (SC-010); contacto y teclado (Tab alcanza «Conoce nuestros servicios» con `apertura = 0` y lo muestra con foco; el botón solo es pulsable con `data-revelado`); fluidez con grabación de rendimiento (≥ 55 fps escritorio, ≥ 30 fps con CPU 4×). Capturar el punto medio: si hay doble perfil o «teletransporte» (FR-006), ajustar `Δ` y, si no basta, registrar en `verificacion.md` la decisión de pasar a 5–8 fotogramas intermedios. Registrar todo. Depende de T018.

**Checkpoint**: la transición por scroll funciona y es reversible. Falta el fondo (US3) para publicar.

---

## Phase 5: User Story 3 — Fondo nítido adaptado a PC y a móvil (Priority: P1)

**Goal**: dos fondos propios (apaisado y vertical), nítidos, con las zonas de texto lo bastante claras para el contraste, y una sola descarga por dispositivo.

**Independent Test**: a 1920 × 1080 y 390 × 844, sin pixelado ni bandas al 100 % y al 200 %, contraste ≥ 4,5 : 1 en cada texto y una única versión del fondo en la pestaña de red (E3). Puede avanzar en paralelo con la Fase 4; la medición (T021) necesita el layout de T009.

- [ ] T020 [P] [US3] Crear `referencias/herramientas/generar-fondo.py` (camino A, research R7): lee `assets/img/fondo-hero-estatico.jpg` y el token `--color-velo-fondo` de `css/estilos.css` (sin color literal en el script), suaviza los bloques JPEG, recorta/amplía a **1920 × 1080** (PC) y **828 × 1792** (móvil, composición vertical propia), reafina los hilos, añade ruido mínimo anti-bandas, aclara la banda oscura horizontal y funde el ≈ 8 % superior e inferior al color del token. Escribe `assets/img/fondo-hero-pc.webp` (**≤ 80 KB**) y `assets/img/fondo-hero-movil.webp` (**≤ 50 KB**).
- [ ] T021 [US3] Añadir `--medir` a `generar-fondo.py` y decidir el camino: ejecutar `hero.mjs cajas` y leer `salida/cajas-*.json` para calcular, por caja y tamaño, la luminancia mínima del fondo y el contraste contra el color real del texto (leído del CSS); umbrales de research R7 (4,5 : 1): horario `#5A5A5A` → L ≥ 0,64; título y eslogan `#0B5252` → L ≥ 0,48; teléfono `#2C2C2C` → L ≥ 0,29. Revisar los WebP a tamaño real y al 200 %; si algo falla SC-005 o FR-011, implementar `--camino b` (velos con degradados suavizados + hilos dibujados a la resolución final con antialiasing, misma paleta) y volver a medir. Registrar la decisión en `verificacion.md`; si se usa B, avisar al cliente de que el fondo es una recomposición de su imagen. Depende de T006, T009, T020.
- [ ] T022 [US3] Aplicar el fondo: en `css/estilos.css`, `.hero__escenario { background-color: var(--color-velo-fondo); background-size: cover; background-position: center }` con `url(../assets/img/fondo-hero-movil.webp)` bajo `@media (orientation: portrait)` y `url(../assets/img/fondo-hero-pc.webp)` bajo `@media (orientation: landscape)`; eliminar los tres `linear-gradient` de velos y, si tras `grep` no se usan, los tokens `--velo-1-suave`/`--velo-2-suave`. En `index.html`, `<link rel="preload" as="image">` del fondo con `media="(orientation: portrait)"` y `media="(orientation: landscape)"`. Depende de T021.
- [ ] T023 [US3] Verificar E3: nitidez y composición a 1920 × 1080 y 390 × 844; `--medir` en los 6 tamaños; una sola versión del fondo en la red y re-encuadre sin deformar al rotar; en móvil con el hero anclado, la franja entre el escenario y la barra fija se funde con el fondo (si no, ajustar los bordes en T020). Registrar en `verificacion.md`. Depende de T022 y, para el anclaje, de T015.
- [ ] T024 [US3] Mover `assets/img/fondo-hero-estatico.jpg` a `referencias/herramientas/fuentes/fondo-hero-estatico.jpg` y actualizar la ruta en `generar-fondo.py`, para que `assets/img/` contenga solo lo que sirve el sitio. Depende de T023.

**Checkpoint**: MVP completo (US1 + US2 + US3), verificable con E1–E3.

---

## Phase 6: User Story 4 — Movimiento reducido, ahorro de datos y fallos (Priority: P2)

**Goal**: con movimiento reducido (o sin JS, o móvil apaisado bajo, o 3D fallido) se ve la composición final sin animación; con ahorro de datos la imagen abierta se pide al desplazarse; si falla, el hero sigue completo.

**Independent Test**: con `--perfil movimiento-reducido` ningún píxel del hero cambia por scroll o cursor; con la imagen abierta bloqueada el hero sigue completo (E4 y E5).

- [ ] T025 [US4] En `css/estilos.css` (contrato §4.4, 4.5, 4.9): `@media (prefers-reduced-motion: reduce)` → sin `transition` en el hero ni en `.hero__canvas`, sin anclaje (`position: static`, `padding-bottom: 0`) y `--apertura: 1`; `@media (orientation: landscape) and (max-height: 500px)` → sin anclaje ni recorrido; `html[data-abierto-fallo] .hero__revelado { --rev-eslogan: 1; --rev-boton: 1 }` con botón pulsable y póster visible, con el halo claro del eslogan. En `index.html`, `preload` del cráneo cerrado con `media="(prefers-reduced-motion: no-preference)"` y `preload` del abierto con `media="(prefers-reduced-motion: reduce) and (min-width: 1024px)"` (escritorio) y `media="(prefers-reduced-motion: reduce) and (max-width: 1023.98px)"` (móvil). Depende de T015.
- [ ] T026 [US4] En `js/principal.js` (contrato §5): (a) si se activa `prefers-reduced-motion` o se entra en móvil apaisado bajo (`CONSULTA_APAISADO_BAJO`, `matchMedia` con `change`) estando en modo transición, desactivar `controlarTransicionScroll`, quitar `data-transicion`, escribir `--apertura: 1` en línea y llamar a `habilitarImagenAbierta`; (b) al degradar el 3D a `estatico` en caliente (WebGL ausente, modelo fallido, contexto perdido, reducir movimiento en vivo, FPS bajos) escribir `--apertura: 1`, llamar a `habilitarImagenAbierta` de inmediato y retirar el canvas **sin** añadir `data-transicion`, anclaje ni recorrido; el póster cerrado permanece visible hasta `data-abierto-listo` (no se mueven cráneo, cabecera ni contacto). Depende de T017.
- [ ] T027 [US4] Verificar E4 y E5 con los perfiles de `hero.mjs`: movimiento reducido (imagen abierta pedida enseguida y sin `lazy`; red 3G: el cerrado se ve hasta que llega el abierto; 0 px de cambio por scroll/cursor; activarlo en vivo), `ahorro-datos` (solo fondo y cerrado hasta el primer scroll), imagen abierta bloqueada, `.glb` bloqueado y `WEBGL_lose_context`, y Tab hasta «Conoce nuestros servicios» y «Agende su cita». Corregir y registrar en `verificacion.md`. Depende de T025, T026.

**Checkpoint**: todos los modos degradan a una composición completa y usable.

---

## Phase 7: User Story 5 — Relevo suave entre el hero estático y el 3D (Priority: P3)

**Goal**: mientras el 3D carga, la composición estática sigue el progreso del bloqueo; al llegar el 3D no hay parpadeo ni desplazamiento.

**Independent Test**: en un equipo capaz con red limitada, hacer scroll en cuanto aparece la página, antes de que cargue el 3D (E7).

- [ ] T028 [US5] En `js/principal.js` añadir a `habilitarImagenAbierta` el motivo `3d`: en modo `animado`, escuchar `dentadura:apertura` y, cuando `--apertura > 0` y aún no exista `.is-3d` en la figura, activarla (si el 3D ya está listo no se pide). Depende de T017.
- [ ] T029 [US5] Verificar E7: con red limitada, abrir con el scroll de introducción antes de que cargue el 3D y comprobar que el cráneo estático se abre en sincronía; al llegar el 3D, con `hero.mjs`/CDP medir que cráneo, cabecera y contacto no se mueven (0 px) y no hay parpadeo; valorar el fundido de 0,4 s del fondo (imagen → velos) y registrar si es aceptable (si no, abrir una spec para usar la imagen también en el 3D). Depende de T028, T023.

**Checkpoint**: las cinco historias funcionan de forma independiente.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T030 [P] Documentar: nota al inicio de `specs/001-dentadura-3d-hero/spec.md` indicando que su FR-002, FR-009(a), FR-010, FR-012 y FR-013 para la versión estática quedan sustituidos por la spec 002; actualizar `assets/models/README.md` con las imágenes de cráneo (cerrado y dos variantes del abierto) y cómo regenerarlas con `referencias/herramientas/`.
- [ ] T031 Medir pesos y carga (E6) en los tres modos (3D, transición, final) a 360 × 740 y 1440 × 900 con *Fast 4G*, CPU 4× y caché desactivada: carga crítica ≤ 500 KB, fondos ≤ 80/50 KB, cráneos ≤ 60 KB, 0 peticiones externas, LCP < 2,5 s, CLS ≈ 0, Lighthouse móvil ≥ 90; comprobar en Chrome, Firefox y Safari que, en los modos diferidos, la imagen real del abierto solo se pide tras `habilitarImagenAbierta` y que cambiar `source.media` dispara la carga (si alguno no, asignar `srcset` desde `js/principal.js`). Registrar en `verificacion.md`. Depende de T027, T029.
- [ ] T032 Prueba en **móvil real** (principio IX): transición por scroll con ahorro de datos (inercia, barra de direcciones que cambia `svh`, rotación), contacto siempre accesible, movimiento reducido; afinar `--recorrido` (60–100 svh) y registrar el valor final. Depende de T027.
- [ ] T033 Cierre: regresión del 3D (repetir la captura de T008 y comparar: diferencia nula salvo el fondo inicial); `grep` de colores literales en `css/estilos.css` y `js/` (ninguno nuevo fuera de `:root`), reglas CSS muertas de la disposición estática antigua y tokens sin uso; comprobar que `/referencias/*` responde 404 y que `assets/img/` solo contiene archivos que usa el sitio; ejecutar el quickstart completo (E1–E9), cerrar `verificacion.md` y revisar los nueve principios. Depende de T030–T032.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Fase 1**: sin dependencias. T002 y T003 (enmienda y D-19) **deben estar hechas antes** de la Fase 2.
- **Fase 2**: depende de la Fase 1; **bloquea** todas las historias.
- **US1 (Fase 3)**: depende de la Fase 2.
- **US2 (Fase 4)**: depende de US1 (T009 para la rejilla) y de la Fase 2.
- **US3 (Fase 5)**: T020 puede empezar tras la Fase 2; T021 necesita T006 (`cajas`) y T009 (layout); T023 necesita T015 para la parte del anclaje.
- **US4 (Fase 6)**: depende de US2.
- **US5 (Fase 7)**: depende de US2 (T017) y de US3 (T023).
- **Polish (Fase 8)**: depende de las historias deseadas; T030 puede hacerse tras US2.

### Within Each Story

- Capturas → codificación → HTML → CSS → JS → verificación.
- `css/estilos.css`, `js/principal.js`, `index.html` y `hero.mjs` se editan en varias tareas: las tareas que comparten archivo **no** son paralelas.

### Parallel Opportunities

- Fase 1: T002, T003 y T004.
- Fase 2: T006 y T007 (archivos nuevos distintos) mientras se hace T005.
- Fases 4 y 5: T020 (generador de fondo) en paralelo con T013–T017.
- Fase 8: T030 en paralelo con T031–T032.

---

## Parallel Example

```text
# Fase 1, en paralelo:
Task: "T002 Enmienda constitucional v2.4.0 en .specify/memory/constitution.md"
Task: "T003 D-19 en SPEC.md"
Task: "T004 README y .gitignore de referencias/herramientas/"

# Fase 2, tras T005, en paralelo:
Task: "T006 Crear referencias/herramientas/hero.mjs"
Task: "T007 Crear referencias/herramientas/codificar-craneo.py"

# Con US2 en marcha, en paralelo:
Task: "T016 controlarTransicionScroll en js/principal.js"
Task: "T020 generar-fondo.py (US3)"
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3)

1. Fase 1 (gobernanza) y Fase 2 (herramientas y línea base).
2. US1: disposición única + cráneo cerrado; comprobar posiciones.
3. US2: cráneo abierto + transición; comprobar E1 fase 1 y E2.
4. US3: fondos PC/móvil; comprobar E3.
5. **PARAR y VALIDAR** el conjunto: es lo mínimo publicable.

### Incremental Delivery

1. Fases 1–2 → herramientas listas.
2. US1 → hero estático cerrado con la posición del 3D (no publicar solo).
3. US2 → transición por scroll.
4. US3 → fondo nuevo → **primer lanzamiento posible**.
5. US4 → modos finales y fallos.
6. US5 → relevo suave al 3D.
7. Polish → pesos, móvil real y cierre.

### Notas

- Los límites de este documento salen del spec, el plan, el modelo de datos y el contrato; si una medición los contradice, cambiar primero el documento correspondiente.
- Commit tras cada tarea o grupo lógico; no modificar el comportamiento por defecto del 3D (verificado en T008 y T033).
- Riesgos abiertos del plan con tarea de verificación: calidad del fondo (T021), difuminado en ventanas intermedias (T011, T018, T023), doble perfil (T019), franja inferior en móvil (T023), cambio de `media` en `<source>` (T031), fondo del relevo (T029) y distancia `--recorrido` (T032).
