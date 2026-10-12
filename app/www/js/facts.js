// Ciekawostki Groszosława: jedna przy otwarciu apki, bez powtórek, dopóki nie pokażą się wszystkie.
// t: tekst (sprawdzone fakty; mity podpisane jako mity), r: przepis z apki, do którego prowadzi link.
export const FACTS = [
  // postacie z przebrań Groszosława (k: klucz przebrania). Pokazują się tylko z przebraniem, link do dania losuje apka.
  { t: 'Mikołaj Kopernik napisał traktat o monecie i opisał w nim, że gorszy pieniądz wypiera z obiegu lepszy. To prawo Kopernika-Greshama.', k: 'kopernik' },
  { t: 'Sałatka Cezar nie ma nic wspólnego z Juliuszem Cezarem. Wymyślił ją w latach 20. XX wieku Caesar Cardini w meksykańskiej Tijuanie.', k: 'cezar' },
  { t: 'Napoleonki, czyli kremówki, nie wymyślił Napoleon. Według jednej z teorii nazwa pochodzi od francuskiego napolitain, czyli neapolitański.', k: 'napoleon' },
  { t: 'Don Kichot nosił na głowie miednicę golibrody, którą wziął za legendarny hełm Mambryna.', k: 'donkichot' },
  { t: 'Sokrates nie napisał ani jednej książki. Wszystko, co o nim wiemy, spisali jego uczniowie, głównie Platon i Ksenofont.', k: 'sokrates' },
  { t: 'Beethoven podobno odliczał do każdej filiżanki kawy dokładnie 60 ziaren.', k: 'beethoven' },
  { t: 'Harry Houdini, mistrz ucieczek z kajdan i zamkniętych skrzyń, urodził się w Budapeszcie jako Erik Weisz.', k: 'houdini' },
  { t: 'Kozacy zaporoscy wzięli nazwę od miejsca: ich Sicz leżała za porohami, czyli skalnymi progami na Dnieprze.', k: 'kozak' },
  { t: '„Rycerz w tygrysiej skórze” Szoty Rustawelego to gruzińska epopeja narodowa z przełomu XII i XIII wieku.', k: 'rycerz' },
  { t: 'Janczarska orkiestra mehter to jedna z najstarszych orkiestr wojskowych świata. Jej brzmienie naśladował Mozart w „Marszu tureckim”.', k: 'mehter' },
  { t: 'Fenicjanie z wybrzeża dzisiejszego Libanu barwili tkaniny purpurą z morskich ślimaków. Była tak droga, że stała się kolorem władców.', k: 'fenicjanin' },
  { t: 'Ibn Battuta z Tangeru przemierzył w XIV wieku świat od Afryki Zachodniej po Chiny, w sumie około 120 tysięcy kilometrów.', k: 'battuta' },
  { t: 'Indyjski matematyk Brahmagupta w 628 roku opisał zasady liczenia z zerem jako pełnoprawną liczbą.', k: 'brahmagupta' },
  { t: 'Muay thai to sztuka ośmiu kończyn: walczy się pięściami, łokciami, kolanami i stopami.', k: 'muaythai' },
  { t: 'W Wietnamie phở je się często na śniadanie, prosto z ulicznych straganów.', k: 'pho' },
  { t: 'Terakotowa armia cesarza Qin Shi Huanga liczy około 8 tysięcy figur, a twarze żołnierzy podobno się nie powtarzają.', k: 'terakota' },
  { t: 'Momofuku Ando wymyślił zupkę instant w 1958 roku w szopie za domem. Miał wtedy 48 lat.', k: 'ando' },
  { t: 'Król Sejong Wielki w XV wieku stworzył hangul, koreański alfabet, żeby czytać mogli nie tylko uczeni.', k: 'sejong' },
  { t: 'W lucha libre największym upokorzeniem jest przegrać walkę o maskę i musieć ją zdjąć na oczach publiczności.', k: 'luchador' },
  { t: 'Abraham Lincoln jest na amerykańskiej monecie jednocentowej od 1909 roku, setnej rocznicy swoich urodzin.', k: 'lincoln' },
  { t: 'Ze Starego Mostu w Mostarze skacze się do rzeki z ponad 20 metrów. Most z 1566 roku zniszczono w 1993 roku i odbudowano.', k: 'skoczek' },
  // skąd się wzięło
  { t: 'Ziemniaki trafiły do Europy z Ameryki Południowej dopiero w XVI wieku. Wcześniej nikt tu nie znał ani frytek, ani placków.', r: 'pl-placki' },
  { t: 'Pomidory przypłynęły do Europy z Ameryk w XVI wieku, więc starożytni Rzymianie nie znali sosu pomidorowego.', r: 'it-bolognese' },
  { t: 'Papryczki chili dotarły do Azji z Ameryki dopiero w XVI wieku. Wcześniej ostrość kuchni indyjskiej dawał głównie pieprz.' },
  { t: 'Dawniej marchew była głównie fioletowa i żółta. Pomarańczową spopularyzowali holenderscy ogrodnicy w XVII wieku.' },
  { t: 'Kawa pochodzi z Etiopii, a nazwa cappuccino wzięła się od brązowych habitów zakonników kapucynów.' },
  { t: 'Groch uprawiano już ponad 9 tysięcy lat temu na Bliskim Wschodzie. To jedna z pierwszych roślin uprawnych w historii.' },
  { t: 'Czekolada pochodzi z Mezoameryki. Aztekowie pili gorzki napój z kakao, często z dodatkiem chili.', r: 'mx-mole' },
  { t: 'Nachos wymyślił w 1943 roku Ignacio „Nacho” Anaya w meksykańskim mieście Piedras Negras.', r: 'us-nachos' },
  { t: 'Croissant, symbol Francji, wywodzi się z austriackiego kipferla, rogala znanego w Wiedniu.' },
  { t: 'Currywurst wymyśliła podobno w 1949 roku w Berlinie Herta Heuwer, z keczupu i curry od brytyjskich żołnierzy.', r: 'de-currywurst' },
  { t: 'Hamburger wziął nazwę od Hamburga, a hot doga w USA nazywa się też frankfurterem, od Frankfurtu.' },
  { t: 'Chili con carne, mimo hiszpańskiej nazwy, wywodzi się z Teksasu.', r: 'us-chili' },
  { t: 'Bánh mì to wietnamska kanapka w bagietce, pamiątka po francuskiej obecności w Indochinach.', r: 'vn-banh-mi' },
  { t: 'Pad thai spopularyzował rząd Tajlandii w latach 30. i 40. XX wieku jako danie narodowe.', r: 'th-pad-thai' },
  { t: 'Ramen trafił do Japonii z Chin. Dziś w Japonii są całe muzea poświęcone zupkom ramen.', r: 'jp-ramen' },
  { t: 'Według tradycji tofu wymyślono w Chinach ponad 2000 lat temu.', r: 'cn-mapo' },
  { t: 'Sushi zaczęło się jako sposób konserwowania ryby w fermentującym ryżu, który potem się wyrzucało.' },
  { t: 'Przepis na mujadarę, soczewicę z ryżem i cebulą, jest już w arabskiej książce kucharskiej z 1226 roku.', r: 'lb-mujadara' },
  { t: 'Pierogi ruskie nie mają nic wspólnego z Rosją. Nazwa pochodzi od Rusi Czerwonej, czyli okolic Lwowa.', r: 'pl-ruskie' },
  { t: 'Kotlet schabowy to bliski krewny wiedeńskiego sznycla, tylko z wieprzowiny zamiast cielęciny.', r: 'pl-schabowy' },
  // co znaczy nazwa
  { t: 'Makaron al dente znaczy „na ząb”: ma stawiać lekki opór przy gryzieniu.' },
  { t: 'Paella pochodzi z Walencji, a jej nazwa oznacza po prostu patelnię, na której się ją gotuje.', r: 'es-paella-verduras' },
  { t: 'Hiszpańska tortilla to omlet z ziemniakami, a meksykańska to płaski placek. To samo słowo, zupełnie inne dania.', r: 'es-tortilla' },
  { t: 'Pesto pochodzi od włoskiego pestare, czyli ucierać, bo tradycyjnie robi się je w moździerzu.', r: 'it-pesto' },
  { t: 'Tiramisu znaczy po włosku „podnieś mnie”, czyli mniej więcej „postaw mnie na nogi”.' },
  { t: 'Bibimbap znaczy po koreańsku „mieszany ryż”. Przed jedzeniem wszystko się dokładnie miesza.', r: 'kr-bibimbap' },
  { t: 'Hummus to po arabsku po prostu ciecierzyca.', r: 'lb-hummus' },
  { t: 'Gulyás to po węgiersku pasterz bydła. Prawdziwy gulasz jest na Węgrzech zupą.', r: 'hu-gulyas' },
  { t: 'Tadżin to gliniane naczynie ze stożkową pokrywką i zarazem potrawa w nim duszona.', r: 'ma-tajine' },
  { t: 'Kuskus to nie kasza, tylko drobniutki makaron z grysiku.' },
  { t: 'Lahmacun bywa nazywany turecką pizzą, choć to cienki placek z mięsem, który zwija się z natką i cytryną.', r: 'tr-lahmacun' },
  // kuchnie świata
  { t: 'Pierogi mają krewnych na całym świecie: chińskie jiaozi, gruzińskie chinkali, włoskie ravioli i japońskie gyoza.', r: 'cn-jiaozi' },
  { t: 'Chinkali je się rękami, trzymając za „ogonek” z ciasta. Ogonków zwykle się nie zjada, tylko odkłada na talerz.', r: 'ge-chinkali' },
  { t: 'Wasabi z tubki to zwykle chrzan z musztardą i zielonym barwnikiem. Prawdziwe wasabi jest drogie i trudne w uprawie.' },
  { t: 'Koreańskie wspólne kiszenie kimchi na zimę, kimjang, wpisano na listę niematerialnego dziedzictwa UNESCO.', r: 'kr-kimchi-jjigae' },
  { t: 'Rzemiosło i kulturę francuskiej bagietki UNESCO wpisało na listę dziedzictwa w 2022 roku.' },
  { t: 'Sztukę neapolitańskich pizzaiolo wpisano na listę niematerialnego dziedzictwa UNESCO w 2017 roku.' },
  { t: 'Kulturę gotowania ukraińskiego barszczu wpisano w 2022 roku na listę dziedzictwa UNESCO.', r: 'ua-barszcz' },
  { t: 'Parzenie kawy po turecku w małym tygielku, razem z fusami, jest na liście niematerialnego dziedzictwa UNESCO.' },
  { t: 'Klasyczna rzymska carbonara nie ma śmietany. Kremowa robi się dzięki jajkom, serowi i wodzie z gotowania makaronu.', r: 'it-carbonara' },
  { t: 'Gazpacho to andaluzyjska zupa, którą je się na zimno. Idealna na upały.', r: 'es-gazpacho' },
  { t: 'W Hiszpanii churros macza się w gęstej gorącej czekoladzie, często na śniadanie.', r: 'es-churros' },
  { t: 'Kukurydzę w Meksyku od tysięcy lat gotuje się z wapnem. Dzięki temu ciasto na tortille się klei, a ciało przyswaja niacynę.' },
  { t: 'Curry jako jedna przyprawa w proszku to wymysł Brytyjczyków. W Indiach każde danie ma własną mieszankę.', r: 'in-tikka' },
  { t: 'Naan piecze się tradycyjnie na rozgrzanej ściance glinianego pieca tandoor.' },
  { t: 'Kuchnia tajska lubi łączyć w jednym daniu smak słodki, kwaśny, słony i ostry.', r: 'th-som-tam' },
  { t: 'Sos rybny, wietnamski nước mắm i tajski nam pla, powstaje z ryb fermentowanych z solą przez wiele miesięcy.' },
  { t: 'Pieprz syczuański nie pali jak chili, tylko przyjemnie mrowi i lekko znieczula język.', r: 'cn-kungpao' },
  { t: 'Umami, piąty smak, opisał w 1908 roku japoński chemik Kikunae Ikeda, badając bulion z wodorostów kombu.', r: 'jp-miso-shiru' },
  { t: 'W Egipcie falafel robi się zwykle z bobu, a nie z ciecierzycy.', r: 'lb-falafel' },
  { t: 'Tabbouleh to sałatka głównie z natki pietruszki. Bulgur jest w niej tylko dodatkiem.', r: 'lb-tabbouleh' },
  { t: 'W Maroku herbatę miętową nalewa się z wysoka, żeby się spieniła.' },
  { t: 'Harirę w Maroku je się często w ramadanie, na przerwanie postu po zachodzie słońca.', r: 'ma-harira' },
  { t: 'Gyros, döner kebab i szawarma to krewni: mięso pieczone na pionowym rożnie.', r: 'gr-gyros' },
  { t: 'Baklawa to dziesiątki cieniutkich warstw ciasta filo przełożonych orzechami i nasączonych syropem.' },
  { t: 'W Unii Europejskiej fetą można nazwać tylko ser z Grecji z mleka owczego albo z domieszką koziego.' },
  { t: 'Gruzja to jedna z najstarszych krain winiarskich: wino robi się tam od około 8 tysięcy lat w glinianych kwewri.' },
  { t: 'Węgierska słodka papryka w proszku słynie z okolic Segedynu i Kalocsy.', r: 'hu-porkolt' },
  { t: 'Albert Szent-Györgyi wyizolował witaminę C, między innymi z węgierskiej papryki, i dostał za to Nagrodę Nobla.' },
  { t: 'Bośniacki burek to tylko wersja z mięsem. Z serem to sirnica, a z ziemniakami krompiruša.', r: 'ba-burek' },
  { t: 'Ćevapi to bałkańskie kiełbaski z mielonego mięsa bez osłonki, podawane w chlebku lepinja.', r: 'ba-cevapi' },
  { t: 'Żurek zawdzięcza kwaśny smak zakwasowi z mąki żytniej.', r: 'pl-zurek' },
  { t: 'Oscypek to wędzony ser z mleka owczego. Jego nazwa jest chroniona w całej Unii Europejskiej.' },
  // nauka w kuchni
  { t: 'Sucha soczewica ma około 25 g białka na 100 g i należy do najtańszych źródeł białka w sklepie.', r: 'in-dal' },
  { t: 'Miód prawie się nie psuje: ma mało wody i jest kwaśny, więc bakterie nie mają w nim jak się rozwijać.' },
  { t: 'Mit: marchewka poprawia wzrok. Witamina A pomaga tylko przy jej niedoborze, a mit podsycała brytyjska propaganda z czasów II wojny.' },
  { t: 'Banany w sklepach to prawie wyłącznie odmiana Cavendish. Wcześniejszą Gros Michel niemal wytrzebiła choroba grzybowa.' },
  { t: 'Botanicznie banan i bakłażan to jagody, a truskawka już nie.' },
  { t: 'Orzeszki ziemne to nie orzechy, tylko rośliny strączkowe. Dalecy kuzyni Groszosława.' },
  { t: 'Wanilia to owoc storczyka i jedna z najdroższych przypraw świata, zaraz po szafranie.' },
  { t: 'Na kilogram szafranu trzeba ręcznie zebrać znamiona z około 150 tysięcy kwiatów krokusa.' },
  { t: 'Cynamon to zwinięta, wysuszona kora drzewa cynamonowca.' },
  { t: 'Pieprz czarny, biały i zielony to owoce tej samej rośliny, tylko inaczej zbierane i suszone.' },
  { t: 'Ghee to masło klarowane. Bez wody i białek długo się nie psuje i znosi wysoką temperaturę smażenia.' },
  { t: 'Mleko kokosowe to nie woda z orzecha, tylko wyciśnięty miąższ kokosa zmieszany z wodą.', r: 'th-massaman' },
  { t: 'Czarna, zielona i biała herbata to liście tej samej rośliny. Różni je tylko obróbka.' },
  { t: 'Brokuł, kalafior, kapusta, jarmuż i brukselka to odmiany jednego gatunku, kapusty warzywnej.' },
  { t: 'Ostrość chili nie rozpuszcza się w wodzie. Lepiej gasi ją mleko albo jogurt.' },
  { t: 'Najostrzejsza część papryczki chili to biała „żyłka” w środku, a nie same pestki.' },
  { t: 'Surowa czerwona fasola zawiera toksyczną lektynę, dlatego trzeba ją gotować co najmniej 10 minut we wrzątku.' },
  { t: 'Płukanie ryżu zmywa skrobię z powierzchni ziaren, więc po ugotowaniu mniej się sklejają.' },
  { t: 'Woda z gotowania makaronu ma w sobie skrobię, która zagęszcza sos i pomaga mu oblepić makaron.' },
  { t: 'Ugotowane i ostudzone ziemniaki, ryż czy makaron mają więcej skrobi opornej, która działa jak błonnik.' },
  { t: 'Owies zawiera beta-glukany, rodzaj błonnika, który pomaga obniżać cholesterol.' },
  { t: 'Mrożone warzywa mrozi się zwykle kilka godzin po zbiorze, więc bywają tak samo bogate w witaminy jak świeże.' },
  { t: 'Kasza gryczana to nie zboże: gryka jest krewną szczawiu i rabarbaru, a do tego nie ma glutenu.' },
  { t: 'Świeże jajko w szklance wody tonie, a stare się unosi, bo z czasem rośnie w nim komora powietrzna.' },
  { t: 'Chleb w lodówce czerstwieje szybciej niż na blacie. Jeśli ma poleżeć dłużej, lepiej go zamrozić.' },
  { t: 'Pomidory tracą w lodówce smak i aromat. Najlepiej trzymać je w temperaturze pokojowej.' },
  { t: 'Banany wydzielają etylen, który przyspiesza dojrzewanie owoców leżących obok.' },
  { t: 'Dziury w serze ementalskim robi dwutlenek węgla z bakterii, które pracują w serze podczas dojrzewania.' },
  { t: 'Parmigiano Reggiano musi dojrzewać co najmniej 12 miesięcy.' },
  { t: 'Cebula szczypie w oczy przez lotny związek siarki uwalniany przy krojeniu. Schłodzona cebula i ostry nóż pomagają.' },
  { t: 'Ryż jest podstawą diety ponad połowy ludzi na świecie.' },
];

