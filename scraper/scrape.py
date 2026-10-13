"""Robot promocji Groszka.

Pobiera promocje spożywcze z Kauflandu, Lidla (z siatki produktów) i Aldi i zapisuje je do data/promos.json.
Każdy sklep jest obsługiwany osobno: jeśli jeden się zepsuje, pozostałe dalej działają,
a w pliku zostaje informacja, który sklep nie odpowiedział.

Użycie:
  python scraper/scrape.py --out data/promos.json --debug debug
  python scraper/scrape.py --out /tmp/promos.json --local katalog_z_zapisanymi_stronami
"""
import argparse
import datetime as dt
import hashlib
import html as htmllib
import json
import os
import re
import sys
import traceback

import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36",
    "Accept-Language": "pl-PL,pl;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

WARSAW = dt.timezone(dt.timedelta(hours=2))  # wystarczająco dokładne dla dat ofert

NONFOOD_WORDS = [
    "znicz", "wkład", "lampion", "świec", "koc", "pościel", "prześcierad", "ręcznik", "piżam", "skarpet",
    "sweter", "spodnie", "kurtk", "buty", "kapci", "bluza", "joggery", "kamizelk", "rajstop", "majtki",
    "bokserki", "koszul", "dywan", "poduszk", "kołdr", "narzut", "wieszak", "pojemnik", "patelni", "garnek",
    "garnk", "nóż", "noży", "szklan", "talerz", "miska", "kubek", "forma", "blacha", "deska", "frytkownic",
    "mikrofal", "toster", "czajnik", "mikser", "blender", "robot kuchenny", "ekspres", "odkurzacz", "żelazk",
    "wiertar", "szlifier", "zestaw", "otwornic", "szczypc", "śrubokręt", "bit", "regał", "drabin", "taśma",
    "karma", "żwirek", "przysmak dla", "dla psa", "dla psów", "dla kotów", "dla kota", "gryzoni", "papug",
    "pieluch", "pampers", "szampon", "odżywka do włosów", "żel pod prysznic", "pasta do zębów", "mydło",
    "krem", "lakier", "dezodorant", "proszek do prania", "płyn do prania", "płyn do płukania", "kapsułki do",
    "tabletki do zmywarki", "sól do zmywarek", "płyn do mycia", "ściereczk", "mop", "papier toaletowy",
    "ręczniki kuchenne", "ręcznik papierowy", "folia", "worki", "baterie", "żarów", "lampa", "lampk", "kinkiet",
    "pilot", "długopis", "książk", "puzzle", "gra ", "zabawk", "bukiet", "róża", "storczyk", "kalanchoe",
    "roślina", "wrzos", "anturium", "doniczk", "torba", "walizk", "plecak", "parasol", "termowentylator",
    "piła", "akumulator", "ładowark", "klej", "gwoździe", "nakrętki", "haki", "linka", "płyn zimowy",
    "maszynka do golenia", "golark", "bielizna", "obrus", "bieżnik", "podkładka", "rękawica", "łapka",
    "serwetki", "podgrzewacz", "dozownik", "łopatka do", "łyżka do", "chochla", "tłuczek", "cedzak",
    "róże", "sosna", "clogs", "kardigan", "sneakers", "lalka", "top damski", "krajalnica", "tulipany", "chryzantem",
]
NONFOOD_UNITS = {"para", "sztuka", "zestaw", "bukiet", "komplet", "kpl."}

