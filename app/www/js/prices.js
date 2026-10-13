// Produkty z paragonów: baza cen w sklepach, promocje i kary za zachcianki w trybie ostrym.
// Baza aktualizuje się przy każdym zapisanym paragonie i zostaje w telefonie.
import { norm, nameKey, stemPL, classify, lookup, offerScore } from './dict.js';
import { CANON } from './canon.js';
import { r2, strictOn } from './budget.js';
import { blocked } from './listlogic.js';

const near = (a, b) => Math.abs(a - b) <= 0.011;
const STOPW = new Set(['z', 'ze', 'do', 'na', 'w', 'we', 'i', 'bez', 'dla', 'od', 'po', 'a', 'o', 'kg', 'g', 'ml', 'l', 'szt']);

function wordsOf(name) {
  return norm(name).split(/[ .,]+/).map((w) => w.replace(/\d.*$/, '')).filter((w) => w.length >= 2 && !STOPW.has(w));
}

const CANON_STEMS = [...new Set(CANON)].map((n) => [n, wordsOf(n).map(stemPL)]).filter(([, s]) => s.length);

// Do jakiej rzeczy z listy pasuje nazwa z paragonu: "Lubella świderki 400g" -> "świderki".
// Krótki rdzeń musi pasować dokładnie, żeby "mieszanka" nie stała się mięsem. Skrót z paragonu
// ("POMID", "TOST") pasuje do pełnego słowa, które się od niego zaczyna. Nazwa z kilku słów
// pasuje też sklejona ("HOTDOG" to "hot dog"). Danie wygrywa z tym, co w nim jest:
// "Hot-dog z kabanosem" to hot dog, a nie kabanosy. Przymiotnik się nie liczy: "pasta kanapkowa" to nie kanapka.
export function canonOf(name) {
  const ws = wordsOf(name);
  const st = ws.map(stemPL);
  let best = null;
  let bs = 0;
  for (const [n, cs] of CANON_STEMS) {
    const glued = cs.length > 1 && ws.some((w) => w.startsWith(cs.join('')));
    const ok = glued || cs.every((c) => st.some((s, i) => s === c || (c.length >= 5 && ws[i].startsWith(c) && !/^ow[aeyi]/.test(ws[i].slice(c.length))) || (ws[i].length >= 4 && c.startsWith(ws[i]))));
    if (!ok) continue;
    // pierwszy wyraz to zwykle rzeczownik ("Ser Kasztelan śmietankowy" to ser, nie śmietana)
    const sc = cs.length * 100 + cs.join('').length + (st[0] === cs[0] ? 50 : 0);
    if (sc > bs) { bs = sc; best = n; }
  }
  return best;
}

// Marki, które nie są nazwą z listy zakupów
const BEERS = ['tyskie', 'zywiec', 'lech', 'harnas', 'perla', 'okocim', 'warka', 'carlsberg', 'heineken', 'tatra', 'kozel', 'zubr', 'somersby', 'desperados'];
const BRAND_NAME = { ...Object.fromEntries(BEERS.map((b) => [b, 'piwo'])), fairy: 'płyn do naczyń', ludwik: 'płyn do naczyń', persil: 'proszek do prania', ariel: 'proszek do prania', vizir: 'proszek do prania', lenor: 'płyn do płukania' };

// Ogólna nazwa produktu zamiast skrótu z paragonu: "MLEKOVITA MLEKUHT3,2%1L" -> "Mleko 3,2% 1 l".
// Zwraca null, gdy nie wiadomo, co to jest.
export function generalName(raw) {
  let base = canonOf(raw);
  if (!base) {
    const n = norm(raw);
    const brand = Object.keys(BRAND_NAME).find((b) => n.split(' ').some((w) => w.startsWith(b)));
    if (brand) base = BRAND_NAME[brand];
  }
  if (!base) {
    const hit = lookup(raw);
    const kw = hit && hit.kw.replace(/^[=^]/, '');
    if (kw && kw.length >= 4) {
      const c = [...new Set(CANON)].filter((x) => norm(x).includes(kw)).sort((a, b) => (norm(b).startsWith(kw) - norm(a).startsWith(kw)) || a.length - b.length)[0];
      if (c) base = c;
    }
  }
  if (!base) return null;
  const extra = [];
  const pct = /(\d{1,2}(?:[,.]\d)?)\s?%/.exec(raw);
  if (pct && !base.includes('%')) extra.push(pct[1].replace('.', ',') + '%');
  const size = /(\d+(?:[,.]\d+)?)\s?(kg|g|ml|l)(?![a-ząćęłńóśźż])/i.exec(raw.replace(/(\d)\s?%/, '$1% '));
  if (size && Number(size[1].replace(',', '.')) > 0) extra.push(size[1] + ' ' + size[2].toLowerCase());
  const nm = [base, ...extra].join(' ');
  return nm.charAt(0).toUpperCase() + nm.slice(1);
}

