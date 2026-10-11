// Jeden przepis: koszt porcji, wartości odżywcze, składniki z dopisywaniem do listy, kroki, ocena i plan.
import { fmt, today, addDays, dowShort, dayLabel } from '../budget.js';
import { ui, food, recipeIcon, sprite } from '../pixels.js';
import { esc, topbar, check, chip, plural } from '../ui.js';
import { findRecipe, recipeCost, nutrition, ing, qty, priceOf, searchUrl, blockReason, MEALS } from '../recipes.js';
import { STORES } from '../offers.js';
import { addToList } from '../listlogic.js';
import { norm } from '../dict.js';

function missingSheet(c, r) {
  const rows = r.custom
    ? (r.ingsText || []).map((t, i) => ({ key: 't' + i, name: t, pantry: false }))
    : (r.ings || []).map((x) => { const i = ing(c, x.i); return { key: x.i, name: i ? i.name : x.i, pantry: i && i.pantry, ico: i && i.icon }; });
  const onList = new Set(c.state.list.filter((x) => !x.done).map((x) => norm(x.name)));
  const sel = {};
  for (const row of rows) sel[row.key] = !row.pantry && !onList.has(norm(row.name));
  const cfg = {
    render() {
      const n = Object.values(sel).filter(Boolean).length;
      return '<h3>Czego ci brakuje?</h3><p style="text-align:left">Zaznaczone dopiszę do listy zakupów. Przyprawy i olej są odznaczone, bo zwykle są w szafce.</p>' +
        `<div class="rows">${rows.map((row) => `<div class="item">${check('tog', sel[row.key], row.name, row.key)}${row.ico ? food(row.ico, 26) : ''}<span class="grow name" style="font-size:15px">${esc(row.name)}</span>${onList.has(norm(row.name)) ? '<span class="pill">na liście</span>' : ''}</div>`).join('')}</div>` +
        `<button class="btn dark block" data-act="add" ${n ? '' : 'disabled'}>Dopisz ${n} ${plural(n, 'rzecz', 'rzeczy', 'rzeczy')}</button>`;
    },
    actions: {
      tog(cc, k) { sel[k] = !sel[k]; cc.renderSheet(); },
      add(cc) {
        let added = 0;
        for (const row of rows) if (sel[row.key] && addToList(cc, row.name, { note: 'do: ' + r.name }, { quiet: true })) added++;
        if (cc.app.sheetCfg !== cfg) { cc.render(); return; } // tryb ostry pokazał swój arkusz
        cc.closeSheet(true);
        cc.toast(added ? `Dopisano ${added} ${plural(added, 'rzecz', 'rzeczy', 'rzeczy')} do listy` : 'Wszystko już było na liście');
        cc.render();
      },
    },
  };
  c.sheet(cfg);
}

function planSheet(c, r) {
  const meals = (r.meal && r.meal.length ? r.meal : ['obiad']);
  const st = { day: today(), slot: meals[0], twice: (r.portions || 1) >= 2 && meals.includes('obiad') };
  c.sheet({
    render() {
      const days = [];
      for (let i = 0; i < 14; i++) {
        const d = addDays(today(), i);
        days.push(`<button class="chip ${st.day === d ? 'on' : ''}" data-act="day" data-arg="${d}" style="flex-direction:column;height:auto;padding:6px 12px;gap:0"><b class="tiny">${i === 0 ? 'DZIŚ' : dowShort(d)}</b><span class="pixel">${Number(d.slice(8))}</span></button>`);
      }
      return `<h3>Zaplanuj: ${esc(r.name)}</h3>` +
        `<span class="label">Dzień</span><div class="scroller">${days.join('')}</div>` +
        `<span class="label">Posiłek</span><div class="seg">${Object.entries(MEALS).map(([k, v]) => `<button class="${st.slot === k ? 'on' : ''}" data-act="slot" data-arg="${k}">${v}</button>`).join('')}</div>` +
        (r.portions >= 2 ? `<div class="item row between" style="padding:6px 0"><span><b>Też na następny dzień</b><br><span class="small muted">gotujesz raz, jesz dwa razy</span></span>${check('twice', st.twice, 'Też na następny dzień')}</div>` : '') +
        '<button class="btn dark block" data-act="ok">Dodaj do planu</button>';
    },
    actions: {
      day(cc, d) { st.day = d; cc.renderSheet(); },
      slot(cc, s) { st.slot = s; cc.renderSheet(); },
      twice(cc) { st.twice = !st.twice; cc.renderSheet(); },
      ok(cc) {
        const plan = cc.state.plan;
        const add = (d) => { (plan[d] = plan[d] || []).push({ id: r.id, slot: st.slot }); };
        add(st.day);
        if (st.twice) add(addDays(st.day, 1));
        cc.save();
        cc.closeSheet(true);
        cc.toast(`Zaplanowano na ${dayLabel(st.day)}${st.twice ? ' i dzień później' : ''}`);
      },
    },
  });
}

