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
