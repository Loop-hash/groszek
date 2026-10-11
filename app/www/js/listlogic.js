// Dopisywanie do listy zakupów z pilnowaniem trybu ostrego.
import { classify, norm, CAT_LABEL } from './dict.js';
import { uid } from './store.js';
import { today } from './budget.js';
import { esc } from './ui.js';

const NO = ['Nie ma mowy!', 'Odłóż to!', 'Nie dziś!', 'Ani mi się waż!', 'Nic z tego!'];

export function blocked(cls, settings) {
  if (!settings.strict || !cls.treat) return false;
  if (cls.learned) return true;
  return settings.strictCats[cls.cat] !== false && !!settings.strictCats[cls.cat];
}

function onList(state, name) {
  const key = norm(name);
  return state.list.find((i) => !i.done && norm(i.name) === key);
}

function push(c, name, cls, extra) {
  const ico = (c.state.icons || {})[norm(name)] || cls.ico;
  c.state.list.unshift({ id: uid(), name, ico, cat: cls.cat, done: false, added: today(), ...extra });
  c.save();
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

function askOnce(c, name, extra, done) {
  c.sheet({
    mascot: 'pea',
    render: () => `<h2>Co to jest „${esc(name)}”?</h2><p>Nie znam tego. Zapytam tylko raz i zapamiętam.</p>` +
      '<div class="row"><button class="btn dark grow" data-act="basic">Podstawa</button><button class="btn grow" data-act="treat">Zachcianka</button></div>',
    actions: {
      basic: (cc) => {
        cc.state.learned[norm(name)] = { treat: false, ico: 'bag' };
        cc.closeSheet(true);
        push(cc, name, classify(name, cc.state.learned), extra);
        cc.toast('Dopisano: ' + name);
        cc.render();
        if (done) done(true);
      },
      treat: (cc) => {
        cc.state.learned[norm(name)] = { treat: true, ico: 'candy' };
        cc.save();
        angry(cc, name, classify(name, cc.state.learned));
        cc.render();
        if (done) done(false);
      },
    },
  });
}

// Zwraca true, jeśli dopisano od razu. Przy pytaniu albo blokadzie pokazuje arkusz.
export function addToList(c, rawName, extra = {}, opts = {}) {
  const name = String(rawName || '').trim().replace(/\s+/g, ' ');
  if (!name) return false;
  const st = c.state;
  if (onList(st, name)) {
    if (!opts.quiet) c.toast('„' + name + '” już jest na liście');
    return false;
  }
  const cls = classify(name, st.learned);
  if (st.settings.strict) {
    if (!cls.known) { askOnce(c, name, extra, opts.done); return false; }
    if (blocked(cls, st.settings)) { angry(c, name, cls); return false; }
  }
  push(c, name, cls, extra);
  return true;
}
