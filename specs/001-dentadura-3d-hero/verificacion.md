# Verificación — Cráneo 3D en rayos X en el hero

**Fecha**: 2026-10-17 · **Entorno**: navegador integrado de Claude Code (Chromium, WebGL por software), `python -m http.server 5173`. No sustituye a la prueba en móvil real (T042) ni a Lighthouse (T038).

## Resultados

| Tarea | Resultado | Detalle |
|---|---|---|
| T030 | ✅ escritorio · ⚠️ reduced-motion solo por lectura de CSS | Clic en «Conoce nuestros servicios» → `#servicios` queda a 92 px del borde superior, por debajo del header (77 px): `scroll-margin-top` correcto. Con `prefers-reduced-motion` el CSS fija `scroll-behavior: auto` (`css/estilos.css:114-120`); no se pudo emular la preferencia en el panel. |
| T031 | ✅ parcial | 1440×800: «Agende su cita», teléfono y botón flotante visibles con el hero cerrado y con la mandíbula abierta, sin solaparse. 1280×760 (apertura 0,73): eslogan, botón, contacto y flotante visibles. 360×640: con el hero cerrado, contacto y barra fija visibles (barra en 580–640 px, CTA 418–481). **Falta**: 360 px con apertura 50 %/100 % en 3D real (el panel degradó a estático, ver abajo). |
| T036 | ⚠️ parcial | Modo estático forzado por la guardia de fps en 360 px: layout correcto, sin scroll horizontal, eslogan y botón visibles en flujo normal. **Falta**: reduced-motion real, GLB bloqueado, WebGL desactivado, pérdida de contexto. |
| T037 | ✅ peso · ⏳ triángulos | Ver «Peso». 0 peticiones a otros dominios (`performance.getEntriesByType('resource')` y `grep` de `googleapis`/`gstatic`/`cdn.` sin coincidencias). Triángulos sin medir. |
| T041 | ✅ parcial | Sin colores literales fuera de `:root` en `css/estilos.css` (todos entre las líneas 36–75) ni en `js/dentadura.js`. Licencias: `assets/js/vendor/LICENSE-three.txt` y `assets/fonts/LICENSE.txt` presentes. Autoría del modelo confirmada el 2026-10-20 (T047). |

## Peso (bytes sin comprimir, servidor local)

- **Crítica**: HTML 22 978 + CSS 19 739 + `principal.js` 16 204 + Poppins 700 7 816 + Inter 400 48 256 + póster 24 532 ≈ **139 KB** (límite 500 KB). Poppins 600 (8 000) se pide después.
- **Diferido completo**: `three-dentadura.min.js` 641 109 + `craneo.glb` 213 864 ≈ **835 KB** (límite 1,5 MB; ≈ 139 KB brotli el bundle según plan).
- **Diferido ligero**: 641 109 + `craneo-ligero.glb` 75 572 ≈ **700 KB**.

## Comportamiento observado

- 1280×760: `data-hero="animado"`, canvas `is-listo`, figura `is-3d`, consola sin mensajes, todo 200 OK. Un desplazamiento de rueda abrió la mandíbula (`--apertura` 0,73) y reveló eslogan y botón (opacidad 1) con `scrollY = 0` (bloqueo de introducción activo).
- 360×640 emulando táctil: carga `craneo-ligero.glb` (nivel ligero). Pasados unos segundos la guardia de fluidez (< 24 fps, T033) pasó a `data-hero="estatico"` y retiró el canvas: es el comportamiento de diseño, causado aquí por el renderizado por software del panel.

## Clic para abrir/cerrar (FR-018, T051) — 2026-10-17

Navegador integrado, 1280×760 y 360×640 (táctil emulado):

- Clic en el cráneo con el hero cerrado → `--apertura` 1,0, `aria-pressed=true`, eslogan y botón revelados, bloqueo liberado, `scrollY` sin cambios. Segundo clic → `--apertura` 0, `aria-pressed=false`, bloqueo rearmado en lo alto.
- Intro y Espacio sobre la figura enfocada abren y cierran; Espacio no desplaza la página. Doble clic rápido → termina cerrado. Tras cerrar, la rueda vuelve a abrir (bloqueo de introducción).
- Orden de Tab: figura → «Conoce nuestros servicios»; anillo de foco visible (2,4 px, `--color-acento-oscuro`). Pulsar el botón de servicios no alterna la mandíbula.
- Al emitirse `dentadura:estado = estatico` se retiran `role`/`tabindex`/`aria-*` y el clic deja de actuar.
- 360×640: toque abre y segundo toque cierra; sin scroll horizontal; consola sin errores.
- Sin comprobar: toque físico en Android/iOS, lector de pantalla.

