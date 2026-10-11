// Plan posiłków: normy, sumy dnia, układanie miesiąca za podaną kwotę i rozpisanie zakupów.
import { today, addDays, diffDays, shopsClosed, r2, dayLabel, dowName } from './budget.js';
import { findRecipe, available, recipeCost, nutrition, NUT, ing, priceOf, proteinTag, MEALS } from './recipes.js';
import { STORES, isActive } from './offers.js';

export const SLOT_ORDER = ['sniadanie', 'obiad', 'kolacja'];

// Normy dzienne. Białko z wagi z profilu, tłuszcz i węglowodany jako procent kalorii.
export function targets(settings) {
  const T = Number(settings.kcal) || 2200;
  const w = (settings.profile && Number(settings.profile.weight)) || 70;
  return {
    kcal: [T * 0.9, T * 1.1],
    protein: [Math.max(50, 0.8 * w), 2.5 * w],
    fat: [(T * 0.2) / 9, (T * 0.35) / 9],
    carbs: [(T * 0.45) / 4, (T * 0.65) / 4],
    fiber: [25, Infinity],
    salt: [0, 5],
  };
}

export function nutStatus(v, [lo, hi]) {
  if (v < lo) return 'low';
  if (v > hi) return 'high';
  return 'ok';
}

export const STATUS_LABEL = { low: 'za mało', ok: 'w normie', high: 'za dużo' };

export function dayMeals(c, date) {
  return (c.state.plan[date] || []).map((m, idx) => ({ ...m, idx, recipe: findRecipe(c, m.id) })).filter((m) => m.recipe)
    .sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
}

export function dayTotals(c, date) {
  const t = Object.fromEntries(NUT.map((k) => [k, 0]));
  let cost = 0;
  for (const m of dayMeals(c, date)) {
    const n = nutrition(m.recipe);
    for (const k of NUT) t[k] += Number(n[k]) || 0;
    cost += recipeCost(c, m.recipe).perPortion;
  }
  return { ...t, cost: r2(cost) };
}

export function todayMeals(c) {
  const d = today();
  const meals = dayMeals(c, d);
  if (!meals.length) return [];
  const h = new Date().getHours();
  const order = h < 11 ? SLOT_ORDER : h < 17 ? ['obiad', 'kolacja'] : ['kolacja'];
  const pick = meals.filter((m) => order.includes(m.slot)).sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot))[0] || meals[meals.length - 1];
  return [{ recipe: pick.recipe, label: `${MEALS[pick.slot] || 'Dziś'} na dziś${pick.cook === false ? ' (z wczoraj)' : ''}`, cost: recipeCost(c, pick.recipe).perPortion }];
}

// ---------- układanie miesiąca ----------

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickBest(cands, scoreFn) {
  let best = null;
  let bs = -Infinity;
  for (const r of cands) {
    const s = scoreFn(r);
    if (s > bs) { bs = s; best = r; }
  }
  return best;
}

