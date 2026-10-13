// Pierwsze uruchomienie: przywitanie, budżet i początek miesiąca.
import { fmt, today, MAX_PEOPLE } from '../budget.js';
import { sprite, spark } from '../pixels.js';
import { esc, stepper } from '../ui.js';
import { joinSheet } from './houseui.js';
import { available } from '../house.js';

export default {
  render(c) {
    const p = c.params;
    if (p.budget === undefined) { p.budget = c.state.settings.budget; p.start = c.state.settings.monthStart; p.people = c.state.settings.people || 1; }
    const perDay = Math.round((Number(p.budget) || 0) / 30 * 100) / 100;
    return `
      <div class="hero" style="height:190px;margin-top:20px">${spark(20, 'left:14%;top:12%')}${spark(12, 'right:18%;top:8%')}${spark(14, 'right:12%;bottom:18%')}${sprite('happy', 170)}</div>
      <h1 class="hello">Cześć! Jestem Groszosław.</h1>
      <p class="center muted" style="margin:0;line-height:1.45">Pomogę ci przeżyć do pierwszego: popilnuję budżetu na jedzenie, znajdę promocje do twojej listy i podsunę, co ugotować.</p>
      <div class="card stack" style="gap:12px">
        <div class="row between"><span class="stack" style="gap:2px"><span class="label">Dla ilu osób gotujesz?</span><span class="small muted">${p.people > 1 ? 'tryb rodzinny' : 'tylko dla siebie'}</span></span>${stepper('people', p.people, 1, MAX_PEOPLE, 'osób')}</div>
        <label class="stack" style="gap:6px"><span class="label">Ile wydajesz na jedzenie w miesiącu?</span>
          <span class="numrow"><input id="ob-budget" class="field num" type="number" inputmode="decimal" min="0" value="${esc(p.budget)}" data-in="budget" style="flex:1;width:auto"><b>zł</b></span>
          <span class="small muted" id="ob-perday">to około ${fmt(perDay)} zł dziennie</span></label>
        <label class="stack" style="gap:6px"><span class="label">Od którego dnia liczyć miesiąc?</span>
          <select id="ob-start" class="field" data-ch="start">${Array.from({ length: 28 }, (_, i) => `<option value="${i + 1}" ${Number(p.start) === i + 1 ? 'selected' : ''}>${i + 1}. dzień miesiąca</option>`).join('')}</select>
          <span class="small muted">Np. dzień, w którym dostajesz pieniądze.</span></label>
      </div>
      <button class="cta" data-act="start"><span>Zaczynamy</span>${sprite('pea', 30)}</button>
      ${available() ? '<button class="btn block" data-act="join">Mam kod wspólnego domu</button>' : ''}
      <div class="tiny muted center">Resztę (kalorie, kuchnię, tryb ostry) ustawisz później w Ustawieniach.</div>
    `;
  },
  inputs: {
    budget(c, v) {
      c.params.budget = v;
      const el = document.getElementById('ob-perday');
      if (el) el.textContent = `to około ${fmt((Number(String(v).replace(',', '.')) || 0) / 30)} zł dziennie`;
    },
  },
  changes: {
    start(c, v) { c.params.start = Number(v) || 1; },
  },
  actions: {
    join(c) { joinSheet(c, { onboarding: true }); },
    people(c, v) {
      const p = c.params;
      for (const id of ['ob-budget']) { const el = document.getElementById(id); if (el) p.budget = el.value; }
      p.people = Math.max(1, Math.min(MAX_PEOPLE, (p.people || 1) + Number(v)));
      c.render();
    },
    start(c) {
      const b = Math.round(Number(String(c.params.budget).replace(',', '.')) || 0);
      if (b <= 0) { c.toast('Wpisz kwotę na miesiąc'); return; }
      const s = c.state.settings;
      s.budget = b;
      s.monthStart = Number(c.params.start) || 1;
      s.people = Math.max(1, Math.min(MAX_PEOPLE, Number(c.params.people) || 1));
      c.state.onboarded = true;
      if (!c.state.startedOn) c.state.startedOn = today();
      c.state.seenSummary = null;
      c.save();
      c.replace('home');
      c.peek('Dodawaj każdy paragon, a ja policzę resztę!', 'happy');
    },
  },
};
