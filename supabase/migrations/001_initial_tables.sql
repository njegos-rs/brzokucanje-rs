-- 001_initial_tables.sql
-- Kreiranje svih osnovih tabela za brzokucanje.rs

-- Proširujemo auth.users sa profilima
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  daily_limit_override INT NULL -- NULL = koristi default (1); admin može povećati
);

-- Text pool — sav content (rečnici, rečenice, citati, priče, vesti)
CREATE TABLE IF NOT EXISTS public.text_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_lat TEXT NOT NULL,      -- master verzija (latinica)
  content_cyr TEXT NOT NULL,      -- auto-generisano transliteracijom
  content_easy TEXT NOT NULL,     -- auto-generisano (bez kvačica)
  category TEXT NOT NULL CHECK (category IN ('reci', 'recenice', 'citati', 'price', 'vesti')),
  source TEXT NULL,               -- "Vikiizvor: Andric", "Wikipedia: sr", itd.
  difficulty TEXT NULL CHECK (difficulty IN ('lake', 'srednje', 'teske')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  word_count INT NULL,
  char_count INT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily texts — izabrani tekst za svaki dan, pismo i kategoriju
CREATE TABLE IF NOT EXISTS public.daily_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  script TEXT NOT NULL CHECK (script IN ('cirilica', 'latinica', 'easy')),
  category TEXT NOT NULL CHECK (category IN ('reci', 'recenice', 'citati', 'price', 'vesti')),
  text_id UUID NOT NULL REFERENCES public.text_pool(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (date, script, category)
);

-- Scores — svaki završen test
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('reci', 'recenice', 'citati', 'price', 'vesti')),
  script TEXT NOT NULL CHECK (script IN ('cirilica', 'latinica', 'easy')),
  mode TEXT NOT NULL CHECK (mode IN ('vezba', 'rank')) DEFAULT 'rank',
  wpm NUMERIC(6,2) NOT NULL,
  raw_wpm NUMERIC(6,2) NOT NULL,
  accuracy NUMERIC(5,2) NOT NULL CHECK (accuracy BETWEEN 0 AND 100),
  consistency NUMERIC(5,2) NOT NULL CHECK (consistency BETWEEN 0 AND 100),
  score NUMERIC(8,2) NOT NULL,   -- WPM * (ACC/100)^2
  duration_seconds NUMERIC(6,2) NOT NULL,
  correct_chars INT NOT NULL,
  total_chars INT NOT NULL,
  errors INT NOT NULL DEFAULT 0,
  keystroke_log JSONB NULL,       -- [{ts, char, action}] — samo RANK mod
  is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  flag_reason TEXT NULL,
  text_id UUID NULL REFERENCES public.text_pool(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily limit: 1 pokušaj po korisniku/kategoriji/pismu/danu (Beograd timezone)
CREATE UNIQUE INDEX IF NOT EXISTS scores_daily_limit_idx
  ON public.scores (
    user_id,
    category,
    script,
    CAST(created_at AT TIME ZONE 'Europe/Belgrade' AS date)
  )
  WHERE mode = 'rank';

-- Personal bests — čuvamo best per user/category/script
CREATE TABLE IF NOT EXISTS public.personal_bests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  script TEXT NOT NULL,
  best_wpm NUMERIC(6,2) NOT NULL,
  best_score NUMERIC(8,2) NOT NULL,
  best_accuracy NUMERIC(5,2) NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score_id UUID NOT NULL REFERENCES public.scores(id),
  UNIQUE (user_id, category, script)
);

-- Profanity lista (admin editable)
CREATE TABLE IF NOT EXISTS public.profanity_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT UNIQUE NOT NULL,
  added_by UUID NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log za admin akcije
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,         -- 'ban_user', 'approve_score', 'reject_score', itd.
  target_type TEXT NOT NULL,    -- 'user', 'score', 'text', itd.
  target_id TEXT NOT NULL,
  details JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
