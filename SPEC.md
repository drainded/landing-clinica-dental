# Spec — Landing Clínica Dental Dr. Héctor Manuel Rojas Pérez

**Versión:** 1.0 · **Fecha:** 2026-09-08 · **Estado:** especificación aprobada e implementada

---

## 1. Contexto y objetivo

### 1.1 El negocio

Clínica Dental Dr. Héctor Manuel Rojas Pérez, ubicada en Atlacomulco, Estado de México (coordenadas `19.7975627, -99.8719214`). Es un consultorio local que atiende pacientes de la zona y hoy no tiene presencia web propia.

### 1.2 El problema

Los pacientes potenciales de la zona no tienen forma de conocer los servicios de la clínica ni de comprobar que es un lugar serio y limpio antes de acudir. Además existe otra clínica en la zona con una imagen digital más profesional, lo que desvía pacientes que comparan antes de decidir.

### 1.3 Objetivo del proyecto

Publicar una landing de una sola página en la que **contactar sea el camino más fácil y evidente de toda la página**, y que transmita el nivel de profesionalismo necesario para competir con la otra clínica de la zona.

Este objetivo es cualitativo y deliberadamente no medible: el proyecto no incluye analítica (ver decisión D-06), por lo que el documento no promete métricas de conversión. El criterio de éxito se evalúa por revisión: en cualquier punto del recorrido de la página, el paciente tiene un botón de contacto visible sin necesidad de buscarlo.

### 1.4 Público objetivo

Pacientes de Atlacomulco y alrededores, mayoritariamente en teléfono móvil, con conexión 4G de calidad variable. Amplio rango de edad, incluyendo personas mayores que prefieren llamar antes que escribir. El trato en todos los textos es **de usted**.

---

## 2. Alcance y no-objetivos

### 2.1 Dentro del alcance

- Una única página HTML estática, responsive, mobile-first, en español de México.
- Siete bloques de contenido: hero con slider, servicios, sobre el doctor, galería, reseñas, footer con mapa y horarios, más los elementos fijos de contacto.
- Contacto por WhatsApp y por llamada telefónica.
- Base mínima de SEO local y de compartición en redes (ver sección 10.4).
- Despliegue en Netlify o Cloudflare Pages.

### 2.2 Fuera del alcance (no-objetivos)

Estos puntos se excluyen de forma explícita. No son olvidos: se decidieron y se descartaron.

| No-objetivo | Motivo |
|---|---|
| Precios y promociones publicados | El cliente trata los precios directamente con cada paciente. |
| Sección de preguntas frecuentes | Descartada por el cliente en la fase de especificación. |
| Formulario de contacto | Requiere backend o servicio externo; WhatsApp cubre la necesidad. |
| Agenda o reserva de cita en línea | Complejidad muy superior al valor para una clínica de este tamaño. |
| Analítica (GA4, Meta Pixel, etc.) | Descartada por el cliente; evita además banner de cookies. |
| Blog o páginas por servicio | El SEO de contenido queda fuera de esta versión. |
| Segundo idioma | La página es solo en español. |
| Panel de administración o CMS | Los cambios los hace quien mantiene el código, editando un bloque único. |

---

## 3. Requisitos

### 3.1 Requisitos funcionales

| ID | Requisito |
|---|---|
| RF-01 | La página muestra el nombre de la clínica, su eslogan y su ubicación en el primer pantallazo. |
| RF-02 | El teléfono es pulsable (`tel:`) desde cualquier punto de la página. |
| RF-03 | Existe un acceso a WhatsApp permanentemente visible, con mensaje inicial prellenado. |
| RF-04 | Se listan los servicios de la clínica con un ícono y una descripción breve cada uno. |
| RF-05 | Se presenta al doctor con foto, nombre y credenciales. |
| RF-06 | Se muestra una galería de fotografías reales del consultorio. |
| RF-07 | Se muestran reseñas reales de pacientes; si no hay reseñas, la sección no se renderiza. |
| RF-08 | El footer muestra la dirección, un mapa que enlaza a la navegación, y el horario completo. |
| RF-09 | El hero muestra un resumen del horario en una línea. |
| RF-10 | Las imágenes del hero rotan automáticamente con transición de fundido. |
| RF-11 | En escritorio hay navegación por anclas a las secciones principales. |

