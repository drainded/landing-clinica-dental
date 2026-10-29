<!--
Sync Impact Report
- Version change: 2.7.0 → 2.8.0 (MINOR: se añade una segunda excepción acotada a la regla de no retrasar ni tapar el contacto;
  no se elimina ningún principio ni se debilita el scroll nativo una vez terminada la presentación)
- Modified principles:
  - II. Contacto primero: nueva excepción, la *pantalla de presentación* (D-25): cubre la página y la vuelve inerte mientras
    dura una animación corta de dientes sobre el logo y se decide el modo del hero (3D o imágenes). Condiciones: solo con JS y
    sin «reducir movimiento» (con ancla en la URL sí se muestra); tope de 4,5 s antes de cerrar y respaldo CSS a los 7 s; una vez por carga;
    no retrasa nada de la carga crítica.
  - Riesgo registrado: durante ≈ 2–4 s (hasta ≈ 5,6 s en el peor caso) no se puede llamar ni escribir por WhatsApp desde la
    página; el cliente lo pidió para evitar que se vea el modo estático al iniciar.
- Follow-up TODOs:
  - SPEC.md: D-25 registrada.
  - Medir la duración real en móvil de gama media y con red 4G limitada (principio IX).
-->
<!--
Sync Impact Report
- Version change: 2.6.0 → 2.7.0 (MINOR: la identidad visual cambia por petición expresa de una spec (003) y se amplía la
  guía de fuentes y de animación; no se elimina ningún principio ni se debilita el contacto ni el scroll nativo)
- Modified principles:
  - I. Identidad y contenido: la paleta pasa a la escala de 11 azules del cliente (`--azul-50` … `--azul-950`) más un gris
    oscuro frío (`--color-gris`), blanco, dorado (`--color-dorado`) y un texto oscuro casi negro (`--color-texto-oscuro`);
    el logo «HR» circular se sustituye por el diente con «HR» (dos variantes de color, claro y oscuro); los títulos usan
    Playfair Display. Los tokens del hero 3D (`--color-velo-*`, `--color-rayosx*`) no cambian. El color del fondo y del texto
    libre puede variar con el scroll mediante variables CSS (`--fondo`, `--texto`) que escribe `js/principal.js` leyendo
    los tokens; sigue prohibido el color literal fuera de `:root`. Los íconos y logos SVG son activos generados con la paleta.
  - IV. Librerías y dependencias: se añade Playfair Display (WOFF2 variable, SIL OFL, autoalojada, `font-display: swap`) a
    Poppins e Inter; sigue sin haber Google Fonts ni CDN.
  - VII. Rendimiento en ejecución: se admite cambiar el `background-color` de **una sola** capa fija a pantalla completa con
    el scroll (un `scroll` pasivo con rAF); el resto sigue animándose solo con `transform`/`opacity`.
  - VIII. Accesibilidad: el texto sobre fondo variable conmuta entre texto oscuro y claro en el punto de igual contraste
    (≥ 4,5 : 1 en todo el recorrido); sin interpolar el color del texto.
- Follow-up TODOs:
  - SPEC.md: D-23 registrada; §5.1 y §5.2 actualizados.
  - Prueba en móvil real del header translúcido, del fondo continuo y del gesto de toque (principio IX).
-->
<!--
Sync Impact Report
- Version change: 2.5.0 → 2.6.0 (MINOR: la excepción del «bloqueo de introducción» del principio II se amplía
  de uno a los dos modos del hero; no se elimina ningún principio ni se debilita el acceso a contacto)
