-- Tip uređaja se čuva uz svaki rezultat, ne uz profil korisnika.
ALTER TABLE public.scores
  ADD COLUMN IF NOT EXISTS device_type TEXT NOT NULL DEFAULT 'unknown'
    CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'unknown'));
ALTER TABLE public.scores
  ADD COLUMN IF NOT EXISTS device_confidence TEXT NOT NULL DEFAULT 'low'
    CHECK (device_confidence IN ('high', 'medium', 'low'));

ALTER TABLE public.game_scores
  ADD COLUMN IF NOT EXISTS device_type TEXT NOT NULL DEFAULT 'unknown'
    CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'unknown'));
ALTER TABLE public.game_scores
  ADD COLUMN IF NOT EXISTS device_confidence TEXT NOT NULL DEFAULT 'low'
    CHECK (device_confidence IN ('high', 'medium', 'low'));

CREATE INDEX IF NOT EXISTS scores_device_type_idx ON public.scores (device_type);
CREATE INDEX IF NOT EXISTS game_scores_device_type_idx ON public.game_scores (device_type);