# Quickstart — Validar el cráneo 3D y los velos del hero

Guía de validación de extremo a extremo. No contiene código de implementación (ver `tasks.md`).

## Prerrequisitos

- Servir de forma local desde la raíz (por ejemplo `python -m http.server 5173`, que es lo que usa `.claude/launch.json`, o `npx serve .`). Los módulos ES y el GLB requieren HTTP, no `file://`.
- Chrome/Edge con DevTools; Lighthouse (pestaña o `npx lighthouse`).
- Un móvil real o emulación 360×640; para peso: DevTools → Network → "Fast 4G" y *Disable cache*.

## Escenarios

### E1 — Primer pintado y LCP (US1, SC-001, SC-007)
1. Network "Fast 4G", CPU 4× slowdown, 360×640, recarga forzada.
2. **Esperado**: el cráneo cerrado (póster) sobre el degradado de velos aparece sin esperar al 3D; el LCP es el póster (< 2,5 s); CLS ≈ 0; sin hueco al sustituirse por el canvas.
3. Superponer el póster al 50 % sobre el 3D (DevTools: `opacity` del `.hero__poster` con `transition: none` y `mix-blend-mode: normal`): el cráneo cerrado coincide con el póster (desvío de pocos píxeles). Comprobar que los colores del canvas corresponden a los tokens (`--color-rayosx`, `--color-velo-*`).

### E2 — Velos y cursor (US2, SC-003)
1. Escritorio: mover el cursor por el hero, rápido y despacio, y sacarlo de la ventana.
2. **Esperado**: los velos se desplazan con paralaje y se curvan junto al cursor, fluyen más rápido si el cursor se mueve rápido; el cráneo se inclina hacia él; al salir de la ventana todo vuelve al reposo en < 1 s; el texto sigue legible.
3. Móvil emulado táctil: tocar y arrastrar sobre el hero; el scroll vertical sigue funcionando.

### E3 — Bloqueo de introducción y apertura (US3, SC-002)
1. Recargar con la página en lo alto. Dar un gesto de scroll **largo y rápido** (rueda, dedo en móvil emulado, Fin/Espacio).
2. **Esperado**: la página no se desplaza (`scrollY` = 0, `<html data-bloqueo>`); la mandíbula tarda ≥ ~0,8 s en abrirse del todo, el modelo se difumina bajo los textos y aparecen eslogan y botón; al terminar desaparece `data-bloqueo` y el siguiente scroll desplaza la página con normalidad.
3. **Salidas**: en una recarga nueva, con el bloqueo activo, pulsar Tab → se libera; repetir con un clic en «Servicios» del menú, arrastrando la barra de scroll y cargando `/#servicios` (sin bloqueo y con la boca abierta). Con *prefers-reduced-motion* nunca hay bloqueo.
4. **Contacto**: durante el bloqueo, la barra fija/botón flotante, el teléfono y «Agende su cita» siguen pulsables.

### E4 — Eslogan y «Conoce nuestros servicios» (US4, SC-009)
1. Con la mandíbula cerrada: eslogan y botón no visibles; «Agende su cita», teléfono y horario sí.
2. Abrir la mandíbula: el eslogan aparece sobre la bóveda y el botón en el hueco de la boca; pulsar el botón (y con Enter por teclado) desplaza a `#servicios`.
3. Tab desde el inicio: el foco alcanza «Conoce nuestros servicios» y lo hace visible.
4. **Esperado**: en todo momento «Agende su cita», el teléfono y la barra fija (móvil)/botón flotante (≥ 1024 px) visibles y pulsables.

### E5 — Movimiento reducido y degradación (US5, SC-004, SC-008)
1. DevTools → Rendering → *Emulate CSS prefers-reduced-motion: reduce*; recargar.
2. **Esperado**: no hay petición a `three-dentadura.min.js` ni a `.glb`; póster fijo sobre el degradado de velos; eslogan y «Conoce nuestros servicios» visibles; mover cursor y hacer scroll no cambia ningún píxel del hero (comparar capturas antes/después). Activar la preferencia con la página ya abierta: vuelve al póster.
3. Bloquear `assets/models/*.glb` en DevTools (o desactivar WebGL con `chrome://flags`): la página queda completa con el póster y el eslogan visibles; mientras el hero siga en modo animado, el eslogan y «Servicios» también aparecen al hacer scroll (el revelado no depende del 3D).
4. Pérdida de contexto: en consola `canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()` → vuelve al póster sin errores.

### E6 — Presupuesto (SC-005)
1. Network, *Disable cache*, recarga: anotar peso transferido **hasta `load`** (carga crítica) y total tras la idle.
2. **Esperado**: crítica ≤ 500 KB (HTML + CSS + `principal.js` + fuentes + póster); diferido ≤ 1,5 MB (librería + GLB); total ≈ 2 MB escritorio / ≈ 1,5 MB móvil; **0 peticiones a otro dominio** (filtro "Domain" en Network).
3. Triángulos: ≈ 41 000 (`craneo.glb`) y ≈ 12 300 (`craneo-ligero.glb`), según los accesores del GLB (≤ 50 000 / ≈ 15 000).

### E7 — Fluidez y pausa (principio VII)
1. Performance → grabar 10 s de scroll + movimiento: ≥ 55 fps escritorio; con CPU 4× ≥ 30 fps.
2. Cambiar de pestaña y volver; hacer scroll más allá del hero: el bucle se pausa (sin trabajo de GPU) y se reanuda.

### E8 — Responsive y zoom (RF-08)
1. 360, 390, 768, 1024 y 1440 px; rotación; zoom del navegador al 200 %.
2. **Esperado**: sin desplazamiento horizontal; figura completa a lo ancho, cerrada y abierta; en móvil, tras fijarse el escenario, se ven logo, título, cráneo, «Agende su cita», teléfono y horario sobre la barra fija.

### E9 — Lighthouse móvil (SC-007)
- Rendimiento ≥ 90, Accesibilidad sin fallos de contraste ≥ 4,5:1, SEO sin regresiones (`<h1>` único, JSON-LD intacto).

## Registro de resultados

Anotar en `specs/001-dentadura-3d-hero/verificacion.md` (se crea al implementar) el peso real medido, fps, y el resultado de cada escenario con fecha y dispositivo (principio IX).
