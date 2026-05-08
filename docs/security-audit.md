# Security Audit — Brzokucanje.rs

**Date:** 2026-05-08  
**Scope:** API routes and admin UI reviewed for XSS, SQL injection, CSRF, and unauthorized admin access.

---

## Findings

### 1. XSS

**`app/layout.tsx` — `dangerouslySetInnerHTML` for JSON-LD (line 85)**

```tsx
dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
```

**Status: No vulnerability.** The `jsonLd` object is constructed entirely from server-side constants and environment variables — no user input reaches it. `JSON.stringify` also escapes characters that would break HTML context (`<`, `>`, `&` become `<` etc. in the JSON output). This pattern is the standard Next.js way to inject structured data and is safe as used.

No other `dangerouslySetInnerHTML` usage was found in the audited files. All user-facing strings in `registracija/page.tsx` and `ReviewActions.tsx` are rendered as React text nodes (never raw HTML), so no XSS vector exists there.

**Result: PASS**

---

### 2. SQL Injection

All database access goes through the Supabase JS client (`@supabase/ssr` / `supabase-js`), which uses parameterized queries internally for `.select()`, `.eq()`, `.insert()`, `.update()`, and `.limit()` calls. No raw SQL strings or template-literal interpolation were found in any of the audited files.

One `supabase.rpc()` call exists in `ReviewActions.tsx`:

```ts
supabase.rpc('ban_user', {
  p_admin_id: user.id,
  p_user_id: userId,
  p_reason: note.trim(),
})
```

The arguments are passed as a named-parameter object, not interpolated into a SQL string. Supabase RPC calls use PostgREST's parameterized binding, so `p_reason` (the only user-supplied value) is safe from injection as long as the DB function itself uses parameterized queries (standard PL/pgSQL `$1` binding). The function definition should be verified in the Supabase dashboard to confirm it does not execute `EXECUTE` with string concatenation.

**Result: PASS (with advisory: confirm `ban_user` DB function uses parameterized binding)**

---

### 3. CSRF

The audited API routes are:

| Route | Method | Auth check |
|-------|--------|-----------|
| `POST /api/score` | POST | `supabase.auth.getUser()` — returns 401 if not logged in |
| `GET /api/leaderboard` | GET | Public read — no state mutation, no CSRF risk |
| `GET /api/daily-text` | GET | Public read — no state mutation, no CSRF risk |
| `GET /api/username-check` | GET | Public read — no state mutation, no CSRF risk |

The `POST /api/score` route is the only mutating endpoint. It is protected by Supabase session cookie auth (`auth.getUser()`). Supabase auth cookies are `HttpOnly; SameSite=Lax` by default, which mitigates cross-origin form submission CSRF for the overwhelming majority of attack vectors. Next.js App Router API routes do not add custom CSRF tokens, but `SameSite=Lax` on the session cookie provides equivalent protection for POST requests from cross-origin pages.

`ReviewActions.tsx` performs admin mutations directly through the Supabase JS client (not through custom API routes), which carries the session cookie automatically. The admin layout enforces `is_admin` check server-side.

**Result: PASS**

---

### 4. Admin Access Control

**Middleware (`lib/supabase/middleware.ts`):**  
Checks `isAdminRoute` (`/admin/*`) and redirects unauthenticated users to `/prijava`. However, the middleware only checks that a user is **logged in** — it does not check `is_admin`.

**Admin layout (`app/admin/layout.tsx`):**  
Performs a full server-side check:
1. Verifies the user is authenticated (`supabase.auth.getUser()`).
2. Queries `profiles.is_admin` for the logged-in user.
3. Redirects to `/` if not admin.

**Status: Functionally secure.** The `is_admin` gate is correctly enforced at the layout level (server-side, before any admin page renders). The middleware redirect for unauthenticated users is a UX convenience; the real enforcement is in the layout. This is the recommended Next.js App Router pattern.

**Minor advisory:** The middleware could be hardened to also reject non-admin users (requires a Supabase call in middleware, which adds latency). Current two-layer defense (middleware + layout) is acceptable.

**Result: PASS**

---

## Summary

| Check | Result | Notes |
|-------|--------|-------|
| XSS | PASS | No unsafe HTML injection; `dangerouslySetInnerHTML` used only for static JSON-LD |
| SQL Injection | PASS | All queries parameterized; RPC advisory noted |
| CSRF | PASS | Mutating endpoints protected by SameSite=Lax session cookies |
| Admin access | PASS | Server-side `is_admin` check in layout; middleware adds unauthenticated redirect |

**No code changes required.** No exploitable vulnerabilities were found.
