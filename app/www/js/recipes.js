// Przepisy: koszt porcji z cenami z promocji, wartości odżywcze, filtry (kuchnie, sprzęt, "nie jem", oceny).
import { norm } from './dict.js';
import { offersFor, isActive } from './offers.js';
import { r2, today } from './budget.js';

export const NUT = ['kcal', 'protein', 'fat', 'carbs', 'fiber', 'salt'];
export const NUT_LABEL = { kcal: 'Kalorie', protein: 'Białko', fat: 'Tłuszcz', carbs: 'Węglowodany', fiber: 'Błonnik', salt: 'Sól' };
export const NUT_UNIT = { kcal: 'kcal', protein: 'g', fat: 'g', carbs: 'g', fiber: 'g', salt: 'g' };
export const MEALS = { sniadanie: 'Śniadanie', obiad: 'Obiad', kolacja: 'Kolacja' };

const AVOID_FLAG = {
  'Ryby': 'fish', 'Owoce morza': 'seafood', 'Udka i steki': 'wholecut', 'Wieprzowina': 'pork', 'Wołowina': 'beef',
  'Mięso': 'meat', 'Nabiał': 'dairy', 'Gluten': 'gluten', 'Jajka': 'egg', 'Orzechy': 'nuts',
};

export function allRecipes(c) {
  const base = (c.data.recipes && c.data.recipes.recipes) || [];
  return base.concat(c.state.customRecipes || []);
}

export function findRecipe(c, id) {
  return allRecipes(c).find((r) => r.id === id) || null;
}

export function ing(c, id) {
  return (c.data.ingredients && c.data.ingredients.ingredients && c.data.ingredients.ingredients[id]) || null;
}

function hasNeed(need, gear) {
  return need.split('|').some((n) => {
    if (n === 'palnik') return gear['1 palnik'] || gear['2 palniki'];
    if (n === 'piekarnik') return gear['Piekarnik'] || gear['Air fryer'];
    if (n === 'opiekacz') return gear['Opiekacz'];
    if (n === 'toster') return gear['Toster'] || gear['Opiekacz'];
    if (n === 'blender') return gear['Blender'];
    if (n === 'mikrofala') return gear['Mikrofala'];
    return true;
  });
}

// Dlaczego przepis jest ukryty (albo null, gdy pasuje).
export function blockReason(r, s, ratings = {}) {
  if (r.custom) return null;
  if (r.country !== 'Podstawy' && s.cuisines[r.country] === false) return 'kuchnia wyłączona';
  for (const [k, on] of Object.entries(s.avoid || {})) {
    if (on && (r.flags || []).includes(AVOID_FLAG[k])) return 'nie jesz: ' + k.toLowerCase();
  }
  for (const n of r.needs || []) if (!hasNeed(n, s.gear || {})) return 'brak sprzętu: ' + n.replace('|', ' albo ');
  if (ratings[r.id] === -1) return 'nie smakowało ci';
  return null;
}

export function available(c, meal = null) {
  const s = c.state.settings;
  return allRecipes(c).filter((r) => !blockReason(r, s, c.state.ratings) && (!meal || (r.meal || ['obiad']).includes(meal)));
}

// Cena oferty za kilogram, jeśli da się ją odczytać z opisu.
export function offerPerKg(o, ingr) {
  const u = String(o.unitPrice || '');
  let m = /1\s*kg\s*([\d\s]+[,.]\d{2})/i.exec(u) || /=\s*1\s*l\s*([\d\s]+[,.]\d{2})/i.exec(u);
  if (m) return Number(m[1].replace(/\s/g, '').replace(',', '.'));
  const text = norm(`${o.detail || ''} ${o.name || ''}`);
  if (/cena za kg|za 1 kg|\/kg/.test(text)) return o.price;
  m = /(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml)\b/.exec(text);
  if (m) {
    let w = Number(m[1].replace(',', '.'));
    if (m[2] === 'g' || m[2] === 'ml') w /= 1000;
    const mult = /(\d+)\s*x\s*\d/.exec(text);
    if (mult) w *= Number(mult[1]);
    if (w > 0.02 && w < 20) return o.price / w;
  }
  m = /(\d+)\s*(szt|jaj)/.exec(text);
  if (m && ingr && ingr.piece) return o.price / ((Number(m[1]) * ingr.piece) / 1000);
  return null;
}

function offerFitsIngredient(o, ingr) {
  const text = norm(`${o.name} ${o.brand || ''}`);
  return (ingr.kw || []).some((k) => {
    const kk = norm(k);
    return kk.includes(' ') ? text.includes(kk) : text.split(' ').some((w) => w.startsWith(kk));
  });
}

