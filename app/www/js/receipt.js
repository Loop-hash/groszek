// Zdjęcie paragonu: odczyt tekstu na telefonie i wyłuskanie sumy, sklepu i daty.
// Na Androidzie czyta Google ML Kit (wtyczka Ocr w apce), w przeglądarce i awaryjnie Tesseract.
// Wszystko dzieje się w telefonie, bez internetu.
import { plugin } from './store.js';

const BASE = 'js/vendor/tesseract/';
let workerPromise = null;
let progressCb = null;

// do testów porównawczych (tools/emu.py, benchmark w przeglądarce)
export const opts = { engine: 'auto', crop: true, tessWidth: 1400, mlWidth: 1300, psm: '4', normalize: true };

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

// ---------- obraz ----------

async function loadImage(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (e) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Nie umiem otworzyć tego zdjęcia'));
      img.src = URL.createObjectURL(file);
    });
  }
}

function canvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  return cv;
}

function grayOf(d, n) {
  const g = new Uint8ClampedArray(n);
  for (let i = 0, j = 0; j < n; i += 4, j++) g[j] = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
  return g;
}

function otsu(g) {
  const hist = new Float64Array(256);
  for (let i = 0; i < g.length; i++) hist[g[i]]++;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let t = 128;
  for (let i = 0; i < 256; i++) {
    wB += hist[i];
    if (!wB) continue;
    const wF = g.length - wB;
    if (!wF) break;
    sumB += i * hist[i];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const v = wB * wF * (mB - mF) * (mB - mF);
    if (v > best) { best = v; t = i; }
  }
  return t;
}

// Paragon to zwykle największa jasna plama na zdjęciu. Wycinamy ją, żeby tekst był większy.
// Cień potrafi przeciąć papier na kilka plam, więc dokładamy te, które leżą w tej samej kolumnie.
export function paperBox(g, w, h) {
  const t = Math.max(otsu(g), 110);
  const lab = new Int32Array(w * h).fill(-1);
  const stack = new Int32Array(w * h);
  const comps = [];
  for (let s = 0; s < w * h; s++) {
    if (lab[s] !== -1 || g[s] <= t) continue;
    let sp = 0;
    stack[sp++] = s;
    lab[s] = s;
    let n = 0;
    let x0 = w;
    let y0 = h;
    let x1 = 0;
    let y1 = 0;
    while (sp) {
      const p = stack[--sp];
      n++;
      const x = p % w;
      const y = (p / w) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      if (x > 0 && lab[p - 1] === -1 && g[p - 1] > t) { lab[p - 1] = s; stack[sp++] = p - 1; }
      if (x < w - 1 && lab[p + 1] === -1 && g[p + 1] > t) { lab[p + 1] = s; stack[sp++] = p + 1; }
      if (y > 0 && lab[p - w] === -1 && g[p - w] > t) { lab[p - w] = s; stack[sp++] = p - w; }
      if (y < h - 1 && lab[p + w] === -1 && g[p + w] > t) { lab[p + w] = s; stack[sp++] = p + w; }
    }
    if (n >= 0.004 * w * h) comps.push({ n, x0, y0, x1, y1 });
  }
  if (!comps.length) return null;
  comps.sort((p, q) => q.n - p.n);
  const m = { ...comps[0] };
  if (m.n < 0.06 * w * h) return null;
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of comps) {
      if (c.x0 >= m.x0 && c.x1 <= m.x1 && c.y0 >= m.y0 && c.y1 <= m.y1) continue;
      const ov = Math.min(c.x1, m.x1) - Math.max(c.x0, m.x0);
      const gap = Math.max(c.y0 - m.y1, m.y0 - c.y1);
      if (ov > 0.5 * (c.x1 - c.x0) && gap < 0.15 * (m.y1 - m.y0)) {
        m.x0 = Math.min(m.x0, c.x0); m.x1 = Math.max(m.x1, c.x1);
        m.y0 = Math.min(m.y0, c.y0); m.y1 = Math.max(m.y1, c.y1);
        grew = true;
      }
    }
  }
  const bw = m.x1 - m.x0 + 1;
  const bh = m.y1 - m.y0 + 1;
  if (bw * bh > 0.92 * w * h) return null;
  // z góry i z dołu zostawiamy zapas, bo tam najczęściej pada cień
  const x = Math.max(0, m.x0 - bw * 0.04);
  const y = Math.max(0, m.y0 - bh * 0.06);
  return { x, y, w: Math.min(w, m.x1 + 1 + bw * 0.04) - x, h: Math.min(h, m.y1 + 1 + bh * 0.06) - y };
}

