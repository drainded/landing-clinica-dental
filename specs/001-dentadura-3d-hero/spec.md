# Feature Specification: Cráneo 3D en rayos X sobre velos de luz en el hero

**Feature Branch**: `001-dentadura-3d-hero` (el nombre de la rama y de la carpeta se conserva por historial; el contenido se refiere ahora al cráneo en rayos X)

**Created**: 2026-10-09 · **Revisada**: 2026-10-12 (decisión D-17 de `SPEC.md`: cambio de modelo y de fondo)

**Status**: Draft

**Input**: User description (original): "Dentadura 3D interactiva en el hero de la landing de la Clínica Dental Dr. Héctor Manuel Rojas Pérez (Atlacomulco): contorno verde y relleno blanco, mandíbula cerrada al cargar, se deforma con el cursor/toque y se abre con el scroll; al abrirse se revelan el eslogan y un botón «Servicios». Sustituye al slider de fotos del hero."

> **Actualización 2026-10-22 (spec 002, D-19)**: la versión estática del hero (sin 3D animado) se rediseñó en 
> [`specs/002-hero-estatico-scroll/`](../002-hero-estatico-scroll/spec.md). Para esa versión, esa spec **sustituye** a FR-002 (fondo sin 3D = degradado: ahora es una imagen con versión de PC y de móvil), FR-009(a), FR-010 y 
> FR-012/FR-013 (el eslogan y el botón ya no van debajo de la figura: la composición estática es la del 3D, con transición por scroll y, con movimiento reducido, la composición final sin animación) y al supuesto de que el respaldo estático es siempre el cráneo cerrado. El 3D no cambia.

**Revisión 2026-10-12**: el cliente entrega un nuevo modelo (`modelo-craneo-rayosx-dientes-alineados.zip`: cráneo inferior con aspecto de radiografía y dientes blancos) y un boceto. El fondo del hero pasa a ser **velos translúcidos entrelazados que simulan luz y se mueven con el cursor**. El contorno verde y la deformación local del modelo se retiran.

## Contexto y decisiones previas

- La landing sustituye el slider de fotos del hero (D-15 en `SPEC.md`) por un cráneo 3D que reacciona al visitante (D-17 cambia su aspecto). Es el elemento memorable de la página.
- Composición (boceto): arriba logo y `<h1>`; al centro el cráneo con la mandíbula cerrada, sobre un fondo de velos de luz azul-turquesa; abajo «Agende su cita», teléfono y horario. Con el scroll la mandíbula se abre y en el hueco de la boca aparecen, juntos, el eslogan y el botón «Conoce nuestros servicios».
- Los datos que el hero ya muestra se conservan: logo, `<h1>` (nombre de la clínica + Atlacomulco), botón «Agende su cita», teléfono pulsable y horario resumido.
- Cuando la mandíbula está abierta se revelan el eslogan «La confianza en tu sonrisa comienza aquí» y el botón «Conoce nuestros servicios», que lleva a la sección de servicios. Si el 3D no se puede animar (imagen estática, movimiento reducido, ahorro de datos, sin WebGL), el eslogan y el botón se muestran siempre.
- Las fuentes Poppins/Inter se autoalojan (D-16): la página no hace peticiones a dominios externos.
- Esta spec respeta la constitución v2.3.0 (principios I, II, III, V, VI, VII y VIII en particular).
- **Pendiente**: el cliente debe confirmar el origen y la licencia del escaneo del que sale el modelo (ver `assets/models/README.md`); no se publica sin ello.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el cráneo al llegar (Priority: P1)

Una persona abre la página y ve de inmediato un cráneo inferior humano con aspecto de radiografía (hueso azul marino translúcido, dientes blancos brillantes) con la mandíbula **cerrada**, sobre velos de luz, sin esperar a que cargue nada pesado. Junto a él ve el nombre de la clínica y puede contactar.

**Why this priority**: Es la primera impresión y el elemento que diferencia a la clínica de la otra de la zona; además es el contenido principal que determina el tiempo de carga percibido.

**Independent Test**: Abrir la página en móvil (360 px) y escritorio con red 4G limitada: el cráneo cerrado es visible en menos de 2,5 s, sobre un fondo de velos, sin saltos de diseño.

