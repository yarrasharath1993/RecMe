# Remaining Issues - Batch Processing Summary

**Date**: January 13, 2026  
**Script**: `process-remaining-issues.ts`  
**Total Processed**: 252 movies (first batch)  
**Auto-Fixed**: 12 movies  
**Manual Review Needed**: 190 movies  

---

## 🎯 Executive Summary

After detecting and fixing patterns across 843 movies, **415 movies remain** with data quality issues that require either manual review or targeted enrichment. 

The first batch of **252 movies has been processed**, resulting in:
- ✅ **12 movies automatically fixed** (incomplete data enriched from TMDB)
- 📋 **190 movies flagged for manual review** (organized in CSV files)
- 🔄 **60 movies failed** auto-enrichment (need alternate sources)

---

## 📊 Batch 1 Results by Category

### 1. Wrong Hero Gender (50 movies) 📋

**Status**: All flagged for manual review  
**File**: `docs/manual-review/wrong-hero-gender-batch-[timestamp].csv`  
**Priority**: HIGH

| Result | Count | % |
|--------|-------|---|
| Manual Review | 50 | 100% |

**Issue**: Female actress names (like "Sridevi", "Soundarya") in "hero" field

**Sample Cases**:
```csv
Title: Kumara Sambhavam (1969)
Current: Hero = "Sridevi", Heroine = null
Action: Verify and swap if needed

Title: Himmatwala (1983)
Current: Hero = "Sridevi", Heroine = "Tamannaah Bhatia"
Action: Likely swap needed

Title: 16 Vayathinile (1977)
Current: Hero = "Sridevi", Heroine = "Kamal Haasan"
Action: Definite swap (Kamal to hero, Sridevi to heroine)
```

**Next Steps**:
1. Open CSV file in Excel/Google Sheets
2. Visit each movie URL
3. Verify cast from TMDB/Wikipedia
4. Mark action: SWAP, KEEP, or RESEARCH
5. Use helper script to apply fixes

---

### 2. No TMDB ID (50 movies) 🔍

**Status**: Attempted alternate search, all failed  
**File**: `docs/manual-review/no-tmdb-id-batch-[timestamp].csv`  
**Priority**: MEDIUM

| Result | Count | % |
|--------|-------|---|
| Auto-Fixed | 0 | 0% |
| Manual Review | 50 | 100% |

**Issue**: Movies not found in TMDB even with alternate searches

**Typical Movies**:
- Older Telugu films (1980s-1990s)
- Regional/low-budget productions
- Possible data entry errors

**Sample Cases**:
```csv
Title: Gandhinagar Rendava Veedhi (1987)
TMDB: Not found
Action: Research on Wikipedia/IMDb

Title: Padaharella Ammayi (1986)
TMDB: Not found
Action: Research or consider deletion

Title: Kaboye Alludu (1987)
TMDB: Not found
Action: Manual enrichment needed
```

**Next Steps**:
1. Research each movie on Wikipedia
2. Cross-check with IMDb
3. Extract: Director, Cast, Synopsis, Image
4. Use bulk enrichment script to update
5. Delete if confirmed invalid

---

### 3. Incomplete Data (50 movies) 📊

**Status**: 12 fixed, 38 need manual review  
**File**: `docs/manual-review/incomplete-data-batch-[timestamp].csv`  
**Priority**: MEDIUM

| Result | Count | % |
|--------|-------|---|
| Auto-Fixed | 12 | 24% |
| Manual Review | 38 | 76% |

**Issue**: 3+ critical fields missing (director, cast, genres, synopsis, poster)

**Auto-Fixed Examples** (12 movies):
- Had TMDB ID but incomplete data
- Successfully enriched from TMDB
- Added directors, genres, cast, synopses

**Manual Review Needed** (38 movies):
- No TMDB ID or incomplete TMDB data
- Need Wikipedia/IMDb research
- Or mark for deletion if invalid

**Sample Cases**:
```csv
Title: Balu ABCDEFG (2005)
Missing: director, genres, synopsis
TMDB: Not found
Action: Research or delete

Title: Prince of Peace (2012)
Missing: hero, heroine, poster
TMDB: N/A
Action: Manual enrichment
```

**Next Steps**:
1. Review missing fields for each movie
2. Research from alternate sources
3. Prioritize movies with most complete data
4. Use bulk enrichment script
5. Delete truly incomplete/invalid entries

---

