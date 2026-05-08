# Vodič za moderaciju — brzokucanje.rs

## Anti-cheat red za pregled

Flagovani rezultati se nalaze u `/admin/anti-cheat`. Redosled pregleda: od najstarijeg ka najnovijem (FIFO).

**Koraci pregleda:**
1. Otvoriti `/admin/anti-cheat` — lista prikazuje sve rezultate sa statusom `pending`.
2. Kliknuti na rezultat da se otvori detaljna stranica (`/admin/anti-cheat/[id]`).
3. Pregledati:
   - WPM, tačnost, vrsta testa, pismo
   - Keystroke timing histogram (da li su intervali između tastera mehanički ravnomerni)
   - Istoriju korisnika (koliko testova, prethodni flagovi, datum registracije)
4. Doneti odluku: **Odobri**, **Odbaci** ili **Banuj korisnika**.

---

## Šta znači svaki flag

| Flag | Opis | Razlog |
|---|---|---|
| `wpm_over_220` | WPM > 220 — automatsko odbijanje bez pregleda | Fizički nemoguće za čoveka |
| `bot_timing` | StdDev intervala između tastera < 8ms i prosek < 50ms | Bot simulira kucanje mehanički ravnomerno |
| `identical_intervals` | Svi keystroke intervali identični | Automatizovani unos |
| `narrow_interval_band` | > 90% intervala u rasponu < 5ms | Indikator automatizacije |
| `suspicious_accuracy` | Tačnost ≥ 99% pri WPM ≥ 130 | Statistički nerealna kombinacija |
| `paste_detected` | Detektovan `paste` event u toku testa | Korisnik kopirao tekst umesto kucanja |

**Napomena:** Jedan flag nije automatski dokaz varanja — uvek gledajte kombinaciju flagova i istoriju korisnika.

---

## Odluke: Odobri / Odbaci / Banuj

### Odobri (`approve`)
- Koristiti kad pregled nije pokazao obrazac varanja.
- Primer: WPM 140 + accuracy 99% kod korisnika koji ima 200+ testova sa konzistentnim rastom.
- Rezultat se vraća na rang listu.

### Odbaci (`reject`)
- Koristiti kad je rezultat sumnjiv ali nema dovoljno dokaza za ban.
- Rezultat se uklanja sa rang liste, korisnikov nalog ostaje aktivan.
- Primer: Jedan sumnjiv test kod inače normalnog korisnika, moguća tehnička greška.

### Banuj korisnika (`ban`)
- Koristiti kad postoji jasan obrazac varanja: više flagovanih rezultata, bot keystroke timing, paste events.
- Popuniti standardizovani razlog za ban (vidi dole).
- Banovan korisnik ne može koristiti RANK mod. Može nastaviti da koristi VEŽBA mod.

---

## Razlozi za ban (standardizovana lista)

Koristiti tačno ove razloge pri banovanju — zapisuju se u audit log:

| Razlog | Kada se koristi |
|---|---|
| `bot_automation` | Bot keystroke timing, identični intervali, paste |
| `multiple_violations` | 3 ili više flagovanih rezultata u kratkom periodu |
| `account_sharing` | Više IP adresa sa nespojitvim profilima kucanja |
| `inappropriate_username` | Username koji je prošao filter ali je ipak uvredljiv |
| `harassment` | Korisnik uznemirava druge (kontakt, profil, itd.) |
| `other` | Ostalo — obavezno dodati napomenu u polje "Note" |

---

## Unban proces

1. Otvoriti `/admin/korisnici/[id]` — detaljna stranica korisnika.
2. Kliknuti **Unban** dugme.
3. Uneti kratku napomenu zašto se ban ukida (zapisuje se u audit log).
4. Akcija se beleži u `admin_actions` tabeli sa admin ID-em koji je unban izvršio.

**Kada ukloniti ban:**
- Korisnik se javio i objasnio situaciju (npr. VPN uzrokovao sumnju, greška sistema).
- Ban je bio greškom primenjen (`other` razlog).

---

## Upravljanje profanity filterom

Profanity lista se upravlja kroz `/admin/profanity`.

### Dodavanje reči
- Bulk dodavanje: uneti reči razdvojene novim redom u textarea, kliknuti **Dodaj**.
- Bulk import: CSV fajl sa kolonama `word,category`.
- Kategorije: `psovka`, `uvreda`, `spam`, `drugo`.

### Uklanjanje reči
- Search filter da pronađeš reč.
- Kliknuti **Ukloni** — akcija se beleži u audit log.

### Export
- Koristiti **Export JSON** dugme za backup liste pre većih izmena.

### Napomene
- Filter radi fuzzy matching (a→@, e→3, i→1, o→0, s→$) — nije potrebno dodavati sve varijante.
- Filter se primenjuje samo na username pri registraciji, ne na sadržaj koji korisnici kucaju.
- Sve izmene se beleže u `admin_actions` audit tabeli.
