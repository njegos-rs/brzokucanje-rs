-- 014_add_level.sql
-- Dodaje level kolonu u scores i personal_bests,
-- ažurira unique index i trigger za vezba PB-ove.

-- ============================================================
-- 1. Dodaj level u scores
-- ============================================================
ALTER TABLE public.scores
  ADD COLUMN IF NOT EXISTS level TEXT NULL
    CHECK (level IN ('easy', 'medium', 'hard', 'expert'));

-- ============================================================
-- 2. Dodaj level u personal_bests
-- ============================================================
ALTER TABLE public.personal_bests
  ADD COLUMN IF NOT EXISTS level TEXT NULL
    CHECK (level IN ('easy', 'medium', 'hard', 'expert'));

-- ============================================================
-- 3. Ažuriraj UNIQUE index da uključi level
-- ============================================================
DROP INDEX IF EXISTS personal_bests_combo_idx;

CREATE UNIQUE INDEX personal_bests_combo_idx
  ON public.personal_bests (
    user_id,
    category,
    script,
    game_mode,
    COALESCE(timer_seconds, -1),
    strict_mode,
    COALESCE(level, '')
  );

-- ============================================================
-- 4. Ažuriraj trigger funkciju
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_pb_and_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_pb RECORD;
BEGIN
  -- ---- RANK PB + streak ----
  IF NEW.mode = 'rank' THEN
    SELECT * INTO v_current_pb
    FROM public.personal_bests
    WHERE user_id   = NEW.user_id
      AND category  = NEW.category
      AND script    = NEW.script
      AND game_mode = 'rank';

    IF NOT FOUND THEN
      INSERT INTO public.personal_bests (
        user_id, category, script, game_mode,
        timer_seconds, strict_mode, level,
        best_wpm, best_score, best_accuracy,
        achieved_at, score_id
      ) VALUES (
        NEW.user_id, NEW.category, NEW.script, 'rank',
        NULL, FALSE, NULL,
        NEW.wpm, NEW.score, NEW.accuracy,
        NEW.created_at, NEW.id
      );
    ELSIF NEW.score > v_current_pb.best_score THEN
      UPDATE public.personal_bests
      SET best_wpm      = NEW.wpm,
          best_score    = NEW.score,
          best_accuracy = NEW.accuracy,
          achieved_at   = NEW.created_at,
          score_id      = NEW.id
      WHERE id = v_current_pb.id;
    END IF;

    PERFORM update_streak(NEW.user_id, NEW.created_at);
    RETURN NEW;
  END IF;

  -- ---- VEZBA PB ----
  IF NEW.mode = 'vezba' THEN
    SELECT * INTO v_current_pb
    FROM public.personal_bests
    WHERE user_id      = NEW.user_id
      AND category     = NEW.category
      AND script       = NEW.script
      AND game_mode    = 'vezba'
      AND COALESCE(timer_seconds, -1) = COALESCE(NEW.timer_seconds, -1)
      AND strict_mode  = NEW.strict_mode
      AND COALESCE(level, '') = COALESCE(NEW.level, '');

    IF NOT FOUND THEN
      INSERT INTO public.personal_bests (
        user_id, category, script, game_mode,
        timer_seconds, strict_mode, level,
        best_wpm, best_score, best_accuracy,
        achieved_at, score_id
      ) VALUES (
        NEW.user_id, NEW.category, NEW.script, 'vezba',
        NEW.timer_seconds, NEW.strict_mode, NEW.level,
        NEW.wpm, NEW.score, NEW.accuracy,
        NEW.created_at, NEW.id
      );
    ELSIF NEW.score > v_current_pb.best_score THEN
      UPDATE public.personal_bests
      SET best_wpm      = NEW.wpm,
          best_score    = NEW.score,
          best_accuracy = NEW.accuracy,
          achieved_at   = NEW.created_at,
          score_id      = NEW.id
      WHERE id = v_current_pb.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
