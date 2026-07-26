-- Anonimna auth sesija je samo tehnicki identifikator.
-- Javni profil nastaje tek kada korisnik potvrdi validan nadimak.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
BEGIN
  v_username := NULLIF(BTRIM(NEW.raw_user_meta_data->>'username'), '');

  IF v_username IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, username, is_anonymous)
  VALUES (NEW.id, v_username, FALSE)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Uklanja samo nepotvrdjene profile. Auth sesije, admini i imenovani
-- korisnici ostaju netaknuti.
DELETE FROM public.profiles
WHERE is_admin = FALSE
  AND (
    username IS NULL
    OR BTRIM(username) = ''
    OR username ~ '^korisnik_[0-9a-f]{8}$'
  );