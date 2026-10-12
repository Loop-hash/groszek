// Testy logiki bez telefonu: node test/run.js
import assert from 'node:assert/strict';
import * as B from '../www/js/budget.js';
import * as D from '../www/js/dict.js';

let n = 0;
async function t(name, fn) {
  try { await fn(); n++; } catch (e) { console.error('BŁĄD:', name, '\n', e); process.exitCode = 1; }
}

const { normalize, matchesFor, tidy } = await import('../www/js/offers.js');

await t('okres od 1.', () => {
  const p = B.period('2026-10-11', 1);
  assert.equal(p.start, '2026-10-01'); assert.equal(p.end, '2026-10-31'); assert.equal(p.days, 31); assert.equal(p.dayIndex, 10); assert.equal(p.daysLeft, 21);
});
await t('okres od 10.', () => {
  const p = B.period('2026-10-05', 10);
  assert.equal(p.start, '2026-09-10'); assert.equal(p.end, '2026-10-09');
  const q = B.period('2026-01-03', 10);
  assert.equal(q.start, '2025-12-10'); assert.equal(q.end, '2026-01-09');
});
await t('budżet na dziś', () => {
  const st = { settings: { budget: 310, monthStart: 1 }, expenses: [{ date: '2026-10-01', amount: 10 }], savings: [] };
  const s = B.status(st, '2026-10-02');
  assert.equal(s.remaining, 300); assert.equal(s.perDay, 10); assert.equal(s.todayLeft, 10);
});
await t('pierwszy miesiąc od dnia instalacji', () => {
  const st = { settings: { budget: 210, monthStart: 1 }, expenses: [], savings: [], startedOn: '2026-10-11' };
  const s = B.status(st, '2026-10-11');
  assert.equal(s.planRemainingEnd, 200); assert.equal(s.aheadBy, 10);
});
await t('dni w limicie', () => {
  const st = { settings: { budget: 300, monthStart: 1 }, expenses: [{ date: '2026-09-01', amount: 5 }, { date: '2026-09-02', amount: 30 }], savings: [] };
  const p = B.period('2026-09-03', 1);
  const l = B.daysInLimit(st, p, '2026-09-03');
  assert.equal(l.total, 3); assert.equal(l.inLimit, 1); assert.equal(l.streak, 0); assert.equal(l.best, 1);
});
await t('poziomy', () => {
  assert.equal(B.levelFor(0).level, 1); assert.equal(B.levelFor(30).name, 'Kiełek'); assert.equal(B.levelFor(99).level, 2); assert.equal(B.levelFor(5000).level, 10);
});
await t('formatowanie', () => {
  assert.equal(B.fmt(1234.5), '1 234,50'); assert.equal(B.fmt(-3), '−3,00'); assert.equal(B.parseAmount('12,5'), 12.5);
});
await t('święta i niedziele', () => {
  assert.equal(B.easter(2026), '2026-04-05'); assert.ok(B.shopsClosed('2026-11-01')); assert.ok(B.shopsClosed('2026-10-11')); assert.ok(!B.shopsClosed('2026-10-12'));
  assert.ok(B.shopsClosed('2026-12-24')); assert.ok(B.shopsClosed('2026-06-04'));
});
await t('słownik', () => {
  assert.equal(D.classify('Chipsy paprykowe').cat, 'chipsy i przekąski');
  assert.equal(D.classify('mleko').ico, 'milk');
  assert.equal(D.classify('napój owsiany').treat, false);
  assert.equal(D.classify('pierś z kurczaka').ico, 'chicken');
  assert.equal(D.classify('makaron jajeczny').ico, 'pasta');
  assert.equal(D.classify('karma dla kota').known, false);
  assert.equal(D.classify('karma dla kota', { 'karma dla kota': { treat: true } }).treat, true);
});
await t('dopasowanie promocji', () => {
  const o = (name) => ({ name, brand: '' });
  assert.ok(D.offerMatches('pierś z kurczaka', o('Filety z piersi kurczaka')));
  assert.ok(!D.offerMatches('pierś z kurczaka', o('Piernik brzozowski')));
  assert.ok(!D.offerMatches('pierś z kurczaka', o('Ćwiartka z kurczaka')));
  assert.ok(!D.offerMatches('mleko', o('Czekolada mleczna')));
  assert.ok(D.offerMatches('jajka', o('Jaja z wolnego wybiegu L')));
  assert.ok(!D.offerMatches('jajka', o('Makaron jajeczny')));
  assert.ok(D.offerMatches('masło', o('PILOS, Masło ekstra')));
});
await t('oferta co druga sztuka', () => {
  const x = normalize({ name: 'Ser', price: 2.49, oldPrice: 6.49, cond: '-61% co druga szt.' });
  assert.equal(x.price, 4.49); assert.match(x.cond, /przy zakupie 2/);
  assert.equal(tidy('SIERPC LEKKI 135 G'), 'Sierpc lekki 135 g');
});
await t('kolejność dopasowań', () => {
  const offers = [
    { id: 'a', name: 'Kostka z fileta z piersi kurczaka', price: 11.99, from: '2026-10-01', to: '2026-10-20' },
    { id: 'b', name: 'Filet z piersi kurczaka', price: 39.99, oldPrice: 44.9, from: '2026-10-01', to: '2026-10-20' },
    { id: 'c', name: 'Filet z piersi kurczaka', price: 19.99, from: '2026-10-15', to: '2026-10-20' },
  ];
  const m = matchesFor('pierś z kurczaka', offers, '2026-10-11');
  assert.deepEqual(m.map((x) => x.id), ['b', 'a', 'c']);
});

