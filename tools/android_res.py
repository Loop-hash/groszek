"""Rysunki Groszosława dla widżetów i powiadomień (wektory Androida) z pikseli w app/www/js/pixels.js.

python3 tools/android_res.py   zapisuje app/android/app/src/main/res/drawable/mascot_*.xml i ic_stat_groszek.xml
Kolory biorą się z @color/widget_ink i @color/widget_paper, więc w trybie ciemnym widżet sam się odwraca.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from costumes import SPR  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app", "android", "app", "src", "main", "res", "drawable")


def runs(rows, chars):
    d = []
    for y, r in enumerate(rows):
        x = 0
        while x < len(r):
            if r[x] in chars:
                s = x
                while x < len(r) and r[x] in chars:
                    x += 1
                d.append(f"M{s},{y}h{x - s}v1h{s - x}z")
            else:
                x += 1
    return "".join(d)


def vector(paths, size=24):
    body = "".join(f'\n    <path android:fillColor="{c}" android:pathData="{d}" />' for c, d in paths if d)
    return (f'<?xml version="1.0" encoding="utf-8"?>\n'
            f'<!-- Wygenerowane przez tools/android_res.py -->\n'
            f'<vector xmlns:android="http://schemas.android.com/apk/res/android"\n'
            f'    android:width="{size}dp" android:height="{size}dp"\n'
            f'    android:viewportWidth="{size}" android:viewportHeight="{size}">{body}\n</vector>\n')


def main():
    os.makedirs(OUT, exist_ok=True)
    for mood in ("pea", "happy", "worried"):
        rows = SPR[mood]
        xml = vector([("@color/widget_paper", runs(rows, "oc")), ("@color/widget_ink", runs(rows, "#"))])
        open(os.path.join(OUT, f"mascot_{mood}.xml"), "w").write(xml)
    # ikonka na pasku powiadomień: sam kontur, biały na przezroczystym
    open(os.path.join(OUT, "ic_stat_groszek.xml"), "w").write(vector([("#FFFFFFFF", runs(SPR["pea"], "#"))]))
    print("ok")


if __name__ == "__main__":
    main()
