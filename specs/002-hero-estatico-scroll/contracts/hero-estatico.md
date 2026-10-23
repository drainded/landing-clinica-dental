# Contrato — Hero estático (DOM, atributos, propiedades CSS, herramientas)

Extiende `specs/001-dentadura-3d-hero/contracts/hero-dentadura.md`. Lo no mencionado aquí no cambia.

## 1. DOM del hero

```html
<section class="hero" id="inicio" aria-label="Presentación de la clínica">
  <div class="hero__escenario">                       <!-- fondo (imagen) + sticky en modo transición -->
    <div class="hero__cabecera">…logo + <h1>…</div>   <!-- sin cambios -->

    <div class="hero__figura">                        <!-- escala de arranque y multiply: sin cambios; container-type: size -->
     <div class="hero__poster-caja">                  <!-- NUEVO · rectángulo del póster (contain, 524:564) -->
      <picture class="hero__abierto" aria-hidden="true">          <!-- NUEVO · debajo del póster -->
        <source srcset="assets/img/craneo-abierto-escritorio.webp"
                media="not all" data-media="(min-width: 1024px)">
        <source srcset="assets/img/craneo-abierto-movil.webp"
                media="not all" data-media="all">
        <img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
             alt="" width="…" height="…" decoding="async" fetchpriority="high"
             onload="if(this.currentSrc.slice(0,5)!=='data:')document.documentElement.setAttribute('data-abierto-listo','')">
      </picture>
      <img class="hero__poster" src="assets/img/craneo-cerrado.webp" alt="" width="…" height="…" fetchpriority="high">
     </div>
    </div>

    <div class="hero__revelado">…eslogan + «Conoce nuestros servicios»…</div>  <!-- sin cambios de contenido -->
    <div class="hero__contacto">…</div>                                      <!-- sin cambios -->
  </div>
</section>
```

Reglas:

- **Rectángulo del póster**: `.hero__figura` es contenedor (`container-type: size`) y `.hero__poster-caja` mide `width: min(100cqw, calc(100cqh * 524 / 564)); aspect-ratio: 524 / 564`, centrado (`position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%)`). Es el mismo rectángulo `contain` que usa `js/dentadura.js` para calibrar la cámara, de modo que el póster, el cráneo abierto y el 3D comparten referencia. El póster ocupa el 100 % de la caja; el cráneo abierto se coloca con `left/top/width/height` en % de la caja. Con `container-type: size` la figura no aporta tamaño intrínseco: en móvil apaisado bajo (`height: auto`) se le da `aspect-ratio: 524 / 564`.
- La imagen abierta y el póster son decorativos; no hay texto horneado en ninguna imagen; el orden de tabulación no cambia (la figura lleva `role="button"` solo en modo 3D).
- **Carga del cráneo abierto**: solo se ve el GIF de 1×1 (sin petición) hasta que `habilitarImagenAbierta` cambia el `media` de los `<source>` (ver §5). No hay `loading="lazy"` ni `display: none`. Todos los modos usan este mismo mecanismo (no hay un camino distinto para «reducir movimiento»).
- El `onload` del `<img>` es el único sitio que marca `data-abierto-listo`, y solo cuando `currentSrc` no es el GIF.

## 2. Atributos en `<html>`

| Atributo | Quién lo escribe | Valores / significado |
|---|---|---|
| `data-hero` | script del `<head>` (y `principal.js` al degradar) | `animado` · `estatico` (existente) |
| `data-transicion` | script del `<head>`; `principal.js` lo añade (3D que falla) o lo quita (móvil apaisado bajo) | presente en todo el modo `estatico`, **también con movimiento reducido**: activa recorrido anclado y progreso por scroll |
| `data-abierto-listo` | `onload` del `<img>` del cráneo abierto | presente cuando la imagen real del cráneo abierto ya cargó; hasta entonces el póster cerrado no desaparece |
| `data-abierto-fallo` | `principal.js` (evento `error` del `<img>` real) | la imagen abierta falló: el hero queda con el póster cerrado y el eslogan y el botón siempre visibles |
| `data-bloqueo` | `principal.js` | existente (bloqueo de introducción del 3D) |

## 3. Propiedades CSS