**Acceptance Scenarios**:

1. **Given** una visita nueva, **When** la página termina de pintar el primer contenido, **Then** se ve el cráneo cerrado centrado sobre un degradado de velos, y el `<h1>`, «Agende su cita», teléfono y horario están visibles.
2. **Given** que el 3D aún no terminó de cargar, **When** el visitante mira el hero, **Then** ve una imagen del cráneo cerrado indistinguible en pose y encuadre de la versión interactiva, y esta la reemplaza sin parpadeo ni desplazamiento del contenido.
3. **Given** una pantalla de 360 px de ancho, **When** se muestra el hero, **Then** el cráneo cabe completo a lo ancho sin desplazamiento horizontal.

---

### User Story 2 - Velos de luz que siguen al cursor (Priority: P1)

El fondo del hero son varias capas de velos translúcidos entrelazados que simulan luz y fluyen despacio por sí solos. Al mover el cursor (o al tocar y arrastrar en pantallas táctiles) los velos se desplazan con paralaje —las capas cercanas más que las lejanas— y se curvan alrededor del cursor; el cráneo se inclina suavemente hacia él. Al retirar el cursor o soltar el dedo, todo vuelve suavemente al reposo.

**Why this priority**: Es lo que vuelve a la página memorable y comunica cuidado y profesionalismo; sin ella el hero sería una imagen fija.

**Independent Test**: Mover el cursor por el hero y comprobar que los velos y el cráneo reaccionan de forma suave, sin saltos, y regresan al reposo al salir; repetir con el dedo en un móvil confirmando que el scroll vertical sigue funcionando.

**Acceptance Scenarios**:

1. **Given** el hero en reposo, **When** el cursor se mueve por él, **Then** los velos se desplazan (paralaje) y se curvan cerca del cursor, y el cráneo se inclina hacia él.
2. **Given** una interacción activa, **When** el cursor sale de la ventana (o se suelta el dedo), **Then** el fondo y el cráneo vuelven suavemente al reposo.
3. **Given** una pantalla táctil, **When** el visitante toca y arrastra, **Then** los velos reaccionan y un gesto de scroll vertical desplaza la página normalmente.
4. **Given** ausencia de interacción, **When** pasan unos segundos, **Then** los velos fluyen lentamente y el cráneo permanece quieto en su posición inicial.
5. **Given** cualquier posición del cursor, **When** la reacción alcanza su máximo, **Then** el cráneo sigue siendo reconocible y el texto sigue siendo legible (intensidad limitada).

---

### User Story 3 - Abrir la mandíbula con las primeras acciones de scroll (Priority: P1)

El cráneo **arranca ya acercado** con la mandíbula cerrada. Al cargar la página en lo alto, las **primeras acciones de scroll no desplazan la página**: avanzan la apertura de la mandíbula (hasta unos 30°) con una velocidad máxima (la animación dura al menos ~2 s aunque el gesto sea largo) y se difumina la parte del modelo que choca con los textos; el eslogan y el botón se revelan al abrirse. Cuando la mandíbula termina de abrirse el bloqueo se libera y la página se desplaza con normalidad. El bloqueo ocurre una sola vez por visita y siempre se puede salir de él (Tab, anclas, barra de scroll). El contacto nunca queda tapado ni bloqueado.

**Why this priority**: Es el gesto narrativo central del hero («abrir la boca» para hablar de servicios) y el vínculo con el eslogan y el botón de la historia 4.

**Independent Test**: Desplazar el hero de 0 % a 100 % y de vuelta: la mandíbula pasa de cerrada a abierta y regresa de forma proporcional y suave, incluso con scroll rápido o con inercia.

**Acceptance Scenarios**:

