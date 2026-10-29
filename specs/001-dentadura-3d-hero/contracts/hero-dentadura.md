# Contrato de interfaz — Hero con cráneo 3D y velos

Interfaz entre el módulo de la dentadura (`js/dentadura.js`), el HTML/CSS del hero y las secciones futuras (Spec 2). El módulo **no conoce** el texto del hero; el CSS **no conoce** three.js.

## 1. Estructura del DOM (hero)

```html
<section class="hero" id="inicio" aria-label="Presentación de la clínica">
  <div class="hero__escenario">                      <!-- alto fijo: 100svh − header − barra fija -->
    <div class="hero__cabecera">
      <img class="hero__logo" src="assets/img/logo.svg" alt="" width="64" height="64">
      <h1 class="hero__titulo">Clínica Dental Dr. Héctor Manuel Rojas Pérez — Atlacomulco</h1>
    </div>

    <canvas class="hero__canvas" aria-hidden="true"></canvas>   <!-- creado por el módulo: velos + cráneo, ocupa todo el escenario (z-index −1) -->

    <div class="hero__figura">                       <!-- recuadro de referencia del cráneo (contain, proporción del póster 524:564) -->
      <img class="hero__poster" src="assets/img/craneo-cerrado.webp" alt="" width="524" height="564" fetchpriority="high">
    </div>

    <div class="hero__revelado">                     <!-- eslogan (bóveda) + botón (hueco de la boca) -->
      <p class="hero__eslogan">La confianza en tu sonrisa comienza aquí</p>
      <a class="boton boton--acento hero__servicios" href="#servicios">Conoce nuestros servicios <svg aria-hidden="true">…</svg></a>
    </div>

    <div class="hero__contacto">                     <!-- siempre visible -->
      <a class="boton boton--whatsapp boton--grande" data-campo="whatsapp-href" …>Agende su cita</a>
      <a class="hero__telefono" data-campo="telefono-href" …>…</a>
      <p class="hero__horario" data-campo="horario-resumen"></p>
    </div>
  </div>
</section>
```

Invariantes: un único `<h1>`; `data-campo` conservados; sin `hero__slider`, `hero__slide`, `hero__puntos`, `hero__overlay`. El módulo inserta el `<canvas>` como **primer hijo** de `.hero__escenario` (no dentro de `.hero__figura`). El escenario es una rejilla de una columna; todo hijo salvo el canvas lleva `grid-column: 1`.

## 2. Estado y atributos

| Elemento | Atributo | Valores | Quién lo escribe |
|---|---|---|---|
| `<html>` | `data-hero` | `animado` \| `estatico` | script en línea de `<head>` (inicial); `js/dentadura.js` (degradación) |
| `.hero__canvas` | clase `is-listo` | presente tras el 1.er fotograma | `js/dentadura.js` |
| `.hero__figura` | `data-nivel` | `ligero` \| `completo` | `js/dentadura.js` |
| `.hero__figura` | clase `is-3d` | presente tras el 1.er fotograma (oculta el póster con `opacity`) | `js/dentadura.js` |
| `<html>` | `data-bloqueo` | presente mientras el bloqueo de introducción está activo | `js/principal.js` |
| `#inicio` | `data-revelado` | presente cuando `--apertura > 0,50` (histéresis 0,45) | `js/principal.js` |

Regla CSS: con `data-hero="estatico"`, `.hero__revelado` es visible y estático (sin `opacity` ligada a `--apertura`), el recorrido del hero es `auto`, el póster permanece visible sobre el degradado de velos del escenario (tokens de `:root`) y no hay canvas.

## 3. Progreso de apertura (API pública)

El propietario es `js/principal.js`, **no** el módulo 3D: así el revelado del eslogan no depende de que el 3D cargue.

- **Propiedad CSS** `--apertura` en `#inicio`: número 0–1 (3 decimales), progreso de la apertura, avanzado por las primeras acciones de scroll mientras dura el bloqueo de introducción y fijo en 1 después. Solo con `data-hero="animado"`.
- **Atributo** `data-revelado` en `#inicio`: presente cuando `--apertura > 0,50` (se quita por debajo de 0,45). Habilita `pointer-events` del botón «Conoce nuestros servicios».
- **Evento** `dentadura:apertura` en `document`: `CustomEvent<{ progreso: number }>`, disparado cuando `--apertura` cambia ≥ 0,005. El módulo 3D lo escucha para suavizar el ángulo de la mandíbula.
- **Evento** `dentadura:estado` en `document` (lo emite el módulo 3D): `CustomEvent<{ estado: 'cargando'|'animado'|'pausado'|'estatico', nivel: string }>`.
- Consumidores futuros leen `getComputedStyle(hero).getPropertyValue('--apertura')` o escuchan el evento; no importan `js/dentadura.js`.

