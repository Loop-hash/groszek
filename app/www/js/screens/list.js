// Lista zakupów: ikonki, promocje do każdej rzeczy, odhaczanie, tryb ostry i oszczędności (exp).
import { fmt, today, r2, shortDate } from '../budget.js';
import { ui, food, sprite, FOOD } from '../pixels.js';
import { esc, topbar, check, empty, plural } from '../ui.js';
import { listMatches, offerForItem, STORES, whenLabel, saving, isActive, tidy } from '../offers.js';
import { addEntries } from '../listlogic.js';
import { norm, qtyText, gramsOf, setQty, stepLabel } from '../dict.js';
import { uid } from '../store.js';
import { pricesFor } from '../prices.js';

const IN_STORE = { kaufland: 'w Kauflandzie', lidl: 'w Lidlu', aldi: 'w Aldi', biedronka: 'w Biedronce' };
const CAT_NAME = {
  'nabiał': 'nabiał', 'pieczywo': 'pieczywo', 'mięso': 'mięso', 'wędliny': 'wędliny', 'warzywa': 'warzywa', 'owoce': 'owoce',
  'makarony i kasze': 'makarony i kasze', 'śniadania': 'na śniadanie', 'do pieczenia': 'do pieczenia', 'przyprawy': 'przyprawy',
  'strączki': 'strączki', 'tłuszcze': 'tłuszcze', 'napoje': 'napoje', 'ryby': 'ryby', 'inne': 'inne', 'podstawy': 'podstawa', 'zachcianka': 'zachcianka',
  'chemia': 'chemia i dom', 'zupy': 'zupy', 'mrożonki i gotowce': 'mrożonki i gotowce', 'kawa i herbata': 'kawa i herbata', 'bakalie': 'bakalie', 'sosy i dodatki': 'sosy i dodatki',
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
  const qt = qtyText(i);
  const q = qt ? ` <span class="qty">${esc(qt)}</span>` : '';
  const plus = i.done ? '' : `<button class="qty-plus" data-act="more" data-arg="${esc(i.id)}" aria-label="Jeszcze jedno: ${esc(i.name)}">${ui('plus', 14)}</button>`;
  return `<div class="item ${i.done ? 'done' : ''}">${check('tick', i.done, (i.done ? 'Odznacz ' : 'Odhacz ') + i.name, i.id)}` +
    `<button class="item-main" data-act="open" data-arg="${esc(i.id)}">${food(i.ico, 30)}<span class="grow stack"><span class="name">${esc(i.name)}${q}</span>` +
    `<span class="sub">${esc(sub)}</span></span></button>${i.done ? '' : price}${plus}</div>`;
}

// Cena rzeczy z listy: z wybranej promocji, a bez niej szacunek z cen składników (całe opakowanie)
function priceOf(c, i, matches) {
  const qty = i.qty || 1;
  const o = offerForItem(i, matches);
  if (o && o.price && isActive(o)) return { price: r2(o.price * qty), store: o.store, src: 'promo' };
  // cena z Twoich paragonów
  const known = pricesFor(c.state, i.name)[0];
  // waga z ilości ("2 kg", "2 × 1 kg"); opakowania i sztuki są już w qty
  const grams = gramsOf(i.amount);
  if (known && known.paid) {
    const w = (grams ? grams / 1000 : 0.5) * qty;
    return { price: r2(known.paid * (known.unit === 'kg' ? w : qty)), store: known.store.toLowerCase(), src: 'twoje' };
  }
  const all = (c.data.ingredients && c.data.ingredients.ingredients) || {};
  const words = norm(i.name).split(' ');
  let best = null;
  let bl = 0;
  for (const ing of Object.values(all)) {
    for (const k of ing.kw || []) {
      const hit = k.includes(' ') ? norm(i.name).includes(k) : words.some((w) => w.startsWith(k) || k.startsWith(w) && w.length >= 4);
      if (hit && k.length > bl) { bl = k.length; best = ing; }
    }
  }
  if (!best || !best.kg) return null;
  const g = grams || best.pkg || 500; // bez opakowania (warzywa na wagę): pół kilo
  return { price: r2((best.kg * g) / 1000 * qty), store: '', src: 'szac' };
}

// Kupione, a jeszcze nie w wydatkach: suma, sklep z największą liczbą rzeczy i lista nazw
function boughtSummary(c) {
  const st = c.state;
  const m = listMatches(st, c.data);
  const items = st.list.filter((i) => i.done && !i.expensed);
  let sum = 0;
  let priced = 0;
  const stores = {};
  for (const i of items) {
    const pr = priceOf(c, i, m.get(i.id));
    if (!pr) continue;
    sum += pr.price;
    priced++;
    if (pr.store) stores[pr.store] = (stores[pr.store] || 0) + 1;
  }
  const top = Object.entries(stores).sort((a, b) => b[1] - a[1])[0];
  return { items, sum: r2(sum), priced, store: top ? STORES[top[0]] : '' };
}