NONFOOD_BRANDS = {
    "silvercrest", "parkside", "parkside performance", "livarno", "esmara", "esmara men", "crivit", "lupilu",
    "tronic", "pictura", "tracer", "osram", "varta", "varta energy", "gp batteries", "switch on", "liv & bo",
    "liv&bo", "bevola", "carinura", "k-carinura", "pets", "curver", "pyrex", "gerlach granitex", "brio",
    "tefal", "philips", "russel hobbs", "esperanza", "leifheit", "metalkas", "subito", "angela", "w5",
    "spice&soul", "home sweet home", "foxy asso", "velvet turbo", "anna zaradna", "townland", "amw",
    "interdruk", "pattex", "car stuff", "brick", "koziołek", "dafi", "fairy", "finish", "persil", "vizir",
    "lenor", "perwoll", "pur", "bref", "nivea", "head & shoulders", "blend-a-med", "elmex", "gillette",
    "gillette blue ii plus", "mill wash", "glanz meister", "pampers", "pampers premium care", "ninjamas",
    "pampers night", "pampers active baby", "optivital", "sheba", "whiskas", "felix sensations", "brit",
    "pedigree", "butchers", "butcher's", "butcher's orginal", "dolina noteci", "perfect fit", "gourmet",
    "pet republic", "petrepublic", "dentalife", "tuf tuf", "wagg", "vitakraft", "tropical", "chipsi",
    "cleo", "dante", "inaba churu", "joy & toy", "arquivet", "ares", "bult", "friskies mini menu",
    "vitalfit", "one", "pure", "pet's dream", "kokett", "calix", "swiffer", "up2fashion", "gardenline",
    "crofton", "mattel", "lego", "hasbro", "ambiano", "quigg", "tcm", "workzone", "ferrex", "easy home",
    "crane", "walkx", "blue motion", "topcraft", "lacura", "kokett",
}

KAUFLAND_FOOD_SECTIONS = [
    "owoce", "warzywa", "mięso", "drób", "wędlin", "ryby", "nabiał", "mrożonki", "garmażeria", "konserwy",
    "abc każdej kuchni", "kawa", "herbata", "słodycze", "przekąski", "napoje", "piekarnia", "pieczywo",
]
KAUFLAND_MIXED_SECTIONS = ["hity tygodnia", "tanio z kaufland card", "mocny start", "oferta regionalna",
                           "oferta specjalna", "pozostałe", "nowości", "aktualna oferta"]

ALDI_FOOD_CATEGORIES = [
    "słodycze", "wędliny", "mięso", "owoce", "warzywa", "kawa", "herbata", "nabiał", "jaja", "sery", "twarogi",
    "napoje", "soki", "tłuszcze", "octy", "pieczywo", "mrożonki", "ryby", "dania", "przyprawy", "makarony",
    "kasze", "ryż", "konserwy", "przekąski", "zboża", "płatki", "bakalie", "orzechy", "sosy", "drób", "alkohol",
    "piwo", "wino", "żywność", "śniadan", "desery", "lody",
]


def pl_float(s):
    if s is None:
        return None
    s = s.strip().replace("\xa0", " ").replace(" ", "")
    m = re.search(r"\d+(?:[.,]\d+)?", s)
    if not m:
        return None
    return round(float(m.group(0).replace(",", ".")), 2)


def clean(s):
    if s is None:
        return ""
    return re.sub(r"\s+", " ", s.replace("\xa0", " ")).strip()


def offer_id(*parts):
    return hashlib.sha1("|".join(str(p) for p in parts).encode("utf-8")).hexdigest()[:12]


def is_nonfood(name, brand=""):
    low = (name or "").lower()
    b = (brand or "").lower().strip()
    if b in NONFOOD_BRANDS:
        return True
    return any(w in low for w in NONFOOD_WORDS)


class Fetcher:
    def __init__(self, local_dir=None, debug_dir=None):
        self.local_dir = local_dir
        self.debug_dir = debug_dir
        self.session = requests.Session()
        self.session.headers.update(HEADERS)

    def get(self, name, url):
        if self.local_dir:
            path = os.path.join(self.local_dir, name + ".html")
            if not os.path.exists(path):
                raise FileNotFoundError(path)
            with open(path, encoding="utf-8") as f:
                return f.read()
        r = self.session.get(url, timeout=45)
        r.raise_for_status()
        if self.debug_dir:
            os.makedirs(self.debug_dir, exist_ok=True)
            with open(os.path.join(self.debug_dir, "fetched_" + name + ".html"), "w", encoding="utf-8") as f:
                f.write(r.text)
        return r.text


