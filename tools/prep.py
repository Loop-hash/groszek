"""Które obiady nadają się na food prep: ugotować raz, trzymać w lodówce kilka dni i odgrzewać.

Dobrze znoszą to gulasze, curry, zupy, zapiekanki, dania z kaszą albo ryżem, klopsy i pierogi.
Źle: rzeczy smażone w panierce (miękną), sałaty, jajka, kanapki i to, co składa się na świeżo.
Ryby i owoce morza zostają poza food prepem, bo po kilku dniach w lodówce tracą najbardziej.
"""
import re

GOOD_DISH = {
    "pot", "soup", "cauldron", "claypot", "tureen", "curry", "thali", "tagine", "casserole", "tray", "deepplate",
    "ricebowl", "bowl", "cloche", "pie", "spiral", "dumpling", "pierogi", "meatballs", "patties", "bento", "spaghetti",
    "noodles", "wok", "skillet", "pan", "plate", "takeout", "wrap", "samosa", "steamer", "salad", "cutlet", "mug",
}

BAD_WORDS = [
    r"jajecznic", r"omlet", r"szakszuk", r"shakshuk", r"menemen", r"[cç]ılb[ıi]r", r"sadzon", r"na miękko", r"w koszulkach",
    r"tempur", r"w panierce", r"panierowan", r"chrupi", r"frytk", r"\btost", r"kanapk", r"burger", r"hot ?dog", r"quesadill",
    r"nachos", r"pizz", r"kebab", r"zapiekanka z bagietki", r"\btaco", r"carbonar", r"aglio", r"risott", r"naleśnik", r"placki",
    r"placuszk", r"racuch", r"gofr", r"smoothie", r"owsiank", r"sushi", r"\bmaki\b", r"temaki", r"onigiri", r"tatar",
    r"carpaccio", r"ceviche", r"poke\b", r"bruschett", r"sałatka z sałat", r"caprese", r"z grilla", r"bagietk", r"bułk",
    r"lángos", r"langos", r"czebure", r"sambousek", r"pączk", r"churros", r"pita z", r"w picie", r"wrap z sałat",
    r"karaage", r"chicken 65", r"kızartma", r"korokke", r"kijowsku", r"cordon bleu", r"schabowy", r"manchurian", r"generała tso",
    r"z ananasem", r"parmeńsku", r"raclette", r"cacio e pepe", r"truskawk", r"hiyashi", r"bibim guksu", r"kimbap", r"tteokbokki",
    r"fajitas", r"moo shu", r"kathi roll", r"tantuni", r"kababi", r"pieczony ziemniak", r"kumpir", r"khai luk", r"huevos",
    r"a lo pobre", r"z grzankami",
]
# jajka znoszą odgrzewanie tylko w zupie
EGG_RE = re.compile(r"jajk|jajami|\bjaja\b|jajeczn", re.I)
SOUPY = {"soup", "mug", "pot", "tureen", "cauldron", "bowl"}

# ręczne poprawki po przejrzeniu listy
FORCE_YES = {
    'hu-toltott-kaposzta', 'it-cannelloni', 'ua-pielmieni', 'pl-zrazy', 'tr-mercimek-koftesi', 'hu-solet', 'th-khao-kha-moo',
    'ua-zielony-barszcz', 'vn-bo-kho', 'tr-orman-kebabi', 'mx-birria', 'mx-sopa-frijol', 'de-gaisburger', 'lb-harak-osbao',
    'fr-soupe-ail', 'us-potato-soup', 'fr-cebulowa', 'hu-rakott-krumpli', 'ma-tanjia', 'in-anda-curry', 'it-gatto',
    'it-torta-pasqualina', 'in-shami-kebab', 'in-pav-bhaji', 'in-keema-matar', 'us-pulled-pork', 'it-genovese', 'jp-taco-rice',
    'ge-badridzani',
}
FORCE_NO = {'pl-makaron-twarog', 'it-limone'}

BAD_RE = re.compile("|".join(BAD_WORDS), re.I)


def is_prep(rc, flags, ing_ids):
    rid = rc["id"]
    if rid in FORCE_YES:
        return True
    if rid in FORCE_NO:
        return False
    if "obiad" not in rc["meal"]:
        return False
    if {"fish", "seafood"} & set(flags):
        return False
    if BAD_RE.search(rc["name"]):
        return False
    dish = rc["icon"].get("dish") if isinstance(rc["icon"], dict) else rc["icon"][0]
    if dish not in GOOD_DISH:
        return False
    if EGG_RE.search(rc["name"]) and dish not in SOUPY:
        return False
    # sałaty i świeże liście nie przetrwają kilku dni w pudełku
    if any(i in ing_ids for i in ("salata",)):
        return False
    return True
