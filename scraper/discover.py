"""Zapisuje surowe strony sklepów do katalogu debug, żeby było widać ich strukturę.

Uruchamiane w GitHub Actions (tam jest dostęp do stron sklepów).
"""
import json
import os
import re
import sys

import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36",
    "Accept-Language": "pl-PL,pl;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

PAGES = {
    "kaufland_next": "https://sklep.kaufland.pl/oferta/przeglad.html?kloffer-week=next",
    "biedronka_nowa_oferta": "https://www.biedronka.pl/pl/nowa-oferta",
    "biedronka_w_tym_tygodniu": "https://www.biedronka.pl/pl/w-tym-tygodniu",
    "biedronka_owoce": "https://www.biedronka.pl/pl/owoce-warzywa",
    "biedronka_mieso": "https://www.biedronka.pl/pl/mieso-ryby",
    "biedronka_promocja_nf": "https://www.biedronka.pl/pl/promocja-nf",
    "biedronka_press": "https://www.biedronka.pl/pl/press,id,1wll0t29t,title,codziennie-niskie-ceny-p-oferta-od-12-10",
    "biedronka_gazetki": "https://www.biedronka.pl/pl/gazetki",
    # widżet gazetki: z niego wiadomo, skąd bierze strony i ewentualnie produkty z cenami
    "biedronka_widget": "https://cdn.biedronka.cloud/leaflet-widget/index.js",
    # Lidl: strony z siatką produktów pokazują tylko pierwsze kafelki; szukamy API z dalszymi stronami
    "lidl_api_a": "https://www.lidl.pl/q/api/search?offset=0&fetchsize=100&locale=pl_PL&assortment=PL&version=2.1.0&category.id=10068374",
    "lidl_api_b": "https://www.lidl.pl/q/api/search?assortment=PL&locale=pl_PL&version=v2.0.0&category.id=10068374&offset=0&fetchsize=100",
    "lidl_api_c": "https://www.lidl.pl/q/api/category/zywnosc-i-napoje/s10068374?offset=12&fetchsize=48",
    "lidl_api_d": "https://www.lidl.pl/q/api/search?q=*&offset=0&fetchsize=48&locale=pl_PL&assortment=PL&version=2.1.0",
}


def summarize(html):
    soup = BeautifulSoup(html, "html.parser")
    scripts = soup.find_all("script")
    info = {
        "title": (soup.title.string or "").strip() if soup.title else "",
        "length": len(html),
        "count_zl": html.count("zł"),
        "ld_json": len(soup.find_all("script", type="application/ld+json")),
        "next_data": "__NEXT_DATA__" in html,
        "nuxt": "__NUXT__" in html,
        "script_srcs": [s.get("src") for s in scripts if s.get("src")][:40],
        "script_ids": [s.get("id") for s in scripts if s.get("id")][:40],
        "api_like": sorted(set(re.findall(r"https?://[^\"' ]*(?:api|json|graphql)[^\"' ]*", html)))[:60],
        "biedronka_urls": sorted(set(re.findall(r"https?://[a-z0-9.-]*biedronka[a-z0-9./_-]*", html)))[:60],
        "paths": sorted(set(re.findall(r"[\"'`](/[A-Za-z0-9_/${}.-]*(?:leaflet|api|page|product|area)[A-Za-z0-9_/${}.?=&-]*)[\"'`]", html)))[:80],
        "leaflet_ids": sorted(set(re.findall(r"galleryLeaflet\.init\(\"([0-9a-f-]{36})\"", html)))[:20],
        "data_attrs": sorted(set(re.findall(r"data-[a-z0-9-]+", html)))[:120],
        "classes_with_price": sorted(set(c for el in soup.find_all(class_=re.compile("price|offer|product|tile", re.I))
                                         for c in el.get("class", [])))[:120],
    }
    return info


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "debug"
    os.makedirs(out, exist_ok=True)
    summary = {}
    for name, url in PAGES.items():
        try:
            r = requests.get(url, headers=HEADERS, timeout=40, allow_redirects=True)
            with open(os.path.join(out, name + ".html"), "w", encoding="utf-8") as f:
                f.write(r.text)
            summary[name] = {"url": url, "final_url": r.url, "status": r.status_code,
                             "type": r.headers.get("content-type", ""), "head": r.text[:300], **summarize(r.text)}
            print(name, r.status_code, len(r.text))
        except Exception as e:  # noqa: BLE001
            summary[name] = {"url": url, "error": repr(e)}
            print(name, "ERROR", e)
    with open(os.path.join(out, "summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
