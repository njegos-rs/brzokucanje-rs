-- Bezbedna promena username-a iz admin panela bez service-role kljuca.

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

  IF v_username !~ '^[[:alnum:]]+( [[:alnum:]]+)?$' THEN
    RAISE EXCEPTION 'Dozvoljeni su slova i brojevi, uz najvise jedan razmak';
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
