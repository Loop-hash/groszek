// Nowy wydatek: klawiatura, sklep, dzień. Ten sam ekran poprawia i usuwa stary wydatek.
import { status, fmt, today, addDays, r2, dayLabel, strictOn } from '../budget.js';
import { qtyText } from '../dict.js';
import { ui, food, sprite } from '../pixels.js';
import { esc, topbar, chip, plural, toggle, settingRow } from '../ui.js';
import { uid } from '../store.js';
import { readReceipt } from '../receipt.js';
import { normalize as normOffer } from '../offers.js';
import { buyRows, asItem } from '../buyitems.js';
import { describe, promoFor, recordPrices, penaltyFor, paidOf, generalName } from '../prices.js';

const SHOPS = ['Biedronka', 'Lidl', 'Kaufland', 'Aldi', 'Żabka', 'Inny'];
const STORE_ID = { Kaufland: 'kaufland', Lidl: 'lidl', Aldi: 'aldi', Biedronka: 'biedronka' };

function value(p) {
  const v = parseFloat(String(p.amount || '0').replace(',', '.'));
  return Number.isFinite(v) ? r2(v) : 0;
}

function init(c) {
  const p = c.params;
  if (p.ready) return;
  p.ready = true;
  if (p.id) {
    const e = c.state.expenses.find((x) => x.id === p.id);
    if (e) {
      p.amount = String(e.amount).replace('.', ',');
      p.store = e.store || '';
      p.date = e.date;
      p.note = e.note || '';
      if (e.items && e.items.length) p.items = e.items.map((x) => ({ ...asItem(x) }));
      p.itemsReceipt = !!(p.items && p.items.some((x) => x.total != null));
      p.promoKey = `${p.store}|${p.date}`; // promocje zapisane przy dodaniu zostają, dopóki nie zmieni się sklep albo dzień
      return;
    }
    delete p.id;
  }
  p.amount = '';
  const last = c.state.expenses[c.state.expenses.length - 1];
  p.store = (last && last.store) || 'Biedronka';
  p.date = today();
  p.note = '';
  // z listy zakupów: suma z cen promocji i szacunków, sklep, w którym było najwięcej rzeczy
  if (p.fromList && p.listSum > 0) p.amount = String(p.listSum.toFixed(2)).replace('.', ',');
  if (p.fromList && p.listStore && SHOPS.includes(p.listStore)) p.store = p.listStore;
}

const itemLabel = (x) => { const q = qtyText(x); return x.name + (q ? ' ' + q : ''); };

// Promocje z gazetki sprawdzamy w dniu z paragonu (albo wybranym dniu), w wybranym sklepie.
// Liczymy od nowa, gdy zmieni się sklep albo dzień.
function applyPromos(c, p) {
  const date = p.receiptDate || p.date;
  const key = `${p.store}|${date}`;
  if (!p.itemsReceipt || p.promoKey === key) return;
  p.promoKey = key;
  const offers = ((c.data.promos && c.data.promos.offers) || []).map(normOffer);
  for (const x of p.items || []) {
    delete x.promo;
    delete x.save;
    const pr = promoFor(x, offers, STORE_ID[p.store], date);
    if (pr) { x.promo = pr.kind; x.save = pr.save; }
  }
}

// Stan produktów względem kwoty: czy się zgadzają, kara w trybie ostrym, oszczędności na promocjach
function itemsState(c, p, amount) {
  applyPromos(c, p);
  const items = p.items || [];
  const priced = items.some((x) => x.total != null);
  const sum = r2(items.reduce((a, x) => a + (x.total != null ? paidOf(x) : 0), 0));
  const ok = priced && Math.abs(sum - amount) <= 0.011;
  return { items, priced, sum, ok, pen: penaltyFor(items, c.state, ok), save: r2(items.reduce((a, x) => a + (x.promo ? x.save || 0 : 0), 0)) };
}

