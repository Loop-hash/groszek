// Do Pierwszego: start apki, nawigacja między ekranami, arkusze, dymki i przycisk wstecz.
import * as store from './store.js';
import * as dataApi from './data.js';
import { esc } from './ui.js';
import { sprite } from './pixels.js';
import { today, period, previousPeriod } from './budget.js';
import { screens } from './screens/index.js';

const app = {
  state: null,
  data: {},
  stack: [],
  sheetCfg: null,
  build: { build: 0 },
  update: null,
  fact: null, // ciekawostka Groszosława na starcie: { i, at }
  factPending: false,
  factTimer: null,
  hiddenAt: 0,
  day: today(),
};
window.groszek = app; // pomocne przy szukaniu błędów

const $ = (id) => document.getElementById(id);

function top() { return app.stack[app.stack.length - 1]; }

function ctx(entry = top()) {
  return {
    app,
    state: app.state,
    data: app.data,
    params: entry ? entry.params : {},
    entry,
    go, back, replace, render, save, toast, sheet, closeSheet, renderSheet, peek, openUrl,
    refreshData,
  };
}

export function save() { store.save(app.state); }

// ---------- nawigacja ----------

export function go(name, params = {}, opts = {}) {
  const cur = top();
  const scr = document.querySelector('#app .screen');
  if (cur && scr) { cur.scroll = scr.scrollTop; cur.hscroll = hScroll(scr); }
  app.stack.push({ name, params: { ...params }, scroll: 0, key: Math.random().toString(36).slice(2) });
  closeSheet(true);
  render();
}

export function replace(name, params = {}) {
  app.stack.pop();
  app.stack.push({ name, params: { ...params }, scroll: 0, key: Math.random().toString(36).slice(2) });
  closeSheet(true);
  render();
}

export function back() {
  if (app.sheetCfg) { closeSheet(); return true; }
  if (app.stack.length > 1) {
    const leaving = top();
    const s = screens[leaving.name];
    if (s && s.onLeave) s.onLeave(ctx(leaving));
    app.stack.pop();
    render();
    return true;
  }
  return false;
}

// poziome paski z chipami (kraje, sklepy): zapamiętaj przewinięcie, bo innerHTML wraca je na początek
function hScroll(el) {
  return [...el.querySelectorAll('.scroller')].map((x) => x.scrollLeft);
}

export function render() {
  const entry = top();
  if (!entry) return;
  const s = screens[entry.name] || screens.home;
  const root = $('app');
  let el = root.querySelector('.screen');
  const same = el && el.dataset.key === entry.key;
  const scroll = same ? el.scrollTop : (entry.scroll || 0);
  const hscroll = same ? hScroll(el) : (entry.hscroll || []);
  // zapamiętaj pole z kursorem, żeby po odświeżeniu dało się dalej pisać
  const active = document.activeElement;
  const focusId = active && active.id && root.contains(active) ? active.id : null;
  let selStart = null;
  let selEnd = null;
  if (focusId) { try { selStart = active.selectionStart; selEnd = active.selectionEnd; } catch (e) { /* pole bez zaznaczenia */ } }

  let html;
  try {
    html = s.render(ctx(entry));
  } catch (e) {
    console.error(e);
    html = `<div class="empty-state">Coś poszło nie tak na tym ekranie.<br><span class="small muted">${esc(e && e.message)}</span></div>` +
      '<button class="btn block" data-act="home">Wróć na start</button>';
  }
  if (!same) {
    el = document.createElement('main');
    el.className = 'screen';
    el.dataset.key = entry.key;
    el.dataset.name = entry.name;
    root.replaceChildren(el);
  }
  el.innerHTML = html;
  el.scrollTop = scroll;
  el.querySelectorAll('.scroller').forEach((x, i) => { if (hscroll[i]) x.scrollLeft = hscroll[i]; });
  if (focusId) {
    const f = document.getElementById(focusId);
    if (f) {
      f.focus({ preventScroll: true });
      if (selStart != null) { try { f.setSelectionRange(selStart, selEnd); } catch (e) { /* pole liczbowe */ } }
    }
  }
  if (s.mounted) s.mounted(ctx(entry), el, !same);
}

// ---------- arkusz od dołu ----------

export function sheet(cfg) {
  app.sheetCfg = cfg;
  renderSheet(true);
}

