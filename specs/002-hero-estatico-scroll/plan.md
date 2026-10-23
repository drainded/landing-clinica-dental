# Implementation Plan: Hero estático rediseñado con transición por scroll

**Branch**: `002-hero-estatico-scroll` (propuesta; aún no creada) | **Date**: 2026-10-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-hero-estatico-scroll/spec.md`

## Summary

Rediseñar la versión estática del hero para que sea idéntica en posiciones a la del 3D: cráneo cerrado acercado sobre un fondo nuevo (imagen de velos azules con versión de PC y de móvil), y, al hacer scroll, una transición suave y reversible hacia el cráneo abierto con el eslogan y el botón «Conoce nuestros servicios» juntos en el hueco de la boca. Con movimiento reducido (y sin JS, y en móvil apaisado bajo) se muestra directamente la composición final, sin animación.

Enfoque técnico (detalle en [research.md](research.md)):

- **Una sola disposición** para todos los modos (la del 3D) y **una sola variable de progreso** `--apertura` con tres fuentes: el bloqueo de introducción (3D, sin cambios), el **scroll nativo** (estático con transición, hero anclado con `position: sticky`) o una constante `1` (composición final). El revelado de eslogan y botón ya depende de esa variable.
- **Transición** = fundido póster cerrado → imagen abierta con las mismas curvas que el 3D (`smoothstep(apertura / 0,7)`) y una **traslación compensatoria** (la cámara del 3D baja hacia la boca) para que no haya doble perfil. Solo `opacity` y `transform`.
- **Las imágenes del cráneo salen del propio módulo 3D** (opción `captura` de desarrollo en `js/dentadura.js`, capturada con Chrome sin interfaz): mismos shaders, cámara, encuadre y difuminado bajo los textos. Dos variantes del abierto (móvil y escritorio) porque el difuminado depende del formato.
- **Fondo**: la original (735 × 595 px) se amplía y limpia (camino A) o se recompone en el mismo estilo (camino B), para PC (1920 × 1080) y móvil (828 × 1792), con la banda oscura retirada de las zonas de texto para cumplir 4,5 : 1.
- **Carga**: fondo y cráneo cerrado críticos; cráneo abierto diferido (o inmediato y con prioridad alta con movimiento reducido) mediante un `<picture>` cuyo `<img>` arranca con un GIF vacío y cuyos `<source>` se activan por `media` desde JS; el póster cerrado permanece visible hasta que el abierto esté listo (`data-abierto-listo`).

## Technical Context

**Language/Version**: HTML5, CSS3 y JavaScript ES2020+ sin transpilar. Herramientas de desarrollo (no publicadas): Node 24 (CDP sin dependencias) y Python con Pillow 12.3.

**Primary Dependencies**: ninguna nueva en el sitio. Chrome instalado y Pillow para las herramientas de `referencias/herramientas/`.

**Storage**: N/A (archivos estáticos).

**Testing**: verificación guiada y scripts de comparación ad hoc, sin framework (principio IV). Ver [quickstart.md](quickstart.md).

**Target Platform**: navegadores modernos de escritorio y móvil; mobile-first desde 360 px; despliegue estático.

**Project Type**: sitio web estático de una página (landing).

**Performance Goals**: LCP < 2,5 s en 4G; CLS ≈ 0; transición ≥ 55 fps (escritorio) y ≥ 30 fps (móvil de gama media); Lighthouse móvil ≥ 90.

**Constraints**: carga crítica ≤ 500 KB (estimada 140–230 KB); fondo PC ≤ 80 KB y móvil ≤ 50 KB; cada cráneo ≤ 60 KB; 0 peticiones a dominios externos; scroll nativo nunca bloqueado en modo estático; contacto siempre visible; colores solo desde tokens (las imágenes son activos).

**Scale/Scope**: cambios en `index.html` (marcado del hero, `preload`, script del `<head>`), `css/estilos.css` (hero), `js/principal.js` (≈ +70 líneas), `js/dentadura.js` (opción `captura`, ≈ +25 líneas), 5 imágenes (2 de fondo, 1 cerrado, 2 abiertos) y 3 herramientas de desarrollo (`hero.mjs`, `codificar-craneo.py`, `generar-fondo.py`).

## Constitution Check

*GATE: debe pasar antes de la Fase 0. Se vuelve a comprobar tras el diseño (Fase 1).* Constitución v2.3.0.

| # | Principio | Estado | Evidencia / acción |
|---|---|---|---|
| I | Identidad y contenido | ✅ | Ningún color literal nuevo en CSS/JS: el fondo de respaldo y los halos usan tokens (`--color-velo-fondo`, `--color-superficie`); los colores de las imágenes son activos generados con la paleta. Los datos del negocio y el eslogan no cambian. **Se retiran** los degradados de velos del CSS (`--velo-*-suave`); si dejan de usarse se eliminan los tokens. |
| II | Contacto primero | ✅ | La transición usa **scroll nativo** (anclaje `sticky`, sin interceptar eventos ni `overflow: hidden` en `<html>`/`<body>`); el bloqueo de introducción queda solo para el 3D. `.hero__contacto`, la barra fija y el botón flotante conservan su `z-index`/`position: fixed` (verificación E8). |
| III | Presupuesto de peso | ✅ (a medir) | Crítica ≈ 140–230 KB frente a 500 KB; cráneo abierto diferido; cada perfil descarga solo lo suyo (R6, R9). Cráneo cerrado con `width`/`height` y `fetchpriority="high"` siguen siendo el LCP en los modos con movimiento. |
| IV | Librerías y dependencias | ✅ | Sin dependencias nuevas en el sitio. Las herramientas (`referencias/herramientas/`: Node sin paquetes, Python/Pillow) no se publican (`/referencias/*` → 404). |
| V | Modelo 3D | ⚠️ enmienda | El 3D no cambia (la opción `captura` no altera el comportamiento por defecto). El texto exige «un póster estático WebP (máximo 60 KB)»: pasan a ser **dos imágenes de cráneo** (cerrado y abierto) más fondos. Se enmienda para aclarar que el límite de 60 KB aplica a **cada** imagen de cráneo (ver Complexity Tracking). |
| VI | Adaptación al dispositivo | ⚠️ enmienda | El nivel (a) dice «solo el póster estático, sin 3D ni scroll suave»: ahora incluye la composición abierta y, con ahorro de datos/equipo lento sin movimiento reducido, una transición por scroll de `opacity`/`transform`. No es «scroll suave» (Lenis) y respeta movimiento reducido. Se aclara en la redacción. |
| VII | Rendimiento en ejecución | ✅ | Solo `opacity`/`transform`; un único `scroll` pasivo con rAF que se detiene al alcanzar el objetivo o al salir el hero de pantalla; la actualización de `--apertura` afecta a ≈ 6 elementos. |
| VIII | Accesibilidad y responsive | ✅ con verificación | Imágenes `alt=""`/`aria-hidden`; eslogan y botón son texto real, alcanzables con Tab y visibles con `:focus-visible` aunque `apertura = 0`; contraste ≥ 4,5 : 1 comprobado por script (R7); sin desplazamiento horizontal en 360 px; 200 % de zoom; movimiento reducido sin animación. |
| IX | Verificación | ✅ | [quickstart.md](quickstart.md) E1–E9, con prueba en móvil real y registro en `verificacion.md`. |

**Gate**: sin violaciones sin justificar → se puede continuar. Las dos enmiendas (V y VI) amplían la guía (MINOR → **v2.4.0**) y la decisión **D-19** se registra en `SPEC.md` §11: ambas se hacen **antes** de escribir el código de la feature (son las primeras tareas de la Fase 1 de `tasks.md`), no al final.

**Re-evaluación post-diseño**: sin cambios. El diseño de Fase 1 no añade dependencias ni peso fuera del presupuesto; se confirma que el modo estático no necesita interceptar el scroll.

## Project Structure

### Documentation (this feature)

```text
specs/002-hero-estatico-scroll/
├── plan.md                  # Este archivo (/speckit-plan)
├── research.md              # Fase 0
├── data-model.md            # Fase 1
├── quickstart.md            # Fase 1
├── contracts/
│   └── hero-estatico.md     # Fase 1 (DOM, atributos, propiedades CSS, herramientas)
├── checklists/
│   └── requirements.md      # /speckit-specify
└── tasks.md                 # Fase 2 (/speckit-tasks — NO lo crea /speckit-plan)
```

### Source Code (repository root)

```text
index.html                         # <picture class="hero__abierto">; preload condicionados por media; script del <head> añade data-transicion
css/
└── estilos.css                    # disposición única del hero; fondo por imagen; fundido y traslación; anclaje sticky; reglas de movimiento reducido
js/
├── principal.js                   # controlarTransicionScroll(), habilitarImagenAbierta(); degradación del 3D → apertura = 1
└── dentadura.js                   # opción `captura` (solo desarrollo; sin cambio de comportamiento por defecto)
assets/img/
├── fondo-hero-pc.webp             # NUEVO · 1920 × 1080, ≤ 80 KB
├── fondo-hero-movil.webp          # NUEVO · 828 × 1792, ≤ 50 KB
├── craneo-cerrado.webp            # se conserva o se regenera con la herramienta (≤ 60 KB)
├── craneo-abierto-escritorio.webp # NUEVO · ≤ 60 KB (difuminado horneado a 1440 × 900)
├── craneo-abierto-movil.webp      # NUEVO · ≤ 60 KB (difuminado horneado a 390 × 844)
(fondo-hero-estatico.jpg)          # original del cliente: se mueve a referencias/herramientas/fuentes/ (ver nota)
referencias/herramientas/          # NUEVO · no se publica
├── hero.mjs                       # Node + CDP: subcomandos capturar | cajas | comparar y perfiles de modo
├── codificar-craneo.py            # PNG + JSON → WebP ≤ 60 KB
└── generar-fondo.py               # fondos PC/móvil + medición de contraste
SPEC.md                            # D-19
.specify/memory/constitution.md    # enmienda de V y VI
```

**Structure Decision**: sitio estático plano, igual que la spec 001. Las herramientas de captura y medición viven en `referencias/` (ya excluida de la publicación) para no añadir build ni dependencias al sitio. **Nota**: `fondo-hero-estatico.jpg` (25 KB) es solo la fuente del fondo: se mueve a `referencias/herramientas/fuentes/` (no se publica) para que `assets/img/` contenga únicamente lo que sirve el sitio.

## Complexity Tracking

| Desviación / interpretación | Por qué es necesaria | Alternativa más simple descartada porque |
|---|---|---|
| Enmienda de los principios V y VI (dos imágenes de cráneo; transición por scroll en nivel estático) | El diseño pedido exige una segunda imagen y una transición; el texto actual habla de «el póster» en singular | Mantener una sola imagen → no puede mostrar la boca abierta ni la posición del eslogan del 3D |
| Opción `captura` en `js/dentadura.js` | Es la única forma de generar el cráneo abierto con los mismos shaders, cámara y difuminado que el 3D (FR-002) | Capturas manuales o otro motor de render → no reproducibles ni exactos; no cumplirían ≤ 2 % |
| Dos variantes del cráneo abierto (móvil y escritorio) | El difuminado bajo los textos depende del formato de pantalla (R5) | Una sola variante → el difuminado no coincidiría con los textos en uno de los dos formatos |
| Python/Pillow como herramienta de desarrollo (`referencias/herramientas/*.py`) | Es lo que ya está instalado y codifica WebP con control de calidad; no forma parte del sitio ni de su publicación | Reescribirlas en Node → requeriría una dependencia nueva (p. ej. `sharp`) |
| Anclaje `sticky` con recorrido extra (`≈ 80svh`) en modo estático | La transición por scroll necesita que el hero permanezca a la vista | Desplazarse normalmente mientras cambia la imagen → el eslogan saldría antes de poder leerse |

## Riesgos y puntos abiertos para `/speckit-tasks`

1. **Calidad del fondo** (R7): decidir A o B con revisión visual; el móvil probablemente necesite composición propia. Confirmar con el cliente que aprueba un fondo recompuesto si A no alcanza.
2. **Difuminado en ventanas intermedias** (R5): contraste a validar en 6 tamaños; plan B: tercera variante o difuminado más generoso.
3. **Doble perfil a mitad de transición** (R3): si la traslación compensatoria no basta, se pasa a 5–8 fotogramas intermedios.
4. **Franja inferior en móvil durante el anclaje**: el escenario mantiene su altura y deja ≈ 76 px hasta la barra fija; depende de que los bordes del fondo terminen en `--color-velo-fondo`.
5. **Cambio dinámico de `media` en los `<source>`** (R6): comprobar en Chrome, Firefox y Safari que dispara la carga; plan B: asignar `srcset` desde JS.
6. **Cambio de fondo en el relevo a 3D** (R6b): revisión visual; si no es aceptable, nueva spec para usar la imagen en el 3D.
7. **Distancia `D`** (80 svh): afinar con prueba en móvil real (inercia, barra de direcciones que se oculta y cambia `svh`).
8. **Rama y control de versiones**: crear `002-hero-estatico-scroll` y versionar `fondo-hero-estatico.jpg` antes de implementar.
