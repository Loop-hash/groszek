"""Próba: czy da się odczytać promocje z gazetki Biedronki (same obrazki stron).

Pobiera kilka stron aktualnej gazetki spożywczej, czyta je Tesseractem i zapisuje obrazki
oraz tekst do katalogu debug. Na razie tylko do oceny jakości, nie zapisuje promocji.
python scraper/biedronka_ocr.py debug/biedronka_ocr [liczba_stron]
"""
import json
import os
import re
import subprocess
import sys

import requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36",
    "Accept-Language": "pl-PL,pl;q=0.9",
}
API = "https://leaflet-api.prod.biedronka.cloud/api/leaflets/{}?ctx=web"


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "debug/biedronka_ocr"
    pages = int(sys.argv[2]) if len(sys.argv) > 2 else 6
    os.makedirs(out, exist_ok=True)
    html = requests.get("https://www.biedronka.pl/pl/w-tym-tygodniu", headers=HEADERS, timeout=40).text
    ids = re.findall(r'galleryLeaflet\.init\("([0-9a-f-]{36})"', html)
    print("gazetki:", ids)
    if not ids:
        return
    data = requests.get(API.format(ids[0]), headers=HEADERS, timeout=40).json()
    imgs = [p.get("image") for p in data.get("images_mobile", []) if p.get("image")]
    print("stron:", len(imgs))
    summary = []
    for i, url in enumerate(imgs[1:1 + pages], start=1):
        path = os.path.join(out, f"strona{i:02d}.png")
        with open(path, "wb") as f:
            f.write(requests.get(url, headers=HEADERS, timeout=60).content)
        res = {"page": i, "url": url}
        for psm in ("11", "3"):
            r = subprocess.run(["tesseract", path, "stdout", "-l", "pol", "--psm", psm], capture_output=True, text=True, timeout=120)
            txt = r.stdout
            with open(os.path.join(out, f"strona{i:02d}_psm{psm}.txt"), "w", encoding="utf-8") as f:
                f.write(txt)
            res["psm" + psm] = {"chars": len(txt), "ceny": re.findall(r"\d+[,.]\d\d", txt)[:30]}
        summary.append(res)
        print(i, url[-60:], res["psm11"]["ceny"][:8])
    with open(os.path.join(out, "wynik.json"), "w", encoding="utf-8") as f:
        json.dump({"leaflet": ids[0], "pages": len(imgs), "summary": summary}, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
