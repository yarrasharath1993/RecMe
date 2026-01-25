# Bulk Publishing & Data Enrichment Plan

**Date:** January 15, 2026  
**Goal:** Publish all movies with sufficient data, flag rest for manual review

---

## 📊 Current State (Telugu Movies)

| Quality Level | Count | Action |
|---------------|-------|--------|
| ⭐⭐⭐ **Excellent** | **89** | Publish immediately |
| ⭐⭐ **Good** | **121** | Publish immediately |
| ⭐ **Basic** | **185** | Consider publishing |
| ❌ **Needs Review** | **44** | Manual review required |
| **Total Unpublished** | **439** | - |

### Ready to Publish: 210 Telugu Movies

**Impact on Major Stars:**
- Krishna: +13 movies
- Venkatesh: +4 movies
- Chiranjeevi: +4 movies
- Nagarjuna: +3 movies
- Balakrishna: +2 movies
- Pawan Kalyan: +2 movies
- Ram Charan: +1 movie

---

## ✅ Quality Criteria

### Excellent (⭐⭐⭐) - 89 movies
**Requirements:**
- ✅ Hero
- ✅ Director
- ✅ Rating
- ✅ Poster

**Action:** Publish immediately, no risk

### Good (⭐⭐) - 121 movies
**Requirements:**
- ✅ Hero OR Director
- ✅ Rating OR Poster

**Action:** Publish immediately, acceptable quality

### Basic (⭐) - 185 movies
**Requirements:**
- ✅ Hero OR Director only
- ❌ No rating or poster

**Action:** Can publish but lower priority

### Needs Review (❌) - 44 movies
**Missing:**
- ❌ No hero AND no director
- ❌ No rating AND no poster

**Action:** Manual review and enrichment needed

---

## 🚀 Execution Plan

### Phase 1: Publish Ready Movies (Today)

#### Step 1: Telugu Movies (Good & Excellent quality)

```bash
# Preview what will be published
npx tsx scripts/bulk-publish-ready-movies.ts --telugu-only --dry-run

# Execute publishing (210 movies)
npx tsx scripts/bulk-publish-ready-movies.ts --telugu-only

# Restart dev server
npm run dev
```

**Expected Result:**
- ✅ 210 Telugu movies published
- ✅ Krishna: 400 → 413 (+13)
- ✅ Nagarjuna: 76 → 79 (+3, includes 2 from earlier + 1 new)
- ✅ Chiranjeevi: 140 → 144 (+4)

#### Step 2: All Languages (Good & Excellent only)

```bash
# Publish good movies from all languages
npx tsx scripts/bulk-publish-ready-movies.ts --dry-run

# Execute
npx tsx scripts/bulk-publish-ready-movies.ts
```

**Expected Result:**
- ✅ ~900+ movies published (excellent + good quality)
- ✅ Platform completeness: 67% → 95%

### Phase 2: Manual Review List (Today)

The script automatically generates:
- `manual-review-needed.csv` - List of 44+ Telugu movies needing review

**CSV Format:**
```
ID,Title,Year,Language,Hero,Director,Rating,Poster,Issue
abc-123,"Movie Name",2020,Telugu,MISSING,MISSING,MISSING,MISSING,No cast/director; No rating/poster
```

**How to Use:**
1. Open in Excel/Google Sheets
2. Sort by Year (newest first)
3. Research each movie on IMDb/TMDB
4. Add missing data manually
5. Re-run publish script

### Phase 3: Data Enrichment (This Week)

For movies with partial data (Basic quality + Manual review):

**Options:**

#### Option A: Manual Research
- Use IMDb, TMDB, Wikipedia
- Copy data into database
- Time: 2-5 minutes per movie
- Total: 229 movies = 8-19 hours

#### Option B: TMDB API Integration
- Automatic data fetch
- Requires TMDB API key
- Match by title + year
- Time: Automated, ~1 hour setup

#### Option C: Hybrid Approach (Recommended)
- Auto-enrich with TMDB for 80%
- Manual review for remaining 20%
- Best accuracy + speed

---

## 📋 Commands Reference

### Dry Run (Preview Only)

```bash
# Telugu only, good quality
npx tsx scripts/bulk-publish-ready-movies.ts --telugu-only --dry-run

# All languages, good quality
npx tsx scripts/bulk-publish-ready-movies.ts --dry-run

# Telugu only, excellent quality only
npx tsx scripts/bulk-publish-ready-movies.ts --telugu-only --excellent --dry-run

# Telugu only, include basic quality
npx tsx scripts/bulk-publish-ready-movies.ts --telugu-only --basic --dry-run
```

### Live Execution

```bash
# Telugu only (recommended first step)
npx tsx scripts/bulk-publish-ready-movies.ts --telugu-only

# All languages (after Telugu success)
npx tsx scripts/bulk-publish-ready-movies.ts

# Excellent quality only (safest)
npx tsx scripts/bulk-publish-ready-movies.ts --telugu-only --excellent
```

### Options Available

| Flag | Effect |
|------|--------|
| `--dry-run` | Preview only, don't publish |
| `--telugu-only` | Only Telugu movies |
| `--excellent` | Only ⭐⭐⭐ quality |
| `--good` | ⭐⭐⭐ + ⭐⭐ (default) |
| `--basic` | All including ⭐ |

---

## 📊 Expected Results

