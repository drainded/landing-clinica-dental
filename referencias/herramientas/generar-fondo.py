#!/usr/bin/env python3
"""Genera los fondos del hero estático (PC y móvil) a partir de la imagen original del cliente.

Specs/002-hero-estatico-scroll, contrato §7 y research R7. No se publica.

  python referencias/herramientas/generar-fondo.py                  # camino A: ampliar y limpiar la original
  python referencias/herramientas/generar-fondo.py --medir          # contraste de los textos sobre cada fondo

Camino A: recorte de la original → ampliación → suavizado de los bloques JPEG → afinado de los hilos → aclarado
de las zonas oscuras que quedan detrás de los textos (franja central) → fundido de los bordes superior e inferior
al color del token --color-velo-fondo → ruido mínimo anti-bandas → WebP. (Resultado: los hilos salen blandos y con
textura de bloques JPEG; no pasa la revisión al 200 %. Se conserva solo como referencia.)

Camino B (el que se usa): recomposición procedural en el mismo estilo que la original (velos azules translúcidos
sobre blanco, una banda oscura lateral, hilos finos que convergen en un punto): velos suaves a baja resolución y
hilos dibujados a la resolución final con antialiasing (sobremuestreo x3), con los colores de los tokens. Cada formato
(PC apaisado y móvil vertical) tiene su propia composición y las zonas de texto quedan claras.

Los colores salen de los tokens de css/estilos.css (no hay colores literales aquí), excepto el blanco puro
que solo sirve de referencia matemática al mezclar.
"""
import argparse
import io
import os
import random
import re
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, "..", ".."))
ORIGINALES = [os.path.join(AQUI, "fuentes", "fondo-hero-estatico.jpg")]
SALIDA = os.path.join(RAIZ, "assets", "img")
TAMANOS = {"pc": (1920, 1080), "movil": (828, 1792)}
LIMITE_KB = {"pc": 80, "movil": 50}
NOMBRES = {"pc": "fondo-hero-pc.webp", "movil": "fondo-hero-movil.webp"}


def token(nombre):
    css = open(os.path.join(RAIZ, "css", "estilos.css"), encoding="utf-8").read()
    m = re.search(r"--" + re.escape(nombre) + r":\s*#([0-9a-fA-F]{6})", css)
    if not m:
        sys.exit(f"No encuentro el token --{nombre} en css/estilos.css")
    h = m.group(1)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mezclar(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def abrir_original():
    for ruta in ORIGINALES:
        if os.path.exists(ruta):
            return Image.open(ruta).convert("RGB")
    sys.exit("No encuentro fondo-hero-estatico.jpg")


def recortar(img, destino, ancla):
    """Recorte de la original con la proporción del destino; ancla = posición horizontal (0–1) del recorte."""
    w, h = img.size
    dw, dh = destino
    if dw / dh > w / h:                      # destino más apaisado: se recorta el alto
        ch = round(w * dh / dw)
        top = (h - ch) // 2
        return img.crop((0, top, w, top + ch))
    cw = round(h * dw / dh)                  # destino más vertical: se recorta el ancho
    left = round((w - cw) * ancla)
    return img.crop((left, 0, left + cw, h))


def mascara_central(tam, ancho_rel, suavidad):
    """Máscara 0–255 con una columna central clara (donde van los textos) y bordes que caen suavemente."""
    w, h = tam
    m = Image.new("L", tam, 0)
    d = ImageDraw.Draw(m)
    mitad = ancho_rel * w / 2
    d.rectangle((w / 2 - mitad, 0, w / 2 + mitad, h), fill=255)
    return m.filter(ImageFilter.GaussianBlur(suavidad * w))


def degradado_vertical(tam, borde, ceja):
    """Máscara 0–255 que vale 255 en los bordes superior e inferior (borde = fracción del alto) y 0 en el centro."""
    w, h = tam
    g = Image.new("L", (1, h))
    px = g.load()
    for y in range(h):
        t = min(y, h - 1 - y) / (h * borde)
        px[0, y] = round(255 * max(0.0, 1.0 - t) ** ceja)
    return g.resize(tam)


def camino_a(clave, ancla):
    destino = TAMANOS[clave]
    orig = abrir_original()
    img = recortar(orig, destino, ancla)
    # Suaviza los bloques de la compresión JPEG antes de ampliar y recupera la definición de los hilos después
    img = img.filter(ImageFilter.GaussianBlur(0.5))
    img = img.resize(destino, Image.LANCZOS)
    img = img.filter(ImageFilter.UnsharpMask(radius=2.2, percent=70, threshold=2))

    fondo = token("color-velo-fondo")
    velo1 = token("color-velo-1")
    suelo = mezclar(velo1, fondo, 0.5)        # luminancia mínima detrás del horario (L ≥ 0,64 con holgura)

    # Aclara lo que haya más oscuro que el suelo, solo en la franja central donde van los textos
    claro = ImageChops.lighter(img, Image.new("RGB", destino, suelo))
    centro = mascara_central(destino, 0.62 if clave == "pc" else 1.4, 0.10 if clave == "pc" else 0.20)
    img = Image.composite(claro, img, centro)

    # Bordes superior e inferior al color del token (se funden con la franja del hero anclado en móvil)
    img = Image.composite(Image.new("RGB", destino, fondo), img, degradado_vertical(destino, 0.08, 1.4))

    # Ruido mínimo contra las bandas de los degradados
    random.seed(7)
    ruido = Image.effect_noise(destino, 3).convert("RGB")
    img = ImageChops.add(img, ruido, scale=1.0, offset=-128)
    return img


# ---------- Camino B: recomposición procedural ----------

def bezier(p0, p1, p2, p3, n=300):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        pts.append((u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
                    u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1]))
    return pts


