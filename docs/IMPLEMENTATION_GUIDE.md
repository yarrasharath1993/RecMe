# 🚀 Implementation Guide: Movie Impact & Intelligence System

**Last Updated:** January 15, 2026  
**Estimated Time:** 2-3 hours for complete setup

---

## Prerequisites

✅ **Before you begin:**
- [ ] All implementation files are in place (22 files created)
- [ ] Database access (Supabase dashboard or PostgreSQL client)
- [ ] Node.js and TypeScript installed
- [ ] Environment variables configured in `.env.local`

---

## Step 1: Run Database Migrations (20 minutes)

### Option A: Using Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor:**
   ```
   Go to: https://app.supabase.com/project/[YOUR_PROJECT]/sql/new
   ```

2. **Run Migration 1 - Confidence Scoring:**
   - Copy contents of `migrations/033-confidence-scoring.sql`
   - Paste into SQL editor
   - Click "Run" button
   - **Verify:** Should see success message with views and functions created

3. **Run Migration 2 - Entity Relations:**
   - Copy contents of `migrations/034-entity-relations.sql`
   - Paste into SQL editor
   - Click "Run"
   - **Verify:** Check that `entity_relations` table appears in Table Editor

4. **Run Migration 3 - Inference Audit Log:**
   - Copy contents of `migrations/035-inference-audit-log.sql`
   - Paste into SQL editor
   - Click "Run"
   - **Verify:** Check that `inference_audit_log` table appears

### Option B: Using psql Command Line

If you have direct PostgreSQL access:

```bash
# Make script executable
chmod +x scripts/run-migrations.sh

# Run migrations
bash scripts/run-migrations.sh
```

Or manually:

```bash
# Set your database URL
export DB_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"

# Run each migration
psql "$DB_URL" -f migrations/033-confidence-scoring.sql
psql "$DB_URL" -f migrations/034-entity-relations.sql
psql "$DB_URL" -f migrations/035-inference-audit-log.sql
```

### Verification

Run this query in Supabase SQL editor to verify all tables exist:

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'entity_relations',
    'inference_audit_log'
  )
ORDER BY table_name;
```

Expected output:
```
entity_relations      | 16 columns
inference_audit_log   | 15 columns
```

Also verify new columns in movies table:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'movies' 
  AND column_name IN (
    'confidence_score',
    'confidence_breakdown',
    'inference_flags',
    'governance_flags',
    'impact_analysis',
    'last_confidence_calc'
  );
```

✅ **Checkpoint:** All migrations successful → Proceed to Step 2

---

## Step 2: Set Environment Variables (5 minutes)

### Create/Update `.env.local`

Add these feature flags to your `.env.local` file:

```bash
# Movie Impact & Intelligence System Feature Flags

# Phase 1: Enable for Top 100 Movies Only
NEXT_PUBLIC_FEATURE_MOVIE_IMPACT=true
NEXT_PUBLIC_IMPACT_ROLLOUT_PHASE=1

# Phase 1: Enable Counterfactual for Top 50 Movies
NEXT_PUBLIC_FEATURE_COUNTERFACTUAL=true
NEXT_PUBLIC_COUNTERFACTUAL_PHASE=1

# Confidence Scoring (Admin Only for now)
NEXT_PUBLIC_FEATURE_CONFIDENCE=false
NEXT_PUBLIC_CONFIDENCE_ADMIN_ONLY=true

# Auto-fill (Not enabled yet)
NEXT_PUBLIC_FEATURE_AUTO_FILL=false

# Inference Review (Not enabled yet)
NEXT_PUBLIC_FEATURE_INFERENCE_REVIEW=false

# Entity Relations (Not enabled yet)
NEXT_PUBLIC_FEATURE_ENTITY_RELATIONS=false
```

### Verify Configuration

```bash
# Check that environment variables are loaded
npx tsx -e "
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
console.log('MOVIE_IMPACT:', process.env.NEXT_PUBLIC_FEATURE_MOVIE_IMPACT);
console.log('ROLLOUT_PHASE:', process.env.NEXT_PUBLIC_IMPACT_ROLLOUT_PHASE);
"
```

Expected output:
```
MOVIE_IMPACT: true
ROLLOUT_PHASE: 1
```

✅ **Checkpoint:** Environment variables set → Proceed to Step 3

---

## Step 3: Initial Data Population (60-90 minutes)