export function renderSheet(first = false) {
  const root = $('sheet-root');
  const cfg = app.sheetCfg;
  if (!cfg) { root.innerHTML = ''; return; }
  const body = cfg.render(ctx());
  if (!first && root.querySelector('.sheet-body')) {
    const sb = root.querySelector('.sheet-body');
    const h = hScroll(sb);
    const v = sb.scrollTop;
    sb.innerHTML = body;
    sb.querySelectorAll('.scroller').forEach((x, i) => { if (h[i]) x.scrollLeft = h[i]; });
    sb.scrollTop = v;
    return;
  }
  const mascot = cfg.mascot
    ? `<div class="mascot ${cfg.shake ? 'shake' : ''}">${sprite(cfg.mascot, 168)}</div>` : '';
  root.innerHTML = `<div class="veil" data-act="sheet-close"></div>` +
    `<section class="sheet ${cfg.mascot ? '' : 'plain'}" role="dialog" aria-modal="true">${mascot}<div class="sheet-body">${body}</div></section>`;
  if (cfg.mounted) cfg.mounted(ctx(), root);
}

export function closeSheet(silent = false) {
  const cfg = app.sheetCfg;
  app.sheetCfg = null;
  $('sheet-root').innerHTML = '';
  if (cfg && cfg.onClose && !silent) cfg.onClose(ctx());
}

// ---------- dymek i toast ----------

