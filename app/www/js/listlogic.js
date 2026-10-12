// Dopisywanie do listy zakupów z pilnowaniem trybu ostrego.
import { classify, norm, CAT_LABEL, nameKey, parseEntry, canonical } from './dict.js';
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

// Komunikat po dopisaniu: ile sztuk i czy Groszek poprawił nazwę
function addedToast(c, name, qty, can, typed) {
  const parts = [];
  if (can && can.changed && can.how === 'literówka') parts.push(`Poprawiłem „${typed}” na „${name}”`);
  else parts.push('Dopisano: ' + name);
  if (qty > 1) parts[0] += ` ×${qty}`;
  c.toast(parts.join(''));
}

export function angry(c, name, cls) {
  const label = cls.learned ? 'zachcianka' : (CAT_LABEL[cls.cat] || cls.cat).toLowerCase();
  const title = NO[Math.floor(Math.random() * NO.length)];
  c.sheet({
    mascot: 'angry',
    shake: true,
    render: () => `<h2>${title}</h2><p>„${esc(name)}” to ${esc(label)}. W trybie ostrym tego nie dopiszę.</p>` +
      '<button class="btn dark block" data-act="sheet-close">No dobra</button>' +
      '<p class="tiny">Groszek się pomylił? Popraw to w Ustawieniach, w sekcji Tryb ostry.</p>',
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
        cc.toast('Dopisano: ' + name + (qty > 1 ? ` ×${qty}` : ''));
        cc.render();
        if (done) done(true);
      },
      treat: (cc) => {
        cc.state.learned[norm(name)] = { treat: true, ico: 'candy', name };
        cc.save();
        angry(cc, name, classify(name, cc.state.learned));
        cc.render();
        if (done) done(false);
      },
    },
  });
}

// Zwraca true, jeśli dopisano od razu. Przy pytaniu albo blokadzie pokazuje arkusz.
// Z klawiatury (opts.typed) rozumie ilości ("3 masło", "fasola x 3", "2 kg ziemniaków"),
// poprawia odmiany i literówki, a ta sama rzecz wpisana drugi raz zwiększa licznik.
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
    if (parsed.amount) have.amount = parsed.amount;
    else have.qty = Math.min(99, (have.qty || 1) + qty);
    c.save();
    c.toast(parsed.amount ? `${have.name}: ${parsed.amount}` : `${have.name}: ${have.qty} szt.`);
    return true;
  }
  const cls = classify(name, st.learned);
  if (st.settings.strict) {
    if (!cls.known) { askOnce(c, name, ex, opts.done, qty); return false; }
    if (blocked(cls, st.settings)) { angry(c, name, cls); return false; }
  }
  push(c, name, cls, { ...ex, qty });
  if (opts.typed && (can.changed || qty > 1 || parsed.amount)) addedToast(c, name + (parsed.amount ? ' ' + parsed.amount : ''), qty, can, parsed.text);
  return true;
}