function toExpenses(c) {
  const b = boughtSummary(c);
  if (!b.items.length) return;
  c.closeSheet(true);
  c.go('add', {
    fromList: b.items.map((i) => i.id),
    listItems: b.items.map((i) => ({ name: i.name, qty: i.qty || 1, amount: i.amount || '' })),
    listSum: b.sum, listPriced: b.priced, listStore: b.store,
  }, { quiet: true });
}

function changeQty(c, id, d) {
  const i = c.state.list.find((x) => x.id === id);
  if (!i) return;
  setQty(i, (i.qty || 1) + d);
  c.save();
  c.render();
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
      const qty = i.qty || 1;
      const known = pricesFor(cc.state, i.name).slice(0, 4);
      const mine = known.length ? `<span class="label">Twoje ceny z paragonów</span><div class="rows">${known.map((k) => `<div class="item"><span class="grow stack"><span class="name">${esc(k.store)}</span><span class="sub">${esc(k.name)} · ${shortDate(k.date)}${k.promo ? ' · w promocji' : ''}</span></span><b class="pixel">${fmt(k.paid)} zł${k.unit === 'kg' ? '/kg' : ''}</b></div>`).join('')}</div>` : '';
      return `<div class="row">${food(i.ico, 44)}<h3 class="grow">${esc(i.name)}</h3></div>` +
        `<div class="row between"><span class="bold">${esc(stepLabel(i))}</span><span class="stepper">` +
        `<button class="sq" data-act="less" aria-label="Mniej" ${qty <= 1 ? 'aria-disabled="true"' : ''}>${ui('minus', 18)}</button>` +
        `<b class="pixel">${qty}</b><button class="sq" data-act="more" aria-label="Więcej">${ui('plus', 18)}</button></span></div>` +
        (matches.length
          ? `<span class="label">W promocji ${matches.length > 8 ? '(najtańsze 8)' : ''}</span><div class="stack">${offers}</div>`
          : '<p style="text-align:left">Teraz nie ma tego w promocjach w twoich sklepach.</p>') + mine +
        `<details class="more"><summary>Zmień ikonkę <span>${ui('edit', 16)}</span></summary><div class="stack"><div class="icon-grid">${icons}</div></div></details>` +
        '<div class="row"><button class="btn grow" data-act="remove">Usuń z listy</button><button class="btn dark grow" data-act="sheet-close">Gotowe</button></div>';
    },
    actions: {
      more(cc) { changeQty(cc, id, 1); cc.renderSheet(); },
      less(cc) { changeQty(cc, id, -1); cc.renderSheet(); },
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
    const potential = r2(withPromo.reduce((a, i) => { const o = offerForItem(i, m.get(i.id)); return a + (o && isActive(o) ? saving(o) * (i.qty || 1) : 0); }, 0));
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
      const b = boughtSummary(c);
      body += `<div class="daylabel"><span>Kupione · ${done.length}</span><button class="btn small" data-act="clear">Wyczyść</button></div>` +
        (b.items.length ? `<button class="card dashed row" data-act="toExpenses" style="text-align:left;margin:6px 0">${ui('receipt', 22)}<span class="grow stack" style="gap:2px"><b>Dopisz do wydatków</b>` +
          `<span class="small muted">${b.items.length} ${plural(b.items.length, 'rzecz', 'rzeczy', 'rzeczy')}${b.priced ? ` · około ${fmt(b.sum)} zł` : ''}. Kwotę poprawisz albo odczytasz z paragonu.</span></span>${ui('arrow', 16, 'flip')}</button>` : '') +
        `<div class="rows">${done.map((i) => itemRow(c, i, m.get(i.id))).join('')}</div>`;
    }

    return `
      ${topbar('Moja lista', `${pending.length} do kupienia`, { right: `<button class="sq" data-act="promos" aria-label="Promocje">${ui('tag', 22)}</button>` })}
      <form class="list-add" data-submit="add" autocomplete="off">
        <label class="sr" for="list-new">Nowy produkt</label>
        <input id="list-new" class="field" type="text" placeholder="Dopisz, np. 3 jogurty" enterkeyhint="done" autocapitalize="sentences">
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
      if (inp) inp.value = '';
      const ok = addEntries(c, v) > 0;
      c.render();
      if (ok && !c.app.sheetCfg) {
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
        const s = o && isActive(o) ? r2(saving(o) * (i.qty || 1)) : 0;
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
      // ostatnia rzecz odhaczona: zaproponuj dopisanie zakupów do wydatków
      if (i.done && !st.list.some((x) => !x.done)) {
        const b = boughtSummary(c);
        if (b.items.length) {
          c.sheet({
            mascot: 'happy',
            render: () => `<h2>Wszystko kupione!</h2><p>Dopisać te zakupy do wydatków${b.priced ? `? Wychodzi około ${fmt(b.sum)} zł` : '?'}</p>` +
              '<div class="row"><button class="btn grow" data-act="sheet-close">Później</button><button class="btn dark grow" data-act="go">Dopisz</button></div>',
            actions: { go: (cc) => toExpenses(cc) },
          });
        }
      }
    },
    toExpenses(c) { toExpenses(c); },
    open(c, id) { itemSheet(c, id); },
    more(c, id) { changeQty(c, id, 1); },
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
