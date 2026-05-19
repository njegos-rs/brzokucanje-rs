-- 017: rename script value 'easy' → 'latinica-bez-kvacica' everywhere

-- ============================================================
-- 1. Drop unique index that references the old constraint value
--    (scores_daily_limit_idx depends on script column)
-- ============================================================
DROP INDEX IF EXISTS public.scores_daily_limit_idx;

-- ============================================================
-- 2. Update existing rows
-- ============================================================
UPDATE public.scores         SET script = 'latinica-bez-kvacica' WHERE script = 'easy';
UPDATE public.daily_texts    SET script = 'latinica-bez-kvacica' WHERE script = 'easy';
UPDATE public.personal_bests SET script = 'latinica-bez-kvacica' WHERE script = 'easy';

-- ============================================================
-- 3. Update CHECK constraints
-- ============================================================
ALTER TABLE public.scores
  DROP CONSTRAINT IF EXISTS scores_script_check,
  ADD CONSTRAINT scores_script_check
    CHECK (script IN ('cirilica', 'latinica', 'latinica-bez-kvacica'));

ALTER TABLE public.daily_texts
  DROP CONSTRAINT IF EXISTS daily_texts_script_check,
  ADD CONSTRAINT daily_texts_script_check
    CHECK (script IN ('cirilica', 'latinica', 'latinica-bez-kvacica'));

-- personal_bests has no script CHECK — no action needed

-- ============================================================
-- 4. Recreate unique index (daily limit per user/category/script/day)
-- ============================================================
CREATE UNIQUE INDEX scores_daily_limit_idx
  ON public.scores (
    user_id,
    category,
    script,
    CAST(created_at AT TIME ZONE 'Europe/Belgrade' AS date)
  )
  WHERE mode = 'rank';

-- ============================================================
-- 5. Update generate_daily_texts() — replace 'easy' with 'latinica-bez-kvacica'
-- ============================================================
DROP FUNCTION IF EXISTS public.generate_daily_texts(DATE);
DROP FUNCTION IF EXISTS public.generate_daily_texts();

CREATE OR REPLACE FUNCTION generate_daily_texts(p_date DATE DEFAULT CURRENT_DATE + 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_script TEXT;
  v_category TEXT;
  v_text_id UUID;
  v_scripts TEXT[] := ARRAY['cirilica', 'latinica', 'latinica-bez-kvacica'];
  v_categories TEXT[] := ARRAY['reci', 'recenice'];
BEGIN
  FOREACH v_script IN ARRAY v_scripts LOOP
    FOREACH v_category IN ARRAY v_categories LOOP
      SELECT tp.id INTO v_text_id
      FROM text_pool tp
      WHERE tp.is_active = true
        AND tp.category = v_category
        AND tp.id NOT IN (
          SELECT dt.text_id
          FROM daily_texts dt
          WHERE dt.script = v_script
            AND dt.category = v_category
            AND dt.date >= p_date - INTERVAL '30 days'
        )
      ORDER BY RANDOM()
      LIMIT 1;

      IF v_text_id IS NULL THEN
        SELECT id INTO v_text_id
        FROM text_pool
        WHERE is_active = true AND category = v_category
        ORDER BY RANDOM()
        LIMIT 1;
      END IF;

      IF v_text_id IS NOT NULL THEN
        INSERT INTO daily_texts (date, script, category, text_id)
        VALUES (p_date, v_script, v_category, v_text_id)
        ON CONFLICT (date, script, category) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;
