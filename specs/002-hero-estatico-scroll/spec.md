# Feature Specification: Hero estático rediseñado con transición por scroll

**Feature Branch**: `002-hero-estatico-scroll` (propuesta; la rama aún no se ha creado, el trabajo parte de `001-dentadura-3d-hero`)

**Created**: 2026-10-20

**Status**: Draft

**Input**: User description: "Vamos a rediseñar el hero estático de este proyecto. Revisar cómo está el hero con el modelo 3D: necesitamos 1 imagen del modelo inicial con el cráneo cerrado para hacerlo estático y, al hacer scroll, habrá una transición suave que mostrará una imagen con el cráneo abierto con el eslogan y el botón de servicios. Para el fondo, revisar en assets/img la imagen fondo-hero-estatico y adaptarla para PC y móvil; si tiene baja calidad, generar una nueva en base a la original. La posición de los objetos con el hero estático tiene que ser igual a la que tendría el hero 3D."

## Contexto y decisiones previas

- **Qué es el «hero estático»** (o «hero de imágenes»): la versión del hero **sin 3D**. Se usa cuando el 3D no se usa (ahorro de datos, equipo lento, «reducir movimiento», sin WebGL o fallo del modelo) y también mientras el 3D termina de cargar. **Solo hay dos modos: el hero 3D y el hero de imágenes**, y este último lleva siempre la transición por scroll del cráneo cerrado al abierto (decisión del cliente tras la prueba en móvil real, 2026-10-23). Antes era el cráneo cerrado sobre un degradado de velos, con el eslogan y el botón «Servicios» **debajo** de la figura. Esa composición **no coincidía** con la del hero 3D, donde el eslogan y el botón están juntos **en el hueco de la boca abierta**.
- **Qué no cambia**: el hero 3D (modelo, velos procedimentales, bloqueo de introducción, clic para abrir/cerrar) queda como está en la spec `001-dentadura-3d-hero`. Esta spec solo rediseña la versión estática.
- **Composición de referencia** (la del hero 3D, sin cursor): arriba logo y `<h1>`; al centro el cráneo ya acercado (escala de arranque del hero); abajo «Agende su cita», teléfono y horario. Con la mandíbula abierta (≈ 30°) el punto de mira baja hacia la boca, la parte del modelo que choca con la cabecera y el eslogan se difumina, y el eslogan y el botón «Conoce nuestros servicios» quedan juntos en el hueco de la boca.
- **Fondo**: `assets/img/fondo-hero-estatico.jpg` (añadida por el cliente, aún sin versionar) es una imagen de 735 × 595 px (≈ 25 KB) de velos azules sobre blanco, apaisada. Con esa resolución habría que ampliarla ≈ 2,6× para un escritorio de 1920 px y recortarla a una franja muy estrecha para un móvil vertical: los hilos finos se emborronarían y se vería la compresión. Por eso esta spec pide versiones propias para PC y móvil, generadas en el mismo estilo a partir de la original.
- El texto del eslogan y del botón **sigue siendo texto real de la página** (no se hornea en ninguna imagen): así lo exigen el SEO, la accesibilidad y la constitución (principios I y VIII).
- Esta spec respeta la constitución v2.3.0 (en especial II, III, V, VI, VII y VIII). Su ejecución exige registrar la decisión en `SPEC.md` §11 (D-19, propuesta) y precisar en la constitución que el respaldo estático ahora consta de **dos** imágenes (cráneo cerrado y cráneo abierto) más un fondo, cada una dentro de su límite de peso.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el hero estático con el cráneo cerrado y el fondo nuevo (Priority: P1)

Una persona cuyo dispositivo no anima el 3D (o que abre la página y aún no ha cargado el 3D) ve de inmediato la composición del hero: logo y nombre de la clínica arriba, el cráneo cerrado acercado al centro sobre el nuevo fondo de velos azules, y abajo «Agende su cita», teléfono y horario. Cada elemento está **exactamente donde estaría en el hero 3D**.

**Why this priority**: Es la primera impresión de todas las personas con 3D desactivado y de todas las que esperan a que cargue; además es el elemento que determina el tiempo de carga percibido (LCP).