# ---------------------------------------------------------------- Kaufland

def kaufland_dates(text, today):
    """'Oferta ważna od 08.10. do 14.10.' albo 'Oferta ważna 12.10.' -> (od, do) jako 'YYYY-MM-DD'."""
    days = re.findall(r"(\d{1,2})\.(\d{1,2})\.(?:(\d{4}))?", text or "")
    if not days:
        return None, None

    def to_date(d, m, y):
        year = int(y) if y else today.year
        date = dt.date(year, int(m), int(d))
        if not y and (date - today).days > 200:
            date = date.replace(year=year - 1)
        if not y and (today - date).days > 200:
            date = date.replace(year=year + 1)
        return date

    start = to_date(*days[0])
    end = to_date(*days[1]) if len(days) > 1 else start
    return start.isoformat(), end.isoformat()


def parse_kaufland(html, today, week):
    soup = BeautifulSoup(html, "html.parser")
    offers = []
    for section in soup.select(".k-product-section"):
        head = clean(section.select_one(".k-product-section__headline").get_text(" ")) \
            if section.select_one(".k-product-section__headline") else ""
        sub = clean(section.select_one(".k-product-section__subheadline").get_text(" ")) \
            if section.select_one(".k-product-section__subheadline") else ""
        hl = head.lower()
        food_section = any(w in hl for w in KAUFLAND_FOOD_SECTIONS) and not any(
            w in hl for w in ["kosmetyki", "chemia", "elektro", "agd", "tekstylia", "dla dzieci", "zwierząt"])
        mixed = any(w in hl for w in KAUFLAND_MIXED_SECTIONS)
        if not (food_section or mixed):
            continue
        start, end = kaufland_dates(sub, today)
        for tile in section.select(".k-product-tile"):
            title = clean(tile.select_one(".k-product-tile__title").get_text(" ")) \
                if tile.select_one(".k-product-tile__title") else ""
            subtitle = clean(tile.select_one(".k-product-tile__subtitle").get_text(" ")) \
                if tile.select_one(".k-product-tile__subtitle") else ""
            unit = clean(tile.select_one(".k-product-tile__unit-price").get_text(" ")) \
                if tile.select_one(".k-product-tile__unit-price") else ""
            base = clean(tile.select_one(".k-product-tile__base-price").get_text(" ")) \
                if tile.select_one(".k-product-tile__base-price") else ""
            if subtitle and subtitle[0].isupper():
                brand, name, detail = title, subtitle, ""
            else:
                brand, name, detail = "", title, subtitle
            if not name:
                continue
            if is_nonfood(name, brand):
                continue
            tag = tile.select_one(".k-price-tag")
            if not tag:
                continue
            price = pl_float(tag.select_one(".k-price-tag__price").get_text(" ")) \
                if tag.select_one(".k-price-tag__price") else None
            if price is None:
                continue
            old_el = tag.select_one(".k-price-tag__old-price-line-through")
            old = pl_float(old_el.get_text(" ")) if old_el else None
            old_label = ""
            if tag.select_one(".k-price-tag__old-price"):
                spans = tag.select_one(".k-price-tag__old-price").find_all("span")
                if len(spans) > 1:
                    old_label = clean(spans[-1].get_text(" "))
            disc_el = tag.select_one(".k-price-tag__discount")
            disc = clean(disc_el.get_text(" ")) if disc_el else ""
            if disc.lower() == "tylko":
                disc = ""
            cond = "z kartą Kaufland Card" if tag.select_one(".k-price-tag__with-card") or \
                "k-price-tag--xtra" in (tag.get("class") or []) else ""
            offers.append({
                "id": offer_id("kaufland", brand, name, detail, price, start),
                "store": "kaufland",
                "name": name,
                "brand": brand,
                "detail": ", ".join(x for x in [detail, unit] if x),
                "unitPrice": base.strip("()"),
                "price": price,
                "oldPrice": old,
                "oldLabel": old_label,
                "discount": disc,
                "cond": cond,
                "from": start,
                "to": end,
                "category": head,
                "week": week,
            })
    return offers


