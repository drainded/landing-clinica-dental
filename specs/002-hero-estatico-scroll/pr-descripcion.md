## Hero estático con transición cráneo cerrado → abierto (spec 002)

### Qué cambia
- **Hero de imágenes rediseñado:** cráneo cerrado inicial; al hacer scroll, fundido suave al cráneo abierto con el eslogan «La confianza en tu sonrisa comienza aquí» y el botón «Conoce nuestros servicios» en la boca. Posiciones idénticas a las del hero 3D (silueta ≤ 1,71 %, cajas 0 px).
- **Solo dos modos:** 3D (`data-hero="animado"`) e imágenes (`data-hero="estatico"`: ahorro de datos, equipo lento, «reducir movimiento» o 3D fallido). El modo de imágenes lleva siempre la transición, también con movimiento reducido (D-20).
- **Bloqueo de introducción en ambos modos (D-21):** las primeras acciones de scroll (rueda/toque/teclas) abren el cráneo a velocidad máxima controlada sin desplazar la página; el eslogan y el botón aparecen con opacidad creciente. Se libera al abrir del todo y se rearma al volver arriba. Salidas: Tab, anclas, scroll externo, carga desplazada.
- **Imágenes:** cráneo cerrado y dos variantes del abierto (móvil/escritorio) generadas desde el propio módulo 3D (WebP, 29–36 KB el hueso); **los dientes van en una capa aparte con transparencia** (`*-dientes.webp`, 18–32 KB, D-22), fuera del `multiply`, para que sean blancos como en el 3D y no azulados por el fondo; fondos de PC y móvil regenerados a partir de `fondo-hero-estatico.jpg` (32/22 KB), movido a `referencias/herramientas/fuentes/`.
- **Carga:** el cráneo abierto se pide solo en la variante necesaria; el cerrado solo desaparece cuando el abierto cargó; si falla, el hero sigue completo.
- **Herramientas de desarrollo** (no se publican) en `referencias/herramientas/`: `hero.mjs`, `codificar-craneo.py`, `generar-fondo.py`.
- **Documentación:** constitución v2.6.0 (excepción del principio II ampliada a ambos modos), `SPEC.md` (D-19, D-20, D-21, D-22), artefactos de `specs/002-hero-estatico-scroll/`.

### Verificación
- Batería automática en 390×844 y 1440×900: comparar, bloqueo (3 perfiles), modos, relevo, táctil, cajas (CLS ≤ 0,005), red. Ver `specs/002-hero-estatico-scroll/verificacion.md`.
- Lighthouse del modo de imágenes: rendimiento 89–97, accesibilidad/prácticas/SEO 100, LCP 2,3 s, CLS 0.
- Crítica ≈ 160–195 KB gzip (incluye +18 KB de los dientes del cráneo cerrado) (límite 500 KB); 0 dominios externos.

### A tener en cuenta
- **Móvil real (T042):** probado en Android/Chrome con «quitar animaciones» activo; la apertura y el cierre del cráneo son correctos. T032 queda sustituida por T042.
- **Seguimiento opcional:** probar en un teléfono sin «quitar animaciones» y en Safari iOS / Firefox, para comprobar que cambiar el `media` de los `<source>` dispara la descarga del cráneo abierto (plan B: asignar `srcset` desde JS).
- Sensibilidad del bloqueo táctil ajustable en `js/principal.js` (`DISTANCIA_TOQUE`, `DISTANCIA_RUEDA`, `BLOQUEO_VELOCIDAD`).
- Riesgo de accesibilidad registrado: interceptar el scroll con «reducir movimiento» (constitución/spec).
- Decisión del cliente pendiente: aceptar el cambio de fondo imagen→velos al llegar el 3D; el fondo es una recomposición procedural.
