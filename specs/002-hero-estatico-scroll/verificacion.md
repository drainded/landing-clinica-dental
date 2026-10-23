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
