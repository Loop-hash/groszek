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
  { k: ['papryka slodk', 'papryka wedzon', 'papryka ostr', 'papryka mielon', 'prymat', 'kamis', 'kotanyi', 'granulowan'], ico: 'jar', cat: 'przyprawy' },
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
    'srodek do', 'zmywak', 'tabletki do zmyw', 'sol do zmyw', 'woreczk', 'serwetk', 'nawilzane', 'patyczki', 'wacik', 'zapalk', 'swieczk',
    'fairy', 'pojemnik', 'torba', 'reklamowk', 'vanish', 'persil', 'lenor', 'ariel', 'bryza', 'frosch', '=pur'], ico: 'bag', cat: 'chemia' },
  // zachcianki
  { k: ['chips', 'czips', '=lays', 'paluszk', 'tortilla chips', 'krekers', 'slone przekask', 'cheetos', 'chrupki kukur', 'crunchips', 'nachos', 'prazynk', 'popcorn', 'krakers', 'chrupk', 'orzeszki ziemne', 'orzeszki solone', 'precle', 'doritos', 'pringles', 'lay s', '=chio'], ico: 'chips', cat: 'chipsy i przekąski' },
  { k: ['energety', 'monster', 'red bull', 'redbull', '=tiger', 'rockstar', 'energy drink', '=burn', '=dzik', 'black energ'], ico: 'can', cat: 'energetyki' },
  { k: ['cola', 'pepsi', 'fanta', 'sprite', 'mirinda', 'oranzad', 'gazowan', 'ice tea', 'lipton', 'oshee', 'tymbark', 'kubus', 'napoj', 'lemoniad', 'syrop'], ico: 'can', cat: 'słodkie napoje' },
  { k: ['czekolad', 'baton', 'snickers', 'twix', '=mars', 'bounty', 'kitkat', 'kit kat', 'prince polo', 'cukierk', 'zelk', 'haribo', 'ciastk', '=ciasto', 'lody', '=lod', 'wafel', 'wafelk', 'ptasie', 'kinder', 'milka', 'raffaello', 'merci', 'pralin', 'paczek', 'paczk', 'donut', 'croissant', 'rogalik', 'drozdzowk', 'babeczk', 'muffin', '=tort', 'sernik', 'krowk', 'michalk', 'delicje', 'oreo', 'draz', 'lizak', 'gum do zucia', 'guma do zucia', 'gumy do zucia', 'piernik', 'herbatnik',
    'batonik', 'pianki', 'chalw', 'sezamk', 'marcepan', 'trufl', 'tiramisu', 'beza', 'bezy', 'galaretk', 'budyn', 'kisiel', 'deser',
    'skittles', 'tic tac', 'mentos', 'toffi', 'kukulk', 'mieszanka wedlowska', 'ptasie mleczko', 'czekoladk', 'bombonier', 'sezamki', 'nutella', 'krem czekolad', 'deser', 'budyn', 'galaretk', 'gofr', 'slodycz', 'lizak', 'guma do zucia', 'bombonier', 'pianki', 'chalwa', 'brownie', 'wafle', 'biszkopt',
    'wedel', 'goplana', '=wawel', 'grzesk', 'princess', '=lion', 'knoppers', 'toblerone', 'lindt', 'ferrero', 'alpen gold', 'daim', 'jezyki', '=m m'], ico: 'candy', cat: 'słodycze' },
  { k: ['piwo', 'piwa', '=wino', 'wina', 'wodk', 'cydr', 'whisk', '=gin', '=rum', 'likier', 'nalewk', 'szampan', 'prosecco', 'radler', 'alkohol', 'tequila', 'brandy', 'koniak', 'aperol', '=tyskie', '=zywiec', '=lech', '=harnas', '=perla', '=okocim', '=warka', 'carlsberg', 'heineken',
    '=tatra', 'somersby', 'redds', 'desperados', '=zubr', '=kozel', 'pilsner', '=lager', '=ipa'], ico: 'bottle', cat: 'alkohol' },
  { k: ['pizza', 'kebab', 'burger', 'hot dog', 'hotdog', 'zapiekank', 'frytk', 'nugget', 'mcdonald', '=kfc', 'kubelek', 'shoarma', 'falafel w bulce'], ico: 'bag', cat: 'fast food' },
  { k: ['danie gotowe', 'gotowe danie', 'gotowy obiad', 'zupka chinsk', 'chinska zupk', 'zupa w proszk', 'zupa instant', 'kubek smakow', 'lasagne gotow', 'danie w sloik', 'gotowiec', 'kotlet gotow', 'golabki w sloik', 'fasolka po bretonsku w sloik', 'mrozona pizza', 'sushi'], ico: 'bag', cat: 'gotowe dania' },
  // podstawy
  { k: ['mlek', 'kefir', 'maslank', 'jogurt', '=jog', 'smietan', 'smiet', 'skyr', 'mascarpone', 'serek wiejski', 'zsiadl'], ico: 'milk', cat: 'nabiał' },
  { k: ['masl', 'margaryn', '=rama', 'smalec', 'ghee'], ico: 'butter', cat: 'nabiał' },
  { k: ['^ser', 'twarog', 'mozzarell', '=feta', 'parmezan', 'gouda', '=edam', 'halloumi', 'cheddar', 'gorgonzol', 'ricott', 'bryndz', 'oscypek', 'camembert', 'brie'], ico: 'cheese', cat: 'nabiał' },
  { k: ['jaj', 'jajk'], ico: 'egg', cat: 'nabiał' },
  { k: ['chleb', 'bulk', 'bagiet', '=tost', 'tostow', 'pieczyw', 'grahamk', 'kajzerk', 'tortill', 'pita', 'lavash', 'lawasz', 'chlebek', 'bajgiel', 'pumpernikiel', 'rogal', 'bajgl', 'chalk', 'razowiec', 'zytni'], ico: 'bread', cat: 'pieczywo' },
  { k: ['makaron', 'spaghetti', 'penne', 'swiderk', 'kokard', 'tagliatell', 'lasagne', 'noodle', 'gnocchi', 'fusilli', 'rigatoni', 'farfalle', 'nitki', 'zacierk', 'kluski', 'kopytk', 'udon', 'soba', 'ramen'], ico: 'pasta', cat: 'makarony i kasze' },
  { k: ['=ryz', 'ryzu', 'ryzow', 'kasz', 'kuskus', 'bulgur', 'quinoa', 'komos', 'jaglan', 'gryczan', 'peczak'], ico: 'rice', cat: 'makarony i kasze' },
  { k: ['platk', 'owsian', 'musli', 'granol', 'otreby'], ico: 'oats', cat: 'śniadania' },
  { k: ['^maka', 'cukier', 'drozdz', 'proszek do piecz', '=soda', 'skrobi', 'bulka tart', 'kakao'], ico: 'flour', cat: 'do pieczenia' },
  { k: ['kurczak', 'kurcze', 'kurcz', 'piers', 'filet z kurcz', 'indyk', 'udk', 'skrzydel', 'podudz', 'drob'], ico: 'chicken', cat: 'mięso' },
  { k: ['mielon', 'mieso', 'miesa', 'schab', 'lopatk', 'karkowk', 'boczek', 'wolowin', 'wieprzow', 'gulasz', 'antrykot', 'poledwiczk', 'zeberk', 'watrobk', 'cielecin', 'jagniecin', 'kaczk'], ico: 'mince', cat: 'mięso' },
  { k: ['kielbas', 'parowk', 'szynk', 'wedlin', 'salami', 'kabanos', 'poledwic', 'mortadel', 'pasztet', 'chorizo', 'bekon', 'boczek wedz', 'parowecz'], ico: 'sausage', cat: 'wędliny' },
  { k: ['krewetk', 'owoce morza'], ico: 'shrimp', cat: 'ryby' },
  { k: ['kalmar', 'osmiornic', 'matwa'], ico: 'squid', cat: 'ryby' },
  { k: ['malz', '=mule', 'przegrzeb', 'omuli'], ico: 'shell', cat: 'ryby' },
  { k: ['ryb', 'losos', 'tunczyk', 'sledz', 'dorsz', 'makrel', 'mintaj', 'pstrag', 'sardyn', 'miruna', 'tilapi', 'morszczuk', 'paluszki ryb', 'surimi', 'paluszki krab'], ico: 'fish', cat: 'ryby' },
  { k: ['pomid', 'passat', 'koncentrat pomid', 'przecier'], ico: 'tomato', cat: 'warzywa' },
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
  { k: ['mrozon', 'hortex', 'iglokrem'], ico: 'bag', cat: 'mrożonki i gotowce' },
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

