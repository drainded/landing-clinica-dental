# Feature Specification: Rediseño estético general de la landing

**Feature Branch**: `003-rediseno-estetica` (parte de `002-hero-estatico-scroll`, que aún no se ha fusionado con `main`)

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Rediseño estético general de la landing: nueva paleta de azules y grises oscuros, nuevo logo e íconos de servicios, tipografía elegante (Playfair Display), header oscuro translúcido al hacer scroll en PC, botón de cristal y destellos sobre los dientes en el hero, gesto de toque con la mandíbula cerrada, y un fondo que cambia de color de forma suave y continua con el scroll (como phantom.com): hero claro → azul muy claro → azules más oscuros → gris oscuro → blanco en la ubicación." Fuentes: `cambio de colores y estetica.txt` del cliente y tres capturas (paleta; header translúcido sobre la página).

## Contexto y decisiones previas

- **Qué cambia**: el aspecto de toda la página (color, tipografía, logo, íconos, header, fondo por sección) y tres detalles del hero. **Qué no cambia**: el contenido y los datos del negocio, la estructura de secciones, el modelo 3D y su transición (specs 001 y 002), el bloqueo de introducción, la barra fija y el botón flotante de contacto, y el hero en general: el cliente lo probó y dio por bueno; solo se tocan los puntos listados en la historia 3.
- **Paleta** (captura 1, de claro a oscuro): `#E6F2FF`, `#B8DBFF`, `#8AC4FF`, `#5CADFF`, `#2E96FF`, `#0080FF`, `#0069D1`, `#0052A3`, `#003B75`, `#002347`, `#000D1A`. A ella se suman un gris oscuro de tono frío neutro (para secciones y tarjetas), el blanco (ubicación) y un dorado (estrellas de reseñas).
- **Decisiones tomadas con el cliente el 2026-10-27**: la tipografía de títulos y del nombre de la clínica es **Playfair Display**; el header es **oscuro desde el inicio** y pasa a oscuro semitranslúcido al bajar en PC; los íconos de servicio se asignan **por lo que dibuja cada SVG**, no por el nombre del archivo; el trabajo sigue el flujo Spec Kit con subida de versión de la constitución.
- **Logo e íconos entregados** en `assets/logos/` (SVG trazados, de 25 a 190 KB cada uno, con dos tonos de azul y tamaños de lienzo distintos). Hay que normalizarlos (mismo lienzo y proporción, un solo color gobernado por la paleta) y reducir su peso; no se usan tal como vienen. Asignación por contenido:

  | Servicio | Archivo | Lo que dibuja |
  |---|---|---|
  | Limpieza dental | `Limpieza dental.svg` | diente limpio |
  | Ortodoncia | `Ortodoncia.svg` | dientes con brackets |
  | Blanqueamiento | `Blanqueamiento.svg` | diente con destellos |
  | Endodoncia | `Endodoncia.svg` | diente con raíces |
  | Implantes dentales | `Implantes dentales.svg` | implante |
  | Odontopediatría | `Odontopediatría.svg` | dos dientes de niño |
  | Prótesis dental | `Prótesis dental.svg` | corona sobre diente |
  | Operatoria dental | `Operatoria dental.svg` | taladro sobre diente |
  | Exodoncia | `Parodoncia.svg` | jeringa junto a diente |
  | Parodoncia | `Cirugía bucal.svg` | escudo con diente |
  | Cirugía bucal | `Estética dental.svg` | boca abierta |
  | Estética dental | `Exodoncia.svg` | diente con pieza separada |

- **Choques con la constitución v2.6.0** que esta spec resuelve subiendo su versión: el principio I conserva «la identidad actual (paleta, Poppins/Inter, logo "HR") salvo que una spec pida cambiarla» y define los tokens del hero; el principio IV fija las fuentes en Poppins/Inter; el principio III limita el peso; el principio VIII exige contraste 4,5:1; el principio II protege el contacto y el scroll nativo; el principio VII limita las animaciones a `transform` y `opacity` siempre que sea posible.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nueva identidad visual: paleta, tipografía y logo (Priority: P1)

