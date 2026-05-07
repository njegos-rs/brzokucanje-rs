-- 005_pg_cron_daily_texts.sql
-- pg_cron job za generisanje dnevnih tekstova
-- ZAHTEVA: pg_cron extension mora biti omogućen u Supabase Dashboard → Database → Extensions

-- Funkcija koja bira random tekst za svaki dan/pismo/kategoriju
CREATE OR REPLACE FUNCTION public.generate_daily_texts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := (NOW() AT TIME ZONE 'Europe/Belgrade')::date;
  v_script TEXT;
  v_category TEXT;
  v_text_id UUID;
BEGIN
  -- Prolazimo kroz sve kombinacije pisma × kategorije (3 × 5 = 15 kombinacija)
  -- Ali za MVP, Daily Test koristi samo: reci, recenice, citati
  FOREACH v_script IN ARRAY ARRAY['cirilica', 'latinica', 'easy'] LOOP
    FOREACH v_category IN ARRAY ARRAY['reci', 'recenice', 'citati'] LOOP

      -- Skip ako već postoji za danas
      IF EXISTS (
        SELECT 1 FROM public.daily_texts
        WHERE date = v_today AND script = v_script AND category = v_category
      ) THEN
        CONTINUE;
      END IF;

      -- Izaberi random aktivni tekst koji nije korišćen poslednjih 30 dana
      SELECT tp.id INTO v_text_id
      FROM public.text_pool tp
      WHERE tp.category = v_category
        AND tp.is_active = TRUE
        AND tp.id NOT IN (
          SELECT dt.text_id
          FROM public.daily_texts dt
          WHERE dt.script = v_script
            AND dt.category = v_category
            AND dt.date >= v_today - INTERVAL '30 days'
        )
      ORDER BY RANDOM()
      LIMIT 1;

      -- Fallback: uzmi bilo koji aktivan tekst ako svi bili skoro
      IF v_text_id IS NULL THEN
        SELECT id INTO v_text_id
        FROM public.text_pool
        WHERE category = v_category AND is_active = TRUE
        ORDER BY RANDOM()
        LIMIT 1;
      END IF;

      IF v_text_id IS NOT NULL THEN
        INSERT INTO public.daily_texts (date, script, category, text_id)
        VALUES (v_today, v_script, v_category, v_text_id)
        ON CONFLICT (date, script, category) DO NOTHING;
      END IF;

    END LOOP;
  END LOOP;
END;
$$;

-- Cron job: pokreće se svaki dan u ponoć UTC = 1h po Beogradu (letnje vreme)
-- VAŽNO: pg_cron mora biti enabled pre pokretanja ove migracije
SELECT cron.schedule(
  'generate-daily-texts',
  '0 0 * * *',
  $$SELECT public.generate_daily_texts()$$
);
