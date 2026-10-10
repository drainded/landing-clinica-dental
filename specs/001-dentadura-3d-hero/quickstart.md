# Quickstart — Validar la dentadura 3D del hero

Guía de validación de extremo a extremo. No contiene código de implementación (ver `tasks.md`).

## Prerrequisitos

- Node.js (solo para servir de forma local): `npx serve .` desde la raíz (puerto por defecto 3000). Los módulos ES y el GLB requieren HTTP, no `file://`.
- Chrome/Edge con DevTools; Lighthouse (pestaña o `npx lighthouse`).
- Un móvil real o emulación 360×640; para peso: DevTools → Network → "Fast 4G" y *Disable cache*.

## Escenarios

### E1 — Primer pintado y LCP (US1, SC-001, SC-007)
1. Network "Fast 4G", CPU 4× slowdown, 360×640, recarga forzada.
2. **Esperado**: la dentadura cerrada (póster) aparece sin esperar al 3D; el LCP es el póster (< 2,5 s); CLS ≈ 0; sin hueco al sustituirse por el canvas.
3. Capturar un píxel del contorno en el canvas: **`#0F6E6E` exacto** (comparar con la captura del póster).

### E2 — Deformación (US2, SC-003)
1. Escritorio: mover el cursor sobre los dientes y fuera de la figura.
2. **Esperado**: deformación local suave con radio acotado; el contorno acompaña; al salir (o al salir de la ventana) vuelve a su forma en < 1 s; nunca se ve rota.
3. Móvil emulado táctil: tocar y arrastrar sobre la figura; el scroll vertical sigue funcionando.

### E3 — Apertura por scroll (US3, SC-002)
1. Scroll 0 → 100 % del hero lento, rápido y con inercia, y de regreso.
2. **Esperado**: mandíbula cerrada → ≈ 40° → cerrada; sin saltos; `getComputedStyle(inicio).getPropertyValue('--apertura')` va de 0 a 1.

### E4 — Eslogan y «Servicios» (US4, SC-009)
1. Con la mandíbula cerrada: eslogan y botón no visibles; «Agende su cita», teléfono y horario sí.
2. Abrir la mandíbula: eslogan y botón se revelan; pulsar «Servicios» (y con Enter por teclado) desplaza a `#servicios`.
3. Tab desde el inicio: el foco alcanza «Servicios» y lo hace visible.
4. **Esperado**: en todo momento «Agende su cita», el teléfono y la barra fija (móvil)/botón flotante (≥ 1024 px) visibles y pulsables.

### E5 — Movimiento reducido y degradación (US5, SC-004, SC-008)
1. DevTools → Rendering → *Emulate CSS prefers-reduced-motion: reduce*; recargar.
2. **Esperado**: no hay petición a `three-dentadura.min.js` ni a `.glb`; póster fijo; eslogan y «Servicios» visibles; mover cursor y hacer scroll no cambia ningún píxel de la figura (comparar capturas antes/después).
3. Bloquear `assets/models/*.glb` en DevTools (o desactivar WebGL con `chrome://flags`): la página queda completa con el póster y el eslogan visibles; mientras el hero siga en modo animado, el eslogan y «Servicios» también aparecen al hacer scroll (el revelado no depende del 3D).
4. Pérdida de contexto: en consola `canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()` → vuelve al póster sin errores.

### E6 — Presupuesto (SC-005)
1. Network, *Disable cache*, recarga: anotar peso transferido **hasta `load`** (carga crítica) y total tras la idle.
2. **Esperado**: crítica ≤ 500 KB (HTML + CSS + `principal.js` + fuentes + póster); diferido ≤ 1,5 MB (librería + GLB); total ≈ 2 MB escritorio / ≈ 1,5 MB móvil; **0 peticiones a otro dominio** (filtro "Domain" en Network).
3. Triángulos: comprobar con `renderer.info.render.triangles` ≤ 50 000 (completo) / ≈ 15 000 (ligero).

### E7 — Fluidez y pausa (principio VII)
1. Performance → grabar 10 s de scroll + movimiento: ≥ 55 fps escritorio; con CPU 4× ≥ 30 fps.
2. Cambiar de pestaña y volver; hacer scroll más allá del hero: el bucle se pausa (sin trabajo de GPU) y se reanuda.

### E8 — Responsive y zoom (RF-08)
1. 360, 390, 768, 1024 y 1440 px; rotación; zoom del navegador al 200 %.
2. **Esperado**: sin desplazamiento horizontal; figura completa a lo ancho; abierta, cabe en alto; grosor del contorno constante en px.

### E9 — Lighthouse móvil (SC-007)
- Rendimiento ≥ 90, Accesibilidad sin fallos de contraste ≥ 4,5:1, SEO sin regresiones (`<h1>` único, JSON-LD intacto).

## Registro de resultados

Anotar en `specs/001-dentadura-3d-hero/verificacion.md` (se crea al implementar) el peso real medido, fps, y el resultado de cada escenario con fecha y dispositivo (principio IX).
