# 🚀 Commands Cheat Sheet: Movie Impact System

Quick reference for all scripts and commands.

---

## Initial Setup

```bash
# Test environment variables
npx tsx -e "import * as dotenv from 'dotenv'; dotenv.config({ path: '.env.local' }); console.log('MOVIE_IMPACT:', process.env.NEXT_PUBLIC_FEATURE_MOVIE_IMPACT);"
```

---

## Movie Impact Calculation

```bash
# Dry run - see what will be processed (no changes)
npx tsx scripts/calculate-movie-impact.ts --top-only --dry-run

# Process top 100 movies
npx tsx scripts/calculate-movie-impact.ts --top-only --execute

# Process top 500 movies
npx tsx scripts/calculate-movie-impact.ts --limit=500 --execute

# Process all significant movies (rating > 7 OR blockbuster OR classic)
npx tsx scripts/calculate-movie-impact.ts --execute

# Process single movie by slug
npx tsx scripts/calculate-movie-impact.ts --slug=baahubali --execute

# Recalculate existing impact analyses
npx tsx scripts/calculate-movie-impact.ts --recalculate --execute
```

---

## Confidence Score Backfill

```bash
# Dry run - see statistics without changes
npx tsx scripts/backfill-confidence-scores.ts --limit=1000 --dry-run

# Process first 1000 movies
npx tsx scripts/backfill-confidence-scores.ts --limit=1000 --execute

# Process ALL movies
npx tsx scripts/backfill-confidence-scores.ts --all --execute

# Only recalculate low-confidence movies (<0.6)
npx tsx scripts/backfill-confidence-scores.ts --low-only --execute

# Force recalculation even if scores exist
npx tsx scripts/backfill-confidence-scores.ts --recalculate --execute

# Use higher concurrency (faster, more resource intensive)
npx tsx scripts/backfill-confidence-scores.ts --concurrency=100 --execute
```

---

## Entity Relations Population

```bash
# Dry run
npx tsx scripts/populate-entity-relations.ts --limit=1000 --dry-run

# Process first 1000 movies
npx tsx scripts/populate-entity-relations.ts --limit=1000 --execute

# Process ALL movies
npx tsx scripts/populate-entity-relations.ts --all --execute

# Process single movie
npx tsx scripts/populate-entity-relations.ts --slug=baahubali --execute

# Clear and repopulate (use with caution!)
npx tsx scripts/populate-entity-relations.ts --clear --all --execute
```

---

## Weekly Audit

```bash
# Run weekly audit (read-only checks)
npx tsx scripts/weekly-audit.ts

# Run with updates (recalculate confidence for updated movies)
npx tsx scripts/weekly-audit.ts --execute
```

---

## Useful SQL Queries

### Check Impact Analysis Coverage

```sql
SELECT 
  COUNT(*) as total_movies,
  COUNT(impact_analysis) as with_impact,
  ROUND((COUNT(impact_analysis)::numeric / COUNT(*)) * 100, 1) as coverage_pct
FROM movies
WHERE is_published = true;
```

### View Impact Significance Distribution

```sql
SELECT 
  impact_analysis->>'significance_tier' as tier,
  COUNT(*) as count
FROM movies
WHERE impact_analysis IS NOT NULL
GROUP BY impact_analysis->>'significance_tier'
ORDER BY count DESC;
```

### Check Confidence Score Distribution

```sql
SELECT 
  CASE 
    WHEN confidence_score >= 0.90 THEN '0.90-1.00 (Excellent)'
    WHEN confidence_score >= 0.80 THEN '0.80-0.89 (High)'
    WHEN confidence_score >= 0.70 THEN '0.70-0.79 (Good)'
    WHEN confidence_score >= 0.60 THEN '0.60-0.69 (Medium)'
    WHEN confidence_score >= 0.50 THEN '0.50-0.59 (Low)'
    ELSE '0.00-0.49 (Very Low)'
  END as confidence_range,
  COUNT(*) as movie_count,
  ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM movies WHERE confidence_score IS NOT NULL)), 1) as percentage
FROM movies
WHERE confidence_score IS NOT NULL
GROUP BY confidence_range
ORDER BY confidence_range;
```

### View Low Confidence Movies

```sql
SELECT 
  title_en,
  release_year,
  confidence_score,
  governance_flags
FROM movies
WHERE confidence_score < 0.60
  AND is_published = true
ORDER BY confidence_score ASC
LIMIT 20;
```

### Check Entity Relations Stats

```sql
SELECT 
  role_type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE is_verified = true) as verified,
  COUNT(*) FILTER (WHERE is_inferred = true) as inferred,
  ROUND(AVG(confidence)::numeric, 2) as avg_confidence
FROM entity_relations
GROUP BY role_type
ORDER BY count DESC;
```

### View Inference Audit Log

```sql
SELECT 
  entity_identifier,
  field_name,
  inferred_value,
  confidence,
  inference_type,
  status,
  created_at
FROM inference_audit_log
ORDER BY created_at DESC
LIMIT 20;
```

### Find Movies Ready for Impact Analysis

