-- 022_rank_attempt_update_policies.sql
-- Rank test prvo kreira placeholder score (0 WPM), a zatim ga update-uje kada se test zavrsi.
-- Zato korisnik mora da ima UPDATE dozvolu nad sopstvenim redom, a triggeri moraju da rade i na UPDATE.

CREATE POLICY "Users can update their own scores"
  ON public.scores FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_pb_and_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_pb RECORD;
BEGIN
  -- Placeholder rank pokusaji ne smeju da ulaze u PB logiku.
  IF NEW.mode != 'rank' OR NEW.wpm <= 0 OR NEW.score <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_current_pb
  FROM public.personal_bests
  WHERE user_id = NEW.user_id
    AND category = NEW.category
    AND script = NEW.script;

  IF NOT FOUND THEN
    INSERT INTO public.personal_bests (
      user_id, category, script,
      best_wpm, best_score, best_accuracy,
      achieved_at, score_id
    ) VALUES (
      NEW.user_id, NEW.category, NEW.script,
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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_score_inserted ON public.scores;
CREATE TRIGGER on_score_inserted
  AFTER INSERT OR UPDATE ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.update_pb_and_streak();

DROP TRIGGER IF EXISTS auto_flag_on_insert ON public.scores;
CREATE TRIGGER auto_flag_on_insert
  BEFORE INSERT OR UPDATE ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.auto_flag_suspicious_score();
