"""Sprawdza przepisy pod kątem braków w składnikach i przyprawach.

python3 tools/audit.py            -> podsumowanie
python3 tools/audit.py -v [kraj]  -> wszystkie znalezione przepisy

A: w nazwie albo krokach jest składnik, którego nie ma na liście (zaniża cenę).
B: składnik jest na liście, ale kroki nie mówią, kiedy go dodać (zwłaszcza przyprawy).
C: danie wytrawne bez żadnych przypraw poza solą i pieprzem.
"""
import glob
import importlib.util
import os
import re
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ingredients_src import I  # noqa: E402
from recipes_src import RECIPES as BASE  # noqa: E402


def load():
    out = [dict(r, file="recipes_src.py") for r in BASE]
    for f in sorted(glob.glob(os.path.join(HERE, "recipes", "*.py"))):
        spec = importlib.util.spec_from_file_location("a_" + os.path.basename(f)[:-3], f)
        m = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(m)
        out += [dict(r, file=os.path.basename(f)) for r in m.RECIPES]
    return out


def norm(s):
    s = s.lower().replace("ł", "l")
    s = unicodedata.normalize("NFD", s)
    return "".join(c for c in s if not unicodedata.combining(c))


# wzorce na tekście bez polskich znaków; grupy: wzmianka o jednym spełnia też pozostałe
P = {
    "makaron": r"\bmakaron\w*\b(?! ryzow| jajeczn)|\bspaghetti|\bpenne|\bswiderk|\brurk|\bkokardk|\bfusilli|\btagliatell|\bfarfall|\bmuszelk|\bkolanka|\blasagn",
    "makaron_ryzowy": r"makaron\w* ryzow",
    "makaron_jajeczny": r"makaron\w* jajeczn|\bnitk[ia]\b|\bwstazk",
    "ryz": r"\bryz(?!ow)\w*\b(?! do risotto| do sushi| jasmin)",
    "ryz_jasminowy": r"jasminow",
    "ryz_risotto": r"risott|arborio",
    "ryz_sushi": r"ryz\w* (do )?sushi",
    "kuskus": r"kuskus", "bulgur": r"bulgur",
    "kasza_gryczana": r"gryczan", "kasza_jeczmienna": r"peczak|jeczmien", "kasza_jaglana": r"jaglan",
    "kasza_manna": r"kasz\w* mann|semolin",
    "maka": r"\b(mak[aie]|mace)\b(?! kukurydz| ryzow| z ciecierzyc| ciecierzyc| ziemniaczan)",
    "maka_kukurydziana": r"mak\w* kukurydz|polent|kasz\w* kukurydz",
    "maka_ciecierzycowa": r"mak\w* (z )?ciecierzyc|besan",
    "maka_ryzowa": r"mak\w* ryzow",
    "platki_owsiane": r"owsian",
    "chleb": r"\bchleb\w*\b(?! tostow)|\bgrzank|\bkromk",
    "chleb_tostowy": r"tostow",
    "pita": r"\bpit(a|e|y|ach|ami|ie)\b|\bpicie\b|\bpitk",
    "tortilla": r"tortill",
    "bulki": r"\bbul(ka|ki|ke|ek|kach|kami|eczk\w*)\b(?! tart)|\bkajzerk",
    "bagietka": r"bagiet",
    "bajgle": r"bajgl|bajgiel",
    "jajka": r"\bjaj|\bzoltk|\bbialk(a|ami|iem|u)\b",
    "mleko": r"\bmlek\w*\b(?! kokos)",
    "mleko_kokosowe": r"mleczk\w* kokos|mlek\w* kokos",
    "maslo": r"\bmasl(?!ank)\w*\b(?! orzech)",
    "maslo_orzechowe": r"masl\w* orzech",
    "smietana": r"\bsmietan(?!k)\w*",
    "smietanka": r"\bsmietank",
    "jogurt": r"\bjogur(t|c)\w*\b(?! grecki)",
    "jogurt_grecki": r"jogurt\w* grecki|\blabneh",
    "kefir": r"kefir|maslank",
    "twarog": r"twarog|twarozk",
    "ser_zolty": r"\bser\b|\bsera\b|\bserem\b|\bsery\b|\bserze\b|\bgouda|\bedam|\bcheddar",
    "feta": r"\bfet(a|y|e|ie)\b|bryndz|solankow",
    "mozzarella": r"mozzarell",
    "parmezan": r"parmezan|grana|pecorino",
    "paneer": r"paneer|halloumi|do smazenia",
    "serek_wiejski": r"wiejsk",
    "serek_smietankowy": r"serk\w* smietank|serek\w* smietank|kremow\w* ser|serek kremow|serkiem",
    "kurczak": r"kurcz|\bpiers|\budk|\bdrob",
    "indyk": r"indyk|indycz",
    "mielone_wieprzowe": r"\bmielon|\bmies[aoe]\w*",
    "wolowina_mielona": r"\bmielon|wolow|\bmies[aoe]\w*",
    "mielone_drobiowe": r"\bmielon|\bmies[aoe]\w*|drob",
    "wolowina_gulasz": r"wolow|\bmies[aoe]\w*",
    "lopatka": r"lopatk|wieprzow|\bmies[aoe]\w*",
    "schab": r"schab|kotlet|\bmies[aoe]\w*",
    "watrobka": r"watrob",
    "kielbasa": r"kielbas|chorizo",
    "boczek": r"boczek|boczk|bekon",
    "szynka": r"szynk",
    "parowki": r"parow(k|ek)",
    "kaszanka": r"kaszank",
    "ziemniaki": r"ziemniak|ziemniaczk|kartofl",
    "cebula": r"\bcebul",
    "dymka": r"dymk|szczypior",
    "czosnek": r"\bczosn|\bzabk",
    "pomidory": r"\bpomidor(?!ow\w)\w*",
    "pomidory_puszka": r"\bpomidor(?!ow)\w*|z puszki",
    "passata": r"passat|passac|przecier|\bpomidor(?!ow)\w*",
    "koncentrat": r"koncentrat",
    "papryka": r"papryk",
    "papryka_slodka": r"papryk",
    "marchew": r"marchew|marchw|marchewk",
    "ogorek": r"\bogor|\bogork",
    "ogorki_kiszone": r"\bogor|\bogork|korniszon",
    "kapusta": r"\bkapust",
    "kapusta_kiszona": r"kapust\w* kiszon|kiszon\w* kapust",
    "kapusta_pekinska": r"pekinsk|\bkapust",
    "pieczarki": r"pieczar|grzyb",
    "buraki": r"burak|buracz",
    "cukinia": r"cukini",
    "natka": r"natk|pietruszk",
    "pietruszka": r"pietruszk",
    "salata": r"\bsalat(?!k)\w*",
    "rzodkiewka": r"rzodkiew",
    "imbir": r"\bimbir",
    "imbir_mielony": r"\bimbir",
    "bataty": r"batat",
    "brokul": r"brokul",
    "kalafior": r"kalafior",
    "por": r"\bpor\b|\bpora\b|\bporem\b|\bporu\b|\bporow\b|\bpory\b|\bporami\b",
    "seler": r"seler",
    "dynia": r"\bdyni",
    "baklazan": r"baklazan",
    "szpinak": r"szpinak", "szpinak_mrozony": r"szpinak",
    "awokado": r"awokad|guacamol",
    "papryczka_chili": r"papryczk|\bchili|jalapen",
    "chili": r"\bchili|papryczk|ostr\w* papryk",
    "bazylia": r"bazyli", "bazylia_suszona": r"bazyli",
    "koperek": r"\bkoper(?!t)", "kolendra": r"kolendr", "kolendra_mielona": r"kolendr",
    "mieta": r"\bmiet[aeoy]\w*|\bmietow",
    "trawa_cytrynowa": r"traw\w* cytryn",
    "kimchi": r"kimchi", "kielki": r"kielk",
    "kukurydza": r"kukurydz(?!ian)",
    "oliwki": r"oliwk",
    "ananas": r"ananas",
    "groszek": r"\bgroszk|\bgroszek",
    "fasolka": r"fasolk",
    "warzywa_mrozone": r"mieszank\w* warzyw|warzyw\w* mrozon|na patelni\w* warzyw|warzyw",
    "owoce_lesne": r"owoc\w* lesn|jagod|borowk|malin",
    "bob": r"\bbob\b|\bbobu\b|\bbobem\b",
    "ciasto_filo": r"\bfilo\b",
    "ciasto_francuskie": r"ciast\w* francusk",
    "cytryna": r"cytryn(?!ow)", "limonka": r"limonk|limonek",
    "jablko": r"jablk|jablek", "banan": r"banan", "pomarancza": r"pomarancz", "truskawki": r"truskaw", "sliwki": r"sliwk",
    "awokado_": r"",
    "fasola_czerwona": r"\bfasol(?!k)", "fasola_biala": r"\bfasol(?!k)", "fasola_czarna": r"\bfasol(?!k)",
    "ciecierzyca": r"ciecierzyc|hummus|falafel",
    "soczewica_czerwona": r"soczewic", "soczewica_zielona": r"soczewic",
    "tofu": r"\btofu", "groch": r"\bgroch(?!ow)\w*|\bgrochem",
    "sos_sojowy": r"sojow", "pasta_curry": r"past\w* curry", "pasta_curry_czerwona": r"past\w* curry",
    "ketchup": r"ketchup", "ocet": r"\bocet|\boctu|\boctem", "tahini": r"tahin", "musztarda": r"musztard",
    "majonez": r"majonez", "gochujang": r"gochujang", "miso": r"\bmiso", "nori": r"\bnori",
    "sos_bbq": r"barbecue|\bbbq", "hoisin": r"hoisin", "papier_ryzowy": r"papier\w* ryz",
    "zakwas_zurek": r"zakwas|\bzur(ek|ku|kiem)\b", "ajvar": r"ajvar",
    "orzeszki": r"orzesz|orzech", "orzechy_wloskie": r"orzech", "nerkowce": r"nerkow|orzech", "migdaly": r"migdal|orzech",
    "pestki_dyni": r"pestkidyni", "slonecznik": r"slonecznik", "sezam": r"\bsezam(?!ow)",
    "rodzynki": r"rodzyn", "wiorki_kokosowe": r"wiork|kokos", "morele_suszone": r"morel",
    "olej": r"\bolej\w*\b(?! sezam)|\btluszcz|natluszcz", "oliwa": r"\boliw(?!k)|\btluszcz|natluszcz",
    "olej_sezamowy": r"olej\w* sezam",
    "cukier": r"cukier|cukr|slodz|karmeliz", "miod": r"\bmiod", "dzem": r"dzem|konfitur|powidl",
    "skrobia": r"skrobi|ziemniaczan", "proszek": r"proszek do piecz|proszku do piecz|\bproszkiem\b|\bproszek\b", "drozdze": r"drozdz",
    "bulka_tarta": r"bul\w* tart|panier", "kakao": r"kakao",
    "bulion": r"bulion|rosol|kostk", "sol": r"\bsol\b|\bsoli\b|\bsola\b|\bposol|\bosol|\bdosol|\bsolon|\bsolic",
    "pieprz": r"pieprz", "curry": r"(?<!past[aey] )(?<!pasta )\bcurry", "kmin": r"\bkmin(u|em|ie)?\b|kmin rzym",
    "kminek": r"kminek|kminku|kminkiem", "cynamon": r"cynamon", "oregano": r"oregan", "majeranek": r"majeran",
    "kurkuma": r"kurkum", "galka_muszkatolowa": r"muszkat", "ziele_angielskie": r"\bziel(e|a|em)\b", "lisc_laurowy": r"laurow", "tymianek": r"tymian",
    "rozmaryn": r"rozmaryn", "czosnek_granulowany": r"\bczosn", "garam_masala": r"garam", "gorczyca": r"gorczyc",
    "krewetki": r"krewet", "kalmary": r"kalmar", "malze": r"\bmalz|\bmul", "owoce_morza": r"owoc\w* morza",
    "losos": r"losos", "dorsz": r"dorsz|mintaj|\bryb", "tunczyk": r"tunczyk", "sardynki": r"sardyn", "pstrag": r"pstrag",
    "sledz": r"sledz|sledzi", "makrela": r"makrel", "paluszki_krabowe": r"krab|surimi",
}
P.pop("awokado_")

