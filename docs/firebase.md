# Baza dla wspólnego domu

Wspólny dom potrzebuje jednej bazy Firebase Realtime Database (darmowy plan Spark, bez karty).
Adres bazy jest w `app/www/js/house.js` (`DB_URL`). Kto robi własną kopię apki, zakłada swoją bazę:

1. [console.firebase.google.com](https://console.firebase.google.com): nowy projekt (Gemini i Analytics niepotrzebne).
2. **Databases & Storage → Realtime Database → Create database**, lokalizacja Belgium (europe-west1), tryb zablokowany.
3. W zakładce **Rules** wklej:

```json
{
  "rules": {
    "rodziny": {
      "$id": {
        ".read": "$id.matches(/^[0-9a-f]{32}$/)",
        ".write": "$id.matches(/^[0-9a-f]{32}$/)"
      }
    }
  }
}
```

4. Adres z zakładki **Data** wpisz do `DB_URL`.

Reguły nie pozwalają przeglądać listy domów. Identyfikator domu (32 znaki) apka wylicza z kodu domu
i nie da się z niego odtworzyć kodu. Treść rekordów jest szyfrowana kluczem z kodu, więc w bazie widać
tylko szyfr i czasy zmian.
