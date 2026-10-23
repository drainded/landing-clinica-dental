# Quickstart — Validar el hero estático con transición por scroll

Guía de validación de extremo a extremo. No contiene código de implementación (ver `tasks.md`). Contratos: [contracts/hero-estatico.md](contracts/hero-estatico.md) · Datos: [data-model.md](data-model.md).

## Prerrequisitos

- Servir desde la raíz: `python -m http.server 5173` (lo que usa `.claude/launch.json`).
- Chrome con DevTools y Lighthouse; un móvil real o emulación 360 × 740 / 390 × 844.
- Herramientas de `referencias/herramientas/` (Node ≥ 22, Chrome instalado, Python con Pillow).
- Para forzar los modos de forma determinista usar `node referencias/herramientas/hero.mjs … --perfil <perfil>`: `ahorro-datos` (inyecta `navigator.connection.saveData = true`), `equipo-lento` (inyecta `deviceMemory = 1`) o `movimiento-reducido` (emulación de `prefers-reduced-motion`). A mano, en DevTools: *Rendering › prefers-reduced-motion: reduce* para movimiento reducido; Chrome no expone Save-Data como interruptor, así que para los otros dos modos hay que usar el perfil de la herramienta.

## Escenarios

### E1 — Posición igual que en el 3D (US1, US2, SC-001, SC-002)
1. Ejecutar `comparar-hero.mjs` para 360 × 740, 390 × 844, 768 × 1024, 1024 × 768, 1440 × 900 y 1920 × 1080.
2. **Esperado**: para la fase 0 (cerrado) y la fase 1 (abierto), la silueta del cráneo estático difiere de la del 3D ≤ 2 % del ancho de la figura; las cajas de cabecera, eslogan, botón y contacto son idénticas (0 px).
3. Revisión visual: superponer capturas al 50 % (estático / 3D) en 390 × 844 y 1440 × 900.

### E2 — Apertura con el bloqueo de introducción (US2, SC-003)
1. Modo *Save-Data*, equipo lento o movimiento reducido (cualquiera de los tres), recarga en lo alto: `hero.mjs bloqueo --perfil <perfil>` y, a mano, en móvil real.
2. Hacer gestos de rueda o táctiles **cortos** en lo alto de la página.
3. **Esperado**: la página no se desplaza (`scrollY` = 0, `<html data-bloqueo>`); la apertura sube poco a poco; el eslogan y el botón aparecen con opacidad creciente (valores intermedios a mitad de camino) y se mezclan el cráneo cerrado y el abierto; al completarse desaparece `data-bloqueo` y el siguiente gesto desplaza la página con normalidad; un gesto **muy largo** tarda ≥ ≈ 0,8 s en abrir por completo.
4. **Salidas**: Tab libera el bloqueo; también un clic en un ancla interna, la barra de scroll o cargar `/#servicios`. Al volver a lo alto el cráneo se cierra y el bloqueo se rearma.
5. **Contacto**: «Agende su cita», teléfono y barra fija/botón flotante siguen visibles y pulsables durante el bloqueo.

### E3 — Fondo y contraste (US3, SC-005)
1. 1920 × 1080 y 390 × 844: revisar el fondo a tamaño real y ampliado al 200 %.
2. Ejecutar `generar-fondo.py --medir`: contraste de `<h1>`, eslogan, botón, teléfono y horario sobre el compuesto del fondo (con y sin el cráneo abierto difuminado detrás).
3. **Esperado**: sin pixelado, bandas ni bloques; hilos nítidos; cada texto ≥ 4,5 : 1 (con las zonas de luminancia mínima de [research.md](research.md) R7); los bordes superior e inferior se funden con el color de fondo del hero.
4. Pestaña Network: solo se pide **una** versión del fondo (apaisada o vertical); rotar el dispositivo re-encuadra sin deformar.

