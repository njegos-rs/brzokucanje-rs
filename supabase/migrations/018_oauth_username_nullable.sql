-- OAuth korisnici dobijaju username=NULL, pa ih callback šalje na /postavi-username
-- Email korisnici i dalje dobijaju username iz metadata (registracija forma ga šalje)

-- 1. Dozvoli NULL username
ALTER TABLE public.profiles
  ALTER COLUMN username DROP NOT NULL;

-- 2. Ažuriraj trigger: postavi NULL ako nema username u metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_username TEXT;
BEGIN
  meta_username := NEW.raw_user_meta_data->>'username';

  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    CASE WHEN meta_username IS NOT NULL AND meta_username != '' THEN meta_username ELSE NULL END
  );
  RETURN NEW;
END;
$$;

-- 3. Ispravi postojeće korisnike koji imaju auto-generisano ime (korisnik_XXXXXXXX)
--    a nemaju stvarno postavljeno ime — postavi na NULL da ih callback preusmeri
UPDATE public.profiles
SET username = NULL
WHERE username ~ '^korisnik_[0-9a-f]{8}$';
