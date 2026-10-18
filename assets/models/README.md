# Modelos 3D del hero

Modelos usados por el hero (`js/dentadura.js`): cráneo inferior (maxilar y mandíbula con dientes) que se muestra con aspecto de radiografía. Formato GLB con compresión meshopt.

| Archivo | Uso | Peso | Triángulos |
|---|---|---|---|
| `craneo.glb` | Nivel `completo` (escritorio y móvil grande) | 209 KB | ≈ 41 000 (≤ 50 000) |
| `craneo-ligero.glb` | Nivel `ligero` (táctil con ancho < 768 px) | 74 KB | ≈ 12 300 (≈ 15 000) |

El póster estático que corresponde a estos modelos es `assets/img/craneo-cerrado.webp` (524 × 564 px, ≈ 24 KB): el cráneo cerrado sobre fondo blanco opaco. El sitio lo mezcla con `mix-blend-mode: multiply` para que los velos del fondo se vean a través del hueso.

## Autoría y licencia

- Modelo entregado por el autor del proyecto el 12/10/2026 (`modelo-craneo-rayosx-dientes-alineados.zip`). Su demo de referencia (`referencias/demo-rayosx.html`) lo describe como «modelo escaneado».
- Modelo actual (`modelo-craneo-rayosx-dientes-alineados.zip`) creados por drainded el 12/10/2026 con Claude.
- Reemplaza a `diente.glb` / `diente-ligero.glb` (creados por drainded el 09/10/2026 con Claude), retirados el 12/10/2026 (decisión D-17 de `SPEC.md`).

## Estructura del modelo

Jerarquía de nodos: `craneo-inferior › maxilar | mandibula`.

| Nodo | Contenido |
|---|---|
| `maxilar` | `hueso_sup` (material `hueso`) y `dientes_sup` (material `dientes`); fijo |
| `mandibula` | `hueso_inf` y `dientes_inf`; es el nodo que se rota en X para abrir la boca (0° = cerrada, 30° = abierta); su origen es la bisagra |

`hueso_*` trae el atributo de color de vértice `COLOR_0` (canal `r` = densidad del hueso, la usa el shader de rayos X). Los dientes llevan solo normales.

## Materiales

El GLB declara `hueso` (PBR gris azulado) y `dientes` (PBR blanco con `KHR_materials_clearcoat`). El sitio **los sustituye en tiempo de ejecución** por shaders propios, según el nombre del material:

- `hueso` → radiografía: cada capa de la malla multiplica el color del fondo por el tinte `--color-rayosx`, más oscuro donde la superficie se ve de canto o hay más capas; la bóveda se desvanece hacia arriba.
- `dientes` → blanco brillante (`--color-superficie`) con reflejo de borde `--color-rayosx-luz`, iluminación fija propia.

No se usan texturas, mapa de entorno ni luces de three.js. Los colores se leen de los tokens CSS de `:root`; no hay colores literales en el JS.