Una persona que entra a la página ve una clínica con imagen cuidada y elegante: azules y grises oscuros, el nombre de la clínica y los títulos en una serif refinada, y el nuevo logo en el header y en el hero. El color y la tipografía son coherentes en toda la página.

**Why this priority**: es la base de todo lo demás: sin la paleta, la tipografía y el logo nuevos no se puede colorear ninguna sección.

**Independent Test**: cargar la página y recorrerla entera: no queda ningún verde azulado (el acento anterior), ningún «HR» antiguo ni títulos en la tipografía anterior; todos los colores salen de la paleta de la spec.

**Acceptance Scenarios**:

1. **Given** la página cargada, **When** se miran el header y el hero, **Then** aparece el nuevo logo (el diente con «HR») y el nombre de la clínica en la nueva tipografía; el logo se ve nítido a 40 px y a 64 px de alto sin deformarse.
2. **Given** cualquier sección, **When** se inspeccionan títulos y nombre de la clínica, **Then** usan Playfair Display (con una serif de respaldo mientras carga) y el texto de lectura sigue siendo legible, con un tamaño mínimo de 16 px.
3. **Given** el sitio completo, **When** se buscan colores, **Then** todos proceden de la paleta de la spec, del gris oscuro, del blanco o del dorado; el logo y los íconos cambian de color con la paleta, sin colores propios incrustados.
4. **Given** la fuente que aún no llega, **When** se pinta la página, **Then** el texto se ve de inmediato con una fuente de respaldo y no hay saltos de diseño apreciables al llegar la nueva.

---

### User Story 2 - Fondo que cambia de color con el scroll, de forma suave y continua (Priority: P1)

Al bajar por la página, el color de fondo no cambia en cortes bruscos entre secciones: se transforma poco a poco con el desplazamiento, como en phantom.com. Tras el hero claro, el fondo es un azul muy claro y se va oscureciendo por la paleta azul a medida que se recorren los servicios; después pasa a gris oscuro (doctor, consultorio, reseñas) y, al llegar a la ubicación, se aclara hasta el blanco. Los textos cambian de color a la vez para seguir siendo legibles en todo momento.

**Why this priority**: es el efecto distintivo del rediseño y condiciona los colores de texto y tarjetas de cada sección.

**Independent Test**: desplazar la página de arriba abajo en pasos pequeños y capturar el fondo en cada paso: la sucesión de colores es continua (sin saltos visibles entre dos capturas consecutivas) y, en cada captura, todo el texto visible cumple el contraste mínimo.

**Acceptance Scenarios**:

1. **Given** el hero terminado de abrir, **When** el visitante baja hacia «Servicios», **Then** el fondo pasa del tono claro del hero al azul muy claro (`#E6F2FF`) sin corte.
2. **Given** la sección de servicios, **When** se recorre de arriba abajo, **Then** el fondo avanza por los azules de la paleta, del más claro al más oscuro, de forma proporcional al desplazamiento.
3. **Given** el final de servicios, **When** se entra en «Sobre el doctor», **Then** el fondo llega al gris oscuro de forma gradual y se mantiene así durante doctor, consultorio y reseñas.
4. **Given** el final de reseñas, **When** se entra en la ubicación, **Then** el fondo pasa del gris oscuro al blanco de forma gradual, y la sección queda blanca.
5. **Given** cualquier posición de scroll, **When** se mide el contraste de cada texto visible contra el color de fondo que tiene en ese momento, **Then** cumple 4,5:1 (3:1 para texto grande), incluidos los puntos intermedios de las transiciones.
6. **Given** el visitante que sube de nuevo por la página, **When** retrocede, **Then** los colores recorren el mismo camino en sentido inverso.
7. **Given** «reducir movimiento» activo, o ningún JavaScript, **When** se recorre la página, **Then** cada sección muestra su color final fijo (con un degradado estático entre ellas si procede) y todo el texto es legible: la página funciona igual sin la transición animada.
8. **Given** cualquier momento del scroll, **When** se usa la barra fija, el botón flotante o el teléfono, **Then** el contacto sigue visible, pulsable y legible sobre el color de fondo del momento.

