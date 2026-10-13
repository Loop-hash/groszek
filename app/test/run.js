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

await t('lista: wszystkie sposoby wpisania ilości', async () => {
  const q = (s) => { const p = D.parseEntry(s); return `${D.canonical(p.text, {}).name} | ${p.qty} | ${p.amount}`; };
  const cases = {
    // liczba przed nazwą, ze spacją i bez, z x, ×, *, szt.
    '3 masło': 'masło | 3 | ', '3masło': 'masło | 3 | ', '3maslo': 'masło | 3 | ', '3 MASŁO': 'masło | 3 | ',
    '3x masło': 'masło | 3 | ', '3 x masło': 'masło | 3 | ', '3× masło': 'masło | 3 | ', '3* masło': 'masło | 3 | ',
    'x3 masło': 'masło | 3 | ', '3szt masło': 'masło | 3 | ', '3 szt. masło': 'masło | 3 | ', '3 sztuki masła': 'masło | 3 | ',
    // liczba za nazwą
    'masło 3': 'masło | 3 | ', 'masło3': 'masło | 3 | ', 'maslo3': 'masło | 3 | ', 'MASŁO3': 'masło | 3 | ',
    'masło x3': 'masło | 3 | ', 'masło 3x': 'masło | 3 | ', 'masło3x': 'masło | 3 | ', 'masło ×3': 'masło | 3 | ',
    'masło 3szt': 'masło | 3 | ', 'masło 3 sztuki': 'masło | 3 | ', 'masło szt. 3': 'masło | 3 | ', 'masło x 3 szt': 'masło | 3 | ',
    'masło (3)': 'masło | 3 | ', 'masło(3)': 'masło | 3 | ', 'masło (3 szt.)': 'masło | 3 | ', 'masło [3]': 'masło | 3 | ',
    'masło - 3': 'masło | 3 | ', 'masło-3': 'masło | 3 | ', 'masło: 3': 'masło | 3 | ', 'masło = 3': 'masło | 3 | ',
    'masło x': 'masło | 1 | ', '- masło 3': 'masło | 3 | ', '• masło': 'masło | 1 | ',
    // słownie
    'trzy masła': 'masło | 3 | ', 'dwa mleka': 'mleko | 2 | ', 'pięć jajek': 'jajka | 5 | ', 'piec jajek': 'jajka | 5 | ',
    'tuzin jajek': 'jajka | 12 | ', 'pół tuzina jajek': 'jajka | 6 | ', '2 tuziny jajek': 'jajka | 24 | ', 'jedna cebula': 'cebula | 1 | ',
    '2-3 jabłka': 'jabłka | 3 | ', 'kilka jabłek': 'jabłka | 1 | kilka', 'pół arbuza': 'arbuz | 1 | pół',
    '10 jaj': 'jajka | 10 | ', 'jaja 10': 'jajka | 10 | ', '5 marchewek': 'marchew | 5 | ', '2 masełka': 'masło | 2 | ',
    // waga i objętość
    '2 kg ziemniaków': 'ziemniaki | 1 | 2 kg', '2kg ziemniaków': 'ziemniaki | 1 | 2 kg', 'ziemniaki 2kg': 'ziemniaki | 1 | 2 kg',
    'dwa kilo ziemniaków': 'ziemniaki | 1 | 2 kg', 'kilo ziemniaków': 'ziemniaki | 1 | 1 kg', 'pół kilo sera': 'ser | 1 | 0,5 kg',
    'półtora kilo ziemniaków': 'ziemniaki | 1 | 1,5 kg', '0.5kg sera': 'ser | 1 | 0,5 kg', '1/2 kg sera': 'ser | 1 | 0,5 kg',
    '500g sera': 'ser | 1 | 500 g', 'ser 50dag': 'ser | 1 | 50 dag', '10 deko szynki': 'szynka | 1 | 10 dag', 'szynka 20 dkg': 'szynka | 1 | 20 dag',
    'mleko 2l': 'mleko | 1 | 2 l', 'dwa litry mleka': 'mleko | 1 | 2 l', 'litr mleka': 'mleko | 1 | 1 l', 'pół litra śmietany': 'śmietana | 1 | 0,5 l',
    'około 2 kg ziemniaków': 'ziemniaki | 1 | 2 kg', 'ziemniaki ok. 2 kg': 'ziemniaki | 1 | 2 kg', '2 kg cukru': 'cukier | 1 | 2 kg',
    // sztuki razy waga
    '6x1,5l woda': 'woda | 6 | 1,5 l', 'woda 6x1,5l': 'woda | 6 | 1,5 l', '2 x 1 kg cukru': 'cukier | 2 | 1 kg',
    'cukier 1kg x2': 'cukier | 2 | 1 kg', 'mleko 2 l 3': 'mleko | 3 | 2 l', '3 x 2 l mleka': 'mleko | 3 | 2 l',
    // opakowania
    '2 opak. jajek': 'jajka | 2 | 2 opakowania', '2op jajek': 'jajka | 2 | 2 opakowania', 'jajka 2 opak.': 'jajka | 2 | 2 opakowania',
    '3 puszki pomidorów': 'pomidory | 3 | 3 puszki', 'pomidory 3 puszki': 'pomidory | 3 | 3 puszki', 'puszka pomidorów': 'pomidory | 1 | 1 puszka',
    '5 puszek pomidorów': 'pomidory | 5 | 5 puszek', 'dwie kostki masła': 'masło | 2 | 2 kostki', 'pół kostki masła': 'masło | 1 | pół kostki',
    '2 puszki pomidorów po 400 g': 'pomidory | 2 | 2 puszki po 400 g', '2 zgrzewki wody 1,5l': 'woda | 2 | 2 zgrzewki po 1,5 l',
    // liczby, które są częścią nazwy
    'mleko 3,2%': 'mleko 3,2% | 1 | ', 'mleko 3,2% 2': 'mleko 3,2% | 2 | ', '2 mleko 3,2%': 'mleko 3,2% | 2 | ', 'jogurt 0%': 'jogurt 0% | 1 | ',
    '7up': '7up | 1 | ', '2 7up': '7up | 2 | ', '3bit': '3bit | 1 | ', 'chleb 5 zbóż': 'chleb 5 zbóż | 1 | ', 'chleb 5 zbóż 2': 'chleb 5 zbóż | 2 | ',
    'tran omega 3': 'tran omega 3 | 1 | ', 'kawa 3w1': 'kawa 3w1 | 1 | ', 'witamina d3': 'witamina d3 | 1 | ',
    'pepsi 0,5': 'pepsi 0,5 | 1 | ', 'pepsi 0,5 2': 'pepsi 0,5 | 2 | ', 'cola 0,5l': 'cola | 1 | 0,5 l', 'masło 100': 'masło 100 | 1 | ',
    'mleko 2% 1l': 'mleko 2% | 1 | 1 l', '3': '3 | 1 | ',
  };
  for (const [inp, want] of Object.entries(cases)) assert.equal(q(inp), want, inp);
  // kilka rzeczy w jednym wpisie
  const sp = (s) => D.splitEntries(s).map(q);
  assert.deepEqual(sp('masło, 2 mleka i chleb'), ['masło | 1 | ', 'mleko | 2 | ', 'chleb | 1 | ']);
  assert.deepEqual(sp('3 masła 2 mleka'), ['masło | 3 | ', 'mleko | 2 | ']);
  assert.deepEqual(sp('masło 3 mleko 2'), ['masło | 3 | ', 'mleko | 2 | ']);
  assert.deepEqual(sp('2 kg ziemniaków 3 masła'), ['ziemniaki | 1 | 2 kg', 'masło | 3 | ']);
  assert.deepEqual(sp('masło 82% 2 mleko 3,2% 3'), ['masło 82% | 2 | ', 'mleko 3,2% | 3 | ']);
  assert.deepEqual(sp('masło, 3'), ['masło | 3 | ']);
  assert.deepEqual(sp('mleko 3,2%, chleb'), ['mleko 3,2% | 1 | ', 'chleb | 1 | ']);
  assert.deepEqual(sp('masło\nmleko; chleb + sól'), ['masło | 1 | ', 'mleko | 1 | ', 'chleb | 1 | ', 'sól | 1 | ']);
  // ta sama rzecz drugi raz: sztuki, opakowania i waga się sumują
  const { addToList, addEntries } = await import('../www/js/listlogic.js');
  const c = { state: { list: [], learned: {}, icons: {}, settings: { strict: false, strictCats: {} } }, save() {}, toast() {}, sheet() {}, render() {} };
  const add = (s) => addEntries(c, s);
  const item = (n) => c.state.list.find((i) => i.name === n);
  add('3maslo'); add('maslo3'); assert.equal(item('masło').qty, 6);
  add('3 puszki pomidorów'); add('2 puszki pomidorów'); assert.equal(item('pomidory').amount, '5 puszek'); assert.equal(item('pomidory').qty, 5);
  add('pomidory'); assert.equal(item('pomidory').amount, '6 puszek');
  add('2 kg ziemniaków'); add('ziemniaki 500g'); assert.equal(item('ziemniaki').amount, '2,5 kg');
  add('mleko 1l'); add('500 ml mleka'); assert.equal(item('mleko').amount, '1,5 l');
  add('szynka 20 dag'); add('10 dag szynki'); assert.equal(item('szynka').amount, '30 dag');
  add('chleb, 2 bułki i jajka 10'); assert.ok(item('chleb') && item('bułki').qty === 2 && item('jajka').qty === 10);
  assert.equal(D.qtyText({ qty: 2, amount: '1 kg' }), '2 × 1 kg'); assert.equal(D.qtyText({ qty: 3 }), '×3');
  assert.equal(D.qtyText({ qty: 3, amount: '3 puszki' }), '3 puszki');
  const it = { qty: 2, amount: '2 puszki po 400 g' }; D.setQty(it, 5); assert.equal(it.amount, '5 puszek po 400 g');
  assert.equal(D.stepLabel({ qty: 2, amount: '2 puszki' }), 'Ile puszek');
  assert.equal(addToList(c, 'masło', {}, {}), false); // z przepisu: już jest, bez dodawania
});

