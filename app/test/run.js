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
  assert.equal(D.classify('kalarepa').known, false);
  assert.equal(D.classify('kalarepa', { kalarepa: { treat: true } }).treat, true);
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

const extra = await import('./more.js').catch((e) => (e.code === 'ERR_MODULE_NOT_FOUND' ? null : Promise.reject(e)));
if (extra) await extra.default(t, assert);

console.log(process.exitCode ? 'Są błędy.' : `OK: ${n} testów`);
