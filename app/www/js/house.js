// Wspólny dom: te same wydatki, lista, plan i budżet na kilku telefonach.
//
// Dane leżą w bazie Firebase (Realtime Database) na koncie twórcy apki, ale zaszyfrowane w telefonie
// kodem domu (AES-GCM). W bazie widać tylko szyfr i czas zmiany, bez nazw produktów i kwot.
// Kod domu (16 znaków) jest jedynym kluczem: bez niego nie da się ani znaleźć danych, ani ich odczytać.
//
// Każda rzecz (wydatek, pozycja listy, dzień planu, ustawienie budżetu...) to osobny rekord z czasem zmiany.
// Przy dwóch zmianach tej samej rzeczy wygrywa nowsza. Usunięcie to też rekord („usunięte”), żeby inne
// telefony wiedziały, że mają ją skasować. Bez internetu zmiany czekają i wysyłają się przy połączeniu.
import { kvGet, kvSet } from './store.js';

// Adres bazy (Firebase Realtime Database, region europe-west1). Pusty = wspólny dom niedostępny.
export const DB_URL = 'https://do-pierwszego-de880-default-rtdb.europe-west1.firebasedatabase.app';
// Testy podstawiają tu adres udawanej bazy
const dbUrl = () => (typeof globalThis !== 'undefined' && globalThis.DP_DB_URL) || DB_URL;
export const available = () => !!dbUrl() && typeof crypto !== 'undefined' && !!crypto.subtle;

const META = 'groszek-dom-v1';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bez I, O, 0, 1, żeby nie myliły się przy przepisywaniu
const CODE_LEN = 16;
const TOMBSTONE_DAYS = 60;
const CHUNK = 250;

// ---------- kod domu ----------

export function newCode() {
  const b = new Uint8Array(CODE_LEN);
  crypto.getRandomValues(b);
  return [...b].map((x) => ALPHABET[x % 32]).join('');
}

// Kod wpisany ręcznie: małe litery, spacje i myślniki nie przeszkadzają. Null, gdy to nie kod.
export function normCode(s) {
  const c = String(s || '').toUpperCase().replace(/[\s\-_.]/g, '');
  if (c.length !== CODE_LEN) return null;
  for (const ch of c) if (!ALPHABET.includes(ch)) return null;
  return c;
}

export const prettyCode = (c) => (c || '').match(/.{1,4}/g).join('-');

// ---------- szyfrowanie ----------

const te = new TextEncoder();
const td = new TextDecoder();
const keyCache = new Map();

const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
function b64(buf) {
  let s = '';
  const a = new Uint8Array(buf);
  for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode(...a.subarray(i, i + 0x8000));
  return btoa(s);
}
function unb64(s) {
  const bin = atob(s);
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
}

// Z kodu: identyfikator domu w bazie (nie da się z niego odtworzyć kodu), klucz szyfru i klucz do nazw rekordów
export async function keysFor(code) {
  if (keyCache.has(code)) return keyCache.get(code);
  const base = await crypto.subtle.importKey('raw', te.encode('do-pierwszego/' + code), 'HKDF', false, ['deriveKey', 'deriveBits']);
  const salt = te.encode('do-pierwszego-dom-v1');
  const hk = (info) => ({ name: 'HKDF', hash: 'SHA-256', salt, info: te.encode(info) });
  const fid = hex(await crypto.subtle.deriveBits(hk('id'), base, 128));
  const aes = await crypto.subtle.deriveKey(hk('aes'), base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const mac = await crypto.subtle.deriveKey(hk('mac'), base, { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, ['sign']);
  const k = { fid, aes, mac, names: new Map() };
  keyCache.set(code, k);
  return k;
}

// Nazwa rekordu w bazie: skrót z kluczem, żeby nie zdradzała, co to jest
async function rkeyOf(k, key) {
  let r = k.names.get(key);
  if (!r) {
    r = hex(await crypto.subtle.sign('HMAC', k.mac, te.encode(key))).slice(0, 24);
    k.names.set(key, r);
  }
  return r;
}

async function seal(k, rkey, t, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: te.encode(rkey + '|' + t) }, k.aes, te.encode(JSON.stringify(obj)));
  const out = new Uint8Array(12 + ct.byteLength);
  out.set(iv);
  out.set(new Uint8Array(ct), 12);
  return b64(out);
}

