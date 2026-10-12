// Dane z GitHuba: promocje, przepisy i składniki. Najpierw wersja zapisana w telefonie, potem świeża z sieci.
import { kvGet, kvSet } from './store.js';

export const REPO_RAW = 'https://raw.githubusercontent.com/Loop-hash/groszek/main/data/';
export const RELEASE_API = 'https://api.github.com/repos/Loop-hash/groszek/releases/tags/najnowsza';
export const RELEASE_PAGE = 'https://github.com/Loop-hash/groszek/releases/tag/najnowsza';

const FILES = {
  promos: { file: 'promos.json', maxAgeH: 4 },
  recipes: { file: 'recipes.json', maxAgeH: 24 },
  ingredients: { file: 'ingredients.json', maxAgeH: 24 },
};

async function bundled(file) {
  try {
    const r = await fetch('data/' + file, { cache: 'no-store' });
    if (r.ok) return await r.json();
  } catch (e) { /* brak pliku w paczce */ }
  return null;
}

async function cached(name) {
  const raw = await kvGet('groszek-cache-' + name);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function newer(a, b) {
  // wybiera nowszą wersję danych po polu "updated"
  if (!a) return b;
  if (!b) return a;
  return String(a.updated || '') >= String(b.updated || '') ? a : b;
}

export async function loadLocal() {
  const out = {};
  for (const [name, f] of Object.entries(FILES)) {
    const c = await cached(name);
    const b = await bundled(f.file);
    out[name] = newer(c && c.data, b);
    out[name + 'Fetched'] = c ? c.fetched : 0;
  }
  return out;
}

export async function refresh(data, force = false, onUpdate = () => {}) {
  const now = Date.now();
  const results = {};
  for (const [name, f] of Object.entries(FILES)) {
    const age = (now - (data[name + 'Fetched'] || 0)) / 3600000;
    if (!force && age < f.maxAgeH) continue;
    try {
      const r = await fetch(REPO_RAW + f.file + '?t=' + now, { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const json = await r.json();
      const best = newer(json, data[name]);
      data[name] = best;
      data[name + 'Fetched'] = now;
      await kvSet('groszek-cache-' + name, JSON.stringify({ fetched: now, data: best }));
      results[name] = true;
      onUpdate(name);
    } catch (e) {
      results[name] = false;
    }
  }
  return results;
}

export async function checkUpdate(currentBuild) {
  try {
    const r = await fetch(RELEASE_API, { cache: 'no-store', headers: { Accept: 'application/vnd.github+json' } });
    if (!r.ok) return null;
    const rel = await r.json();
    const m = /build[:\s]+(\d+)/i.exec(rel.body || '');
    const build = m ? Number(m[1]) : 0;
    const asset = (rel.assets || []).find((a) => /\.apk$/.test(a.name));
    return {
      build, newer: build > (Number(currentBuild) || 0), url: asset ? asset.browser_download_url : RELEASE_PAGE,
      size: asset ? asset.size : 0, name: rel.name,
    };
  } catch (e) {
    return null;
  }
}