**Independent Test**: Con el 3D desactivado, cargar la página a 360 × 740, 768 × 1024 y 1440 × 900, y superponer la captura sobre la del hero 3D recién cargado (mandíbula cerrada, sin cursor): cráneo, cabecera y contacto coinciden.

**Acceptance Scenarios**:

1. **Given** una visita con 3D no disponible, **When** la página pinta el primer contenido, **Then** se ve el cráneo cerrado sobre el fondo nuevo, con `<h1>`, «Agende su cita», teléfono y horario visibles, y el eslogan y el botón aún no visibles.
2. **Given** el mismo tamaño de ventana, **When** se compara el hero estático con el hero 3D en su estado inicial, **Then** la silueta del cráneo coincide en posición y tamaño con una diferencia máxima de 2 % del ancho de la figura, y la cabecera y el contacto están en el mismo lugar.
3. **Given** una pantalla de 360 px, **When** se muestra el hero, **Then** no hay desplazamiento horizontal ni saltos de diseño al terminar de cargar las imágenes.
4. **Given** que el fondo aún no llega, **When** se pinta el hero, **Then** se ve un color liso de la paleta (sin parpadeo blanco) y el cráneo y los textos ya son legibles.

---

### User Story 2 - Transición suave al cráneo abierto con eslogan y botón (Priority: P1)

Al hacer scroll, el hero estático no se desplaza sin más: permanece a la vista mientras el cráneo cerrado se transforma suavemente en el cráneo abierto (la misma imagen que mostraría el 3D con la mandíbula a ≈ 30° y la cámara sobre la boca), y el eslogan «La confianza en tu sonrisa comienza aquí» y el botón «Conoce nuestros servicios» aparecen juntos en el hueco de la boca. Al terminar, la página sigue hacia la sección de servicios con normalidad. Al volver hacia arriba, todo regresa suavemente al cráneo cerrado.

**Why this priority**: Es la narrativa del hero («abrir la boca» para hablar de servicios) y el motivo del rediseño; sin ella el hero estático sería una foto fija con el mensaje en otro sitio.

**Independent Test**: Con el 3D desactivado, desplazar la página de 0 a 100 % del recorrido del hero y de vuelta, comprobando 0 %, 25 %, 50 %, 75 % y 100 %: la transición es continua, sin saltos, y es reversible.

**Acceptance Scenarios**:

1. **Given** el hero estático en lo alto, **When** el visitante hace scroll (rueda, arrastre táctil, teclas o barra de scroll), **Then** el hero permanece a la vista y el cráneo cerrado se transforma de forma gradual, proporcional a la distancia desplazada, en el cráneo abierto.
2. **Given** la transición en curso, **When** el avance supera el umbral de revelado, **Then** el eslogan y el botón aparecen gradualmente, juntos y en el hueco de la boca, y el botón se vuelve pulsable.
3. **Given** la transición completada, **When** el visitante sigue haciendo scroll, **Then** la página continúa hacia la sección de servicios sin saltos ni tirones.
4. **Given** la transición a medias, **When** el visitante vuelve a desplazarse hacia arriba, **Then** el cráneo vuelve a la pose cerrada y el eslogan y el botón se desvanecen de forma proporcional.
5. **Given** un scroll muy rápido o con inercia, **When** se suelta, **Then** el resultado final es el correspondiente a la posición alcanzada, sin vibraciones ni saltos.
6. **Given** cualquier punto del recorrido, **When** se mira el hero, **Then** el cráneo nunca desaparece ni parece «roto»: a mitad de la transición se percibe una mezcla suave entre las dos poses y el movimiento de la figura hacia su posición abierta es continuo.
7. **Given** cualquier punto del recorrido, **When** el visitante busca contacto, **Then** «Agende su cita», el teléfono y la barra fija (móvil) o el botón flotante (escritorio) están visibles y pulsables.

---

### User Story 3 - Fondo nítido adaptado a PC y a móvil (Priority: P1)

El fondo del hero estático se ve nítido y bien compuesto tanto en un escritorio (pantalla apaisada) como en un móvil (pantalla vertical): los velos azules rodean al cráneo sin tapar los textos, los hilos finos se ven definidos y no se aprecian bloques, bandas ni pixelado. Cada dispositivo descarga solo la versión que le corresponde.

