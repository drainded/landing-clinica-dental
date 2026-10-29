---
name: "probar-navegador"
description: "Verifica un cambio en el navegador real: arranca el servidor local, carga la página, revisa consola/red y captura pantalla. Úsala siempre que haga falta comprobar visualmente o en runtime el trabajo (hero 3D, CSS, JS, rendimiento)."
user-invocable: true
disable-model-invocation: false
---

# Probar en el navegador

Permiso permanente del usuario: ejecutar esto sin pedir confirmación cada vez. **Siempre** informar después de qué se comprobó (ver paso 5).

## Pasos

1. **Servidor.** Arrancar la configuración `dentista-landing` de `.claude/launch.json` (`python -m http.server 5173`, puerto 5173) con `preview_start`. Si no hay herramienta de preview, lanzarlo en segundo plano con Bash: `python -m http.server 5173`. Si el puerto ya responde, reutilizarlo.
2. **Abrir.** Cargar `http://localhost:5173/` (o la ruta que toque, p. ej. `/referencias/demo-rayosx.html`) en el navegador integrado; si no está disponible, usar Claude in Chrome.
3. **Mirar.** Hacer una captura en escritorio (~1280 px) y otra en móvil (~390 px). Leer la consola (errores y avisos) y la red (peticiones fallidas, 404, peso de los `.glb`/`.webp`).
4. **Probar lo que cambió.** Interactuar con lo tocado (scroll, hover, clic, `prefers-reduced-motion` si aplica) y confirmar que se comporta como pide `specs/001-dentadura-3d-hero/spec.md`.
5. **Informar.** En el mismo mensaje, decir al usuario: qué comprobé, con qué herramienta y viewport, el resultado y **todos** los fallos, aunque sean menores. No afirmar que funciona sin haberlo visto.
6. **Limpiar.** Parar el servidor que arrancaste (`preview_stop` o matar el proceso).

## Límites

- No instalar paquetes ni descargar archivos de red (p. ej. Playwright, CDN) sin confirmación previa del usuario.
- No borrar nada sin confirmación.
- Si ninguna herramienta de navegador está disponible, decirlo claramente y no sustituirlo por un grep: pedir al usuario que lo abra o que autorice una alternativa.
