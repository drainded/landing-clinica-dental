# Data Model: Rediseño estético general de la landing

No hay datos persistentes. Este modelo describe las estructuras que usan el CSS y el JS.

## Paleta (tokens de `:root`)

| Token | Valor | Uso |
|---|---|---|
| `--azul-50` … `--azul-950` | `#E6F2FF #B8DBFF #8AC4FF #5CADFF #2E96FF #0080FF #0069D1 #0052A3 #003B75 #002347 #000D1A` | escala de azules (captura 1); índices 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950 |
| `--color-gris` | `#1A1D21` | fondo de doctor / consultorio / reseñas, tarjetas de servicio |
| `--color-gris-claro` | `#262B31` | bordes y superficies sobre el gris |
| `--color-blanco` | `#FFFFFF` | ubicación y pie |
| `--color-dorado` | `#F5C451` | estrellas y su resplandor |
| `--color-texto-oscuro` | `#00050A` | texto sobre fondos claros (casi negro, luminancia ≤ 0,0013) |
| `--color-texto-claro` | `#FFFFFF` | texto sobre fondos oscuros |
| `--color-acento` / `-oscuro` / `-claro` | `--azul-600` / `--azul-800` / `--azul-300` | botones, enlaces, íconos (semánticos existentes redefinidos) |
| `--color-header` / `--color-header-vidrio` | `--azul-950` sólido / `--azul-950` al 60 % | header oscuro y translúcido |

Sin cambios: `--color-velo-*`, `--color-rayosx*`, `--color-whatsapp*`.

## Parada de fondo

`{ ancla: Element, fraccion: 0..1, token: string, luminancia: number }` — se calcula una vez (lee el token, convierte a luminancia relativa) y otra tras `resize`/`load`. `posicion = ancla.offsetTop + fraccion · ancla.offsetHeight`.

Reglas: posiciones estrictamente crecientes; primera parada = color antes de ella, última = color después.

## Estado del fondo continuo

| Campo | Tipo | Notas |
|---|---|---|
| `r` | px | línea de referencia = `scrollY + 0,5 · innerHeight` |
| `color` | `rgb` | mezcla lineal sRGB entre las dos paradas vecinas |
| `luminancia` | 0..1 | WCAG, de `color` |
| `tono` | `claro` \| `oscuro` | texto actual; conmuta en `0,18 ± 0,01` |

Salidas: `--fondo` y `--texto`/`--texto-suave` en `<html>`, y `data-tono` (`claro` = fondo claro, texto oscuro) para depurar y para las reglas de foco.

## Estado del header

`reposo` (scrollY ≤ 8) ↔ `desplazado` (scrollY > 8, solo ≥ 1024 px). Clase `is-desplazado` en `.encabezado`.

## Estado del gesto de toque

`espera → visible (ciclos 1..3) → descartado`. Entradas: `apertura`, interacción, visibilidad del hero y del documento, `prefers-reduced-motion`, móvil apaisado bajo. `descartado` es definitivo en la visita.

## Asignación servicio → ícono

| Servicio (título de la tarjeta) | Archivo publicado | Archivo original |
|---|---|---|
| Limpieza dental | `limpieza.svg` | `Limpieza dental.svg` |
| Ortodoncia | `ortodoncia.svg` | `Ortodoncia.svg` |
| Blanqueamiento | `blanqueamiento.svg` | `Blanqueamiento.svg` |
| Endodoncia | `endodoncia.svg` | `Endodoncia.svg` |
| Implantes dentales | `implantes.svg` | `Implantes dentales.svg` |
| Odontopediatría | `odontopediatria.svg` | `Odontopediatría.svg` |
| Parodoncia | `parodoncia.svg` | `Cirugía bucal.svg` |
| Exodoncia | `exodoncia.svg` | `Parodoncia.svg` |
| Cirugía bucal | `cirugia-bucal.svg` | `Estética dental.svg` |
| Estética dental | `estetica.svg` | `Exodoncia.svg` |
| Prótesis dental | `protesis.svg` | `Prótesis dental.svg` |
| Operatoria dental | `operatoria.svg` | `Operatoria dental.svg` |

Logo: `logo-claro.svg` (header, `#B8DBFF`) y `logo-oscuro.svg` (hero, `#0052A3`), de `LOGO CLINICA.svg`.

## Puntos de destello

`{ pose: 'cerrado' | 'abierto-escritorio' | 'abierto-movil', x: %, y: %, retardo: s, tamano: px }[]` ≈ 10 por pose, en porcentaje de la caja `.hero__poster-caja` (referencia: la misma de las imágenes de dientes).
