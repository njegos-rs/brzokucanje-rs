# Šema baze podataka — brzokucanje.rs

## Tabele

---

### `profiles`

Korisnički profili — automatski se kreira triggerom nakon registracije.

| Kolona | Tip | Opis |
|---|---|---|
| `id` | `uuid` (PK) | Referencira `auth.users.id` |
| `username` | `text` UNIQUE | Javno korisničko ime |
| `email` | `text` | Email adresa korisnika |
| `is_admin` | `boolean` | Da li je korisnik admin (default: false) |
| `is_banned` | `boolean` | Da li je ban-ovan (default: false) |
| `current_streak` | `integer` | Broj uzastopnih dana sa rezultatom |
| `longest_streak` | `integer` | Rekordni streak |
| `last_played_at` | `timestamptz` | Datum poslednje sesije |
| `created_at` | `timestamptz` | Datum registracije |
| `updated_at` | `timestamptz` | Poslednje ažuriranje |

**Indeksi:** `username` (unique), `is_admin`, `last_played_at`

**RLS:** Korisnik čita/menja samo sopstveni red. Admini čitaju sve. Javno: `username`, `current_streak`, `longest_streak`.

---

### `daily_texts`

Dnevni tekstovi za typing test — po jedan po kombinaciji script × difficulty.

| Kolona | Tip | Opis |
|---|---|---|
| `id` | `uuid` (PK) | |
| `date` | `date` | Datum za koji važi tekst |
| `script` | `text` | `'latinica'` ili `'cirilica'` |
| `difficulty` | `text` | `'easy'`, `'medium'`, `'hard'` |
| `text_id` | `uuid` (FK) | Referencira `text_pool.id` |
| `created_at` | `timestamptz` | |

**Indeksi:** `(date, script, difficulty)` unique

**RLS:** Svi korisnici (uključujući anonimne) čitaju. Samo sistem piše.

---

### `scores`

Svi odigrani testovi — svaka završena sesija upisuje jedan red.

| Kolona | Tip | Opis |
|---|---|---|
| `id` | `uuid` (PK) | |
| `user_id` | `uuid` (FK) | Referencira `profiles.id` |
| `daily_text_id` | `uuid` (FK) | Referencira `daily_texts.id` |
| `wpm` | `integer` | Reči po minutu |
| `accuracy` | `numeric(5,2)` | Tačnost u procentima |
| `duration_seconds` | `integer` | Trajanje testa |
| `script` | `text` | `'latinica'` ili `'cirilica'` |
| `difficulty` | `text` | Težina teksta |
| `is_flagged` | `boolean` | Anti-cheat flag (default: false) |
| `cheat_flag_reason` | `text` | Razlog flagovanja (nullable) |
| `reviewed` | `boolean` | Da li je admin pregledao (default: false) |
| `created_at` | `timestamptz` | Vreme igranja |

**Indeksi:** `user_id`, `daily_text_id`, `(is_flagged, reviewed)`, `wpm DESC` (za rang listu)

**RLS:** Korisnik čita/upisuje samo sopstvene rezultate. Admini čitaju sve. Anonimni korisnici nemaju pristup.

---

### `personal_bests`

Rekordni rezultati po korisniku × script × difficulty kombinaciji.

| Kolona | Tip | Opis |
|---|---|---|
| `id` | `uuid` (PK) | |
| `user_id` | `uuid` (FK) | Referencira `profiles.id` |
| `script` | `text` | `'latinica'` ili `'cirilica'` |
| `difficulty` | `text` | Težina |
| `best_wpm` | `integer` | Rekordni WPM |
| `best_accuracy` | `numeric(5,2)` | Tačnost pri rekordnom rezultatu |
| `score_id` | `uuid` (FK) | Referencira `scores.id` koji je postavio rekord |
| `achieved_at` | `timestamptz` | Datum postavljanja rekorda |
| `updated_at` | `timestamptz` | |

**Indeksi:** `(user_id, script, difficulty)` unique

**RLS:** Korisnik čita sopstvene. Javno čitanje za rang listu.

---

### `text_pool`

Pool svih tekstova iz kojih `generate_daily_texts()` bira dnevne tekstove.

