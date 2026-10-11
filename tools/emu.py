"""Test apki na emulatorze Androida w GitHub Actions: instaluje APK, przeklikuje ekrany po tekstach i robi zrzuty.

Wyniki (zrzuty, logcat, drzewa widoków) trafiają do katalogu debug/ i dalej na gałąź ci-emu.
"""
import os
import re
import subprocess
import time
import xml.etree.ElementTree as ET

OUT = "debug"
os.makedirs(OUT, exist_ok=True)
LOG = open(os.path.join(OUT, "steps.log"), "w")


def log(*a):
    s = " ".join(str(x) for x in a)
    print(s, flush=True)
    LOG.write(s + "\n")
    LOG.flush()


def sh(cmd, timeout=60):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout
    except Exception as e:  # noqa: BLE001
        log("BŁĄD", cmd, e)
        return ""


def shot(name):
    sh(f"adb exec-out screencap -p > {OUT}/{name}.png")
    log("zrzut", name)


def nodes(save=None):
    sh("adb shell uiautomator dump /sdcard/ui.xml", timeout=40)
    xml = sh("adb shell cat /sdcard/ui.xml")
    if save:
        open(os.path.join(OUT, save + ".xml"), "w").write(xml)
    out = []
    try:
        root = ET.fromstring(xml[xml.index("<"):])
    except Exception:  # noqa: BLE001
        return out
    for n in root.iter("node"):
        b = re.findall(r"\d+", n.get("bounds", ""))
        if len(b) != 4:
            continue
        x1, y1, x2, y2 = map(int, b)
        out.append({"text": n.get("text", ""), "desc": n.get("content-desc", ""), "cls": n.get("class", ""),
                    "x": (x1 + x2) // 2, "y": (y1 + y2) // 2, "w": x2 - x1, "h": y2 - y1})
    return out


def tap_text(t, exact=False, nth=0, save=None):
    ns = nodes(save)
    hits = [n for n in ns if (n["text"] == t or n["desc"] == t) if exact] if exact else \
        [n for n in ns if t.lower() in (n["text"] + " " + n["desc"]).lower()]
    hits = [n for n in hits if n["w"] > 4 and n["h"] > 4]
    if len(hits) <= nth:
        log("NIE ZNALEZIONO", repr(t))
        return False
    n = hits[nth]
    sh(f"adb shell input tap {n['x']} {n['y']}")
    log("tap", repr(t), n["x"], n["y"])
    time.sleep(1.5)
    return True


def back():
    sh("adb shell input keyevent 4")
    time.sleep(1.2)


def typ(s):
    sh("adb shell input text " + s.replace(" ", "%s"))
    time.sleep(0.5)


def main():
    log(sh("adb install -r groszek.apk", timeout=180))
    sh("adb logcat -c")
    sh("adb shell am start -n pl.groszek.app/.MainActivity")
    time.sleep(15)
    shot("01-start")
    nodes("01-start")
    tap_text("Zaczynamy")
    time.sleep(3)
    shot("02-home")
    nodes("02-home")
    time.sleep(9)
    shot("02b-home-bez-groszka")

    tap_text("Lista", exact=True)
    time.sleep(2)
    tap_text("Dopisz, np. jogurt")
    typ("mleko")
    sh("adb shell input keyevent 66")
    time.sleep(1.5)
    typ("chipsy")
    sh("adb shell input keyevent 66")
    time.sleep(2)
    shot("03-lista-klawiatura")
    sh("adb shell input keyevent 111")  # schowaj klawiaturę
    time.sleep(1)
    shot("03b-lista")
    back()
    back()

    tap_text("Promocje", exact=True)
    time.sleep(3)
    shot("04-promocje")
    back()

    tap_text("Przepisy", exact=True)
    time.sleep(3)
    shot("05-przepisy")
    tap_text("Owsianka z jabłkiem")
    time.sleep(2)
    shot("06-przepis")
    back()
    back()

    tap_text("Planer", exact=True)
    time.sleep(2)
    shot("07-planer")
    tap_text("Ułóż plan za kwotę")
    time.sleep(2)
    tap_text("Ułóż plan", exact=False, nth=0)
    time.sleep(5)
    shot("08-kompozytor")
    back()
    back()

    tap_text("Ustawienia")
    time.sleep(2)
    shot("09-ustawienia")
    tap_text("Kalorie dziennie")
    back()
    back()

    tap_text("Dodaj wydatek")
    time.sleep(1.5)
    for k in ["1", "2", "5"]:
        tap_text(k, exact=True)
    shot("10-wydatek")
    tap_text("Zapisz")
    time.sleep(2)
    shot("11-po-wydatku")

    sh("adb shell cmd uimode night yes")
    time.sleep(4)
    shot("12-ciemny")
    sh("adb shell cmd uimode night no")
    open(os.path.join(OUT, "logcat.txt"), "w").write(sh("adb logcat -d -v brief", timeout=60))
    log("koniec")


if __name__ == "__main__":
    main()
