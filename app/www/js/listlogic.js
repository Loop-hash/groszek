// Dopisywanie do listy zakupów z pilnowaniem trybu ostrego.
import { classify, norm, CAT_LABEL, nameKey, parseEntry, canonical, splitEntries, mergeQty, qtyText } from './dict.js';
import { uid } from './store.js';
import { today } from './budget.js';
import { esc } from './ui.js';

const NO = ['Nie ma mowy!', 'Odłóż to!', 'Nie dziś!', 'Ani mi się waż!', 'Nic z tego!'];

export function blocked(cls, settings) {
  if (!settings.strict || !cls.treat) return false;
  if (cls.learned) return true;
  return settings.strictCats[cls.cat] !== false && !!settings.strictCats[cls.cat];
}

// Ta sama rzecz już na liście, też w innej odmianie ("masła" i "masło")
function onList(state, name) {
  const n = norm(name);
  const key = nameKey(name);
  return state.list.find((i) => !i.done && (norm(i.name) === n || (key && nameKey(i.name) === key)));
}

function push(c, name, cls, extra) {
  const ico = (c.state.icons || {})[norm(name)] || cls.ico;
  const item = { id: uid(), name, ico, cat: cls.cat, done: false, added: today(), ...extra };
  if (!(item.qty > 1)) delete item.qty;
  c.state.list.unshift(item);
  c.save();
}

// Komunikat po dopisaniu: ile i czy Groszek poprawił nazwę
function addedToast(c, item, can, typed) {
  const q = qtyText(item);
  if (can && can.changed && can.how === 'literówka') c.toast(`Poprawiłem „${typed}” na „${item.name}”${q ? ' ' + q : ''}`);
  else c.toast('Dopisano: ' + item.name + (q ? ' ' + q : ''));
}

export function angry(c, name, cls, done) {
  const label = cls.learned ? 'zachcianka' : (CAT_LABEL[cls.cat] || cls.cat).toLowerCase();
  const title = NO[Math.floor(Math.random() * NO.length)];
  c.sheet({
    mascot: 'angry',
    shake: true,
    render: () => `<h2>${title}</h2><p>„${esc(name)}” to ${esc(label)}. W trybie ostrym tego nie dopiszę.</p>` +
      '<button class="btn dark block" data-act="sheet-close">No dobra</button>' +
      '<p class="tiny">Groszosław się pomylił? Popraw to w Ustawieniach, w sekcji Tryb ostry.</p>',
    onClose: () => { if (done) done(false); },
  });
}

function askOnce(c, name, extra, done, qty = 1) {
  c.sheet({
    mascot: 'pea',
    render: () => `<h2>Co to jest „${esc(name)}”?</h2><p>Nie znam tego. Zapytam tylko raz i zapamiętam.</p>` +
      '<div class="row"><button class="btn dark grow" data-act="basic">Podstawa</button><button class="btn grow" data-act="treat">Zachcianka</button></div>',
    actions: {
      basic: (cc) => {
        cc.state.learned[norm(name)] = { treat: false, ico: 'bag', name };
        cc.closeSheet(true);
        push(cc, name, classify(name, cc.state.learned), { ...extra, qty });
        const q = qtyText({ qty, amount: extra.amount });
        cc.toast('Dopisano: ' + name + (q ? ' ' + q : ''));
        cc.render();
        if (done) done(true);
      },
      treat: (cc) => {
        cc.state.learned[norm(name)] = { treat: true, ico: 'candy', name };
        cc.save();
        angry(cc, name, classify(name, cc.state.learned), done);
        cc.render();
      },
    },
    onClose: () => { if (done) done(false); },
  });
}

// Zwraca true, jeśli dopisano od razu. Przy pytaniu albo blokadzie pokazuje arkusz.
// Z klawiatury (opts.typed) rozumie ilości ("3 masło", "masło3", "fasola x 3", "2 kg ziemniaków", "dwie kostki masła"),
// poprawia odmiany i literówki, a ta sama rzecz wpisana drugi raz zwiększa licznik (albo dodaje wagę).
export function addToList(c, rawName, extra = {}, opts = {}) {
  const st = c.state;
  const typedAll = String(rawName || '').trim().replace(/\s+/g, ' ');
  if (!typedAll) return false;
  const parsed = opts.typed ? parseEntry(typedAll) : { text: typedAll, qty: 1, amount: '' };
  const can = opts.typed ? canonical(parsed.text, st.learned) : { name: typedAll, changed: false };
  const name = can.name || parsed.text;
  if (!name) return false;
  const qty = parsed.qty;
  const ex = { ...extra };
  if (parsed.amount) ex.amount = parsed.amount;
  const have = onList(st, name);
  if (have) {
    if (!opts.typed) {
      if (!opts.quiet) c.toast('„' + name + '” już jest na liście');
      return false;
    }
    mergeQty(have, parsed);
    c.save();
    c.toast(`${have.name}: ${have.amount ? qtyText(have) : `${have.qty || 1} szt.`}`);
    return true;
  }
  const cls = classify(name, st.learned);
  if (st.settings.strict) {
    if (!cls.known) { askOnce(c, name, ex, opts.done, qty); return false; }
    if (blocked(cls, st.settings)) { angry(c, name, cls, opts.done); return false; }
  }
  push(c, name, cls, { ...ex, qty });
  if (opts.typed && (can.changed || qty > 1 || parsed.amount)) addedToast(c, { name, qty, amount: parsed.amount }, can, parsed.text);
  return true;
}

// Wpis z pola na liście: może mieć kilka rzeczy ("masło, 2 mleka i chleb"). Gdy przy którejś Groszosław
// pyta albo się złości, reszta dopisuje się po zamknięciu arkusza. onDone(ile dopisano) na końcu.
export function addEntries(c, raw, onDone) {
  const parts = splitEntries(raw);
  let added = 0;
  const run = (i) => {
    for (; i < parts.length; i++) {
      let waiting = true;
      const next = i + 1;
      const ok = addToList(c, parts[i], {}, {
        typed: true,
        done: (r) => {
          if (!waiting) return;
          waiting = false;
          if (r) added++;
          c.render();
          run(next);
        },
      });
      if (ok) { waiting = false; added++; continue; }
      if (c.state && c.app && c.app.sheetCfg) return; // czeka na odpowiedź w arkuszu
      waiting = false;
    }
    if (parts.length > 1 && added > 1) c.toast(`Dopisano ${added} rzeczy`);
    if (onDone) onDone(added);
  };
  run(0);
  return added;
}