### 3.2 Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-01 | Mobile-first: el diseño se construye desde 360 px de ancho hacia arriba. |
| RNF-02 | Sin frameworks ni librerías externas de JS o CSS. |
| RNF-03 | Sin scripts de terceros ni cookies, por lo que no se requiere banner de consentimiento. |
| RNF-04 | Todos los colores y tipografías viven en variables CSS en un único bloque. |
| RNF-05 | Todos los datos del negocio viven en un único bloque de constantes. |
| RNF-06 | La página es utilizable con teclado y respeta `prefers-reduced-motion`. |
| RNF-07 | El sitio se sirve por HTTPS con dominio propio cuando el cliente lo proporcione. |

---

## 4. Especificación de la interfaz

Orden vertical de la página: **Hero → Servicios → Sobre el doctor → Galería → Reseñas → Footer**, más los elementos fijos de contacto.

### 4.1 Header

- **Móvil (< 1024 px):** logo a la izquierda, botón «Llamar» a la derecha. Sin menú hamburguesa. Header no fijo.
- **Escritorio (≥ 1024 px):** logo a la izquierda; en el centro, anclas a *Servicios · El doctor · Galería · Reseñas · Ubicación*; a la derecha, el teléfono visible y pulsable. Header fijo al hacer scroll, con fondo sólido para mantener la legibilidad.

### 4.2 Hero

Sección a pantalla completa con el slider de fotografías al fondo y una capa oscura encima que garantiza el contraste del texto sea cual sea la fotografía.

Orden de los elementos, de arriba abajo:

1. Logo de la clínica.
2. `<h1>`: «Clínica Dental Dr. Héctor Manuel Rojas Pérez — Atlacomulco».
3. Eslogan: **«La confianza en tu sonrisa comienza aquí»**, tipográficamente el elemento más grande del hero.
4. Botón principal: **«Agende su cita»**, que abre WhatsApp.
5. Teléfono pulsable, en tamaño menor que el botón.
6. Línea de horario resumido: «Lun–Vie 9:00–19:00 · Sáb 9:00–14:00».

La jerarquía visual y la semántica no coinciden a propósito: el `<h1>` contiene nombre y ciudad porque es lo que se busca en Google y lo que se muestra al compartir el enlace, mientras que el eslogan domina visualmente porque es lo que genera la conexión con el paciente.

**Slider:** 3 imágenes, transición de fundido cada 6 segundos, sin flechas, con tres puntos indicadores discretos y pulsables. Se pausa al pasar el cursor por encima. Se desactiva por completo —quedando una imagen fija— si el navegador solicita `prefers-reduced-motion` o si solo hay una imagen disponible. La primera imagen se carga con prioridad; las otras dos, en diferido.

### 4.3 Servicios

Rejilla de tarjetas, cada una con ícono SVG en línea, nombre del servicio y una descripción de una o dos frases. La rejilla es flexible: debe verse correctamente con 3, 4, 5 o 6 tarjetas, sin huecos rotos ni tarjetas huérfanas.

Servicios confirmados por el cliente: **limpieza dental, ortodoncia, blanqueamiento, endodoncia, parodoncia, exodoncia, cirujia bucal, estetica dental, protesis dental, odontopediatria, implantes, operatoria dental**.
Ningún servicio se publica sin que el cliente confirme que la clínica lo presta.

Disposición: 1 columna en móvil, 2 en tablet, 3 en escritorio.

### 4.4 Sobre el doctor

Fotografía en formato retrato junto a un bloque de texto con el nombre completo del doctor, su cédula profesional, su formación y una nota breve sobre su trayectoria. En móvil la foto va arriba y el texto debajo. Es la sección de mayor peso en la construcción de confianza, y por eso va antes que la galería.

### 4.5 Galería del consultorio

Rejilla de 6 fotografías reales del consultorio: 2 columnas en móvil, 3 en escritorio. Sin lightbox ni ampliación. Todas las imágenes con `loading="lazy"` y texto alternativo descriptivo.

### 4.6 Reseñas

