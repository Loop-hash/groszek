// Groszosław w przebraniu: postać z kuchni, z której najczęściej gotujesz (plan z ostatnich 30 dni).
// Piksele przebrań powstają w tools/costumes.py (costumes-data.js).
import { COSTUMES } from './costumes-data.js';
import { pixelSvg } from './pixels.js';
import { findRecipe } from './recipes.js';
import { today, addDays } from './budget.js';

export function topCuisine(c) {
  const end = today();
  const start = addDays(end, -30);
  const counts = {};
  for (const [d, meals] of Object.entries(c.state.plan || {})) {
    if (d < start || d > end) continue;
    for (const m of meals || []) {
      const r = findRecipe(c, m.id);
      if (r && r.country) counts[r.country] = (counts[r.country] || 0) + 1;
    }
  }
  let best = null;
  for (const [k, n] of Object.entries(counts)) if (!best || n > counts[best]) best = k;
  return best;
}

// Przebranie albo null (wyłączone w ustawieniach, brak planu albo kuchnia jeszcze bez przebrania)
export function costumeFor(c) {
  if (c.state.settings.costume === false) return null;
  const k = topCuisine(c);
  return (k && COSTUMES[k]) || null;
}

// Szerokość tak dobrana, żeby sam groszek był tej samej wielkości co bez przebrania
export function costumeSvg(cos, mood, peaWidth) {
  const rows = cos.rows[mood] || cos.rows.pea;
  return pixelSvg(rows, Math.round((peaWidth * 32) / 24));
}
