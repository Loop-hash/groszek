"""Ryby i owoce morza: Meksyk i USA."""
from rlib import kraj, P, O, G, OBIAD, OK, SN, SNK, KOL

PO = ["palnik", "piekarnik"]

MX = kraj("Meksyk")
US = kraj("USA")

RECIPES = [
    # ---------------- Meksyk ----------------
    MX("mx-tacos-pescado", "Tacos de pescado, tacos z rybą w cieście po bajańsku", ("taco", "fish"), 4, 35, P, OK, [
        ("dorsz", 500), ("maka", 80), ("proszek", 3), ("olej", 60, "do smażenia"), ("tortilla", 300, "8 małych"),
        ("kapusta", 200), ("majonez", 40), ("smietana", 60), ("limonka", 60), ("kolendra", 20), ("papryczka_chili", 10),
        ("kmin", 1), ("sol", 5)],
        ["Mąkę, proszek, kmin i sól wymieszaj ze 130 ml zimnej wody gazowanej na gęste ciasto.",
         "Rybę pokrój w paski, zanurz w cieście i smaż na oleju 2–3 minuty, aż będzie złota.",
         "Kapustę poszatkuj bardzo cienko i skrop sokiem z połowy limonki.",
         "Majonez wymieszaj ze śmietaną, resztą soku z limonki i posiekanym chili.",
         "Tortille podgrzej na suchej patelni. Nakładaj kapustę, rybę, sos i kolendrę."],
        "Pochodzą z Ensenady w Kalifornii Dolnej, gdzie rybę smaży się na straganach przy porcie."),
    MX("mx-coctel-camaron", "Cóctel de camarón, krewetki w pikantnym sosie pomidorowym z awokado", ("mug", "shrimp"), 3, 30, O, KOL, [
        ("krewetki", 400), ("passata", 200), ("ketchup", 60), ("limonka", 60), ("cebula", 110), ("ogorek", 200),
        ("awokado", 200, "1 szt."), ("kolendra", 20), ("papryczka_chili", 10), ("tortilla", 200), ("sol", 3)],
        ["Tortille pokrój w trójkąty i piecz w 200°C przez 8 minut, aż będą chrupiące.",
         "Krewetki ugotuj 2 minuty w osolonej wodzie i przelej zimną wodą. Zachowaj pół szklanki wywaru.",
         "Wymieszaj passatę, ketchup, sok z limonki i schłodzony wywar.",
         "Dodaj krewetki, drobno pokrojoną cebulę, ogórek, chili i kolendrę. Wstaw na 20 minut do lodówki.",
         "Podawaj w szklankach albo miseczkach z kostką awokado i chipsami z tortilli."],
        "Meksykanie jedzą go zimnego na plaży, często z kilkoma kroplami ostrego sosu."),
    MX("mx-diabla", "Camarones a la diabla, krewetki w ostrym czerwonym sosie z ryżem", ("ricebowl", "chili"), 3, 30, P, OK, [
        ("krewetki", 400), ("pomidory_puszka", 400), ("papryczka_chili", 20), ("chili", 4), ("czosnek", 15), ("cebula", 110),
        ("kmin", 1), ("oregano", 1), ("maslo", 20), ("olej", 20), ("ryz", 300), ("limonka", 60), ("sol", 5)],
        ["Ryż ugotuj na sypko.",
         "Zmiksuj pomidory z połową cebuli, czosnkiem, chili, kminem, oregano i solą.",
         "Na oleju podsmaż resztę cebuli, wlej sos i gotuj 10 minut.",
         "Na maśle obsmaż krewetki minutę, przełóż do sosu i gotuj 2 minuty.",
         "Podawaj z ryżem i limonką."],
        "Diabelskie, bo powinny być naprawdę ostre. Ilość chili dopasuj do siebie."),
    MX("mx-arroz-tumbada", "Arroz a la tumbada, wilgotny ryż z owocami morza z Veracruz", ("cauldron", "shrimp"), 4, 45, P, OBIAD, [
        ("owoce_morza", 450), ("krewetki", 200), ("ryz", 300), ("pomidory", 300), ("cebula", 110), ("papryka", 150),
        ("czosnek", 10), ("kolendra", 20), ("oregano", 1), ("chili", 2), ("olej", 40), ("bulion", 10, "1 kostka"),
        ("limonka", 60), ("sol", 3)],
        ["Ryż przepłucz i podsmaż na połowie oleju na złoto. Odłóż.",
         "Zmiksuj pomidory z połową cebuli i czosnkiem.",
         "Na reszcie oleju podsmaż resztę cebuli i paprykę. Wlej sos pomidorowy i gotuj 5 minut.",
         "Dodaj ryż, 1 l gorącej wody z kostką, oregano i chili. Gotuj 15 minut.",
         "Wrzuć owoce morza i krewetki, gotuj 5 minut. Ryż ma zostać wilgotny, prawie jak gęsta zupa.",
         "Posyp kolendrą i podawaj z limonką."],
        "Tumbada znaczy położona. Ryż ma leżeć w sosie, a nie być sypki jak w paelli."),
    MX("mx-tostadas-atun", "Tostadas de atún, chrupiące tortille z sałatką z tuńczyka", ("nachos", "fish"), 3, 25, O, OK, [
        ("tunczyk", 360, "3 puszki"), ("tortilla", 240, "6 małych"), ("majonez", 50), ("pomidory", 200), ("cebula", 60),
        ("papryczka_chili", 10), ("limonka", 60), ("kolendra", 20), ("awokado", 200, "1 szt."), ("salata", 100),
        ("sol", 2)],
        ["Tortille piecz w 200°C przez 8–10 minut, aż będą płaskie i chrupiące.",
         "Tuńczyka odsącz i wymieszaj z majonezem, sokiem z limonki, pokrojonymi pomidorami, cebulą, chili i kolendrą.",
         "Na każdą tostadę połóż sałatę i górkę tuńczyka.",
         "Udekoruj plasterkami awokado."]),

    # ---------------- USA ----------------
    US("us-shrimp-grits", "Shrimp and grits, krewetki z boczkiem na kaszy kukurydzianej", ("oats", "shrimp"), 3, 30, P, OK, [
        ("krewetki", 400), ("maka_kukurydziana", 200), ("mleko", 400), ("maslo", 30), ("ser_zolty", 80), ("boczek", 100),
        ("czosnek", 10), ("dymka", 30), ("cytryna", 30), ("papryka_slodka", 2), ("chili", 1), ("sol", 5)],
        ["Zagotuj mleko z 400 ml wody i solą. Wsypuj kaszę, mieszając, i gotuj na małym ogniu 15 minut.",
         "Wmieszaj masło i starty ser.",
         "Boczek pokrój w kostkę i wytop na patelni. Wyjmij skwarki.",
         "Na tłuszczu z boczku smaż krewetki z czosnkiem, papryką i chili 2–3 minuty. Skrop cytryną.",
         "Na kaszę wyłóż krewetki ze skwarkami i dymką."],
        "Śniadanie rybaków z Karoliny Południowej, które stało się daniem z restauracji."),
    US("us-clam-chowder", "Clam chowder, gęsta zupa z małżami i ziemniakami", ("soup", "shell"), 4, 40, P, OK, [
        ("malze", 450), ("ziemniaki", 500), ("boczek", 100), ("cebula", 110), ("seler", 80), ("maslo", 20), ("maka", 30),
        ("mleko", 500), ("smietanka", 100), ("tymianek", 1), ("lisc_laurowy", 1), ("chleb", 140, "4 kromki"),
        ("sol", 5), ("pieprz", 1)],
        ["Boczek pokrój w kostkę i wytop w garnku. Dodaj masło, cebulę i seler, smaż 5 minut.",
         "Wsyp mąkę i smaż minutę, mieszając.",
         "Wlej stopniowo 400 ml wody i mleko, dodaj ziemniaki w kostce, tymianek i liść. Gotuj 15 minut.",
         "Wrzuć małże i śmietankę, gotuj 3 minuty. Dopraw solą i pieprzem.",
         "Podawaj z chlebem albo krakersami."],
        "W San Francisco podaje się go w wydrążonym bochenku chleba na zakwasie."),
    US("us-po-boy", "Shrimp po'boy, bagietka z krewetkami w chrupiącej panierce", ("hotdog", "shrimp"), 3, 35, P, OK, [
        ("krewetki", 400), ("kefir", 100), ("maka_kukurydziana", 60), ("maka", 40), ("papryka_slodka", 2), ("chili", 1),
        ("czosnek_granulowany", 2), ("olej", 60, "do smażenia"), ("bagietka", 300), ("salata", 100), ("pomidory", 200),
        ("majonez", 50), ("musztarda", 5), ("ogorki_kiszone", 60), ("sol", 4)],
        ["Krewetki zalej kefirem z solą na 10 minut.",
         "Obie mąki wymieszaj z papryką, chili i czosnkiem.",
         "Krewetki obtocz w mące i smaż partiami 2 minuty, aż będą chrupiące.",
         "Majonez wymieszaj z musztardą i posiekanymi ogórkami.",
         "Bagietkę przekrój wzdłuż, posmaruj sosem, ułóż sałatę, pomidory i krewetki."],
        "Kanapka z Nowego Orleanu. Nazwa pochodzi od „poor boy”, bo za darmo dostawali ją strajkujący tramwajarze."),
    US("us-shrimp-boil", "Cajun shrimp boil, krewetki z ziemniakami i kiełbasą", ("tray", "shrimp"), 4, 45, P, OBIAD, [
        ("krewetki", 400), ("ziemniaki", 600, "małe"), ("kukurydza", 285, "1 puszka"), ("kielbasa", 250), ("maslo", 50),
        ("czosnek", 20), ("papryka_slodka", 5), ("chili", 2), ("oregano", 1), ("tymianek", 1), ("cytryna", 60),
        ("lisc_laurowy", 2), ("sol", 5)],
        ["Zagotuj 2 l wody z solą, liśćmi, połową papryki i cytryną przekrojoną na pół.",
         "Wrzuć ziemniaki i gotuj 15 minut, dodaj kiełbasę w grubych plastrach na 5 minut.",
         "Wrzuć krewetki i gotuj 2 minuty. Odcedź.",
         "Na maśle podsmaż czosnek z resztą papryki, chili i ziołami, dodaj odsączoną kukurydzę.",
         "Wymieszaj wszystko z masłem i wysyp na środek stołu na papier do pieczenia. Je się rękami."],
        "W Luizjanie gotuje się też całe kolby kukurydzy. Jeśli je dostaniesz, wrzuć je razem z ziemniakami."),
    US("us-crab-cakes", "Crab cakes z paluszków krabowych z coleslawem", ("burger", "fish"), 3, 35, P, OK, [
        ("paluszki_krabowe", 400), ("bulka_tarta", 60), ("jajka", 50, "1 szt."), ("majonez", 100), ("musztarda", 10),
        ("natka", 10), ("cytryna", 30), ("papryka_slodka", 2), ("olej", 40), ("kapusta", 300), ("marchew", 100),
        ("ocet", 10), ("cukier", 5), ("sol", 3), ("pieprz", 1)],
        ["Kapustę poszatkuj, marchew zetrzyj. Wymieszaj z połową majonezu, octem, cukrem, solą i pieprzem.",
         "Paluszki posiekaj drobno. Wymieszaj z resztą majonezu, jajkiem, musztardą, natką, papryką i połową bułki.",
         "Uformuj 9 kotlecików, obtocz w reszcie bułki i wstaw na 15 minut do lodówki.",
         "Smaż na oleju po 3 minuty z każdej strony.",
         "Podawaj z coleslawem i cytryną."],
        "W Maryland robi się je z prawdziwego kraba. Wersja z surimi jest dużo tańsza i też się trzyma."),
    US("us-tuna-melt", "Tuna melt, zapiekana kanapka z tuńczykiem i serem", ("sandwich", "can"), 2, 20, G, OK, [
        ("tunczyk", 240, "2 puszki"), ("majonez", 50), ("ogorki_kiszone", 50), ("cebula", 50), ("musztarda", 5),
        ("chleb_tostowy", 200, "8 kromek"), ("ser_zolty", 120), ("maslo", 20), ("pieprz", 1)],
        ["Tuńczyka odsącz i wymieszaj z majonezem, musztardą, posiekanym ogórkiem, cebulą i pieprzem.",
         "Kromki posmaruj masłem z jednej strony.",
         "Na nieposmarowane strony połóż ser i pastę z tuńczyka, przykryj drugą kromką masłem na zewnątrz.",
         "Opiekaj w opiekaczu albo na patelni po 3 minuty z każdej strony, aż ser się roztopi."]),
    US("us-blackened-salmon", "Blackened salmon, łosoś w przyprawach cajun z ryżem i fasolką", ("pan", "fish"), 3, 25, P, OK, [
        ("losos", 450), ("papryka_slodka", 6), ("czosnek_granulowany", 2), ("tymianek", 1), ("oregano", 1), ("chili", 1),
        ("pieprz", 2), ("maslo", 20), ("ryz", 250), ("fasolka", 300), ("cytryna", 60), ("sol", 5)],
        ["Ryż ugotuj. Fasolkę ugotuj w osolonej wodzie przez 6 minut.",
         "Wymieszaj paprykę, czosnek, zioła, chili, pieprz i sól.",
         "Łososia pokrój na porcje, posmaruj połową roztopionego masła i obtocz w przyprawach.",
         "Smaż na mocno rozgrzanej suchej patelni po 3 minuty z każdej strony, aż przyprawy ściemnieją. Otwórz okno.",
         "Fasolkę wymieszaj z resztą masła. Podawaj z ryżem, fasolką i cytryną."],
        "Wymyślił go w latach 80. kucharz z Nowego Orleanu Paul Prudhomme. Czarna skórka to przypieczone przyprawy, nie spalona ryba."),
]