| Propiedad | Dónde | Quién | Uso |
|---|---|---|---|
| `--apertura` | `.hero` | `principal.js` (bloqueo o scroll); `1` por defecto en CSS | gobierna `t`, revelado y fundido |
| `--t` | `.hero` | CSS (`smoothstep(clamp(var(--apertura) / .7))`) | fundido póster/abierto, traslación, (3D) mandíbula |
| `--listo` | `html` | CSS: `0` por defecto, `1` con `html[data-abierto-listo]` | el póster solo se oculta cuando `--listo` es `1` |
| `--abierto-izq/-arr/-ancho/-alto`, `--despl-x/-y` | `.hero__poster-caja` | constantes de CSS, una por variante (salida de la herramienta; `< 1024 px` y `≥ 1024 px`) | recuadro de la imagen abierta, en % del rectángulo del póster, y traslación compensatoria |
| `--recorrido` | `.hero` | CSS (por defecto `80svh`; admitido 60–100 svh) | altura extra del hero en modo transición (`D`) |

Valor por defecto de `--apertura` en CSS: `0` con `html[data-hero="animado"]` o `html[data-transicion]` (para que el primer pintado ya sea el cráneo cerrado, sin parpadeo del eslogan) y `1` en el resto (composición final: móvil apaisado bajo y sin JS). `principal.js` lo sobrescribe en línea sobre `.hero` cuando hay una fuente activa.

## 4. Reglas de composición (CSS)

1. **Disposición única**: `html[data-hero="animado"]` deja de condicionar la rejilla; la figura es `height: auto`, el escenario mide `calc(100svh − barra − encabezado)` y `.hero__revelado` se superpone a la figura (`grid-row: 2`), como en el 3D. La disposición antigua (altura `min(56svh, 32rem)` y eslogan debajo) se elimina.
2. **Fundido**: `.hero__poster { opacity: calc(1 − var(--t) * var(--listo)); transform: translate(calc(var(--despl-x) * var(--t)), calc(var(--despl-y) * var(--t))); }` y `.hero__abierto { opacity: var(--t); transform: translate(calc(var(--despl-x) * (var(--t) − 1)), calc(var(--despl-y) * (var(--t) − 1))); }`. Solo `opacity` y `transform`. El póster conserva su `transition: opacity` para que el relevo sea suave.
3. **Anclaje**: `html[data-transicion] .hero::after { content: ""; display: block; height: var(--recorrido); }` (espaciador dentro del hero: `sticky` solo se mueve dentro del contenido de su padre, no del padding) y `html[data-transicion] .hero__escenario { position: sticky; top: 0; }` (`top: var(--alto-header)` desde 1024 px).
4. **Móvil apaisado bajo** (`(orientation: landscape) and (max-height: 500px)`): sin anclaje ni recorrido; `--apertura: 1`.
5. **Movimiento reducido**: `@media (prefers-reduced-motion: reduce)` solo quita las `transition` del canvas y del relevo al 3D; **no** cambia el modo ni la transición por scroll (decisión D-20).
6. **Con 3D listo** (`.hero__figura.is-3d`): póster e imagen abierta con `opacity: 0` (como hoy el póster).
7. **Fondo**: `.hero__escenario` con `background-color: var(--color-velo-fondo)` y `background-image` por `@media (orientation: …)`; `background-size: cover; background-position: center`. Se eliminan los degradados de velos del CSS actual.
8. **Contacto**: `.hero__contacto` sigue con `z-index` por encima de la figura y de la imagen abierta; la barra fija y el botón flotante conservan su `position: fixed`.
9. **Fallo de la imagen abierta**: con `html[data-abierto-fallo]`, `.hero__revelado` fuerza `--rev-eslogan: 1` y `--rev-boton: 1`, el botón es pulsable y el póster no se oculta (`--listo` se queda en `0`).

## 5. `js/principal.js`

Funciones nuevas (en el mismo IIFE, ≈ 70 líneas):