### 3.1 Calculate Impact for Top 100 Movies (30 minutes)

**First, do a dry run to see what will be processed:**

```bash
npx tsx scripts/calculate-movie-impact.ts --top-only --dry-run
```

Expected output:
```
🎬 MOVIE IMPACT CALCULATION BATCH JOB

⚠️  DRY RUN MODE - No changes will be made

✓ Found 100 movies to process

[1/100] Processing: Baahubali: The Beginning (2015)
  Significance: LANDMARK
  Confidence: 85%
  Career Impact: 2 actors launched/established
  Industry Influence: 15 movies inspired
  Franchise: Spawned 1 sequels
  ⊳ DRY RUN - Not saving to database

...
```

**If output looks good, run for real:**

```bash
npx tsx scripts/calculate-movie-impact.ts --top-only --execute
```

**Monitor progress:**
- Each movie takes ~2-5 seconds
- 100 movies = ~10-20 minutes
- Results stored in `movies.impact_analysis` JSONB field

**Verify:**

```sql
SELECT 
  title_en,
  release_year,
  impact_analysis->>'significance_tier' as significance,
  (impact_analysis->>'confidence_score')::numeric as confidence
FROM movies
WHERE impact_analysis IS NOT NULL
ORDER BY (impact_analysis->>'confidence_score')::numeric DESC
LIMIT 10;
```

### 3.2 Backfill Confidence Scores (20 minutes)

**Dry run first:**

```bash
npx tsx scripts/backfill-confidence-scores.ts --limit=1000 --dry-run
```

Expected output:
```
📊 CONFIDENCE SCORE BACKFILL BATCH JOB

✓ Found 1000 movies to process

Processing batch 1/20 (50 movies)...
  Progress: 50/1000 (5%) - Succeeded: 48, Skipped: 0, Failed: 2

...

CONFIDENCE BACKFILL SUMMARY
─────────────────────────────────────────────────────────────
Total Movies:        1000
Processed:           1000
Succeeded:           982
Skipped:             12
Failed:              6

Confidence Distribution:
  Excellent (≥0.90):  120 (120)
  High (0.80-0.89):   285 (285)
  Good (0.70-0.79):   310 (310)
  Medium (0.60-0.69): 180 (180)
  Low (0.50-0.59):    65 (65)
  Very Low (<0.50):   22 (22)

Statistics:
  Mean Confidence:    0.76
  Median Confidence:  0.78
```

**If looks good, execute:**

```bash
# Process first 1000 movies
npx tsx scripts/backfill-confidence-scores.ts --limit=1000 --execute

# Or process ALL movies (may take 30-40 minutes)
npx tsx scripts/backfill-confidence-scores.ts --all --execute
```

**Verify:**

```sql
SELECT 
  COUNT(*) as total,
  COUNT(confidence_score) as with_score,
  ROUND(AVG(confidence_score)::numeric, 2) as avg_confidence,
  COUNT(*) FILTER (WHERE confidence_score >= 0.80) as high_quality
FROM movies
WHERE is_published = true;
```

### 3.3 Populate Entity Relations (20 minutes)

**Dry run:**

```bash
npx tsx scripts/populate-entity-relations.ts --limit=1000 --dry-run
```

Expected output:
```
🔗 ENTITY RELATIONS POPULATION SCRIPT

✓ Found 1000 movies to process

[1/1000] Baahubali: The Beginning (2015)
  Found 8 relations
  ⊳ DRY RUN - Would insert 8 relations

...

ENTITY RELATIONS POPULATION SUMMARY
─────────────────────────────────────────────────────────────
Total Movies:         1000
Processed:            1000
Succeeded:            998
Failed:               2
Relations Created:    6834

Relations by Type:
  Heroes:             985
  Heroines:           912
  Directors:          998
  Music Directors:    645
  Producers:          423
  Supporting Cast:    2156
  Crew:               715
```

**Execute:**

```bash
# Process first 1000 movies
npx tsx scripts/populate-entity-relations.ts --limit=1000 --execute

# Or process ALL movies
npx tsx scripts/populate-entity-relations.ts --all --execute
```

**Verify:**