## Prueba en móvil real — 2026-10-19 (T042 parcial, T050 parcial)

**Dispositivo**: OnePlus Nord CE 3 Lite 5G, OxygenOS 15, 8 GB de RAM; Chrome y Startpage, vía Wi-Fi (servidor local).

| Prueba | Resultado |
|---|---|
| E1 carga y paso póster → 3D | ✅ cráneo inmediato, sin salto de tamaño/posición, texto sin moverse |
| E3 apertura con el dedo | ✅ lento e inercia; ⚠️ un deslizamiento **rápido** necesitaba varios gestos (corregido, ver abajo) |
| FR-018 toque abre/cierra, arrastre tras cerrar, botones no mueven la mandíbula | ✅ |
| E4 contacto, WhatsApp con mensaje, «Conoce nuestros servicios» sin tapar | ✅ |
| E7 fluidez | ✅ fluido (solo probado en este equipo; falta uno modesto) |
| E8 rotación | ❌ en horizontal el hero quedaba diminuto y sin botones (corregido, ver abajo); el zoom de letra pide más gestos para abrir pero se lee bien |
| T050 TalkBack | ✅ anuncia «Abrir o cerrar la mandíbula» como botón con estado; sin aviso del canvas |
| Salidas del bloqueo | ✅ no atrapa |
| E5 movimiento reducido | ✅ solo póster, eslogan y botón visibles; ⚠️ el diseño estático necesita rediseño (pendiente) |
| Ahorro de datos | ⚠️ siguió mostrando el 3D (el equipo es potente; el navegador probablemente no expone `saveData`) |
| Actualizar la página | ❌ el gesto de tirar hacia abajo movía el modelo en vez de refrescar (corregido, ver abajo) |

### Correcciones (2026-10-19, T052)

- **Horizontal** (`orientation: landscape` y alto ≤ 500 px): el hero mide lo que necesita (≥ 26 rem), la figura se acota a 17 rem, no hay bloqueo de introducción y la mandíbula arranca abierta. Emulado a 800×330: eslogan, «Conoce nuestros servicios», «Agende su cita», teléfono y barra fija alcanzables; sin scroll horizontal.
- **Refrescar**: un arrastre hacia abajo (> 1,5 px) con la boca cerrada y la página en lo alto ya no se intercepta, así que el navegador puede refrescar. Probado con eventos táctiles sintéticos: `defaultPrevented = false` y apertura sin cambios. **Falta confirmarlo con el dedo en el móvil.**
- **Deslizamiento rápido**: al soltar se añade un impulso (velocidad × 400 ms, mínimo 0,3 px/ms). Sintético: 20 px en 16 ms → apertura 0,81 (antes ≈ 0,05); un arrastre lento y corto sigue sin impulso (0,026).

### Confirmación de las correcciones en el móvil real — 2026-10-19

Mismo OnePlus Nord CE 3 Lite 5G:

- Horizontal: ✅ se ve el hero completo y se puede bajar.
- Refrescar: ✅ con el cráneo cerrado y en lo alto actualiza la página. También actualiza a veces con el cráneo **abierto**: es el gesto nativo del navegador al estar en lo alto con el bloqueo ya liberado (comportamiento esperado, no se intercepta).
- Deslizamiento rápido: ✅ un solo gesto abre la mandíbula.
- Toque para abrir/cerrar: ✅ sigue bien.

## Sin verificar (requiere dispositivo real o herramientas que no se han instalado)

- T038 Lighthouse, T039 (resto de anchos, zoom 200 %, Tab), T042 y T050 (móvil real, táctil, lector de pantalla), recuento de triángulos, 3D a 360 px con apertura, encuadre póster↔3D a 360 px (en la captura del póster y del 3D a 360 px la figura se ve con distinto tamaño: revisar en móvil real).
- T048 depende del cliente.
