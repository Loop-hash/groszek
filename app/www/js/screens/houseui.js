// Wspólny dom w Ustawieniach i na powitaniu: zakładanie, dołączanie kodem, kod do przekazania, odłączanie.
import { esc, settingRow, plural } from '../ui.js';
import { ui } from '../pixels.js';
import { normCode, prettyCode, available } from '../house.js';
import { defaults } from '../store.js';
import { today } from '../budget.js';
import { shareText } from '../share.js';

// Jedno zdanie o stanie połączenia
export function houseLine(c) {
  const h = c.state.house;
  if (!h) return '';
  const s = c.app.house ? c.app.house.status : {};
  const wait = c.app.house ? c.app.house.pendingCount() : 0;
  if (s.error && wait) return `bez internetu · ${wait} ${plural(wait, 'zmiana czeka', 'zmiany czekają', 'zmian czeka')}`;
  if (!s.connected) return wait ? `łączę… · ${wait} ${plural(wait, 'zmiana czeka', 'zmiany czekają', 'zmian czeka')}` : 'łączę…';
  const n = s.devices || 1;
  return `połączono · ${n} ${plural(n, 'telefon', 'telefony', 'telefonów')}`;
}

export function houseRow(c) {
  if (!available()) return '';
  const h = c.state.house;
  return h
    ? settingRow('Wspólny dom', esc(houseLine(c)), '<button class="btn small" data-act="house">Kod domu</button>')
    : settingRow('Wspólny dom', 'lista, wydatki, budżet i plan na telefonach całej rodziny', '<button class="btn small" data-act="house">Ustaw</button>');
}

const SAFE = 'Dane szyfrują się w telefonie kodem domu, zanim polecą do internetu. Bez kodu nikt ich nie znajdzie ani nie odczyta.';

// Arkusz z Ustawień: zależnie od tego, czy telefon jest już w domu
export function houseSheet(c) {
  if (c.state.house) codeSheet(c);
  else startSheet(c);
}

function startSheet(c) {
  const cfg = {
    mascot: 'happy',
    render: () => '<h2>Wspólny dom</h2>' +
      '<p>Ta sama lista zakupów, wydatki, budżet i plan na telefonach całej rodziny. Ktoś dopisze mleko, a w sklepie od razu je widać.</p>' +
      '<div class="row"><button class="btn grow" data-act="join">Mam kod</button><button class="btn dark grow" data-act="create">Załóż dom</button></div>' +
      `<div class="tiny muted center">${SAFE}</div>`,
    actions: {
      async create(cc) {
        if (cfg.busy) return;
        cfg.busy = true;
        try {
          await cc.app.house.create();
          cc.save();
          codeSheet(cc, true);
        } catch (e) {
          cfg.busy = false;
          cc.toast('Nie udało się: ' + (e && e.message));
        }
      },
      join(cc) { joinSheet(cc); },
    },
  };
  c.sheet(cfg);
}

function codeSheet(c, fresh = false) {
  const code = c.state.house.code;
  c.sheet({
    mascot: fresh ? 'happy' : null,
    render: (cc) => `<h2>${fresh ? 'Dom założony!' : 'Kod domu'}</h2>` +
      `<div class="card center" style="padding:14px 10px"><b class="pixel" style="font-size:25px;letter-spacing:.04em" id="house-code">${esc(prettyCode(code))}</b></div>` +
      '<p>Na drugim telefonie: Ustawienia, „Wspólny dom”, „Mam kod” i wpisz ten kod. Na nowym telefonie od razu na powitaniu.</p>' +
      `<div class="tiny muted center">Kod jest jak hasło: daj go tylko domownikom.${fresh ? '' : ` · ${esc(houseLine(cc))}`}</div>` +
      `<div class="row"><button class="btn grow" data-act="send">${ui('share', 14)} Wyślij kod</button><button class="btn dark grow" data-act="sheet-close">Gotowe</button></div>` +
      (fresh ? '' : '<button class="btn small block" data-act="leave">Odłącz ten telefon</button>'),
    actions: {
      async send(cc) {
        const how = await shareText(`Kod do naszego wspólnego domu w apce Do Pierwszego: ${prettyCode(code)}\n\nW apce: Ustawienia, „Wspólny dom”, „Mam kod”.`, 'Kod domu', 'Wyślij kod domu');
        if (how === 'copied') cc.toast('Skopiowano kod');
      },
      leave(cc) { leaveSheet(cc); },
    },
  });
}