---

### User Story 3 - Header oscuro translúcido y detalles nuevos del hero (Priority: P1)

El header es oscuro con el nuevo logo y el nombre de la clínica en la nueva tipografía. En PC queda fijo arriba y, al hacer scroll, se vuelve semitransparente con desenfoque, de modo que se adivina el contenido que pasa por debajo, como en las capturas 2 y 3. En el hero, el botón «Conoce nuestros servicios» tiene aspecto de cristal transparente en los colores de la página; sobre los dientes del modelo hay pequeños brillos discretos; y, con la mandíbula cerrada, una pequeña animación de scroll invita a desplazar.

**Why this priority**: el header está en pantalla todo el tiempo y el hero es la primera impresión; ambos deben encajar con la nueva identidad desde el primer día.

**Independent Test**: en 1440 × 900, cargar la página (header oscuro y opaco), bajar unos píxeles (header translúcido con el contenido difuso visible debajo); en el hero, comprobar el botón de cristal, los brillos sobre los dientes y que el gesto de toque aparece solo con la mandíbula cerrada.

**Acceptance Scenarios**:

1. **Given** la página en lo alto en PC, **When** se mira el header, **Then** es oscuro, con el logo nuevo, el nombre de la clínica, la navegación y el teléfono legibles.
2. **Given** un PC, **When** el visitante hace scroll, **Then** el header permanece fijo arriba y pasa a oscuro semitransparente con desenfoque del contenido de detrás; el texto del header sigue cumpliendo el contraste sobre cualquier sección que pase por debajo, y la transición entre ambos estados es suave.
3. **Given** un móvil o tableta (menos de 1024 px), **When** se hace scroll, **Then** el header sigue sin ser fijo (como hoy), pero con el nuevo color oscuro y el nuevo logo. *(Enmienda 2026-10-27, D-24:)* en lugar del botón «Llamar» muestra un botón «Menú» que despliega las secciones de la página (Servicios, El doctor, Galería, Reseñas, Ubicación); el panel se cierra con Escape, al elegir una sección, al pulsar fuera o al desplazar, y «Llamar» sigue accesible en la barra fija inferior.
4. **Given** el hero, **When** se mira el botón «Conoce nuestros servicios», **Then** tiene aspecto de cristal transparente (fondo translúcido con desenfoque, borde luminoso y reflejo sutil) en tonos de la paleta, con el texto legible sobre el fondo del hero, y sigue siendo un botón pulsable de al menos 44 × 44 px con foco visible.
5. **Given** el hero con el cráneo en pantalla (modo 3D o modo imágenes), **When** pasan unos segundos, **Then** aparecen pequeños destellos suaves sobre los dientes, de forma intermitente y discreta (no tapan el modelo, no distraen del texto, no aparecen fuera de los dientes).
6. **Given** el cráneo con la mandíbula **cerrada** y la pantalla de presentación ya terminada, **When** pasan unos segundos sin que la persona interactúe, **Then** aparece una pequeña animación de **scroll** sobre el cráneo (una rueda de ratón que baja; en pantallas táctiles, un dedo que desliza hacia arriba) que invita a desplazar para abrirlo *(enmienda 2026-10-28, D-26: antes era un gesto de toque)*; **Given** la mandíbula **abierta** (o abriéndose), **Then** el gesto no se muestra.
7. **Given** que la persona ya interactuó con el cráneo (clic, toque, o inició la apertura por scroll), **When** vuelve a cerrarse la mandíbula, **Then** el gesto de toque no se repite de forma molesta (no más de una vez por visita, o se espacia con claridad).
8. **Given** «reducir movimiento» activo, **When** se mira el hero, **Then** los destellos y el gesto de toque no se animan (se omiten o quedan en una versión estática, sin parpadeo), y el botón de cristal se ve igual.

---

### User Story 4 - Servicios: tarjetas oscuras con los nuevos íconos (Priority: P2)

