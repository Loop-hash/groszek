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
  await tt('tryb rodzinny: plan dla 4 osób, zwykłe porcje, zakupy razy 4', () => {
    const c = mk({ people: 4 });
    assert.equal(B.people(c.state), 4); assert.ok(B.isFamily(c.state));
    c.state.settings.strict = true;
    assert.equal(B.strictOn(c.state), false); // w rodzinie bez kar exp
    const from = B.addDays(B.today(), 1);
    const one = P.compose(mk(), { amount: 300, from, days: 7, meals: ['sniadanie', 'obiad', 'kolacja'], cook2: true, seed: 2 });
    const fam = P.compose(c, { amount: 1200, from, days: 7, meals: ['sniadanie', 'obiad', 'kolacja'], cook2: true, seed: 2, people: 4 });
    for (const d of fam.dates) for (const m of fam.plan[d]) { assert.equal(m.n, 4); assert.ok(!m.mult || m.mult === 1, 'w rodzinie bez powiększania porcji'); }
    assert.ok(!fam.warnings.some((w) => /kcal/.test(w)), 'bez ostrzeżeń o kaloriach');
    assert.ok(fam.total <= 1200.5 || fam.warnings.length);
    assert.ok(one.total > 0);
    // ten sam plan liczony dla 1 i dla 4 osób: zakupy w gramach rosną 4 razy
    const plan1 = {};
    for (const d of fam.dates) plan1[d] = fam.plan[d].map((m) => ({ ...m, n: 1 }));
    const e1 = P.evaluate(c, plan1, fam.dates, {});
    const e4 = P.evaluate(c, fam.plan, fam.dates, {});
    const g = (e) => e.trips.reduce((a, tr) => a + tr.items.reduce((b, it) => b + it.g, 0), 0);
    assert.ok(g(e4) > g(e1) * 1.8, `${g(e4)} vs ${g(e1)}`); // mniej niż 4 razy: jedna osoba i tak kupuje całe opakowania
    // koszt dnia w planerze razy liczba osób
    c.state.plan = { [from]: [{ id: fam.plan[from][0].id, slot: 'obiad', n: 4 }] };
    const r = R.findRecipe(c, fam.plan[from][0].id);
    assert.equal(P.dayTotals(c, from).cost, Math.round(R.recipeCost(c, r).perPortion * 4 * 100) / 100);
  });
  await tt('promocje w planie: warunki, aplikacje, opakowania i dopasowanie', async () => {
    const O = await import('../www/js/offers.js');
    const d = '2026-10-19';
    const off = (x) => ({ id: x.name, from: d, to: '2026-10-21', brand: '', detail: '', unitPrice: '', oldPrice: null, cond: '', ...x });
    const promos = { updated: 'test-plan', offers: [
      off({ store: 'kaufland', name: 'FigAnd Świeżuch Serek homogenizowany', detail: '400 g opakowanie', price: 4.99, unitPrice: '=1 kg 12,48' }),
      off({ store: 'kaufland', name: 'Ser twarogowy półtłusty', detail: '100 g', price: 1.79 }),
      off({ store: 'kaufland', name: 'Ser Morski', brand: 'Mlekpol', detail: '100 g', price: 1.89 }),
      off({ store: 'lidl', name: 'Masło ekstra 83%', brand: 'PILOS', detail: '200 g, limit 3 opak. na kupon', price: 2.49, oldPrice: 4.99, cond: 'kupon Lidl Plus, przy 3 szt.' }),
      off({ store: 'aldi', name: 'Szynka konserwowa', brand: 'KRAKUS', detail: 'Puszka 455 g', price: 5.99, oldPrice: 15.59, unitPrice: '=1 kg 13,16', cond: '-61% co druga szt.' }),
      off({ store: 'lidl', name: 'Świeże jaja ściółkowe, wielkość M', detail: '30 szt.', price: 20.99 }),
    ] };
    const c = { state: defaults(), data: { ...data, promos }, app: {} };
    const ser = R.priceOf(c, 'ser_zolty', d);
    assert.equal(ser.offer && ser.offer.name, 'Ser Morski'); // ani serek homogenizowany, ani twaróg
    // warunki
    const T = (x) => O.offerTerms(O.normalize(off(x)));
    assert.deepEqual(T({ price: 2.49, cond: 'kupon Lidl Plus, przy 3 szt.' }), { app: 'lidlplus', min: 3, each: 2.49 });
    assert.equal(T({ price: 3.99, cond: '-33% przy zakupie 2 szt.' }).min, 2);
    assert.deepEqual(T({ price: 5.99, oldPrice: 15.59, cond: '-61% co druga szt.' }), { app: null, min: 2, each: 10.79 });
    assert.deepEqual(T({ price: 9.99, cond: '1+1 gratis' }), { app: null, min: 2, each: 5 });
    assert.equal(T({ price: 1, cond: 'z kartą Kaufland Card' }).app, 'kauflandcard');
    // masło z kuponem Lidl Plus nie liczy się bez aplikacji
    assert.equal(R.priceOf(c, 'maslo', d).offer, null);
    const withApp = { state: defaults(), data: { ...data, promos }, app: {} };
    withApp.state.settings.cards = { lidlplus: true };
    assert.equal(P.bestBuy(c, R.ing(c, 'maslo'), 'maslo', 600, d).promo, null); // bez aplikacji nawet przy 3 kostkach zwykła cena
    assert.equal(P.bestBuy(withApp, R.ing(withApp, 'maslo'), 'maslo', 200, d).promo, null); // jedna kostka: 3 z kuponu to za dużo
    const m3 = P.bestBuy(withApp, R.ing(withApp, 'maslo'), 'maslo', 600, d);
    assert.equal(m3.packs, 3); assert.equal(m3.price, 7.47); assert.equal(m3.cond, 'przy 3 szt.');
    // „co druga taniej”: cena za kg ze średniej, nie z tańszej sztuki
    const ham = O.normalize(promos.offers[4]);
    assert.ok(Math.abs(R.offerPerKg(ham, R.ing(c, 'szynka')) - 10.79 / 0.455) < 0.05);
    // szynka na 400 g: dwie puszki po 455 g się nie opłacają; na 900 g już tak
    const h1 = P.bestBuy(c, R.ing(c, 'szynka'), 'szynka', 400, d);
    assert.ok(!h1.promo || h1.promo.brand !== 'KRAKUS', JSON.stringify(h1));
    const h2 = P.bestBuy(c, R.ing(c, 'szynka'), 'szynka', 900, d);
    assert.equal(h2.promo && h2.promo.brand, 'KRAKUS'); assert.equal(h2.packs, 2); assert.equal(h2.price, 21.58); assert.equal(h2.cond, 'przy 2 szt.');
    // 30 jaj w promocji: przy 9 jajkach taniej zwykłe 10, przy 28 jajkach promocja
    const e1 = P.bestBuy(c, R.ing(c, 'jajka'), 'jajka', 450, d);
    assert.equal(e1.promo, null); assert.equal(P.buyLabel({ ...e1, piece: 50 }), '1 × 10 szt.');
    const e2 = P.bestBuy(c, R.ing(c, 'jajka'), 'jajka', 1400, d);
    assert.equal(e2.promo && e2.promo.detail, '30 szt.'); assert.equal(e2.price, 20.99); assert.equal(P.buyLabel({ ...e2, piece: 50 }), '1 × 30 szt.');
  });
  await tt('pusta szafka: przyprawy w zakupach, bez drogich dodatków', () => {
    const c = mk();
    const from = B.addDays(B.today(), 1);
    const o = { amount: 100, from, days: 14, meals: ['sniadanie', 'obiad', 'kolacja'], cook2: true, seed: 1 };
    const full = P.compose(c, o);
    assert.ok(full.pantry.length > 0 && full.pantryCost > 0); // bez opcji: przyprawy tylko do sprawdzenia, z szacunkiem kosztu
    const empty = P.compose(c, { ...o, emptyPantry: true });
    const bought = empty.trips.flatMap((tr) => tr.items.filter((it) => it.pantry));
    assert.ok(bought.some((it) => it.name === 'Olej rzepakowy'));
    assert.ok(bought.every((it) => it.g > 0 && it.price > 0), 'każda rzecz to co najmniej jedno opakowanie');
    assert.ok(!bought.some((it) => ['Miód', 'Oliwa z oliwek', 'Kakao'].includes(it.name)), bought.map((it) => it.name).join(', '));
    assert.equal(empty.pantry.length, 0);
    assert.ok(empty.total > full.total); // szafka kosztuje
    assert.ok(empty.total <= 100.5 || /się nie da/.test(empty.warnings[0])); // uczciwie: albo się mieści, albo mówi, że nie
  });
  await tt('przepis przeliczony na inną liczbę porcji', () => {
    assert.equal(R.scaleQ('2 puszki', 4 / 3), '2½ puszki');
    assert.equal(R.scaleQ('1 łyżeczka', 4), '4 łyżeczki');
    assert.equal(R.scaleQ('6 placków', 4 / 3), '8 placków');
    assert.equal(R.scaleQ('4 duże', 4 / 3), '5 dużych');
    assert.equal(R.scaleQ('pół bagietki', 4), '2 bagietki');
    assert.equal(R.scaleQ('do smażenia', 2), 'do smażenia');
    assert.equal(R.scaleQ('3 żółtka i 1 całe', 2), null);
    const c = mk({ people: 4 });
    assert.equal(R.qty(c, { i: 'fasola_biala', g: 480, q: '2 puszki' }, 4 / 3), '2½ puszki (640 g)');
    assert.equal(R.qty(c, { i: 'kielbasa', g: 200 }, 4 / 3), '270 g');
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