function leaveSheet(c) {
  c.sheet({
    mascot: 'worried',
    render: () => '<h2>Odłączyć ten telefon?</h2><p>Dane zostaną w tym telefonie jako zwykła kopia, ale zmiany przestaną przychodzić i wychodzić. U innych domowników nic nie zniknie.</p>' +
      '<div class="row"><button class="btn grow" data-act="sheet-close">Zostaw</button><button class="btn dark grow" data-act="yes">Odłącz</button></div>',
    actions: {
      async yes(cc) {
        await cc.app.house.leave();
        cc.save();
        cc.closeSheet(true);
        cc.render();
        cc.toast('Telefon odłączony od domu');
      },
    },
  });
}

// opts.onboarding: dołączanie na powitaniu (po nim od razu ekran główny)
export function joinSheet(c, opts = {}) {
  const st = { code: '', err: '', busy: false };
  const cfg = {
    render: () => '<h2>Dołącz do domu</h2>' +
      '<p>Wpisz kod z telefonu domownika (Ustawienia, „Wspólny dom”, „Kod domu”).</p>' +
      `<input id="house-in" class="field center pixel" style="font-size:20px;letter-spacing:.06em" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go" value="${esc(st.code)}" data-in="code">` +
      (st.err ? `<div class="small center" style="font-weight:700">${esc(st.err)}</div>` : '') +
      `<button class="btn dark block" data-act="go" ${st.busy ? 'disabled' : ''}>${st.busy ? 'Sprawdzam…' : 'Dołącz'}</button>` +
      `<div class="tiny muted center">${SAFE}</div>`,
    mounted: () => { const f = document.getElementById('house-in'); if (f && !opts.noFocus) f.focus(); },
    inputs: { code(cc, v) { st.code = v; } },
    actions: {
      async go(cc) {
        const f = document.getElementById('house-in');
        if (f) st.code = f.value;
        const code = normCode(st.code);
        if (!code) { st.err = 'To nie wygląda na kod domu: 16 znaków, np. ABCD-EFGH-JKLM-NPQR.'; cc.renderSheet(); return; }
        st.busy = true; st.err = ''; cc.renderSheet();
        let found;
        try { found = await cc.app.house.peek(code); } catch (e) { found = undefined; st.err = 'Brak połączenia z bazą. Sprawdź internet.'; }
        st.busy = false;
        if (found === null) st.err = 'Nie ma domu z takim kodem. Sprawdź litery.';
        if (!found) { cc.renderSheet(); return; }
        const s = cc.state;
        const mine = (s.expenses || []).length + (s.list || []).length + Object.keys(s.plan || {}).length;
        if (mine && s.onboarded) mergeSheet(cc, code, opts);
        else finishJoin(cc, code, true, opts);
      },
    },
  };
  c.sheet(cfg);
}

function mergeSheet(c, code, opts) {
  c.sheet({
    render: () => '<h2>Co z danymi z tego telefonu?</h2>' +
      '<p>Masz już tu swoje wydatki albo listę. Mogą dołączyć do wspólnych albo zniknąć z tego telefonu.</p>' +
      '<div class="stack"><button class="btn dark block" data-act="merge">Dołącz moje do wspólnych</button><button class="btn block" data-act="fresh">Tylko wspólne (moje usuń)</button></div>',
    actions: {
      merge(cc) { finishJoin(cc, code, false, opts); },
      fresh(cc) { finishJoin(cc, code, true, opts); },
    },
  });
}

async function finishJoin(c, code, fresh, opts) {
  try {
    await c.app.house.join(code, fresh, defaults());
  } catch (e) {
    c.toast('Nie udało się dołączyć: ' + (e && e.message));
    return;
  }
  const s = c.state;
  if (!s.startedOn) s.startedOn = today();
  s.onboarded = true;
  c.save();
  c.closeSheet(true);
  if (opts.onboarding) c.replace('home'); else c.render();
  c.peek('Jesteś w domu! Lista i wydatki są teraz wspólne.', 'happy');
}