function itemsCard(c, p, amount) {
  const s = itemsState(c, p, amount);
  if (!s.items.length) return '';
  const status = !s.priced ? '' : s.ok
    ? `<div class="row small bold" style="gap:6px">${ui('check', 14)}<span>Pozycje zgadzają się z kwotą</span></div>`
    : `<div class="small muted">Pozycje dają ${fmt(s.sum)} zł, a kwota to ${fmt(amount)} zł. Coś jest źle odczytane, więc kar nie liczę. Dotknij produktu, żeby go poprawić.</div>`;
  return `<div class="card buy">
      <div class="buy-head">${ui('receipt', 20)}<b class="grow">${p.itemsReceipt ? 'Produkty z paragonu' : 'Produkty'}</b><span class="tiny muted">${s.items.length}</span></div>
      <div class="bitems">${buyRows(s.items, 'itm')}</div>
      ${status}
      ${s.save > 0 ? `<div class="small">Na promocjach: <b>${fmt(s.save)} zł</b></div>` : ''}
      ${s.pen.exp > 0 ? `<div class="card dark row" style="padding:10px 12px">${sprite('angry', 32)}<span class="small grow">Tryb ostry: ${esc(s.pen.items.join(', '))}. Za to −${s.pen.exp} exp.</span></div>` : ''}
    </div>`;
}

function itemSheet(c, idx) {
  const p = c.params;
  const refresh = (x) => { const d = describe(x, c.state); x.ico = d.ico; x.cat = d.cat; if (!x.treatSet) x.treat = d.treat; };
  c.sheet({
    render(cc) {
      const x = (p.items || [])[idx];
      if (!x) return '<p>Tego produktu już nie ma.</p><button class="btn block" data-act="sheet-close">Zamknij</button>';
      return `<div class="row">${food(x.ico, 40)}<h3 class="grow">${esc(x.name)}</h3></div>` +
        (x.raw ? `<div class="small muted">Na paragonie: ${esc(x.raw)}</div>` : '') +
        `<label class="stack" style="gap:6px"><span class="label">Nazwa</span><input class="field small" id="itm-name" value="${esc(x.name)}" data-in="nm" autocomplete="off" enterkeyhint="done"></label>` +
        (x.total != null ? `<div class="row between"><span class="bold">Zapłacone</span><b class="pixel" style="font-size:20px">${fmt(paidOf(x))} zł</b></div>` : '') +
        (strictOn(cc.state) ? `<div class="rows">${settingRow('Zachcianka', 'W trybie ostrym Groszosław odejmie za nią exp', toggle('treat', !!x.treat, 'Zachcianka'))}</div>` : '') +
        '<div class="row"><button class="btn grow" data-act="rm">Usuń produkt</button><button class="btn dark grow" data-act="sheet-close">Gotowe</button></div>';
    },
    inputs: {
      nm(cc, v) {
        const x = (p.items || [])[idx];
        if (!x) return;
        x.name = v;
        refresh(x);
        p.itemsDirty = true;
      },
    },
    actions: {
      treat(cc) {
        const x = (p.items || [])[idx];
        if (!x) return;
        x.treat = !x.treat;
        x.treatSet = true;
        p.itemsDirty = true;
        cc.renderSheet();
      },
      rm(cc) {
        p.items.splice(idx, 1);
        p.itemsDirty = true;
        cc.closeSheet();
      },
    },
    onClose(cc) {
      const x = (p.items || [])[idx];
      if (x && !x.name.trim()) p.items.splice(idx, 1);
      cc.render();
    },
  });
}

// Do zapisu: bez pól pomocniczych i pustych wartości
function storedItem(x) {
  const o = {};
  for (const k of ['name', 'raw', 'qty', 'unit', 'price', 'total', 'disc', 'ico', 'cat', 'treat', 'promo', 'save', 'size']) {
    const v = x[k];
    if (v === undefined || v === null || v === '' || v === false || (k === 'disc' && !v) || (k === 'save' && !v)) continue;
    if (k === 'qty' && v === 1 && x.unit !== 'kg' && x.total == null) continue;
    o[k] = v;
  }
  o.name = String(o.name || '').trim();
  return o;
}

