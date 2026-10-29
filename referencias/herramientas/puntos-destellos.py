#!/usr/bin/env python3
"""Calcula las posiciones de los destellos sobre los dientes del hero (spec 003, research R7).

Lee la máscara alfa de las imágenes de dientes (cráneo cerrado y las dos variantes del abierto), elige N puntos sobre
píxeles opacos, alejados del borde y entre sí, y los imprime como CSS en % de .hero__poster-caja (el rectángulo del
póster). Las imágenes del cráneo abierto van desplazadas y escaladas dentro de esa caja: --abierto-izq/arr/ancho/alto
del CSS (dos juegos, < 1024 px y ≥ 1024 px), que se leen de css/estilos.css para convertir las coordenadas.

Uso: python puntos-destellos.py [-n 10] [--semilla 7]
Requiere Pillow. No es parte del sitio publicado.
"""
import argparse
import sys
import math
import random
import re
from pathlib import Path

from PIL import Image, ImageFilter

RAIZ = Path(__file__).resolve().parents[2]


def caja_abierto(css, escritorio):
    """(izq, arr, ancho, alto) en % de la caja, del bloque base o del @media (min-width: 1024px)."""
    if escritorio:
        m = re.search(r"@media \(min-width: 1024px\) \{\s*\.hero__poster-caja \{(.*?)\}", css, re.S)
    else:
        m = re.search(r"\.hero__poster-caja \{\s*/\*.*?\*/(.*?)\}", css, re.S)
    b = m.group(1)
    v = lambda n: float(re.search(r"--abierto-%s:\s*(-?[\d.]+)%%" % n, b).group(1))
    return v("izq"), v("arr"), v("ancho"), v("alto")


def puntos(ruta, n, semilla):
    im = Image.open(ruta).convert("RGBA")
    w, h = im.size
    esc = 200 / w
    mw, mh = int(w * esc), int(h * esc)
    alfa = im.split()[3].resize((mw, mh), Image.LANCZOS).point(lambda v: 255 if v > 200 else 0)
    interior = alfa.filter(ImageFilter.MinFilter(7))  # a ≥ 3 px del borde
    cand = [(x, y) for y in range(mh) for x in range(mw) if interior.getpixel((x, y))]
    rnd = random.Random(semilla)
    rnd.shuffle(cand)
    minimo = 0.12 * mw
    elegidos = []
    while len(elegidos) < n and minimo > 4:
        for c in cand:
            if all(math.hypot(c[0] - e[0], c[1] - e[1]) >= minimo for e in elegidos):
                elegidos.append(c)
                if len(elegidos) == n:
                    break
        minimo *= 0.85
    return [(x / mw, y / mh) for x, y in elegidos]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-n", type=int, default=10)
    ap.add_argument("--semilla", type=int, default=7)
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    css = (RAIZ / "css" / "estilos.css").read_text(encoding="utf-8")
    img = RAIZ / "assets" / "img"

    def bloque(sel, pts, mapa):
        out = []
        for i, (x, y) in enumerate(pts, 1):
            cx, cy = mapa(x, y)
            out.append("%s i:nth-child(%d) { --x: %.1f%%; --y: %.1f%%; }" % (sel, i, cx * 100, cy * 100))
        return "\n".join(out)

    ident = lambda x, y: (x, y)
    movil = caja_abierto(css, False)
    escri = caja_abierto(css, True)

    def en_caja(caja):
        izq, arr, ancho, alto = [c / 100 for c in caja]
        return lambda x, y: (izq + x * ancho, arr + y * alto)

    print("/* Cerrado: coordenadas = % de la caja del póster */")
    print(bloque(".hero__destellos--cerrado", puntos(img / "craneo-cerrado-dientes.webp", a.n, a.semilla), ident))
    print("\n/* Abierto, < 1024 px */")
    print(bloque(".hero__destellos--abierto", puntos(img / "craneo-abierto-movil-dientes.webp", a.n, a.semilla), en_caja(movil)))
    print("\n@media (min-width: 1024px) {")
    print(bloque("  .hero__destellos--abierto", puntos(img / "craneo-abierto-escritorio-dientes.webp", a.n, a.semilla), en_caja(escri)))
    print("}")


if __name__ == "__main__":
    main()
