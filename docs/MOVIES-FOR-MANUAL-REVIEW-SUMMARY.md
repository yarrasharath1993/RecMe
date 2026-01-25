# Movies for Manual Review - Summary

**Date:** January 18, 2026  
**Total Movies Needing Review:** 797

## Overview

Comprehensive audit identified movies across 4 categories that require manual review and potential fixes.

## Summary by Category

### 1. Missing Ratings (High Priority) - 125 movies

**Issue:** Released movies missing both `our_rating` and `avg_rating`

**Impact:** High - Affects user experience, sorting, and recommendations

**Action Required:**
- Review each movie
- Add rating from IMDB/TMDB
- Or provide editorial rating if external sources unavailable

**Note:** Unreleased movies (2026+, -tba slugs) are correctly excluded

---

### 2. Missing Posters (Low Priority) - 665 movies

**Issue:** Missing `poster_url` (will show placeholder)

**Impact:** Low - Placeholder system works, but posters improve UX

**Action Required:**
- Add poster URLs from TMDB or other sources
- Can be done incrementally
- Priority: Recent releases and popular movies first

---

### 3. Suspicious Titles (Medium Priority) - 4 movies

**Issue:** Titles that are very short or unusual (may be legitimate like "F1", "83", "Ui")

**Impact:** Medium - Need verification these are correct titles

**Action Required:**
- Verify each title is correct
- Some may be legitimate (e.g., "F1", "83", "Ui", "3e")
- Update if incorrect

---

### 4. Slug Format Issues (Low Priority) - 3 movies

**Issue:** Slug format doesn't match expected pattern

**Impact:** Low - Minor formatting issue

**Action Required:**
- Review slug format
- Update if needed (unreleased should have -tba, released should have year)

---

## Priority Recommendations

### Immediate Action (High Priority)
1. **Missing Ratings (125 movies)** - Start with recent releases and popular movies
2. **Suspicious Titles (4 movies)** - Quick verification needed

### Incremental Action (Low Priority)
1. **Missing Posters (665 movies)** - Can be done over time, prioritize popular/recent
2. **Slug Format Issues (3 movies)** - Minor fixes

## Files Generated

- **MOVIES-FOR-MANUAL-REVIEW.csv** - Complete list with details
  - Columns: Movie ID, Title, Year, Slug, Category, Issue, Severity, Current Value, Suggested Action
  - Sorted by severity (High → Medium → Low) and category

## Review Process

1. **Open CSV file** in spreadsheet application
2. **Filter by Severity** - Start with "High" priority items
3. **Filter by Category** - Review one category at a time
4. **Update database** - Apply fixes as you review
5. **Mark as reviewed** - Track progress in spreadsheet

## Next Steps

1. ✅ **Audit Complete** - 797 movies identified
2. 🔍 **Start Review** - Begin with High priority (Missing Ratings)
3. 📊 **Track Progress** - Update CSV as you review
4. 🔄 **Re-run Audit** - After fixes, re-run to verify improvements

---

**Status:** ✅ Ready for Manual Review  
**High Priority Items:** 125 (Missing Ratings)  
**Total Items:** 797
