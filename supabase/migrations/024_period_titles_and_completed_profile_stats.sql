-- 024_period_titles_and_completed_profile_stats.sql
-- Uvodi zavrsene period titule za nedeljni, mesecni i godisnji rank.
-- Dnevne pobede i dalje ostaju u wins tabeli, jer se dodeljuju tek po isteku dana.

CREATE TABLE IF NOT EXISTS public.period_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  script TEXT NOT NULL CHECK (script IN ('cirilica', 'latinica', 'latinica-bez-kvacica')),
  period_score NUMERIC(8,2) NOT NULL,
  avg_wpm NUMERIC(6,2) NOT NULL,
  active_days INT NOT NULL,
  total_days INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (period_type, period_start, script)
);

ALTER TABLE public.period_titles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "period_titles_public_read" ON public.period_titles;
CREATE POLICY "period_titles_public_read"
  ON public.period_titles FOR SELECT
  USING (true);

GRANT SELECT ON public.period_titles TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.record_weekly_titles(p_reference_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
BEGIN
  -- Poziva se u ponedeljak iza ponoci sa p_reference_date = juce (nedelja).
  IF EXTRACT(ISODOW FROM p_reference_date) <> 7 THEN
    RETURN;
  END IF;

  v_week_start := DATE_TRUNC('week', p_reference_date::timestamp)::DATE;
  v_week_end := v_week_start + 6;

  INSERT INTO public.period_titles (
    user_id, period_type, period_start, period_end, script,
    period_score, avg_wpm, active_days, total_days
  )
  WITH weekly_stats AS (
    SELECT
      s.user_id,
      s.script,
      AVG(s.wpm) AS avg_wpm,
      AVG(s.score) AS avg_score,
      COUNT(DISTINCT DATE(s.created_at AT TIME ZONE 'Europe/Belgrade')) AS active_days,
      7 AS total_days
    FROM public.scores s
    JOIN public.profiles p ON p.id = s.user_id
    WHERE
      s.mode = 'rank'
      AND s.is_flagged = FALSE
      AND s.wpm > 0
      AND s.score > 0
      AND p.is_banned = FALSE
      AND DATE(s.created_at AT TIME ZONE 'Europe/Belgrade') BETWEEN v_week_start AND v_week_end
    GROUP BY s.user_id, s.script
  ),
  ranked AS (
    SELECT
      user_id,
      script,
      ROUND((avg_score * active_days::NUMERIC / total_days)::NUMERIC, 2) AS period_score,
      ROUND(avg_wpm::NUMERIC, 2) AS avg_wpm,
      active_days,
      total_days,
      RANK() OVER (
        PARTITION BY script
        ORDER BY (avg_score * active_days::NUMERIC / total_days) DESC, avg_wpm DESC
      ) AS period_rank
    FROM weekly_stats
  )
  SELECT
    user_id,
    'weekly',
    v_week_start,
    v_week_end,
    script,
    period_score,
    avg_wpm,
    active_days,
    total_days
  FROM ranked
  WHERE period_rank = 1
  ON CONFLICT (period_type, period_start, script) DO UPDATE
  SET
    user_id = EXCLUDED.user_id,
    period_end = EXCLUDED.period_end,
    period_score = EXCLUDED.period_score,
    avg_wpm = EXCLUDED.avg_wpm,
    active_days = EXCLUDED.active_days,
    total_days = EXCLUDED.total_days,
    created_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.record_monthly_titles(p_reference_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_start DATE;
  v_month_end DATE;
  v_total_days INT;
BEGIN
  -- Poziva se prvog dana sledeceg meseca sa p_reference_date = juce.
  v_month_start := DATE_TRUNC('month', p_reference_date::timestamp)::DATE;
  v_month_end := (DATE_TRUNC('month', p_reference_date::timestamp) + INTERVAL '1 month - 1 day')::DATE;

  IF p_reference_date <> v_month_end THEN
    RETURN;
  END IF;

  v_total_days := EXTRACT(DAY FROM v_month_end)::INT;

  INSERT INTO public.period_titles (
    user_id, period_type, period_start, period_end, script,
    period_score, avg_wpm, active_days, total_days
  )
  WITH monthly_stats AS (
    SELECT
      s.user_id,
      s.script,
      AVG(s.wpm) AS avg_wpm,
      AVG(s.score) AS avg_score,
      COUNT(DISTINCT DATE(s.created_at AT TIME ZONE 'Europe/Belgrade')) AS active_days,
      v_total_days AS total_days
    FROM public.scores s
    JOIN public.profiles p ON p.id = s.user_id
    WHERE
      s.mode = 'rank'
      AND s.is_flagged = FALSE
      AND s.wpm > 0
      AND s.score > 0
      AND p.is_banned = FALSE
      AND DATE(s.created_at AT TIME ZONE 'Europe/Belgrade') BETWEEN v_month_start AND v_month_end
    GROUP BY s.user_id, s.script
  ),
  ranked AS (
    SELECT
      user_id,
      script,
      ROUND((avg_score * active_days::NUMERIC / total_days)::NUMERIC, 2) AS period_score,
      ROUND(avg_wpm::NUMERIC, 2) AS avg_wpm,
      active_days,
      total_days,
      RANK() OVER (
        PARTITION BY script
        ORDER BY (avg_score * active_days::NUMERIC / total_days) DESC, avg_wpm DESC
      ) AS period_rank
    FROM monthly_stats
  )
  SELECT
    user_id,
    'monthly',
    v_month_start,
    v_month_end,
    script,
    period_score,
    avg_wpm,
    active_days,
    total_days
  FROM ranked
  WHERE period_rank = 1
  ON CONFLICT (period_type, period_start, script) DO UPDATE
  SET
    user_id = EXCLUDED.user_id,
    period_end = EXCLUDED.period_end,
    period_score = EXCLUDED.period_score,
    avg_wpm = EXCLUDED.avg_wpm,
    active_days = EXCLUDED.active_days,
    total_days = EXCLUDED.total_days,
    created_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.record_yearly_titles(p_reference_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year_start DATE;
  v_year_end DATE;
  v_total_days INT;
BEGIN
  -- Poziva se 1. januara sa p_reference_date = 31. decembar prethodne godine.
  v_year_start := DATE_TRUNC('year', p_reference_date::timestamp)::DATE;
  v_year_end := (DATE_TRUNC('year', p_reference_date::timestamp) + INTERVAL '1 year - 1 day')::DATE;

  IF p_reference_date <> v_year_end THEN
    RETURN;
  END IF;

  v_total_days := EXTRACT(DOY FROM v_year_end)::INT;

  INSERT INTO public.period_titles (
    user_id, period_type, period_start, period_end, script,
    period_score, avg_wpm, active_days, total_days
  )
  WITH yearly_stats AS (
    SELECT
      s.user_id,
      s.script,
      AVG(s.wpm) AS avg_wpm,
      AVG(s.score) AS avg_score,
      COUNT(DISTINCT DATE(s.created_at AT TIME ZONE 'Europe/Belgrade')) AS active_days,
      v_total_days AS total_days
    FROM public.scores s
    JOIN public.profiles p ON p.id = s.user_id
    WHERE
      s.mode = 'rank'
      AND s.is_flagged = FALSE
      AND s.wpm > 0
      AND s.score > 0
      AND p.is_banned = FALSE
      AND DATE(s.created_at AT TIME ZONE 'Europe/Belgrade') BETWEEN v_year_start AND v_year_end
    GROUP BY s.user_id, s.script
  ),
  ranked AS (
    SELECT
      user_id,
      script,
      ROUND((avg_score * active_days::NUMERIC / total_days)::NUMERIC, 2) AS period_score,
      ROUND(avg_wpm::NUMERIC, 2) AS avg_wpm,
      active_days,
      total_days,
      RANK() OVER (
        PARTITION BY script
        ORDER BY (avg_score * active_days::NUMERIC / total_days) DESC, avg_wpm DESC
      ) AS period_rank
    FROM yearly_stats
  )
  SELECT
    user_id,
    'yearly',
    v_year_start,
    v_year_end,
    script,
    period_score,
    avg_wpm,
    active_days,
    total_days
  FROM ranked
  WHERE period_rank = 1
  ON CONFLICT (period_type, period_start, script) DO UPDATE
  SET
    user_id = EXCLUDED.user_id,
    period_end = EXCLUDED.period_end,
    period_score = EXCLUDED.period_score,
    avg_wpm = EXCLUDED.avg_wpm,
    active_days = EXCLUDED.active_days,
    total_days = EXCLUDED.total_days,
    created_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.record_completed_period_titles(p_reference_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.record_weekly_titles(p_reference_date);
  PERFORM public.record_monthly_titles(p_reference_date);
  PERFORM public.record_yearly_titles(p_reference_date);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_weekly_titles(DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_monthly_titles(DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_yearly_titles(DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_completed_period_titles(DATE) TO service_role;

-- Predlog cron rasporeda u Supabase SQL editoru:
-- SELECT cron.schedule('record-daily-winners', '5 0 * * *', $$ SELECT public.record_daily_winners(); $$);
-- SELECT cron.schedule('record-period-titles', '10 0 * * *', $$ SELECT public.record_completed_period_titles(); $$);
