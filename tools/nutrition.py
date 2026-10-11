"""Sprawdza wartości odżywcze składników z oficjalną tabelą USDA FoodData Central (SR Legacy, domena publiczna).

Uruchamiane w GitHub Actions (stąd jest dostęp do serwera USDA): pobiera paczkę CSV, szuka każdego składnika po opisie
`usda` z ingredients_src.py i zapisuje raport różnic do debug/nutrition.md oraz wartości USDA do debug/usda_values.json.
"""
import csv
import io
import json
import os
import sys
import urllib.request
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ingredients_src import I  # noqa: E402

URL = "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip"
NUTS = {1008: 0, 1003: 1, 1004: 2, 1005: 3, 1079: 4, 1093: 5}  # kcal, białko, tłuszcz, węglowodany, błonnik, sód (mg)
OUT = sys.argv[1] if len(sys.argv) > 1 else "debug"


def main():
    os.makedirs(OUT, exist_ok=True)
    req = urllib.request.Request(URL, headers={"User-Agent": "groszek-nutrition-check"})
    raw = urllib.request.urlopen(req, timeout=120).read()
    z = zipfile.ZipFile(io.BytesIO(raw))
    names = {os.path.basename(n): n for n in z.namelist()}
    foods = {}
    with z.open(names["food.csv"]) as f:
        for row in csv.DictReader(io.TextIOWrapper(f, "utf-8")):
            foods[row["description"].strip().lower()] = row["fdc_id"]
    wanted = {}
    for k, v in I.items():
        if v.get("usda"):
            fid = foods.get(v["usda"].strip().lower())
            wanted[k] = fid
    ids = {fid for fid in wanted.values() if fid}
    vals = {fid: [None] * 6 for fid in ids}
    with z.open(names["food_nutrient.csv"]) as f:
        for row in csv.DictReader(io.TextIOWrapper(f, "utf-8")):
            fid = row["fdc_id"]
            if fid in vals:
                nid = int(row["nutrient_id"])
                if nid in NUTS:
                    vals[fid][NUTS[nid]] = float(row["amount"])
    lines = ["# Porównanie z USDA SR Legacy", "", "| składnik | pole | u nas | USDA |", "|---|---|---|---|"]
    out = {}
    missing = []
    labels = ["kcal", "białko", "tłuszcz", "węgl.", "błonnik", "sól"]
    for k, fid in wanted.items():
        if not fid:
            missing.append(f"{k}: nie znaleziono opisu „{I[k]['usda']}”")
            continue
        u = vals[fid]
        usda = [u[0], u[1], u[2], u[3], u[4], round((u[5] or 0) * 2.5 / 1000, 2)]
        out[k] = {"fdc_id": fid, "n": usda}
        for i, (a, b) in enumerate(zip(I[k]["n"], usda)):
            if b is None:
                continue
            if abs(a - b) > max(0.15 * max(abs(b), 1), 2 if i == 0 else 0.3):
                lines.append(f"| {k} | {labels[i]} | {a} | {b} |")
    lines += ["", "## Nie znalezione", ""] + [f"- {m}" for m in missing]
    open(os.path.join(OUT, "nutrition.md"), "w").write("\n".join(lines) + "\n")
    json.dump(out, open(os.path.join(OUT, "usda_values.json"), "w"), ensure_ascii=False, indent=1)
    print("\n".join(lines))


if __name__ == "__main__":
    main()