Tres tarjetas con reseñas reales de pacientes, cada una con nombre, calificación en estrellas y el texto de la reseña, más un enlace secundario «Ver todas en Google».

Las reseñas se escriben directamente en el HTML; no se embebe ningún widget. **Si el cliente no aporta reseñas reales, la sección completa se elimina del HTML.** Bajo ninguna circunstancia se redactan testimonios ficticios: en un servicio de salud eso es un problema legal y de confianza, no un recurso de diseño.

### 4.7 Footer

- Imagen estática del mapa centrada en `19.7975627, -99.8719214`, que al pulsarse abre Google Maps con la ubicación de la clínica.
- Dirección completa en texto.
- Horario completo, día por día.
- Teléfono y enlace a WhatsApp.
- Aviso de derechos y año.

### 4.8 Elementos fijos de contacto

- **Móvil:** barra inferior fija con dos botones de igual peso, «Llamar» y «WhatsApp». Esta barra sustituye al botón flotante en móvil; no se muestran ambos, porque dos accesos simultáneos a WhatsApp compiten entre sí y ensucian la pantalla pequeña.
- **Escritorio:** botón flotante de WhatsApp en la esquina inferior derecha.

**Enlace de WhatsApp** en todos los casos:

```
https://wa.me/52XXXXXXXXXX?text=Buen%20d%C3%ADa%2C%20me%20gustar%C3%ADa%20agendar%20una%20cita
```

El mismo texto prellenado en todos los botones. No es instrumentación: solo le ahorra al paciente redactar el primer mensaje en el momento exacto en que decide contactar.

---

## 5. Sistema de diseño

### 5.1 Tokens de color

Los colores actuales son un punto de partida y **se espera que cambien** cuando el cliente entregue su logo definitivo. Por eso ningún color puede aparecer escrito directamente en una regla CSS: todos se declaran una sola vez en `:root`.

| Token | Valor | Uso |
|---|---|---|
| `--color-fondo` | `#F5EFE6` | Fondo general (beige) |
| `--color-superficie` | `#FFFFFF` | Tarjetas y bloques elevados |
| `--color-texto` | `#2C2C2C` | Texto principal |
| `--color-texto-suave` | `#5A5A5A` | Texto secundario |
| `--color-acento` | `#0F6E6E` | Botones, enlaces, íconos |
| `--color-acento-oscuro` | `#0B5252` | Estado hover/active del acento |
| `--color-whatsapp` | `#25D366` | Exclusivo de los botones de WhatsApp |
| `--color-overlay` | `rgba(0,0,0,.45)` | Capa oscura del hero |

El verde azulado del acento se eligió porque contrasta con el beige sin competir con él y por su asociación con salud e higiene. El verde de WhatsApp se mantiene tal cual porque el usuario lo reconoce como marca.

### 5.2 Tipografía

| Token | Valor |
|---|---|
| `--fuente-titulos` | `'Poppins', system-ui, sans-serif` |
| `--fuente-texto` | `'Inter', system-ui, sans-serif` |

Se cargan desde Google Fonts únicamente los pesos necesarios (Poppins 600/700, Inter 400/500), con `preconnect` y `display=swap`. Si en la fase de pulido el coste de red no lo justifica, se sustituyen por la pila del sistema; la decisión quedaría registrada en la sección 11.

### 5.3 Escala y espaciado

- Escala tipográfica fluida con `clamp()`, base de 16 px en móvil.
- Espaciado en múltiplos de 8 px, expuesto como `--espacio-1` … `--espacio-8`.
- Radio de esquinas: `--radio: 12px`. Sombra única suave: `--sombra`.

### 5.4 Puntos de quiebre

| Nombre | Ancho | Notas |
|---|---|---|
| Base | 360 px | Diseño de referencia. Todo debe funcionar aquí. |
| Tablet | 768 px | 2 columnas |
| Escritorio | 1024 px | 3 columnas, navegación por anclas, botón flotante |

---

## 6. Decisiones técnicas

