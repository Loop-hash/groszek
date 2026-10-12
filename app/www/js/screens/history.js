// Historia: co kupione, podzielone na zakupy, w okresie rozliczeniowym. Ołówek w rogu poprawia kwotę.
import { period, previousPeriod, today, fmt, r2, dayLabel, dowName, spentIn } from '../budget.js';
import { ui, sprite } from '../pixels.js';
import { esc, topbar, empty, iconBtn, plural } from '../ui.js';
import { buyRows, asItem } from '../buyitems.js';

function periodAt(c, offset) {
  const ms = c.state.settings.monthStart;
  let p = period(today(), ms);
  for (let i = 0; i < offset; i++) p = previousPeriod(p, ms);
  return p;
}

function purchase(st, e) {
  const items = (e.items || []).map(asItem);
  const pen = (st.penalties || []).filter((x) => x.expenseId === e.id).reduce((a, x) => a + x.exp, 0);
  const saved = r2((st.savings || []).filter((x) => x.expenseId === e.id).reduce((a, x) => a + x.amount, 0));
  const notes = [];
  if (saved > 0) notes.push(`na promocjach ${fmt(saved)} zł`);
  if (e.items && e.items.length && e.itemsOk === false) notes.push('pozycje nie zgadzają się z sumą');
  const sub = items.length ? `${items.length} ${plural(items.length, 'produkt', 'produkty', 'produktów')}` : 'bez listy produktów';
  return `<div class="card buy">
      <div class="buy-head">${ui('receipt', 22)}<span class="grow stack" style="gap:0"><b>${esc(e.store || 'Zakupy')}</b><span class="tiny muted">${esc(sub)}</span></span>
        <span class="price">${fmt(e.amount)} zł</span>${iconBtn('edit', 'edit', 'Popraw wydatek', e.id, 18)}</div>
      ${items.length ? `<div class="bitems">${buyRows(items)}</div>` : ''}
      ${pen ? `<div class="row small" style="gap:8px">${sprite('angry', 26)}<span class="grow">Zachcianki w trybie ostrym: −${pen} exp</span></div>` : ''}
      ${notes.length ? `<div class="buy-note">${esc(notes.join(' · '))}</div>` : ''}
    </div>`;
}

export default {
  render(c) {
    const off = c.params.offset || 0;
    const p = periodAt(c, off);
    const st = c.state;
    const items = st.expenses.filter((e) => e.date >= p.start && e.date <= p.end).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.created || 0) - (a.created || 0)));
    const total = spentIn(st.expenses, p.start, p.end);
    const budget = Number(st.settings.budget) || 0;
    const oldest = st.expenses.length ? st.expenses.reduce((m, e) => (e.date < m ? e.date : m), st.expenses[0].date) : today();
    const canPrev = p.start > oldest;
    const hasPrices = Object.values(st.prices || {}).some((s) => Object.keys(s).length);

    const byDay = new Map();
    for (const e of items) {
      if (!byDay.has(e.date)) byDay.set(e.date, []);
      byDay.get(e.date).push(e);
    }
    let rows = '';
    for (const [d, list] of byDay) {
      const sum = r2(list.reduce((a, e) => a + e.amount, 0));
      rows += `<div class="daylabel"><span>${esc(dayLabel(d))} · ${esc(dowName(d))}</span><span class="pixel">${fmt(sum)} zł</span></div>` +
        `<div class="stack" style="gap:10px">${list.map((e) => purchase(st, e)).join('')}</div>`;
    }
    const noItems = items.length && !items.some((e) => e.items && e.items.length);

    return `
      ${topbar('Historia', p.label, { right: hasPrices ? iconBtn('prices', 'tag', 'Twoje ceny') : undefined })}
      <div class="row between">
        <button class="btn small" data-act="prev" ${canPrev ? '' : 'disabled'}>${ui('arrow', 14)} Wcześniej</button>
        <button class="btn small" data-act="next" ${off > 0 ? '' : 'disabled'}>Później ${ui('arrow', 14, 'flip')}</button>
      </div>
      <div class="card stack" style="gap:4px">
        <span class="small muted">${esc(dayLabel(p.start))} – ${esc(dayLabel(p.end))}</span>
        <div class="row between"><b style="font-size:18px">Wydane</b><span class="big" style="font-size:28px">${fmt(total)} zł</span></div>
        <div class="row between small"><span class="muted">z budżetu ${fmt(budget, 0)} zł</span><span class="bold">${total <= budget ? `zostało ${fmt(budget - total)} zł` : `ponad o ${fmt(total - budget)} zł`}</span></div>
      </div>
      ${noItems && off === 0 ? '<div class="tiny muted center">Zrób zdjęcie paragonu przy dodawaniu wydatku, a Groszosław wypisze tu kupione produkty.</div>' : ''}
      ${items.length ? `<div class="stack" style="gap:0">${rows}</div>` : empty('W tym miesiącu nie ma jeszcze wydatków.')}
      ${off === 0 ? `<button class="cta" data-act="add">${ui('plus', 18)}<span>Dodaj wydatek</span>${ui('arrow', 18, 'flip')}</button>` : ''}
    `;
  },
  actions: {
    prev(c) { c.params.offset = (c.params.offset || 0) + 1; c.render(); },
    next(c) { c.params.offset = Math.max(0, (c.params.offset || 0) - 1); c.render(); },
    edit(c, id) { c.go('add', { id }, { quiet: true }); },
    add(c) { c.go('add', {}, { quiet: true }); },
    prices(c) { c.go('prices', {}, { quiet: true }); },
  },
};