// Odmiany, których rdzeń wygląda inaczej niż w podstawowej nazwie (cukier/cukru, jajka/jaj)
const ALIAS = {
  cukru: 'cukier', jaj: 'jajka', jaja: 'jajka', jajo: 'jajka', jajko: 'jajka', marchewka: 'marchew', marchewki: 'marchew',
  marchewek: 'marchew', marchewke: 'marchew', marchwi: 'marchew', maselko: 'masło', maselka: 'masło', chlebek: 'chleb',
  chlebka: 'chleb', bulka: 'bułki', bulek: 'bułki', ogorek: 'ogórki', ogorka: 'ogórki', pomidor: 'pomidory', pomidora: 'pomidory',
  ziemniak: 'ziemniaki', ziemniaka: 'ziemniaki', jablko: 'jabłka', jablka: 'jabłka', jablek: 'jabłka', banan: 'banany', banana: 'banany',
}

// Poprawna forma nazwy: odmiana ze słownika ("masła" -> "masło"), zapamiętana nazwa albo poprawiona literówka.
// Literówki poprawiamy tylko w słowach, których słownik nie zna, żeby nie zmieniać "sałatki" w "sałatę".
export function canonical(raw, learned = {}) {
  const typed = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!typed) return { name: '', changed: false };
  // liczby w nazwie ("mleko 3,2%", "chleb 5 zbóż") zostają na swoim miejscu, poprawiamy tylko słowa przed nimi
  const ws = typed.split(' ');
  const firstNum = ws.findIndex((w) => /\d/.test(w));
  if (firstNum >= 0) {
    if (firstNum === 0) return { name: typed, changed: false };
    const base = canonical(ws.slice(0, firstNum).join(' '), learned);
    if (!base.name) return { name: typed, changed: false };
    const nm = [base.name, ...ws.slice(firstNum)].join(' ');
    return { name: nm, changed: norm(nm) !== norm(typed), how: base.how };
  }
  const alias = ALIAS[norm(typed)];
  if (alias) return { name: alias, changed: norm(alias) !== norm(typed), how: 'odmiana' };
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

