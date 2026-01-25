# Box Office Rating System - Quick Reference Guide

> **Last Updated:** January 15, 2026  
> **Status:** Production Ready ✅

---

## Overview

The box office rating system applies commercial success weightages to base ratings, ensuring movies are rated fairly based on both critical quality and box office performance.

---

## Rating Formula

```
Final Rating = Base Rating + Box Office Boost/Penalty
```

### Base Rating Components (Weighted Average)

| Component | Weight | Source |
|-----------|--------|--------|
| Story Score | 25% | Editorial review dimensions |
| Direction Score | 25% | Editorial review dimensions |
| Performance Scores | 20% | Average of lead actor scores |
| TMDB/Avg Rating | 20% | External rating (capped at 8.5) |
| Review Rating | 10% | Existing review overall rating |

### Box Office Weightages

| Category | Boost/Penalty | When to Use |
|----------|--------------|-------------|
| **Industry Hit** | +1.0 | Top grosser of year/era, legendary status |
| **Blockbuster** | +0.7 | Huge commercial success, 3x+ ROI |
| **Super Hit** | +0.5 | Very successful, 2-3x ROI |
| **Hit** | +0.3 | Commercially successful, 1.5-2x ROI |
| **Average** | 0.0 | Broke even, 0.8-1.5x ROI |
| **Below Average** | -0.2 | Lost money, 0.5-0.8x ROI |
| **Disaster** | -0.5 | Major flop, < 0.5x ROI |

---

## Script Usage

### Basic Commands

```bash
# Audit mode - see what would change
npx tsx scripts/audit-apply-box-office-ratings.ts --audit

# Apply mode - dry run
npx tsx scripts/audit-apply-box-office-ratings.ts --apply

# Apply mode - execute changes
npx tsx scripts/audit-apply-box-office-ratings.ts --apply --execute
```

### Filtering Options

```bash
# Filter by category
npx tsx scripts/audit-apply-box-office-ratings.ts \
  --category=blockbuster --apply --execute

# Process single movie
npx tsx scripts/audit-apply-box-office-ratings.ts \
  --slug=pokiri-2006 --apply --execute

# Limit batch size
npx tsx scripts/audit-apply-box-office-ratings.ts \
  --apply --execute --limit=100
```

### Available Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--audit` | Show what would change (no updates) | `--audit` |
| `--apply` | Apply changes mode | `--apply` |
| `--execute` | Actually execute updates (required) | `--execute` |
| `--category=<cat>` | Filter by box office category | `--category=hit` |
| `--slug=<slug>` | Process single movie | `--slug=pokiri-2006` |
| `--limit=<N>` | Limit number of movies | `--limit=500` |

---

## Expected Rating Ranges

| Box Office Category | Typical Final Rating Range |
|---------------------|---------------------------|
| Industry Hit | 9.0 - 10.0 |
| Blockbuster | 7.5 - 9.0 |
| Super Hit | 7.0 - 8.5 |
| Hit | 6.5 - 8.0 |
| Average | 5.0 - 7.0 |
| Below Average | 3.0 - 5.5 |
| Disaster | 1.0 - 4.0 |

---

## Examples

### Example 1: Industry Hit
```
Movie: Thriller 40 (2023)
Category: industry-hit
Base Rating: 8.5
Box Office Boost: +1.0
Final Rating: 9.5 ✅
```

### Example 2: Blockbuster
```
Movie: Salaar: Part 2
Category: blockbuster
Base Rating: 6.0
Box Office Boost: +0.7
Final Rating: 6.7 ✅
```

### Example 3: Hit
```
Movie: Deadpool & Wolverine (2024)
Category: hit
Base Rating: 7.6
Box Office Boost: +0.3
Final Rating: 7.9 ✅
```

### Example 4: Below Average
```
Movie: Failed Film X
Category: below-average
Base Rating: 5.0
Box Office Penalty: -0.2
Final Rating: 4.8 ✅
```

---

## Assigning Box Office Categories

### Manual Assignment (Current)

Update the `box_office_category` column in the `movies` table:

```sql
UPDATE movies
SET box_office_category = 'blockbuster'
WHERE slug = 'movie-slug-2023';
```

### Category Assignment Guidelines

**Industry Hit** (Top 1-2 per year)
- Highest grosser of the year
- Cultural phenomenon
- Breaks records
- Example: RRR, Baahubali 2

**Blockbuster** (3-5 per year)
- Massive commercial success
- 3x+ ROI
- Talked about for months
- Example: Pushpa, KGF 2

**Super Hit** (10-15 per year)
- Very successful
- 2-3x ROI
- Strong word of mouth
- Example: Ala Vaikunthapurramuloo

**Hit** (20-30 per year)
- Commercially successful
- 1.5-2x ROI
- Profitable
- Example: Most successful films

