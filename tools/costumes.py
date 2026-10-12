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



# ---------- pomocnicze dla rekwizytów ----------

def is_happy(c):
    """Nastrój happy ma ręce w górze."""
    return c[OY + 9][OX] == "#"


def drop_arm(c, side):
    """Usuwa podniesioną rękę (happy), gdy ta ręka trzyma rekwizyt."""
    if side == "r":
        clear(c, OX + 20, OY + 9, OX + 23, OY + 12)
        c[OY + 13][OX + 20] = "."
    else:
        clear(c, OX, OY + 9, OX + 3, OY + 12)
        c[OY + 13][OX + 3] = "."


def arms_up(c):
    """Ręce w górze (jak w nastroju happy) w każdym nastroju."""
    put(c, OX, OY + 9, ["##", "##", ".#", "..#"])
    put(c, OX + 20, OY + 9, ["..##", "..##", "..#.", ".#.."])


def fill_rows(c, y0, y1, ch, x0=0, x1=W - 1):
    for y in range(y0, y1 + 1):
        interior(c, y, ch, x0, x1)


# ---------- kolejne przebrania ----------

def kopernik(c):
    """Polska: Kopernik z włosami do ramion i modelem Układu Słonecznego na kiju."""
    sprout_off(c)
    drop_arm(c, "r")
    put(c, 7, 15, [
        ".....########.....",
        "....##########....",
        "...############...",
        "..##############..",
        ".################.",
        "###............###",
        "##..............##",
        "##..............##",
        "##..............##",
        "##..............##",
        "##..............##",
        "##..............##",
        "##..............##",
        ".#..............#.",
    ])
    put(c, 19, 0, [
        "....#####....",
        "..##.....##..",
        ".#..#.#.#..#.",
        "##...rrr...#.",
        "###.#rrr#...#",
        "##...rrr...#.",
        ".#..#.#.#..#.",
        "..##.....##..",
        "....#####....",
    ])
    for y in range(9, 27):
        c[y][25] = "#"
    put(c, 24, 26, ["##"])


def cezar(c):
    """Włochy: Juliusz Cezar w wieńcu laurowym, z miską sałatki Cezar."""
    sprout_off(c)
    drop_arm(c, "r")
    # wieniec dookoła czubka głowy: listki na przemian, z przerwą z przodu u góry
    for x, y in [(12, 14), (14, 14), (17, 14), (19, 14), (11, 15), (13, 15), (15, 15), (16, 15), (18, 15), (20, 15),
                 (10, 16), (11, 16), (20, 16), (21, 16), (9, 17), (22, 17), (8, 18), (23, 18), (8, 19), (23, 19)]:
        c[y][x] = "#"
    put(c, 24, 26, ["##"])
    put(c, 24, 19, [
        ".##..##.",
        "#oo##oo#",
        "#o#oo#o#",
        "########",
        "#oooooo#",
        "#oooooo#",
        ".#oooo#.",
        "..####..",
    ])


def donkichot(c):
    """Hiszpania: Don Kichot z miednicą golibrody na głowie i kopią z proporcem."""
    sprout_off(c)
    put(c, 6, 11, [
        "......######......",
        "....##oooo#o##....",
        "...#oooooooo#o#...",
        "..#oooooooooooo#..",
        "##################",
        "......#....#......",
    ])
    for y in range(3, 37):
        c[y][3] = "#"
    put(c, 4, 3, ["rrrr", "rrr.", "rr..", "r..."])
    if not is_happy(c):
        put(c, 4, 26, ["####"])


def beethoven(c):
    """Niemcy: Beethoven z rozwichrzoną czupryną, dyryguje batutą."""
    sprout_off(c)
    drop_arm(c, "r")
    put(c, 5, 10, [
        "......#...#..#........",
        "...#..##.##.##..#.....",
        "....######.#######.#..",
        ".#.################...",
        "..##################.#",
        "#####################.",
        ".####################.",
        "######################",
        ".#####o#oo#oo#oo#####.",
        "#####............#####",
        ".###..............###.",
        "###................###",
        ".#..................#.",
    ])
    put(c, 24, 13, [
        "......#",
        ".....#.",
        "....#..",
        "...#...",
        "..#....",
        ".##....",
        "##.....",
        "#......",
        "#......",
        "#......",
        "#......",
        "##.....",
    ])
    put(c, 26, 3, ["..##", "..#.", "..#.", "###.", "##.."])