// ---------- ilości wpisane przy nazwie ----------
// Rozumie liczbę przed i po nazwie, ze spacją i bez ("3 masło", "3masło", "masło3", "masło x3", "3x masła",
// "masło (3 szt.)", "masło: 3"), słownie ("trzy masła", "dwie kostki masła", "tuzin jajek", "pół kilo sera"),
// wagę i objętość ("2 kg ziemniaków", "ser 50dag", "mleko 2l", "6x1,5l woda") oraz opakowania
// ("3 puszki pomidorów", "2 opak. jajek"). Liczby, które są częścią nazwy ("mleko 3,2%", "7up",
// "chleb 5 zbóż", "witamina d3", "pepsi 0,5"), zostają w nazwie.

const QTY_MAX = 99;

const NUM_WORDS = {
  jeden: 1, jedna: 1, jedno: 1, jednego: 1, jednej: 1, dwa: 2, dwie: 2, dwoch: 2, dwoje: 2, trzy: 3, trzech: 3, troje: 3,
  cztery: 4, czterech: 4, czworo: 4, piec: 5, pieciu: 5, szesc: 6, szesciu: 6, siedem: 7, siedmiu: 7, osiem: 8, osmiu: 8,
  dziewiec: 9, dziewieciu: 9, dziesiec: 10, dziesieciu: 10, jedenascie: 11, dwanascie: 12, trzynascie: 13, czternascie: 14,
  pietnascie: 15, szesnascie: 16, siedemnascie: 17, osiemnascie: 18, dziewietnascie: 19, dwadziescia: 20, trzydziesci: 30,
};
const FRAC_WORDS = { pol: 0.5, poltora: 1.5, poltorej: 1.5, cwierc: 0.25 };
const VAGUE = { kilka: 'kilka', pare: 'parę', kilkanascie: 'kilkanaście' };
const MASS = [
  [/^(kg|kilo|kila|kilogram|kilogramy|kilogramow|kilograma)$/, 'kg'], [/^(g|gr|gram|gramy|gramow|grama)$/, 'g'],
  [/^(dag|dkg|deko|deka|dekagram|dekagramy|dekagramow|dekagrama)$/, 'dag'], [/^(l|litr|litry|litrow|litra)$/, 'l'],
  [/^(ml|mililitr|mililitry|mililitrow|mililitra)$/, 'ml'],
];
// opakowania: [1, 2–4, 5+, pół (dopełniacz)], formy bez polskich znaków do rozpoznania
const PACKS = [
  ['opakowanie', 'opakowania', 'opakowań', 'opakowania', /^(op|opak|opakowanie|opakowania|opakowan)$/],
  ['paczka', 'paczki', 'paczek', 'paczki', /^(paczka|paczki|paczek|paczke|paczuszka|paczuszki)$/],
  ['puszka', 'puszki', 'puszek', 'puszki', /^(puszka|puszki|puszek|puszke|puszeczka|puszeczki)$/],
  ['butelka', 'butelki', 'butelek', 'butelki', /^(butelka|butelki|butelek|butelke|but)$/],
  ['słoik', 'słoiki', 'słoików', 'słoika', /^(sloik|sloiki|sloikow|sloika|sloiczek|sloiczki)$/],
  ['kostka', 'kostki', 'kostek', 'kostki', /^(kostka|kostki|kostek|kostke)$/],
  ['karton', 'kartony', 'kartonów', 'kartonu', /^(karton|kartony|kartonow|kartonu|kartonik|kartoniki)$/],
  ['bochenek', 'bochenki', 'bochenków', 'bochenka', /^(bochenek|bochenki|bochenkow|bochenka)$/],
  ['tabliczka', 'tabliczki', 'tabliczek', 'tabliczki', /^(tabliczka|tabliczki|tabliczek|tabliczke|tabl)$/],
  ['torebka', 'torebki', 'torebek', 'torebki', /^(torebka|torebki|torebek|torebke)$/],
  ['worek', 'worki', 'worków', 'worka', /^(worek|worki|workow|worka|woreczek|woreczki|woreczkow)$/],
  ['siatka', 'siatki', 'siatek', 'siatki', /^(siatka|siatki|siatek|siatke)$/],
  ['główka', 'główki', 'główek', 'główki', /^(glowka|glowki|glowek|glowke)$/],
  ['pęczek', 'pęczki', 'pęczków', 'pęczka', /^(peczek|peczki|peczkow|peczka)$/],
  ['zgrzewka', 'zgrzewki', 'zgrzewek', 'zgrzewki', /^(zgrzewka|zgrzewki|zgrzewek|zgrzewke)$/],
  ['plaster', 'plastry', 'plastrów', 'plastra', /^(plaster|plastry|plastrow|plasterek|plasterki|plasterkow)$/],
  ['kubek', 'kubki', 'kubków', 'kubka', /^(kubek|kubki|kubkow|kubeczek|kubeczki)$/],
  ['pudełko', 'pudełka', 'pudełek', 'pudełka', /^(pudelko|pudelka|pudelek)$/],
  ['tubka', 'tubki', 'tubek', 'tubki', /^(tubka|tubki|tubek|tubke)$/],
  ['saszetka', 'saszetki', 'saszetek', 'saszetki', /^(saszetka|saszetki|saszetek|saszetke)$/],
  ['ząbek', 'ząbki', 'ząbków', 'ząbka', /^(zabek|zabki|zabkow|zabka)$/],
];
// liczby, które są częścią nazwy, a nie ilością
const KEEP = [
  /\d+(?:[.,]\d+)?\s?%/g,
  /(^|\s)(7\s?up|7\s?days|3\s?bit|4\s?move|tic\s?tac|\d{1,2}\s?zb[oó][zż]|omega[\s-]?\d|\d\s?w\s?1)(?=\s|$|[,;)])/gi,
];
const LETTERS = 'a-ząćęłńóśźż';
const tnorm = (w) => norm(w).replace(/[.,:;=)(-]+$/g, '').replace(/^[(-]+/, '');

function unitOf(w) {
  for (const [re, u] of MASS) if (re.test(w)) return u;
  return null;
}
function packOf(w) {
  for (let i = 0; i < PACKS.length; i++) if (PACKS[i][4].test(w)) return i;
  return -1;
}
const plural = (n, f) => (n === 1 ? f[0] : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? f[1] : f[2]));
const fmtNum = (v) => (v === 0.5 ? 'pół' : String(Math.round(v * 1000) / 1000).replace('.', ','));
export function packLabel(n, idx) {
  const f = PACKS[idx];
  return Number.isInteger(n) ? `${n} ${plural(n, f)}` : `${fmtNum(n)} ${f[3]}`;
}
const massLabel = (v, u) => `${String(Math.round(v * 1000) / 1000).replace('.', ',')} ${u}`;