**Why this priority**: El fondo ocupa todo el hero y es lo primero que se ve; con la imagen actual (735 × 595 px) quedaría borroso en casi cualquier pantalla y recortado de forma poco afortunada en móvil.

**Independent Test**: Cargar el hero a 1920 × 1080 y a 390 × 844 y revisarlo a tamaño real y ampliado: nitidez, composición y contraste de los textos; revisar en la pestaña de red que solo se pidió una versión del fondo.

**Acceptance Scenarios**:

1. **Given** un escritorio de 1920 × 1080, **When** se muestra el hero, **Then** el fondo cubre todo el escenario sin bandas visibles ni pixelado, y los hilos finos se distinguen con nitidez.
2. **Given** un móvil vertical de 390 × 844, **When** se muestra el hero, **Then** el fondo tiene su propia composición vertical (no es un recorte estrecho de la versión de escritorio) y cubre todo el escenario con la misma calidad.
3. **Given** cualquiera de las dos versiones, **When** se mide el contraste de cada texto del hero (`<h1>`, eslogan, botón, teléfono, horario) contra lo que tiene detrás, **Then** cumple el mínimo de 4,5 : 1: las zonas más oscuras del fondo no quedan detrás de los textos.
4. **Given** una ventana intermedia (tablet o escritorio estrecho), **When** se muestra el hero, **Then** se usa una de las dos versiones sin deformarse, y no se piden las dos.
5. **Given** que cambia la orientación del dispositivo, **When** la ventana pasa a otro formato, **Then** el fondo se re-encuadra sin deformarse ni dejar huecos.

---

### User Story 4 - Ahorro de datos, movimiento reducido y fallos (Priority: P2)

«Reducir movimiento» **no quita la transición**: el cliente necesita que se vea el cambio del cráneo cerrado al abierto también en ese modo. Quien lo tiene activo recibe el hero de imágenes (sin 3D, sin velos que fluyen ni inclinación con el cursor), y la transición avanza solo con el scroll de la propia persona, sin ningún movimiento propio. Con ahorro de datos, la imagen del cráneo abierto solo se pide cuando la persona empieza a desplazarse. Si esa imagen no llega, el hero sigue completo con el cráneo cerrado y el eslogan y el botón visibles y legibles.

**Why this priority**: El público es mayoritariamente móvil con 4G variable y algunos teléfonos tienen «quitar animaciones» activo (en la prueba en móvil real el hero se veía fijo, sin el cambio de pose); el contenido nunca debe depender de una animación y el cambio de pose debe verse en todos los dispositivos.

**Independent Test**: (a) Activar «reducir movimiento» y recorrer la página: el hero es el de imágenes (sin 3D), el cursor no cambia ningún píxel y el scroll funde el cráneo cerrado con el abierto. (b) Bloquear la imagen del cráneo abierto en la red: el hero sigue completo y usable.

**Acceptance Scenarios**:

1. **Given** «reducir movimiento» activo, **When** se carga la página y se hace scroll, **Then** se ve el cráneo cerrado al inicio y la transición al cráneo abierto con el eslogan y el botón en la boca avanza con el scroll, igual que en el resto del hero de imágenes; no hay 3D ni efecto del cursor ni movimiento propio.
2. **Given** ahorro de datos activo, **When** se carga la página, **Then** solo se descarga la imagen del cráneo cerrado y el fondo de su dispositivo; la del cráneo abierto se pide al empezar a desplazarse.
3. **Given** que la imagen del cráneo abierto falla o tarda, **When** el visitante hace scroll, **Then** se mantiene el cráneo cerrado, el eslogan y el botón se muestran legibles y pulsables, y la página sigue completa.
4. **Given** un navegador sin WebGL (que solo se descubre cuando el 3D intenta arrancar, tras el primer pintado), **When** el 3D falla, **Then** el hero pasa al hero de imágenes con el cráneo cerrado, sin mover el cráneo, la cabecera ni el contacto, y el scroll funde al cráneo abierto desde la posición en que esté la página; la página queda completa.
5. **Given** navegación por teclado, **When** se pulsa Tab en el hero, **Then** «Conoce nuestros servicios» y «Agende su cita» se alcanzan aunque la transición no haya avanzado, y el botón se muestra con foco.

---

