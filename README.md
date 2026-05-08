# brzokucanje.rs

Srpski typing test — testiraj brzinu kucanja na ćirilici, latinici i bez dijakritika.

Live demo: [brzokucanje.rs](https://brzokucanje.rs) (or Vercel preview URL during development)

## Tech stack

- **Next.js 16** (App Router, TypeScript, Server Components)
- **Supabase** (PostgreSQL, Auth, Row Level Security, pg_cron)
- **Tailwind CSS 4**
- **Zustand** — global state (theme, settings, auth session)
- **Recharts** — WPM/accuracy chart on result screen
- **framer-motion** — animations (PB crown, transitions)
- **react-hot-toast** — in-app notifications
- **react-hook-form + Zod** — form validation
- **html2canvas** — result screenshot & share
- **Vitest** — unit tests (scoring, transliteration, anti-cheat logic)
- **Playwright** — E2E tests

## Local setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/brzokucanje-rs/brzokucanje-rs.git
   cd brzokucanje.rs
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env.local
   ```

   Fill in Supabase credentials (see [Environment variables](#environment-variables) below).

4. **Run database migrations**

   Open your Supabase project → SQL Editor, then paste and run the files from
   `supabase/migrations/` **in order** (001 → 007).

5. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Razvojni server (Next.js turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server locally |
| `npm run lint` | ESLint check |
| `npm test` | Vitest unit testovi |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright E2E testovi (requires running dev server) |
| `npm run test:e2e:ui` | Playwright UI mod |
| `npm run test:e2e:headed` | Playwright headed mode (visible browser) |
| `npm run test:e2e:report` | Show last Playwright HTML report |

## Project structure

```
brzokucanje.rs/
├── app/                    # Next.js App Router pages and layouts
│   ├── admin/              # Admin panel (/admin/pregled, /korisnici, /anti-cheat, …)
│   ├── api/                # API routes (score submission, leaderboard, username-check)
│   ├── rang-lista/         # Public leaderboard pages
│   ├── rank/               # RANK mode (auth-protected typing test)
│   └── vezbaj/             # VEŽBA mode (guest typing test)
├── components/             # Shared React components (TypingArea, ResultScreen, Header, …)
├── lib/                    # Business logic
│   ├── typing/             # scoring.ts, engine.ts, anti-cheat.ts, keystroke-logger.ts
│   ├── transliteration/    # latToCyr(), cyrToLat(), latToEasy() etc.
│   └── validators/         # Zod schemas, profanity filter
├── hooks/                  # Custom React hooks (useTypingEngine, useTimer)
├── stores/                 # Zustand stores (auth-store, settings-store, theme-store)
├── supabase/
│   └── migrations/         # SQL migration files (001–007), run in order
├── tests/                  # Vitest unit tests
├── tests/e2e/              # Playwright E2E specs
├── docs/                   # Project documentation
├── scripts/                # Utility scripts (scrape-words, generate-daily-text, seed)
└── public/                 # Static assets (logo, favicon, OG image)
```

## Docs

- [Database schema](docs/database-schema.md)
- [Maintenance guide](docs/maintenance.md)
- [Security audit](docs/security-audit.md)
- [Moderation guide](docs/moderation.md)

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key (safe to expose to browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — **server-side only, never expose to client** |
| `NEXT_PUBLIC_APP_URL` | Public base URL of the app (e.g. `https://brzokucanje.rs`) |

Optional (configured after Nedelja 5):

| Variable | Description |
|---|---|
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GA4 service account JSON key (server-side analytics in admin) |
| `GA4_PROPERTY_ID` | GA4 property ID (`properties/XXXXXXXXX`) |

> Never commit `.env.local`. It is listed in `.gitignore`.
