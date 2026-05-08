# Contributing to brzokucanje.rs

## Branching strategy

| Branch | Purpose |
|---|---|
| `main` | Production — auto-deploys to Vercel. Never push directly. |
| `feature/*` | New features (e.g. `feature/achievements`) |
| `fix/*` | Bug fixes (e.g. `fix/daily-limit-timezone`) |

All work goes through pull requests into `main`. PRs require passing CI (lint + build + unit tests).

## Dev environment

```bash
npm install
cp .env.example .env.local   # fill in Supabase credentials
npm run dev                   # http://localhost:3000
```

Run E2E tests against the running dev server:

```bash
npm run test:e2e
```

## Code style

- **TypeScript strict mode** — no `any`, no non-null assertions without a comment explaining why.
- **Tailwind CSS variables only** — use CSS tokens defined in `tailwind.config` (e.g. `bg-surface`, `text-accent`). No hardcoded hex colors or arbitrary Tailwind values.
- **Serbian strings in UI** — all user-facing text is in Serbian. No English strings in `app/` or `components/`. English is fine in comments and internal identifiers.
- **Prettier** is configured — run `npm run lint` before committing. CI will fail on lint errors.
- **Components** go in `components/`, business logic in `lib/`, hooks in `hooks/`, Zustand stores in `stores/`.

## Commit message format

```
type: short description in English or Serbian
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `style`

Examples:
```
feat: add PB crown animation on result screen
fix: daily limit edge case across midnight in Belgrade timezone
chore: update Playwright to 1.59
docs: add moderation guide
test: E2E spec for admin ban flow
```

Keep the subject line under 72 characters. Add a body if context is needed.

## Database changes

- **Always** create a new migration file in `supabase/migrations/` — never alter the production database directly.
- Name format: `NNN_short_description.sql` (e.g. `008_add_streak_reset_flag.sql`).
- Migrations must be idempotent where possible (`CREATE TABLE IF NOT EXISTS`, `DO $$ BEGIN ... EXCEPTION WHEN ... END $$`).
- Test locally by running the migration in the Supabase SQL editor before submitting a PR.

## Adding new words or texts

Use the admin UI (`/admin/sadrzaj`) or seed scripts (`scripts/`). Do not insert content via direct database edits in production.

## Test requirements

- **Unit tests (Vitest):** required for any changes to `lib/typing/scoring.ts`, `lib/typing/anti-cheat.ts`, or `lib/transliteration/`. Minimum 80% coverage on those modules.
- **E2E tests (Playwright):** required for any new user-facing flow (new page, new auth step, new admin action).
- Run `npm test` and `npm run test:e2e` locally before opening a PR.

## PR checklist

Before requesting review, confirm:

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` completes successfully
- [ ] `npm test` passes (all unit tests green)
- [ ] E2E tests added or updated for any new user flow
- [ ] No hardcoded colors (use Tailwind tokens)
- [ ] No English strings in user-facing UI
- [ ] Database changes have a new migration file
- [ ] `.env.example` updated if new env vars were added
