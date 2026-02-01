-- Backfill heroes and heroines from hero/heroine (run AFTER multi-cast-migration.sql)
-- Use this to populate heroes[] and heroines[] for all rows that have hero/heroine but empty arrays.

-- Single hero → one-element heroes array (where heroes is null or empty)
UPDATE movies
SET heroes = ARRAY[trim(hero)]
WHERE hero IS NOT NULL AND trim(hero) != ''
  AND (heroes IS NULL OR array_length(heroes, 1) IS NULL);

-- Comma-separated hero → split into heroes (where not already done by migrate script)
UPDATE movies m
SET heroes = (SELECT array_agg(trim(x)) FROM unnest(string_to_array(m.hero, ',')) AS x)
WHERE m.hero IS NOT NULL AND m.hero LIKE '%,%'
  AND (m.heroes IS NULL OR array_length(m.heroes, 1) IS NULL);

-- Single heroine → one-element heroines array
UPDATE movies
SET heroines = ARRAY[trim(heroine)]
WHERE heroine IS NOT NULL AND trim(heroine) != ''
  AND (heroines IS NULL OR array_length(heroines, 1) IS NULL);

-- Comma-separated heroine → split into heroines
UPDATE movies m
SET heroines = (SELECT array_agg(trim(x)) FROM unnest(string_to_array(m.heroine, ',')) AS x)
WHERE m.heroine IS NOT NULL AND m.heroine LIKE '%,%'
  AND (m.heroines IS NULL OR array_length(m.heroines, 1) IS NULL);