// Jeden token: liczba, liczba słownie, x, sztuki, jednostka, opakowanie albo słowo z nazwy
function tok(raw) {
  const w = tnorm(raw);
  if (raw.includes('\u0001')) return { raw, kind: 'word' };
  let m;
  const r = raw.toLowerCase().replace(/[.,:;)(]+$/, '');
  if ((m = /^(\d+)\/(\d+)$/.exec(r)) && Number(m[2]) > 0) return { raw, kind: 'num', v: Number(m[1]) / Number(m[2]), int: false };
  if ((m = /^(\d+)(?:[.,](\d+))?$/.exec(w))) return { raw, kind: 'num', v: Number(m[1] + (m[2] ? '.' + m[2] : '')), int: !m[2] };
  if ((m = /^(\d+)[-–](\d+)$/.exec(w))) return { raw, kind: 'num', v: Math.max(Number(m[1]), Number(m[2])), int: true };
  if (w in NUM_WORDS) return { raw, kind: 'num', v: NUM_WORDS[w], int: true, word: true };
  if (w in FRAC_WORDS) return { raw, kind: 'num', v: FRAC_WORDS[w], int: false, word: true };
  if (w in VAGUE) return { raw, kind: 'vague', text: VAGUE[w] };
  if (/^(x|×|\*|razy)$/.test(w) || /^[×*]$/.test(raw)) return { raw, kind: 'x' };
  if (/^(szt|sztuk|sztuki|sztuka|sztuke)$/.test(w)) return { raw, kind: 'szt' };
  if (/^(tuzin|tuziny|tuzinow|tuzina)$/.test(w)) return { raw, kind: 'dozen' };
  if (w === 'po') return { raw, kind: 'po' };
  const u = unitOf(w);
  if (u) return { raw, kind: 'unit', u };
  const p = packOf(w);
  if (p >= 0) return { raw, kind: 'pack', p };
  if (/^[-–:=,;/]+$/.test(raw) || /^(ok|okolo|ca)$/.test(w)) return { raw, kind: 'sep' };
  return { raw, kind: 'word' };
}