- Modified principles:
  - II. Contacto primero: el bloqueo de introducción (las primeras acciones de scroll abren el cráneo con
    velocidad máxima, sin desplazar la página) se aplica también al hero de imágenes, incluso con
    `prefers-reduced-motion`, ahorro de datos o equipo lento; se retira la condición (4) que lo prohibía en esos
    casos y se sustituye por «no se activa sin JavaScript ni en móvil apaisado bajo». Siguen vigentes las demás
    condiciones (una sola vez, salidas de emergencia, sin `overflow: hidden`, contacto visible, zoom libre).
    Motivo: en la prueba en móvil real la transición por scroll normal pasaba de golpe y pedía desplazar mucho.
  - VI. Adaptación al dispositivo: el nivel (a) usa ese mismo bloqueo en lugar de una transición por scroll
    anclado; sigue sin movimiento propio ni efecto del cursor.
  - Riesgo de accesibilidad registrado: con «reducir movimiento» se intercepta el scroll durante la apertura
    (≈ 1 s como mínimo; liberable con Tab, anclas o la barra de scroll).
- Follow-up TODOs:
  - SPEC.md: D-21 registrada.
-->
<!--
Sync Impact Report
- Version change: 2.4.0 → 2.5.0 (MINOR: el respaldo de imágenes del hero lleva siempre la transición por scroll,
  también con «reducir movimiento»; no se elimina ningún principio ni se toca el scroll nativo ni el contacto)
- Modified principles:
  - VI. Adaptación al dispositivo: el nivel (a) ya no mostrará «la composición final sin ninguna animación» con
    movimiento reducido: recibe imágenes (sin 3D, sin velos que fluyen ni inclinación con el cursor) y la misma
    transición del cráneo cerrado al abierto, que solo avanza con el scroll de la propia persona (decisión del
    cliente tras la prueba en móvil real, 2026-10-23: el cambio de pose debe verse en todos los dispositivos).
  - Riesgo de accesibilidad registrado: quien tenga una sensibilidad fuerte al movimiento verá un fundido ligado a
    su propio scroll (sin movimiento autónomo). Solo hay dos modos: 3D e imágenes.
- Follow-up TODOs:
  - SPEC.md: D-20 registrada.
-->
<!--
Sync Impact Report
- Version change: 2.3.0 → 2.4.0 (MINOR: se amplía la guía del respaldo estático del hero; no se
  elimina ni se debilita ningún principio; el scroll nativo y el acceso a contacto no cambian)
- Modified principles:
  - III. Presupuesto de peso: el elemento LCP del modo con movimiento reducido es la imagen del
    cráneo abierto (no el póster cerrado); debe cargarse con prioridad (sin lazy).
  - V. Modelo 3D: el respaldo estático pasa de «un póster» a dos imágenes de cráneo generadas desde
    el propio modelo (cerrado y abierto, con una variante del abierto para móvil y otra para
    escritorio), de máximo 60 KB cada una, más un fondo de imagen con versión para PC (≤ 80 KB) y
    para móvil (≤ 50 KB).
  - VI. Adaptación al dispositivo: el nivel (a) deja de ser «solo el póster estático»: usa las
    imágenes estáticas. Con movimiento reducido se muestra la composición final sin animación; con
    ahorro de datos o equipo lento (sin movimiento reducido) puede haber una transición por scroll
    nativo que solo anima opacity/transform, nunca bloquea el scroll y no es «scroll suave» (Lenis).
  - Resto de principios: sin cambios.
- Added sections: ninguna
- Removed sections: ninguna
- Follow-up TODOs:
  - SPEC.md: D-19 registrada (hero estático rediseñado, spec 002).
  - Verificar la transición estática en móvil real (principio IX).
-->
<!--
Sync Impact Report
- Version change: 2.2.0 → 2.3.0 (MINOR: se admite una excepción acotada a la regla de no
  bloquear el scroll; no se elimina el principio II ni se debilita el acceso a contacto)
- Modified principles:
  - II. Contacto primero: se permite UN «bloqueo de introducción» en el hero (las primeras
    acciones de scroll, al cargar la página en lo alto, avanzan una animación con velocidad
    máxima en lugar de desplazar la página, para que un gesto largo no se la salte). Condiciones
    obligatorias: solo hasta completar la animación (y al regresar al inicio); el contacto
    (barra fija, botón flotante, teléfono) y los enlaces siguen pulsables; salidas de emergencia
    (Tab, anclas internas, desplazamiento externo, modo estático, carga ya desplazada); nunca con
    movimiento reducido o sin 3D; sin overflow:hidden en <html>/<body> ni scroll falso.
  - Resto de principios: sin cambios.
