// Lista przepisów: szukajka, kraje, rodzaj posiłku, sortowanie po cenie.
import { fmt } from '../budget.js';
import { ui, recipeIcon } from '../pixels.js';
import { esc, topbar, chip, search, empty, plural } from '../ui.js';
import { allRecipes, blockReason, recipeCost, nutrition } from '../recipes.js';
import { DEFAULT_CUISINES } from '../store.js';
import { norm } from '../dict.js';

export default {
  render(c) {
    const p = c.params;
    const st = c.state;
    const s = st.settings;
    const all = allRecipes(c);
    const visible = all.filter((r) => !blockReason(r, s, st.ratings));
    const hidden = all.length - visible.length;
    const q = norm(p.q || '');
    const meal = p.meal || 'all';
    const country = p.country || 'all';
    const sort = p.sort || 'cheap';

    let list = visible.filter((r) => {
      if (meal === 'obiad' && !(r.meal || []).includes('obiad')) return false;
      if (meal === 'lekkie' && !(r.meal || []).some((m) => m === 'sniadanie' || m === 'kolacja')) return false;
      if (country === 'moje' && !r.custom) return false;
      if (country !== 'all' && country !== 'moje' && r.country !== country) return false;
      if (q && !q.split(' ').every((w) => norm(r.name + ' ' + r.country).includes(w))) return false;
      return true;
    });
    const costs = new Map(list.map((r) => [r.id, recipeCost(c, r)]));
    if (sort === 'cheap') list.sort((a, b) => costs.get(a.id).perPortion - costs.get(b.id).perPortion);
    else if (sort === 'fast') list.sort((a, b) => (a.time || 99) - (b.time || 99));
    else list.sort((a, b) => a.name.localeCompare(b.name, 'pl'));

    const counts = {};
    for (const r of visible) counts[r.country] = (counts[r.country] || 0) + 1;
    const countryChips = [chip('country', 'Wszystkie', country === 'all', 'all')];
    if ((st.customRecipes || []).length) countryChips.push(chip('country', `Moje ${st.customRecipes.length}`, country === 'moje', 'moje'));
    for (const k of DEFAULT_CUISINES.concat(['Podstawy'])) if (counts[k]) countryChips.push(chip('country', `${k} ${counts[k]}`, country === k, k));

    const cards = list.map((r) => {
      const cost = costs.get(r.id);
      const n = nutrition(r);
      const liked = st.ratings[r.id] === 1;
      return `<button class="recipe-card" data-act="open" data-arg="${esc(r.id)}">` +
        `<div class="row between" style="align-items:flex-start">${recipeIcon(r.icon, 48)}${cost.perPortion ? `<span class="price" style="height:26px;font-size:14px">${fmt(cost.perPortion)} zł</span>` : ''}</div>` +
        `<span class="nm">${esc(r.name)}</span>` +
        `<span class="tiny muted">${esc(r.custom ? 'mój przepis' : r.country)}${r.time ? ` · ${r.time} min` : ''}${n.kcal ? ` · ${Math.round(n.kcal)} kcal` : ''}</span>` +
        `${cost.promo.length || liked ? `<span class="row" style="gap:4px;flex-wrap:wrap">${cost.promo.length ? `<span class="pill">${ui('tag', 12)} ${cost.promo.length} w promocji</span>` : ''}${liked ? `<span class="pill dark">${ui('thumbUp', 11)}</span>` : ''}</span>` : ''}` +
        '</button>';
    }).join('');

    return `
      ${topbar('Przepisy', `${visible.length} ${plural(visible.length, 'danie', 'dania', 'dań')}`, { right: `<button class="sq" data-act="new" aria-label="Dodaj swój przepis">${ui('plus', 20)}</button>` })}
      ${search('rec-q', p.q || '', 'Szukaj, np. curry', 'q')}
      <div class="seg"><button class="${meal === 'all' ? 'on' : ''}" data-act="meal" data-arg="all">Wszystko</button><button class="${meal === 'obiad' ? 'on' : ''}" data-act="meal" data-arg="obiad">Obiady</button><button class="${meal === 'lekkie' ? 'on' : ''}" data-act="meal" data-arg="lekkie">Śniad. i kolacje</button></div>
      <div class="scroller">${countryChips.join('')}</div>
      <div class="row between small"><span class="muted">Sortuj:</span><span class="row" style="gap:6px">${chip('sort', 'Najtańsze', sort === 'cheap', 'cheap')}${chip('sort', 'Najszybsze', sort === 'fast', 'fast')}${chip('sort', 'A–Z', sort === 'az', 'az')}</span></div>
      ${list.length ? `<div class="grid2">${cards}</div>` : empty(all.length ? 'Nic tu nie pasuje.' : 'Przepisy jeszcze się nie pobrały.<br>Połącz się z internetem.')}
      ${hidden ? `<button class="btn small block" data-act="settings">${hidden} ${plural(hidden, 'przepis ukryty', 'przepisy ukryte', 'przepisów ukrytych')} przez ustawienia</button>` : ''}
      <div class="tiny muted center">Cena porcji liczona z cen w sklepach i aktualnych promocji. Kalorie i składniki odżywcze na porcję.</div>
    `;
  },
  actions: {
    open(c, id) { c.go('recipe', { id }); },
    meal(c, m) { c.params.meal = m; c.render(); },
    country(c, k) { c.params.country = k; c.render(); },
    sort(c, k) { c.params.sort = k; c.render(); },
    new(c) { c.go('recipeEdit', {}, { quiet: true }); },
    settings(c) { c.go('settings'); },
  },
  inputs: {
    q(c, v) { c.params.q = v; c.render(); },
  },
  peek(c) {
    const vis = allRecipes(c).filter((r) => !blockReason(r, c.state.settings, c.state.ratings) && (r.meal || []).includes('obiad'));
    if (!vis.length) return null;
    const cheapest = vis.map((r) => [r, recipeCost(c, r).perPortion]).sort((a, b) => a[1] - b[1])[0];
    return { text: `Najtaniej dziś: ${cheapest[0].name}, ${fmt(cheapest[1])} zł za porcję.`, mood: 'happy' };
  },
};