### User Story 5 - Relevo suave entre el hero estático y el 3D (Priority: P3)

En un equipo capaz, el hero estático es lo que se ve hasta que el 3D está listo. El relevo no produce parpadeos ni desplazamientos del cráneo ni de los textos, y mientras el 3D carga, la composición estática sigue el mismo progreso de apertura que el hero 3D (para que el eslogan no aparezca sobre un cráneo todavía cerrado).

**Why this priority**: Evita que la persona vea dos diseños distintos en los primeros segundos; la experiencia principal (estática o 3D) ya funciona sin esto.

**Independent Test**: Con red limitada en un escritorio capaz, hacer scroll en cuanto aparece la página, antes de que cargue el 3D, y observar el relevo.

**Acceptance Scenarios**:

1. **Given** un equipo capaz con el 3D aún cargando, **When** el visitante empieza a abrir la mandíbula con el scroll de introducción, **Then** el hero estático muestra la transición al cráneo abierto en sincronía con ese progreso.
2. **Given** el 3D que termina de cargar, **When** sustituye a la composición estática, **Then** el cráneo, la cabecera y el contacto no se mueven y no hay parpadeo.

---

### Edge Cases

- Cambio de tamaño de la ventana o rotación del dispositivo con la transición a medias: la figura y el fondo se re-encuadran sin saltos y el progreso se conserva.
- Móvil en horizontal (pantalla muy baja): el hero no se ancla a la pantalla, se comporta como una página normal y muestra la composición final (eslogan y botón visibles) para que nada quede inalcanzable.
- Zoom del navegador al 200 %: el cráneo cabe a lo ancho y los textos siguen legibles.
- Carga de la página ya desplazada (recarga o ancla en la URL): el hero muestra el estado que corresponde a la posición, no el inicial.
- Enlace «Inicio» (`#inicio`) o clic en el logo con la transición completada: la página vuelve a lo alto y el hero regresa al cráneo cerrado.
- Clic en un ancla interna (por ejemplo «Servicios» del menú) en mitad de la transición: la página llega a su destino sin quedar atrapada en el hero.
- Texto sobre el fondo y sobre el hueso translúcido: el `<h1>`, el eslogan y el horario conservan el halo claro actual para mantener el contraste.
- Pantallas muy altas o muy bajas: la figura abierta nunca se sale del ancho de la pantalla ni tapa el contacto.
- El 3D falla una vez iniciado (sin WebGL, error del modelo o pérdida de contexto) o se activa «reducir movimiento» con el 3D ya mostrado: el hero pasa al hero de imágenes sin mover el cráneo, la cabecera ni el contacto (se anclan a partir de ahí y la apertura pasa a depender del scroll).
- Si se alcanza «Conoce nuestros servicios» con el teclado y el progreso es 0, el botón se ve con foco (sin cambiar la imagen de fondo de la figura).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Estado inicial): El hero estático MUST mostrar al cargar el cráneo cerrado acercado (la misma escala de arranque del hero 3D) sobre el fondo nuevo, con logo, `<h1>`, «Agende su cita», teléfono y horario visibles, y sin mostrar el eslogan ni el botón «Conoce nuestros servicios».
- **FR-002** (Misma posición que en el 3D): En los tamaños de referencia (360 × 740, 390 × 844, 768 × 1024, 1024 × 768, 1440 × 900 y 1920 × 1080), los objetos del hero estático (cráneo cerrado, cráneo abierto, cabecera, eslogan, botón, contacto) MUST ocupar la misma posición y tamaño que tienen en el hero 3D en la fase equivalente (inicial y apertura completa, sin cursor), con una tolerancia máxima del 2 % del ancho de la figura para las imágenes del cráneo. La composición estática MUST dejar de usar la disposición actual (eslogan y botón debajo de la figura) y usar la del hero 3D (eslogan y botón en el hueco de la boca).
- **FR-003** (Imagen del cráneo cerrado): El hero estático MUST usar una sola imagen del cráneo cerrado, idéntica en pose, encuadre e iluminación a la pose inicial del 3D. Se conserva la imagen actual (`assets/img/craneo-cerrado.webp`) si cumple FR-002; si no, se regenera desde el modelo 3D.
- **FR-004** (Imagen del cráneo abierto): El hero estático MUST usar una imagen del cráneo abierto idéntica a la pose final del 3D: mandíbula a ≈ 30°, cámara apuntando a la boca, mismo aspecto de radiografía y dientes, y la parte del modelo que se superpone a la cabecera y al eslogan difuminada como en el 3D. Se obtiene a partir del modelo 3D existente (no se parte del archivo `craneo-abierto` del zip original, que no está en el repositorio). Si la composición del difuminado depende del formato de pantalla, MUST haber una versión para móvil y otra para escritorio.
- **FR-005** (Transición por scroll): En el hero de imágenes (ahorro de datos, equipo lento, «reducir movimiento» y también cuando el 3D falla), el avance del scroll sobre el hero MUST controlar de forma continua y reversible la transición entre el cráneo cerrado y el abierto, durante una distancia de scroll acotada (entre el 60 % y el 100 % de la altura de la ventana; por defecto 80 %), mientras el hero permanece a la vista. Al completarse, la página MUST continuar hacia la siguiente sección sin saltos.
- **FR-006** (Continuidad visual): Durante la transición, la figura MUST pasar de la posición cerrada a la abierta de forma continua (sin «teletransportarse») y en ningún punto el cráneo MUST desaparecer ni mostrarse con un doble perfil que parezca un error.
- **FR-007** (Revelado): El eslogan «La confianza en tu sonrisa comienza aquí» y el botón «Conoce nuestros servicios» MUST aparecer de forma gradual, ligados al avance de la transición y juntos en el hueco de la boca; el botón MUST llevar a la sección de servicios y ser pulsable solo cuando está revelado. Ambos MUST ser texto real del documento y alcanzables con teclado en cualquier momento (el botón se muestra con foco).
- **FR-008** (Scroll nativo): La transición MUST NOT bloquear, retrasar ni simular el scroll: el desplazamiento nativo (rueda, táctil, teclado, barra, anclas, buscar en la página) funciona siempre. El bloqueo de introducción del hero 3D no se aplica al hero estático (constitución, principio II, condición 4).
- **FR-009** (Contacto primero): El cráneo, el fondo y la transición MUST NOT tapar ni retrasar los accesos de contacto («Agende su cita», teléfono, barra fija inferior en móvil, botón flotante en escritorio) en ningún punto del recorrido.
- **FR-010** (Fondo adaptado): El fondo del hero estático MUST ser una imagen derivada de `assets/img/fondo-hero-estatico.jpg`, con una versión para pantallas apaisadas (PC) y otra para pantallas verticales (móvil), ambas sin pixelado, bandas ni bloques visibles a tamaño real en 1920 × 1080 y 390 × 844 y con los hilos finos nítidos. Si la imagen original no alcanza esa calidad al adaptarla (hoy mide 735 × 595 px), MUST generarse una versión nueva en el mismo estilo (velos azules translúcidos sobre blanco) y con los colores de la paleta de velos del sitio. Cada dispositivo MUST descargar solo la versión que le corresponde.
- **FR-011** (Contraste y composición del fondo): En ambas versiones del fondo, las zonas más oscuras MUST quedar fuera de las zonas de texto, de modo que cada texto del hero cumpla un contraste de 4,5 : 1 como mínimo; los velos MUST rodear al cráneo sin tapar su silueta ni la boca abierta. Mientras la imagen no llega, el escenario MUST mostrar un color liso de la paleta del sitio.
- **FR-012** (Movimiento reducido): La preferencia «reducir movimiento» MUST NOT desactivar la transición del cráneo cerrado al abierto del hero de imágenes (decisión del cliente, 2026-10-23: el cambio de pose debe verse en todos los dispositivos). Con esa preferencia el hero MUST ser el de imágenes (sin 3D), la transición MUST avanzar solo con el scroll de la persona y NO MUST haber ningún movimiento propio (velos que fluyen, inclinación con el cursor o animaciones automáticas).
- **FR-013** (Ahorro de datos y respaldo): Con ahorro de datos, la imagen del cráneo abierto MUST pedirse solo al empezar a desplazarse. Si no llega, el hero MUST mantener el cráneo cerrado con el eslogan y el botón visibles, legibles y pulsables. El cráneo cerrado MUST permanecer visible hasta que la imagen del cráneo abierto esté disponible: el área del cráneo nunca queda vacía. En ningún caso la página queda incompleta.
- **FR-014** (Relevo al 3D): Mientras el 3D carga, la composición estática MUST seguir el mismo progreso de apertura que el hero 3D; cuando el 3D la sustituye, el cráneo, la cabecera y el contacto MUST NOT moverse ni parpadear. El hero 3D conserva su fondo procedimental propio; el paso del fondo estático al animado ocurre con un fundido suave.
- **FR-015** (Accesibilidad): Las imágenes del cráneo y del fondo son decorativas y MUST estar ocultas a los lectores de pantalla; el contenido textual del hero MUST existir en el documento sin depender de las imágenes ni de la transición; el `<h1>` (nombre + Atlacomulco) MUST permanecer único; las áreas pulsables MUST medir al menos 44 × 44 px y el foco MUST ser visible.
- **FR-016** (Sin terceros y tokens): La página MUST NOT hacer peticiones a dominios externos para esta función. Todo color que escriba el código (fuera de las imágenes) MUST salir de los tokens de diseño del sitio, sin colores literales.
- **FR-017** (Rendimiento): La transición MUST animar solo propiedades baratas (movimiento y opacidad), mantenerse fluida (≥ 55 fps en escritorio, ≥ 30 fps en móvil de gama media) y no provocar desplazamientos de diseño. Las imágenes MUST declarar sus dimensiones y respetar el presupuesto de peso.