**Average** (50-100 per year)
- Broke even
- 0.8-1.5x ROI
- Neither hit nor flop
- Example: Most releases

**Below Average** (20-30 per year)
- Lost money
- 0.5-0.8x ROI
- Disappointing
- Example: Underperformers

**Disaster** (10-20 per year)
- Major flop
- < 0.5x ROI
- Significant losses
- Example: Major failures

---

## Workflow

### For New Movie Releases

1. **Wait for box office results** (2-4 weeks after release)
2. **Calculate ROI** = Lifetime Collections / Budget
3. **Assign category** based on ROI and cultural impact
4. **Run script** to update rating:
   ```bash
   npx tsx scripts/audit-apply-box-office-ratings.ts \
     --slug=new-movie-2026 --apply --execute
   ```

### For Bulk Updates

1. **Assign categories** to multiple movies via SQL
2. **Run audit** to preview changes:
   ```bash
   npx tsx scripts/audit-apply-box-office-ratings.ts --audit
   ```
3. **Apply updates**:
   ```bash
   npx tsx scripts/audit-apply-box-office-ratings.ts --apply --execute
   ```

### For Rating Corrections

1. **Identify movie** needing correction
2. **Update category** if needed:
   ```sql
   UPDATE movies
   SET box_office_category = 'super-hit'
   WHERE slug = 'movie-slug';
   ```
3. **Recalculate rating**:
   ```bash
   npx tsx scripts/audit-apply-box-office-ratings.ts \
     --slug=movie-slug --apply --execute
   ```

---

## Troubleshooting

### Issue: Rating not updating

**Check:**
1. Does movie have `box_office_category` set?
2. Is difference >= 0.3? (threshold for updates)
3. Are there review dimensions available?

**Solution:**
```bash
# Force update for single movie
npx tsx scripts/audit-apply-box-office-ratings.ts \
  --slug=movie-slug --apply --execute
```

### Issue: Rating seems wrong

**Check:**
1. Is box office category correct?
2. Are review dimensions accurate?
3. Is TMDB/avg rating reasonable?

**Solution:**
1. Update category if needed
2. Update review dimensions
3. Re-run script

### Issue: Batch update failed

**Check:**
1. Database connection
2. Permissions
3. Data integrity

**Solution:**
```bash
# Run with smaller batch
npx tsx scripts/audit-apply-box-office-ratings.ts \
  --apply --execute --limit=100
```

---

## Best Practices

### DO ✅
- Run audit mode first
- Use appropriate box office categories
- Update categories based on actual performance
- Document major rating changes
- Run script after category updates

### DON'T ❌
- Assign categories before box office results
- Use blockbuster for average films
- Skip audit mode for bulk updates
- Update ratings manually (use script)
- Ignore the 0.3 threshold

---

## Maintenance

### Regular Tasks

**Weekly:**
- Review new releases
- Assign box office categories
- Run script for new assignments

**Monthly:**
- Audit rating distribution
- Check for anomalies
- Update categories if needed

**Quarterly:**
- Review weightage effectiveness
- Analyze rating accuracy
- Adjust formula if needed

---

## Database Schema Reference

### Movies Table
```sql
-- Box office category
box_office_category TEXT CHECK (box_office_category IN (
  'industry-hit', 'blockbuster', 'super-hit', 'hit',
  'average', 'below-average', 'disaster'
));

-- Final rating (updated by script)
our_rating DECIMAL(3,1);

-- Average rating (from TMDB)
avg_rating DECIMAL(3,1);

-- Other relevant fields
is_blockbuster BOOLEAN;
is_classic BOOLEAN;
is_underrated BOOLEAN;
```

### Movie Reviews Table
```sql
-- Synchronized with movies.our_rating
overall_rating DECIMAL(3,1);

-- Review dimensions (used in base calculation)
dimensions_json JSONB;
```

---

## Support

### Documentation
- **Detailed Report:** `/BOX-OFFICE-RATING-AUDIT-REPORT-2026-01-15.md`
- **Complete Summary:** `/BOX-OFFICE-RATING-COMPLETE-SUMMARY.md`
- **This Guide:** `/docs/BOX-OFFICE-RATING-GUIDE.md`

### Script Location
- **Path:** `/scripts/audit-apply-box-office-ratings.ts`
- **Lines:** 502
- **Language:** TypeScript

### Related Scripts
- `scripts/calibrate-ratings.ts` - Legacy rating calibration
- `scripts/recalibrate-rating-breakdowns.ts` - Breakdown recalibration
- `scripts/enrich-editorial-scores.ts` - Editorial score generation

---

**Last Updated:** January 15, 2026  
**Version:** 1.0  
**Status:** Production Ready ✅
