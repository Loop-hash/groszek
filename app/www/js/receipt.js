// Zdjęcie paragonu: odczyt tekstu na telefonie i wyłuskanie sumy, sklepu i daty.
// Na Androidzie czyta Google ML Kit (wtyczka Ocr w apce), w przeglądarce i awaryjnie Tesseract.
// Wszystko dzieje się w telefonie, bez internetu.
import { plugin } from './store.js';
import { norm, stemPL } from './dict.js';
import { CANON } from './canon.js';

const BASE = 'js/vendor/tesseract/';
let workerPromise = null;
let progressCb = null;

// do testów porównawczych (tools/emu.py, benchmark w przeglądarce)
export const opts = { engine: 'auto', crop: true, tessWidth: 1400, mlWidth: 1300, psm: '6', normalize: true };

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

// Słowa leżące całkiem poza kolumną tekstu i odczytane z niską pewnością to zwykle słoje stołu
// albo cień przy brzegu paragonu. Kolumnę wyznaczają słowa odczytane pewnie.
function pct(a, q) {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))];
}

async function readTesseract(cv) {
  const w = await worker();
  if (opts.psm) await w.setParameters({ tessedit_pageseg_mode: opts.psm, preserve_interword_spaces: '1' });
  const res = await w.recognize(cv, {}, { text: true, blocks: true });
  const lines = [];
  for (const b of (res.data && res.data.blocks) || []) for (const p of b.paragraphs || []) for (const l of p.lines || []) lines.push(l);
  const good = lines.flatMap((l) => (l.words || []).filter((x) => x.confidence >= 80 && x.text.replace(/[^\p{L}\d]/gu, '').length >= 3));
  const W = cv.width;
  const L = good.length >= 8 ? pct(good.map((x) => x.bbox.x0), 0.03) - 0.01 * W : -Infinity;
  const R = good.length >= 8 ? pct(good.map((x) => x.bbox.x1), 0.97) + 0.01 * W : Infinity;
  const items = [];
  for (const l of lines) {
    let ws = (l.words || []).filter((x) => x.text.trim());
    if (ws.length) {
      ws = ws.filter((x) => !(x.confidence < 60 && (x.bbox.x1 < L || x.bbox.x0 > R)));
      if (!ws.length) continue;
    }
    // tekst z zachowanych słów; duża przerwa między słowami to osobna kolumna
    let text = (l.text || '').trim();
    let x0 = l.bbox.x0;
    let x1 = l.bbox.x1;
    if (ws.length) {
      const cw = median(ws.map((x) => (x.bbox.x1 - x.bbox.x0) / Math.max(1, x.text.length))) || 10;
      text = ws.map((x, i) => (i && x.bbox.x0 - ws[i - 1].bbox.x1 > 2.5 * cw ? '  ' : i ? ' ' : '') + x.text).join('');
      x0 = Math.min(...ws.map((x) => x.bbox.x0));
      x1 = Math.max(...ws.map((x) => x.bbox.x1));
    }
    if (!text) continue;
    const bl = l.baseline || {};
    const ang = bl.x1 > bl.x0 ? Math.atan2(bl.y1 - bl.y0, bl.x1 - bl.x0) : 0;
    const rh = l.rowAttributes && l.rowAttributes.row_height;
    const bh = l.bbox.y1 - l.bbox.y0 - Math.abs(Math.tan(ang)) * (l.bbox.x1 - l.bbox.x0);
    const h = rh > 0 ? rh : Math.max(4, bh);
    const cx = (x0 + x1) / 2;
    const cy = bl.x1 > bl.x0 ? (bl.y0 + bl.y1) / 2 - h * 0.4 : (l.bbox.y0 + l.bbox.y1) / 2;
    items.push({ text, cx, cy, h, w: (x1 - x0) / Math.max(0.5, Math.cos(ang)), ang, len: text.length });
  }
  if (opts.debug) opts.debug.words = lines.map((l) => (l.words || []).map((x) => [x.text, Math.round(x.confidence), x.bbox.x0, x.bbox.x1].join(':')).join(' '));
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
  const res = { text, engine, cropped: !!box, ...parseReceipt(rows) };
  console.log(`Paragon: ${engine}, suma ${res.total} (${res.how}), ${rows.length} wierszy`);
  return res;
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
// NIP z paragonów, które widzieliśmy; pomaga, gdy nazwa sieci jest źle odczytana
const NIPS = { '8992367273': 'Kaufland', '1070002973': 'Aldi' };

function editDist(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}

export function storeOf(U) {
  const joined = U.join(' ');
  for (const [name, re] of STORES) if (re.test(joined)) return name;
  const digits = joined.replace(/[^\d]/g, ' ');
  for (const [nip, name] of Object.entries(NIPS)) if (digits.includes(nip) || joined.replace(/[-\s]/g, '').includes(nip)) return name;
  // literówka w nazwie sieci, tylko w nagłówku ("RLDI SP. Z O.O.", "KAUFLAMD")
  const head = U.slice(0, 12).join(' ').split(/[^A-Z]+/).filter((w) => w.length >= 4);
  const NAMES = [['ALDI', 'Aldi'], ['LIDL', 'Lidl'], ['BIEDRONKA', 'Biedronka'], ['KAUFLAND', 'Kaufland'], ['NETTO', 'Netto'],
    ['CARREFOUR', 'Carrefour'], ['AUCHAN', 'Auchan'], ['STOKROTKA', 'Stokrotka'], ['LEWIATAN', 'Lewiatan'], ['ROSSMANN', 'Rossmann'], ['ZABKA', 'Żabka']];
  for (const [w0, name] of NAMES) {
    const lim = w0.length >= 7 ? 2 : 1;
    if (head.some((w) => Math.abs(w.length - w0.length) <= lim && editDist(w, w0) <= lim)) return name;
  }
  return '';
}

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

// ---------- pozycje paragonu ----------

const DISC_RE = /OPUST|RABAT|PROMOC|OBNI[ZŻ]K|ZNI[ZŻ]K|UPUST|KUPON|LIDL ?PLUS|BONIFIK/;
const DISC_SUM_RE = /(SUMA|RAZEM|[S5][UVW][MN]A).*(OPUST|RABAT)|(OPUST|RABAT)\w*\s+RAZEM/;
const END_RE = /[S5][UVW][MN]A\b|SUMA|SPRZED|OPOD|\bPTU\b|^RAZEM|ZAPLATY|PODSUMA|ROZLICZ|NALEZNOSC/;
const START_RE = /PARAGON|FISKALN/;
const PRICE_RE = /[X*×][\s._]*(\d{1,4})\s?[,.]\s?(\d{1,2})(?!\d)/g;
const LOOSE = /(-?)\s?(\d{1,4})\s?[,.]\s?(\d{2})/;
const near = (a, b) => Math.abs(a - b) <= 0.011;

// Nazwa z paragonu do pokazania: bez litery grupy PTU i śmieci z brzegów, wielkie litery na zwykłe,
// sklejone wyrazy rozdzielone ("HortexWarPolskie450g" -> "Hortex War Polskie 450g").
export function cleanName(raw) {
  // "|" w środku wyrazu to zwykle l ("Granu|owany"), "4006" na końcu gramatury to 400G
  let n = String(raw || '').replace(/(\p{L})\|(\p{L})/gu, '$1l$2').replace(/(\d0)6\b/g, '$1G');
  n = n.replace(/[|©®"„”“*_<>~=[\]{}]+/g, ' ').replace(/\s+/g, ' ').trim();
  n = n.replace(/^(?:[^\p{L}\d]+\s+)+/u, '').replace(/^[^\p{L}\d]+/u, '');
  for (let k = 0; k < 2; k++) n = n.replace(/\s+[A-Za-z€(]\.?$/, '').trim();
  n = n.replace(/\s+kg\.?$/i, '').replace(/(\d\s?(?:g|kg|ml|l))t$/i, '$1').replace(/(\p{Ll})tt$/u, '$1t').replace(/[\s,.;:-]+$/, '');
  const letters = n.replace(/[^\p{L}]/gu, '');
  const upper = letters.replace(/[^\p{Lu}]/gu, '').length;
  if (letters.length && upper / letters.length > 0.7) n = n.toLowerCase();
  else n = n.replace(/(\p{Ll})(\p{Lu})/gu, '$1 $2').replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1 $2');
  n = n.replace(/(\p{L}{3,})(\d)/gu, '$1 $2').replace(/\s+/g, ' ').trim();
  return n.charAt(0).toUpperCase() + n.slice(1);
}

const letterCount = (s) => (s.match(/\p{L}/gu) || []).length;

// "xl2,99" i "xll, 99": l, I, | po znaku mnożenia to jedynki
const fixPrice = (f) => f.replace(/([X*×][\s._]?)([LI|!\d]{1,4})(?=\s?[,.]\s?\d)/g, (m, x, d) => x + d.replace(/[LI|!]/g, '1'));

// Wiersz pozycji: "NAZWA C  2SZT * 4,49 8,98 C", "Nazwa t 0,516KG x36,99 19,09C".
// Ilość, cena i wartość sprawdzają się nawzajem, więc jedną źle odczytaną liczbę da się odtworzyć.
function itemRow(t, f) {
  let m;
  let hit = null;
  PRICE_RE.lastIndex = 0;
  while ((m = PRICE_RE.exec(f))) {
    const before = f.slice(0, m.index).replace(/\s+$/, '');
    const qtyTok = (/(\S+)$/.exec(before) || ['', ''])[1];
    if (/\d|SZT|KG|SZ|^[LI|!]$/.test(qtyTok)) hit = { m, qtyTok: qtyTok.replace(/^[LI|!]$/, '1'), at: before.length - qtyTok.length };
  }
  if (!hit) return null;
  // cena z jedną cyfrą po przecinku ("x3,9") to zgubiona cyfra: odtworzymy ją z wartości
  let price = Number(hit.m[1] + '.' + hit.m[2]);
  const cut = hit.m[2].length < 2;
  if (!(price > 0)) return null;
  const after = f.slice(hit.m.index + hit.m[0].length);
  const tm = LOOSE.exec(after);
  let total = tm ? Number(tm[2] + '.' + tm[3]) : null;
  const qm = /^(\d{1,3}(?:[,.]\d{1,3})?)/.exec(hit.qtyTok);
  const read = qm ? Number(qm[1].replace(',', '.')) : null;
  // ilość odczytana czysto ("2", "1SZT", "0,529KG"), a nie "18ZT" czy "1527"
  const clean = read != null && /^\d{1,3}(?:[,.]\d{3})?(?:SZT|KG|SZ|S2T)?[._]?$/.test(hit.qtyTok);
  let qty = read;
  let unit = /KG/.test(hit.qtyTok) || /[,.]\d{3}/.test(hit.qtyTok) ? 'kg' : 'szt';
  let alt = null;
  if (cut) {
    if (total == null) return null;
    if (qty == null || !(qty > 0)) qty = 1;
    price = r2(total / qty);
    return { name: t.slice(0, Math.max(0, hit.at)), qty, unit, price, total, alt };
  }
  if (total == null) {
    if (qty == null) qty = 1;
    total = r2(qty * price);
  } else if (qty == null || !near(r2(qty * price), total)) {
    const q = total / price;
    const q3 = Math.round(q * 1000) / 1000;
    if (unit !== 'kg' && Math.round(q) >= 1 && Math.abs(q - Math.round(q)) < 0.004) qty = Math.round(q);
    else if (near(r2(q3 * price), total) && q3 > 0) { qty = q3; unit = 'kg'; }
    // wartość i ilość się kłócą: zostawiamy wartość, a druga wersja czeka na sprawdzenie z sumą
    if (clean && read > 0 && !near(r2(read * price), total)) alt = r2(read * price);
  }
  return { name: t.slice(0, Math.max(0, hit.at)), qty, unit, price, total, alt, altQty: alt != null ? read : null };
}

function discOf(f) {
  const cols = f.trim().split(/\s{2,}/);
  if (cols.length >= 2) {
    const m = LOOSE.exec(cols[cols.length - 1]);
    return m ? Number(m[2] + '.' + m[3]) : null;
  }
  const all = amountsOf(f);
  return all.length ? all[all.length - 1].v : null;
}

// Ten sam produkt kupiony kilka razy (np. trzy mleka z osobnym rabatem) łączymy w jeden wiersz.
// Nazwy mogą się różnić literówkami OCR, więc wystarczy ta sama cena i podobna nazwa.
const KNOWN = new Set(CANON.flatMap((n) => norm(n).split(' ')).filter((w) => w.length >= 3).map(stemPL));
const squash = (n) => norm(n).replace(/[^a-z0-9]/g, '');
function similar(a, b) {
  const x = squash(a);
  const y = squash(b);
  if (x === y) return true;
  if (Math.min(x.length, y.length) < 8) return false;
  return 1 - editDist(x, y) / Math.max(x.length, y.length) >= 0.75;
}
const known = (n) => norm(n).split(' ').filter((w) => KNOWN.has(stemPL(w))).length;

function mergeSame(items) {
  const out = [];
  for (const x of items) {
    const y = x.alt == null && out.find((o) => o.alt == null && o.unit === x.unit && Math.abs(o.price - x.price) < 0.005 && similar(o.name, x.name));
    if (!y) { out.push({ ...x }); continue; }
    if (known(x.name) > known(y.name)) y.name = x.name;
    y.qty = y.unit === 'kg' ? Math.round((y.qty + x.qty) * 1000) / 1000 : y.qty + x.qty;
    y.total = r2(y.total + x.total);
    if (x.disc) y.disc = r2((y.disc || 0) + x.disc);
    if (x.discUnknown) y.discUnknown = (y.discUnknown || 0) + x.discUnknown;
  }
  return out;
}

// Pozycje między nagłówkiem "PARAGON FISKALNY" a podsumowaniem (SPRZEDAŻ / SUMA / PTU).
export function parseItems(rows) {
  const R = rows.map((r) => (typeof r === 'string' ? r : r.text) || '');
  const U = R.map(up);
  const F = U.map((u) => fixPrice(fixDigits(u)));
  let i0 = U.findIndex((u) => START_RE.test(u));
  const header = i0 >= 0;
  if (i0 < 0) i0 = F.findIndex((f, i) => itemRow(R[i], f));
  if (i0 < 0) return { items: [], discTotal: null };
  const items = [];
  let pending = null;
  let discTotal = null;
  for (let i = i0 + (START_RE.test(U[i0]) ? 1 : 0); i < R.length; i++) {
    const u = U[i];
    const f = F[i];
    if (DISC_SUM_RE.test(u)) { const d = discOf(f); if (d != null) discTotal = d; break; }
    if (END_RE.test(u) && !itemRow(R[i], f)) break;
    if (DISC_RE.test(u) && items.length) {
      const it = items[items.length - 1];
      const d = discOf(f);
      it.disc = r2((it.disc || 0) + (d != null && d < it.total ? d : 0));
      if (d == null || d >= it.total) it.discUnknown = (it.discUnknown || 0) + 1;
      pending = null;
      continue;
    }
    const row = itemRow(R[i], f);
    if (row) {
      let name = cleanName(row.name);
      if (letterCount(name) < 3 && pending) name = cleanName(pending);
      pending = null;
      if (letterCount(name) < 2) name = 'Produkt';
      items.push({ name, qty: row.qty, unit: row.unit, price: row.price, total: row.total, ...(row.alt != null ? { alt: row.alt, altQty: row.altQty } : {}) });
      continue;
    }
    // pozycja bez ilości i ceny jednostkowej: "Torba 0,89 A"; nazwa może być w wierszu wyżej
    const one = /(\d{1,4})\s?[,.]\s?(\d{2})\s?[A-GX€(]\s*$/.exec(f);
    const own = letterCount(R[i].slice(0, one ? one.index : 0).replace(/(^|\s)[A-Za-z](\s|$)/g, ' '));
    if (one && (own >= 3 || pending) && (items.length || header)) {
      const v = Number(one[1] + '.' + one[2]);
      items.push({ name: cleanName(own >= 3 ? R[i].slice(0, one.index) : pending), qty: 1, unit: 'szt', price: v, total: v });
      pending = null;
      continue;
    }
    pending = letterCount(R[i]) >= 3 && !amountsOf(u).length ? R[i] : null;
  }
  return { items: mergeSame(items), discTotal };
}

// Czy pozycje minus rabaty dają sumę z paragonu. Jedną nieczytelną liczbę (rabat bez przecinka,
// wartość pozycji) da się odtworzyć z sumy; wtedy też uznajemy, że wszystko się zgadza.
export function checkItems(items, total, discTotal) {
  if (!items.length || total == null) return { ok: false, sum: 0 };
  const net = () => r2(items.reduce((a, x) => a + x.total - (x.disc || 0), 0));
  const unknown = items.filter((x) => x.discUnknown);
  if (unknown.length === 1 && unknown[0].discUnknown === 1) {
    const x = unknown[0];
    const knownDisc = items.reduce((a, y) => a + (y.disc || 0), 0);
    const fromSum = discTotal != null ? r2(discTotal - knownDisc) : null;
    const fromTotal = r2(net() - total);
    const d = fromSum != null && fromSum > 0 && near(fromSum, fromTotal) ? fromSum : fromTotal;
    if (d > 0 && d < x.total) { x.disc = r2((x.disc || 0) + d); delete x.discUnknown; }
  }
  if (!near(net(), total)) {
    const x = items.find((y) => y.alt != null && near(r2(net() - y.total + y.alt), total));
    if (x) { x.total = x.alt; x.qty = x.altQty; }
  }
  for (const x of items) { delete x.alt; delete x.altQty; }
  const ok = near(net(), total) && !items.some((x) => x.discUnknown);
  return { ok, sum: net() };
}


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
  const badSuma = /PTU|VAT|OPODATK|SPRZEDAZ|RABAT|OPUST|OSZCZ|ZWOLN/;
  const votes = [];
  const vote = (v, src, wgt) => { if (v != null && v > 0 && v < 5000) votes.push({ v: r2(v), src, wgt }); };

  let sales = 0;
  let salesN = 0;
  let salesMax = 0;
  let ptu = 0;
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
  }
  if (salesN && !salesBad) vote(sales, 'sprzedaż', salesN >= 2 ? 2.2 : 1.6);
  if (cash != null && change != null && cash >= change) vote(cash - change, 'gotówka', 1.5);
  const parsed = parseItems(rows);
  const itemsN = parsed.items.length;
  if (itemsN >= 2 && !parsed.items.some((x) => x.discUnknown || x.alt != null)) vote(parsed.items.reduce((a, x) => a + x.total - (x.disc || 0), 0), 'pozycje', 1.4);
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

  const store = storeOf(U);
  const joined = U.join(' ');
  let check = checkItems(parsed.items, total, parsed.discTotal);
  // Kaucja za butelki i puszki: osobna pozycja, żeby produkty zgadzały się z zapłaconą kwotą
  if (parsed.items.length && total != null && !parsed.items.some((x) => /KAUC/.test(up(x.name)))) {
    const dep = depositOf(U, F, votes, total, check.sum, check.ok);
    if (dep) {
      if (dep.total != null) total = dep.total;
      parsed.items.push({ name: dep.v > 0 ? 'Kaucja' : 'Zwrot kaucji', qty: 1, unit: 'szt', price: dep.v, total: dep.v, dep: true });
      check = checkItems(parsed.items, total, parsed.discTotal);
    }
  }

  let date = '';
  const dm = /(20\d\d)[-.](\d\d)[-.](\d\d)/.exec(joined) || /(\d\d)[-.](\d\d)[-.](20\d\d)/.exec(joined);
  if (dm) {
    const [y, m, d] = dm[1].length === 4 ? [dm[1], dm[2], dm[3]] : [dm[3], dm[2], dm[1]];
    if (Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= 31) date = `${y}-${m}-${d}`;
  }
  return { total, how, candidates, store, date, items: parsed.items, itemsOk: check.ok, itemsSum: check.sum };
}

// System kaucyjny (od 10.2025): kaucja jest pod sumą, w części niefiskalnej. SUMA to same produkty,
// a do zapłaty jest więcej o kaucję (po 0,50 zł za puszkę i plastik, 1 zł za szklaną butelkę zwrotną).
// Zwrot kaucji za oddane opakowania zmniejsza kwotę. Zwraca { v: kaucja, total?: poprawiona kwota } albo null.
const DEP_RE = /KAUC|OPAK\w*\s*(ZWROT|KAUC)|ZWROTN\w*\s*OPAK/;
const DEP_BACK_RE = /ZWROT\w*\s*(KAUC|OPAK)|ODDAN|SKUP|BUTELKOMAT|RECYKLOMAT/;
function depositOf(U, F, votes, total, net, ok) {
  let lines = 0;
  let seen = false;
  for (let i = 0; i < U.length; i++) {
    if (!DEP_RE.test(U[i]) || /SUMA|RAZEM|ZAPLAT/.test(U[i])) continue;
    const a = amountsOf(F[i]);
    const x = a.length ? a[a.length - 1] : null;
    if (!x || x.v <= 0 || x.v > 20) continue;
    seen = true;
    lines += x.neg || DEP_BACK_RE.test(U[i]) ? -x.v : x.v;
  }
  lines = r2(lines);
  const halves = (d) => Math.abs(d * 2 - Math.round(d * 2)) < 0.02 && Math.abs(d) >= 0.5 && Math.abs(d) <= 20;
  if (ok) {
    // pozycje zgadzają się z SUMĄ bez kaucji, a zapłacono więcej: kartą albo „do zapłaty” z kaucją
    if (seen && lines && votes.some((x) => x.src !== 'pozycje' && near(x.v, r2(net + lines)))) return { v: lines, total: r2(net + lines) };
    const card = votes.filter((x) => x.src === 'karta' && halves(r2(x.v - net)));
    if (card.length) return { v: r2(card[0].v - net), total: card[0].v };
    return null;
  }
  const diff = r2(total - net);
  if (seen && lines && near(lines, diff)) return { v: diff };
  // słowo nieczytelne: różnica to pełne 50 groszy, a SUMA wydrukowana na paragonie równa się produktom
  if (halves(diff) && votes.some((x) => (x.src === 'suma' || x.src === 'sprzedaż') && near(x.v, net))) return { v: diff };
  return null;
}

// podgląd tego, co dostaje czytnik (do testów)
export async function preview(file, forTesseract = true) {
  const src = await loadImage(file);
  const box = opts.crop ? findPaper(src) : null;
  const cv = cropScaled(src, box, forTesseract ? opts.tessWidth : opts.mlWidth, forTesseract ? 4500 : 4200);
  return (forTesseract ? normalize(deskew(cv)) : deskew(cv)).toDataURL('image/jpeg', 0.8);
}