### Presupuesto (constitución v2.3.0)

| Concepto | Límite |
|---|---|
| Carga crítica de la página (documento, estilos, código base, fuentes, imagen del cráneo cerrado y fondo del dispositivo) | ≤ 500 KB (hoy ≈ 110 KB sin contar el fondo) |
| Fondo de PC | ≤ 80 KB |
| Fondo de móvil | ≤ 50 KB |
| Imagen del cráneo cerrado | ≤ 60 KB (actual: 24 KB) |
| Imagen del cráneo abierto (cada versión) | ≤ 60 KB, carga diferida tras el primer pintado |
| Tiempo hasta ver el cráneo y el fondo (LCP) | < 2,5 s en 4G |
| Desplazamiento acumulado de diseño (CLS) | ≈ 0 |
| Fluidez de la transición | ≥ 55 fps en escritorio, ≥ 30 fps en móvil de gama media |

### Key Entities

- **Hero estático**: composición del hero sin 3D animado: fondo, cráneo (cerrado o abierto), cabecera, eslogan, botón y contacto.
- **Imagen del cráneo cerrado / abierto**: las dos poses del cráneo como imágenes; el abierto puede tener versión para móvil y para escritorio.
- **Fondo del hero**: imagen decorativa con dos versiones (apaisada y vertical) y un color liso de respaldo.
- **Progreso de la transición**: valor de 0 a 1 que sale del scroll sobre el hero (o del progreso de apertura del hero 3D mientras carga) y gobierna el fundido entre poses, el movimiento de la figura y el revelado del eslogan y el botón.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En los seis tamaños de referencia (FR-002), la silueta del cráneo cerrado del hero estático coincide con la del hero 3D en su estado inicial con una diferencia ≤ 2 % del ancho de la figura, y la cabecera y el contacto no se desplazan ni un píxel entre ambas versiones.
- **SC-002**: A los mismos tamaños, la silueta del cráneo abierto del hero estático coincide con la del hero 3D con la apertura completa (sin cursor) con una diferencia ≤ 2 % del ancho de la figura, y el eslogan y el botón quedan en el mismo sitio.
- **SC-003**: Con el modo estático decidido al cargar (ahorro de datos o equipo lento), el 100 % de las comprobaciones en 0 %, 25 %, 50 %, 75 % y 100 % del recorrido muestran una transición continua, sin saltos, y en el sentido inverso regresa al estado cerrado.
- **SC-004**: Con «reducir movimiento» activo no hay 3D ni movimiento propio (0 píxeles del hero cambian por el cursor o con la página quieta) y el scroll recorre la transición cerrado → abierto como en el resto del hero de imágenes, con el eslogan y el botón visibles al final.
- **SC-005**: El fondo, a 1920 × 1080 y 390 × 844, no muestra pixelado, bandas ni bloques en revisión a tamaño real y ampliado al 200 %, y cada texto del hero cumple contraste ≥ 4,5 : 1 en ambos.
- **SC-006**: La página no realiza ninguna petición a dominios externos y cumple todos los límites de peso de la tabla; en cada dispositivo se descarga una sola versión del fondo.
- **SC-007**: En una medición móvil con red limitada, Rendimiento ≥ 90, LCP < 2,5 s y CLS ≈ 0.
- **SC-008**: Con la imagen del cráneo abierto bloqueada o con 3D fallido, el 100 % del contenido del hero (incluidos eslogan y botón) es visible y usable.
- **SC-009**: En todo el recorrido del hero, los accesos de contacto permanecen visibles y pulsables (0 casos en que queden tapados) y el scroll nativo nunca se interrumpe.
- **SC-010**: A 360 px de ancho no hay desplazamiento horizontal con el cráneo cerrado, a mitad de la transición ni abierto.

