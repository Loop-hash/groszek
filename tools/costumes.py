"""Przebrania Groszosława dla kuchni świata: piksele w ASCII nakładane na duszka z app/www/js/pixels.js.

python3 tools/costumes.py              zapisuje app/www/js/costumes-data.js
python3 tools/costumes.py podglad.png  dodatkowo rysuje podgląd wszystkich przebrań (wymaga Pillow)

Duszek 24x24 trafia na płótno 32x38 (przesunięty o OX, OY), żeby zmieściły się kapelusze i rekwizyty.
Znaki: '.' bez zmian, '#' tusz, 'o' papier, 'r' czerwony detal (bez czerwonych akcentów: tusz),
'c' rumieniec (bez akcentów: papier), 'x' przezroczyste.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PIXELS = os.path.join(HERE, "..", "app", "www", "js", "pixels.js")
OUT = os.path.join(HERE, "..", "app", "www", "js", "costumes-data.js")
W, H = 32, 38
OX, OY = 4, 10
MOODS = ("pea", "happy", "worried")


def sprites():
    src = open(PIXELS, encoding="utf-8").read()
    block = src[src.index("export const SPRITES = {"):]
    block = block[:block.index("\n};")]
    out = {}
    for m in re.finditer(r"(\w+): \[(.*?)\]", block):
        out[m.group(1)] = re.findall(r"'([^']*)'", m.group(2))
    return out


SPR = sprites()


def base(mood):
    c = [["."] * W for _ in range(H)]
    for y, row in enumerate(SPR[mood]):
        for x, ch in enumerate(row):
            if ch != ".":
                c[OY + y][OX + x] = ch
    return c


def put(c, x0, y0, rows):
    for dy, row in enumerate(rows):
        for dx, ch in enumerate(row):
            if ch == ".":
                continue
            x, y = x0 + dx, y0 + dy
            if 0 <= x < W and 0 <= y < H:
                c[y][x] = "." if ch == "x" else ch


def clear(c, x0, y0, x1, y1):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            c[y][x] = "."


def sprout_off(c):
    clear(c, OX + 11, OY + 0, OX + 16, OY + 5)


def interior(c, y, ch, x0=0, x1=W - 1):
    """Papier między pierwszym a ostatnim '#' w wierszu y (w granicach x0..x1) zamienia na ch."""
    xs = [x for x in range(W) if c[y][x] == "#"]
    if len(xs) < 2:
        return
    for x in range(max(xs[0] + 1, x0), min(xs[-1], x1 + 1)):
        if c[y][x] == "o":
            c[y][x] = ch


# ---------- przebrania ----------

def napoleon(c):
    """Francja: czarny bikorn z kokardą i napoleonka w ręce."""
    sprout_off(c)
    put(c, 6, 11, [
        "........####........",
        ".....##########.....",
        "...##############...",
        "..#########rr#######",
        ".##########rr######.",
        "####################",
        "##................##",
    ])
    put(c, 24, 26, ["##"])
    put(c, 26, 21, [
        "######",
        "#o#o##",
        "######",
        "#oooo#",
        "#oooo#",
        "######",
        "#o#o##",
        "######",
    ])


def sokrates(c):
    """Grecja: popiersie na jońskiej kolumnie, bujna broda i dymek z pytajnikiem."""
    clear(c, 0, OY + 21, W - 1, H - 1)
    put(c, 8, 30, [
        "..############..",
        ".#oo#oooooo#oo#.",
        "#o##oooooooo##o#",
        ".##.########.##.",
        "...#o#o#o#o#o#..",
        "...#o#o#o#o#o#..",
        "...#o#o#o#o#o#..",
        "..############..",
    ])
    put(c, 10, 24, [
        "..##....##..",
        ".#oo####oo#.",
        "#oooooooooo#",
        "#o#oo##oo#o#",
        "#oooooooooo#",
        ".#o#oooo#o#.",
        "..#oo##oo#..",
    ])
    put(c, 22, 2, [
        ".#####.",
        "#ooooo#",
        "#o###o#",
        "#ooo#o#",
        "#oo#oo#",
        "#ooooo#",
        "#oo#oo#",
        ".#####.",
        "..#....",
        ".#.....",
    ])


def lincoln(c):
    """USA: cylinder, broda wzdłuż żuchwy i miedziany cent."""
    sprout_off(c)
    put(c, 10, 8, [
        "..########..",
        "..########..",
        "..########..",
        "..########..",
        "..########..",
        "..rrrrrrrr..",
        "..########..",
        "############",
        "############",
    ])
    for y in range(OY + 17, OY + 21):
        interior(c, y, "#")
    for y in range(OY + 13, OY + 17):
        xs = [x for x in range(OX, OX + 24) if c[y][x] == "#"]
        c[y][xs[0] + 1] = "#"
        c[y][xs[-1] - 1] = "#"
    put(c, 24, 25, ["##"])
    put(c, 25, 21, [
        "..rrr..",
        ".rrorr.",
        "rroorrr",
        "rrrorrr",
        "rrrorrr",
        ".rooor.",
        "..rrr..",
    ])


def luchador(c):
    """Meksyk: maska lucha libre z białymi polami wokół oczu."""
    for y in range(OY + 7, OY + 14):
        interior(c, y, "r", x0=OX + 5, x1=OX + 18)
    for y in range(OY + 10, OY + 14):
        for x in list(range(OX + 7, OX + 11)) + list(range(OX + 13, OX + 17)):
            if c[y][x] == "r":
                c[y][x] = "o"
    for y in range(OY + 7, OY + 10):
        for x in (OX + 11, OX + 12):
            if c[y][x] == "r":
                c[y][x] = "o"


def ando(c):
    """Japonia: Momofuku Ando w okrągłych okularach, z kubkiem zupki instant."""
    put(c, OX + 6, OY + 10, [
        ".###..###.",
        "#...##...#",
        "#...##...#",
        ".###..###.",
    ])
    put(c, OX + 4, OY + 11, ["##"])
    put(c, OX + 15, OY + 11, ["##"])
    put(c, 24, 26, ["##"])
    put(c, 25, 15, [
        ".#..#..",
        "..#..#.",
        ".#..#..",
        ".....##",
        "....##.",
        "#..##.#",
        "#######",
        "#ooooo#",
        "#rrrrr#",
        "#rrrrr#",
        ".#ooo#.",
        ".#####.",
    ])


# kuchnia -> (klucz, rysowanie, podpis)
COSTUMES = {
    "Francja": ("napoleon", napoleon, "Napoleon"),
    "Grecja": ("sokrates", sokrates, "Sokrates"),
    "USA": ("lincoln", lincoln, "Abraham Lincoln"),
    "Meksyk": ("luchador", luchador, "Luchador"),
    "Japonia": ("ando", ando, "Momofuku Ando"),
}


def build():
    out = {}
    for country, (key, draw, label) in COSTUMES.items():
        moods = {}
        for mood in MOODS:
            c = base(mood)
            draw(c)
            moods[mood] = ["".join(r) for r in c]
        out[country] = {"key": key, "label": label, "rows": moods}
    return out


def write_js(data):
    lines = ["// Wygenerowane przez tools/costumes.py: przebrania Groszosława (32x38) dla kuchni i nastrojów.",
             "// '#' tusz, 'o' papier, 'c' rumieniec, 'r' czerwony detal, '.' przezroczyste.",
             "export const COSTUMES = {"]
    for country, v in data.items():
        lines.append(f"  {json.dumps(country, ensure_ascii=False)}: {{ key: {json.dumps(v['key'])}, label: {json.dumps(v['label'], ensure_ascii=False)}, rows: {{")
        for mood, rows in v["rows"].items():
            lines.append(f"    {mood}: {json.dumps(rows)},")
        lines.append("  } },")
    lines.append("};")
    open(OUT, "w", encoding="utf-8").write("\n".join(lines) + "\n")


def preview(data, path):
    from PIL import Image, ImageDraw
    scale = 8
    cols = len(data)
    img = Image.new("RGB", (cols * (W * scale + 16), (H * scale + 16) * 2), (200, 200, 200))
    d = ImageDraw.Draw(img)
    for row, dark in enumerate((False, True)):
        ink, paper = ((242, 242, 238), (18, 18, 17)) if dark else ((20, 20, 20), (250, 250, 247))
        red = (240, 72, 75) if dark else (200, 16, 46)
        col = {"#": ink, "o": paper, "r": red, "c": red}
        for i, v in enumerate(data.values()):
            ox, oy = i * (W * scale + 16), row * (H * scale + 16)
            d.rectangle([ox, oy, ox + W * scale - 1, oy + H * scale - 1], fill=paper)
            for y, r in enumerate(v["rows"]["happy"]):
                for x, ch in enumerate(r):
                    if ch in col:
                        d.rectangle([ox + x * scale, oy + y * scale, ox + (x + 1) * scale - 1, oy + (y + 1) * scale - 1], fill=col[ch])
    img.save(path)


if __name__ == "__main__":
    data = build()
    write_js(data)
    if len(sys.argv) > 1:
        preview(data, sys.argv[1])
    print(f"{len(data)} przebrań -> {os.path.relpath(OUT)}")
