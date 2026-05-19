-- Leaderboard rangira po pismu, ne po kategoriji.
-- Korisnik ne vidi kategoriju rank testa, pa jedan korisnik = jedan red po pismu.

DROP VIEW IF EXISTS public.v_daily_leaderboard;
DROP VIEW IF EXISTS public.v_weekly_leaderboard;
DROP VIEW IF EXISTS public.v_monthly_leaderboard;
DROP VIEW IF EXISTS public.v_yearly_leaderboard;

CREATE VIEW public.v_daily_leaderboard AS
SELECT
  s.id,
  s.user_id,
  p.username,
  s.script,
  s.category,
  s.wpm,
  s.raw_wpm,
  s.accuracy,
  s.score,
  s.created_at,
  RANK() OVER (
    PARTITION BY s.script, DATE(s.created_at AT TIME ZONE 'Europe/Belgrade')
    ORDER BY s.score DESC, s.wpm DESC
  ) AS daily_rank
FROM public.scores s
JOIN public.profiles p ON p.id = s.user_id
WHERE
  s.mode = 'rank'
  AND s.is_flagged = false
  AND s.wpm > 0
  AND s.score > 0
  AND p.is_banned = false;

CREATE VIEW public.v_weekly_leaderboard AS
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
    AVG(s.wpm) AS avg_wpm,
    AVG(s.score) AS avg_score,
    AVG(s.accuracy) AS avg_accuracy,
    COUNT(DISTINCT DATE(s.created_at AT TIME ZONE 'Europe/Belgrade')) AS active_days,
    (SELECT total_days FROM week_bounds) AS total_days
  FROM public.scores s
  JOIN public.profiles p ON p.id = s.user_id
  CROSS JOIN week_bounds wb
  WHERE
    s.mode = 'rank'
    AND s.is_flagged = false
    AND s.wpm > 0
    AND s.score > 0
    AND p.is_banned = false
    AND DATE(s.created_at AT TIME ZONE 'Europe/Belgrade') BETWEEN wb.week_start AND wb.week_end
  GROUP BY s.user_id, p.username, s.script
)
SELECT
  user_id,
  username,
  script,
  ROUND(avg_wpm::NUMERIC, 2) AS avg_wpm,
  ROUND(avg_accuracy::NUMERIC, 2) AS avg_accuracy,
  active_days,
  total_days,
  ROUND((avg_score * active_days::NUMERIC / total_days)::NUMERIC, 2) AS period_score,
  RANK() OVER (
    PARTITION BY script
    ORDER BY (avg_score * active_days::NUMERIC / total_days) DESC, avg_wpm DESC
  ) AS period_rank
FROM weekly_stats;

CREATE VIEW public.v_monthly_leaderboard AS
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
    AVG(s.wpm) AS avg_wpm,
    AVG(s.score) AS avg_score,
    AVG(s.accuracy) AS avg_accuracy,
    COUNT(DISTINCT DATE(s.created_at AT TIME ZONE 'Europe/Belgrade')) AS active_days,
    (SELECT total_days FROM month_bounds) AS total_days
  FROM public.scores s
  JOIN public.profiles p ON p.id = s.user_id
  CROSS JOIN month_bounds mb
  WHERE
    s.mode = 'rank'
    AND s.is_flagged = false
    AND s.wpm > 0
    AND s.score > 0
    AND p.is_banned = false
    AND DATE(s.created_at AT TIME ZONE 'Europe/Belgrade') BETWEEN mb.month_start AND mb.month_end
  GROUP BY s.user_id, p.username, s.script
)
SELECT
  user_id,
  username,
  script,
  ROUND(avg_wpm::NUMERIC, 2) AS avg_wpm,
  ROUND(avg_accuracy::NUMERIC, 2) AS avg_accuracy,
  active_days,
  total_days,
  ROUND((avg_score * active_days::NUMERIC / total_days)::NUMERIC, 2) AS period_score,
  RANK() OVER (
    PARTITION BY script
    ORDER BY (avg_score * active_days::NUMERIC / total_days) DESC, avg_wpm DESC
  ) AS period_rank
FROM monthly_stats;

CREATE VIEW public.v_yearly_leaderboard AS
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
    AVG(s.wpm) AS avg_wpm,
    AVG(s.score) AS avg_score,
    AVG(s.accuracy) AS avg_accuracy,
    COUNT(DISTINCT DATE(s.created_at AT TIME ZONE 'Europe/Belgrade')) AS active_days,
    (SELECT total_days FROM year_bounds) AS total_days
  FROM public.scores s
  JOIN public.profiles p ON p.id = s.user_id
  CROSS JOIN year_bounds yb
  WHERE
    s.mode = 'rank'
    AND s.is_flagged = false
    AND s.wpm > 0
    AND s.score > 0
    AND p.is_banned = false
    AND DATE(s.created_at AT TIME ZONE 'Europe/Belgrade') BETWEEN yb.year_start AND yb.year_end
  GROUP BY s.user_id, p.username, s.script
)
SELECT
  user_id,
  username,
  script,
  ROUND(avg_wpm::NUMERIC, 2) AS avg_wpm,
  ROUND(avg_accuracy::NUMERIC, 2) AS avg_accuracy,
  active_days,
  total_days,
  ROUND((avg_score * active_days::NUMERIC / total_days)::NUMERIC, 2) AS period_score,
  RANK() OVER (
    PARTITION BY script
    ORDER BY (avg_score * active_days::NUMERIC / total_days) DESC, avg_wpm DESC
  ) AS period_rank
FROM yearly_stats;

GRANT SELECT ON public.v_daily_leaderboard TO authenticated, anon;
GRANT SELECT ON public.v_weekly_leaderboard TO authenticated, anon;
GRANT SELECT ON public.v_monthly_leaderboard TO authenticated, anon;
GRANT SELECT ON public.v_yearly_leaderboard TO authenticated, anon;