await t('ciekawostki: bez powtórek, dopóki nie pokażą się wszystkie', async () => {
  const { FACTS, GENERAL, CHARS, nextFactIndex, nextCharacterIndex } = await import('../www/js/facts.js');
  assert.ok(FACTS.length >= 100);
  assert.equal(GENERAL.length + CHARS.length, FACTS.length);
  const st = {};
  const seen = new Set();
  for (let k = 0; k < GENERAL.length; k++) seen.add(nextFactIndex(st));
  assert.equal(seen.size, GENERAL.length);
  for (const i of seen) assert.ok(!FACTS[i].k); // postacie tylko z przebraniem
  const again = nextFactIndex(st); // nowe losowanie po komplecie
  assert.ok(GENERAL.includes(again)); assert.equal(st.facts.pos, 1);
  const chars = new Set();
  for (let k = 0; k < CHARS.length; k++) chars.add(nextCharacterIndex(st));
  assert.equal(chars.size, CHARS.length);
  for (const f of FACTS) assert.ok(f.t.length <= 150, f.t);
  // stary stan ze wszystkimi ciekawostkami w kolejce: nowe losowanie, bez postaci
  const old = { facts: { order: FACTS.map((_, i) => i), pos: 3 } };
  assert.ok(!FACTS[nextFactIndex(old)].k);
});