```sql
SELECT 
  id,
  title_en,
  release_year,
  our_rating,
  is_blockbuster,
  is_classic
FROM movies
WHERE impact_analysis IS NULL
  AND is_published = true
  AND (
    our_rating >= 7.0
    OR is_blockbuster = true
    OR is_classic = true
  )
ORDER BY our_rating DESC NULLS LAST
LIMIT 50;
```

### System Health Dashboard

```sql
WITH stats AS (
  SELECT 
    (SELECT COUNT(*) FROM movies WHERE is_published = true) as total_movies,
    (SELECT COUNT(*) FROM movies WHERE impact_analysis IS NOT NULL) as with_impact,
    (SELECT COUNT(*) FROM movies WHERE confidence_score IS NOT NULL) as with_confidence,
    (SELECT COUNT(*) FROM entity_relations) as total_relations,
    (SELECT COUNT(*) FROM inference_audit_log WHERE status = 'pending') as pending_inferences,
    (SELECT AVG(confidence_score) FROM movies WHERE confidence_score IS NOT NULL) as avg_confidence
)
SELECT 
  'Total Published Movies' as metric,
  total_movies::text as value
FROM stats
UNION ALL
SELECT 
  'Movies with Impact Analysis',
  with_impact || ' (' || ROUND((with_impact::numeric / total_movies) * 100, 1) || '%)'
FROM stats
UNION ALL
SELECT 
  'Movies with Confidence Score',
  with_confidence || ' (' || ROUND((with_confidence::numeric / total_movies) * 100, 1) || '%)'
FROM stats
UNION ALL
SELECT 
  'Total Entity Relations',
  total_relations::text
FROM stats
UNION ALL
SELECT 
  'Pending Inferences',
  pending_inferences::text
FROM stats
UNION ALL
SELECT 
  'Average Confidence',
  ROUND(avg_confidence::numeric, 3)::text
FROM stats;
```

---

## Feature Flag Environment Variables

```bash
# Phase 1: Top movies only
export NEXT_PUBLIC_FEATURE_MOVIE_IMPACT=true
export NEXT_PUBLIC_IMPACT_ROLLOUT_PHASE=1
export NEXT_PUBLIC_FEATURE_COUNTERFACTUAL=true
export NEXT_PUBLIC_COUNTERFACTUAL_PHASE=1

# Phase 2: Expand to rated movies
export NEXT_PUBLIC_IMPACT_ROLLOUT_PHASE=2
export NEXT_PUBLIC_COUNTERFACTUAL_PHASE=2

# Phase 3: All movies
export NEXT_PUBLIC_IMPACT_ROLLOUT_PHASE=3
export NEXT_PUBLIC_COUNTERFACTUAL_PHASE=3

# Enable confidence scoring (Admin first)
export NEXT_PUBLIC_FEATURE_CONFIDENCE=true
export NEXT_PUBLIC_CONFIDENCE_ADMIN_ONLY=true

# Enable for public
export NEXT_PUBLIC_CONFIDENCE_ADMIN_ONLY=false

# Enable auto-fill (Admin only)
export NEXT_PUBLIC_FEATURE_AUTO_FILL=true

# Enable inference review (Admin only)
export NEXT_PUBLIC_FEATURE_INFERENCE_REVIEW=true

# Enable entity relations
export NEXT_PUBLIC_FEATURE_ENTITY_RELATIONS=true
```

---

## Monitoring Commands

```bash
# Check weekly audit reports
ls -la docs/reports/

# View latest audit report
cat docs/reports/weekly-audit-$(date +%Y-%m-%d).md

# Count files created
find . -name "*.ts" -o -name "*.tsx" -o -name "*.sql" | grep -E "(impact-analyzer|confidence-calculator|gap-filler|feature-flags|calculate-movie-impact|backfill-confidence|populate-entity|weekly-audit|MovieImpactSection|033-confidence|034-entity|035-inference)" | wc -l
```

---

## Development Commands

```bash
# Restart dev server (after .env.local changes)
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Run linter
npm run lint
```

---

## Emergency Commands

```bash
# Rollback: Disable all features
export NEXT_PUBLIC_FEATURE_MOVIE_IMPACT=false
export NEXT_PUBLIC_FEATURE_CONFIDENCE=false
export NEXT_PUBLIC_FEATURE_AUTO_FILL=false
export NEXT_PUBLIC_FEATURE_COUNTERFACTUAL=false
export NEXT_PUBLIC_FEATURE_INFERENCE_REVIEW=false

# Clear inference audit log (if needed)
# WARNING: This deletes all inference history!
psql "$DB_URL" -c "TRUNCATE inference_audit_log;"

# Clear entity relations (if needed to repopulate)
# WARNING: This deletes all relations!
psql "$DB_URL" -c "TRUNCATE entity_relations;"
```

---

## Pro Tips

💡 **Always dry-run first** - Every script supports `--dry-run` to preview changes

💡 **Use limits during testing** - Start with `--limit=100` before processing all data

💡 **Monitor progress** - Scripts show real-time progress and statistics

💡 **Check reports** - Weekly audit generates markdown reports in `docs/reports/`

💡 **Feature flags are your friend** - Toggle features without code changes

💡 **SQL views are helpful** - Use built-in views like `low_confidence_movies` and `inference_review_queue`

---

**Quick Help:** All scripts support `--help` flag for detailed options
```bash
npx tsx scripts/calculate-movie-impact.ts --help
```
