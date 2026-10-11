// Lista zakupów: ikonki, promocje do każdej rzeczy, odhaczanie, tryb ostry i oszczędności (exp).
import { fmt, today, r2 } from '../budget.js';
import { ui, food, sprite, FOOD } from '../pixels.js';
import { esc, topbar, check, empty, plural } from '../ui.js';
import { listMatches, offerForItem, STORES, whenLabel, saving, isActive, tidy } from '../offers.js';
import { addToList } from '../listlogic.js';
import { norm } from '../dict.js';
import { uid } from '../store.js';

const IN_STORE = { kaufland: 'w Kauflandzie', lidl: 'w Lidlu', aldi: 'w Aldi', biedronka: 'w Biedronce' };
const CAT_NAME = {
  'nabiał': 'nabiał', 'pieczywo': 'pieczywo', 'mięso': 'mięso', 'wędliny': 'wędliny', 'warzywa': 'warzywa', 'owoce': 'owoce',
  'makarony i kasze': 'makarony i kasze', 'śniadania': 'na śniadanie', 'do pieczenia': 'do pieczenia', 'przyprawy': 'przyprawy',
  'strączki': 'strączki', 'tłuszcze': 'tłuszcze', 'napoje': 'napoje', 'ryby': 'ryby', 'inne': 'inne', 'podstawy': 'podstawa', 'zachcianka': 'zachcianka',
};

function itemRow(c, i, matches) {
  const o = offerForItem(i, matches);
  let sub = CAT_NAME[i.cat] || i.cat || '';
  if (i.note) sub = i.note + (sub ? ' · ' + sub : '');
  let price = '';
  if (o) {
    sub = [STORES[o.store] || o.store, whenLabel(o), o.cond].filter(Boolean).join(' · ');
    price = `<span class="offer-price"><span class="price">${fmt(o.price)} zł</span>${o.oldPrice ? `<span class="old">${fmt(o.oldPrice)} zł</span>` : ''}</span>`;
  }
  return `<div class="item ${i.done ? 'done' : ''}">${check('tick', i.done, (i.done ? 'Odznacz ' : 'Odhacz ') + i.name, i.id)}` +
    `<button class="item-main" data-act="open" data-arg="${esc(i.id)}">${food(i.ico, 30)}<span class="grow stack"><span class="name">${esc(i.name)}</span>` +
    `<span class="sub">${esc(sub)}</span></span></button>${i.done ? '' : price}</div>`;
}

function itemSheet(c, id) {
  c.sheet({
    render(cc) {
      const i = cc.state.list.find((x) => x.id === id);
      if (!i) return '<p>Tej rzeczy już nie ma na liście.</p><button class="btn block" data-act="sheet-close">Zamknij</button>';
      const matches = listMatches(cc.state, cc.data).get(i.id) || [];
      const chosen = offerForItem(i, matches);
      const offers = matches.slice(0, 8).map((o) => {
        const on = chosen && chosen.id === o.id;
        return `<button class="item-main card ${on ? 'dark' : ''}" data-act="pick" data-arg="${esc(o.id)}" style="padding:10px 12px">` +
          `<span class="grow stack"><b>${esc(tidy(o.name))}</b><span class="sub" style="${on ? 'color:inherit;opacity:.8' : ''}">${esc([STORES[o.store], whenLabel(o), o.detail, o.cond].filter(Boolean).join(' · '))}</span></span>` +
          `<span class="offer-price"><b class="pixel" style="font-size:18px">${fmt(o.price)} zł</b>${o.oldPrice ? `<span class="old" style="${on ? 'color:inherit;opacity:.7' : ''}">${fmt(o.oldPrice)} zł</span>` : ''}</span></button>`;
      }).join('');
      const icons = Object.keys(FOOD).map((k) => `<button class="${k === i.ico ? 'on' : ''}" data-act="ico" data-arg="${k}" aria-label="Ikonka ${k}">${food(k, 26, '')}</button>`).join('');
      return `<div class="row">${food(i.ico, 44)}<h3 class="grow">${esc(i.name)}</h3></div>` +
        (matches.length
          ? `<span class="label">W promocji ${matches.length > 8 ? '(najtańsze 8)' : ''}</span><div class="stack">${offers}</div>`
          : '<p style="text-align:left">Teraz nie ma tego w promocjach w twoich sklepach.</p>') +
        `<details class="more"><summary>Zmień ikonkę <span>${ui('edit', 16)}</span></summary><div class="stack"><div class="icon-grid">${icons}</div></div></details>` +
        '<div class="row"><button class="btn grow" data-act="remove">Usuń z listy</button><button class="btn dark grow" data-act="sheet-close">Gotowe</button></div>';
    },
    actions: {
      pick(cc, oid) {
        const i = cc.state.list.find((x) => x.id === id);
        const o = (listMatches(cc.state, cc.data).get(id) || []).find((x) => x.id === oid);
        if (!i || !o) return;
        i.offerId = o.id;
        i.offer = { ...o };
        cc.save();
        cc.renderSheet();
        cc.render();
      },
      ico(cc, k) {
        const i = cc.state.list.find((x) => x.id === id);
        if (!i) return;
        i.ico = k;
        cc.state.icons[norm(i.name)] = k;
        cc.save();
        cc.renderSheet();
        cc.render();
      },
      remove(cc) {
        cc.state.list = cc.state.list.filter((x) => x.id !== id);
        cc.state.savings = cc.state.savings.filter((s) => s.itemId !== id);
        cc.save();
        cc.closeSheet(true);
        cc.render();
      },
    },
  });
}

