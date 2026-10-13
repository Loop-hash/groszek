// Widżety na ekran telefonu i wieczorne przypomnienie (Android, HomePlugin.java).
// Widżet nie liczy sam: apka wysyła mu gotowe teksty na dziś i 6 kolejnych dni,
// a także godzinę przypomnienia. Przypomnienie pokazuje się tylko w dni bez żadnego wydatku.
import { status, fmt, addDays, today } from './budget.js';
import { plural } from './ui.js';
import { plugin } from './store.js';

export const DAYS = 7;
export const REMIND_DEFAULT = { hour: 20, minute: 30 };

export function reminderOf(st) {
  const r = st.settings.reminder || {};
  return { on: r.on === true, hour: Number.isInteger(r.hour) ? r.hour : REMIND_DEFAULT.hour, minute: Number.isInteger(r.minute) ? r.minute : REMIND_DEFAULT.minute };
}

export const timeText = (r) => `${r.hour}:${String(r.minute).padStart(2, '0')}`;

export function snapshot(st, from = today()) {
  const days = {};
  for (let i = 0; i < DAYS; i++) {
    const d = addDays(from, i);
    const s = status(st, d);
    const over = s.todayLeft < -0.005;
    const amount = `${fmt(Math.abs(s.todayLeft))} zł`;
    const left = s.period.daysLeft;
    days[d] = {
      label: over ? 'PONAD PLAN' : 'NA DZIŚ',
      title: over ? 'Dziś ponad plan o' : 'Na dziś możesz wydać',
      amount,
      sub: s.remaining >= 0
        ? `zostało ${fmt(s.remaining, 0)} zł na ${left} ${plural(left, 'dzień', 'dni', 'dni')}`
        : `budżet przekroczony o ${fmt(-s.remaining, 0)} zł`,
      mood: s.mood,
      bar: Math.round(s.fracRemaining * 1000) / 1000,
      spent: (st.expenses || []).some((e) => e.date === d),
      remind: over ? `Dziś jesteś ponad plan o ${amount}.` : `Na dziś zostało ${amount}.`,
    };
  }
  return { days, reminder: reminderOf(st) };
}

export function available() {
  return !!plugin('Home');
}

let timer = null;
// Po każdej zmianie danych (z małym opóźnieniem, bo zapisy przychodzą seriami)
export function syncHome(st, now = false) {
  const p = plugin('Home');
  if (!p) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      p.sync(snapshot(st)).catch((e) => console.error('widżety: ' + ((e && e.message) || e)));
    } catch (e) {
      console.error('widżety: ' + ((e && e.message) || e));
    }
  }, now ? 0 : 800);
}

// Zgoda na powiadomienia (Android 13+ pyta systemowym okienkiem). Zwraca, czy jest.
export async function askNotifications() {
  const p = plugin('Home');
  if (!p) return false;
  try {
    const r = await p.requestNotifications();
    return !!(r && r.granted);
  } catch (e) {
    console.error('powiadomienia: ' + ((e && e.message) || e));
    return false;
  }
}