# ---------------------------------------------------------------- Lidl

LIDL_OFFER_PAGES = ("najlepsze-okazje", "bez-promocji")


def parse_lidl_text(alt, href):
    text = clean(alt)
    if not text or "zł" not in text and not re.search(r"\d+,\d\d", text):
        return None
    coupon = bool(re.search(r"kupon\w* Lidl Plus", text, re.I))
    regular_cut = "bez-promocji" in (href or "")
    work = re.sub(r"^Rewolucja cenowa!\s*Każdego dnia tanio,?\s*także bez promocji,?\s*(np\.)?\s*", "", text,
                  flags=re.I)
    work = re.sub(r"^Z kuponem Lidl Plus\s*", "", work, flags=re.I)
    # nazwa: do pierwszego rabatu, ceny albo słowa 'z kuponem'
    m = re.search(r"\s(?:z kuponem|-\s?\d+%|\d+%|\d+ zł taniej|cena\s|\d+,\d\d)", work, flags=re.I)
    name = work[:m.start()] if m else work
    name = name.strip(" ,.-")
    if name:
        name = name[0].upper() + name[1:]
    old = None
    mo = re.search(r"(?:przed obniżką|poza promocją|najniższa cena z 30 dni)[^0-9]{0,40}(\d+,\d\d)", text, re.I)
    if mo:
        old = pl_float(mo.group(1))
    mo2 = re.search(r"(\d+,\d\d)\s*(?:zł)?\s*najniższa cena z 30 dni", text, re.I)
    if old is None and mo2:
        old = pl_float(mo2.group(1))
    price = None
    for pm in re.finditer(r"(\d+,\d\d)", text):
        v = pl_float(pm.group(1))
        if old is not None and abs(v - old) < 0.001:
            continue
        before = text[max(0, pm.start() - 6):pm.start()]
        if "100g=" in before or "1 kg=" in before:
            continue
        price = v
        break
    if price is None:
        return None
    disc = ""
    md = re.search(r"-\s?(\d+)%|(\d+)% taniej|\s(\d+)%\s", text)
    if md:
        disc = "-" + next(g for g in md.groups() if g) + "%"
    cond = []
    if coupon:
        cond.append("kupon Lidl Plus")
    mq = re.search(r"przy zakupie (\w+)", text, re.I)
    if mq:
        words = {"dwóch": "2", "trzech": "3", "czterech": "4", "pięciu": "5", "sześciu": "6"}
        q = words.get(mq.group(1).lower(), mq.group(1))
        cond.append("przy " + q + " szt.")
    ml = re.search(r"Limit:?\s*([^.]+)", text)
    detail = ""
    if "/kg" in text:
        detail = "cena za 1 kg"
    if ml:
        detail = ", ".join(x for x in [detail, "limit " + ml.group(1).strip()] if x)
    return {
        "name": name,
        "price": price,
        "oldPrice": old,
        "oldLabel": "nowa cena regularna" if regular_cut else ("cena przed obniżką" if old else ""),
        "discount": disc,
        "cond": ", ".join(cond),
        "detail": detail,
        "regularCut": regular_cut,
    }