| ID | Decisión | Justificación |
|---|---|---|
| D-01 | HTML, CSS y JavaScript sin frameworks | Una sola página con slider y galería no necesita build; carga más rápido en 4G y puede alojarse en cualquier sitio. |
| D-02 | Mobile-first | La mayoría de los pacientes llegan desde el teléfono. |
| D-03 | Slider escrito a mano | Una librería añadiría más peso que el propio código necesario. |
| D-04 | Sin formulario de contacto | Exigiría backend o servicio externo; el paciente local prefiere WhatsApp. |
| D-05 | Reseñas estáticas, no widget de Google | Evita script de terceros, permite estilizarlas y no depende de un servicio externo. |
| D-06 | Sin analítica | Decisión del cliente. Elimina además la necesidad de banner de cookies. |
| D-07 | Mapa como imagen estática enlazada | El iframe de Google Maps carga cerca de 1 MB de scripts y cookies; la imagen conserva la señal visual y el paciente termina igualmente en su app de mapas. |
| D-08 | Sin menú hamburguesa en móvil | Añade JS y un estado abierto/cerrado justo en el dispositivo mayoritario, a cambio de poca utilidad en una sola página. |
| D-09 | Barra fija inferior en móvil en lugar de botón flotante | Un solo acceso a WhatsApp por pantalla; la barra además incluye «Llamar», que el público mayor prefiere. |
| D-10 | Datos del negocio centralizados | Cambiar teléfono, horario o dirección debe ser editar un bloque, no rastrear el archivo. |
| D-11 | Colores y tipografía como tokens CSS | Se anticipa un cambio de marca cuando llegue el logo definitivo. |
| D-12 | Despliegue en Netlify o Cloudflare Pages | HTTPS y dominio propio sin configuración; el dominio se apunta cuando exista. |
| D-13 | Sin horario dinámico «Abierto ahora» | Requiere manejo de la zona horaria `America/Mexico_City` y falla en días festivos, que en México son numerosos. |

---

## 7. Estructura de archivos y convención de nombres

```
DENTISTALANDING/
├── index.html
├── css/
│   └── estilos.css
├── js/
│   └── principal.js
├── assets/
│   ├── img/
│   │   ├── logo.svg
│   │   ├── hero-1.webp
│   │   ├── hero-2.webp
│   │   ├── hero-3.webp
│   │   ├── doctor.webp
│   │   ├── galeria-1.webp … galeria-6.webp
│   │   └── mapa-estatico.webp
│   └── og-image.jpg
├── favicon.ico
└── Spec-Driven-Development.md
```

### 7.1 Especificación de imágenes

El cliente enviará las fotografías por WhatsApp con nombres tipo `IMG-20240912-WA0007.jpg` y varios megabytes cada una. Antes de integrarlas deben renombrarse y optimizarse según esta tabla. Respetar las proporciones es lo que evita que el diseño se rompa al sustituir los marcadores por las fotos reales.

| Archivo | Dimensiones | Proporción | Peso máx. | Formato |
|---|---|---|---|---|
| `logo.svg` | vectorial (o PNG 400×400) | 1:1 | 30 KB | SVG preferido, fondo transparente |
| `hero-1/2/3.webp` | 1920×1080 | 16:9 | 250 KB | WebP con respaldo JPG |
| `doctor.webp` | 800×1000 | 4:5 | 150 KB | WebP con respaldo JPG |
| `galeria-1…6.webp` | 800×600 | 4:3 | 120 KB | WebP con respaldo JPG |
| `mapa-estatico.webp` | 800×400 | 2:1 | 100 KB | WebP |
| `og-image.jpg` | 1200×630 | 1.91:1 | 200 KB | JPG (WhatsApp y redes) |

Durante el desarrollo, cada hueco se ocupa con un marcador gris de las dimensiones exactas indicadas, de forma que la maquetación quede validada antes de que lleguen las fotos reales.

---

## 8. Datos pendientes del cliente

Ninguno de estos datos puede inventarse. Hasta que lleguen se usan los valores de prueba indicados, todos concentrados en el bloque de constantes de `js/principal.js`.