let priceMemo = { key: '', map: new Map() };
// Najtańsza cena za kg w danym dniu (domyślnie dziś): zwykła albo z promocji ważnej tego dnia,
// także takiej, która dopiero się zacznie (tylko gdy da się policzyć cenę za kg i jest taniej).
export function priceOf(c, id, d = today()) {
  const key = ((c.data.promos && c.data.promos.updated) || '') + today() + JSON.stringify(c.state.settings.stores);
  if (priceMemo.key !== key) priceMemo = { key, map: new Map() };
  const mk = id + '|' + d;
  if (priceMemo.map.has(mk)) return priceMemo.map.get(mk);
  const ingr = ing(c, id);
  let res = { perKg: ingr ? ingr.kg : 0, offer: null, base: ingr ? ingr.kg : 0 };
  if (ingr && !ingr.pantry) {
    for (const o of offersFor(c.data, c.state.settings, d)) {
      if (!isActive(o, d) || !offerFitsIngredient(o, ingr)) continue;
      const pk = offerPerKg(o, ingr);
      if (!pk || pk > ingr.kg * 1.5 || pk < ingr.kg * 0.2) continue; // odrzuca dziwne odczyty
      if (pk < res.perKg) res = { perKg: pk, offer: o, base: ingr.kg };
    }
  }
  priceMemo.map.set(mk, res);
  return res;
}

export function recipeCost(c, r) {
  if (r.custom) return { perPortion: Number(r.costManual) || 0, promo: [], saved: 0 };
  let total = 0;
  let base = 0;
  const promo = [];
  for (const x of r.ings || []) {
    const p = priceOf(c, x.i);
    total += (p.perKg * x.g) / 1000;
    base += (p.base * x.g) / 1000;
    if (p.offer) promo.push({ id: x.i, offer: p.offer });
  }
  const n = r.portions || 1;
  return { perPortion: r2(total / n), total: r2(total), promo, saved: r2((base - total) / n) };
}

export function nutrition(r) {
  if (r.nutrition) return r.nutrition;
  return Object.fromEntries(NUT.map((k) => [k, Number(r[k]) || 0]));
}

// ---------- przeliczanie ilości na inną liczbę porcji ----------
// Rzeczowniki z przepisów: [1, 2–4, 5 i więcej, ułamek (1½ puszki)], rodzaj do przymiotników
const NOUNS = [
  ['szt.', 'szt.', 'szt.', 'szt.', 'f'], ['kromka', 'kromki', 'kromek', 'kromki', 'f'], ['puszka', 'puszki', 'puszek', 'puszki', 'f'],
  ['placek', 'placki', 'placków', 'placka', 'm'], ['łyżka', 'łyżki', 'łyżek', 'łyżki', 'f'], ['łyżeczka', 'łyżeczki', 'łyżeczek', 'łyżeczki', 'f'],
  ['opakowanie', 'opakowania', 'opakowań', 'opakowania', 'n'], ['kostka', 'kostki', 'kostek', 'kostki', 'f'], ['kubek', 'kubki', 'kubków', 'kubka', 'm'],
  ['kulka', 'kulki', 'kulek', 'kulki', 'f'], ['ząbek', 'ząbki', 'ząbków', 'ząbka', 'm'], ['bułka', 'bułki', 'bułek', 'bułki', 'f'],
  ['pęczek', 'pęczki', 'pęczków', 'pęczka', 'm'], ['główka', 'główki', 'główek', 'główki', 'f'], ['bagietka', 'bagietki', 'bagietek', 'bagietki', 'f'],
  ['szklanka', 'szklanki', 'szklanek', 'szklanki', 'f'], ['arkusz', 'arkusze', 'arkuszy', 'arkusza', 'm'], ['plaster', 'plastry', 'plastrów', 'plastra', 'm'],
  ['żółtko', 'żółtka', 'żółtek', 'żółtka', 'n'], ['doniczka', 'doniczki', 'doniczek', 'doniczki', 'f'],
];
// Przymiotniki: [m, ż, n, dopełniacz m/n, dopełniacz ż, 2–4, 5 i więcej]
const ADJS = [
  ['duży', 'duża', 'duże', 'dużego', 'dużej', 'duże', 'dużych'], ['mały', 'mała', 'małe', 'małego', 'małej', 'małe', 'małych'],
  ['długi', 'długa', 'długie', 'długiego', 'długiej', 'długie', 'długich'], ['czerstwy', 'czerstwa', 'czerstwe', 'czerstwego', 'czerstwej', 'czerstwe', 'czerstwych'],
  ['dojrzały', 'dojrzała', 'dojrzałe', 'dojrzałego', 'dojrzałej', 'dojrzałe', 'dojrzałych'],
];
const NOUN_OF = new Map(NOUNS.flatMap((f) => f.slice(0, 4).map((w) => [w, f])));
const ADJ_OF = new Map(ADJS.flatMap((f) => f.map((w) => [w, f])));

function countForm(n) {
  if (n !== Math.floor(n)) return 3; // ułamek
  if (n === 1) return 0;
  const d = n % 10;
  const t = n % 100;
  return d >= 2 && d <= 4 && (t < 12 || t > 14) ? 1 : 2;
}