Mapeo CSS del revelado (valores de referencia):

```
--rev-eslogan: clamp(0, (var(--apertura) - 0.4) / 0.3, 1)
--rev-boton:   clamp(0, (var(--apertura) - 0.4) / 0.3, 1)
```

## 4. Contrato del módulo `js/dentadura.js`

```js
// Exporta una sola función; no tiene efectos secundarios al importarse.
export async function iniciar({ hero, figura, nivel, rutaModelo }) → {
  destruir(): void,        // cancela bucle, listeners, dispose() de recursos
  estado(): 'cargando'|'animado'|'pausado'|'estatico'
}
```

- Errores (GLB 404, WebGL ausente, contexto perdido): no lanza al llamador; emite `dentadura:estado` con `estatico`.
- Efectos permitidos: crear/retirar el `<canvas>`, escribir `data-hero` (solo para degradar a `estatico`), `data-nivel`, clases `is-listo` e `is-3d`. No escribe `--apertura`.
- Lee los tokens `--color-rayosx`, `--color-rayosx-luz`, `--color-superficie`, `--color-velo-fondo`, `--color-velo-1` y `--color-velo-2` de `:root`; no contiene colores literales.
- Sin peticiones de red salvo las rutas locales: `assets/js/vendor/three-dentadura.min.js` y `assets/models/craneo*.glb`.

## 5. Contrato de contacto (no regresión, principio II)

- `.hero__contacto`, la barra fija (móvil) y el botón flotante (escritorio) tienen `z-index` superior al canvas y al revelado; el canvas y `.hero__revelado` llevan `pointer-events: none`; el botón «Conoce nuestros servicios» solo tiene `pointer-events: auto` con `#inicio[data-revelado]` o con `:focus-visible`.
- El canvas lleva `pointer-events: none` siempre y `touch-action: pan-y`; el puntero se escucha en `window`.

## 6. Bloqueo de introducción (constitución v2.3.0, principio II)

- Propietario: `js/principal.js` (`publicarApertura`). Activo solo con `data-hero="animado"`, la página en lo alto y una vez por visita; atributo `data-bloqueo` en `<html>` mientras dura.
- Intercepta (con `preventDefault`): `wheel` sin Ctrl, `touchmove` de un dedo y las teclas Espacio, RePág/AvPág, flechas arriba/abajo, Inicio y Fin (no en `input`/`textarea`/`select`/`button`). Cada una avanza el progreso; este persigue al objetivo a ≤ 0,5/s y al llegar a 1 el bloqueo se libera.
- Salidas: `Tab`; clic en `a[href^="#"]`; evento `scroll` con `pageYOffset > 2`; `dentadura:estado` = `estatico`; carga con la página ya desplazada; cambio a `prefers-reduced-motion: reduce`. Al liberarse con progreso < 1, este pasa a 1 (el módulo 3D completa la apertura a su ritmo).
- No usa `overflow: hidden` ni scroll simulado; no afecta a `.hero__contacto`, la barra fija ni el botón flotante.

## 7. Clic sobre el cráneo (FR-018)

- Propietario: `js/principal.js` (`publicarApertura`). Con `data-hero="animado"`, `.hero__figura` recibe `role="button"`, `tabindex="0"`, `aria-label="Abrir o cerrar la mandíbula"` y `aria-pressed` (sigue a `data-revelado`). Se retiran al pasar a `estatico`.
- Un clic/toque (o Intro/Espacio con la figura enfocada) alterna el objetivo de apertura 0 ↔ 1, con o sin bloqueo de introducción, a la misma velocidad que el scroll. Abrir hasta 1 libera el bloqueo; cerrar en lo alto de la página lo rearma.
- Área de clic: solo cuenta si el punto cae a menos de `RADIO_CLIC` (4,5 % del ancho de la figura, entre 18 y 32 px; +14 px con el dedo) de algún vértice del modelo proyectado con la pose y la cámara actuales (`sobreModelo(x, y, holgura)` en `js/dentadura.js`, ≈ 2 ms). Antes de que cargue el 3D se usa una elipse centrada en la figura (`ELIPSE_RESPALDO`). Las activaciones sin puntero (teclado, lector de pantalla: `detail === 0`) siempre valen. El cursor de mano aparece solo sobre esa área (`.is-sobre-modelo`).
- No alterna al pulsar enlaces o botones (`.hero__servicios`, contacto, cabecera): no son descendientes de `.hero__figura`. El canvas sigue con `pointer-events: none`.
