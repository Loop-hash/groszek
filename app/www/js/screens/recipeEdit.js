// Własny przepis: nazwa, ikonka, składniki i kroki jako tekst, kalorie i koszt opcjonalnie.
import { DISH, dish } from '../pixels.js';
import { esc, topbar, chip } from '../ui.js';
import { uid, DEFAULT_CUISINES } from '../store.js';
import { MEALS } from '../recipes.js';

function draft(c) {
  const p = c.params;
  if (p.d) return p.d;
  const ex = p.id ? (c.state.customRecipes || []).find((r) => r.id === p.id) : null;
  p.d = ex ? JSON.parse(JSON.stringify(ex)) : {
    id: 'my-' + uid(), custom: true, name: '', country: 'Polska', icon: { dish: 'pot' }, portions: 2, time: 30,
    meal: ['obiad'], ingsText: [], steps: [], kcal: '', protein: '', fat: '', carbs: '', fiber: '', salt: '', costManual: '',
  };
  return p.d;
}

const num = (id, label, val, unit) => `<label class="row between"><span>${label}</span><span class="numrow"><input id="${id}" class="field small num" type="number" inputmode="decimal" value="${esc(val)}" data-in="f" data-arg="${id.slice(3)}" style="width:96px"><span class="small muted" style="width:30px">${unit}</span></span></label>`;

export default {
  render(c) {
    const d = draft(c);
    return `
      ${topbar(c.params.id ? 'Edytuj przepis' : 'Mój przepis')}
      <label class="stack" style="gap:6px"><span class="label">Nazwa</span><input id="re-name" class="field" value="${esc(d.name)}" data-in="f" data-arg="name" placeholder="np. Zapiekanka babci"></label>
      <span class="label">Ikonka</span>
      <div class="icon-grid">${Object.keys(DISH).map((k) => `<button class="${d.icon.dish === k ? 'on' : ''}" data-act="ico" data-arg="${k}" aria-label="${k}">${dish(k, 30, '')}</button>`).join('')}</div>
      <span class="label">Posiłek</span>
      <div class="wrap">${Object.entries(MEALS).map(([k, v]) => chip('meal', v, d.meal.includes(k), k)).join('')}</div>
      <span class="label">Kuchnia</span>
      <select id="re-country" class="field" data-ch="country">${DEFAULT_CUISINES.map((k) => `<option ${d.country === k ? 'selected' : ''}>${k}</option>`).join('')}</select>
      <div class="card stack">
        ${num('re-portions', 'Porcje', d.portions, 'szt.')}
        ${num('re-time', 'Czas', d.time, 'min')}
        ${num('re-costManual', 'Koszt porcji', d.costManual, 'zł')}
      </div>
      <details class="more" ${d.kcal ? 'open' : ''}><summary>Wartości na porcję (opcjonalnie)<span>+</span></summary><div class="stack">
        ${num('re-kcal', 'Kalorie', d.kcal, 'kcal')}${num('re-protein', 'Białko', d.protein, 'g')}${num('re-fat', 'Tłuszcz', d.fat, 'g')}
        ${num('re-carbs', 'Węglowodany', d.carbs, 'g')}${num('re-fiber', 'Błonnik', d.fiber, 'g')}${num('re-salt', 'Sól', d.salt, 'g')}
      </div></details>
      <label class="stack" style="gap:6px"><span class="label">Składniki (każdy w nowej linii)</span><textarea id="re-ings" class="field" data-in="lines" data-arg="ingsText" rows="6" placeholder="makaron 250 g&#10;pomidory z puszki">${esc(d.ingsText.join('\n'))}</textarea></label>
      <label class="stack" style="gap:6px"><span class="label">Kroki (każdy w nowej linii)</span><textarea id="re-steps" class="field" data-in="lines" data-arg="steps" rows="6" placeholder="Ugotuj makaron.&#10;Zrób sos.">${esc(d.steps.join('\n'))}</textarea></label>
      <button class="cta" data-act="save"><span>Zapisz przepis</span></button>
    `;
  },
  inputs: {
    f(c, v, el) { const d = draft(c); const k = el.dataset.arg; d[k] = k === 'name' ? v : (v === '' ? '' : Number(String(v).replace(',', '.'))); },
    lines(c, v, el) { draft(c)[el.dataset.arg] = v.split('\n').map((x) => x.trim()).filter(Boolean); },
  },
  changes: {
    country(c, v) { draft(c).country = v; },
  },
  actions: {
    ico(c, k) { draft(c).icon = { dish: k }; c.render(); },
    meal(c, k) {
      const d = draft(c);
      d.meal = d.meal.includes(k) ? d.meal.filter((x) => x !== k) : d.meal.concat(k);
      if (!d.meal.length) d.meal = [k];
      c.render();
    },
    save(c) {
      const d = draft(c);
      if (!String(d.name).trim()) { c.toast('Wpisz nazwę'); return; }
      d.name = String(d.name).trim();
      d.portions = Math.max(1, Number(d.portions) || 1);
      d.nutrition = { kcal: Number(d.kcal) || 0, protein: Number(d.protein) || 0, fat: Number(d.fat) || 0, carbs: Number(d.carbs) || 0, fiber: Number(d.fiber) || 0, salt: Number(d.salt) || 0 };
      if (!d.nutrition.kcal) delete d.nutrition;
      const list = c.state.customRecipes || (c.state.customRecipes = []);
      const i = list.findIndex((r) => r.id === d.id);
      if (i >= 0) list[i] = d; else list.push(d);
      c.save();
      c.replace('recipe', { id: d.id });
      c.toast('Zapisano przepis');
    },
  },
};
