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
// Najtańsza cena za kg: zwykła albo z aktualnej promocji (tylko gdy da się policzyć cenę za kg i jest taniej).
export function priceOf(c, id) {
  const key = ((c.data.promos && c.data.promos.updated) || '') + today() + JSON.stringify(c.state.settings.stores);
  if (priceMemo.key !== key) priceMemo = { key, map: new Map() };
  if (priceMemo.map.has(id)) return priceMemo.map.get(id);
  const ingr = ing(c, id);
  let res = { perKg: ingr ? ingr.kg : 0, offer: null, base: ingr ? ingr.kg : 0 };
  if (ingr && !ingr.pantry) {
    for (const o of offersFor(c.data, c.state.settings)) {
      if (!isActive(o) || !offerFitsIngredient(o, ingr)) continue;
      const pk = offerPerKg(o, ingr);
      if (!pk || pk > ingr.kg * 1.5 || pk < ingr.kg * 0.2) continue; // odrzuca dziwne odczyty
      if (pk < res.perKg) res = { perKg: pk, offer: o, base: ingr.kg };
    }
  }
  priceMemo.map.set(id, res);
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

// Opis ilości: "2 jajka (100 g)" albo "300 g".
export function qty(c, x) {
  const i = ing(c, x.i);
  const g = x.g >= 10 ? Math.round(x.g) : x.g;
  if (x.q) return /\d/.test(x.q) || g < 5 ? `${x.q}${g >= 5 ? ` (${g} g)` : ''}` : `${g} g, ${x.q}`;
  if (i && i.piece && x.g >= i.piece * 0.75) {
    const n = Math.round((x.g / i.piece) * 2) / 2;
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