# Dodatkowe wzmianki, które w krokach wystarczą, gdy składnik już jest na liście ("kaszę" przy kaszy gryczanej)
PB = {
    "kasza_gryczana": r"\bkasz", "kasza_jaglana": r"\bkasz", "kasza_jeczmienna": r"\bkasz", "kasza_manna": r"\bkasz",
    "bulgur": r"\bkasz", "lisc_laurowy": r"\blisc", "ryz_risotto": r"\bryz", "ryz_jasminowy": r"\bryz", "ryz_sushi": r"\bryz",
    "tortilla": r"\bplack|\bplacuszk|\bzawij|\bwrap", "pita": r"\bplack|\bplacuszk", "chleb_tostowy": r"\btost|\bkromk",
    "makaron_ryzowy": r"\bmakaron|\bnudl", "makaron_jajeczny": r"\bmakaron", "mleko_kokosowe": r"\bmleczk",
    "ser_zolty": r"\bser", "parmezan": r"\bser", "mozzarella": r"\bser", "feta": r"\bser", "paneer": r"\bser",
    "soczewica_czerwona": r"soczewic", "soczewica_zielona": r"soczewic", "warzywa_mrozone": r"warzyw",
    "papryczka_chili": r"\bchili|papryczk", "ciasto_francuskie": r"\bciast", "ciasto_filo": r"\bciast", "pasta_curry": r"\bpast", "pasta_curry_czerwona": r"\bpast", "proszek": r"\bproszk|\bproszek", "platki_owsiane": r"\bplatk", "jajka": r"\bjaj|\bjajecz|\bomlet",
}

