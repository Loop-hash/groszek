// Start: ile możesz dziś wydać, pasek budżetu i skróty do reszty apki.
import { status, fmt, totalExp, levelFor, addDays, today } from '../budget.js';
import { sprite, spark, ui, dish } from '../pixels.js';
import { FACTS, pickOpening } from '../facts.js';
import { costumeByKey, costumeSvg, randomRecipe } from '../costumes.js';
import { findRecipe } from '../recipes.js';
import { esc, plural } from '../ui.js';
import { listMatches } from '../offers.js';
import { todayMeals } from '../plan.js';
import { recipeIcon } from '../pixels.js';

const arrowRight = () => ui('arrow', 18, 'flip');

function sparks(mood) {
  if (mood !== 'happy') return '';
  return spark(18, 'left:-16%;top:4%') + spark(12, 'left:-8%;bottom:8%') + spark(14, 'right:-14%;top:12%') + spark(10, 'right:-8%;bottom:18%');
}

// ---------- ciekawostka przy otwarciu apki ----------
// Groszosław przechodzi ze środka na bok, przez minutę pokazuje ciekawostkę i wraca.
// Czasem przebiera się przy tym za postać, opowiada o niej i podsuwa losowe danie z jej kuchni.
const WALK = 900;
const SHOW = 60000;

function openingFact(c) {
  const i = pickOpening(c.state);
  const fact = { i, at: Date.now() + 700 };
  const cos = FACTS[i].k ? costumeByKey(FACTS[i].k) : null;
  if (cos) {
    fact.k = cos.key;
    fact.label = cos.label;
    fact.r = randomRecipe(c, cos.country);
  } else {
    fact.r = FACTS[i].r || null;
  }
  c.save();
  return fact;
}

function factPhase(app) {
  const f = app.fact;
  if (!f) return { phase: 'center' };
  const e = Date.now() - f.at;
  if (e < 0) return { phase: 'center', next: -e };
  if (e < WALK) return { phase: 'walk-in', e, next: WALK - e };
  if (e < WALK + SHOW) return { phase: 'side', e: e - WALK, next: WALK + SHOW - e };
  if (e < 2 * WALK + SHOW) return { phase: 'walk-out', e: e - WALK - SHOW, next: 2 * WALK + SHOW - e };
  return { phase: 'done' };
}

function factBubble(c, fact, e) {
  const f = FACTS[fact.i];
  const r = fact.r ? findRecipe(c, fact.r) : null;
  return `<div class="fact" style="animation-delay:-${Math.round(e)}ms" role="status">` +
    `<button class="fact-text" data-act="factHide" aria-label="Schowaj ciekawostkę"><span class="fact-label pixel">${esc(fact.label || 'Ciekawostka')}</span><span>${esc(f.t)}</span></button>` +
    (r ? `<button class="fact-link" data-act="factRecipe" data-arg="${esc(r.id)}">Przepis: ${esc(r.name.split(',')[0])}${ui('arrow', 12, 'flip')}</button>` : '') +
    '</div>';
}

function hero(c, s, small) {
  const app = c.app;
  const st = c.state;
  if (app.factPending && st.onboarded && st.settings.peek !== false && !app.fact && FACTS.length) {
    app.factPending = false;
    app.fact = openingFact(c);
  }
  let ph = factPhase(app);
  if (ph.phase === 'done') { app.fact = null; ph = { phase: 'center' }; }
  const peaW = small ? 112 : 140;
  // przebranie postaci tylko na czas ciekawostki o niej, potem zwykły wygląd
  const dressed = app.fact && app.fact.k && ph.phase !== 'center' && st.settings.costume !== false;
  const cos = dressed ? costumeByKey(app.fact.k) : null;
  const art = cos ? costumeSvg(cos, s.mood, peaW) : sprite(s.mood, peaW);
  const w = cos ? Math.round((peaW * 32) / 24) : peaW;
  const delay = ph.e != null && ph.phase !== 'side' ? ` style="animation-delay:-${Math.round(ph.e)}ms"` : '';
  const fact = ph.phase === 'side' && app.fact && FACTS[app.fact.i] ? app.fact : null;
  // przebranie jest szersze (kapelusze, rekwizyty), więc na boku zmniejsza się bardziej
  return `<div class="hero home-hero ${ph.phase}" style="--walker:${w}px;--side:${cos ? 0.68 : 0.8}">` +
    `<div class="walker"${delay}><div class="bob">${sparks(s.mood)}${art}</div></div>` +
    (fact ? factBubble(c, fact, ph.e) : '') + '</div>';
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
      ? `<div class="card dashed row between"><div class="stack" style="gap:2px"><b>Nowa wersja apki</b><span class="small muted">Jeden przycisk, twoje dane zostają.</span></div>` +
        '<button class="btn small dark" data-act="update">Aktualizuj</button></div>' : '';

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
        <div class="title"><b>Do pierwszego</b><span>${esc(p.label)} · dzień ${p.dayIndex + 1}/${p.days}</span></div>
        <button class="lvl" data-act="go" data-arg="level" aria-label="Twój poziom: ${lvl.level}"><small>LVL</small><strong>${lvl.level}</strong></button>
      </header>
      ${upd}
      ${hero(c, s, !!upd)}
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
    factHide(c) {
      const ph = factPhase(c.app);
      if (ph.phase !== 'side') return;
      c.app.fact.at = Date.now() - WALK - SHOW;
      c.render();
    },
    factRecipe(c, id) {
      c.app.fact = null;
      c.go('recipe', { id });
    },
  },

  // przejścia Groszosława: odśwież ekran na początku każdej fazy
  mounted(c) {
    clearTimeout(c.app.factTimer);
    const ph = factPhase(c.app);
    if (ph.next == null) return;
    c.app.factTimer = setTimeout(() => {
      const top = c.app.stack[c.app.stack.length - 1];
      if (top && top.name === 'home' && !document.hidden) c.render();
    }, ph.next + 30);
  },

};
