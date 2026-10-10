# Feature Specification: Dentadura 3D interactiva en el hero

**Feature Branch**: `001-dentadura-3d-hero` (el trabajo continúa en la rama `adopt-spec-kit`; no se creó rama nueva)

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "Dentadura 3D interactiva en el hero de la landing de la Clínica Dental Dr. Héctor Manuel Rojas Pérez (Atlacomulco): contorno verde y relleno blanco, mandíbula cerrada al cargar, se deforma con el cursor/toque y se abre con el scroll; al abrirse se revelan el eslogan y un botón «Servicios». Sustituye al slider de fotos del hero."

## Contexto y decisiones previas

- La landing sustituye el slider de fotos del hero (D-15 en `SPEC.md`) por una dentadura que reacciona al visitante. Es el elemento memorable de la página.
- El hero tiene **fondo blanco** (`--color-superficie`) con texto oscuro, sin capa oscura, y la dentadura **centrada**.
- Los datos que el hero ya muestra se conservan: logo, `<h1>` (nombre de la clínica + Atlacomulco), botón «Agende su cita», teléfono pulsable y horario resumido.
- Cuando la mandíbula está abierta se revelan el eslogan «La confianza en tu sonrisa comienza aquí» y un botón «Servicios» que lleva a la sección de servicios. Si la dentadura no se puede animar (imagen estática, movimiento reducido, ahorro de datos, sin WebGL), el eslogan y el botón se muestran siempre.
- Las fuentes Poppins/Inter se autoalojan (D-16): la página no hace peticiones a dominios externos.
- Esta spec respeta la constitución v2.1.0 (principios I, II, III, V, VI, VII y VIII en particular).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver la dentadura al llegar (Priority: P1)

Una persona abre la página y ve de inmediato una dentadura humana con contorno verde y relleno blanco, con la mandíbula **cerrada**, sin esperar a que cargue nada pesado. Junto a ella ve el nombre de la clínica y puede contactar.

**Why this priority**: Es la primera impresión y el elemento que diferencia a la clínica de la otra de la zona; además es el contenido principal que determina el tiempo de carga percibido.

**Independent Test**: Abrir la página en móvil (360 px) y escritorio con red 4G limitada: la dentadura cerrada es visible en menos de 2,5 s, con el contorno del color de acento y relleno blanco sobre el fondo blanco, sin saltos de diseño.

**Acceptance Scenarios**:

1. **Given** una visita nueva, **When** la página termina de pintar el primer contenido, **Then** se ve la dentadura cerrada centrada, con contorno de grosor uniforme en el color de acento y relleno blanco, y el `<h1>`, «Agende su cita», teléfono y horario están visibles.
2. **Given** que la dentadura interactiva aún no terminó de cargar, **When** el visitante mira el hero, **Then** ve una imagen de la dentadura cerrada indistinguible en pose y estilo de la versión interactiva, y esta la reemplaza sin parpadeo ni desplazamiento del contenido.
3. **Given** una pantalla de 360 px de ancho, **When** se muestra el hero, **Then** la dentadura cabe completa a lo ancho sin desplazamiento horizontal.

---

### User Story 2 - Deformarla con el cursor o el toque (Priority: P1)

Al mover el cursor sobre la figura (o al tocarla en pantallas táctiles), la dentadura se deforma localmente de forma suave y el contorno acompaña la deformación. Al retirar el cursor o soltar el dedo, vuelve a su forma original. Además la figura se inclina ligeramente hacia el cursor y, sin interacción, tiene un leve balanceo continuo.

**Why this priority**: Es lo que vuelve a la página memorable y comunica cuidado y profesionalismo; sin ella la dentadura sería solo una imagen.

**Independent Test**: Mover el cursor sobre la figura y comprobar que se deforma solo cerca del cursor, nunca se ve rota y regresa a su forma al salir; repetir con el dedo en un móvil confirmando que el scroll vertical sigue funcionando.

**Acceptance Scenarios**:

1. **Given** la dentadura en reposo, **When** el cursor pasa sobre ella, **Then** la zona cercana se empuja, abulta y ondula suavemente dentro de un radio acotado, y el contorno sigue la deformación.
2. **Given** una deformación activa, **When** el cursor sale de la figura o de la ventana, **Then** la dentadura vuelve suavemente a su forma original.
3. **Given** una pantalla táctil, **When** el visitante toca la figura, **Then** se activa la deformación y se desactiva al soltar, y un gesto de scroll vertical sobre la figura desplaza la página normalmente.
4. **Given** ausencia de interacción, **When** pasan unos segundos, **Then** la figura muestra un leve balanceo continuo.
5. **Given** cualquier posición del cursor, **When** la deformación alcanza su máximo, **Then** la figura sigue siendo reconocible como dentadura (intensidad limitada).

