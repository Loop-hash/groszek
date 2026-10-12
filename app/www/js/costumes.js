// Groszosław w przebraniu: tylko na czas ciekawostki o postaci, potem wraca do zwykłego wyglądu.
// Piksele przebrań powstają w tools/costumes.py (costumes-data.js).
import { COSTUMES } from './costumes-data.js';
import { pixelSvg } from './pixels.js';
import { available } from './recipes.js';

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