let toastTimer = null;
export function toast(text) {
  const root = $('toast-root');
  root.innerHTML = `<div class="toast" role="status">${esc(text)}</div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { root.innerHTML = ''; }, 2600);
}

// Krótkie komunikaty po akcjach (dawniej dymek Groszka zza rogu, który zasłaniał przyciski)
export function peek(text) {
  if (text) toast(text);
}

// ---------- aktualizacja ----------

const mb = (b) => (b / 1048576).toFixed(b < 10485760 ? 1 : 0).replace('.', ',');

// Aktualizacja jednym przyciskiem. Gdy część androidowa się nie zmieniła, apka pobiera samą
// stronę (zwykle poniżej 1 MB) i przeładowuje się na nią: Android o nic nie pyta. Inaczej pobiera
// APK i instaluje je w tle (Android 12+ nie pyta o zgodę). Po takiej instalacji Android zamyka apkę
// i nie pozwala jej otworzyć się samej, więc trzeba dotknąć ikonki.
export async function installUpdate() {
  const u = app.update;
  if (!u) return;
  const up = store.plugin('Updater');
  if (!up || !/\.apk(\?|$)/.test(u.url || '')) { openUrl(u.url); return; }
  let info = {};
  try { info = (await up.info()) || {}; } catch (e) { /* starsza wersja wtyczki */ }
  const sameNative = !!(u.web && u.native && info.native && u.native === info.native);
  if (sameNative && Number(info.badWeb) !== Number(u.build)) { webUpdate(up, u); return; }
  let can = true;
  try { can = (await up.canInstall()).allowed !== false; } catch (e) { /* starsza wersja wtyczki */ }
  if (!can) {
    sheet({
      mascot: 'pea',
      render: () => '<h2>Jedno pozwolenie</h2><p>Android musi pozwolić apce instalować aktualizacje. ' +
        'W ustawieniach włącz „Zezwalaj z tego źródła” i wróć tutaj. To tylko raz.</p>' +
        '<div class="row"><button class="btn grow" data-act="open">Otwórz ustawienia</button><button class="btn dark grow" data-act="go">Aktualizuj</button></div>',
      actions: {
        open() { up.openInstallSettings().catch(() => {}); },
        async go() {
          let ok = true;
          try { ok = (await up.canInstall()).allowed !== false; } catch (e) { /* dalej */ }
          if (!ok) { toast('Najpierw włącz pozwolenie w ustawieniach'); return; }
          closeSheet(true);
          installUpdate();
        },
      },
    });
    return;
  }
  apkUpdate(up, u, info);
}
app.installUpdate = installUpdate;

function updateSheet(title, note) {
  const cfg = {
    mascot: 'pea',
    render: () => `<h2>${title}</h2><p id="upd-status">zaczynam</p>` +
      '<div class="bar"><div class="fill" id="upd-bar" style="width:3%"></div></div>' +
      `<p class="tiny" id="upd-note">${note}</p>`,
    actions: {},
  };
  sheet(cfg);
  return cfg;
}

function updateText(status, note) {
  const st = $('upd-status');
  if (st && status != null) st.textContent = status;
  const nt = $('upd-note');
  if (nt && note != null) nt.textContent = note;
}

function onProgress(e) {
  const bar = $('upd-bar');
  if (bar && e.progress >= 0) bar.style.width = Math.max(3, e.progress) + '%';
  const what = e.phase === 'vendor' ? 'czytnik paragonów: ' : '';
  if (e.total > 0) updateText(`${what}${mb(e.done)} z ${mb(e.total)} MB`);
}

async function webUpdate(up, u) {
  const cfg = updateSheet('Aktualizuję apkę…', 'Za chwilę uruchomi się ponownie. Twoje dane zostają.');
  let handle = null;
  try {
    handle = await up.addListener('progress', onProgress);
    await store.flush();
    await up.applyWeb({
      url: u.web.url, size: u.web.size || 0, build: Number(u.build),
      vendorUrl: u.vendor ? u.vendor.url : '', vendorSize: u.vendor ? u.vendor.size || 0 : 0,
    });
    const bar = $('upd-bar');
    if (bar) bar.style.width = '100%';
    updateText('Gotowe, uruchamiam ponownie…');
    await store.flush();
  } catch (e) {
    if (app.sheetCfg === cfg) closeSheet(true);
    toast((e && e.message) || 'Nie udało się pobrać aktualizacji');
  } finally {
    if (handle) handle.remove();
  }
}

async function apkUpdate(up, u, info) {
  const silent = info && info.silent;
  const cfg = updateSheet('Pobieram nową wersję…', silent
    ? 'Tym razem zmieniła się część androidowa: apka zainstaluje się w tle i zamknie. Potem otwórz ją ikonką.'
    : 'Potem Android poprosi o zgodę na instalację.');
  let handle = null;
  let statusHandle = null;
  try {
    handle = await up.addListener('progress', onProgress);
    try {
      statusHandle = await up.addListener('status', (e) => {
        if (e.state === 'confirm') updateText('Potwierdź instalację w okienku Androida', '');
        if (e.state === 'failed') {
          if (app.sheetCfg === cfg) closeSheet(true);
          toast('Nie udało się zainstalować' + (e.message ? ': ' + e.message : ''));
        }
      });
    } catch (e) { /* starsza wersja wtyczki */ }
    await store.flush();
    if (u.size) updateText(`0 z ${mb(u.size)} MB`);
    await up.downloadAndInstall({ url: u.url, size: u.size || 0 });
    const bar = $('upd-bar');
    if (bar) bar.style.width = '100%';
    updateText('Instaluję…', silent ? 'Za chwilę apka się zamknie. Otwórz ją ponownie ikonką.' : '');
    await store.flush();
  } catch (e) {
    if (app.sheetCfg === cfg) closeSheet(true);
    toast((e && e.message) || 'Nie udało się pobrać');
  } finally {
    if (handle) handle.remove();
  }
  // statusHandle zostaje: odpowiedź instalatora przychodzi później
  void statusHandle;
}

// ---------- wersja w przeglądarce (iPhone) ----------

// Service worker trzyma apkę w telefonie, więc działa bez internetu i sama się aktualizuje.
function registerWebApp() {
  const local = location.hostname === 'localhost';
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || local)) {
    navigator.serviceWorker.register('sw.js').catch((e) => console.error('sw: ' + (e && e.message)));
  }
  // dane w przeglądarce mają nie znikać przy porządkach w pamięci
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}

// ---------- linki zewnętrzne ----------

function native() {
  return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

export function openUrl(url) {
  // W apce zmiana adresu na obcą stronę otwiera przeglądarkę telefonu.
  if (native()) window.location.href = url;
  else window.open(url, '_blank', 'noopener');
}

// ---------- zdarzenia ----------

const GLOBAL = {
  back: () => back(),
  home: () => { app.stack = [app.stack[0]]; render(); },
  go: (c, arg) => go(arg),
  'sheet-close': () => closeSheet(),
  url: (c, arg) => openUrl(arg),
  update: () => installUpdate(),
};

function handlersFor(el) {
  if (el.closest('#sheet-root') && app.sheetCfg) return [app.sheetCfg, GLOBAL];
  const s = screens[top().name] || {};
  return [s, GLOBAL];
}

function onClick(ev) {
  const t = ev.target.closest('[data-act]');
  if (!t) return;
  const act = t.dataset.act;
  const [own, global] = handlersFor(t);
  const fn = (own.actions && own.actions[act]) || global[act];
  if (!fn) return;
  ev.preventDefault();
  try { fn(ctx(), t.dataset.arg, t, ev); } catch (e) { console.error(e); toast('Ups: ' + e.message); }
}

function onInput(ev) {
  const t = ev.target.closest('[data-in]');
  if (!t) return;
  const [own] = handlersFor(t);
  const fn = own.inputs && own.inputs[t.dataset.in];
  if (fn) fn(ctx(), t.value, t, ev);
}

function onChange(ev) {
  const t = ev.target.closest('[data-ch]');
  if (!t) return;
  const [own] = handlersFor(t);
  const fn = own.changes && own.changes[t.dataset.ch];
  if (fn) fn(ctx(), t.value, t, ev);
}

function onSubmit(ev) {
  const t = ev.target.closest('form[data-submit]');
  if (!t) return;
  ev.preventDefault();
  const [own] = handlersFor(t);
  const fn = own.actions && own.actions[t.dataset.submit];
  if (fn) fn(ctx(), '', t, ev);
}

// ---------- motyw ----------

export function applyTheme() {
  const th = app.state.settings.theme;
  const root = document.documentElement;
  if (th === 'light' || th === 'dark') root.dataset.theme = th; else delete root.dataset.theme;
  if (app.state.settings.accent) root.dataset.accent = 'red'; else delete root.dataset.accent;
  const dark = th === 'dark' || (th !== 'light' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = dark ? '#121211' : '#FAFAF7';
  const bars = store.plugin('SystemBars');
  if (bars) { try { bars.setStyle({ style: dark ? 'DARK' : 'LIGHT' }).catch(() => {}); } catch (e) { /* starsza wersja */ } }
}
app.applyTheme = applyTheme;

// ---------- dane z sieci ----------

export async function refreshData(force = false) {
  const res = await dataApi.refresh(app.data, force);
  if (Object.values(res).some(Boolean)) render();
  return res;
}

async function checkForUpdate() {
  if (!native()) return; // wersja z przeglądarki (iPhone) aktualizuje się sama
  const last = Number(await store.kvGet('groszek-update-check')) || 0;
  if (Date.now() - last < 6 * 3600000 && app.update) return;
  const u = await dataApi.checkUpdate(app.build.build);
  if (u) {
    app.update = u;
    await store.kvSet('groszek-update-check', String(Date.now()));
    if (u.newer) render();
  }
}
app.native = native;
app.checkForUpdate = async () => {
  if (!native()) return null;
  const u = await dataApi.checkUpdate(app.build.build);
  if (u) app.update = u;
  return u;
};

// Podsumowanie miesiąca po jego końcu
function maybeSummary() {
  const st = app.state;
  if (!st.onboarded) return;
  const p = period(today(), st.settings.monthStart);
  if (st.seenSummary === p.start) return;
  const prev = previousPeriod(p, st.settings.monthStart);
  const had = st.expenses.some((e) => e.date >= prev.start && e.date <= prev.end);
  if (!had) { st.seenSummary = p.start; save(); return; }
  if (screens.level && screens.level.summarySheet) screens.level.summarySheet(ctx(), prev, p.start);
}

// Powrót do apki po co najmniej 30 minutach liczy się jak nowe otwarcie (nowa ciekawostka)
const AWAY = 30 * 60000;

function onResume() {
  const d = today();
  const away = app.hiddenAt && Date.now() - app.hiddenAt >= AWAY;
  app.hiddenAt = 0;
  if (away && !app.fact) app.factPending = true;
  if (d !== app.day) { app.day = d; render(); maybeSummary(); } else if (top() && top().name === 'home') render();
  refreshData(false);
  checkForUpdate().catch(() => {});
}

// ---------- start ----------

async function boot() {
  app.state = await store.load();
  applyTheme();
  try {
    const r = await fetch('build.json', { cache: 'no-store' });
    if (r.ok) app.build = await r.json();
  } catch (e) { /* wersja z przeglądarki */ }
  app.data = await dataApi.loadLocal();
  app.stack = [{ name: app.state.onboarded ? 'home' : 'onboarding', params: {}, scroll: 0, key: 'root' }];
  render();
  app.factPending = true; // ciekawostka przy otwarciu apki

  document.addEventListener('click', onClick);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  document.addEventListener('submit', onSubmit);
  // Groszek zza rogu nigdy nie blokuje przycisków: znika przy pierwszym dotknięciu albo przewinięciu
  // pole z kursorem przewijane na środek, żeby klawiatura go nie zasłoniła
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (!el || !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.type === 'file') return;
    setTimeout(() => {
      try {
        const r = el.getBoundingClientRect();
        const h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
        if (r.bottom > h - 16 || r.top < 0) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } catch (err) { /* stary WebView */ }
    }, 350);
  });
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', applyTheme);
  }

  if (!native()) registerWebApp();

  // po aktualizacji pobrany plik nie jest już potrzebny, a nowa strona wystartowała poprawnie
  const upd = store.plugin('Updater');
  if (upd) {
    upd.cleanup().catch(() => {});
    try { upd.webReady().catch(() => {}); } catch (e) { /* starsza wersja wtyczki */ }
  }

  const App = store.plugin('App');
  if (App) {
    App.addListener('backButton', () => { if (!back()) App.exitApp(); });
    App.addListener('resume', onResume);
    App.addListener('pause', () => { app.hiddenAt = app.hiddenAt || Date.now(); store.flush(); });
  } else {
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') back(); });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { app.hiddenAt = app.hiddenAt || Date.now(); store.flush(); } else onResume();
  });

  maybeSummary();
  refreshData(false).catch(() => {});
  checkForUpdate().catch(() => {});
}

boot().catch((e) => {
  console.error(e);
  $('app').innerHTML = `<main class="screen"><div class="empty-state">Apka nie wystartowała.<br><span class="small">${esc(e && e.message)}</span></div></main>`;
});