async function scan(c, file) {
  const STATUS = { 'loading tesseract core': 'wczytuję czytnik', 'initializing tesseract': 'uruchamiam czytnik', 'loading language traineddata': 'wczytuję język polski',
    'initializing api': 'uruchamiam czytnik', 'recognizing text': 'czytam tekst', 'przygotowuję zdjęcie': 'przygotowuję zdjęcie' };
  const cfg = {
    mascot: 'pea',
    render: () => '<h2>Czytam paragon…</h2><p id="ocr-status">przygotowuję zdjęcie</p><div class="bar"><div class="fill" id="ocr-bar" style="width:3%"></div></div>' +
      '<p class="tiny">Wszystko dzieje się w telefonie, bez internetu.</p>',
    actions: {},
  };
  c.sheet(cfg);
  try {
    const res = await readReceipt(file, (m) => {
      const st = document.getElementById('ocr-status');
      const bar = document.getElementById('ocr-bar');
      if (st) st.textContent = STATUS[m.status] || m.status;
      if (bar && (m.status === 'recognizing text' || m.status === 'czytam tekst')) bar.style.width = Math.max(5, Math.round((m.progress || 0) * 100)) + '%';
    });
    if (c.app.sheetCfg !== cfg) return; // ktoś zamknął arkusz
    c.closeSheet(true);
    const p = c.params;
    // Data z paragonu tylko jako podpowiedź. Wcześniej od razu ją ustawialiśmy i wydatek ze starego
    // (albo źle odczytanego) paragonu lądował w innym dniu, więc wyglądało, jakby się nie dodał.
    const dateOk = res.date && res.date <= today() && res.date >= addDays(today(), -30);
    p.ocr = { total: res.total, candidates: res.candidates, store: res.store, date: dateOk ? res.date : '', itemsOk: !!res.itemsOk };
    if (res.total != null) p.amount = String(res.total.toFixed(2)).replace('.', ',');
    if (res.store) p.store = SHOPS.includes(res.store) ? res.store : 'Inny';
    p.receiptDate = res.date && res.date <= today() ? res.date : '';
    if (res.items && res.items.length) {
      // ogólna nazwa ("Mleko 3,2% 1 l"), a skrót z paragonu zostaje pod spodem
      p.items = res.items.map((x) => {
        const g = generalName(x.name);
        const it = { name: g || x.name, qty: x.qty, unit: x.unit, price: x.price, total: x.total, disc: x.disc || 0 };
        if (g) it.raw = x.name;
        return { ...it, ...describe(it, c.state) };
      });
      p.itemsReceipt = true;
      delete p.promoKey;
    }
    c.render();
    const n = (p.items || []).length;
    c.peek(res.total != null ? `Odczytałem ${fmt(res.total)} zł${n ? ` i ${n} ${plural(n, 'produkt', 'produkty', 'produktów')}` : ''}. Sprawdź i zapisz!` : 'Nie widzę sumy. Wpisz ją ręcznie.', res.total != null ? 'happy' : 'worried');
  } catch (e) {
    if (c.app.sheetCfg === cfg) c.closeSheet(true);
    c.toast('Nie udało się odczytać: ' + (e && e.message ? e.message : e));
  }
}

