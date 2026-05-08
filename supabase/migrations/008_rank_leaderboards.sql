-- Migracija 008: RANK mod, leaderboard VIEW-ovi, ban_user funkcija

-- ============================================================
-- 1. generate_daily_texts() PL/pgSQL funkcija
-- ============================================================
-- Drop stare verzije da se eliminiše overload konflikt (42725)
DROP FUNCTION IF EXISTS public.generate_daily_texts();
DROP FUNCTION IF EXISTS public.generate_daily_texts(DATE);

CREATE OR REPLACE FUNCTION generate_daily_texts(p_date DATE DEFAULT CURRENT_DATE + 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_script TEXT;
  v_category TEXT;
  v_text_id UUID;
  v_scripts TEXT[] := ARRAY['cirilica', 'latinica', 'easy'];
  v_categories TEXT[] := ARRAY['reci', 'recenice', 'tekst'];
BEGIN
  FOREACH v_script IN ARRAY v_scripts LOOP
    FOREACH v_category IN ARRAY v_categories LOOP
      -- Izbegavaj tekstove korišćene u poslednjih 30 dana
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

      -- Ako nema slobodnih, uzmi bilo koji
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

-- Dodaj UNIQUE constraint za daily_texts ako ne postoji
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'daily_texts_date_script_category_key'
  ) THEN
    ALTER TABLE daily_texts ADD CONSTRAINT daily_texts_date_script_category_key
      UNIQUE (date, script, category);
  END IF;
END $$;

-- ============================================================
-- 2. Leaderboard VIEW-ovi
-- ============================================================

-- Dnevni leaderboard
CREATE OR REPLACE VIEW v_daily_leaderboard AS
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
    ORDER BY s.wpm DESC
  ) AS daily_rank
FROM scores s
JOIN profiles p ON p.id = s.user_id
WHERE
  s.mode = 'rank'
  AND s.is_flagged = false
  AND p.is_banned = false;

-- Nedeljni leaderboard
CREATE OR REPLACE VIEW v_weekly_leaderboard AS
SELECT
  s.user_id,
  p.username,
  s.script,
  s.category,
  MAX(s.wpm) AS wpm,
  MAX(s.score) AS score,
  AVG(s.accuracy) AS accuracy,
  COUNT(*) AS test_count,
  RANK() OVER (
    PARTITION BY s.script, s.category,
      DATE_TRUNC('week', s.created_at AT TIME ZONE 'Europe/Belgrade')
    ORDER BY MAX(s.wpm) DESC
  ) AS weekly_rank
FROM scores s
JOIN profiles p ON p.id = s.user_id
WHERE
  s.mode = 'rank'
  AND s.is_flagged = false
  AND p.is_banned = false
GROUP BY s.user_id, p.username, s.script, s.category,
  DATE_TRUNC('week', s.created_at AT TIME ZONE 'Europe/Belgrade');

-- Mesečni leaderboard
CREATE OR REPLACE VIEW v_monthly_leaderboard AS
SELECT
  s.user_id,
  p.username,
  s.script,
  s.category,
  MAX(s.wpm) AS wpm,
  MAX(s.score) AS score,
  AVG(s.accuracy) AS accuracy,
  COUNT(*) AS test_count,
  RANK() OVER (
    PARTITION BY s.script, s.category,
      DATE_TRUNC('month', s.created_at AT TIME ZONE 'Europe/Belgrade')
    ORDER BY MAX(s.wpm) DESC
  ) AS monthly_rank
FROM scores s
JOIN profiles p ON p.id = s.user_id
WHERE
  s.mode = 'rank'
  AND s.is_flagged = false
  AND p.is_banned = false
GROUP BY s.user_id, p.username, s.script, s.category,
  DATE_TRUNC('month', s.created_at AT TIME ZONE 'Europe/Belgrade');

-- ============================================================
-- 3. ban_user() funkcija
-- ============================================================
CREATE OR REPLACE FUNCTION ban_user(
  p_admin_id UUID,
  p_user_id UUID,
  p_reason TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Proveri da admin nije banuje samog sebe
  IF p_admin_id = p_user_id THEN
    RAISE EXCEPTION 'Admin ne može da banuje samog sebe';
  END IF;

  -- Proveri da admin ima is_admin flag
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_admin_id AND is_admin = true) THEN
    RAISE EXCEPTION 'Nemate admin privilegije';
  END IF;

  UPDATE profiles
  SET
    is_banned = true,
    ban_reason = p_reason,
    banned_at = NOW(),
    banned_by = p_admin_id
  WHERE id = p_user_id;

  INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
  VALUES (
    p_admin_id,
    'ban_user',
    'profile',
    p_user_id::TEXT,
    jsonb_build_object('reason', p_reason)
  );
END;
$$;

-- unban_user() helper
CREATE OR REPLACE FUNCTION unban_user(p_admin_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_admin_id AND is_admin = true) THEN
    RAISE EXCEPTION 'Nemate admin privilegije';
  END IF;

  UPDATE profiles
  SET is_banned = false, ban_reason = NULL, banned_at = NULL, banned_by = NULL
  WHERE id = p_user_id;

  INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
  VALUES (p_admin_id, 'unban_user', 'profile', p_user_id::TEXT, '{}'::jsonb);
END;
$$;

-- ============================================================
-- 4. RLS za VIEW-ove (VIEW-ovi nasleduju RLS baznih tabela)
-- ============================================================
GRANT SELECT ON v_daily_leaderboard TO authenticated, anon;
GRANT SELECT ON v_weekly_leaderboard TO authenticated, anon;
GRANT SELECT ON v_monthly_leaderboard TO authenticated, anon;

-- ============================================================
-- 5. pg_cron schedule (zahteva pg_cron extension aktivan)
-- ============================================================
-- Pokrenuti ručno u Supabase SQL editoru nakon aktivacije pg_cron:
-- SELECT cron.schedule('generate-daily-texts', '0 0 * * *', $$ SELECT generate_daily_texts(); $$);
-- SELECT generate_daily_texts(); -- seed za sutrašnji dan odmah
