# Contrato de interfaz — Hero con dentadura 3D

Interfaz entre el módulo de la dentadura (`js/dentadura.js`), el HTML/CSS del hero y las secciones futuras (Spec 2). El módulo **no conoce** el texto del hero; el CSS **no conoce** three.js.

## 1. Estructura del DOM (hero)

```html
<section class="hero" id="inicio" aria-label="Presentación de la clínica">
  <div class="hero__escenario">                      <!-- sticky 100svh en modo animado -->
    <div class="hero__cabecera">
      <img class="hero__logo" src="assets/img/logo.svg" alt="" width="64" height="64">
      <h1 class="hero__titulo">Clínica Dental Dr. Héctor Manuel Rojas Pérez — Atlacomulco</h1>
    </div>

    <div class="hero__figura">                       <!-- relación de aspecto fija 583:713 -->
      <img class="hero__poster" src="assets/img/diente-poster.webp" alt="" width="583" height="713" fetchpriority="high">
      <canvas class="hero__canvas" aria-hidden="true"></canvas>   <!-- creado por el módulo -->
    </div>

    <div class="hero__revelado">                     <!-- eslogan + Servicios -->
      <p class="hero__eslogan">La confianza en tu sonrisa comienza aquí</p>
      <a class="boton boton--acento hero__servicios" href="#servicios">Servicios</a>
    </div>

    <div class="hero__contacto">                     <!-- siempre visible -->
      <a class="boton boton--whatsapp boton--grande" data-campo="whatsapp-href" …>Agende su cita</a>
      <a class="hero__telefono" data-campo="telefono-href" …>…</a>
      <p class="hero__horario" data-campo="horario-resumen"></p>
    </div>
  </div>
</section>
```

Invariantes: un único `<h1>`; `data-campo` conservados; sin `hero__slider`, `hero__slide`, `hero__puntos`, `hero__overlay`.

## 2. Estado y atributos

| Elemento | Atributo | Valores | Quién lo escribe |
|---|---|---|---|
| `<html>` | `data-hero` | `animado` \| `estatico` | script en línea de `<head>` (inicial); `js/dentadura.js` (degradación) |
| `.hero__canvas` | clase `is-listo` | presente tras el 1.er fotograma | `js/dentadura.js` |
| `.hero__figura` | `data-nivel` | `ligero` \| `completo` | `js/dentadura.js` |
| `.hero__figura` | clase `is-3d` | presente tras el 1.er fotograma (oculta el póster) | `js/dentadura.js` |
| `#inicio` | `data-revelado` | presente cuando `--apertura > 0,45` (histéresis 0,40) | `js/principal.js` |

Regla CSS: con `data-hero="estatico"`, `.hero__revelado` es visible y estático (sin `opacity` ligada a `--apertura`), el recorrido del hero es `auto` y el póster permanece visible.

## 3. Progreso de apertura (API pública)

El propietario es `js/principal.js`, **no** el módulo 3D: así el revelado del eslogan no depende de que el 3D cargue.

- **Propiedad CSS** `--apertura` en `#inicio`: número 0–1 (3 decimales), progreso crudo del scroll del hero, actualizado al hacer scroll mientras `data-hero="animado"`.
- **Atributo** `data-revelado` en `#inicio`: presente cuando `--apertura > 0,45` (se quita por debajo de 0,40). Habilita `pointer-events` del botón «Servicios».
- **Evento** `dentadura:apertura` en `document`: `CustomEvent<{ progreso: number }>`, disparado cuando `--apertura` cambia ≥ 0,005. El módulo 3D lo escucha para suavizar el ángulo de la mandíbula.
- **Evento** `dentadura:estado` en `document` (lo emite el módulo 3D): `CustomEvent<{ estado: 'cargando'|'animado'|'pausado'|'estatico', nivel: string }>`.
- Consumidores futuros leen `getComputedStyle(hero).getPropertyValue('--apertura')` o escuchan el evento; no importan `js/dentadura.js`.

Mapeo CSS del revelado (valores de referencia):

```
--rev-eslogan: clamp(0, (var(--apertura) - 0.35) / 0.35, 1)
--rev-boton:   clamp(0, (var(--apertura) - 0.45) / 0.30, 1)
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
- Sin peticiones de red salvo las rutas locales: `assets/js/vendor/three-dentadura.min.js` y `assets/models/*.glb`.

## 5. Contrato de contacto (no regresión, principio II)

- `.hero__contacto`, la barra fija (móvil) y el botón flotante (escritorio) tienen `z-index` superior al canvas y al revelado; el canvas y `.hero__revelado` llevan `pointer-events: none`; el botón «Servicios» solo tiene `pointer-events: auto` con `#inicio[data-revelado]` o con `:focus-visible`.
- El canvas lleva `pointer-events: none` siempre y `touch-action: pan-y`; el puntero se escucha en `window`.
