// Słownik produktów: rozpoznaje ikonkę i kategorię po nazwie wpisanej na listę.
import { CANON } from './canon.js';
// Słowa kluczowe są bez polskich znaków. '^abc' = początek słowa, '=abc' = całe słowo.

export const TREAT_CATS = ['słodycze', 'chipsy i przekąski', 'słodkie napoje', 'energetyki', 'alkohol', 'fast food', 'gotowe dania'];

export const CAT_LABEL = {
  'słodycze': 'Słodycze', 'chipsy i przekąski': 'Chipsy i przekąski', 'słodkie napoje': 'Słodkie napoje',
  'energetyki': 'Energetyki', 'alkohol': 'Alkohol', 'fast food': 'Fast food', 'gotowe dania': 'Gotowe dania',
};

const ENTRIES = [
  // wyjątki, które muszą wygrać z ogólnymi słowami niżej
  { k: ['napoj owsian', 'napoj sojow', 'napoj migdal', 'napoj kokos', 'napoj roslin', 'mleko roslin'], ico: 'milk', cat: 'nabiał' },
  { k: ['ciasto francusk', 'ciasto na pizz', 'ciasto filo', 'ciasto kruche'], ico: 'flour', cat: 'do pieczenia' },
  { k: ['papryka slodk', 'papryka wedzon', 'papryka ostr', 'papryka mielon'], ico: 'jar', cat: 'przyprawy' },
  { k: ['pierogi', 'pyzy', 'nalesnik'], ico: 'bag', cat: 'mrożonki i gotowce' },
  { k: ['makaron jaj', 'makaron', 'spaghetti', 'tagliatell'], ico: 'pasta', cat: 'makarony i kasze' },
  { k: ['maslo orzech'], ico: 'jar', cat: 'śniadania' },
  { k: ['frytki z ', 'domowe frytki'], ico: 'potato', cat: 'warzywa' },
  { k: ['paluszki ryb', 'paluszki krab', 'paluszki surimi'], ico: 'fish', cat: 'ryby' },
  { k: ['wafle ryz', 'wafle kukur', 'pieczywo chrup'], ico: 'bread', cat: 'pieczywo' },
  { k: ['mleczko kokos', 'mleko kokos'], ico: 'can', cat: 'sosy i dodatki' },
  { k: ['zurek', 'zakwas', 'barszcz', 'kapusniak', 'rosol', 'zupa w kartonie'], ico: 'jar', cat: 'zupy' },
  { k: ['papier toalet', 'recznik', 'chusteczk', 'plyn do', 'gabk', 'worki', 'worek na smiec', 'proszek do prania', 'kapsulki do prania',
    'mydl', 'zel pod prysznic', 'szampon', 'odzywka do wlos', 'pasta do zeb', 'szczoteczk', 'dezodorant', 'antyperspirant', 'folia', 'papier do piecz',
    'bateri', 'odplamiacz', 'domestos', '=cif', 'ludwik', 'pianka do gol', 'maszynk', 'podpask', 'tampon', 'pieluch', 'krem do', 'balsam',
    'srodek do', 'zmywak', 'tabletki do zmyw', 'sol do zmyw', 'woreczk', 'serwetk', 'nawilzane', 'patyczki', 'wacik', 'zapalk', 'swieczk'], ico: 'bag', cat: 'chemia' },
  // zachcianki
  { k: ['chips', 'czips', '=lays', 'paluszk', 'tortilla chips', 'krekers', 'slone przekask', 'cheetos', 'chrupki kukur', 'crunchips', 'nachos', 'prazynk', 'popcorn', 'krakers', 'chrupk', 'orzeszki ziemne', 'orzeszki solone', 'precle', 'doritos', 'pringles'], ico: 'chips', cat: 'chipsy i przekąski' },
  { k: ['energety', 'monster', 'red bull', 'redbull', '=tiger', 'rockstar', 'energy drink', '=burn'], ico: 'can', cat: 'energetyki' },
  { k: ['cola', 'pepsi', 'fanta', 'sprite', 'mirinda', 'oranzad', 'gazowan', 'ice tea', 'lipton', 'oshee', 'tymbark', 'kubus', 'napoj', 'lemoniad', 'syrop'], ico: 'can', cat: 'słodkie napoje' },
  { k: ['czekolad', 'baton', 'snickers', 'twix', '=mars', 'bounty', 'kitkat', 'kit kat', 'prince polo', 'cukierk', 'zelk', 'haribo', 'ciastk', '=ciasto', 'lody', '=lod', 'wafel', 'wafelk', 'ptasie', 'kinder', 'milka', 'raffaello', 'merci', 'pralin', 'paczek', 'paczk', 'donut', 'croissant', 'rogalik', 'drozdzowk', 'babeczk', 'muffin', '=tort', 'sernik', 'krowk', 'michalk', 'delicje', 'oreo', 'draz', 'lizak', 'gum do zucia', 'guma do zucia', 'gumy do zucia', 'piernik', 'herbatnik',
    'batonik', 'pianki', 'chalw', 'sezamk', 'marcepan', 'trufl', 'tiramisu', 'beza', 'bezy', 'galaretk', 'budyn', 'kisiel', 'deser',
    'skittles', 'tic tac', 'mentos', 'toffi', 'kukulk', 'mieszanka wedlowska', 'ptasie mleczko', 'czekoladk', 'bombonier', 'sezamki', 'nutella', 'krem czekolad', 'deser', 'budyn', 'galaretk', 'gofr', 'slodycz', 'lizak', 'guma do zucia', 'bombonier', 'pianki', 'chalwa', 'brownie', 'wafle', 'biszkopt'], ico: 'candy', cat: 'słodycze' },
  { k: ['piwo', 'piwa', '=wino', 'wina', 'wodk', 'cydr', 'whisk', '=gin', '=rum', 'likier', 'nalewk', 'szampan', 'prosecco', 'radler', 'alkohol', 'tequila', 'brandy', 'koniak', 'aperol'], ico: 'bottle', cat: 'alkohol' },
  { k: ['pizza', 'kebab', 'burger', 'hot dog', 'hotdog', 'zapiekank', 'frytk', 'nugget', 'mcdonald', '=kfc', 'kubelek', 'shoarma', 'falafel w bulce'], ico: 'bag', cat: 'fast food' },
  { k: ['danie gotowe', 'gotowe danie', 'gotowy obiad', 'zupka chinsk', 'chinska zupk', 'zupa w proszk', 'zupa instant', 'kubek smakow', 'lasagne gotow', 'danie w sloik', 'gotowiec', 'kotlet gotow', 'golabki w sloik', 'fasolka po bretonsku w sloik', 'mrozona pizza'], ico: 'bag', cat: 'gotowe dania' },
  // podstawy
  { k: ['mlek', 'kefir', 'maslank', 'jogurt', 'smietan', 'skyr', 'mascarpone', 'serek wiejski', 'zsiadl'], ico: 'milk', cat: 'nabiał' },
  { k: ['masl', 'margaryn', '=rama', 'smalec', 'ghee'], ico: 'butter', cat: 'nabiał' },
  { k: ['^ser', 'twarog', 'mozzarell', '=feta', 'parmezan', 'gouda', '=edam', 'halloumi', 'cheddar', 'gorgonzol', 'ricott', 'bryndz', 'oscypek', 'camembert', 'brie'], ico: 'cheese', cat: 'nabiał' },
  { k: ['jaj', 'jajk'], ico: 'egg', cat: 'nabiał' },
  { k: ['chleb', 'bulk', 'bagiet', '=tost', 'tostow', 'pieczyw', 'grahamk', 'kajzerk', 'tortill', 'pita', 'lavash', 'lawasz', 'chlebek', 'bajgiel', 'pumpernikiel', 'rogal', 'bajgl', 'chalk', 'razowiec', 'zytni'], ico: 'bread', cat: 'pieczywo' },
  { k: ['makaron', 'spaghetti', 'penne', 'swiderk', 'kokard', 'tagliatell', 'lasagne', 'noodle', 'gnocchi', 'fusilli', 'rigatoni', 'farfalle', 'nitki', 'zacierk', 'kluski', 'kopytk', 'udon', 'soba', 'ramen'], ico: 'pasta', cat: 'makarony i kasze' },
  { k: ['=ryz', 'ryzu', 'ryzow', 'kasz', 'kuskus', 'bulgur', 'quinoa', 'komos', 'jaglan', 'gryczan', 'peczak'], ico: 'rice', cat: 'makarony i kasze' },
  { k: ['platk', 'owsian', 'musli', 'granol', 'otreby'], ico: 'oats', cat: 'śniadania' },
  { k: ['^maka', 'cukier', 'drozdz', 'proszek do piecz', '=soda', 'skrobi', 'bulka tart', 'kakao'], ico: 'flour', cat: 'do pieczenia' },
  { k: ['kurczak', 'kurcze', 'piers', 'filet z kurcz', 'indyk', 'udk', 'skrzydel', 'podudz', 'drob'], ico: 'chicken', cat: 'mięso' },
  { k: ['mielon', 'mieso', 'miesa', 'schab', 'lopatk', 'karkowk', 'boczek', 'wolowin', 'wieprzow', 'gulasz', 'antrykot', 'poledwiczk', 'zeberk', 'watrobk', 'cielecin', 'jagniecin', 'kaczk'], ico: 'mince', cat: 'mięso' },
  { k: ['kielbas', 'parowk', 'szynk', 'wedlin', 'salami', 'kabanos', 'poledwic', 'mortadel', 'pasztet', 'chorizo', 'bekon', 'boczek wedz', 'parowecz'], ico: 'sausage', cat: 'wędliny' },
  { k: ['krewetk', 'owoce morza'], ico: 'shrimp', cat: 'ryby' },
  { k: ['kalmar', 'osmiornic', 'matwa'], ico: 'squid', cat: 'ryby' },
  { k: ['malz', '=mule', 'przegrzeb', 'omuli'], ico: 'shell', cat: 'ryby' },
  { k: ['ryb', 'losos', 'tunczyk', 'sledz', 'dorsz', 'makrel', 'mintaj', 'pstrag', 'sardyn', 'miruna', 'tilapi', 'morszczuk', 'paluszki ryb', 'surimi', 'paluszki krab'], ico: 'fish', cat: 'ryby' },
  { k: ['pomidor', 'passat', 'koncentrat pomid', 'przecier'], ico: 'tomato', cat: 'warzywa' },
  { k: ['ziemniak', 'kartofl', 'ziemniaczk', 'batat'], ico: 'potato', cat: 'warzywa' },
  { k: ['cebul', 'czosn', '=por', '=pory', 'szczypior', 'szalotk', 'imbir', 'dymk'], ico: 'onion', cat: 'warzywa' },
  { k: ['papryk', 'chili', 'jalapeno', 'peperoni'], ico: 'pepper', cat: 'warzywa' },
  { k: ['marchew', 'marchw', 'pietruszk', 'pasternak'], ico: 'carrot', cat: 'warzywa' },
  { k: ['pieczark', 'grzyb', 'boczniak', 'kurki', 'shiitake'], ico: 'mushroom', cat: 'warzywa' },
  { k: ['fasol', 'ciecierzyc', 'soczewic', 'groch', 'hummus', 'edamame', '=soja', 'tofu', '=bob', '=bobu', 'tempeh', 'seitan'], ico: 'beans', cat: 'strączki' },
  { k: ['kapust', 'salat', 'ogork', 'cukini', 'brokul', 'kalafior', 'szpinak', 'baklazan', 'dyni', 'dynia', 'burak', 'seler', 'rzodkiew', 'kukurydz', 'rukol', 'jarmuz', 'rzepa', 'warzyw', 'koperek', 'koper', 'natka', 'bazyli', 'kolendr', 'mieta', 'kielki', 'groszek', 'fasolka szparag', 'awokado', 'ogorek', 'szparag', 'kalarep', 'fenkul', 'koper wloski', 'topinambur', 'pak choi', 'kapary', 'nori', 'wasabi'], ico: 'leaf', cat: 'warzywa' },
  { k: ['jablk', 'jablek'], ico: 'apple', cat: 'owoce' },
  { k: ['banan'], ico: 'banana', cat: 'owoce' },
  { k: ['cytryn', 'limonk', 'pomarancz', 'mandaryn', 'grejpfrut', 'klementyn'], ico: 'lemon', cat: 'owoce' },
  { k: ['grusz', 'sliwk', 'winogron', 'truskaw', 'borowk', 'malin', 'kiwi', 'mango', 'ananas', 'arbuz', 'melon', 'brzoskw', 'morel', 'wisni', 'czeresn', 'jagod', 'owoc', 'rodzynk', 'daktyl', 'zurawin', 'figi'], ico: 'apple', cat: 'owoce' },
  { k: ['=sol', 'pieprz', 'przypraw', 'oregano', 'tymianek', 'majeranek', 'curry', 'kmin', 'cynamon', 'galka', 'kurkum', 'ziele', 'lisc laur', 'liscie laur', 'bulion', 'kostk', 'vegeta', 'garam', 'kardamon', 'gozdzik'], ico: 'jar', cat: 'przyprawy' },
  { k: ['ketchup', 'majonez', 'musztard', 'sos ', '=sos', 'ocet', 'chrzan', 'pesto', 'tahini', 'miso', 'sriracha', 'tabasco', 'dzem', 'konfitur', 'miod', 'powidl'], ico: 'jar', cat: 'sosy i dodatki' },
  { k: ['olej', 'oliw'], ico: 'bottle', cat: 'tłuszcze' },
  { k: ['woda', 'wody', '=sok', 'soki', 'soku', 'kombuch'], ico: 'bottle', cat: 'napoje' },
  { k: ['^kaw', 'herbat', 'yerba', 'kakao'], ico: 'jar', cat: 'kawa i herbata' },
  { k: ['orzech', 'migdal', 'pestk', 'slonecznik', 'siemie', 'nasion', 'chia', 'sezam', 'nerkowc', 'wiorki kokos'], ico: 'beans', cat: 'bakalie' },
  { k: ['mrozon'], ico: 'bag', cat: 'mrożonki i gotowce' },
];