// Zwykłe ciekawostki i ciekawostki o postaciach (z przebraniem) losowane są z osobnych pul.
export const GENERAL = FACTS.map((f, i) => (f.k ? -1 : i)).filter((i) => i >= 0);
export const CHARS = FACTS.map((f, i) => (f.k ? i : -1)).filter((i) => i >= 0);

// Mniej więcej co ósme otwarcie z ciekawostką Groszosław przebiera się za postać (nigdy dwa razy z rzędu).
export const CHAR_CHANCE = 0.12;

// Następny element puli bez powtórek: kolejność losowana raz i zapisywana w stanie (st[name]),
// więc nic się nie powtarza, dopóki nie pokaże się cała pula; potem nowe losowanie.
function draw(st, name, pool, rnd) {
  let f = st[name];
  const ok = f && Array.isArray(f.order) && f.order.length === pool.length && f.pos < f.order.length &&
    f.order.every((i) => pool.includes(i));
  if (!ok) {
    const order = pool.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    f = { order, pos: 0 };
  }
  st[name] = { order: f.order, pos: f.pos + 1 };
  return f.order[f.pos];
}

export function nextFactIndex(st, rnd = Math.random) {
  return draw(st, 'facts', GENERAL, rnd);
}

export function nextCharacterIndex(st, rnd = Math.random) {
  return draw(st, 'chars', CHARS, rnd);
}

// Ciekawostka na otwarcie apki: zwykle zwykła, czasem postać z przebraniem.
export function pickOpening(st, rnd = Math.random) {
  const char = !st.factChar && CHARS.length > 0 && rnd() < CHAR_CHANCE;
  st.factChar = char;
  return char ? nextCharacterIndex(st, rnd) : nextFactIndex(st, rnd);
}
