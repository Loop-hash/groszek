// Start: ile możesz dziś wydać, pasek budżetu i skróty do reszty apki.
import { status, fmt, totalExp, levelFor, addDays, today } from '../budget.js';
import { sprite, spark, ui, dish } from '../pixels.js';
import { esc, plural } from '../ui.js';
import { listMatches } from '../offers.js';
import { todayMeals } from '../plan.js';
import { recipeIcon } from '../pixels.js';

const arrowRight = () => ui('arrow', 18, 'flip');

function sparks(mood) {
  if (mood !== 'happy') return '';
  return spark(18, 'left:18%;top:8%') + spark(12, 'left:28%;bottom:10%') + spark(14, 'right:20%;top:14%') + spark(10, 'right:26%;bottom:18%');
}

export default {
  render(c) {
    const st = c.state;
    const s = status(st);
    const p = s.period;
    const lvl = levelFor(totalExp(st));
    const pending = st.list.filter((i) => !i.done);
    const m = listMatches(st, c.data);
    const inPromo = pending.filter((i) => (m.get(i.id) || []).length).length;
    const over = s.todayLeft < 0;
    const ahead = s.aheadBy;
    const notchOut = s.fracPlan > s.fracRemaining;
    const upd = c.app.update && c.app.update.newer
      ? `<div class="card dashed row between"><div class="stack" style="gap:2px"><b>Nowa wersja Groszka</b><span class="small muted">Zainstaluje się na starą, dane zostają.</span></div>` +
        `<button class="btn small dark" data-act="update">Pobierz${c.app.update.size ? ` <span class="tiny">${Math.round(c.app.update.size / 1048576)} MB</span>` : ''}</button></div>` : '';

    const meals = todayMeals(c);
    let planned = false;
    for (let i = 0; i < 7 && !planned; i++) planned = !!(st.plan[addDays(today(), i)] || []).length;
    const planHint = !planned && st.expenses.length >= 0
      ? `<button class="card dashed row" data-act="go" data-arg="composer" style="text-align:left">${dish('pan', 34, '')}<span class="grow stack" style="gap:2px"><b>Nie masz planu jedzenia</b><span class="small muted">Podaj kwotę, a ułożę dania i zakupy na każdy dzień.</span></span>${ui('arrow', 16, 'flip')}</button>` : '';
    const mealCard = meals.length
      ? meals.map((mm) => `<button class="card row" data-act="recipe" data-arg="${esc(mm.recipe.id)}" style="text-align:left;background:none;color:inherit">` +
        `<span class="iconbox">${recipeIcon(mm.recipe.icon, 36)}</span><span class="grow stack" style="gap:2px"><span class="label">${esc(mm.label)}</span>` +
        `<span class="bold">${esc(mm.recipe.name)}</span></span>${mm.cost != null ? `<span class="price">${fmt(mm.cost)} zł</span>` : ''}</button>`).join('')
      : '';

    return `
      <header class="topbar">
        <button class="sq" data-act="go" data-arg="settings" aria-label="Ustawienia">${ui('sliders', 22)}</button>
        <div class="title"><b>Groszek</b><span>${esc(p.label)} · dzień ${p.dayIndex + 1}/${p.days}</span></div>
        <button class="lvl" data-act="go" data-arg="level" aria-label="Twój poziom: ${lvl.level}"><small>LVL</small><strong>${lvl.level}</strong></button>
      </header>
      ${upd}
      <div class="hero" style="height:${upd ? 118 : 150}px">${sparks(s.mood)}${sprite(s.mood, upd ? 112 : 140)}</div>
      <div class="stack center" style="gap:4px">
        <div class="label">${over ? 'Dziś ponad plan o' : 'Na dziś możesz wydać'}</div>
        <div class="big" style="font-size:64px">${fmt(Math.abs(s.todayLeft))}<span style="font-size:26px"> zł</span></div>
        <div class="small muted">${s.remaining >= 0
          ? `zostało ${fmt(s.remaining)} zł na ${p.daysLeft} ${plural(p.daysLeft, 'dzień', 'dni', 'dni')}`
          : `budżet przekroczony o ${fmt(-s.remaining)} zł`}</div>
      </div>
      <div class="stack" style="gap:8px">
        <div class="bar" role="img" aria-label="Zostało ${Math.round(s.fracRemaining * 100)} procent budżetu">
          <div class="fill" style="width:${(s.fracRemaining * 100).toFixed(1)}%"></div>
          <div class="notch ${notchOut ? 'out' : ''}" style="left:calc(3px + (100% - 6px) * ${s.fracPlan.toFixed(4)})"></div>
        </div>
        <div class="row between small">
          <span class="pixel">0 zł</span>
          <span class="row bold" style="gap:6px">${spark(12, '', '')}${ahead >= 0 ? `${fmt(ahead)} zł przed planem` : `${fmt(-ahead)} zł za planem`}</span>
          <span class="pixel">${fmt(s.budget, 0)} zł</span>
        </div>
      </div>
      ${mealCard || planHint}
      <button class="cta" data-act="go" data-arg="add">${ui('plus', 18)}<span>Dodaj wydatek</span>${arrowRight()}</button>
      <nav class="nav" aria-label="Sekcje">
        <button data-act="go" data-arg="list"><span class="circle">${ui('basket', 34)}${pending.length ? `<span class="badge">${pending.length}</span>` : ''}</span><span>Lista</span></button>
        <button data-act="go" data-arg="promos"><span class="circle">${ui('tag', 32)}${inPromo ? `<span class="badge">${inPromo}</span>` : ''}</span><span>Promocje</span></button>
        <button data-act="go" data-arg="recipes"><span class="circle">${dish('pot', 34, '')}</span><span>Przepisy</span></button>
        <button data-act="go" data-arg="planner"><span class="circle">${ui('cal', 30)}</span><span>Planer</span></button>
      </nav>
      <button class="btn small block" data-act="go" data-arg="history">${ui('receipt', 16)} Historia · wydane ${fmt(s.spent)} zł</button>
    `;
  },

  actions: {
    recipe: (c, id) => c.go('recipe', { id }),
  },

  peek(c) {
    const st = c.state;
    const s = status(st);
    const m = listMatches(st, c.data);
    const inPromo = st.list.filter((i) => !i.done && (m.get(i.id) || []).length).length;
    const opts = [];
    if (s.remaining < 0) return { text: 'Budżet się skończył. Od teraz tylko to, co naprawdę trzeba.', mood: 'worried' };
    if (s.todayLeft < 0) opts.push({ text: 'Dziś trochę za dużo. Jutro odrobimy.', mood: 'worried' });
    else if (s.aheadBy > s.budget * 0.02) opts.push({ text: `Jesteś ${fmt(s.aheadBy)} zł przed planem. Tak trzymaj!`, mood: 'happy' });
    else opts.push({ text: `Dziś możesz wydać ${fmt(s.todayLeft)} zł.`, mood: 'pea' });
    if (inPromo) opts.push({ text: `${inPromo} ${plural(inPromo, 'rzecz', 'rzeczy', 'rzeczy')} z listy ${plural(inPromo, 'jest', 'są', 'jest')} teraz w promocji.`, mood: 'happy' });
    return opts[Math.floor(Math.random() * opts.length)];
  },
};
