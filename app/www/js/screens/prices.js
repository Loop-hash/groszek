// Twoje ceny: ile płacisz za produkty w poszczególnych sklepach. Baza rośnie z każdym zapisanym paragonem.
import { fmt, shortDate } from '../budget.js';
import { food, ui } from '../pixels.js';
import { esc, topbar, empty, search } from '../ui.js';
import { classify, norm } from '../dict.js';
import { productKey } from '../prices.js';

function groups(st) {
  const g = new Map();
  for (const [store, shop] of Object.entries(st.prices || {})) {
    for (const p of Object.values(shop)) {
      const key = p.canon ? 'c:' + p.canon : 'p:' + productKey(p.name);
      if (!g.has(key)) g.set(key, { title: p.canon ? p.canon.charAt(0).toUpperCase() + p.canon.slice(1) : p.name, entries: [], last: '' });
      const x = g.get(key);
      x.entries.push({ store, ...p });
      if (p.date > x.last) x.last = p.date;
    }
  }
  return [...g.values()].sort((a, b) => (a.last < b.last ? 1 : a.last > b.last ? -1 : a.title.localeCompare(b.title, 'pl')));
}

function card(gr) {
  const ico = classify(gr.title).ico !== 'bag' ? classify(gr.title).ico : classify(gr.entries[0].name).ico;
  const es = [...gr.entries].sort((a, b) => a.paid - b.paid);
  // najtaniej tylko między sklepami i w tej samej jednostce
  const stores = new Set(es.map((e) => e.store));
  const cheap = stores.size > 1 ? es[0] : null;
  const rows = es.map((e) => `<div class="bitem"><span class="grow stack" style="gap:0;min-width:0"><span class="bname">${esc(e.store)}</span>` +
    `<span class="tiny muted">${esc([e.name, shortDate(e.date), e.promo ? 'w promocji' : ''].filter(Boolean).join(' · '))}</span></span>` +
    `${cheap && e === cheap && cheap.unit === es[es.length - 1].unit ? '<span class="btag">najtaniej</span>' : ''}` +
    `<span class="bprice pixel">${fmt(e.paid)} zł${e.unit === 'kg' ? '/kg' : ''}</span></div>`).join('');
  return `<div class="card buy"><div class="buy-head">${food(ico, 28)}<b class="grow">${esc(gr.title)}</b></div><div class="bitems">${rows}</div></div>`;
}

export default {
  render(c) {
    const st = c.state;
    const q = norm(c.params.q || '');
    const all = groups(st);
    const shown = q ? all.filter((g) => norm(g.title + ' ' + g.entries.map((e) => e.name + ' ' + e.store).join(' ')).includes(q)) : all;
    return `
      ${topbar('Twoje ceny', all.length ? `${all.length} produktów z paragonów` : '')}
      <div class="small muted">Ceny z Twoich paragonów, po rabatach. Każdy nowy paragon je aktualizuje, a lista zakupów liczy z nich koszt.</div>
      ${all.length > 6 ? search('price-q', c.params.q || '', 'Szukaj, np. mleko', 'q') : ''}
      ${shown.length ? `<div class="stack" style="gap:10px">${shown.map(card).join('')}</div>` : empty(all.length ? 'Nic takiego jeszcze nie kupowałeś.' : 'Zrób zdjęcie paragonu przy dodawaniu wydatku, a ceny pojawią się tutaj.')}
      ${all.length ? `<button class="btn small" data-act="clear">${ui('trash', 14)} Wyczyść ceny</button>` : ''}
    `;
  },
  inputs: {
    q(c, v) { c.params.q = v; c.render(); },
  },
  actions: {
    clear(c) {
      c.sheet({
        mascot: 'worried',
        render: () => '<h2>Wyczyścić wszystkie ceny?</h2><p>Wydatki i historia zostaną. Znikną tylko zapamiętane ceny produktów.</p>' +
          '<div class="row"><button class="btn grow" data-act="sheet-close">Zostaw</button><button class="btn dark grow" data-act="yes">Wyczyść</button></div>',
        actions: {
          yes(cc) { cc.state.prices = {}; cc.save(); cc.closeSheet(true); cc.render(); cc.toast('Wyczyszczono ceny'); },
        },
      });
    },
  },
  peek(c) {
    const n = Object.values(c.state.prices || {}).reduce((a, s) => a + Object.keys(s).length, 0);
    return n ? `Znam ${n} cen z Twoich paragonów.` : 'Ceny zbieram z paragonów.';
  },
};
