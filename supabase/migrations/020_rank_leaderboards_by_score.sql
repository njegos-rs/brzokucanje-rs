-- Rank liste se rangiraju po score-u, ne po cistom WPM-u.
-- Score = WPM sa kaznom za greske, pa korisnik vidi isti glavni broj
-- na rezultatu testa i na rang listi.

CREATE OR REPLACE VIEW public.v_daily_leaderboard AS
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
    PARTITION BY s.script, s.category, DATE(s.created_at AT TIME ZONE 'Europe/Belgrade')
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

CREATE OR REPLACE FUNCTION public.record_daily_winners(p_date DATE DEFAULT CURRENT_DATE - 1)
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
    AND s.wpm > 0
    AND s.score > 0
    AND p.is_banned = false
  ORDER BY s.script, s.category, s.score DESC, s.wpm DESC
  ON CONFLICT (win_date, script, category) DO NOTHING;
END;
$$;

CREATE OR REPLACE VIEW public.v_weekly_leaderboard AS
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
  ROUND((avg_score * active_days::NUMERIC / total_days)::NUMERIC, 2) AS period_score,
  RANK() OVER (
    PARTITION BY script, category
    ORDER BY (avg_score * active_days::NUMERIC / total_days) DESC, avg_wpm DESC
  ) AS period_rank
FROM weekly_stats;

CREATE OR REPLACE VIEW public.v_monthly_leaderboard AS
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
  ROUND((avg_score * active_days::NUMERIC / total_days)::NUMERIC, 2) AS period_score,
  RANK() OVER (
    PARTITION BY script, category
    ORDER BY (avg_score * active_days::NUMERIC / total_days) DESC, avg_wpm DESC
  ) AS period_rank
FROM monthly_stats;

CREATE OR REPLACE VIEW public.v_yearly_leaderboard AS
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
  ROUND((avg_score * active_days::NUMERIC / total_days)::NUMERIC, 2) AS period_score,
  RANK() OVER (
    PARTITION BY script, category
    ORDER BY (avg_score * active_days::NUMERIC / total_days) DESC, avg_wpm DESC
  ) AS period_rank
FROM yearly_stats;

GRANT SELECT ON public.v_daily_leaderboard TO authenticated, anon;
GRANT SELECT ON public.v_weekly_leaderboard TO authenticated, anon;
GRANT SELECT ON public.v_monthly_leaderboard TO authenticated, anon;
GRANT SELECT ON public.v_yearly_leaderboard TO authenticated, anon;