| Función | Responsabilidad |
|---|---|
| `controlarTransicionScroll(hero)` | Si `data-transicion`: calcula `apertura` desde el scroll (ver data-model §3), suaviza con rAF, escribe `--apertura` y `data-revelado` (histéresis existente), pausa fuera de pantalla; Devuelve la función que la desactiva. `activarModoImagenes(motivo)` (llamada al cargar con `estatico` y cuando el 3D falla o se activa «reducir movimiento» con el 3D mostrado) añade `data-transicion`, arranca este control y habilita la imagen abierta; en móvil apaisado bajo (y si se rota a esa posición) pasa a la composición final. |
| `habilitarImagenAbierta(hero, motivo)` | Recorre los `<source>` de `.hero__abierto` y hace `s.media = s.dataset.media`; el navegador elige y pide la imagen real (y la reelige al cruzar 1024 px). Cuándo: tras `load` + inactividad; con ahorro de datos, en el primer `scroll`; en modo 3D, solo si `--apertura > 0` y aún no hay `is-3d`; al degradar el 3D, de inmediato. También escucha `error` del `<img>` y, si ocurre con una imagen real, marca `data-abierto-fallo`. |

Cambios en lo existente:

- `publicarApertura` (bloqueo) sigue igual.
- `iniciarDentadura` al degradar el 3D: escribe `--apertura: 1`, llama a `habilitarImagenAbierta` de inmediato y **no** añade `data-transicion` ni recorrido. Mientras la imagen abierta no esté lista se ve el póster cerrado (puede haber un cambio breve de pose; aceptado).
- Con `?captura` en la URL (solo desarrollo, ≈ 8 líneas): no registra el bloqueo, no espera el retraso de carga, llama a `iniciar({ …, captura: true })` y expone el resultado en `window.__craneo`. Sin el parámetro no cambia nada.
- El script del `<head>` añade `data-transicion` según R1 (≈ +80 bytes).

## 6. `js/dentadura.js` — opción de captura (solo desarrollo)

`iniciar({ …, captura: true })`:

- No añade la malla de velos; limpia a blanco opaco; `preserveDrawingBuffer: true`; no inicia el bucle ni el pausado por visibilidad.
- Devuelve además `capturar(apertura: number)`, que renderiza ese cuadro y responde `{ imagen: <data URL PNG>, recuadro: {izq, arr, ancho, alto}, desplazamiento: {x, y}, posterPx: {x, y, w, h}, lienzoPx: {w, h}, dpr }`. `recuadro` y `desplazamiento` se dan en % del **rectángulo del póster** (el rectángulo `contain` de proporción fija que ocupa el póster dentro de la figura; la caja de la figura cambia de proporción con la ventana y no sirve de referencia); `posterPx`, `lienzoPx` y `dpr` permiten recortar el PNG sin ambigüedad.
- Como el cráneo acercado desborda el lienzo (por los lados en móvil; por arriba al abrir la boca), `capturar` agranda temporalmente el lienzo (misma escala de píxeles, cajas de texto desplazadas, difuminado calculado con la altura original) hasta contener el póster con un 3 % de margen y después lo restaura. El `recuadro` ya viene acotado a los píxeles renderizados.
- Con `captura` ausente o `false` el comportamiento es **idéntico** al actual (la verificación lo comprueba por diferencia de imagen).

## 7. Herramientas de desarrollo (no se publican)

Ubicación: `referencias/herramientas/` (la ruta `/referencias/*` responde 404 en producción).

| Archivo | Entrada → salida |
|---|---|
| `hero.mjs` | Un solo script de Node (sin dependencias; Chrome sin interfaz con CDP) con subcomandos y `--perfil normal \| movimiento-reducido \| equipo-lento \| ahorro-datos` (inyecta `deviceMemory = 1`, `navigator.connection.saveData = true` o emula `prefers-reduced-motion`). **`capturar`**: tamaño y fase 0/1 → PNG y JSON del §6 en `salida/`. **`cajas`**: tamaños de referencia → `salida/cajas-<ancho>x<alto>.json` con los rectángulos de cabecera, eslogan, botón, teléfono y horario. **`comparar`**: tamaños de referencia → desviación de silueta del cráneo (% del ancho de la figura) y de cajas entre hero estático y 3D. |
| `codificar-craneo.py` | PNG + JSON → recorte (`--recorte poster` para el cerrado, `recuadro` para el abierto) con `posterPx`/`lienzoPx` → reescalado con `--ancho-poster` (800 px por defecto: misma densidad para todas las imágenes) → WebP ≤ 60 KB; imprime las constantes de CSS. |
| `generar-fondo.py` | `fondo-hero-estatico.jpg` + paleta → `fondo-hero-pc.webp`, `fondo-hero-movil.webp`; con `--medir` lee los `cajas-*.json` e imprime el contraste por caja de texto. |

Todos se ejecutan a mano; ninguno se importa desde el sitio.
