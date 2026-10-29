# Contrato — Hero estático (DOM, atributos, propiedades CSS, herramientas)

Extiende `specs/001-dentadura-3d-hero/contracts/hero-dentadura.md`. Lo no mencionado aquí no cambia.

## 1. DOM del hero

```html
<section class="hero" id="inicio" aria-label="Presentación de la clínica">
  <div class="hero__escenario">                       <!-- fondo (imagen); sin anclaje -->
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

    <!-- D-22 · Dientes: capas con alfa, hermana de la figura y SIN multiply (blancos y opacos como en el 3D). Misma
         estructura: .hero__poster-caja > picture.hero__abierto (sources …-dientes.webp, mismo data-media) + img.hero__poster
         (craneo-cerrado-dientes.webp). .hero__abierto img[data-real] ×2 → data-abierto-listo; error de cualquiera → data-abierto-fallo -->
    <div class="hero__dientes" aria-hidden="true">…</div>

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
| `data-hero` | script del `<head>` (y `principal.js` al degradar) | `animado` · `estatico` (los dos modos; los dos usan el bloqueo de introducción) |
| `data-abierto-listo` | `onload` del `<img>` del cráneo abierto | presente cuando la imagen real del cráneo abierto ya cargó; hasta entonces el póster cerrado no desaparece |
| `data-abierto-fallo` | `principal.js` (evento `error` del `<img>` real) | la imagen abierta falló: el hero queda con el póster cerrado y el eslogan y el botón siempre visibles |
| `data-bloqueo` | `principal.js` | bloqueo de introducción activo (los dos modos) |

## 3. Propiedades CSS

| Propiedad | Dónde | Quién | Uso |
|---|---|---|---|
| `--apertura` | `.hero` | `principal.js` (bloqueo de introducción); `0` con `html[data-hero]`, `1` sin JS | gobierna `t`, revelado y fundido |
| `--t` | `.hero` | CSS (`smoothstep(clamp(var(--apertura) / .7))`) | fundido póster/abierto, traslación, (3D) mandíbula |
| `--listo` | `html` | CSS: `0` por defecto, `1` con `html[data-abierto-listo]` | el póster solo se oculta cuando `--listo` es `1` |
| `--abierto-izq/-arr/-ancho/-alto`, `--despl-x/-y` | `.hero__poster-caja` | constantes de CSS, una por variante (salida de la herramienta; `< 1024 px` y `≥ 1024 px`) | recuadro de la imagen abierta, en % del rectángulo del póster, y traslación compensatoria |

Valor por defecto de `--apertura` en CSS: `0` con `html[data-hero]` (para que el primer pintado ya sea el cráneo cerrado, sin parpadeo del eslogan; también en móvil apaisado bajo no, donde vale `1`) y `1` sin JS (composición final). `principal.js` lo sobrescribe en línea sobre `.hero` con el progreso del bloqueo.

## 4. Reglas de composición (CSS)

1. **Disposición única**: `html[data-hero="animado"]` deja de condicionar la rejilla; la figura es `height: auto`, el escenario mide `calc(100svh − barra − encabezado)` y `.hero__revelado` se superpone a la figura (`grid-row: 2`), como en el 3D. La disposición antigua (altura `min(56svh, 32rem)` y eslogan debajo) se elimina.
2. **Fundido**: `.hero__poster { opacity: calc(1 − var(--t) * var(--listo)); transform: translate(calc(var(--despl-x) * var(--t)), calc(var(--despl-y) * var(--t))); }` y `.hero__abierto { opacity: var(--t); transform: translate(calc(var(--despl-x) * (var(--t) − 1)), calc(var(--despl-y) * (var(--t) − 1))); }`. Solo `opacity` y `transform`. El póster conserva su `transition: opacity` para que el relevo sea suave.
3. **Sin anclaje**: el hero no usa `position: sticky` ni espaciador de recorrido; la presentación la gobierna el bloqueo de introducción (los eventos de rueda, toque y teclado no desplazan la página mientras está activo).
4. **Móvil apaisado bajo** (`(orientation: landscape) and (max-height: 500px)`): `html[data-hero] .hero { --apertura: 1 }`, sin bloqueo (lo libera `principal.js`); página normal.
5. **Movimiento reducido**: `@media (prefers-reduced-motion: reduce)` solo quita las `transition` del canvas y del relevo al 3D; **no** cambia el modo ni el bloqueo de introducción (decisiones D-20 y D-21).
6. **Con 3D listo** (`.hero__figura.is-3d`): póster e imagen abierta con `opacity: 0` (como hoy el póster).
7. **Fondo**: `.hero__escenario` con `background-color: var(--color-velo-fondo)` y `background-image` por `@media (orientation: …)`; `background-size: cover; background-position: center`. Se eliminan los degradados de velos del CSS actual.
8. **Contacto**: `.hero__contacto` sigue con `z-index` por encima de la figura y de la imagen abierta; la barra fija y el botón flotante conservan su `position: fixed`.
9. **Fallo de la imagen abierta**: con `html[data-abierto-fallo]`, `.hero__revelado` fuerza `--rev-eslogan: 1` y `--rev-boton: 1`, el botón es pulsable y el póster no se oculta (`--listo` se queda en `0`).

## 5. `js/principal.js`

Función nueva (en el mismo IIFE, ≈ 40 líneas); el modo de imágenes reutiliza `publicarApertura`:

| Función | Responsabilidad |
|---|---|
| `publicarApertura(hero)` (existente) | Bloqueo de introducción: se activa en los **dos** modos de `iniciarDentadura`; ya no se libera cuando el 3D pasa a `estatico` (el progreso continúa). Escribe `--apertura`, `data-revelado`, el evento `dentadura:apertura` y `data-bloqueo`; el clic sobre el cráneo (abrir/cerrar) funciona en los dos modos. |
| `habilitarImagenAbierta(hero, motivo)` | Recorre los `<source>` de `.hero__abierto` y hace `s.media = s.dataset.media`; el navegador elige y pide la imagen real (y la reelige al cruzar 1024 px). Motivos: `carga` (tras `load` + inactividad; con ahorro de datos equivale a `apertura`), `apertura` (solo cuando la apertura pasa de 0 y el 3D no está listo) e `inmediato` (el 3D falla o se descarta). También escucha `error` del `<img>` y, si ocurre con una imagen real, marca `data-abierto-fallo`. |

Cambios en lo existente:

- `publicarApertura` (bloqueo): sin cambios de lógica; solo se quita la liberación al pasar a `estatico` y la condición que lo limitaba al modo `animado`.
- `iniciarDentadura`: en el modo de imágenes llama a `publicarApertura` y a `habilitarImagenAbierta(hero, "carga")`; al degradar el 3D (evento `dentadura:estado`, error al importar el módulo o «reducir movimiento» en vivo) llama a `habilitarImagenAbierta(hero, "inmediato")` sin tocar el bloqueo. Mientras la imagen abierta no esté lista se ve el póster cerrado.
- Con `?captura` en la URL (solo desarrollo, ≈ 8 líneas): no registra el bloqueo, no espera el retraso de carga, llama a `iniciar({ …, captura: true })` y expone el resultado en `window.__craneo`. Sin el parámetro no cambia nada.
- El script del `<head>` solo decide `data-hero` (`animado` | `estatico`).

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