def a_px(pts, tam, factor=1.0):
    return [(x * tam[0] * factor, y * tam[1] * factor) for x, y in pts]


def velo(tam, borde_a, borde_b, tinte, alfa, desenfoque):
    """Cinta translúcida entre dos curvas (en fracciones), con bordes suaves; se compone a 1/4 de resolución."""
    sw, sh = max(1, tam[0] // 4), max(1, tam[1] // 4)
    m = Image.new("L", (sw, sh), 0)
    poligono = a_px(borde_a, (sw, sh)) + a_px(list(reversed(borde_b)), (sw, sh))
    ImageDraw.Draw(m).polygon(poligono, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(desenfoque * sw)).resize(tam, Image.BICUBIC)
    return m.point(lambda v: round(v * alfa)), tinte


def hilo(capa, pts, tam, color, ancho, alfa, ss):
    """Dibuja una curva fina sobre una capa RGBA sobremuestreada ×ss."""
    ImageDraw.Draw(capa).line(a_px(pts, tam, ss), fill=color + (alfa,), width=max(1, round(ancho * ss)), joint="curve")


def composicion(clave):
    """Curvas y velos de cada formato, en fracciones del ancho y del alto."""
    if clave == "pc":
        P = (0.11, 0.51)
        arriba = bezier(P, (0.35, 0.38), (0.65, 0.25), (1.03, 0.28))
        abajo = bezier(P, (0.40, 0.62), (0.80, 0.80), (1.03, 0.84))
        velos = [
            (bezier((-0.02, 0.00), (0.40, 0.05), (0.80, 0.10), (1.03, 0.12)), bezier((-0.02, 0.30), (0.35, 0.22), (0.70, 0.18), (1.03, 0.20)), "velo1", 0.30, 0.060),
            (arriba, abajo, "velo1", 0.50, 0.035),
            (bezier((0.00, 0.50), (0.05, 0.505), (0.12, 0.505), P), bezier((0.00, 0.545), (0.06, 0.55), (0.12, 0.54), P), "velo2", 0.45, 0.018),
            (bezier((0.40, 0.486), (0.60, 0.478), (0.85, 0.462), (1.03, 0.452)), bezier((0.40, 0.486), (0.60, 0.494), (0.85, 0.508), (1.03, 0.516)), "velo2", 0.75, 0.010),
            (bezier((0.55, 0.488), (0.72, 0.482), (0.90, 0.474), (1.03, 0.470)), bezier((0.55, 0.488), (0.72, 0.494), (0.90, 0.502), (1.03, 0.506)), "rayosx", 0.45, 0.006),
            (bezier((0.55, 0.66), (0.80, 0.70), (0.95, 0.71), (1.03, 0.71)), bezier((0.62, 0.86), (0.85, 0.90), (0.95, 0.92), (1.03, 0.92)), "velo1", 0.32, 0.050),
            (bezier((0.78, 0.118), (0.86, 0.104), (0.94, 0.088), (1.03, 0.070)), bezier((0.78, 0.118), (0.86, 0.130), (0.94, 0.148), (1.03, 0.170)), "velo2", 0.50, 0.014),
        ]
        hilos = [
            (bezier((-0.02, 0.02), (0.30, 0.28), (0.55, 0.75), (1.03, 0.84)), "velo2", 1.5, 235),
            (bezier((-0.02, 0.05), (0.30, 0.31), (0.55, 0.78), (1.03, 0.87)), "velo2", 1.0, 150),
            (bezier((-0.02, 0.08), (0.30, 0.33), (0.55, 0.80), (1.03, 0.89)), "rayosx", 0.8, 70),
            (arriba, "velo2", 1.2, 170),
            (abajo, "velo2", 1.4, 200),
            (bezier(P, (0.38, 0.58), (0.70, 0.77), (1.03, 0.80)), "velo2", 0.8, 110),
            (bezier((-0.02, 0.01), (0.40, 0.07), (0.80, 0.22), (1.03, 0.32)), "velo2", 0.8, 90),
            (bezier((0.05, 0.00), (0.45, 0.06), (0.82, 0.20), (1.03, 0.29)), "velo2", 0.7, 70),
        ]
        brillos = [
            (bezier((-0.02, 0.03), (0.30, 0.29), (0.55, 0.76), (1.03, 0.85)), 1.0, 170),
            (arriba, 0.8, 130),
        ]
        centro = (0.62, 0.30)      # ancho relativo de la franja de textos y suavidad
    else:
        P = (-0.04, 0.55)
        arriba = bezier(P, (0.30, 0.46), (0.65, 0.40), (1.04, 0.41))
        abajo = bezier(P, (0.30, 0.60), (0.70, 0.69), (1.04, 0.72))
        velos = [
            (bezier((-0.02, 0.00), (0.35, 0.03), (0.70, 0.07), (1.04, 0.09)), bezier((-0.02, 0.22), (0.30, 0.15), (0.65, 0.12), (1.04, 0.14)), "velo1", 0.28, 0.080),
            (arriba, abajo, "velo1", 0.50, 0.050),
            (bezier((-0.04, 0.545), (0.02, 0.55), (0.08, 0.55), (0.14, 0.552)), bezier((-0.04, 0.575), (0.02, 0.58), (0.08, 0.575), (0.14, 0.565)), "velo2", 0.45, 0.025),
            (bezier((0.46, 0.356), (0.66, 0.350), (0.86, 0.336), (1.04, 0.325)), bezier((0.46, 0.356), (0.66, 0.362), (0.86, 0.376), (1.04, 0.388)), "velo2", 0.65, 0.012),
            (bezier((0.55, 0.78), (0.80, 0.80), (0.95, 0.82), (1.04, 0.82)), bezier((0.60, 0.92), (0.82, 0.94), (0.95, 0.95), (1.04, 0.95)), "velo1", 0.30, 0.070),
        ]
        hilos = [
            (bezier((-0.02, 0.10), (0.25, 0.28), (0.45, 0.66), (1.04, 0.74)), "velo2", 1.6, 235),
            (bezier((-0.02, 0.125), (0.25, 0.305), (0.45, 0.685), (1.04, 0.765)), "velo2", 1.1, 150),
            (bezier((-0.02, 0.15), (0.25, 0.33), (0.45, 0.705), (1.04, 0.785)), "rayosx", 0.9, 70),
            (arriba, "velo2", 1.3, 170),
            (abajo, "velo2", 1.5, 200),
            (bezier((-0.02, 0.07), (0.30, 0.12), (0.70, 0.22), (1.04, 0.28)), "velo2", 0.9, 90),
        ]
        brillos = [
            (bezier((-0.02, 0.11), (0.25, 0.29), (0.45, 0.67), (1.04, 0.75)), 1.1, 170),
            (arriba, 0.9, 130),
        ]
        centro = (0.74, 0.22)
    return velos, hilos, brillos, centro


def camino_b(clave):
    tam = TAMANOS[clave]
    colores = {"velo1": token("color-velo-1"), "velo2": token("color-velo-2"), "rayosx": token("color-rayosx"),
               "fondo": token("color-velo-fondo"), "blanco": token("color-superficie")}
    velos, hilos, brillos, (ancho_centro, suavidad) = composicion(clave)
    img = Image.new("RGB", tam, colores["fondo"])

    # 1) Velos translúcidos de bordes suaves
    for borde_a, borde_b, tinte, alfa, desenfoque in velos:
        mascara, color = velo(tam, borde_a, borde_b, colores[tinte], alfa, desenfoque)
        img = Image.composite(Image.new("RGB", tam, color), img, mascara)

    # 2) Hilos finos dibujados a la resolución final (sobremuestreo ×3) y reflejos de luz junto a ellos
    ss = 3
    capa = Image.new("RGBA", (tam[0] * ss, tam[1] * ss), (0, 0, 0, 0))
    escala_px = tam[0] / 1920 if clave == "pc" else tam[0] / 828 * 1.35
    for pts, nombre, ancho, alfa in hilos:
        hilo(capa, pts, tam, colores[nombre], ancho * escala_px, alfa, ss)
    for pts, ancho, alfa in brillos:
        desplazado = [(x + 0.0016, y - 0.0012) for x, y in pts]
        hilo(capa, desplazado, tam, colores["blanco"], ancho * escala_px, alfa, ss)
    capa = capa.resize(tam, Image.LANCZOS)
    # Detrás de los textos los hilos se atenúan para no restar contraste
    franja = mascara_central(tam, ancho_centro, suavidad * 0.5)
    alfa_capa = ImageChops.multiply(capa.getchannel("A"), franja.point(lambda v: 255 - round(v * 0.75)))
    capa.putalpha(alfa_capa)
    img = Image.alpha_composite(img.convert("RGBA"), capa).convert("RGB")

    # 3) Franja central siempre clara (luminancia mínima de los textos), bordes al color del token, ruido anti-bandas
    suelo = mezclar(colores["velo1"], colores["fondo"], 0.5)
    claro = ImageChops.lighter(img, Image.new("RGB", tam, suelo))
    img = Image.composite(claro, img, mascara_central(tam, ancho_centro, suavidad))
    img = Image.composite(Image.new("RGB", tam, colores["fondo"]), img, degradado_vertical(tam, 0.08, 1.4))
    ruido = Image.effect_noise(tam, 3).convert("RGB")
    return ImageChops.add(img, ruido, scale=1.0, offset=-128)


# ---------- Medición del contraste de los textos sobre el fondo ----------

UMBRAL_CONTRASTE = 4.5
ZONAS_TEXTO = ["titulo", "eslogan", "telefono", "horario"]   # el botón lleva su propio fondo


def lineal(c):
    c = c / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminancia(rgb):
    return 0.2126 * lineal(rgb[0]) + 0.7152 * lineal(rgb[1]) + 0.0722 * lineal(rgb[2])


def medir(carpeta):
    """Contraste de cada texto del hero contra el fondo real que tiene detrás (recorte cover del escenario).

    Usa las cajas de hero.mjs cajas (salida/cajas-<ancho>x<alto>.json). Se evalúa el percentil 2 de la
    luminancia del fondo bajo cada caja (los hilos de 1 px no cuentan como fondo) y también el mínimo."""
    import glob
    import json
    archivos = sorted(glob.glob(os.path.join(carpeta, "cajas-*.json")))
    if not archivos:
        sys.exit("No hay cajas-*.json: ejecuta antes  node referencias/herramientas/hero.mjs cajas")
    imagenes = {c: Image.open(os.path.join(SALIDA, NOMBRES[c])).convert("RGB") for c in NOMBRES}
    print("tamaño       zona      contraste p2   contraste mín   resultado")
    fallos = 0
    for ruta in archivos:
        d = json.load(open(ruta, encoding="utf-8"))
        ancho, alto = d["ancho"], d["alto"]
        img = imagenes["movil" if alto >= ancho else "pc"]
        esc = d["escenario"]
        escala = max(esc["w"] / img.width, esc["h"] / img.height)       # background-size: cover, centrado
        desx = (esc["w"] - img.width * escala) / 2
        desy = (esc["h"] - img.height * escala) / 2
        for zona in ZONAS_TEXTO:
            c = d[zona]
            m = re.match(r"rgba?\((\d+),\s*(\d+),\s*(\d+)", c["color"])
            texto = luminancia(tuple(int(m.group(i)) for i in (1, 2, 3)))
            x0 = max(0, int((c["x"] - esc["x"] - desx) / escala))
            y0 = max(0, int((c["y"] - esc["y"] - desy) / escala))
            x1 = min(img.width, int((c["x"] - esc["x"] + c["w"] - desx) / escala) + 1)
            y1 = min(img.height, int((c["y"] - esc["y"] + c["h"] - desy) / escala) + 1)
            if x1 <= x0 or y1 <= y0:
                continue
            valores = sorted(luminancia(p) for p in img.crop((x0, y0, x1, y1)).getdata())
            p2 = valores[int(len(valores) * 0.02)]
            minimo = valores[0]
            cp2 = (p2 + 0.05) / (texto + 0.05)
            cmin = (minimo + 0.05) / (texto + 0.05)
            ok = cp2 >= UMBRAL_CONTRASTE
            fallos += 0 if ok else 1
            print(f"{ancho:>4}×{alto:<5}  {zona:<9}  {cp2:>9.2f}      {cmin:>9.2f}       {'OK' if ok else 'FALLA'}")
    print("Todos los textos cumplen 4,5 : 1" if not fallos else f"{fallos} caja(s) por debajo de 4,5 : 1")
    return fallos == 0


def guardar(img, clave):
    ruta = os.path.join(SALIDA, NOMBRES[clave])
    limite = LIMITE_KB[clave]
    elegido = None
    for calidad in range(90, 29, -5):
        buf = io.BytesIO()
        img.save(buf, "WEBP", quality=calidad, method=6)
        kb = buf.tell() / 1024
        elegido = (calidad, kb, buf.getvalue())
        if kb <= limite:
            break
    calidad, kb, datos = elegido
    with open(ruta, "wb") as f:
        f.write(datos)
    print(f"{os.path.relpath(ruta, RAIZ)}: {img.size[0]} × {img.size[1]} px · calidad {calidad} · {kb:.1f} KB (límite {limite} KB)")
    return kb <= limite


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--camino", choices=["a", "b"], default="b")
    ap.add_argument("--ancla-movil", type=float, default=0.1, help="posición horizontal (0–1) del recorte vertical")
    ap.add_argument("--solo", choices=["pc", "movil"])
    ap.add_argument("--medir", action="store_true", help="mide el contraste de los textos con las cajas de hero.mjs cajas")
    ap.add_argument("--carpeta-cajas", default=os.path.join(AQUI, "salida"))
    ap.add_argument("--vista", help="guarda además PNG sin comprimir en esta carpeta")
    a = ap.parse_args()
    if a.medir:
        sys.exit(0 if medir(a.carpeta_cajas) else 1)
    ok = True
    for clave in ("pc", "movil"):
        if a.solo and a.solo != clave:
            continue
        img = camino_a(clave, a.ancla_movil) if a.camino == "a" else camino_b(clave)
        if a.vista:
            os.makedirs(a.vista, exist_ok=True)
            img.save(os.path.join(a.vista, f"fondo-{clave}.png"))
        ok = guardar(img, clave) and ok
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