export default {
  render(c) {
    init(c);
    const p = c.params;
    const st = c.state;
    const amount = value(p);
    const s = status(st);
    const old = p.id ? (st.expenses.find((x) => x.id === p.id) || {}).amount || 0 : 0;
    const inPeriod = p.date >= s.period.start && p.date <= s.period.end;
    const after = r2(s.remaining - (inPeriod ? amount - old : 0));
    const daysAfter = Math.max(1, s.period.daysLeft - 1);
    const perDayAfter = r2(after / daysAfter);
    const shown = p.amount ? p.amount : '0';
    const t = today();
    const dateChips = [
      chip('date', 'Dziś', p.date === t, t),
      chip('date', 'Wczoraj', p.date === addDays(t, -1), addDays(t, -1)),
      chip('date', 'Przedwczoraj', p.date === addDays(t, -2), addDays(t, -2)),
    ];
    if (![t, addDays(t, -1), addDays(t, -2)].includes(p.date)) dateChips.push(chip('date', dayLabel(p.date), true, p.date));

    const right = p.id ? `<button class="sq" data-act="del" aria-label="Usuń wydatek">${ui('trash', 22)}</button>` : undefined;
    const ocr = p.ocr;
    const ocrCard = ocr ? `<div class="card ${ocr.total != null ? '' : 'dashed'} stack" style="gap:8px">
        <div class="row">${ui('receipt', 20)}<b class="grow">${ocr.total != null ? 'Odczytane z paragonu' : 'Nie znalazłem sumy na paragonie'}</b></div>
        <span class="small muted">${ocr.total != null ? `Suma ${fmt(ocr.total)} zł${ocr.store ? ' · ' + esc(ocr.store) : ''}. ${ocr.itemsOk ? 'Zgadza się z produktami.' : 'Sprawdź, czy się zgadza.'}` : 'Wpisz kwotę ręcznie albo wybierz jedną z odczytanych:'}</span>
        ${ocr.date && ocr.date !== p.date ? `<div class="row between small"><span class="muted">Na paragonie: ${esc(dayLabel(ocr.date))}</span><button class="chip" data-act="date" data-arg="${ocr.date}">Ustaw tę datę</button></div>` : ''}
        ${ocr.candidates.length && !ocr.itemsOk ? `${ocr.total != null ? '<span class="small">Inna kwota?</span>' : ''}<div class="wrap">${ocr.candidates.map((a) => `<button class="chip" data-act="cand" data-arg="${a}">${fmt(a)} zł</button>`).join('')}</div>` : ''}
      </div>` : '';
    const fromList = p.listItems && p.listItems.length && !(p.items && p.items.length) ? `<div class="card stack" style="gap:6px">
        <div class="row">${ui('basket', 20)}<b class="grow">Z listy zakupów</b></div>
        <span class="small">${esc(p.listItems.map(itemLabel).join(', '))}</span>
        <span class="small muted">${p.listPriced ? `Około ${fmt(p.listSum)} zł z cen w promocjach i szacunków${p.listPriced < p.listItems.length ? `, bez ceny: ${p.listItems.length - p.listPriced}` : ''}. ` : ''}Jeśli masz paragon, zrób zdjęcie albo wpisz kwotę z niego.</span>
      </div>` : '';
    return `
      ${topbar(p.id ? 'Popraw wydatek' : 'Nowy wydatek', '', { right })}
      ${fromList}
      ${p.id ? '' : `<div class="row"><button class="btn small grow" data-act="photo" data-arg="camera">${ui('camera', 16)} Zrób zdjęcie</button><button class="btn small grow" data-act="photo" data-arg="gallery">${ui('gallery', 16)} Z galerii</button></div>` +
        (ocr ? '' : '<div class="tiny muted center">Połóż paragon na ciemnym tle i zrób zdjęcie z bliska, tak żeby wypełniał kadr. Dół z SUMĄ musi być ostry.</div>')}
      ${ocrCard}
      ${itemsCard(c, p, amount)}
      <div class="stack" style="gap:6px;padding-top:6px">
        <div class="amount" aria-live="polite">${esc(shown)}<small> zł</small></div>
        <div class="center small muted">kwota z paragonu</div>
      </div>
      <div class="stack">
        <span class="label">Sklep</span>
        <div class="scroller">${SHOPS.map((n) => chip('shop', n, p.store === n, n)).join('')}</div>
      </div>
      <div class="stack">
        <span class="label">Kiedy</span>
        <div class="scroller">${dateChips.join('')}</div>
      </div>
      <div class="card row between">
        <div class="stack" style="gap:2px"><span class="small muted">Potem na dzień</span><b class="pixel" style="font-size:22px">${fmt(perDayAfter)} zł</b></div>
        <div class="small muted" style="text-align:right">zostanie<br><b class="pixel" style="font-size:18px;color:var(--ink)">${fmt(after)} zł</b><br>na ${daysAfter} ${plural(daysAfter, 'dzień', 'dni', 'dni')}</div>
      </div>
      <div class="keypad">
        ${['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0'].map((k) => `<button data-act="key" data-arg="${k}" aria-label="${k === ',' ? 'przecinek' : k}">${k}</button>`).join('')}
        <button class="dark" data-act="bksp" aria-label="Usuń cyfrę">${ui('arrow', 22)}</button>
      </div>
      <button class="cta" data-act="save" ${amount > 0 ? '' : 'aria-disabled="true"'}>${ui('check', 18)}<span>Zapisz ${fmt(amount)} zł</span>${ui('arrow', 18, 'flip')}</button>
    `;
  },

  actions: {
    photo(c, kind) {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      if (kind === 'camera') inp.setAttribute('capture', 'environment');
      inp.style.display = 'none';
      document.body.appendChild(inp);
      inp.onchange = () => {
        const f = inp.files && inp.files[0];
        inp.remove();
        if (f) scan(c, f);
      };
      inp.click();
    },
    cand(c, a) {
      c.params.amount = String(a).replace('.', ',');
      c.render();
    },
    key(c, k) {
      const p = c.params;
      let a = p.amount || '';
      if (k === ',') {
        if (a.includes(',')) return;
        a = (a || '0') + ',';
      } else {
        const [i, f] = a.split(',');
        if (f !== undefined && f.length >= 2) return;
        if (f === undefined && i.length >= 5) return;
        a = a === '0' ? k : a + k;
      }
      p.amount = a;
      c.render();
    },
    bksp(c) {
      c.params.amount = (c.params.amount || '').slice(0, -1);
      c.render();
    },
    shop(c, n) { c.params.store = n; c.render(); },
    date(c, d) { c.params.date = d; c.render(); },
    save(c) {
      const p = c.params;
      const amount = value(p);
      if (amount <= 0) { c.toast('Najpierw wpisz kwotę'); return; }
      const st = c.state;
      const s = itemsState(c, p, amount);
      const items = s.items.map(storedItem).filter((x) => x.name);
      let pen = null;
      let extra = 0;
      if (p.id) {
        const e = st.expenses.find((x) => x.id === p.id);
        if (e) {
          const changed = p.itemsDirty || e.amount !== amount;
          Object.assign(e, { amount, store: p.store, date: p.date });
          if (p.itemsDirty) e.items = items;
          if (s.priced) e.itemsOk = s.ok;
          // kara liczona od nowa, gdy zmieniły się produkty albo kwota
          if (changed && s.priced) {
            st.penalties = (st.penalties || []).filter((x) => x.expenseId !== e.id);
            if (s.pen.exp > 0) { st.penalties.push({ id: uid(), expenseId: e.id, date: p.date, exp: s.pen.exp, items: s.pen.items }); pen = s.pen; }
          }
        }
      } else {
        const e = { id: uid(), amount, store: p.store, date: p.date, created: Date.now() };
        if (items.length) {
          e.items = items;
          if (s.priced) e.itemsOk = s.ok;
        } else if (p.listItems && p.listItems.length) {
          e.items = p.listItems.map((x) => storedItem({ name: x.name, qty: x.qty, size: x.amount, ico: describe(x, st).ico }));
        }
        st.expenses.push(e);
        // rzeczy z listy są już rozliczone: znikają z "Kupione"; ich promocje są już policzone
        let listSaved = 0;
        if (p.fromList && p.fromList.length) {
          const ids = new Set(p.fromList);
          listSaved = st.savings.filter((x) => ids.has(x.itemId)).reduce((a, x) => a + x.amount, 0);
          st.list = st.list.filter((i) => !ids.has(i.id));
        }
        if (s.priced) {
          recordPrices(st, p.store, p.receiptDate || p.date, s.items);
          extra = r2(s.save - listSaved);
          if (extra > 0) st.savings.push({ id: uid(), expenseId: e.id, amount: extra, date: p.date, name: 'Promocje z paragonu', store: p.store });
          if (s.pen.exp > 0) {
            st.penalties = st.penalties || [];
            st.penalties.push({ id: uid(), expenseId: e.id, date: p.date, exp: s.pen.exp, items: s.pen.items });
            pen = s.pen;
          }
        }
      }
      st.expenses.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.created || 0) - (b.created || 0)));
      c.save();
      c.back();
      const when = p.date === today() ? '' : p.date === addDays(today(), -1) ? ' na wczoraj' : ` na ${dayLabel(p.date)}`;
      c.toast(p.id ? 'Poprawiono wydatek' : `Zapisano ${fmt(amount)} zł${when}`);
      if (pen) c.peek(`${pen.items.length > 1 ? 'Zachcianki' : 'Zachcianka'} na paragonie: ${pen.items.join(', ')}. Minus ${pen.exp} exp!`, 'angry');
      else if (extra > 0) c.peek(`Na promocjach zaoszczędzone ${fmt(extra)} zł. Tak trzymać!`, 'happy');
    },
    itm(c, i) { itemSheet(c, Number(i)); },
    del(c) {
      c.sheet({
        mascot: 'worried',
        render: () => `<h2>Usunąć ten wydatek?</h2><p>${fmt(value(c.params))} zł · ${esc(c.params.store || '')}</p>` +
          '<div class="row"><button class="btn grow" data-act="sheet-close">Zostaw</button><button class="btn dark grow" data-act="yes">Usuń</button></div>',
        actions: {
          yes(cc) {
            const id = c.params.id;
            cc.state.expenses = cc.state.expenses.filter((x) => x.id !== id);
            cc.state.savings = cc.state.savings.filter((x) => x.expenseId !== id);
            cc.state.penalties = (cc.state.penalties || []).filter((x) => x.expenseId !== id);
            cc.save();
            cc.closeSheet(true);
            cc.back();
            cc.toast('Usunięto wydatek');
          },
        },
      });
    },
  },
};
