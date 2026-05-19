-- 016_game_scores_elapsed.sql
-- Dodaje elapsed_seconds kolonu i osvezava game_leaderboard view

ALTER TABLE public.game_scores
  ADD COLUMN IF NOT EXISTS elapsed_seconds INT NOT NULL DEFAULT 0;

CREATE OR REPLACE VIEW public.game_leaderboard AS
SELECT
  p.username,
  gs.user_id,
  MAX(gs.score)           AS max_score,
  MAX(gs.level)           AS max_level,
  MAX(gs.words_destroyed) AS max_words
FROM public.game_scores gs
JOIN public.profiles p ON gs.user_id = p.id
GROUP BY p.username, gs.user_id
ORDER BY max_score DESC;

-- View za personal best po korisniku (score + level + elapsed tog score-a)
CREATE OR REPLACE VIEW public.game_personal_bests AS
SELECT DISTINCT ON (gs.user_id)
  gs.user_id,
  gs.score      AS best_score,
  gs.level      AS best_level,
  gs.elapsed_seconds,
  gs.words_destroyed,
  gs.created_at
FROM public.game_scores gs
ORDER BY gs.user_id, gs.score DESC;
