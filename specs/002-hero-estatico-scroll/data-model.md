# Modelo de datos — Hero estático con transición por scroll

No hay datos persistentes. El «modelo» es el estado en memoria del hero y el inventario de imágenes.

## 1. Progreso del hero (`apertura`)

| Campo | Tipo | Regla |
|---|---|---|
| `apertura` | número 0–1 | Única fuente de verdad para el revelado, el fundido de poses y (en 3D) el ángulo de la mandíbula. Se publica como propiedad CSS `--apertura` en `.hero`. |
| `fuente` | `bloqueo` · `scroll` · `fija` | Quién escribe `apertura` (ver §2). Solo hay una fuente activa. |
| `t` | número 0–1 | `smoothstep(clamp(apertura / 0,7))`. Fundido de poses, traslación compensatoria y (3D) ángulo de mandíbula. Se calcula en CSS. |
| `revEslogan` | 0–1 | `clamp((apertura − 0,3) / 0,3)` (regla existente). |
| `revBoton` | 0–1 | `clamp((apertura − 0,4) / 0,3)` (regla existente). |
| `revelado` | booleano | Atributo `data-revelado` en `#inicio`; histéresis ON > 0,5 · OFF < 0,45 (existente); habilita el clic del botón. |

**Validación**: `apertura` siempre acotada a [0, 1]; con `fuente = fija` vale `1` y no cambia.

## 2. Modo del hero → fuente del progreso y disposición

Entradas: `data-hero` (`animado` | `estatico`, del `<head>`), `data-transicion` (presente solo con `estatico` y sin movimiento reducido), preferencia de movimiento reducido, móvil apaisado bajo.

| Modo | Condición | `fuente` | Anclado | Imagen abierta |
|---|---|---|---|---|
| **3D** | `data-hero="animado"` | `bloqueo` | no | solo mientras el 3D carga y `apertura > 0` |
| **Estático con transición** | `data-hero="estatico"` + `data-transicion` | `scroll` | sí (`sticky`, recorrido `D`) | tras `load` (o primer scroll con ahorro de datos) |
| **Estático final** | movimiento reducido, sin JS, móvil apaisado bajo, o 3D degradado en caliente | `fija` (1) | no | inmediata |

### Transiciones de estado

```
carga ──► 3D ──(fallo / contexto perdido / reducir movimiento en vivo)──► Estático final
  │
  └──► Estático con transición ◄──(solo se decide en el <head>; nunca se entra a él en caliente)
```

- **3D → Estático final**: `liberar(true)` del bloqueo deja `apertura = 1`; el cráneo abierto ya está (o se pide) y el canvas desaparece.
- **Reducir movimiento activado en vivo** estando en «Estático con transición»: se quita `data-transicion`, `apertura = 1`, desaparece el anclaje.
- No existe transición «Estático final → con transición» en caliente.

## 3. Cálculo de `apertura` en modo `scroll`

```
D        = hero.offsetHeight − escenario.offsetHeight      (px de recorrido anclado)
objetivo = clamp(scrollY / D, 0, 1)
mostrado ← mostrado + (objetivo − mostrado) · (1 − e^(−12·dt))     (cada cuadro, mientras |dif| > 0,0005)
```

Con `scrollY` = 0 → cerrado; con `scrollY ≥ D` → abierto y el hero se desancla.

## 4. Imágenes del hero

| Id | Archivo (nuevo o existente) | Medidas aprox. | Límite | Carga | Selección |
|---|---|---|---|---|---|
| `fondo-pc` | `assets/img/fondo-hero-pc.webp` | 1920 × 1080 | ≤ 80 KB | crítica | `orientation: landscape` |
| `fondo-movil` | `assets/img/fondo-hero-movil.webp` | 828 × 1792 | ≤ 50 KB | crítica | `orientation: portrait` |
| `craneo-cerrado` | `assets/img/craneo-cerrado.webp` (se conserva o se regenera con la herramienta) | ≥ 524 × 564; hasta ≈ 800 × 860 si cabe en el límite | ≤ 60 KB | crítica (salvo movimiento reducido) | única |
| `craneo-abierto-escritorio` | `assets/img/craneo-abierto-escritorio.webp` | recuadro ampliado respecto a la figura | ≤ 60 KB | diferida (crítica con movimiento reducido) | `min-width: 1024px` |
| `craneo-abierto-movil` | `assets/img/craneo-abierto-movil.webp` | ídem | ≤ 60 KB | ídem | resto |

Todas son decorativas (`alt=""`, `aria-hidden`) y declaran `width`/`height`.

### Geometría compartida (`--abierto-*`, `--despl-*`)

La herramienta de captura calcula una sola vez, para ambas variantes del cráneo abierto, y se escribe como propiedades CSS constantes en `.hero__figura`:

| Propiedad | Significado |
|---|---|
| `--abierto-izq`, `--abierto-arr`, `--abierto-ancho`, `--abierto-alto` | Recuadro de la imagen abierta, en % de la figura (puede exceder 0–100 %) |
| `--despl-x`, `--despl-y` | `Δ`: traslación de la parte superior del cráneo entre la pose cerrada y la abierta, en % de la figura |

## 5. Zonas de texto (entrada del difuminado)

Cabecera (`.hero__cabecera`) y eslogan (`.hero__eslogan`): sus cajas en la captura determinan el difuminado horneado de cada variante abierta. Se registran en `verificacion.md` junto con el tamaño de ventana de cada captura (390 × 844 y 1440 × 900).