// opts: { amount, from, days, meals: ['sniadanie','obiad','kolacja'], cook2, seed }
export function compose(c, opts) {
  const rand = rng(opts.seed || 1);
  const s = c.state.settings;
  const T = Number(s.kcal) || 2200;
  const dates = Array.from({ length: opts.days }, (_, i) => addDays(opts.from, i));
  const perDay = opts.amount / Math.max(1, opts.days);
  const ratings = c.state.ratings || {};
  const costCache = new Map();
  const cost = (r) => { if (!costCache.has(r.id)) costCache.set(r.id, recipeCost(c, r).perPortion); return costCache.get(r.id); };
  const share = { sniadanie: 0.25, obiad: 0.5, kolacja: 0.25 };
  const used = opts.meals.reduce((a, m) => a + share[m], 0);

  const pools = {};
  for (const m of SLOT_ORDER) pools[m] = available(c, m).filter((r) => !r.custom || (r.nutrition && r.costManual));
  const warnings = [];
  for (const m of opts.meals) if (!pools[m].length) warnings.push(`Brak przepisów na: ${MEALS[m].toLowerCase()}. Sprawdź kuchnie, sprzęt i „Nie jem” w ustawieniach.`);

  const plan = {};
  for (const d of dates) plan[d] = [];
  const history = { sniadanie: [], obiad: [], kolacja: [] };
  const lastTag = { obiad: null };

  function score(r, slot, i) {
    const target = (perDay * share[slot]) / Math.max(0.5, used) * 1.0;
    const cst = cost(r);
    let sc = 0;
    sc -= cst > target ? (cst - target) * 3 : (target - cst) * 0.15;
    sc += ratings[r.id] === 1 ? 1.5 : 0;
    const h = history[slot];
    const lastIdx = h.lastIndexOf(r.id);
    if (lastIdx >= 0) sc -= h.length - lastIdx <= (slot === 'obiad' ? 6 : 2) ? 6 : 1.5;
    if (slot === 'obiad' && lastTag.obiad && proteinTag(c, r) === lastTag.obiad) sc -= 2.5;
    sc += recipeCost(c, r).promo.length * 0.25;
    const kc = nutrition(r).kcal || 0;
    sc -= Math.abs(kc - T * share[slot]) / 400;
    return sc + rand() * 1.4 + (i === 0 ? 0 : 0);
  }

  // obiady (z gotowaniem na 2 dni)
  if (opts.meals.includes('obiad') && pools.obiad.length) {
    let i = 0;
    while (i < dates.length) {
      const r = pickBest(pools.obiad, (x) => score(x, 'obiad', i));
      const span = opts.cook2 && (r.portions || 1) >= 2 ? Math.min(2, dates.length - i) : 1;
      for (let k = 0; k < span; k++) plan[dates[i + k]].push({ id: r.id, slot: 'obiad', cook: k === 0, batch: span });
      history.obiad.push(r.id);
      lastTag.obiad = proteinTag(c, r);
      i += span;
    }
  }
  for (const slot of ['sniadanie', 'kolacja']) {
    if (!opts.meals.includes(slot) || !pools[slot].length) continue;
    dates.forEach((d, i) => {
      const taken = new Set(plan[d].map((m) => m.id));
      const r = pickBest(pools[slot].filter((x) => !taken.has(x.id)), (x) => score(x, slot, i));
      if (!r) return;
      plan[d].push({ id: r.id, slot, cook: true, batch: 1 });
      history[slot].push(r.id);
    });
  }

  let result = evaluate(c, plan, dates, opts);
  // za drogo? podmieniaj najdroższe obiady na tańsze
  for (let it = 0; it < 40 && result.total > opts.amount; it++) {
    const cooks = [];
    for (const d of dates) for (const m of plan[d]) if (m.cook) cooks.push({ d, m, c: cost(findRecipe(c, m.id)) * m.batch });
    cooks.sort((a, b) => b.c - a.c);
    let changed = false;
    for (const ck of cooks) {
      const pool = pools[ck.m.slot].filter((x) => cost(x) < cost(findRecipe(c, ck.m.id)) - 0.3);
      if (!pool.length) continue;
      const near = dates.slice(Math.max(0, dates.indexOf(ck.d) - 4), dates.indexOf(ck.d) + 5).flatMap((d) => plan[d].map((m) => m.id));
      const fresh = pool.filter((x) => !near.includes(x.id));
      const r = (fresh.length ? fresh : pool).sort((a, b) => cost(a) - cost(b))[Math.floor(rand() * Math.min(3, (fresh.length ? fresh : pool).length))];
      const oldId = ck.m.id;
      const idx = dates.indexOf(ck.d);
      for (let k = 0; k < ck.m.batch; k++) {
        const row = plan[dates[idx + k]];
        if (!row) continue;
        const mm = row.find((x) => x.slot === ck.m.slot && x.id === oldId);
        if (mm) mm.id = r.id;
      }
      changed = true;
      break;
    }
    if (!changed) break;
    result = evaluate(c, plan, dates, opts);
  }

  const tg = targets(s);
  const avg = Object.fromEntries(NUT.map((k) => [k, 0]));
  for (const d of dates) {
    for (const m of plan[d]) {
      const n = nutrition(findRecipe(c, m.id));
      for (const k of NUT) avg[k] += (Number(n[k]) || 0) / dates.length;
    }
  }
  if (result.total > opts.amount + 0.5) {
    warnings.unshift(`Za ${fmtZl(opts.amount)} się nie da. Najtańszy plan, jaki umiem ułożyć, kosztuje około ${fmtZl(result.total)}. Zwiększ kwotę albo skróć okres.`);
  }
  if (avg.kcal < tg.kcal[0] * 0.95) {
    warnings.push(`Średnio ${Math.round(avg.kcal)} kcal dziennie, a cel to ${Math.round(T)}. ${opts.meals.length < 3 ? 'Dodaj w planie śniadania albo kolacje.' : 'Dorzuć przekąski, np. banana, jogurt albo kanapkę.'}`);
  }
  return { plan, dates, trips: result.trips, total: result.total, avg, targets: tg, warnings, opts, pantry: result.pantry };
}

