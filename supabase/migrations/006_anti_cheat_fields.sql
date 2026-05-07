-- 006_anti_cheat_fields.sql
-- Proširenje scores tabele za anti-cheat analizu + admin review status

ALTER TABLE public.scores
  ADD COLUMN IF NOT EXISTS review_status TEXT
    NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS reviewed_by UUID NULL REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS timing_stddev NUMERIC(8,4) NULL,  -- stdDev keystroke intervala (ms)
  ADD COLUMN IF NOT EXISTS timing_mean NUMERIC(8,4) NULL,    -- mean keystroke interval (ms)
  ADD COLUMN IF NOT EXISTS paste_detected BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tab_switch_count INT NOT NULL DEFAULT 0;

-- Proširenje profiles za ban razlog i ban datum
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ban_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS banned_by UUID NULL REFERENCES auth.users(id);

-- Automatski flag: WPM > 220 ili (ACC >= 99 AND WPM >= 130)
-- Ovo se radi u API route-u, ali imamo i DB trigger kao backup
CREATE OR REPLACE FUNCTION public.auto_flag_suspicious_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Hard reject: WPM > 220
  IF NEW.wpm > 220 THEN
    NEW.is_flagged := TRUE;
    NEW.flag_reason := 'WPM > 220 (hard limit)';
    NEW.review_status := 'pending';
  END IF;

  -- Soft flag: visoka ACC + visok WPM
  IF NEW.accuracy >= 99 AND NEW.wpm >= 130 AND NOT NEW.is_flagged THEN
    NEW.is_flagged := TRUE;
    NEW.flag_reason := 'ACC >= 99% sa WPM >= 130 — manuelni review';
    NEW.review_status := 'pending';
  END IF;

  -- Keystroke timing anomalija
  IF NEW.timing_stddev IS NOT NULL AND NEW.timing_stddev < 8 AND NEW.timing_mean < 50 THEN
    NEW.is_flagged := TRUE;
    NEW.flag_reason := COALESCE(NEW.flag_reason || ' | ', '') || 'Keystroke timing anomalija (stdDev < 8ms, mean < 50ms)';
    NEW.review_status := 'pending';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_flag_on_insert ON public.scores;
CREATE TRIGGER auto_flag_on_insert
  BEFORE INSERT ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.auto_flag_suspicious_score();
