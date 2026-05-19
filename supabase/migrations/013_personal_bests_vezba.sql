-- 013_personal_bests_vezba.sql
-- Dodaje timer_seconds i strict_mode u scores,
-- proširuje personal_bests da pokriva vezba mod sa svim dimenzijama.

-- ============================================================
-- 1. Dodaj timer_seconds i strict_mode u scores tabelu
-- ============================================================
ALTER TABLE public.scores
  ADD COLUMN IF NOT EXISTS timer_seconds INT NULL,       -- NULL = bez tajmera (slobodan tekst)
  ADD COLUMN IF NOT EXISTS strict_mode   BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- 2. Proširuje personal_bests sa novim dimenzijama
-- ============================================================
ALTER TABLE public.personal_bests
  ADD COLUMN IF NOT EXISTS game_mode    TEXT NOT NULL DEFAULT 'rank'
    CHECK (game_mode IN ('rank', 'vezba')),
  ADD COLUMN IF NOT EXISTS timer_seconds INT NULL,
  ADD COLUMN IF NOT EXISTS strict_mode  BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- 3. Ažuriraj UNIQUE constraint da uključi sve dimenzije
-- ============================================================
ALTER TABLE public.personal_bests
  DROP CONSTRAINT IF EXISTS personal_bests_user_id_category_script_key;

CREATE UNIQUE INDEX IF NOT EXISTS personal_bests_combo_idx
  ON public.personal_bests (
    user_id,
    category,
    script,
    game_mode,
    COALESCE(timer_seconds, -1),
    strict_mode
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
    WHERE user_id    = NEW.user_id
      AND category   = NEW.category
      AND script     = NEW.script
      AND game_mode  = 'rank';

    IF NOT FOUND THEN
      INSERT INTO public.personal_bests (
        user_id, category, script, game_mode,
        timer_seconds, strict_mode,
        best_wpm, best_score, best_accuracy,
        achieved_at, score_id
      ) VALUES (
        NEW.user_id, NEW.category, NEW.script, 'rank',
        NULL, FALSE,
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
      AND strict_mode  = NEW.strict_mode;

    IF NOT FOUND THEN
      INSERT INTO public.personal_bests (
        user_id, category, script, game_mode,
        timer_seconds, strict_mode,
        best_wpm, best_score, best_accuracy,
        achieved_at, score_id
      ) VALUES (
        NEW.user_id, NEW.category, NEW.script, 'vezba',
        NEW.timer_seconds, NEW.strict_mode,
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

-- Trigger ostaje isti naziv, samo mu je funkcija zamenjena gore.
-- DROP + CREATE nije potreban jer je CREATE OR REPLACE FUNCTION dovoljan.