function findPaper(src) {
  const W = src.width;
  const H = src.height;
  const k = Math.min(1, 320 / Math.max(W, H));
  const w = Math.max(1, Math.round(W * k));
  const h = Math.max(1, Math.round(H * k));
  const cv = canvas(w, h);
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(src, 0, 0, w, h);
  const b = paperBox(grayOf(ctx.getImageData(0, 0, w, h).data, w * h), w, h);
  if (!b) return null;
  return { x: b.x / k, y: b.y / k, w: b.w / k, h: b.h / k };
}

// Wycięty paragon w skali, w której znak ma kilkadziesiąt pikseli.
function cropScaled(src, box, targetW, maxSide) {
  const b = box || { x: 0, y: 0, w: src.width, h: src.height };
  let k = targetW / b.w;
  k = Math.min(k, maxSide / Math.max(b.w, b.h), 2.5);
  const w = Math.max(1, Math.round(b.w * k));
  const h = Math.max(1, Math.round(b.h * k));
  const cv = canvas(w, h);
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, b.x, b.y, b.w, b.h, 0, 0, w, h);
  return cv;
}

// Kąt przekrzywienia wierszy: obracamy próbnie rzut ciemnych pikseli i szukamy najostrzejszych wierszy.
// Liczą się tylko ciemne piksele na jasnym tle (litery na papierze), nie słoje stołu za paragonem.
export function skewAngle(g, w, h) {
  const r = 8;
  const S = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += g[y * w + x];
      S[(y + 1) * (w + 1) + x + 1] = S[y * (w + 1) + x + 1] + row;
    }
  }
  const xs = [];
  const ys = [];
  for (let y = 0; y < h; y++) {
    const ya = Math.max(0, y - r);
    const yb = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const xa = Math.max(0, x - r);
      const xb = Math.min(w, x + r + 1);
      const m = (S[yb * (w + 1) + xb] - S[ya * (w + 1) + xb] - S[yb * (w + 1) + xa] + S[ya * (w + 1) + xa]) / ((yb - ya) * (xb - xa));
      if (m > 125 && g[y * w + x] < m * 0.8) { xs.push(x); ys.push(y); }
    }
  }
  if (xs.length < 200) return 0;
  const score = (deg) => {
    const k = Math.tan((deg * Math.PI) / 180);
    const off = Math.ceil(Math.abs(k) * w) + 1;
    const hist = new Float64Array(h + 2 * off);
    for (let i = 0; i < xs.length; i++) hist[Math.round(ys[i] - xs[i] * k) + off]++;
    let s = 0;
    for (let i = 0; i < hist.length; i++) s += hist[i] * hist[i];
    return s;
  };
  let best = 0;
  let bs = -1;
  for (let d = -10; d <= 10; d += 0.5) { const v = score(d); if (v > bs) { bs = v; best = d; } }
  const c = best;
  for (let d = c - 0.4; d <= c + 0.4; d += 0.1) { const v = score(d); if (v > bs) { bs = v; best = d; } }
  return best;
}

function deskew(cv) {
  const k = Math.min(1, 500 / cv.width);
  const w = Math.max(1, Math.round(cv.width * k));
  const h = Math.max(1, Math.round(cv.height * k));
  const sm = canvas(w, h);
  const sctx = sm.getContext('2d', { willReadFrequently: true });
  sctx.drawImage(cv, 0, 0, w, h);
  const deg = skewAngle(grayOf(sctx.getImageData(0, 0, w, h).data, w * h), w, h);
  if (Math.abs(deg) < 0.4) return cv;
  const a = (deg * Math.PI) / 180;
  const W2 = Math.round(cv.width * Math.cos(a) + cv.height * Math.abs(Math.sin(a)));
  const H2 = Math.round(cv.width * Math.abs(Math.sin(a)) + cv.height * Math.cos(a));
  const out = canvas(W2, H2);
  const ctx = out.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W2, H2);
  ctx.translate(W2 / 2, H2 / 2);
  ctx.rotate(-a);
  ctx.drawImage(cv, -cv.width / 2, -cv.height / 2);
  return out;
}

