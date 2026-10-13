// Sprawdza wspólny dom na prawdziwej bazie: reguły, szyfr i dwa „telefony” na żywo. Po sobie sprząta.
// node --experimental-eventsource tools/dom_check.mjs
import { engine, DB_URL, keysFor } from '../app/www/js/house.js';
import { defaults } from '../app/www/js/store.js';

// DB_URL=http://... podmienia bazę (test na udawanej bazie)
if (process.env.DB_URL) globalThis.DP_DB_URL = process.env.DB_URL;
const base = (process.env.DB_URL || DB_URL).replace(/\/+$/, '');
const failed = [];
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'OK  ' : 'BŁĄD'} ${name}${extra ? ' · ' + extra : ''}`);
  if (!ok) failed.push(name);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const status = async (path) => (await fetch(`${base}/${path}.json`)).status;

if (!base) { console.log('Brak adresu bazy w house.js'); process.exit(1); }
if (!globalThis.EventSource) { console.log('Uruchom z --experimental-eventsource'); process.exit(1); }

// reguły: listy domów nie da się przejrzeć, a dom pod identyfikatorem tak
check('reguły: korzeń bazy zamknięty', (await status('')) === 401, String(await status('')));
check('reguły: lista domów zamknięta', (await status('rodziny')) === 401, String(await status('rodziny')));
check('reguły: zły identyfikator zamknięty', (await status('rodziny/to-nie-jest-dom')) === 401);
check('reguły: dom otwarty pod identyfikatorem', (await status('rodziny/0123456789abcdef0123456789abcdef')) === 200);

function phone() {
  const ph = { st: defaults(), got: [] };
  ph.st.onboarded = true;
  ph.eng = engine({ state: () => ph.st, persist: () => {}, changed: (k) => ph.got.push(...k) });
  return ph;
}

let fid = '';
try {
  const mama = phone();
  mama.st.settings.budget = 1600;
  mama.st.settings.people = 4;
  mama.st.list.push({ id: 'm1', name: 'mleko testowe', qty: 2 });
  const code = await mama.eng.create();
  fid = (await keysFor(code)).fid;
  await wait(3000);
  check('mama: dom założony i połączony', mama.eng.status.connected && mama.eng.pendingCount() === 0, JSON.stringify(mama.eng.status));
  const raw = await (await fetch(`${base}/rodziny/${fid}.json`)).text();
  check('w bazie tylko szyfr', raw.length > 100 && !raw.includes('mleko') && !raw.includes('1600'), `${raw.length} znaków`);

  const tata = phone();
  const n = await tata.eng.peek(code);
  check('tata: kod znajduje dom', n > 0, String(n));
  await tata.eng.join(code, true, defaults());
  check('tata: budżet i lista z domu', tata.st.settings.budget === 1600 && tata.st.list.some((i) => i.name === 'mleko testowe'));
  await wait(2000);

  mama.st.list.push({ id: 'm2', name: 'jajka na żywo', qty: 10 });
  const t0 = Date.now();
  await mama.eng.flush();
  for (let i = 0; i < 40 && !tata.st.list.some((x) => x.id === 'm2'); i++) await wait(250);
  check('tata dostaje zmianę na żywo', tata.st.list.some((x) => x.id === 'm2'), `${Date.now() - t0} ms`);

  tata.st.list.find((x) => x.id === 'm1').done = true;
  await tata.eng.flush();
  for (let i = 0; i < 40 && !mama.st.list.find((x) => x.id === 'm1').done; i++) await wait(250);
  check('mama widzi odhaczone przez tatę', mama.st.list.find((x) => x.id === 'm1').done === true);
  check('licznik telefonów', mama.eng.status.devices === 2, String(mama.eng.status.devices));

  await tata.eng.leave();
  await mama.eng.leave();
} catch (e) {
  check('przebieg bez wyjątku', false, e && e.stack);
} finally {
  if (fid) {
    const r = await fetch(`${base}/rodziny/${fid}.json`, { method: 'DELETE' });
    check('sprzątanie: testowy dom usunięty', r.ok, String(r.status));
  }
}
console.log('NIEUDANE:', failed.length ? failed.join(', ') : 'nic');
process.exit(failed.length ? 1 : 0);
