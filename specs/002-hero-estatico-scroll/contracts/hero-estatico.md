# Contrato — Hero estático (DOM, atributos, propiedades CSS, herramienta de captura)

Extiende `specs/001-dentadura-3d-hero/contracts/hero-dentadura.md`. Lo no mencionado aquí no cambia.

## 1. DOM del hero

```html
<section class="hero" id="inicio" aria-label="Presentación de la clínica">
  <div class="hero__escenario">                       <!-- fondo (imagen) + sticky en modo transición -->
    <div class="hero__cabecera">…logo + <h1>…</div>   <!-- sin cambios -->

    <div class="hero__figura">                        <!-- escala de arranque y multiply: sin cambios -->
      <picture class="hero__abierto" aria-hidden="true">          <!-- NUEVO · debajo del póster -->
        <source media="(min-width: 1024px)" srcset="assets/img/craneo-abierto-escritorio.webp">
        <img src="assets/img/craneo-abierto-movil.webp" alt="" width="…" height="…" loading="lazy" decoding="async">
      </picture>
      <img class="hero__poster" src="assets/img/craneo-cerrado.webp" alt="" width="…" height="…" fetchpriority="high">
    </div>

    <div class="hero__revelado">…eslogan + «Conoce nuestros servicios»…</div>  <!-- sin cambios de contenido -->
    <div class="hero__contacto">…</div>                                      <!-- sin cambios -->
  </div>
</section>
```

Reglas: la imagen abierta y el póster son decorativos; no hay texto horneado en ninguna imagen; el orden de tabulación no cambia (figura con `role="button"` solo en modo 3D).

## 2. Atributos en `<html>`

| Atributo | Quién lo escribe | Valores / significado |
|---|---|---|
| `data-hero` | script del `<head>` (y `principal.js` al degradar) | `animado` · `estatico` (existente) |
| `data-transicion` | script del `<head>`; `principal.js` lo quita | presente solo si `data-hero="estatico"` y **no** hay movimiento reducido: activa recorrido anclado y progreso por scroll |
| `data-abierto` | `principal.js` | presente cuando la imagen del cráneo abierto puede pedirse/mostrarse (quita su `display: none`) |
| `data-bloqueo` | `principal.js` | existente (bloqueo de introducción del 3D) |

## 3. Propiedades CSS

| Propiedad | Dónde | Quién | Uso |
|---|---|---|---|
| `--apertura` | `.hero` | `principal.js` (bloqueo o scroll); `1` por defecto en CSS | gobierna `t`, revelado y fundido |
| `--t` | `.hero` | CSS (`smoothstep(clamp(var(--apertura) / .7))`) | fundido póster/abierto, traslación, (3D) mandíbula |
| `--abierto-izq/-arr/-ancho/-alto`, `--despl-x/-y` | `.hero__figura` | constantes de CSS (salida de la herramienta) | recuadro de la imagen abierta y traslación compensatoria |
| `--recorrido` | `.hero` | CSS (por defecto `80svh`) | altura extra del hero en modo transición (`D`) |

Valor por defecto de `--apertura` en CSS: `0` con `html[data-hero="animado"]` o `html[data-transicion]` (para que el primer pintado ya sea el cráneo cerrado, sin parpadeo del eslogan) y `1` en el resto (composición final: sin JS, movimiento reducido, móvil apaisado bajo). `principal.js` lo sobrescribe en línea sobre `.hero` cuando hay una fuente activa.

## 4. Reglas de composición (CSS)

