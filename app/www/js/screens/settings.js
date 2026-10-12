// Ustawienia: budżet, kalorie, kuchnia, sklepy, Groszek, tryb ostry, kopia danych.
import { fmt, today } from '../budget.js';
import { ui, sprite } from '../pixels.js';
import { esc, topbar, toggle, chip, settingRow, plural } from '../ui.js';
import { GEAR, AVOID, DEFAULT_CUISINES, exportJson, importJson, plugin, defaults } from '../store.js';
import { TREAT_CATS, CAT_LABEL, norm } from '../dict.js';
import { STORES } from '../offers.js';

const PAL = [
  { v: 1.4, label: 'Mało ruchu', sub: 'siedzę, mało chodzę' },
  { v: 1.6, label: 'Trochę ruchu', sub: 'chodzę, 1–2 treningi w tygodniu' },
  { v: 1.75, label: 'Sporo ruchu', sub: '3–4 treningi w tygodniu' },
  { v: 1.9, label: 'Dużo ruchu', sub: 'trening prawie codziennie' },
];
const GOALS = [{ v: -400, label: 'Chudnę' }, { v: 0, label: 'Utrzymuję' }, { v: 300, label: 'Przybieram' }];

export function kcalFromProfile(pr) {
  if (!pr || !pr.weight || !pr.height || !pr.age) return null;
  const bmr = 10 * pr.weight + 6.25 * pr.height - 5 * pr.age + (pr.sex === 'k' ? -161 : 5);
  const k = bmr * (pr.pal || 1.6) + (pr.goal || 0);
  return Math.round(k / 50) * 50;
}

function profileSheet(c) {
  const pr = { sex: 'm', age: 20, weight: 70, height: 178, pal: 1.6, goal: 0, ...(c.state.settings.profile || {}) };
  c.sheet({
    render() {
      const k = kcalFromProfile(pr);
      const num = (id, label, val, unit) => `<label class="row between"><span class="bold">${label}</span><span class="numrow"><input id="${id}" class="field small num" type="number" inputmode="decimal" value="${esc(val)}" data-in="${id}"><span class="small muted" style="width:26px">${unit}</span></span></label>`;
      return '<h3>Twój profil</h3><p style="text-align:left">Z tego policzę, ile kalorii dziennie potrzebujesz (wzór Mifflina-St Jeora).</p>' +
        `<div class="seg"><button class="${pr.sex === 'm' ? 'on' : ''}" data-act="sex" data-arg="m">Mężczyzna</button><button class="${pr.sex === 'k' ? 'on' : ''}" data-act="sex" data-arg="k">Kobieta</button></div>` +
        num('pr-age', 'Wiek', pr.age, 'lat') + num('pr-weight', 'Waga', pr.weight, 'kg') + num('pr-height', 'Wzrost', pr.height, 'cm') +
        '<span class="label">Ruch</span><div class="stack">' + PAL.map((p) => `<button class="card ${pr.pal === p.v ? 'dark' : ''}" data-act="pal" data-arg="${p.v}" style="padding:10px 14px"><b>${p.label}</b><br><span class="small ${pr.pal === p.v ? '' : 'muted'}">${p.sub}</span></button>`).join('') + '</div>' +
        '<span class="label">Cel</span><div class="seg">' + GOALS.map((g) => `<button class="${pr.goal === g.v ? 'on' : ''}" data-act="goal" data-arg="${g.v}">${g.label}</button>`).join('') + '</div>' +
        `<div class="card row between"><span>Dziennie</span><b class="pixel" style="font-size:24px">${k ? fmt(k, 0) + ' kcal' : '—'}</b></div>` +
        `<button class="btn dark block" data-act="ok" ${k ? '' : 'disabled'}>Ustaw ${k ? fmt(k, 0) + ' kcal' : ''}</button>`;
    },
    actions: {
      sex(cc, v) { pr.sex = v; cc.renderSheet(); },
      pal(cc, v) { pr.pal = Number(v); cc.renderSheet(); },
      goal(cc, v) { pr.goal = Number(v); cc.renderSheet(); },
      ok(cc) {
        const k = kcalFromProfile(pr);
        if (!k) return;
        cc.state.settings.profile = { ...pr };
        cc.state.settings.kcal = k;
        cc.save();
        cc.closeSheet(true);
        cc.render();
        cc.toast(`Cel: ${fmt(k, 0)} kcal dziennie`);
      },
    },
    inputs: {
      'pr-age': (cc, v) => { pr.age = Number(v) || 0; updateK(); },
      'pr-weight': (cc, v) => { pr.weight = Number(String(v).replace(',', '.')) || 0; updateK(); },
      'pr-height': (cc, v) => { pr.height = Number(v) || 0; updateK(); },
    },
  });
  function updateK() {
    // bez przerysowania arkusza, żeby klawiatura nie znikała
    const k = kcalFromProfile(pr);
    const root = document.getElementById('sheet-root');
    const b = root.querySelector('.card.row b.pixel');
    if (b) b.textContent = k ? fmt(k, 0) + ' kcal' : '—';
    const ok = root.querySelector('[data-act="ok"]');
    if (ok) { ok.disabled = !k; ok.textContent = 'Ustaw ' + (k ? fmt(k, 0) + ' kcal' : ''); }
  }
}