1. **Given** la mandíbula cerrada al cargar la página en lo alto, **When** el visitante hace scroll (rueda, arrastre o teclas), **Then** la página no se desplaza y la mandíbula se abre en proporción al gesto, con velocidad máxima y suavizado, difuminándose el modelo donde se superpone a los textos.
2. **Given** un gesto de scroll muy largo, **When** se suelta, **Then** la mandíbula tarda igualmente al menos ~0,8 s en abrirse por completo, de modo que la presentación se ve.
3. **Given** la apertura completada, **When** el visitante sigue haciendo scroll, **Then** el bloqueo se libera y la página continúa con normalidad.
4. **Given** un scroll muy rápido o con inercia, **When** se suelta, **Then** la mandíbula alcanza la posición correspondiente sin saltos ni vibraciones.
5. **Given** que la mandíbula está abierta y la cámara acercada, **When** se muestra en el viewport, **Then** los textos y el contacto siguen legibles y visibles (la parte del modelo bajo los textos está difuminada).
5. **Given** el bloqueo de introducción activo, **When** el visitante pulsa Tab, hace clic en un ancla interna, arrastra la barra de scroll o carga la página ya desplazada, **Then** el bloqueo se libera de inmediato y la página se desplaza con normalidad.
6. **Given** cualquier momento fuera del bloqueo de introducción, **When** el visitante hace scroll, **Then** el desplazamiento nativo nunca se bloquea ni se retrasa.

---

### User Story 4 - Eslogan y botón «Conoce nuestros servicios» al abrirse (Priority: P2)

Cuando la mandíbula se abre, el eslogan «La confianza en tu sonrisa comienza aquí» y el botón «Conoce nuestros servicios», juntos en el hueco de la boca abierta, se revelan sincronizados con el avance de la apertura; el botón lleva a la sección de servicios. El contacto (Agende su cita, teléfono, barra fija inferior en móvil o botón flotante en escritorio) nunca queda tapado por el cráneo ni por el revelado.

**Why this priority**: Conecta el elemento visual con el mensaje de marca y con el siguiente paso de la página, pero el hero funciona sin él.

**Independent Test**: Hacer scroll hasta abrir la mandíbula y comprobar que el eslogan y el botón aparecen, que el botón desplaza a Servicios y que el contacto sigue visible y pulsable en todo momento.

**Acceptance Scenarios**:

1. **Given** la mandíbula cerrada, **When** el hero se muestra, **Then** el eslogan y el botón no son visibles y el resto de datos del hero sí.
2. **Given** la mandíbula abriéndose, **When** el avance supera el umbral de revelado, **Then** el eslogan y el botón aparecen de forma gradual, proporcional al avance.
3. **Given** el botón visible, **When** se pulsa o se activa con teclado, **Then** la página se desplaza a la sección de servicios.
4. **Given** el 3D no disponible, movimiento reducido o ahorro de datos, **When** se muestra el hero, **Then** el eslogan y el botón están visibles desde el inicio.
5. **Given** cualquier estado del hero, **When** el visitante busca contacto, **Then** «Agende su cita», el teléfono y la barra fija/botón flotante están visibles y no tapados.

---

### User Story 5 - Dispositivos modestos y movimiento reducido (Priority: P2)

En un móvil de gama baja, con ahorro de datos, sin WebGL o con la preferencia «reducir movimiento», el visitante obtiene una versión más ligera o estática que sigue siendo reconocible, y la página queda completa.

**Why this priority**: El público es mayoritariamente móvil con 4G variable y puede incluir personas sensibles al movimiento; la página debe funcionar bien para todos.

**Independent Test**: Activar «reducir movimiento» y recorrer la página moviendo el cursor y haciendo scroll: ningún píxel del hero cambia. Simular ausencia de WebGL o fallo de carga del modelo: se ve la imagen estática y la página está completa.

**Acceptance Scenarios**:

1. **Given** la preferencia «reducir movimiento» activa, **When** el visitante mueve el cursor o hace scroll, **Then** el fondo no fluye, el cráneo no se inclina, no se balancea y no se abre (0 píxeles cambian).
2. **Given** un navegador sin WebGL o un fallo al cargar el modelo, **When** carga la página, **Then** se muestra la imagen estática del cráneo cerrado sobre el degradado de velos y todo el contenido del hero es accesible.
3. **Given** un móvil o modo de ahorro de datos, **When** se decide qué mostrar, **Then** se usa una versión más ligera del modelo o solo la imagen estática, y en ningún caso se supera el presupuesto de peso.
4. **Given** un escritorio capaz, **When** carga, **Then** se usa la versión completa del modelo.