async function unseal(k, rkey, t, v) {
  const a = unb64(v);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: a.subarray(0, 12), additionalData: te.encode(rkey + '|' + t) }, k.aes, a.subarray(12));
  return JSON.parse(td.decode(pt));
}

// ---------- co jest wspólne ----------

// Ustawienia wspólne dla domu; reszta (wygląd, ciekawostki, przypomnienie, kopia) zostaje w telefonie
export const SHARED_SETTINGS = ['budget', 'monthStart', 'people', 'kcal', 'profile', 'gear', 'avoid', 'cuisines', 'stores', 'strict', 'strictCats'];
const ARRAYS = { e: 'expenses', l: 'list', s: 'savings', x: 'penalties', c: 'customRecipes' };
const OBJECTS = { r: 'ratings', n: 'learned', i: 'icons' };

// Wszystkie wspólne rzeczy jako mapa "kolekcja/id" -> wartość
export function records(st) {
  const out = new Map();
  for (const [c, f] of Object.entries(ARRAYS)) for (const x of st[f] || []) if (x && x.id != null) out.set(`${c}/${x.id}`, x);
  for (const [c, f] of Object.entries(OBJECTS)) for (const [k, v] of Object.entries(st[f] || {})) out.set(`${c}/${k}`, v);
  for (const [d, meals] of Object.entries(st.plan || {})) if (Array.isArray(meals)) out.set(`p/${d}`, meals);
  for (const [shop, items] of Object.entries(st.prices || {})) for (const [k, v] of Object.entries(items || {})) out.set(`k/${shop}\t${k}`, v);
  for (const k of SHARED_SETTINGS) if (st.settings[k] !== undefined) out.set(`g/${k}`, st.settings[k]);
  if (st.trips && st.trips.length) out.set('t/all', st.trips);
  if (st.startedOn) out.set('m/startedOn', st.startedOn);
  return out;
}

// Wstawia (albo usuwa, gdy value === undefined) jedną rzecz w stanie apki
export function applyRecord(st, key, value) {
  const i = key.indexOf('/');
  const c = key.slice(0, i);
  const id = key.slice(i + 1);
  const del = value === undefined;
  if (ARRAYS[c]) {
    const arr = st[ARRAYS[c]] || (st[ARRAYS[c]] = []);
    const at = arr.findIndex((x) => x && String(x.id) === id);
    if (del) { if (at >= 0) arr.splice(at, 1); return; }
    if (at >= 0) {
      // ten sam obiekt, żeby otwarte okienka nie trzymały starej kopii
      const o = arr[at];
      for (const k of Object.keys(o)) delete o[k];
      Object.assign(o, value);
    } else arr.push(value);
    if (c === 'e') arr.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.created || 0) - (b.created || 0)));
    return;
  }
  if (OBJECTS[c]) {
    const o = st[OBJECTS[c]] || (st[OBJECTS[c]] = {});
    if (del) delete o[id]; else o[id] = value;
    return;
  }
  if (c === 'p') { if (del) delete st.plan[id]; else st.plan[id] = value; return; }
  if (c === 'k') {
    const [shop, k] = id.split('\t');
    const db = st.prices || (st.prices = {});
    if (del) { if (db[shop]) { delete db[shop][k]; if (!Object.keys(db[shop]).length) delete db[shop]; } return; }
    (db[shop] || (db[shop] = {}))[k] = value;
    return;
  }
  if (c === 'g') { if (SHARED_SETTINGS.includes(id) && !del) st.settings[id] = value; return; }
  if (c === 't') { st.trips = del ? [] : value; return; }
  if (c === 'm' && id === 'startedOn') { if (del) delete st.startedOn; else st.startedOn = value; }
}

// Wspólne dane wyczyszczone (przed wczytaniem domu na telefonie, który dołącza „na czysto”)
export function clearShared(st, defaults) {
  for (const f of Object.values(ARRAYS)) st[f] = [];
  for (const f of Object.values(OBJECTS)) st[f] = {};
  st.plan = {};
  st.prices = {};
  st.trips = [];
  delete st.startedOn;
  for (const k of SHARED_SETTINGS) if (defaults.settings[k] !== undefined) st.settings[k] = JSON.parse(JSON.stringify(defaults.settings[k]));
}

// Krótki skrót tekstu (cyrb53) do wykrywania zmian
export function hash(str) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

// ---------- połączenie z bazą ----------