// Zapamiętane produkty w osobnym okienku z szukajką, żeby nie rozciągały ustawień
function learnedSheet(c) {
  let q = '';
  const label = (k, v) => v.name || k;
  const shown = (k, v) => !q || norm(label(k, v)).includes(q);
  c.sheet({
    render(cc) {
      const items = Object.entries(cc.state.learned || {}).sort((a, b) => label(...a).localeCompare(label(...b), 'pl'));
      if (!items.length) return '<h3>Zapamiętane produkty</h3><p>Pusto. Groszek zapyta o nieznane rzeczy, gdy włączysz tryb ostry.</p><button class="btn block" data-act="sheet-close">Zamknij</button>';
      const rows = items.map(([k, v]) => `<div class="row between learned-row" data-name="${esc(norm(label(k, v)))}" ${shown(k, v) ? '' : 'hidden'}>` +
        `<span class="grow">${esc(label(k, v))}</span>` +
        `<button class="pill" data-act="flip" data-arg="${esc(k)}" style="background:${v.treat ? 'var(--ink)' : 'var(--paper)'};color:${v.treat ? 'var(--paper)' : 'var(--ink)'}">${v.treat ? 'zachcianka' : 'podstawa'}</button>` +
        `<button class="sq" style="width:38px;height:38px;border:0" data-act="forget" data-arg="${esc(k)}" aria-label="Zapomnij ${esc(label(k, v))}">${ui('trash', 16)}</button></div>`).join('');
      const treats = items.filter(([, v]) => v.treat).length;
      return `<h3>Zapamiętane produkty</h3><p class="small muted" style="text-align:left">${items.length - treats} ${plural(items.length - treats, 'podstawa', 'podstawy', 'podstaw')} i ${treats} ${plural(treats, 'zachcianka', 'zachcianki', 'zachcianek')}. Dotknij, żeby zmienić.</p>` +
        (items.length > 6 ? `<input id="learned-q" class="field small" type="search" placeholder="Szukaj" value="${esc(q)}" data-in="q" autocomplete="off">` : '') +
        `<div class="stack" style="gap:8px">${rows}</div><button class="btn dark block" data-act="sheet-close">Gotowe</button>`;
    },
    inputs: {
      q(cc, v) {
        q = norm(v);
        document.querySelectorAll('#sheet-root .learned-row').forEach((el) => { el.hidden = !!q && !el.dataset.name.includes(q); });
      },
    },
    actions: {
      flip(cc, k) { const l = cc.state.learned[k]; if (l) { l.treat = !l.treat; l.ico = l.treat ? 'candy' : 'bag'; } cc.save(); cc.renderSheet(); cc.render(); },
      forget(cc, k) { delete cc.state.learned[k]; cc.save(); cc.renderSheet(); cc.render(); },
    },
  });
}

