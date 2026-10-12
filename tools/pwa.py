"""Strona Groszka dla iPhone'a (i każdej przeglądarki): dopisuje service worker do zbudowanej strony.

python3 tools/pwa.py KATALOG_STRONY WERSJA

Service worker od razu zapisuje w telefonie całą apkę bez czytnika paragonów, a czytnik
(kilka MB) dopiero przy pierwszym użyciu. Dzięki temu apka działa bez internetu, a nowa
wersja strony podmienia się sama przy następnym uruchomieniu.
"""
import json
import os
import sys

SW = """// Wygenerowane przez tools/pwa.py
const VERSION = %(version)s;
const CACHE = 'groszek-' + VERSION;
const SHELL = %(files)s;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('groszek-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // dane z GitHuba idą prosto z sieci
  // numer wersji i świeże dane: najpierw sieć, bez sieci zapisana kopia
  if (/\\/(build\\.json|data\\/[^/]+\\.json)$/.test(url.pathname)) {
    e.respondWith(fetch(req).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok && r.type === 'basic') { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return r;
  }).catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
"""


def main(site, version):
    files = ['./']
    for root, _dirs, names in os.walk(site):
        for n in sorted(names):
            rel = os.path.relpath(os.path.join(root, n), site).replace(os.sep, '/')
            if rel == 'sw.js' or rel.startswith('js/vendor/tesseract/') or rel.startswith('.'):
                continue
            files.append(rel)
    with open(os.path.join(site, 'sw.js'), 'w', encoding='utf-8') as f:
        f.write(SW % {'version': json.dumps(str(version)), 'files': json.dumps(sorted(files), ensure_ascii=False, indent=1)})
    print(f'sw.js: wersja {version}, {len(files)} plików od razu, czytnik paragonów przy pierwszym użyciu')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'dev')