---

### Edge Cases

- Cambio de tamaño de la ventana o rotación del dispositivo: la figura se re-encuadra sin deformarse ni salirse del viewport.
- Scroll rápido o con inercia: la apertura sigue al scroll sin saltos.
- El cursor sale de la ventana con una reacción activa: el fondo y la figura regresan al reposo.
- Pestaña en segundo plano o hero fuera de pantalla: la animación se pausa y se reanuda al volver.
- Pérdida del contexto gráfico: se vuelve a la imagen estática sin romper la página.
- Zoom del navegador al 200 %: la figura cabe a lo ancho.
- Con la mandíbula abierta la figura se acerca: nunca se sale del ancho de la pantalla.
- El revelado del eslogan en pantallas bajas: no cubre botones de contacto.
- Navegación por teclado: «Conoce nuestros servicios» y «Agende su cita» se alcanzan con Tab aunque aún no estén totalmente revelados por el scroll.
- Texto sobre los velos y sobre el hueso translúcido: el `<h1>`, el eslogan y el horario llevan halo claro para mantener el contraste.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Estilo): El cráneo MUST dibujarse con aspecto de radiografía —hueso azul marino translúcido que multiplica el color del fondo, más oscuro donde la superficie se ve de canto, con la bóveda desvanecida— y dientes blancos brillantes dibujados encima, sin contorno, sobre el fondo de velos del hero. Los colores MUST leerse de los tokens de `:root` (`--color-rayosx`, `--color-rayosx-luz`, `--color-superficie`), sin literales en CSS ni en JS.
- **FR-002** (Fondo de velos): El fondo del hero MUST ser un conjunto de velos translúcidos entrelazados que simulan luz (capas de cintas onduladas de bordes suaves, con reflejos en sus pliegues y algún hilo fino de luz y de tinta), con los tonos de `--color-velo-fondo`, `--color-velo-1`, `--color-velo-2`, que fluyen lentamente por sí solos. Sin 3D, el fondo es un degradado CSS con los mismos tokens.
- **FR-003** (Anatomía y pose): La figura MUST mostrar maxilar y mandíbula con dientes, reconocible como cráneo inferior humano. La mandíbula MUST estar cerrada al cargar y en la imagen estática.
- **FR-004** (Apertura por scroll con bloqueo de introducción): Un valor de progreso entre 0 y 1 MUST controlar con suavizado el ángulo de la mandíbula (de 0° a ≈30°). Al cargar la página en lo alto, las primeras acciones de scroll MUST avanzar ese progreso (con velocidad máxima ≥ 2 s para el recorrido completo) en lugar de desplazar la página, hasta llegar a 1; entonces el bloqueo MUST liberarse y la página desplazarse con normalidad (una sola vez por visita). El bloqueo MUST liberarse de inmediato con Tab, clic en un ancla interna, desplazamiento externo, modo estático o carga ya desplazada, y MUST NOT activarse con movimiento reducido, ahorro de datos, equipo lento ni sin 3D. El cráneo MUST arrancar ya acercado (escala fija). El valor de progreso MUST estar disponible para otras partes de la página, de modo que se sincronicen sin tocar el modelo.
- **FR-005** (Interacción con el cursor): Al mover el cursor, los velos MUST desplazarse con paralaje y curvarse alrededor del cursor, el flujo MUST acelerarse levemente con la velocidad del cursor, y toda la figura MUST inclinarse suavemente hacia él. El modelo MUST NOT deformarse. La intensidad MUST estar limitada para que el texto siga legible y la figura reconocible.
- **FR-006** (Reposo): Sin interacción, los velos MUST fluir despacio y la figura MUST permanecer inmóvil en su posición inicial; solo se inclina mientras el cursor o el dedo la mueve, y al retirarlo MUST volver a esa posición.
- **FR-007** (Toque): En pantallas táctiles la reacción de los velos MUST activarse al tocar/arrastrar y desactivarse al soltar. Fuera del bloqueo de introducción, el scroll vertical nativo MUST NOT interrumpirse.
- **FR-008** (Encuadre): La figura MUST caber en el hero desde 360 px (puede recortarse por los lados al estar acercada) y el 3D MUST ocupar el mismo recuadro (ya escalado) que la imagen estática.
- **FR-009** (Niveles): El sistema MUST ofrecer tres niveles: (a) imagen estática con degradado de velos para sin WebGL, movimiento reducido y ahorro de datos; (b) modelo ligero en móvil; (c) modelo completo en escritorio. La imagen estática MUST mostrarse primero y ser sustituida por el 3D al estar listo, sin parpadeo ni desplazamiento.
- **FR-010** (Movimiento reducido): Con la preferencia «reducir movimiento», el fondo y la figura MUST NOT fluir, inclinarse, balancearse ni abrirse de forma animada.
- **FR-011** (Accesibilidad): El canvas 3D MUST ser decorativo (oculto a lectores de pantalla); el contenido textual del hero MUST existir en el documento sin depender del 3D; el `<h1>` (nombre + Atlacomulco) MUST permanecer.
- **FR-012** (Degradación): Si el modelo falla o no hay WebGL, la página MUST seguir completa mostrando la imagen estática.
- **FR-013** (Revelado): El eslogan «La confianza en tu sonrisa comienza aquí» y el botón «Conoce nuestros servicios» MUST revelarse en sincronía con el progreso de apertura; el botón MUST llevar a la sección de servicios. Sin 3D animado MUST mostrarse siempre. Ambos MUST ser alcanzables por teclado.
- **FR-014b** (Difuminado bajo los textos): Mientras la boca está abierta, la parte del modelo (hueso y dientes) que se superpone a la cabecera (logo y `<h1>`) y al eslogan MUST difuminarse (desvanecerse con bordes suaves) en proporción a la apertura, para mantener esos textos legibles.
- **FR-014** (Contacto primero, también durante el bloqueo de introducción): El cráneo, los velos y el revelado MUST NOT tapar, retrasar ni bloquear los accesos de contacto («Agende su cita», teléfono, barra fija inferior en móvil, botón flotante en escritorio) ni el scroll nativo.
- **FR-015** (Hero): Se MUST retirar el slider de fotos y la capa oscura; el hero MUST tener fondo de velos de luz, texto oscuro y conservar logo, `<h1>`, «Agende su cita», teléfono y horario resumido.
- **FR-016** (Rendimiento): La animación MUST pausarse con el hero fuera de pantalla o la pestaña oculta y MUST liberar sus recursos al destruirse.
- **FR-017** (Sin terceros): La página MUST NOT hacer peticiones a dominios externos para esta función (ni librerías, ni modelos, ni fuentes).
- **FR-018** (Clic sobre el cráneo): Al hacer clic o tocar **cerca del cráneo** (a pocos píxeles de su silueta; no en el resto del hero ni en las zonas vacías de la figura), la mandíbula MUST abrirse si está cerrada y cerrarse si está abierta, con la misma animación que el scroll y también con el bloqueo de introducción ya liberado. La figura MUST poder activarse con teclado (Intro/Espacio) y exponer su estado (`aria-pressed`). Con 3D no disponible o movimiento reducido MUST NOT haber interacción (el hero es estático).

