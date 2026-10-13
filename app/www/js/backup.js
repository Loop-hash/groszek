// Automatyczna kopia danych: na Androidzie raz w tygodniu plik w folderze Dokumenty/Do Pierwszego
// (zostaje nawet po odinstalowaniu apki). Na iPhonie apka nie może sama zapisywać plików,
// więc tylko przypomina o kopii, gdy dawno jej nie było.
import { exportJson, plugin } from './store.js';
import { today, addDays } from './budget.js';

export const DIR = 'Do Pierwszego';
const EVERY = 7; // dni między kopiami automatycznymi
const KEEP = 4; // tyle ostatnich kopii zostaje w folderze
const REMIND = 14; // po tylu dniach bez żadnej kopii pojawia się przypomnienie
const FILE = /^do-pierwszego-kopia-\d{4}-\d\d-\d\d\.json$/;

export const fileName = (d = today()) => `do-pierwszego-kopia-${d}.json`;

function info(st) {
  if (!st.backup || typeof st.backup !== 'object') st.backup = {};
  return st.backup;
}

// Ostatnia udana kopia (automatyczna albo ręczna), data albo null
export function lastBackup(st) {
  const b = info(st);
  return [b.auto, b.manual].filter(Boolean).sort().pop() || null;
}

// Czy jest co chronić: kilka wydatków albo produktów z paragonów
function worthIt(st) {
  return (st.expenses || []).length >= 3 || Object.keys(st.prices || {}).length >= 5;
}

export function canAuto() {
  return !!plugin('Filesystem');
}

// Zapisuje kopię, gdy minął tydzień od poprzedniej (albo od razu z force). Zwraca nazwę pliku albo null.
export async function autoBackup(st, force = false) {
  const b = info(st);
  if (st.settings.autoBackup === false && !force) return null;
  const fs = plugin('Filesystem');
  if (!fs) return null;
  if (!force && (!worthIt(st) || (b.auto && addDays(b.auto, EVERY) > today()))) return null;
  const name = fileName();
  try {
    await fs.writeFile({ path: `${DIR}/${name}`, data: exportJson(st), directory: 'DOCUMENTS', encoding: 'utf8', recursive: true });
  } catch (e) {
    b.error = String((e && e.message) || e).slice(0, 120);
    b.errorOn = today();
    throw e;
  }
  b.auto = today();
  delete b.error;
  delete b.errorOn;
  // starsze kopie: zostaje kilka ostatnich
  try {
    const r = await fs.readdir({ path: DIR, directory: 'DOCUMENTS' });
    const names = (r.files || []).map((f) => (typeof f === 'string' ? f : f.name)).filter((n) => FILE.test(n)).sort();
    for (const n of names.slice(0, -KEEP)) {
      try { await fs.deleteFile({ path: `${DIR}/${n}`, directory: 'DOCUMENTS' }); } catch (e) { /* plik z poprzedniej instalacji */ }
    }
  } catch (e) { /* sprzątanie nie jest konieczne */ }
  return name;
}

// Przypomnienie na ekranie startowym: dawno bez kopii, a automatyczna nie działa (iPhone, błąd, wyłączona)
export function needsReminder(st) {
  if (!worthIt(st)) return false;
  const b = info(st);
  if (b.snooze && b.snooze > today()) return false;
  const last = lastBackup(st);
  return !last || addDays(last, REMIND) <= today();
}

export function snooze(st) {
  info(st).snooze = addDays(today(), EVERY);
}

export function markManual(st) {
  info(st).manual = today();
}

// Ręczna kopia: arkusz udostępniania (zapis w plikach, wysłanie sobie mailem albo na dysk)
export async function shareBackup(c) {
  const st = c.state;
  const json = exportJson(st);
  const name = fileName();
  const fs = plugin('Filesystem');
  const share = plugin('Share');
  if (fs && share) {
    try {
      const r = await fs.writeFile({ path: name, data: json, directory: 'CACHE', encoding: 'utf8' });
      await share.share({ title: 'Kopia danych Do Pierwszego', files: [r.uri], dialogTitle: 'Zapisz albo wyślij kopię' });
      markManual(st);
      c.save();
    } catch (e) {
      if (!/cancel/i.test(String(e && e.message))) c.toast('Nie udało się: ' + (e && e.message));
    }
    return;
  }
  // iPhone: arkusz udostępniania (zapis w Plikach, wysłanie sobie)
  try {
    const file = new File([json], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Kopia danych Do Pierwszego' });
      markManual(st);
      c.save();
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
  markManual(st);
  c.save();
}
