<!--
Sync Impact Report
- Version change: 2.0.0 → 2.1.0 (MINOR: guía ampliada y precisada; no se elimina ni se redefine
  ningún principio de forma incompatible)
- Modified principles:
  - I. Identidad y contenido: el color del contorno 3D se lee de --color-acento en tiempo de
    ejecución; el hero pasa a fondo blanco (--color-superficie) con texto oscuro, sin overlay.
  - II. Contacto primero: se elimina la mención a preservar el slider (retirado por D-15); se
    conservan anclas e inyección por data-campo.
  - III. Presupuesto de peso: el póster estático es el LCP; las fuentes cuentan en la carga crítica.
  - IV. Librerías y dependencias: fuentes Poppins/Inter autoalojadas en WOFF2 (assets/fonts/);
    sin Google Fonts ni preconnect a terceros; vendor en assets/js/vendor/, código propio en js/.
  - V. Modelo 3D: "diente" → dentadura humana (maxilar + mandíbula), geometría original, shaders
    propios (relleno blanco + contorno en espacio de pantalla), sin texturas ni mapa de entorno;
    autoría propia en lugar de licencia de terceros; póster WebP ≤ 60 KB.
  - VI. Adaptación al dispositivo: el nivel (a) usa el póster estático.
- Added sections: ninguna
- Removed sections: ninguna
- Resolved TODOs (de 2.0.0): fuentes de Google (se autoalojan), referencia a
  Spec-Driven-Development.md (ya corregida en SPEC.md), ruta de vendor vs js/principal.js.
- Follow-up TODOs:
  - SPEC.md: registrar D-15 en §11 (retiro del slider y fondo blanco del hero; reaplica
    RF-01/RF-10, §4.2, T-15/T-16 y hero-1/2/3), y D-16 (fuentes autoalojadas); actualizar §5.2.
  - SPEC.md §4.2/RF-01: el eslogan y el botón «Servicios» se muestran al abrirse la mandíbula;
    sin 3D o con movimiento reducido se muestran siempre.
  - Autoalojar Poppins 600/700 e Inter 400/500 en assets/fonts/ y retirar los <link> a Google.
  - Documentar la autoría del modelo (assets/models/) y la versión/licencia de three.js.
-->
# Constitución de la Landing Clínica Dental Dr. Rojas Pérez

## Core Principles

### I. Identidad y contenido (NON-NEGOTIABLE)
Los tokens CSS de `:root` (colores, tipografía, espaciado) MUST ser la única fuente de estilo;
ninguna regla CSS ni código JS (incluidos los shaders del 3D) puede contener un color literal:
el color del contorno de la dentadura MUST leerse en tiempo de ejecución del token
`--color-acento`. El hero tiene fondo blanco (`--color-superficie`) con texto oscuro y sin capa
overlay. Los datos del negocio (teléfono, WhatsApp, horario, dirección, coordenadas) MUST vivir
en un único bloque de constantes en `js/principal.js`, y los datos literales del `<head>` (title,
Open Graph, JSON-LD) MUST mantenerse sincronizados con él. La identidad actual (paleta,
Poppins/Inter, logo «HR») se conserva salvo que una spec pida cambiarla. Está prohibido publicar
datos inventados: reseñas, cifras, credenciales, servicios. Los contadores o estadísticas solo se
muestran con datos reales confirmados por el cliente. Si no hay reseñas reales, la sección se
elimina del HTML. Los textos van en español de México y trato de usted.
Razón: es un servicio de salud; el contenido falso es un problema legal y de confianza.

### II. Contacto primero (NON-NEGOTIABLE)
El acceso a contacto MUST estar visible y funcional en todo momento: barra fija inferior
(«Llamar» y «WhatsApp») en móvil, botón flotante de WhatsApp en escritorio y teléfono pulsable
(`tel:`). Nunca se muestran a la vez la barra y el botón flotante. Todos los enlaces `wa.me`
usan el mismo mensaje prellenado. Ninguna animación, transición ni efecto 3D puede taparlo,
retrasarlo ni bloquear el scroll nativo. Todo cambio MUST preservar la funcionalidad existente
(anclas, inyección por `data-campo`, datos del hero). El slider de fotos fue retirado por la
decisión D-15 de `SPEC.md` y no forma parte de la funcionalidad a preservar.
Razón: es el objetivo del proyecto y el público, mayoritariamente móvil con 4G, prefiere llamar
o escribir.

### III. Presupuesto de peso
Se mide el peso transferido, comprimido.
- Carga crítica (lo necesario para ver la página y contactar: HTML, CSS, JS base, fuentes y
  póster): máximo 500 KB.
- Carga diferida (3D, animaciones, modelo): máximo 1,5 MB, iniciada solo después del primer
  pintado y cuando el navegador esté libre.
- Total en escritorio: máximo aproximado de 2 MB. En móvil de gama media: máximo aproximado de
  1,5 MB.
- Contenido principal visible en menos de 2,5 s en 4G, sin desplazamiento de contenido durante
  la carga. El póster estático de la dentadura es el elemento LCP y MUST estar declarado con
  `width`/`height` y cargarse con prioridad.
Ningún cambio se considera terminado si supera estos límites. El peso real MUST medirse y
reportarse en cada feature.

