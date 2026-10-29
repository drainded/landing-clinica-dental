# Implementation Plan: Rediseño estético general de la landing

**Branch**: `003-rediseno-estetica` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-rediseno-estetica/spec.md`

## Summary

Cambiar la identidad visual de toda la página (paleta azul + gris oscuro, Playfair Display, logo e íconos nuevos), hacer que el fondo cambie de color de forma continua con el scroll (como phantom.com), rediseñar el header (oscuro, translúcido con desenfoque al bajar en PC) y añadir tres detalles al hero (botón de cristal, destellos sobre los dientes, gesto de toque con la mandíbula cerrada). El contenido, el modelo 3D y la mecánica de apertura no se tocan.

Enfoque técnico (detalle en [research.md](research.md)):

- **Todo por tokens**: los colores nuevos son tokens de `:root` (azules `--azul-50…950`, gris, dorado, texto claro/oscuro y los semánticos `--color-acento*`, `--color-fondo-*`). Se reutilizan los nombres semánticos existentes (`--color-acento`, `--color-acento-oscuro`, `--color-texto`…) para que el CSS que ya los usa cambie solo; las hojas no llevan colores literales.
- **Fondo continuo (R1)**: una capa `position: fixed` detrás del contenido (`.fondo-continuo`) cuyo color escribe un único `scroll` pasivo con `requestAnimationFrame` a partir de una tabla de paradas (elemento ancla + fracción → token). Las secciones pasan a ser transparentes solo cuando el script está activo (`html[data-fondo]`). Sin JS o con «reducir movimiento» cada sección lleva su color fijo (la de servicios, un degradado estático de arriba abajo) y no hay nada animado.
- **Texto adaptable (R2)**: el texto sobre fondo libre usa dos variables (`--texto`, `--texto-suave`) que el script **conmuta** (no interpola) entre «oscuro» y «claro» en el punto donde ambos tienen el mismo contraste con el fondo; así el contraste nunca baja de 4,5 : 1 (se necesita un texto oscuro casi negro, `--color-texto-oscuro`). Las tarjetas y las cajas llevan su propio color fijo y no se ven afectadas.
- **Header (R3)**: oscuro desde el inicio; en ≥ 1024 px ya era `sticky`; el script añade `is-desplazado` tras unos píxeles y el CSS pasa a fondo oscuro semitransparente con `backdrop-filter: blur()`, con respaldo opaco sin soporte (`@supports`).
- **Logo e íconos (R4)**: SVG normalizados por un script de desarrollo (`referencias/herramientas/normalizar-svg.py`, sin dependencias de publicación): se recortan al contenido, se redondean las coordenadas, se unen las dos capas de azul en una sola con relleno de la paleta, se centran en un lienzo común y se reducen de peso. Se publican como `<img loading="lazy">` (los colores son activos generados con la paleta, igual que las imágenes del cráneo en la spec 002). Logo en dos variantes de color (claro para el header, azul oscuro para el hero).
- **Playfair Display (R5)**: WOFF2 variable (subset latin), autoalojada, `font-display: swap`, con `size-adjust` en un respaldo local para no saltar de diseño; solo en títulos, nombre de clínica y eslogan.
- **Botón de cristal (R6)**: `backdrop-filter` + degradado translúcido + borde luminoso + reflejo con `::before`; respaldo con fondo translúcido.
- **Destellos (R7) y gesto de toque (R8)**: una capa `.hero__efectos` hermana de los dientes, dentro de la caja del póster, con destellos (`<i>` con `opacity`/`transform`) en posiciones precalculadas a partir de la máscara alfa de las imágenes de dientes (un juego para cráneo cerrado, otro para abierto, uno por variante), y una mano SVG con onda que aparece con `apertura ≈ 0` y sin interacción previa.
- **Estrellas (R9)**: color dorado y `text-shadow`/`filter: drop-shadow` fijo, con un pulso lento opcional de `opacity` (apagado con «reducir movimiento»).

## Technical Context

**Language/Version**: HTML5, CSS3 y JavaScript ES2020+ sin transpilar. Herramientas de desarrollo (no publicadas): Node, Python con Pillow, Chrome instalado.

**Primary Dependencies**: ninguna nueva en el sitio. Fuente Playfair Display (SIL OFL) autoalojada.

**Storage**: N/A (archivos estáticos).

**Testing**: verificación guiada y scripts ad hoc (contraste por muestreo de scroll, lienzo de íconos, peso), sin framework. Ver [quickstart.md](quickstart.md).

**Target Platform**: navegadores modernos de escritorio y móvil; mobile-first desde 360 px; despliegue estático.

**Project Type**: sitio web estático de una página.

**Performance Goals**: LCP < 2,5 s en 4G; CLS ≤ 0,1; ≥ 30 fps en móvil de gama media (header translúcido + fondo continuo + destellos); Lighthouse móvil ≥ 90.

**Constraints**: carga crítica ≤ 500 KB (hoy ≈ 140–230 KB; se añade Playfair ≈ 25–35 KB y dos logos ≈ 20–40 KB comprimidos); íconos y logo ≤ 80 KB comprimidos en total, sin entrar en la carga crítica (excepto el logo del header y del hero); 0 peticiones a terceros; scroll nativo siempre libre; contraste ≥ 4,5 : 1 en todo el recorrido.

**Scale/Scope**: `index.html` (cabecera, hero, 12 tarjetas con `<img>`, capa de fondo, `preload`), `css/estilos.css` (tokens y todas las secciones, ≈ +250 líneas), `js/principal.js` (≈ +140 líneas: fondo continuo, header, gesto), 13 SVG nuevos, 1 fuente, favicon, og-image, constitución y SPEC.md.

## Constitution Check

*GATE: debe pasar antes de la Fase 0. Se vuelve a comprobar tras el diseño (Fase 1).* Constitución v2.6.0.

| # | Principio | Estado | Evidencia / acción |
|---|---|---|---|
| I | Identidad y contenido | ⚠️ enmienda | Cambia la paleta, la tipografía y el logo («salvo que una spec pida cambiarla»: esta spec lo pide). Los tokens del hero (`--color-velo-*`, `--color-rayosx*`) **no cambian** para no alterar el 3D probado. Sin colores literales en CSS/JS: el JS lee los tokens con `getComputedStyle`. Los datos del negocio no cambian. |
| II | Contacto primero | ✅ | Barra fija, botón flotante y teléfono no cambian de sitio ni se tapan; solo se verifica su contraste sobre los fondos nuevos. No se toca el scroll (listener pasivo). |
| III | Presupuesto de peso | ✅ (a medir) | Playfair ≈ 30 KB, dos logos y 12 íconos con carga diferida (`loading="lazy"`); el total de íconos + logo ≤ 80 KB comprimidos. Se mide y reporta. |
| IV | Librerías y dependencias | ⚠️ enmienda | Fuentes: se añade Playfair Display a Poppins/Inter (autoalojada, sin CDN). Sin librerías nuevas. Poppins 700 queda solo si se usa (botones/eslogan); si deja de usarse se retira (peso). |
| V | Modelo 3D | ✅ | El modelo, los shaders y las imágenes del cráneo no cambian; los destellos son una capa HTML aparte sobre las imágenes y el canvas. |
| VI | Adaptación al dispositivo | ✅ | Con «reducir movimiento» no hay destellos, gesto ni transición animada (colores fijos por sección). Móvil apaisado bajo: sin gesto. |
| VII | Rendimiento en ejecución | ⚠️ justificada | Destellos, gesto y header usan `opacity`/`transform`; el fondo continuo cambia `background-color` de **una** capa fija (repintado de una sola capa, sin layout); alternativa de capas apiladas con `opacity` rechazada por complejidad (ver Complexity Tracking). Un solo `scroll` pasivo con rAF que no corre fuera de la zona que cambia. |
| VIII | Accesibilidad y responsive | ✅ con verificación | Contraste por conmutación de texto en el cruce (mínimo ≥ 4,5 : 1, verificado por muestreo); foco visible con color adaptado a cada fondo; íconos decorativos `alt=""`; logo con nombre accesible; mínimo 16 px y 44 × 44 px. |
| IX | Verificación | ✅ | [quickstart.md](quickstart.md) E1–E10, con móvil emulado en 4G y registro en `verificacion.md`. |

**Gate**: sin violaciones sin justificar. Enmiendas I, IV (y VII precisado) → constitución **v2.7.0** (MINOR) y decisión **D-23** en `SPEC.md` §11, ambas **antes** de escribir el código de la feature.

**Re-evaluación post-diseño**: sin cambios; el diseño no añade dependencias ni peticiones externas.

## Project Structure

### Documentation (this feature)

```text
specs/003-rediseno-estetica/
├── plan.md                  # Este archivo (/speckit-plan)
├── research.md              # Fase 0
├── data-model.md            # Fase 1
├── quickstart.md            # Fase 1
├── contracts/
│   └── interfaz.md          # Fase 1 (tokens, DOM, atributos, variables, eventos)
├── checklists/
│   └── requirements.md      # /speckit-specify
└── tasks.md                 # Fase 2 (/speckit-tasks — NO lo crea /speckit-plan)
```

### Source Code (repository root)

```text
index.html                   # capa .fondo-continuo, header con logo nuevo, hero (logo, botón de cristal, .hero__efectos), 12 tarjetas con <img>, preload de Playfair
css/estilos.css              # tokens nuevos; header; hero; fondos por sección (fallback) y modo continuo; tarjetas; reseñas; pie
js/principal.js              # fondo continuo y texto adaptable, estado del header, gesto de toque (lee dentadura:apertura)
assets/
├── fonts/playfair-display-*.woff2 (+ LICENSE.txt ampliado)
├── logos/                   # originales del cliente (se conservan sin publicar en Netlify; ver R4)
└── img/
    ├── logo-claro.svg  logo-oscuro.svg
    └── iconos/<servicio>.svg    # 12 íconos normalizados