// Liczba z połówką: 2,5 -> "2½", 0,5 -> "½"
function halves(n) {
  const w = Math.floor(n);
  return (w ? String(w) : '') + (n - w ? '½' : '');
}

function leadNumber(q) {
  const m = /^(pół|½|\d+\s?\/\s?\d+|\d+(?:[,.]\d+)?½?)\s+(.*)$/.exec(q);
  if (!m) return null;
  const t = m[1].replace(/\s/g, '');
  let n;
  if (t === 'pół' || t === '½') n = 0.5;
  else if (t.includes('/')) { const [a, b] = t.split('/').map(Number); n = b ? a / b : NaN; } else n = parseFloat(t.replace('½', '').replace(',', '.')) + (t.endsWith('½') ? 0.5 : 0);
  return Number.isFinite(n) && n > 0 ? { n, rest: m[2] } : null;
}

// "2 puszki" razy 4/3 -> "2½ puszki". Null, gdy nie da się tego ładnie przeliczyć (wtedy zostają gramy).
export function scaleQ(q, f) {
  if (f === 1) return q;
  const lead = leadNumber(String(q || '').trim());
  if (!lead) return /\d/.test(q || '') ? null : q; // "do smażenia", "szczypta" zostają
  const words = lead.rest.split(' ');
  if (words.length === 1 && words[0] === 'kg') return `${String(Math.round(lead.n * f * 10) / 10).replace('.', ',')} kg`;
  const nounF = NOUN_OF.get(words[words.length - 1]);
  const adjs = words.slice(0, nounF ? -1 : words.length).map((w) => ADJ_OF.get(w));
  if (adjs.some((a) => !a) || (!nounF && !adjs.length)) return null;
  const raw = lead.n * f;
  let n = raw >= 10 ? Math.round(raw) : Math.max(0.5, Math.round(raw * 2) / 2);
  const form = countForm(n);
  // sam przymiotnik ("4 duże") bez rzeczownika: rodzaju nie znamy, więc tylko liczby całe od 2 w górę
  if (!nounF && (form === 0 || form === 3)) {
    n = Math.max(2, Math.round(raw));
    return `${n} ${adjs.map((a) => a[countForm(n) === 1 ? 5 : 6]).join(' ')}`;
  }
  const g = nounF ? nounF[4] : 'm';
  const adjForm = (a) => (form === 1 ? a[5] : form === 2 ? a[6] : form === 0 ? a[g === 'm' ? 0 : g === 'f' ? 1 : 2] : a[g === 'f' ? 4 : 3]);
  return [halves(n), ...adjs.map(adjForm), ...(nounF ? [nounF[form]] : [])].join(' ');
}

// Gramy po przeliczeniu: okrągłe, ale bez przesady przy małych ilościach
export function niceGrams(g) {
  if (g < 10) return Math.round(g * 10) / 10;
  if (g < 50) return Math.round(g);
  if (g < 250) return Math.round(g / 5) * 5;
  return Math.round(g / 10) * 10;
}

// Opis ilości: "2 jajka (100 g)" albo "300 g". f: ile razy więcej niż w przepisie (inna liczba porcji).
export function qty(c, x, f = 1) {
  const i = ing(c, x.i);
  const g0 = x.g * f;
  const g = f === 1 ? (x.g >= 10 ? Math.round(x.g) : x.g) : niceGrams(g0);
  const q = x.q ? scaleQ(x.q, f) : null;
  if (x.q && q != null) return /\d/.test(q) || g < 5 ? `${q}${g >= 5 ? ` (${g} g)` : ''}` : `${g} g, ${q}`;
  if (i && i.piece && g0 >= i.piece * 0.75) {
    const n = Math.round((g0 / i.piece) * 2) / 2;
    return `${String(n).replace('.', ',')} szt. (${g} g)`;
  }
  return `${g} g`;
}

// Do planera: tagi białka, żeby nie było kurczaka trzy dni z rzędu.
export function proteinTag(c, r) {
  const ids = (r.ings || []).map((x) => x.i);
  if (ids.includes('kurczak')) return 'kurczak';
  if (ids.some((i) => ['mielone_wieprzowe', 'wolowina_mielona'].includes(i))) return 'mielone';
  if (ids.some((i) => ['lopatka', 'kielbasa'].includes(i))) return 'wieprzowina';
  if (ids.some((i) => ['fasola_czerwona', 'fasola_biala', 'ciecierzyca', 'soczewica_czerwona', 'soczewica_zielona'].includes(i))) return 'strączki';
  if (ids.includes('jajka')) return 'jajka';
  if (ids.some((i) => ['twarog', 'ser_zolty', 'feta'].includes(i))) return 'ser';
  return 'warzywa';
}

export function searchUrl(name) {
  return 'https://www.google.com/search?q=' + encodeURIComponent('site:aniagotuje.pl ' + name);
}
