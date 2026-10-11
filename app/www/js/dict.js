// Słownik produktów: rozpoznaje ikonkę i kategorię po nazwie wpisanej na listę.
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
  { k: ['pierogi'], ico: 'bag', cat: 'mrożonki i gotowce' },
  { k: ['maslo orzech'], ico: 'jar', cat: 'śniadania' },
  { k: ['frytki z ', 'domowe frytki'], ico: 'potato', cat: 'warzywa' },
  // zachcianki
  { k: ['chips', 'czips', '=lays', 'paluszk', 'crunchips', 'nachos', 'prazynk', 'popcorn', 'krakers', 'chrupk', 'orzeszki ziemne', 'orzeszki solone', 'precle', 'doritos', 'pringles'], ico: 'chips', cat: 'chipsy i przekąski' },
  { k: ['energety', 'monster', 'red bull', 'redbull', '=tiger', 'rockstar', 'energy drink', '=burn'], ico: 'can', cat: 'energetyki' },
  { k: ['cola', 'pepsi', 'fanta', 'sprite', 'mirinda', 'oranzad', 'gazowan', 'ice tea', 'lipton', 'oshee', 'tymbark', 'kubus', 'napoj', 'lemoniad', 'syrop'], ico: 'can', cat: 'słodkie napoje' },
  { k: ['czekolad', 'baton', 'snickers', 'twix', '=mars', 'bounty', 'kitkat', 'kit kat', 'prince polo', 'cukierk', 'zelk', 'haribo', 'ciastk', '=ciasto', 'lody', '=lod', 'wafel', 'wafelk', 'ptasie', 'kinder', 'milka', 'raffaello', 'merci', 'pralin', 'paczek', 'paczk', 'donut', 'croissant', 'rogalik', 'drozdzowk', 'babeczk', 'muffin', '=tort', 'sernik', 'krowk', 'michalk', 'delicje', 'oreo', 'nutella', 'krem czekolad', 'deser', 'budyn', 'galaretk', 'gofr', 'slodycz', 'lizak', 'guma do zucia', 'bombonier', 'pianki', 'chalwa', 'brownie'], ico: 'candy', cat: 'słodycze' },
  { k: ['piwo', 'piwa', '=wino', 'wina', 'wodk', 'cydr', 'whisk', '=gin', '=rum', 'likier', 'nalewk', 'szampan', 'prosecco', 'radler', 'alkohol', 'tequila', 'brandy', 'koniak', 'aperol'], ico: 'bottle', cat: 'alkohol' },
  { k: ['pizza', 'kebab', 'burger', 'hot dog', 'hotdog', 'zapiekank', 'frytk', 'nugget', 'mcdonald', '=kfc', 'kubelek', 'shoarma', 'falafel w bulce'], ico: 'bag', cat: 'fast food' },
  { k: ['danie gotowe', 'gotowe danie', 'gotowy obiad', 'zupka chinsk', 'chinska zupk', 'zupa w proszk', 'zupa instant', 'kubek smakow', 'lasagne gotow', 'danie w sloik', 'gotowiec', 'kotlet gotow', 'golabki w sloik', 'fasolka po bretonsku w sloik', 'mrozona pizza'], ico: 'bag', cat: 'gotowe dania' },
  // podstawy
  { k: ['mlek', 'kefir', 'maslank', 'jogurt', 'smietan', 'skyr', 'mascarpone', 'serek wiejski', 'zsiadl'], ico: 'milk', cat: 'nabiał' },
  { k: ['masl', 'margaryn', '=rama', 'smalec', 'ghee'], ico: 'butter', cat: 'nabiał' },
  { k: ['^ser', 'twarog', 'mozzarell', '=feta', 'parmezan', 'gouda', '=edam', 'halloumi', 'cheddar', 'gorgonzol', 'ricott', 'bryndz', 'oscypek', 'camembert', 'brie'], ico: 'cheese', cat: 'nabiał' },
  { k: ['jaj', 'jajk'], ico: 'egg', cat: 'nabiał' },
  { k: ['chleb', 'bulk', 'bagiet', '=tost', 'tostow', 'pieczyw', 'grahamk', 'kajzerk', 'tortill', 'pita', 'lavash', 'lawasz', 'chlebek', 'bajgiel', 'pumpernikiel'], ico: 'bread', cat: 'pieczywo' },
  { k: ['makaron', 'spaghetti', 'penne', 'swiderk', 'kokard', 'tagliatell', 'lasagne', 'noodle', 'gnocchi', 'fusilli', 'rigatoni', 'farfalle', 'nitki', 'zacierk', 'kluski', 'kopytk', 'udon', 'soba', 'ramen'], ico: 'pasta', cat: 'makarony i kasze' },
  { k: ['=ryz', 'ryzu', 'ryzow', 'kasz', 'kuskus', 'bulgur', 'quinoa', 'komos', 'jaglan', 'gryczan', 'peczak'], ico: 'rice', cat: 'makarony i kasze' },
  { k: ['platk', 'owsian', 'musli', 'granol', 'otreby'], ico: 'oats', cat: 'śniadania' },
  { k: ['^maka', 'cukier', 'drozdz', 'proszek do piecz', '=soda', 'skrobi', 'bulka tart', 'kakao'], ico: 'flour', cat: 'do pieczenia' },
  { k: ['kurczak', 'kurcze', 'piers', 'filet z kurcz', 'indyk', 'udk', 'skrzydel', 'podudz', 'drob'], ico: 'chicken', cat: 'mięso' },
  { k: ['mielon', 'mieso', 'miesa', 'schab', 'lopatk', 'karkowk', 'boczek', 'wolowin', 'wieprzow', 'gulasz', 'antrykot', 'poledwiczk', 'zeberk', 'watrobk', 'cielecin', 'jagniecin', 'kaczk'], ico: 'mince', cat: 'mięso' },
  { k: ['kielbas', 'parowk', 'szynk', 'wedlin', 'salami', 'kabanos', 'poledwic', 'mortadel', 'pasztet', 'chorizo', 'bekon', 'boczek wedz'], ico: 'sausage', cat: 'wędliny' },
  { k: ['ryb', 'losos', 'tunczyk', 'sledz', 'dorsz', 'makrel', 'mintaj', 'pstrag', 'krewetk', 'sardyn', 'miruna', 'tilapi', 'morszczuk', 'paluszki ryb', 'surimi', 'owoce morza', 'kalmar'], ico: 'fish', cat: 'ryby' },
  { k: ['pomidor', 'passat', 'koncentrat pomid', 'przecier'], ico: 'tomato', cat: 'warzywa' },
  { k: ['ziemniak', 'kartofl', 'ziemniaczk', 'batat'], ico: 'potato', cat: 'warzywa' },
  { k: ['cebul', 'czosn', '=por', '=pory', 'szczypior', 'szalotk', 'imbir'], ico: 'onion', cat: 'warzywa' },
  { k: ['papryk', 'chili', 'jalapeno', 'peperoni'], ico: 'pepper', cat: 'warzywa' },
  { k: ['marchew', 'marchw', 'pietruszk', 'pasternak'], ico: 'carrot', cat: 'warzywa' },
  { k: ['pieczark', 'grzyb', 'boczniak', 'kurki', 'shiitake'], ico: 'mushroom', cat: 'warzywa' },
  { k: ['fasol', 'ciecierzyc', 'soczewic', 'groch', 'hummus', 'edamame', '=soja', 'tofu', '=bob', '=bobu'], ico: 'beans', cat: 'strączki' },
  { k: ['kapust', 'salat', 'ogork', 'cukini', 'brokul', 'kalafior', 'szpinak', 'baklazan', 'dyni', 'dynia', 'burak', 'seler', 'rzodkiew', 'kukurydz', 'rukol', 'jarmuz', 'rzepa', 'warzyw', 'koperek', 'koper', 'natka', 'bazyli', 'kolendr', 'mieta', 'kielki', 'groszek', 'fasolka szparag', 'awokado'], ico: 'leaf', cat: 'warzywa' },
  { k: ['jablk', 'jablek'], ico: 'apple', cat: 'owoce' },
  { k: ['banan'], ico: 'banana', cat: 'owoce' },
  { k: ['cytryn', 'limonk', 'pomarancz', 'mandaryn', 'grejpfrut', 'klementyn'], ico: 'lemon', cat: 'owoce' },
  { k: ['grusz', 'sliwk', 'winogron', 'truskaw', 'borowk', 'malin', 'kiwi', 'mango', 'ananas', 'arbuz', 'melon', 'brzoskw', 'morel', 'wisni', 'czeresn', 'jagod', 'owoc', 'rodzynk', 'daktyl', 'zurawin', 'figi'], ico: 'apple', cat: 'owoce' },
  { k: ['=sol', 'pieprz', 'przypraw', 'oregano', 'tymianek', 'majeranek', 'curry', 'kmin', 'cynamon', 'galka', 'kurkum', 'ziele', 'lisc laur', 'liscie laur', 'bulion', 'kostk', 'vegeta', 'garam', 'kardamon', 'gozdzik'], ico: 'jar', cat: 'przyprawy' },
  { k: ['ketchup', 'majonez', 'musztard', 'sos ', '=sos', 'ocet', 'chrzan', 'pesto', 'tahini', 'miso', 'sriracha', 'tabasco', 'dzem', 'konfitur', 'miod', 'powidl'], ico: 'jar', cat: 'sosy i dodatki' },
  { k: ['olej', 'oliw'], ico: 'bottle', cat: 'tłuszcze' },
  { k: ['woda', 'wody', '=sok', 'soki', 'soku'], ico: 'bottle', cat: 'napoje' },
  { k: ['^kaw', 'herbat', 'yerba', 'kakao'], ico: 'jar', cat: 'kawa i herbata' },
  { k: ['orzech', 'migdal', 'pestk', 'slonecznik', 'siemie', 'nasion', 'chia', 'sezam'], ico: 'beans', cat: 'bakalie' },
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

