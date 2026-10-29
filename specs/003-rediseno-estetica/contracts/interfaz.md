# Contrato de interfaz: Rediseño estético

Superficie entre el HTML, el CSS y `js/principal.js`.

## 1. Atributos y clases

| Elemento | Atributo / clase | Quién lo escribe | Significado |
|---|---|---|---|
| `<html>` | `data-fondo="continuo"` | `principal.js` | El fondo continuo está activo: secciones transparentes. Ausente = respaldo estático |
| `<html>` | `data-tono="claro" \| "oscuro"` | `principal.js` | Tono actual del fondo (claro → texto oscuro) |
| `<html>` | `--fondo`, `--texto` | `principal.js` | Colores vivos del fondo y del texto libre (no hay «texto suave» sobre fondo libre: no daría 4,5 : 1 en el cruce) |
| `.fondo-continuo` | `aria-hidden="true"` | HTML | Capa fija de color; `background-color: var(--fondo)` |
| `.encabezado` | `is-desplazado` | `principal.js` | Header translúcido (solo ≥ 1024 px) |
| `.hero__efectos` | — | HTML | Capa de destellos y gesto, `aria-hidden`, `pointer-events: none` |
| `.hero__efectos` | `is-gesto` | `principal.js` | Muestra el gesto de toque |
| `section`, `footer` | `--texto-seccion` (+ `background` propio) y `--tx` | CSS | Respaldo sin JS o con «reducir movimiento»; `--tx` = `var(--texto, var(--texto-seccion))` es el color de texto vigente |

## 2. Variables CSS

- Lee: `--apertura` (spec 002), tokens de paleta.
- Escribe: `--fondo`, `--texto`.

## 3. Eventos

- Escucha `dentadura:apertura` (`detail.progreso`, spec 001/002) para saber si la mandíbula está cerrada.
- No emite eventos nuevos.

## 4. Reglas de accesibilidad

- `.fondo-continuo`, `.hero__efectos` e íconos de servicio: decorativos (`aria-hidden` o `alt=""`).
- Logo del header: enlace con `aria-label` («Clínica Dental Dr. Rojas Pérez, ir al inicio»); el `<img>` con `alt=""`.
- Foco visible: `outline` con `var(--color-foco)`, que el CSS redefine según `data-tono` y por sección con fondo propio.
- Sin JS: cada sección tiene su `--fondo-seccion` y `--texto-seccion` y la página es legible.

## 5. Herramientas de desarrollo (no publicadas)

- `referencias/herramientas/normalizar-svg.py <entrada> <salida> --fill <token-hex> [--max-kb N]`.
- `referencias/herramientas/puntos-destellos.py` → imprime el bloque CSS de posiciones.
- `referencias/herramientas/contraste-scroll.js` → se pega en la consola; recorre el scroll y devuelve el contraste mínimo y los saltos de luminosidad L* (SC-001/SC-002).