| Dato | Valor de prueba | Formato requerido | Dónde se usa |
|---|---|---|---|
| Horario completo | Lun–Vie 9:00–19:00 · Sáb 9:00–14:00 · Dom cerrado | Por día | Hero (resumen) y footer (completo) |
| Fotos del hero (3) | Marcadores grises 1920×1080 | Ver sección 7.1 | Hero |
| Foto del doctor | Marcador gris 800×1000 | Ver sección 7.1 | Sobre el doctor |
| Fotos de galería (6) | Marcadores grises 800×600 | Ver sección 7.1 | Galería |
| Cédula profesional y formación | El Dr. Héctor Manuel Rojas Pérez es un profesional de la salud bucodental egresado de la Universidad Autónoma del Estado de México (UAEMex), donde obtuvo el título de Licenciatura como Cirujano Dentista. Cuenta con cédula profesional federal número 3578688, avalada por la Secretaría de Educación Pública (SEP) desde el año 2002.   Con más de dos décadas de trayectoria y una amplia experiencia en la atención clínica, atiende en su consultorio propio, donde siempre se ha distinguido por brindar un trato profundamente humano, empático y cercano a cada uno de sus pacientes. Su compromiso se centra en generar un ambiente de confianza, cuidado y bienestar, ofreciendo tratamientos odontológicos personalizados con los más altos estándares profesionales.  | Texto | Sobre el doctor |
| Confirmación de servicios | 12 confirmados | Sí/No por servicio | Servicios |
| Dominio | Subdominio provisional de Netlify | Dominio propio | Despliegue, canonical, Open Graph |

Datos ya confirmados, que **no** son pendientes: nombre de la clínica, nombre del doctor, ciudad y coordenadas de la ubicación, teléfono (`+52 712 139 0384`), número de WhatsApp (`527121390384`), dirección (`Calle Rafael Favila 14A, Colonia El Calvario, C.P. 50450, Atlacomulco, Estado de México`) y logo (el cliente no cuenta con uno propio; se conserva el marcador con iniciales «HR» como logo definitivo, porque ya combina con la paleta del sitio).

**Reseñas:** 4 reseñas reales de 5 estrellas en la ficha de Google Maps del negocio. Se publican 3.

---

## 9. Plan de tareas

Cuatro hitos. Cada tarea es verificable de forma independiente; los criterios se comprueban en un dispositivo móvil real o en emulación a 360 px, no solo en el escritorio de quien desarrolla.

### Hito 1 — Base y sistema de diseño

- [ ] **T-01 · Estructura del proyecto.** Crear el árbol de archivos de la sección 7.
  *Criterio:* `index.html` abre en el navegador sin errores en consola y enlaza CSS y JS.
- [ ] **T-02 · Tokens CSS.** Declarar en `:root` todos los tokens de la sección 5.
  *Criterio:* ninguna regla CSS del proyecto contiene un color escrito literalmente; cambiar `--color-acento` cambia todos los botones a la vez.
- [ ] **T-03 · Reinicio y tipografía base.** Normalización mínima, escala fluida con `clamp()`, carga de Poppins e Inter con `preconnect` y `display=swap`.
  *Criterio:* el texto no baja de 16 px en móvil y no hay salto de fuente visible al cargar.
- [ ] **T-04 · Bloque de constantes del negocio.** Objeto único en `js/principal.js` con teléfono, WhatsApp, horario, dirección y coordenadas, inyectado en el HTML al cargar.
  *Criterio:* cambiar el teléfono en un solo lugar lo actualiza en header, hero, barra fija y footer simultáneamente.
- [ ] **T-05 · Marcadores de imagen.** Generar los marcadores grises con las dimensiones exactas de la sección 7.1.
  *Criterio:* todos los huecos de imagen respetan su proporción y no producen desplazamiento de contenido al cargar (`width` y `height` declarados).

### Hito 2 — Estructura y contenido

- [ ] **T-06 · Header.** Versión móvil (logo + «Llamar») y versión escritorio (logo + anclas + teléfono, fija al hacer scroll).
  *Criterio:* a 360 px no hay menú hamburguesa y el botón «Llamar» abre el marcador; a 1024 px las anclas desplazan a la sección correcta sin que el header fijo la tape.
- [ ] **T-07 · Maquetación del hero.** Los seis elementos en el orden de la sección 4.2, sobre la capa oscura.
  *Criterio:* a 360 px el eslogan y el botón «Agende su cita» son visibles sin hacer scroll; el contraste del texto sobre la capa oscura supera 4.5:1 con cualquiera de las tres fotos.