### After Telugu Publishing (Phase 1)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Telugu unpublished | 439 | 229 | -210 (-48%) |
| Krishna movies visible | ~400 | ~413 | +13 |
| Nagarjuna movies visible | 76 | 79 | +3 |
| Chiranjeevi movies visible | ~140 | ~144 | +4 |
| Telugu completeness | 82% | 91% | +9% |

### After All Languages (Phase 2)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total unpublished | 1000 | ~100 | -900 (-90%) |
| Total visible movies | ~3,000 | ~3,900 | +900 (+30%) |
| Platform completeness | 67% | 97% | +30% |

---

## ⚠️ Safety Features

### Built-in Safeguards

1. **Quality Filtering**
   - Only publishes movies meeting criteria
   - No blind bulk publishing

2. **Dry Run Mode**
   - Always preview first
   - See exactly what will be published

3. **Batch Processing**
   - Publishes in batches of 100
   - Prevents timeout errors

4. **Error Handling**
   - Continues on individual errors
   - Reports success/failure counts

5. **Manual Review List**
   - Automatically generates CSV
   - Clear identification of issues

### Rollback Plan

If something goes wrong:

```sql
-- Rollback Telugu movies published today
UPDATE movies
SET is_published = false
WHERE language = 'Telugu'
  AND is_published = true
  AND updated_at > '2026-01-15 00:00:00';

-- Verify count before committing
SELECT COUNT(*) FROM movies
WHERE language = 'Telugu'
  AND is_published = true
  AND updated_at > '2026-01-15 00:00:00';
```

---

## 🎯 Success Criteria

### Phase 1 Success

- ✅ 210 Telugu movies published
- ✅ No errors during publishing
- ✅ All profiles show increased counts
- ✅ Manual review CSV generated
- ✅ Users can see new movies immediately

### Phase 2 Success

- ✅ 900+ movies published across all languages
- ✅ Platform completeness >95%
- ✅ Only 100 movies remain unpublished
- ✅ All remaining need genuine review

---

## 📝 Manual Review Workflow

### For Each Movie in manual-review-needed.csv

1. **Look up on IMDb/TMDB**
   - Search by title + year
   - Verify it's the correct movie

2. **Gather Required Data**
   - Hero (lead actor)
   - Director
   - Rating (our editorial rating or IMDb/TMDB rating)
   - Poster URL

3. **Update Database**
   ```sql
   UPDATE movies
   SET hero = 'Actor Name',
       director = 'Director Name',
       our_rating = 7.5,
       poster_url = 'https://...',
       is_published = true
   WHERE id = 'movie-id-from-csv';
   ```

4. **Or Delete if Invalid**
   ```sql
   -- If movie doesn't exist or is wrong data
   DELETE FROM movies WHERE id = 'movie-id-from-csv';
   ```

---

## 💡 Recommendations

### Immediate Actions (Today)

1. ✅ **Run Telugu publish script**
   ```bash
   npx tsx scripts/bulk-publish-ready-movies.ts --telugu-only
   ```

2. ✅ **Verify results**
   - Check profile pages
   - Verify counts increased
   - Test search functionality

3. ✅ **Review manual-review-needed.csv**
   - Identify quick wins (movies with easy-to-find data)
   - Prioritize recent movies (2020+)

### This Week

1. 🔄 **Publish all languages**
   ```bash
   npx tsx scripts/bulk-publish-ready-movies.ts
   ```

2. 📝 **Process manual review list**
   - Start with newest movies
   - Use IMDb/TMDB for data
   - Aim for 10-20 movies per day

3. 🔍 **Quality check**
   - Spot check published movies
   - Ensure data quality maintained
   - Fix any issues found

### This Month

1. 🎯 **Complete manual reviews**
   - Target: <50 unpublished movies
   - Platform completeness: 99%

2. 🔄 **Set up TMDB integration**
   - Auto-enrich future imports
   - Prevent future unpublished backlog

3. 📊 **Update import workflow**
   - Auto-publish if quality criteria met
   - Flag for review if missing data
   - Prevent 1000+ backlog again

---

## 🚀 Ready to Execute?

### Recommended Sequence

```bash
# 1. Preview Telugu (safe)
npx tsx scripts/bulk-publish-ready-movies.ts --telugu-only --dry-run

# 2. Execute Telugu (recommended)
npx tsx scripts/bulk-publish-ready-movies.ts --telugu-only

# 3. Restart server
npm run dev

# 4. Verify in browser
# Check: Krishna, Nagarjuna, Chiranjeevi profiles

# 5. If all good, publish all languages
npx tsx scripts/bulk-publish-ready-movies.ts --dry-run
npx tsx scripts/bulk-publish-ready-movies.ts

# 6. Review manual-review-needed.csv
# Open in Excel, start enrichment
```

**Time estimate:**
- Script execution: 5 minutes
- Verification: 10 minutes
- Total: 15 minutes for 210 movies! 🚀

---

## Summary

**Created:**
- ✅ `scripts/bulk-publish-ready-movies.ts` - Smart publishing script
- ✅ `BULK-PUBLISH-PLAN-2026-01-15.md` - This document

**Ready to publish:**
- ✅ 210 Telugu movies (Good & Excellent quality)
- ✅ 900+ total movies (all languages)

**Manual review needed:**
- ⚠️  44 Telugu movies
- ⚠️  ~100 total movies

**Impact:**
- 🚀 Platform completeness: 67% → 95%
- 🚀 Krishna: +13 movies
- 🚀 Nagarjuna: +3 movies
- 🚀 All major stars benefit

**Execute now to unleash 210 Telugu movies!** 🎬
