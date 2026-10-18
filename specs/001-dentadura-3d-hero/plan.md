# Implementation Plan: Cráneo 3D en rayos X sobre velos de luz en el hero

**Branch**: `001-dentadura-3d-hero` | **Date**: 2026-10-09 · revisado 2026-10-12 (D-17) | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-dentadura-3d-hero/spec.md`

## Summary

Sustituir el slider de fotos del hero por un cráneo inferior 3D con aspecto de radiografía (hueso azul marino translúcido y dientes blancos) sobre un fondo de velos de luz translúcidos que se mueven con el cursor: cerrado al cargar, con la mandíbula que se abre con el scroll nativo. Al abrirse se revelan el eslogan y el botón «Conoce nuestros servicios». El póster WebP (`craneo-cerrado.webp`) sobre un degradado CSS de velos es el LCP y el respaldo (movimiento reducido, ahorro de datos, equipo lento, sin WebGL o fallo del modelo).

Enfoque técnico (detalle en [research.md](research.md)): un único módulo ES propio (`js/dentadura.js`) cargado de forma diferida tras el primer pintado; three.js 0.186.1 vendorizado como **un bundle minificado de una sola vez** (≈139 KB brotli); **un solo canvas** a todo el escenario del hero donde primero se dibuja el fondo de velos (shader de pantalla completa) y encima el hueso con mezcla multiplicativa (efecto rayos X) y los dientes con un shader propio; el cursor mueve los velos (paralaje + lente local) e inclina el cráneo; progreso de apertura calculado por `principal.js` (bloqueo de introducción: las primeras acciones de scroll lo avanzan con velocidad máxima) y expuesto como propiedad CSS `--apertura`, atributo `data-revelado` y evento `dentadura:apertura`, de modo que el revelado del eslogan sea CSS puro y no dependa de que el 3D cargue; también se autoalojan Poppins/Inter (D-16). Sin GSAP ni Lenis (Spec 2).

## Technical Context

**Language/Version**: HTML5, CSS3 y JavaScript ES2020+ sin transpilar (módulos ES nativos); GLSL ES 1.00/3.00 vía three.js. Sin Node en el sitio.

**Primary Dependencies**: three.js 0.186.1 (MIT) con `GLTFLoader` y `MeshoptDecoder`, en un bundle recortado `assets/js/vendor/three-dentadura.min.js` (regenerado el 2026-10-12 con las clases que necesitan la mezcla multiplicativa y el triángulo de pantalla completa). Fuentes Poppins/Inter (OFL) en WOFF2.

**Storage**: N/A (archivos estáticos; sin cookies ni `localStorage`).

**Testing**: Verificación manual guiada + herramientas ad hoc no versionadas (DevTools, Lighthouse, opcionalmente un script puntual de Playwright para SC-004). Ver [quickstart.md](quickstart.md). El repositorio no incorpora framework de pruebas (principio IV: sin build ni dependencias).

**Target Platform**: Navegadores modernos de escritorio y móvil con WebGL (Chrome, Safari iOS 15+, Firefox, Edge), mobile-first desde 360 px; despliegue estático en Netlify o Cloudflare Pages.

**Project Type**: Sitio web estático de una página (landing).

**Performance Goals**: LCP < 2,5 s en 4G con el póster como LCP; CLS ≈ 0; ≥ 55 fps en escritorio y ≥ 30 fps en móvil de gama media; Lighthouse móvil ≥ 90.

**Constraints**: Carga crítica ≤ 500 KB; diferido ≤ 1,5 MB; GLB ≤ 400 KB (209 / 74 KB); ≤ 50 000 triángulos (escritorio, ≈ 41 000) / ≈ 15 000 (móvil, ≈ 12 300); póster ≤ 60 KB (24 KB); 0 peticiones a dominios externos; el scroll nativo solo se bloquea en el bloqueo de introducción de la constitución v2.3.0; el contacto nunca queda tapado.

**Scale/Scope**: Una sección (hero), un módulo JS nuevo (~300–400 líneas), cambios en `index.html`, `css/estilos.css` y `js/principal.js`, 4 fuentes WOFF2, 1 bundle vendor.

Todos los puntos "NEEDS CLARIFICATION" quedaron resueltos en [research.md](research.md) (R1–R12).

## Constitution Check

*GATE: debe pasar antes de la Fase 0. Se vuelve a comprobar tras el diseño (Fase 1).* Constitución v2.3.0.

| # | Principio | Estado | Evidencia / acción |
|---|---|---|---|
| I | Identidad y contenido | ✅ con acción | Colores del hero 3D (`--color-rayosx`, `--color-rayosx-luz`, `--color-velo-*`, `--color-superficie`) leídos en tiempo de ejecución, sin literales en JS ni en shaders (R7); hero con fondo de velos (tokens) y sin overlay oscuro; datos del negocio siguen en `NEGOCIO`. **Deuda previa** en `css/estilos.css`: literales fuera de `:root` (`rgba(15,110,110,.08)` en `.boton--fantasma:hover`, `#E8A93A` en estrellas, `rgba(0,0,0,.12)` en la barra fija; los del hero desaparecen con el rediseño) → se tokenizan en esta feature (tarea). El texto «La confianza en tu sonrisa…» ya es contenido existente, no inventado. |
| II | Contacto primero | ✅ | `.hero__contacto` siempre visible y por encima del canvas (contrato §5); `touch-action: pan-y`; el scroll solo se intercepta en el *bloqueo de introducción* acotado que permite la constitución v2.3.0 (una vez, con salidas de emergencia, sin tocar el contacto); anclas y `data-campo` se conservan. El slider retirado está respaldado por D-15. |
| III | Presupuesto de peso | ✅ (a medir) | Crítica estimada: HTML ≈ 20 KB + CSS ≈ 4 KB gz + `principal.js` ≈ 2 KB gz + fuentes ≈ 70 KB + póster 24 KB ≈ 125 KB ≪ 500 KB. Diferido: ≈ 139 KB + 209/74 KB ≈ 350/215 KB ≪ 1,5 MB. El póster es el LCP con `fetchpriority="high"` y `width`/`height`. Se mide y reporta en `verificacion.md`. |
| IV | Librerías y dependencias | ✅ con nota | three.js vendorizado en `assets/js/vendor/` con versión y licencia; sin CDN; fuentes autoalojadas en `assets/fonts/`; sin analítica. **Nota**: el bundle se genera una sola vez con esbuild a partir del paquete npm sin alterar el código (ver Complexity Tracking). |
| V | Modelo 3D | ⚠️ pendiente | Cráneo inferior, GLB meshopt 209/74 KB, shaders propios (rayos X, dientes, velos), sin texturas ni mapa de entorno ni luces de three.js, carga diferida con póster 24 KB. **Pendiente (bloquea la publicación)**: confirmar con el cliente el origen y la licencia del escaneo (`assets/models/README.md`); la constitución exige autoría documentada. |
| VI | Adaptación al dispositivo | ✅ | Tres niveles con detección en R3 (reduced-motion, saveData, WebGL, memoria/núcleos, táctil + ancho); cada API con encadenamiento opcional. |
| VII | Rendimiento en ejecución | ✅ | Solo `transform`/`opacity` en CSS; pausa con `IntersectionObserver` y `visibilitychange`; `destroy()` con `dispose()`; DPR ≤ 2; guardia de fps (R3, R9). |
| VIII | Accesibilidad y responsive | ✅ con verificación | `canvas` y póster `aria-hidden`/`alt=""`; un solo `<h1>`; «Conoce nuestros servicios» alcanzable con Tab y visible con `:focus-visible`; contraste ≥ 4,5:1 (halos claros del `<h1>`, eslogan y horario sobre los velos, R5); 360 px sin scroll horizontal; zoom 200 %. Riesgo: encuadre en 360×640 (R5). |
| IX | Verificación | ✅ | [quickstart.md](quickstart.md) cubre peso, tiempo de carga, fluidez, reduced-motion, teclado y contacto; resultados en `verificacion.md`. |

