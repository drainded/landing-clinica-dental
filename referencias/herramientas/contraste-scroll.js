/* Contraste y continuidad del fondo a lo largo del scroll (spec 003, SC-001 y SC-002).
 *
 * Se pega en la consola del navegador (o con javascript_tool del panel de vista previa) con la página cargada:
 *   contrasteScroll({ paso: 100 }).then(console.table)
 * Para cada posición de scroll (cada `paso` px) calcula:
 *   - el contraste más bajo de los textos visibles (fuera del hero, que tiene fondo de imagen) frente a su fondo real:
 *     se compone el fondo de los ancestros (con transparencias) sobre la capa fija .fondo-continuo (o el fondo de <body>);
 *   - la luminosidad L* del fondo (0–100) y su salto frente a la muestra anterior (SC-002: ≤ 8 por cada 50 px).
 *   Las estrellas de reseñas se excluyen (gráfico decorativo con aria-label).
 * Umbral: 4,5 : 1 (3 : 1 para texto grande: ≥ 24 px, o ≥ 18,66 px en negrita). No es parte del sitio publicado.
 */
window.contrasteScroll = async function (opciones) {
  const paso = (opciones && opciones.paso) || 100;
  const espera = (opciones && opciones.espera) || 120;

  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return [0, 0, 0, 0];
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(parseFloat);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  };
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const mezcla = (arriba, abajo) => {
    const a = arriba[3];
    return [0, 1, 2].map((i) => arriba[i] * a + abajo[i] * (1 - a)).concat([1]);
  };
  const contraste = (a, b) => {
    const la = lum(a), lb = lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };

  const capa = document.querySelector('.fondo-continuo');
  const base = () => {
    const c = parse(getComputedStyle(capa || document.body).backgroundColor);
    return c[3] ? [c[0], c[1], c[2], 1] : [255, 255, 255, 1];
  };
  const fondoDe = (el) => {
    const capas = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c[3] > 0) capas.push(c);
      if (c[3] >= 0.99) break;
    }
    let fondo = capas.length && capas[capas.length - 1][3] >= 0.99 ? capas.pop() : base();
    while (capas.length) fondo = mezcla(capas.pop(), fondo);
    return fondo;
  };

  // Luminosidad perceptual CIELAB L* (0–100): mide mejor lo que se ve que la luminancia relativa
  const lstar = (c) => { const y = lum(c); return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (24389 / 27) * y; };
  const comportamiento = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';   // el scroll suave de la página retrasaría las muestras
  const resultados = [];
  const alto = window.innerHeight;
  const total = document.documentElement.scrollHeight - alto;
  let anterior = null;
  for (let y = 0; y <= total + paso; y += paso) {
    window.scrollTo(0, Math.min(y, total));
    await new Promise((r) => setTimeout(r, espera));
    const b = base();
    const lb = Math.round(lstar(b) * 10) / 10;   // luminosidad L* del fondo, 0–100
    let peor = { c: 99, texto: '' };
    const candidatos = document.querySelectorAll('h1,h2,h3,p,a,li,span,strong,figcaption');
    candidatos.forEach((el) => {
      if (el.closest('.hero, .fondo-continuo, .resenas__estrellas') || el.classList.contains('resenas__estrellas') || !el.childNodes.length) return;
      const tieneTexto = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!tieneTexto) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > alto || r.width === 0 || r.height === 0) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') return;
      const fg = parse(cs.color);
      const fondo = fondoDe(el);
      const color = mezcla(fg, fondo);
      const grande = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
      const c = contraste(color, fondo);
      const relativo = grande ? c / 3 * 4.5 : c;   // normaliza al umbral de 4,5 para comparar
      if (relativo < peor.c) peor = { c: relativo, texto: (el.textContent || '').trim().slice(0, 40), real: c, grande };
    });
    resultados.push({
      y: Math.min(y, total),
      fondo: 'rgb(' + b.slice(0, 3).map(Math.round).join(',') + ')',
      luminosidad: lb,
      salto: anterior === null ? 0 : Math.round(Math.abs(lb - anterior) * 10) / 10,
      peorContraste: peor.c === 99 ? '—' : Math.round(peor.real * 100) / 100,
      umbral: peor.grande ? 3 : 4.5,
      ok: peor.c === 99 || peor.c >= 4.5,
      texto: peor.texto,
    });
    anterior = lb;
  }
  const fallos = resultados.filter((r) => !r.ok);
  resultados.resumen = {
    muestras: resultados.length,
    fallos: fallos.length,
    saltoMaximo: Math.max.apply(null, resultados.map((r) => r.salto)),
  };
  window.scrollTo(0, 0);
  document.documentElement.style.scrollBehavior = comportamiento;
  return resultados;
};
