# Verificación — Cráneo 3D en rayos X en el hero

**Fecha**: 2026-10-17 · **Entorno**: navegador integrado de Claude Code (Chromium, WebGL por software), `python -m http.server 5173`. No sustituye a la prueba en móvil real (T042) ni a Lighthouse (T038).

## Resultados

| Tarea | Resultado | Detalle |
|---|---|---|
| T030 | ✅ escritorio · ⚠️ reduced-motion solo por lectura de CSS | Clic en «Conoce nuestros servicios» → `#servicios` queda a 92 px del borde superior, por debajo del header (77 px): `scroll-margin-top` correcto. Con `prefers-reduced-motion` el CSS fija `scroll-behavior: auto` (`css/estilos.css:114-120`); no se pudo emular la preferencia en el panel. |
| T031 | ✅ parcial | 1440×800: «Agende su cita», teléfono y botón flotante visibles con el hero cerrado y con la mandíbula abierta, sin solaparse. 1280×760 (apertura 0,73): eslogan, botón, contacto y flotante visibles. 360×640: con el hero cerrado, contacto y barra fija visibles (barra en 580–640 px, CTA 418–481). **Falta**: 360 px con apertura 50 %/100 % en 3D real (el panel degradó a estático, ver abajo). |
| T036 | ⚠️ parcial | Modo estático forzado por la guardia de fps en 360 px: layout correcto, sin scroll horizontal, eslogan y botón visibles en flujo normal. **Falta**: reduced-motion real, GLB bloqueado, WebGL desactivado, pérdida de contexto. |
| T037 | ✅ peso · ⏳ triángulos | Ver «Peso». 0 peticiones a otros dominios (`performance.getEntriesByType('resource')` y `grep` de `googleapis`/`gstatic`/`cdn.` sin coincidencias). Triángulos sin medir. |
| T041 | ✅ parcial | Sin colores literales fuera de `:root` en `css/estilos.css` (todos entre las líneas 36–75) ni en `js/dentadura.js`. Licencias: `assets/js/vendor/LICENSE-three.txt` y `assets/fonts/LICENSE.txt` presentes. **Pendiente**: autoría del modelo (T047). |

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

## Sin verificar (requiere dispositivo real o herramientas que no se han instalado)

- T038 Lighthouse, T039 (resto de anchos, zoom 200 %, Tab), T042 y T050 (móvil real, táctil, lector de pantalla), recuento de triángulos, 3D a 360 px con apertura, encuadre póster↔3D a 360 px (en la captura del póster y del 3D a 360 px la figura se ve con distinto tamaño: revisar en móvil real).
- T047 y T048 dependen del cliente.
