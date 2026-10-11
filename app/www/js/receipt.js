// Zdjęcie paragonu: odczyt tekstu na telefonie (Tesseract, bez internetu) i wyłuskanie sumy, sklepu i daty.

const BASE = 'js/vendor/tesseract/';
let workerPromise = null;
let progressCb = null;

function abs(p) {
  return new URL(p, window.location.href).href;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (window.Tesseract) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Nie udało się wczytać modułu do czytania paragonów'));
    document.head.appendChild(s);
  });
}

async function worker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      await loadScript(abs(BASE + 'tesseract.min.js'));
      return window.Tesseract.createWorker('pol', 1, {
        workerPath: abs(BASE + 'worker.min.js'),
        corePath: abs(BASE),
        langPath: abs(BASE + 'lang'),
        gzip: false,
        cacheMethod: 'none',
        workerBlobURL: false,
        logger: (m) => { if (progressCb) progressCb(m); },
      });
    })().catch((e) => { workerPromise = null; throw e; });
  }
  return workerPromise;
}

// Zmniejsza zdjęcie, przerabia na szarość i podbija kontrast, żeby tekst był wyraźniejszy.
async function prepare(file) {
  let src;
  try {
    src = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (e) {
    src = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Nie umiem otworzyć tego zdjęcia'));
      img.src = URL.createObjectURL(file);
    });
  }
  const w0 = src.width;
  const h0 = src.height;
  const scale = Math.min(1, 2200 / Math.max(w0, h0));
  const w = Math.round(w0 * scale);
  const h = Math.round(h0 * scale);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(src, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) {
    const g = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000 | 0;
    d[i] = g;
    hist[g]++;
  }
  // rozciągnięcie kontrastu między 2. a 98. percentylem
  const total = w * h;
  let lo = 0;
  let hi = 255;
  for (let acc = 0, i = 0; i < 256; i++) { acc += hist[i]; if (acc > total * 0.02) { lo = i; break; } }
  for (let acc = 0, i = 255; i >= 0; i--) { acc += hist[i]; if (acc > total * 0.02) { hi = i; break; } }
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.max(0, Math.min(255, ((d[i] - lo) * 255) / span));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

export async function readReceipt(file, onProgress) {
  progressCb = onProgress || null;
  if (onProgress) onProgress({ status: 'przygotowuję zdjęcie', progress: 0 });
  const canvas = await prepare(file);
  const w = await worker();
  const res = await w.recognize(canvas);
  progressCb = null;
  const text = (res && res.data && res.data.text) || '';
  return { text, ...parseReceipt(text) };
}

// ---------- rozbiór tekstu (bez DOM, testowane w test/run.js) ----------

const STORES = [
  ['Biedronka', /BIEDRONK|JERONIMO|MARTINS/],
  ['Lidl', /\bLIDL/],
  ['Kaufland', /KAUFLAND/],
  ['Aldi', /\bALDI\b/],
  ['Żabka', /ZABKA|ŻABKA/],
  ['Netto', /\bNETTO\b/],
  ['Dino', /\bDINO\b/],
  ['Carrefour', /CARREFOUR/],
  ['Auchan', /AUCHAN/],
  ['Stokrotka', /STOKROTK/],
  ['Lewiatan', /LEWIATAN/],
  ['Rossmann', /ROSSMANN/],
];

const AMOUNT = /(?<![\d,.])(\d{1,4})\s?[,.]\s?(\d{2})(?![\d])/g;

function amounts(line) {
  const out = [];
  let m;
  AMOUNT.lastIndex = 0;
  while ((m = AMOUNT.exec(line))) out.push(Number(m[1] + '.' + m[2]));
  return out;
}

function up(s) {
  return s.toUpperCase().replace(/[ĄĆĘŁŃÓŚŹŻ]/g, (ch) => ({ Ą: 'A', Ć: 'C', Ę: 'E', Ł: 'L', Ń: 'N', Ó: 'O', Ś: 'S', Ź: 'Z', Ż: 'Z' }[ch]));
}

export function parseReceipt(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const U = lines.map(up);
  let total = null;
  let how = '';
  // 1) wiersz z SUMA (OCR myli czasem litery: SUMA, SUNA, 5UMA, SUMA PLN)
  const sumRe = /(^|[^A-Z])[S5][UV][MN]A\b|SUMA|DO ZAPLATY|RAZEM DO ZAPLATY/;
  for (let i = 0; i < U.length && total == null; i++) {
    if (!sumRe.test(U[i]) || /PTU|VAT|SPRZEDAZ OPODATK|RABAT|OSZCZ/.test(U[i])) continue;
    const a = amounts(U[i]);
    if (a.length) { total = a[a.length - 1]; how = 'suma'; break; }
    const next = U[i + 1] ? amounts(U[i + 1]) : [];
    if (next.length) { total = next[next.length - 1]; how = 'suma'; }
  }
  // 2) płatność kartą / gotówką
  if (total == null) {
    for (let i = 0; i < U.length && total == null; i++) {
      if (!/KARTA|PLATNOSC|GOTOWKA|ZAPLACONO|PLN/.test(U[i]) || /PTU|VAT|RESZTA/.test(U[i])) continue;
      const a = amounts(U[i]);
      if (a.length) { total = a[a.length - 1]; how = 'płatność'; }
    }
  }
  const all = [];
  for (const l of U) {
    if (/%|PTU|VAT|NIP|NR /.test(l)) continue;
    for (const a of amounts(l)) if (a > 0 && a < 5000) all.push(a);
  }
  // 3) największa kwota na paragonie
  if (total == null && all.length) { total = Math.max(...all); how = 'największa kwota'; }
  const candidates = [...new Set(all)].sort((a, b) => b - a).filter((a) => a !== total).slice(0, 5);

  let store = '';
  const joined = U.join(' ');
  for (const [name, re] of STORES) if (re.test(joined)) { store = name; break; }

  let date = '';
  const dm = /(20\d\d)[-.](\d\d)[-.](\d\d)/.exec(joined) || /(\d\d)[-.](\d\d)[-.](20\d\d)/.exec(joined);
  if (dm) {
    const [y, m, d] = dm[1].length === 4 ? [dm[1], dm[2], dm[3]] : [dm[3], dm[2], dm[1]];
    if (Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= 31) date = `${y}-${m}-${d}`;
  }
  return { total, how, candidates, store, date };
}