### Presupuesto (constitución v2.3.0)

| Concepto | Límite |
|---|---|
| Carga crítica (documento, estilos, código base, fuentes, imagen estática) | ≤ 500 KB |
| Carga diferida (librería 3D y modelos) | ≤ 1,5 MB, iniciada tras el primer pintado |
| Modelo completo / ligero (comprimido) | ≤ 400 KB cada uno — actual: 209 KB / 74 KB |
| Triángulos | ≤ 50 000 en escritorio, ≈ 15 000 en móvil — actual: ≈ 41 000 / ≈ 12 300 |
| Imagen estática | ≤ 60 KB — actual: 24 KB |
| Tiempo hasta ver el cráneo (LCP) | < 2,5 s en 4G; la imagen estática es el elemento LCP |
| Fluidez | ≥ 55 fps en escritorio, ≥ 30 fps en móvil de gama media |

### Key Entities

- **Cráneo**: figura formada por el maxilar (fijo) y la mandíbula (móvil, con eje en la bisagra), cada uno con hueso y dientes; existe en tres representaciones: imagen estática, modelo ligero y modelo completo.
- **Velos**: capas procedimentales del fondo, con tiempo propio y respuesta al cursor.
- **Progreso del hero**: valor de 0 a 1 derivado del scroll del hero; gobierna el ángulo de la mandíbula, el difuminado bajo los textos y el revelado de eslogan y botón.
- **Estado de interacción**: posición del cursor/toque, su velocidad y su intensidad de influencia (activa/inactiva).
- **Nivel de calidad**: estática, ligero o completo, determinado por la capacidad del dispositivo y las preferencias del usuario.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al cargar, el cráneo cerrado es visible sobre los velos en menos de 2,5 s sobre 4G, a 360 px y en escritorio, y los colores leídos por el 3D coinciden con los tokens de `:root`.
- **SC-002**: Con un gesto de scroll largo y rápido al cargar la página, la mandíbula pasa de cerrada a abierta (≈30°) en ≥ ~0,8 s sin que la página se desplace; al completarse, el siguiente scroll desplaza la página con normalidad.
- **SC-003**: Al mover el cursor, los velos y el cráneo reaccionan, y en menos de 1 s tras salir recuperan el reposo en el 100 % de los casos probados.
- **SC-004**: Con «reducir movimiento» activo, 0 píxeles del hero cambian al mover el cursor o hacer scroll.
- **SC-005**: La página no realiza ninguna petición a dominios externos y cumple todos los límites de peso de la tabla de presupuesto.
- **SC-006**: A 360 px de ancho no hay desplazamiento horizontal y la figura cabe completa, cerrada y abierta.
- **SC-007**: En una medición móvil con red limitada, Rendimiento ≥ 90 y desplazamiento acumulado de diseño (CLS) ≈ 0.
- **SC-008**: Con 3D no disponible (sin WebGL, fallo del modelo o ahorro de datos), el 100 % del contenido del hero, incluidos eslogan y botón de servicios, es visible y usable.
- **SC-009**: En todo el recorrido del hero, los accesos de contacto permanecen visibles y pulsables (0 casos en que queden tapados).

