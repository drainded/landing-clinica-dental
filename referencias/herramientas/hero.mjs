#!/usr/bin/env node
/**
 * Herramienta de desarrollo del hero estático (specs/002-hero-estatico-scroll, contrato §7). No se publica.
 *
 * Node ≥ 22 sin paquetes: lanza Chrome sin interfaz, lo controla por CDP y sirve el repositorio con un
 * servidor estático propio (no hace falta arrancar otro).
 *
 *   node referencias/herramientas/hero.mjs capturar --ancho 1440 --alto 900 --fase 0 [--perfil normal]
 *   node referencias/herramientas/hero.mjs cajas    [--perfil equipo-lento]
 *   node referencias/herramientas/hero.mjs comparar [--fase 0|1|ambas]
 *
 * Opciones comunes: --url <base> (si ya hay un servidor), --salida <carpeta>, --chrome <ruta>.
 * Perfiles: normal | movimiento-reducido | equipo-lento | ahorro-datos.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..", "..");
const PERFILES_CHROME = path.join(AQUI, "perfil-chrome");
const SALIDA_DEP = path.join(AQUI, "salida", "depurar");
const TAMANOS = [[360, 740], [390, 844], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]];
const BANDERAS = [
  "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist",
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--force-device-scale-factor=1",
  "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--mute-audio"
];

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function leerArgumentos(lista) {
  const [comando, ...resto] = lista;
  const opciones = {};
  for (let i = 0; i < resto.length; i++) {
    if (!resto[i].startsWith("--")) continue;
    const clave = resto[i].slice(2);
    const sig = resto[i + 1];
    if (sig === undefined || sig.startsWith("--")) opciones[clave] = true;
    else { opciones[clave] = sig; i++; }
  }
  return { comando, opciones };
}

/* ---------- Servidor estático del repositorio ---------- */

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".png": "image/png", ".jpg": "image/jpeg", ".gif": "image/gif", ".woff2": "font/woff2", ".glb": "model/gltf-binary"
};

function servirRaiz() {
  const servidor = createServer(async (req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (ruta.endsWith("/")) ruta += "index.html";
      const archivo = path.join(RAIZ, ruta);
      if (!archivo.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
      const datos = await readFile(archivo);
      res.writeHead(200, { "content-type": TIPOS[path.extname(archivo)] || "application/octet-stream", "cache-control": "no-store" });
      res.end(datos);
    } catch (_) {
      res.writeHead(404);
      res.end();
    }
  });
  return new Promise((resolver) => servidor.listen(0, "127.0.0.1", () => resolver({ servidor, url: `http://127.0.0.1:${servidor.address().port}/` })));
}

/* ---------- Cliente CDP mínimo ---------- */

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pendientes = new Map();
    this.oyentes = new Map();
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.pendientes.has(m.id)) {
        const { ok, fallo } = this.pendientes.get(m.id);
        this.pendientes.delete(m.id);
        if (m.error) fallo(new Error(`${m.error.message} (${JSON.stringify(m.error.data || "")})`));
        else ok(m.result);
      } else if (m.method && this.oyentes.has(m.method)) {
        this.oyentes.get(m.method).forEach((fn) => fn(m.params));
      }
    });
  }
  send(metodo, parametros = {}) {
    const id = ++this.id;
    return new Promise((ok, fallo) => {
      this.pendientes.set(id, { ok, fallo });
      this.ws.send(JSON.stringify({ id, method: metodo, params: parametros }));
    });
  }
  una(evento) {
    return new Promise((r) => {
      const fn = (p) => { this.oyentes.get(evento).delete(fn); r(p); };
      if (!this.oyentes.has(evento)) this.oyentes.set(evento, new Set());
      this.oyentes.get(evento).add(fn);
    });
  }
}

const SCRIPT_PERFIL = {
  "equipo-lento": "Object.defineProperty(navigator,'deviceMemory',{get:()=>1});",
  "ahorro-datos": "Object.defineProperty(navigator,'connection',{get:()=>({saveData:true,effectiveType:'4g',addEventListener(){},removeEventListener(){}})});"
};

