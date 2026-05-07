-- 003_triggers.sql
-- Trigeri: auto-create profile, PB update, streak, updated_at

-- Automatski kreira profile kad se korisnik registruje
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'korisnik_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at na profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-update personal_bests i streak posle svakog RANK score INSERT-a
CREATE OR REPLACE FUNCTION public.update_pb_and_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_pb RECORD;
BEGIN
  -- Samo RANK mod, ne VEŽBA
  IF NEW.mode != 'rank' THEN
    RETURN NEW;
  END IF;

  -- Proverimo da li postoji PB za ovu kombinaciju
  SELECT * INTO v_current_pb
  FROM public.personal_bests
  WHERE user_id = NEW.user_id
    AND category = NEW.category
    AND script = NEW.script;

  IF NOT FOUND THEN
    -- Nema PB — kreiraj novi
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
    -- Novi PB!
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
  AFTER INSERT ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.update_pb_and_streak();