# Słowa, które w krokach nie znaczą składnika z listy (sałatka to danie, nie sałata)
STOP_IN_NAME = {"curry", "pasta_curry", "pasta_curry_czerwona", "makaron", "papryka", "papryka_slodka", "chili", "ser_zolty",
                "mielone_wieprzowe", "wolowina_mielona", "mielone_drobiowe", "warzywa_mrozone", "kurczak", "bulion", "ryz",
                "dorsz", "ziemniaki", "cebula", "pomidory", "pomidory_puszka", "passata", "tortilla", "fasolka", "chleb", "maka"}
# Te nie potrzebują osobnej linijki na liście (woda) albo są zbyt ogólne, żeby wnioskować z samej wzmianki
NO_A = {"warzywa_mrozone", "mielone_wieprzowe", "wolowina_mielona", "mielone_drobiowe", "wolowina_gulasz", "lopatka", "schab",
        "pomidory_puszka", "passata", "kapusta_pekinska", "ogorki_kiszone", "natka", "pietruszka", "imbir_mielony", "bazylia_suszona",
        "kolendra_mielona", "czosnek_granulowany", "szpinak_mrozony", "fasola_biala", "fasola_czarna", "soczewica_zielona",
        "pasta_curry_czerwona", "orzechy_wloskie", "nerkowce", "migdaly", "wiorki_kokosowe", "chili", "papryka_slodka", "oliwa",
        "serek_smietankowy", "paneer", "serek_wiejski", "kurczak", "dorsz", "makaron", "kasza_manna", "olej", "kapusta",
        "skrobia", "jogurt_grecki", "smietanka", "pomidory", "mleko_kokosowe", "bulion", "papryczka_chili", "ogorek"}