La sección de servicios muestra sus 12 tarjetas en gris oscuro sobre el fondo que va del azul muy claro a azules más oscuros. Cada tarjeta lleva el nuevo ícono que corresponde al servicio, con los colores de la paleta, y los textos están adaptados para leerse bien sobre gris oscuro.

**Why this priority**: es la sección con más contenido visual y la primera después del hero; sus tarjetas y íconos son lo más visible del rediseño tras la identidad y el fondo.

**Independent Test**: abrir la sección en 360, 768 y 1440 px: las 12 tarjetas son gris oscuro, cada una con el ícono correcto según la tabla de asignación, todos del mismo tamaño visual, y el título y el texto cumplen el contraste.

**Acceptance Scenarios**:

1. **Given** la sección de servicios, **When** se miran las tarjetas, **Then** las 12 son de gris oscuro, con título y descripción en colores claros legibles (contraste ≥ 4,5:1).
2. **Given** cada tarjeta, **When** se comprueba su ícono, **Then** coincide con la tabla de asignación de esta spec y comparte el mismo recuadro, la misma altura visual y la misma proporción que los demás, aunque los SVG originales tuvieran lienzos distintos.
3. **Given** el ícono sobre la tarjeta oscura, **When** se mira de cerca, **Then** es nítido, de un solo color de la paleta con buen contraste (≥ 3:1) sobre el gris, sin el segundo tono de azul del original.
4. **Given** el título y la introducción de la sección, **When** se leen sobre el fondo azul claro (arriba) y su variación al avanzar el scroll, **Then** cambian de color a la par del fondo y se leen siempre con el contraste mínimo.
5. **Given** una conexión lenta, **When** carga la página, **Then** los íconos no retrasan el primer pintado (se cargan después de la carga crítica) y no aparecen huecos ni saltos de diseño cuando llegan.

---

### User Story 5 - Doctor, consultorio, reseñas y ubicación con el nuevo esquema (Priority: P2)

Desde «Sobre el doctor» la página es de gris oscuro: los textos son claros; la galería del consultorio mantiene el gris oscuro; las reseñas mantienen el gris oscuro con tarjetas del color del fondo y un delineado blanco, y las estrellas brillan en dorado con una iluminación suave. La ubicación cierra la página sobre blanco, con textos oscuros.

**Why this priority**: completa el rediseño de la página; no cambia el contenido, solo su aspecto.

**Independent Test**: recorrer de «Sobre el doctor» al pie en 360 y 1440 px: fondo gris oscuro hasta el final de reseñas; tarjetas de reseña con borde blanco y sin relleno distinto al del fondo; estrellas doradas con resplandor; ubicación y pie sobre blanco con textos oscuros legibles.

**Acceptance Scenarios**:

1. **Given** «Sobre el doctor» y «Conozca nuestro consultorio», **When** se miran, **Then** el fondo es gris oscuro, los textos son claros y legibles, y la foto del doctor y las de la galería se ven bien sobre él.
2. **Given** «Reseñas», **When** se miran las tarjetas, **Then** tienen el mismo color que el fondo de la sección y un delineado blanco visible; el nombre y el texto de la reseña cumplen el contraste.
3. **Given** las estrellas de las reseñas, **When** se miran, **Then** son doradas y tienen una iluminación suave a su alrededor, sin parpadeo molesto (con «reducir movimiento», sin animación).
4. **Given** «Ubicación» y el pie de página, **When** se llega a ellos, **Then** el fondo es blanco, los textos son oscuros y legibles, el mapa y el horario se ven bien y los botones de contacto conservan su aspecto reconocible.
5. **Given** el enlace «Ver todas las reseñas en Google» y los demás enlaces, **When** se miran sobre su fondo (oscuro o blanco), **Then** son legibles y tienen foco visible con contraste suficiente sobre ambos fondos.

---

### User Story 6 - Pantalla de presentación al cargar (Priority: P1) *(añadida 2026-10-28, D-25)*