## Assumptions

- Los archivos ya existen en el repositorio: `assets/models/craneo.glb` (completo), `assets/models/craneo-ligero.glb` (móvil) y `assets/img/craneo-cerrado.webp` (imagen estática, 524 × 564, fondo blanco opaco, se mezcla con `mix-blend-mode: multiply`); su peso cumple el presupuesto. `assets/img/craneo-abierto.webp` (que venía en el zip) no se incorpora: el respaldo estático es siempre la pose cerrada.
- La autoría y licencia del escaneo original están **pendientes de confirmar** con el cliente (ver `assets/models/README.md`).
- `referencias/demo-rayosx.html` es la referencia de comportamiento (shader de rayos X, apertura por scroll); no se publica y usa un CDN solo por ser una demo. Las referencias de la versión anterior (`demo-contorno.html`) se retiraron.
- El boceto del cliente (12/10/2026) fija la composición: logo y título arriba, cráneo al centro, contacto abajo, botón en el hueco de la boca al abrirse. La tipografía del boceto (cursiva azul) y la caja blanca alrededor del cráneo no se reproducen: el sitio mantiene Poppins/Inter y el cráneo se mezcla con el fondo.
- «Hero» es la primera sección de la página; el progreso de apertura avanza con las primeras acciones de scroll mientras dura el bloqueo de introducción (constitución v2.3.0, principio II).
- «Ahorro de datos» se detecta con la preferencia del navegador cuando exista; si la API no está disponible, no se asume ahorro de datos.
- La sección de Servicios ya existe en la página como destino del botón.
- Fuera de alcance (Specs 2 y 3): transiciones entre secciones, servicios con scroll horizontal, equipo/doctor, Lenis/GSAP y formulario (sigue excluido).
- Dependencias: constitución v2.3.0, `SPEC.md` (D-15, D-16 y D-17) y fuentes autoalojadas disponibles en `assets/fonts/`.
