-- 023_restore_pb_modes_and_streak.sql
-- Vraca kompletnu PB logiku za rank + vezba i ponovo ukljucuje streak update,
-- ali i dalje preskace placeholder rank pokusaje (wpm/score = 0).

CREATE OR REPLACE FUNCTION public.update_pb_and_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_pb RECORD;
BEGIN
  IF NEW.mode = 'rank' THEN
    IF NEW.wpm <= 0 OR NEW.score <= 0 THEN
      RETURN NEW;
    END IF;

    SELECT * INTO v_current_pb
    FROM public.personal_bests
    WHERE user_id = NEW.user_id
      AND category = NEW.category
      AND script = NEW.script
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
      SET
        best_wpm = NEW.wpm,
        best_score = NEW.score,
        best_accuracy = NEW.accuracy,
        achieved_at = NEW.created_at,
        score_id = NEW.id
      WHERE id = v_current_pb.id;
    END IF;

    PERFORM public.update_user_streak(NEW.user_id);
    RETURN NEW;
  END IF;

  IF NEW.mode = 'vezba' THEN
    SELECT * INTO v_current_pb
    FROM public.personal_bests
    WHERE user_id = NEW.user_id
      AND category = NEW.category
      AND script = NEW.script
      AND game_mode = 'vezba'
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
      SET
        best_wpm = NEW.wpm,
        best_score = NEW.score,
        best_accuracy = NEW.accuracy,
        achieved_at = NEW.created_at,
        score_id = NEW.id
      WHERE id = v_current_pb.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_score_inserted ON public.scores;
CREATE TRIGGER on_score_inserted
  AFTER INSERT OR UPDATE ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.update_pb_and_streak();