Al abrir la página aparece primero una pantalla oscura con el logo y el nombre de la clínica. Un diente aparece arriba a la izquierda y otro abajo a la derecha; luego otro par, hasta cuatro dientes arriba y cuatro abajo. Cuando están todos, las dos filas se cierran (como una boca) tras apagarse el logo y quedan con una ligera separación y la pantalla se desvanece mostrando la página. Mientras dura no se puede pulsar nada.

**Why this priority**: mientras se detecta si el dispositivo soporta 3D, el hero se ve primero en modo de imágenes y luego salta al 3D; la presentación lo oculta.

**Independent Test**: cargar la página en 1440 × 900 y en 375 × 812: se ven los cuatro pasos, el cierre y el desvanecimiento; al terminar el hero ya está en su modo definitivo; durante la animación un clic o la rueda no hacen nada.

**Acceptance Scenarios**:

1. **Given** una carga normal con JavaScript, **When** se pinta la página, **Then** lo primero que se ve es la presentación (fondo `--azul-950`, logo y nombre), sin que se vea nada de la página detrás.
2. **Given** la presentación en curso, **When** pasa el tiempo, **Then** entran 1, 2, 3 y 4 pares de dientes (arriba desde la izquierda, abajo desde la derecha) a ritmo de ≈ 0,35 s, y la cuadrícula final es de 4 dientes arriba y 4 abajo.
3. **Given** los cuatro pares visibles y el hero ya en su modo definitivo (3D listo o modo de imágenes), **When** termina la espera mínima (≈ 2 s), **Then** el logo se desvanece primero (≈ 0,35 s) y, un instante después, las dos filas se acercan hasta quedar con una ligera separación (≈ 0,6 s), sin solaparse; la pantalla se desvanece (≈ 0,45 s).
4. **Given** que el 3D tarda o falla, **When** pasan 4,5 s, **Then** la presentación se cierra igualmente; si JavaScript falla, un respaldo CSS la oculta a los 7 s.
5. **Given** la presentación activa, **When** la persona hace clic, toca, gira la rueda o pulsa Tab, Espacio, Intro o flechas, **Then** no ocurre nada en la página (los atajos del navegador como F5 sí funcionan); en cuanto termina, la página y el contacto responden con normalidad.
6. **Given** «reducir movimiento» o sin JavaScript, **When** se carga la página, **Then** no se muestra la presentación.
7. **Given** una URL con ancla (p. ej. `/#servicios`), **When** se carga la página, **Then** se muestra la presentación igual y, al terminar, la página queda en esa sección.
8. **Given** un móvil (< 768 px), **When** se muestra, **Then** el logo y el nombre se apilan, los cuatro dientes de cada fila caben en el ancho y el cierre cubre el logo.

---

### Edge Cases

