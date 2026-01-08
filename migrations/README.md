# Database Migrations

## How to Run Migrations

Since we don't have direct database access via CLI, run these SQL files in **Supabase Dashboard → SQL Editor**.

### Migration Order

1. **`../supabase-enhanced-tags-schema.sql`** - Enhanced tagging system (movies + reviews)
2. **`../supabase-canonical-lists-schema.sql`** - Canonical "Best Of" lists
3. **`004-celebrity-enhancements.sql`** - Celebrity profile enhancements (awards, trivia, milestones)
4. **`005-add-visual-intelligence.sql`** - Visual intelligence for images
5. **`006-add-smart-review-fields.sql`** - Smart review fields
6. **`007-enhance-archival-images.sql`** - Archival image enhancements
7. **`008-extended-cast.sql`** - Extended cast information
8. **`009-movie-verification.sql`** - Cross-reference verification system

### Quick Copy Commands

```bash
# Copy migration 1 to clipboard
cat supabase-enhanced-tags-schema.sql | pbcopy

# Copy migration 2 to clipboard  
cat supabase-canonical-lists-schema.sql | pbcopy

# Copy migration 3 (Celebrity enhancements) to clipboard
cat migrations/004-celebrity-enhancements.sql | pbcopy

# Copy migration 9 (Movie verification) to clipboard
cat migrations/009-movie-verification.sql | pbcopy
```

### After Running Migrations

Verify with:
```sql
-- Check movies table columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'movies' 
  AND column_name IN ('box_office_category', 'mood_tags', 'age_rating');

-- Check canonical_lists table
SELECT COUNT(*) FROM canonical_lists;

-- Check celebrity enhancement tables
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'celebrities' 
  AND column_name IN ('full_bio', 'enrichment_status', 'awards_count');

-- Check new celebrity tables exist
SELECT COUNT(*) FROM celebrity_awards;
SELECT COUNT(*) FROM celebrity_trivia;
SELECT COUNT(*) FROM celebrity_milestones;

-- Check movie_verification table exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'movie_verification';

-- Check verification views exist
SELECT * FROM movies_needing_verification LIMIT 5;
```

Then populate data:
```bash
# For movies
pnpm movies:auto-tag --limit=500

# For celebrities
npx tsx scripts/enrich-celebrity-waterfall.ts --top=50

# For movie verification
npx tsx scripts/verify-batch.ts --batch --limit=100 --dry-run
npx tsx scripts/verify-batch.ts --batch --limit=100 --execute
```