export default {
  render(c) {
    const r = findRecipe(c, c.params.id);
    if (!r) return `${topbar('Przepis')}<div class="empty-state">Nie ma takiego przepisu.</div>`;
    const cost = recipeCost(c, r);
    const n = nutrition(r);
    const rating = c.state.ratings[r.id] || 0;
    const why = blockReason(r, c.state.settings, {});

    const ingRows = r.custom
      ? (r.ingsText || []).map((t) => `<div class="ing"><span class="grow">${esc(t)}</span></div>`).join('')
      : (r.ings || []).map((x) => {
        const i = ing(c, x.i);
        const p = priceOf(c, x.i);
        return `<div class="ing">${food(i ? i.icon : 'bag', 26)}<span class="grow stack" style="gap:1px"><span class="bold">${esc(i ? i.name : x.i)}</span><span class="tiny muted">${esc(qty(c, x))}${i && i.pantry ? ' · zwykle w szafce' : ''}</span></span>` +
          `${p.offer ? `<span class="pill dark">${ui('tag', 10)} ${esc(STORES[p.offer.store])}</span>` : ''}</div>`;
      }).join('');

    const promoNote = cost.promo.length
      ? `<span class="small">${cost.promo.length} ${plural(cost.promo.length, 'składnik', 'składniki', 'składników')} w promocji${cost.saved > 0 ? `, oszczędzasz ${fmt(cost.saved)} zł na porcji` : ''}.</span>` : '';

    return `
      ${topbar(r.custom ? 'Mój przepis' : r.country, [r.time ? `${r.time} min` : '', r.portions ? `${r.portions} ${plural(r.portions, 'porcja', 'porcje', 'porcji')}` : ''].filter(Boolean).join(' · '),
        r.custom ? { right: `<button class="sq" data-act="edit" aria-label="Edytuj">${ui('edit', 20)}</button>` } : {})}
      <div class="hero" style="height:130px">${recipeIcon(r.icon, 120)}</div>
      <h1 class="hello" style="font-size:26px">${esc(r.name)}</h1>
      <div class="wrap" style="justify-content:center">${(r.meal || []).map((m) => `<span class="pill">${MEALS[m] || m}</span>`).join('')}${r.veg ? '<span class="pill">bez mięsa</span>' : ''}${rating === 1 ? `<span class="pill dark">${ui('thumbUp', 11)} smakuje ci</span>` : ''}${rating === -1 ? '<span class="pill dashed">nie smakowało</span>' : ''}</div>
      ${why ? `<div class="card dashed small">Ten przepis jest ukryty w podpowiedziach: ${esc(why)}.</div>` : ''}
      ${cost.perPortion ? `<div class="card stack" style="gap:4px"><div class="row between"><span>Porcja kosztuje około</span><span class="big" style="font-size:26px">${fmt(cost.perPortion)} zł</span></div>${promoNote}<span class="tiny muted">Liczone za zużyte gramy. Pierwsze zakupy wyjdą drożej, bo kupujesz całe opakowania.</span></div>` : ''}
      ${n.kcal ? `<div class="macros"><div><b>${Math.round(n.kcal)}</b><span>kcal</span></div><div><b>${Math.round(n.protein)}</b><span>białko g</span></div><div><b>${Math.round(n.fat)}</b><span>tłuszcz g</span></div><div><b>${Math.round(n.carbs)}</b><span>węgl. g</span></div><div><b>${Math.round(n.fiber)}</b><span>błonnik g</span></div></div>
      <div class="tiny muted center">na porcję · sól ${String(n.salt).replace('.', ',')} g</div>` : ''}
      <div class="row between"><span class="label">Składniki</span><button class="btn small" data-act="missing">${ui('basket', 16)} Dopisz brakujące</button></div>
      <div class="card" style="padding:4px 14px">${ingRows || '<div class="ing muted">Brak składników.</div>'}</div>
      <span class="label">Jak zrobić</span>
      <ol class="steps">${(r.steps || []).map((s) => `<li><span>${esc(s)}</span></li>`).join('')}</ol>
      ${r.tip ? `<div class="card dark row" style="align-items:flex-start">${sprite('happy', 40)}<span class="small grow">${esc(r.tip)}</span></div>` : ''}
      <button class="cta" data-act="plan">${ui('cal', 18)}<span>Zaplanuj</span>${ui('arrow', 18, 'flip')}</button>
      <div class="card stack">
        <b>Jak smakowało?</b>
        <div class="row"><button class="btn grow ${rating === 1 ? 'dark' : ''}" data-act="rate" data-arg="1">${ui('thumbUp', 16)} Dobre</button><button class="btn grow ${rating === -1 ? 'dark' : ''}" data-act="rate" data-arg="-1">${ui('thumbDown', 16)} Nie dla mnie</button></div>
        <span class="tiny muted">Tych, które ci nie smakują, nie będę podsuwać w planie.</span>
      </div>
      <button class="btn block" data-act="ania">${ui('web', 16)} Szukaj u Ani Gotuje</button>
      ${r.custom ? '<button class="btn small block" data-act="del">Usuń mój przepis</button>' : '<div class="tiny muted center">Przepis napisany dla Groszka. Wartości odżywcze: USDA FoodData Central.</div>'}
    `;
  },
  actions: {
    missing(c) { const r = findRecipe(c, c.params.id); if (r) missingSheet(c, r); },
    plan(c) { const r = findRecipe(c, c.params.id); if (r) planSheet(c, r); },
    rate(c, v) {
      const id = c.params.id;
      const val = Number(v);
      if (c.state.ratings[id] === val) delete c.state.ratings[id];
      else c.state.ratings[id] = val;
      c.save();
      c.render();
      if (c.state.ratings[id] === -1) c.peek('Dobra, nie będę go podsuwać.', 'worried');
      else if (c.state.ratings[id] === 1) c.peek('Super! Będę go częściej proponować.', 'happy');
    },
    ania(c) { const r = findRecipe(c, c.params.id); if (r) c.openUrl(searchUrl(r.name)); },
    edit(c) { c.go('recipeEdit', { id: c.params.id }, { quiet: true }); },
    del(c) {
      const id = c.params.id;
      c.sheet({
        mascot: 'worried',
        render: () => '<h2>Usunąć ten przepis?</h2><div class="row"><button class="btn grow" data-act="sheet-close">Zostaw</button><button class="btn dark grow" data-act="yes">Usuń</button></div>',
        actions: {
          yes(cc) {
            cc.state.customRecipes = cc.state.customRecipes.filter((r) => r.id !== id);
            cc.save();
            cc.closeSheet(true);
            cc.back();
          },
        },
      });
    },
  },
  peek(c) {
    const r = findRecipe(c, c.params.id);
    if (!r) return null;
    const cost = recipeCost(c, r);
    if (cost.promo.length) return { text: `${cost.promo.length} ${plural(cost.promo.length, 'składnik jest', 'składniki są', 'składników jest')} teraz w promocji!`, mood: 'happy' };
    return r.tip ? null : 'Smacznego!';
  },
};