await t('ciekawostki: postać rzadko i nigdy dwa razy z rzędu', async () => {
  const { FACTS, pickOpening, CHAR_CHANCE } = await import('../www/js/facts.js');
  assert.ok(CHAR_CHANCE > 0 && CHAR_CHANCE <= 0.2);
  const st = {};
  const kinds = [];
  for (let k = 0; k < 6; k++) kinds.push(!!FACTS[pickOpening(st, () => 0)].k); // los zawsze „trafia”
  assert.deepEqual(kinds, [true, false, true, false, true, false]);
  const st2 = {};
  for (let k = 0; k < 10; k++) assert.ok(!FACTS[pickOpening(st2, () => 0.5)].k);
  let n = 0;
  const st3 = {};
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 2000; k++) if (FACTS[pickOpening(st3, rnd)].k) n++;
  assert.ok(n > 120 && n < 300, String(n)); // około co ósme otwarcie
});

await t('przebrania: 21 postaci, każda z ciekawostką i kuchnią z przepisami', async () => {
  const { COSTUMES } = await import('../www/js/costumes-data.js');
  const { FACTS } = await import('../www/js/facts.js');
  const { costumeByKey, randomRecipe } = await import('../www/js/costumes.js');
  const fs = await import('node:fs');
  const recipes = JSON.parse(fs.readFileSync(new URL('../../data/recipes.json', import.meta.url))).recipes;
  const countries = new Set(recipes.map((r) => r.country));
  const keys = Object.values(COSTUMES).map((x) => x.key);
  assert.equal(keys.length, 21); assert.equal(new Set(keys).size, 21);
  for (const [country, cos] of Object.entries(COSTUMES)) {
    assert.ok(countries.has(country), country);
    for (const m of ['pea', 'happy', 'worried']) {
      assert.equal(cos.rows[m].length, 38); assert.ok(cos.rows[m].every((r) => r.length === 32), cos.key);
    }
    assert.equal(costumeByKey(cos.key).country, country);
  }
  const factKeys = FACTS.filter((f) => f.k).map((f) => f.k);
  assert.deepEqual([...factKeys].sort(), [...keys].sort()); // każda postać ma dokładnie jedną ciekawostkę
  for (const c of countries) if (c !== 'Podstawy') assert.ok(COSTUMES[c], c); // każda kuchnia ma postać
  const settings = { cuisines: {}, avoid: {}, gear: { '1 palnik': true, 'Piekarnik': true, 'Blender': true, 'Mikrofala': true, 'Toster': true } };
  const c = { state: { customRecipes: [], settings, ratings: {} }, data: { recipes: { recipes } } };
  const id = randomRecipe(c, 'Polska', () => 0.5);
  assert.equal(recipes.find((r) => r.id === id).country, 'Polska');
  settings.cuisines.Polska = false; // kuchnia wyłączona: bez linku
  assert.equal(randomRecipe(c, 'Polska'), null);
  assert.equal(costumeByKey('nikt'), null);
});

