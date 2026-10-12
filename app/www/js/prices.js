// Produkty z paragonów: baza cen w sklepach, promocje i kary za zachcianki w trybie ostrym.
// Baza aktualizuje się przy każdym zapisanym paragonie i zostaje w telefonie.
import { norm, nameKey, stemPL, classify, lookup, offerScore } from './dict.js';
import { CANON } from './canon.js';
import { r2 } from './budget.js';
import { blocked } from './listlogic.js';

const near = (a, b) => Math.abs(a - b) <= 0.011;
const STOPW = new Set(['z', 'ze', 'do', 'na', 'w', 'we', 'i', 'bez', 'dla', 'od', 'po', 'a', 'o', 'kg', 'g', 'ml', 'l', 'szt']);

function wordsOf(name) {
  return norm(name).split(/[ .,]+/).map((w) => w.replace(/\d.*$/, '')).filter((w) => w.length >= 2 && !STOPW.has(w));
}

const CANON_STEMS = [...new Set(CANON)].map((n) => [n, wordsOf(n).map(stemPL)]).filter(([, s]) => s.length);

// Do jakiej rzeczy z listy zakupów pasuje nazwa z paragonu: "Lubella świderki 400g" -> "świderki".
// Krótki rdzeń musi pasować dokładnie, żeby "mieszanka" nie stała się mięsem.
export function canonOf(name) {
  const ws = wordsOf(name);
  const st = ws.map(stemPL);
  let best = null;
  let bs = 0;
  for (const [n, cs] of CANON_STEMS) {
    const ok = cs.every((c) => st.some((s, i) => s === c || (c.length >= 5 && ws[i].startsWith(c))));
    if (!ok) continue;
    // pierwszy wyraz to zwykle rzeczownik ("Ser Kasztelan śmietankowy" to ser, nie śmietana)
    const sc = cs.length * 100 + cs.join('').length + (st[0] === cs[0] ? 50 : 0);
    if (sc > bs) { bs = sc; best = n; }
  }
  return best;
}

export const productKey = (name) => nameKey(name) || norm(name);

// Pozycja jest pewna, gdy ilość razy cena daje jej wartość
export const sure = (x) => x && x.qty > 0 && x.price > 0 && x.total > 0 && near(r2(x.qty * x.price), x.total);
export const paidOf = (x) => r2((Number(x.total) || 0) - (Number(x.disc) || 0));

// Ikonka, kategoria i czy to zachcianka (w trybie ostrym według włączonych kategorii)
export function describe(x, state) {
  const cls = classify(x.name, state.learned || {});
  const treat = state.settings && state.settings.strict ? blocked(cls, state.settings) : !!cls.treat;
  return { ico: cls.ico, cat: cls.cat, treat };
}

// Czy produkt był w promocji: rabat na paragonie albo cena z gazetki tego sklepu
export function promoFor(x, offers, storeId) {
  if (x.disc > 0) return { kind: 'rabat', save: x.disc };
  if (!storeId || !offers || !x.price) return null;
  const hx = lookup(x.name);
  for (const o of offers) {
    if (o.store !== storeId || !o.price || Math.abs(o.price - x.price) > 0.011) continue;
    const ho = lookup(o.name);
    const same = offerScore(x.name, o) > 0 || (hx && ho && hx.kw === ho.kw);
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
    const key = productKey(x.name);
    if (!key) continue;
    const paid = r2(paidOf(x) / x.qty);
    const prev = shop[key];
    const hist = [...((prev && prev.hist) || []), [date, paid]].sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-6);
    if (prev && prev.date > date) { prev.hist = hist; continue; }
    shop[key] = { name: x.name, canon: canonOf(x.name) || '', cat: x.cat || (lookup(x.name) || {}).cat || '', unit: x.unit || 'szt', price: x.price, paid, promo: !!x.promo, date, hist };
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
  if (!ok || !state.settings || !state.settings.strict) return { exp: 0, items: [] };
  const bad = (items || []).filter((x) => x.treat);
  const sum = bad.reduce((a, x) => a + paidOf(x), 0);
  return { exp: Math.ceil(sum - 0.001), items: bad.map((x) => x.name), sum: r2(sum) };
}

export function penaltyTotal(state, from = '', to = '9999') {
  return (state.penalties || []).filter((p) => p.date >= from && p.date <= to).reduce((a, p) => a + (p.exp || 0), 0);
}