// Ilość zaczynająca się na pozycji i: { end, count, mass, pack, vague, frac } albo null
function qtyAt(T, i, leading) {
  const t = T[i];
  if (!t) return null;
  let j = i;
  const q = {};
  if (t.kind === 'vague') return { end: i + 1, vague: t.text };
  if ((t.kind === 'x' || t.kind === 'szt') && T[i + 1] && T[i + 1].kind === 'num' && T[i + 1].int) j++; // x3, szt. 3
  else if (t.kind === 'unit' && /^(kg|kilo|kila|kilogram|litr)$/.test(tnorm(t.raw))) return { end: i + 1, mass: { v: 1, u: t.u } };
  else if (t.kind === 'pack' && leading) return { end: i + 1, pack: { v: 1, p: t.p } };
  else if (t.kind === 'dozen') return { end: i + 1, count: 12 };
  const n = T[j];
  if (!n || n.kind !== 'num') return null;
  let v = n.v;
  let whole = n.int;
  j++;
  if (T[j] && T[j].kind === 'dozen') { v = Math.round(v * 12); whole = Number.isInteger(v); j++; }
  if (T[j] && (T[j].kind === 'x' || T[j].kind === 'szt')) {
    // "2 x 1 kg", "3 szt", "3x"
    const k = T[j].kind;
    j++;
    if (k === 'x' && T[j] && T[j].kind === 'szt') j++;
    if (k === 'szt' && T[j] && T[j].kind === 'x') j++;
    if (!Number.isInteger(v)) return null;
    q.count = v;
    if (k === 'x' && T[j] && T[j].kind === 'num' && T[j + 1] && T[j + 1].kind === 'unit') {
      q.mass = { v: T[j].v, u: T[j + 1].u };
      j += 2;
    }
    return { ...q, end: j };
  }
  if (T[j] && T[j].kind === 'unit') {
    q.mass = { v, u: T[j].u };
    j++;
    if (T[j] && T[j].kind === 'x' && T[j + 1] && T[j + 1].kind === 'num' && T[j + 1].int) { q.count = T[j + 1].v; j += 2; } // 1 kg x 2
    return { ...q, end: j };
  }
  if (T[j] && T[j].kind === 'pack') {
    q.pack = { v, p: T[j].p };
    j++;
    if (T[j] && T[j].kind === 'po' && T[j + 1] && T[j + 1].kind === 'num' && T[j + 2] && T[j + 2].kind === 'unit') {
      q.per = { v: T[j + 1].v, u: T[j + 2].u };
      j += 3;
    }
    return { ...q, end: j };
  }
  if (whole && Number.isInteger(v) && v <= QTY_MAX) return { count: v, end: j };
  // "pół arbuza", "półtora chleba": ułamek bez jednostki tylko przed nazwą i tylko słownie
  if (leading && n.word) return { frac: v, end: j };
  return null;
}

