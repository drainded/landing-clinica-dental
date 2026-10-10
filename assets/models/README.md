# Modelos 3D de la dentadura

Modelos usados por el hero (`js/dentadura.js`). Formato GLB con compresión meshopt.

| Archivo | Uso | Peso | Triángulos |
|---|---|---|---|
| `diente.glb` | Nivel `completo` (escritorio y móvil grande) | 179 KB | ≤ 50 000 |
| `diente-ligero.glb` | Nivel `ligero` (táctil con ancho < 768 px) | 53 KB | ≈ 15 000 |

## Autoría y licencia

- Geometría **original**, sin licencias de terceros ni activos de bibliotecas externas.
- Fue creado por drainded tambien creador del proyecto, fecha de creación: 09/10/2026 utilizando claude para generar el modelo.

## Estructura del modelo

Jerarquía de nodos: `dentadura › maxilar | mandibula`.

- `mandibula` es el nodo que se rota en X para abrir la boca (0° = cerrada, ≈ 40° = abierta).
- `maxilar` permanece fijo.

## Materiales

Los archivos incluyen el material `KHR_materials_unlit`. El sitio **lo sustituye en tiempo de ejecución** por shaders propios (relleno + contorno por «casco invertido»); no se usan texturas, iluminación ni mapa de entorno. Los colores se leen de los tokens CSS `--color-superficie` y `--color-acento`.