---

### User Story 3 - Abrir la mandíbula con el scroll (Priority: P1)

Al hacer scroll en el hero, la mandíbula inferior se abre progresivamente (hasta unos 40°) y se cierra al volver hacia arriba. El scroll nunca se bloquea ni se secuestra.

**Why this priority**: Es el gesto narrativo central del hero («abrir la boca» para hablar de servicios) y el vínculo con el eslogan y el botón de la historia 4.

**Independent Test**: Desplazar el hero de 0 % a 100 % y de vuelta: la mandíbula pasa de cerrada a abierta y regresa de forma proporcional y suave, incluso con scroll rápido o con inercia.

**Acceptance Scenarios**:

1. **Given** la mandíbula cerrada al inicio del hero, **When** el visitante hace scroll hacia abajo dentro del hero, **Then** la mandíbula se abre en proporción al avance, con suavizado.
2. **Given** la mandíbula abierta, **When** el visitante regresa hacia arriba, **Then** la mandíbula se cierra de forma proporcional.
3. **Given** un scroll muy rápido o con inercia, **When** se suelta, **Then** la mandíbula alcanza la posición correspondiente sin saltos ni vibraciones.
4. **Given** que la mandíbula está abierta, **When** se muestra completa en el viewport, **Then** la figura cabe en alto dentro de la ventana.
5. **Given** cualquier momento, **When** el visitante hace scroll, **Then** el desplazamiento nativo nunca se bloquea ni se retrasa.

---

### User Story 4 - Eslogan y botón «Servicios» al abrirse (Priority: P2)

Cuando la mandíbula se abre, el eslogan «La confianza en tu sonrisa comienza aquí» y el botón «Servicios» se revelan sincronizados con el avance de la apertura; el botón lleva a la sección de servicios. El contacto (Agende su cita, teléfono, barra fija inferior en móvil o botón flotante en escritorio) nunca queda tapado por la dentadura ni por el revelado.

**Why this priority**: Conecta el elemento visual con el mensaje de marca y con el siguiente paso de la página, pero la dentadura funciona sin él.

**Independent Test**: Hacer scroll hasta abrir la mandíbula y comprobar que el eslogan y el botón aparecen, que el botón desplaza a Servicios y que el contacto sigue visible y pulsable en todo momento.

**Acceptance Scenarios**:

1. **Given** la mandíbula cerrada, **When** el hero se muestra, **Then** el eslogan y el botón «Servicios» no son visibles (o están en su estado inicial atenuado) y el resto de datos del hero sí.
2. **Given** la mandíbula abriéndose, **When** el avance supera el umbral de revelado, **Then** el eslogan y el botón aparecen de forma gradual, proporcional al avance.
3. **Given** el botón «Servicios» visible, **When** se pulsa o se activa con teclado, **Then** la página se desplaza a la sección de servicios.
4. **Given** el 3D no disponible, movimiento reducido o ahorro de datos, **When** se muestra el hero, **Then** el eslogan y el botón «Servicios» están visibles desde el inicio.
5. **Given** cualquier estado del hero, **When** el visitante busca contacto, **Then** «Agende su cita», el teléfono y la barra fija/botón flotante están visibles y no tapados.

---

### User Story 5 - Dispositivos modestos y movimiento reducido (Priority: P2)

En un móvil de gama baja, con ahorro de datos, sin WebGL o con la preferencia «reducir movimiento», el visitante obtiene una versión más ligera o estática que sigue siendo reconocible, y la página queda completa.

**Why this priority**: El público es mayoritariamente móvil con 4G variable y puede incluir personas sensibles al movimiento; la página debe funcionar bien para todos.

**Independent Test**: Activar «reducir movimiento» y recorrer la página moviendo el cursor y haciendo scroll: ningún píxel de la dentadura cambia. Simular ausencia de WebGL o fallo de carga del modelo: se ve la imagen estática y la página está completa.

**Acceptance Scenarios**:

1. **Given** la preferencia «reducir movimiento» activa, **When** el visitante mueve el cursor o hace scroll, **Then** la dentadura no se deforma, no se balancea y no se abre (0 píxeles cambian).
2. **Given** un navegador sin WebGL o un fallo al cargar el modelo, **When** carga la página, **Then** se muestra la imagen estática de la dentadura cerrada y todo el contenido del hero es accesible.
3. **Given** un móvil o modo de ahorro de datos, **When** se decide qué mostrar, **Then** se usa una versión más ligera del modelo o solo la imagen estática, y en ningún caso se supera el presupuesto de peso.
4. **Given** un escritorio capaz, **When** carga, **Then** se usa la versión completa del modelo.

