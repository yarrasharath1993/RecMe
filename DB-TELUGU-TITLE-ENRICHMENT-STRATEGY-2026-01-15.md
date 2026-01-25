# DATABASE TELUGU TITLE ENRICHMENT STRATEGY
**Date:** 2026-01-15
**Goal:** Add Telugu titles to 765 database movies

---

## Current State

- **Total movies:** 1000
- **With Telugu titles:** 235 (24%)
- **Missing Telugu titles:** 765 (77%)

---

## Priority Breakdown

- 🔴 **CRITICAL:** 490 movies (2022+ Published)
- 🟠 **HIGH:** 0 movies (2022+ Unpublished)
- 🔵 **MEDIUM:** 275 movies (Pre-2022 Published)
- ⚪ **LOW:** 0 movies (Old/Unpublished)

---

## Enrichment Phases


### Phase 1: CRITICAL PRIORITY (${priorities.critical.length} movies)

**Target:** 100% completion

**Method:**
1. Manual review using `DB-CRITICAL-MOVIES-NEED-TELUGU-TITLES.csv`
2. Search for official posters/websites for accurate Telugu titles
3. Use Google Translate API as fallback
4. Quality check every title

**Expected Impact:** Health score +${Math.round((priorities.critical.length/withoutTelugu.length)*25)} points
**Timeline:** 1-2 days

### Phase 2: HIGH PRIORITY (${priorities.high.length} movies)

**Target:** 80% completion

**Method:**
1. Automated translation using Google Translate API
2. Spot check 20% for quality
3. Manual fix for major releases

**Expected Impact:** Health score +${Math.round((priorities.high.length/withoutTelugu.length)*20)} points
**Timeline:** 1 day

### Phase 3: MEDIUM PRIORITY (${priorities.medium.length} movies)

**Target:** 50% completion

**Method:**
1. Bulk translation
2. Focus on movies with poster images
3. Quality check sample set

**Expected Impact:** Health score +${Math.round((priorities.medium.length/withoutTelugu.length)*15)} points
**Timeline:** 2-3 days

---

## Missing Telugu Titles by Year


| Year | Missing | Total | % Missing |
|------|---------|-------|-----------|
| 2027 | 0 | 1 | 0% |
| 2026 | 14 | 39 | 36% |
| 2025 | 61 | 108 | 56% |
| 2024 | 166 | 176 | 94% |
| 2023 | 132 | 148 | 89% |
| 2022 | 117 | 145 | 81% |
| 2021 | 110 | 150 | 73% |
| 2020 | 55 | 68 | 81% |
| 2019 | 110 | 128 | 86% |
| 2018 | 0 | 37 | 0% |

---

## Tools & Resources


### Available Files:
- `DB-CRITICAL-MOVIES-NEED-TELUGU-TITLES.csv` - Critical priority movies
- `DB-HIGH-PRIORITY-NEED-TELUGU-TITLES.csv` - High priority movies

### Recommended Approach:
1. Start with critical movies (most visible on site)
2. Use TMDB/IMDB for official Telugu titles
3. Use Google Translate as fallback
4. Quality check with native Telugu speaker

### Scripts Available:
- `bulk-translate-telugu-titles.ts` - Automated translation
- `import-telugu-titles-batch.ts` - Import corrected titles
- `verify-telugu-titles.ts` - Quality check

---

## Expected Outcomes


### After Phase 1:
- Telugu titles: 235 → 725 (+490)
- Completion: 24% → 73%
- Health score: 67 → ~83

### After Phase 2:
- Telugu titles: 725 → 725
- Completion: 73% → 73%
- Health score: ~83 → ~83

### After Phase 3:
- Telugu titles: Target 80%+ completion
- Health score: Target 85-90
- Grade: B+ to A-

---

## Success Metrics


- **Phase 1 Success:** 100% of critical movies have accurate Telugu titles
- **Phase 2 Success:** 80% of high priority movies have Telugu titles
- **Phase 3 Success:** Overall completion ≥ 75%
- **Final Goal:** Health score ≥ 85 (B+ grade)
