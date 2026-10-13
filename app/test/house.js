// Wspólny dom: dwa telefony na udawanej bazie Firebase (w pamięci), bez internetu.
import { defaults } from '../www/js/store.js';

// Udaje Firebase Realtime Database: PATCH scala (null usuwa), strumień daje najpierw cały obraz, potem zmiany
export function fakeFirebase() {
  const db = {};
  const subs = new Set();
  const fake = {
    db,
    online: true,
    reads: 0,
    at(path) { return path.split('/').reduce((o, p) => (o && o[p] !== undefined ? o[p] : undefined), db); },
    async get(path) {
      if (!fake.online) throw new Error('offline');
      fake.reads++;
      const v = fake.at(path);
      return v === undefined ? null : JSON.parse(JSON.stringify(v));
    },
    async patch(path, body) {
      if (!fake.online) throw new Error('offline');
      const parts = path.split('/');
      let o = db;
      for (const p of parts) o = o[p] || (o[p] = {});
      for (const [k, v] of Object.entries(body)) { if (v === null) delete o[k]; else o[k] = JSON.parse(JSON.stringify(v)); }
      // jak Firebase: słuchacz wyżej w drzewie dostaje zmianę ze ścieżką względną
      for (const s of subs) {
        if (!s.alive || (path !== s.path && !path.startsWith(s.path + '/'))) continue;
        const rel = '/' + path.slice(s.path.length + 1);
        setTimeout(() => s.alive && s.onEvent('patch', { path: rel === '/' ? '/' : rel, data: JSON.parse(JSON.stringify(body)) }), 1);
      }
    },
    listen(path, onEvent, onState) {
      const s = { path, onEvent, alive: fake.online };
      if (s.alive) {
        subs.add(s);
        setTimeout(() => { onState('open'); onEvent('put', { path: '/', data: fake.at(path) === undefined ? null : JSON.parse(JSON.stringify(fake.at(path))) }); }, 1);
      }
      return { close: () => { s.alive = false; subs.delete(s); }, alive: () => s.alive && fake.online };
    },
  };
  return fake;
}

