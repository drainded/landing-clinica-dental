# Modelos 3D del hero

Modelos usados por el hero (`js/dentadura.js`): cráneo inferior (maxilar y mandíbula con dientes) que se muestra con aspecto de radiografía. Formato GLB con compresión meshopt.

| Archivo | Uso | Peso | Triángulos |
|---|---|---|---|
| `craneo.glb` | Nivel `completo` (escritorio y móvil grande) | 209 KB | ≈ 41 000 (≤ 50 000) |
| `craneo-ligero.glb` | Nivel `ligero` (táctil con ancho < 768 px) | 74 KB | ≈ 12 300 (≈ 15 000) |

El póster estático que corresponde a estos modelos es `assets/img/craneo-cerrado.webp` (800 × 861 px, ≈ 36 KB; antes 524 × 564 px): el cráneo cerrado sobre fondo blanco opaco. El sitio lo mezcla con `mix-blend-mode: multiply` para que los velos del fondo se vean a través del hueso.

## Imágenes del cráneo (hero estático)

Las imágenes estáticas **se generan desde estos mismos modelos** con la opción de captura de `js/dentadura.js` (mismos shaders, cámara, encuadre y difuminado bajo los textos que el 3D), de modo que su posición coincida con la del 3D:

| Archivo | Pose | Uso | Peso |
|---|---|---|---|
| `assets/img/craneo-cerrado.webp` | cerrada | LCP y respaldo; 800 × 861 px (proporción 524:564) | 36 KB |
| `assets/img/craneo-abierto-movil.webp` | abierta (≈ 30°, cámara sobre la boca) | < 1024 px; difuminado horneado a 390 × 844 | 29 KB |
| `assets/img/craneo-abierto-escritorio.webp` | abierta | ≥ 1024 px; difuminado horneado a 1440 × 900 | 31 KB |

Para regenerarlas (Node ≥ 22, Chrome y Python con Pillow; ver `referencias/herramientas/README.md`):

```bash
node referencias/herramientas/hero.mjs capturar --ancho 1440 --alto 900 --fase 0,1
node referencias/herramientas/hero.mjs capturar --ancho 390 --alto 844 --fase 1
python referencias/herramientas/codificar-craneo.py --captura craneo-0-1440x900 --recorte poster --salida assets/img/craneo-cerrado.webp
python referencias/herramientas/codificar-craneo.py --captura craneo-1-390x844 --recorte recuadro --salida assets/img/craneo-abierto-movil.webp
python referencias/herramientas/codificar-craneo.py --captura craneo-1-1440x900 --recorte recuadro --salida assets/img/craneo-abierto-escritorio.webp
```

`codificar-craneo.py` imprime las constantes (`--abierto-*` y `--despl-*`, en % del rectángulo del póster) que van en `css/estilos.css`. Si se cambia el modelo o el encuadre hay que regenerar las tres imágenes y volver a comprobar la posición con `hero.mjs comparar`.

El fondo del hero estático (`assets/img/fondo-hero-pc.webp` y `fondo-hero-movil.webp`) sale de `referencias/herramientas/generar-fondo.py` (recomposición en el estilo de la imagen original del cliente, con los colores de los tokens).

## Autoría y licencia

- Modelo actual (`modelo-craneo-rayosx-dientes-alineados.zip`, de donde salen `craneo.glb` y `craneo-ligero.glb`): creado por drainded el 12/10/2026 con Claude.
- **Autoría confirmada** por el titular del proyecto el 20/10/2026 (T047). La demo de referencia (`referencias/demo-rayosx.html`) lo llamaba «modelo escaneado»; no se debe presentar así.
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