**Gate**: sin violaciones sin justificar → se puede continuar. Re-evaluación post-diseño: **sin cambios**; el diseño de Fase 1 (contrato, modelo de datos) no añade dependencias ni peso.

## Project Structure

### Documentation (this feature)

```text
specs/001-dentadura-3d-hero/
├── plan.md              # Este archivo (/speckit-plan)
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/
│   └── hero-dentadura.md  # Fase 1 (DOM, atributos, evento y propiedad CSS, módulo)
├── checklists/
│   └── requirements.md  # /speckit-specify
└── tasks.md             # Fase 2 (/speckit-tasks — NO lo crea /speckit-plan)
```

### Source Code (repository root)

```text
index.html                         # hero rediseñado; <link> a Google Fonts eliminados; preload del póster y fuentes; script de <head> para data-hero
css/
└── estilos.css                    # @font-face; hero estático/animado (altura fija); revelado por --apertura; tokenizar literales
js/
├── principal.js                   # NEGOCIO + propagación (se conserva); se elimina el slider; decide nivel; import() diferido
└── dentadura.js                   # NUEVO · módulo ES: carga GLB, shaders, bucle, scroll, puntero, pausa, destroy
assets/
├── img/
│   ├── craneo-cerrado.webp        # póster (524×564, 24 KB, fondo blanco opaco; se mezcla con multiply)
│   └── (hero-1/2/3.jpg se retiran)
├── models/
│   ├── craneo.glb                 # completo (209 KB)
│   ├── craneo-ligero.glb          # móvil (74 KB)
│   └── README.md                  # autoría pendiente de confirmar, estructura y materiales
├── fonts/                         # NUEVO · Poppins 600/700, Inter 400/500 (.woff2) + LICENSE.txt
└── js/vendor/                     # NUEVO
    ├── three-dentadura.min.js     # bundle one-shot (three@0.186.1)
    ├── LICENSE-three.txt          # MIT
    └── README.md                  # versión, comando esbuild y entrada del bundle
referencias/                       # no se publica (ver .gitignore/Netlify)
└── demo-rayosx.html               # referencia de comportamiento del cráneo en rayos X
SPEC.md                            # D-15, D-16 y D-17 registradas
```

