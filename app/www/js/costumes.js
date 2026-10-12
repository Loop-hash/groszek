// Groszosław w przebraniu: na co dzień postać z kuchni, z której najczęściej gotujesz (plan z ostatnich 30 dni),
// a czasem, przy ciekawostce o postaci, losowa postać z dowolnej kuchni.
// Piksele przebrań powstają w tools/costumes.py (costumes-data.js).
import { COSTUMES } from './costumes-data.js';
import { pixelSvg } from './pixels.js';
import { findRecipe, available } from './recipes.js';
import { today, addDays } from './budget.js';

// Najczęstsza kuchnia w planie z ostatnich 30 dni (bez Podstaw). Remis: kuchnia dania zjedzonego najpóźniej.
export function topCuisine(c) {
  const end = today();
  const start = addDays(end, -30);
  const counts = {};
  const last = {};
  for (const [d, meals] of Object.entries(c.state.plan || {})) {
    if (d < start || d > end) continue;
    for (const m of meals || []) {
      const r = findRecipe(c, m.id);
      if (!r || !r.country || r.country === 'Podstawy') continue;
      counts[r.country] = (counts[r.country] || 0) + 1;
      if (!last[r.country] || d > last[r.country]) last[r.country] = d;
    }
  }
  let best = null;
  for (const [k, n] of Object.entries(counts)) {
    if (!best || n > counts[best] || (n === counts[best] && last[k] > last[best])) best = k;
  }
  return best;
}

// Przebranie z ulubionej kuchni albo null (wyłączone w ustawieniach, brak planu, kuchnia bez przebrania)
export function costumeFor(c) {
  if (c.state.settings.costume === false) return null;
  const k = topCuisine(c);
  return (k && COSTUMES[k]) || null;
}

// Przebranie po kluczu postaci (np. 'kopernik'), razem z krajem jego kuchni
export function costumeByKey(key) {
  for (const [country, cos] of Object.entries(COSTUMES)) if (cos.key === key) return { ...cos, country };
  return null;
}

// Losowe danie z kuchni danego kraju spośród przepisów, które pasują do ustawień (dieta, sprzęt, oceny)
export function randomRecipe(c, country, rnd = Math.random) {
  const list = available(c).filter((r) => r.country === country);
  return list.length ? list[Math.floor(rnd() * list.length)].id : null;
}

// Szerokość tak dobrana, żeby sam groszek był tej samej wielkości co bez przebrania
export function costumeSvg(cos, mood, peaWidth) {
  const rows = cos.rows[mood] || cos.rows.pea;
  return pixelSvg(rows, Math.round((peaWidth * 32) / 24));
}