export const productKey = (name) => nameKey(name) || norm(name);

// Pozycja jest pewna, gdy ilość razy cena daje jej wartość
export const sure = (x) => x && x.qty > 0 && x.price > 0 && x.total > 0 && near(r2(x.qty * x.price), x.total);
export const paidOf = (x) => r2((Number(x.total) || 0) - (Number(x.disc) || 0));

// Ikonka, kategoria i czy to zachcianka (w trybie ostrym według włączonych kategorii)
export function describe(x, state) {
  const cls = classify(x.name, state.learned || {});
  const treat = strictOn(state) ? blocked(cls, state.settings) : !!cls.treat;
  return { ico: cls.ico, cat: cls.cat, treat };
}

// Czy produkt był w promocji: rabat na paragonie albo cena z gazetki tego sklepu
// Promocja z gazetki liczy się tylko wtedy, gdy paragon jest z czasu jej trwania.
export function promoFor(x, offers, storeId, date) {
  if (x.disc > 0) return { kind: 'rabat', save: x.disc };
  if (!storeId || !offers || !x.price || !date) return null;
  const hx = lookup(x.raw || x.name);
  for (const o of offers) {
    if (o.store !== storeId || !o.price || Math.abs(o.price - x.price) > 0.011) continue;
    if ((o.from && o.from > date) || (o.to && o.to < date)) continue;
    const ho = lookup(o.name);
    const same = offerScore(x.name, o) > 0 || (x.raw && offerScore(x.raw, o) > 0) || (hx && ho && hx.kw === ho.kw);
    if (!same) continue;
    const save = o.oldPrice && o.oldPrice > o.price ? r2((o.oldPrice - o.price) * (x.unit === 'kg' ? 1 : x.qty || 1)) : 0;
    return { kind: 'gazetka', save, offer: o.name };
  }
  return null;
}

// Zapisuje ceny z paragonu: ostatnia cena w danym sklepie i kilka poprzednich
export function recordPrices(state, store, date, items) {
  if (!store || store === 'Inny') return 0;
  const db = state.prices || (state.prices = {});
  const shop = db[store] || (db[store] = {});
  let n = 0;
  for (const x of items || []) {
    if (!sure(x)) continue;
    const key = productKey(x.raw || x.name);
    if (!key) continue;
    const paid = r2(paidOf(x) / x.qty);
    const prev = shop[key];
    const hist = [...((prev && prev.hist) || []), [date, paid]].sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-6);
    if (prev && prev.date > date) { prev.hist = hist; continue; }
    shop[key] = { name: x.raw || x.name, canon: canonOf(x.name) || canonOf(x.raw || '') || '', cat: x.cat || (lookup(x.name) || {}).cat || '', unit: x.unit || 'szt', price: x.price, paid, promo: !!x.promo, date, hist };
    n++;
  }
  return n;
}

// Wszystkie znane ceny rzeczy z listy, najświeższe najpierw: [{ store, name, paid, unit, date, promo }]
// Nazwy z paragonów bywają sklejone ("MLEKUHT3,2%"), więc wystarczy też początek wyrazu z tej samej kategorii.
export function pricesFor(state, name) {
  const canon = canonOf(name);
  const key = productKey(name);
  const stems = wordsOf(name).map(stemPL).filter((w) => w.length >= 4);
  const cat = (lookup(name) || {}).cat;
  const out = [];
  for (const [store, shop] of Object.entries(state.prices || {})) {
    for (const p of Object.values(shop)) {
      const ws = wordsOf(p.name);
      const loose = cat && p.cat === cat && stems.length && stems.every((s) => ws.some((w) => w.startsWith(s)));
      if ((canon && p.canon === canon) || productKey(p.name) === key || loose) out.push({ store, ...p });
    }
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.paid - b.paid));
}

// Kara w trybie ostrym: 1 zł wydany na zachciankę = 1 exp mniej. Tylko gdy pozycje zgadzają się z sumą.
export function penaltyFor(items, state, ok) {
  if (!ok || !strictOn(state)) return { exp: 0, items: [] };
  const bad = (items || []).filter((x) => x.treat);
  const sum = bad.reduce((a, x) => a + paidOf(x), 0);
  return { exp: Math.ceil(sum - 0.001), items: bad.map((x) => x.name), sum: r2(sum) };
}

export function penaltyTotal(state, from = '', to = '9999') {
  return (state.penalties || []).filter((p) => p.date >= from && p.date <= to).reduce((a, p) => a + (p.exp || 0), 0);
}