- Added sections: ninguna
- Removed sections: ninguna
- Follow-up TODOs:
  - SPEC.md: D-18 registrada.
  - Verificar el bloqueo en móvil real (arrastre táctil) y con lectores de pantalla (principio IX).
-->
<!--
Sync Impact Report
- Version change: 2.1.0 → 2.2.0 (MINOR: se redefine el aspecto del hero y del modelo 3D dentro de
  los principios I y V; no se elimina ningún principio)
- Modified principles:
  - I. Identidad y contenido: los colores del hero 3D (radiografía, velos de luz y dientes) se
    leen en tiempo de ejecución de los tokens --color-rayosx, --color-rayosx-luz, --color-velo-*
    y --color-superficie (antes solo --color-acento para el contorno); el hero ya no es blanco:
    su fondo son velos de luz (tokens --color-velo-*), sin capa overlay oscura.
  - V. Modelo 3D: la dentadura de contorno verde y relleno blanco se sustituye por un cráneo
    inferior (maxilar + mandíbula con dientes) con aspecto de radiografía sobre velos de luz que
    siguen al cursor; shaders propios (rayos X multiplicativo, dientes con iluminación fija,
    velos), sin texturas ni mapa de entorno ni luces de three.js; GLB ≤ 400 KB (209 / 74 KB);
    la autoría del modelo nuevo queda pendiente de confirmar (ver assets/models/README.md).
  - VI. Adaptación al dispositivo: sin cambios de fondo (el nivel (a) usa el póster estático).
- Added sections: ninguna
- Removed sections: ninguna
- Follow-up TODOs:
  - Confirmar con el autor el origen y la licencia del escaneo de assets/models/craneo*.glb
    antes de publicar.
  - SPEC.md: D-17 registrada (sustitución del modelo y del fondo del hero).