async function exportBackup(c) {
  const json = exportJson(c.state);
  const name = `groszek-kopia-${today()}.json`;
  const fs = plugin('Filesystem');
  const share = plugin('Share');
  if (fs && share) {
    try {
      const r = await fs.writeFile({ path: name, data: json, directory: 'CACHE', encoding: 'utf8' });
      await share.share({ title: 'Kopia Groszka', files: [r.uri], dialogTitle: 'Zapisz albo wyślij kopię' });
    } catch (e) {
      if (!/cancel/i.test(String(e && e.message))) c.toast('Nie udało się: ' + (e && e.message));
    }
    return;
  }
  // iPhone: arkusz udostępniania (zapis w Plikach, wysłanie sobie)
  try {
    const file = new File([json], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Kopia Groszka' });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

function importBackup(c) {
  const inp = document.getElementById('file-input');
  inp.value = '';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    let next;
    try {
      next = importJson(await f.text());
    } catch (e) {
      c.toast('To nie jest kopia Groszka');
      return;
    }
    c.sheet({
      mascot: 'worried',
      render: () => `<h2>Wczytać kopię?</h2><p>Obecne dane w apce zostaną zastąpione danymi z pliku (${next.expenses.length} ${plural(next.expenses.length, 'wydatek', 'wydatki', 'wydatków')}, ${next.list.length} na liście).</p>` +
        '<div class="row"><button class="btn grow" data-act="sheet-close">Anuluj</button><button class="btn dark grow" data-act="yes">Wczytaj</button></div>',
      actions: {
        yes(cc) {
          next.onboarded = true;
          cc.app.state = next;
          cc.app.applyTheme();
          cc.closeSheet(true);
          cc.save();
          cc.render();
          cc.toast('Wczytano kopię');
        },
      },
    });
  };
  inp.click();
}

export default {
  render(c) {
    const st = c.state;
    const s = st.settings;
    const cuisinesOn = DEFAULT_CUISINES.filter((k) => s.cuisines[k] !== false).length;
    const learned = Object.entries(st.learned || {});
    const build = c.app.build || {};
    const upd = c.app.update;
    const opt = (n) => `<option value="${n}" ${Number(s.monthStart) === n ? 'selected' : ''}>${n}. dzień miesiąca</option>`;

    return `
      ${topbar('Ustawienia')}

      <span class="label">Budżet</span>
      <div class="rows">
        ${settingRow('Na jedzenie miesięcznie', 'tyle możesz wydać w jednym okresie',
          `<span class="numrow"><input id="set-budget" class="field small num" type="number" inputmode="decimal" min="0" value="${esc(s.budget)}" data-ch="budget" style="width:110px"><span class="small">zł</span></span>`)}
        ${settingRow('Początek miesiąca', 'np. dzień wypłaty albo stypendium',
          `<select id="set-start" class="field small" data-ch="monthStart" style="width:170px">${Array.from({ length: 28 }, (_, i) => opt(i + 1)).join('')}</select>`)}
      </div>

      <span class="label">Jedzenie</span>
      <div class="rows">
        ${settingRow('Kalorie dziennie', s.profile ? 'policzone z profilu' : 'wpisz albo policz z profilu',
          `<span class="numrow"><input id="set-kcal" class="field small num" type="number" inputmode="numeric" min="800" max="6000" value="${esc(s.kcal)}" data-ch="kcal" style="width:100px"><span class="small">kcal</span></span>`)}
        <div class="item"><button class="btn small block" data-act="profile">Policz z profilu (wiek, waga, ruch)</button></div>
        <div class="item col"><div class="stack" style="gap:2px"><span class="name">Sprzęt w kuchni</span><span class="sub">przepisy dopasuję do tego, co masz</span></div>
          <div class="wrap">${GEAR.map((g) => chip('gear', g, !!s.gear[g], g)).join('')}</div></div>
        <div class="item col"><div class="stack" style="gap:2px"><span class="name">Nie jem</span><span class="sub">takich przepisów nie podsunę</span></div>
          <div class="wrap">${AVOID.map((g) => chip('avoid', g, !!s.avoid[g], g)).join('')}</div></div>
        <div class="item col"><div class="row between"><div class="stack" style="gap:2px"><span class="name">Kuchnie świata</span><span class="sub">${cuisinesOn} z ${DEFAULT_CUISINES.length} włączonych</span></div></div>
          <div class="row"><button class="btn small grow" data-act="cuisAll">Zaznacz wszystkie</button><button class="btn small grow" data-act="cuisNone">Odznacz wszystkie</button></div>
          <div class="wrap">${DEFAULT_CUISINES.map((k) => chip('cuis', k, s.cuisines[k] !== false, k)).join('')}</div></div>
      </div>

      <span class="label">Sklepy</span>
      <div class="rows">
        ${['kaufland', 'lidl', 'aldi'].map((id) => settingRow(STORES[id], 'promocje z tego sklepu', toggle('store', s.stores[id] !== false, STORES[id], id))).join('')}
        ${settingRow('Biedronka', 'wkrótce: promocje są tylko jako obrazki', '<span class="pill dashed">wkrótce</span>')}
      </div>

      <span class="label">Groszek</span>
      <div class="rows">
        ${settingRow('Groszek zza rogu', 'wygląda przy zmianie ekranu i coś podpowiada', toggle('peek', !!s.peek, 'Groszek zza rogu'))}
        <div class="item col"><span class="name">Wygląd</span>
          <div class="seg">${[['system', 'Jak telefon'], ['light', 'Jasny'], ['dark', 'Ciemny']].map(([v, l]) => `<button class="${s.theme === v ? 'on' : ''}" data-act="theme" data-arg="${v}">${l}</button>`).join('')}</div></div>
      </div>

      <span class="label">Tryb ostry</span>
      <div class="rows">
        ${settingRow(`<span class="row" style="gap:8px">${sprite('angry', 26)} Tryb ostry</span>`, 'Groszek nie pozwoli dopisać zachcianek do listy', toggle('strict', !!s.strict, 'Tryb ostry'))}
        ${TREAT_CATS.map((k) => settingRow(esc(CAT_LABEL[k]), '', toggle('strictCat', !!s.strictCats[k], CAT_LABEL[k], k))).join('')}
        ${settingRow('Zapamiętane produkty', learned.length ? `${learned.length} ${plural(learned.length, 'produkt', 'produkty', 'produktów')} · podstawy i zachcianki` : 'jeszcze nic. Groszek zapyta o nieznane rzeczy, gdy włączysz tryb ostry',
          learned.length ? '<button class="btn small" data-act="learnedSheet">Pokaż</button>' : '')}
      </div>

      <span class="label">Kopia danych</span>
      <div class="rows">
        <div class="item col"><span class="sub">Wszystko jest tylko w tym telefonie. Zrób kopię, zanim zmienisz telefon albo odinstalujesz apkę.</span>
          <div class="row"><button class="btn small grow" data-act="export">${ui('share', 14)} Zapisz kopię</button><button class="btn small grow" data-act="import">Wczytaj kopię</button></div></div>
      </div>

      <span class="label">O apce</span>
      <div class="rows">
        ${c.app.native && !c.app.native()
          ? settingRow('Wersja', `Groszek ${esc(build.build || 0)} · aktualizuje się sama`, '')
          : settingRow('Wersja', `Groszek 0.1.${esc(build.build || 0)}${upd ? (upd.newer ? ' · jest nowsza wersja!' : ' · masz najnowszą') : ''}`,
            upd && upd.newer ? '<button class="btn small dark" data-act="update">Pobierz</button>' : '<button class="btn small" data-act="checkUpd">Sprawdź</button>')}
        ${settingRow('Odśwież dane', 'promocje i przepisy z GitHuba', `<button class="btn small" data-act="refresh">${ui('refresh', 14)}</button>`)}
        <div class="item col"><span class="sub">Promocje: strony Kauflandu, Lidla i Aldi, pobierane automatycznie dwa razy w tygodniu. Wartości odżywcze: USDA FoodData Central. Ceny składników są szacunkowe, a te z promocji pochodzą ze sklepów.</span></div>
        <div class="item"><button class="btn small block" data-act="reset">Wyczyść wszystkie dane</button></div>
      </div>
    `;
  },

  changes: {
    budget(c, v) {
      const n = Math.max(0, Math.round(Number(String(v).replace(',', '.')) || 0));
      c.state.settings.budget = n;
      c.save();
      c.toast(`Budżet: ${fmt(n, 0)} zł`);
    },
    monthStart(c, v) { c.state.settings.monthStart = Number(v) || 1; c.save(); },
    kcal(c, v) {
      const n = Math.max(800, Math.min(6000, Math.round(Number(v) || 2000)));
      c.state.settings.kcal = n;
      c.save();
      c.render();
    },
  },

  actions: {
    profile(c) { profileSheet(c); },
    gear(c, g) { c.state.settings.gear[g] = !c.state.settings.gear[g]; c.save(); c.render(); },
    avoid(c, g) { c.state.settings.avoid[g] = !c.state.settings.avoid[g]; c.save(); c.render(); },
    cuis(c, k) { const s = c.state.settings; s.cuisines[k] = s.cuisines[k] === false; c.save(); c.render(); },
    cuisAll(c) { for (const k of DEFAULT_CUISINES) c.state.settings.cuisines[k] = true; c.save(); c.render(); },
    cuisNone(c) { for (const k of DEFAULT_CUISINES) c.state.settings.cuisines[k] = false; c.save(); c.render(); },
    store(c, id) { const s = c.state.settings; s.stores[id] = s.stores[id] === false; c.save(); c.render(); },
    peek(c) {
      const s = c.state.settings;
      s.peek = !s.peek;
      c.save();
      c.render();
      if (s.peek) c.peek('Hej, jestem! Będę zaglądać od czasu do czasu.', 'happy'); else c.peek('');
    },
    theme(c, v) { c.state.settings.theme = v; c.save(); c.app.applyTheme(); c.render(); },
    strict(c) {
      const s = c.state.settings;
      s.strict = !s.strict;
      c.save();
      c.render();
      if (s.strict) c.peek('Tryb ostry włączony. Żadnych zachcianek!', 'angry');
    },
    strictCat(c, k) { const s = c.state.settings; s.strictCats[k] = !s.strictCats[k]; c.save(); c.render(); },
    learnedSheet(c) { learnedSheet(c); },
    export(c) { exportBackup(c); },
    import(c) { importBackup(c); },
    async checkUpd(c) {
      c.toast('Sprawdzam…');
      const u = await c.app.checkForUpdate();
      if (!u) c.toast('Brak internetu');
      else c.toast(u.newer ? 'Jest nowa wersja!' : 'Masz najnowszą wersję');
      c.render();
    },
    async refresh(c) {
      c.toast('Pobieram…');
      const r = await c.refreshData(true);
      c.toast(Object.values(r).some(Boolean) ? 'Dane odświeżone' : 'Brak internetu');
    },
    reset(c) {
      c.sheet({
        mascot: 'worried',
        render: () => '<h2>Na pewno wyczyścić wszystko?</h2><p>Znikną wydatki, lista, plan i poziom. Tego nie da się cofnąć, chyba że masz kopię.</p>' +
          '<div class="row"><button class="btn grow" data-act="sheet-close">Zostaw</button><button class="btn dark grow" data-act="yes">Wyczyść</button></div>',
        actions: {
          yes(cc) {
            cc.app.state = defaults();
            cc.app.applyTheme();
            cc.closeSheet(true);
            cc.save();
            cc.app.stack = [{ name: 'onboarding', params: {}, scroll: 0, key: 'root2' }];
            cc.render();
          },
        },
      });
    },
  },

  peek: () => ({ text: 'Tu ustawisz budżet, kuchnię i tryb ostry.', mood: 'pea' }),
};