---

### Edge Cases

- Cambio de tamaño de la ventana o rotación del dispositivo: la figura se re-encuadra sin deformarse ni salirse del viewport.
- Scroll rápido o con inercia: la apertura sigue al scroll sin saltos.
- El cursor sale de la ventana con una deformación activa: la figura regresa a su forma.
- Pestaña en segundo plano o hero fuera de pantalla: la animación se pausa y se reanuda al volver.
- Pérdida del contexto gráfico: se vuelve a la imagen estática sin romper la página.
- Zoom del navegador al 200 %: el contorno conserva su grosor constante en píxeles y la figura cabe a lo ancho.
- El revelado del eslogan en pantallas bajas: no cubre botones de contacto.
- Navegación por teclado: «Servicios» y «Agende su cita» se alcanzan con Tab aunque aún no estén totalmente revelados por el scroll.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Estilo): La dentadura MUST dibujarse con contorno en el color de acento del sitio (`#0F6E6E`, leído del token `--color-acento`), de grosor constante en píxeles (4–5 px CSS, independiente del tamaño y del zoom) y relleno blanco, sin sombreado, texturas ni degradados, con fondo transparente sobre el fondo blanco del hero.
- **FR-002** (Anatomía): La figura MUST mostrar maxilar y mandíbula con dientes diferenciados (incisivos, caninos, premolares y molares) y encías, reconocible como dentadura humana, sin colmillos exagerados. La geometría MUST ser original, sin licencias de terceros.
- **FR-003** (Pose inicial): La mandíbula MUST estar cerrada al cargar y en la imagen estática.
- **FR-004** (Apertura por scroll): Un valor de progreso entre 0 y 1 ligado al avance del scroll del hero MUST controlar el ángulo de la mandíbula (de 0° a ≈40°) con suavizado, en ambos sentidos. El valor de progreso MUST estar disponible para otras partes de la página, de modo que se sincronicen sin tocar el modelo.
- **FR-005** (Deformación): Al acercar el cursor, la figura MUST deformarse localmente (empuje radial, abultamiento y leve onda) dentro de un radio de influencia acotado; el contorno MUST acompañar la deformación; la intensidad MUST estar limitada para que nunca se vea rota; y toda la figura MUST inclinarse suavemente hacia el cursor.
- **FR-006** (Reposo): Sin interacción, la figura MUST mostrar un leve balanceo continuo.
- **FR-007** (Toque): En pantallas táctiles la deformación MUST activarse al tocar y desactivarse al soltar, y el scroll vertical nativo MUST NOT interrumpirse.
- **FR-008** (Encuadre): La figura MUST caber a lo ancho desde 360 px y, con la mandíbula abierta, MUST caber en alto dentro del viewport.
- **FR-009** (Niveles): El sistema MUST ofrecer tres niveles: (a) imagen estática con transparencia (dentadura cerrada) para sin WebGL, movimiento reducido y ahorro de datos; (b) modelo ligero en móvil; (c) modelo completo en escritorio. La imagen estática MUST mostrarse primero y ser sustituida por el 3D al estar listo, sin parpadeo ni desplazamiento.
- **FR-010** (Movimiento reducido): Con la preferencia «reducir movimiento», la figura MUST NOT deformarse, balancearse ni abrirse de forma animada.
- **FR-011** (Accesibilidad): La figura 3D MUST ser decorativa (oculta a lectores de pantalla); el contenido textual del hero MUST existir en el documento sin depender del 3D; el `<h1>` (nombre + Atlacomulco) MUST permanecer.
- **FR-012** (Degradación): Si el modelo falla o no hay WebGL, la página MUST seguir completa mostrando la imagen estática.
- **FR-013** (Revelado): El eslogan «La confianza en tu sonrisa comienza aquí» y el botón «Servicios» MUST revelarse en sincronía con el progreso de apertura; el botón MUST llevar a la sección de servicios. Sin 3D animado MUST mostrarse siempre. Ambos MUST ser alcanzables por teclado.
- **FR-014** (Contacto primero): La dentadura y el revelado MUST NOT tapar, retrasar ni bloquear los accesos de contacto («Agende su cita», teléfono, barra fija inferior en móvil, botón flotante en escritorio) ni el scroll nativo.
- **FR-015** (Hero): Se MUST retirar el slider de fotos y la capa oscura; el hero MUST tener fondo blanco, texto oscuro y conservar logo, `<h1>`, «Agende su cita», teléfono y horario resumido.
- **FR-016** (Rendimiento): La animación MUST pausarse con el hero fuera de pantalla o la pestaña oculta y MUST liberar sus recursos al destruirse.
- **FR-017** (Sin terceros): La página MUST NOT hacer peticiones a dominios externos para esta función (ni librerías, ni modelos, ni fuentes).