def parse_lidl(html):
    soup = BeautifulSoup(html, "html.parser")
    offers = []
    seen = set()
    for tile in soup.select(".ABaseContentTile"):
        a = tile.find_parent("a") or tile.find("a")
        href = a.get("href") if a else ""
        if not any(p in (href or "") for p in LIDL_OFFER_PAGES):
            continue
        img = tile.find("img")
        alt = img.get("alt") if img else ""
        parsed = parse_lidl_text(alt, href)
        if not parsed or is_nonfood(parsed["name"]):
            continue
        key = (parsed["name"], parsed["price"])
        if key in seen:
            continue
        seen.add(key)
        offers.append({
            "id": offer_id("lidl", parsed["name"], parsed["price"]),
            "store": "lidl",
            "name": parsed["name"],
            "brand": "",
            "detail": parsed["detail"],
            "unitPrice": "",
            "price": parsed["price"],
            "oldPrice": parsed["oldPrice"],
            "oldLabel": parsed["oldLabel"],
            "discount": parsed["discount"],
            "cond": parsed["cond"],
            "from": None,
            "to": None,
            "category": "Nowe ceny regularne" if parsed["regularCut"] else "Najlepsze okazje",
            "week": "current",
        })
    return offers


# Produkty z siatki Lidla: każdy kafelek ma w atrybucie data-grid-data pełny opis oferty (JSON)
# z ceną, ceną sprzed obniżki, kuponem Lidl Plus, gramaturą i datami ważności.
LIDL_FOOD = {"food", "f+v"}
LIDL_PAGES = [
    ("lidl_okazje", "https://www.lidl.pl/c/najlepsze-okazje/a10009219", False),
    ("lidl_zywnosc", "https://www.lidl.pl/c/zywnosc-i-napoje/s10068374", False),
    ("lidl_promocje", "https://www.lidl.pl/c/promocje/s10076831", False),
    ("lidl_owoce", "https://www.lidl.pl/h/owoce-i-warzywa/h10071012", False),
    ("lidl_mieso", "https://www.lidl.pl/h/mieso-i-drob/h10095752", False),
    ("lidl_nabial", "https://www.lidl.pl/h/sery-nabial-i-jaja/h10095761", False),
    ("lidl_piekarnia", "https://www.lidl.pl/h/piekarnia/h10096086", False),
    ("lidl_przyprawy", "https://www.lidl.pl/h/oleje-sosy-i-przyprawy/h10096110", False),
    ("lidl_mrozonki", "https://www.lidl.pl/h/mrozonki/h10071049", False),
    ("lidl_bez_promocji", "https://www.lidl.pl/c/bez-promocji/s10089501", True),
]


def lidl_grid_items(html):
    out = []
    for raw in re.findall(r'data-grid-data="([^"]+)"', html or ""):
        try:
            out.append(json.loads(htmllib.unescape(raw)))
        except ValueError:
            continue
    return out


def lidl_brand_name(title):
    """'PILOS Masło ekstra 83%' -> ('PILOS', 'Masło ekstra 83%'); bez marki: ('', tytuł)."""
    words = title.split()
    brand = []
    for w in words[:-1]:
        letters = re.sub(r"[^A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]", "", w)
        if len(letters) >= 2 and letters == letters.upper() and len(brand) < 4:
            brand.append(w)
        else:
            break
    if brand:
        return " ".join(brand), " ".join(words[len(brand):])
    return "", title


