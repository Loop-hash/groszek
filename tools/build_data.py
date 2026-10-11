"""Buduje data/ingredients.json i data/recipes.json z plików źródłowych w tools/.

Uruchom: python3 tools/build_data.py
Sprawdza, czy każdy składnik istnieje, czy ikonki dań się nie powtarzają, i liczy kalorie oraz koszt porcji.
"""
import json
import os
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ingredients_src import I  # noqa: E402
from recipes_src import RECIPES as BASE  # noqa: E402
import glob  # noqa: E402
import importlib.util  # noqa: E402

RECIPES = list(BASE)
for _f in sorted(glob.glob(os.path.join(HERE, "recipes", "*.py"))):
    _spec = importlib.util.spec_from_file_location("przepisy_" + os.path.basename(_f)[:-3], _f)
    _mod = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(_mod)
    RECIPES.extend(_mod.RECIPES)

ROOT = os.path.dirname(HERE)
NUT = ["kcal", "protein", "fat", "carbs", "fiber", "salt"]
FLAGS_FROM = {"meat", "pork", "beef", "fish", "seafood", "dairy", "egg", "gluten", "nuts", "wholecut"}
COUNTRIES = ['Polska', 'Włochy', 'Francja', 'Hiszpania', 'Grecja', 'Niemcy', 'Węgry', 'Ukraina', 'Gruzja', 'Turcja',
             'Liban', 'Maroko', 'Indie', 'Tajlandia', 'Wietnam', 'Chiny', 'Japonia', 'Korea', 'Meksyk', 'USA', 'Podstawy']
NEEDS = {"palnik", "piekarnik", "opiekacz", "toster", "blender", "mikrofala"}


def _pixel_keys(name):
    import re
    src = open(os.path.join(ROOT, "app", "www", "js", "pixels.js"), encoding="utf-8").read()
    start = src.index(f"export const {name} = {{")
    end = src.index("};", start)
    return re.findall(r"^  (\w+): \[", src[start:end], re.M)


FOODS = _pixel_keys("FOOD")
DISHES = _pixel_keys("DISH")


def r(x, d=1):
    return round(x + 1e-9, d)


def main():
    errors = []
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ")

    ingredients = {}
    for k, v in I.items():
        e = {
            "name": v["name"], "icon": v["icon"], "cat": v["cat"],
            "n": dict(zip(NUT, v["n"])),
            "kg": v["kg"], "priceSource": v.get("obs") or ("szacunek" if v.get("est") else ""),
            "pkg": v.get("pkg"), "piece": v.get("piece"), "pantry": bool(v.get("pantry")),
            "flags": v.get("flags", []), "kw": v.get("kw", []),
        }
        if v.get("note"):
            e["note"] = v["note"]
        if v.get("usda"):
            e["usda"] = v["usda"]
        elif v.get("src"):
            e["nutritionSource"] = v["src"]
        ingredients[k] = e

    out = []
    icons = {}
    ids = set()
    for rc in RECIPES:
        if rc["id"] in ids:
            errors.append(f"powtórzone id {rc['id']}")
        ids.add(rc["id"])
        if rc["country"] not in COUNTRIES:
            errors.append(f"{rc['id']}: nieznany kraj {rc['country']}")
        dish = rc["icon"].get("dish")
        if dish not in DISHES:
            errors.append(f"{rc['id']}: nieznany kształt dania {dish}")
        cands = [rc["icon"].get("badge")] + [I[t[0]]["icon"] for t in rc["ings"] if t[0] in I and not I[t[0]].get("pantry")] + FOODS
        key = None
        for b in cands:
            if b and b in FOODS and (dish, b) not in icons:
                key = (dish, b)
                break
        if not key:
            errors.append(f"{rc['id']}: brak wolnej ikonki dla {dish}")
            continue
        icons[key] = rc["id"]
        rc["icon"] = {"dish": key[0], "badge": key[1]}
        for nd in rc["needs"]:
            for alt in nd.split("|"):
                if alt not in NEEDS:
                    errors.append(f"{rc['id']}: nieznany sprzęt {alt}")
        tot = {k: 0.0 for k in NUT}
        cost = 0.0
        flags = set()
        ings = []
        for t in rc["ings"]:
            iid, g = t[0], t[1]
            q = t[2] if len(t) > 2 else None
            if iid not in I:
                errors.append(f"{rc['id']}: brak składnika {iid}")
                continue
            src = I[iid]
            for k, val in zip(NUT, src["n"]):
                tot[k] += val * g / 100
            cost += src["kg"] * g / 1000
            flags |= set(src.get("flags", [])) & FLAGS_FROM
            e = {"i": iid, "g": g}
            if q:
                e["q"] = q
            ings.append(e)
        p = rc["portions"]
        per = {k: r(v / p, 0 if k == "kcal" else 1) for k, v in tot.items()}
        o = {
            "id": rc["id"], "name": rc["name"], "country": rc["country"], "icon": rc["icon"],
            "portions": p, "time": rc["time"], "needs": rc["needs"], "meal": rc["meal"],
            "ings": ings, "steps": rc["steps"], "nutrition": per, "costBase": r(cost / p, 2),
            "flags": sorted(flags), "veg": not ({"meat", "fish", "seafood"} & flags),
        }
        if rc.get("tip"):
            o["tip"] = rc["tip"]
        out.append(o)

    if errors:
        print("\n".join(errors))
        sys.exit(1)

    by_country = {}
    for o in out:
        by_country.setdefault(o["country"], 0)
        by_country[o["country"]] += 1
    os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
    with open(os.path.join(ROOT, "data", "ingredients.json"), "w", encoding="utf-8") as f:
        json.dump({"version": 1, "updated": now, "ingredients": ingredients}, f, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(ROOT, "data", "recipes.json"), "w", encoding="utf-8") as f:
        json.dump({"version": 1, "updated": now, "count": len(out), "source": "Przepisy napisane dla Groszka",
                   "recipes": out}, f, ensure_ascii=False, separators=(",", ":"))
    for o in out:
        n = o["nutrition"]
        print(f"{o['country']:10} {o['name'][:42]:42} {n['kcal']:5.0f} kcal  B{n['protein']:5.1f}  T{n['fat']:5.1f}  W{n['carbs']:5.1f}  "
              f"bł{n['fiber']:4.1f} s{n['salt']:4.1f}  {o['costBase']:5.2f} zł")
    print(len(out), "przepisów,", len(ingredients), "składników;", by_country)


if __name__ == "__main__":
    main()