- [ ] **T-08 · Sección de servicios.** Rejilla flexible con seis tarjetas e íconos SVG en línea.
  *Criterio:* eliminando tres tarjetas del HTML la rejilla sigue centrada y sin huecos; 1/2/3 columnas según el punto de quiebre.
- [ ] **T-09 · Sección «Sobre el doctor».** Foto en 4:5 y bloque de credenciales.
  *Criterio:* en móvil la foto va arriba y el texto debajo; en escritorio van lado a lado sin deformar la foto.
- [ ] **T-10 · Galería.** Rejilla de 6 imágenes, 2 columnas en móvil y 3 en escritorio, con `loading="lazy"`.
  *Criterio:* las imágenes bajo el pliegue no se solicitan hasta acercarse al viewport.
- [ ] **T-11 · Sección de reseñas.** Tres tarjetas estáticas más el enlace a Google.
  *Criterio:* eliminando el bloque completo del HTML el resto de la página no se descuadra ni deja separaciones dobles.
- [ ] **T-12 · Footer.** Mapa estático enlazado, dirección, horario completo, teléfono y WhatsApp.
  *Criterio:* pulsar el mapa abre Google Maps en las coordenadas de la clínica; el horario coincide exactamente con el resumen del hero.
- [ ] **T-13 · Barra fija inferior en móvil.** Dos botones de igual peso, «Llamar» y «WhatsApp».
  *Criterio:* visible en todo momento a 360 px, sin tapar el contenido del final de la página (relleno inferior equivalente en el `body`).
- [ ] **T-14 · Botón flotante de WhatsApp en escritorio.**
  *Criterio:* visible a partir de 1024 px y **ausente** por debajo, para no duplicar la barra fija.

### Hito 3 — Comportamiento

- [ ] **T-15 · Slider del hero.** Fundido cada 6 s entre 3 imágenes, con puntos indicadores.
  *Criterio:* el fundido no produce parpadeo ni desplazamiento; los puntos indican la imagen activa y permiten saltar a otra.
- [ ] **T-16 · Pausa y accesibilidad del slider.** Pausa al pasar el cursor; desactivación total con `prefers-reduced-motion` o con una sola imagen.
  *Criterio:* activando la reducción de movimiento en el sistema operativo, la rotación no ocurre y queda una imagen fija.
- [ ] **T-17 · Enlaces de contacto.** Todos los `tel:` y todos los `wa.me` con el texto prellenado.
  *Criterio:* cada botón de WhatsApp abre la conversación con «Buen día, me gustaría agendar una cita» ya escrito; en escritorio abre WhatsApp Web.
- [ ] **T-18 · Desplazamiento suave de las anclas.**
  *Criterio:* funciona por teclado además de por ratón, y se anula bajo `prefers-reduced-motion`.

### Hito 4 — Pulido y despliegue

- [ ] **T-19 · Accesibilidad.** Texto alternativo en todas las imágenes, foco visible, áreas pulsables de al menos 44×44 px, orden de tabulación correcto.
  *Criterio:* la página completa se recorre con teclado y todo elemento enfocado se distingue.
- [ ] **T-20 · SEO base y compartición.** Etiquetas `title` y `meta description`, Open Graph y Twitter Card, JSON-LD de tipo `Dentist`, `lang="es-MX"`, canonical y favicon.
  *Criterio:* al pegar el enlace en WhatsApp aparece la tarjeta con logo, nombre y descripción; el JSON-LD valida sin errores en la herramienta de resultados enriquecidos de Google.
- [ ] **T-21 · Rendimiento.** Compresión de imágenes al peso máximo indicado, precarga de la primera imagen del hero, diferido del resto.
  *Criterio:* el peso total de la página es inferior a 1,5 MB y no hay desplazamiento de contenido durante la carga.
- [ ] **T-22 · Despliegue.** Publicación en Netlify o Cloudflare Pages con HTTPS.
  *Criterio:* la URL pública carga la página completa desde un teléfono con datos móviles.
- [ ] **T-23 · Revisión final con datos reales.** Sustituir los marcadores por los datos y fotos del cliente conforme lleguen.
  *Criterio:* no queda ningún valor de prueba de la sección 8 en la página publicada.