def parse_lidl_item(d, today, regular=False):
    if not isinstance(d, dict):
        return None
    cat = str(d.get("category") or (d.get("keyfacts") or {}).get("analyticsCategory") or "").lower()
    if cat not in LIDL_FOOD:
        return None
    title = clean(d.get("fullTitle") or d.get("title"))
    if not title:
        return None
    brand, name = lidl_brand_name(title)
    if is_nonfood(name, brand):
        return None
    pr = d.get("price") or {}
    lp = (d.get("lidlPlus") or [None])[0] or {}
    cond = []
    if pr.get("price") is not None:
        p = pr
    elif (lp.get("price") or {}).get("price") is not None:
        p = lp["price"]
        cond.append("kupon Lidl Plus")
    else:
        return None
    price = round(float(p["price"]), 2)
    dd = p.get("discount") or {}
    base = clean((p.get("basePrice") or {}).get("text"))
    old = p.get("oldPrice") or dd.get("deletedPrice")
    if old is None:
        mo = re.search(r"(?:przed obniżką|poza promocją)[^0-9]{0,30}(?:1 kg = |100 g = |1 l = )?(\d+,\d\d)", base, re.I)
        if mo:
            old = pl_float(mo.group(1))
    if old is not None and float(old) <= price:
        old = None
    disc = f"-{int(dd['percentageDiscount'])}%" if dd.get("percentageDiscount") else ""
    hl = clean(lp.get("highlightText")) if cond else ""
    if hl and not disc:
        mh = re.match(r"-\s?(\d+)\s?%", hl)
        if mh:
            disc = f"-{mh.group(1)}%"
    mq = re.search(r"przy zakupie (\d+)", hl or base, re.I)
    if mq:
        cond.append(f"przy {mq.group(1)} szt.")
    # cena za kilogram/litr z części opisu przed ceną sprzed obniżki
    head = re.split(r"przed obniżką|poza promocją|najniższa cena", base, flags=re.I)[0]
    mu = re.search(r"(1 kg|100 g|1 l|100 ml)\s?=\s?(\d+,\d\d)", head)
    unit = f"={mu.group(1)} {mu.group(2)}" if mu else ""
    pack = clean((p.get("packaging") or {}).get("text"))
    ml = re.search(r"Limit:?\s*(\d+\s*(?:opak|szt|kg|g|l)\.?(?:\s+na\s+(?:kupon|paragon|osobę))?)", base, re.I)
    detail = ", ".join(x for x in [pack, ("limit " + ml.group(1).strip()) if ml else ""] if x)
    start = aldi_date(d.get("storeStartDate"))
    end = aldi_date(d.get("storeEndDate"))
    group = clean(((d.get("keyfacts") or {}).get("wonCategoryPrimary") or "").split("/")[-1])
    return {
        "id": offer_id("lidl", d.get("productId") or title, price, start),
        "store": "lidl",
        "name": name,
        "brand": brand,
        "detail": detail,
        "unitPrice": unit,
        "price": price,
        "oldPrice": round(float(old), 2) if old is not None else None,
        "oldLabel": ("nowa cena regularna" if regular else "cena przed obniżką") if old is not None else "",
        "discount": disc,
        "cond": ", ".join(cond),
        "from": start,
        "to": end,
        "category": "Nowe ceny regularne" if regular else (group or "Oferta tygodnia"),
        "week": "next" if start and start > today.isoformat() else "current",
    }


def parse_lidl_grid(html, today, regular=False):
    offers = []
    for d in lidl_grid_items(html):
        o = parse_lidl_item(d, today, regular)
        if o:
            offers.append(o)
    return offers


# ---------------------------------------------------------------- Aldi

def aldi_date(epoch):
    if not epoch:
        return None
    return dt.datetime.fromtimestamp(int(epoch), tz=WARSAW).date().isoformat()