- **Carga ya desplazada o ancla en la URL** (p. ej. `#resenas`): el fondo y los colores de texto salen correctos de inmediato, sin tener que haber recorrido la página desde arriba (se calculan a partir de la posición actual, no del historial de scroll).
- **Scroll muy rápido o saltos por anclas**: el fondo no queda a medias ni con un color incoherente; llega al color que corresponde a la posición final.
- **Cambio de tamaño de ventana o giro del móvil**: las posiciones de las transiciones se recalculan y el fondo sigue siendo correcto.
- **Sin JavaScript**: cada sección tiene un color fijo propio legible (la transición continua es una mejora, no un requisito para leer).
- **Modo oscuro del sistema**: la página no cambia de tema; la paleta es la de la marca en cualquier modo.
- **Navegador sin soporte de desenfoque de fondo** (`backdrop-filter`): el header translúcido cae a un oscuro casi opaco legible; el botón de cristal cae a un fondo translúcido sin desenfoque.
- **Teléfonos de gama baja**: el desenfoque, los destellos y la transición de fondo no deben bajar el scroll por debajo de 30 fps; si no se logra, se degradan (menos destellos, fondo por secciones sin interpolación continua).
- **Logo en tamaños pequeños** (favicon, 40 px): el diente con «HR» debe seguir reconociéndose; el favicon se actualiza con el nuevo logo.
- **Fuente Playfair que falla**: se mantiene una serif del sistema con métricas parecidas y el diseño no se rompe.
- **Foto del doctor y de la galería sobre fondo oscuro**: las fotos no se ven lavadas ni con halos; los bordes redondeados se conservan.
- **Hero y modos de imágenes/3D**: el gesto de toque y los destellos se alinean con el cráneo en ambos modos y en vertical y apaisado; en móvil apaisado bajo (donde el hero ya aparece abierto y sin bloqueo), el gesto de toque no se muestra.
- **Contacto**: la barra fija inferior (móvil) y el botón flotante (PC) mantienen su color de marca reconocible y contraste sobre fondos claros, oscuros y blancos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La página MUST usar la paleta de azules de la spec, un gris oscuro frío, el blanco y un dorado, definidos como tokens de diseño; ningún color literal fuera de los tokens (constitución, principio I). El acento verde azulado anterior MUST desaparecer.
- **FR-002**: Los títulos y el nombre de la clínica MUST usar Playfair Display, autoalojada en WOFF2 (sin Google Fonts ni CDN), con `font-display: swap` y una serif de respaldo; el texto de lectura conserva su fuente actual.
- **FR-003**: El header MUST ser oscuro, con el nuevo logo (`LOGO CLINICA.svg` normalizado) y el nombre de la clínica en la nueva tipografía; el hero MUST mostrar el nuevo logo.
- **FR-004**: En pantallas de 1024 px o más, el header MUST seguir fijo arriba y pasar, al desplazarse, a un estado oscuro semitransparente con desenfoque del contenido de detrás, con transición suave; en menos de 1024 px MUST seguir sin ser fijo. Sin soporte de `backdrop-filter`, MUST caer a un oscuro casi opaco legible.
- **FR-005**: El fondo de la página MUST cambiar de forma continua con el scroll: hero claro → azul muy claro (`#E6F2FF`) → azules progresivamente más oscuros de la paleta a lo largo de servicios → gris oscuro en doctor, consultorio y reseñas → blanco en la ubicación. No hay cortes bruscos entre secciones.
- **FR-006**: Los colores de texto, títulos, enlaces, bordes y de los controles de cada sección MUST adaptarse al fondo que tengan en cada posición de scroll y cumplir el contraste de 4,5:1 (3:1 el texto grande y los íconos) también en los puntos intermedios de las transiciones. Si el fondo en transición hace imposible el contraste, el texto cambia de color antes de que falle.
- **FR-007**: La transición de fondo MUST respetar el scroll nativo (sin secuestrarlo, sin scroll suave artificial), MUST calcularse a partir de la posición actual (válida con carga ya desplazada, anclas y redimensionado) y MUST degradar a colores fijos por sección con «reducir movimiento» o sin JavaScript.
- **FR-008**: El botón «Conoce nuestros servicios» del hero MUST tener aspecto de cristal transparente (fondo translúcido con desenfoque, borde luminoso, reflejo sutil) en colores de la paleta, con texto legible, tamaño táctil de al menos 44 × 44 px y foco visible. Sin soporte de `backdrop-filter` MUST caer a un fondo translúcido legible.
- **FR-009**: Sobre los dientes del modelo MUST aparecer una animación discreta de pequeños brillos o resplandores, en el modo 3D y en el modo de imágenes, alineada con los dientes y sin tapar el modelo ni el texto; con «reducir movimiento» no se anima.
- **FR-010**: Cuando la mandíbula esté cerrada MUST mostrarse, de forma intermitente y discreta, una pequeña animación de un gesto de toque sobre el cráneo; MUST NOT mostrarse con la mandíbula abierta o abriéndose, ni en móvil apaisado bajo, ni más de una vez por visita tras la primera interacción de la persona; con «reducir movimiento» no se anima.
- **FR-011**: Las 12 tarjetas de servicio MUST ser de gris oscuro, con título y texto claros, y cada una MUST llevar el ícono que le corresponde según la tabla de asignación de esta spec.
- **FR-012**: El logo y los íconos SVG MUST normalizarse (lienzo y proporción comunes, un solo color por ícono gobernado por la paleta, sin metadatos de edición) y optimizarse de peso; cada ícono MUST pesar como máximo 30 KB sin comprimir (ajustado en el plan tras medir los trazados originales) y el conjunto de los 12 más el logo MUST sumar como máximo 80 KB comprimidos. Los íconos MUST cargarse después de la carga crítica, sin saltos de diseño, y llevar texto alternativo vacío o `aria-hidden` (decorativos; el título de la tarjeta ya nombra el servicio); el logo MUST tener un nombre accesible.
- **FR-013**: «Sobre el doctor», «Conozca nuestro consultorio» y «Reseñas» MUST tener fondo gris oscuro y textos claros adaptados. Las tarjetas de reseñas MUST tener el color del fondo de la sección y un delineado blanco; las estrellas MUST ser doradas con una iluminación suave a su alrededor.
- **FR-014**: «Ubicación» y el pie MUST quedar sobre fondo blanco con textos oscuros, manteniendo el mapa, el horario, los botones de contacto y el aviso de derechos legibles.
- **FR-015**: Se MUST conservar sin cambios el contenido textual, los datos del negocio inyectados, las anclas, la estructura de encabezados (un único `<h1>`), el modelo 3D y su transición, el bloqueo de introducción, y el acceso a contacto (barra fija en móvil, botón flotante en PC, teléfono pulsable) visible y legible sobre todos los fondos.
- **FR-016**: El favicon y la imagen para compartir (Open Graph) MUST actualizarse con el nuevo logo y la nueva paleta.
- **FR-017**: La constitución MUST actualizarse (versión MINOR) para registrar la nueva paleta, la tipografía, el logo, los nuevos tokens, la tolerancia de color por scroll y el nuevo presupuesto de fuentes; y `SPEC.md` §11 MUST registrar la decisión. Los planes MUST verificar el cumplimiento de los nueve principios.
- **FR-018**: Todo el rediseño MUST cumplir la constitución: peso (carga crítica ≤ 500 KB, total escritorio ≈ 2 MB, móvil ≈ 1,5 MB), animación solo de `transform`/`opacity` cuando sea posible, sin desplazamiento horizontal desde 360 px, navegación por teclado con foco visible sobre todos los fondos, y verificación en móvil emulado con red 4G limitada.
- **FR-019** *(2026-10-28, D-26)*: En pantallas táctiles (`pointer: coarse`) el modelo 3D MUST NOT inclinarse hacia el dedo (los velos de fondo sí siguen al puntero) y, **en táctil, el toque abre/cierra la mandíbula** (se conserva), pero una pulsación larga (> 450 ms o con el dedo movido) MUST NOT activarla ni ofrecer guardar/seleccionar la imagen del modelo (sin menú contextual, sin arrastre de imagen, sin selección). Con ratón y teclado se conserva el clic y la inclinación.