// Zwraca { ico, cat, treat, known }. learned: { 'nazwa': { treat: bool } } – odpowiedzi użytkownika.
export function classify(name, learned = {}) {
  const key = norm(name);
  if (learned[key]) {
    const l = learned[key];
    return { ico: l.ico || 'bag', cat: l.treat ? 'zachcianka' : 'podstawy', treat: !!l.treat, known: true, learned: true };
  }
  const hit = lookup(name);
  if (!hit) return { ico: 'bag', cat: 'inne', treat: false, known: false };
  return { ico: hit.ico, cat: hit.cat, treat: TREAT_CATS.includes(hit.cat), known: true };
}

// Słowa do szukania produktu w promocjach (bez końcówek odmiany).
export function searchStems(name) {
  const hit = lookup(name);
  const text = norm(name);
  const stems = new Set();
  if (hit && hit.kw) stems.add(hit.kw.replace(/^[=^]/, ''));
  for (const w of text.split(' ')) {
    if (w.length >= 4) stems.add(w.length > 6 ? w.slice(0, w.length - 2) : w.slice(0, Math.max(4, w.length - 1)));
  }
  return [...stems].filter(Boolean);
}

// Czy oferta pasuje do pozycji z listy.
export function offerMatches(itemName, offer) {
  const stems = searchStems(itemName);
  if (!stems.length) return false;
  const text = norm(offer.name + ' ' + (offer.brand || ''));
  const words = text.split(' ');
  const hitItem = lookup(itemName);
  const hitOffer = lookup(offer.name);
  // produkt z listy i oferta muszą trafić w tę samą grupę, żeby "mleko" nie łapało "czekolady mlecznej"
  if (hitItem && hitOffer && hitItem.ico !== hitOffer.ico) return false;
  return stems.some((s) => words.some((w) => w.startsWith(s)) || (s.includes(' ') && text.includes(s)));
}