def parse_aldi(html):
    soup = BeautifulSoup(html, "html.parser")
    script = soup.find("script", id="__NEXT_DATA__")
    if not script:
        raise ValueError("Brak __NEXT_DATA__ na stronie Aldi")
    nd = json.loads(script.string)
    api = nd["props"]["pageProps"].get("apiData")
    if isinstance(api, str):
        api = json.loads(api)
    data = None
    for entry in api:
        if entry and entry[0] == "OFFER_GET":
            data = entry[1]["res"]
    if not data:
        raise ValueError("Brak danych OFFER_GET na stronie Aldi")
    offers = []
    for pid, p in (data.get("algoliaDataMap") or {}).items():
        name = clean(p.get("name"))
        brand = clean(p.get("brandName"))
        cats = (p.get("hierarchicalCategories") or {}).get("lvl0") or []
        cat = cats[0] if cats else ""
        if cat:
            if not any(w in cat.lower() for w in ALDI_FOOD_CATEGORIES):
                continue
        elif clean(p.get("salesUnit")).lower() in NONFOOD_UNITS:
            continue
        if is_nonfood(name, brand):
            continue
        prices = []
        cur = p.get("currentPrice")
        if cur:
            prices.append((cur, aldi_date(cur.get("validFrom")), aldi_date((cur.get("validUntil") or 0))))
        for pr in p.get("promotionPrices") or []:
            prices.append((pr, pr.get("validFromLocalDate") or aldi_date(pr.get("validFrom")),
                           pr.get("validUntilLocalDate") or aldi_date(pr.get("validUntil"))))
        seen = set()
        for pr, start, end in prices:
            price = pr.get("priceValue")
            if price is None:
                continue
            key = (price, start)
            if key in seen:
                continue
            seen.add(key)
            labels = pr.get("priceTagLabels") or {}
            promo = clean(labels.get("promoText1"))
            base_info = ""
            unit_price = ""
            for bp in pr.get("basePrice") or []:
                base_info = clean(bp.get("basePriceAdditionalInformation"))
                if bp.get("basePriceValue") and bp.get("basePriceScale"):
                    unit_price = "=1 {} {}".format(bp["basePriceScale"], str(bp["basePriceValue"]).replace(".", ","))
            old = None
            mr = re.search(r"CENA REGULARNA:\s*(\d+,\d\d)", base_info)
            if mr:
                old = pl_float(mr.group(1))
            best = clean(labels.get("bestPricesWithin30daysText"))
            if old is None and best:
                mb = re.search(r"(\d+[.,]\d\d)", best)
                if mb:
                    old = pl_float(mb.group(1))
            if old is not None and (abs(old - float(price)) < 0.001 or old < float(price)):
                old = None
            disc = ""
            cond = ""
            if promo:
                pl = promo.lower().strip()
                md = re.match(r"^-?(\d+)\s?%(?:\s*taniej)?$", pl)
                if md:
                    disc = "-" + md.group(1) + "%"
                elif pl not in ("akcja", "nowość", "nowosc", "hit"):
                    cond = pl
            offers.append({
                "id": offer_id("aldi", pid, price, start),
                "store": "aldi",
                "name": name,
                "brand": brand,
                "detail": clean(p.get("salesUnit")),
                "unitPrice": unit_price,
                "price": round(float(price), 2),
                "oldPrice": old,
                "oldLabel": "cena regularna" if old else "",
                "discount": disc,
                "cond": cond,
                "from": start,
                "to": end,
                "category": cat,
                "week": "current",
            })
    return offers


# ---------------------------------------------------------------- całość

