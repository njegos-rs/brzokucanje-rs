# Vodič za održavanje — brzokucanje.rs

## Kako dodati novi tekst u text_pool

### Putem admin UI-a
1. Idi na `/admin/pregled` → tab **Tekstovi**
2. Klikni **Dodaj tekst**
3. Unesi: `content` (tekst), `script` (`latinica` ili `cirilica`), `difficulty` (`easy`/`medium`/`hard`)
4. Sačuvaj — tekst ulazi u pool sa `is_active = true`

### Direktno u bazi (SQL)
```sql
INSERT INTO text_pool (content, script, difficulty, word_count, is_active)
VALUES (
  'Novi tekst za vežbanje kucanja.',
  'latinica',   -- ili 'cirilica'
  'medium',     -- 'easy' | 'medium' | 'hard'
  5,            -- ručno izbroji ili koristi array_length
  true
);
```

---

## Kako pokrenuti generate_daily_texts() ručno

Funkcija se automatski pokreće svake noći u ponoć (pg_cron). Za ručno pokretanje:

```sql
SELECT generate_daily_texts();
```

Provjeri rezultat:
```sql
SELECT date, script, difficulty, text_id
FROM daily_texts
WHERE date = CURRENT_DATE
ORDER BY script, difficulty;
```

---

## Kako ban-ovati korisnika

### Admin UI
1. `/admin/pregled` → tab **Korisnici**
2. Pronađi korisnika po username ili email
3. Klikni **Ban** → potvrdi

### Direktan SQL
```sql
-- Postavi ban flag na profilu
UPDATE profiles
SET is_banned = true
WHERE id = '<user_uuid>';

-- Logiraj akciju
INSERT INTO admin_actions (admin_id, target_user_id, action, reason)
VALUES ('<admin_uuid>', '<user_uuid>', 'ban', 'Razlog bana');
```

Unban:
```sql
UPDATE profiles SET is_banned = false WHERE id = '<user_uuid>';
```

---

## Kako pregledati flagovane rezultate (anti-cheat queue)

```sql
-- Svi flagovani rezultati, od najnovijeg
SELECT
  s.id,
  p.username,
  s.wpm,
  s.accuracy,
  s.cheat_flag_reason,
  s.created_at
FROM scores s
JOIN profiles p ON p.id = s.user_id
WHERE s.is_flagged = true
  AND s.reviewed = false
ORDER BY s.created_at DESC;
```

### Odobri ili odbaci rezultat
```sql
-- Odobri (ukloni flag)
UPDATE scores SET is_flagged = false, reviewed = true WHERE id = '<score_uuid>';

-- Odbaci + ban korisnika
UPDATE scores SET reviewed = true WHERE id = '<score_uuid>';
UPDATE profiles SET is_banned = true WHERE id = '<user_uuid>';
```

Admin UI putanja: `/admin/pregled` → tab **Anti-cheat**

---

## Kako exportovati profanity listu (JSON)

```sql
-- Export u JSON niz
SELECT json_agg(word ORDER BY word) AS profanity_list
FROM profanity_words;
```

Za fajl export iz Supabase SQL editora: klikni **Download CSV** i konvertuj, ili koristi `psql`:

```bash
psql $DATABASE_URL -c "COPY (SELECT word FROM profanity_words ORDER BY word) TO STDOUT CSV;" > profanity.csv
```

Za JSON format direktno:
```bash
psql $DATABASE_URL -t -c "SELECT json_agg(word ORDER BY word) FROM profanity_words;" > profanity.json
```

---

## Backup procedure

### Automatski backup (Supabase)
- Supabase Pro/Team planovi: automatski Point-in-Time Recovery (PITR), zadržavanje 7–30 dana
- Provjeri status: Supabase Dashboard → **Database** → **Backups**

### Ručni export (preporučeno nedeljno)
```bash
# Puni dump
pg_dump $DATABASE_URL --no-acl --no-owner -Fc -f backup_$(date +%Y%m%d).dump

# Samo podaci (bez sheme)
pg_dump $DATABASE_URL --no-acl --no-owner --data-only -Fc -f data_$(date +%Y%m%d).dump
```

### Restore iz dumpa
```bash
pg_restore --clean --no-acl --no-owner -d $DATABASE_URL backup_20260101.dump
```

### Kritične tabele za backup monitoring
| Tabela | Prioritet | Napomena |
|---|---|---|
| `profiles` | Visok | Korisnički podaci |
| `scores` | Visok | Istorija rezultata |
| `personal_bests` | Visok | Rekordni rezultati |
| `text_pool` | Srednji | Sadržaj tekstova |
| `profanity_words` | Nizak | Lako rekonstruisati |
