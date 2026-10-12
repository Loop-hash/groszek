// Groszek: start apki, nawigacja między ekranami, arkusze, dymki i przycisk wstecz.
import * as store from './store.js';
import * as dataApi from './data.js';
import { sprite } from './pixels.js';
import { esc } from './ui.js';
import { today, period, previousPeriod } from './budget.js';
import { screens } from './screens/index.js';

const app = {
  state: null,
  data: {},
  stack: [],
  sheetCfg: null,
  build: { build: 0 },
  update: null,
  peekTimer: null,
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
  if (!opts.quiet) peekFor(name);
}

export function replace(name, params = {}) {
  app.stack.pop();
  app.stack.push({ name, params: { ...params }, scroll: 0, key: Math.random().toString(36).slice(2) });
  closeSheet(true);
  render();
  peekFor(name);
}

export function back() {
  if (app.sheetCfg) { closeSheet(); return true; }
  if (app.stack.length > 1) {
    const leaving = top();
    const s = screens[leaving.name];
    if (s && s.onLeave) s.onLeave(ctx(leaving));
    app.stack.pop();
    render();
    peekFor(top().name);
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

function peekFor(name) {
  const s = screens[name];
  if (!s || !s.peek) { hidePeek(true); return; }
  let p = null;
  try { p = s.peek(ctx()); } catch (e) { p = null; }
  if (!p) { hidePeek(true); return; }
  if (typeof p === 'string') p = { text: p };
  peek(p.text, p.mood);
}

export function peek(text, mood = 'pea') {
  const root = $('peek-root');
  clearTimeout(app.peekTimer);
  if (!app.state.settings.peek || !text) { root.innerHTML = ''; return; }
  root.innerHTML = `<div class="bubble" role="status">${esc(text)}</div>` +
    `<button class="peek" data-act="peek-hide" aria-label="Schowaj Groszka">${sprite(mood, 144)}</button>`;
  app.peekTimer = setTimeout(() => hidePeek(), 9000);
}

function hidePeek(now = false) {
  const root = $('peek-root');
  clearTimeout(app.peekTimer);
  const p = root.querySelector('.peek');
  if (!p || now) { root.innerHTML = ''; return; }
  const b = root.querySelector('.bubble');
  if (b) b.classList.add('hide');
  p.classList.add('hide');
  setTimeout(() => { if (p.isConnected) root.innerHTML = ''; }, 420);
}

// ---------- aktualizacja ----------

const mb = (b) => (b / 1048576).toFixed(b < 10485760 ? 1 : 0).replace('.', ',');

// Nowa wersja pobiera się do pamięci apki (jeden plik, nadpisywany) i od razu otwiera instalator.
// Przez przeglądarkę każde pobranie zostawiało kolejny groszek.apk w Pobranych.
export async function installUpdate() {
  const u = app.update;
  if (!u) return;
  const up = store.plugin('Updater');
  if (!up || !/\.apk(\?|$)/.test(u.url || '')) { openUrl(u.url); return; }
  let can = true;
  try { can = (await up.canInstall()).allowed !== false; } catch (e) { /* starsza wersja wtyczki */ }
  if (!can) {
    sheet({
      mascot: 'pea',
      render: () => '<h2>Jedno pozwolenie</h2><p>Android musi pozwolić Groszkowi instalować aktualizacje. ' +
        'W ustawieniach włącz „Zezwalaj z tego źródła” i wróć tutaj.</p>' +
        '<div class="row"><button class="btn grow" data-act="open">Otwórz ustawienia</button><button class="btn dark grow" data-act="go">Pobierz</button></div>',
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
  const cfg = {
    mascot: 'pea',
    render: () => `<h2>Pobieram nową wersję…</h2><p id="upd-status">${u.size ? `0 z ${mb(u.size)} MB` : 'zaczynam'}</p>` +
      '<div class="bar"><div class="fill" id="upd-bar" style="width:3%"></div></div>' +
      '<p class="tiny">Plik zostaje w apce, a nie w Pobranych, i znika po instalacji.</p>',
    actions: {},
  };
  sheet(cfg);
  let handle = null;
  try {
    handle = await up.addListener('progress', (e) => {
      const bar = $('upd-bar');
      const st = $('upd-status');
      if (bar && e.progress >= 0) bar.style.width = Math.max(3, e.progress) + '%';
      if (st && e.total > 0) st.textContent = `${mb(e.done)} z ${mb(e.total)} MB`;
    });
    await up.downloadAndInstall({ url: u.url, size: u.size || 0 });
    if (app.sheetCfg === cfg) closeSheet(true);
    toast('Zatwierdź instalację w okienku Androida');
  } catch (e) {
    if (app.sheetCfg === cfg) closeSheet(true);
    toast((e && e.message) || 'Nie udało się pobrać');
  } finally {
    if (handle) handle.remove();
  }
}
app.installUpdate = installUpdate;

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
  'peek-hide': () => hidePeek(),
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
  const last = Number(await store.kvGet('groszek-update-check')) || 0;
  if (Date.now() - last < 6 * 3600000 && app.update) return;
  const u = await dataApi.checkUpdate(app.build.build);
  if (u) {
    app.update = u;
    await store.kvSet('groszek-update-check', String(Date.now()));
    if (u.newer) render();
  }
}
app.checkForUpdate = async () => {
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

function onResume() {
  const d = today();
  if (d !== app.day) { app.day = d; render(); maybeSummary(); }
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
  if (app.state.onboarded) peekFor('home');

  document.addEventListener('click', onClick);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  document.addEventListener('submit', onSubmit);
  // Groszek zza rogu nigdy nie blokuje przycisków: znika przy pierwszym dotknięciu albo przewinięciu
  const hideIfPeeking = () => { if ($('peek-root').firstChild) hidePeek(); };
  document.addEventListener('pointerdown', hideIfPeeking, true);
  document.addEventListener('scroll', hideIfPeeking, true);
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

  // po aktualizacji pobrany plik nie jest już potrzebny
  const upd = store.plugin('Updater');
  if (upd) upd.cleanup().catch(() => {});

  const App = store.plugin('App');
  if (App) {
    App.addListener('backButton', () => { if (!back()) App.exitApp(); });
    App.addListener('resume', onResume);
    App.addListener('pause', () => store.flush());
  } else {
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') back(); });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) store.flush(); else onResume();
  });

  maybeSummary();
  refreshData(false).catch(() => {});
  checkForUpdate().catch(() => {});
}

boot().catch((e) => {
  console.error(e);
  $('app').innerHTML = `<main class="screen"><div class="empty-state">Groszek nie wystartował.<br><span class="small">${esc(e && e.message)}</span></div></main>`;
});