await t('odczyt paragonu z tekstu', async () => {
  const { parseReceipt } = await import('../www/js/receipt.js');
  const a = parseReceipt(`JERONIMO MARTINS POLSKA S.A.\nBiedronka nr 1234\n2026-10-11 nr wydr. 123\nPARAGON FISKALNY\nMleko 2% 1 x3,99 3,99C\nChleb 1 x4,49 4,49C\nSPRZEDAZ OPODATK. C 8,48\nPTU C 5% 0,40\nSUMA PTU 0,40\nSUMA PLN 8,48\nKarta płatnicza 8,48`);
  assert.equal(a.total, 8.48); assert.equal(a.store, 'Biedronka'); assert.equal(a.date, '2026-10-11');
  const b = parseReceipt('Lidl sp. z o.o. sp. k.\n11.10.2026 18:22\nMasło 2,49 A\nDo zapłaty 12, 35\n');
  assert.equal(b.total, 12.35); assert.equal(b.store, 'Lidl'); assert.equal(b.date, '2026-10-11');
  const c2 = parseReceipt('KAUFLAND\nSUNA PLN 45.10\n');
  assert.equal(c2.total, 45.1);
  assert.equal(parseReceipt('SUMA PLN 3O,25\n').total, 30.25);
  assert.equal(parseReceipt('SUMA PLN 35 25\n').total, 35.25);
  const d = parseReceipt('coś tam 3,50\ninne 12,00\n');
  assert.equal(d.total, 12); assert.deepEqual(d.candidates, [3.5]);
});

await t('pozycje z paragonu: opusty, waga, zawinięte nazwy', async () => {
  const { parseReceipt, cleanName } = await import('../www/js/receipt.js');
  // jak Aldi: opust pod pozycją, jeden opust bez przecinka ("1000"), suma opustów
  const a = parseReceipt([
    'RLDI Sp. z o. o., ul. Testowa 1', 'NIP 1070002973', 'PARAGON FISKALNY',
    '* JOGURT NATURALNY 400G C  2SZT * 2,99 5,98 C', 'OPUST JOGURT NATURALNY 400G C  -1,00 C',
    'KASZA GRYCZANA 4006 C  18ZT * 3,49 3,490  |', 'UDKA Z KURCZAKA KG C  0,812kg x 12,90 10,47 C',
    'OPUST UDKA Z KURCZAKA KG C  1000', 'CHIPSY SOLONE 150G A  1SZT * 6,99 6,99 A',
    'Suma Opustów  -2,00', 'Sprzed. opod. PTU A  6,99', 'Sprzed. opod. PTU C  17,94', 'SUMA PLN  24,93', 'Karta 24,93',
  ].join('\n'));
  assert.equal(a.total, 24.93); assert.equal(a.store, 'Aldi');
  assert.equal(a.items.length, 4); assert.equal(a.itemsOk, true);
  assert.deepEqual(a.items.map((x) => [x.qty, x.total, x.disc || 0]), [[2, 5.98, 1], [1, 3.49, 0], [0.812, 10.47, 1], [1, 6.99, 0]]);
  assert.equal(a.items[1].name, 'Kasza gryczana 400g');
  // jak Kaufland: litera przy ilości, nazwa w osobnym wierszu nad ceną
  const k = parseReceipt([
    'Kaufland Polska Markety', 'PARAGON FISKALNY', 'MlekoWiejskie2%1L t 2SZT x3,29 6,58C', 'K-ClassicSerGoudaPlastry t',
    '1SZT x7,99 7,99C', 'Torba zakupowa  n 1SZT x0,89 0,89A', 'SPRZEDAŻ OPODATKOWANA A  0,89', 'SPRZEDAŻ OPODATKOWANA C  14,57', 'SUMA PLN  15,46',
  ].join('\n'));
  assert.equal(k.total, 15.46); assert.equal(k.itemsOk, true);
  assert.deepEqual(k.items.map((x) => x.name), ['Mleko Wiejskie 2%1L', 'K-Classic Ser Gouda Plastry', 'Torba zakupowa']);
  // suma się nie zgadza: pozycje są, ale bez pewności
  const z = parseReceipt('PARAGON FISKALNY\nMleko 1 x3,99 3,99C\nChleb 1 x4,49 4,49C\nSUMA PLN 10,48\nKarta 10,48');
  assert.equal(z.total, 10.48); assert.equal(z.items.length, 2); assert.equal(z.itemsOk, false);
  assert.equal(cleanName('KamisCzosnekGranu|owany16g  t'), 'Kamis Czosnek Granulowany 16g');
});