```sql
-- Check total relations
SELECT COUNT(*) as total_relations FROM entity_relations;

-- Check by role type
SELECT 
  role_type,
  COUNT(*) as count,
  ROUND(AVG(confidence)::numeric, 2) as avg_confidence
FROM entity_relations
GROUP BY role_type
ORDER BY count DESC;

-- Check sample relations
SELECT 
  movie_title,
  entity_name,
  role_type,
  confidence,
  is_verified
FROM entity_relations
LIMIT 20;
```

✅ **Checkpoint:** All data populated → Proceed to Step 4

---

## Step 4: Enable Phase 1 Rollout (10 minutes)

### 4.1 Integrate Movie Impact Component

Add the impact section to your movie detail page:

**File:** `app/movies/[slug]/page.tsx`

Add import at top:

```typescript
import { MovieImpactSection } from '@/components/movies/MovieImpactSection';
import { shouldShowImpactAnalysis } from '@/lib/config/feature-flags';
```

Add component in your movie detail JSX (after reviews section):

```typescript
{/* Movie Impact Analysis Section */}
{movie.impact_analysis && shouldShowImpactAnalysis(movie) && (
  <section className="mt-8">
    <MovieImpactSection 
      impact={movie.impact_analysis}
      movieTitle={movie.title_en}
      releaseYear={movie.release_year}
    />
  </section>
)}
```

### 4.2 Test with a Top Movie

```bash
# Restart dev server to load new env variables
npm run dev
```

Visit a top-rated movie page (e.g., Baahubali, RRR, or any with rating > 7.5) and verify:

- ✅ "Movie Impact Analysis" section appears
- ✅ "Why This Movie Matters" shows key achievements
- ✅ "Career Impact" shows trajectory data
- ✅ "What If This Didn't Exist?" shows counterfactuals
- ✅ Confidence score displayed at bottom

### 4.3 Verify Feature Flag Behavior

Test that impact section ONLY shows for:
- Movies with `our_rating >= 7.5` OR
- Movies with `is_blockbuster = true` OR
- Movies with `is_classic = true`

And does NOT show for regular movies (rating < 7.5).

✅ **Checkpoint:** Impact analysis visible for top movies → Proceed to Step 5

---

## Step 5: Monitor and Iterate (Ongoing)

### 5.1 Set Up Weekly Audit Job

**Test the audit job:**

```bash
# Dry run
npx tsx scripts/weekly-audit.ts

# Execute
npx tsx scripts/weekly-audit.ts --execute
```

Expected output:
```
📋 WEEKLY AUDIT JOB

Started: 2026-01-15T10:30:00.000Z

1. Recalculating confidence scores...
✓ Recalculated 23 movies, 0 failed

2. Validating entity relations...
✓ 0 broken relations out of 6834 total

3. Checking pending inferences...
✓ 0 pending inferences (0 high priority, 0 >30 days old)

4. Calculating data quality metrics...
✓ Data completeness: Hero 98%, Director 99%, Music 65%

5. Identifying low confidence movies...
✓ 34 movies with confidence < 0.60

WEEKLY AUDIT SUMMARY
─────────────────────────────────────────────────────────────
Total Checks:    5
Passed:          5
Warnings:        0
Errors:          0

Recommendations:
- ✅ All systems healthy. No actions required.

✓ Weekly audit completed
Report saved: docs/reports/weekly-audit-2026-01-15.md
```

**Schedule weekly audits:**

Option A - Cron job (Linux/Mac):
```bash
# Add to crontab (runs every Sunday at 2 AM)
0 2 * * 0 cd /path/to/telugu-portal && npx tsx scripts/weekly-audit.ts --execute
```

Option B - GitHub Actions:
```yaml
# .github/workflows/weekly-audit.yml
name: Weekly Audit
on:
  schedule:
    - cron: '0 2 * * 0'  # Every Sunday at 2 AM
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx tsx scripts/weekly-audit.ts --execute
```

### 5.2 Monitor Key Metrics

**Create a monitoring dashboard query:**

```sql
-- Overall System Health
SELECT 
  'Movies with Impact Analysis' as metric,
  COUNT(*) FILTER (WHERE impact_analysis IS NOT NULL) as value,
  ROUND((COUNT(*) FILTER (WHERE impact_analysis IS NOT NULL)::numeric / COUNT(*)) * 100, 1) as percentage
FROM movies WHERE is_published = true
UNION ALL
SELECT 
  'Movies with Confidence Score',
  COUNT(*) FILTER (WHERE confidence_score IS NOT NULL),
  ROUND((COUNT(*) FILTER (WHERE confidence_score IS NOT NULL)::numeric / COUNT(*)) * 100, 1)
FROM movies WHERE is_published = true
UNION ALL
SELECT 
  'Entity Relations',
  (SELECT COUNT(*) FROM entity_relations),
  NULL
UNION ALL
SELECT 
  'Pending Inferences',
  (SELECT COUNT(*) FROM inference_audit_log WHERE status = 'pending'),
  NULL;
```

