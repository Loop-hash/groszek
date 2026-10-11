// Nowy wydatek: klawiatura, sklep, dzień. Ten sam ekran poprawia i usuwa stary wydatek.
import { status, fmt, today, addDays, r2, dayLabel } from '../budget.js';
import { ui } from '../pixels.js';
import { esc, topbar, chip, plural } from '../ui.js';
import { uid } from '../store.js';
import { readReceipt } from '../receipt.js';

const SHOPS = ['Biedronka', 'Lidl', 'Kaufland', 'Aldi', 'Żabka', 'Inny'];

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
      return;
    }
    delete p.id;
  }
  p.amount = '';
  const last = c.state.expenses[c.state.expenses.length - 1];
  p.store = (last && last.store) || 'Biedronka';
  p.date = today();
  p.note = '';
}

async function scan(c, file) {
  const STATUS = { 'loading tesseract core': 'wczytuję czytnik', 'initializing tesseract': 'uruchamiam czytnik', 'loading language traineddata': 'wczytuję język polski',
    'initializing api': 'uruchamiam czytnik', 'recognizing text': 'czytam tekst', 'przygotowuję zdjęcie': 'przygotowuję zdjęcie' };
  const cfg = {
    mascot: 'pea',
    render: () => '<h2>Czytam paragon…</h2><p id="ocr-status">przygotowuję zdjęcie</p><div class="bar"><div class="fill" id="ocr-bar" style="width:3%"></div></div>' +
      '<p class="tiny">Pierwszy raz trwa dłużej, bo wczytuję słownik. Wszystko dzieje się w telefonie, bez internetu.</p>',
    actions: {},
  };
  c.sheet(cfg);
  try {
    const res = await readReceipt(file, (m) => {
      const st = document.getElementById('ocr-status');
      const bar = document.getElementById('ocr-bar');
      if (st) st.textContent = STATUS[m.status] || m.status;
      if (bar && m.status === 'recognizing text') bar.style.width = Math.max(5, Math.round((m.progress || 0) * 100)) + '%';
    });
    if (c.app.sheetCfg !== cfg) return; // ktoś zamknął arkusz
    c.closeSheet(true);
    const p = c.params;
    p.ocr = { total: res.total, candidates: res.candidates, store: res.store, date: res.date };
    if (res.total != null) p.amount = String(res.total.toFixed(2)).replace('.', ',');
    if (res.store) p.store = SHOPS.includes(res.store) ? res.store : 'Inny';
    if (res.date && res.date <= today() && res.date >= addDays(today(), -30)) p.date = res.date;
    c.render();
    c.peek(res.total != null ? `Odczytałem ${fmt(res.total)} zł. Sprawdź i zapisz!` : 'Nie widzę sumy. Wpisz ją ręcznie.', res.total != null ? 'happy' : 'worried');
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
        <span class="small muted">${ocr.total != null ? `Suma ${fmt(ocr.total)} zł${ocr.store ? ' · ' + esc(ocr.store) : ''}${ocr.date ? ' · ' + esc(dayLabel(ocr.date)) : ''}. Sprawdź, czy się zgadza.` : 'Wpisz kwotę ręcznie albo wybierz jedną z odczytanych:'}</span>
        ${ocr.candidates.length ? `${ocr.total != null ? '<span class="small">Inna kwota?</span>' : ''}<div class="wrap">${ocr.candidates.map((a) => `<button class="chip" data-act="cand" data-arg="${a}">${fmt(a)} zł</button>`).join('')}</div>` : ''}
      </div>` : '';
    return `
      ${topbar(p.id ? 'Popraw wydatek' : 'Nowy wydatek', '', { right })}
      ${p.id ? '' : `<div class="row"><button class="btn small grow" data-act="photo" data-arg="camera">${ui('camera', 16)} Zrób zdjęcie</button><button class="btn small grow" data-act="photo" data-arg="gallery">${ui('gallery', 16)} Z galerii</button></div>`}
      ${ocrCard}
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
      if (p.id) {
        const e = st.expenses.find((x) => x.id === p.id);
        if (e) Object.assign(e, { amount, store: p.store, date: p.date });
      } else {
        st.expenses.push({ id: uid(), amount, store: p.store, date: p.date, created: Date.now() });
      }
      st.expenses.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.created || 0) - (b.created || 0)));
      c.save();
      c.back();
      c.toast(p.id ? 'Poprawiono wydatek' : `Zapisano ${fmt(amount)} zł`);
    },
    del(c) {
      c.sheet({
        mascot: 'worried',
        render: () => `<h2>Usunąć ten wydatek?</h2><p>${fmt(value(c.params))} zł · ${esc(c.params.store || '')}</p>` +
          '<div class="row"><button class="btn grow" data-act="sheet-close">Zostaw</button><button class="btn dark grow" data-act="yes">Usuń</button></div>',
        actions: {
          yes(cc) {
            cc.state.expenses = cc.state.expenses.filter((x) => x.id !== c.params.id);
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
