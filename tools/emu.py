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


def tap_class(cls, nth=0):
    hits = [n for n in nodes() if n["cls"] == cls and n["w"] > 4]
    if len(hits) <= nth:
        log("NIE ZNALEZIONO klasy", cls)
        return False
    n = hits[nth]
    sh(f"adb shell input tap {n['x']} {n['y']}")
    log("tap", cls, n["x"], n["y"])
    time.sleep(1.2)
    return True


def screen_has(t):
    ok = any(t.lower() in (n["text"] + " " + n["desc"]).lower() for n in nodes())
    log("jest" if ok else "BRAK", repr(t))
    return ok


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
    tap_text("Zaczynamy")
    time.sleep(3)
    shot("02-home")
    time.sleep(9)

    tap_text("Lista", exact=True)
    tap_class("android.widget.EditText")
    typ("mleko")
    sh("adb shell input keyevent 66")
    time.sleep(1.5)
    typ("chipsy")
    sh("adb shell input keyevent 66")
    time.sleep(2)
    shot("03-lista-klawiatura")
    back()  # chowa klawiaturę
    shot("03b-lista")
    back()
    screen_has("Na dziś możesz wydać")

    tap_text("Ustawienia")
    time.sleep(2)
    tap_text("Tryb ostry", exact=False, nth=1)
    shot("04-ustawienia")
    back()
    tap_text("Lista", exact=True)
    tap_class("android.widget.EditText")
    typ("chipsy")
    sh("adb shell input keyevent 66")
    time.sleep(2.5)
    shot("05-ostry")
    back()  # zamyka arkusz
    back()  # klawiatura
    back()
    screen_has("Na dziś możesz wydać")

    tap_text("Promocje", exact=True)
    time.sleep(3)
    shot("06-promocje")
    back()
    screen_has("Na dziś możesz wydać")

    tap_text("Przepisy", exact=True)
    time.sleep(3)
    shot("07-przepisy")
    tap_text("Owsianka z jabłkiem")
    time.sleep(2)
    shot("08-przepis")
    back()
    back()

    tap_text("Planer", exact=True)
    time.sleep(2)
    tap_text("Ułóż plan za kwotę")
    time.sleep(2)
    tap_text("Ułóż plan", exact=True)
    time.sleep(5)
    shot("09-kompozytor")
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

    tap_text("Ustawienia")
    time.sleep(2)
    for _ in range(8):
        sh("adb shell input swipe 540 2000 540 600 300")
    time.sleep(1)
    tap_text("Zapisz kopię")
    time.sleep(3)
    shot("12-kopia-udostepnij")
    back()
    back()

    # zapis danych: zamknij apkę i otwórz jeszcze raz
    sh("adb shell am force-stop pl.groszek.app")
    time.sleep(2)
    sh("adb shell am start -n pl.groszek.app/.MainActivity")
    time.sleep(10)
    shot("13-po-restarcie")
    screen_has("wydane 125,00")

    sh("adb shell cmd uimode night yes")
    time.sleep(4)
    shot("14-ciemny")
    sh("adb shell cmd uimode night no")
    open(os.path.join(OUT, "logcat.txt"), "w").write(sh("adb logcat -d -v brief", timeout=60))
    log("koniec")


if __name__ == "__main__":
    main()