Expected results after Phase 1:
```
Movies with Impact Analysis | 100     | 2-3%
Movies with Confidence Score | 1000+   | 20-30%
Entity Relations             | 6,000+  | -
Pending Inferences           | 0       | -
```

### 5.3 Review Weekly Audit Reports

Check `docs/reports/` directory weekly for:
- Confidence score distribution changes
- New low-confidence movies
- Pending inference count
- Data completeness trends

### 5.4 Phase 2 Rollout (Week 2)

When ready to expand:

```bash
# Update .env.local
NEXT_PUBLIC_IMPACT_ROLLOUT_PHASE=2  # Expand to rating > 6.5
NEXT_PUBLIC_COUNTERFACTUAL_PHASE=2  # Expand to rating > 7.0
```

Run impact calculation for more movies:

```bash
npx tsx scripts/calculate-movie-impact.ts --limit=500 --execute
```

### 5.5 Phase 3 Full Rollout (Week 3+)

```bash
# Update .env.local
NEXT_PUBLIC_IMPACT_ROLLOUT_PHASE=3  # All movies
NEXT_PUBLIC_COUNTERFACTUAL_PHASE=3
NEXT_PUBLIC_FEATURE_CONFIDENCE=true  # Enable for public
NEXT_PUBLIC_CONFIDENCE_ADMIN_ONLY=false
```

---

## Troubleshooting

### Issue: Migration fails with "relation already exists"

**Solution:** Some columns may already exist from previous migrations. This is safe to ignore - the migrations use `IF NOT EXISTS` clauses.

### Issue: Impact calculation takes too long

**Solution:** Reduce concurrency or limit:
```bash
npx tsx scripts/calculate-movie-impact.ts --limit=50 --execute
```

### Issue: Confidence scores are lower than expected

**Solution:** Run enrichment scripts to improve data quality:
```bash
npx tsx scripts/enrich-master.ts --limit=100 --execute --fast
```

### Issue: Entity relations not linking to celebrities

**Solution:** This is expected in Phase 1. The linking script requires fuzzy matching implementation. For now, entity_name is populated but entity_slug is NULL.

### Issue: Movie impact section not showing

**Debug checklist:**
1. Check feature flag: `NEXT_PUBLIC_FEATURE_MOVIE_IMPACT=true`
2. Check movie has impact_analysis: `SELECT impact_analysis FROM movies WHERE slug = 'movie-slug'`
3. Check movie qualifies: rating >= 7.5 OR is_blockbuster OR is_classic
4. Check rollout phase matches movie tier
5. Restart dev server after changing .env.local

---

## Success Criteria

After completing all steps, you should have:

✅ **Database:**
- 3 new tables (entity_relations, inference_audit_log) + new columns in movies
- 27+ indexes for performance
- 10+ SQL functions for queries
- 8+ views for monitoring

✅ **Data:**
- 100+ movies with impact analysis
- 1,000+ movies with confidence scores
- 6,000+ entity relations
- 0 pending inferences (clean slate)

✅ **Features:**
- Movie impact sections visible on top movie pages
- Feature flags controlling rollout
- Weekly audit job ready to schedule

✅ **Monitoring:**
- Weekly audit reports generating
- Quality metrics tracked
- Low-confidence movies identified

---

## Next Actions

1. **Week 1:** Monitor user engagement with impact sections
2. **Week 2:** Expand to Phase 2 (more movies)
3. **Week 3:** Enable confidence scoring for public
4. **Week 4:** Run auto-fill jobs for music directors/producers
5. **Week 5:** Enable entity relations for queries

---

## Support

**Questions?** Check:
- `docs/AUDIT_REPORT.md` - System architecture
- `docs/IMPLEMENTATION_COMPLETE.md` - Full implementation details
- Migration SQL files - Comments explain each component
- Script files - Usage examples in headers

**Need help?** All scripts support `--help` flag for detailed options.

---

**Ready to begin?** Start with Step 1! 🚀