### IV. Librerías y dependencias
Solo se permiten librerías de animación y 3D necesarias: GSAP, ScrollTrigger, Lenis, Three.js o
su alternativa ligera aprobada en el plan. MUST descargarse dentro de `assets/js/vendor/`, con
su versión y licencia registradas, nunca desde un CDN ni como script de terceros. El código
propio vive en `js/`. Las fuentes (Poppins 600/700 e Inter 400/500) MUST autoalojarse en WOFF2
en `assets/fonts/`, con `font-display: swap`; la página no hace peticiones a Google Fonts ni
`preconnect` a dominios de terceros. Ninguna dependencia nueva sin justificar su peso. Sin
analítica ni cookies. Fuera de lo anterior, el proyecto sigue siendo HTML, CSS y JavaScript sin
build ni frameworks.

### V. Modelo 3D
El hero MUST mostrar una dentadura humana (maxilar y mandíbula con dientes y encías) de
geometría original, entregada como GLB comprimido con meshopt de 400 KB como máximo (versión
completa y versión ligera para móvil), con hasta ~50 000 triángulos en escritorio y ~15 000 en
móvil (el contorno duplica los dibujados). El modelo se renderiza con shaders propios: relleno
blanco y contorno de grosor constante en píxeles en espacio de pantalla, sin texturas, sin mapa
de entorno y sin iluminación; el material `KHR_materials_unlit` del GLB se sustituye por ellos.
Por ser geometría original no requiere licencia de terceros, pero su autoría MUST quedar
documentada. Se carga de forma diferida, con un póster estático WebP con transparencia (máximo
60 KB) visible mientras carga y siempre que el 3D no pueda mostrarse.

### VI. Adaptación al dispositivo
Tres niveles:
- (a) Con `prefers-reduced-motion`, ahorro de datos, equipo lento o sin WebGL: solo el póster
  estático, sin 3D ni scroll suave.
- (b) Móvil: modelo ligero y límite de resolución de pantalla del render.
- (c) Escritorio: versión completa.
La detección usa características disponibles, con degradación segura cuando una API no exista
en el navegador.

### VII. Rendimiento en ejecución
Se anima solo `transform` y `opacity` siempre que sea posible. El render 3D MUST pausarse
cuando la dentadura no esté en pantalla o la pestaña esté oculta, y liberar sus recursos al
destruirse. Objetivo de 60 fps y mínimo aceptable de 30 fps en un móvil de gama media, con
interacción sin retrasos perceptibles.

### VIII. Accesibilidad y responsive
Mobile-first desde 360 px, sin desplazamiento horizontal (puntos de quiebre 768 px y 1024 px).
Texto mínimo de 16 px y contraste de 4.5:1. Navegación completa por teclado con foco visible
y áreas pulsables de al menos 44×44 px. El contenido nunca depende de una animación para ser
legible. El objeto 3D es decorativo y se marca como tal para lectores de pantalla. Las
imágenes informativas llevan texto alternativo descriptivo; con `width`/`height` declarados y
`loading="lazy"` bajo el pliegue. Si una spec añade un formulario, cada campo MUST tener su
`<label>`. Un único `<h1>` y jerarquía de encabezados coherente.

### IX. Verificación
Cada feature se valida en móvil real o emulado con red 4G limitada antes de darse por
terminada, comprobando peso, tiempo de carga, fluidez y comportamiento con movimiento reducido,
además de la navegación por teclado y que el contacto sigue accesible (principio II).

## Restricciones Técnicas y de Contenido

- Alcance excluido salvo enmienda de `SPEC.md`: precios, FAQ, formularios, agenda en línea,
  analítica, blog, segundo idioma y CMS.
- SEO base obligatorio: `title`, `meta description` (150–160 caracteres), Open Graph, Twitter
  Card, JSON-LD `Dentist`, canonical, favicon y `lang="es-MX"`.
- Despliegue estático en Netlify o Cloudflare Pages, con HTTPS.
- Estructura de archivos y convención de nombres según `SPEC.md` §7, más `assets/js/vendor/`
  para librerías, `assets/fonts/` para fuentes y `assets/models/` para los GLB.
- Los archivos de referencia de desarrollo (por ejemplo `referencias/`) no se publican.

## Flujo de Desarrollo y Puertas de Calidad

- `SPEC.md` es la fuente de verdad del alcance; todo cambio de alcance MUST registrarse en su
  registro de decisiones (§11) antes o junto con el cambio de código.
- El trabajo sigue el flujo Spec Kit: especificar, planificar, generar tareas e implementar.
- No se publica mientras quede un valor de prueba de `SPEC.md` §8 en la página.
- Toda revisión MUST comprobar el cumplimiento de los nueve principios.

## Governance

Esta constitución prevalece sobre otras prácticas del proyecto. Las enmiendas requieren un
cambio documentado en este archivo, con el informe de impacto y, si afectan al alcance, la
entrada correspondiente en `SPEC.md` §11. El versionado es semántico: MAJOR para eliminar o
redefinir principios de forma incompatible, MINOR para añadir principios o ampliar guía de forma
material, PATCH para aclaraciones y redacción. Los planes (`plan.md`) MUST incluir una
verificación de cumplimiento con los nueve principios, y toda desviación MUST justificarse por
escrito.

**Version**: 2.1.0 | **Ratified**: 2026-10-09 | **Last Amended**: 2026-10-09
