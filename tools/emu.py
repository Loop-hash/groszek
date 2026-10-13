"""Test apki na emulatorze Androida w GitHub Actions: instaluje APK, przeklikuje ekrany po tekstach i robi zrzuty.

Wyniki (zrzuty, logcat, drzewa widoków) trafiają do katalogu debug/ i dalej na gałąź ci-emu.
"""
import base64
import json
import os
import re
import subprocess
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET

OUT = "debug"
os.makedirs(OUT, exist_ok=True)
LOG = open(os.path.join(OUT, "steps.log"), "w")


# Najważniejsze sprawdzenia (aktualizacje): gdy któreś się nie uda, test kończy się błędem i widać to w Actions
FAILED = []


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


def dismiss_anr():
    # emulator bywa zamulony i pokazuje "... isn't responding" od launchera
    xml = sh("adb shell uiautomator dump /sdcard/ui.xml && adb shell cat /sdcard/ui.xml", timeout=40)
    if "isn't responding" in xml or "nie odpowiada" in xml:
        m = re.search(r'text="Wait"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', xml)
        if m:
            x1, y1, x2, y2 = map(int, m.groups())
            sh(f"adb shell input tap {(x1 + x2) // 2} {(y1 + y2) // 2}")
            log("zamknięto okno ANR")
            time.sleep(2)


def nodes(save=None):
    dismiss_anr()
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


def web_update_test():
    """Aktualizacja samej strony: pobranie paczki, przeładowanie bez instalatora, odczyt paragonu na nowej stronie."""
    ws, ev = connect()
    if ws is None:
        log("aktualizacja strony: brak połączenia")
        return
    r = val(ev("(async () => { const g = window.groszek; const u = await g.checkForUpdate(); if (!u) return 'brak wydania';"
               " const info = await Capacitor.Plugins.Updater.info(); g.update = Object.assign({}, u, { newer: true });"
               " g.installUpdate(); return JSON.stringify({ build: u.build, native: u.native, web: u.web, info }); })()"))
    log("aktualizacja strony: start", r)
    # w trakcie przeładowania połączenie z debugerem może zawisnąć: nowe po chwili
    try:
        ws.close()
    except Exception:  # noqa: BLE001
        pass
    time.sleep(25)
    ws, ev = connect(start=False)
    if ws is None:
        log("aktualizacja strony: ŹLE, brak połączenia po przeładowaniu")
        FAILED.append("aktualizacja strony")
        return
    got = None
    for _ in range(20):
        time.sleep(4)
        try:
            v = val(ev("(async () => { const i = await Capacitor.Plugins.Updater.info();"
                       " const b = await (await fetch('build.json', { cache: 'no-store' })).json();"
                       " const t = await fetch('js/vendor/tesseract/tesseract.min.js');"
                       " return JSON.stringify({ webPath: i.webPath, build: b.build, vendor: t.status, screen: !!document.querySelector('#app main') }); })()"))
        except Exception as e:  # noqa: BLE001
            v = "błąd " + repr(e)
        if isinstance(v, str) and '"webPath":"/' in v:
            got = v
            break
    shot("17-po-aktualizacji-strony")
    installer = "packageinstaller" in sh("adb shell uiautomator dump /sdcard/ui.xml && adb shell cat /sdcard/ui.xml", timeout=40)
    log("aktualizacja strony:", "OK" if got else "ŹLE", got, "| okienko instalatora:", "TAK" if installer else "nie")
    if not got:
        FAILED.append("aktualizacja strony")
    if got:
        time.sleep(3)
        b64 = base64.b64encode(open("tools/test-paragon.jpg", "rb").read()).decode()
        v = val(ev("(async () => { const m = await import('./js/receipt.js'); m.opts.engine = 'auto';"
                   " const b = await (await fetch('data:image/jpeg;base64,%s')).blob();"
                   " const r = await m.readReceipt(b); return JSON.stringify({ total: r.total, engine: r.engine }); })()" % b64))
        log("aktualizacja strony: paragon na nowej stronie", v)
    ws.close()
    # po ponownym uruchomieniu dalej nowa strona (webReady potwierdził, że działa)
    sh("adb shell am force-stop pl.groszek.app")
    time.sleep(2)
    ws, ev = connect()
    if ws is not None:
        v = val(ev("(async () => JSON.stringify(await Capacitor.Plugins.Updater.info()))()"))
        log("aktualizacja strony: po restarcie", v)
        ws.close()


def backup_test():
    """Kopia automatyczna: plik w Dokumenty/Do Pierwszego, bez żadnego okienka Androida."""
    ws, ev = connect()
    if ws is None:
        log("kopia: brak połączenia")
        FAILED.append("kopia automatyczna")
        return
    r = val(ev("(async () => { const m = await import('./js/backup.js');"
               " try { return await m.autoBackup(window.groszek.state, true); } catch (e) { return 'błąd ' + e.message; } })()"))
    listing = sh("adb shell \"ls '/sdcard/Documents/Do Pierwszego/'\"")
    ok = isinstance(r, str) and r.endswith(".json") and r in listing
    shot("16b-po-kopii")
    log("kopia automatyczna:", "OK" if ok else "ŹLE", r, "| folder:", listing.strip()[:200])
    if not ok:
        FAILED.append("kopia automatyczna")
    try:
        ws.close()
    except Exception:  # noqa: BLE001
        pass


