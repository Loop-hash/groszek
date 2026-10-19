// Promocje: filtrowanie, grupy, dopasowanie do listy zakupów.
import { lookup, offerScore, norm } from './dict.js';
import { today, addDays, parseYmd, shortDate, dowName, r2 } from './budget.js';

export const STORES = { kaufland: 'Kaufland', lidl: 'Lidl', aldi: 'Aldi', biedronka: 'Biedronka' };
export const STORE_IDS = ['kaufland', 'lidl', 'aldi', 'biedronka'];

export const GROUPS = [
  { id: 'mieso', label: 'Mięso', cats: ['mięso', 'wędliny'] },
  { id: 'nabial', label: 'Nabiał', cats: ['nabiał'] },
  { id: 'warzywa', label: 'Warzywa i owoce', cats: ['warzywa', 'owoce'] },
  { id: 'pieczywo', label: 'Pieczywo', cats: ['pieczywo'] },
  { id: 'spizarnia', label: 'Spiżarnia', cats: ['makarony i kasze', 'do pieczenia', 'przyprawy', 'śniadania', 'strączki', 'sosy i dodatki', 'tłuszcze', 'bakalie'] },
  { id: 'mrozone', label: 'Mrożonki i gotowce', cats: ['mrożonki i gotowce', 'gotowe dania'] },
  { id: 'napoje', label: 'Napoje', cats: ['napoje', 'kawa i herbata', 'słodkie napoje', 'energetyki'] },
  { id: 'slodycze', label: 'Słodycze i przekąski', cats: ['słodycze', 'chipsy i przekąski'] },
  { id: 'ryby', label: 'Ryby', cats: ['ryby'] },
  { id: 'inne', label: 'Inne', cats: [] },
];

const CAT_TO_GROUP = {};
for (const g of GROUPS) for (const c of g.cats) CAT_TO_GROUP[c] = g.id;

// "SIERPC LEKKI 135 G" -> "Sierpc lekki 135 g"
export function tidy(s) {
  const t = String(s || '').trim();
  const letters = t.replace(/[^A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/g, '');
  if (letters.length > 3 && letters === letters.toUpperCase()) {
    const low = t.toLowerCase();
    return low.charAt(0).toUpperCase() + low.slice(1);
  }
  return t;
}

const metaCache = new WeakMap();
export function meta(o) {
  let m = metaCache.get(o);
  if (m) return m;
  const hit = lookup(o.name) || lookup((o.name || '') + ' ' + (o.detail || ''));
  const cat = hit ? hit.cat : 'inne';
  m = {
    ico: hit ? hit.ico : 'bag',
    cat,
    group: CAT_TO_GROUP[cat] || 'inne',
    name: tidy(o.name),
    brand: tidy(o.brand),
    text: norm([o.name, o.brand, o.detail].join(' ')),
  };
  metaCache.set(o, m);
  return m;
}

export function isActive(o, d = today()) {
  return (!o.from || o.from <= d) && (!o.to || o.to >= d);
}

export function isUpcoming(o, d = today()) {
  return o.from && o.from > d;
}

// "co druga sztuka -60%": pokazujemy średnią cenę za sztukę przy zakupie dwóch, żeby nie udawać, że jedna kosztuje tyle co druga.
const fixed = new WeakMap();
export function normalize(o) {
  let f = fixed.get(o);
  if (f) return f;
  f = o;
  if (o.oldPrice && o.price && /co drug|druga sztuk|drugi produkt/i.test(o.cond || '')) {
    const pct = (o.cond.match(/-?\d+\s?%/) || [''])[0].replace('-', '').replace(/\s/g, '');
    f = { ...o, price: r2((o.oldPrice + o.price) / 2), cond: `cena za sztukę przy zakupie 2${pct ? ` (druga ${pct} taniej)` : ''}`, discount: '' };
  }
  fixed.set(o, f);
  return f;
}

// Warunki oferty: aplikacja albo karta sklepu (app), najmniejsza liczba sztuk (min) i cena jednej sztuki przy jej spełnieniu (each).
// „co druga -60%” jest już uśredniona w normalize, „1+1 gratis” liczymy jako cenę jednej sztuki z dwóch.
export function offerTerms(o) {
  const c = String(o.cond || '').toLowerCase();
  let app = null;
  if (/lidl\s*plus/.test(c)) app = 'lidlplus';
  else if (/kaufland\s*card|z kart/.test(c)) app = 'kauflandcard';
  let min = 1;
  let each = o.price;
  let m;
  if ((m = /(\d+)\s*\+\s*(\d+)\s*gratis/.exec(c))) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    min = a + b;
    each = r2((o.price * a) / (a + b));
  } else if ((m = /przy\s+(?:zakupie\s+)?(\d+)/.exec(c))) min = Math.max(1, Number(m[1]));
  else if (/co drug|druga sztuk|drugi produkt/.test(c)) min = 2;
  return { app, min, each };
}

