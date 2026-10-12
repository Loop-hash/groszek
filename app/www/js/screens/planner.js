// Planer: kalendarz okresu, posiłki dnia, licznik kalorii i składników, zakupy z ułożonego planu.
import { period, previousPeriod, today, addDays, parseYmd, dayLabel, dowName, fmt, r2 } from '../budget.js';
import { ui, recipeIcon, food } from '../pixels.js';
import { esc, topbar, search, plural } from '../ui.js';
import { dayMeals, dayTotals, targets, nutStatus, STATUS_LABEL, buyLabel, SLOT_ORDER, multLabel } from '../plan.js';
import { available, recipeCost, nutrition, NUT, NUT_LABEL, NUT_UNIT, MEALS, findRecipe } from '../recipes.js';
import { norm } from '../dict.js';
import { addToList } from '../listlogic.js';
import { STORES } from '../offers.js';

const WD = ['PN', 'WT', 'ŚR', 'CZ', 'PT', 'SO', 'ND'];

function periodFor(c) {
  const ms = c.state.settings.monthStart;
  let p = period(today(), ms);
  const off = c.params.offset || 0;
  if (off > 0) { let d = p.end; for (let i = 0; i < off; i++) d = addDays(period(d, ms).end, 1); p = period(d, ms); }
  if (off < 0) for (let i = 0; i < -off; i++) p = previousPeriod(p, ms);
  return p;
}

function meter(k, v, range) {
  const [lo, hi] = range;
  const max = Number.isFinite(hi) ? hi * 1.4 : lo * 2;
  const pct = (x) => Math.max(0, Math.min(100, (x / max) * 100));
  const st = nutStatus(v, range);
  const val = k === 'kcal' ? Math.round(v) : (k === 'salt' ? r2(v).toFixed(1).replace('.', ',') : Math.round(v));
  return `<div class="nut-row"><b>${NUT_LABEL[k]}</b><div class="meter"><div class="zone" style="left:${pct(lo)}%;width:${pct(Number.isFinite(hi) ? hi : max) - pct(lo)}%"></div><div class="tick" style="left:${pct(v)}%"></div></div>` +
    `<span class="v">${val} ${NUT_UNIT[k]}<br><span class="status-pill" style="font-family:var(--display)">${STATUS_LABEL[st]}</span></span></div>`;
}

function addMealSheet(c, date) {
  const st = { slot: 'obiad', q: '' };
  c.sheet({
    render(cc) {
      const q = norm(st.q);
      const list = available(cc, st.slot).filter((r) => !q || norm(r.name).includes(q))
        .map((r) => ({ r, cost: recipeCost(cc, r).perPortion })).sort((a, b) => a.cost - b.cost).slice(0, 40);
      return `<h3>${esc(dayLabel(date))}: dodaj posiłek</h3>` +
        `<div class="seg">${SLOT_ORDER.map((k) => `<button class="${st.slot === k ? 'on' : ''}" data-act="slot" data-arg="${k}">${MEALS[k]}</button>`).join('')}</div>` +
        search('pl-q', st.q, 'Szukaj przepisu', 'q') +
        `<div class="rows" id="pl-results">${list.map(({ r, cost }) => `<div class="item"><button class="item-main" data-act="pick" data-arg="${esc(r.id)}">${recipeIcon(r.icon, 34)}<span class="grow stack"><span class="name" style="font-size:15px">${esc(r.name)}</span><span class="sub">${esc(r.custom ? 'mój' : r.country)} · ${Math.round(nutrition(r).kcal || 0)} kcal</span></span></button>${cost ? `<span class="price">${fmt(cost)} zł</span>` : ''}</div>`).join('') || '<div class="item muted">Brak pasujących przepisów.</div>'}</div>`;
    },
    actions: {
      slot(cc, k) { st.slot = k; cc.renderSheet(); },
      pick(cc, id) {
        (cc.state.plan[date] = cc.state.plan[date] || []).push({ id, slot: st.slot });
        cc.save();
        cc.closeSheet(true);
        cc.render();
      },
    },
    inputs: {
      q(cc, v) { st.q = v; cc.renderSheet(); const f = document.getElementById('pl-q'); if (f) { f.focus(); f.setSelectionRange(v.length, v.length); } },
    },
  });
}