### E4 — Movimiento reducido: el cambio de pose se ve igual (US4, SC-004)
1. *prefers-reduced-motion: reduce*, recarga.
2. **Esperado**: es el hero de imágenes (sin 3D; no hay petición de `three-dentadura.min.js`); al cargar se ve el cráneo cerrado con el hero anclado y, tras `load`, se pide la imagen del cráneo abierto; el scroll funde el cráneo cerrado con el abierto y aparecen el eslogan y el botón; mover el cursor no cambia ningún píxel del hero (comparar capturas).
3. Con la red a 3G lenta: hasta que llega el cráneo abierto se ve el cráneo cerrado, nunca el área vacía.
4. Activar la preferencia con la página ya abierta y el 3D mostrado: pasa al hero de imágenes con el cráneo cerrado (sin mover cabecera ni contacto) y la transición por scroll funciona.

### E5 — Ahorro de datos, fallos y degradación (US4, SC-008)
1. *Save-Data*: antes del primer scroll solo se pide el fondo y el cráneo cerrado; en el primer desplazamiento se pide el abierto.
2. Bloquear `craneo-abierto-*.webp` en DevTools: el hero sigue completo (cráneo cerrado, eslogan y botón visibles, legibles y pulsables).
3. Bloquear `assets/models/*.glb` o forzar `WEBGL_lose_context` en un equipo capaz: pasa al hero de imágenes con el cráneo cerrado, sin mover cráneo, cabecera ni contacto, y el scroll abre al cráneo abierto.
4. Tab desde el inicio: «Conoce nuestros servicios» y «Agende su cita» se alcanzan y el botón se ve con foco aunque `apertura` sea 0.

### E6 — Presupuesto, carga y LCP (SC-006, SC-007)
1. *Fast 4G*, CPU 4×, *Disable cache*, 360 × 740 y 1440 × 900, para cada modo (3D, transición, final).
2. **Esperado**: carga crítica ≤ 500 KB (estimado 140–230 KB); fondo PC ≤ 80 KB, móvil ≤ 50 KB; cada cráneo ≤ 60 KB; 0 peticiones a otro dominio; LCP < 2,5 s; CLS ≈ 0.
3. Comprobar en Chrome, Firefox y Safari que, en los modos diferidos, la imagen real del cráneo abierto **no** se pide antes de `habilitarImagenAbierta` y que sí se pide al cambiar el `media` de los `<source>` (R6); si alguno no la pide, asignar `srcset` desde `principal.js`.
4. Grabar un rendimiento de 10 s de scroll en el hero de imágenes (también con movimiento reducido): ≥ 55 fps en escritorio y, con CPU 4×, ≥ 30 fps (FR-017).
4. Lighthouse móvil: Rendimiento ≥ 90.

### E7 — Relevo estático → 3D (US5)
1. Equipo capaz, red limitada: hacer scroll en cuanto aparece la página, antes de que cargue el 3D.
2. **Esperado**: el cráneo estático se abre en sincronía con el bloqueo de introducción; al llegar el 3D, cráneo, cabecera y contacto no se mueven y no hay parpadeo; el cambio de fondo (imagen → velos del 3D) se hace con el fundido de 0,4 s y se valora si es aceptable (riesgo R6b).

### E8 — Contacto, teclado y responsive (SC-009, SC-010)
1. En todo el recorrido (0 → 100 % → siguiente sección): «Agende su cita», teléfono y barra fija (móvil) o botón flotante (≥ 1024 px) visibles y pulsables; el scroll nativo nunca se interrumpe.
2. 360, 390, 768, 1024, 1440 px, rotación y zoom del navegador al 200 %: sin desplazamiento horizontal, cráneo completo a lo ancho en las tres fases; móvil apaisado bajo: sin anclaje y composición final.
3. Franja inferior en móvil durante el anclaje: se funde con el fondo del hero (sin banda crema visible).

### E9 — Regresión del 3D
Comparar el hero 3D antes/después (misma ventana, apertura 0 y 1, sin cursor): diferencia de imagen = 0 salvo el fundido inicial del fondo. Con `captura` ausente el módulo se comporta igual que antes.

## Registro de resultados

Anotar en `specs/002-hero-estatico-scroll/verificacion.md` (se crea al implementar) pesos reales, desviaciones medidas, capturas por tamaño y resultado de cada escenario con fecha y dispositivo (principio IX), incluida una prueba en móvil real.