def apk_update_test():
    """Aktualizacja APK z apki: ma się zainstalować bez okienek i otworzyć sama."""
    ws, ev = connect()
    if ws is None:
        log("aktualizacja APK: brak połączenia")
        return
    sh("adb shell appops set pl.groszek.app REQUEST_INSTALL_PACKAGES allow")
    before = sh("adb shell dumpsys package pl.groszek.app | grep lastUpdateTime").strip()
    pid0 = sh("adb shell pidof pl.groszek.app").strip()
    sh("adb logcat -c")
    r = val(ev("(async () => { const g = window.groszek; const u = await g.checkForUpdate(); if (!u) return 'brak wydania';"
               " g.update = Object.assign({}, u, { newer: true, web: null }); g.installUpdate(); return u.url; })()"))
    log("aktualizacja APK: start", r, "| przed:", before, "pid", pid0)
    try:
        ws.close()
    except Exception:  # noqa: BLE001
        pass
    installer = False
    updated = False
    reopened = False
    for i in range(40):
        time.sleep(4)
        xml = sh("adb shell uiautomator dump /sdcard/ui.xml && adb shell cat /sdcard/ui.xml", timeout=40)
        if "packageinstaller" in xml or "permissioncontroller" in xml:
            if not installer:
                shot("18-instalator")
            installer = True
        now = sh("adb shell dumpsys package pl.groszek.app | grep lastUpdateTime").strip()
        updated = updated or (now != before and bool(now))
        top = sh("adb shell dumpsys activity activities | grep -E 'topResumedActivity|mResumedActivity'")
        pid = sh("adb shell pidof pl.groszek.app").strip()
        if updated and "pl.groszek.app" in top and pid and pid != pid0:
            reopened = True
            break
        if updated and i > 25:
            break
    shot("18-po-aktualizacji-apk")
    log("aktualizacja APK: zainstalowana", "TAK" if updated else "NIE", "| okienko instalatora:", "TAK" if installer else "nie",
        "| otworzyła się sama:", "TAK" if reopened else "nie (Android blokuje otwieranie z tła)")
    if not updated:
        FAILED.append("aktualizacja APK")
    log("aktualizacja APK: logcat", sh("adb logcat -d -v brief | grep -E 'GroszekUpdate|Background activity|BAL|abort.*groszek|PackageInstaller.*groszek' | tail -25", timeout=60))


def connect(start=True):
    """Połączenie z debugerem WebView apki; zwraca (ws, ev) albo (None, None)."""
    try:
        import websocket  # websocket-client
    except ImportError:
        log("cdp: brak websocket-client")
        return None, None
    if start:
        # po dwóch "wstecz" apka mogła się zamknąć, a WebView w tle nie pokazuje stron debugerowi
        sh("adb shell am start -n pl.groszek.app/.MainActivity")
        time.sleep(8)
    pid = sh("adb shell pidof pl.groszek.app").strip()
    socks = re.findall(r"@(webview_devtools_remote_\d+)", sh("adb shell cat /proc/net/unix"))
    name = f"webview_devtools_remote_{pid}" if f"webview_devtools_remote_{pid}" in socks else (socks[-1] if socks else "")
    if not name:
        log("cdp: brak gniazda debugera WebView")
        return None, None
    log("cdp: gniazdo", name, "pid", pid, "wszystkie", socks)
    sh("adb forward --remove-all")
    log("cdp: forward", sh(f"adb forward tcp:9222 localabstract:{name}"))
    ws = None
    for attempt in range(3):
        try:
            raw = urllib.request.urlopen("http://127.0.0.1:9222/json", timeout=20).read()
            log("cdp: /json", raw[:400])
            pages = json.loads(raw)
            page = next(p for p in pages if p.get("type") == "page")
            url = page["webSocketDebuggerUrl"]
            try:
                ws = websocket.create_connection(url, timeout=240, suppress_origin=True)
            except Exception as e:  # noqa: BLE001
                log("cdp: websocket bez origin", repr(e))
                ws = websocket.create_connection(url, timeout=240)
            break
        except Exception as e:  # noqa: BLE001
            log("cdp: nie połączyłem się z WebView", repr(e))
            time.sleep(5)
    if ws is None:
        return None, None
    n = [0]

    def ev(expr):
        n[0] += 1
        ws.send(json.dumps({"id": n[0], "method": "Runtime.evaluate",
                            "params": {"expression": expr, "awaitPromise": True, "returnByValue": True}}))
        while True:
            m = json.loads(ws.recv())
            if m.get("id") == n[0]:
                return m

    return ws, ev


def val(res):
    """Wartość z odpowiedzi Runtime.evaluate (albo opis błędu)."""
    r = (res or {}).get("result", {})
    if "exceptionDetails" in r:
        return "WYJĄTEK " + json.dumps(r["exceptionDetails"])[:300]
    return r.get("result", {}).get("value")