// Czy oferta jest dostępna bez aplikacji albo karty, których ktoś nie ma (Ustawienia → Sklepy)
export function offerAllowed(o, settings) {
  const t = offerTerms(o);
  return !t.app || !!(settings && settings.cards && settings.cards[t.app]);
}

// Oferty w sklepach włączonych w ustawieniach, bez tych, które już się skończyły.
export function offersFor(data, settings, d = today()) {
  const all = (data.promos && data.promos.offers) || [];
  const on = settings.stores || {};
  return all.filter((o) => on[o.store] !== false && (!o.to || o.to >= d)).map(normalize);
}

export function whenLabel(o, d = today()) {
  if (isUpcoming(o, d)) {
    const days = Math.round((parseYmd(o.from) - parseYmd(d)) / 86400000);
    if (days === 1) return 'od jutra';
    if (days < 7) return 'od ' + dowShortGen(o.from);
    return 'od ' + shortDate(o.from);
  }
  if (!o.to) return '';
  if (o.to === d) return 'tylko dziś';
  if (o.to === addDays(d, 1)) return 'do jutra';
  return 'do ' + shortDate(o.to);
}

function dowShortGen(s) {
  const g = { poniedziałek: 'poniedziałku', wtorek: 'wtorku', środa: 'środy', czwartek: 'czwartku', piątek: 'piątku', sobota: 'soboty', niedziela: 'niedzieli' };
  return g[dowName(s)] || shortDate(s);
}

export function saving(o) {
  if (!o || !o.oldPrice || !o.price || o.oldPrice <= o.price) return 0;
  return r2(o.oldPrice - o.price);
}

export function discountLabel(o) {
  if (o.discount) return o.discount;
  const s = saving(o);
  if (s > 0 && o.oldPrice) return '−' + Math.round((s / o.oldPrice) * 100) + '%';
  return '';
}

// Najlepsze oferty dla nazwy z listy: najpierw ważne dziś, potem te, które najbardziej przypominają produkt, potem największa obniżka.
export function matchesFor(name, offers, d = today()) {
  const hits = [];
  for (const o of offers) {
    const sc = offerScore(name, o);
    if (sc > 0) hits.push({ o, sc, act: isActive(o, d) ? 0 : 1, pct: o.oldPrice ? (o.oldPrice - o.price) / o.oldPrice : 0 });
  }
  hits.sort((a, b) => a.act - b.act || b.sc - a.sc || b.pct - a.pct || a.o.price - b.o.price);
  return hits.map((h) => h.o);
}

export function bestFor(name, offers, d = today()) {
  return matchesFor(name, offers, d)[0] || null;
}

// Dopasowania całej listy, liczone raz na zmianę listy albo promocji.
let memoKey = '';
let memoVal = new Map();
export function listMatches(state, data, d = today()) {
  const offers = offersFor(data, state.settings, d);
  const key = [(data.promos && data.promos.updated) || '', d, JSON.stringify(state.settings.stores),
    state.list.map((i) => i.id + ':' + i.name).join('|')].join('#');
  if (key === memoKey) return memoVal;
  const m = new Map();
  for (const i of state.list) m.set(i.id, matchesFor(i.name, offers, d));
  memoKey = key;
  memoVal = m;
  return m;
}

// Oferta wybrana dla pozycji z listy (albo najlepsza pasująca).
export function offerForItem(item, matches) {
  const list = matches || [];
  if (item.offerId) {
    const chosen = list.find((o) => o.id === item.offerId);
    if (chosen) return chosen;
    if (item.offer && (!item.offer.to || item.offer.to >= today())) return item.offer;
  }
  return list[0] || null;
}