---

## 10. Criterios de aceptación globales

Se aplican a toda la página, no a una tarea concreta.

### 10.1 Rendimiento
- Contenido principal visible en menos de 2,5 s sobre 4G.
- Peso total de la página inferior a 1,5 MB(opcional).
- Sin desplazamiento de contenido durante la carga.

### 10.2 Responsive
- Todo el contenido es usable a 360 px de ancho sin desplazamiento horizontal.
- Sin texto por debajo de 16 px.
- Verificado en móvil, tablet y escritorio.

### 10.3 Accesibilidad
- Contraste mínimo de 4.5:1 en todo el texto, incluido el del hero sobre la capa oscura.
- Navegación completa por teclado con foco visible.
- Texto alternativo descriptivo en todas las imágenes.
- Movimiento anulado bajo `prefers-reduced-motion`.

### 10.4 SEO base y compartición
- `title` con el nombre de la clínica y «Atlacomulco».
- `meta description` de 150–160 caracteres.
- Open Graph y Twitter Card con `og-image.jpg`, para que el enlace compartido por WhatsApp se vea correctamente.
- Datos estructurados JSON-LD de tipo `Dentist` con nombre, dirección, teléfono, coordenadas y horario.
- Un único `<h1>` en la página y jerarquía de encabezados coherente.

### 10.5 Mantenibilidad
- Cambiar el teléfono, el horario o la dirección se hace en un único bloque.
- Cambiar la marca completa se hace editando los tokens de `:root`.

---

## 11. Registro de decisiones

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-09-08 | Se añaden «Sobre el doctor» y «Reseñas» al alcance original | En una clínica dental la confianza la genera quién atiende y qué dicen otros pacientes, más que las fotos del local. |
| 2026-09-08 | Se descartan FAQ y precios | Decisión del cliente: los precios los trata directamente con cada paciente. |
| 2026-09-08 | Se descarta la analítica y con ella la métrica cuantitativa | Decisión del cliente. El objetivo del proyecto se reformula en términos cualitativos para no prometer algo que nadie va a comprobar. |
| 2026-09-08 | Mapa como imagen estática en lugar de iframe | Rendimiento en 4G y evitar cookies de terceros. |
| 2026-09-08 | Sin hamburguesa en móvil; anclas solo en escritorio | Menos JS en el dispositivo mayoritario, a cambio de una utilidad marginal en una página única. |
| 2026-09-08 | En móvil, barra fija inferior en lugar de botón flotante | Evita dos accesos simultáneos a WhatsApp compitiendo en la misma pantalla, e incorpora «Llamar» para el público que prefiere el teléfono. |
| 2026-09-08 | El `<h1>` lleva nombre y ciudad; el eslogan domina visualmente | La jerarquía semántica sirve al buscador y a la compartición; la visual, al paciente. |
| 2026-09-08 | Horario resumido en una línea en el hero | Permite decidir si llamar ahora sin restarle peso al botón principal. |
| 2026-09-08 | Colores definidos como tokens desde el inicio | El cliente anticipa un cambio de paleta cuando entregue el logo definitivo. |

---

## Anexo A — Brief original del cliente

Se conserva textualmente lo recibido en la fase de recolección de requisitos. Todo lo anterior es interpretación; esto es lo que se pidió.

> **Requirement Gathering**
> El cliente quiere que los pacientes potenciales conozcan sus servicios (limpieza, ortodoncia, blanqueamiento), vean fotos del consultorio para generar confianza, y puedan agendar una cita fácilmente por WhatsApp o llamada. También menciona que compite con otra clínica de la zona que se ve muy profesional.
>
> **Specification Drafting**
> La landing tendrá: Hero con nombre de la clínica y botón "Agenda tu cita" y el número de teléfono visible desde el inicio todo esto encima de un Fade Slider con imagenes, mas abajo una sección de Servicios (con íconos), galería del consultorio, y un footer con mapa de ubicación y horarios. será responsive (mobile-first, porque la mayoría buscará desde el celular), con un botón flotante de WhatsApp, y que usarás HTML/CSS/JS simple (sin necesidad de un framework pesado para una sola página).
