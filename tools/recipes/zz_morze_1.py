"""Ryby i owoce morza: Europa, Bliski Wschód i Maroko.

Dania z owocami morza nie mają w składzie ryb (ani sosu rybnego), żeby filtr
„Nie jem: Ryby” ich nie chował.
"""
from rlib import kraj, P, O, G, OBIAD, OK, SN, SNK, KOL

PO = ["palnik", "piekarnik"]

PL = kraj("Polska")
IT = kraj("Włochy")
ES = kraj("Hiszpania")
FR = kraj("Francja")
GR = kraj("Grecja")
DE = kraj("Niemcy")
HU = kraj("Węgry")
UA = kraj("Ukraina")
TR = kraj("Turcja")
LB = kraj("Liban")
MA = kraj("Maroko")

RECIPES = [
    # ---------------- Polska ----------------
    PL("pl-ryba-po-grecku", "Ryba po grecku", ("tray", "fish"), 4, 60, P, OK, [
        ("dorsz", 600), ("maka", 30), ("olej", 60), ("marchew", 400), ("pietruszka", 150), ("seler", 150), ("cebula", 220),
        ("koncentrat", 60), ("ziele_angielskie", 1), ("lisc_laurowy", 1), ("papryka_slodka", 2), ("cukier", 5), ("sol", 6),
        ("pieprz", 1), ("chleb", 210, "6 kromek")],
        ["Rybę pokrój w kawałki, posól, obtocz w mące i usmaż na połowie oleju po 3 minuty z każdej strony.",
         "Marchew, pietruszkę i seler zetrzyj na tarce o grubych oczkach, cebulę pokrój w kostkę.",
         "Na reszcie oleju zeszklij cebulę, dodaj starte warzywa, ziele, liść i 100 ml wody. Duś 15 minut pod przykryciem.",
         "Wmieszaj koncentrat, paprykę, cukier, sól i pieprz. Duś jeszcze 5 minut, aż sos zgęstnieje.",
         "W naczyniu układaj na zmianę warzywa i rybę, na wierzchu warzywa. Ostudź i wstaw do lodówki co najmniej na kilka godzin.",
         "Podawaj na zimno z chlebem."],
        "Następnego dnia jest najlepsza, bo ryba nasiąka sosem."),
    PL("pl-sledz-kaszubski", "Śledzie po kaszubsku w sosie pomidorowym z ziemniakami", ("deepplate", "fish"), 4, 40, P, OK, [
        ("sledz", 400), ("cebula", 330), ("koncentrat", 100), ("olej", 50), ("ocet", 15), ("cukier", 10), ("ziele_angielskie", 1),
        ("lisc_laurowy", 1), ("pieprz", 1), ("ziemniaki", 1000), ("koperek", 15), ("sol", 3)],
        ["Jeśli filety są bardzo słone, namocz je 30 minut w zimnej wodzie. Osusz i pokrój w kawałki 3 cm.",
         "Cebulę pokrój w piórka i duś na oleju z zielem i liściem 10 minut, aż zmięknie.",
         "Dodaj koncentrat, ocet, cukier, pieprz i 100 ml wody. Gotuj 5 minut i ostudź.",
         "Śledzie przełóż sosem w słoiku albo misce i wstaw do lodówki na co najmniej 3 godziny.",
         "Ziemniaki ugotuj w osolonej wodzie i posyp koperkiem. Śledzie podawaj obok."],
        "W lodówce w słoiku wytrzymają kilka dni, więc warto zrobić od razu więcej."),
    PL("pl-dorsz-smazony", "Smażony dorsz z ziemniakami i surówką z kiszonej kapusty", ("cutlet", "fish"), 4, 45, P, OBIAD, [
        ("dorsz", 600), ("maka", 20), ("jajka", 50, "1 szt."), ("bulka_tarta", 60), ("olej", 70), ("ziemniaki", 1000),
        ("kapusta_kiszona", 500), ("marchew", 120), ("jablko", 150), ("cukier", 5), ("koperek", 10), ("cytryna", 60),
        ("sol", 6), ("pieprz", 1)],
        ["Ziemniaki obierz i ugotuj w osolonej wodzie.",
         "Kapustę odciśnij i posiekaj. Wymieszaj z startą marchwią, startym jabłkiem, cukrem, 2 łyżkami oleju i pieprzem.",
         "Rybę pokrój na porcje, posól i skrop sokiem z cytryny. Obtocz w mące, roztrzepanym jajku i bułce tartej.",
         "Smaż na rozgrzanym oleju po 3–4 minuty z każdej strony, aż panierka będzie złota.",
         "Podawaj z ziemniakami posypanymi koperkiem, surówką i ćwiartką cytryny."]),
    PL("pl-kotlety-rybne", "Kotlety rybne z mizerią", ("patties", "fish"), 4, 45, P, OBIAD, [
        ("dorsz", 600), ("bulki", 60, "1 szt."), ("mleko", 100), ("cebula", 110), ("jajka", 50, "1 szt."), ("koperek", 20),
        ("bulka_tarta", 50), ("olej", 50), ("ziemniaki", 800), ("ogorek", 400), ("smietana", 150), ("sol", 7), ("pieprz", 1)],
        ["Bułkę namocz w mleku. Ziemniaki ugotuj w osolonej wodzie.",
         "Rybę zmiel albo posiekaj nożem na drobno. Dodaj odciśniętą bułkę, startą cebulę, jajko, połowę koperku, sól i pieprz.",
         "Wilgotnymi dłońmi uformuj 8 kotletów, obtocz w bułce tartej.",
         "Smaż na oleju po 4 minuty z każdej strony na średnim ogniu.",
         "Ogórki pokrój w cienkie plasterki, posól, odlej sok i wymieszaj ze śmietaną i resztą koperku. Podawaj z kotletami i ziemniakami."]),
    PL("pl-paprykarz", "Domowy paprykarz z ryby i ryżu", ("jar", "fish"), 4, 40, P, SNK, [
        ("dorsz", 400), ("ryz", 150), ("cebula", 220), ("koncentrat", 100), ("olej", 50), ("papryka_slodka", 6), ("chili", 1),
        ("cukier", 5), ("sol", 6), ("pieprz", 1), ("chleb", 280, "8 kromek")],
        ["Ryż ugotuj w osolonej wodzie trochę dłużej niż zwykle, żeby był miękki.",
         "Rybę ugotuj w małej ilości osolonej wody przez 8 minut. Odcedź i rozdrobnij widelcem.",
         "Cebulę posiekaj bardzo drobno i duś na oleju 10 minut, aż zmięknie. Dodaj koncentrat, paprykę i chili, smaż 2 minuty.",
         "Wymieszaj rybę, ryż i sos, dopraw cukrem, solą i pieprzem. Gnieć widelcem, aż powstanie gęsta pasta.",
         "Przełóż do słoików i ostudź. Jedz na chlebie."],
        "Ze sklepowym ma wspólny tylko pomysł. Domowy jest mniej słony i ma prawdziwy kawałek ryby."),
    PL("pl-pasta-makrela", "Pasta z wędzonej makreli z jajkiem i ogórkiem kiszonym", ("toast", "fish"), 4, 20, P, SNK, [
        ("makrela", 300, "1 duża"), ("jajka", 150, "3 szt."), ("ogorki_kiszone", 150), ("dymka", 30), ("majonez", 30),
        ("musztarda", 10), ("pieprz", 1), ("chleb", 280, "8 kromek")],
        ["Jajka ugotuj na twardo (10 minut), ostudź i obierz.",
         "Z makreli zdejmij skórę i wyjmij ości. Mięso rozdrobnij widelcem.",
         "Jajka i ogórki pokrój w drobną kostkę, dymkę posiekaj.",
         "Wymieszaj wszystko z majonezem, musztardą i pieprzem. Soli nie trzeba, bo makrela jest słona.",
         "Podawaj na chlebie."]),
    PL("pl-salatka-krabowa", "Sałatka z paluszkami krabowymi, ryżem i kukurydzą", ("salad", "fish"), 3, 30, P, KOL, [
        ("paluszki_krabowe", 250), ("ryz", 100), ("kukurydza", 285, "1 puszka"), ("jajka", 200, "4 szt."), ("por", 100),
        ("majonez", 80), ("koperek", 10), ("sol", 2), ("pieprz", 1)],
        ["Ryż ugotuj na sypko i ostudź. Jajka ugotuj na twardo.",
         "Paluszki, jajka i białą część pora pokrój w drobną kostkę. Kukurydzę odcedź.",
         "Wymieszaj wszystko z majonezem i koperkiem, dopraw solą i pieprzem.",
         "Odstaw do lodówki na pół godziny, żeby smaki się połączyły."],
        "Paluszki krabowe to surimi z ryby, nie z kraba, dlatego ta sałatka jest w rybach."),

    # ---------------- Włochy ----------------
    IT("it-scoglio", "Spaghetti allo scoglio z owocami morza", ("spaghetti", "squid"), 4, 25, P, OK, [
        ("makaron", 400), ("owoce_morza", 450), ("pomidory_puszka", 400), ("czosnek", 10), ("chili", 1), ("oliwa", 40),
        ("natka", 20), ("sol", 6)],
        ["Owoce morza rozmroź w durszlaku i dokładnie osusz ręcznikiem papierowym.",
         "Makaron wrzuć do osolonej wody. Odlej szklankę wody z gotowania przed odcedzeniem.",
         "Na oliwie podsmaż plasterki czosnku z chili przez minutę. Wrzuć owoce morza i smaż 2 minuty na dużym ogniu.",
         "Dodaj pomidory i gotuj 8 minut.",
         "Przełóż makaron do sosu, wymieszaj na ogniu, dolewając trochę wody z gotowania. Posyp natką."],
        "Owoce morza smaż krótko, bo po kilku minutach robią się gumowe."),
    IT("it-linguine-gamberi", "Linguine z krewetkami, cukinią i cytryną", ("spaghetti", "shrimp"), 3, 25, P, OK, [
        ("makaron", 300), ("krewetki", 300), ("cukinia", 300), ("czosnek", 10), ("cytryna", 60, "skórka i sok z 1/2"),
        ("chili", 1), ("oliwa", 40), ("natka", 15), ("sol", 5)],
        ["Makaron ugotuj w osolonej wodzie, odlewając przed odcedzeniem pół szklanki wody.",
         "Cukinię pokrój w cienkie półplasterki i smaż na połowie oliwy 5 minut, aż się zarumieni.",
         "Dodaj resztę oliwy, czosnek i chili, a po chwili krewetki. Smaż 2–3 minuty, aż zróżowieją.",
         "Wrzuć makaron, skórkę i sok z cytryny, chlust wody z makaronu. Wymieszaj i posyp natką."]),
    IT("it-cozze-tarantina", "Cozze alla tarantina, małże w pomidorach z grzankami", ("deepplate", "shell"), 3, 25, P, OK, [
        ("malze", 450), ("pomidory_puszka", 400), ("czosnek", 15), ("chili", 1), ("oliwa", 40), ("natka", 20),
        ("bagietka", 250, "1 szt."), ("sol", 2)],
        ["Bagietkę pokrój w kromki i przypiecz na suchej patelni albo w tosterze. Natrzyj połową czosnku.",
         "Na oliwie podsmaż resztę czosnku z chili, dodaj pomidory i gotuj 10 minut.",
         "Wrzuć rozmrożone małże i gotuj 4 minuty pod przykryciem.",
         "Posyp natką i podawaj w głębokich talerzach z grzankami do maczania w sosie."],
        "Jeśli masz małże w muszlach, gotuj je pod przykryciem, aż się otworzą, a zamknięte wyrzuć."),
    IT("it-calamari-ripieni", "Calamari ripieni, kalmary faszerowane w sosie pomidorowym", ("skillet", "squid"), 3, 55, P, OK, [
        ("kalmary", 600, "tuby i macki"), ("bulka_tarta", 60), ("parmezan", 30), ("jajka", 50, "1 szt."), ("czosnek", 10),
        ("natka", 20), ("passata", 500), ("oliwa", 30), ("sol", 4), ("pieprz", 1), ("chleb", 210, "6 kromek")],
        ["Kalmary rozmroź i opłucz. Macki i jedną tubę posiekaj drobno.",
         "Posiekane kalmary wymieszaj z bułką tartą, parmezanem, jajkiem, połową czosnku, natką i pieprzem.",
         "Napełnij tuby farszem do dwóch trzecich, bo farsz pęcznieje. Zepnij końce wykałaczką.",
         "Obsmaż tuby na oliwie z resztą czosnku, wlej passatę i odrobinę wody, posól.",
         "Duś pod przykryciem na małym ogniu 30 minut. Podawaj w sosie z chlebem."]),
    IT("it-insalata-mare", "Insalata di mare, sałatka z owoców morza z ziemniakami", ("salad", "shrimp"), 3, 35, P, OK, [
        ("owoce_morza", 450), ("ziemniaki", 600), ("seler", 80), ("oliwki", 60), ("cytryna", 120, "1 duża"), ("czosnek", 5),
        ("oliwa", 40), ("natka", 20), ("bagietka", 150), ("sol", 4), ("pieprz", 1)],
        ["Ziemniaki ugotuj w mundurkach, obierz i pokrój w kostkę.",
         "Owoce morza wrzuć na 2 minuty do osolonej wrzącej wody z plasterkiem cytryny i odcedź.",
         "Seler pokrój w drobniutkie słupki, oliwki na połówki.",
         "Wymieszaj oliwę, sok z cytryny, przeciśnięty czosnek, sól i pieprz.",
         "Połącz wszystko z natką, odstaw na 20 minut i podawaj z bagietką."],
        "Najlepsza jest lekko chłodna, ale nie prosto z lodówki."),
    IT("it-cacciucco", "Cacciucco, toskańska zupa z ryb i owoców morza", ("tureen", "fish"), 4, 45, P, OK, [
        ("dorsz", 400), ("owoce_morza", 450), ("pomidory_puszka", 400), ("koncentrat", 30), ("cebula", 110), ("seler", 80),
        ("czosnek", 15), ("chili", 1), ("oliwa", 40), ("natka", 20), ("chleb", 280, "8 kromek"), ("sol", 6)],
        ["Na oliwie zeszklij drobno posiekaną cebulę, seler i połowę czosnku z chili.",
         "Dodaj koncentrat, pomidory i 600 ml wody. Gotuj 15 minut.",
         "Włóż rybę w dużych kawałkach i gotuj 5 minut, potem owoce morza na kolejne 3 minuty. Posól.",
         "Chleb opiecz i natrzyj resztą czosnku.",
         "Na dnie talerzy połóż grzanki, zalej zupą i posyp natką."],
        "Tradycyjnie robi się ją z kilku gatunków ryb. Każda biała ryba się nada."),
    IT("it-pasta-tonno", "Pasta al tonno, makaron z tuńczykiem i oliwkami", ("spaghetti", "fish"), 4, 20, P, OK, [
        ("makaron", 400), ("tunczyk", 240, "2 puszki"), ("passata", 500), ("czosnek", 10), ("oliwki", 60), ("oregano", 1),
        ("oliwa", 30), ("natka", 10), ("sol", 5)],
        ["Makaron ugotuj w osolonej wodzie.",
         "Na oliwie podsmaż czosnek, dodaj passatę i oregano. Gotuj 8 minut.",
         "Wmieszaj odsączonego tuńczyka i pokrojone oliwki, grzej 2 minuty.",
         "Wymieszaj z makaronem i posyp natką."]),
    IT("it-cartoccio", "Pesce al cartoccio, ryba pieczona w pergaminie z pomidorami", ("casserole", "fish"), 3, 45, O, OK, [
        ("dorsz", 600), ("pomidory", 300), ("oliwki", 60), ("cytryna", 60), ("czosnek", 10), ("oregano", 1), ("oliwa", 40),
        ("ziemniaki", 800), ("sol", 6), ("pieprz", 1)],
        ["Ziemniaki pokrój w ćwiartki, wymieszaj z połową oliwy i solą. Piecz w 200°C przez 20 minut.",
         "Na każdy kawałek papieru do pieczenia połóż porcję ryby, posól i popieprz.",
         "Obłóż pokrojonymi pomidorami, oliwkami, plasterkami cytryny i czosnku. Posyp oregano i skrop oliwą.",
         "Zawiń papier szczelnie jak cukierek i połóż na blasze obok ziemniaków.",
         "Piecz jeszcze 15–18 minut. Pakiety otwieraj dopiero na talerzu."]),

    # ---------------- Hiszpania ----------------
    ES("es-gambas-ajillo", "Gambas al ajillo, krewetki w oliwie czosnkowej z bagietką", ("claypot", "shrimp"), 3, 15, P, OK, [
        ("krewetki", 400), ("czosnek", 30), ("papryczka_chili", 10), ("oliwa", 80), ("natka", 15), ("sol", 3),
        ("bagietka", 250, "1 szt.")],
        ["Krewetki rozmroź, osusz i posól.",
         "Czosnek pokrój w plasterki, chili w krążki.",
         "W małym rondlu albo na patelni podgrzej oliwę z czosnkiem i chili na średnim ogniu, aż czosnek zacznie się złocić.",
         "Wrzuć krewetki i smaż 2–3 minuty, mieszając, aż zróżowieją. Posyp natką.",
         "Podawaj od razu w tym samym naczyniu, z bagietką do maczania w oliwie."]),
    ES("es-fideua", "Fideuà, krótki makaron z owocami morza z patelni", ("pan", "shrimp"), 4, 40, P, OBIAD, [
        ("makaron", 350, "cienki, połamany"), ("owoce_morza", 300), ("krewetki", 200), ("pomidory", 200), ("papryka", 150),
        ("cebula", 110), ("czosnek", 15), ("papryka_slodka", 3), ("kurkuma", 1), ("bulion", 10, "1 kostka"), ("oliwa", 50),
        ("majonez", 60), ("cytryna", 60), ("sol", 3)],
        ["Makaron połam na kawałki 2–3 cm i podsmaż na połowie oliwy na złoto. Odłóż.",
         "Na reszcie oliwy obsmaż krewetki minutę i odłóż. Wrzuć cebulę i paprykę, smaż 5 minut.",
         "Dodaj starte pomidory, połowę czosnku, paprykę słodką i kurkumę. Smaż 3 minuty.",
         "Wsyp makaron i owoce morza, zalej 800 ml gorącej wody z kostką. Gotuj bez mieszania 10 minut, aż wchłonie płyn.",
         "Ułóż krewetki na wierzchu, przykryj na 3 minuty.",
         "Majonez wymieszaj z resztą przeciśniętego czosnku i podawaj obok z cytryną."],
        "Kuzynka paelli z wybrzeża Walencji, tylko zamiast ryżu jest makaron."),
    ES("es-bocadillo-calamares", "Bocadillo de calamares, bagietka z kalmarami", ("sandwich", "squid"), 3, 30, P, OK, [
        ("kalmary", 400, "krążki"), ("maka", 80), ("olej", 60, "do smażenia"), ("cytryna", 60), ("majonez", 60), ("czosnek", 5),
        ("bagietka", 300), ("sol", 4)],
        ["Krążki kalmarów rozmroź, osusz i posól.",
         "Obtocz je w mące i otrzep nadmiar.",
         "Smaż partiami na mocno rozgrzanym oleju przez 2 minuty, aż będą złote. Odsącz na ręczniku papierowym.",
         "Majonez wymieszaj z przeciśniętym czosnkiem i odrobiną soku z cytryny.",
         "Bagietkę przekrój, posmaruj majonezem i napełnij kalmarami. Skrop cytryną."],
        "Najsłynniejsza kanapka Madrytu, sprzedawana w barach wokół Plaza Mayor."),
    ES("es-calamares-encebollados", "Calamares encebollados, kalmary duszone z cebulą", ("deepplate", "squid"), 3, 50, P, OK, [
        ("kalmary", 600), ("cebula", 660), ("czosnek", 10), ("oliwa", 40), ("lisc_laurowy", 1), ("papryka_slodka", 2),
        ("ryz", 250), ("natka", 10), ("sol", 5), ("pieprz", 1)],
        ["Kalmary pokrój w paski.",
         "Cebulę pokrój w piórka i duś na oliwie z liściem laurowym 20 minut na małym ogniu, aż będzie miękka i złota.",
         "Ryż ugotuj na sypko.",
         "Dodaj do cebuli czosnek i paprykę, a po chwili kalmary. Smaż 2 minuty, wlej pół szklanki wody.",
         "Duś pod przykryciem 15–20 minut, aż kalmary zmiękną. Dopraw i posyp natką. Podawaj z ryżem."],
        "Kalmary są miękkie albo po 2 minutach, albo po kwadransie duszenia. Wszystko pomiędzy jest gumowe."),
    ES("es-marmitako", "Marmitako, baskijski gulasz z tuńczyka i ziemniaków", ("pot", "fish"), 4, 45, P, OBIAD, [
        ("tunczyk", 360, "3 puszki"), ("ziemniaki", 1000), ("papryka", 300), ("cebula", 220), ("pomidory_puszka", 200),
        ("czosnek", 10), ("papryka_slodka", 4), ("bulion", 10, "1 kostka"), ("oliwa", 40), ("natka", 10),
        ("chleb", 140, "4 kromki"), ("sol", 3)],
        ["Na oliwie podsmaż cebulę, paprykę i czosnek przez 8 minut.",
         "Dodaj paprykę słodką i pomidory, smaż 3 minuty.",
         "Ziemniaki obierz i łam nożem na nierówne kawałki, żeby puściły skrobię. Wrzuć do garnka.",
         "Zalej litrem wody z kostką i gotuj 25 minut, aż ziemniaki zmiękną, a sos zgęstnieje.",
         "Na koniec dodaj odsączonego tuńczyka, podgrzej 2 minuty i posyp natką. Podawaj z chlebem."],
        "Baskijscy rybacy gotowali to na kutrach ze świeżego tuńczyka. Z puszki dodaje się go na samym końcu."),
    ES("es-bacalao-vizcaina", "Bacalao a la vizcaína, dorsz w sosie z czerwonej papryki", ("skillet", "fish"), 3, 50, P, OBIAD, [
        ("dorsz", 600), ("papryka", 600, "czerwona"), ("cebula", 330), ("czosnek", 10), ("pomidory_puszka", 200),
        ("papryka_slodka", 4), ("oliwa", 50), ("ziemniaki", 800), ("sol", 6)],
        ["Ziemniaki ugotuj w osolonej wodzie.",
         "Paprykę i cebulę pokrój w kostkę i duś na oliwie z czosnkiem 20 minut, aż będą bardzo miękkie.",
         "Dodaj paprykę słodką i pomidory, gotuj 10 minut, potem zmiksuj na gładki sos.",
         "Rybę pokrój na porcje, posól i włóż do sosu. Gotuj pod przykryciem 8 minut.",
         "Podawaj z ziemniakami."]),

    # ---------------- Francja ----------------
    FR("fr-moules-frites", "Moules-frites, małże w śmietanie z frytkami", ("fries", "shell"), 3, 45, PO, OBIAD, [
        ("malze", 600), ("cebula", 110), ("czosnek", 10), ("smietanka", 150), ("maslo", 20), ("natka", 20),
        ("ziemniaki", 1000), ("olej", 40), ("sol", 5), ("pieprz", 1)],
        ["Ziemniaki pokrój w słupki, osusz i wymieszaj z olejem i solą. Piecz w 220°C przez 30–35 minut, raz przewracając.",
         "Na maśle zeszklij drobno posiekaną cebulę i czosnek.",
         "Wrzuć małże, przykryj i gotuj 4 minuty, potrząsając garnkiem.",
         "Wlej śmietankę, zagotuj, popieprz i posyp natką.",
         "Podawaj w miskach, frytki osobno do maczania w sosie."],
        "W Belgii to danie narodowe. Do sosu zwykle dolewa się białe wino, tu zastępuje je śmietanka."),
    FR("fr-coquilles", "Coquilles, zapiekane owoce morza w beszamelu z puree", ("casserole", "shell"), 4, 50, PO, OBIAD, [
        ("owoce_morza", 450), ("pieczarki", 200), ("maslo", 50), ("maka", 30), ("mleko", 500), ("ser_zolty", 60),
        ("ziemniaki", 800), ("natka", 10), ("sol", 6), ("pieprz", 1)],
        ["Ziemniaki ugotuj i utłucz na puree z 100 ml mleka i łyżką masła, posól.",
         "Na reszcie masła podsmaż pokrojone pieczarki 5 minut. Wsyp mąkę, smaż minutę i wlej resztę mleka, mieszając do zgęstnienia.",
         "Wmieszaj rozmrożone, osuszone owoce morza i natkę, dopraw solą i pieprzem.",
         "Rozłóż do kokilek albo małego naczynia, obłóż brzegi puree i posyp startym serem.",
         "Zapiekaj w 220°C przez 12–15 minut, aż wierzch się zrumieni."]),
    FR("fr-bisque", "Bisque, kremowa zupa z krewetek z grzankami", ("soup", "shrimp"), 3, 40, P, OK, [
        ("krewetki", 400), ("cebula", 110), ("marchew", 120), ("seler", 80), ("czosnek", 10), ("koncentrat", 40), ("maslo", 30),
        ("ryz", 50), ("smietanka", 100), ("papryka_slodka", 2), ("bagietka", 200), ("sol", 5), ("pieprz", 1)],
        ["Odłóż 9 krewetek na wierzch. Pozostałe podsmaż na maśle 2 minuty.",
         "Dodaj pokrojoną cebulę, marchew, seler i czosnek, smaż 5 minut. Wmieszaj koncentrat i paprykę.",
         "Wsyp ryż i zalej 800 ml wody. Gotuj 20 minut, aż ryż i warzywa zmiękną.",
         "Zmiksuj na gładko, wlej śmietankę i dopraw. Odłożone krewetki ugotuj w zupie przez 2 minuty.",
         "Podawaj z kromkami opieczonej bagietki."],
        "Ryż zagęszczał bisque, zanim kucharze zaczęli używać śmietany i mąki."),
    FR("fr-nicoise", "Sałatka nicejska z tuńczykiem, jajkiem i fasolką", ("bowl", "fish"), 3, 30, P, OK, [
        ("tunczyk", 240, "2 puszki"), ("jajka", 200, "4 szt."), ("ziemniaki", 500), ("fasolka", 300), ("pomidory", 300),
        ("oliwki", 60), ("salata", 150), ("oliwa", 40), ("ocet", 10), ("musztarda", 5), ("sol", 3), ("pieprz", 1)],
        ["Ziemniaki ugotuj w mundurkach, ostudź i pokrój w plastry. Jajka ugotuj na twardo przez 9 minut.",
         "Fasolkę gotuj 5 minut w osolonej wodzie i przelej zimną wodą.",
         "Wymieszaj oliwę, ocet, musztardę, sól i pieprz.",
         "Na sałacie ułóż ziemniaki, fasolkę, ćwiartki pomidorów i jajek, oliwki i tuńczyka.",
         "Polej sosem tuż przed jedzeniem."],
        "W Nicei kłócą się, czy ziemniaki i fasolka tu pasują. Z nimi sałatka jest pełnym obiadem."),
    FR("fr-brandade", "Brandade, zapiekanka z dorsza i ziemniaków z czosnkiem", ("pie", "fish"), 3, 50, PO, OBIAD, [
        ("dorsz", 500), ("ziemniaki", 700), ("mleko", 300), ("czosnek", 15), ("lisc_laurowy", 1), ("tymianek", 1),
        ("oliwa", 50), ("bulka_tarta", 20), ("salata", 150), ("sol", 6), ("pieprz", 1)],
        ["Ziemniaki ugotuj w osolonej wodzie i utłucz.",
         "Rybę gotuj w mleku z czosnkiem, liściem i tymiankiem przez 8 minut. Wyjmij liść.",
         "Rybę rozdrobnij widelcem i wymieszaj z ziemniakami, czosnkiem, oliwą i tyle mleka z gotowania, żeby masa była kremowa.",
         "Dopraw solą i pieprzem, przełóż do naczynia i posyp bułką tartą.",
         "Zapiekaj w 220°C przez 15 minut. Podawaj z sałatą."],
        "W Prowansji robi się ją z solonego dorsza. Świeży jest delikatniejszy i nie trzeba go moczyć przez dobę."),

    # ---------------- Grecja ----------------
    GR("gr-garides-saganaki", "Garides saganaki, krewetki w pomidorach z fetą", ("skillet", "shrimp"), 3, 25, P, OK, [
        ("krewetki", 400), ("pomidory_puszka", 400), ("feta", 150), ("cebula", 110), ("czosnek", 10), ("chili", 1),
        ("oregano", 1), ("oliwa", 40), ("natka", 15), ("chleb", 210, "6 kromek")],
        ["Na oliwie zeszklij cebulę z czosnkiem i chili.",
         "Dodaj pomidory i oregano, gotuj 10 minut, aż sos zgęstnieje.",
         "Włóż krewetki i pokrusz na wierzch fetę.",
         "Przykryj i gotuj 4 minuty, aż krewetki zróżowieją, a feta zmięknie.",
         "Posyp natką i podawaj prosto z patelni z chlebem."]),
    GR("gr-midopilafo", "Midopilafo, ryż z małżami i koperkiem", ("ricebowl", "shell"), 3, 35, P, OBIAD, [
        ("malze", 450), ("ryz", 300), ("cebula", 220), ("czosnek", 10), ("koncentrat", 30), ("oliwa", 50), ("koperek", 15),
        ("cytryna", 60), ("sol", 4), ("pieprz", 1)],
        ["Na oliwie zeszklij posiekaną cebulę i czosnek.",
         "Dodaj koncentrat i ryż, smaż 2 minuty, mieszając.",
         "Zalej 650 ml gorącej wody, posól i gotuj pod przykryciem 12 minut.",
         "Wmieszaj rozmrożone małże i gotuj jeszcze 5 minut, aż ryż wchłonie wodę.",
         "Wyłącz ogień, wmieszaj koperek i pieprz. Podawaj z cytryną."]),
    GR("gr-psari-plaki", "Psari plaki, ryba pieczona z pomidorami i cebulą", ("tray", "lemon"), 3, 60, O, OBIAD, [
        ("dorsz", 600), ("pomidory", 400), ("cebula", 330), ("czosnek", 15), ("natka", 20), ("oregano", 1), ("oliwa", 60),
        ("cytryna", 60), ("ziemniaki", 800), ("sol", 7), ("pieprz", 1)],
        ["Ziemniaki pokrój w plastry, cebulę w piórka. Wymieszaj z połową oliwy i solą, rozłóż w naczyniu.",
         "Piecz w 200°C przez 25 minut.",
         "Pomidory pokrój w kostkę i wymieszaj z czosnkiem, natką, oregano, resztą oliwy i solą.",
         "Na ziemniakach połóż rybę, skrop cytryną i przykryj pomidorami.",
         "Piecz jeszcze 20 minut."]),

    # ---------------- Niemcy ----------------
    DE("de-backfisch", "Backfischbrötchen, bułka z rybą w cieście i sosem remoulade", ("bun", "fish"), 4, 35, P, OK, [
        ("dorsz", 400), ("maka", 100), ("proszek", 5), ("olej", 80, "do smażenia"), ("bulki", 300, "4 szt."), ("majonez", 60),
        ("ogorki_kiszone", 80), ("cebula", 50), ("salata", 50), ("musztarda", 5), ("sol", 5)],
        ["Mąkę, proszek i szczyptę soli wymieszaj ze 150 ml zimnej wody gazowanej na gęste ciasto.",
         "Rybę pokrój na 4 kawałki, posól i zanurz w cieście.",
         "Smaż w rozgrzanym oleju 3–4 minuty z każdej strony, aż ciasto będzie złote i chrupiące.",
         "Ogórki i cebulę posiekaj drobno, wymieszaj z majonezem i musztardą.",
         "Bułki przekrój, posmaruj sosem, włóż sałatę i rybę."],
        "Sprzedają ją w każdym porcie od Hamburga po Rugię."),
    DE("de-matjes", "Matjes po gospodarsku, śledź w śmietanie z jabłkiem i ziemniakami", ("deepplate", "apple"), 4, 35, P, OK, [
        ("sledz", 400), ("smietana", 300), ("jablko", 200), ("cebula", 110), ("ogorki_kiszone", 100), ("koperek", 10),
        ("ziemniaki", 1000), ("pieprz", 1), ("sol", 3)],
        ["Ziemniaki ugotuj w osolonej wodzie.",
         "Jabłko i ogórki pokrój w drobną kostkę, cebulę w cienkie piórka.",
         "Wymieszaj je ze śmietaną i pieprzem.",
         "Śledzie pokrój w kawałki i delikatnie wmieszaj do sosu. Odstaw na 30 minut do lodówki.",
         "Podawaj z gorącymi ziemniakami posypanymi koperkiem."]),

    # ---------------- Węgry ----------------
    HU("hu-halaszle", "Halászlé, ostra zupa rybna z papryką i makaronem", ("cauldron", "fish"), 3, 50, P, OBIAD, [
        ("dorsz", 600), ("cebula", 330), ("papryka", 150), ("pomidory", 150), ("papryka_slodka", 15), ("chili", 2),
        ("makaron", 200), ("sol", 7), ("chleb", 140, "4 kromki")],
        ["Cebulę pokrój w kostkę, zalej 1,2 l wody i gotuj 20 minut. Zmiksuj na gładki wywar.",
         "Zdejmij garnek z ognia, wsyp paprykę i chili, wymieszaj, żeby się nie przypaliła.",
         "Dodaj pokrojoną paprykę i pomidory, gotuj 10 minut.",
         "Włóż rybę w dużych kawałkach i gotuj na małym ogniu 8 minut, nie mieszając, tylko kołysząc garnkiem.",
         "Makaron ugotuj osobno. Podawaj zupę z makaronem i chlebem."],
        "Nad Dunajem gotuje się ją z karpia. Papryki jest dużo, bo zupa ma być czerwona."),

    # ---------------- Ukraina ----------------
    UA("ua-shuba", "Śledź pod pierzynką, warstwowa sałatka z burakami", ("cake", "fish"), 4, 70, P, KOL, [
        ("sledz", 300), ("ziemniaki", 500), ("marchew", 250), ("buraki", 500), ("jajka", 150, "3 szt."), ("cebula", 110),
        ("majonez", 150), ("sol", 2)],
        ["Ziemniaki, marchew i buraki ugotuj w skórce, ostudź i obierz. Jajka ugotuj na twardo.",
         "Śledzie i cebulę pokrój w drobną kostkę.",
         "Na płaskim talerzu ułóż warstwy: śledź z cebulą, starte ziemniaki, starta marchew, starte jajka i starte buraki.",
         "Każdą warstwę lekko posól i posmaruj cienko majonezem.",
         "Wstaw do lodówki na kilka godzin, żeby warstwy się przegryzły."],
        "Po rosyjsku i ukraińsku nazywa się szuba, czyli futro, bo buraki przykrywają śledzia jak płaszcz."),

    # ---------------- Turcja ----------------
    TR("tr-balik-ekmek", "Balık ekmek, chleb z rybą, cebulą i sałatą", ("sandwich", "fish"), 3, 25, G, OK, [
        ("dorsz", 500), ("bagietka", 300), ("cebula", 110), ("salata", 100), ("pomidory", 200), ("cytryna", 60),
        ("oliwa", 30), ("papryka_slodka", 2), ("chili", 1), ("sol", 4)],
        ["Cebulę pokrój w cienkie piórka, wymieszaj z solą, papryką i chili, odstaw na 10 minut.",
         "Rybę natrzyj solą i połową oliwy.",
         "Smaż na patelni grillowej albo w opiekaczu 3–4 minuty z każdej strony.",
         "Bagietkę przekrój na 3 części i rozgrzej na tej samej patelni.",
         "Napełnij ją sałatą, pomidorami, cebulą i rybą. Skrop cytryną."],
        "W Stambule robi się go z makreli smażonej na łodziach przy moście Galata. Filet z białej ryby jest łagodniejszy."),
    TR("tr-karides-guvec", "Karides güveç, krewetki zapiekane z papryką i serem", ("casserole", "shrimp"), 3, 30, PO, OK, [
        ("krewetki", 400), ("papryka", 200), ("pomidory", 300), ("cebula", 110), ("czosnek", 10), ("maslo", 30),
        ("ser_zolty", 100), ("papryka_slodka", 2), ("chili", 1), ("chleb", 210, "6 kromek"), ("sol", 3)],
        ["Na maśle podsmaż cebulę, paprykę i czosnek przez 5 minut.",
         "Dodaj pokrojone pomidory i przyprawy, gotuj 5 minut.",
         "Wmieszaj krewetki i przełóż do żaroodpornych miseczek albo jednego naczynia.",
         "Posyp startym serem i zapiekaj w 220°C przez 10 minut, aż ser się zrumieni.",
         "Podawaj gorące z chlebem."]),
    TR("tr-midye-tava", "Midye tava, małże w cieście z sosem orzechowym", ("skewer", "shell"), 3, 35, P, OK, [
        ("malze", 450), ("maka", 100), ("proszek", 5), ("olej", 80, "do smażenia"), ("chleb", 100), ("orzechy_wloskie", 50),
        ("czosnek", 10), ("ocet", 10), ("sol", 4)],
        ["Chleb namocz w wodzie, odciśnij i zmiksuj z orzechami, czosnkiem, octem, solą i 3 łyżkami wody na gęsty sos tarator.",
         "Mąkę, proszek i szczyptę soli wymieszaj ze 150 ml zimnej wody.",
         "Małże osusz i nadziej po 5–6 na patyczki do szaszłyków.",
         "Zanurz w cieście i smaż w rozgrzanym oleju 2–3 minuty, aż będą złote.",
         "Podawaj od razu z sosem."]),

    # ---------------- Liban ----------------
    LB("lb-sayadieh", "Sayadieh, ryba na ryżu z karmelizowaną cebulą", ("ricebowl", "fish"), 4, 60, P, OBIAD, [
        ("dorsz", 600), ("ryz", 300), ("cebula", 440), ("olej", 60), ("kmin", 2), ("cynamon", 1), ("ziele_angielskie", 1),
        ("migdaly", 30), ("cytryna", 60), ("sol", 7)],
        ["Cebulę pokrój w piórka i smaż na oleju 20–25 minut, aż będzie ciemnobrązowa. Odłóż jedną trzecią na wierzch.",
         "Resztę cebuli zalej 800 ml wody z przyprawami i solą, gotuj 10 minut i zmiksuj na brązowy wywar.",
         "Rybę posól i obsmaż na patelni po 2 minuty z każdej strony.",
         "Ryż wsyp do wywaru, gotuj pod przykryciem 12 minut. Połóż na nim rybę i gotuj jeszcze 6 minut.",
         "Migdały upraż. Podawaj ryż z rybą, posypany cebulą i migdałami, z cytryną."],
        "Ryż jest brązowy od cebuli. Im ciemniej ją przysmażysz, tym lepiej."),
    LB("lb-samke-harra", "Samke harra, ryba zapiekana w ostrym sosie tahini", ("casserole", "chili"), 3, 40, O, OBIAD, [
        ("dorsz", 600), ("tahini", 100), ("cytryna", 120), ("czosnek", 15), ("papryczka_chili", 20), ("kolendra", 30),
        ("orzechy_wloskie", 40), ("oliwa", 40), ("kmin", 2), ("pita", 240, "4 szt."), ("sol", 5)],
        ["Rybę posól, skrop oliwą i piecz w 200°C przez 10 minut.",
         "Tahini wymieszaj z sokiem z cytryny, połową czosnku, solą i 100 ml wody na gładki sos.",
         "Na oliwie podsmaż resztę czosnku, posiekane chili, kolendrę, kmin i orzechy przez 2 minuty.",
         "Polej rybę sosem tahini, posyp mieszanką z patelni i piecz jeszcze 10 minut.",
         "Podawaj z pitą."],
        "Harra znaczy ostra. Jeśli nie lubisz pikantnego, daj połowę chili."),

    # ---------------- Maroko ----------------
    MA("ma-tajine-ryba", "Tajine z rybą, ziemniakami i chermoulą", ("tagine", "fish"), 4, 55, P, OBIAD, [
        ("dorsz", 600), ("ziemniaki", 600), ("pomidory", 300), ("papryka", 200), ("kolendra", 30), ("natka", 20),
        ("czosnek", 15), ("cytryna", 60), ("oliwa", 60), ("kmin", 3), ("papryka_slodka", 4), ("chili", 1), ("oliwki", 60),
        ("chleb", 140, "4 kromki"), ("sol", 7)],
        ["Chermoula: posiekaj kolendrę, natkę i czosnek, wymieszaj z sokiem z cytryny, oliwą, kminem, papryką, chili i solą.",
         "Rybę pokrój na kawałki i wymieszaj z połową chermouli. Odstaw na 20 minut.",
         "Na dnie szerokiego garnka ułóż plastry ziemniaków, na nich paski papryki i plastry pomidorów. Polej resztą chermouli i 150 ml wody.",
         "Duś pod przykryciem 20 minut, aż ziemniaki prawie zmiękną.",
         "Połóż na wierzchu rybę i oliwki, duś jeszcze 10–12 minut. Podawaj z chlebem."]),
    MA("ma-pastilla-morze", "Pastilla z owocami morza i makaronem ryżowym", ("pie", "shrimp"), 4, 60, PO, OBIAD, [
        ("ciasto_filo", 250), ("owoce_morza", 450), ("makaron_ryzowy", 100), ("pieczarki", 200), ("czosnek", 10),
        ("kolendra", 30), ("natka", 20), ("cytryna", 60), ("maslo", 60), ("imbir_mielony", 1), ("kmin", 2),
        ("papryka_slodka", 3), ("chili", 1), ("sol", 5)],
        ["Makaron zalej wrzątkiem na 5 minut, odcedź i pokrój nożyczkami na krótsze kawałki.",
         "Na łyżce masła podsmaż pieczarki z czosnkiem i przyprawami 5 minut, dodaj owoce morza na 2 minuty.",
         "Wymieszaj z makaronem, ziołami, sokiem z cytryny i solą. Odlej nadmiar płynu.",
         "Resztę masła roztop. Wyłóż formę płatami filo, smarując każdy masłem tak, żeby zwisały poza brzegi.",
         "Wyłóż farsz, przykryj zwisającymi płatami i 2 kolejnymi, posmaruj masłem.",
         "Piecz w 190°C przez 25–30 minut, aż będzie złota i chrupiąca."],
        "W Maroku mięsna pastilla jest na słodko z cynamonem, a ta z owocami morza na ostro z cytryną."),
]
