// Liczenie budżetu, okresów rozliczeniowych, poziomów i podsumowań. Bez DOM, żeby dało się testować.

export const r2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

export function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseYmd(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function addDays(s, n) {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

export function diffDays(a, b) {
  return Math.round((parseYmd(b) - parseYmd(a)) / 86400000);
}

export const today = () => ymd(new Date());

const MONTHS = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
const MONTHS_GEN = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
const DOW = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
const DOW_SHORT = ['ND', 'PN', 'WT', 'ŚR', 'CZ', 'PT', 'SO'];

export const monthName = (s) => MONTHS[parseYmd(s).getMonth()];
export const dayLabel = (s) => `${parseYmd(s).getDate()} ${MONTHS_GEN[parseYmd(s).getMonth()]}`;
export const dowName = (s) => DOW[parseYmd(s).getDay()];
export const dowShort = (s) => DOW_SHORT[parseYmd(s).getDay()];
export const shortDate = (s) => { const d = parseYmd(s); return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`; };

// Okres rozliczeniowy zaczyna się w dniu startDay każdego miesiąca.
export function period(dateStr, startDay = 1) {
  const d = parseYmd(dateStr);
  const sd = Math.min(Math.max(1, startDay | 0), 28);
  let y = d.getFullYear();
  let m = d.getMonth();
  if (d.getDate() < sd) { m -= 1; if (m < 0) { m = 11; y -= 1; } }
  const start = new Date(y, m, sd, 12);
  const next = new Date(y, m + 1, sd, 12);
  const end = new Date(next); end.setDate(end.getDate() - 1);
  const s = ymd(start);
  const e = ymd(end);
  const days = diffDays(s, e) + 1;
  const dayIndex = diffDays(s, dateStr);
  return { start: s, end: e, days, dayIndex, daysLeft: days - dayIndex, label: MONTHS[start.getMonth()], month: s.slice(0, 7) };
}

export function previousPeriod(p, startDay = 1) {
  return period(addDays(p.start, -1), startDay);
}

export function spentIn(expenses, from, to) {
  let sum = 0;
  for (const e of expenses) if (e.date >= from && e.date <= to) sum += e.amount;
  return r2(sum);
}

export function status(state, dateStr = today()) {
  const budget = Number(state.settings.budget) || 0;
  const p = period(dateStr, state.settings.monthStart);
  const spent = spentIn(state.expenses, p.start, p.end);
  const spentToday = spentIn(state.expenses, dateStr, dateStr);
  const spentBefore = r2(spent - spentToday);
  const remaining = r2(budget - spent);
  const perDay = p.daysLeft > 0 ? r2((budget - spentBefore) / p.daysLeft) : 0;
  const todayLeft = r2(perDay - spentToday);
  // plan: tyle powinno zostać na koniec dzisiejszego dnia (w pierwszym miesiącu liczony od dnia instalacji)
  const st0 = planStart(state, p);
  const pDays = diffDays(st0, p.end) + 1;
  const pIdx = Math.max(0, diffDays(st0, dateStr));
  const planRemainingEnd = r2(budget * (pDays - (pIdx + 1)) / pDays);
  const aheadBy = r2(remaining - planRemainingEnd);
  const fracRemaining = budget > 0 ? Math.max(0, Math.min(1, remaining / budget)) : 0;
  const fracPlan = budget > 0 ? Math.max(0, Math.min(1, planRemainingEnd / budget)) : 0;
  let mood = 'pea';
  if (remaining < 0 || todayLeft < -0.005) mood = 'worried';
  else if (aheadBy > budget * 0.02) mood = 'happy';
  return { budget, period: p, spent, spentToday, spentBefore, remaining, perDay, todayLeft, planRemainingEnd, aheadBy, fracRemaining, fracPlan, mood };
}

// Dni "w limicie": suma wydatków do końca dnia nie przekracza planu na ten dzień.
export function planStart(state, p) {
  const s = state.startedOn;
  return s && s > p.start && s <= p.end ? s : p.start;
}

export function daysInLimit(state, p, upTo) {
  const budget = Number(state.settings.budget) || 0;
  const last = upTo < p.end ? upTo : p.end;
  const first = planStart(state, p);
  const pDays = diffDays(first, p.end) + 1;
  const byDay = {};
  for (const e of state.expenses) if (e.date >= p.start && e.date <= last) byDay[e.date] = (byDay[e.date] || 0) + e.amount;
  let cum = 0;
  for (const d of Object.keys(byDay)) if (d < first) cum += byDay[d];
  let inLimit = 0;
  let streak = 0;
  let best = 0;
  let total = 0;
  for (let i = 0, d = first; d <= last; i++, d = addDays(d, 1)) {
    cum += byDay[d] || 0;
    total++;
    const ok = cum <= budget * (i + 1) / pDays + 0.005;
    if (ok) { inLimit++; streak++; best = Math.max(best, streak); } else { streak = 0; }
  }
  return { inLimit, total, streak, best };
}

export const LEVELS = [
  { at: 0, name: 'Ziarenko' }, { at: 30, name: 'Kiełek' }, { at: 100, name: 'Strączek' }, { at: 200, name: 'Groszek z ogródka' },
  { at: 350, name: 'Złoty strąk' }, { at: 550, name: 'Król grządki' }, { at: 800, name: 'Mistrz promocji' }, { at: 1100, name: 'Legenda dyskontu' },
  { at: 1500, name: 'Groszek wszechmocny' }, { at: 2000, name: 'Groszek nieskończony' },
];

export function levelFor(exp) {
  let i = 0;
  while (i + 1 < LEVELS.length && exp >= LEVELS[i + 1].at) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  const progress = next ? (exp - cur.at) / (next.at - cur.at) : 1;
  return { level: i + 1, name: cur.name, from: cur.at, to: next ? next.at : cur.at, progress: Math.max(0, Math.min(1, progress)), exp };
}

export function summary(state, p) {
  const budget = Number(state.settings.budget) || 0;
  const spent = spentIn(state.expenses, p.start, p.end);
  const saved = r2(state.savings.filter((s) => s.date >= p.start && s.date <= p.end).reduce((a, s) => a + s.amount, 0));
  const lim = daysInLimit(state, p, p.end);
  return { period: p, budget, spent, left: r2(budget - spent), saved, exp: Math.floor(saved), ...lim, ok: spent <= budget };
}

export function fmt(n, digits = 2) {
  const v = r2(Number(n) || 0);
  const neg = v < 0;
  const [i, f] = Math.abs(v).toFixed(digits).split('.');
  const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (neg ? '−' : '') + int + (digits ? ',' + f : '');
}

export function fmtInt(n) {
  return fmt(Math.round(Number(n) || 0), 0);
}

export function parseAmount(s) {
  const v = parseFloat(String(s || '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(v) ? r2(v) : 0;
}

// Święta, w które sklepy są zamknięte (stałe + Wielkanoc i Boże Ciało), oraz niedziele.
export function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return ymd(new Date(y, month - 1, day, 12));
}

export function shopsClosed(s) {
  const d = parseYmd(s);
  if (d.getDay() === 0) return true;
  const md = s.slice(5);
  const fixed = ['01-01', '01-06', '05-01', '05-03', '08-15', '11-01', '11-11', '12-24', '12-25', '12-26'];
  if (fixed.includes(md)) return true;
  const e = easter(d.getFullYear());
  return [addDays(e, 1), addDays(e, 60)].includes(s) || s === e;
}

export function totalSaved(state) {
  return r2((state.savings || []).reduce((a, s) => a + (Number(s.amount) || 0), 0));
}

export function totalExp(state) {
  return Math.floor(totalSaved(state));
}
