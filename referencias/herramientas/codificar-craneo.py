#!/usr/bin/env python3
"""Codifica una captura del cráneo (hero.mjs capturar) como WebP <= 60 KB para assets/img/.

Specs/002-hero-estatico-scroll, contrato §7. No se publica.

  python referencias/herramientas/codificar-craneo.py --captura craneo-0-1440x900 \
      --recorte poster --capa hueso --salida assets/img/craneo-cerrado.webp
  python referencias/herramientas/codificar-craneo.py --captura craneo-0-1440x900 \
      --recorte poster --capa dientes --salida assets/img/craneo-cerrado-dientes.webp
  python referencias/herramientas/codificar-craneo.py --captura craneo-1-360x740 \
      --recorte recuadro --capa hueso --salida assets/img/craneo-abierto-movil.webp

--recorte poster   recorta exactamente el rectángulo del póster (proporción fija; es lo que calibra el 3D).
--recorte recuadro recorta la caja del cráneo de esa pose (puede exceder el póster; ya viene acotada al lienzo).
--capa hueso       el hueso solo, opaco, sobre blanco: la página lo mezcla con multiply sobre el fondo (como el 3D).
--capa dientes     los dientes solos con transparencia (alfa sin pérdida): se pintan encima, opacos y sin multiply,
                   para que sean blancos como en el 3D (con multiply se teñirían del color del fondo).
Ambas capas se recortan igual, de modo que comparten recuadro y desplazamiento. Se componen a partir de las tres
imágenes que guarda hero.mjs capturar (<captura>-hueso.png, -dientesBlanco.png y -dientesNegro.png).

Todas las medidas se escalan con la misma densidad (--ancho-poster = ancho en píxeles del rectángulo del
póster), de modo que el cráneo cerrado y el abierto tienen la misma nitidez. Imprime las constantes que
hay que copiar al CSS (recuadro y desplazamiento, en % del rectángulo del póster).
"""
import argparse
import io
import json
import os
import sys

from PIL import Image, ImageChops

AQUI = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(AQUI, "salida")


def leer(carpeta, captura, sufijo):
    return Image.open(os.path.join(carpeta, f"{captura}-{sufijo}.png")).convert("RGB")


def capa_dientes(carpeta, captura):
    """RGBa (alfa premultiplicado): sobre negro el render es color·alfa; sobre blanco, color·alfa + (1 - alfa)."""
    sobre_blanco = leer(carpeta, captura, "dientesBlanco")
    sobre_negro = leer(carpeta, captura, "dientesNegro")
    transparencia = ImageChops.subtract(sobre_blanco, sobre_negro).convert("L")   # 1 - alfa, igual en los tres canales
    alfa = ImageChops.invert(transparencia)
    canales = [ImageChops.darker(c, alfa) for c in sobre_negro.split()]
    return Image.merge("RGBa", (*canales, alfa))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--captura", required=True, help="nombre sin extensión en salida/ (p. ej. craneo-1-1440x900)")
    ap.add_argument("--recorte", choices=["poster", "recuadro"], required=True)
    ap.add_argument("--capa", choices=["hueso", "dientes"], default="hueso")
    ap.add_argument("--salida", required=True, help="ruta del WebP de destino")
    ap.add_argument("--ancho-poster", type=int, default=800, help="ancho en px del rectángulo del póster (densidad)")
    ap.add_argument("--max-kb", type=float, default=60.0)
    ap.add_argument("--calidad", type=int, default=80, help="calidad WebP de partida (baja de 5 en 5 hasta cumplir --max-kb)")
    ap.add_argument("--carpeta", default=SALIDA)
    a = ap.parse_args()

    datos = json.load(open(os.path.join(a.carpeta, a.captura + ".json"), encoding="utf-8"))
    if a.capa == "hueso":
        png = leer(a.carpeta, a.captura, "hueso").convert("RGBA").convert("RGBa")   # opaco: el premultiplicado no cambia nada
        fondo = (255, 255, 255, 255)
    else:
        png = capa_dientes(a.carpeta, a.captura)
        fondo = (0, 0, 0, 0)

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

    # Recorte en píxeles del PNG; lo que quede fuera del lienzo se rellena de blanco (hueso) o queda transparente (dientes)
    caja = [round(x * esc_png), round(y * esc_png), round((x + w) * esc_png), round((y + h) * esc_png)]
    recorte = Image.new("RGBa", (caja[2] - caja[0], caja[3] - caja[1]), fondo)
    recorte.paste(png, (-caja[0], -caja[1]))   # sin máscara: copia también el alfa

    factor = a.ancho_poster / p["w"]            # píxeles de salida por píxel CSS
    salida_w = max(1, round(w * factor))
    salida_h = max(1, round(h * factor))
    img = recorte.resize((salida_w, salida_h), Image.LANCZOS)
    img = img.convert("RGB") if a.capa == "hueso" else img.convert("RGBA")

    elegido = None
    for calidad in range(a.calidad, 29, -5):
        buf = io.BytesIO()
        opciones = {"alpha_quality": 100} if a.capa == "dientes" else {}
        img.save(buf, "WEBP", quality=calidad, method=6, **opciones)
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
