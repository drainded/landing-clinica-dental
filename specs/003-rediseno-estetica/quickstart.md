# Quickstart: validar el rediseño estético

Prerrequisitos: `preview_start` con `dentista-landing` (http://localhost:5173), Chrome, Node y Python con Pillow.

| # | Escenario | Cómo | Resultado esperado |
|---|---|---|---|
| E1 | Identidad | Cargar la página y recorrerla; `grep` de colores literales y de `Poppins`/`#0F6E6E` en `css/` y `js/` | Sin acento verde, sin «HR» antiguo; ningún literal fuera de `:root` (SC-003) |
| E2 | Fondo continuo | `contraste-scroll.mjs` en 360 × 740 y 1440 × 900, paso de 50 px | Saltos de luminosidad ≤ 8 puntos entre muestras (SC-002) |
| E3 | Contraste en todo el recorrido | Mismo script, paso de 100 px, cada texto visible | Mínimo ≥ 4,5 : 1 (3 : 1 grande) (SC-001) |
| E4 | Header | 1440 × 900: arriba y tras bajar 40 px; 390 × 844 | Oscuro → translúcido con blur en PC; en móvil no fijo y oscuro (SC-009) |
| E5 | Hero | Botón de cristal, destellos sobre los dientes y gesto con boca cerrada (esperar 3 s); abrir con scroll | Botón legible; destellos solo sobre dientes; el gesto desaparece al abrir (SC-010) |
| E6 | Servicios | 360, 768, 1440: 12 tarjetas con su ícono según la tabla | Íconos correctos y del mismo tamaño visual ± 5 % (SC-008) |
| E7 | Doctor → ubicación | Recorrer; ver tarjetas de reseñas y estrellas | Gris oscuro hasta reseñas, tarjetas con borde blanco, estrellas doradas con brillo, ubicación blanca |
| E8 | Movimiento reducido y sin JS | Emular `prefers-reduced-motion` y desactivar JS | Colores fijos por sección, legible, sin destellos ni gesto ni transición (SC-007) |
| E9 | Peso y carga | Red 4G emulada, caché vacía; peso transferido | Carga crítica ≤ 500 KB; íconos + logo ≤ 80 KB gz; LCP < 2,5 s; CLS ≤ 0,1 (SC-004/5) |
| E10 | Fluidez y contacto | Móvil emulado con CPU ×4; barra fija / botón flotante sobre cada fondo | ≥ 30 fps; contacto visible y legible en todo el recorrido (SC-006, SC-011) |

Resultados y capturas en `specs/003-rediseno-estetica/verificacion.md`; la prueba en móvil real (principio IX) queda anotada como pendiente hasta que se haga.
