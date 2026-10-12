// Składanie miesiąca: podajesz kwotę, Groszek układa dania na każdy dzień i rozpisuje zakupy.
import { status, today, addDays, fmt, dayLabel, dowShort, period, diffDays } from '../budget.js';
import { ui, recipeIcon, food, sprite } from '../pixels.js';
import { esc, topbar, toggle, plural } from '../ui.js';
import { compose, nutStatus, STATUS_LABEL, buyLabel, multLabel } from '../plan.js';
import { findRecipe, NUT, NUT_LABEL, NUT_UNIT, MEALS } from '../recipes.js';
import { STORES } from '../offers.js';

function defaults(c) {
  const p = c.params;
  if (p.ready) return p;
  const s = status(c.state);
  p.ready = true;
  p.amount = Math.max(0, Math.round(s.remaining));
  const late = new Date().getHours() >= 12;
  p.from = late ? addDays(today(), 1) : today();
  p.days = Math.max(1, s.period.daysLeft - (late ? 1 : 0)) || 30;
  // z planera: plan od dnia zaznaczonego w kalendarzu, do końca okresu
  if (p.start && p.start >= today()) {
    p.from = p.start;
    p.days = Math.max(1, Math.min(62, diffDays(p.start, s.period.end) + 1));
  }
  p.meals = { sniadanie: true, obiad: true, kolacja: true };
  p.cook2 = true;
  p.seed = 1;
  return p;
}

// Zmiana dnia startu: jeśli liczby dni nie wpisano ręcznie, plan sięga do końca okresu budżetu.
function setFrom(c, d) {
  const p = c.params;
  p.from = d;
  if (!p.daysTouched) {
    const end = status(c.state).period.end;
    if (d <= end) p.days = Math.max(1, Math.min(62, diffDays(d, end) + 1));
  }
  c.app.composed = null;
  c.render();
}