**Structure Decision**: sitio estático plano sin `src/` ni `tests/`; el código propio vive en `js/` (el JS actual ya está ahí) y las librerías de terceros en `assets/js/vendor/` según la constitución (se resuelve así el TODO de rutas de v2.0.0). El módulo 3D se separa de `principal.js` para que el script crítico no incluya nada de three.js.

## Complexity Tracking

| Desviación / interpretación | Por qué es necesaria | Alternativa más simple descartada porque |
|---|---|---|
| Bundle de three.js generado una vez con esbuild (herramienta de desarrollo, no build del sitio) | three@0.186.1 no publica build minificado; sin recortarlo son ~470 KB gz y 2,3 MB de JS a parsear en móvil. Con bundle: 139 KB brotli y ~0,9 MB | Copiar módulos sin minificar + `importmap`: cumple el presupuesto de bytes pero penaliza el parseo en móvil de gama media (principio VII). Se mantiene como plan B si se prefiere la lectura estricta de «sin build». |
| Script en línea mínimo en `<head>` (~300 bytes) para fijar `data-hero` | Evita el parpadeo del eslogan y el cambio de altura del hero tras el primer pintado (CLS) | Decidir en `principal.js` (al final del `<body>`): puede ejecutarse después del primer pintado. |

## Riesgos y preguntas abiertas para `/speckit-tasks`

1. **Encuadre en 360×640**: logo + `<h1>` + figura + contacto en una sola pantalla; en móvil la cabecera no es fija, así que al cargar quedan ≈ 76 px del escenario bajo el pliegue (la barra fija de contacto siempre es visible) y se ven completos al fijarse el escenario (R5).
2. **Encuadre póster ↔ 3D**: la cámara se calibra con `AJUSTE_ENCUADRE` (0,91) para que no haya salto en la sustitución (R6); verificado por superposición el 2026-10-12.
3. **Umbrales de equipo lento** (memoria/núcleos): calibrar con un móvil real.
4. **Color**: los shaders reciben los tokens como sRGB 0–1 sin conversión de espacio de color (R7); comprobar que el tinte de la radiografía coincide con `--color-rayosx` en pantalla.
5. **Publicación**: asegurar que `referencias/` y `specs/` no se despliegan (configuración de Netlify/Cloudflare o `.gitignore`/ignorar en publicación).
6. **Autoría del modelo**: confirmar origen y licencia del escaneo con el cliente antes de publicar.