/** Lanza Chrome, abre una pestaña con el tamaño y el perfil pedidos y devuelve utilidades para controlarla. */
async function abrirPagina({ ancho, alto, perfil = "normal", chrome }) {
  const ejecutable = chrome || process.env.CHROME || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const puerto = 9300 + Math.floor(Math.random() * 600);
  const carpeta = path.join(PERFILES_CHROME, String(process.pid) + "-" + puerto);
  await mkdir(carpeta, { recursive: true });
  const proceso = spawn(ejecutable, [...BANDERAS, `--user-data-dir=${carpeta}`, `--remote-debugging-port=${puerto}`, `--window-size=${ancho},${alto}`, "about:blank"], { stdio: "ignore" });
  let objetivo = null;
  for (let i = 0; i < 120 && !objetivo; i++) {
    try {
      const lista = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json();
      objetivo = lista.find((t) => t.type === "page");
    } catch (_) { /* Chrome aún arrancando */ }
    if (!objetivo) await esperar(150);
  }
  if (!objetivo) { proceso.kill(); throw new Error("Chrome no respondió por CDP; revisa la ruta (--chrome o variable CHROME)."); }

  const ws = new WebSocket(objetivo.webSocketDebuggerUrl);
  await new Promise((ok, fallo) => { ws.addEventListener("open", ok); ws.addEventListener("error", fallo); });
  const cdp = new Cdp(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: ancho, height: alto, deviceScaleFactor: 1, mobile: false });
  if (perfil === "movimiento-reducido") {
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  }
  if (SCRIPT_PERFIL[perfil]) await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: SCRIPT_PERFIL[perfil] });
  // Desplazamiento acumulado de diseño (CLS) de la carga, disponible en window.__cls
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: "window.__lcp=null;try{new PerformanceObserver((l)=>{const e=l.getEntries().pop();if(e)window.__lcp={url:e.url||'',tag:e.element?e.element.tagName:'',t:Math.round(e.startTime)}}).observe({type:'largest-contentful-paint',buffered:true})}catch(_){}window.__cls=0;window.__clsDet=[];try{new PerformanceObserver((l)=>{for(const e of l.getEntries())if(!e.hadRecentInput){window.__cls+=e.value;window.__clsDet.push({v:+e.value.toFixed(4),t:Math.round(e.startTime),n:e.sources.map((x)=>[x.node?((x.node.className&&x.node.className.baseVal===undefined?x.node.className:'')||x.node.nodeName):'?',[x.previousRect.x,x.previousRect.y,x.previousRect.width,x.previousRect.height].map(Math.round),[x.currentRect.x,x.currentRect.y,x.currentRect.width,x.currentRect.height].map(Math.round)])})}}).observe({type:'layout-shift',buffered:true})}catch(_){}" });

  const peticiones = [];
  const porId = new Map();
  cdp.oyentes.set("Network.requestWillBeSent", new Set([(p) => { peticiones.push(p.request.url); porId.set(p.requestId, { url: p.request.url, bytes: 0 }); }]));
  cdp.oyentes.set("Network.loadingFinished", new Set([(p) => { const r = porId.get(p.requestId); if (r) r.bytes = p.encodedDataLength; }]));

  const api = {
    cdp,
    peticiones,
    recursos: () => [...porId.values()],
    async ir(url) {
      peticiones.length = 0;
      const carga = cdp.una("Page.loadEventFired");
      await cdp.send("Page.navigate", { url });
      await carga;
      await cdp.send("Runtime.evaluate", { expression: "document.fonts.ready", awaitPromise: true });
    },
    async evaluar(expresion) {
      const r = await cdp.send("Runtime.evaluate", { expression: expresion, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error("Error en la página: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      return r.result.value;
    },
    async esperarHasta(expresion, ms = 60000) {
      const fin = Date.now() + ms;
      while (Date.now() < fin) {
        if (await api.evaluar(expresion)) return true;
        await esperar(150);
      }
      throw new Error("Tiempo agotado esperando: " + expresion);
    },
    async pantalla(clip) {
      const r = await cdp.send("Page.captureScreenshot", { format: "png", ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
      return Buffer.from(r.data, "base64");
    },
    async cerrar() {
      try { ws.close(); } catch (_) { /* ya cerrado */ }
      proceso.kill();
      await esperar(300);
      await rm(carpeta, { recursive: true, force: true }).catch(() => {});
    }
  };
  return api;
}

/* ---------- Subcomandos ---------- */

async function capturar(base, o) {
  const ancho = Number(o.ancho || 1440);
  const alto = Number(o.alto || 900);
  const fases = String(o.fase ?? "0").split(",").map(Number);
  const salida = path.resolve(o.salida || path.join(AQUI, "salida"));
  await mkdir(salida, { recursive: true });
  const pagina = await abrirPagina({ ancho, alto, perfil: o.perfil || "normal", chrome: o.chrome });
  try {
    await pagina.ir(base + "index.html?captura");
    await pagina.esperarHasta("!!window.__craneo && !!window.__craneo.capturar");
    await esperar(400);
    for (const fase of fases) {
      const r = await pagina.evaluar(`window.__craneo.capturar(${fase})`);
      const nombre = `craneo-${fase}-${ancho}x${alto}`;
      await writeFile(path.join(salida, nombre + ".png"), Buffer.from(r.imagen.split(",")[1], "base64"));
      const { imagen, ...datos } = r;
      await writeFile(path.join(salida, nombre + ".json"), JSON.stringify({ ancho, alto, fase, ...datos }, null, 2));
      const rc = datos.recuadro;
      console.log(`${nombre}: recuadro ${rc.izq.toFixed(1)} / ${rc.arr.toFixed(1)} / ${rc.ancho.toFixed(1)} × ${rc.alto.toFixed(1)} % · desplazamiento ${datos.desplazamiento.x.toFixed(2)}, ${datos.desplazamiento.y.toFixed(2)} %`);
    }
  } finally {
    await pagina.cerrar();
  }
}

const EXPRESION_CAJAS = `(() => {
  const caja = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect();
    return { x: b.left, y: b.top, w: b.width, h: b.height, color: getComputedStyle(e).color }; };
  const d = document.documentElement;
  return { cabecera: caja('.hero__cabecera'), titulo: caja('.hero__titulo'), figura: caja('.hero__figura'),
    eslogan: caja('.hero__eslogan'), boton: caja('.hero__servicios'), telefono: caja('.hero__telefono'),
    horario: caja('.hero__horario'), contacto: caja('.hero__contacto'), escenario: caja('.hero__escenario'),
    desbordeHorizontal: d.scrollWidth > d.clientWidth, scrollY: window.pageYOffset };
})()`;

/** Rectángulos del hero con la apertura completa (posiciones finales de eslogan y botón). */
async function medirCajas(pagina, base, apertura = 1) {
  await pagina.ir(base + "index.html");
  await esperar(500);
  await pagina.evaluar(`document.getElementById('inicio').style.setProperty('--apertura','${apertura}')`);
  await esperar(500);
  const datos = await pagina.evaluar(EXPRESION_CAJAS);
  datos.cls = await pagina.evaluar("window.__cls");
  datos.clsDetalle = await pagina.evaluar("window.__clsDet");
  // Con la boca cerrada el eslogan y el botón no se ven; el resto del hero sí
  await pagina.evaluar(`document.getElementById('inicio').style.setProperty('--apertura','0')`);
  await esperar(500);
  datos.cerrado = await pagina.evaluar(`(() => { const o = (s) => +getComputedStyle(document.querySelector(s)).opacity;
    return { eslogan: o('.hero__eslogan'), boton: o('.hero__servicios'), titulo: o('.hero__titulo'), contacto: o('.hero__contacto'), poster: o('.hero__poster') }; })()`);
  return datos;
}

async function cajas(base, o) {
  const salida = path.resolve(o.salida || path.join(AQUI, "salida"));
  await mkdir(salida, { recursive: true });
  for (const [ancho, alto] of TAMANOS) {
    const pagina = await abrirPagina({ ancho, alto, perfil: o.perfil || "equipo-lento", chrome: o.chrome });
    try {
      const datos = await medirCajas(pagina, base);
      await writeFile(path.join(salida, `cajas-${ancho}x${alto}.json`), JSON.stringify({ ancho, alto, ...datos }, null, 2));
      if (datos.cls > 0.001) console.log('  desplazamientos:', JSON.stringify(datos.clsDetalle));
      const c = datos.cerrado;
      console.log(`cajas-${ancho}x${alto}.json · desborde horizontal: ${datos.desbordeHorizontal} · CLS: ${Number(datos.cls).toFixed(4)} · boca cerrada: eslogan ${c.eslogan}, botón ${c.boton}, título ${c.titulo}, contacto ${c.contacto}, póster ${c.poster}`);
    } finally {
      await pagina.cerrar();
    }
  }
}

/**
 * Captura de pantalla del escenario del hero con el 3D normal (sin `?captura`), para la línea base y la
 * regresión (E9): fase 0 = mandíbula cerrada, fase 1 = abierta, sin cursor.
 * Uso: pantalla --ancho 390 --alto 844 [--salida <carpeta>] [--prefijo base]
 */
async function pantalla(base, o) {
  const ancho = Number(o.ancho || 1440);
  const alto = Number(o.alto || 900);
  const salida = path.resolve(o.salida || path.join(AQUI, "salida"));
  const prefijo = o.prefijo || "pantalla";
  await mkdir(salida, { recursive: true });
  const pagina = await abrirPagina({ ancho, alto, perfil: o.perfil || "normal", chrome: o.chrome });
  try {
    await pagina.ir(base + "index.html");
    await pagina.esperarHasta("!!document.querySelector('.hero__canvas.is-listo')", 90000);
    await esperar(1500);
    const clip = async () => pagina.evaluar(`(() => { const b = document.querySelector('.hero__escenario').getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, width: b.width, height: b.height }; })()`);
    await writeFile(path.join(salida, `${prefijo}-0-${ancho}x${alto}.png`), await pagina.pantalla(await clip()));
    await pagina.evaluar(`document.getElementById('inicio').style.setProperty('--apertura', '1'); document.dispatchEvent(new CustomEvent('dentadura:apertura', { detail: { progreso: 1 } }))`);
    await esperar(3500);
    await writeFile(path.join(salida, `${prefijo}-1-${ancho}x${alto}.png`), await pagina.pantalla(await clip()));
    console.log(`${prefijo}-0|1-${ancho}x${alto}.png guardadas en ${salida}`);
  } finally {
    await pagina.cerrar();
  }
}

/* ---------- comparar: hero estático frente a hero 3D ---------- */

// Se ejecuta dentro de la página: caja envolvente de los píxeles que no son casi blancos, ignorando las máscaras
const ANALIZAR = `(async (src, region, mascaras, umbral) => {
  const img = new Image(); img.src = src; await img.decode();
  const c = document.createElement('canvas'); c.width = region.w; c.height = region.h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.drawImage(img, -region.x, -region.y);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    const i = (y * c.width + x) * 4;
    if (Math.min(d[i], d[i + 1], d[i + 2]) >= umbral) continue;
    let dentro = false;
    for (const k of mascaras) if (x >= k.x && x <= k.x + k.w && y >= k.y && y <= k.y + k.h) { dentro = true; break; }
    if (dentro) continue;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1 };
})`;

const EXPRESION_GEOMETRIA = `(() => {
  const r = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
  return { escenario: r('.hero__escenario'), poster: r('.hero__poster-caja') };
})()`;

const CLAVES_TEXTO = ["cabecera", "eslogan", "boton", "contacto", "figura"];
const UMBRAL_BLANCO = 225;
const TOLERANCIA_SILUETA = 2;   // % del ancho del rectángulo del póster
const TOLERANCIA_CAJAS = 0.5;   // px

async function compararTamano(base, ancho, alto, fases, o) {
  const resultados = [];
  // 1) Hero 3D con ?captura (mismas cámaras y shaders que el 3D real) y sus cajas de texto
  const p3d = await abrirPagina({ ancho, alto, perfil: "normal", chrome: o.chrome });
  const tres = {};
  try {
    await p3d.ir(base + "index.html?captura");
    await p3d.esperarHasta("!!window.__craneo && !!window.__craneo.capturar");
    await esperar(400);
    for (const fase of fases) {
      tres[fase] = { captura: await p3d.evaluar(`window.__craneo.capturar(${fase})`) };
      await p3d.evaluar(`document.getElementById('inicio').style.setProperty('--apertura', '${fase}')`);
      await esperar(500);
      tres[fase].cajas = await p3d.evaluar(EXPRESION_CAJAS);
    }
  } finally {
    await p3d.cerrar();
  }
  // 2) Hero estático (equipo lento): fondo blanco y textos invisibles (conservan su caja)
  const pe = await abrirPagina({ ancho, alto, perfil: o.perfil || "equipo-lento", chrome: o.chrome });
  try {
    await pe.ir(base + "index.html");
    await pe.esperarHasta("document.querySelector('.hero__poster').complete");
    await pe.evaluar(`(() => { const e = document.createElement('style');
      e.textContent = '.hero__cabecera,.hero__revelado,.hero__contacto{visibility:hidden!important}.hero__escenario{background:#fff!important}.hero__canvas,.barra-fija,.whatsapp-flotante,.encabezado{display:none!important}';
      document.head.appendChild(e); })()`);
    for (const fase of fases) {
      await pe.evaluar(`document.getElementById('inicio').style.setProperty('--apertura', '${fase}')`);
      if (fase > 0) await pe.esperarHasta("document.documentElement.hasAttribute('data-abierto-listo')", 30000);
      await esperar(700);
      const cajasEst = await pe.evaluar(EXPRESION_CAJAS);
      const geo = await pe.evaluar(EXPRESION_GEOMETRIA);
      const esc = geo.escenario;
      const poster = { x: geo.poster.x - esc.x, y: geo.poster.y - esc.y, w: geo.poster.w, h: geo.poster.h };
      const clip = { x: esc.x + await pe.evaluar("scrollX"), y: esc.y + await pe.evaluar("scrollY"), width: esc.w, height: esc.h };
      const png = await pe.pantalla(clip);
      const srcEst = "data:image/png;base64," + png.toString("base64");
      if (o.depurar) { await mkdir(SALIDA_DEP, { recursive: true }); await writeFile(path.join(SALIDA_DEP, `estatico-${fase}-${ancho}x${alto}.png`), png); }

      // Máscaras (coordenadas del escenario): cabecera y eslogan ampliados un 5 % del alto, donde actúa el difuminado
      const m = 0.05 * esc.h;
      const mascaras = ["cabecera", "eslogan"].map((k) => { const c = cajasEst[k]; return { x: c.x - esc.x - m, y: c.y - esc.y - m, w: c.w + 2 * m, h: c.h + 2 * m }; });
      const reg = { x: 0, y: 0, w: Math.round(esc.w), h: Math.round(esc.h) };
      const sEst = await pe.evaluar(`${ANALIZAR}(${JSON.stringify(srcEst)}, ${JSON.stringify(reg)}, ${JSON.stringify(mascaras)}, ${UMBRAL_BLANCO})`);

      // El PNG del 3D está en un lienzo ampliado: su origen respecto al escenario sale de la posición del póster en ambos
      const cap = tres[fase].captura;
      if (o.depurar) await writeFile(path.join(SALIDA_DEP, `tres-${fase}-${ancho}x${alto}.png`), Buffer.from(cap.imagen.split(",")[1], "base64"));
      const regTres = { x: Math.round(cap.posterPx.x - poster.x), y: Math.round(cap.posterPx.y - poster.y), w: reg.w, h: reg.h };
      const sTres = await pe.evaluar(`${ANALIZAR}(${JSON.stringify(cap.imagen)}, ${JSON.stringify(regTres)}, ${JSON.stringify(mascaras)}, ${UMBRAL_BLANCO})`);

      const dif = (a, b) => ((a - b) / poster.w) * 100;
      const dev = { izq: dif(sEst.x0, sTres.x0), arr: dif(sEst.y0, sTres.y0), der: dif(sEst.x1, sTres.x1), aba: dif(sEst.y1, sTres.y1) };
      const maxSilueta = Math.max(...Object.values(dev).map(Math.abs));
      let maxCajas = 0;
      for (const k of CLAVES_TEXTO) {
        // Respecto al origen del escenario (en la página estática se ocultó el encabezado para el análisis)
        const a = cajasEst[k], b = tres[fase].cajas[k];
        const oa = cajasEst.escenario, ob = tres[fase].cajas.escenario;
        const d = { x: (a.x - oa.x) - (b.x - ob.x), y: (a.y - oa.y) - (b.y - ob.y), w: a.w - b.w, h: a.h - b.h };
        for (const c of ["x", "y", "w", "h"]) maxCajas = Math.max(maxCajas, Math.abs(d[c]));
      }
      const difPoster = Math.abs(poster.w - cap.posterPx.w);
      resultados.push({ ancho, alto, fase, dev, maxSilueta, maxCajas, difPoster, ok: maxSilueta <= TOLERANCIA_SILUETA && maxCajas <= TOLERANCIA_CAJAS });
    }
  } finally {
    await pe.cerrar();
  }
  return resultados;
}

async function comparar(base, o) {
  const fases = String(o.fase ?? "0").split(",").map(Number);
  const tamanos = o.tamano ? [String(o.tamano).split("x").map(Number)] : TAMANOS;
  let fallos = 0;
  console.log("tamaño      fase  silueta máx (% ancho póster)  [izq arr der aba]        cajas máx (px)  póster Δpx  resultado");
  for (const [ancho, alto] of tamanos) {
    for (const r of await compararTamano(base, ancho, alto, fases, o)) {
      const d = r.dev;
      console.log(`${String(r.ancho).padStart(4)}×${String(r.alto).padEnd(5)}  ${r.fase}     ${r.maxSilueta.toFixed(2).padStart(6)}                      [${d.izq.toFixed(1)} ${d.arr.toFixed(1)} ${d.der.toFixed(1)} ${d.aba.toFixed(1)}]`.padEnd(98) + `${r.maxCajas.toFixed(2).padStart(6)}        ${r.difPoster.toFixed(1).padStart(5)}      ${r.ok ? "OK" : "FALLA"}`);
      if (!r.ok) fallos++;
    }
  }
  console.log(fallos ? `${fallos} comparación(es) fuera de tolerancia (silueta ≤ ${TOLERANCIA_SILUETA} %, cajas ≤ ${TOLERANCIA_CAJAS} px)` : "Todas las comparaciones dentro de tolerancia");
  return fallos ? 1 : 0;
}

/* ---------- transicion: recorrido del scroll del hero estático ---------- */

const ESTADO_HERO = `(() => {
  const q = (s) => document.querySelector(s);
  const cs = (e, p) => getComputedStyle(e)[p];
  const hero = q('#inicio');
  return { y: Math.round(scrollY), apertura: hero.style.getPropertyValue('--apertura'),
    poster: cs(q('.hero__poster'), 'opacity'), abierto: cs(q('.hero__abierto'), 'opacity'),
    eslogan: cs(q('.hero__eslogan'), 'opacity'), boton: cs(q('.hero__servicios'), 'opacity'),
    clic: cs(q('.hero__servicios'), 'pointerEvents'), revelado: hero.hasAttribute('data-revelado'),
    escenarioTop: Math.round(q('.hero__escenario').getBoundingClientRect().top),
    heroBottom: Math.round(hero.getBoundingClientRect().bottom),
    listo: document.documentElement.hasAttribute('data-abierto-listo'),
    fallo: document.documentElement.hasAttribute('data-abierto-fallo'),
    desborde: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    // «Agende su cita» visible en pantalla y no tapado por nada (el elemento bajo su centro es el propio botón)
    contacto: (() => { const b = q('.hero__contacto .boton'); const r = b.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return r.top >= 0 && r.bottom <= innerHeight && !!el && (b === el || b.contains(el)); })() };
})()`;

/**
 * Recorre el hero estático con el scroll: 0, 25, 50, 75 y 100 % del anclaje, un poco más allá (el hero se desancla)
 * y la vuelta. Uso: transicion [--tamano 390x844] [--perfil ahorro-datos] [--depurar]
 */
async function transicion(base, o) {
  const tamanos = o.tamano ? [String(o.tamano).split("x").map(Number)] : [[390, 844], [1440, 900]];
  await mkdir(SALIDA_DEP, { recursive: true });
  let fallos = 0;
  for (const [ancho, alto] of tamanos) {
    const pagina = await abrirPagina({ ancho, alto, perfil: o.perfil || "ahorro-datos", chrome: o.chrome });
    try {
      await pagina.ir(base + "index.html");
      await esperar(1500);
      const geo = await pagina.evaluar(`(() => { const h = document.getElementById('inicio'), e = h.querySelector('.hero__escenario');
        return { recorrido: h.offsetHeight - e.offsetHeight, inicio: h.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(e).top) || 0) }; })()`);
      const { recorrido, inicio } = geo;
      console.log(`\n${ancho}×${alto} · recorrido ${recorrido}px (${(recorrido / alto * 100).toFixed(0)} % del alto) · modo: ${await pagina.evaluar("document.documentElement.dataset.hero + (document.documentElement.hasAttribute('data-transicion') ? '+transicion' : '')")}`);
      console.log("  pos      scrollY  apertura  póster  abierto  eslogan  botón  clic   revelado  escenarioTop  listo");
      // Rueda real: el scroll nativo no debe bloquearse
      await pagina.cdp.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: ancho / 2, y: alto / 2, deltaX: 0, deltaY: 200 });
      await esperar(1200);
      const rueda = await pagina.evaluar("Math.round(scrollY)");
      console.log(`  rueda: scrollY tras 200 px de rueda = ${rueda} ${rueda > 0 ? "(OK, no se bloquea)" : "(FALLA: el scroll quedó bloqueado)"}`);
      if (!(rueda > 0)) fallos++;
      for (const p of [0, 0.25, 0.5, 0.75, 1, 1.4, 0.5, 0]) {
        await pagina.evaluar(`window.scrollTo({ top: ${Math.round(inicio + p * recorrido)}, behavior: 'instant' })`);
        await esperar(1100);
        const e = await pagina.evaluar(ESTADO_HERO);
        console.log(`  ${(p * 100).toFixed(0).padStart(4)} %  ${String(e.y).padStart(7)}  ${String(e.apertura).padStart(8)}  ${Number(e.poster).toFixed(2).padStart(6)}  ${Number(e.abierto).toFixed(2).padStart(7)}  ${Number(e.eslogan).toFixed(2).padStart(7)}  ${Number(e.boton).toFixed(2).padStart(5)}  ${e.clic.padEnd(5)}  ${String(e.revelado).padEnd(8)}  ${String(e.escenarioTop).padStart(11)}  ${e.listo}${e.fallo ? " FALLO" : ""}${e.desborde ? " DESBORDE-HORIZONTAL" : ""}${e.contacto ? "" : " CONTACTO-TAPADO"}`);
        if (e.desborde || !e.contacto) fallos++;
        if (o.depurar) await writeFile(path.join(SALIDA_DEP, `transicion-${ancho}x${alto}-${Math.round(p * 100)}-${e.y}.png`), await pagina.pantalla());
      }
      if (o.extra) fallos += await extrasTransicion(pagina, ancho, alto, recorrido, inicio);
    } finally {
      await pagina.cerrar();
    }
  }
  return fallos ? 1 : 0;
}

/** Recarga ya desplazada, regreso por #inicio, teclado (Tab hasta el botón) y cuadros por segundo del recorrido. */
async function extrasTransicion(pagina, ancho, alto, recorrido, inicio) {
  let fallos = 0;
  const ok = (cond, texto) => { console.log(`  ${cond ? "OK   " : "FALLA"} ${texto}`); if (!cond) fallos++; };
  // Recarga ya desplazada: el estado corresponde a la posición, no al inicial
  await pagina.evaluar(`window.scrollTo({ top: ${Math.round(inicio + recorrido * 0.4)}, behavior: 'instant' })`);
  await esperar(500);
  await pagina.cdp.send("Page.reload");
  await esperar(2500);
  const rec = await pagina.evaluar(ESTADO_HERO);
  ok(Math.abs(Number(rec.apertura) - 0.4) < 0.05 && rec.y > 0, `recarga desplazada: scrollY ${rec.y}, apertura ${rec.apertura} (esperado ≈ 0,40)`);
  // Regreso por #inicio con la transición completada
  await pagina.evaluar(`window.scrollTo({ top: ${Math.round(inicio + recorrido * 1.4)}, behavior: 'instant' })`);
  await esperar(600);
  await pagina.evaluar("location.hash = '#inicio'");
  await esperar(2500);
  const ini = await pagina.evaluar(ESTADO_HERO);
  ok(Number(ini.apertura) === 0 && Number(ini.poster) === 1, `regreso por #inicio: scrollY ${ini.y}, apertura ${ini.apertura}, póster ${ini.poster}`);
  // Teclado: Tab hasta «Conoce nuestros servicios» con la boca cerrada; debe verse con foco
  let enBoton = false;
  for (let i = 0; i < 25 && !enBoton; i++) {
    await pagina.cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await pagina.cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    enBoton = await pagina.evaluar("document.activeElement && document.activeElement.classList.contains('hero__servicios')");
  }
  await esperar(300);
  const foco = await pagina.evaluar(`(() => { const b = document.querySelector('.hero__servicios'); const r = b.getBoundingClientRect();
    return { opacidad: +getComputedStyle(b).opacity, clic: getComputedStyle(b).pointerEvents, ancho: r.width, alto: r.height, apertura: document.getElementById('inicio').style.getPropertyValue('--apertura') }; })()`);
  ok(enBoton && foco.opacidad === 1 && foco.clic === "auto" && foco.alto >= 44, `Tab llega al botón con apertura ${foco.apertura}: opacidad ${foco.opacidad}, clic ${foco.clic}, alto ${Math.round(foco.alto)} px`);
  // Cuadros por segundo durante un recorrido completo con gesto de scroll real (en software: cifra orientativa)
  await pagina.evaluar("window.scrollTo({ top: 0, behavior: 'instant' }); window.__dt = []; (function f(t){ if (window.__ult) window.__dt.push(t - window.__ult); window.__ult = t; window.__raf = requestAnimationFrame(f); })(performance.now())");
  await esperar(300);
  await pagina.cdp.send("Input.synthesizeScrollGesture", { x: Math.round(ancho / 2), y: Math.round(alto / 2), yDistance: -Math.round(inicio + recorrido * 1.2), speed: 600, gestureSourceType: "mouse" });
  await esperar(500);
  const dt = await pagina.evaluar("cancelAnimationFrame(window.__raf), window.__dt");
  const medio = dt.reduce((a, b) => a + b, 0) / Math.max(1, dt.length);
  const peor = Math.max(...dt);
  console.log(`  INFO  cuadros durante el recorrido: ${dt.length} · ${(1000 / medio).toFixed(0)} fps de media · cuadro más largo ${peor.toFixed(0)} ms (Chrome sin interfaz, render por software)`);
  return fallos;
}

/**
 * Qué se pide y cuánto pesa (sin compresión del servidor local). Uso: red --tamano 390x844 --perfil ahorro-datos [--scroll]
 * --scroll desplaza un poco el hero antes de listar, para ver qué se pide al empezar a desplazarse.
 */
async function red(base, o) {
  const [ancho, alto] = String(o.tamano || "1440x900").split("x").map(Number);
  const pagina = await abrirPagina({ ancho, alto, perfil: o.perfil || "normal", chrome: o.chrome });
  try {
    await pagina.ir(base + (o.ir || "index.html"));
    await esperar(Number(o.espera || 4000));
    const antes = new Set(pagina.recursos().map((r) => r.url));
    if (o.scroll) { await pagina.evaluar("window.scrollTo({ top: 120, behavior: 'instant' })"); await esperar(2500); }
    const nombre = (u) => u.replace(base, "").slice(0, 70);
    console.log(`${ancho}×${alto} · perfil ${o.perfil || "normal"}${o.scroll ? " · con scroll" : ""}`);
    let total = 0;
    for (const r of pagina.recursos()) {
      if (r.url.startsWith("data:")) { console.log(`  ${"(datos)".padEnd(70)} ${String(r.bytes).padStart(8)} B${antes.has(r.url) ? "" : "  ← tras el scroll"}`); continue; }
      total += r.bytes;
      console.log(`  ${nombre(r.url).padEnd(70)} ${String(r.bytes).padStart(8)} B${antes.has(r.url) ? "" : "  ← tras el scroll"}`);
    }
    console.log(`  total sin comprimir: ${(total / 1024).toFixed(0)} KB · dominios externos: ${pagina.recursos().filter((r) => !r.url.startsWith(base) && !r.url.startsWith("data:")).length}`);
  } finally {
    await pagina.cerrar();
  }
}

/* ---------- modos: escenarios de movimiento reducido, ahorro de datos y fallos (E4 y E5) ---------- */

const ESTADO_MODOS = `(() => {
  const q = (s) => document.querySelector(s);
  const cs = (e, p) => getComputedStyle(e)[p];
  const h = q('#inicio');
  const r = (s) => { const b = q(s).getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map(Math.round).join(','); };
  return { hero: document.documentElement.dataset.hero, transicion: document.documentElement.hasAttribute('data-transicion'),
    apertura: (getComputedStyle(h).getPropertyValue('--apertura') || '').trim(),
    poster: +cs(q('.hero__poster'), 'opacity'), abierto: +cs(q('.hero__abierto'), 'opacity'),
    eslogan: +cs(q('.hero__eslogan'), 'opacity'), boton: +cs(q('.hero__servicios'), 'opacity'),
    clic: cs(q('.hero__servicios'), 'pointerEvents'), listo: document.documentElement.hasAttribute('data-abierto-listo'),
    fallo: document.documentElement.hasAttribute('data-abierto-fallo'), escenario: cs(q('.hero__escenario'), 'position'),
    canvas: !!q('.hero__canvas'), is3d: q('.hero__figura').classList.contains('is-3d'),
    cajas: [r('.hero__cabecera'), r('.hero__figura'), r('.hero__contacto')].join(' | '), lcp: window.__lcp || null };
})()`;

async function modos(base, o) {
  let fallos = 0;
  const ok = (cond, texto) => { console.log(`  ${cond ? "OK   " : "FALLA"} ${texto}`); if (!cond) fallos++; };
  const finalOk = (e) => Number(e.apertura) === 1 && !e.transicion && e.escenario !== "sticky" && e.eslogan === 1 && e.boton === 1 && e.clic === "auto";
  const clipEscenario = (p) => p.evaluar(`(() => { const b = document.querySelector('.hero__escenario').getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, width: b.width, height: b.height }; })()`);
  const tamanos = o.tamano ? [String(o.tamano).split("x").map(Number)] : [[390, 844], [1440, 900]];

  for (const [ancho, alto] of tamanos) {
    const grande = ancho >= 1024;
    console.log(`\n${ancho}×${alto}`);

    // A) Movimiento reducido: composición final desde el principio y ningún píxel cambia con cursor ni scroll
    let p = await abrirPagina({ ancho, alto, perfil: "movimiento-reducido", chrome: o.chrome });
    try {
      await p.ir(base + "index.html");
      await p.esperarHasta("document.documentElement.hasAttribute('data-abierto-listo')", 20000).catch(() => {});
      await esperar(1200);
      const e = await p.evaluar(ESTADO_MODOS);
      ok(finalOk(e) && e.abierto === 1 && e.poster === 0 && e.listo, `movimiento reducido: composición final (apertura ${e.apertura}, abierto ${e.abierto}, póster ${e.poster}, eslogan ${e.eslogan}, botón ${e.boton}, ${e.escenario})`);
      const urls = p.peticiones;
      const esperada = grande ? "craneo-abierto-escritorio" : "craneo-abierto-movil";
      ok(urls.some((u) => u.includes(esperada)) && !urls.some((u) => u.includes("craneo-abierto-" + (grande ? "movil" : "escritorio"))), `se pide solo la variante del cráneo abierto de este tamaño (${esperada})`);
      ok(!urls.some((u) => u.includes("three-dentadura") || u.endsWith(".glb")), "no se pide three.js ni el modelo 3D");
      console.log(`  INFO  LCP: ${e.lcp ? `${e.lcp.url ? e.lcp.url.replace(base, "") : e.lcp.tag} a los ${e.lcp.t} ms` : "sin dato"}`);
      const antes = await p.pantalla(await clipEscenario(p));
      // Recorrido del cursor por zonas sin enlaces ni botones (el :hover de un enlace no es movimiento del hero)
      for (const [x, y] of [[ancho * 0.05, alto * 0.25], [ancho * 0.95, alto * 0.45], [ancho * 0.05, alto * 0.65], [ancho * 0.93, alto * 0.30]]) {
        await p.cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: Math.round(x), y: Math.round(y) });
        await esperar(150);
      }
      await esperar(600);
      const tras = await p.pantalla(await clipEscenario(p));
      ok(antes.equals(tras), "mover el cursor por el hero no cambia ningún píxel");
      await p.evaluar("window.scrollTo({ top: 300, behavior: 'instant' })");
      await esperar(500);
      await p.evaluar("window.scrollTo({ top: 0, behavior: 'instant' })");
      await esperar(600);
      const vuelta = await p.pantalla(await clipEscenario(p));
      ok(antes.equals(vuelta), "hacer scroll y volver no cambia ningún píxel del hero");
    } finally { await p.cerrar(); }

    // B) Reducir movimiento con la página abierta y la transición a medias
    p = await abrirPagina({ ancho, alto, perfil: "ahorro-datos", chrome: o.chrome });
    try {
      await p.ir(base + "index.html");
      await esperar(1200);
      await p.evaluar("window.scrollTo({ top: 250, behavior: 'instant' })");
      await esperar(900);
      const antes = await p.evaluar(ESTADO_MODOS);
      await p.cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
      await esperar(1500);
      const e = await p.evaluar(ESTADO_MODOS);
      ok(antes.transicion && finalOk(e) && e.abierto === 1, `activar «reducir movimiento» con la transición a medias (apertura ${antes.apertura}) → composición final (apertura ${e.apertura}, ${e.escenario})`);
    } finally { await p.cerrar(); }

    // C) Imagen del cráneo abierto bloqueada: el hero sigue completo con el cráneo cerrado
    p = await abrirPagina({ ancho, alto, perfil: "ahorro-datos", chrome: o.chrome });
    try {
      await p.cdp.send("Network.setBlockedURLs", { urls: ["*craneo-abierto*"] });
      await p.ir(base + "index.html");
      await esperar(1200);
      const geo = await p.evaluar(`(() => { const h = document.getElementById('inicio'), e = h.querySelector('.hero__escenario'); return h.offsetHeight - e.offsetHeight + h.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(e).top) || 0); })()`);
      await p.evaluar(`window.scrollTo({ top: ${Math.round(geo)}, behavior: 'instant' })`);
      await esperar(2500);
      const e = await p.evaluar(ESTADO_MODOS);
      ok(e.fallo && e.poster === 1 && e.eslogan === 1 && e.boton === 1 && e.clic === "auto" && !e.listo, `imagen abierta bloqueada: póster ${e.poster}, eslogan ${e.eslogan}, botón ${e.boton}, clic ${e.clic}, fallo ${e.fallo}`);
    } finally { await p.cerrar(); }

    // D) Modelo 3D bloqueado en un equipo capaz: pasa a la composición final sin mover nada
    p = await abrirPagina({ ancho, alto, perfil: "normal", chrome: o.chrome });
    try {
      await p.cdp.send("Network.setBlockedURLs", { urls: ["*.glb"] });
      await p.ir(base + "index.html");
      await esperar(1000);
      const antes = await p.evaluar(ESTADO_MODOS);
      await p.esperarHasta("document.documentElement.dataset.hero === 'estatico'", 30000);
      await p.esperarHasta("document.documentElement.hasAttribute('data-abierto-listo')", 20000).catch(() => {});
      await esperar(1200);
      const e = await p.evaluar(ESTADO_MODOS);
      ok(antes.hero === "animado" && finalOk(e) && e.abierto === 1 && e.poster === 0 && !e.canvas, `3D bloqueado: de animado a estático final (apertura ${e.apertura}, abierto ${e.abierto}, póster ${e.poster}, sin canvas)`);
      ok(antes.cajas === e.cajas, `cabecera, cráneo y contacto no se mueven (${antes.cajas === e.cajas ? "idénticos" : antes.cajas + " → " + e.cajas})`);
    } finally { await p.cerrar(); }

    // E) Pérdida del contexto WebGL con el 3D ya mostrado
    p = await abrirPagina({ ancho, alto, perfil: "normal", chrome: o.chrome });
    try {
      await p.ir(base + "index.html");
      await p.esperarHasta("!!document.querySelector('.hero__canvas.is-listo')", 90000);
      await esperar(800);
      const antes = await p.evaluar(ESTADO_MODOS);
      await p.evaluar("(() => { const gl = document.querySelector('.hero__canvas').getContext('webgl2') || document.querySelector('.hero__canvas').getContext('webgl'); gl.getExtension('WEBGL_lose_context').loseContext(); })()");
      await p.esperarHasta("document.documentElement.dataset.hero === 'estatico'", 20000);
      await p.esperarHasta("document.documentElement.hasAttribute('data-abierto-listo')", 20000).catch(() => {});
      await esperar(1200);
      const e = await p.evaluar(ESTADO_MODOS);
      ok(antes.is3d && finalOk(e) && e.abierto === 1 && e.poster === 0 && !e.canvas, `contexto WebGL perdido: del 3D a la composición final (apertura ${e.apertura}, abierto ${e.abierto}, póster ${e.poster}, sin canvas)`);
      ok(antes.cajas === e.cajas, `cabecera, cráneo y contacto no se mueven (${antes.cajas === e.cajas ? "idénticos" : antes.cajas + " → " + e.cajas})`);
    } finally { await p.cerrar(); }
  }
  return fallos ? 1 : 0;
}

