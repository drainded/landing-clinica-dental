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
| `abiertoListo` | booleano | Atributo `data-abierto-listo` en `<html>`. Verdadero cuando la imagen real del cráneo abierto ya cargó. **El póster cerrado solo desaparece cuando `abiertoListo` es verdadero; antes de eso `t` no oculta ninguna pose.** |
| `abiertoFallo` | booleano | Atributo `data-abierto-fallo`: la imagen abierta falló; eslogan y botón quedan siempre visibles y el póster no se oculta. |

**Validación**: `apertura` siempre acotada a [0, 1]; con `fuente = fija` vale `1` y no cambia.

## 2. Modo del hero → fuente del progreso y disposición

Entradas: `data-hero` (`animado` | `estatico`, del `<head>`), `data-transicion` (presente en todo el modo `estatico`, **también con movimiento reducido**), móvil apaisado bajo. Solo hay dos modos: 3D (`animado`) e imágenes (`estatico` + `data-transicion`).

| Modo | Condición | `fuente` | Anclado | Imagen abierta |
|---|---|---|---|---|
| **3D** | `data-hero="animado"` | `bloqueo` | no | solo mientras el 3D carga y `apertura > 0` |
| **Imágenes con transición** (`estatico`) | `data-hero="estatico"` + `data-transicion`: ahorro de datos, equipo lento, «reducir movimiento», 3D fallido o descartado | `scroll` | sí (`sticky`, recorrido `D`) | tras `load` (primer scroll con ahorro de datos; ya si el 3D falla) |
| **Composición final** (excepción) | móvil apaisado bajo (el hero no cabe en pantalla) o sin JS | `fija` (1) | no | inmediata |

### Transiciones de estado

```
carga ──► 3D ──(fallo / contexto perdido / reducir movimiento en vivo)──► Imágenes con transición
  │
  └──► Imágenes con transición ◄──(se decide en el <head> para ahorro de datos, equipo lento y «reducir movimiento»)
```

- **3D → Imágenes con transición**: el bloqueo de introducción se libera, se añade `data-transicion`, el control por scroll toma el relevo (`apertura` pasa a salir de la posición de scroll: 0 en lo alto) y se pide ya el cráneo abierto; el póster cerrado permanece visible hasta que llegue y el canvas desaparece. El escenario no se mueve (el espaciador del recorrido queda bajo el hero).
- **Reducir movimiento activado en vivo** con el 3D mostrado: igual que un fallo del 3D. Con el modo de imágenes ya activo no cambia nada.
- **Imágenes con transición → Composición final**: solo al pasar a móvil apaisado bajo; se quita `data-transicion` y `apertura = 1`.

## 3. Cálculo de `apertura` en modo `scroll`

```
D        = hero.offsetHeight − escenario.offsetHeight      (px de recorrido anclado; el espaciador .hero::after)
inicio   = hero.top + scrollY − top_sticky                  (scroll en el que el escenario empieza a anclarse:
                                                             ≈ 0 en escritorio; el alto del encabezado en móvil)
objetivo = clamp((scrollY − inicio) / D, 0, 1)
mostrado ← mostrado + (objetivo − mostrado) · (1 − e^(−12·dt))     (cada cuadro, mientras |dif| > 0,0005)
```

Con `scrollY ≤ inicio` → cerrado (también al volver a `#inicio`); con `scrollY ≥ inicio + D` → abierto y el hero se desancla. El espaciador es un elemento dentro del hero (no un `padding`) porque `position: sticky` solo se mueve dentro del contenido de su padre.

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