referencias/herramientas/
├── normalizar-svg.py        # recorta, redondea, une capas, centra y recolorea los SVG (no se publica)
└── puntos-destellos.py      # calcula las posiciones de los destellos desde la máscara alfa de los dientes
favicon.svg  assets/og-image.jpg   # regenerados con el logo nuevo
.specify/memory/constitution.md  SPEC.md   # enmienda v2.7.0 y D-23
```

**Structure Decision**: sin cambios de estructura: sitio estático de una página; los activos generados viven en `assets/img/`; las herramientas, en `referencias/herramientas/` (no se publica, `netlify.toml` ya lo bloquea).

## Complexity Tracking

| Desviación | Por qué hace falta | Alternativa más simple rechazada |
|---|---|---|
| `background-color` animado por scroll (VII dice `transform`/`opacity`) | El fondo debe recorrer 8+ colores de forma continua con el scroll; es una sola capa fija, repintado barato, sin layout | Capas apiladas con `opacity`: 8 capas a pantalla completa en GPU, más memoria en móvil de gama baja |
| Dos variantes de color del logo (claro y oscuro) | El header oscuro y el hero claro exigen contraste distinto; un SVG con `fill` baked no cambia | `currentColor` con SVG en línea: añadiría ≈ 40 KB al HTML crítico |
| Íconos como `<img>` con color fijo en lugar de heredar `currentColor` | Permite `loading="lazy"` nativo sin JS y cache por archivo | `mask-image` con token: se piden todos los SVG al instante y no admite lazy nativo |