1. **Disposición única**: `html[data-hero="animado"]` deja de condicionar la rejilla; la figura es `height: auto`, el escenario mide `calc(100svh − barra − encabezado)` y `.hero__revelado` se superpone a la figura (`grid-row: 2`), como en el 3D. La disposición antigua (altura `min(56svh, 32rem)` y eslogan debajo) se elimina.
2. **Fundido**: `.hero__poster { opacity: calc(1 − var(--t)); transform: translate(calc(var(--despl-x) * var(--t)), calc(var(--despl-y) * var(--t))); }` y `.hero__abierto { opacity: var(--t); transform: translate(calc(var(--despl-x) * (var(--t) − 1)), calc(var(--despl-y) * (var(--t) − 1))); }`. Solo `opacity` y `transform`.
3. **Anclaje**: `html[data-transicion] .hero { padding-bottom: var(--recorrido); }` y `html[data-transicion] .hero__escenario { position: sticky; top: 0; }` (`top: var(--alto-header)` desde 1024 px).
4. **Móvil apaisado bajo** (`(orientation: landscape) and (max-height: 500px)`): sin anclaje ni recorrido; `--apertura: 1`.
5. **Movimiento reducido**: `@media (prefers-reduced-motion: reduce)` → `--apertura: 1`, sin `transition` en el hero ni anclaje, imagen abierta visible.
6. **Con 3D listo** (`.hero__figura.is-3d`): póster e imagen abierta con `opacity: 0` (como hoy el póster).
7. **Fondo**: `.hero__escenario` con `background-color: var(--color-velo-fondo)` y `background-image` por `@media (orientation: …)`; `background-size: cover; background-position: center`. Se eliminan los degradados de velos del CSS actual.
8. **Contacto**: `.hero__contacto` sigue con `z-index` por encima de la figura y de la imagen abierta; la barra fija y el botón flotante conservan su `position: fixed`.

## 5. `js/principal.js`

Funciones nuevas (en el mismo IIFE, ≈ 70 líneas):

| Función | Responsabilidad |
|---|---|
| `controlarTransicionScroll(hero)` | Si `data-transicion`: calcula `apertura` desde el scroll (ver data-model §3), suaviza con rAF, escribe `--apertura` y `data-revelado` (histéresis existente), pausa fuera de pantalla; escucha `matchMedia` de movimiento reducido y de apaisado bajo para devolver al modo final. Devuelve la función que la desactiva. |
| `habilitarImagenAbierta(hero, motivo)` | Marca `data-abierto` tras `load` + inactivo del navegador; con ahorro de datos, en el primer `scroll`; en modo 3D, solo si `--apertura > 0` y aún no hay `is-3d`. |

Cambios en lo existente: `publicarApertura` (bloqueo) sigue igual; `iniciarDentadura` deja de poner `data-hero="estatico"` sin más: pone también `--apertura: 1` si el 3D degrada. El script del `<head>` añade `data-transicion` según R1 (≈ +80 bytes).

## 6. `js/dentadura.js` — opción de captura (solo desarrollo)

`iniciar({ …, captura: true })`:

- No añade la malla de velos; limpia a blanco opaco; `preserveDrawingBuffer: true`; no inicia el bucle ni el pausado por visibilidad.
- Devuelve además `capturar(apertura: number): { png: Blob, recuadro: {izq, arr, ancho, alto}, desplazamiento: {x, y} }` (porcentajes de la figura).
- Con `captura` ausente o `false` el comportamiento es **idéntico** al actual (la verificación lo comprueba por diferencia de imagen).

## 7. Herramientas de desarrollo (no se publican)

Ubicación: `referencias/herramientas/` (la ruta `/referencias/*` responde 404 en producción).

| Archivo | Entrada → salida |
|---|---|
| `capturar-craneo.mjs` | Node + Chrome sin interfaz + CDP. Tamaño de ventana y fase (0 o 1) → PNG del cráneo (y `recuadro`/`desplazamiento` en JSON). |
| `codificar-craneo.py` | PNG → recorte al recuadro → WebP ≤ 60 KB (calidad ajustable). |
| `generar-fondo.py` | `fondo-hero-estatico.jpg` + paleta → `fondo-hero-pc.webp`, `fondo-hero-movil.webp`; imprime contraste por caja de texto. |
| `comparar-hero.mjs` | Tamaños de referencia → desviación de silueta (% del ancho de la figura) y de cajas de texto entre hero estático y 3D. |

Todos se ejecutan a mano; ninguno se importa desde el sitio.
