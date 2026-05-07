-- 002_rls_policies.sql
-- Row Level Security politike za sve tabele

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.text_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_bests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profanity_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- TEXT POOL — čitanje svima, write samo adminima
CREATE POLICY "Active texts are viewable by everyone"
  ON public.text_pool FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage text pool"
  ON public.text_pool FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- DAILY TEXTS — javno čitanje
CREATE POLICY "Daily texts are viewable by everyone"
  ON public.daily_texts FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage daily texts"
  ON public.daily_texts FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- SCORES
CREATE POLICY "Users can view their own scores"
  ON public.scores FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Leaderboard scores are public"
  ON public.scores FOR SELECT USING (mode = 'rank' AND is_flagged = FALSE);

CREATE POLICY "Users can insert their own scores"
  ON public.scores FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage scores"
  ON public.scores FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- PERSONAL BESTS — javno čitanje
CREATE POLICY "Personal bests are viewable by everyone"
  ON public.personal_bests FOR SELECT USING (TRUE);

CREATE POLICY "System manages personal bests"
  ON public.personal_bests FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- PROFANITY WORDS — samo admini čitaju i menjaju
CREATE POLICY "Admins can manage profanity list"
  ON public.profanity_words FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- AUDIT LOG — samo admini vide
CREATE POLICY "Admins can read audit log"
  ON public.audit_log FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Admins can insert audit log"
  ON public.audit_log FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
