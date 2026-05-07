-- 004_indexes.sql
-- Performansni indeksi za leaderboard i upite

-- Scores: brz leaderboard query po kategoriji/pismu
CREATE INDEX IF NOT EXISTS scores_leaderboard_idx
  ON public.scores (category, script, score DESC)
  WHERE mode = 'rank' AND is_flagged = FALSE;

-- Scores: korisnikovi testovi (profil stranica)
CREATE INDEX IF NOT EXISTS scores_user_history_idx
  ON public.scores (user_id, created_at DESC);

-- Personal bests: rang lista
CREATE INDEX IF NOT EXISTS pb_leaderboard_idx
  ON public.personal_bests (category, script, best_score DESC);

-- Daily texts: brz lookup po datumu
CREATE INDEX IF NOT EXISTS daily_texts_date_idx
  ON public.daily_texts (date, script, category);

-- Text pool: pretraga po kategoriji
CREATE INDEX IF NOT EXISTS text_pool_category_idx
  ON public.text_pool (category, is_active);

-- Profiles: username pretraga
CREATE INDEX IF NOT EXISTS profiles_username_idx
  ON public.profiles (username);

-- Anti-cheat: flagovani scores čekaju review
CREATE INDEX IF NOT EXISTS scores_flagged_idx
  ON public.scores (is_flagged, created_at DESC)
  WHERE is_flagged = TRUE;

-- Audit log: paginacija po datumu
CREATE INDEX IF NOT EXISTS audit_log_date_idx
  ON public.audit_log (created_at DESC);
