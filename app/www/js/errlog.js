// Ostatnie błędy apki, żeby dało się je wysłać twórcy przyciskiem „Zgłoś problem”.
// Zostają tylko w telefonie (osobno od danych apki, nie trafiają do kopii) i nie zawierają paragonów.
const KEY = 'do-pierwszego-bledy';
const MAX = 20;
let list = null;

function load() {
  if (list) return list;
  try { list = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { list = []; }
  if (!Array.isArray(list)) list = [];
  return list;
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* brak miejsca */ }
}

function text(e) {
  if (e && e.stack) return String(e.stack).split('\n').slice(0, 3).map((x) => x.trim()).join(' | ');
  if (e && e.message) return String(e.message);
  if (typeof e === 'object') { try { return JSON.stringify(e); } catch (err) { /* dalej */ } }
  return String(e);
}

export function record(msg, screen = '') {
  load();
  const m = String(msg).slice(0, 400);
  const last = list[list.length - 1];
  if (last && last.msg === m && Date.now() - Date.parse(last.t) < 60000) {
    last.n = (last.n || 1) + 1; // ten sam błąd seriami: jeden wpis z licznikiem
  } else {
    list.push({ t: new Date().toISOString(), screen, msg: m });
  }
  while (list.length > MAX) list.shift();
  persist();
}

export function errors() {
  return load().slice();
}

export function clearErrors() {
  list = [];
  persist();
}

// Zbiera błędy z console.error (tam apka zapisuje złapane błędy) i te niezłapane
export function install(screen = () => '') {
  const orig = console.error.bind(console);
  console.error = (...args) => {
    try { record(args.map(text).join(' '), screen()); } catch (e) { /* nie psuj zgłaszania */ }
    orig(...args);
  };
  window.addEventListener('error', (e) => record(text(e.error || e.message), screen()));
  window.addEventListener('unhandledrejection', (e) => record('Promise: ' + text(e.reason), screen()));
}

const two = (n) => String(n).padStart(2, '0');
function when(iso) {
  const d = new Date(iso);
  return `${two(d.getDate())}.${two(d.getMonth() + 1)} ${two(d.getHours())}:${two(d.getMinutes())}`;
}

// Treść zgłoszenia: wersja, telefon, opis od użytkownika i ostatnie błędy
export function report({ build = {}, platform = '', note = '' } = {}) {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  const android = (ua.match(/Android [\d.]+/) || [])[0];
  const ios = (ua.match(/OS (\d+[_\d]*) like Mac OS X/) || [])[1];
  const chrome = (ua.match(/Chrome\/(\d+)/) || [])[1];
  const sys = [platform, android || (ios ? 'iOS ' + ios.replace(/_/g, '.') : ''), chrome ? 'WebView/Chrome ' + chrome : ''].filter(Boolean).join(', ');
  const errs = errors().slice(-10);
  const lines = [
    `Do Pierwszego 0.1.${build.build || '?'}${build.sha ? ` (${build.sha})` : ''}${sys ? ' · ' + sys : ''}`,
    `Wysłane ${when(new Date().toISOString())}`,
    '',
    'Co się stało:',
    note.trim() || '(brak opisu)',
    '',
    errs.length ? `Ostatnie błędy (${errs.length}):` : 'Apka nie zapisała żadnych błędów.',
    ...errs.map((e) => `- ${when(e.t)}${e.screen ? ` [${e.screen}]` : ''}${e.n > 1 ? ` ×${e.n}` : ''} ${e.msg}`),
  ];
  return lines.join('\n');
}
