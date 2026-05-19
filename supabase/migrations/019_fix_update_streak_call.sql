-- Migracije 013 i 014 pozivaju update_streak(uuid, timestamptz) koja ne postoji.
-- Ispravno ime je public.update_user_streak(uuid) definisano u 007.
-- Ova migracija zamenjuje trigger funkciju sa ispravnim pozivom.

CREATE OR REPLACE FUNCTION public.update_pb_and_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_pb RECORD;
BEGIN
  -- ---- RANK PB ----
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

    PERFORM public.update_user_streak(NEW.user_id);
    RETURN NEW;
  END IF;

  -- ---- VEZBA PB ----
  IF NEW.mode = 'vezba' THEN
    SELECT * INTO v_current_pb
    FROM public.personal_bests
    WHERE user_id     = NEW.user_id
      AND category    = NEW.category
      AND script      = NEW.script
      AND game_mode   = 'vezba'
      AND COALESCE(timer_seconds, -1) = COALESCE(NEW.timer_seconds, -1)
      AND strict_mode = NEW.strict_mode;

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