FAMILIES = [
    {"makaron", "makaron_ryzowy", "makaron_jajeczny"}, {"ryz", "ryz_jasminowy", "ryz_risotto", "ryz_sushi"},
    {"maka", "maka_kukurydziana", "maka_ciecierzycowa", "maka_ryzowa"},
    {"chleb", "chleb_tostowy", "bulki", "bagietka", "bajgle", "pita", "tortilla"},
    {"smietana", "smietanka"}, {"jogurt", "jogurt_grecki", "kefir"},
    {"ser_zolty", "feta", "mozzarella", "parmezan", "paneer", "serek_wiejski", "serek_smietankowy", "twarog"},
    {"kurczak", "indyk", "mielone_wieprzowe", "wolowina_mielona", "mielone_drobiowe", "wolowina_gulasz", "lopatka", "schab", "watrobka"},
    {"kielbasa", "parowki", "szynka", "boczek", "kaszanka"}, {"cebula", "dymka", "por"}, {"czosnek", "czosnek_granulowany"},
    {"pomidory", "pomidory_puszka", "passata", "koncentrat"}, {"papryka", "papryka_slodka", "ajvar"},
    {"papryczka_chili", "chili", "gochujang"}, {"ogorek", "ogorki_kiszone"}, {"kapusta", "kapusta_kiszona", "kapusta_pekinska"},
    {"natka", "pietruszka"}, {"bazylia", "bazylia_suszona"}, {"kolendra", "kolendra_mielona"}, {"imbir", "imbir_mielony"},
    {"szpinak", "szpinak_mrozony"}, {"fasola_czerwona", "fasola_biala", "fasola_czarna"}, {"soczewica_czerwona", "soczewica_zielona"},
    {"pasta_curry", "pasta_curry_czerwona"}, {"orzeszki", "orzechy_wloskie", "nerkowce", "migdaly", "maslo_orzechowe"},
    {"mleko", "mleko_kokosowe"}, {"olej", "oliwa", "olej_sezamowy"},
    {"dorsz", "losos", "tunczyk", "sardynki", "pstrag", "sledz", "makrela"}, {"krewetki", "kalmary", "malze", "owoce_morza"},
    {"cytryna", "limonka"}, {"kmin", "kminek"},
]
FAM = {}
for f in FAMILIES:
    for x in f:
        FAM[x] = f