export default {
  render(c) {
    const p = defaults(c);
    const res = c.app.composed;
    const fromOpts = [0, 1].map((i) => addDays(today(), i));
    if (!fromOpts.includes(p.from)) fromOpts.push(p.from);
    let out = '';
    if (res) {
      const ok = res.total <= p.amount + 0.5;
      const daysHtml = res.dates.map((d) => {
        const row = (res.plan[d] || []).slice().sort((a, b) => ['sniadanie', 'obiad', 'kolacja'].indexOf(a.slot) - ['sniadanie', 'obiad', 'kolacja'].indexOf(b.slot));
        const trip = res.trips.find((t) => t.date === d);
        return `<div class="item col" style="gap:6px"><div class="row between"><b>${dowShort(d)} · ${esc(dayLabel(d))}</b>${trip ? `<span class="pill dark">${ui('basket', 12)} zakupy</span>` : ''}</div>` +
          row.map((m) => { const r = findRecipe(c, m.id); return r ? `<div class="row">${recipeIcon(r.icon, 26)}<span class="small grow"><span class="muted">${MEALS[m.slot]}:</span> ${esc(r.name)}${m.mult && m.mult !== 1 ? ` <b>· ${multLabel(m.mult)}</b>` : ''}${m.slot === 'obiad' ? (m.cook ? (m.batch > 1 ? ' <b>(gotujesz na 2 dni)</b>' : '') : ' <span class="muted">(z wczoraj)</span>') : ''}</span></div>` : ''; }).join('') + '</div>';
      }).join('');
      const trips = res.trips.map((tr) => `<details class="more"><summary><span>${esc(dowShort(tr.date))} ${esc(dayLabel(tr.date))} · ${esc(tr.storeName)}</span><span class="pixel">${fmt(tr.cost)} zł</span></summary><div class="stack">` +
        tr.items.map((it) => `<div class="row">${food(it.icon, 22)}<span class="grow small">${esc(it.name)} <span class="muted">· ${esc(buyLabel(it))}</span></span>${it.promo ? `<span class="pill dark">${esc(STORES[it.promo.store])}</span>` : ''}<span class="pixel small">${fmt(it.price)}</span></div>`).join('') + '</div></details>').join('');
      const nutRows = NUT.map((k) => {
        const st = nutStatus(res.avg[k], res.targets[k]);
        const v = k === 'salt' ? res.avg[k].toFixed(1).replace('.', ',') : Math.round(res.avg[k]);
        return `<div class="row between small"><span>${NUT_LABEL[k]}</span><span><span class="pixel">${v} ${NUT_UNIT[k]}</span> · <b>${STATUS_LABEL[st]}</b></span></div>`;
      }).join('');
      out = `
        <div class="card ${ok ? 'dark' : ''} row" style="align-items:center">${sprite(ok ? 'happy' : 'worried', 56)}<div class="grow stack" style="gap:2px">
          <b style="font-size:18px">${ok ? 'Mieści się!' : 'Nie mieści się'}</b>
          <span class="small">Zakupy: około <b>${fmt(res.total)} zł</b> z ${fmt(p.amount, 0)} zł${ok && p.amount - res.total > 1 ? `, zostaje ${fmt(p.amount - res.total)} zł` : ''}.</span></div></div>
        ${res.warnings.map((w) => `<div class="card dashed small">${esc(w)}</div>`).join('')}
        <span class="label">Średnio dziennie</span>
        <div class="card stack" style="gap:6px">${nutRows}</div>
        <span class="label">Zakupy · ${res.trips.length} ${plural(res.trips.length, 'wyjście', 'wyjścia', 'wyjść')}</span>
        <div class="stack">${trips}</div>
        ${res.pantry.length ? `<div class="small muted">Sprawdź w szafce: ${esc(res.pantry.join(', '))}.</div>` : ''}
        <span class="label">Dzień po dniu</span>
        <div class="rows">${daysHtml}</div>
        <div class="row"><button class="btn grow" data-act="again">${ui('refresh', 14)} Inaczej</button><button class="btn dark grow" data-act="save">Zapisz plan</button></div>
        <div class="tiny muted">Ceny z ostatnich promocji i szacunków. W niedziele i święta sklepy są zamknięte, więc zakupy wypadają wcześniej.</div>
      `;
    }

    return `
      ${topbar('Ułóż plan')}
      <div class="card stack" style="gap:12px">
        <label class="row between"><span class="bold">Kwota</span><span class="numrow"><input id="cp-amount" class="field small num" type="number" inputmode="decimal" value="${esc(p.amount)}" data-ch="amount" style="width:120px"><span>zł</span></span></label>
        <label class="row between"><span class="bold">Na ile dni</span><span class="numrow"><input id="cp-days" class="field small num" type="number" inputmode="numeric" min="1" max="62" value="${esc(p.days)}" data-ch="days" style="width:120px"><span style="width:18px"></span></span></label>
        <div class="stack" style="gap:6px"><span class="bold">Od kiedy</span><div class="seg">${fromOpts.map((d, i) => `<button class="${p.from === d ? 'on' : ''}" data-act="from" data-arg="${d}">${i === 0 ? 'Dziś' : i === 1 ? 'Jutro' : dowShort(d) + ' ' + Number(d.slice(8))}</button>`).join('')}` +
          `<label class="segbtn">Inny dzień<input id="cp-from" type="date" min="${today()}" max="${addDays(today(), 90)}" value="${esc(p.from)}" data-ch="fromDate" aria-label="Wybierz dzień startu planu"></label></div></div>
        <div class="stack" style="gap:6px"><span class="bold">Posiłki</span><div class="wrap">${Object.entries(MEALS).map(([k, v]) => `<button class="chip ${p.meals[k] ? 'on' : ''}" data-act="meal" data-arg="${k}">${v}</button>`).join('')}</div></div>
        <div class="row between"><span><b>Gotuję na 2 dni</b><br><span class="small muted">jeden obiad starcza na dwa dni</span></span>${toggle('cook2', p.cook2, 'Gotuję na 2 dni')}</div>
        <div class="small muted">${p.days ? `To ${fmt(p.amount / Math.max(1, p.days))} zł dziennie. ` : ''}Cel: ${fmt(c.state.settings.kcal, 0)} kcal dziennie (zmienisz w Ustawieniach).</div>
      </div>
      <button class="cta" data-act="run">${sprite('pea', 28)}<span>${res ? 'Ułóż od nowa' : 'Ułóż plan'}</span>${ui('arrow', 18, 'flip')}</button>
      ${out}
    `;
  },
  changes: {
    // bez przerysowania, gdy nie ma wyniku: inaczej dotknięcie przycisku zaraz po wpisaniu kwoty mogłoby nie zadziałać
    amount(c, v) { c.params.amount = Math.max(0, Number(String(v).replace(',', '.')) || 0); if (c.app.composed) { c.app.composed = null; c.render(); } },
    days(c, v) { c.params.days = Math.max(1, Math.min(62, Math.round(Number(v) || 1))); c.params.daysTouched = true; if (c.app.composed) { c.app.composed = null; c.render(); } },
    fromDate(c, v) { if (v && v >= today()) setFrom(c, v); },
  },
  actions: {
    from(c, d) { setFrom(c, d); },
    meal(c, k) {
      const m = c.params.meals;
      m[k] = !m[k];
      if (!Object.values(m).some(Boolean)) m.obiad = true;
      c.app.composed = null;
      c.render();
    },
    cook2(c) { c.params.cook2 = !c.params.cook2; c.app.composed = null; c.render(); },
    run(c) {
      const p = c.params;
      const inp = document.getElementById('cp-amount');
      if (inp) p.amount = Math.max(0, Number(String(inp.value).replace(',', '.')) || 0);
      const dInp = document.getElementById('cp-days');
      if (dInp) p.days = Math.max(1, Math.min(62, Math.round(Number(dInp.value) || 1)));
      if (p.amount <= 0) { c.toast('Wpisz kwotę'); return; }
      c.app.composed = compose(c, { amount: p.amount, from: p.from, days: p.days, meals: Object.keys(p.meals).filter((k) => p.meals[k]), cook2: p.cook2, seed: p.seed });
      c.render();
      const res = c.app.composed;
      c.peek(res.total <= p.amount + 0.5 ? 'Gotowe! Zerknij na plan i zapisz.' : 'Ciasno z kasą. Zobacz, co proponuję.', res.total <= p.amount + 0.5 ? 'happy' : 'worried');
    },
    again(c) { c.params.seed = (c.params.seed || 1) + 1; this_run(c); },
    save(c) {
      const res = c.app.composed;
      if (!res) return;
      for (const d of res.dates) {
        if (res.plan[d] && res.plan[d].length) c.state.plan[d] = res.plan[d].map((m) => ({ ...m }));
        else delete c.state.plan[d];
      }
      const keep = (c.state.trips || []).filter((t) => t.date < res.dates[0] || t.date > res.dates[res.dates.length - 1]);
      c.state.trips = keep.concat(res.trips).sort((a, b) => (a.date < b.date ? -1 : 1));
      c.save();
      c.app.composed = null;
      c.back();
      c.toast('Plan zapisany');
    },
  },
  onLeave(c) { c.app.composed = null; },
  peek: () => ({ text: 'Podaj kwotę, a ja ułożę jedzenie na każdy dzień.', mood: 'pea' }),
};

function this_run(c) {
  const p = c.params;
  c.app.composed = compose(c, { amount: p.amount, from: p.from, days: p.days, meals: Object.keys(p.meals).filter((k) => p.meals[k]), cook2: p.cook2, seed: p.seed });
  c.render();
}