### Key Entities

- **Paleta de marca**: conjunto de 11 azules, un gris oscuro, el blanco y el dorado, con el rol de cada uno (fondo, tarjeta, texto, acento, borde, estrella).
- **Fondo continuo**: la secuencia de colores de fondo asociada a la posición de la página (hero → servicios → doctor/consultorio/reseñas → ubicación), con paradas definidas y colores de texto asociados a cada tramo.
- **Íconos y logo**: 12 íconos de servicio y un logo, cada uno con lienzo normalizado, color único y peso acotado, y la asignación servicio → ícono.
- **Estados del header**: oscuro opaco (arriba) y oscuro translúcido (tras desplazarse, solo PC).
- **Efectos del hero**: destellos sobre los dientes y gesto de toque, cada uno con su condición de aparición (visible; mandíbula cerrada).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de las posiciones de scroll muestreadas cada 100 px (de arriba abajo y de abajo arriba), cada texto visible cumple el contraste mínimo (4,5:1 normal, 3:1 grande) contra su fondo real en ese momento.
- **SC-002**: Entre dos posiciones de scroll consecutivas muestreadas cada 50 px, el cambio de color de fondo es inapreciable como un corte (diferencia de luminosidad entre muestras vecinas ≤ 8 puntos de 100), de principio a fin de la página.
- **SC-003**: Ninguna regla de estilo ni código propio contiene un color literal fuera de los tokens, y no quedan referencias al acento verde azulado, a Poppins en títulos ni al logo «HR» anterior.
- **SC-004**: Peso de la carga crítica ≤ 500 KB y total ≤ 2 MB en escritorio (≈ 1,5 MB en móvil), medidos y reportados; los 12 íconos y el logo suman ≤ 80 KB comprimidos y no entran en la carga crítica.
- **SC-005**: El contenido principal sigue visible en menos de 2,5 s en 4G emulada, sin saltos de diseño (CLS ≤ 0,1) al cargar la fuente nueva y los íconos.
- **SC-006**: El scroll se mantiene fluido: al menos 30 fps en un móvil de gama media emulado con el header translúcido, la transición de fondo y los destellos activos, y sin tirones perceptibles en escritorio.
- **SC-007**: Con «reducir movimiento» y con JavaScript desactivado, el 100 % de las secciones es legible y no hay animaciones nuevas en marcha (destellos, gesto de toque, brillo de estrellas, transición de fondo).
- **SC-008**: Las 12 tarjetas de servicio muestran el ícono correcto según la tabla de asignación, con el mismo tamaño visual (diferencia de alto ≤ 5 %) en 360, 768 y 1440 px.
- **SC-009**: En PC, el header cambia de oscuro a semitransparente en menos de 0,4 s tras empezar a desplazarse y deja ver (difuminado) el contenido de debajo; en menos de 1024 px no es fijo.
- **SC-010**: El gesto de toque aparece en el 100 % de las cargas con la mandíbula cerrada tras unos segundos de inactividad, y en 0 % de los momentos con la mandíbula abierta.
- **SC-011**: Ningún desplazamiento horizontal desde 360 px, 44 × 44 px mínimo en controles pulsables, foco visible con contraste suficiente sobre fondo azul, gris oscuro y blanco, y el contacto (barra, botón flotante, teléfono) visible y legible en todas las posiciones.