function fmtZl(n) {
  return String(r2(n).toFixed(2)).replace('.', ',') + ' zł';
}

// Zakupy: co kilka dni, w dzień otwarty, z całymi opakowaniami i resztkami przechodzącymi na kolejne zakupy.
export function evaluate(c, plan, dates, opts) {
  const blocks = [];
  let cur = null;
  for (const d of dates) {
    if (!cur || diffDays(cur.start, d) >= 4) { cur = { start: d, dates: [] }; blocks.push(cur); }
    cur.dates.push(d);
  }
  const t0 = today();
  const trips = [];
  for (const b of blocks) {
    let day = b.start;
    while (shopsClosed(day) && day > t0) day = addDays(day, -1);
    if (shopsClosed(day)) { day = b.start; while (shopsClosed(day)) day = addDays(day, 1); }
    trips.push({ date: day, dates: b.dates, need: {} });
  }
  const pantry = new Set();
  for (const tr of trips) {
    for (const d of tr.dates) {
      for (const m of plan[d] || []) {
        if (!m.cook) continue;
        const r = findRecipe(c, m.id);
        if (!r || r.custom) continue;
        const factor = (m.batch || 1) / (r.portions || 1);
        for (const x of r.ings || []) {
          const i = ing(c, x.i);
          if (!i) continue;
          if (i.pantry) { pantry.add(x.i); continue; }
          tr.need[x.i] = (tr.need[x.i] || 0) + x.g * factor;
        }
      }
    }
  }
  const stock = {};
  let total = 0;
  for (const tr of trips) {
    tr.items = [];
    tr.cost = 0;
    const storeVotes = {};
    for (const [id, gNeed] of Object.entries(tr.need)) {
      const i = ing(c, id);
      const have = stock[id] || 0;
      let need = gNeed - have;
      if (need <= 0) { stock[id] = have - gNeed; continue; }
      const p = priceOf(c, id);
      const promoOk = p.offer && isActive(p.offer, tr.date);
      const perKg = promoOk ? p.perKg : p.base;
      let buyG;
      let packs = 0;
      if (i.pkg) { packs = Math.ceil(need / i.pkg - 0.03); buyG = packs * i.pkg; } else buyG = Math.ceil(need / 50) * 50;
      const price = r2((perKg * buyG) / 1000);
      stock[id] = have + buyG - gNeed;
      tr.items.push({ id, name: i.name, icon: i.icon, g: Math.round(buyG), packs, pkg: i.pkg, piece: i.piece, price, promo: promoOk ? p.offer : null });
      tr.cost += price;
      if (promoOk) storeVotes[p.offer.store] = (storeVotes[p.offer.store] || 0) + 1;
    }
    tr.cost = r2(tr.cost);
    tr.items.sort((a, b) => b.price - a.price);
    const best = Object.entries(storeVotes).sort((a, b) => b[1] - a[1])[0];
    tr.store = best ? best[0] : '';
    tr.storeName = best ? STORES[best[0]] : 'dowolny dyskont';
    tr.label = `${dowName(tr.date)}, ${dayLabel(tr.date)}`;
    delete tr.need;
    total += tr.cost;
  }
  return { trips, total: r2(total), pantry: [...pantry].map((id) => (ing(c, id) || {}).name).filter(Boolean) };
}

// Ile sztuk / opakowań: "2 × 500 g" albo "ok. 3 szt. (450 g)"
export function buyLabel(it) {
  if (it.pkg && it.packs) return `${it.packs} × ${it.pkg >= 1000 ? (it.pkg / 1000).toString().replace('.', ',') + ' kg' : it.pkg + ' g'}`;
  if (it.piece) return `ok. ${Math.max(1, Math.round(it.g / it.piece))} szt. (${it.g} g)`;
  return it.g >= 1000 ? `${(it.g / 1000).toFixed(2).replace('.', ',')} kg` : `${it.g} g`;
}
