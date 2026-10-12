"""Generuje zdjęcia paragonów do testów odczytu: wąski papier termiczny, perspektywa,
cień, rozmycie i szum jak ze zdjęcia telefonem. Kwoty liczą się same, więc znamy wynik.

python3 tools/paragony.py KATALOG  ->  KATALOG/p1.jpg ... i KATALOG/wyniki.json
"""
import json
import math
import os
import random
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONTS = ["/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
         "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"]

PRODUKTY = [
    ("Mleko UHT 3,2% 1L", 3.49, "C"), ("Chleb wiejski 500g", 4.99, "C"), ("Masło ext. 200g", 7.49, "C"),
    ("Jaja L 10szt", 9.99, "C"), ("Pierś z kurczaka kg", 24.99, "C"), ("Ziemniaki luz kg", 2.49, "C"),
    ("Pomidory luz kg", 9.99, "C"), ("Cebula luz kg", 3.29, "C"), ("Makaron penne 500g", 3.99, "C"),
    ("Ryż długoziarnisty 1kg", 5.49, "C"), ("Jogurt nat. 400g", 2.79, "C"), ("Ser gouda plastry", 6.99, "C"),
    ("Krewetki mroż. 400g", 22.99, "C"), ("Woda niegaz. 1,5L", 1.99, "A"), ("Sok pomarańcz. 1L", 5.99, "A"),
    ("Kawa mielona 250g", 14.99, "A"), ("Czekolada mleczna", 4.49, "A"), ("Papier toaletowy 8", 12.99, "A"),
    ("Płyn do naczyń 1L", 6.49, "A"), ("Banany luz kg", 5.99, "C"), ("Passata 690g", 4.29, "C"),
    ("Tortilla pszenna 6szt", 6.49, "C"), ("Kiełbasa śląska", 11.99, "C"), ("Twaróg półtł. 250g", 3.99, "C"),
]

SKLEPY = {
    "Biedronka": ["JERONIMO MARTINS POLSKA S.A.", "ul. Żniwna 5, 62-025 Kostrzyn", "Biedronka nr 4521",
                  "Gliwice, ul. Pszczyńska 1", "NIP 779-10-11-327"],
    "Lidl": ["Lidl sp. z o.o. sp.k.", "ul. Poznańska 48, Jankowice", "Sklep Lidl Gliwice", "ul. Toszecka 101",
             "NIP 781-18-97-358"],
    "Kaufland": ["Kaufland Polska Markety", "sp. z o.o. sp.j.", "ul. Wróblewskiego 6", "44-100 Gliwice",
                 "NIP 899-24-21-286"],
    "Aldi": ["ALDI Sp. z o.o., ul. Niedźwiedziniec 10", "41-506 Chorzów", "VST 280 Gliwice", "ul. Testowa 1",
             "NIP 1070002973"],
    "Żabka": ["Żabka Polska sp. z o.o.", "ul. Stanisława Matyi 8", "61-586 Poznań", "Sklep Z1234 Gliwice",
              "NIP 778-14-04-546"],
}

W = 40  # znaków w wierszu


def zl(v):
    return f"{v:.2f}".replace(".", ",")


def pad(left, right):
    return left + " " * max(1, W - len(left) - len(right)) + right