// Firebase Realtime Database przez zwykłe zapytania HTTP i strumień zdarzeń (bez biblioteki Firebase)
export function firebase(url) {
  const base = url.replace(/\/+$/, '');
  return {
    async get(path) {
      const r = await fetch(`${base}/${path}.json`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`baza: ${r.status}`);
      return r.json();
    },
    async patch(path, body) {
      const r = await fetch(`${base}/${path}.json?print=silent`, { method: 'PATCH', body: JSON.stringify(body) });
      if (!r.ok) throw new Error(`baza: ${r.status}`);
    },
    listen(path, onEvent, onState) {
      const es = new globalThis.EventSource(`${base}/${path}.json`);
      const handle = (type) => (e) => { try { onEvent(type, JSON.parse(e.data)); } catch (err) { /* keep-alive bez danych */ } };
      es.addEventListener('put', handle('put'));
      es.addEventListener('patch', handle('patch'));
      es.addEventListener('cancel', () => onState('denied'));
      es.addEventListener('open', () => onState('open'));
      es.addEventListener('auth_revoked', () => onState('denied'));
      es.onerror = () => onState(es.readyState === 2 ? 'closed' : 'retry');
      return { close: () => es.close(), alive: () => es.readyState !== 2 };
    },
  };
}

// ---------- silnik ----------