### Presupuesto (constitución v2.1.0)

| Concepto | Límite |
|---|---|
| Carga crítica (documento, estilos, código base, fuentes, imagen estática) | ≤ 500 KB |
| Carga diferida (librería 3D y modelos) | ≤ 1,5 MB, iniciada tras el primer pintado |
| Modelo completo / ligero (comprimido) | ≤ 400 KB cada uno — actual: 179 KB / 53 KB |
| Triángulos dibujados | ≤ 50 000 en escritorio, ≈ 15 000 en móvil (el contorno duplica los dibujados) |
| Imagen estática | ≤ 60 KB — actual: 18 KB |
| Tiempo hasta ver la dentadura (LCP) | < 2,5 s en 4G; la imagen estática es el elemento LCP |
| Fluidez | ≥ 55 fps en escritorio, ≥ 30 fps en móvil de gama media |

### Key Entities

- **Dentadura**: figura formada por el maxilar (fijo) y la mandíbula (móvil, con eje en la bisagra), con dientes y encías; existe en tres representaciones: imagen estática, modelo ligero y modelo completo.
- **Progreso de apertura**: valor de 0 (cerrada) a 1 (abierta) derivado del scroll del hero; gobierna el ángulo de la mandíbula y el revelado de eslogan y botón.
- **Estado de interacción**: posición del cursor/toque y su intensidad de influencia sobre la figura (activa/inactiva).
- **Nivel de calidad**: estática, ligero o completo, determinado por la capacidad del dispositivo y las preferencias del usuario.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al cargar, la dentadura cerrada es visible con contorno en el color de acento exacto (`#0F6E6E`) en menos de 2,5 s sobre 4G, a 360 px y en escritorio.
- **SC-002**: Al recorrer el hero de 0 % a 100 % de scroll, la mandíbula pasa de cerrada a abierta (≈40°) y vuelve a cerrarse al regresar, sin saltos perceptibles, incluso con scroll rápido.
- **SC-003**: Al pasar el cursor por la figura se deforma, y en menos de 1 s tras salir recupera su forma original en el 100 % de los casos probados.
- **SC-004**: Con «reducir movimiento» activo, 0 píxeles de la dentadura cambian al mover el cursor o hacer scroll.
- **SC-005**: La página no realiza ninguna petición a dominios externos y cumple todos los límites de peso de la tabla de presupuesto.
- **SC-006**: A 360 px de ancho no hay desplazamiento horizontal y la figura cabe completa; abierta, cabe en alto en la ventana.
- **SC-007**: En una medición móvil con red limitada, Rendimiento ≥ 90 y desplazamiento acumulado de diseño (CLS) ≈ 0.
- **SC-008**: Con 3D no disponible (sin WebGL, fallo del modelo o ahorro de datos), el 100 % del contenido del hero, incluidos eslogan y botón «Servicios», es visible y usable.
- **SC-009**: En todo el recorrido del hero, los accesos de contacto permanecen visibles y pulsables (0 casos en que queden tapados).

## Assumptions

- Los archivos del modelo ya existen: `assets/models/diente.glb` (completo), `assets/models/diente-ligero.glb` (móvil) y `assets/img/diente-poster.webp` (imagen estática); su peso actual cumple el presupuesto.
- La autoría del modelo es propia (geometría original); debe documentarse en el repositorio, pero no requiere licencia de terceros.
- `referencias/demo-contorno.html` es la referencia de comportamiento (deformación, contorno, apertura); no se publica y usa un CDN solo por ser una demo.
- «Hero» es la primera sección de la página; el progreso de apertura se calcula sobre su recorrido de scroll.
- «Ahorro de datos» se detecta con la preferencia del navegador cuando exista; si la API no está disponible, no se asume ahorro de datos.
- La sección de Servicios ya existe en la página como destino del botón.
- El umbral exacto del revelado del eslogan (por ejemplo, a partir de cierto porcentaje de apertura) se define en el plan.
- Fuera de alcance (Specs 2 y 3): transiciones entre secciones, servicios con scroll horizontal, equipo/doctor, Lenis/GSAP y formulario (sigue excluido).
- Dependencias: constitución v2.1.0, `SPEC.md` (D-15 y D-16) y fuentes autoalojadas disponibles en `assets/fonts/`.
