// Wiersze produktów z jednych zakupów: w historii i na ekranie wydatku.
import { classify } from './dict.js';
import { food, sprite } from './pixels.js';
import { esc } from './ui.js';
import { fmt } from './budget.js';
import { paidOf } from './prices.js';

// Stare wydatki trzymały produkty jako napisy ("masło ×3")
export const asItem = (x) => (typeof x === 'string' ? { name: x } : x || { name: '' });

const num = (v) => String(v).replace('.', ',');

export function qtyText(x) {
  if (x.unit === 'kg' && x.qty) return num(x.qty) + ' kg';
  if (x.size) return x.size;
  if (x.qty > 1) return '×' + num(x.qty);
  return '';
}

function subText(x) {
  const parts = [];
  if (x.unit === 'kg' && x.price) parts.push(`${fmt(x.price)} zł/kg`);
  else if (x.qty > 1 && x.price) parts.push(`${num(x.qty)} × ${fmt(x.price)} zł`);
  if (x.disc > 0) parts.push(`rabat −${fmt(x.disc)} zł`);
  else if (x.promo === 'gazetka') parts.push(x.save > 0 ? `w gazetce, taniej o ${fmt(x.save)} zł` : 'w gazetce');
  return parts.join(' · ');
}

// act: akcja po dotknięciu wiersza (z indeksem jako argumentem); bez niej wiersze są tylko do czytania
export function buyRows(items, act = '') {
  return (items || []).map((raw, i) => {
    const x = asItem(raw);
    const ico = x.ico || classify(x.name).ico;
    const q = qtyText(x);
    const sub = subText(x);
    const paid = x.total != null ? paidOf(x) : null;
    const inner = `${food(ico, 24)}<span class="grow stack" style="gap:0;min-width:0"><span class="bname">${esc(x.name)}${q ? ` <span class="qty">${esc(q)}</span>` : ''}</span>` +
      `${sub ? `<span class="tiny muted">${esc(sub)}</span>` : ''}</span>` +
      `${x.treat ? `<span class="btreat" title="zachcianka">${sprite('angry', 22)}</span>` : ''}${x.promo || x.disc > 0 ? '<span class="btag">promo</span>' : ''}` +
      `${paid != null ? `<span class="bprice pixel">${fmt(paid)}</span>` : ''}`;
    return act ? `<button class="bitem" data-act="${act}" data-arg="${i}">${inner}</button>` : `<div class="bitem">${inner}</div>`;
  }).join('');
}
