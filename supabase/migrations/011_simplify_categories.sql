-- Simplify category to only two values we actually use: 'reci' and 'recenice'

-- scores: nema UNIQUE po category, samo update
UPDATE scores SET category = 'recenice' WHERE category IN ('citati', 'price', 'vesti');

-- text_pool: nema UNIQUE po category, samo update
UPDATE text_pool SET category = 'recenice' WHERE category IN ('citati', 'price', 'vesti');

-- daily_texts ima UNIQUE(date, script, category) — ako već postoji recenice za isti dan+script,
-- obriši stari red umesto update-a da ne dođe do duplikata
DELETE FROM daily_texts
WHERE category IN ('citati', 'price', 'vesti')
  AND EXISTS (
    SELECT 1 FROM daily_texts d2
    WHERE d2.date = daily_texts.date
      AND d2.script = daily_texts.script
      AND d2.category = 'recenice'
  );

-- Ostatak koji nema duplikat — slobodno updateuj
UPDATE daily_texts SET category = 'recenice' WHERE category IN ('citati', 'price', 'vesti');

-- Drop old CHECK constraints and add new ones
ALTER TABLE scores
  DROP CONSTRAINT IF EXISTS scores_category_check,
  ADD CONSTRAINT scores_category_check CHECK (category IN ('reci', 'recenice'));

ALTER TABLE text_pool
  DROP CONSTRAINT IF EXISTS text_pool_category_check,
  ADD CONSTRAINT text_pool_category_check CHECK (category IN ('reci', 'recenice'));

ALTER TABLE daily_texts
  DROP CONSTRAINT IF EXISTS daily_texts_category_check,
  ADD CONSTRAINT daily_texts_category_check CHECK (category IN ('reci', 'recenice'));