export default {
  render(c) {
    const st = c.state;
    const p = periodFor(c);
    const sel = c.params.sel && c.params.sel >= p.start && c.params.sel <= p.end ? c.params.sel : (today() >= p.start && today() <= p.end ? today() : p.start);
    c.params.sel = sel;
    const tg = targets(st.settings);
    const t = today();

    // kalendarz od poniedziałku
    const first = parseYmd(p.start);
    const lead = (first.getDay() + 6) % 7;
    const cells = WD.map((w) => `<span class="wd">${w}</span>`);
    for (let i = 0; i < lead; i++) cells.push('<span class="day empty"></span>');
    let planned = 0;
    let okDays = 0;
    let costSum = 0;
    for (let d = p.start; d <= p.end; d = addDays(d, 1)) {
      const meals = dayMeals(c, d);
      let dot = '<span class="dot none"></span>';
      let ico = '';
      if (meals.length) {
        planned++;
        const tot = dayTotals(c, d);
        costSum += tot.cost;
        const s = nutStatus(tot.kcal, tg.kcal);
        if (s === 'ok') okDays++;
        dot = `<span class="dot ${s === 'ok' ? 'ok' : s === 'high' ? 'high' : ''}"></span>`;
        const main = meals.find((m) => m.slot === 'obiad') || meals[0];
        ico = recipeIcon(main.recipe.icon, 20, '');
      }
      cells.push(`<button class="day ${meals.length ? '' : 'plan'} ${d === sel ? 'sel' : ''} ${d === t ? 'today' : ''}" data-act="sel" data-arg="${d}" aria-label="${esc(dayLabel(d))}"><span>${Number(d.slice(8))}</span>${ico || '<span style="height:20px"></span>'}${dot}</button>`);
    }

    const meals = dayMeals(c, sel);
    const tot = dayTotals(c, sel);
    const mealRows = meals.map((m) => `<div class="item"><button class="item-main" data-act="recipe" data-arg="${esc(m.recipe.id)}">${recipeIcon(m.recipe.icon, 36)}<span class="grow stack"><span class="sub" style="text-transform:uppercase;font-weight:800;letter-spacing:.08em">${esc(MEALS[m.slot] || m.slot)}${m.cook === false ? ' · z poprzedniego dnia' : (m.batch > 1 ? ' · gotujesz na 2 dni' : '')}</span>${m.cook !== false && m.slot === 'obiad' ? `<span class="sub">ugotuj ${String((m.batch || 1) * (m.mult || 1)).replace('.', ',')} ${plural((m.batch || 1) * (m.mult || 1), 'porcję', 'porcje', 'porcji')} (przepis jest na ${m.recipe.portions})</span>` : ''}<span class="name" style="font-size:15px">${esc(m.recipe.name)}</span><span class="sub">${Math.round((nutrition(m.recipe).kcal || 0) * (m.mult || 1))} kcal · ${fmt(recipeCost(c, m.recipe).perPortion * (m.mult || 1))} zł</span></span></button>` +
      `<button class="pill ${m.mult && m.mult !== 1 ? 'dark' : ''}" data-act="mult" data-arg="${m.idx}" aria-label="Wielkość porcji" style="background:${m.mult && m.mult !== 1 ? 'var(--ink)' : 'var(--paper)'};color:${m.mult && m.mult !== 1 ? 'var(--paper)' : 'var(--ink)'}">×${String(m.mult || 1).replace('.', ',')}</button>` +
      `<button class="sq" style="width:38px;height:38px;border:0" data-act="rm" data-arg="${m.idx}" aria-label="Usuń z planu">${ui('trash', 16)}</button></div>`).join('');

    const trips = (st.trips || []).filter((tr) => tr.date >= t).slice(0, 6);
    const tripRows = trips.map((tr, i) => `<details class="more"><summary><span>${esc(tr.label || dayLabel(tr.date))} · ${esc(tr.storeName || 'dowolny dyskont')}</span><span class="pixel">${fmt(tr.cost)} zł</span></summary><div class="stack">` +
      tr.items.map((it) => `<div class="row">${food(it.icon, 22)}<span class="grow small">${esc(it.name)} <span class="muted">· ${esc(buyLabel(it))}</span></span>${it.promo ? `<span class="pill dark">${esc(STORES[it.promo.store])}</span>` : ''}<span class="pixel small">${fmt(it.price)}</span></div>`).join('') +
      `<button class="btn small block" data-act="trip" data-arg="${i}">${ui('basket', 14)} Dopisz te zakupy do listy</button></div></details>`).join('');

    const label = p.label;
    return `
      ${topbar('Planer', label)}
      <div class="row between">
        <button class="btn small" data-act="month" data-arg="-1">${ui('arrow', 14)} Wcześniej</button>
        <button class="btn small" data-act="month" data-arg="1">Dalej ${ui('arrow', 14, 'flip')}</button>
      </div>
      <div class="cal">${cells.join('')}</div>
      <div class="tiny muted">Kropka pełna: kalorie w normie · pusta: za mało · kwadrat: za dużo.</div>
      <button class="cta" data-act="composer">${ui('grid', 18)}<span>Ułóż plan za kwotę</span>${ui('arrow', 18, 'flip')}</button>
      ${planned ? `<div class="stats3"><div class="card stack" style="gap:2px;padding:10px"><span class="tiny muted">Zaplanowane</span><b class="pixel" style="font-size:20px">${planned} dni</b></div><div class="card stack" style="gap:2px;padding:10px"><span class="tiny muted">Kalorie w normie</span><b class="pixel" style="font-size:20px">${okDays}/${planned}</b></div><div class="card stack" style="gap:2px;padding:10px"><span class="tiny muted">Porcje razem</span><b class="pixel" style="font-size:20px">${fmt(costSum, 0)} zł</b></div></div>` : ''}
      <div class="row between"><span class="label">${esc(dowName(sel))}, ${esc(dayLabel(sel))}</span><button class="btn small" data-act="add">${ui('plus', 12)} Dodaj</button></div>
      ${meals.length ? `<div class="rows">${mealRows}</div>` : '<div class="empty-state small">Nic tu jeszcze nie ma. Dodaj posiłek albo ułóż cały plan za kwotę.</div>'}
      ${meals.length ? `<div class="card stack" style="gap:10px"><div class="row between"><b>Ten dzień</b><span class="small muted">cel ${fmt(st.settings.kcal, 0)} kcal</span></div>${NUT.map((k) => meter(k, tot[k], tg[k])).join('')}</div>` : ''}
      ${trips.length ? `<span class="label">Zakupy z planu</span><div class="stack">${tripRows}</div>` : ''}
    `;
  },
  actions: {
    sel(c, d) { c.params.sel = d; c.render(); },
    month(c, v) { c.params.offset = (c.params.offset || 0) + Number(v); c.params.sel = null; c.render(); },
    add(c) { addMealSheet(c, c.params.sel); },
    recipe(c, id) { c.go('recipe', { id }); },
    rm(c, idx) {
      const d = c.params.sel;
      const arr = c.state.plan[d] || [];
      arr.splice(Number(idx), 1);
      if (!arr.length) delete c.state.plan[d];
      c.save();
      c.render();
    },
    composer(c) { const d = c.params.sel; c.go('composer', d && d >= today() ? { start: d } : {}); },
    mult(c, idx) {
      const m = (c.state.plan[c.params.sel] || [])[Number(idx)];
      if (!m) return;
      const steps = [1, 1.5, 2, 0.5];
      m.mult = steps[(steps.indexOf(m.mult || 1) + 1) % steps.length];
      if (m.mult === 1) delete m.mult;
      c.save();
      c.render();
      c.toast(m.mult ? `Porcja ×${String(m.mult).replace('.', ',')}` : 'Zwykła porcja');
    },
    trip(c, i) {
      const t = today();
      const tr = (c.state.trips || []).filter((x) => x.date >= t)[Number(i)];
      if (!tr) return;
      let n = 0;
      for (const it of tr.items) if (addToList(c, it.name, { note: buyLabel(it) }, { quiet: true })) n++;
      c.toast(n ? `Dopisano ${n} ${plural(n, 'rzecz', 'rzeczy', 'rzeczy')} do listy` : 'Wszystko już jest na liście');
      c.render();
    },
  },
  peek(c) {
    const t = today();
    const meals = dayMeals(c, t);
    if (!meals.length) return 'Pusto w planie. Mogę ułożyć cały miesiąc za podaną kwotę!';
    const tot = dayTotals(c, t);
    const s = nutStatus(tot.kcal, targets(c.state.settings).kcal);
    return s === 'ok' ? { text: 'Dziś kalorie w normie. Pięknie!', mood: 'happy' } : s === 'low' ? { text: 'Dziś trochę za mało kalorii. Może jakaś kanapka?', mood: 'worried' } : { text: 'Dziś sporo kalorii. Jutro lżej?', mood: 'worried' };
  },
};