await t('piksele: rumieńce i czerwone detale', async () => {
  const { pixelSvg, sprite } = await import('../www/js/pixels.js');
  assert.ok(sprite('happy', 40).includes('px-cheek'));
  assert.ok(pixelSvg(['#rco'], 8).includes('px-red'));
});

await t('kopia: eksport i import, stare i uszkodzone pola', async () => {
  const S = await import('../www/js/store.js');
  const st = S.defaults();
  st.expenses.push({ id: 'a', amount: 12.5, date: '2026-10-01', store: 'Lidl' });
  const back = S.importJson(S.exportJson(st));
  assert.deepEqual(back.expenses, st.expenses);
  assert.equal(back.settings.budget, st.settings.budget);
  // stara kopia bez nowych pól i z nullami tam, gdzie powinny być listy i obiekty
  const old = S.importJson(JSON.stringify({ app: 'groszek', state: { settings: { budget: 450 }, ratings: null, list: 5, plan: [], expenses: null } }));
  assert.equal(old.settings.budget, 450);
  assert.deepEqual(old.ratings, {}); assert.deepEqual(old.list, []); assert.deepEqual(old.expenses, []);
  assert.equal(typeof old.plan, 'object'); assert.ok(!Array.isArray(old.plan));
  assert.deepEqual(old.chars, { order: [], pos: 0 }); assert.equal(old.settings.costume, true);
  assert.throws(() => S.importJson('{"foo": 1}'));
});

await t('kod: każda funkcja z innego pliku jest zaimportowana', async () => {
  // łapie błędy typu „sprite is not defined”, które wychodzą dopiero po kliknięciu w apce
  const fs = await import('node:fs');
  const path = await import('node:path');
  const root = new URL('../www/js', import.meta.url).pathname;
  const files = [];
  (function walk(d) {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (f === 'vendor') continue;
      if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith('.js')) files.push(p);
    }
  })(root);
  const exported = new Set();
  for (const f of files) for (const m of fs.readFileSync(f, 'utf8').matchAll(/export (?:async )?(?:function|const|let) (\w+)/g)) exported.add(m[1]);
  const missing = [];
  for (const f of files) {
    const code = fs.readFileSync(f, 'utf8').replace(/\/\/.*$/gm, '').replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
    const known = new Set();
    for (const m of code.matchAll(/import\s*\{([^}]*)\}/g)) for (const n of m[1].split(',')) known.add(n.trim().split(/\s+as\s+/).pop());
    for (const m of code.matchAll(/(?:function|const|let|var)\s+(\w+)/g)) known.add(m[1]);
    for (const m of code.matchAll(/^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/gm)) known.add(m[1]); // metody w obiektach
    for (const m of code.matchAll(/(?<![.\w$])(\w+)\s*\(/g)) {
      if (exported.has(m[1]) && !known.has(m[1])) missing.push(`${path.relative(root, f)}: ${m[1]}`);
    }
  }
  assert.deepEqual([...new Set(missing)], []);
});

await t('aktualizacja: sama strona albo APK', async () => {
  const D2 = await import('../www/js/data.js');
  const real = globalThis.fetch;
  const asset = (name, size) => ({ name, size, browser_download_url: 'https://x/' + name });
  globalThis.fetch = async () => ({ ok: true, json: async () => ({
    name: 'Groszek 0.1.40', body: 'Groszek 0.1.40\n\nbuild: 40\nnative: 3f2a9c01bd77',
    assets: [asset('nowa-groszek.apk', 1), asset('groszek.apk', 60e6), asset('groszek-www.zip', 4e5), asset('groszek-vendor.zip', 5e6)],
  }) });
  try {
    const u = await D2.checkUpdate(39);
    assert.equal(u.build, 40); assert.equal(u.newer, true); assert.equal(u.native, '3f2a9c01bd77');
    assert.equal(u.url, 'https://x/groszek.apk'); assert.equal(u.web.url, 'https://x/groszek-www.zip'); assert.equal(u.vendor.size, 5e6);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ body: 'build: 41', assets: [asset('groszek.apk', 1)] }) });
    const old = await D2.checkUpdate(40);
    assert.equal(old.native, ''); assert.equal(old.web, null); assert.equal(old.newer, true);
  } finally {
    globalThis.fetch = real;
  }
});

const extra = await import('./more.js').catch((e) => (e.code === 'ERR_MODULE_NOT_FOUND' ? null : Promise.reject(e)));
if (extra) await extra.default(t, assert);

console.log(process.exitCode ? 'Są błędy.' : `OK: ${n} testów`);