def paragon(rng, sklep, n):
    rows = []  # (tekst, wyrównanie, duży)
    for h in SKLEPY[sklep]:
        rows.append((h, "c", False))
    data = f"2026-10-{rng.randint(1, 11):02d}"
    rows.append((pad(f"{data} {rng.randint(8, 21):02d}:{rng.randint(0, 59):02d}", f"nr wydr.{rng.randint(10000, 99999)}"), "l", False))
    rows.append(("PARAGON FISKALNY", "c", True))
    suma = {"A": 0.0, "C": 0.0}
    items = []
    opusty = 0.0
    for nazwa, cena, ptu in rng.sample(PRODUKTY, n):
        ile = rng.choice([1, 1, 1, 2, 3]) if "kg" not in nazwa else round(rng.uniform(0.3, 1.8), 3)
        wart = round(ile * cena, 2)
        suma[ptu] += wart
        il = f"{ile}" if isinstance(ile, int) else f"{ile:.3f}".replace(".", ",")
        items.append(wart)
        if sklep == "Aldi":
            # jak w Aldi: wszystko w jednym wierszu, opust pod pozycją
            rows.append((pad(f"{nazwa.upper()[:22]} {ptu}", f"{il}{'kg' if 'kg' in nazwa else 'SZT'} * {zl(cena)} {zl(wart)} {ptu}"), "l", False))
            if wart > 3 and rng.random() < 0.35:
                op = round(min(wart - 1, rng.choice([0.5, 1.0, 1.49, 2.0])), 2)
                rows.append((pad(f"OPUST {nazwa.upper()[:20]} {ptu}", f"-{zl(op)} {ptu}"), "l", False))
                suma[ptu] -= op
                opusty += op
        elif sklep == "Kaufland":
            # jak w Kauflandzie: nazwa sklejona, litera przy ilości, długa nazwa w osobnym wierszu
            nm = "".join(w[:1].upper() + w[1:] for w in nazwa.split())
            tail = f"{il}{'KG' if 'kg' in nazwa else 'SZT'} x{zl(cena)} {zl(wart)}{ptu}"
            if len(nm) + len(tail) + 3 > W:
                rows.append((pad(nm[:W - 2], "t"), "l", False))
                rows.append((pad("", tail), "l", False))
            else:
                rows.append((pad(f"{nm} t", tail), "l", False))
        else:
            rows.append((nazwa[:W], "l", False))
            rows.append((pad(f"   {ptu}  {il} x{zl(cena)}", f"{zl(wart)}{ptu}"), "l", False))
    total = round(suma["A"] + suma["C"], 2)
    if opusty:
        rows.append((pad("Suma Opustów", f"-{zl(opusty)}"), "l", False))
    elif items[-1] > 2.5 and rng.random() < 0.5:
        rabat = round(rng.choice([1.0, 2.0, 1.5]), 2)
        rabat = min(rabat, round(items[-1] - 1, 2))
        rows.append((pad("Rabat", f"-{zl(rabat)}"), "l", False))
        total = round(total - rabat, 2)
        suma["C"] -= rabat
    for k, pr in (("A", 0.23), ("C", 0.05)):
        if suma[k] > 0:
            rows.append((pad(f"Sprzedaż opodatk. {k}", zl(suma[k])), "l", False))
            rows.append((pad(f"PTU {k} {pr * 100:.2f}%".replace(".", ","), zl(round(suma[k] * pr / (1 + pr), 2))), "l", False))
    rows.append((pad("Suma PTU", zl(round(suma["A"] * 0.23 / 1.23 + suma["C"] * 0.05 / 1.05, 2))), "l", False))
    rows.append((pad("SUMA PLN", zl(total)), "l", True))
    if rng.random() < 0.6:
        rows.append((pad("Karta płatnicza", zl(total)), "l", False))
    else:
        dano = math.ceil(total / 50) * 50
        rows.append((pad("Gotówka", zl(dano)), "l", False))
        rows.append((pad("Reszta", zl(dano - total)), "l", False))
    rows.append((pad(f"{rng.randint(100, 999)} #Kasa {rng.randint(1, 9)}", f"Kasjer nr {rng.randint(1, 40)}"), "l", False))
    rows.append((f"{rng.randint(10, 99)}:{rng.randint(10, 99)}  {'ABC'[rng.randint(0, 2)]}{rng.randint(1000000, 9999999)}", "c", False))
    return rows, total, data, len(items)


def font(i, size):
    try:
        return ImageFont.truetype(FONTS[i], size)
    except OSError:
        return ImageFont.load_default(size)


def render(rows, rng):
    f = font(0, 26)
    fb = font(1, 26)
    cw = f.getbbox("M")[2]
    lh = 34
    pw = W * cw + 60
    ph = 60 + sum(lh * (2 if big else 1) for _, _, big in rows) + 80
    paper = Image.new("L", (pw, ph), 246)
    d = ImageDraw.Draw(paper)
    y = 50
    ink = rng.randint(40, 115)  # wyblakły druk termiczny
    for t, al, big in rows:
        if big:
            # podwójna wysokość jak w drukarce fiskalnej: rysujemy i rozciągamy w pionie
            tmp = Image.new("L", (pw, lh), 246)
            ImageDraw.Draw(tmp).text((30 + (0 if al == "l" else (W * cw - fb.getlength(t)) / 2), 2), t, font=fb, fill=ink)
            paper.paste(tmp.resize((pw, lh * 2)), (0, y))
            y += lh * 2
            continue
        x = 30 if al == "l" else 30 + (W * cw - f.getlength(t)) / 2
        d.text((x, y), t, font=f, fill=ink)
        y += lh
    # termiczny wydruk: lekko poszarpane, nierówne krycie
    paper = paper.filter(ImageFilter.GaussianBlur(0.6))
    paper = paper.resize((int(pw * 0.86), ph))  # węższa czcionka jak w kasie
    return paper.convert("RGB")


