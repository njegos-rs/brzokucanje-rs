-- 007_newsletter_streaks.sql
-- Newsletter pretplatnici (placeholder za v2.1) + streaks na profiles

-- Streak tracking na profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date DATE NULL;

-- Newsletter subscribers (placeholder — UI u admin panelu, slanje v2.1)
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  confirmation_token TEXT NULL,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ NULL
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage newsletter"
  ON public.newsletter_subscribers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Streak update funkcija — poziva se iz update_pb_and_streak trigera
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := (NOW() AT TIME ZONE 'Europe/Belgrade')::date;
  v_last_date DATE;
  v_current INT;
  v_longest INT;
BEGIN
  SELECT last_active_date, current_streak, longest_streak
  INTO v_last_date, v_current, v_longest
  FROM public.profiles WHERE id = p_user_id;

  IF v_last_date IS NULL OR v_last_date < v_today - INTERVAL '1 day' THEN
    -- Prekinut streak ili prvi put
    v_current := 1;
  ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
    -- Uzastopni dan
    v_current := v_current + 1;
  ELSIF v_last_date = v_today THEN
    -- Već igrao danas — nema promene
    RETURN;
  END IF;

  IF v_current > v_longest THEN
    v_longest := v_current;
  END IF;

  UPDATE public.profiles
  SET
    current_streak = v_current,
    longest_streak = v_longest,
    last_active_date = v_today,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- Dopunjavamo update_pb_and_streak da poziva streak update
CREATE OR REPLACE FUNCTION public.update_pb_and_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_pb RECORD;
BEGIN
  IF NEW.mode != 'rank' THEN
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

  -- Azuriraj streak
  PERFORM public.update_user_streak(NEW.user_id);

  RETURN NEW;
END;
$$;