export default async function (t, assert) {
  const H = await import('../www/js/house.js');
  const wait = (ms = 30) => new Promise((r) => setTimeout(r, ms));
  let n = 0;
  const tt = async (name, fn) => { await t(name, fn); n++; };

  function phone(fake) {
    const st = defaults();
    st.onboarded = true;
    const ph = { st, changes: [], saved: 0 };
    ph.eng = H.engine({ state: () => ph.st, persist: () => { ph.saved++; }, changed: (keys) => ph.changes.push(...keys) }, fake);
    return ph;
  }

  await tt('dom: kod, szyfr i nazwy rekordów', async () => {
    const code = H.newCode();
    assert.equal(code.length, 16);
    assert.equal(H.normCode(H.prettyCode(code).toLowerCase()), code);
    assert.equal(H.normCode('ABCD-EFGH-JKLM-NPQ0'), null); // 0 nie ma w kodach
    const a = await H.keysFor(code);
    const b = await H.keysFor(H.newCode());
    assert.match(a.fid, /^[0-9a-f]{32}$/); // pasuje do reguł bazy
    assert.notEqual(a.fid, b.fid);
  });

  await tt('dom: mama zakłada, tata dołącza i widzi to samo', async () => {
    const fake = fakeFirebase();
    const mama = phone(fake);
    mama.st.settings.budget = 1600;
    mama.st.settings.people = 4;
    mama.st.settings.theme = 'dark';
    mama.st.list.push({ id: 'l1', name: 'mleko', qty: 2, ico: 'milk' }, { id: 'l2', name: 'chleb', ico: 'bread' });
    mama.st.expenses.push({ id: 'e1', amount: 45.2, store: 'Lidl', date: '2026-10-12', created: 1 });
    mama.st.plan['2026-10-14'] = [{ id: 'pl-fasolka', slot: 'obiad', n: 4 }];
    mama.st.prices = { Lidl: { 'mlek': { name: 'Mleko', paid: 3.19, date: '2026-10-12' } } };
    const code = await mama.eng.create();
    await wait();
    // w bazie tylko szyfr
    const raw = JSON.stringify(fake.db);
    for (const word of ['mleko', 'Mleko', 'Lidl', '1600', 'fasolka']) assert.ok(!raw.includes(word), 'w bazie widać: ' + word);

    const tata = phone(fake);
    tata.st.settings.theme = 'light';
    assert.equal(await tata.eng.peek(H.newCode()), null); // zły kod: nic
    assert.ok((await tata.eng.peek(code)) > 5);
    await tata.eng.join(code, true, defaults());
    await wait();
    assert.equal(tata.st.settings.budget, 1600);
    assert.equal(tata.st.settings.people, 4);
    assert.equal(tata.st.settings.theme, 'light'); // wygląd zostaje swój
    assert.deepEqual(tata.st.list.map((i) => i.name), ['mleko', 'chleb']);
    assert.equal(tata.st.expenses[0].amount, 45.2);
    assert.equal(tata.st.plan['2026-10-14'][0].n, 4);
    assert.equal(tata.st.prices.Lidl.mlek.paid, 3.19);
    assert.equal(tata.eng.pendingCount(), 0);

    // mama dopisuje jajka, tata od razu je ma
    mama.st.list.push({ id: 'l3', name: 'jajka', qty: 10, ico: 'egg' });
    await mama.eng.flush();
    await wait();
    assert.ok(tata.st.list.some((i) => i.name === 'jajka'));
    assert.ok(tata.changes.includes('l/l3'));

    // tata odhacza chleb i dodaje wydatek, mama to widzi
    tata.st.list.find((i) => i.id === 'l2').done = true;
    tata.st.expenses.push({ id: 'e2', amount: 12.5, store: 'Żabka', date: '2026-10-13', created: 2 });
    await tata.eng.flush();
    await wait();
    assert.equal(mama.st.list.find((i) => i.id === 'l2').done, true);
    assert.deepEqual(mama.st.expenses.map((e) => e.id), ['e1', 'e2']);

    // usunięcie też przechodzi
    mama.st.list = mama.st.list.filter((i) => i.id !== 'l1');
    await mama.eng.flush();
    await wait();
    assert.ok(!tata.st.list.some((i) => i.id === 'l1'));
    // ten sam obiekt w tablicy, żeby otwarte okienko go nie zgubiło
    const ref = tata.st.list.find((i) => i.id === 'l3');
    mama.st.list.find((i) => i.id === 'l3').qty = 12;
    await mama.eng.flush();
    await wait();
    assert.equal(ref.qty, 12);
  });

  await tt('dom: bez internetu zmiany czekają, a przy dwóch zmianach wygrywa nowsza', async () => {
    const fake = fakeFirebase();
    const a = phone(fake);
    a.st.expenses.push({ id: 'x', amount: 10, date: '2026-10-10', created: 1 });
    const code = await a.eng.create();
    const b = phone(fake);
    await b.eng.join(code, true, defaults());
    await wait();
    fake.online = false;
    a.st.expenses[0].amount = 11;
    await a.eng.flush(); // nie wyśle się
    assert.ok(a.eng.pendingCount() > 0);
    await wait(5);
    b.st.expenses[0].amount = 12; // później, więc wygrywa
    b.st.list.push({ id: 'n1', name: 'masło' });
    await b.eng.flush();
    fake.online = true;
    a.eng.resume();
    b.eng.resume();
    await wait(80);
    await a.eng.flush();
    await b.eng.flush();
    await wait(80);
    assert.equal(a.st.expenses[0].amount, 12);
    assert.equal(b.st.expenses[0].amount, 12);
    assert.ok(a.st.list.some((i) => i.name === 'masło'));
    assert.equal(a.eng.pendingCount() + b.eng.pendingCount(), 0);
  });

  await tt('dom: kopia danych bez kodu domu', async () => {
    const { exportJson } = await import('../www/js/store.js');
    const st = defaults();
    st.house = { code: 'ABCDEFGHJKLMNPQR', device: 'x' };
    const txt = exportJson(st);
    assert.ok(!txt.includes('ABCDEFGHJKLMNPQR'));
    assert.equal(st.house.code, 'ABCDEFGHJKLMNPQR'); // stan apki bez zmian
  });

  await tt('dom: dołączenie z łączeniem danych i odłączenie', async () => {
    const fake = fakeFirebase();
    const a = phone(fake);
    a.st.list.push({ id: 'a1', name: 'ser' });
    const code = await a.eng.create();
    const b = phone(fake);
    b.st.list.push({ id: 'b1', name: 'jabłka' });
    b.st.settings.budget = 999;
    await b.eng.join(code, false, defaults());
    await wait();
    assert.deepEqual(b.st.list.map((i) => i.id).sort(), ['a1', 'b1']);
    assert.equal(b.st.settings.budget, a.st.settings.budget); // budżet domu wygrywa
    await wait();
    assert.ok(a.st.list.some((i) => i.id === 'b1'));
    await b.eng.leave();
    assert.equal(b.st.house, undefined);
    b.st.list.push({ id: 'b2', name: 'po odłączeniu' });
    b.eng.changed();
    await wait(700);
    assert.ok(!a.st.list.some((i) => i.id === 'b2'));
  });

  return n;
}
