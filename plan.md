# brzokucanje.rs — Plan implementacije (MVP v1.0)

> **Izvori:** Master Brief v3.0 (FINALNI) + Admin Panel dodatak v1.0
> **Trajanje:** 5-6 nedelja (full-time, 8h/dan)
> **Cilj:** Production-ready MVP sa Monkeytype-level UX-om, na 3 srpska pisma + admin panel

---

## 🎨 LEGENDA — KO RADI ŠTA

Ovaj plan koristi sledeće oznake. Pratimo ih dosledno kroz ceo dokument.

| Oznaka | Boja | Značenje |
|---|---|---|
| 🟢 **[PROG]** | <span style="color:#16A34A">**zelena**</span> | Programer (Claude) — kod, konfiguracija, implementacija |
| 🔵 **[KLIJ]** | <span style="color:#2563EB">**plava**</span> | Klijent (ti) — eksterni nalozi, plaćanja, content odluke, deploy keys |
| 🟠 **[OBA]** | <span style="color:#EA580C">**narandžasta**</span> | Zajedno — review, demo, odluke o scope-u |
| ⚠️ **[GATE]** | <span style="color:#DC2626">**crvena**</span> | Blokirajuća tačka — ne može dalje dok se ne završi |

> **Napomena o renderovanju boja:** GitHub markdown ne renderuje `<span style>` u svim pregledima, ali VS Code preview, web markdown viewer-i (Obsidian, Typora) i HTML export ih prikazuju. U običnom GitHub view-u boje neće biti vidljive — tada se oslanjamo na **emojiji + bold prefiks** koji uvek rade.

---

## 📋 SADRŽAJ