// hooks: { state(): stan apki, persist(): zapis stanu, changed(keys): coś przyszło z innego telefonu }
export function engine(hooks, transport = null) {
  const now = () => Date.now();
  let tr = transport;
  let k = null; // klucze domu
  let meta = null; // { fid, known: { key: [czas, skrót] }, pending: { key: 1 } }
  let conn = null;
  let diffTimer = null;
  let metaTimer = null;
  let pushing = null;
  let queue = Promise.resolve();
  const status = { on: false, connected: false, synced: 0, error: '', devices: 0 };
  const listeners = new Set();
  const notify = () => listeners.forEach((f) => { try { f(status); } catch (e) { /* ekran zniknął */ } });

  const house = () => hooks.state().house;
  const saveMeta = () => { clearTimeout(metaTimer); metaTimer = setTimeout(() => kvSet(META, JSON.stringify(meta)), 400); };

  async function loadMeta(fid) {
    try { meta = JSON.parse((await kvGet(META)) || 'null'); } catch (e) { meta = null; }
    if (!meta || meta.fid !== fid) meta = { fid, known: {}, pending: {} };
  }

  // Lokalne zmiany od ostatniego razu: nowe czasy i kolejka do wysłania
  function diff() {
    if (!meta) return 0;
    const st = hooks.state();
    const recs = records(st);
    const t = now();
    let n = 0;
    for (const [key, v] of recs) {
      const h = hash(JSON.stringify(v));
      const kn = meta.known[key];
      if (!kn || kn[1] !== h) { meta.known[key] = [Math.max(t, kn ? kn[0] + 1 : 0), h]; meta.pending[key] = 1; n++; }
    }
    const old = t - TOMBSTONE_DAYS * 86400000;
    for (const [key, kn] of Object.entries(meta.known)) {
      if (kn[1] !== 'x' && !recs.has(key)) { meta.known[key] = [Math.max(t, kn[0] + 1), 'x']; meta.pending[key] = 1; n++; } else if (kn[1] === 'x' && kn[0] < old && !meta.pending[key]) delete meta.known[key]; // dawno usunięte
    }
    if (n) saveMeta();
    return n;
  }

  function push() {
    if (pushing) return pushing;
    const run = (async () => {
      try {
        for (;;) {
          if (!meta || !tr || !k || !Object.keys(meta.pending).length) break; // leave() mogło wszystko wyłączyć w trakcie
          const st = hooks.state();
          const recs = records(st);
          const keys = Object.keys(meta.pending).slice(0, CHUNK);
          const body = {};
          const sent = {};
          for (const key of keys) {
            const kn = meta.known[key];
            if (!kn) { delete meta.pending[key]; continue; }
            const rk = await rkeyOf(k, key);
            const del = kn[1] === 'x' || !recs.has(key);
            body[rk] = { t: kn[0], v: await seal(k, rk, kn[0], del ? { k: key, d: 1 } : { k: key, v: recs.get(key) }) };
            sent[key] = kn[0];
          }
          if (!Object.keys(body).length) continue;
          await tr.patch(`rodziny/${meta.fid}/d`, body);
          // wysłane; jeśli w międzyczasie coś się znowu zmieniło, zostaje w kolejce z nowszym czasem
          for (const [key, t] of Object.entries(sent)) if (meta.known[key] && meta.known[key][0] === t) delete meta.pending[key];
          status.synced = now();
          status.error = '';
          saveMeta();
        }
      } catch (e) {
        status.error = 'Nie udało się wysłać zmian. Spróbuję, gdy wróci internet.';
      }
      notify();
    })();
    // znacznik „wysyłam” znika po zakończeniu, także gdy nie było nic do wysłania
    pushing = run;
    run.finally(() => { if (pushing === run) pushing = null; });
    return run;
  }

  // Rekordy z bazy: { rkey: { t, v } }. Zwraca klucze, które zmieniły się w telefonie.
  async function applyRemote(map, joining = false) {
    if (!map || !meta || !k) return [];
    if (!joining) diff(); // zmiany zrobione przed chwilą w tym telefonie dostają czas, żeby nie przepadły
    const st = hooks.state();
    const changed = [];
    const old = now() - TOMBSTONE_DAYS * 86400000;
    const sweep = {};
    for (const [rk, rec] of Object.entries(map)) {
      if (!rec || typeof rec.t !== 'number' || typeof rec.v !== 'string') continue;
      let p;
      try { p = await unseal(k, rk, rec.t, rec.v); } catch (e) { continue; } // nie nasz albo uszkodzony
      if (!p || typeof p.k !== 'string') continue;
      const key = p.k;
      const kn = meta.known[key];
      if (p.d && rec.t < old) sweep[rk] = null; // stare „usunięte” można już wyrzucić z bazy
      if (kn && kn[0] >= rec.t) continue; // mamy tę samą albo nowszą wersję
      if (p.d) {
        applyRecord(st, key, undefined);
        meta.known[key] = [rec.t, 'x'];
      } else {
        applyRecord(st, key, p.v);
        meta.known[key] = [rec.t, hash(JSON.stringify(p.v))];
      }
      delete meta.pending[key];
      changed.push(key);
    }
    if (Object.keys(sweep).length && tr) tr.patch(`rodziny/${meta.fid}/d`, sweep).catch(() => {});
    if (changed.length) { saveMeta(); hooks.persist(); }
    return changed;
  }

  // Telefony domu: { urządzenie: czas ostatniego połączenia }
  const devices = {};
  function countDevices() {
    const month = now() - 30 * 86400000;
    status.devices = Object.values(devices).filter((x) => Number(x) > month).length;
  }

  // Zdarzenia ze strumienia całego domu: /d (rekordy) i /u (telefony)
  function onEvent(type, msg) {
    queue = queue.then(async () => {
      if (!msg || typeof msg.path !== 'string') return;
      const parts = msg.path.split('/').filter(Boolean);
      const data = msg.data;
      let recs = null;
      let full = false;
      const devs = (m, replace) => {
        if (replace) for (const d of Object.keys(devices)) delete devices[d];
        for (const [d, t] of Object.entries(m || {})) { if (t == null) delete devices[d]; else devices[d] = t; }
        countDevices();
      };
      if (!parts.length) {
        if (type === 'put') { recs = (data && data.d) || {}; devs(data && data.u, true); full = true; } else {
          for (const [k, v] of Object.entries(data || {})) {
            const p = k.split('/');
            if (p[0] === 'd') { recs = recs || {}; if (p[1]) recs[p[1]] = v; else Object.assign(recs, v || {}); }
            if (p[0] === 'u') devs(p[1] ? { [p[1]]: v } : v, false);
          }
        }
      } else if (parts[0] === 'd') {
        if (parts.length === 1) recs = data || {};
        else if (parts.length === 2) recs = { [parts[1]]: data };
      } else if (parts[0] === 'u') {
        if (parts.length === 1) devs(data, type === 'put'); else devs({ [parts[1]]: data }, false);
      }
      const changed = recs ? await applyRemote(recs) : [];
      status.connected = true;
      status.synced = now();
      notify();
      if (changed.length) hooks.changed(changed);
      if (full) push(); // po pierwszym obrazie bazy wysyłamy to, co czekało
    }).catch((e) => console.error(e));
  }

  function connect() {
    if (!tr || !meta || (conn && conn.alive())) return;
    if (conn) conn.close();
    conn = tr.listen(`rodziny/${meta.fid}`, onEvent, (s) => {
      if (s === 'open') status.connected = true;
      if (s === 'denied') { status.error = 'Baza odrzuciła połączenie.'; status.connected = false; }
      if (s === 'retry' || s === 'closed') status.connected = false;
      notify();
    });
    // ten telefon jest w domu (do licznika telefonów); sama data, bez nazwy
    tr.patch(`rodziny/${meta.fid}/u`, { [house().device]: now() }).catch(() => {});
  }

  return {
    status,
    onStatus(f) { listeners.add(f); return () => listeners.delete(f); },
    setTransport(t) { tr = t; },

    // Start apki albo zmiana domu
    async start() {
      const h = house();
      if (!h || !h.code) { status.on = false; return; }
      if (!tr && dbUrl()) tr = firebase(dbUrl());
      k = await keysFor(h.code);
      await loadMeta(k.fid);
      status.on = true;
      diff();
      connect();
      notify();
    },

    // Wywoływane przy każdym zapisie stanu: wykrywa zmiany i wysyła je chwilę później
    changed() {
      if (!meta) return;
      clearTimeout(diffTimer);
      diffTimer = setTimeout(() => { if (diff()) push(); }, 600);
    },

    // Powrót do apki: połączenie mogło zostać zerwane w tle
    resume() {
      if (!meta) return;
      connect();
      if (diff() || Object.keys(meta.pending).length) push();
    },

    // Wysyła wszystko od razu (np. przed zamknięciem)
    async flush() { if (meta) { clearTimeout(diffTimer); diff(); await push(); } },

    // Nowy dom z danych tego telefonu
    async create() {
      if (!tr && dbUrl()) tr = firebase(dbUrl());
      if (!tr) throw new Error('Wspólny dom nie jest jeszcze dostępny w tej wersji apki.');
      const st = hooks.state();
      const code = newCode();
      st.house = { code, device: Math.random().toString(36).slice(2, 12), since: new Date().toISOString().slice(0, 10) };
      hooks.persist();
      k = await keysFor(code);
      meta = { fid: k.fid, known: {}, pending: {} };
      status.on = true;
      diff();
      if (tr) await push();
      connect();
      return code;
    },

    // Zagląda do domu o tym kodzie: null, gdy go nie ma; inaczej liczba rzeczy w nim
    async peek(code) {
      if (!tr && dbUrl()) tr = firebase(dbUrl());
      if (!tr) throw new Error('Wspólny dom nie jest jeszcze dostępny w tej wersji apki.');
      const kk = await keysFor(code);
      const d = await tr.get(`rodziny/${kk.fid}/d`);
      if (!d || typeof d !== 'object') return null;
      // pierwszy rekord musi dać się odczytać tym kodem
      const [rk, rec] = Object.entries(d)[0] || [];
      if (!rk || !rec) return null;
      try { await unseal(kk, rk, rec.t, rec.v); return Object.keys(d).length; } catch (e) { return null; }
    },

    // Dołączenie: fresh = wspólne dane zastępują dane tego telefonu; inaczej się łączą
    async join(code, fresh, defaults) {
      if (!tr && dbUrl()) tr = firebase(dbUrl());
      if (!tr) throw new Error('Wspólny dom nie jest jeszcze dostępny w tej wersji apki.');
      const st = hooks.state();
      if (conn) { conn.close(); conn = null; }
      st.house = { code, device: Math.random().toString(36).slice(2, 12), since: new Date().toISOString().slice(0, 10) };
      if (fresh) clearShared(st, defaults);
      k = await keysFor(code);
      meta = { fid: k.fid, known: {}, pending: {} };
      status.on = true;
      const d = await tr.get(`rodziny/${k.fid}/d`);
      await applyRemote(d || {}, true); // przy dołączaniu dom wygrywa z tym, co było w telefonie
      hooks.persist();
      if (!fresh) { diff(); await push(); } else diff(); // przy „na czysto” nic nie powinno czekać
      connect();
    },

    // Odłączenie tego telefonu: dane zostają w nim jako zwykła kopia
    async leave() {
      const st = hooks.state();
      if (conn) { conn.close(); conn = null; }
      if (meta && tr && st.house) tr.patch(`rodziny/${meta.fid}/u`, { [st.house.device]: null }).catch(() => {});
      delete st.house;
      meta = null;
      k = null;
      status.on = false;
      status.connected = false;
      await kvSet(META, '');
      hooks.persist();
      notify();
    },

    pendingCount: () => (meta ? Object.keys(meta.pending).length : 0),
    _meta: () => meta,
  };
}
