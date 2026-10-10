# Modelo de datos — Dentadura 3D del hero

No hay persistencia ni servidor. Este documento describe el estado en memoria del módulo y los activos estáticos.

## Activos (archivos)

| Entidad | Archivo | Peso | Notas |
|---|---|---|---|
| Póster | `assets/img/diente-poster.webp` | 18 KB (límite 60 KB) | 583 × 713 px, con alfa, dentadura cerrada; es el LCP |
| Modelo completo | `assets/models/diente.glb` | 179 KB (límite 400 KB) | meshopt; ≤ 50 000 triángulos |
| Modelo ligero | `assets/models/diente-ligero.glb` | 53 KB (límite 400 KB) | meshopt; ≈ 15 000 triángulos |
| Librería 3D | `assets/js/vendor/three-dentadura.min.js` | ≈ 139 KB brotli | bundle one-shot de three@0.186.1 (MIT) |
| Módulo propio | `js/dentadura.js` | pequeño | importa la librería; se carga diferido |

Jerarquía interna esperada del GLB: `dentadura › maxilar | mandibula` (la mandíbula es un nodo con pivote en la bisagra). Material original `KHR_materials_unlit` blanco; el módulo lo sustituye.

## Entidades en memoria

### NivelCalidad
`'estatico' | 'ligero' | 'completo'`
- Se decide una vez al inicio (ver research R3) y solo puede **degradarse** durante la sesión: `completo → ligero → estatico` (por la guardia de fluidez) o `* → estatico` (pérdida de contexto / error de carga).
- Transición a `estatico`: se cancela el bucle, se libera WebGL, se muestra el póster y se fija `data-hero="estatico"` en `<html>`.

### ProgresoApertura
- `crudo` ∈ [0, 1]: `clamp((scrollY − heroTop) / (heroAlto − altoVentana))`, calculado y publicado por `js/principal.js` (solo con `data-hero="animado"`).
- Publicación: propiedad CSS `--apertura` (= `crudo`, 3 decimales) en `#inicio`; evento `dentadura:apertura`; atributo `data-revelado` en `#inicio` cuando `crudo > 0,45` (se retira por debajo de 0,40).
- `suave` ∈ [0, 1]: lo mantiene el módulo 3D: `suave += (crudo − suave) · k` por fotograma.
- `angulo` = `40° · ease(clamp(suave / 0,7))`; rotación X de la mandíbula.
- Invariantes: cerrado (`0`) en la carga; en el nivel estático no hay progreso (el CSS muestra eslogan y botón siempre).

### EstadoInteraccion
- `ndc` (x, y ∈ [−1, 1]): última posición del puntero sobre el escenario.
- `activo` (bool): puntero dentro y con movimiento (ratón) / apoyado (táctil).
- `intensidad` ∈ [0, 1]: suavizado de `activo`; escala empuje, abultamiento y onda.
- `velocidad` ≥ 0: modula levemente el empuje (acotada).
- Reglas: `activo = false` al `pointerleave` de la ventana, `pointerup/cancel` táctil y con reduced-motion (que ni siquiera carga 3D).
- Valores máximos de deformación (calibrados con la demo): empuje 0,13–0,25, abultamiento 0,14, onda 0,02, radio σ = 0,55 (unidades del modelo).

### Dentadura (escena)
- `pivot` (grupo): recibe inclinación hacia el cursor (±0,30 rad en Y, ±0,14 rad en X) + balanceo en reposo (±0,12 rad, ~0,08 Hz).
- `maxilar`: fijo respecto al pivot.
- `mandibula`: rotación X = `angulo`.
- Cada malla del GLB: un material de **relleno** (color `--color-superficie`) y una malla hija de **contorno** (caras traseras desplazadas en pantalla; grosor 4,5 px CSS constantes → `uThick = px / (altoCanvas/2)`).

### Uniforms compartidos (relleno y contorno)
`uCursor` (vec3, espacio de cámara), `uPush`, `uBulge`, `uWave`, `uSigma`, `uTime`, `uThick`, `uAspect`, `uColor` (de `--color-acento`) y `uFill` (de `--color-superficie`); ningún color literal en JS ni en los shaders (principio I).

## Estados del hero (máquina simple)

```
[carga] --póster visible, mandíbula cerrada-->
   ├─(reduced-motion | saveData | equipo lento)──────────────► [estatico]  (eslogan+botón visibles)
   └─(nivel ligero/completo) --import diferido--> [cargando 3D]
         ├─(GLB y WebGL OK, 1.er fotograma)────► [animado]  (póster oculto, eslogan según --apertura)
         └─(error / sin WebGL / contexto perdido / fps bajo)─► [estatico]
[animado] --hero fuera de pantalla o pestaña oculta--> [pausado] --vuelve--> [animado]
```