### 4. Missing Images (50 movies) 🖼️

**Status**: All need manual image search  
**File**: `docs/manual-review/missing-images-batch-[timestamp].csv`  
**Priority**: LOW

| Result | Count | % |
|--------|-------|---|
| Auto-Fixed | 0 | 0% |
| Manual Review | 50 | 100% |

**Issue**: No poster image available (poster_url is null)

**Why Auto-Fix Failed**:
- No TMDB ID (can't fetch from TMDB)
- TMDB has no poster for these movies
- Older/obscure films

**Sample Cases**:
```csv
Title: Gandhinagar Rendava Veedhi (1987)
Poster: null
TMDB ID: N/A
Action: Google Images search

Title: Preminchi Choodu (1989)
Poster: null
TMDB ID: N/A
Action: Wikipedia/Archive.org search
```

**Next Steps**:
1. Google "[Movie Title] [Year] telugu poster"
2. Check Wikipedia for movie infobox image
3. Search IMDb for poster
4. Verify image quality (min 300x450px)
5. Use bulk image update script

---

### 5. Potential Duplicates (2 movies) 🔄

**Status**: Flagged for comparison  
**File**: `docs/manual-review/potential-duplicates-batch-[timestamp].csv`  
**Priority**: HIGH

| Result | Count | % |
|--------|-------|---|
| Manual Review | 2 | 100% |

**Issue**: Same title and year, possibly duplicate entries

**Review Process**:
1. Open both movie URLs side-by-side
2. Compare director, cast, plot
3. Decide: MERGE, KEEP BOTH, or DELETE ONE
4. Use merge script if merging

**Why Manual Review**:
- Could be remakes (keep both)
- Could be regional versions (keep both)
- Could be true duplicates (merge)
- Risk of data loss if auto-merged incorrectly

---

## 📈 Overall Statistics

### Batch 1 (First 252 movies processed)

```
╔═══════════════════════════════════════════════════════╗
║         BATCH 1 SUMMARY                               ║
╚═══════════════════════════════════════════════════════╝

Total Processed:           252 movies
Auto-Fixed:                 12 movies (5%)
Manual Review Needed:      190 movies (75%)
Failed (No Action):         50 movies (20%)

By Category:
  Wrong Hero Gender:        50 (100% manual)
  No TMDB ID:              50 (100% manual)
  Incomplete Data:         50 (24% fixed, 76% manual)
  Missing Images:          50 (100% manual)
  Potential Duplicates:     2 (100% manual)
```

### Remaining Work

```
╔═══════════════════════════════════════════════════════╗
║         REMAINING ISSUES                              ║
╚═══════════════════════════════════════════════════════╝

Total Remaining:           ~163 movies (415 - 252)

By Category:
  Wrong Hero Gender:       ~85 (135 total - 50 processed)
  No TMDB ID:             ~50 (100 total - 50 processed)
  Incomplete Data:        ~35 (85 total - 50 processed)
  Missing Images:         ~43 (93 total - 50 processed)
  Potential Duplicates:     0 (2 total - 2 processed)
```

---

## 🛠️ Manual Review Files

### Location
All files in: `docs/manual-review/`

### Files Generated

1. **wrong-hero-gender-batch-[timestamp].csv** (7.8 KB)
   - 50 movies with female names in hero field
   - Columns: slug, title, year, current_hero, current_heroine, director, issue, action_needed, url

2. **no-tmdb-id-batch-[timestamp].csv** (6.7 KB)
   - 50 movies not in TMDB
   - Columns: slug, title, title_te, year, director, action, url

3. **incomplete-data-batch-[timestamp].csv** (6.9 KB)
   - 38 movies with 3+ missing fields
   - Columns: slug, title, year, missing_fields, tmdb_id, action, url

4. **missing-images-batch-[timestamp].csv** (6.7 KB)
   - 50 movies without posters
   - Columns: slug, title, year, tmdb_id, action, url

5. **potential-duplicates-batch-[timestamp].csv** (769 B)
   - 2 movie pairs to compare
   - Columns: movie1_slug, movie1_title, movie2_slug, movie2_title, year, directors, action, urls

---

## 🚀 Next Actions

### Immediate (Today)

1. **Review Potential Duplicates** (15 minutes)
   - Open CSV, compare 2 pairs
   - Decide: merge or keep
   - High priority, quick win

2. **Process Wrong Hero Gender - Sample** (30 minutes)
   - Review first 10 movies from CSV
   - Verify and mark actions
   - Test manual fix workflow

### Short-term (This Week)

1. **Batch Process Wrong Hero Gender** (2-3 hours)
   - Complete all 50 from batch 1
   - Run batch 2 for remaining 85
   - Apply fixes using helper script

2. **Research No TMDB ID** (3-4 hours)
   - Wikipedia research for 25 movies
   - IMDb cross-verification
   - Enrich or mark for deletion

3. **Run Batch 2** (1 hour)
   - Process remaining 163 movies
   - Generate new manual review CSVs
   - Auto-fix what's possible

### Medium-term (Next 2 Weeks)

1. **Complete Manual Review** (8-10 hours total)
   - All wrong hero gender issues
   - All incomplete data research
   - All missing image searches

2. **Cleanup** (2 hours)
   - Delete confirmed invalid movies
   - Merge confirmed duplicates
   - Final data validation

---

## 📚 Documentation Reference

### For Manual Review Process
See: `docs/MANUAL-REVIEW-GUIDE.md`
- Detailed review workflows
- Research templates
- Helper scripts usage
- Time-saving tips

### For Overall Progress
See: `docs/DATA-QUALITY-MASTER-SUMMARY.md`
- Complete audit overview
- All fixes applied so far
- Metrics and improvements

### For Pattern Detection
See: `docs/PATTERN-FIX-SUMMARY.md`
- Pattern detection methodology
- Auto-fix success rates
- Recommendations

---

## 💡 Key Insights

### What Worked

✅ **Incomplete Data Enrichment**: 24% success rate for movies with TMDB IDs  
✅ **CSV Generation**: Clean, organized manual review files  
✅ **Batch Processing**: Systematic approach prevents data loss  
✅ **Categorization**: Clear separation by issue type  

### Challenges

❌ **Older Movies**: Pre-1990 films often lack TMDB coverage  
❌ **Image Sources**: Many movies have no online poster images  
❌ **Data Verification**: Cast attribution needs human judgment  
❌ **Time Investment**: Manual review estimated 10-13 hours  

### Recommendations

1. **Prioritize High-Impact Movies**
   - Focus on popular movies first
   - Recent films (2000+) before older ones
   - Movies with most views/ratings

2. **Batch Similar Work**
   - Review same actor/director movies together
   - Research related movies in one session
   - Use templates for consistency

3. **Accept Limitations**
   - Some movies may never have complete data
   - Older films might need deletion
   - Perfect data not always achievable

---

## 🎯 Success Criteria

### After Completing All Batches

Target metrics:
```
✓ Wrong Hero Gender: 0 remaining (100% reviewed)
✓ Data Completeness: >95% for post-2000 movies
✓ Image Coverage: >90% for post-2000 movies
✓ Duplicates: 0 confirmed duplicates
✓ Invalid Entries: Deleted or marked for future research
```

---

## 🔄 Running More Batches

### Process Additional Movies

```bash
# Run batch 2 (next 50 of each category)
npx tsx scripts/process-remaining-issues.ts --batch=50 --execute

# Run specific category only
npx tsx scripts/process-remaining-issues.ts --category=no_tmdb_id --batch=50 --execute

# Run smaller batch for testing
npx tsx scripts/process-remaining-issues.ts --batch=20 --execute
```

### Categories Available
- `wrong_hero_gender`
- `no_tmdb_id`
- `incomplete_data`
- `missing_images`
- `potential_duplicates`

---

## ✅ Completion Checklist

- [ ] Batch 1 processed (252 movies) ✅
- [ ] Manual review files generated ✅
- [ ] Review guide created ✅
- [ ] Potential duplicates reviewed (2 movies)
- [ ] Wrong hero gender batch 1 reviewed (50 movies)
- [ ] No TMDB ID batch 1 researched (50 movies)
- [ ] Incomplete data batch 1 enriched (38 movies)
- [ ] Missing images batch 1 found (50 movies)
- [ ] Batch 2 processed (remaining ~163 movies)
- [ ] All manual reviews completed
- [ ] Helper scripts applied for bulk updates
- [ ] Final audit run to verify improvements
- [ ] Documentation updated with final metrics

---

**Status**: ✅ Batch 1 Complete - Ready for Manual Review

**Next Step**: Review `docs/MANUAL-REVIEW-GUIDE.md` and start with potential duplicates (15 minutes, quick win!)

---

**End of Batch Summary**
