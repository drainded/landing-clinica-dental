#!/usr/bin/env python3
"""Normaliza un SVG trazado (Inkscape) para publicarlo en la página: spec 003, research R4.

Qué hace, por archivo:
  1. lee los <path> (solo líneas: m l h v z, relativas o absolutas) y aplica el translate del grupo;
  2. simplifica cada subtrazado (Ramer–Douglas–Peucker) con una tolerancia en unidades del lienzo final;
  3. encaja el dibujo, centrado y con margen, en un viewBox cuadrado común (0 0 96 96 por defecto);
  4. escribe un SVG limpio (sin metadatos de Inkscape) con un único relleno y coordenadas relativas con 1 decimal.
Los dos <path> del original (dos capas del trazado, casi del mismo azul) se conservan como dos <path> con el mismo relleno
(unirlos en uno cambiaría el resultado donde los sentidos de giro se anulan).

Uso: python normalizar-svg.py ENTRADA.svg SALIDA.svg --fill #5CADFF [--margen 6] [--tol 0.12] [--lienzo 96] [--max-kb 30]
No es parte del sitio publicado (carpeta referencias/).
"""
import argparse
import math
import re
import sys

NUM = r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?"
TOKEN = re.compile(r"[MmLlHhVvZz]|" + NUM)


def leer_subtrazados(d):
    """Devuelve una lista de subtrazados; cada uno = (puntos absolutos, cerrado)."""
    tokens = TOKEN.findall(d)
    i = 0
    cmd = None
    x = y = 0.0
    inicio = (0.0, 0.0)
    subs = []
    actual = None

    def num():
        nonlocal i
        v = float(tokens[i])
        i += 1
        return v

    def cerrar():
        nonlocal actual, x, y
        if actual is not None and len(actual) > 1:
            subs.append((actual, True))
        actual = None
        x, y = inicio

    while i < len(tokens):
        t = tokens[i]
        if re.match(r"[A-Za-z]", t):
            cmd = t
            i += 1
            if cmd in "Zz":
                cerrar()
                continue
        elif cmd is None:
            raise ValueError("datos sin comando")
        if cmd in "Mm":
            if actual is not None and len(actual) > 1:
                subs.append((actual, False))
            dx, dy = num(), num()
            if cmd == "m":
                x, y = x + dx, y + dy
            else:
                x, y = dx, dy
            inicio = (x, y)
            actual = [(x, y)]
            cmd = "l" if cmd == "m" else "L"  # los pares siguientes son líneas
        elif cmd in "Ll":
            dx, dy = num(), num()
            x, y = (x + dx, y + dy) if cmd == "l" else (dx, dy)
            if actual is None:
                actual = [(inicio[0], inicio[1])]
            actual.append((x, y))
        elif cmd in "Hh":
            dx = num()
            x = x + dx if cmd == "h" else dx
            if actual is None:
                actual = [(inicio[0], inicio[1])]
            actual.append((x, y))
        elif cmd in "Vv":
            dy = num()
            y = y + dy if cmd == "v" else dy
            if actual is None:
                actual = [(inicio[0], inicio[1])]
            actual.append((x, y))
        else:
            raise ValueError("comando no admitido: " + cmd)
    if actual is not None and len(actual) > 1:
        subs.append((actual, False))
    return subs


def rdp(pts, tol):
    """Ramer–Douglas–Peucker iterativo (sin recursión)."""
    n = len(pts)
    if n < 3:
        return pts[:]
    mantener = [False] * n
    mantener[0] = mantener[-1] = True
    pila = [(0, n - 1)]
    while pila:
        a, b = pila.pop()
        ax, ay = pts[a]
        bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        long2 = dx * dx + dy * dy
        mayor, idx = -1.0, -1
        for k in range(a + 1, b):
            px, py = pts[k]
            if long2 == 0:
                dist = math.hypot(px - ax, py - ay)
            else:
                dist = abs(dy * (px - ax) - dx * (py - ay)) / math.sqrt(long2)
            if dist > mayor:
                mayor, idx = dist, k
        if mayor > tol:
            mantener[idx] = True
            pila.append((a, idx))
            pila.append((idx, b))
    return [p for p, m in zip(pts, mantener) if m]