// Ilość kończąca się dokładnie na końcu T (najdłuższa możliwa)
function qtyAtEnd(T) {
  for (let i = Math.max(1, T.length - 7); i < T.length; i++) {
    const p = T[i - 1];
    if (!['word', 'sep', 'unit', 'pack'].includes(p.kind) && !(p.kind === 'num' && !p.int)) continue;
    const q = qtyAt(T, i, false);
    if (q && q.end === T.length) return { ...q, start: i };
  }
  return null;
}

function prepare(raw) {
  let t = String(raw || '').trim().replace(/\s+/g, ' ');
  const kept = [];
  for (const re of KEEP) {
    t = t.replace(re, (m, lead) => {
      const pre = typeof lead === 'string' && /^\s$/.test(lead) ? lead : '';
      kept.push(m.slice(pre.length));
      return `${pre}\u0001${kept.length - 1}\u0001`;
    });
  }
  // nawiasy z ilością na końcu: "masło (3 szt.)"
  t = t.replace(/\s*[([]([^()[\]]*)[)\]]\s*$/, ' $1');
  t = t
    .replace(new RegExp(`([${LETTERS}]{3,})(\\d)`, 'gi'), '$1 $2') // masło3
    .replace(new RegExp(`([${LETTERS}]{2,})[-–:=](\\d)`, 'gi'), '$1 $2') // masło-3
    .replace(/(\d)\s*[x×*]\s*(?=\d)/gi, '$1 x ') // 2x1
    .replace(/(\d)[x×*](?=\s|$|[^\d\s])/gi, '$1 x') // 3x
    .replace(/(^|\s)[x×*](?=\d)/gi, '$1x ') // x3
    .replace(new RegExp(`(\\d)([${LETTERS}]+)`, 'gi'), (m, d, w) => {
      const n = tnorm(w);
      return unitOf(n) || packOf(n) >= 0 || /^(szt|sztuk|sztuki|x)$/.test(n) || w.length >= 3 ? `${d} ${w}` : m;
    })
    .replace(/\s+/g, ' ')
    .trim();
  return { tokens: t ? t.split(' ').map(tok) : [], kept };
}

function restore(text, kept) {
  return text.replace(/\u0001(\d+)\u0001/g, (m, i) => kept[Number(i)]);
}