export function norm(s) {
  return (s || '')
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9%., -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matches(text, words, kw) {
  if (kw[0] === '^') {
    const k = kw.slice(1);
    return words.some((w) => w.startsWith(k));
  }
  if (kw[0] === '=') {
    const k = kw.slice(1);
    if (k.includes(' ')) return (' ' + text + ' ').includes(' ' + k + ' ');
    return words.includes(k);
  }
  return text.includes(kw);
}

export function lookup(name) {
  const text = norm(name);
  if (!text) return null;
  const words = text.split(' ');
  for (const e of ENTRIES) {
    for (const kw of e.k) {
      if (matches(text, words, kw)) return { ico: e.ico, cat: e.cat, kw };
    }
  }
  return null;
}

// ---------- odmiany, literówki i poprawne nazwy ----------

const NAME_STOP = new Set(['z', 'ze', 'do', 'na', 'w', 'we', 'i', 'bez', 'dla', 'od', 'po', 'a', 'o']);
const ENDINGS = ['owie', 'ami', 'ach', 'ego', 'emu', 'ymi', 'imi', 'ych', 'ich', 'ow', 'om', 'ej', 'ym', 'im', 'em', 'ie', 'iu', 'y', 'i', 'a', 'e', 'o', 'u'];

// Rdzeń polskiego słowa bez końcówki: masło/masła/maśle -> masl, ogórek/ogórki -> ogork, marchew/marchwi -> marchw
export function stemPL(w) {
  let x = w;
  if (x.length >= 5 && x.endsWith('ek')) x = x.slice(0, -2) + 'k';
  else if (x.length >= 6 && x.endsWith('ew')) x = x.slice(0, -2) + 'w';
  for (const e of ENDINGS) if (x.length - e.length >= 3 && x.endsWith(e)) return x.slice(0, -e.length);
  return x;
}

function words(name) {
  return norm(name).split(' ').filter((w) => w && !NAME_STOP.has(w) && !/^\d/.test(w));
}

// Klucz niezależny od odmiany i kolejności słów: "jogurty pitne" i "pitny jogurt" dają to samo.
export function nameKey(name) {
  return words(name).map(stemPL).sort().join(' ');
}

// Odległość edycyjna z zamianą sąsiednich liter (mlkeo -> mleko to 1)
function dist(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d = [];
  for (let i = 0; i <= a.length; i++) d.push([i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

// Ile literówek wybaczamy w słowie tej długości
const slack = (n) => (n >= 8 ? 2 : n >= 5 ? 1 : 0);

function fuzzyWords(a, b) {
  if (a.length !== b.length) return Infinity;
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    const lim = slack(Math.min(a[i].length, b[i].length));
    const d = a[i] === b[i] ? 0 : dist(a[i], b[i], lim);
    if (d > lim) return Infinity;
    total += d;
  }
  return total;
}

const CANON_BY_KEY = new Map();
for (const n of CANON) if (!CANON_BY_KEY.has(nameKey(n))) CANON_BY_KEY.set(nameKey(n), n);
const CANON_WORDS = [...new Set(CANON)].map((n) => [n, words(n)]);

function learnedEntries(learned) {
  return Object.entries(learned || {}).map(([k, v]) => [v.name || k, k, v]);
}

// Zapamiętana odpowiedź dla tej nazwy, też w innej odmianie: [klucz w learned, wpis] albo null
export function findLearned(name, learned = {}) {
  const n = norm(name);
  if (learned[n]) return [n, learned[n]];
  const key = nameKey(name);
  for (const [, k, v] of learnedEntries(learned)) if (nameKey(v.name || k) === key) return [k, v];
  return null;
}

// Poprawna forma nazwy: odmiana ze słownika ("masła" -> "masło"), zapamiętana nazwa albo poprawiona literówka.
// Literówki poprawiamy tylko w słowach, których słownik nie zna, żeby nie zmieniać "sałatki" w "sałatę".
export function canonical(raw, learned = {}) {
  const typed = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!typed) return { name: '', changed: false };
  // liczby w nazwie ("mleko 3,2%") zostają przy poprawionej nazwie
  const extra = typed.split(' ').filter((w) => /\d/.test(w));
  if (extra.length) {
    const base = canonical(typed.split(' ').filter((w) => !/\d/.test(w)).join(' '), learned);
    if (!base.name) return { name: typed, changed: false };
    const nm = [base.name, ...extra].join(' ');
    return { name: nm, changed: norm(nm) !== norm(typed), how: base.how };
  }
  const key = nameKey(typed);
  const lrn = findLearned(typed, learned);
  if (lrn) {
    const nm = lrn[1].name || typed;
    return { name: nm, changed: norm(nm) !== norm(typed), how: 'zapamiętane' };
  }
  const exact = key && CANON_BY_KEY.get(key);
  if (exact) return { name: exact, changed: norm(exact) !== norm(typed), how: 'odmiana' };
  if (!lookup(typed)) {
    const tw = words(typed);
    let best = null;
    let bd = Infinity;
    const pool = CANON_WORDS.concat(learnedEntries(learned).map(([nm]) => [nm, words(nm)]));
    for (const [nm, w] of pool) {
      const d = fuzzyWords(tw, w);
      if (d > 0 && d < bd) { bd = d; best = nm; }
    }
    if (best) return { name: best, changed: true, how: 'literówka' };
  }
  return { name: typed, changed: false };
}

const QTY_MAX = 99;
const UNIT = '(kg|g|dag|dkg|l|ml|litr(?:y|ów)?|opak\\.?|op\\.?|opakowani[ae]|paczk[aię]|puszk[aię]|butelk[aię]|słoik[iaów]*|sloik[iaow]*)';
const RE_LEAD_UNIT = new RegExp('^(\\d+(?:[.,]\\d+)?)\\s*' + UNIT + '\\s+(.+)$', 'i');
const RE_TAIL_UNIT = new RegExp('^(.+?)\\s+(\\d+(?:[.,]\\d+)?)\\s*' + UNIT + '$', 'i');

// "3 masło", "3x masło", "3 x mięso", "fasola x 3", "fasola x3", "masło 3 szt", "2 kg ziemniaków"
export function parseEntry(raw) {
  let t = String(raw || '').trim().replace(/\s+/g, ' ');
  let qty = 1;
  let amount = '';
  let m;
  if ((m = RE_LEAD_UNIT.exec(t))) { amount = `${m[1]} ${m[2].toLowerCase()}`; t = m[3]; }
  else if ((m = RE_TAIL_UNIT.exec(t))) { t = m[1]; amount = `${m[2]} ${m[3].toLowerCase()}`; }
  else if ((m = /^(\d{1,2})\s*(?:x|×|\*|szt\.?|sztuk[ia]?)?\s+(\D.*)$/i.exec(t))) { qty = Number(m[1]); t = m[2]; }
  else if ((m = /^(\d{1,2})\s*(?:x|×|\*)(\D.*)$/i.exec(t))) { qty = Number(m[1]); t = m[2]; }
  else if ((m = /^(.*\D)\s*(?:x|×|\*)\s*(\d{1,2})$/i.exec(t))) { t = m[1]; qty = Number(m[2]); }
  else if ((m = /^(.*\D)\s+(\d{1,2})\s*(?:x|×|szt\.?|sztuk[ia]?)?$/i.exec(t))) { t = m[1]; qty = Number(m[2]); }
  else if ((m = /^(.*\D)\s*\((\d{1,2})\)$/.exec(t))) { t = m[1]; qty = Number(m[2]); }
  qty = Math.max(1, Math.min(QTY_MAX, qty || 1));
  return { text: t.trim().replace(/[,.;:-]+$/, '').trim(), qty, amount };
}

// Zwraca { ico, cat, treat, known }. learned: { 'nazwa': { treat: bool } } – odpowiedzi użytkownika.
export function classify(name, learned = {}) {
  const found = findLearned(name, learned);
  if (found) {
    const l = found[1];
    return { ico: l.ico || 'bag', cat: l.treat ? 'zachcianka' : 'podstawy', treat: !!l.treat, known: true, learned: true };
  }
  const hit = lookup(name);
  if (!hit) return { ico: 'bag', cat: 'inne', treat: false, known: false };
  return { ico: hit.ico, cat: hit.cat, treat: TREAT_CATS.includes(hit.cat), known: true };
}

// Słowa do szukania produktu w promocjach (rdzenie bez polskich końcówek).
const STOP = new Set(['z', 'ze', 'do', 'na', 'w', 'we', 'i', 'bez', 'dla', 'od', 'po', 'lub', 'oraz', 'a', 'o', 'kg', 'g', 'ml', 'l', 'szt']);
export function stem(w) {
  if (w.length <= 4) return w;
  if (w.length === 5) return w.slice(0, 4);
  if (w.length <= 7) return w.slice(0, w.length - 2);
  return w.slice(0, w.length - 3);
}

export function searchStems(name) {
  return norm(name).split(' ').filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d/.test(w)).map(stem);
}

// Czy oferta pasuje do pozycji z listy. Każde ważne słowo z listy musi być w nazwie oferty.
export function offerScore(itemName, offer) {
  const itemWords = norm(itemName).split(' ').filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d/.test(w));
  if (!itemWords.length) return 0;
  const stems = itemWords.map(stem);
  const text = norm(offer.name + ' ' + (offer.brand || ''));
  const words = text.split(' ').filter((w) => w.length >= 3 && !STOP.has(w));
  const hitItem = lookup(itemName);
  const hitOffer = lookup(offer.name);
  // produkt z listy i oferta muszą trafić w tę samą grupę, żeby "mleko" nie łapało "czekolady mlecznej"
  if (hitItem && hitOffer && hitItem.ico !== hitOffer.ico) return 0;
  // to samo słowo ze słownika (np. "jajka" i "jaja") liczy się jako trafienie
  const root = hitItem && hitOffer && hitItem.kw === hitOffer.kw ? hitItem.kw.replace(/^[=^]/, '') : null;
  const ok = stems.every((s, i) => words.some((w) => w.startsWith(s)) || (root && itemWords[i].includes(root)));
  if (!ok) return 0;
  const used = words.filter((w) => stems.some((s) => w.startsWith(s)) || (root && w.includes(root))).length;
  return Math.max(0.01, used / Math.max(1, words.length));
}

export function offerMatches(itemName, offer) {
  return offerScore(itemName, offer) > 0;
}