def area(pts):
    s = 0.0
    for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]):
        s += x1 * y2 - x2 * y1
    return s / 2


def num_txt(v):
    t = ("%.1f" % v).rstrip("0").rstrip(".")
    if t in ("-0", ""):
        t = "0"
    if t.startswith("0.") :
        t = t[1:]
    elif t.startswith("-0."):
        t = "-" + t[2:]
    return t


def a_d(subs):
    """Subtrazados (puntos absolutos en unidades del lienzo) -> atributo d con M absoluto y l relativos redondeados."""
    partes = []
    for pts, cerrado in subs:
        rx, ry = round(pts[0][0], 1), round(pts[0][1], 1)
        seg = ["M%s %s" % (num_txt(rx), num_txt(ry))]
        rel = []
        for px, py in pts[1:]:
            qx, qy = round(px, 1), round(py, 1)
            dx, dy = round(qx - rx, 1), round(qy - ry, 1)
            if dx == 0 and dy == 0:
                continue
            rel.append("%s %s" % (num_txt(dx), num_txt(dy)))
            rx, ry = qx, qy
        if rel:
            seg.append("l" + " ".join(rel))
        if cerrado:
            seg.append("z")
        partes.append("".join(seg))
    return "".join(partes).replace(" -", "-")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("entrada")
    ap.add_argument("salida")
    ap.add_argument("--fill", required=True)
    ap.add_argument("--margen", type=float, default=6)
    ap.add_argument("--tol", type=float, default=0.12)
    ap.add_argument("--lienzo", type=int, default=96)
    ap.add_argument("--max-kb", type=float, default=30)
    ap.add_argument("--area-min", type=float, default=0.4, help="descarta subtrazados de menos de N unidades²")
    a = ap.parse_args()

    svg = open(a.entrada, encoding="utf-8").read()
    m = re.search(r'transform="translate\(([-\d.eE+]+)[ ,]([-\d.eE+]+)\)"', svg)
    tx, ty = (float(m.group(1)), float(m.group(2))) if m else (0.0, 0.0)
    ds = re.findall(r'<path[^>]*?\sd="([^"]*)"', svg)
    if not ds:
        sys.exit("sin <path>: " + a.entrada)
    capas = []
    for d in ds:
        capas.append([([(x + tx, y + ty) for x, y in pts], c) for pts, c in leer_subtrazados(d)])

    xs = [x for capa in capas for pts, _ in capa for x, _ in pts]
    ys = [y for capa in capas for pts, _ in capa for _, y in pts]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    util = a.lienzo - 2 * a.margen
    esc = util / max(x1 - x0, y1 - y0)
    ox = (a.lienzo - (x1 - x0) * esc) / 2
    oy = (a.lienzo - (y1 - y0) * esc) / 2

    def mapear(pt):
        return ((pt[0] - x0) * esc + ox, (pt[1] - y0) * esc + oy)

    rutas = []
    for capa in capas:
        subs = []
        for pts, cerrado in capa:
            p = [mapear(q) for q in pts]
            if cerrado and p[0] == p[-1]:
                p = p[:-1]
            p = rdp(p, a.tol) if not cerrado else rdp(p + [p[0]], a.tol)[:-1]
            if len(p) < 2 or (cerrado and abs(area(p)) < a.area_min):
                continue
            subs.append((p, cerrado))
        rutas.append(a_d(subs))

    L = a.lienzo
    paths = "".join('<path d="%s"/>' % d for d in rutas if d)
    out = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" fill="%s">%s</svg>'
           % (L, L, L, L, a.fill, paths))
    with open(a.salida, "w", encoding="utf-8", newline="") as f:
        f.write(out)
    kb = len(out.encode("utf-8")) / 1024
    print("%-34s %6.1f KB  (original %6.1f KB)%s" % (
        a.salida.replace("\\", "/").split("/")[-1], kb, len(svg.encode("utf-8")) / 1024,
        "  ⚠ supera --max-kb" if kb > a.max_kb else ""))


if __name__ == "__main__":
    main()
