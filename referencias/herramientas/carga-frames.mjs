#!/usr/bin/env node
/**
 * Graba los primeros segundos de carga de la página como fotogramas (CDP screencast) para buscar parpadeos
 * (spec 003). Node ≥ 22 sin paquetes; usa el Chrome instalado y un servidor ya en marcha.
 *
 *   node referencias/herramientas/carga-frames.mjs [--url http://localhost:5173/] [--ancho 1440] [--alto 900]
 *        [--red 4g|rapida|ninguna] [--cpu 4] [--segundos 5] [--tactil] [--js "<expresión a evaluar al final>"] [--salida <carpeta>]
 *
 * Escribe frame-000.jpg… y un indice.txt con la marca de tiempo de cada fotograma. No es parte del sitio publicado.
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, l) => (v.startsWith("--") ? [...a, [v.slice(2), l[i + 1] && !l[i + 1].startsWith("--") ? l[i + 1] : true]] : a), []));
const URL_BASE = args.url || "http://localhost:5173/";
const W = +(args.ancho || 1440), H = +(args.alto || 900);
const SEG = +(args.segundos || 5);
const CPU = +(args.cpu || 1);
const RED = args.red || "ninguna";
const TACTIL = !!args.tactil;
const SALIDA = path.resolve(args.salida || path.join(os.tmpdir(), "carga-frames"));
const CHROME = args.chrome || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PUERTO = 9333;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

await rm(SALIDA, { recursive: true, force: true });
await mkdir(SALIDA, { recursive: true });
const perfil = path.join(os.tmpdir(), "perfil-carga-" + Date.now());
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PUERTO}`, `--user-data-dir=${perfil}`, "--no-first-run",
  "--hide-scrollbars", "--force-device-scale-factor=1", "--mute-audio", `--window-size=${W},${H}`, "about:blank"
], { stdio: "ignore" });

try {
  let destino;
  for (let i = 0; i < 40 && !destino; i++) {
    await esperar(250);
    try { destino = (await (await fetch(`http://127.0.0.1:${PUERTO}/json`)).json()).find((t) => t.type === "page"); } catch (_) { /* aún no */ }
  }
  if (!destino) throw new Error("Chrome no respondió");
  const ws = new WebSocket(destino.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0;
  const pend = new Map();
  const frames = [];
  ws.addEventListener("message", (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); return; }
    if (d.method === "Page.screencastFrame") {
      frames.push({ t: d.params.metadata.timestamp, data: d.params.data });
      ws.send(JSON.stringify({ id: ++id, method: "Page.screencastFrameAck", params: { sessionId: d.params.sessionId } }));
    }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const n = ++id; pend.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });

  await cmd("Page.enable");
  await cmd("Network.enable");
  await cmd("Network.setCacheDisabled", { cacheDisabled: true });
  await cmd("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: W < 768 });
  if (TACTIL) {
    await cmd("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await cmd("Emulation.setEmitTouchEventsForMouse", { enabled: true, configuration: "mobile" });
  }
  if (CPU > 1) await cmd("Emulation.setCPUThrottlingRate", { rate: CPU });
  if (RED !== "ninguna") {
    const perfiles = { "4g": [150, 1.6e6 / 8, 750e3 / 8], rapida: [40, 10e6 / 8, 10e6 / 8] };
    const [lat, bajada, subida] = perfiles[RED] || perfiles["4g"];
    await cmd("Network.emulateNetworkConditions", { offline: false, latency: lat, downloadThroughput: bajada, uploadThroughput: subida });
  }
  await cmd("Page.startScreencast", { format: "jpeg", quality: 55, everyNthFrame: 1 });
  await cmd("Page.navigate", { url: URL_BASE });
  await esperar(SEG * 1000);
  if (args.js) {
    const r = await cmd("Runtime.evaluate", { expression: String(args.js), returnByValue: true, awaitPromise: true });
    console.log("js:", JSON.stringify(r.result && r.result.result ? r.result.result.value : r));
  }
  await cmd("Page.stopScreencast");

  const t0 = frames.length ? frames[0].t : 0;
  const indice = [];
  for (let i = 0; i < frames.length; i++) {
    const nombre = `frame-${String(i).padStart(3, "0")}.jpg`;
    await writeFile(path.join(SALIDA, nombre), Buffer.from(frames[i].data, "base64"));
    indice.push(`${nombre}\t${((frames[i].t - t0) * 1000).toFixed(0)} ms`);
  }
  await writeFile(path.join(SALIDA, "indice.txt"), indice.join("\n"));
  console.log(`${frames.length} fotogramas en ${SALIDA}`);
  ws.close();
} finally {
  chrome.kill();
  await esperar(300);
  await rm(perfil, { recursive: true, force: true }).catch(() => {});
}
