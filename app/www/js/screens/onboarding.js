// Pierwsze uruchomienie: przywitanie, budżet i początek miesiąca.
import { fmt, today } from '../budget.js';
import { sprite, spark } from '../pixels.js';
import { esc } from '../ui.js';

export default {
  render(c) {
    const p = c.params;
    if (p.budget === undefined) { p.budget = c.state.settings.budget; p.start = c.state.settings.monthStart; }
    const perDay = Math.round((Number(p.budget) || 0) / 30 * 100) / 100;
    return `
      <div class="hero" style="height:190px;margin-top:20px">${spark(20, 'left:14%;top:12%')}${spark(12, 'right:18%;top:8%')}${spark(14, 'right:12%;bottom:18%')}${sprite('happy', 170)}</div>
      <h1 class="hello">Cześć! Jestem Groszek.</h1>
      <p class="center muted" style="margin:0;line-height:1.45">Pomogę ci pilnować budżetu na jedzenie, znajdę promocje do twojej listy i podsunę, co ugotować.</p>
      <div class="card stack" style="gap:12px">
        <label class="stack" style="gap:6px"><span class="label">Ile wydajesz na jedzenie w miesiącu?</span>
          <span class="numrow"><input id="ob-budget" class="field num" type="number" inputmode="decimal" min="0" value="${esc(p.budget)}" data-in="budget" style="flex:1;width:auto"><b>zł</b></span>
          <span class="small muted" id="ob-perday">to około ${fmt(perDay)} zł dziennie</span></label>
        <label class="stack" style="gap:6px"><span class="label">Od którego dnia liczyć miesiąc?</span>
          <select id="ob-start" class="field" data-ch="start">${Array.from({ length: 28 }, (_, i) => `<option value="${i + 1}" ${Number(p.start) === i + 1 ? 'selected' : ''}>${i + 1}. dzień miesiąca</option>`).join('')}</select>
          <span class="small muted">Np. dzień, w którym dostajesz pieniądze.</span></label>
      </div>
      <button class="cta" data-act="start"><span>Zaczynamy</span>${sprite('pea', 30)}</button>
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
    start(c) {
      const b = Math.round(Number(String(c.params.budget).replace(',', '.')) || 0);
      if (b <= 0) { c.toast('Wpisz kwotę na miesiąc'); return; }
      const s = c.state.settings;
      s.budget = b;
      s.monthStart = Number(c.params.start) || 1;
      c.state.onboarded = true;
      if (!c.state.startedOn) c.state.startedOn = today();
      c.state.seenSummary = null;
      c.save();
      c.replace('home');
      c.peek('Dodawaj każdy paragon, a ja policzę resztę!', 'happy');
    },
  },
};
