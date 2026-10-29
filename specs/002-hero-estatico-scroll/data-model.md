# Modelo de datos — Hero estático con transición por scroll

No hay datos persistentes. El «modelo» es el estado en memoria del hero y el inventario de imágenes.

## 1. Progreso del hero (`apertura`)

| Campo | Tipo | Regla |
|---|---|---|
| `apertura` | número 0–1 | Única fuente de verdad para el revelado, el fundido de poses y (en 3D) el ángulo de la mandíbula. Se publica como propiedad CSS `--apertura` en `.hero`. |
| `fuente` | `bloqueo` · `fija` | Quién escribe `apertura` (ver §2): el bloqueo de introducción en los dos modos; `fija` (1) solo en móvil apaisado bajo y sin JS. |
| `t` | número 0–1 | `smoothstep(clamp(apertura / 0,7))`. Fundido de poses, traslación compensatoria y (3D) ángulo de mandíbula. Se calcula en CSS. |
| `revEslogan` | 0–1 | `clamp((apertura − 0,3) / 0,3)` (regla existente). |
| `revBoton` | 0–1 | `clamp((apertura − 0,4) / 0,3)` (regla existente). |
| `revelado` | booleano | Atributo `data-revelado` en `#inicio`; histéresis ON > 0,5 · OFF < 0,45 (existente); habilita el clic del botón. |
| `abiertoListo` | booleano | Atributo `data-abierto-listo` en `<html>`. Verdadero cuando la imagen real del cráneo abierto ya cargó. **El póster cerrado solo desaparece cuando `abiertoListo` es verdadero; antes de eso `t` no oculta ninguna pose.** |
| `abiertoFallo` | booleano | Atributo `data-abierto-fallo`: la imagen abierta falló; eslogan y botón quedan siempre visibles y el póster no se oculta. |

**Validación**: `apertura` siempre acotada a [0, 1]; con `fuente = fija` vale `1` y no cambia.

## 2. Modo del hero y fuente del progreso

Entradas: `data-hero` (`animado` | `estatico`, del `<head>`), móvil apaisado bajo. Solo hay dos modos: 3D (`animado`) e imágenes (`estatico`, también con «reducir movimiento»). **El progreso lo escribe siempre el bloqueo de introducción** (D-21).

| Modo | Condición | Fuente de `--apertura` | Efecto del progreso |
|---|---|---|---|
| **3D** | `data-hero="animado"` | bloqueo de introducción | mandíbula del 3D (y, mientras el 3D carga, fundido de las imágenes) |
| **Imágenes** | `data-hero="estatico"`: ahorro de datos, equipo lento, «reducir movimiento», 3D fallido o descartado | bloqueo de introducción | fundido del cráneo cerrado al abierto |
| **Composición final** (excepción) | móvil apaisado bajo o sin JS | `fija` (1) | sin bloqueo; página normal |

### Transiciones de estado

```
carga ──► 3D ──(fallo / contexto perdido / reducir movimiento en vivo)──► Imágenes (mismo progreso, mismo bloqueo)
  │
  └──► Imágenes (se decide en el <head>)
```

- **3D → Imágenes**: desaparece el canvas, se pide ya el cráneo abierto y el póster cerrado permanece visible hasta que llegue (`data-abierto-listo`); el bloqueo de introducción **no se toca**, así que el progreso (y el texto ya revelado) continúa sin saltos.
- **Imágenes → Composición final**: solo al pasar a móvil apaisado bajo (el bloqueo se libera y `apertura = 1`).

## 3. Bloqueo de introducción (fuente del progreso)

Es el mecanismo existente de `js/principal.js` (`publicarApertura`), sin cambios de lógica:

```
al cargar en lo alto:  bloqueado = true, objetivo = 0
rueda / toque / teclas: objetivo = clamp(objetivo + delta, 0, 1)         (la página no se desplaza)
cada cuadro:           apertura += clamp(objetivo − apertura, ±BLOQUEO_VELOCIDAD · dt)     (1,25 por segundo)
apertura = 1:          bloqueo liberado (la página se desplaza); salidas: Tab, ancla, scroll externo, carga desplazada, apaisado bajo
al volver a lo alto:   apertura = 0 y el bloqueo se rearma
```

`DISTANCIA_RUEDA` (0,9 alturas de ventana de rueda = todo el progreso) y `DISTANCIA_TOQUE` (0,6 de arrastre táctil), más el impulso al soltar un deslizamiento rápido, definen cuánto hay que desplazar; no hay otra constante que ajustar.

## 4. Imágenes del hero

| Id | Archivo (nuevo o existente) | Medidas aprox. | Límite | Carga | Selección |
|---|---|---|---|---|---|
| `fondo-pc` | `assets/img/fondo-hero-pc.webp` | 1920 × 1080 | ≤ 80 KB | crítica | `orientation: landscape` |
| `fondo-movil` | `assets/img/fondo-hero-movil.webp` | 828 × 1792 | ≤ 50 KB | crítica | `orientation: portrait` |
| `craneo-cerrado` | `assets/img/craneo-cerrado.webp` (se conserva o se regenera con la herramienta) | ≥ 524 × 564; hasta ≈ 800 × 860 si cabe en el límite | ≤ 60 KB | crítica (salvo movimiento reducido) | única |
| `craneo-abierto-escritorio` | `assets/img/craneo-abierto-escritorio.webp` | recuadro ampliado respecto a la figura | ≤ 60 KB | diferida (crítica con movimiento reducido) | `min-width: 1024px` |
| `craneo-abierto-movil` | `assets/img/craneo-abierto-movil.webp` | ídem | ≤ 60 KB | ídem | resto |
| `craneo-cerrado-dientes`, `craneo-abierto-escritorio-dientes`, `craneo-abierto-movil-dientes` | `assets/img/craneo-*-dientes.webp` | mismas medidas y recuadro que el hueso de su pose; WebP con alfa sin pérdida | ≤ 60 KB (18–32 KB) | como el hueso de su pose | como el hueso de su pose |

Los dientes van en una capa aparte (`.hero__dientes`, hermana de `.hero__figura` y sin `multiply`) para que sean blancos y opacos como en el 3D; el hueso (`.hero__figura`) se mezcla con `multiply`. Decisión D-22.

Todas son decorativas (`alt=""`, `aria-hidden`) y declaran `width`/`height`.

### Geometría compartida (`--abierto-*`, `--despl-*`)

La herramienta de captura calcula una sola vez, para ambas variantes del cráneo abierto, y se escribe como propiedades CSS constantes en `.hero__figura`:

| Propiedad | Significado |
|---|---|
| `--abierto-izq`, `--abierto-arr`, `--abierto-ancho`, `--abierto-alto` | Recuadro de la imagen abierta, en % de la figura (puede exceder 0–100 %) |
| `--despl-x`, `--despl-y` | `Δ`: traslación de la parte superior del cráneo entre la pose cerrada y la abierta, en % de la figura |

## 5. Zonas de texto (entrada del difuminado)

Cabecera (`.hero__cabecera`) y eslogan (`.hero__eslogan`): sus cajas en la captura determinan el difuminado horneado de cada variante abierta. Se registran en `verificacion.md` junto con el tamaño de ventana de cada captura (390 × 844 y 1440 × 900).
