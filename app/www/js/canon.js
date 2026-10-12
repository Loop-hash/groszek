// Poprawne nazwy rzeczy z listy zakupów. Gdy ktoś wpisze inną odmianę („masła”, „jogurty pitne”)
// albo literówkę („mlkeo”), na liście ląduje forma stąd.
// Policzalne w liczbie mnogiej, jak zwykle pisze się na liście (jajka, ziemniaki), reszta w pojedynczej.

export const CANON = [
  // nabiał
  'masło', 'margaryna', 'mleko', 'mleko roślinne', 'napój owsiany', 'kefir', 'maślanka', 'jogurt', 'jogurt naturalny',
  'jogurt grecki', 'jogurt pitny', 'skyr', 'śmietana', 'śmietanka', 'serek wiejski', 'serek homogenizowany', 'serek śmietankowy',
  'ser', 'ser żółty', 'ser biały', 'twaróg', 'mozzarella', 'feta', 'parmezan', 'ser pleśniowy', 'mascarpone', 'ricotta', 'halloumi',
  'jajka', 'budyń', 'kisiel', 'deser mleczny',
  // pieczywo
  'chleb', 'chleb tostowy', 'bułki', 'bagietka', 'rogale', 'tortilla', 'pita', 'bajgle', 'grahamki', 'kajzerki', 'bułka tarta',
  'pieczywo chrupkie', 'wafle ryżowe',
  // makarony, kasze, śniadania, do pieczenia
  'makaron', 'spaghetti', 'penne', 'świderki', 'makaron ryżowy', 'lasagne', 'kluski', 'gnocchi', 'ryż', 'ryż basmati',
  'ryż jaśminowy', 'kasza gryczana', 'kasza jaglana', 'kasza jęczmienna', 'kasza manna', 'kuskus', 'bulgur', 'komosa ryżowa',
  'płatki owsiane', 'płatki kukurydziane', 'musli', 'granola', 'mąka', 'mąka pszenna', 'cukier', 'cukier puder', 'drożdże',
  'proszek do pieczenia', 'soda oczyszczona', 'skrobia ziemniaczana', 'kakao', 'cukier wanilinowy',
  // mięso, wędliny, ryby
  'mięso', 'mięso mielone', 'kurczak', 'pierś z kurczaka', 'udka', 'skrzydełka', 'indyk', 'schab', 'karkówka', 'łopatka',
  'boczek', 'wołowina', 'wieprzowina', 'żeberka', 'wątróbka', 'kiełbasa', 'parówki', 'szynka', 'salami', 'kabanosy', 'pasztet',
  'polędwica', 'ryba', 'łosoś', 'tuńczyk', 'śledzie', 'dorsz', 'makrela', 'paluszki rybne', 'paluszki krabowe', 'krewetki',
  'kalmary', 'małże', 'owoce morza',
  // warzywa
  'ziemniaki', 'bataty', 'cebula', 'czerwona cebula', 'czosnek', 'por', 'szczypiorek', 'dymka', 'pomidory', 'pomidorki koktajlowe',
  'pomidory z puszki', 'passata', 'koncentrat pomidorowy', 'ogórki', 'ogórki kiszone', 'papryka', 'marchew', 'pietruszka',
  'seler', 'buraki', 'kapusta', 'kapusta kiszona', 'kapusta pekińska', 'brokuł', 'kalafior', 'cukinia', 'bakłażan', 'dynia',
  'szpinak', 'sałata', 'rukola', 'rzodkiewka', 'kukurydza', 'groszek', 'fasolka szparagowa', 'pieczarki', 'grzyby', 'awokado',
  'imbir', 'chili', 'natka pietruszki', 'koperek', 'bazylia', 'kolendra', 'mięta', 'kiełki', 'warzywa na patelnię',
  'mieszanka warzyw', 'frytki',
  // strączki
  'fasola', 'fasola czerwona', 'fasola biała', 'ciecierzyca', 'soczewica', 'groch', 'tofu', 'hummus', 'bób',
  // owoce
  'jabłka', 'banany', 'gruszki', 'pomarańcze', 'mandarynki', 'cytryny', 'limonki', 'grejpfruty', 'winogrona', 'truskawki',
  'maliny', 'borówki', 'jagody', 'śliwki', 'brzoskwinie', 'kiwi', 'mango', 'ananas', 'arbuz', 'melon', 'wiśnie', 'czereśnie',
  'owoce leśne', 'rodzynki', 'daktyle', 'żurawina', 'morele suszone',
  // bakalie
  'orzechy', 'orzechy włoskie', 'orzeszki ziemne', 'migdały', 'nerkowce', 'pestki dyni', 'słonecznik', 'siemię lniane',
  'nasiona chia', 'sezam', 'wiórki kokosowe',
  // przyprawy, sosy, tłuszcze
  'sól', 'pieprz', 'papryka słodka', 'oregano', 'bazylia suszona', 'tymianek', 'majeranek', 'curry', 'kurkuma', 'kmin rzymski',
  'cynamon', 'ziele angielskie', 'liść laurowy', 'bulion', 'kostki rosołowe', 'przyprawa do kurczaka', 'ketchup', 'majonez',
  'musztarda', 'sos sojowy', 'ocet', 'chrzan', 'pesto', 'dżem', 'miód', 'masło orzechowe', 'nutella', 'olej', 'olej rzepakowy',
  'oliwa z oliwek', 'smalec', 'mleczko kokosowe', 'pasta curry', 'tahini',
  // napoje, kawa, herbata
  'woda', 'woda gazowana', 'sok', 'sok pomarańczowy', 'sok jabłkowy', 'kawa', 'kawa rozpuszczalna', 'herbata', 'herbata zielona',
  'yerba mate', 'kakao', 'napój', 'cola', 'pepsi', 'fanta', 'sprite', 'oranżada', 'lemoniada', 'ice tea', 'syrop', 'energetyk',
  'piwo', 'wino', 'wódka', 'cydr',
  // słodycze i przekąski
  'czekolada', 'czekolada gorzka', 'baton', 'batony', 'cukierki', 'żelki', 'draże', 'lizaki', 'gumy do żucia', 'ciastka',
  'herbatniki', 'wafelki', 'pierniki', 'lody', 'pączki', 'drożdżówki', 'rogaliki', 'croissanty', 'muffinki', 'ciasto', 'sernik',
  'chipsy', 'paluszki', 'chrupki', 'popcorn', 'krakersy', 'precle', 'nachosy', 'prażynki', 'orzeszki solone',
  // gotowce i fast food
  'pizza', 'pizza mrożona', 'zapiekanka', 'kebab', 'burger', 'hot dog', 'zupka chińska', 'pierogi', 'pyzy', 'kopytka',
  'danie gotowe', 'gołąbki w słoiku', 'fasolka po bretońsku',
  // chemia i dom
  'papier toaletowy', 'ręczniki papierowe', 'chusteczki', 'płyn do naczyń', 'gąbki', 'worki na śmieci', 'proszek do prania',
  'kapsułki do prania', 'płyn do płukania', 'mydło', 'żel pod prysznic', 'szampon', 'pasta do zębów', 'szczoteczka do zębów',
  'dezodorant', 'folia aluminiowa', 'folia spożywcza', 'papier do pieczenia', 'woreczki', 'baterie',
];
