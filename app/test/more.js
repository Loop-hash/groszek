// Testy przepisów i planera na prawdziwych danych z data/.
import fs from 'node:fs';
import { defaults } from '../www/js/store.js';

const root = new URL('../../data/', import.meta.url);
const load = (f) => JSON.parse(fs.readFileSync(new URL(f, root), 'utf8'));

export default async function (t, assert) {
  const R = await import('../www/js/recipes.js');
  const P = await import('../www/js/plan.js');
  const B = await import('../www/js/budget.js');
  const data = { recipes: load('recipes.json'), ingredients: load('ingredients.json'), promos: load('promos.json') };
  const mk = (patch = {}) => {
    const state = defaults();
    Object.assign(state.settings, patch);
    return { state, data, app: {} };
  };
  let n = 0;
  const tt = async (name, fn) => { await t(name, fn); n++; };

  await tt('każdy przepis ma składniki z bazy', () => {
    for (const r of data.recipes.recipes) for (const x of r.ings) assert.ok(data.ingredients.ingredients[x.i], `${r.id}: ${x.i}`);
  });
  await tt('co najmniej 2 przepisy na każdy kraj', () => {
    const c = {};
    for (const r of data.recipes.recipes) c[r.country] = (c[r.country] || 0) + 1;
    for (const k of ['Polska', 'Włochy', 'Japonia', 'USA', 'Meksyk', 'Korea']) assert.ok(c[k] >= 2, k);
  });
  await tt('koszt porcji jest rozsądny', () => {
    const c = mk();
    for (const r of data.recipes.recipes) {
      const cost = R.recipeCost(c, r).perPortion;
      assert.ok(cost > 0.5 && cost < 20, `${r.name}: ${cost}`);
    }
  });
  await tt('"nie jem mięsa" ukrywa mięso', () => {
    const c = mk({ avoid: { 'Mięso': true } });
    const av = R.available(c);
    assert.ok(av.length > 10);
    assert.ok(av.every((r) => !(r.flags || []).includes('meat')));
  });
  await tt('wyłączone kuchnie i brak sprzętu', () => {
    const cuisines = Object.fromEntries(Object.keys(defaults().settings.cuisines).map((k) => [k, k === 'Włochy']));
    const c = mk({ cuisines });
    const av = R.available(c, 'obiad');
    assert.ok(av.length >= 2 && av.every((r) => r.country === 'Włochy' || r.country === 'Podstawy'));
    const c2 = mk({ gear: {} });
    assert.ok(R.available(c2).every((r) => (r.needs || []).length === 0));
  });
  await tt('cena za kg z opisu oferty', () => {
    assert.equal(R.offerPerKg({ price: 24.99, unitPrice: '=1 kg 49,98', detail: '' }), 49.98);
    assert.equal(R.offerPerKg({ price: 5.99, detail: 'luzem, 1 kg', name: 'Pomidory' }), 5.99);
    assert.equal(Math.round(R.offerPerKg({ price: 3.99, detail: '500 g opakowanie', name: 'Chleb' }) * 100) / 100, 7.98);
    assert.equal(Math.round(R.offerPerKg({ price: 1.19, detail: '100 g', name: 'Ćwiartka' }) * 100) / 100, 11.9);
    assert.equal(R.offerPerKg({ price: 17.99, detail: 'Cena za kg', name: 'Filety' }), 17.99);
  });
  await tt('układanie miesiąca mieści się w kwocie albo ostrzega', () => {
    const c = mk();
    const from = B.addDays(B.today(), 1);
    const res = P.compose(c, { amount: 400, from, days: 30, meals: ['sniadanie', 'obiad', 'kolacja'], cook2: true, seed: 3 });
    assert.equal(res.dates.length, 30);
    for (const d of res.dates) assert.equal(res.plan[d].length, 3, d);
    assert.ok(res.total <= 400.5 || res.warnings.length);
    for (const tr of res.trips) assert.ok(!B.shopsClosed(tr.date), 'zakupy w zamknięty dzień ' + tr.date);
    // obiady nie powtarzają się dzień po dniu poza gotowaniem na 2 dni
    const lunches = res.dates.map((d) => res.plan[d].find((m) => m.slot === 'obiad'));
    for (let i = 1; i < lunches.length; i++) if (lunches[i].cook) assert.notEqual(lunches[i].id, lunches[i - 1].id);
  });
  await tt('za mała kwota daje ostrzeżenie', () => {
    const c = mk();
    const res = P.compose(c, { amount: 40, from: B.addDays(B.today(), 1), days: 30, meals: ['sniadanie', 'obiad', 'kolacja'], cook2: true, seed: 1 });
    assert.ok(res.total > 40);
    assert.match(res.warnings[0], /się nie da/);
  });
  await tt('normy dzienne', () => {
    const tg = P.targets({ kcal: 2000, profile: { weight: 80 } });
    assert.equal(P.nutStatus(1950, tg.kcal), 'ok');
    assert.equal(P.nutStatus(1500, tg.kcal), 'low');
    assert.equal(P.nutStatus(6, tg.salt), 'high');
    assert.equal(tg.protein[0], 64);
  });
  return n;
}
