#!/usr/bin/env python3
"""Codifica una captura del cráneo (hero.mjs capturar) como WebP <= 60 KB para assets/img/.

Specs/002-hero-estatico-scroll, contrato §7. No se publica.

  python referencias/herramientas/codificar-craneo.py --captura craneo-0-1440x900 \
      --recorte poster --salida assets/img/craneo-cerrado.webp
  python referencias/herramientas/codificar-craneo.py --captura craneo-1-360x740 \
      --recorte recuadro --salida assets/img/craneo-abierto-movil.webp

--recorte poster   recorta exactamente el rectángulo del póster (proporción fija; es lo que calibra el 3D).
--recorte recuadro recorta la caja del cráneo de esa pose (puede exceder el póster; ya viene acotada al lienzo).

Todas las medidas se escalan con la misma densidad (--ancho-poster = ancho en píxeles del rectángulo del
póster), de modo que el cráneo cerrado y el abierto tienen la misma nitidez. Imprime las constantes que
hay que copiar al CSS (recuadro y desplazamiento, en % del rectángulo del póster).
"""
import argparse
import io
import json
import os
import sys

from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(AQUI, "salida")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--captura", required=True, help="nombre sin extensión en salida/ (p. ej. craneo-1-1440x900)")
    ap.add_argument("--recorte", choices=["poster", "recuadro"], required=True)
    ap.add_argument("--salida", required=True, help="ruta del WebP de destino")
    ap.add_argument("--ancho-poster", type=int, default=800, help="ancho en px del rectángulo del póster (densidad)")
    ap.add_argument("--max-kb", type=float, default=60.0)
    ap.add_argument("--carpeta", default=SALIDA)
    a = ap.parse_args()

    ruta_png = os.path.join(a.carpeta, a.captura + ".png")
    ruta_json = os.path.join(a.carpeta, a.captura + ".json")
    datos = json.load(open(ruta_json, encoding="utf-8"))
    png = Image.open(ruta_png).convert("RGB")

    lienzo = datos["lienzoPx"]
    p = datos["posterPx"]
    esc_png = png.width / lienzo["w"]          # píxeles del PNG por píxel CSS del lienzo

    if a.recorte == "poster":
        x, y, w, h = p["x"], p["y"], p["w"], p["h"]
    else:
        r = datos["recuadro"]
        x = p["x"] + r["izq"] / 100 * p["w"]
        y = p["y"] + r["arr"] / 100 * p["h"]
        w = r["ancho"] / 100 * p["w"]
        h = r["alto"] / 100 * p["h"]

    # Recorte en píxeles del PNG; lo que quede fuera del lienzo se rellena de blanco
    caja = [round(x * esc_png), round(y * esc_png), round((x + w) * esc_png), round((y + h) * esc_png)]
    recorte = Image.new("RGB", (caja[2] - caja[0], caja[3] - caja[1]), (255, 255, 255))
    recorte.paste(png, (-caja[0], -caja[1]))

    factor = a.ancho_poster / p["w"]            # píxeles de salida por píxel CSS
    salida_w = max(1, round(w * factor))
    salida_h = max(1, round(h * factor))
    img = recorte.resize((salida_w, salida_h), Image.LANCZOS)

    elegido = None
    for calidad in range(90, 29, -5):
        buf = io.BytesIO()
        img.save(buf, "WEBP", quality=calidad, method=6)
        kb = buf.tell() / 1024
        elegido = (calidad, kb, buf.getvalue())
        if kb <= a.max_kb:
            break
    calidad, kb, contenido = elegido
    os.makedirs(os.path.dirname(os.path.abspath(a.salida)), exist_ok=True)
    with open(a.salida, "wb") as f:
        f.write(contenido)

    print(f"{a.salida}: {salida_w} × {salida_h} px · calidad {calidad} · {kb:.1f} KB (límite {a.max_kb:.0f} KB)")
    if kb > a.max_kb:
        print("AVISO: no cabe en el límite con calidad 30; baja --ancho-poster", file=sys.stderr)
        sys.exit(1)
    if a.recorte == "recuadro":
        r = datos["recuadro"]
        d = datos["desplazamiento"]
        print("CSS (% del rectángulo del póster):")
        print(f"  --abierto-izq: {r['izq']:.2f}%; --abierto-arr: {r['arr']:.2f}%; "
              f"--abierto-ancho: {r['ancho']:.2f}%; --abierto-alto: {r['alto']:.2f}%;")
        print(f"  --despl-x: {d['x']:.2f}%; --despl-y: {d['y']:.2f}%;")
        print(f'  <img width="{salida_w}" height="{salida_h}">')


if __name__ == "__main__":
    main()
