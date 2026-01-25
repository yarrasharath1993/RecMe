-- Export all movies with "srikanth" in hero field for manual review
-- Run this query and export results to CSV

SELECT 
  m.id,
  m.title_en,
  m.title_te,
  m.hero,
  m.release_year,
  m.language,
  m.director,
  m.slug,
  CASE WHEN m.is_published THEN 'Yes' ELSE 'No' END as is_published,
  -- Suggested actor based on heuristics
  CASE 
    -- If hero name contains "meka" or "addala", it's Srikanth Meka
    WHEN m.hero ILIKE '%meka%' OR m.hero ILIKE '%addala%' THEN 'Srikanth Meka'
    -- Tamil Srikanth's known movies (from user's list)
    WHEN m.title_en ILIKE ANY(ARRAY[
      '%blackmail%', '%dinasari%', '%konjam kadhal%', '%konjam modhal%', '%mathru%',
      '%operation laila%', '%sathamindri%', '%aanandhapuram%', '%maya puthagam%',
      '%bagheera%', '%kannai nambathey%', '%echo%', '%amala%', '%pindam%', '%ravanasura%',
      '%maha%', '%coffee with kadhal%', '%10th class%',
      '%mirugaa%', '%y%', '%jai sena%', '%asalem jarigindi%',
      '%rocky%', '%raagala%', '%marshal%',
      '%lie%',
      '%sowkarpettai%', '%nambiar%', '%sarrainodu%',
      '%om shanti om%',
      '%kathai thiraikathai%',
      '%nanban%', '%paagan%', '%hero%', '%nippu%',
      '%sathurangam%', '%dhada%', '%uppukandam%',
      '%drohi%', '%rasikkum%', '%police police%',
      '%indira vizha%',
      '%poo%', '%vallamai%',
      '%aadavari matalaku%',
      '%mercury pookkal%', '%uyir%', '%kizhakku%',
      '%kana kandaen%', '%oru naal%', '%bambara%',
      '%aayitha ezhuthu%', '%bose%', '%varnajalam%',
      '%parthiban kanavu%', '%priyamana%', '%manasellam%', '%okariki okaru%',
      '%roja kootam%', '%april mathathil%'
    ]) THEN 'Tamil Srikanth'
    -- Telugu movies = Srikanth Meka (Telugu actor)
    WHEN m.language = 'Telugu' THEN 'Srikanth Meka'
    -- Tamil/Malayalam movies = Tamil Srikanth
    WHEN m.language IN ('Tamil', 'Malayalam') THEN 'Tamil Srikanth'
    -- Movies from 1991+ without language = likely Telugu (Srikanth Meka started 1991)
    WHEN m.release_year >= 1991 AND m.language IS NULL THEN 'Srikanth Meka (likely)'
    -- Everything else needs review
    ELSE 'REVIEW NEEDED'
  END as suggested_actor,
  -- Notes explaining the suggestion
  CASE 
    WHEN m.hero ILIKE '%meka%' OR m.hero ILIKE '%addala%' THEN 'Hero name contains Meka/Addala'
    WHEN m.title_en ILIKE ANY(ARRAY['%blackmail%', '%dinasari%', '%konjam%', '%mathru%', '%operation%', '%sathamindri%', '%aanandhapuram%', '%maya%', '%bagheera%', '%kannai%', '%echo%', '%amala%', '%pindam%', '%ravanasura%', '%maha%', '%coffee%', '%10th%', '%mirugaa%', '%y%', '%jai%', '%asalem%', '%rocky%', '%raagala%', '%marshal%', '%lie%', '%sowkarpettai%', '%nambiar%', '%sarrainodu%', '%om shanti%', '%kathai%', '%nanban%', '%paagan%', '%hero%', '%nippu%', '%sathurangam%', '%dhada%', '%uppukandam%', '%drohi%', '%rasikkum%', '%police%', '%indira%', '%poo%', '%vallamai%', '%aadavari%', '%mercury%', '%uyir%', '%kizhakku%', '%kana%', '%oru naal%', '%bambara%', '%aayitha%', '%bose%', '%varnajalam%', '%parthiban%', '%priyamana%', '%manasellam%', '%okariki%', '%roja%', '%april%']) THEN 'Matches known Tamil Srikanth filmography'
    WHEN m.language = 'Telugu' THEN 'Telugu movie (Srikanth Meka is Telugu actor)'
    WHEN m.language IN ('Tamil', 'Malayalam') THEN m.language || ' movie (Tamil Srikanth works in Tamil/Malayalam)'
    WHEN m.release_year >= 1991 AND m.language IS NULL THEN 'Year >= 1991, no language (likely Telugu)'
    ELSE 'Unable to determine - manual review required'
  END as notes
FROM movies m
WHERE m.hero ILIKE '%srikanth%'
ORDER BY 
  m.release_year DESC NULLS LAST,
  m.title_en;

-- Summary statistics
-- Uncomment to see breakdown:

-- SELECT 
--   suggested_actor,
--   COUNT(*) as movie_count
-- FROM (
--   SELECT 
--     CASE 
--       WHEN m.hero ILIKE '%meka%' OR m.hero ILIKE '%addala%' THEN 'Srikanth Meka'
--       WHEN m.language = 'Telugu' THEN 'Srikanth Meka'
--       WHEN m.language IN ('Tamil', 'Malayalam') THEN 'Tamil Srikanth'
--       WHEN m.release_year >= 1991 AND m.language IS NULL THEN 'Srikanth Meka (likely)'
--       ELSE 'REVIEW NEEDED'
--     END as suggested_actor
--   FROM movies m
--   WHERE m.hero ILIKE '%srikanth%'
-- ) subquery
-- GROUP BY suggested_actor
-- ORDER BY movie_count DESC;

-- Language breakdown:
-- SELECT 
--   language,
--   COUNT(*) as movie_count
-- FROM movies
-- WHERE hero ILIKE '%srikanth%'
-- GROUP BY language
-- ORDER BY movie_count DESC;

-- Hero name variations:
-- SELECT 
--   hero,
--   COUNT(*) as movie_count
-- FROM movies
-- WHERE hero ILIKE '%srikanth%'
-- GROUP BY hero
-- ORDER BY movie_count DESC;
