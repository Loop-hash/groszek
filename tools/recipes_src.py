"""Przepisy Groszka: własne opisy, po 2 dania z każdego z 20 krajów + podstawy na śniadania i kolacje.

Składnik: (id z ingredients_src.py, gramy na cały przepis, opcjonalnie miara do pokazania).
needs: palnik, piekarnik (albo air fryer), opiekacz, toster.
meal: obiad, sniadanie, kolacja (planer dobiera po tym polu).
"""

from rlib import R  # noqa: E402


RECIPES = [
    # ---------------- Polska ----------------
    R("pl-fasolka", "Fasolka po bretońsku", "Polska", ("pot", "beans"), 3, 40, ["palnik"], ["obiad"], [
        ("fasola_biala", 480, "2 puszki"), ("kielbasa", 200), ("cebula", 110, "1 szt."), ("koncentrat", 60, "2 łyżki"),
        ("pomidory_puszka", 400, "1 puszka"), ("majeranek", 2, "1 łyżeczka"), ("papryka_slodka", 2, "1 łyżeczka"),
        ("olej", 10, "1 łyżka"), ("cukier", 4, "1 łyżeczka"), ("sol", 2), ("pieprz", 1), ("chleb", 105, "3 kromki")],
        ["Kiełbasę pokrój w półplasterki, cebulę w kostkę.",
         "W garnku podsmaż kiełbasę na oleju, aż się zarumieni. Dorzuć cebulę i smaż 5 minut.",
         "Dodaj koncentrat, pomidory z puszki, majeranek, paprykę i cukier. Wymieszaj.",
         "Wsyp odsączoną fasolę, wlej pół szklanki wody i duś pod przykryciem 20 minut, mieszając od czasu do czasu.",
         "Dopraw solą i pieprzem. Jedz z chlebem. Następnego dnia smakuje jeszcze lepiej."],
        "Trzyma się w lodówce 3 dni, więc spokojnie wystarczy na kilka obiadów."),
    R("pl-leniwe", "Leniwe pierogi", "Polska", ("pierogi", "cheese"), 2, 30, ["palnik"], ["obiad", "kolacja"], [
        ("twarog", 400, "2 kostki"), ("jajka", 100, "2 szt."), ("maka", 150, "1 szklanka"), ("sol", 1),
        ("maslo", 30, "2 łyżki"), ("cukier", 20, "1 łyżka"), ("cynamon", 1, "szczypta")],
        ["Twaróg rozgnieć widelcem na gładko. Dodaj jajka i szczyptę soli, wymieszaj.",
         "Wsyp mąkę i szybko zagnieć miękkie ciasto. Nie ugniataj za długo, bo kluski wyjdą twarde.",
         "Podziel ciasto na 3 części, zrób wałki grubości kciuka, lekko spłaszcz i tnij ukośnie na kawałki.",
         "Wrzucaj partiami na osolony wrzątek. Gotuj 2 minuty od wypłynięcia.",
         "Podawaj z roztopionym masłem i cukrem z cynamonem."],
        "Surowe kluski możesz zamrozić na tacce i gotować prosto z zamrażarki."),

    # ---------------- Włochy ----------------
    R("it-bolognese", "Spaghetti bolognese", "Włochy", ("spaghetti", "mince"), 3, 40, ["palnik"], ["obiad"], [
        ("makaron", 300), ("mielone_wieprzowe", 400), ("cebula", 110, "1 szt."), ("marchew", 80, "1 szt."), ("czosnek", 10, "2 ząbki"),
        ("pomidory_puszka", 400, "1 puszka"), ("koncentrat", 30, "1 łyżka"), ("oregano", 2, "1 łyżeczka"),
        ("oliwa", 10, "1 łyżka"), ("sol", 4), ("pieprz", 1), ("ser_zolty", 30, "do posypania")],
        ["Cebulę, marchew i czosnek drobno posiekaj albo zetrzyj.",
         "Na oliwie podsmaż warzywa 5 minut. Dodaj mięso i smaż, rozbijając łyżką, aż straci różowy kolor.",
         "Wmieszaj koncentrat, pomidory i oregano. Duś na małym ogniu 20 minut, aż sos zgęstnieje.",
         "W tym czasie ugotuj makaron w osolonej wodzie (jeśli masz jeden palnik, zrób to przed sosem i odstaw).",
         "Wymieszaj makaron z sosem, posyp startym serem."],
        "Sos możesz zrobić z podwójnej porcji i zamrozić połowę."),
    R("it-risotto", "Risotto z pieczarkami", "Włochy", ("ricebowl", "mushroom"), 2, 35, ["palnik"], ["obiad"], [
        ("ryz_risotto", 200), ("pieczarki", 300), ("cebula", 110, "1 szt."), ("czosnek", 5, "1 ząbek"), ("maslo", 30, "2 łyżki"),
        ("bulion", 10, "1 kostka"), ("ser_zolty", 50), ("natka", 10, "garść"), ("pieprz", 1)],
        ["Kostkę rosołową rozpuść w litrze gorącej wody.",
         "Pieczarki pokrój w plasterki, cebulę i czosnek posiekaj. Podsmaż na połowie masła, aż pieczarki puszczą wodę i ją odparują.",
         "Wsyp ryż i smaż minutę, mieszając, aż się zeszkli.",
         "Wlewaj bulion po jednej chochli. Kolejną dodawaj, gdy poprzednia się wchłonie. Mieszaj często. Trwa to około 18 minut.",
         "Gdy ryż jest miękki, ale lekko sprężysty, zdejmij z ognia. Wmieszaj resztę masła i starty ser. Posyp natką."],
        "Zwykły ryż też da radę, tylko risotto wyjdzie mniej kremowe."),

    # ---------------- Francja ----------------
    R("fr-ratatouille", "Ratatouille z jajkiem", "Francja", ("pan", "pepper"), 2, 40, ["palnik"], ["obiad", "kolacja"], [
        ("cukinia", 300, "1 szt."), ("papryka", 160, "1 szt."), ("cebula", 110, "1 szt."), ("czosnek", 10, "2 ząbki"),
        ("pomidory_puszka", 400, "1 puszka"), ("oliwa", 20, "2 łyżki"), ("oregano", 2, "1 łyżeczka"), ("jajka", 200, "4 szt."),
        ("sol", 3), ("pieprz", 1), ("chleb", 140, "4 kromki")],
        ["Cukinię, paprykę i cebulę pokrój w kostkę, czosnek posiekaj.",
         "Na oliwie podsmaż cebulę i paprykę 5 minut. Dodaj cukinię i czosnek, smaż kolejne 5 minut.",
         "Wlej pomidory, dodaj oregano, sól i pieprz. Duś 15 minut bez przykrycia.",
         "Zrób w warzywach 4 dołki, wbij do nich jajka. Przykryj i gotuj 5–7 minut, aż białka się zetną.",
         "Jedz z chlebem prosto z patelni."],
        "Bez jajek to klasyczne warzywne ratatouille, świetne też na zimno."),
    R("fr-cebulowa", "Zupa cebulowa z grzankami", "Francja", ("soup", "onion"), 2, 50, ["palnik", "toster"], ["obiad", "kolacja"], [
        ("cebula", 660, "6 szt."), ("maslo", 30, "2 łyżki"), ("maka", 10, "1 łyżka"), ("bulion", 10, "1 kostka"),
        ("cukier", 4, "1 łyżeczka"), ("chleb", 140, "4 kromki"), ("ser_zolty", 80), ("pieprz", 1)],
        ["Cebulę pokrój w cienkie piórka.",
         "W garnku rozpuść masło, wrzuć cebulę i cukier. Smaż na małym ogniu 25–30 minut, często mieszając, aż będzie złota i miękka.",
         "Posyp mąką, wymieszaj i smaż minutę.",
         "Wlej litr gorącej wody z kostką rosołową. Gotuj 10 minut, dopraw pieprzem.",
         "Chleb opiecz w tosterze, połóż na nim ser i włóż do talerza zupy, żeby ser się roztopił."],
        "Najdłużej trwa smażenie cebuli. Nie spiesz się, bo od niego zależy smak zupy."),

    # ---------------- Hiszpania ----------------
    R("es-tortilla", "Tortilla de patatas", "Hiszpania", ("pan", "egg"), 2, 40, ["palnik"], ["obiad", "kolacja", "sniadanie"], [
        ("ziemniaki", 500, "4 szt."), ("jajka", 300, "6 szt."), ("cebula", 110, "1 szt."), ("olej", 40, "4 łyżki"),
        ("sol", 4), ("pieprz", 1)],
        ["Ziemniaki obierz i pokrój w cienkie plasterki, cebulę w piórka.",
         "Na patelni rozgrzej olej, wrzuć ziemniaki z cebulą i smaż pod przykryciem na średnim ogniu 15–20 minut, mieszając, aż będą miękkie.",
         "Jajka roztrzep w misce z solą. Wrzuć do nich ziemniaki i odczekaj 5 minut.",
         "Wlej wszystko z powrotem na patelnię. Smaż na małym ogniu 6–8 minut, aż spód się zetnie.",
         "Przykryj talerzem, odwróć i zsuń tortillę z powrotem na patelnię. Smaż jeszcze 3 minuty."],
        "Na zimno też jest dobra, więc nadaje się na drugie śniadanie na uczelnię."),
    R("es-arroz", "Arroz con pollo", "Hiszpania", ("ricebowl", "chicken"), 3, 40, ["palnik"], ["obiad"], [
        ("ryz", 250), ("kurczak", 400), ("papryka", 160, "1 szt."), ("cebula", 110, "1 szt."), ("czosnek", 10, "2 ząbki"),
        ("pomidory_puszka", 200, "pół puszki"), ("papryka_slodka", 4, "2 łyżeczki"), ("bulion", 10, "1 kostka"),
        ("olej", 20, "2 łyżki"), ("sol", 2), ("pieprz", 1)],
        ["Kurczaka pokrój w kostkę i obsyp połową papryki w proszku i solą.",
         "W szerokim garnku obsmaż kurczaka na oleju, aż się zarumieni. Odłóż na talerz.",
         "Na tym samym tłuszczu podsmaż pokrojoną cebulę, paprykę i czosnek przez 5 minut.",
         "Wsyp ryż i resztę papryki w proszku, wymieszaj. Dodaj pomidory i 600 ml wody z kostką rosołową.",
         "Wróć kurczaka do garnka. Gotuj pod przykryciem na małym ogniu 18 minut, bez mieszania, aż ryż wchłonie płyn."]),

    # ---------------- Grecja ----------------
    R("gr-gyros", "Gyros z kurczaka w picie", "Grecja", ("wrap", "chicken"), 2, 25, ["palnik"], ["obiad", "kolacja"], [
        ("kurczak", 300), ("pita", 280, "4 szt."), ("jogurt", 200), ("ogorek", 150, "pół szt."), ("czosnek", 10, "2 ząbki"),
        ("pomidory", 150, "1 szt."), ("cebula", 55, "pół szt."), ("oregano", 2, "1 łyżeczka"), ("papryka_slodka", 2, "1 łyżeczka"),
        ("olej", 15), ("cytryna", 20, "kilka kropli"), ("sol", 3)],
        ["Kurczaka pokrój w cienkie paski. Wymieszaj z oregano, papryką, solą i łyżką oleju.",
         "Sos tzatziki: ogórek zetrzyj, odciśnij z wody, wymieszaj z jogurtem, czosnkiem, solą i kroplą cytryny.",
         "Kurczaka smaż na mocno rozgrzanej patelni 6–8 minut, aż się zarumieni.",
         "Pity podgrzej na suchej patelni albo w tosterze.",
         "Nałóż kurczaka, pomidora, cebulę i dużo tzatziki. Zawiń."],
        "Kurczaka możesz też upiec na grillu kontaktowym."),
    R("gr-fasolada", "Fasolada, grecka zupa fasolowa", "Grecja", ("soup", "beans"), 3, 35, ["palnik"], ["obiad"], [
        ("fasola_biala", 480, "2 puszki"), ("marchew", 160, "2 szt."), ("cebula", 110, "1 szt."), ("czosnek", 10, "2 ząbki"),
        ("pomidory_puszka", 400, "1 puszka"), ("oliwa", 30, "3 łyżki"), ("oregano", 2), ("natka", 10), ("cytryna", 30),
        ("sol", 5), ("pieprz", 1), ("chleb", 105, "3 kromki")],
        ["Marchew pokrój w plasterki, cebulę w kostkę, czosnek posiekaj.",
         "W garnku podsmaż warzywa na 2 łyżkach oliwy przez 5 minut.",
         "Dodaj pomidory, oregano, fasolę z puszki (odsączoną) i litr wody.",
         "Gotuj 20 minut, aż marchew będzie miękka. Dopraw solą i pieprzem.",
         "Na koniec dodaj resztę oliwy, natkę i sok z cytryny. Jedz z chlebem."]),

    # ---------------- Niemcy ----------------
    R("de-kartoffelsuppe", "Kartoffelsuppe, zupa ziemniaczana z kiełbasą", "Niemcy", ("soup", "potato"), 3, 35, ["palnik"], ["obiad"], [
        ("ziemniaki", 750, "5 szt."), ("marchew", 80, "1 szt."), ("cebula", 110, "1 szt."), ("kielbasa", 200),
        ("majeranek", 2, "1 łyżeczka"), ("bulion", 10, "1 kostka"), ("smietana", 100, "pół kubka"), ("olej", 10),
        ("sol", 2), ("pieprz", 1)],
        ["Ziemniaki i marchew obierz i pokrój w kostkę, cebulę posiekaj, kiełbasę pokrój w plasterki.",
         "W garnku podsmaż na oleju cebulę z kiełbasą przez 5 minut.",
         "Dodaj ziemniaki, marchew, majeranek i litr wody z kostką rosołową. Gotuj 20 minut.",
         "Część ziemniaków rozgnieć tłuczkiem w garnku, żeby zupa zgęstniała.",
         "Zdejmij z ognia, wmieszaj śmietanę i dopraw pieprzem."]),
    R("de-spaetzle", "Käsespätzle, kluseczki z serem i cebulą", "Niemcy", ("pot", "cheese"), 3, 35, ["palnik"], ["obiad"], [
        ("maka", 250), ("jajka", 150, "3 szt."), ("mleko", 100, "pół szklanki"), ("ser_zolty", 150), ("cebula", 220, "2 szt."),
        ("maslo", 20, "1 łyżka"), ("sol", 3), ("pieprz", 1)],
        ["Wymieszaj mąkę, jajka, mleko i szczyptę soli na gęste, lejące się ciasto. Odstaw na 10 minut.",
         "Cebulę pokrój w piórka i usmaż na maśle na złoto. Odłóż.",
         "Ciasto przecieraj przez tarkę o dużych oczkach albo durszlak prosto do osolonego wrzątku. Kluski gotuj 2 minuty od wypłynięcia.",
         "Odcedzone kluski wrzuć na patelnię, wymieszaj z tartym serem, aż się roztopi.",
         "Posyp cebulą i pieprzem."],
        "Nie masz tarki? Krój ciasto nożem z deski prosto do wody, jak kluski kładzione."),

    # ---------------- Węgry ----------------
    R("hu-gulyas", "Gulyásleves, zupa gulaszowa", "Węgry", ("soup", "mince"), 3, 60, ["palnik"], ["obiad"], [
        ("lopatka", 400), ("ziemniaki", 450, "3 szt."), ("cebula", 220, "2 szt."), ("papryka", 160, "1 szt."), ("marchew", 80, "1 szt."),
        ("czosnek", 10, "2 ząbki"), ("papryka_slodka", 8, "1 łyżka"), ("kmin", 1, "szczypta"), ("koncentrat", 30, "1 łyżka"),
        ("olej", 15), ("sol", 5), ("pieprz", 1)],
        ["Mięso pokrój w kostkę 2 cm, cebulę posiekaj.",
         "W garnku zrumień mięso na oleju. Dodaj cebulę i smaż 5 minut.",
         "Zdejmij garnek z ognia, wsyp paprykę w proszku i kmin, wymieszaj (papryka łatwo się przypala). Dodaj koncentrat i 1,2 l wody.",
         "Gotuj pod przykryciem 30 minut. Dodaj pokrojone ziemniaki, marchew, paprykę i czosnek.",
         "Gotuj kolejne 20 minut, aż wszystko zmięknie. Dopraw solą i pieprzem."],
        "Prawdziwy gulasz to zupa, a nie sos. Je się go łyżką."),
    R("hu-lecso", "Lecsó z kiełbasą", "Węgry", ("pan", "sausage"), 2, 30, ["palnik"], ["obiad", "kolacja"], [
        ("papryka", 480, "3 szt."), ("cebula", 110, "1 szt."), ("pomidory", 300, "2 szt."), ("kielbasa", 200),
        ("papryka_slodka", 4, "2 łyżeczki"), ("olej", 10), ("sol", 2), ("pieprz", 1), ("chleb", 140, "4 kromki")],
        ["Paprykę pokrój w paski, cebulę w piórka, pomidory w kostkę, kiełbasę w plasterki.",
         "Na patelni podsmaż kiełbasę z cebulą przez 5 minut.",
         "Dodaj paprykę i smaż 10 minut, aż zmięknie.",
         "Dorzuć pomidory i paprykę w proszku. Duś 10 minut.",
         "Dopraw solą i pieprzem. Jedz z chlebem."],
        "Wersja bez mięsa: zamiast kiełbasy wbij na koniec 3 jajka i wymieszaj."),

    # ---------------- Ukraina ----------------
    R("ua-barszcz", "Barszcz ukraiński", "Ukraina", ("soup", "leaf"), 4, 50, ["palnik"], ["obiad"], [
        ("buraki", 400, "2 szt."), ("kapusta", 300, "ćwiartka małej"), ("ziemniaki", 300, "2 szt."), ("marchew", 80, "1 szt."),
        ("cebula", 110, "1 szt."), ("fasola_biala", 240, "1 puszka"), ("koncentrat", 30, "1 łyżka"), ("bulion", 20, "2 kostki"),
        ("ocet", 15, "1 łyżka"), ("czosnek", 10, "2 ząbki"), ("smietana", 100), ("olej", 10), ("sol", 2), ("pieprz", 1)],
        ["Buraki i marchew zetrzyj na tarce, cebulę posiekaj, ziemniaki pokrój w kostkę, kapustę poszatkuj.",
         "W dużym garnku podsmaż na oleju cebulę, buraki i marchew przez 10 minut. Dodaj koncentrat i ocet.",
         "Wlej 1,5 l wody z kostkami rosołowymi, wrzuć ziemniaki i kapustę. Gotuj 20 minut.",
         "Dodaj odsączoną fasolę i przeciśnięty czosnek, gotuj jeszcze 5 minut.",
         "Podawaj z łyżką śmietany."],
        "Wychodzi duży gar. Wystarczy na 4 obiady albo więcej."),
    R("ua-syrniki", "Syrniki, placuszki z twarogu", "Ukraina", ("pancakes", "cheese"), 2, 25, ["palnik"], ["sniadanie", "kolacja"], [
        ("twarog", 400, "2 kostki"), ("jajka", 100, "2 szt."), ("maka", 80, "pół szklanki"), ("cukier", 30, "2 łyżki"),
        ("sol", 1), ("olej", 20, "2 łyżki"), ("smietana", 100), ("jablko", 180, "1 szt.")],
        ["Twaróg rozgnieć widelcem. Dodaj jajka, cukier i szczyptę soli, wymieszaj.",
         "Wsyp mąkę i wymieszaj na kleistą masę.",
         "Mokrymi rękami formuj kulki wielkości orzecha włoskiego, spłaszcz je i obtocz w mące.",
         "Smaż na oleju na średnim ogniu po 3 minuty z każdej strony.",
         "Podawaj ze śmietaną i startym jabłkiem."]),

    # ---------------- Gruzja ----------------
    R("ge-lobio", "Lobio, gruzińska fasola", "Gruzja", ("pan", "beans"), 2, 25, ["palnik"], ["obiad", "kolacja"], [
        ("fasola_czerwona", 480, "2 puszki"), ("cebula", 220, "2 szt."), ("czosnek", 15, "3 ząbki"), ("natka", 20),
        ("kmin", 2), ("papryka_slodka", 2), ("chili", 1, "szczypta"), ("ocet", 10, "2 łyżeczki"), ("olej", 20),
        ("sol", 2), ("chleb", 140, "4 kromki")],
        ["Cebulę posiekaj i podsmaż na oleju na złoto.",
         "Dodaj fasolę z puszki razem z połową zalewy, kmin, paprykę i chili. Gotuj 10 minut.",
         "Część fasoli rozgnieć widelcem, żeby danie zrobiło się kremowe.",
         "Wmieszaj czosnek, ocet i posiekaną natkę. Dopraw solą.",
         "Jedz na ciepło albo na zimno, z chlebem."],
        "W Gruzji dodaje się jeszcze posiekane orzechy włoskie. Jeśli masz, dorzuć garść."),
    R("ge-czachochbili", "Czachochbili, kurczak w pomidorach", "Gruzja", ("pot", "tomato"), 3, 45, ["palnik"], ["obiad"], [
        ("kurczak", 500), ("cebula", 330, "3 szt."), ("pomidory", 450, "3 szt."), ("pomidory_puszka", 400, "1 puszka"),
        ("czosnek", 15, "3 ząbki"), ("papryka_slodka", 4), ("chili", 1), ("natka", 20), ("maslo", 20), ("sol", 4), ("pieprz", 1),
        ("ryz", 200)],
        ["Kurczaka pokrój w duże kawałki, cebulę w piórka, pomidory w kostkę.",
         "W garnku na maśle obsmaż kurczaka. Dodaj cebulę i smaż 10 minut, aż zmięknie.",
         "Dodaj pomidory świeże i z puszki, paprykę i chili. Duś pod przykryciem 20 minut.",
         "Wmieszaj czosnek i natkę, dopraw solą i pieprzem.",
         "Podawaj z ryżem albo chlebem."]),

    # ---------------- Turcja ----------------
    R("tr-menemen", "Menemen, jajka z papryką i pomidorami", "Turcja", ("pan", "tomato"), 2, 20, ["palnik"], ["sniadanie", "kolacja"], [
        ("jajka", 200, "4 szt."), ("papryka", 160, "1 szt."), ("pomidory", 300, "2 szt."), ("cebula", 55, "pół szt."),
        ("maslo", 15), ("chili", 1), ("sol", 2), ("chleb", 140, "4 kromki")],
        ["Paprykę i cebulę pokrój w kostkę, pomidory zetrzyj albo drobno pokrój.",
         "Na maśle podsmaż paprykę z cebulą przez 5 minut.",
         "Dodaj pomidory i duś 5 minut, aż odparują.",
         "Wbij jajka i delikatnie mieszaj, aż się zetną, ale zostaną miękkie.",
         "Posyp chili i solą. Jedz z chlebem."]),
    R("tr-manti", "Leniwe manti z jogurtem", "Turcja", ("pot", "milk"), 3, 30, ["palnik"], ["obiad"], [
        ("makaron", 250), ("mielone_wieprzowe", 250), ("cebula", 110, "1 szt."), ("jogurt", 300), ("czosnek", 10, "2 ząbki"),
        ("maslo", 30, "2 łyżki"), ("papryka_slodka", 4), ("chili", 1), ("sol", 4), ("pieprz", 1)],
        ["Jogurt wymieszaj z przeciśniętym czosnkiem i szczyptą soli. Odstaw, żeby się ogrzał.",
         "Ugotuj makaron (najlepiej kokardki) w osolonej wodzie.",
         "Na patelni usmaż mięso z posiekaną cebulą, dopraw solą i pieprzem.",
         "W małym rondelku albo na patelni roztop masło z papryką i chili.",
         "Na talerz nałóż makaron, mięso, jogurt czosnkowy i polej czerwonym masłem."],
        "Tradycyjnie manti to malutkie pierożki. Ta wersja smakuje podobnie, a robi się ją 30 minut."),

    # ---------------- Liban ----------------
    R("lb-mujadara", "Mujadara, soczewica z ryżem i cebulą", "Liban", ("ricebowl", "beans"), 3, 45, ["palnik"], ["obiad"], [
        ("soczewica_zielona", 200), ("ryz", 150), ("cebula", 440, "4 szt."), ("olej", 40, "4 łyżki"), ("kmin", 3, "1 łyżeczka"),
        ("cynamon", 1, "szczypta"), ("sol", 4), ("pieprz", 1), ("jogurt", 200), ("ogorek", 150)],
        ["Soczewicę opłucz i gotuj w litrze wody 15 minut.",
         "W tym czasie cebulę pokrój w piórka i smaż na oleju na ciemnozłoto, około 20 minut. Połowę odłóż na talerz.",
         "Do reszty cebuli w garnku dodaj kmin i cynamon, wsyp ryż i wymieszaj.",
         "Dodaj soczewicę razem z wodą z gotowania (uzupełnij do 450 ml) i sól. Gotuj pod przykryciem 15 minut.",
         "Posyp odłożoną chrupiącą cebulą. Jedz z jogurtem i ogórkiem."],
        "Jedno z najtańszych dań na świecie, a syci na długo."),
    R("lb-kafta", "Kafta z grilla z pitą", "Liban", ("skewer", "onion"), 2, 25, ["opiekacz|palnik"], ["obiad", "kolacja"], [
        ("mielone_wieprzowe", 400), ("cebula", 110, "1 szt."), ("natka", 20), ("kmin", 2), ("cynamon", 1),
        ("papryka_slodka", 2), ("sol", 4), ("pieprz", 1), ("pita", 140, "2 szt."), ("pomidory", 150, "1 szt."),
        ("jogurt", 150), ("czosnek", 5)],
        ["Cebulę zetrzyj na drobnej tarce i odciśnij sok. Natkę posiekaj.",
         "Wymieszaj mięso z cebulą, natką, przyprawami i solą. Wyrabiaj ręką 2 minuty.",
         "Uformuj podłużne kotleciki wokół palców, jak grube paluchy.",
         "Piecz na rozgrzanym grillu kontaktowym 6–8 minut (albo smaż na patelni, obracając).",
         "Podawaj w picie z pomidorem i jogurtem z czosnkiem."],
        "W Libanie robi się kaftę z jagnięciny albo wołowiny. Wieprzowina jest tańsza i też smakuje."),

    # ---------------- Maroko ----------------
    R("ma-tajine", "Tajine z kurczakiem i ciecierzycą", "Maroko", ("tagine", "chickpea"), 3, 45, ["palnik"], ["obiad"], [
        ("kurczak", 400), ("ciecierzyca", 240, "1 puszka"), ("marchew", 160, "2 szt."), ("cebula", 110, "1 szt."), ("czosnek", 10),
        ("pomidory_puszka", 400, "1 puszka"), ("kmin", 2), ("cynamon", 2), ("papryka_slodka", 2), ("imbir", 10),
        ("cytryna", 30), ("olej", 15), ("sol", 4), ("kuskus", 200)],
        ["Kurczaka pokrój w kostkę, marchew w plasterki, cebulę w piórka. Czosnek i imbir zetrzyj.",
         "W garnku obsmaż kurczaka na oleju. Dodaj cebulę, czosnek, imbir i przyprawy, smaż 2 minuty.",
         "Dorzuć marchew, pomidory, odsączoną ciecierzycę i szklankę wody. Duś pod przykryciem 25 minut.",
         "Kuskus zalej 250 ml wrzątku z solą, przykryj na 5 minut i rozpulchnij widelcem.",
         "Tajine skrop sokiem z cytryny i podawaj na kuskusie."]),
    R("ma-harira", "Harira, zupa z soczewicy i ciecierzycy", "Maroko", ("soup", "lemon"), 4, 45, ["palnik"], ["obiad"], [
        ("soczewica_zielona", 150), ("ciecierzyca", 240, "1 puszka"), ("pomidory_puszka", 400, "1 puszka"), ("cebula", 110),
        ("koncentrat", 30), ("natka", 20), ("kmin", 2), ("cynamon", 2), ("imbir", 10), ("maka", 20, "1 łyżka"),
        ("cytryna", 50, "pół szt."), ("olej", 15), ("sol", 5), ("pieprz", 1)],
        ["Cebulę posiekaj i podsmaż na oleju w dużym garnku. Dodaj starty imbir, kmin i cynamon.",
         "Wsyp opłukaną soczewicę, dodaj pomidory, koncentrat i 1,5 l wody. Gotuj 25 minut.",
         "Dodaj odsączoną ciecierzycę i gotuj 5 minut.",
         "Mąkę rozmieszaj z odrobiną zimnej wody i wlej do zupy, mieszając. Gotuj 3 minuty, aż zgęstnieje.",
         "Dodaj natkę, sól, pieprz i sok z cytryny."],
        "W Maroku je się ją z daktylami po zachodzie słońca w ramadanie."),

    # ---------------- Indie ----------------
    R("in-dal", "Dal z czerwonej soczewicy", "Indie", ("soup", "jar"), 3, 30, ["palnik"], ["obiad"], [
        ("soczewica_czerwona", 250), ("cebula", 110), ("czosnek", 15, "3 ząbki"), ("imbir", 15), ("pomidory_puszka", 400),
        ("curry", 6, "2 łyżeczki"), ("kmin", 2), ("maslo", 20), ("sol", 4), ("ryz", 200)],
        ["Soczewicę opłucz, zalej 800 ml wody i gotuj 15 minut, aż się rozpadnie.",
         "Ugotuj ryż (jeśli masz jeden palnik, zrób to wcześniej).",
         "Na patelni roztop masło, podsmaż posiekaną cebulę, czosnek i imbir. Dodaj curry i kmin, smaż minutę.",
         "Dodaj pomidory i duś 5 minut. Przełóż wszystko do soczewicy.",
         "Gotuj razem 5 minut, dopraw solą. Podawaj z ryżem."],
        "Soczewica czerwona nie trzeba moczyć. Rozpada się sama i robi gęsty sos."),
    R("in-tikka", "Kurczak tikka masala", "Indie", ("ricebowl", "milk"), 3, 40, ["palnik"], ["obiad"], [
        ("kurczak", 450), ("jogurt", 150), ("pomidory_puszka", 400), ("smietana", 100), ("cebula", 110), ("czosnek", 10),
        ("imbir", 10), ("curry", 8), ("papryka_slodka", 4), ("maslo", 20), ("sol", 4), ("ryz", 250)],
        ["Kurczaka pokrój w kostkę i wymieszaj z jogurtem, połową curry i solą. Odstaw na 15 minut (albo na noc do lodówki).",
         "Na maśle podsmaż posiekaną cebulę, czosnek i imbir. Dodaj resztę curry i paprykę.",
         "Wrzuć kurczaka razem z marynatą i smaż 5 minut.",
         "Wlej pomidory, duś 15 minut. Wmieszaj śmietanę.",
         "Podawaj z ryżem."]),

    # ---------------- Tajlandia ----------------
    R("th-zielone-curry", "Zielone curry z kurczakiem", "Tajlandia", ("ricebowl", "leaf"), 3, 30, ["palnik"], ["obiad"], [
        ("kurczak", 400), ("mleko_kokosowe", 400, "1 puszka"), ("pasta_curry", 40, "2 łyżki"), ("cukinia", 300), ("papryka", 160),
        ("sos_sojowy", 15), ("cukier", 5), ("limonka", 30), ("olej", 10), ("ryz", 250)],
        ["Ugotuj ryż.",
         "Kurczaka pokrój w paski, cukinię i paprykę w kawałki.",
         "W garnku smaż pastę curry na oleju przez minutę. Wlej połowę mleczka kokosowego i gotuj, aż zacznie się oddzielać tłuszcz.",
         "Dodaj kurczaka, warzywa, resztę mleczka, sos sojowy i cukier. Gotuj 10 minut.",
         "Skrop limonką i podawaj z ryżem."],
        "Pasta curry bywa bardzo ostra. Zacznij od łyżki i dodaj więcej, jeśli lubisz."),
    R("th-khao-pad", "Khao pad, tajski smażony ryż", "Tajlandia", ("pan", "rice"), 2, 20, ["palnik"], ["obiad", "kolacja"], [
        ("ryz", 200, "ugotowany dzień wcześniej"), ("kurczak", 200), ("jajka", 100, "2 szt."), ("cebula", 110), ("czosnek", 10),
        ("sos_sojowy", 30, "2 łyżki"), ("cukier", 5), ("ogorek", 150), ("limonka", 30), ("olej", 20), ("dymka", 30)],
        ["Najlepiej użyć ryżu ugotowanego dzień wcześniej, bo się nie klei.",
         "Kurczaka pokrój w małe kawałki, cebulę w piórka, czosnek posiekaj.",
         "Na mocno rozgrzanym oleju smaż kurczaka 4 minuty, dodaj cebulę i czosnek.",
         "Zsuń wszystko na bok, wbij jajka i mieszaj, aż się zetną. Wsyp ryż.",
         "Dodaj sos sojowy i cukier, smaż 3 minuty. Podawaj z ogórkiem, dymką i limonką."]),

    # ---------------- Wietnam ----------------
    R("vn-pho-ga", "Phở gà, zupa z kurczakiem i makaronem", "Wietnam", ("noodles", "chicken"), 2, 40, ["palnik"], ["obiad"], [
        ("kurczak", 300), ("makaron_ryzowy", 150), ("cebula", 110), ("imbir", 30), ("cynamon", 1), ("bulion", 10),
        ("sos_sojowy", 30), ("cukier", 5), ("limonka", 60, "1 szt."), ("dymka", 30), ("natka", 10), ("chili", 1)],
        ["Cebulę przekrój na pół, imbir na plastry. Opal je na suchej patelni, aż się przypalą z jednej strony.",
         "Wrzuć do garnka z 1,2 l wody, kostką rosołową, cynamonem, sosem sojowym i cukrem. Dodaj całą pierś z kurczaka.",
         "Gotuj na małym ogniu 20 minut. Wyjmij kurczaka i porwij go na paski.",
         "Makaron zalej wrzątkiem na 5 minut i odcedź.",
         "Do misek włóż makaron i kurczaka, zalej gorącym bulionem. Dodaj dymkę, natkę, chili i limonkę."]),
    R("vn-bun", "Bún thịt, sałatka z makaronem i mięsem", "Wietnam", ("salad", "mince"), 2, 25, ["palnik"], ["obiad", "kolacja"], [
        ("makaron_ryzowy", 150), ("mielone_wieprzowe", 250), ("marchew", 80), ("ogorek", 250), ("salata", 100),
        ("czosnek", 10), ("limonka", 60), ("cukier", 20), ("sos_sojowy", 30), ("orzeszki", 30), ("olej", 10), ("chili", 1)],
        ["Sos: wymieszaj sok z limonki, 2 łyżki cukru, sos sojowy, pół szklanki wody, czosnek i chili.",
         "Makaron zalej wrzątkiem na 5 minut, przelej zimną wodą.",
         "Mięso usmaż na oleju z łyżką sosu, aż się zarumieni.",
         "Marchew i ogórek pokrój w cienkie słupki, sałatę porwij.",
         "Do miski włóż sałatę, makaron, warzywa i mięso. Polej sosem i posyp posiekanymi orzeszkami."],
        "W Wietnamie do sosu dodaje się sos rybny. Tu jest sojowy, żeby obyło się bez ryby."),

    # ---------------- Chiny ----------------
    R("cn-kungpao", "Kurczak kung pao", "Chiny", ("ricebowl", "pepper"), 2, 25, ["palnik"], ["obiad"], [
        ("kurczak", 350), ("orzeszki", 50), ("papryka", 160), ("dymka", 50), ("czosnek", 10), ("imbir", 10),
        ("sos_sojowy", 45, "3 łyżki"), ("ocet", 15, "1 łyżka"), ("cukier", 15, "1 łyżka"), ("skrobia", 10, "1 łyżka"),
        ("chili", 2), ("olej", 20), ("ryz", 200)],
        ["Ugotuj ryż.",
         "Kurczaka pokrój w kostkę i wymieszaj z łyżką sosu sojowego i skrobią.",
         "Sos: wymieszaj resztę sosu sojowego, ocet, cukier i 3 łyżki wody.",
         "Na bardzo gorącym oleju smaż kurczaka 5 minut. Dodaj paprykę, czosnek, imbir i chili, smaż 2 minuty.",
         "Wlej sos, dodaj orzeszki i dymkę. Mieszaj, aż sos zgęstnieje. Podawaj z ryżem."]),
    R("cn-pomidory-jajka", "Pomidory z jajkiem po chińsku", "Chiny", ("ricebowl", "egg"), 2, 15, ["palnik"], ["obiad", "kolacja"], [
        ("jajka", 200, "4 szt."), ("pomidory", 450, "3 szt."), ("cukier", 8, "2 łyżeczki"), ("sol", 2), ("dymka", 30),
        ("olej", 20), ("ketchup", 20, "1 łyżka"), ("ryz", 200)],
        ["Ugotuj ryż. Pomidory pokrój w ósemki.",
         "Jajka roztrzep z solą. Usmaż je na łyżce oleju w duże, miękkie kawałki i zdejmij z patelni.",
         "Na reszcie oleju smaż pomidory 3 minuty, aż puszczą sok.",
         "Dodaj cukier, ketchup i 3 łyżki wody. Wróć jajka na patelnię i wymieszaj.",
         "Posyp dymką i podawaj na ryżu."],
        "W Chinach to jedno z pierwszych dań, jakie gotuje każdy student."),

    # ---------------- Japonia ----------------
    R("jp-oyakodon", "Oyakodon, kurczak z jajkiem na ryżu", "Japonia", ("ricebowl", "onion"), 2, 25, ["palnik"], ["obiad"], [
        ("kurczak", 300), ("jajka", 150, "3 szt."), ("cebula", 110), ("sos_sojowy", 45, "3 łyżki"), ("cukier", 15, "1 łyżka"),
        ("bulion", 5, "pół kostki"), ("dymka", 20), ("ryz", 200)],
        ["Ugotuj ryż.",
         "Na patelni zagotuj 150 ml wody z pół kostki rosołowej, sosem sojowym i cukrem.",
         "Dodaj cebulę w piórkach i kurczaka w małych kawałkach. Gotuj pod przykryciem 7 minut.",
         "Jajka lekko roztrzep (niech zostaną smugi białka) i wlej na kurczaka. Przykryj i gotuj 1–2 minuty, aż prawie się zetną.",
         "Zsuń na ryż w miskach i posyp dymką."],
        "Nazwa znaczy „rodzic i dziecko”: kurczak i jajko w jednej misce."),
    R("jp-yakisoba", "Yakisoba, smażony makaron z kapustą", "Japonia", ("noodles", "leaf"), 2, 25, ["palnik"], ["obiad"], [
        ("makaron", 200), ("mielone_wieprzowe", 200), ("kapusta", 250), ("marchew", 80), ("cebula", 110),
        ("ketchup", 30, "2 łyżki"), ("sos_sojowy", 30, "2 łyżki"), ("cukier", 5), ("olej", 15)],
        ["Ugotuj makaron (najlepiej cienki, spaghetti też będzie dobre), odcedź.",
         "Sos: wymieszaj ketchup, sos sojowy, cukier i łyżkę wody.",
         "Na oleju usmaż mięso. Dodaj cebulę w piórkach, startą marchew i poszatkowaną kapustę, smaż 5 minut.",
         "Wrzuć makaron i sos. Smaż 3 minuty, mieszając, aż makaron się zarumieni.",
         "Gotowe. Jeśli masz, posyp dymką."]),

    # ---------------- Korea ----------------
    R("kr-bulgogi", "Bulgogi z kurczaka", "Korea", ("ricebowl", "carrot"), 2, 30, ["palnik"], ["obiad"], [
        ("kurczak", 350), ("sos_sojowy", 45), ("cukier", 15), ("czosnek", 15), ("imbir", 10), ("jablko", 90, "pół szt."),
        ("cebula", 110), ("marchew", 80), ("dymka", 30), ("olej", 15), ("ryz", 200)],
        ["Marynata: zetrzyj jabłko, czosnek i imbir. Wymieszaj z sosem sojowym i cukrem.",
         "Kurczaka pokrój w cienkie plastry i wymieszaj z marynatą. Odstaw na 15 minut. W tym czasie ugotuj ryż.",
         "Na mocno rozgrzanym oleju smaż kurczaka z marynatą 5 minut.",
         "Dodaj cebulę w piórkach i marchew w słupkach, smaż kolejne 5 minut, aż sos się zredukuje.",
         "Posyp dymką i podawaj na ryżu."],
        "Jabłko w marynacie zmiękcza mięso. W Korei używa się gruszki."),
    R("kr-pajeon", "Pajeon, placek z dymką", "Korea", ("pancakes", "onion"), 2, 20, ["palnik"], ["kolacja", "obiad"], [
        ("maka", 150), ("skrobia", 30), ("jajka", 50, "1 szt."), ("dymka", 100, "1 pęczek"), ("marchew", 80),
        ("olej", 30), ("sol", 2), ("sos_sojowy", 30), ("ocet", 15), ("cukier", 5), ("chili", 1)],
        ["Wymieszaj mąkę, skrobię, jajko, sól i 250 ml zimnej wody na rzadkie ciasto.",
         "Dymkę pokrój na 5-centymetrowe kawałki, marchew w cienkie słupki. Wmieszaj do ciasta.",
         "Na dobrze rozgrzanym oleju rozlej połowę ciasta na cały spód patelni.",
         "Smaż 4 minuty, przewróć i smaż 3 minuty, aż będzie chrupiący. Powtórz z resztą ciasta.",
         "Sos do maczania: sos sojowy, ocet, cukier i chili."]),

    # ---------------- Meksyk ----------------
    R("mx-quesadilla", "Quesadilla z kurczakiem i fasolą", "Meksyk", ("taco", "cheese"), 2, 25, ["palnik"], ["obiad", "kolacja"], [
        ("tortilla", 240, "4 szt."), ("kurczak", 200), ("fasola_czerwona", 240, "1 puszka"), ("kukurydza", 140, "pół puszki"),
        ("ser_zolty", 120), ("papryka_slodka", 2), ("kmin", 1), ("chili", 1), ("olej", 10), ("sol", 2)],
        ["Kurczaka pokrój w kostkę, dopraw papryką, kminem, chili i solą. Usmaż na oleju.",
         "Dodaj odsączoną fasolę i kukurydzę, podsmaż 2 minuty i lekko rozgnieć część fasoli.",
         "Na połowę tortilli nałóż farsz i starty ser, złóż na pół.",
         "Opiekaj na suchej patelni po 2–3 minuty z każdej strony, aż ser się roztopi (albo w opiekaczu).",
         "Pokrój na trójkąty."],
        "Świetnie wychodzi w opiekaczu do kanapek."),
    R("mx-huevos", "Huevos rancheros", "Meksyk", ("taco", "egg"), 2, 20, ["palnik"], ["sniadanie", "kolacja"], [
        ("tortilla", 120, "2 szt."), ("jajka", 200, "4 szt."), ("fasola_czerwona", 240, "1 puszka"), ("pomidory_puszka", 200),
        ("cebula", 55), ("czosnek", 5), ("chili", 1), ("kmin", 1), ("olej", 15), ("sol", 2)],
        ["Salsa: na oleju podsmaż cebulę z czosnkiem, dodaj pomidory, chili i sól. Duś 5 minut.",
         "Fasolę podgrzej z kminem i odrobiną wody, rozgnieć widelcem.",
         "Tortille podgrzej na suchej patelni.",
         "Usmaż jajka sadzone.",
         "Na tortillę nałóż fasolę, jajka i polej salsą."]),

    # ---------------- USA ----------------
    R("us-chili", "Chili con carne", "USA", ("pot", "pepper"), 4, 45, ["palnik"], ["obiad"], [
        ("mielone_wieprzowe", 400), ("fasola_czerwona", 480, "2 puszki"), ("pomidory_puszka", 400), ("kukurydza", 140),
        ("cebula", 110), ("papryka", 160), ("czosnek", 10), ("koncentrat", 30), ("kmin", 3), ("papryka_slodka", 4), ("chili", 2),
        ("olej", 10), ("sol", 4), ("ryz", 250)],
        ["Cebulę, paprykę i czosnek pokrój w kostkę.",
         "Na oleju usmaż mięso, dodaj warzywa i smaż 5 minut.",
         "Dodaj koncentrat i przyprawy, smaż minutę.",
         "Wlej pomidory i szklankę wody, dodaj fasolę i kukurydzę. Duś 25 minut.",
         "Podawaj z ryżem (albo z chlebem, tortillą, nachosami)."],
        "Najlepsze danie do gotowania na kilka dni. Dobrze się mrozi."),
    R("us-mac", "Mac and cheese", "USA", ("spaghetti", "cheese"), 3, 25, ["palnik"], ["obiad"], [
        ("makaron", 250), ("ser_zolty", 200), ("mleko", 400), ("maslo", 30), ("maka", 25), ("papryka_slodka", 1),
        ("sol", 3), ("pieprz", 1)],
        ["Ugotuj makaron (najlepiej rurki albo kolanka) i odcedź.",
         "W tym samym garnku roztop masło, wsyp mąkę i mieszaj minutę.",
         "Wlewaj mleko, cały czas mieszając, aż sos zgęstnieje (około 5 minut).",
         "Zdejmij z ognia, dodaj starty ser i mieszaj, aż się roztopi. Dopraw solą, pieprzem i papryką.",
         "Wmieszaj makaron. Jedz od razu."],
        "Na kolorowo: dorzuć mrożony groszek albo brokuł na ostatnie 3 minuty gotowania makaronu."),

    # ---------------- Podstawy (śniadania i kolacje do planera) ----------------
    R("pd-owsianka", "Owsianka z jabłkiem i cynamonem", "Podstawy", ("oats", "apple"), 1, 10, ["palnik"], ["sniadanie"], [
        ("platki_owsiane", 70), ("mleko", 250), ("jablko", 180, "1 szt."), ("cynamon", 1), ("cukier", 5)],
        ["Płatki zalej mlekiem i gotuj 4 minuty, mieszając.",
         "Jabłko zetrzyj albo pokrój w kostkę i wrzuć do owsianki.",
         "Dosyp cynamon i odrobinę cukru."]),
    R("pd-owsianka-banan", "Owsianka z bananem", "Podstawy", ("oats", "banana"), 1, 10, ["palnik"], ["sniadanie"], [
        ("platki_owsiane", 70), ("mleko", 250), ("banan", 120, "1 szt."), ("orzeszki", 15)],
        ["Płatki zalej mlekiem i gotuj 4 minuty.",
         "Połowę banana rozgnieć w owsiance, resztę pokrój w plasterki na wierzch.",
         "Posyp posiekanymi orzeszkami."]),
    R("pd-jajecznica", "Jajecznica z chlebem", "Podstawy", ("pan", "bread"), 1, 10, ["palnik"], ["sniadanie", "kolacja"], [
        ("jajka", 150, "3 szt."), ("maslo", 10), ("chleb", 105, "3 kromki"), ("pomidory", 150, "1 szt."), ("sol", 1), ("dymka", 10)],
        ["Na patelni roztop masło.",
         "Wbij jajka, posól i mieszaj na małym ogniu, aż się zetną, ale będą jeszcze błyszczące.",
         "Posyp dymką. Jedz z chlebem i pomidorem."]),
    R("pd-tosty", "Tosty z serem i pomidorem", "Podstawy", ("toast", "cheese"), 1, 10, ["opiekacz|palnik"], ["sniadanie", "kolacja"], [
        ("chleb_tostowy", 120, "4 kromki"), ("ser_zolty", 60), ("pomidory", 150), ("ketchup", 15), ("oregano", 1)],
        ["Na 2 kromki połóż ser i plasterki pomidora, posyp oregano.",
         "Przykryj pozostałymi kromkami.",
         "Opiekaj w opiekaczu 4 minuty. Jedz z ketchupem."]),
    R("pd-twarozek", "Twarożek z rzodkiewką na chlebie", "Podstawy", ("toast", "leaf"), 1, 10, [], ["sniadanie", "kolacja"], [
        ("twarog", 150), ("jogurt", 50), ("rzodkiewka", 75, "pół pęczka"), ("dymka", 15), ("chleb", 105, "3 kromki"), ("sol", 1), ("pieprz", 0.5)],
        ["Twaróg rozgnieć widelcem z jogurtem.",
         "Dodaj pokrojoną rzodkiewkę i dymkę, dopraw solą i pieprzem.",
         "Nałóż na chleb."]),
    R("pd-kanapki-jajko", "Kanapki z jajkiem i ogórkiem", "Podstawy", ("toast", "egg"), 1, 15, ["palnik"], ["sniadanie", "kolacja"], [
        ("jajka", 100, "2 szt."), ("chleb", 105, "3 kromki"), ("maslo", 10), ("ogorek", 100), ("sol", 1)],
        ["Jajka gotuj 9 minut, przelej zimną wodą i obierz.",
         "Chleb posmaruj masłem.",
         "Połóż plasterki jajka i ogórka, posól."]),
    R("pd-jogurt", "Jogurt z płatkami i bananem", "Podstawy", ("oats", "milk"), 1, 5, [], ["sniadanie", "kolacja"], [
        ("jogurt", 300), ("platki_owsiane", 50), ("banan", 120), ("cukier", 5)],
        ["Do miski wlej jogurt.",
         "Dosyp płatki i pokrojonego banana.",
         "Jeśli lubisz słodziej, dodaj łyżeczkę cukru albo miodu."]),
    R("pd-nalesniki", "Naleśniki z twarogiem", "Podstawy", ("crepe", "cheese"), 2, 25, ["palnik"], ["sniadanie", "kolacja"], [
        ("maka", 120), ("mleko", 250), ("jajka", 50, "1 szt."), ("olej", 15), ("sol", 1), ("twarog", 200), ("cukier", 20), ("jogurt", 50)],
        ["Wymieszaj mąkę, mleko, jajko, szczyptę soli i łyżkę oleju na gładkie, rzadkie ciasto.",
         "Smaż cienkie naleśniki na lekko natłuszczonej patelni, po minucie z każdej strony.",
         "Twaróg rozgnieć z cukrem i jogurtem.",
         "Posmaruj naleśniki twarogiem i zwiń."],
        "Ciasto możesz zrobić wieczorem i trzymać w lodówce do rana."),
    R("pd-placki-bananowe", "Placuszki bananowe", "Podstawy", ("pancakes", "banana"), 1, 15, ["palnik"], ["sniadanie"], [
        ("banan", 120, "1 dojrzały"), ("jajka", 50, "1 szt."), ("maka", 40, "2 łyżki"), ("mleko", 50), ("cynamon", 1), ("olej", 10), ("jogurt", 100)],
        ["Banana rozgnieć widelcem na papkę.",
         "Dodaj jajko, mąkę, mleko i cynamon, wymieszaj.",
         "Smaż małe placuszki na oleju po 2 minuty z każdej strony.",
         "Jedz z jogurtem."]),
    R("pd-ryz-na-mleku", "Ryż na mleku z jabłkiem", "Podstawy", ("oats", "rice"), 1, 25, ["palnik"], ["sniadanie", "kolacja"], [
        ("ryz", 70), ("mleko", 400), ("jablko", 180, "1 szt."), ("cukier", 10), ("cynamon", 1)],
        ["Ryż wsyp do zimnego mleka i zagotuj.",
         "Gotuj na bardzo małym ogniu 20 minut, często mieszając, żeby się nie przypalił.",
         "Jabłko zetrzyj, wymieszaj z cukrem i cynamonem i połóż na ryż."],
        "Wieczorem możesz ugotować podwójną porcję i rano tylko podgrzać."),
    R("pd-tosty-francuskie", "Tosty francuskie z bananem", "Podstawy", ("toast", "banana"), 1, 15, ["palnik"], ["sniadanie"], [
        ("chleb_tostowy", 120, "4 kromki"), ("jajka", 100, "2 szt."), ("mleko", 80), ("cynamon", 1), ("maslo", 10), ("banan", 120), ("cukier", 5)],
        ["Jajka roztrzep z mlekiem i cynamonem.",
         "Kromki zanurz w masie z obu stron.",
         "Smaż na maśle po 2 minuty z każdej strony, aż się zarumienią.",
         "Podawaj z plasterkami banana, posyp cukrem."]),
    R("pd-kanapki-ser", "Kanapki z serem i pomidorem", "Podstawy", ("toast", "tomato"), 1, 5, [], ["sniadanie", "kolacja"], [
        ("chleb", 140, "4 kromki"), ("maslo", 10), ("ser_zolty", 60), ("pomidory", 150, "1 szt."), ("sol", 0.5)],
        ["Chleb posmaruj masłem.",
         "Połóż plastry sera i pomidora, posól i popieprz."]),
    R("pd-jajka-miekko", "Jajka na miękko z chlebem", "Podstawy", ("pot", "egg"), 1, 10, ["palnik"], ["sniadanie"], [
        ("jajka", 150, "3 szt."), ("chleb", 105, "3 kromki"), ("maslo", 10), ("ogorek", 100), ("sol", 1)],
        ["Jajka włóż do wrzątku i gotuj 4 minuty (żółtko płynne) albo 6 minut (lekko ścięte).",
         "Przelej zimną wodą.",
         "Jedz łyżeczką z chlebem z masłem i ogórkiem."]),
]
