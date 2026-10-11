// Nowy wydatek: klawiatura, sklep, dzień. Ten sam ekran poprawia i usuwa stary wydatek.
import { status, fmt, today, addDays, r2, dayLabel } from '../budget.js';
import { ui } from '../pixels.js';
import { esc, topbar, chip, plural } from '../ui.js';
import { uid } from '../store.js';

const SHOPS = ['Biedronka', 'Lidl', 'Kaufland', 'Aldi', 'Żabka', 'Inny'];

function value(p) {
  const v = parseFloat(String(p.amount || '0').replace(',', '.'));
  return Number.isFinite(v) ? r2(v) : 0;
}

function init(c) {
  const p = c.params;
  if (p.ready) return;
  p.ready = true;
  if (p.id) {
    const e = c.state.expenses.find((x) => x.id === p.id);
    if (e) {
      p.amount = String(e.amount).replace('.', ',');
      p.store = e.store || '';
      p.date = e.date;
      p.note = e.note || '';
      return;
    }
    delete p.id;
  }
  p.amount = '';
  const last = c.state.expenses[c.state.expenses.length - 1];
  p.store = (last && last.store) || 'Biedronka';
  p.date = today();
  p.note = '';
}

export default {
  render(c) {
    init(c);
    const p = c.params;
    const st = c.state;
    const amount = value(p);
    const s = status(st);
    const old = p.id ? (st.expenses.find((x) => x.id === p.id) || {}).amount || 0 : 0;
    const inPeriod = p.date >= s.period.start && p.date <= s.period.end;
    const after = r2(s.remaining - (inPeriod ? amount - old : 0));
    const daysAfter = Math.max(1, s.period.daysLeft - 1);
    const perDayAfter = r2(after / daysAfter);
    const shown = p.amount ? p.amount : '0';
    const t = today();
    const dateChips = [
      chip('date', 'Dziś', p.date === t, t),
      chip('date', 'Wczoraj', p.date === addDays(t, -1), addDays(t, -1)),
      chip('date', 'Przedwczoraj', p.date === addDays(t, -2), addDays(t, -2)),
    ];
    if (![t, addDays(t, -1), addDays(t, -2)].includes(p.date)) dateChips.push(chip('date', dayLabel(p.date), true, p.date));

    const right = p.id ? `<button class="sq" data-act="del" aria-label="Usuń wydatek">${ui('trash', 22)}</button>` : undefined;
    return `
      ${topbar(p.id ? 'Popraw wydatek' : 'Nowy wydatek', '', { right })}
      <div class="stack" style="gap:6px;padding-top:6px">
        <div class="amount" aria-live="polite">${esc(shown)}<small> zł</small></div>
        <div class="center small muted">kwota z paragonu</div>
      </div>
      <div class="stack">
        <span class="label">Sklep</span>
        <div class="scroller">${SHOPS.map((n) => chip('shop', n, p.store === n, n)).join('')}</div>
      </div>
      <div class="stack">
        <span class="label">Kiedy</span>
        <div class="scroller">${dateChips.join('')}</div>
      </div>
      <div class="card row between">
        <div class="stack" style="gap:2px"><span class="small muted">Potem na dzień</span><b class="pixel" style="font-size:22px">${fmt(perDayAfter)} zł</b></div>
        <div class="small muted" style="text-align:right">zostanie<br><b class="pixel" style="font-size:18px;color:var(--ink)">${fmt(after)} zł</b><br>na ${daysAfter} ${plural(daysAfter, 'dzień', 'dni', 'dni')}</div>
      </div>
      <div class="keypad">
        ${['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0'].map((k) => `<button data-act="key" data-arg="${k}" aria-label="${k === ',' ? 'przecinek' : k}">${k}</button>`).join('')}
        <button class="dark" data-act="bksp" aria-label="Usuń cyfrę">${ui('arrow', 22)}</button>
      </div>
      <button class="cta" data-act="save" ${amount > 0 ? '' : 'aria-disabled="true"'}>${ui('check', 18)}<span>Zapisz ${fmt(amount)} zł</span>${ui('arrow', 18, 'flip')}</button>
    `;
  },

  actions: {
    key(c, k) {
      const p = c.params;
      let a = p.amount || '';
      if (k === ',') {
        if (a.includes(',')) return;
        a = (a || '0') + ',';
      } else {
        const [i, f] = a.split(',');
        if (f !== undefined && f.length >= 2) return;
        if (f === undefined && i.length >= 5) return;
        a = a === '0' ? k : a + k;
      }
      p.amount = a;
      c.render();
    },
    bksp(c) {
      c.params.amount = (c.params.amount || '').slice(0, -1);
      c.render();
    },
    shop(c, n) { c.params.store = n; c.render(); },
    date(c, d) { c.params.date = d; c.render(); },
    save(c) {
      const p = c.params;
      const amount = value(p);
      if (amount <= 0) { c.toast('Najpierw wpisz kwotę'); return; }
      const st = c.state;
      if (p.id) {
        const e = st.expenses.find((x) => x.id === p.id);
        if (e) Object.assign(e, { amount, store: p.store, date: p.date });
      } else {
        st.expenses.push({ id: uid(), amount, store: p.store, date: p.date, created: Date.now() });
      }
      st.expenses.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.created || 0) - (b.created || 0)));
      c.save();
      c.back();
      c.toast(p.id ? 'Poprawiono wydatek' : `Zapisano ${fmt(amount)} zł`);
    },
    del(c) {
      c.sheet({
        mascot: 'worried',
        render: () => `<h2>Usunąć ten wydatek?</h2><p>${fmt(value(c.params))} zł · ${esc(c.params.store || '')}</p>` +
          '<div class="row"><button class="btn grow" data-act="sheet-close">Zostaw</button><button class="btn dark grow" data-act="yes">Usuń</button></div>',
        actions: {
          yes(cc) {
            cc.state.expenses = cc.state.expenses.filter((x) => x.id !== c.params.id);
            cc.save();
            cc.closeSheet(true);
            cc.back();
            cc.toast('Usunięto wydatek');
          },
        },
      });
    },
  },
};
