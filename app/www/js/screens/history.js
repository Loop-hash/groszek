// Historia wydatków w okresie rozliczeniowym, z przechodzeniem do poprzednich miesięcy.
import { period, previousPeriod, addDays, today, fmt, r2, dayLabel, dowName, spentIn } from '../budget.js';
import { ui } from '../pixels.js';
import { esc, topbar, empty } from '../ui.js';

function periodAt(c, offset) {
  const ms = c.state.settings.monthStart;
  let p = period(today(), ms);
  for (let i = 0; i < offset; i++) p = previousPeriod(p, ms);
  return p;
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

    const byDay = new Map();
    for (const e of items) {
      if (!byDay.has(e.date)) byDay.set(e.date, []);
      byDay.get(e.date).push(e);
    }
    let rows = '';
    for (const [d, list] of byDay) {
      const sum = r2(list.reduce((a, e) => a + e.amount, 0));
      rows += `<div class="daylabel"><span>${esc(dayLabel(d))} · ${esc(dowName(d))}</span><span class="pixel">${fmt(sum)} zł</span></div><div class="rows">` +
        list.map((e) => `<div class="item"><button class="item-main" data-act="edit" data-arg="${esc(e.id)}"><span class="iconbox" style="width:44px;height:44px">${ui('receipt', 22)}</span>` +
          `<span class="grow stack"><span class="name">${esc(e.store || 'Zakupy')}</span><span class="sub">${e.items && e.items.length ? esc(e.items.join(', ')) : 'dotknij, żeby poprawić'}</span></span></button><span class="price">${fmt(e.amount)} zł</span></div>`).join('') +
        '</div>';
    }

    return `
      ${topbar('Historia', p.label)}
      <div class="row between">
        <button class="btn small" data-act="prev" ${canPrev ? '' : 'disabled'}>${ui('arrow', 14)} Wcześniej</button>
        <button class="btn small" data-act="next" ${off > 0 ? '' : 'disabled'}>Później ${ui('arrow', 14, 'flip')}</button>
      </div>
      <div class="card stack" style="gap:4px">
        <span class="small muted">${esc(dayLabel(p.start))} – ${esc(dayLabel(p.end))}</span>
        <div class="row between"><b style="font-size:18px">Wydane</b><span class="big" style="font-size:28px">${fmt(total)} zł</span></div>
        <div class="row between small"><span class="muted">z budżetu ${fmt(budget, 0)} zł</span><span class="bold">${total <= budget ? `zostało ${fmt(budget - total)} zł` : `ponad o ${fmt(total - budget)} zł`}</span></div>
      </div>
      ${items.length ? `<div class="stack" style="gap:0">${rows}</div>` : empty('W tym miesiącu nie ma jeszcze wydatków.')}
      ${off === 0 ? `<button class="cta" data-act="add">${ui('plus', 18)}<span>Dodaj wydatek</span>${ui('arrow', 18, 'flip')}</button>` : ''}
    `;
  },
  actions: {
    prev(c) { c.params.offset = (c.params.offset || 0) + 1; c.render(); },
    next(c) { c.params.offset = Math.max(0, (c.params.offset || 0) - 1); c.render(); },
    edit(c, id) { c.go('add', { id }, { quiet: true }); },
    add(c) { c.go('add', {}, { quiet: true }); },
  },
};