def houdini(c):
    """Węgry: Houdini z przedziałkiem, opleciony łańcuchem z czerwoną kłódką."""
    sprout_off(c)
    put(c, 10, 15, [
        "...######...",
        ".####oo####.",
        "#####oo#####",
        "####....####",
    ])
    put(c, 5, 27, [
        ".##....##....##....##..",
        "#oo####oo####oo####oo#.",
        ".##....##....##....##..",
    ])
    put(c, 13, 29, [
        ".####.",
        "#o..o#",
        "rrrrrr",
        "rrorrr",
        "rrorrr",
        "rrrrrr",
    ])


def kozak(c):
    """Ukraina: Kozak z osełedcem, długimi wąsami, czerwonym pasem i bandurą."""
    sprout_off(c)
    drop_arm(c, "r")
    put(c, 7, 10, [
        ".....####.",
        "....######",
        "...##...##",
        "..##....##",
        "..#.....##",
        ".##.....##",
        ".#........",
        "##........",
        "#.........",
    ])
    put(c, 12, 24, [
        "..####..",
        ".#....#.",
        "#......#",
        "#......#",
    ])
    fill_rows(c, 28, 29, "r")
    put(c, 24, 25, ["#"])
    put(c, 23, 11, [
        "......#.#",
        ".......##",
        "......###",
        ".....##..",
        "....##...",
        "...##....",
        "..####...",
        ".#o#o#o..",
        "#oo#o#o#.",
        "#oo#o#o#.",
        "#oo#o#o#.",
        "#oo#o#o#.",
        "#oo###o#.",
        ".#oooo#..",
        "..####...",
    ])


def rycerz(c):
    """Gruzja: Rycerz w tygrysiej skórze: kaptur z uszami i pręgami, pręgowany ogon."""
    sprout_off(c)
    put(c, 7, 12, [
        "..#............#..",
        "..##..........##..",
        "..#r##########r#..",
        "..#rr#rrrr#rr#r#..",
        "..#rrr#rr#rrrrr#..",
        ".#r#rrrrrrrr#rr#..",
        ".#rrrrr#rr#rrr#r#.",
        ".#r#rrrrrrrrrr#r#.",
        "#rr#..........#rr#",
        "#r#............#r#",
        "#rr#..........#rr#",
        ".#r#..........#r#.",
    ])
    for y in range(OY + 7, OY + 10):
        interior(c, y, "r")
    put(c, 22, 22, [
        "......##",
        ".....#r#",
        ".....#r#",
        "....#r#.",
        "....#r#.",
        "...#rr#.",
        "..#r##..",
        ".#rr#...",
        "#r##....",
        "##......",
    ])


def mehter(c):
    """Turcja: muzyk orkiestry mehter w wysokiej czapce z opadającym rękawem, z bębnem davul."""
    sprout_off(c)
    drop_arm(c, "r")
    put(c, 11, 3, [
        "...######.....",
        "..#oooooo#....",
        "..#oooooo##...",
        "..#oooooo#o#..",
        "..#oooooo#oo#.",
        "..#oooooo#oo#.",
        "..#oooooo#oo#.",
        ".#oooooooo#o#.",
        ".#oooooooo#o#.",
        ".#oooooooo#o#.",
        ".#oooooooo#o#.",
        ".#oooooooo#oo#",
        "rrrrrrrrrrr#o#",
        "############o#",
        "..........#oo#",
        "..........#o#.",
        "...........#..",
    ])
    put(c, 6, 27, [
        "####################",
        "#oooooooooooooooooo#",
        "#o#ooo#ooo#ooo#ooo##",
        "#oo#o#o#o#o#o#o#o#o#",
        "#ooo#ooo#ooo#ooo#oo#",
        "#oooooooooooooooooo#",
        "####################",
    ])
    put(c, 24, 20, ["....##", "....##", "...#..", "..#...", ".#....", "#....."])


