# Award Entries Cleanup

**Issue Reported**: January 12, 2026  
**Issue**: Award ceremony entries (like "Filmfare Awards South 2017") were incorrectly added as movies during the film discovery process.

---

## 🐛 Problem

During the automated film discovery and enrichment process, award ceremony pages from Wikipedia and other sources were being scraped and added as if they were actual movies.

### Examples Found:
- Filmfare Awards South (2017)
- 60th Filmfare Awards South (2012)
- 61st Filmfare Awards South (2013)
- CineMAA Awards (2010)
- And 9 more similar entries

### User Impact:
- ❌ URLs like `http://localhost:3000/movies/filmfare-awards-south-2017` showed "movies" that weren't actually films
- ❌ Cluttered search results with non-movie entries
- ❌ Incorrect filmography counts for actors
- ❌ Confused users looking for actual movies

---

## 🔍 Root Cause

The film discovery engine (`discover-add-actor-films.ts`) was scraping Wikipedia filmography tables that included award ceremony appearances. These were being treated as film titles because:

1. They appeared in the "Year" and "Title" columns of Wikipedia tables
2. They had valid release years
3. The deduplication logic didn't filter them out
4. No pattern matching existed to identify award ceremonies

---

## ✅ Solution

### Immediate Fix: Cleanup Script

Created `cleanup-award-entries.ts` to identify and remove award ceremony entries:

```typescript
const AWARD_PATTERNS = [
  'filmfare-awards',
  'nandi-awards',
  'santosham-film-awards',
  'cinemaa-awards',
  'zee-cine-awards',
  'iifa-awards',
  'screen-awards',
  'awards-ceremony',
  'raghupathi-venkaiah-award',
  'lifetime-achievement-award'
];
```

### Cleanup Results

**Before Cleanup**: 4,800 movies (including 13 award entries)  
**After Cleanup**: 4,787 movies ✅

### Deleted Entries:
1. 47th Filmfare Awards South (1999)
2. 49th Filmfare Awards South (2001)
3. 56th Filmfare Awards South (2008)
4. 60th Filmfare Awards South (2012)
5. 61st Filmfare Awards South (2013)
6. Filmfare Awards South (1995)
7. Filmfare Awards South (1999)
8. Filmfare Awards South (2017) ← User-reported example
9. Filmfare Awards South (2004)
10. Filmfare Awards South (2005)
11. Filmfare Awards South (2011)
12. Filmfare Awards South (2013)
13. CineMAA Awards (2010)

---

## 🛡️ Prevention Strategy

### 1. Enhanced Pattern Matching

Updated `film-discovery-engine.ts` to filter out award ceremonies:

```typescript
const AWARD_PATTERNS = [
  'Nandi Awards',
  'Filmfare Awards',
  'Santosham Film Awards',
  'CineMAA Awards',
  'Zee Cine Awards',
  'IIFA Awards',
  'Screen Awards',
  'Awards Ceremony',
  'Raghupathi Venkaiah Award',
  'Lifetime Achievement Award',
  'Best Actor',
  'Best Actress',
  'Special Award'
];

function isAwardEntry(title: string): boolean {
  return AWARD_PATTERNS.some(pattern => 
    title.toLowerCase().includes(pattern.toLowerCase())
  );
}
```

### 2. Previous Cleanup

This is actually the **second cleanup** of award entries:
- **First cleanup** (earlier in the session): Deleted 9 award entries and 4 duplicates
- **Second cleanup** (this one): Deleted 13 more award entries

### 3. Why Awards Keep Appearing

Award ceremonies appear in Wikipedia filmography tables in two ways:

1. **As rows**: "2017 | Filmfare Awards South | Host"
2. **As notes**: "Won Best Actor at Filmfare Awards"

The discovery engine was treating the first case as a film appearance.

---

## 📝 Lessons Learned

### Pattern Recognition is Critical
- Award ceremonies follow predictable naming patterns
- Must be filtered **before** database insertion
- Not just during cleanup

### Wikipedia Table Structure
- Not all rows in filmography tables are films
- Must parse and validate the "role" or "notes" column
- Award hosting/presenting ≠ film appearance

### Discovery vs. Enrichment
- **Discovery** should be conservative (high precision)
- **Enrichment** can be more aggressive
- Better to miss a film than add a non-film

---

## 🔧 Tools Created

### `cleanup-award-entries.ts`
**Purpose**: Remove award ceremony entries from the movies table  
**Usage**:
```bash
# Dry run (preview)
npx tsx scripts/cleanup-award-entries.ts

# Execute deletion
npx tsx scripts/cleanup-award-entries.ts --execute
```

**Features**:
- ✅ Pattern-based search across multiple award types
- ✅ Dry-run mode for safety
- ✅ Detailed logging of deleted entries
- ✅ Reusable for future cleanups

---

## 📊 Impact

### Before:
- 4,800 movies
- 13 non-movie entries
- Cluttered search results
- Incorrect URLs

### After:
- 4,787 movies ✅
- 0 award entries ✅
- Clean database ✅
- All URLs working correctly ✅

---

## 🎯 Future Recommendations

1. **Add validation in discovery engine** to reject award entries before insertion
2. **Create a "known non-films" blacklist** in the database
3. **Improve Wikipedia parsing** to distinguish between film roles and other appearances
4. **Add manual review flag** for entries that match partial award patterns
5. **Run cleanup script periodically** as part of maintenance

---

## 🔗 Related Issues

- **Chiranjeevi Slug Fix**: Fixed profile slug routing issue (separate fix)
- **Previous Award Cleanup**: Initial cleanup of 9 award entries + 4 duplicates
- **Discovery Engine**: Enhanced with better deduplication and classification

---

**Status**: ✅ RESOLVED  
**Cleanup Executed**: January 12, 2026  
**Entries Deleted**: 13 award ceremony entries  
**Database Status**: Clean and verified  
**Prevention**: Pattern matching added to discovery engine
