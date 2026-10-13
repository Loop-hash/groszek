// Zapis stanu apki na telefonie. Na Androidzie przez Capacitor Preferences, w przeglądarce przez localStorage.

const KEY = 'groszek-state-v1';
let pref = null;

function native() {
  return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

// Wtyczki Capacitora (Preferences, App, Filesystem, Share). Rdzeń ładuje js/vendor/capacitor.js.
const plugins = {};
export function plugin(name) {
  if (!native()) return null;
  if (plugins[name]) return plugins[name];
  const known = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[name];
  if (known) { plugins[name] = known; return known; }
  const reg = (window.Capacitor && window.Capacitor.registerPlugin) || (window.capacitorExports && window.capacitorExports.registerPlugin);
  if (!reg) { console.error('Brak registerPlugin, wtyczka ' + name + ' niedostępna'); return null; }
  try { plugins[name] = reg(name); } catch (e) { console.error('Wtyczka ' + name + ': ' + e.message); return null; }
  return plugins[name];
}

export async function kvGet(key) {
  if (pref === null) pref = plugin('Preferences') || false;
  if (pref) {
    // starsze wersje apki zapisywały w localStorage, więc gdy w Preferences pusto, szukamy tam
    try { const r = await pref.get({ key }); if (r && r.value != null) return r.value; } catch (e) { /* dalej */ }
  }
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

export async function kvSet(key, value) {
  if (pref === null) pref = plugin('Preferences') || false;
  if (pref) {
    try { await pref.set({ key, value }); return; } catch (e) { /* dalej */ }
  }
  try { localStorage.setItem(key, value); } catch (e) { /* brak miejsca albo zablokowane */ }
}

export const DEFAULT_CUISINES = ['Polska', 'Włochy', 'Francja', 'Hiszpania', 'Grecja', 'Niemcy', 'Węgry', 'Bośnia', 'Ukraina', 'Gruzja', 'Turcja',
  'Liban', 'Maroko', 'Indie', 'Tajlandia', 'Wietnam', 'Chiny', 'Japonia', 'Korea', 'Meksyk', 'USA'];

export const GEAR = ['1 palnik', '2 palniki', 'Piekarnik', 'Opiekacz', 'Toster', 'Air fryer', 'Mikrofala', 'Blender'];
export const AVOID = ['Ryby', 'Owoce morza', 'Udka i steki', 'Wieprzowina', 'Wołowina', 'Mięso', 'Nabiał', 'Gluten', 'Jajka', 'Orzechy'];

export function defaults() {
  return {
    v: 1,
    onboarded: false,
    settings: {
      budget: 400,
      monthStart: 1,
      kcal: 2200,
      profile: null,
      gear: { '1 palnik': true, '2 palniki': false, 'Piekarnik': false, 'Opiekacz': true, 'Toster': true, 'Air fryer': false, 'Mikrofala': false, 'Blender': false },
      avoid: {},
      cuisines: Object.fromEntries(DEFAULT_CUISINES.map((c) => [c, true])),
      peek: true, // ciekawostki Groszosława przy otwarciu apki
      costume: true, // Groszosław przebiera się przy ciekawostkach o postaciach
      accent: false, // czerwone akcenty dla ozdoby
      strict: false,
      strictCats: { 'słodycze': true, 'chipsy i przekąski': true, 'słodkie napoje': true, 'energetyki': true, 'alkohol': true, 'fast food': false, 'gotowe dania': false },
      stores: { kaufland: true, lidl: true, aldi: true, biedronka: true },
      theme: 'system',
      autoBackup: true, // kopia co tydzień w Dokumenty/Do Pierwszego (Android)
    },
    expenses: [],
    list: [],
    learned: {},
    icons: {},
    savings: [],
    penalties: [],
    prices: {},
    ratings: {},
    customRecipes: [],
    plan: {},
    extras: {},
    trips: [],
    closedPeriods: [],
    seenSummary: null,
    facts: { order: [], pos: 0 }, // kolejka zwykłych ciekawostek
    chars: { order: [], pos: 0 }, // kolejka postaci z przebraniem
    factChar: false, // czy ostatnia ciekawostka była o postaci
    backup: {}, // daty ostatnich kopii: auto, manual; snooze przypomnienia
  };
}

function merge(base, saved) {
  if (!saved || typeof saved !== 'object') return base;
  const out = Array.isArray(base) ? saved : { ...base };
  if (Array.isArray(base)) return Array.isArray(saved) ? saved : base;
  for (const k of Object.keys(saved)) {
    const b = base[k];
    const s = saved[k];
    const bObj = b && typeof b === 'object' && !Array.isArray(b);
    const sObj = s && typeof s === 'object' && !Array.isArray(s);
    if (bObj && sObj) out[k] = merge(b, s);
    // lista albo obiekt z domyślnych nie może zamienić się w null czy liczbę (np. z ręcznie poprawionej kopii)
    else if (Array.isArray(b) && !Array.isArray(s)) out[k] = b;
    else if (bObj && !sObj) out[k] = b;
    else out[k] = s;
  }
  return out;
}

export async function load() {
  const raw = await kvGet(KEY);
  if (!raw) return defaults();
  try { return merge(defaults(), JSON.parse(raw)); } catch (e) {
    // uszkodzonego zapisu nie nadpisujemy w ciemno: zostaje kopia do odzyskania
    await kvSet(KEY + '-uszkodzony', raw);
    return defaults();
  }
}

let timer = null;
let pending = null;
export function save(state) {
  pending = state;
  clearTimeout(timer);
  timer = setTimeout(flush, 250);
}

export async function flush() {
  if (!pending) return;
  const s = pending;
  pending = null;
  await kvSet(KEY, JSON.stringify(s));
}

export function exportJson(state) {
  return JSON.stringify({ app: 'groszek', exported: new Date().toISOString(), state }, null, 1);
}

export function importJson(text) {
  const data = JSON.parse(text);
  const s = data && data.app === 'groszek' ? data.state : data;
  if (!s || typeof s !== 'object' || !s.settings) throw new Error('To nie jest kopia danych z tej apki.');
  return merge(defaults(), s);
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
