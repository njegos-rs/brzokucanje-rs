-- 015_game_scores.sql
-- Tabela za cuvanje rezultata iz igre "Svemirsko kucanje"

CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score NUMERIC(10,0) NOT NULL,
  level INT NOT NULL,
  words_destroyed INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dozvoli svima citanje, autentifikovanima upisivanje
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Game scores su javni za citanje"
  ON public.game_scores FOR SELECT
  USING (true);

CREATE POLICY "Korisnici mogu da upisuju svoje game scoreove"
  ON public.game_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Opciono: personal best tabela ili cemo samo naci MAX(score) preko view-a
CREATE OR REPLACE VIEW public.game_leaderboard AS
SELECT
  p.username,
  gs.user_id,
  MAX(gs.score) as max_score,
  MAX(gs.level) as max_level
FROM public.game_scores gs
JOIN public.profiles p ON gs.user_id = p.id
GROUP BY p.username, gs.user_id
ORDER BY max_score DESC;