def ocr_bench():
    """Czyta wygenerowane paragony (tools/paragony.py) silnikiem ML Kit i Tesseract przez debuger WebView."""
    truth = {}
    folder = os.path.join(OUT, "paragony")
    if os.path.exists(os.path.join(folder, "wyniki.json")):
        truth = json.load(open(os.path.join(folder, "wyniki.json")))
    files = [(os.path.join(folder, k), v) for k, v in truth.items()]
    files.append(("tools/test-paragon.jpg", {"total": 35.25, "store": "Biedronka"}))
    ws, ev = connect()
    if ws is None:
        return
    results = []
    score = {}
    for eng in ("auto", "tesseract"):
        # Tesseract na emulatorze jest wolny: wystarczy kilka paragonów
        for path, t in (files if eng == "auto" else files[:4] + files[-1:]):
            b64 = base64.b64encode(open(path, "rb").read()).decode()
            expr = ("(async () => { const m = await import('./js/receipt.js'); m.opts.engine = '%s';"
                    " const b = await (await fetch('data:image/jpeg;base64,%s')).blob(); const t0 = Date.now();"
                    " const r = await m.readReceipt(b); return JSON.stringify({total: r.total, how: r.how, engine: r.engine,"
                    " store: r.store, ms: Date.now() - t0, text: r.text, itemsOk: r.itemsOk, items: (r.items || []).map((x) => [x.name, x.qty, x.price, x.total, x.disc || 0])}); })()") % (eng, b64)
            try:
                res = ev(expr)
                val = res.get("result", {}).get("result", {}).get("value")
                r = json.loads(val) if val else {"error": json.dumps(res)[:500]}
            except Exception as e:  # noqa: BLE001
                r = {"error": str(e)}
            ok = r.get("total") == t["total"]
            key = r.get("engine") or eng
            score.setdefault(key, [0, 0])
            score[key][0] += ok
            score[key][1] += 1
            items_ok = r.get("itemsOk") and (t.get("items") is None or len(r.get("items") or []) == t["items"])
            score.setdefault(key + " pozycje", [0, 0])
            score[key + " pozycje"][0] += bool(items_ok)
            score[key + " pozycje"][1] += 1
            log("ocr", key, os.path.basename(path), "OK" if ok else "ŹLE", "chciałem", t["total"], "mam", r.get("total"),
                r.get("how"), r.get("store"), r.get("ms"), "ms", "pozycje", len(r.get("items") or []), "/", t.get("items"),
                "zgodne" if r.get("itemsOk") else "niezgodne", r.get("error", ""))
            results.append({"file": os.path.basename(path), "want": t, "got": r})
    ws.close()
    json.dump(results, open(os.path.join(OUT, "ocr.json"), "w"), ensure_ascii=False, indent=1)
    for k, (a, b) in score.items():
        log(f"ocr wynik {k}: {a}/{b}")


def main():
    log(sh("adb install -r groszek.apk", timeout=180))
    time.sleep(40)  # niech launcher się rozkręci po starcie emulatora
    sh("adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS")
    dismiss_anr()
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

    # zdjęcie paragonu z galerii: wrzuć testowy paragon do telefonu i odczytaj
    sh("adb push tools/test-paragon.jpg /sdcard/Pictures/paragon.jpg")
    sh("adb shell content call --uri content://media/ --method scan_volume --arg external_primary")
    time.sleep(3)
    tap_text("Dodaj wydatek")
    time.sleep(1.5)
    tap_text("Z galerii")
    time.sleep(4)
    shot("15-wybor-zdjecia")
    ns = nodes("15-wybor-zdjecia")
    pick = [n for n in ns if "paragon" in (n["text"] + n["desc"]).lower()] or \
        [n for n in ns if re.match(r"(photo|zdjęcie|image)", n["desc"], re.I)] or \
        [n for n in ns if n["cls"].endswith("ImageView") and n["w"] > 150 and n["y"] > 300]
    if pick:
        sh(f"adb shell input tap {pick[0]['x']} {pick[0]['y']}")
        log("wybrano zdjęcie", pick[0])
        time.sleep(3)
        for t in ["Done", "Gotowe", "Wybierz", "Select"]:
            if screen_has(t):
                tap_text(t, exact=True)
                break
        time.sleep(20)
        shot("16-odczyt-paragonu")
        screen_has("Odczytane z paragonu")
        screen_has("35,25")
    else:
        log("nie znalazłem zdjęcia w wyborze")
    back()
    back()

    ocr_bench()

    sh("adb shell cmd uimode night yes")
    time.sleep(4)
    shot("14-ciemny")
    sh("adb shell cmd uimode night no")
    open(os.path.join(OUT, "logcat.txt"), "w").write(sh("adb logcat -d -v brief", timeout=60))

    backup_test()
    web_update_test()
    apk_update_test()
    open(os.path.join(OUT, "logcat-aktualizacja.txt"), "w").write(sh("adb logcat -d -v brief", timeout=60))
    log("koniec", "| nieudane:", ", ".join(FAILED) if FAILED else "nic")


if __name__ == "__main__":
    main()
    if FAILED:
        sys.exit(1)
