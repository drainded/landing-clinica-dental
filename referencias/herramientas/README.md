# Herramientas de desarrollo del hero estático

Spec `specs/002-hero-estatico-scroll/`. **No se publican**: `netlify.toml` redirige `/referencias/*` a 404.
Se ejecutan a mano desde la raíz del repositorio; ninguna se importa desde el sitio.

## Prerrequisitos

- Node ≥ 22 (usa el `WebSocket` global; sin paquetes).
- Chrome en `C:\Program Files\Google\Chrome\Application\chrome.exe` (se puede cambiar con la variable de entorno `CHROME`).
- Python con Pillow ≥ 12 con soporte WebP.
- Servidor local: `python -m http.server 5173` (lo que usa `.claude/launch.json`).

## Banderas de Chrome verificadas (2026-10-20)

Para tener WebGL2 sin interfaz: `--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
Edge sin interfaz no devolvió salida con las mismas opciones: se usa Chrome.

## Archivos

| Archivo | Para qué |
|---|---|
| `hero.mjs` | `capturar` (PNG + JSON del cráneo por fase), `cajas` (rectángulos de texto) y `comparar` (estático frente a 3D). Perfiles: `normal`, `movimiento-reducido`, `equipo-lento`, `ahorro-datos`. |
| `codificar-craneo.py` | PNG + JSON → WebP ≤ 60 KB en `assets/img/`. |
| `generar-fondo.py` | Fondos de PC y de móvil a partir de `fuentes/fondo-hero-estatico.jpg`; `--medir` calcula el contraste de los textos. |

Salidas temporales (no se versionan): `salida/`, `linea-base/`, `perfil-chrome/`.
