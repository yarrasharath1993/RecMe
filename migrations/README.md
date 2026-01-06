# Database Migrations

## How to Run Migrations

Since we don't have direct database access via CLI, run these SQL files in **Supabase Dashboard → SQL Editor**.

### Migration Order

1. **`../supabase-enhanced-tags-schema.sql`** - Enhanced tagging system (movies + reviews)
2. **`../supabase-canonical-lists-schema.sql`** - Canonical "Best Of" lists
3. **`004-celebrity-enhancements.sql`** - Celebrity profile enhancements (awards, trivia, milestones)

### Quick Copy Commands

```bash
# Copy migration 1 to clipboard
cat supabase-enhanced-tags-schema.sql | pbcopy

# Copy migration 2 to clipboard  
cat supabase-canonical-lists-schema.sql | pbcopy

# Copy migration 3 (Celebrity enhancements) to clipboard
cat migrations/004-celebrity-enhancements.sql | pbcopy
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
```

Then populate data:
```bash
# For movies
pnpm movies:auto-tag --limit=500

# For celebrities
npx tsx scripts/enrich-celebrity-waterfall.ts --top=50
```