-->
<!--
Sync Impact Report
- Version change (histórico): 2.0.0 → 2.1.0 (MINOR: guía ampliada y precisada; no se elimina ni se redefine
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
los colores del hero 3D (tinte de la radiografía `--color-rayosx`, reflejo de los dientes
`--color-rayosx-luz`, dientes `--color-superficie` y velos de luz `--color-velo-fondo`,
`--color-velo-1`, `--color-velo-2`) MUST leerse en tiempo de ejecución de esos tokens. El hero
tiene fondo de velos de luz (tokens `--color-velo-*`) con texto oscuro y sin capa overlay oscura. Los datos del negocio (teléfono, WhatsApp, horario, dirección, coordenadas) MUST vivir
en un único bloque de constantes en `js/principal.js`, y los datos literales del `<head>` (title,
Open Graph, JSON-LD) MUST mantenerse sincronizados con él. La identidad (paleta de azules y gris oscuro, Playfair Display para títulos, Inter para texto, logo del diente con «HR»,
rediseñada por la spec 003) se conserva salvo que una spec pida cambiarla. El color del fondo y del texto libre puede
variar con el scroll mediante las variables `--fondo`, `--texto` y `--texto-suave`, que `js/principal.js` escribe a partir
de los tokens (nunca de literales). Está prohibido publicar
datos inventados: reseñas, cifras, credenciales, servicios. Los contadores o estadísticas solo se
muestran con datos reales confirmados por el cliente. Si no hay reseñas reales, la sección se
elimina del HTML. Los textos van en español de México y trato de usted.
Razón: es un servicio de salud; el contenido falso es un problema legal y de confianza.

### II. Contacto primero (NON-NEGOTIABLE)
El acceso a contacto MUST estar visible y funcional en todo momento: barra fija inferior
(«Llamar» y «WhatsApp») en móvil, botón flotante de WhatsApp en escritorio y teléfono pulsable
(`tel:`). Nunca se muestran a la vez la barra y el botón flotante. Todos los enlaces `wa.me`
usan el mismo mensaje prellenado. Ninguna animación, transición ni efecto 3D puede taparlo,
retrasarlo ni bloquear el scroll nativo, con **dos excepciones**: la *pantalla de presentación* (más abajo) y el
*bloqueo de introducción* del hero. Al cargar la página en lo alto, las primeras acciones de scroll (rueda, arrastre táctil,
teclas de desplazamiento) pueden avanzar la animación de entrada del hero, con una velocidad
máxima, en lugar de desplazar la página; así un gesto largo no se salta la presentación. El bloqueo
MUST: (1) terminar al completarse la animación (unos segundos como máximo) y volver a armarse solo
al regresar al inicio del todo tras haber bajado (la mandíbula se cierra y se vuelve a abrir); (2) no tapar ni retrasar el contacto: la barra fija, el botón flotante, el teléfono y
los enlaces siguen visibles y pulsables durante el bloqueo; (3) liberarse de inmediato con la navegación por teclado (Tab), con un clic en un ancla interna, con cualquier desplazamiento externo (barra de scroll, buscar en la página, ancla en la URL), en móvil apaisado bajo (el hero no cabe en pantalla) y si la página se carga ya desplazada; (4) aplicarse igual a los dos modos del hero (3D e imágenes), también con `prefers-reduced-motion`, ahorro de datos y equipo lento, y no activarse sin JavaScript; (5) implementarse interceptando los eventos de entrada, nunca con `overflow: hidden` en
`<html>`/`<body>` ni con un scroll simulado; (6) no interceptar el zoom del navegador. Fuera de
este caso el scroll nativo es siempre libre.

**Pantalla de presentación** (spec 003, D-25). Al cargar, una pantalla a pantalla completa con una animación corta (cuatro
pares de dientes que entran, se cierran sobre el logo y se desvanecen) tapa la página mientras se decide el modo del hero, para
que no se vea el modo de imágenes antes de que el 3D esté listo. Mientras dura, la página es inerte (sin clics, teclas ni scroll,
tampoco el contacto). MUST: (1) mostrarse solo con JavaScript y no con «reducir movimiento» (con un ancla en la URL sí); (2) durar
lo que tarden los dientes en entrar (≈ 2 s) más lo que falte hasta que el hero esté listo, con un **tope de 4,5 s** antes de
iniciar el cierre (≈ 1,1 s) y un respaldo CSS que la oculta sola a los 7 s aunque el JavaScript falle; (3) no volver a mostrarse
hasta una nueva carga; (4) dejar la página y el contacto plenamente utilizables en cuanto termina; (5) no cargar nada propio
fuera de la carga crítica (los dientes van en línea en el HTML, el logo es el mismo del header). Todo cambio MUST preservar la funcionalidad existente
(anclas, inyección por `data-campo`, datos del hero). El slider de fotos fue retirado por la
decisión D-15 de `SPEC.md` y no forma parte de la funcionalidad a preservar.
Razón: es el objetivo del proyecto y el público, mayoritariamente móvil con 4G, prefiere llamar
o escribir. La excepción existe porque la animación de entrada pierde todo su sentido si un gesto
largo la salta, y se acota para que nunca atrape a la persona ni retrase el contacto.

### III. Presupuesto de peso
Se mide el peso transferido, comprimido.
- Carga crítica (lo necesario para ver la página y contactar: HTML, CSS, JS base, fuentes y
  póster): máximo 500 KB.
- Carga diferida (3D, animaciones, modelo): máximo 1,5 MB, iniciada solo después del primer
  pintado y cuando el navegador esté libre.
- Total en escritorio: máximo aproximado de 2 MB. En móvil de gama media: máximo aproximado de
  1,5 MB.
- Contenido principal visible en menos de 2,5 s en 4G, sin desplazamiento de contenido durante
  la carga. El póster estático de la dentadura es el elemento LCP (con movimiento reducido, la
  imagen del cráneo abierto) y MUST estar declarado con `width`/`height` y cargarse con prioridad.
Ningún cambio se considera terminado si supera estos límites. El peso real MUST medirse y
reportarse en cada feature.

### IV. Librerías y dependencias
Solo se permiten librerías de animación y 3D necesarias: GSAP, ScrollTrigger, Lenis, Three.js o
su alternativa ligera aprobada en el plan. MUST descargarse dentro de `assets/js/vendor/`, con
su versión y licencia registradas, nunca desde un CDN ni como script de terceros. El código
propio vive en `js/`. Las fuentes (Playfair Display variable, Poppins 600/700 e Inter 400/500) MUST autoalojarse en WOFF2
en `assets/fonts/`, con `font-display: swap`; la página no hace peticiones a Google Fonts ni
`preconnect` a dominios de terceros. Ninguna dependencia nueva sin justificar su peso. Sin
analítica ni cookies. Fuera de lo anterior, el proyecto sigue siendo HTML, CSS y JavaScript sin
build ni frameworks.

### V. Modelo 3D
El hero MUST mostrar un cráneo inferior humano (maxilar y mandíbula con dientes) entregado como
GLB comprimido con meshopt de 400 KB como máximo (versión completa y versión ligera para móvil),
con hasta ~50 000 triángulos en escritorio y ~15 000 en móvil. Se renderiza con aspecto de
radiografía sobre un fondo de velos de luz translúcidos que se mueven con el cursor, con shaders
propios (hueso por mezcla multiplicativa, dientes blancos con iluminación fija propia, velos
procedimentales), sin texturas, sin mapa de entorno y sin luces de three.js; los materiales del
GLB se sustituyen por ellos. La autoría y la licencia del modelo MUST quedar documentadas en
`assets/models/README.md` y confirmadas antes de publicar. Se carga de forma diferida, con un
respaldo estático visible mientras carga y siempre que el 3D no pueda mostrarse. El respaldo
consta de dos imágenes WebP del cráneo generadas desde el propio modelo con los mismos shaders y
la misma cámara (cerrado, y abierto con una variante para móvil y otra para escritorio), de
máximo 60 KB cada una, y de un fondo de imagen con versión para PC (máximo 80 KB) y para móvil
(máximo 50 KB), de modo que sus posiciones coincidan con las del 3D.

### VI. Adaptación al dispositivo
Tres niveles:
- (a) Con `prefers-reduced-motion`, ahorro de datos, equipo lento o sin WebGL: solo las imágenes
  estáticas del respaldo (cráneo cerrado y abierto sobre el fondo de imagen), sin 3D ni scroll
  suave. Todos esos casos (también «reducir movimiento») reciben el mismo hero de imágenes, con el mismo bloqueo de introducción del principio II: las primeras acciones de scroll abren el cráneo (fundido de `opacity`/`transform` del cerrado al abierto, con el eslogan y el botón apareciendo poco a poco), sin movimiento propio ni efecto del cursor y sin ser «scroll suave» (Lenis). Solo hay dos modos: el 3D y el de imágenes.
- (b) Móvil: modelo ligero y límite de resolución de pantalla del render.
- (c) Escritorio: versión completa.
La detección usa características disponibles, con degradación segura cuando una API no exista
en el navegador.

### VII. Rendimiento en ejecución
Se anima solo `transform` y `opacity` siempre que sea posible; la única excepción admitida es el `background-color` de una sola capa fija a pantalla completa (fondo continuo por scroll, spec 003). El render 3D MUST pausarse
cuando la dentadura no esté en pantalla o la pestaña esté oculta, y liberar sus recursos al
destruirse. Objetivo de 60 fps y mínimo aceptable de 30 fps en un móvil de gama media, con
interacción sin retrasos perceptibles.

### VIII. Accesibilidad y responsive
Mobile-first desde 360 px, sin desplazamiento horizontal (puntos de quiebre 768 px y 1024 px).
Texto mínimo de 16 px y contraste de 4.5:1. Si el fondo varía con el scroll, el texto sobre él MUST conmutar entre el juego oscuro y el claro en el punto de igual contraste (nunca interpolar el color del texto) para mantener 4,5:1 en todo el recorrido. Navegación completa por teclado con foco visible
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

**Version**: 2.8.0 | **Ratified**: 2026-10-09 | **Last Amended**: 2026-10-28
