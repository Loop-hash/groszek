// Wspólne kawałki HTML. Wszystko, co wpisał użytkownik albo przyszło z sieci, idzie przez esc().
import { ui, sprite, food, searchIcon } from './pixels.js';
import { fmt } from './budget.js';

export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const attr = esc;

export function topbar(title, sub = '', opts = {}) {
  const left = opts.left !== undefined ? opts.left : `<button class="sq" data-act="back" aria-label="Wróć">${ui('arrow', 22)}</button>`;
  const right = opts.right !== undefined ? opts.right : '<span class="sq ghost"></span>';
  return `<header class="topbar">${left}<div class="title"><b>${esc(title)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div>${right}</header>`;
}

export function iconBtn(act, icon, label, arg = '', size = 22) {
  return `<button class="sq" data-act="${act}" ${arg !== '' ? `data-arg="${esc(arg)}"` : ''} aria-label="${esc(label)}">${ui(icon, size)}</button>`;
}

export function toggle(act, on, label, arg = '') {
  return `<button class="toggle ${on ? 'on' : ''}" data-act="${act}" ${arg !== '' ? `data-arg="${esc(arg)}"` : ''} role="switch" aria-checked="${on ? 'true' : 'false'}" aria-label="${esc(label)}"><span></span></button>`;
}

export function chip(act, label, on, arg = '', extra = '') {
  return `<button class="chip ${on ? 'on' : ''} ${extra}" data-act="${act}" ${arg !== '' ? `data-arg="${esc(arg)}"` : ''} aria-pressed="${on ? 'true' : 'false'}">${esc(label)}</button>`;
}

export function check(act, on, label, arg = '') {
  return `<button class="check ${on ? 'on' : ''}" data-act="${act}" ${arg !== '' ? `data-arg="${esc(arg)}"` : ''} aria-pressed="${on ? 'true' : 'false'}" aria-label="${esc(label)}">${on ? ui('check', 16) : ''}</button>`;
}

export function search(id, value, placeholder, inputAct) {
  return `<label class="search">${searchIcon()}<input id="${id}" class="field" type="search" value="${esc(value)}" placeholder="${esc(placeholder)}" data-in="${inputAct}" autocomplete="off" enterkeyhint="search"></label>`;
}

export function zl(n, digits = 2) {
  return `${fmt(n, digits)} zł`;
}

export function priceTag(n) {
  return `<span class="price">${fmt(n)} zł</span>`;
}

export function empty(text, mood = 'pea') {
  return `<div class="empty-state stack" style="align-items:center">${sprite(mood, 72)}<div>${text}</div></div>`;
}

export function foodIcon(key, size = 28) {
  return food(key, size, 'ico');
}

export function section(label, right = '') {
  return `<div class="row between"><span class="label">${esc(label)}</span>${right}</div>`;
}

// Licznik [−] n [+]: data-act z argumentem -1 albo 1
export function stepper(act, n, min, max, label = '') {
  return `<span class="stepper"><button class="sq" data-act="${act}" data-arg="-1" aria-label="Mniej${label ? ' ' + esc(label) : ''}" ${n <= min ? 'aria-disabled="true" disabled' : ''}>${ui('minus', 18)}</button>` +
    `<b class="pixel">${n}</b><button class="sq" data-act="${act}" data-arg="1" aria-label="Więcej${label ? ' ' + esc(label) : ''}" ${n >= max ? 'aria-disabled="true" disabled' : ''}>${ui('plus', 18)}</button></span>`;
}

export function settingRow(title, sub, control) {
  return `<div class="item"><div class="grow stack" style="gap:2px"><span class="name">${title}</span>${sub ? `<span class="sub">${sub}</span>` : ''}</div>${control}</div>`;
}

// Polska odmiana: 1 dzień, 2 dni, 5 dni
export function plural(n, one, few, many) {
  const a = Math.abs(n);
  if (a === 1) return one;
  const d = a % 10;
  const t = a % 100;
  if (d >= 2 && d <= 4 && (t < 12 || t > 14)) return few;
  return many;
}