| Kolona | Tip | Opis |
|---|---|---|
| `id` | `uuid` (PK) | |
| `content` | `text` | Tekst za kucanje |
| `script` | `text` | `'latinica'` ili `'cirilica'` |
| `difficulty` | `text` | `'easy'`, `'medium'`, `'hard'` |
| `word_count` | `integer` | Broj reči u tekstu |
| `is_active` | `boolean` | Da li je tekst aktivan u rotaciji (default: true) |
| `times_used` | `integer` | Koliko puta je izabran kao dnevni tekst |
| `last_used_at` | `timestamptz` | Poslednji put korišćen |
| `created_at` | `timestamptz` | |

**Indeksi:** `(script, difficulty, is_active)`, `last_used_at`

**RLS:** Svi čitaju aktivne tekstove. Samo admini mogu da pišu.

---

### `admin_actions`

Audit log svih admin akcija (ban, unban, brisanje teksta, itd.).

| Kolona | Tip | Opis |
|---|---|---|
| `id` | `uuid` (PK) | |
| `admin_id` | `uuid` (FK) | Admin koji je izvršio akciju (`profiles.id`) |
| `target_user_id` | `uuid` (FK, nullable) | Korisnik na koga se odnosi akcija |
| `action` | `text` | Vrsta akcije (`'ban'`, `'unban'`, `'delete_score'`, itd.) |
| `reason` | `text` | Obrazloženje admin akcije |
| `metadata` | `jsonb` | Dodatni kontekst (stare vrednosti, detalji) |
| `created_at` | `timestamptz` | |

**Indeksi:** `admin_id`, `target_user_id`, `action`, `created_at DESC`

**RLS:** Samo admini čitaju i pišu.

---

### `profanity_words`

Lista reči koje su zabranjene u korisničkim imenima.

| Kolona | Tip | Opis |
|---|---|---|
| `id` | `uuid` (PK) | |
| `word` | `text` UNIQUE | Zabranjena reč (lowercase) |
| `created_at` | `timestamptz` | |

**Indeksi:** `word` (unique)

**RLS:** Svi čitaju (potrebno za client-side validaciju). Samo admini pišu.

---

### `newsletter_campaigns`

Evidencija poslatih newsletter kampanja.

| Kolona | Tip | Opis |
|---|---|---|
| `id` | `uuid` (PK) | |
| `subject` | `text` | Naslov emaila |
| `body_html` | `text` | HTML sadržaj emaila |
| `sent_at` | `timestamptz` | Kada je poslato (nullable dok nije poslato) |
| `recipient_count` | `integer` | Broj primaoca |
| `status` | `text` | `'draft'`, `'sent'`, `'failed'` |
| `created_at` | `timestamptz` | |

**Indeksi:** `status`, `sent_at DESC`

**RLS:** Samo admini.

---

## Ključni trigeri

### `update_pb_and_streak`

Okida se `AFTER INSERT ON scores`.

**Šta radi:**
1. Provjerava da li novi `wpm` iz upisanog `scores` reda premašuje trenutni rekord u `personal_bests` za isti `(user_id, script, difficulty)`.
2. Ako da — upsertuje `personal_bests` sa novim vrednostima.
3. Ažurira `profiles.current_streak` i `profiles.longest_streak`:
   - Ako je `last_played_at` juče → streak se nastavlja (`+1`)
   - Ako je `last_played_at` danas → streak ostaje isti (duplikat isti dan)
   - Inače → streak se resetuje na `1`
4. Ažurira `profiles.last_played_at = NOW()`.

---

## Generisanje dnevnih tekstova

Funkcija `generate_daily_texts()` se poziva automatski svakog dana u ponoć (Supabase pg_cron).

**Logika:**
- Za svaku kombinaciju `script × difficulty` (6 kombinacija ukupno)
- Bira tekst iz `text_pool` koji: `is_active = true` AND `(last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '6 days')`
- Preferira tekstove koji su ređe korišćeni (`times_used ASC, last_used_at ASC NULLS FIRST`)
- Upisuje red u `daily_texts` za `CURRENT_DATE`
- Ažurira `text_pool.times_used++` i `last_used_at`