## Assumptions

- **Alcance**: el rediseño solo afecta al hero estático. El hero 3D, su bloqueo de introducción y el clic para abrir/cerrar quedan como en la spec `001`. Si la intención era sustituir también el 3D por el hero estático, habría que reescribir el alcance antes de planificar.
- **Relación con la spec 001**: esta spec sustituye, para la versión estática, lo que decían `001` FR-002 (fondo sin 3D = degradado), FR-009(a), FR-010, FR-012 y FR-013 («sin 3D animado el eslogan y el botón se muestran siempre debajo de la figura») y su supuesto de que el respaldo estático es siempre el cráneo cerrado.
- **Movimiento reducido**: en la prueba en móvil real (2026-10-23) el hero se veía fijo con el cráneo abierto porque el teléfono tenía «quitar animaciones» activo; el cliente pidió que el cambio cerrado → abierto se vea siempre. Se acepta como decisión de producto (D-20). Mitigación: la transición es consecuencia directa del gesto de scroll (no hay movimiento autónomo, ni efecto del cursor, ni 3D). Riesgo de accesibilidad registrado: quien tenga una sensibilidad fuerte al movimiento verá un fundido ligado a su propio scroll.
- **Mecanismo de scroll**: la transición se ancla al scroll nativo (el hero permanece a la vista durante ≈ una altura de ventana de scroll); no se reutiliza el bloqueo de introducción, que la constitución prohíbe en modo estático. La distancia exacta se afina en el plan.
- **Origen de las imágenes**: el cráneo abierto se genera a partir del modelo 3D existente (`assets/models/craneo.glb`) con la misma cámara, shaders y encuadre del hero 3D, para garantizar FR-002; el fondo se adapta o regenera desde `assets/img/fondo-hero-estatico.jpg`. El archivo `craneo-abierto.webp` del zip original no está en el repositorio y no se usa.
- **Fondo del 3D**: el hero 3D mantiene su fondo de velos procedimentales; el fondo de imagen solo se ve en el hero estático y en la carga previa al 3D, con un fundido al relevarse. Queda por revisar visualmente en el plan si el cambio de fondo en el relevo resulta aceptable.
- **Formatos de pantalla de referencia**: móvil 360 × 740 y 390 × 844, tablet 768 × 1024, escritorio 1440 × 900 y 1920 × 1080; el punto de corte entre fondo vertical y apaisado lo fija el plan.
- **Texto**: el eslogan y el botón se mantienen como texto del documento, con su halo claro actual; las imágenes no contienen texto.
- **Constitución**: el respaldo estático pasa a constar de dos imágenes de cráneo más un fondo con versiones; hay que registrar D-19 en `SPEC.md` §11 y aclarar en los principios V y VI que el límite de 60 KB aplica a cada imagen de cráneo.
- **Fuera de alcance**: cambios al modelo 3D o a sus shaders, nuevas secciones, transiciones entre secciones (specs posteriores), y cualquier cambio de textos, datos del negocio o identidad visual.
- **Dependencias**: constitución v2.3.0, `SPEC.md`, spec `001-dentadura-3d-hero`, modelo `assets/models/craneo.glb`, fuentes autoalojadas y la imagen `assets/img/fondo-hero-estatico.jpg`.
