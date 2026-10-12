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
    const x = m.mult || 1;
    for (const k of NUT) t[k] += (Number(n[k]) || 0) * x;
    cost += recipeCost(c, m.recipe).perPortion * x;
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
  return [{ recipe: pick.recipe, label: `${MEALS[pick.slot] || 'Dziś'} na dziś${pick.cook === false ? (pick.prep ? ' (z food prepa)' : ' (z wczoraj)') : ''}${pick.mult && pick.mult !== 1 ? ` · ${multLabel(pick.mult)}` : ''}`, cost: r2(recipeCost(c, pick.recipe).perPortion * (pick.mult || 1)) }];
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

// opts: { amount, from, days, meals: ['sniadanie','obiad','kolacja'], cook2, prep: liczba dni food prepa albo 0, seed }
// Układa dwa warianty: z różnorodnymi śniadaniami i najtańszy. Wybiera różnorodny, jeśli mieści się w kwocie i w kaloriach.
export function compose(c, opts) {
  const T = Number(c.state.settings.kcal) || 2200;
  const a = composeOnce(c, opts, true);
  const fitsA = a.total <= opts.amount + 0.5;
  if (fitsA && a.avg.kcal >= T * 0.93) return a;
  const b = composeOnce(c, opts, false);
  const fitsB = b.total <= opts.amount + 0.5;
  if (fitsB && !fitsA) return b;
  if (fitsA && !fitsB) return a;
  if (!fitsA && !fitsB) return a.total <= b.total ? a : b;
  return b.avg.kcal > a.avg.kcal + T * 0.04 ? b : a;
}

