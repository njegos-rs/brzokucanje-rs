-- Migracija 010: Kolone za AI generisanje tekstova i reči

-- 1. Dodaj source kolonu (razlikuje manual/ai_vezba/ai_rank)
ALTER TABLE public.text_pool
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
CHECK (source IN ('manual', 'ai_vezba', 'ai_rank'));

-- 2. Dodaj pool_mode kolonu (vezba ili rank)
ALTER TABLE public.text_pool
ADD COLUMN IF NOT EXISTS pool_mode TEXT NOT NULL DEFAULT 'vezba'
CHECK (pool_mode IN ('vezba', 'rank'));

-- 3. Dodaj script kolonu (kojim pismom je tekst napisan)
ALTER TABLE public.text_pool
ADD COLUMN IF NOT EXISTS script TEXT NULL
CHECK (script IN ('latinica', 'cirilica', 'latinica-bez-kvacica'));

-- 4. Proširi difficulty constraint da uključi 'expert'
ALTER TABLE public.text_pool
DROP CONSTRAINT IF EXISTS text_pool_difficulty_check;

ALTER TABLE public.text_pool
ADD CONSTRAINT text_pool_difficulty_check
CHECK (difficulty IN ('lake', 'srednje', 'teske', 'expert'));

-- 5. Ažuriraj postojeće seed tekstove
UPDATE public.text_pool
SET source = 'manual', pool_mode = 'rank'
WHERE source = 'manual';

-- 6. Indeksi za brže querije
CREATE INDEX IF NOT EXISTS text_pool_source_idx
ON public.text_pool (source);

CREATE INDEX IF NOT EXISTS text_pool_combo_idx
ON public.text_pool (pool_mode, category, difficulty, script, source, is_active);
