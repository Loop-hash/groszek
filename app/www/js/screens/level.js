// Poziom i statystyki: exp z promocji, dni w limicie, poprzednie miesiące, podsumowanie po końcu miesiąca.
import { period, previousPeriod, today, fmt, levelFor, LEVELS, totalExp, totalSaved, summary, daysInLimit, addDays, spentIn, dowShort, r2, dayLabel, planStart } from '../budget.js';
import { sprite, spark } from '../pixels.js';
import { esc, topbar, plural } from '../ui.js';

function pastPeriods(st, n = 6) {
  const ms = st.settings.monthStart;
  const out = [];
  let p = previousPeriod(period(today(), ms), ms);
  const oldest = st.expenses.reduce((m, e) => (e.date < m ? e.date : m), today());
  for (let i = 0; i < n && p.end >= oldest; i++) {
    out.push(summary(st, p));
    p = previousPeriod(p, ms);
  }
  return out;
}

export function summarySheet(c, prev, seenKey) {
  const sm = summary(c.state, prev);
  const good = sm.ok;
  c.sheet({
    mascot: good ? 'happy' : 'worried',
    render: () => `<h2>${good ? 'Udało się!' : 'Tym razem za dużo'}</h2>` +
      `<p>Podsumowanie: ${esc(prev.label)}</p>` +
      `<div class="stats">` +
      `<div class="card stack" style="gap:2px"><span class="small muted">Wydane</span><b class="pixel" style="font-size:22px">${fmt(sm.spent)} zł</b><span class="tiny muted">z ${fmt(sm.budget, 0)} zł</span></div>` +
      `<div class="card stack" style="gap:2px"><span class="small muted">${good ? 'Zostało' : 'Ponad budżet'}</span><b class="pixel" style="font-size:22px">${fmt(Math.abs(sm.left))} zł</b></div>` +
      `<div class="card stack" style="gap:2px"><span class="small muted">Dni w limicie</span><b class="pixel" style="font-size:22px">${sm.inLimit}/${sm.total}</b></div>` +
      `<div class="card stack" style="gap:2px"><span class="small muted">Na promocjach</span><b class="pixel" style="font-size:22px">${fmt(sm.saved)} zł</b><span class="tiny muted">+${sm.exp} exp</span></div>` +
      `</div>` +
      `<button class="btn dark block" data-act="ok">${good ? 'Lecimy dalej' : 'Nowy miesiąc, nowy start'}</button>`,
    actions: {
      ok(cc) { cc.state.seenSummary = seenKey; cc.save(); cc.closeSheet(true); },
    },
    onClose(cc) { cc.state.seenSummary = seenKey; cc.save(); },
  });
}

export default {
  render(c) {
    const st = c.state;
    const exp = totalExp(st);
    const lvl = levelFor(exp);
    const next = LEVELS[lvl.level];
    const p = period(today(), st.settings.monthStart);
    const lim = daysInLimit(st, p, today());
    const savedMonth = r2(st.savings.filter((s) => s.date >= p.start && s.date <= p.end).reduce((a, s) => a + s.amount, 0));
    const spent = spentIn(st.expenses, p.start, p.end);
    const budget = Number(st.settings.budget) || 0;

    // ostatnie 7 dni: czy dzień był w limicie
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today(), -i);
      if (d < planStart(st, p)) { week.push(`<div class="left"><span class="tiny bold">${dowShort(d)}</span><span class="dot none"></span></div>`); continue; }
      const l = daysInLimit(st, p, d);
      const okDay = l.streak > 0;
      week.push(`<div class="${i === 0 ? '' : ''}"><span class="tiny bold">${dowShort(d)}</span><span class="dot ${okDay ? 'ok' : 'high'}"></span></div>`);
    }

    const past = pastPeriods(st);
    return `
      ${topbar('Twój poziom')}
      <div class="hero" style="height:150px">${spark(18, 'left:16%;top:10%')}${spark(12, 'right:20%;top:20%')}${spark(10, 'left:24%;bottom:12%')}${sprite('happy', 132)}</div>
      <div class="stack center" style="gap:4px;align-items:center">
        <div class="lvl" style="width:64px;height:64px"><small>LVL</small><strong style="font-size:26px">${lvl.level}</strong></div>
        <h1 class="hello" style="font-size:26px">${esc(lvl.name)}</h1>
        <div class="small muted">${exp} exp · 1 zł zaoszczędzony na promocji = 1 exp</div>
      </div>
      <div class="stack" style="gap:6px">
        <div class="bar"><div class="fill" style="width:${(lvl.progress * 100).toFixed(1)}%"></div></div>
        <div class="row between small"><span class="pixel">${lvl.from}</span><span class="bold">${next ? `${next.at - exp} exp do: ${esc(next.name)}` : 'Najwyższy poziom!'}</span><span class="pixel">${next ? next.at : ''}</span></div>
      </div>
      <span class="label">Ten miesiąc · ${esc(p.label)}</span>
      <div class="stats">
        <div class="card stack" style="gap:2px"><span class="small muted">Dni w limicie</span><b class="pixel" style="font-size:24px">${lim.inLimit}/${lim.total}</b></div>
        <div class="card stack" style="gap:2px"><span class="small muted">Seria</span><b class="pixel" style="font-size:24px">${lim.streak} ${plural(lim.streak, 'dzień', 'dni', 'dni')}</b><span class="tiny muted">rekord: ${lim.best}</span></div>
        <div class="card stack" style="gap:2px"><span class="small muted">Na promocjach</span><b class="pixel" style="font-size:24px">${fmt(savedMonth)} zł</b></div>
        <div class="card stack" style="gap:2px"><span class="small muted">Wydane</span><b class="pixel" style="font-size:24px">${fmt(spent)} zł</b><span class="tiny muted">z ${fmt(budget, 0)} zł</span></div>
      </div>
      <span class="label">Ostatnie 7 dni</span>
      <div class="week">${week.join('')}</div>
      <div class="tiny muted">Pełna kropka: dzień w limicie. Kwadrat: ponad plan.</div>
      ${past.length ? `<span class="label">Poprzednie miesiące</span><div class="rows">${past.map((s) => `<div class="item"><span class="grow stack"><span class="name">${esc(s.period.label)}</span><span class="sub">${esc(dayLabel(s.period.start))} – ${esc(dayLabel(s.period.end))} · w limicie ${s.inLimit}/${s.total} dni</span></span><span class="offer-price"><span class="price">${fmt(s.spent)} zł</span><span class="tiny bold">${s.ok ? 'w budżecie' : 'ponad budżet'}</span></span></div>`).join('')}</div>` : ''}
      <span class="label">Wszystkie poziomy</span>
      <div class="rows">${LEVELS.map((l, i) => `<div class="item"><span class="lvl" style="width:36px;height:36px;${i + 1 > lvl.level ? 'background:var(--paper);color:var(--ink);border:2px solid var(--ink)' : ''}"><strong style="font-size:14px">${i + 1}</strong></span><span class="grow name">${esc(l.name)}</span><span class="pixel small">${l.at} exp</span></div>`).join('')}</div>
      <div class="small muted center">Zaoszczędzone łącznie: ${fmt(totalSaved(st))} zł</div>
    `;
  },
  summarySheet,
  peek(c) {
    const lvl = levelFor(totalExp(c.state));
    const next = LEVELS[lvl.level];
    return next ? { text: `Jeszcze ${next.at - lvl.exp} exp do poziomu „${next.name}”!`, mood: 'happy' } : { text: 'Jesteśmy legendą!', mood: 'happy' };
  },
};
