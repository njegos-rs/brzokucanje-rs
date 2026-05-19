-- 012_period_scores_wins.sql
-- Formula: period_score = avg_wpm × (aktivni_dani / ukupni_dani_perioda)
-- Wins tabela: beleži kada je korisnik bio #1 na dnevnom rangu

-- ============================================================
-- 1. Wins tabela
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  win_date DATE NOT NULL,
  script TEXT NOT NULL CHECK (script IN ('cirilica', 'latinica', 'latinica-bez-kvacica')),
  category TEXT NOT NULL CHECK (category IN ('reci', 'recenice')),
  wpm NUMERIC(6,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (win_date, script, category)  -- samo 1 pobednik po danu/pismu/kategoriji
);

ALTER TABLE public.wins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wins_public_read" ON public.wins FOR SELECT USING (true);
GRANT SELECT ON public.wins TO authenticated, anon;

-- ============================================================
-- 2. Funkcija koja beleži pobednike za dati dan
--    Poziva se svakodnevno (pg_cron) ili ručno
-- ============================================================
CREATE OR REPLACE FUNCTION record_daily_winners(p_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.wins (user_id, win_date, script, category, wpm)
  SELECT DISTINCT ON (s.script, s.category)
    s.user_id,
    DATE(s.created_at AT TIME ZONE 'Europe/Belgrade') AS win_date,
    s.script,
    s.category,
    s.wpm
  FROM public.scores s
  JOIN public.profiles p ON p.id = s.user_id
  WHERE
    DATE(s.created_at AT TIME ZONE 'Europe/Belgrade') = p_date
    AND s.mode = 'rank'
    AND s.is_flagged = false
    AND p.is_banned = false
  ORDER BY s.script, s.category, s.wpm DESC
  ON CONFLICT (win_date, script, category) DO NOTHING;
END;
$$;

-- ============================================================
-- 3. Drop starih view-ova (kolonama su promenjeni nazivi)
-- ============================================================
DROP VIEW IF EXISTS v_weekly_leaderboard;
DROP VIEW IF EXISTS v_monthly_leaderboard;

-- ============================================================
-- Nedeljni leaderboard — nova formula
--    period_score = avg_wpm × (aktivni_dani / 7)
-- ============================================================
CREATE OR REPLACE VIEW v_weekly_leaderboard AS
WITH week_bounds AS (
  SELECT
    DATE_TRUNC('week', NOW() AT TIME ZONE 'Europe/Belgrade')::DATE AS week_start,
    (DATE_TRUNC('week', NOW() AT TIME ZONE 'Europe/Belgrade') + INTERVAL '6 days')::DATE AS week_end,
    7 AS total_days
),
weekly_stats AS (
  SELECT
    s.user_id,
    p.username,
    s.script,
    s.category,
    AVG(s.wpm) AS avg_wpm,
    AVG(s.accuracy) AS avg_accuracy,
    COUNT(DISTINCT DATE(s.created_at AT TIME ZONE 'Europe/Belgrade')) AS active_days,
    (SELECT total_days FROM week_bounds) AS total_days
  FROM public.scores s
  JOIN public.profiles p ON p.id = s.user_id
  CROSS JOIN week_bounds wb
  WHERE
    s.mode = 'rank'
    AND s.is_flagged = false
    AND p.is_banned = false
    AND DATE(s.created_at AT TIME ZONE 'Europe/Belgrade') BETWEEN wb.week_start AND wb.week_end
  GROUP BY s.user_id, p.username, s.script, s.category
)
SELECT
  user_id,
  username,
  script,
  category,
  ROUND(avg_wpm::NUMERIC, 2) AS avg_wpm,
  ROUND(avg_accuracy::NUMERIC, 2) AS avg_accuracy,
  active_days,
  total_days,
  ROUND((avg_wpm * active_days::NUMERIC / total_days)::NUMERIC, 2) AS period_score,
  RANK() OVER (
    PARTITION BY script, category
    ORDER BY (avg_wpm * active_days::NUMERIC / total_days) DESC
  ) AS period_rank
FROM weekly_stats;

-- ============================================================
-- Mesečni leaderboard — nova formula
--    period_score = avg_wpm × (aktivni_dani / dana_u_mesecu)
-- ============================================================
CREATE OR REPLACE VIEW v_monthly_leaderboard AS
WITH month_bounds AS (
  SELECT
    DATE_TRUNC('month', NOW() AT TIME ZONE 'Europe/Belgrade')::DATE AS month_start,
    (DATE_TRUNC('month', NOW() AT TIME ZONE 'Europe/Belgrade') + INTERVAL '1 month - 1 day')::DATE AS month_end,
    EXTRACT(DAY FROM (DATE_TRUNC('month', NOW() AT TIME ZONE 'Europe/Belgrade') + INTERVAL '1 month - 1 day'))::INT AS total_days
),
monthly_stats AS (
  SELECT
    s.user_id,
    p.username,
    s.script,
    s.category,
    AVG(s.wpm) AS avg_wpm,
    AVG(s.accuracy) AS avg_accuracy,
    COUNT(DISTINCT DATE(s.created_at AT TIME ZONE 'Europe/Belgrade')) AS active_days,
    (SELECT total_days FROM month_bounds) AS total_days
  FROM public.scores s
  JOIN public.profiles p ON p.id = s.user_id
  CROSS JOIN month_bounds mb
  WHERE
    s.mode = 'rank'
    AND s.is_flagged = false
    AND p.is_banned = false
    AND DATE(s.created_at AT TIME ZONE 'Europe/Belgrade') BETWEEN mb.month_start AND mb.month_end
  GROUP BY s.user_id, p.username, s.script, s.category
)
SELECT
  user_id,
  username,
  script,
  category,
  ROUND(avg_wpm::NUMERIC, 2) AS avg_wpm,
  ROUND(avg_accuracy::NUMERIC, 2) AS avg_accuracy,
  active_days,
  total_days,
  ROUND((avg_wpm * active_days::NUMERIC / total_days)::NUMERIC, 2) AS period_score,
  RANK() OVER (
    PARTITION BY script, category
    ORDER BY (avg_wpm * active_days::NUMERIC / total_days) DESC
  ) AS period_rank
FROM monthly_stats;

-- ============================================================
-- Godišnji leaderboard — nova formula
--    period_score = avg_wpm × (aktivni_dani / dana_u_godini)
-- ============================================================
CREATE OR REPLACE VIEW v_yearly_leaderboard AS
WITH year_bounds AS (
  SELECT
    DATE_TRUNC('year', NOW() AT TIME ZONE 'Europe/Belgrade')::DATE AS year_start,
    (DATE_TRUNC('year', NOW() AT TIME ZONE 'Europe/Belgrade') + INTERVAL '1 year - 1 day')::DATE AS year_end,
    EXTRACT(DOY FROM (DATE_TRUNC('year', NOW() AT TIME ZONE 'Europe/Belgrade') + INTERVAL '1 year - 1 day'))::INT AS total_days
),
yearly_stats AS (
  SELECT
    s.user_id,
    p.username,
    s.script,
    s.category,
    AVG(s.wpm) AS avg_wpm,
    AVG(s.accuracy) AS avg_accuracy,
    COUNT(DISTINCT DATE(s.created_at AT TIME ZONE 'Europe/Belgrade')) AS active_days,
    (SELECT total_days FROM year_bounds) AS total_days
  FROM public.scores s
  JOIN public.profiles p ON p.id = s.user_id
  CROSS JOIN year_bounds yb
  WHERE
    s.mode = 'rank'
    AND s.is_flagged = false
    AND p.is_banned = false
    AND DATE(s.created_at AT TIME ZONE 'Europe/Belgrade') BETWEEN yb.year_start AND yb.year_end
  GROUP BY s.user_id, p.username, s.script, s.category
)
SELECT
  user_id,
  username,
  script,
  category,
  ROUND(avg_wpm::NUMERIC, 2) AS avg_wpm,
  ROUND(avg_accuracy::NUMERIC, 2) AS avg_accuracy,
  active_days,
  total_days,
  ROUND((avg_wpm * active_days::NUMERIC / total_days)::NUMERIC, 2) AS period_score,
  RANK() OVER (
    PARTITION BY script, category
    ORDER BY (avg_wpm * active_days::NUMERIC / total_days) DESC
  ) AS period_rank
FROM yearly_stats;

-- ============================================================
-- Grants
-- ============================================================
GRANT SELECT ON v_weekly_leaderboard TO authenticated, anon;
GRANT SELECT ON v_monthly_leaderboard TO authenticated, anon;
GRANT SELECT ON v_yearly_leaderboard TO authenticated, anon;

-- ============================================================
-- pg_cron: beleži pobednike svake noći u 00:05
--    Pokrenuti ručno u Supabase SQL editoru:
-- SELECT cron.schedule('record-daily-winners', '5 0 * * *', $$ SELECT record_daily_winners(); $$);
-- ============================================================