SPICES = {k for k, v in I.items() if v["cat"] == "przyprawy"} - {"bulion"}
FLAVOR = (SPICES - {"sol", "pieprz"}) | {
    "czosnek", "czosnek_granulowany", "imbir", "papryczka_chili", "sos_sojowy", "pasta_curry", "pasta_curry_czerwona", "gochujang",
    "miso", "musztarda", "ocet", "sos_bbq", "hoisin", "ajvar", "kimchi", "bulion", "natka", "koperek", "bazylia", "kolendra", "mieta",
    "trawa_cytrynowa", "cytryna", "limonka", "parmezan", "feta", "tahini", "boczek", "ketchup", "zakwas_zurek", "kapusta_kiszona",
    "ogorki_kiszone", "oliwki", "dymka", "olej_sezamowy", "koncentrat"}


def mentioned(iid, text):
    pat = P.get(iid)
    return bool(pat) and re.search(pat, text) is not None


# słowa, które w danym przepisie znaczą co innego (tortilla de patatas to omlet, nie placek)
IGNORE = {"es-tortilla": {"tortilla"}, "it-stracciatella": {"makaron_jajeczny"}, "it-pasta-patate": {"ryz_risotto"},
          "it-farinata": {"ciecierzyca"}, "gr-fava": {"groszek"}, "gr-fasolakia": {"fasola_czerwona"}, "ge-kupaty": {"kielbasa"}, "ge-saciwi": {"smietana"},
          "ge-kotmis-salati": {"salata"}, "lb-batata-harra": {"bataty"}, "lb-kibbet-batata": {"bataty"}, "lb-batata-mahshi": {"bataty"},
          "lb-kafta-tahini": {"smietana"}, "ma-merguez": {"kielbasa"}, "ma-tajine-pomidory": {"dzem"}, "ma-sfenj": {"mieta"}, "ma-kuskus-tfaya": {"cukier"}, "ma-batbout": {"pita", "bulki"}, "in-chettinad": {"proszek"}, "in-mulligatawny": {"malze"}, "th-larb": {"maka"}, "th-jok": {"platki_owsiane"}, "th-ba-mee": {"cukier"},
          "th-por-pia-tod": {"por"}, "jp-napolitan": {"cukier"}, "jp-kare-pan": {"bulki"}, "kr-doenjang-jjigae": {"sos_sojowy"}, "kr-jjajangmyeon": {"fasola_czerwona"},
          "kr-gyeranppang": {"bulki"}, "us-chicago-dog": {"ketchup"}, "us-po-boy": {"bulka_tarta"}, "pl-pasta-makrela": {"sol"}, "lb-sayadieh": {"cukier"}, "hu-pogacsa": {"bulki"}, "tr-pogaca": {"bulki"}, "in-koliwada": {"ciecierzyca"}, "us-biscuits-gravy": {"bulki", "kielbasa"}, "gr-kritharoto": {"ryz_risotto"}, "in-besan-chilla": {"ciecierzyca"}, "it-polenta-ragu": {"kielbasa"}, "it-boscaiola": {"kielbasa"},
          "it-zucca-salsiccia": {"kielbasa"}, "it-fagioli": {"kielbasa"}}