function build(T, kept, whole) {
  let a = 0;
  let b = T.length;
  while (a < b && T[a].kind === 'sep') a++; // "około 2 kg ziemniaków"
  let lead = qtyAt(T, a, true);
  if (lead && lead.end >= T.length) lead = null; // sama liczba bez nazwy
  if (lead) a = lead.end;
  const parts = [];
  if (lead) parts.push(lead);
  // "2 puszki pomidorów po 400 g"
  if (lead && lead.pack && !lead.per && b - a >= 4 && T[b - 3].kind === 'po' && T[b - 2].kind === 'num' && T[b - 1].kind === 'unit') {
    lead.per = { v: T[b - 2].v, u: T[b - 1].u };
    b -= 3;
  }
  // z końca: najpierw jedno, potem ewentualnie drugie ("woda 6 x 1,5 l", "mleko 2 l 3")
  for (let pass = 0; pass < 2; pass++) {
    const tail = qtyAtEnd(T.slice(0, b));
    if (!tail || tail.start <= a) break;
    // druga liczba sztuk albo druga waga nie ma sensu: zostaje w nazwie
    const clash = parts.some((p) => (p.count || p.pack || p.frac) && (tail.count || tail.pack || tail.frac))
      || parts.some((p) => p.mass && tail.mass);
    if (clash) break;
    parts.push(tail);
    b = tail.start;
  }
  while (b > a && ['sep', 'x', 'szt'].includes(T[b - 1].kind)) b--;
  while (a < b && ['sep', 'x', 'szt'].includes(T[a].kind)) a++;
  const name = restore(T.slice(a, b).map((x) => x.raw).join(' '), kept).replace(/^[\s,.;:–-]+|[\s,.;:–-]+$/g, '').trim();
  if (!name || !parts.length) return { text: whole.replace(/\s+(x|×|\*|szt\.?)$/i, ''), qty: 1, amount: '' };
  let qty = 1;
  let amount = '';
  const mass = parts.find((p) => p.mass);
  const pack = parts.find((p) => p.pack);
  const count = parts.find((p) => p.count);
  const frac = parts.find((p) => p.frac);
  const vague = parts.find((p) => p.vague);
  if (pack) {
    const v = pack.pack.v;
    if (Number.isInteger(v)) qty = v;
    if (count && Number.isInteger(v)) qty = v * count.count;
    const per = pack.per || (mass && mass.mass);
    amount = packLabel(count && Number.isInteger(v) ? qty : v, pack.pack.p) + (per ? ` po ${massLabel(per.v, per.u)}` : '');
  } else if (mass) {
    amount = massLabel(mass.mass.v, mass.mass.u);
    qty = mass.count || (count ? count.count : 1);
  } else if (count) {
    qty = count.count;
  } else if (frac) {
    amount = frac.frac === 0.5 ? 'pół' : frac.frac === 1.5 ? 'półtora' : fmtNum(frac.frac);
  } else if (vague) {
    amount = vague.vague;
  }
  qty = Math.max(1, Math.min(QTY_MAX, Math.round(qty) || 1));
  return { text: name, qty, amount };
}

// "3 masło", "3x masło", "masło3", "fasola x 3", "masło (3 szt.)", "2 kg ziemniaków", "dwie kostki masła"
export function parseEntry(raw) {
  const whole = String(raw || '').trim().replace(/\s+/g, ' ')
    .replace(/^(?:[-–•·]\s*|\*\s+|\d{1,2}[.)]\s+)/, '').replace(/[,.;:–-]+$/, '').trim();
  const { tokens, kept } = prepare(whole);
  return build(tokens, kept, whole);
}