function composeOnce(c, opts, varied) {
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
  // food prep: obiad gotowany raz na kilka dni, tylko z dań, które dobrze znoszą lodówkę i odgrzewanie
  const prepN = Math.max(0, Math.min(7, Math.round(Number(opts.prep) || 0)));
  if (prepN) {
    pools.obiad = pools.obiad.filter((r) => r.prep);
    if (opts.meals.includes('obiad') && !pools.obiad.length) warnings.push('Brak dań na food prep przy obecnych ustawieniach kuchni, sprzętu i „Nie jem”.');
  }
  for (const m of opts.meals) if (!pools[m].length && !(prepN && m === 'obiad')) warnings.push(`Brak przepisów na: ${MEALS[m].toLowerCase()}. Sprawdź kuchnie, sprzęt i „Nie jem” w ustawieniach.`);

  const plan = {};
  for (const d of dates) plan[d] = [];
  const history = { sniadanie: [], obiad: [], kolacja: [] };
  const lastTag = { obiad: null };

  const zlPerKcal = perDay / T; // tyle wolno średnio wydać na 1 kcal
  const kcalOfR = (r) => Math.max(150, nutrition(r).kcal || 0);
  const cpkOf = (r) => cost(r) / kcalOfR(r);

  function score(r, slot, i) {
    let sc = 0;
    // koszt na kalorię w porównaniu z budżetem: drożej niż budżet mocno w dół, taniej lekko w górę
    const ratio = cpkOf(r) / zlPerKcal;
    sc += ratio < 1 ? (1 - ratio) * 0.6 : -(ratio - 1) * 6;
    sc += ratings[r.id] === 1 ? 1.5 : 0;
    // kalorie: porcję można powiększyć, więc karzemy tylko, gdy nawet większa porcja nie wystarczy albo danie jest za ciężkie
    const want = (T * share[slot]) / Math.max(0.5, used);
    const kc = kcalOfR(r);
    const maxMult = slot === 'obiad' ? 2 : 1.5;
    if (kc * maxMult < want) sc -= (want - kc * maxMult) / 150;
    if (kc > want * 1.3) sc -= (kc - want * 1.3) / 150;
    // różnorodność
    const h = history[slot];
    const lastIdx = h.lastIndexOf(r.id);
    if (lastIdx >= 0) sc -= h.length - lastIdx <= (slot === 'obiad' ? 6 : 3) ? 6 : 1.5;
    sc -= h.filter((x) => x === r.id).length * 0.9;
    if (slot !== 'obiad') {
      // nie to samo "na bazie" (np. dwie różne owsianki) dzień po dniu, i nie za często w tygodniu
      const fam = family(c, r.id);
      if (h.length && family(c, h[h.length - 1]) === fam) sc -= 5;
      else if (h.slice(-2).some((id) => family(c, id) === fam)) sc -= 3;
      sc -= h.slice(-7).filter((id) => family(c, id) === fam).length * 0.8;
    }
    if (slot === 'obiad' && lastTag.obiad && proteinTag(c, r) === lastTag.obiad) sc -= 2.5;
    sc += recipeCost(c, r).promo.length * 0.25;
    return sc + rand() * 1.4;
  }

  // obiady (z gotowaniem na 2 dni)
  if (opts.meals.includes('obiad') && pools.obiad.length) {
    let i = 0;
    while (i < dates.length) {
      const r = pickBest(pools.obiad, (x) => score(x, 'obiad', i));
      const span = prepN ? Math.min(prepN, dates.length - i) : opts.cook2 && (r.portions || 1) >= 2 ? Math.min(2, dates.length - i) : 1;
      for (let k = 0; k < span; k++) {
        const m = { id: r.id, slot: 'obiad', cook: k === 0, batch: span, group: 'o' + i };
        if (prepN) m.prep = true;
        plan[dates[i + k]].push(m);
      }
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

  // większe porcje tam, gdzie brakuje kalorii
  const kcalOf = (m) => (nutrition(findRecipe(c, m.id)).kcal || 0) * (m.mult || 1);
  const dayK = (d) => plan[d].reduce((a, m) => a + kcalOf(m), 0);
  const STEPS = { obiad: [1, 1.5, 2], sniadanie: [1, 1.5], kolacja: [1, 1.5] };
  const groupOf = (m) => (m.group ? dates.flatMap((d) => plan[d].filter((mm) => mm.group === m.group)) : [m]);
  function fill() {
    const blocked = new Set();
    for (let guard = 0; guard < dates.length * 6; guard++) {
      let worst = null;
      let wd = T * 0.05;
      for (const d of dates) {
        if (blocked.has(d)) continue;
        const def = T - dayK(d);
        if (def > wd) { wd = def; worst = d; }
      }
      if (!worst) return;
      let best = null;
      let bestRatio = Infinity;
      for (const m of plan[worst]) {
        const cur = m.mult || 1;
        const next = (STEPS[m.slot] || []).find((x) => x > cur);
        if (!next) continue;
        const r = findRecipe(c, m.id);
        const addK = (nutrition(r).kcal || 0) * (next - cur);
        if (groupOf(m).some((mm) => {
          const d = dates.find((dd) => plan[dd].includes(mm));
          return dayK(d) + addK > T * 1.08;
        })) continue;
        const ratio = cpkOf(r);
        if (ratio < bestRatio) { bestRatio = ratio; best = { m, next }; }
      }
      if (!best) { blocked.add(worst); continue; }
      for (const mm of groupOf(best.m)) mm.mult = best.next;
    }
  }

  // za drogo: najpierw podmieniaj dania najdroższe na kalorię, potem zmniejszaj porcje
  function swapOne(varied = true, absolute = false) {
    const val = absolute ? cost : cpkOf;
    const cooks = [];
    for (const d of dates) for (const m of plan[d]) if (m.cook) cooks.push({ d, m, r: findRecipe(c, m.id) });
    cooks.sort((a, b) => val(b.r) * (b.m.batch || 1) * (b.m.mult || 1) - val(a.r) * (a.m.batch || 1) * (a.m.mult || 1));
    for (const ck of cooks) {
      const cur = val(ck.r);
      const idx = dates.indexOf(ck.d);
      // nigdy to samo danie dzień po dniu (poza gotowaniem na 2 dni)
      const adj = new Set([dates[idx - 1], dates[idx + (ck.m.batch || 1)]].filter(Boolean)
        .flatMap((d) => plan[d].filter((m) => m.slot === ck.m.slot).map((m) => m.id)));
      const pool = pools[ck.m.slot].filter((x) => val(x) < cur * 0.85 && !adj.has(x.id));
      if (!pool.length) continue;
      const near = new Set(dates.slice(Math.max(0, idx - 3), idx + 4).flatMap((d) => plan[d].map((m) => m.id)));
      // śniadania i kolacje: bez tej samej "bazy" dzień przed i dzień po (np. owsianka po owsiance)
      const famNear = ck.m.slot === 'obiad' || !varied ? new Set() : new Set([dates[idx - 1], dates[idx + 1]].filter(Boolean)
        .flatMap((d) => plan[d].filter((m) => m.slot === ck.m.slot).map((m) => family(c, m.id))));
      const fresh = pool.filter((x) => !near.has(x.id) && !famNear.has(family(c, x.id)));
      const fresh2 = fresh.length ? fresh : pool.filter((x) => !famNear.has(family(c, x.id)));
      const list = (fresh2.length ? fresh2 : pool).sort((a, b) => val(a) - val(b));
      const r = list[Math.floor(rand() * Math.min(3, list.length))];
      for (const mm of groupOf(ck.m)) { mm.id = r.id; mm.mult = 1; }
      return true;
    }
    return false;
  }
  function downsizeOne() {
    let best = null;
    let bc = 0;
    for (const d of dates) {
      for (const m of plan[d]) {
        if (!m.cook || (m.mult || 1) <= 1) continue;
        const c2 = cost(findRecipe(c, m.id)) * (m.batch || 1);
        if (c2 > bc) { bc = c2; best = m; }
      }
    }
    if (!best) return false;
    const steps = STEPS[best.slot];
    const prev = steps[Math.max(0, steps.indexOf(best.mult || 1) - 1)];
    for (const mm of groupOf(best)) mm.mult = prev;
    return true;
  }

  fill();
  let result = evaluate(c, plan, dates, opts);
  for (let it = 0; varied && it < 60 && result.total > opts.amount + 0.5; it++) {
    if (!swapOne(true)) break;
    fill();
    result = evaluate(c, plan, dates, opts);
  }
  // nadal za drogo: odpuść różnorodność śniadań, byle się zmieścić
  for (let it = 0; it < 60 && result.total > opts.amount + 0.5; it++) {
    if (!swapOne(false)) break;
    fill();
    result = evaluate(c, plan, dates, opts);
  }
  for (let it = 0; it < 120 && result.total > opts.amount + 0.5; it++) {
    if (!downsizeOne()) break;
    result = evaluate(c, plan, dates, opts);
  }
  // ostatnia deska ratunku: po prostu najtańsze dania, nawet kosztem kalorii
  for (let it = 0; it < 60 && result.total > opts.amount + 0.5; it++) {
    if (!swapOne(false, true)) break;
    result = evaluate(c, plan, dates, opts);
  }

  const tg = targets(s);
  const avg = Object.fromEntries(NUT.map((k) => [k, 0]));
  for (const d of dates) {
    for (const m of plan[d]) {
      const n = nutrition(findRecipe(c, m.id));
      for (const k of NUT) avg[k] += ((Number(n[k]) || 0) * (m.mult || 1)) / dates.length;
    }
  }
  if (prepN > 4) warnings.push(`Ugotowane jedzenie trzyma się w lodówce do 4 dni. Porcje na ${prepN === 5 ? '5. dzień' : 'dni po czwartym'} zamroź od razu po ugotowaniu.`);
  if (result.total > opts.amount + 0.5) {
    warnings.unshift(`Za ${fmtZl(opts.amount)} się nie da. Najtańszy plan, jaki umiem ułożyć, kosztuje około ${fmtZl(result.total)}. Zwiększ kwotę albo skróć okres.`);
  }
  if (avg.kcal < tg.kcal[0] * 0.95) {
    warnings.push(`Średnio ${Math.round(avg.kcal)} kcal dziennie, a cel to ${Math.round(T)}. ${opts.meals.length < 3 ? 'Dodaj w planie śniadania albo kolacje.' : 'Dorzuć przekąski, np. banana, jogurt albo kanapkę.'}`);
  }
  return { plan, dates, trips: result.trips, total: result.total, avg, targets: tg, warnings, opts, pantry: result.pantry };
}

function family(c, id) {
  const r = findRecipe(c, id);
  return (r && r.ings && r.ings[0] && r.ings[0].i) || id;
}

export function multLabel(x) {
  return x && x !== 1 ? `${String(x).replace('.', ',')} porcji` : '';
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
        const factor = ((m.batch || 1) * (m.mult || 1)) / (r.portions || 1);
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
