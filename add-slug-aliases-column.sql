-- ============================================================
-- Add slug_aliases column to celebrities table
-- ============================================================
-- This allows multiple URLs to point to the same celebrity profile
-- Example: Both "nagarjuna" and "akkineni-nagarjuna" work
-- ============================================================

-- Add slug_aliases column (TEXT array)
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS slug_aliases TEXT[];

-- Create GIN index for fast array searches
CREATE INDEX IF NOT EXISTS idx_celebrities_slug_aliases
ON celebrities USING GIN (slug_aliases);

-- ============================================================
-- Add Nagarjuna's aliases
-- ============================================================
UPDATE celebrities
SET slug_aliases = ARRAY['akkineni-nagarjuna', 'nagarjuna-akkineni']
WHERE id = '7ea66985-c6f8-4f52-a51b-1dc9fd3f184d'
AND slug = 'nagarjuna';

-- Verify
SELECT id, name_en, slug, slug_aliases
FROM celebrities
WHERE slug = 'nagarjuna';