def photo(paper, rng, size=(2400, 3200)):
    W0, H0 = size
    bg = Image.new("RGB", size, tuple(rng.randint(60, 120) for _ in range(3)))
    # usłojenie blatu
    d = ImageDraw.Draw(bg)
    for _ in range(140):
        y = rng.randint(0, H0)
        c = tuple(max(0, min(255, v + rng.randint(-18, 18))) for v in bg.getpixel((0, 0)))
        d.line([(0, y), (W0, y + rng.randint(-40, 40))], fill=c, width=rng.randint(2, 9))
    # paragon zajmuje ok. 85% wysokości kadru
    s = H0 * rng.uniform(0.78, 0.9) / paper.height
    p = paper.resize((int(paper.width * s), int(paper.height * s)), Image.LANCZOS)
    # pochylenie, perspektywa i lekkie zawinięcie przez podział na paski
    ang = rng.uniform(-6, 6)
    p = p.rotate(ang, expand=True, fillcolor=(0, 0, 0), resample=Image.BICUBIC)
    mask = Image.new("L", p.size, 0)
    mask.paste(255, (0, 0, p.width, p.height))
    mask = p.convert("L").point(lambda v: 255 if v > 8 else 0)
    ox = (W0 - p.width) // 2 + rng.randint(-120, 120)
    oy = (H0 - p.height) // 2 + rng.randint(-60, 60)
    bg.paste(p, (ox, oy), mask)
    k = rng.uniform(0.02, 0.06)
    coeffs = (1, k * rng.choice([-1, 1]), -k * 400, 0, 1, 0, rng.uniform(-3e-5, 3e-5), rng.uniform(-2e-5, 2e-5))
    bg = bg.transform(size, Image.PERSPECTIVE, coeffs, Image.BICUBIC, fillcolor=(80, 80, 80))
    # cień od ręki/telefonu i nierówne światło
    sh = Image.new("L", size, 0)
    sd = ImageDraw.Draw(sh)
    cx, cy = rng.randint(0, W0), rng.randint(0, H0)
    for r in range(0, 1800, 30):
        sd.ellipse([cx - r, cy - r, cx + r, cy + r], outline=int(min(110, r / 18)))
    sh = sh.filter(ImageFilter.GaussianBlur(120))
    dark = Image.new("RGB", size, (0, 0, 0))
    bg = Image.composite(dark, bg, sh.point(lambda v, a=rng.uniform(1.0, 1.8): int(min(200, v * a))))
    bg = bg.filter(ImageFilter.GaussianBlur(rng.uniform(1.0, 2.4)))
    noise = Image.effect_noise(size, rng.uniform(8, 16)).convert("RGB")
    bg = Image.blend(bg, noise, 0.06)
    return bg


def main(out, n=6, seed=7):
    os.makedirs(out, exist_ok=True)
    rng = random.Random(seed)
    truth = {}
    sklepy = list(SKLEPY)
    for i in range(n):
        sklep = sklepy[i % len(sklepy)]
        rows, total, data, nitems = paragon(rng, sklep, rng.randint(8, 22))
        img = photo(render(rows, rng), rng)
        name = f"p{i + 1}.jpg"
        img.save(os.path.join(out, name), quality=rng.randint(80, 90))
        truth[name] = {"total": total, "store": sklep, "date": data, "items": nitems}
    json.dump(truth, open(os.path.join(out, "wyniki.json"), "w"), ensure_ascii=False, indent=1)
    print(json.dumps(truth, ensure_ascii=False))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "paragony", int(sys.argv[2]) if len(sys.argv) > 2 else 6)