def merge_ranges(offers):
    """Łączy tę samą ofertę rozbitą na kilka przedziałów dat (np. Aldi, sekcje Kauflandu)."""
    groups = {}
    order = []
    for o in offers:
        key = (o["store"], o["brand"].lower(), o["name"].lower(), o["detail"].lower(), o["price"], o["cond"])
        if key not in groups:
            groups[key] = dict(o)
            order.append(key)
            continue
        g = groups[key]
        if o.get("from") and (not g.get("from") or o["from"] < g["from"]):
            g["from"] = o["from"]
        if o.get("to") and (not g.get("to") or o["to"] > g["to"]):
            g["to"] = o["to"]
        if not g.get("oldPrice") and o.get("oldPrice"):
            g["oldPrice"], g["oldLabel"] = o["oldPrice"], o["oldLabel"]
        if not g.get("discount") and o.get("discount"):
            g["discount"] = o["discount"]
        if g.get("category", "").startswith(("Aktualna oferta", "Tanio z")) and o.get("category"):
            g["category"] = o["category"]
    merged = []
    for key in order:
        g = groups[key]
        g["id"] = offer_id(g["store"], g["brand"], g["name"], g["detail"], g["price"], g.get("from"))
        merged.append(g)
    return merged


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--debug")
    ap.add_argument("--local")
    args = ap.parse_args()
    today = dt.datetime.now(WARSAW).date()
    fetcher = Fetcher(args.local, args.debug)
    stores = {}
    offers = []

    def run(store, fn):
        try:
            got = fn()
            offers.extend(got)
            stores[store] = {"ok": True, "count": len(got), "error": None}
            print(store, "ok", len(got))
        except Exception as e:  # noqa: BLE001
            stores[store] = {"ok": False, "count": 0, "error": repr(e)[:300]}
            print(store, "BŁĄD", e)
            traceback.print_exc()

    def kaufland():
        res = parse_kaufland(fetcher.get("kaufland_przeglad",
                                         "https://sklep.kaufland.pl/oferta/przeglad.html?kloffer-week=current"),
                             today, "current")
        try:
            nxt = fetcher.get("kaufland_next", "https://sklep.kaufland.pl/oferta/przeglad.html?kloffer-week=next")
            ids = {o["id"] for o in res}
            res += [o for o in parse_kaufland(nxt, today, "next") if o["id"] not in ids]
        except Exception as e:  # noqa: BLE001
            print("kaufland: brak oferty na następny tydzień:", e)
        if not res:
            raise ValueError("Kaufland: nie znaleziono żadnych ofert spożywczych")
        return res

    def lidl():
        res = []
        ids = set()
        keys = set()
        errors = []

        def add(o):
            key = (o["name"].lower(), o["price"], o.get("from"))
            if o["id"] in ids or key in keys:
                return
            ids.add(o["id"])
            keys.add(key)
            res.append(o)

        for name, url, regular in LIDL_PAGES:
            try:
                for o in parse_lidl_grid(fetcher.get(name, url), today, regular):
                    add(o)
            except Exception as e:  # noqa: BLE001
                errors.append(f"{name}: {e!r}"[:160])
        print("lidl: z siatki produktów", len(res), "| błędy stron:", errors or "brak")
        # stary sposób: opisy z kafelków reklamowych, gdy siatka produktów nic nie dała
        if len(res) < 10:
            for name, url in [("lidl_home", "https://www.lidl.pl/"),
                              ("lidl_okazje", "https://www.lidl.pl/c/najlepsze-okazje/a10009219")]:
                try:
                    for o in parse_lidl(fetcher.get(name, url)):
                        add(o)
                except Exception as e:  # noqa: BLE001
                    errors.append(f"{name}: {e!r}"[:160])
        if not res:
            raise ValueError("Lidl: nie znaleziono żadnych ofert spożywczych; " + "; ".join(errors))
        return res

    def aldi():
        res = parse_aldi(fetcher.get("aldi_oferty", "https://www.aldi.pl/oferty.html"))
        if not res:
            raise ValueError("Aldi: nie znaleziono żadnych ofert spożywczych")
        return res

    run("kaufland", kaufland)
    run("lidl", lidl)
    run("aldi", aldi)
    stores["biedronka"] = {"ok": False, "count": 0, "error": "Biedronka publikuje promocje tylko jako obrazki"}

    # Nie nadpisuj dobrych danych sklepu, który chwilowo nie odpowiada: weź jego ostatnie oferty.
    if os.path.exists(args.out):
        try:
            with open(args.out, encoding="utf-8") as f:
                prev = json.load(f)
            for store, st in stores.items():
                if not st["ok"] and (prev.get("stores", {}).get(store) or {}).get("ok"):
                    kept = [o for o in prev.get("offers", []) if o["store"] == store and
                            (not o.get("to") or o["to"] >= today.isoformat())]
                    offers.extend(kept)
                    st["stale"] = True
                    st["count"] = len(kept)
        except Exception as e:  # noqa: BLE001
            print("Nie udało się wczytać poprzednich promocji:", e)

    offers = [o for o in offers if not o.get("to") or o["to"] >= today.isoformat()]
    offers = merge_ranges(offers)
    result = {
        "version": 1,
        "updated": dt.datetime.now(WARSAW).isoformat(timespec="minutes"),
        "stores": stores,
        "offers": offers,
    }
    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=1)
    print("Zapisano", len(offers), "ofert do", args.out)
    if not any(s["ok"] for s in stores.values()):
        sys.exit(1)


if __name__ == "__main__":
    main()