await t('baza cen z paragonów i kary w trybie ostrym', async () => {
  const P = await import('../www/js/prices.js');
  assert.equal(P.canonOf('Lubella świderki 400g'), 'świderki');
  assert.equal(P.canonOf('Płatki owsiane bł.500g'), 'płatki owsiane');
  assert.equal(P.canonOf('Mieszanka wedlowska'), null);
  const st = { prices: {}, learned: {}, settings: { strict: true, strictCats: { 'chipsy i przekąski': true } } };
  const items = [
    { name: 'Mleko UHT 3,2% 1L', qty: 2, unit: 'szt', price: 3.49, total: 6.98, disc: 1 },
    { name: 'Chipsy solone 150g', qty: 1, unit: 'szt', price: 6.99, total: 6.99 },
    { name: 'Coś nieczytelne', qty: 3, unit: 'szt', price: 2, total: 5 },
  ];
  assert.equal(P.recordPrices(st, 'Aldi', '2026-10-01', items), 2);
  assert.equal(P.pricesFor(st, 'mleko')[0].paid, 2.99);
  P.recordPrices(st, 'Lidl', '2026-10-03', [{ name: 'Mleko 3,2% 1l', qty: 1, unit: 'szt', price: 3.19, total: 3.19 }]);
  assert.deepEqual(P.pricesFor(st, 'mleko').map((x) => x.store), ['Lidl', 'Aldi']);
  const withTreat = items.map((x) => ({ ...x, ...P.describe(x, st) }));
  assert.deepEqual(withTreat.map((x) => x.treat), [false, true, false]);
  assert.equal(P.penaltyFor(withTreat, st, true).exp, 7);
  assert.equal(P.penaltyFor(withTreat, st, false).exp, 0);
  assert.equal(P.penaltyFor(withTreat, { ...st, settings: { strict: false } }, true).exp, 0);
  // nazwa ogólna z paragonu i promocja z gazetki tylko w czasie jej trwania
  assert.equal(P.generalName('Mlekovita mlekuht 3,2%1l'), 'Mleko 3,2% 1 l');
  assert.equal(P.generalName('Fairy Extra+650ml'), 'Płyn do naczyń 650 ml');
  const offer = { store: 'aldi', name: 'Mleko UHT 3,2%', price: 2.99, oldPrice: 4.49, from: '2026-10-01', to: '2026-10-05' };
  const milk = { name: 'Mleko 3,2% 1 l', raw: 'Mlekovita mlekuht 3,2%1l', qty: 2, unit: 'szt', price: 2.99, total: 5.98 };
  assert.equal(P.promoFor(milk, [offer], 'aldi', '2026-10-03').save, 3);
  assert.equal(P.promoFor(milk, [offer], 'aldi', '2026-10-09'), null);
  assert.equal(P.promoFor(milk, [offer], 'lidl', '2026-10-03'), null);
});

await t('lista: ilości, odmiany i literówki', async () => {
  const q = (s) => { const p = D.parseEntry(s); return [D.canonical(p.text, {}).name, p.qty, p.amount]; };
  assert.deepEqual(q('3 masło'), ['masło', 3, '']);
  assert.deepEqual(q('3 x mieso'), ['mięso', 3, '']);
  assert.deepEqual(q('fasola x 3'), ['fasola', 3, '']);
  assert.deepEqual(q('fasola x3'), ['fasola', 3, '']);
  assert.deepEqual(q('3x masła'), ['masło', 3, '']);
  assert.deepEqual(q('masło 3 szt'), ['masło', 3, '']);
  assert.deepEqual(q('2 kg ziemniaków'), ['ziemniaki', 1, '2 kg']);
  assert.deepEqual(q('mleko 3,2%'), ['mleko 3,2%', 1, '']);
  assert.deepEqual(q('jogurty pitne'), ['jogurt pitny', 1, '']);
  assert.deepEqual(q('mlkeo'), ['mleko', 1, '']);
  assert.equal(q('sałatka')[0], 'sałatka'); // znane słowo nie zmienia się w "sałatę"
  assert.equal(D.classify('draże').cat, 'słodycze');
  const learned = { 'cos dziwnego': { treat: true, name: 'coś dziwnego' } };
  assert.equal(D.classify('cosie dziwne', learned).treat, true);
  // "2 masła" dopisane do istniejącego masła zwiększa licznik
  const { addToList } = await import('../www/js/listlogic.js');
  const c = { state: { list: [], learned: {}, icons: {}, settings: { strict: false, strictCats: {} } }, save() {}, toast() {}, sheet() {} };
  addToList(c, 'masło', {}, { typed: true });
  addToList(c, '2 masła', {}, { typed: true });
  assert.equal(c.state.list.length, 1); assert.equal(c.state.list[0].qty, 3);
});

const extra = await import('./more.js').catch((e) => (e.code === 'ERR_MODULE_NOT_FOUND' ? null : Promise.reject(e)));
if (extra) await extra.default(t, assert);

console.log(process.exitCode ? 'Są błędy.' : `OK: ${n} testów`);
