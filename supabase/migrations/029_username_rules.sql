-- Jedinstvena pravila za javna korisnicka imena.
-- Dozvoljena su Unicode slova/brojevi, razmaci i bezbedna interpunkcija.

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format_check
  CHECK (
    username IS NULL
    OR (
      char_length(username) BETWEEN 3 AND 15
      AND username = BTRIM(username)
      AND username ~ '[[:alnum:]]'
      AND username ~ '^[[:alnum:] .,!_@()''’-]+$'
    )
  ) NOT VALID;

ALTER TABLE public.profiles
  VALIDATE CONSTRAINT profiles_username_format_check;

-- API dostupnost je case-insensitive; baza sada garantuje isto i pri paralelnim upisima.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique_idx
  ON public.profiles (LOWER(username))
  WHERE username IS NOT NULL;

CREATE OR REPLACE FUNCTION public.admin_change_username(
  p_user_id UUID,
  p_username TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_username TEXT := regexp_replace(trim(p_username), '\s+', ' ', 'g');
  v_old_username TEXT;
BEGIN
  IF v_admin_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = v_admin_id AND is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Nemate admin privilegije';
  END IF;

  IF char_length(v_username) < 3 OR char_length(v_username) > 15 THEN
    RAISE EXCEPTION 'Ime mora imati 3-15 karaktera';
  END IF;

  IF v_username !~ '[[:alnum:]]' OR v_username !~ '^[[:alnum:] .,!_@()''’-]+$' THEN
    RAISE EXCEPTION 'Ime sadrzi nedozvoljene znakove';
  END IF;

  SELECT username
  INTO v_old_username
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Korisnik nije pronadjen';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id <> p_user_id
      AND lower(username) = lower(v_username)
  ) THEN
    RAISE EXCEPTION 'Ovo ime je zauzeto';
  END IF;

  UPDATE public.profiles
  SET username = v_username,
      updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.admin_actions (
    admin_id,
    action,
    target_type,
    target_id,
    details
  )
  VALUES (
    v_admin_id,
    'change_username',
    'user',
    p_user_id::TEXT,
    jsonb_build_object(
      'old_username', v_old_username,
      'new_username', v_username
    )
  );

  RETURN v_username;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_change_username(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_change_username(UUID, TEXT) TO authenticated;