1. [Tehnološki stack (FIKSNO)](#1-tehnoloski-stack)
2. [MVP scope — šta jeste, šta nije](#2-mvp-scope)
3. [Pre-rad checklist (KLIJENT, blokira start)](#3-pre-rad-checklist)
4. [Faze razvoja — 6 nedelja](#4-faze-razvoja)
   - [Nedelja 1 — Setup + Supabase + Layout](#nedelja-1)
   - [Nedelja 2 — Content + Typing engine + VEŽBA](#nedelja-2)
   - [Nedelja 3 — Result screen + Auth + Admin osnovni](#nedelja-3)
   - [Nedelja 4 — RANK + Rang liste + Admin korisnici/anti-cheat](#nedelja-4)
   - [Nedelja 5 — PB/Streak + SEO + Admin sadržaj/statistike](#nedelja-5)
   - [Nedelja 6 — Polish, testovi, launch](#nedelja-6)
5. [Skill routing](#5-skill-routing)
6. [Inviolabilna pravila (NE krše se)](#6-pravila)
7. [Rizici i mitigacija](#7-rizici)
8. [Post-launch faze (samo informativno)](#8-post-launch)

---

<a name="1-tehnoloski-stack"></a>
## 1. Tehnološki stack (FIKSNO iz Master Brief-a v3.0)

| Sloj | Izbor | Napomena |
|---|---|---|
| Frontend | **Next.js 14+ (App Router)** | TypeScript obavezan |
| UI | React 18+, **Tailwind CSS + shadcn/ui** | |
| State | **Zustand** (global) + React state (typing engine) | |
| Forme | React Hook Form + Zod (preko shadcn/ui Form) | |
| Charts | **Recharts** | Result screen graf, admin grafovi |
| Auth + DB | **Supabase** (PostgreSQL) | Frankfurt region |
| Email | Supabase Auth | Custom šabloni na srpskom |
| Hosting | **Vercel** | Free hobby plan za start |
| Cron | **Supabase pg_cron** | Daily texts generation |
| Screenshot | **html2canvas** | Share rezultata |
| Animacije | framer-motion | Suptilne |
| Testovi | **Vitest** (unit) + **Playwright** (E2E) | Kritično za scoring/anti-cheat |
| Notifikacije | react-hot-toast | PB, achievements, daily limit |
| Datumi | date-fns | |
| Ikonice | Lucide React | Open source, shadcn-kompatibilno |
| Tabele (admin) | **TanStack Table** | Sortiranje, filter, paginacija |
| Analytics | **GA4** + Plausible | GA4 za admin, Plausible privacy-friendly za main sajt |

### Naming konvencija (iz briefa, sekcija 3.1)

- **Folder na disku:** `brzokucanje.rs` (sa tačkom — kako klijent traži)
- **package.json `name`:** `brzokucanje-rs` (sa crticom — Next.js zahteva)
- **GitHub repo:** `brzokucanje-rs` (privatan, klijent vlasnik)

---

<a name="2-mvp-scope"></a>
## 2. MVP scope — šta jeste, šta nije

### ✅ U MVP-u

- 3 pisma: ćirilica, latinica, easy (latinica bez kvačica)
- 2 moda: VEŽBA (guest) i RANK (auth + email verifikacija)
- 3 kategorije: reči na vreme, rečenice na vreme, tekst do kraja
- Daily limit: 1 pokušaj po kategoriji + pismu (UNIQUE INDEX, Europe/Belgrade timezone)
- 9 rang lista (3 pisma × 3 kategorije) × 3 perioda (dnevni/nedeljni/mesečni)
- **Pun Monkeytype live stats** (default minimalistički, sve konfigurabilno preko settings)
- **Monkeytype-style result screen** sa Recharts grafom (4 linije: Final WPM / Raw / Burst / Errors)
- Anti-cheat (4 sloja)
- **Personal Best tracking + Daily streak**
- Mini live ranking widget (jedinstvena feature)
- Settings panel — **6 opcija**: tema, font size, caret style, quick restart key, lazy mode, sound on/off
- Screenshot + share (html2canvas)
- **Admin panel** (7 sekcija): Pregled, Korisnici, Sadržaj, Anti-cheat, Statistike, Profanity, Newsletter (placeholder)
- **Pun keystroke log u RANK-u** (za buduć replay v1.5 + anti-cheat + dispute resolution)

### ❌ NIJE u MVP-u (kasnije faze)

| Feature | Verzija |
|---|---|
| Heatmap aktivnosti, Achievements/medalje | v1.5 |
| Replay UI funkcija (log se čuva od dana 1) | v1.5 |
| Burst heatmap, statistike po slovima, practice missed words | v1.5 |
| Live takmičenja, Custom themes builder, Sound effects, Funbox, Pace caret, Tags/Presets, Command palette | v2.0 |
| Audio diktat, Email newsletter implementacija, Pun admin panel sa rolama | v2.1 |
| Regionalna ekspanzija (HR, BA, MK) | v3.0 |

---

<a name="3-pre-rad-checklist"></a>
## 3. Pre-rad checklist — KLIJENT mora pre starta

> ⚠️ **[GATE]** — Programer ne može početi Nedelju 1 dok ovo nije dostavljeno.

### 🔵 [KLIJ] Eksterni nalozi i pristupi

- [ ] **Email adresa za Supabase admin invite** (npr. `klijent@email.com`)
  - Programer dodaje ovu email adresu kao admin-a Supabase projekta
  - Klijent prihvata invite preko emaila
- [ ] **GitHub username** za invite na privatni repo `brzokucanje-rs`
- [ ] **Vercel account email** (već postoji prema briefu)
  - Klijent kreira Vercel nalog ako ne postoji (besplatno, GitHub login)
- [ ] **Google nalog** za GA4 property (može isti kao gore)

### 🔵 [KLIJ] Plaćeni resursi (mogu posle, ne blokiraju MVP development)

- [ ] **Domen `brzokucanje.rs`** preko RNIDS registrara (mCloud, Loopia)
  - Cena: ~25-35€/godina
  - **Kad:** Pre Nedelje 6 (launch). Do tada radimo na Vercel preview URL-u.
- [ ] **Supabase Pro plan** ($25/mesec) — **samo ako prevaziđemo free tier**
  - Free tier: 500 MB DB, 50.000 MAU, 5 GB bandwidth
  - Procena: prvih 6-8 meseci dovoljan free tier

### 🔵 [KLIJ] Operativno

- [ ] **Slack ili Discord kanal** za brza pitanja (klijent kreira)
- [ ] **Sedmični check-in termin** (ponedeljak ujutru, 15 min, kratki sync)
- [ ] **Demo termin** (petak popodne, 30-45 min, kraj svake nedelje)

### 🔵 [KLIJ] Sadržaj — opciono, ne blokira

> Klijent **nema pripremljen sadržaj** prema briefu (sekcija 4). Programer pravi automatske scraping skripte za content. Klijent može dostaviti ako ima:

- [ ] (Opciono) Logo `brzokucanje.rs` i brand assets — ako ima preferencije
  - **Ako ne:** programer pravi placeholder logo (Canva/Figma) u Nedelji 6
- [ ] (Opciono) Specifični citati ili tekstovi koji moraju biti uključeni
- [ ] (Opciono) Tekst za Politiku privatnosti i Uslove korišćenja
  - **Ako ne:** koristi template prilagođen GDPR-u

### 🟢 [PROG] Pre-Nedelja 1 setup (programer)

- [ ] Verifikuj Node.js verziju (`node -v` mora biti ≥ 18.17)
- [ ] Verifikuj globalne alate: `pnpm` (preferiran package manager) ili `npm`
- [ ] Pripremi listu skill-ova iz vault-a (vidi sekciju [Skill routing](#5-skill-routing))

---

<a name="4-faze-razvoja"></a>
## 4. Faze razvoja — 6 nedelja

> **Plan iz Master Briefa v3.0 (sekcija 6) + Admin Panel dodatak (sekcija 11.1) integrisani.**
> Originalna procena: 4-5 nedelja bez admin-a, 5-6 nedelja sa admin-om. Idemo na **6 nedelja** zbog admin scope-a.

---

<a name="nedelja-1"></a>
### NEDELJA 1 — Setup, Supabase, Layout ✅

**Cilj demo-a:** Sajt deploy-ovan na Vercel preview URL. Header/footer/theme toggle rade. Supabase baza povezana, sve migracije pokrenute.

#### Ponedeljak-utorak: Project setup
- ✅ 🟢 **[PROG]** Inicijalizacija Next.js 14 projekta sa TypeScript, App Router, Tailwind, ESLint
- ✅ 🟢 **[PROG]** Instalacija svih zavisnosti (shadcn/ui init, Zustand, Recharts, Supabase client, html2canvas, framer-motion, react-hot-toast, date-fns, Lucide, TanStack Table, RHF, Zod, Vitest, Playwright)
- ✅ 🟢 **[PROG]** ESLint + Prettier konfiguracija
- ✅ 🟢 **[PROG]** Folder struktura (vidi Master Brief sekcija 3.2 — kompletna struktura već definisana)
- ✅ 🟢 **[PROG]** `.env.example` sa svim potrebnim env varijablama (placeholder vrednosti)
- ✅ 🟢 **[PROG]** README.md sa setup uputstvom

#### Sreda: GitHub + Vercel
- ✅ 🟢 **[PROG]** Inicijalni commit, push na lokalni branch
- ✅ 🔵 **[KLIJ]** **Kreirati privatni GitHub repo `brzokucanje-rs`** (klijent kao owner)
  - Klijent kreira repo na github.com → New repository → Private
  - Klijent dodaje programera kao Collaborator
- ✅ 🟢 **[PROG]** Push koda na GitHub
- ✅ 🔵 **[KLIJ]** **Povezati GitHub repo sa Vercel-om**
  - Klijent: Vercel dashboard → Add New Project → Import GitHub repo
  - Daje programeru pristup Vercel projektu (Team member)
- ✅ 🟢 **[PROG]** Vercel pipeline: auto-deploy iz `main` branch + preview deploys za PR-ove
- ✅ 🟢 **[PROG]** Vitest setup (unit testovi), Playwright setup (E2E testovi)

#### Četvrtak: Supabase
- ✅ 🔵 **[KLIJ]** **Kreirati Supabase nalog na supabase.com** (besplatan, GitHub login)
- ✅ 🔵 **[KLIJ]** **Kreirati novi Supabase projekat:**
  - Name: `brzokucanje-rs`
  - Region: **Frankfurt (eu-central-1)** — najbliži Srbiji
  - DB password: generisati jak (sačuvati u password manager-u)
  - Plan: Free tier
- ✅ 🔵 **[KLIJ]** **Dodati programera kao member** (Settings → Team → Invite member)
- ✅ 🔵 **[KLIJ]** Dostavlja programeru: **Project URL** + **anon key** + **service_role key** (preko sigurnog kanala — NE Slack/email)
- ✅ 🟢 **[PROG]** Dodaje credentials u `.env.local` (lokalno, ignored by Git) i u Vercel Environment Variables
- ✅ 🟢 **[PROG]** **Migracija 001:** Tabele (`profiles`, `daily_texts`, `scores`, `personal_bests`, `text_pool`)
- ✅ 🟢 **[PROG]** **Migracija 002:** Row Level Security (RLS) politike
- ✅ 🟢 **[PROG]** **Migracija 003:** Trigger `update_pb_and_streak()` za auto-update PB i streak
- ✅ 🟢 **[PROG]** **Migracija 004:** Admin polja (`is_admin`, `is_banned`, `ban_reason`, `banned_at`, `banned_by`) + `admin_actions` audit tabela
- ✅ 🟢 **[PROG]** **Migracija 005:** Anti-cheat dodatna polja (`flag_reviewed`, `review_decision`, `reviewed_by`, `ip_address`, `user_agent`)
- ✅ 🟢 **[PROG]** **Migracija 006:** Newsletter setup (`newsletter_subscribed`, `newsletter_campaigns` tabela)
- ✅ 🟢 **[PROG]** Test svih RLS politika preko Supabase SQL editora
- ✅ 🔵 **[KLIJ]** **Registrovati testni nalog na sajtu** (kad bude registracija u Nedelji 3) → programer postavlja `is_admin = true` ručnim SQL update-om

#### Petak: Layout i tema
- ✅ 🟢 **[PROG]** Header komponenta (logo levo, nav centar, theme toggle + login/profil desno)
- ✅ 🟢 **[PROG]** Footer komponenta (linkovi: privacy, kontakt, About)
- ✅ 🟢 **[PROG]** Theme toggle (auto/light/dark) + Zustand `theme-store.ts`
- ✅ 🟢 **[PROG]** Tailwind tokeni za boje (light + dark mode iz briefa sekcije 10.2)
  - Light: pozadina #FAFAF7, surface #FFFFFF, akcent #C27F00, ...
  - Dark: pozadina #0d0d0f, surface #1e1e24, akcent #E8B84B, ...
- ✅ 🟢 **[PROG]** Font setup: **Inter** (UI) + **JetBrains Mono** (kucanje) — verifikovati da podržavaju ćirilične glyph-ove
- ✅ 🟢 **[PROG]** Loading states, 404 page, generic error page
- ✅ 🟢 **[PROG]** Landing page (privremena, samo hero + CTA "Probaj sada")

#### Demo 1 (Petak veče)
- 🟠 **[OBA]** Demo poziv 30 min
- ✅ Sajt na Vercel preview URL-u
- ✅ Header, footer, theme toggle rade
- ✅ Supabase dashboard pokazuje sve tabele
- ✅ Klijent može da uđe u Supabase dashboard kao admin

---

<a name="nedelja-2"></a>
### NEDELJA 2 — Content priprema + Typing engine + VEŽBA ✅

**Cilj demo-a:** Funkcionalan typing test u VEŽBA modu, sva 3 pisma, sve kategorije. Klijent može da kuca, vidi live stats, restartuje. Result screen privremeno samo brojevi (bez grafa).

#### Ponedeljak: Content priprema
- ✅ 🟢 **[PROG]** Skripta `scripts/scrape-words.ts`:
  - Scrape ~5MB tekstova: Wikipedia (sr), Vikiizvor, Politika.rs, B92.net
  - Tokenizacija + frequency analiza
  - Filter: ukloni brojeve, imena, strane reči, < 3 karaktera
  - Top 1000 reči, podela laka/srednja/teška (300/400/300)
- ✅ 🟢 **[PROG]** Transliteration biblioteka `lib/transliteration/index.ts`:
  - `latToCyr()`, `latToEasy()`, `cyrToLat()`, `cyrToEasy()`
  - Vitest testovi za sve konverzije (10+ test slučajeva)
- ✅ 🟢 **[PROG]** Generiše rečnike u JSON: `lib/words/{cirilica,latinica,easy}/{lake,srednje,teske}.json`
- ✅ 🟢 **[PROG]** Kuriran content (manuelno odabran iz scraped-a):
  - 15 citata (Tesla, Andrić, Pupin, Crnjanski, Dučić — public domain)
  - 10 narodnih poslovica (Vikiizvor)
  - 8 književnih odlomaka (public domain autori)
  - 7 vesti/zanimljivosti (kratki isečci, navedeni izvor)
  - 50 generičkih rečenica (8-15 reči)
  - 5 generičkih kratkih tekstova (50-100 reči)
- ✅ 🟢 **[PROG]** Seed `text_pool` tabele (samo latinica master verzija — ostale se generišu transliteracijom)
- ✅ 🔵 **[KLIJ]** **Review content-a** — pregleda generisane rečnike i tekstove, daje feedback (npr. "ovaj citat ne valja, zameni")
  - Klijent ima 1-2 dana za review
  - Programer paralelno radi na typing engine (utorak-sreda)
  - Napomena za sledeći content pass: ponovo kurirati rečnike i tekstove sa novim izvorima srpskog jezika, bez ijekavice i bez stranih reči, uz smislenije vežba-tekstove nego trenutni pool

#### Utorak-sreda: Core typing engine
- ✅ 🟢 **[PROG]** `lib/typing/scoring.ts` — sve formule (WPM, Raw WPM, ACC, CPM, Consistency, Score)
  - **Vitest unit testovi** — minimum 80% coverage, formule iz Master Briefa sekcija 5.1
- ✅ 🟢 **[PROG]** `lib/typing/engine.ts` — core typing state machine
- ✅ 🟢 **[PROG]** `lib/typing/keystroke-logger.ts` — pun log za RANK
- ✅ 🟢 **[PROG]** `hooks/useTypingEngine.ts` — React hook
  - Keystroke handler (insert, backspace, razmak)
  - Highlight modes (letter / word)
  - Cursor pozicioniranje, blink animacija
  - Error tracking (correct / incorrect / extra / missed chars)
- ✅ 🟢 **[PROG]** `hooks/useTimer.ts` — countdown za time-based, elapsed za length-based

#### Četvrtak: VEŽBAJ stranice
- ✅ 🟢 **[PROG]** Route `/vezbaj/[pismo]/page.tsx` — server component, validuje pismo
- ✅ 🟢 **[PROG]** Komponenta `TypingArea` — 3 vidljive linije, smooth scroll
- ✅ 🟢 **[PROG]** Komponenta `WordDisplay` — boja po slovu (correct zeleno, incorrect crveno, extra...)
- ✅ 🟢 **[PROG]** Izbor kategorije (reči/rečenice/tekst) — UI tabovi
- ✅ 🟢 **[PROG]** Izbor trajanja (15s/30s/60s/120s) za time-based — segmented control
- ✅ 🟢 **[PROG]** Restart dugme + **Tab keyboard shortcut**

#### Petak: Live stats panel
- ✅ 🟢 **[PROG]** Komponenta `LiveStats` — konfigurabilna preko settings (default minimalistički = sve off osim timera)
- ✅ 🟢 **[PROG]** Live WPM, Live accuracy, Live burst — sve sa stilovima off/text/mini
- ✅ 🟢 **[PROG]** Progress bar — 5 stilova: off / bar / text / mini / flash
- ✅ 🟢 **[PROG]** Opacity (0.25, 0.5, 0.75, 1) i color settings
- ✅ 🟢 **[PROG]** Privremeni jednostavan result screen (samo brojevi — pun screen u Nedelji 3)

#### Demo 2 (Petak veče)
- 🟠 **[OBA]** Demo poziv 45 min
- ✅ Klijent kuca testove na ćirilici, latinici, easy
- ✅ Sve 3 kategorije rade (reči, rečenice, tekst)
- ✅ Timer, restart, Tab shortcut, Backspace pravila
- ✅ Live stats konfigurabilne preko privremenog settings UI
- ✅ Konzole bez errora, performansa OK na desktop-u

---

<a name="nedelja-3"></a>
### NEDELJA 3 — Result screen + Auth + Admin osnovni ✅

**Cilj demo-a:** Pun Monkeytype-style result screen sa Recharts grafom. Korisnici mogu da se registruju, verifikuju email, login. Admin panel layout sa Pregled (dashboard) sekcijom.

#### Ponedeljak-utorak: Result screen (Monkeytype-style)
- ✅ 🟢 **[PROG]** Komponenta `ResultScreen` — 3 zone (top/middle/bottom)
  - Top: WPM 48-72px + ACC 32-48px + test type
  - Hover tooltip-i sa preciznim brojevima (decimale)
- ✅ 🟢 **[PROG]** Komponenta `WpmChart` (Recharts):
  - X osa: sekunde, Y leva: WPM, Y desna: greške
  - 4 linije: Final WPM (zlatna puna), Raw WPM (zlatna isprekidana), Burst (siva), Greške (crveni X)
  - Hover tooltip prikazuje: errors, wpm, raw, burst za tu sekundu
  - Toggle dugmad: scale, raw, burst, errors
- ✅ 🟢 **[PROG]** Dodatne statistike (210/8/1/1 format): raw, characters, consistency, time
- ✅ 🟢 **[PROG]** Action dugmad sa Lucide ikonama: ChevronRight (sledeći), RotateCw (ponovi), Image (screenshot), Share2 (podeli)
- 🟢 **[PROG]** Screenshot funkcija (html2canvas, watermark "brzokucanje.rs", scale: 2 za retina)
- 🟢 **[PROG]** Share funkcija — clipboard tekst format + Twitter/FB/WhatsApp/Telegram/Copy link
- 🟢 **[PROG]** Direct link na rezultat: `/r/[id]` route + Open Graph meta tagovi

#### Sreda-četvrtak: Autentikacija
- ✅ 🟢 **[PROG]** `/registracija` — forma sa username + email + password + confirm password
  - Real-time provera dostupnosti username i email-a (debounced AJAX, `/api/username-check`)
  - Profanity filter za username (starter lista 50+ srpskih psovki)
- ✅ 🟢 **[PROG]** `lib/validators/profanity.ts` — fuzzy matching (a→@, e→3, i→1, o→0, s→$, lazy mode)
- ✅ 🟢 **[PROG]** `lib/validators/auth.ts` — Zod šeme
- ✅ 🟢 **[PROG]** Email verifikacija flow — Supabase Auth magic link
- ✅ 🟢 **[PROG]** `/prijava` (login) forma + forgot password flow
- 🟢 **[PROG]** **Custom email šabloni na srpskom** (Supabase Dashboard → Auth → Email Templates):
  - Verifikacioni email
  - Reset password email
  - (Opciono) Welcome email
- 🔵 **[KLIJ]** **Review email šablona** — pregleda kopiranje, branding, formulaciju
- ✅ 🟢 **[PROG]** `stores/auth-store.ts` — Zustand store za sesiju
- ✅ 🟢 **[PROG]** `middleware.ts` — auth check za `/rank/*`, `/profil/*`, `/admin/*`

#### Petak: Profil, Settings, Admin osnovni
- ✅ 🟢 **[PROG]** `/profil` stranica — username, email, datum registracije, ukupno testova, najbolji WPM, streak
- ✅ 🟢 **[PROG]** `/podesavanja` stranica — 6 MVP opcija:
  1. Tema (auto/light/dark)
  2. Font size (S/M/L)
  3. Caret style (off / | / ▮ / ▯ / _)
  4. Quick restart key (off / tab / esc / enter)
  5. Lazy mode toggle (ć→c, š→s, ž→z, đ→d)
  6. Sound on/off (osnovni click sound)
- ✅ 🟢 **[PROG]** `stores/settings-store.ts` — sync sa Supabase `profiles` tabelom (kad je logovan) ili localStorage (gost)
- ✅ 🟢 **[PROG]** **Admin layout** `app/admin/layout.tsx` — sidebar (7 sekcija + audit + settings) + glavni content
- ✅ 🟢 **[PROG]** **Admin Pregled (dashboard)** `/admin/pregled`:
  - 8 KPI kartica (Ukupno korisnika, Aktivni danas/7d, Testovi danas/ukupno, Posete danas/7d, Email verifikovani %)
  - 3 grafa (Aktivnost 30d, Pita pisma, WPM histogram)
  - 3 tabele (Top 10 dana, Najnoviji registrovani, Najnoviji flagovani)
- ✅ 🟢 **[PROG]** Admin middleware u `middleware.ts` — proverava `is_admin` flag
- 🔵 **[KLIJ]** **Klijent se registruje na sajtu** (preko `/registracija`)
- 🟢 **[PROG]** **Promovira klijenta u admin-a** preko SQL: `UPDATE profiles SET is_admin = true WHERE email = 'klijent@email.com';`

#### Demo 3 (Petak veče)
- 🟠 **[OBA]** Demo poziv 60 min
- ✅ Pun result screen sa grafom radi
- ✅ Klijent prolazi: registracija → email verifikacija → login → settings → profil
- ✅ Klijent ulazi u `/admin/pregled` i vidi dashboard
- ✅ Custom email-ovi stigli i izgledaju OK

---

<a name="nedelja-4"></a>
### NEDELJA 4 — RANK mod + Rang liste + Admin korisnici/anti-cheat ✅

**Cilj demo-a:** RANK takmičenje radi end-to-end. Daily limit aktivan. Rang liste (dnevna/nedeljna/mesečna) prikazuju top 10. Anti-cheat flaguje sumnjive rezultate. Admin može da pregleda korisnike i flagovane rezultate.

#### Ponedeljak: Daily texts generator
- ✅ 🟢 **[PROG]** Skripta `scripts/generate-daily-text.ts` za seed `text_pool` tabele (već urađeno u Nedelji 2, ovde finalizujemo)
- ✅ 🟢 **[PROG]** PL/pgSQL funkcija `generate_daily_texts()` — 9 tekstova (3 pisma × 3 kategorije), random select, izbegava ponavljanje 30 dana
- 🔵 **[KLIJ]** **Aktivirati pg_cron extension u Supabase Dashboard** (Database → Extensions → pg_cron → Enable)
- ✅ 🟢 **[PROG]** Postavlja cron schedule: `SELECT cron.schedule('generate-daily-texts', '0 0 * * *', $$ SELECT generate_daily_texts(); $$);`
  - **Napomena timezone:** UTC 00:00 ≈ Belgrade 01:00 zimi / 02:00 leti — koristimo UTC u cron-u, a daily limit logika koristi `Europe/Belgrade` u UNIQUE INDEX-u (već postavljeno u Migraciji 001)
- ✅ 🟢 **[PROG]** Test: ručno trigger funkcije, proveri da `daily_texts` ima 9 redova za sutra

#### Utorak-sreda: RANK mod
- ✅ 🟢 **[PROG]** Route `/rank/[pismo]/page.tsx` — auth-protected
- ✅ 🟢 **[PROG]** Daily limit check — UI feedback "Već si iskoristio dnevni pokušaj za ovu kategoriju" (UNIQUE constraint hvata duplikate na DB nivou)
- ✅ 🟢 **[PROG]** **Pun keystroke logging** — `[{ts, char, action: 'insert'|'delete'}, ...]` — čuva u `scores.keystroke_log` jsonb polju
- ✅ 🟢 **[PROG]** API route `app/api/score/route.ts` — POST sa server-side validacijom:
  - Verifikuje user iz session-a
  - Re-računa WPM/ACC iz keystroke log-a (ne veruje frontend brojevima)
  - Validira anti-cheat pravila (vidi Petak)
  - Insert u `scores` (UNIQUE INDEX hvata duplikate)
- ✅ 🟢 **[PROG]** **Mini live ranking widget** (jedinstvena feature):
  - Pozicija: gornji desni ugao iznad typing area
  - Tekst: "Trenutno: #5 od 23 danas"
  - Boja: zlatno za top 10, sivo niže
  - Animacija pulsiranja kad se pozicija promeni
  - Update preko poll na 10 sekundi
- ✅ 🟢 **[PROG]** Anti-cheat **Sloj 1** (frontend osnovno):
  - Max WPM 220 → automatsko odbijanje
  - `onPaste` handler → odbija unos, flaguje
  - Tab focus tracking → invalidira test
  - CSS `user-select: none` na typing tekstu

#### Četvrtak: Rang liste
- ✅ 🟢 **[PROG]** PostgreSQL VIEW-ovi: `v_daily_leaderboard`, `v_weekly_leaderboard`, `v_monthly_leaderboard` (iz briefa sekcija 7.4)
- ✅ 🟢 **[PROG]** API route `app/api/leaderboard/route.ts` — GET sa filterima (script, category, period)
- ✅ 🟢 **[PROG]** Route `/rang-lista/[pismo]/page.tsx` — javna stranica (SSR za SEO):
  - Tabovi: Dnevna / Nedeljna / Mesečna
  - Filter po kategoriji (reči/rečenice/tekst)
  - Top 25 rezultata
- ✅ 🟢 **[PROG]** Komponenta `LeaderboardContent` — username + WPM + ACC + score + rank, klikom na user → `/profil/[username]`

#### Petak: Anti-cheat slojevi 2-4 + Admin Korisnici/Anti-cheat
- ✅ 🟢 **[PROG]** Anti-cheat **Sloj 2** — keystroke timing analiza u `lib/typing/anti-cheat.ts`:
  - StdDev intervala — bot ima vrlo malu (svi intervali isti)
  - Ako stdDev < 8ms i prosek < 50ms → flag
  - Ako svi intervali identični → flag
  - Ako > 90% intervala u uskom rasponu → flag
- ✅ 🟢 **[PROG]** Anti-cheat **Sloj 3** — server-side u `/api/score`:
  - Tačnost ≥ 99% sa WPM ≥ 130 → flag (verovatno bot)
  - WPM > 220 → automatsko odbacivanje
- ✅ 🟢 **[PROG]** Anti-cheat **Sloj 4** — Admin UI:
  - `/admin/anti-cheat` — lista flagovanih (filter: Pending/Approved/Rejected)
  - `/admin/anti-cheat/[id]` — detalji + keystroke timing histogram
  - Akcije: Approve / Reject / Ban user / Note
- ✅ 🟢 **[PROG]** **Admin Korisnici** sekcija:
  - `/admin/korisnici` — tabela sa filterima (admin, banned, active) + search + sort
  - `/admin/korisnici/[id]` — detail page (KPI, poslednjih 50 testova, audit log)
  - Akcije: Ban (sa razlogom), Unban — log-uju u `admin_actions` tabelu
- ✅ 🟢 **[PROG]** PL/pgSQL funkcija `ban_user(p_admin_id, p_user_id, p_reason)` + `unban_user()`

#### Demo 4 (Petak veče)
- 🟠 **[OBA]** Demo poziv 60 min
- ✅ Klijent prolazi RANK test, vidi mini live ranking widget
- ✅ Pokušava drugi put isti dan — blokirano sa porukom
- ✅ Vidi rang listu, sebe na njoj
- ✅ Admin: vidi listu korisnika, ban-uje testni nalog, vidi audit log
- ✅ Anti-cheat: programer demonstrira flagovanje (skripta koja simulira bot keystroke)

---

<a name="nedelja-5"></a>
### NEDELJA 5 — PB/Streak + SEO + Admin sadržaj/statistike

**Cilj demo-a:** Personal Best animacija krune kad se premaši. Streak prikaz na profilu. SEO meta tagovi, sitemap, hreflang. Admin sekcije za sadržaj (reči/rečenice/tekstovi), profanity, statistike sa GA4.

#### Ponedeljak: Personal Best + Streak
- 🟢 **[PROG]** PB tracking već automatski preko trigger-a `update_pb_and_streak` (Migracija 003)
- 🟢 **[PROG]** UI: animacija krune (👑 Lucide Crown ikona + framer-motion bounce) na result screen-u kad je novi PB
- 🟢 **[PROG]** PB linija na grafu — horizontalna referentna linija sa labelom "PB: 84 WPM"
- 🟢 **[PROG]** Streak prikaz na `/profil` — Flame ikona + "Streak: 7 dana"
- 🟢 **[PROG]** Notifikacije (react-hot-toast):
  - "Premašio si PB! 84 WPM"
  - "Streak: 7 dana zaredom!"
- 🟢 **[PROG]** Reset streak logika — ako prošlo > 24h od poslednjeg testa, streak = 0 (već u trigger-u)

#### Utorak: SEO
- 🟢 **[PROG]** Meta tagovi po stranici (title, description, OG image) — generisani u `layout.tsx` i `page.tsx`
- 🟢 **[PROG]** `next-sitemap` paket — auto-generisan `sitemap.xml` (sve javne stranice + dinamički profili)
- 🟢 **[PROG]** `robots.txt` sa pravilima
- 🟢 **[PROG]** **hreflang tagovi** — `sr-Cyrl` i `sr-Latn` za ćiriličnu/latiničnu verziju (vežba i rang lista)
- 🟢 **[PROG]** **Schema.org JSON-LD** za WebApplication tip + Person tip (profili)
- 🟢 **[PROG]** Canonical URL na svakoj stranici
- 🟢 **[PROG]** Optimizacija slika — WebP format, lazy loading, Next.js `<Image>` komponenta
- 🟢 **[PROG]** **Lighthouse audit** + popravke do **90+ score na sve 4 kategorije** (Performance, Accessibility, Best Practices, SEO)
- 🟢 **[PROG]** SEO landing pages: `/o-nama`, `/kako-kucati-brzo` (blog-stil za long-tail keywords)

#### Sreda: Admin Sadržaj + Profanity
- 🟢 **[PROG]** **Admin Sadržaj** — `/admin/sadrzaj`:
  - KPI kartice: ukupno reči (po pismu/težini), rečenica, tekstova
  - Brzi linkovi: Reči, Rečenice, Tekstovi, Dodaj novo
- 🟢 **[PROG]** `/admin/sadrzaj/reci` — TanStack Table (filter pismo/težina, search, bulk import iz CSV/JSON, bulk edit)
- 🟢 **[PROG]** `/admin/sadrzaj/recenice` — tabela + forma (auto-transliteracija, validacija 8-15 reči)
- 🟢 **[PROG]** `/admin/sadrzaj/tekstovi` — tabela + forma (live preview u 3 pisma, validacija 50-250 reči, izvor URL)
- 🟢 **[PROG]** **Dnevni tekstovi** prikaz — narednih 30 dana zakazanih (iz `daily_texts`):
  - Klijent može: force-regenerate, zakazati specifičan tekst za određeni dan
- 🟢 **[PROG]** **Admin Profanity** — `/admin/profanity`:
  - Tabela `profanity_words` (Migracija 007 — vidi ispod)
  - Bulk dodavanje (textarea), bulk import CSV, export JSON
  - Search + filter po kategoriji (psovka/uvreda/spam/drugo)
- 🟢 **[PROG]** **Migracija 007:** `profanity_words` tabela (iz Admin dodatka 8.2)
- 🟢 **[PROG]** Refactor `lib/validators/profanity.ts` da čita iz baze umesto hardcoded liste
- 🟢 **[PROG]** Audit log za sve content akcije (`add_text`, `edit_text`, `delete_text`, `add_profanity`, `remove_profanity`)

#### Četvrtak: Admin Statistike + GA4
- 🔵 **[KLIJ]** **GA4 setup:**
  1. Kreirati GA4 property za brzokucanje.rs (analytics.google.com)
  2. Dobiti **Measurement ID** (`G-XXXXXXXXXX`) — predaje programeru
  3. Kreirati **Service Account** u Google Cloud Console (console.cloud.google.com → IAM → Service Accounts → Create)
  4. Dati Service Account-u **"Viewer" pristup** u GA4 (Admin → Property Access Management → Add user → email service account-a → role: Viewer)
  5. Download **JSON key fajl** za Service Account → predaje programeru preko sigurnog kanala
- 🟢 **[PROG]** Instalira `@google-analytics/data` paket
- 🟢 **[PROG]** GA4 tracking u Next.js (`gtag` u root layout-u, prati page views automatski)
- 🟢 **[PROG]** `lib/admin/ga4.ts` — server-side klijent za GA4 Data API
- 🟢 **[PROG]** **Admin Statistike** — `/admin/statistike` sa 5 tabova:
  1. **Aktivnost** — testovi/dan (linijski 90d), novi korisnici/dan, distribucija pisma (bar), distribucija kategorija (bar), heatmap aktivnosti po satu/danu
  2. **Engagement** — D1/D7/D30 retention, cohort analysis, DAU/WAU/MAU, DAU/MAU ratio (sticky factor), prosečno testova po useru, streak distribucija
  3. **Performanse** — prosečan WPM kroz vreme, WPM histogram, accuracy distribucija, Top 10 svih vremena, najveći skokovi
  4. **Sadržaj** — najkucanije rečenice, najteži/najlakši tekstovi, reči koje se najviše greše, distribucija dužine testova
  5. **Saobraćaj (GA4)** — sessions, page views, bounce rate, top sources, top countries, device breakdown
- 🟢 **[PROG]** **Admin Newsletter (placeholder)** — `/admin/newsletter` sa porukom "Dolazi u v2.0", subscriber count
- 🟢 **[PROG]** **Admin Audit log** — `/admin/audit` sa TanStack Table (filter admin/akcija/period, export CSV)

#### Petak: Mobilna optimizacija
- 🟢 **[PROG]** Test na realnim uređajima (iOS Safari, Chrome Android)
  - Programer testira na svom mobilu, BrowserStack/responsively.app za ostale
- 🟢 **[PROG]** Touch targets minimum 44x44px (Apple HIG)
- 🟢 **[PROG]** Responsive layout: 375px (mobile), 768px (tablet), 1024px (small laptop), 1440px (desktop)
- 🟢 **[PROG]** Mobile typing UX:
  - Mobilna tastatura — testirati da `inputmode="text"` radi
  - Visina typing area — ne sme da je preklopi virtuelna tastatura
  - Touch-friendly action dugmad
- 🟢 **[PROG]** Admin mobile responsive — sidebar collapse u hamburger, tabele → kartice

#### Demo 5 (Petak veče)
- 🟠 **[OBA]** Demo poziv 60 min
- ✅ PB animacija krune
- ✅ Streak prikaz
- ✅ Lighthouse 90+ na sve 4 kategorije
- ✅ Admin: dodaje novi tekst kroz UI, vidi GA4 statistike, vidi audit log
- ✅ Mobile UX testiran (klijent isproba na svom telefonu)

---

<a name="nedelja-6"></a>
### NEDELJA 6 — Polish, testovi, launch

**Cilj demo-a:** MVP spreman za launch. Sve E2E testove prolazi. Domen povezan (ako je klijent kupio). Politika privatnosti, cookie consent, analytics aktivni.

#### Ponedeljak-utorak: E2E testovi i bug fixing
- ✅ 🟢 **[PROG]** Playwright E2E testovi:
  - `registration.spec.ts` — pun flow registracije + email verifikacije
  - `login.spec.ts` — login + forgot password
  - `rank-submit.spec.ts` — submit rezultata, daily limit enforcement
  - `leaderboard.spec.ts` — prikaz top 10, filtriranje
  - `typing-flow.spec.ts` — pun typing test od start do result
  - `admin-flow.spec.ts` — admin login, ban user, approve flagged score
- 🟢 **[PROG]** Manualno cross-browser testiranje:
  - Chrome, Firefox, Safari, Edge na Windows/macOS
  - iOS Safari, Chrome Android
- 🟢 **[PROG]** Bug fixing iz testova
- ✅ 🟢 **[PROG]** **Pen test osnovni** (iz briefa sekcija 13.4):
  - XSS u username, profanity, content forme
  - SQL injection — Supabase RLS i prepared statements bi trebalo da pokrivaju, ali verifikujemo
  - CSRF — Next.js Server Actions automatski zaštićeni
  - Direct admin access bez sesije

#### Sreda: Launch priprema — pravna dokumenta i compliance
- ✅ 🟢 **[PROG]** Stranica `/politika-privatnosti` — GDPR-compliant template, prilagođen za Srbiju
  - Šta se prikuplja (email, username, IP, keystroke log za RANK)
  - Pravo na brisanje, pravo na izvoz podataka
  - Cookies politika
- ✅ 🟢 **[PROG]** Stranica `/uslovi-koriscenja` — fer use, anti-cheat pravila, ban-ovi, intelektualna svojina (Vikiizvor citati public domain)
- ✅ 🟢 **[PROG]** **Cookie consent banner** (GDPR) — accept all / only necessary / customize
- 🟢 **[PROG]** **Plausible analytics setup** (privacy-friendly za main sajt) — registracija + script tag
  - 🔵 **[KLIJ]** Kreira Plausible nalog (besplatno za 30 dana, ~$9/mesec posle) — daje programeru pristup
- ✅ 🟢 **[PROG]** Brand assets:
  - Logo `brzokucanje.rs` (Canva ili Figma — placeholder ako klijent nema preferencije)
  - Favicon (16x16, 32x32, 64x64) — generisan iz logoa
  - OG image (1200x630) za društvene mreže
  - 🔵 **[KLIJ]** **Review brand assets** — odobrava ili daje feedback

#### Četvrtak: Domen i SSL
- 🔵 **[KLIJ]** **Kupiti domen `brzokucanje.rs`** preko RNIDS registrara (mCloud ili Loopia)
  - Cena: ~25-35€/godina
  - Klijent prosleđuje DNS pristup programeru ili sam menja DNS
- 🟢 **[PROG]** Vercel: Add domen `brzokucanje.rs` u projektu
- 🔵 **[KLIJ]** ili 🟢 **[PROG]** Postaviti DNS rekorde:
  - A record: `76.76.21.21` (Vercel IP)
  - CNAME `www`: `cname.vercel-dns.com`
- 🟢 **[PROG]** Verifikuje SSL sertifikat aktivan (auto-issue od Vercel-a kroz Let's Encrypt)
- 🟢 **[PROG]** Update svih hardcoded URL-ova (OG tags, sitemap, canonical) na `https://brzokucanje.rs`
- 🟢 **[PROG]** Update Supabase Auth redirect URL-ova (email verifikacija, password reset) na production domen

#### Petak: Final smoke test + launch
- 🟢 **[PROG]** Production smoke test checklist:
  - [ ] Registracija → email stiže → verifikacija → login
  - [ ] Forgot password → email stiže → reset radi
  - [ ] VEŽBA test prolazi end-to-end (sva 3 pisma, sve 3 kategorije)
  - [ ] RANK test → score se čuva → pojavi na rang listi
  - [ ] Daily limit blokira drugi pokušaj
  - [ ] Anti-cheat flaguje (test sa simuliranim bot keystroke-om)
  - [ ] Admin: ban user → user ne može u RANK
  - [ ] Admin: approve flagged score → vraća se na rang listu
  - [ ] Admin: dodaje novi tekst → koristi se u RANK-u sledeći dan
  - [ ] Mobile flow (iPhone/Android)
  - [ ] Lighthouse production 90+
  - [ ] SSL aktivan, redirect HTTP→HTTPS
- ✅ 🟢 **[PROG]** Final dokumentacija:
  - README.md sa setup uputstvom
  - CONTRIBUTING.md sa pravilima
  - `docs/database-schema.md` — ER dijagram + opis tabela
  - `docs/maintenance.md` — kako dodati novi tekst, novu reč, kako ban-ovati korisnika
  - `docs/moderation.md` — kako pregledati flagovane rezultate, anti-cheat pravila
  - `.env.example` finalno
- 🔵 **[KLIJ]** **Final review** — klijent prolazi smoke test sa svoje strane
- 🔵 **[KLIJ]** **GO/NO-GO odluka za launch**
- 🟠 **[OBA]** Launch! 🚀
- 🟢 **[PROG]** Predaja credentials klijentu:
  - Supabase admin pristup (već dat u Nedelji 1)
  - Vercel pristup (već dat)
  - GitHub repo ownership (klijent već owner)
  - GA4 pristup (klijent već owner)
  - Plausible pristup
  - Domen DNS pristup

#### Demo 6 (Petak veče) — LAUNCH DEMO
- 🟠 **[OBA]** Demo poziv 60 min
- ✅ Sajt je na `https://brzokucanje.rs` (ako je domen kupljen) ili Vercel preview URL
- ✅ Sve smoke test stavke prošle
- ✅ Klijent ima pun pristup svim resursima
- ✅ Predaja dokumentacije

---

<a name="5-skill-routing"></a>
## 5. Skill routing

> **Protokol:** Step 1 (čitanje INDEX-a) i Step 2 (čitanje CATALOG sekcija) ću izvršiti **kad ti potvrdiš plan i kažeš "krećemo Nedelju 1"**. Razlog: ne učitavam catalog dok ne treba (ekonomija konteksta, sekcija 4 globalnih pravila).

### Preliminarni hint kategorija (potvrđujem nakon čitanja INDEX-a)

| Kategorija u CATALOG-u (pretpostavka) | Sub-cluster | Justifikacija |
|---|---|---|
| **next.js / app-router** | server actions, middleware, ssr, isr | Ceo sajt; SEO traži SSR |
| **supabase** | auth, rls, postgres-migrations, pg_cron, realtime | Kompletan backend stack |
| **shadcn/ui** | forms, data-table, theming | UI sistem + admin tabele |
| **tailwind** | dark-mode, custom-tokens, responsive | Design tokens iz briefa |
| **typescript** | strict-mode, generics | Quality requirement |
| **react-hook-form + zod** | validation, server-validation | Auth, content forme |
| **recharts** | line-chart, dual-y-axis, tooltips, pie, histogram | Result graf + admin grafovi |
| **html2canvas** | screenshot, watermark | Share rezultata |
| **i18n / transliteracija** | unicode, custom-mapping | ćir↔lat↔easy core feature |
| **seo-nextjs** | metadata-api, sitemap, hreflang, json-ld | Brief sekcija 9 (90+ Lighthouse) |
| **performance** | lighthouse, web-vitals, bundle-analysis | 90+ score required |
| **vercel** | env-vars, custom-domain, edge-functions | Hosting |
| **testing** | vitest, playwright, msw | Anti-cheat correctness |
| **analytics** | ga4-data-api, plausible, gdpr-cookies | Admin Statistike + main analytics |
| **accessibility** | a11y, keyboard-nav, screen-reader | Lighthouse a11y 90+ |
| **tanstack-table** | sortable, filterable, paginated | Admin tabele |
| **zustand** | persist, slices | Global state |
| **scraping** | cheerio, playwright-scrape | Content priprema (Wikipedia, Vikiizvor) |

> **⚠️ Routing pravilo (iz globalnih instrukcija sekcija 1):** Pošto je ovo **bootstrap** + skill addition kombinovano, **scope routing-a je samo na ovaj projekat**. Ne re-rutuje se ako se kasnije doda nova feature van scope-a — onda se trigger-uje "Mid-Project Skill Addition" (Section 1).

---

<a name="6-pravila"></a>
## 6. Inviolabilna pravila (NE krše se)

Iz Master Briefa v3.0 sekcija 10.3:

1. **Daily limit (1 pokušaj po kategoriji + pismu) — sveto.** UNIQUE INDEX na DB nivou, frontend samo predupređuje.
2. **Monkeytype scoring formule — bez modifikacije.** Sve formule u `lib/typing/scoring.ts` su iz Master Brief sekcije 5.1, ne menjam ih bez direktnog razgovora.
3. **Sve mora podržavati ćirilicu.** Test glyph-ova pre svakog font/library izbora.
4. **Mobile mora raditi savršeno** — 60%+ korisnika će biti mobilni.
5. **Anti-cheat — uvek server-side validacija**, nikad samo frontend. Frontend je samo prvi sloj odbrane.
6. **Test pokrivenost za scoring i transliteraciju — minimum 80%** (Vitest).
7. **Bez breaking changes na bazi posle launch-a — migracije only.** Svaka promena šeme ide kao nova migracija u `supabase/migrations/`.

---

<a name="7-rizici"></a>
## 7. Rizici i mitigacija

| Rizik | Verovatnoća | Mitigacija | Vlasnik |
|---|---|---|---|
| Ćirilični glyph-ovi nedostaju u fontu | Srednja | Test pre korišćenja, fallback fontovi (Inter ima ćirilicu, JetBrains Mono ima) | 🟢 PROG |
| Recharts performansi pri brzom kucanju | Mala | Throttle live update-ova, useMemo za computed values, render samo na kraju testa | 🟢 PROG |
| Supabase free tier limit | Niska (prvi 6m) | Pratiti storage u admin Statistike, plan za Pro upgrade ($25/mesec) | 🟠 OBA |
| Anti-cheat false positives | Srednja | Manual review queue u admin, lakša pravila u početku, observability kroz audit log | 🟠 OBA |
| Daily limit edge cases (timezone) | Mala | Konzistentno `Europe/Belgrade` u UNIQUE INDEX-u (Migracija 001), Vitest test sa različitim timezone-ovima | 🟢 PROG |
| Email verifikacija ne stiže | Mala | Supabase logs, fallback resend dugme u UI | 🟢 PROG |
| Scrapovani sadržaj copyright | Srednja | Samo public domain (Vikiizvor), kratki isečci vesti (fair use), navedeni izvori, samo public domain autori (Andrić, Crnjanski OK; živi NE) | 🟢 PROG + 🔵 KLIJ review |
| Pun Monkeytype scope u 6 nedelja | Srednja | Striktno se držati MVP scope-a, sve van scope-a → v1.5; bez "doradjivanja" v1.5 features pre kraja MVP-a | 🟢 PROG + 🟠 OBA na demo-u |
| Klijent nema content na vreme | Niska | Programer pravi automatske scraping skripte, klijent samo review-uje | 🟢 PROG |
| Klijent ne kupi domen do Nedelje 6 | Niska | Launch na Vercel preview URL, kasnije domen — bez blokiranja | 🔵 KLIJ |
| GA4 setup kompleksniji od očekivanog | Mala | Service Account proces dokumentovan, fallback na klijentski-side gtag samo (bez admin Statistika sekcije Saobraćaj u tom slučaju) | 🟢 PROG + 🔵 KLIJ |

---

<a name="8-post-launch"></a>
## 8. Post-launch faze (samo informativno, NIJE u MVP-u)

### v1.5 — Mesec posle launch-a
- Heatmap aktivnosti na profilu (kao GitHub contributions, 365 kvadratića)
- Achievements/medalje (10 osnovnih: Bronza, Srebro, Zlato, Brzo kucanje, Perfekcionista, Streak 7/30/365, Top 10, Šampion)
- Replay funkcija (UI animacija kucanja iz keystroke log-a)
- Burst heatmap u input history
- Statistike po slovima (slabe tačke profil sekcija)
- Practice missed words mod
- 2FA za admin naloge

### v2.0 — 3-4 meseca posle launch-a
- Live mesečna takmičenja (Supabase Realtime)
- Tremendous.com integracija za nagrade
- Custom themes builder
- Sound effects (typewriter, beep, mehanika)
- Funbox modovi (mirror, plus_one, simon_says)
- Pace caret
- Tags i Presets
- Command palette (Esc)
- Pun Newsletter implementacija (Resend.com / Postmark)

### v2.1 — 6 meseci posle launch-a
- Audio diktat mod (Web Speech API)
- Pun admin panel sa rolama (super-admin, moderator)
- IP whitelisting za admin

### v3.0 — Godina posle launch-a
- Regionalna ekspanzija — hrvatski, bosanski, makedonski
- Subdomen strategija ili novi domeni (`brzokucanje.hr`, `brzokucanje.ba`)
- Multi-language UI

---

## ✅ Kako pratimo plan

Predlog za sledeći korak nakon tvog odobravanja ovog plana:

1. **🟠 [OBA]** Ti pregledaš plan — daješ feedback ili "GO" za Nedelju 1
2. **⚠️ [GATE]** Pre-rad checklist (sekcija 3) — moraš dostaviti minimum:
   - Email za Supabase admin
   - GitHub username
   - Vercel email
3. **🟢 [PROG]** Ja čitam CATALOG_INDEX → CATALOG sekcije → finalizujem skill routing
4. **🟢 [PROG]** Generišem `./CLAUDE.md` u projekat folder-u (Section 0, Step 5 globalnog protokola)
5. **🟢 [PROG]** Kreiram `./.claude/skills/` i kopiram routovane skill-ove (Section 0, Step 6, sa potvrdom za sve collision-e)
6. **⚠️ [GATE]** STOP — čekam tvoju potvrdu "proceed" pre nego što krenem sa Nedeljom 1 (Section 6 — checkpoint pravilo)
7. **🟢 [PROG]** Nedelja 1 — Setup, Supabase, Layout

> **Status updates:** Svake nedelje na demo-u (petak veče) ažuriraćemo ovaj plan — checkbox ✅ pored završenih taskova, beleške gde smo odstupili, eventualne nove rizike.

---

**Verzija plana:** 1.0
**Datum:** 2026-05-07
**Autor:** Claude (Opus 4.7) na osnovu Master Brief v3.0 + Admin Panel dodatka v1.0
**Stack:** Next.js 14 + Supabase + TypeScript + Tailwind + shadcn/ui
**Trajanje:** 6 nedelja (full-time)