/** Utilidad de depuración: evalúa una expresión en la página. Uso: evaluar --tamano 390x844 --js "expresión" [--perfil p] [--ir ruta] */
async function evaluar(base, o) {
  const [ancho, alto] = String(o.tamano || "1440x900").split("x").map(Number);
  const pagina = await abrirPagina({ ancho, alto, perfil: o.perfil || "normal", chrome: o.chrome });
  try {
    await pagina.ir(base + (o.ir || "index.html"));
    await esperar(1500);
    console.log(JSON.stringify(await pagina.evaluar(String(o.js)), null, 2));
  } finally {
    await pagina.cerrar();
  }
}

/* ---------- Principal ---------- */

const { comando, opciones } = leerArgumentos(process.argv.slice(2));
const COMANDOS = { capturar, cajas, pantalla, comparar, transicion, evaluar, red, modos };
if (!COMANDOS[comando]) {
  console.error("Uso: hero.mjs capturar|cajas|pantalla|comparar [opciones]  (ver el encabezado del archivo)");
  process.exit(2);
}

let servidor = null;
let base = opciones.url;
if (!base) ({ servidor, url: base } = await servirRaiz());
if (!base.endsWith("/")) base += "/";
let codigo = 0;
try {
  const r = await COMANDOS[comando](base, opciones);
  if (typeof r === "number") codigo = r;
} catch (e) {
  console.error(e.message);
  codigo = 1;
} finally {
  if (servidor) servidor.close();
}
process.exit(codigo);