// Kilka rzeczy w jednym wpisie: przecinek, średnik, nowa linia, plus, "i", "oraz"
// ("masło, 2 mleka i chleb"), a także "3 masła 2 mleka" i "masło 3 mleko 2" bez przecinków.
export function splitEntries(raw) {
  const s = String(raw || '');
  const out = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const digitComma = ch === ',' && /\d/.test(s[i - 1] || '') && /\d/.test(s[i + 1] || '');
    if ((ch === ',' && !digitComma) || ch === ';' || ch === '\n' || ch === '+') { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  const parts = [];
  for (const piece of out) {
    for (const p of piece.split(/\s+(?:i|oraz|&)\s+/i)) {
      const t = p.trim();
      if (!t) continue;
      const { tokens } = prepare(t);
      if (parts.length && tokens.length && tokens.every((x) => x.kind !== 'word')) parts[parts.length - 1] += ' ' + t;
      else parts.push(...splitRun(t));
    }
  }
  return parts;
}

// "3 masła 2 mleka" -> ["3 masła", "2 mleka"]; "masło 3 mleko 2" -> ["masło 3", "mleko 2"]
function splitRun(text) {
  const { tokens: T, kept } = prepare(text);
  if (T.length < 4) return [text];
  const piece = (x, y) => restore(T.slice(x, y).map((t) => t.raw).join(' '), kept);
  const isName = (t) => t && t.kind === 'word';
  const lead = qtyAt(T, 0, true);
  if (lead && isName(T[lead.end])) {
    const cuts = [0];
    for (let i = lead.end + 1; i < T.length; i++) {
      if (!isName(T[i - 1])) continue;
      const q = qtyAt(T, i, true);
      if (q && !q.vague && !q.frac && isName(T[q.end])) cuts.push(i);
    }
    if (cuts.length > 1) return cuts.map((c, k) => piece(c, cuts[k + 1] || T.length));
  }
  const tail = qtyAtEnd(T);
  if (tail && !lead) {
    const ends = [];
    for (let i = 1; i < T.length - 1; i++) {
      if (!isName(T[i - 1])) continue;
      const q = qtyAt(T, i, false);
      if (q && !q.vague && isName(T[q.end]) && q.end < tail.start) { ends.push(q.end); i = q.end - 1; }
    }
    if (ends.length) {
      const cuts = [0, ...ends];
      return cuts.map((c, k) => piece(c, cuts[k + 1] || T.length));
    }
  }
  return [text];
}

// Ilość z pozycji listy z powrotem na liczby: { mass: {v, u} } albo { pack: {v, p} } albo null
export function amountInfo(amount) {
  const t = norm(amount || '');
  let m;
  if ((m = /^(pol|\d+(?:[.,]\d+)?) (kg|g|dag|l|ml)$/.exec(t))) return { mass: { v: m[1] === 'pol' ? 0.5 : Number(m[1].replace(',', '.')), u: m[2] } };
  if ((m = /^(pol|\d+(?:[.,]\d+)?) (\S+)/.exec(t))) {
    const p = packOf(m[2]);
    if (p >= 0) return { pack: { v: m[1] === 'pol' ? 0.5 : Number(m[1].replace(',', '.')), p } };
  }
  return null;
}

// Gramy (dla płynów mililitry) z ilości pozycji, 0 gdy nie wiadomo
export function gramsOf(amount) {
  const a = amountInfo(amount);
  if (!a || !a.mass) return 0;
  return a.mass.v * { kg: 1000, g: 1, dag: 10, l: 1000, ml: 1 }[a.mass.u];
}

// Jak pokazać ilość na liście: "×3", "2 kg", "2 × 1 kg", "3 puszki", "kilka"
export function qtyText(i) {
  const q = i.qty || 1;
  if (i.amount) {
    const a = amountInfo(i.amount);
    if (a && a.pack) return i.amount;
    return q > 1 ? `${q} × ${i.amount}` : i.amount;
  }
  return q > 1 ? `×${q}` : '';
}

const liquid = (u) => u === 'l' || u === 'ml';

// Nowa liczba sztuk; przy opakowaniach poprawia też napis ("2 puszki" -> "5 puszek", "po 400 g" zostaje)
export function setQty(item, n) {
  item.qty = Math.max(1, Math.min(QTY_MAX, Math.round(n) || 1));
  const a = amountInfo(item.amount);
  if (a && a.pack && Number.isInteger(a.pack.v)) item.amount = item.amount.replace(/^\S+ \S+/, packLabel(item.qty, a.pack.p));
  if (item.qty === 1) delete item.qty;
  return item;
}

// Podpis przy plusie i minusie: "Ile sztuk", "Ile puszek", "Ile razy po 1 kg"
export function stepLabel(i) {
  const a = amountInfo(i.amount);
  if (a && a.pack && Number.isInteger(a.pack.v)) return 'Ile ' + PACKS[a.pack.p][2];
  if (a && a.mass) return 'Ile razy po ' + i.amount;
  return 'Ile sztuk';
}

// Ta sama rzecz wpisana drugi raz: sztuki i opakowania się sumują, waga też (w tych samych jednostkach)
export function mergeQty(have, p) {
  const a = amountInfo(have.amount);
  const b = amountInfo(p.amount);
  const hq = have.qty || 1;
  if (!p.amount) {
    setQty(have, hq + p.qty);
  } else if (a && b && a.pack && b.pack && a.pack.p === b.pack.p && Number.isInteger(a.pack.v) && Number.isInteger(b.pack.v)) {
    setQty(have, hq + p.qty);
  } else if (a && b && a.mass && b.mass && hq === 1 && p.qty === 1 && liquid(a.mass.u) === liquid(b.mass.u)) {
    const g = gramsOf(have.amount) + gramsOf(p.amount);
    if (liquid(a.mass.u)) have.amount = g >= 1000 ? massLabel(g / 1000, 'l') : massLabel(g, 'ml');
    else if (a.mass.u === 'dag' && b.mass.u === 'dag' && g < 1000) have.amount = massLabel(g / 10, 'dag');
    else have.amount = g >= 1000 ? massLabel(g / 1000, 'kg') : massLabel(g, 'g');
  } else {
    have.amount = p.amount;
    have.qty = p.qty;
  }
  if (!(have.qty > 1)) delete have.qty;
  return have;
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
