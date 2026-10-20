# Modelo de datos — Cráneo 3D y velos del hero

No hay persistencia ni servidor. Este documento describe el estado en memoria del módulo y los activos estáticos.

## Activos (archivos)

| Entidad | Archivo | Peso | Notas |
|---|---|---|---|
| Póster | `assets/img/craneo-cerrado.webp` | 24 KB (límite 60 KB) | 524 × 564 px, sin alfa (fondo blanco; se mezcla con `multiply`), cráneo cerrado; es el LCP |
| Modelo completo | `assets/models/craneo.glb` | 209 KB (límite 400 KB) | meshopt; ≈ 41 000 triángulos (≤ 50 000) |
| Modelo ligero | `assets/models/craneo-ligero.glb` | 74 KB (límite 400 KB) | meshopt; ≈ 12 300 triángulos (≈ 15 000) |
| Librería 3D | `assets/js/vendor/three-dentadura.min.js` | ≈ 139 KB brotli | bundle one-shot de three@0.186.1 (MIT) |
| Módulo propio | `js/dentadura.js` | pequeño | importa la librería; se carga diferido |

Jerarquía interna del GLB: `craneo-inferior › maxilar (hueso_sup, dientes_sup) | mandibula (hueso_inf, dientes_inf)` (la mandíbula es un nodo con pivote en la bisagra). Materiales `hueso` y `dientes`; el módulo los sustituye por nombre. `hueso_*` trae `COLOR_0` (densidad en `r`).

## Entidades en memoria

### NivelCalidad
`'estatico' | 'ligero' | 'completo'`
- Se decide una vez al inicio (ver research R3) y solo puede **degradarse** durante la sesión: `completo → ligero → estatico` (por la guardia de fluidez) o `* → estatico` (pérdida de contexto / error de carga).
- Transición a `estatico`: se cancela el bucle, se libera WebGL, se muestra el póster y se fija `data-hero="estatico"` en `<html>`.

### ProgresoApertura
- `progreso` ∈ [0, 1]: lo calcula y publica `js/principal.js` solo con `data-hero="animado"`. Durante el **bloqueo de introducción** es `objetivo` (acumulado de las acciones de scroll: rueda, toque, teclas) perseguido a velocidad máxima de 0,5/s; liberado el bloqueo vale 1 (y también 1 si la página carga ya desplazada).
- Publicación: propiedad CSS `--apertura` (= `crudo`, 3 decimales) en `#inicio`; evento `dentadura:apertura`; atributo `data-revelado` en `#inicio` cuando `crudo > 0,50` (se retira por debajo de 0,45).
- `suave` ∈ [0, 1]: lo mantiene el módulo 3D: `suave += (crudo − suave) · k` por fotograma.
- `abierto = ease(clamp(suave / 0,7))`; `angulo` = `30° · abierto` (rotación X de la mandíbula); la cámara apunta hacia la boca en proporción a `abierto` (no hay acercamiento por scroll: el cráneo arranca escalado con `--escala-figura`); `uDifumina = abierto` (difuminado del modelo bajo la cabecera y el eslogan).
- Invariantes: cerrado (`0`) en la carga; en el nivel estático no hay progreso (el CSS muestra eslogan y botón siempre).

### EstadoInteraccion
- `ndc` (x, y ∈ [−1, 1]): última posición del puntero respecto al escenario (suavizada con `k = 1 − e^(−9·dt)`).
- `activo` (bool): el puntero se ha movido (ratón) / está apoyado (táctil).
- `influencia` ∈ [0, 1]: suavizado de `activo`; escala la lente de los velos y la inclinación del cráneo.
- `velocidad` ≥ 0 (acotada a 1,5, decae `e^(−4·dt)`): acelera el reloj de los velos.
- Reglas: `activo = false` al `pointerleave` del documento, `blur`, `pointerup/cancel` táctil y con reduced-motion (que ni siquiera carga 3D).
- Efectos máximos: inclinación ±0,25 rad en Y y ±0,12 rad en X; paralaje de los velos de 0,06 a 0,50 del desplazamiento del cursor; lente de σ² = 1/5 en espacio de pantalla. El modelo no se deforma.

### Cráneo (escena)
- `pivote` (grupo, en el centro de la caja del modelo): recibe inclinación hacia el cursor (±0,25 rad en Y, ±0,12 rad en X); sin balanceo en reposo: sin cursor/toque vuelve a la pose inicial (0, 0).
- `maxilar`: fijo respecto al pivote.
- `mandibula`: rotación X = `angulo`.
- Cada malla del GLB usa **un** material: `hueso` → rayos X (`DoubleSide`, mezcla multiplicativa, sin profundidad, `renderOrder 1`); `dientes` → shader propio blanco brillante (`renderOrder 2`, con profundidad).

### Velos (escena)
- Un triángulo de pantalla completa, `renderOrder −1`, sin profundidad, que dibuja el fondo antes que el cráneo.

### Uniforms
- Rayos X: `uAbs` (0,66), `uAbsT` (1,6 × `uAbs`), `uFade` (0,30–1,15 en y del mundo), `uTinta` (de `--color-rayosx`).
- Máscara de textos (hueso y dientes): `uRes`, `uCajaA` (cabecera), `uCajaB` (eslogan), `uDifumina`.
- Dientes: `uBlanco` (de `--color-superficie`), `uLuz` (de `--color-rayosx-luz`).
- Velos: `uAspect`, `uTiempo`, `uInfluencia`, `uCursor`, `uFondo`, `uVelo1`, `uVelo2` (de `--color-velo-*`), `uTinta`, `uBrillo` (de `--color-superficie`).
- Ningún color literal en JS ni en los shaders (principio I).

## Estados del hero (máquina simple)

```
[carga] --póster sobre degradado de velos, mandíbula cerrada-->
   ├─(reduced-motion | saveData | equipo lento)──────────────► [estatico]  (eslogan+botón visibles)
   └─(nivel ligero/completo) --import diferido--> [cargando 3D]
         ├─(GLB y WebGL OK, 1.er fotograma)────► [animado]  (póster oculto, eslogan según --apertura)
         └─(error / sin WebGL / contexto perdido / fps bajo)─► [estatico]
[animado] --hero fuera de pantalla o pestaña oculta--> [pausado] --vuelve--> [animado]
[animado] --reduced-motion activado con la página abierta--> [estatico]
```
