// Promocje z gazetek: filtry po sklepie i grupie, szukajka, dopisywanie do listy jednym dotknięciem.
import { fmt, shortDate } from '../budget.js';
import { ui, food } from '../pixels.js';
import { esc, topbar, chip, search, empty, plural } from '../ui.js';
import { offersFor, meta, STORES, GROUPS, whenLabel, discountLabel, isActive, isUpcoming, saving } from '../offers.js';
import { addToList } from '../listlogic.js';
import { norm } from '../dict.js';

function updatedLabel(data) {
  const u = data.promos && data.promos.updated;
  if (!u) return 'brak danych';
  const d = new Date(u);
  if (Number.isNaN(d.getTime())) return '';
  return `aktualizacja ${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}, ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function filtered(c) {
  const p = c.params;
  const all = offersFor(c.data, c.state.settings);
  const q = norm(p.q || '');
  const when = p.when || 'now';
  return all.filter((o) => {
    if (when === 'now' && !isActive(o)) return false;
    if (when === 'soon' && !isUpcoming(o)) return false;
    if (p.store && p.store !== 'all' && o.store !== p.store) return false;
    const m = meta(o);
    if (!q && p.group && p.group !== 'all' && m.group !== p.group) return false;
    if (q && !q.split(' ').every((w) => m.text.includes(w))) return false;
    return true;
  });
}

function pct(o) {
  return o.oldPrice ? saving(o) / o.oldPrice : 0;
}

export default {
  render(c) {
    const p = c.params;
    const st = c.state;
    const promos = c.data.promos || { offers: [], stores: {} };
    const base = offersFor(c.data, st.settings);
    const nowCount = base.filter((o) => isActive(o)).length;
    const soonCount = base.filter((o) => isUpcoming(o)).length;
    if (!p.when) p.when = nowCount || !soonCount ? 'now' : 'soon';
    const list = filtered(c).sort((a, b) => pct(b) - pct(a) || a.price - b.price);
    const limit = p.limit || 60;
    const onList = new Set(st.list.filter((i) => !i.done).map((i) => i.offerId).filter(Boolean));

    const storeChips = [chip('store', 'Wszystkie', !p.store || p.store === 'all', 'all')];
    for (const id of ['kaufland', 'lidl', 'aldi']) {
      if (st.settings.stores[id] === false) continue;
      storeChips.push(chip('store', STORES[id], p.store === id, id));
    }
    storeChips.push(`<button class="chip soon" data-act="biedronka">Biedronka · wkrótce</button>`);

    const groupCounts = {};
    for (const o of base) if ((p.when === 'now' ? isActive(o) : isUpcoming(o)) && (!p.store || p.store === 'all' || o.store === p.store)) groupCounts[meta(o).group] = (groupCounts[meta(o).group] || 0) + 1;
    const groupChips = [chip('group', 'Wszystko', !p.group || p.group === 'all', 'all')]
      .concat(GROUPS.filter((g) => groupCounts[g.id]).map((g) => chip('group', `${g.label} ${groupCounts[g.id]}`, p.group === g.id, g.id)));

    const stale = Object.entries(promos.stores || {}).filter(([k, v]) => v && v.stale && k !== 'biedronka').map(([k]) => STORES[k]);

    const rows = list.slice(0, limit).map((o) => {
      const m = meta(o);
      const dl = discountLabel(o);
      const added = onList.has(o.id);
      const sub1 = [m.brand, o.detail].filter(Boolean).join(' · ');
      const sub2 = [STORES[o.store], whenLabel(o), o.cond].filter(Boolean).join(' · ');
      return `<div class="item"><button class="item-main" data-act="add" data-arg="${esc(o.id)}" aria-label="Dopisz ${esc(m.name)} do listy">` +
        `${food(m.ico, 30)}<span class="grow stack"><span class="name">${esc(m.name)}</span>${sub1 ? `<span class="sub">${esc(sub1)}</span>` : ''}<span class="sub">${esc(sub2)}</span></span></button>` +
        `<span class="offer-price"><span class="price">${fmt(o.price)} zł</span>${o.oldPrice ? `<span class="old">${fmt(o.oldPrice)} zł</span>` : ''}` +
        `${dl ? `<span class="pill ${added ? 'dark' : ''}">${added ? ui('check', 10) : ''}${esc(dl)}</span>` : (added ? `<span class="pill dark">${ui('check', 10)} na liście</span>` : '')}</span></div>`;
    }).join('');

    return `
      ${topbar('Promocje', updatedLabel(c.data), { right: `<button class="sq" data-act="refresh" aria-label="Odśwież promocje">${ui('refresh', 22)}</button>` })}
      ${search('promo-q', p.q || '', 'Szukaj, np. masło', 'q')}
      <div class="seg"><button class="${p.when === 'now' ? 'on' : ''}" data-act="when" data-arg="now">Teraz · ${nowCount}</button><button class="${p.when === 'soon' ? 'on' : ''}" data-act="when" data-arg="soon">Wkrótce · ${soonCount}</button></div>
      <div class="scroller">${storeChips.join('')}</div>
      <div class="scroller">${groupChips.join('')}</div>
      ${stale.length ? `<div class="card dashed small">Nie udało się pobrać świeżych promocji: ${esc(stale.join(', '))}. Pokazuję ostatnie znane.</div>` : ''}
      <div class="small muted">${list.length} ${plural(list.length, 'oferta', 'oferty', 'ofert')} · dotknij, żeby dopisać do listy</div>
      ${list.length ? `<div class="rows">${rows}</div>` : empty(base.length ? 'Nic tu nie pasuje. Zmień filtry.' : 'Nie mam jeszcze promocji.<br>Połącz się z internetem i odśwież.')}
      ${list.length > limit ? `<button class="btn block" data-act="more">Pokaż więcej (${list.length - limit})</button>` : ''}
      <div class="tiny muted center">Ceny z gazetek i stron sklepów. Zawsze sprawdź cenę na półce.</div>
    `;
  },

  actions: {
    store(c, id) { c.params.store = id; c.params.limit = 60; c.render(); },
    group(c, id) { c.params.group = id; c.params.limit = 60; c.render(); },
    when(c, w) { c.params.when = w; c.params.group = 'all'; c.render(); },
    more(c) { c.params.limit = (c.params.limit || 60) + 60; c.render(); },
    biedronka(c) { c.toast('Biedronka daje promocje tylko jako obrazki. Pracuję nad tym.'); },
    async refresh(c) {
      c.toast('Sprawdzam nowe promocje…');
      const r = await c.refreshData(true);
      c.toast(r.promos ? 'Promocje są aktualne' : 'Brak internetu, pokazuję zapisane');
      c.render();
    },
    add(c, id) {
      const o = offersFor(c.data, c.state.settings).find((x) => x.id === id);
      if (!o) return;
      const name = meta(o).name;
      const existing = c.state.list.find((i) => !i.done && i.offerId === o.id);
      if (existing) { c.toast('To już jest na liście'); return; }
      const ok = addToList(c, name, { offerId: o.id, offer: { ...o } });
      if (ok) { c.toast('Dopisano do listy: ' + name); c.render(); }
    },
  },
  inputs: {
    q(c, v) { c.params.q = v; c.params.limit = 60; c.render(); },
  },

};