export default {
  render(c) {
    const st = c.state;
    const p = c.params;
    const m = listMatches(st, c.data);
    const pending = st.list.filter((i) => !i.done);
    const done = st.list.filter((i) => i.done);
    const withPromo = pending.filter((i) => (m.get(i.id) || []).length);
    const potential = r2(withPromo.reduce((a, i) => { const o = offerForItem(i, m.get(i.id)); return a + (o && isActive(o) ? saving(o) : 0); }, 0));
    const mode = p.mode || 'all';

    let body = '';
    if (!st.list.length) {
      body = empty('Lista jest pusta.<br>Wpisz wyżej, czego brakuje w lodówce.');
    } else if (mode === 'store') {
      const groups = new Map();
      for (const i of pending) {
        const o = offerForItem(i, m.get(i.id));
        const k = o ? o.store : '';
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(i);
      }
      const order = [...groups.keys()].sort((a, b) => (a === '' ? 1 : b === '' ? -1 : groups.get(b).length - groups.get(a).length));
      body = order.map((k) => `<div class="daylabel"><span>${esc(k ? STORES[k] : 'Bez promocji')}</span><span>${groups.get(k).length}</span></div>` +
        `<div class="rows">${groups.get(k).map((i) => itemRow(c, i, m.get(i.id))).join('')}</div>`).join('');
    } else {
      body = pending.length ? `<div class="rows">${pending.map((i) => itemRow(c, i, m.get(i.id))).join('')}</div>` : '';
    }
    if (done.length) {
      body += `<div class="daylabel"><span>Kupione · ${done.length}</span><button class="btn small" data-act="clear">Wyczyść</button></div>` +
        `<div class="rows">${done.map((i) => itemRow(c, i, m.get(i.id))).join('')}</div>`;
    }

    return `
      ${topbar('Moja lista', `${pending.length} do kupienia`, { right: `<button class="sq" data-act="promos" aria-label="Promocje">${ui('tag', 22)}</button>` })}
      <form class="list-add" data-submit="add" autocomplete="off">
        <label class="sr" for="list-new">Nowy produkt</label>
        <input id="list-new" class="field" type="text" placeholder="Dopisz, np. jogurt" enterkeyhint="done" autocapitalize="sentences">
        <button class="sq" type="submit" aria-label="Dopisz">${ui('plus', 20)}</button>
      </form>
      ${st.settings.strict ? `<div class="card dark row" style="padding:10px 14px">${sprite('angry', 34)}<span class="small grow">Tryb ostry: zachcianek nie dopiszę.</span></div>` : ''}
      ${pending.length ? `<div class="row between small"><span class="bold">${withPromo.length} z ${pending.length} w promocji${potential > 0 ? ` · oszczędzisz ${fmt(potential)} zł` : ''}</span></div>
      <div class="seg" role="tablist"><button class="${mode === 'all' ? 'on' : ''}" data-act="mode" data-arg="all">Wszystko</button><button class="${mode === 'store' ? 'on' : ''}" data-act="mode" data-arg="store">Według sklepu</button></div>` : ''}
      <div class="stack" style="gap:0">${body}</div>
    `;
  },

  actions: {
    add(c) {
      const inp = document.getElementById('list-new');
      const v = inp ? inp.value : '';
      if (!v.trim()) return;
      const ok = addToList(c, v);
      if (inp) inp.value = '';
      c.render();
      if (ok) {
        const again = document.getElementById('list-new');
        if (again) again.focus();
      }
    },
    tick(c, id) {
      const st = c.state;
      const i = st.list.find((x) => x.id === id);
      if (!i) return;
      i.done = !i.done;
      if (i.done) {
        i.doneAt = today();
        const o = offerForItem(i, listMatches(st, c.data).get(i.id));
        const s = o && isActive(o) ? saving(o) : 0;
        if (s > 0) {
          const before = Math.floor(st.savings.reduce((a, x) => a + x.amount, 0));
          st.savings.push({ id: uid(), itemId: i.id, amount: s, date: today(), name: i.name, store: o.store });
          const after = Math.floor(st.savings.reduce((a, x) => a + x.amount, 0));
          c.toast(`Zaoszczędzone ${fmt(s)} zł${after > before ? ` · +${after - before} exp` : ''}`);
        }
      } else {
        delete i.doneAt;
        st.savings = st.savings.filter((x) => x.itemId !== i.id);
      }
      c.save();
      c.render();
    },
    open(c, id) { itemSheet(c, id); },
    clear(c) {
      c.state.list = c.state.list.filter((i) => !i.done);
      c.save();
      c.render();
    },
    mode(c, m) { c.params.mode = m; c.render(); },
    promos(c) { c.go('promos'); },
  },

  peek(c) {
    const st = c.state;
    const m = listMatches(st, c.data);
    const pending = st.list.filter((i) => !i.done);
    if (!pending.length) return st.settings.strict ? { text: 'Tryb ostry włączony. Pilnuję listy!', mood: 'angry' } : 'Lista pusta. Dopisz, czego brakuje.';
    const counts = {};
    let n = 0;
    for (const i of pending) {
      const o = offerForItem(i, m.get(i.id));
      if (o) { n++; counts[o.store] = (counts[o.store] || 0) + 1; }
    }
    if (!n) return st.settings.strict ? { text: 'Tryb ostry włączony. Pilnuję listy!', mood: 'angry' } : 'Nic z listy nie jest teraz w promocji.';
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    return { text: `${n} ${plural(n, 'rzecz', 'rzeczy', 'rzeczy')} z listy ${plural(n, 'jest', 'są', 'jest')} w promocji. Najwięcej ${IN_STORE[best] || ''}.`, mood: 'happy' };
  },
};