def fenicjanin(c):
    """Liban: fenicki żeglarz w łodzi pod purpurowym żaglem."""
    sprout_off(c)
    clear(c, 0, 31, W - 1, H - 1)
    for y in range(0, 16):
        c[y][15] = "#"
        c[y][16] = "#"
    put(c, 5, 1, [
        "######################",
        ".#rrrrrrrrrrrrrrrrrr#.",
        ".#rrrrrrrrrrrrrrrrrr#.",
        ".#r################r#.",
        ".#rrrrrrrrrrrrrrrrrr#.",
        ".#rrrrrrrrrrrrrrrrrr#.",
        ".#r################r#.",
        ".#rrrrrrrrrrrrrrrrrr#.",
        "..#rrrrrrrrrrrrrrrr#..",
        "...################...",
    ])
    put(c, 0, 25, [
        "##..............................",
        "#o#............................#",
        ".#o#..........................##",
        "..#o#........................#o#",
        "...#o########################o#.",
        "...#oooooooooooooooooooooooooo#.",
        "....#o#oo#oo#oo#oo#oo#oo#oo#o#..",
        ".....########################...",
    ])


def battuta(c):
    """Maroko: Ibn Battuta w turbanie, z rozwiniętym zwojem mapy i kijem podróżnym."""
    sprout_off(c)
    drop_arm(c, "r")
    put(c, 8, 10, [
        "......####......",
        "....##oooo##....",
        "..##ooooo##o##..",
        ".#ooooo##oo##o#.",
        "#oooo##oo##oooo#",
        "#oo##oo##oooooo#",
        "#o#oo##oooooooo#",
        ".##############.",
    ])
    put(c, 4, 26, [
        "###.................###",
        "#o###################o#",
        "#o#ooooooooooooooror#o#",
        "#o#ooooooooo##ooooro#o#",
        "#o#ooooo##oooooooror#o#",
        "#o#oo##ooooooooooooo#o#",
        "#o#ooooooooooooooooo#o#",
        "#o###################o#",
        "###.................###",
    ])
    for y in range(7, 37):
        c[y][29] = "#"
    c[7][30] = "#"


def brahmagupta(c):
    """Indie: Brahmagupta z tabliczką, na której wypisał zero."""
    drop_arm(c, "r")
    put(c, 23, 15, [
        "#########",
        "#########",
        "###ooo###",
        "##o###o##",
        "##o###o##",
        "##o###o##",
        "##o###o##",
        "###ooo###",
        "#########",
        "#########",
    ])
    put(c, 24, 25, ["#"])


def muaythai(c):
    """Tajlandia: bokser muay thai w opasce mongkhon, w gardzie, w czerwonych rękawicach i spodenkach."""
    sprout_off(c)
    clear(c, 0, OY + 9, OX + 3, OY + 13)
    clear(c, OX + 20, OY + 9, W - 1, OY + 13)
    fill_rows(c, 18, 19, "r")
    put(c, 17, 12, ["....##", "...#..", "..#...", ".#....", "#....."])
    put(c, 2, 17, [
        ".####.",
        "#rrrr#",
        "#rrrr#",
        "#rrrr#",
        ".####.",
        "...#..",
        "...#..",
        "....#.",
        ".....#",
    ])
    put(c, 24, 17, [
        ".####.",
        "#rrrr#",
        "#rrrr#",
        "#rrrr#",
        ".####.",
        "..#...",
        "..#...",
        ".#....",
        "#.....",
    ])
    fill_rows(c, 28, 30, "r")


