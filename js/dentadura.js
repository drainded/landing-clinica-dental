/**
 * Dentadura 3D interactiva del hero (specs/001-dentadura-3d-hero).
 *
 * Módulo ES sin efectos al importarse: todo ocurre al llamar a iniciar().
 * Lo carga js/principal.js de forma diferida, después del primer pintado.
 *
 * Estados (data-model.md): cargando | animado | pausado | estatico.
 * Cualquier error se captura y degrada a "estatico" (póster) sin lanzar.
 */

const ESTADOS = ["cargando", "animado", "pausado", "estatico"];

/**
 * @param {{ hero: HTMLElement, figura: HTMLElement, nivel: "ligero"|"completo", rutaModelo: string, umbralFps?: number }} opciones
 * @returns {Promise<{ destruir(): void, estado(): string }>}
 */
export async function iniciar({ hero, figura, nivel, rutaModelo }) {
  let estado = "cargando";
  let destruido = false;
  const limpiezas = [];

  function cambiarEstado(nuevo) {
    if (destruido || !ESTADOS.includes(nuevo) || nuevo === estado) return;
    estado = nuevo;
    document.dispatchEvent(new CustomEvent("dentadura:estado", { detail: { estado, nivel } }));
  }

  function degradar() {
    document.documentElement.dataset.hero = "estatico";
    cambiarEstado("estatico");
  }

  function destruir() {
    if (destruido) return;
    limpiezas.splice(0).reverse().forEach((limpiar) => {
      try { limpiar(); } catch (_) { /* la limpieza nunca debe lanzar */ }
    });
    destruido = true;
  }

  try {
    document.dispatchEvent(new CustomEvent("dentadura:estado", { detail: { estado, nivel } }));
    // US1 (T013 en adelante): cargar three.js y el GLB desde `rutaModelo`,
    // crear el canvas dentro de `figura` y registrar sus limpiezas en `limpiezas`.
    void hero; void figura; void rutaModelo;
  } catch (_) {
    degradar();
    destruir();
  }

  return { destruir, estado: () => estado };
}