# dania, w których sól, pieprz i cebula to cała tradycyjna przyprawa (sprawdzone ręcznie)
PLAIN_OK = {"us-denver-omelette", "us-pasties", "ba-burek", "ba-krompirusa", "ua-shuba",
            "es-tortilla", "hu-pogacsa", "pd-kanapki-jajko", "pd-kanapki-ser", "de-toast-hawaii", "fr-croque", "fr-galette", "fr-cordon-bleu",
            "fr-coquillettes", "ge-elardzi", "it-piadina", "ma-saykouk", "pl-placki", "pl-kopytka", "pl-ruskie", "pl-fasolka-szparagowa",
            "ua-salatka-ananas", "ua-mlynci-mieso"}
NOISE = re.compile(r"wielkosci (orzecha|orzechow|orzeszk\w*)|fasolka po bretonsku")


def audit(r):
    ids = [t[0] for t in r["ings"]]
    steps = re.sub(r"makaron\w* jajeczn\w*", "makaron", NOISE.sub("", norm(" ".join(r["steps"]))))
    steps = re.sub(r"pest\w* dyni\w*", "pestkidyni", steps)
    name = re.sub(r"makaron\w* jajeczn\w*", "makaron", norm(r["name"]).replace("fasolka po bretonsku", ""))
    name = re.sub(r"pest\w* dyni\w*", "pestkidyni", name)
    a, b = [], []
    have = set(ids)
    for x in ids:
        have |= FAM.get(x, set())
    for iid, pat in P.items():
        if iid in have or iid in NO_A or not pat or iid in IGNORE.get(r["id"], ()):
            continue
        in_steps = re.search(pat, steps)
        in_name = iid not in STOP_IN_NAME and re.search(pat, name)
        if not (in_steps or in_name):
            continue
        # któryś składnik z listy pasuje do tej samej wzmianki (np. "olej" przy oliwie)
        hit = (in_steps or in_name).group(0)
        if any(re.search(P.get(j, "$^"), hit) for j in ids):
            continue
        a.append(iid)
    for iid in ids:
        if iid not in P:
            continue
        pats = [P[j] for j in ({iid} | FAM.get(iid, set())) if j in P] + ([PB[iid]] if iid in PB else [])
        if not any(re.search(pt, steps) for pt in pats):
            b.append(iid)
    savory = bool({"obiad", "kolacja"} & set(r["meal"])) and not ({"cukier", "miod", "dzem", "owoce_lesne", "banan", "kakao"} & set(ids))
    c = savory and not (FLAVOR & set(ids)) and r["id"] not in PLAIN_OK
    return a, b, c


def main():
    rs = load()
    verbose = "-v" in sys.argv
    only = next((x for x in sys.argv[1:] if not x.startswith("-")), None)
    na = nb = nbs = nc = 0
    for r in rs:
        if only and not r["file"].startswith(only) and r["country"] != only:
            continue
        a, b, c = audit(r)
        bs = [x for x in b if x in SPICES or x == "bulion"]
        na += bool(a)
        nb += bool(b)
        nbs += bool(bs)
        nc += bool(c)
        if verbose and (a or b or c):
            print(f"{r['id']:28} {r['name'][:44]:44} A:{','.join(a) or '-'}  B:{','.join(b) or '-'}  {'C' if c else ''}")
    print(f"przepisów {len(rs)}; A (brak na liście) {na}; B (nie ma w krokach) {nb}, w tym przyprawy {nbs}; C (bez przypraw) {nc}")


if __name__ == "__main__":
    main()