## Assumptions

- **Tono de gris oscuro**: neutro frío, elegido en el plan para combinar con `#000D1A`/`#002347` y servir de base de tarjetas y secciones (valor exacto a decidir en `plan.md`, validando contraste).
- **El hero conserva su fondo de velos celestes** (tokens `--color-velo-*`) y el modelo 3D; solo se adaptan los colores de su texto a la nueva paleta cuando el acento verde azulado deja de existir. El cliente lo probó y no pidió cambios más allá de los de la historia 3.
- **Botones de WhatsApp y de llamada**: mantienen su verde de marca (WhatsApp) y se adaptan a la nueva paleta en el resto de botones; el contraste se verifica sobre los nuevos fondos.
- **«Translúcido pero opaco»** se interpreta como las capturas: oscuro semitransparente con desenfoque, no transparente del todo ni sólido.
- **Gesto de toque**: se interpreta como un ícono de mano o dedo que se apoya y pulsa sobre el cráneo (y, en táctiles, sugiere también desplazar); aparece pocas veces y no tapa los dientes.
- **El dorado de las estrellas y el gris oscuro** son tokens nuevos; el valor exacto se fija en el plan.
- **Los textos y datos** (servicios, reseñas, credenciales, teléfono, horario) no cambian; la ortografía y el trato de usted se mantienen.
- **Alcance excluido**: nuevo contenido, nuevas secciones, formulario, analítica, modo claro/oscuro conmutable, y cualquier cambio del modelo 3D, de las imágenes del cráneo y de la mecánica de apertura de la mandíbula.
- **Dependencias**: los SVG de `assets/logos/` (entregados por el cliente), la tipografía Playfair Display (licencia SIL OFL, se registra en `assets/fonts/LICENSE.txt`) y las specs 001 y 002 (el hero actual, sobre el que esta spec se apoya).