def pho(c):
    """Wietnam: sprzedawca phở w kapeluszu nón lá, z parującą miską i pałeczkami."""
    sprout_off(c)
    drop_arm(c, "r")
    put(c, 4, 9, [
        "...........##...........",
        ".........##oo##.........",
        ".......##oooooo##.......",
        ".....##oooooooooo##.....",
        "...##oooooooooooooo##...",
        ".##oooooooooooooooooo##.",
        "########################",
    ])
    put(c, 24, 26, ["##"])
    put(c, 24, 17, [
        "..#.....",
        ".#....#.",
        "..#..#.#",
        ".#..#.#.",
        "...#.#..",
        "########",
        "#oooooo#",
        "#oooooo#",
        ".#oooo#.",
        "..####..",
    ])


def terakota(c):
    """Chiny: wojownik z terakotowej armii na postumencie: kok z boku głowy i zbroja z nitami."""
    sprout_off(c)
    put(c, 17, 13, [
        ".##.",
        "####",
        "####",
    ])
    for y in range(27, 31):
        interior(c, y, "r")
    for y in (28, 30):
        for x in range(W):
            if c[y][x] == "r" and (x + (y // 2) * 2) % 4 == 0:
                c[y][x] = "o"
    put(c, 8, 34, [
        "################",
        "#oooooooooooooo#",
        "################",
    ])


def sejong(c):
    """Korea: król Sejong w czarnej czapce ze skrzydełkami i czerwonej szacie, z tabliczką hangul."""
    sprout_off(c)
    drop_arm(c, "r")
    put(c, 4, 11, [
        "..........####..........",
        "........########........",
        ".####..##########..####.",
        "#oooo##############oooo#",
        ".####.############.####.",
        "......############......",
    ])
    for y in range(28, 31):
        interior(c, y, "r")
    put(c, 24, 26, ["#"])
    put(c, 24, 18, [
        "########",
        "#oooooo#",
        "####o#o#",
        "#oo#o###",
        "#oo#o#o#",
        "#o#oo#o#",
        "#oooooo#",
        "########",
    ])


def skoczek(c):
    """Bośnia: skoczek ze Starego Mostu w Mostarze: czerwone kąpielówki, ręce w górze, stoi na łuku mostu."""
    arms_up(c)
    clear(c, 0, 32, W - 1, H - 1)
    fill_rows(c, 28, 30, "r")
    put(c, 12, 32, ["#......#"])
    put(c, 0, 33, [
        "........################........",
        "....########################....",
        "##########............##########",
        "#######..................#######",
        "#####......................#####",
    ])


# kuchnia -> (klucz, rysowanie, podpis)
COSTUMES = {
    "Francja": ("napoleon", napoleon, "Napoleon"),
    "Grecja": ("sokrates", sokrates, "Sokrates"),
    "USA": ("lincoln", lincoln, "Abraham Lincoln"),
    "Meksyk": ("luchador", luchador, "Luchador"),
    "Japonia": ("ando", ando, "Momofuku Ando"),
    "Polska": ("kopernik", kopernik, "Mikołaj Kopernik"),
    "Włochy": ("cezar", cezar, "Juliusz Cezar"),
    "Hiszpania": ("donkichot", donkichot, "Don Kichot"),
    "Niemcy": ("beethoven", beethoven, "Beethoven"),
    "Węgry": ("houdini", houdini, "Harry Houdini"),
    "Ukraina": ("kozak", kozak, "Kozak"),
    "Gruzja": ("rycerz", rycerz, "Rycerz w tygrysiej skórze"),
    "Turcja": ("mehter", mehter, "Muzyk mehter"),
    "Liban": ("fenicjanin", fenicjanin, "Fenicki żeglarz"),
    "Maroko": ("battuta", battuta, "Ibn Battuta"),
    "Indie": ("brahmagupta", brahmagupta, "Brahmagupta"),
    "Tajlandia": ("muaythai", muaythai, "Bokser muay thai"),
    "Wietnam": ("pho", pho, "Sprzedawca phở"),
    "Chiny": ("terakota", terakota, "Wojownik z terakoty"),
    "Korea": ("sejong", sejong, "Król Sejong"),
    "Bośnia": ("skoczek", skoczek, "Skoczek z Mostaru"),
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