// Szarość, wyrównanie oświetlenia (cień ręki, zagięcia) i rozciągnięcie kontrastu.
function normalize(cv) {
  const w = cv.width;
  const h = cv.height;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const g = grayOf(d, w * h);
  let out = g;
  if (opts.normalize) {
    // średnia jasność w dużym oknie przez obraz całkowy; tekst jest ciemniejszy od tła wokół
    const r = Math.max(8, Math.round(Math.min(w, h) / 14));
    const S = new Float64Array((w + 1) * (h + 1));
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) {
        row += g[y * w + x];
        S[(y + 1) * (w + 1) + x + 1] = S[y * (w + 1) + x + 1] + row;
      }
    }
    out = new Uint8ClampedArray(w * h);
    for (let y = 0; y < h; y++) {
      const ya = Math.max(0, y - r);
      const yb = Math.min(h, y + r + 1);
      for (let x = 0; x < w; x++) {
        const xa = Math.max(0, x - r);
        const xb = Math.min(w, x + r + 1);
        const n = (yb - ya) * (xb - xa);
        const m = (S[yb * (w + 1) + xb] - S[ya * (w + 1) + xb] - S[yb * (w + 1) + xa] + S[ya * (w + 1) + xa]) / n;
        out[y * w + x] = Math.min(255, (g[y * w + x] * 235) / Math.max(30, m));
      }
    }
  }
  const hist = new Uint32Array(256);
  for (let i = 0; i < out.length; i++) hist[out[i]]++;
  let lo = 0;
  let hi = 255;
  for (let acc = 0, i = 0; i < 256; i++) { acc += hist[i]; if (acc > out.length * 0.01) { lo = i; break; } }
  for (let acc = 0, i = 255; i >= 0; i--) { acc += hist[i]; if (acc > out.length * 0.05) { hi = i; break; } }
  const span = Math.max(1, hi - lo);
  for (let i = 0, j = 0; j < out.length; i += 4, j++) {
    const v = Math.max(0, Math.min(255, ((out[j] - lo) * 255) / span));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

// ---------- silniki ----------

function median(a) {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[(s.length - 1) >> 1];
}

// ML Kit: linie z narożnikami i kątem
async function readMlkit(cv) {
  const ocr = plugin('Ocr');
  if (!ocr) return null;
  const b64 = cv.toDataURL('image/jpeg', 0.92).split(',')[1];
  const r = await ocr.recognize({ image: b64 });
  const items = [];
  for (const l of (r && r.lines) || []) {
    const p = l.pts || [];
    if (p.length < 8 || !l.text) continue;
    const cx = (p[0] + p[2] + p[4] + p[6]) / 4;
    const cy = (p[1] + p[3] + p[5] + p[7]) / 4;
    const h = (Math.hypot(p[6] - p[0], p[7] - p[1]) + Math.hypot(p[4] - p[2], p[5] - p[3])) / 2;
    const ang = Math.atan2(p[3] - p[1], p[2] - p[0]);
    const w = (Math.hypot(p[2] - p[0], p[3] - p[1]) + Math.hypot(p[4] - p[6], p[5] - p[7])) / 2;
    items.push({ text: l.text, cx, cy, h, w, ang, len: l.text.length });
  }
  return items;
}

async function readTesseract(cv) {
  const w = await worker();
  if (opts.psm) await w.setParameters({ tessedit_pageseg_mode: opts.psm, preserve_interword_spaces: '1' });
  const res = await w.recognize(cv, {}, { text: true, blocks: true });
  const items = [];
  for (const b of (res.data && res.data.blocks) || []) {
    for (const p of b.paragraphs || []) {
      for (const l of p.lines || []) {
        const text = (l.text || '').trim();
        if (!text) continue;
        const bl = l.baseline || {};
        const ang = bl.x1 > bl.x0 ? Math.atan2(bl.y1 - bl.y0, bl.x1 - bl.x0) : 0;
        const rh = l.rowAttributes && l.rowAttributes.row_height;
        const bh = l.bbox.y1 - l.bbox.y0 - Math.abs(Math.tan(ang)) * (l.bbox.x1 - l.bbox.x0);
        const h = rh > 0 ? rh : Math.max(4, bh);
        const cx = (l.bbox.x0 + l.bbox.x1) / 2;
        const cy = bl.x1 > bl.x0 ? (bl.y0 + bl.y1) / 2 - h * 0.4 : (l.bbox.y0 + l.bbox.y1) / 2;
        items.push({ text, cx, cy, h, w: (l.bbox.x1 - l.bbox.x0) / Math.max(0.5, Math.cos(ang)), ang, len: text.length });
      }
    }
  }
  if (!items.length && res.data && res.data.text) {
    return { text: res.data.text };
  }
  return items;
}

// Linie tekstu w wiersze paragonu: nazwa po lewej i kwota po prawej trafiają do jednego wiersza,
// nawet gdy zdjęcie jest przekrzywione. Wiersz z dużą czcionką (SUMA) dostaje big.
export function rowsFrom(items) {
  if (!items.length) return [];
  const angs = items.filter((i) => i.len >= 4).map((i) => i.ang);
  const a = median(angs.length ? angs : items.map((i) => i.ang)) || 0;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const mh = median(items.map((i) => i.h)) || 1;
  const pts = items.map((i) => ({ ...i, u: i.cx * ca + i.cy * sa, v: -i.cx * sa + i.cy * ca }));
  pts.sort((p, q) => p.v - q.v);
  const rows = [];
  for (const p of pts) {
    let best = null;
    let bd = Infinity;
    for (let k = Math.max(0, rows.length - 4); k < rows.length; k++) {
      const r = rows[k];
      const dist = Math.abs(p.v - r.v);
      const lim = 0.5 * Math.min(Math.max(p.h, mh * 0.6), Math.max(r.h, mh * 0.6));
      // dwie linie, które zachodzą na siebie w poziomie, to różne wiersze
      const overlap = r.items.some((q) => Math.min(q.u + q.w / 2, p.u + p.w / 2) - Math.max(q.u - q.w / 2, p.u - p.w / 2) > 0.3 * Math.min(q.w, p.w));
      if (dist < lim && dist < bd && !overlap) { best = r; bd = dist; }
    }
    if (best) {
      best.items.push(p);
      best.v = best.items.reduce((s, q) => s + q.v, 0) / best.items.length;
      best.h = Math.max(best.h, p.h);
    } else rows.push({ v: p.v, h: p.h, items: [p] });
  }
  rows.sort((p, q) => p.v - q.v);
  return rows.map((r) => ({
    text: r.items.sort((p, q) => p.u - q.u).map((q) => q.text).join('  '),
    big: r.h >= mh * 1.5,
  }));
}

export async function readReceipt(file, onProgress) {
  progressCb = onProgress || null;
  const say = (status, progress = 0) => { if (onProgress) onProgress({ status, progress }); };
  say('przygotowuję zdjęcie');
  const src = await loadImage(file);
  const box = opts.crop ? findPaper(src) : null;
  let rows = null;
  let engine = '';
  if (opts.engine !== 'tesseract' && plugin('Ocr')) {
    try {
      say('czytam tekst', 0.3);
      const items = await readMlkit(deskew(cropScaled(src, box, opts.mlWidth, 4200)));
      if (items && items.length) { rows = rowsFrom(items); engine = 'mlkit'; }
    } catch (e) {
      console.error('ML Kit: ' + (e && e.message));
    }
  }
  if (!rows) {
    const cv = normalize(deskew(cropScaled(src, box, opts.tessWidth, 4500)));
    const items = await readTesseract(cv);
    rows = Array.isArray(items) ? rowsFrom(items) : String(items.text || '').split('\n').map((t) => ({ text: t, big: false }));
    engine = 'tesseract';
  }
  progressCb = null;
  const text = rows.map((r) => r.text).join('\n');
  return { text, engine, cropped: !!box, ...parseReceipt(rows) };
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

const AMOUNT = /(-?)(?<![\d,.])(\d{1,4})\s?[,.]\s?(\d{2})(?![\d])/g;

// kwoty w wierszu: [{ v, neg }]
function amountsOf(line) {
  const out = [];
  let m;
  AMOUNT.lastIndex = 0;
  while ((m = AMOUNT.exec(line))) out.push({ v: Number(m[2] + '.' + m[3]), neg: m[1] === '-' });
  return out;
}

function amounts(line) {
  return amountsOf(line).filter((a) => !a.neg).map((a) => a.v);
}

// W liczbach OCR myli O z 0, I/l z 1, S z 5, B z 8, Z z 2. Litera grupy PTU na końcu kwoty
// ("14,98B") zostaje, poprawiamy tylko znaki, po których idzie cyfra albo przecinek,
// i drugą cyfrę po przecinku ("35,2O").
const LOOK = { O: '0', Q: '0', D: '0', I: '1', L: '1', '|': '1', '!': '1', S: '5', B: '8', Z: '2' };
function fixDigits(line) {
  return line.replace(/\S+/g, (w) => {
    if (!/\d/.test(w)) return w;
    const ch = [...w];
    const num = (c) => c != null && /[\d,.]/.test(c);
    return ch.map((c, i) => {
      if (!LOOK[c]) return c;
      const right = ch[i + 1];
      if ((i === 0 || num(ch[i - 1])) && num(right)) return LOOK[c];
      if (i >= 2 && /[,.]/.test(ch[i - 2]) && /\d/.test(ch[i - 1])) return LOOK[c];
      return c;
    }).join('');
  });
}

function up(s) {
  return s.toUpperCase().replace(/[ĄĆĘŁŃÓŚŹŻ]/g, (ch) => ({ Ą: 'A', Ć: 'C', Ę: 'E', Ł: 'L', Ń: 'N', Ó: 'O', Ś: 'S', Ź: 'Z', Ż: 'Z' }[ch]));
}

const r2 = (v) => Math.round(v * 100) / 100;

// Sumę potwierdza kilka miejsc na paragonie: wiersz SUMA, płatność kartą, gotówka minus reszta,
// suma sprzedaży w grupach PTU, suma pozycji i kwota wydrukowana dużą czcionką.
// Wygrywa kwota, na którą wskazuje najwięcej z nich.
export function parseReceipt(input) {
  const rows = Array.isArray(input)
    ? input.map((r) => ({ text: String(r.text || '').trim(), big: !!r.big })).filter((r) => r.text)
    : String(input || '').split(/\r?\n/).map((t) => ({ text: t.trim(), big: false })).filter((r) => r.text);
  const U = rows.map((r) => up(r.text));
  const F = U.map(fixDigits);
  const last = (a) => (a.length ? a[a.length - 1] : null);

  const sumaRe = /(^|[^A-Z])[S5][UVW][MN]A\b|SUMA|^[S5][UV][MN]A?\s*P[LI1]N?\b|DO ZAPLATY|RAZEM/;
  const badSuma = /PTU|VAT|OPODATK|SPRZEDAZ|RABAT|OSZCZ|ZWOLN/;
  const votes = [];
  const vote = (v, src, wgt) => { if (v != null && v > 0 && v < 5000) votes.push({ v: r2(v), src, wgt }); };

  let sales = 0;
  let salesN = 0;
  let salesMax = 0;
  let ptu = 0;
  let items = 0;
  let itemsN = 0;
  let disc = 0;
  let cash = null;
  let change = null;
  let lastSale = null;
  let salesBad = false;
  for (let i = 0; i < rows.length; i++) {
    const u = U[i];
    const f = F[i];
    const a = amounts(f);
    if (sumaRe.test(u) && !badSuma.test(u)) {
      let v = last(a);
      if (v == null) {
        const m = /(\d{1,4})\s(\d{2})\s*$/.exec(f); // "SUMA PLN 35 25", zgubiony przecinek
        if (m) v = Number(m[1] + '.' + m[2]);
      }
      // kwota w następnym wierszu, gdy jest w nim sama
      if (v == null && F[i + 1] && !/[A-Z]{3}/.test(F[i + 1])) v = last(amounts(F[i + 1]));
      vote(v, 'suma', 3);
      continue;
    }
    if (/SPRZEDAZ|OPODATK/.test(u) && !/PTU|VAT/.test(u)) {
      const v = last(a);
      if (v != null) { sales += v; salesN++; salesMax = Math.max(salesMax, v); lastSale = v; }
      continue;
    }
    if (/SUMA PTU|PTU SUMA|SUMA VAT/.test(u)) { ptu = Math.max(ptu, last(a) || 0); continue; }
    // "PTU C 5,00% 4,61" musi pasować do sprzedaży nad nim, inaczej któraś liczba jest źle odczytana
    const rate = /(\d{1,2})[,.](\d{2})\s*%/.exec(f);
    if (/PTU|VAT/.test(u) && rate && a.length >= 2 && lastSale != null) {
      const r = Number(rate[1] + '.' + rate[2]);
      if (r > 0 && Math.abs((lastSale * r) / (100 + r) - last(a)) > 0.02) salesBad = true;
      lastSale = null;
      continue;
    }
    if (/PTU|VAT|NIP/.test(u)) continue;
    if (/RESZT/.test(u)) { change = last(a); continue; }
    if (/GOTOWK/.test(u)) { cash = last(a); continue; }
    if (/KART|PLATNICZ|BLIK|PLATNOSC|ZAPLACONO|PRZELEW|DEBIT|VISA|MASTERCARD/.test(u)) {
      vote(last(a), 'karta', 2.5);
      continue;
    }
    const neg = amountsOf(f).filter((x) => x.neg);
    if (neg.length && /RABAT|OPUST|OBNIZK|PROMOC|ZNIZK|-/.test(u)) { disc += neg[neg.length - 1].v; continue; }
    // pozycja: kwota z literą grupy PTU na końcu, np. "14,98 C"
    const it = /(\d{1,4})\s?[,.]\s?(\d{2})\s?[A-G]\s*$/.exec(f);
    if (it) { items += Number(it[1] + '.' + it[2]); itemsN++; }
  }
  if (salesN && !salesBad) vote(sales, 'sprzedaż', salesN >= 2 ? 2.2 : 1.6);
  if (cash != null && change != null && cash >= change) vote(cash - change, 'gotówka', 1.5);
  if (itemsN >= 2) vote(items - disc, 'pozycje', 1.4);
  const big = [];
  rows.forEach((r, i) => { if (r.big) big.push(...amounts(F[i])); });
  if (big.length) vote(Math.max(...big), 'duża czcionka', 2);

  // odrzuć kwoty mniejsze niż sprzedaż w jednej grupie albo podatek
  const ok = votes.filter((x) => x.v + 0.005 >= salesMax && x.v > ptu);
  const pool = ok.length ? ok : votes;
  const order = ['suma', 'karta', 'sprzedaż', 'duża czcionka', 'gotówka', 'pozycje'];
  const score = new Map();
  for (const x of pool) {
    const s = score.get(x.v) || { v: x.v, w: 0, src: [] };
    s.w += x.wgt;
    s.src.push(x.src);
    score.set(x.v, s);
  }
  const ranked = [...score.values()].sort((p, q) => q.w - p.w || Math.min(...p.src.map((s) => order.indexOf(s))) - Math.min(...q.src.map((s) => order.indexOf(s))));

  // Jedna odczytana kwota kontra suma policzona z kilku wierszy, różne o jedną cyfrę (0/6, 1/7, 3/8):
  // to raczej OCR pomylił tę jedną cyfrę, bo przypadkiem zgodna suma kilku liczb jest mało prawdopodobna.
  const computed = (x) => x.src.some((s) => (s === 'sprzedaż' ? salesN >= 2 : s === 'pozycje' ? itemsN >= 3 : s === 'gotówka'));
  const oneDigit = (a, b) => {
    const p = a.toFixed(2);
    const q = b.toFixed(2);
    return p.length === q.length && [...p].filter((ch, i) => ch !== q[i]).length === 1;
  };
  if (ranked.length > 1 && ranked[0].src.length === 1 && !computed(ranked[0])) {
    const alt = ranked.slice(1).find((x) => computed(x) && oneDigit(x.v, ranked[0].v));
    if (alt) ranked.splice(ranked.indexOf(alt), 1), ranked.unshift(alt);
  }
  let total = null;
  let how = '';
  if (ranked.length) { total = ranked[0].v; how = ranked[0].src.join('+'); }

  const all = [];
  for (let i = 0; i < U.length; i++) {
    if (/%|PTU|VAT|NIP|NR /.test(U[i])) continue;
    for (const a of amounts(U[i])) if (a > 0 && a < 5000) all.push(a);
  }
  if (total == null && all.length) { total = Math.max(...all); how = 'największa kwota'; }
  const alt = ranked.slice(1).map((s) => s.v);
  const candidates = [...new Set([...alt, ...[...all].sort((a, b) => b - a)])].filter((a) => a !== total).slice(0, 5);

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

// podgląd tego, co dostaje czytnik (do testów)
export async function preview(file, forTesseract = true) {
  const src = await loadImage(file);
  const box = opts.crop ? findPaper(src) : null;
  const cv = cropScaled(src, box, forTesseract ? opts.tessWidth : opts.mlWidth, forTesseract ? 4500 : 4200);
  return (forTesseract ? normalize(deskew(cv)) : deskew(cv)).toDataURL('image/jpeg', 0.8);
}
