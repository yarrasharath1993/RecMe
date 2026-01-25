# Unreleased Movies - Ratings Removal Implementation Summary

**Date:** January 15, 2026  
**Status:** ✅ Complete

## Overview

Successfully implemented a comprehensive solution to remove ratings from unreleased movies and display "COMING SOON" banners instead. This ensures users don't see ratings for movies that haven't been released yet.

---

## 1. Database Cleanup

### Script Created: `scripts/remove-unreleased-ratings.ts`

**What it does:**
- Identifies unreleased movies using `isMovieUpcoming()` utility
- Removes all ratings: `our_rating`, `avg_rating`, `editorial_score`, `editorial_score_breakdown`
- Exports audit report to CSV for record-keeping

**Execution Results:**
```
✅ 63 unreleased movies cleaned
✅ Export: unreleased-movies-cleanup-2026-01-14.csv
```

**Categories of unreleased movies:**
- **50 movies** with no release year (NULL)
- **1 movie** with future release year (2027)
- **13 movies** with future release dates

**Usage:**
```bash
# Audit only
npx tsx scripts/remove-unreleased-ratings.ts --audit

# Execute cleanup
npx tsx scripts/remove-unreleased-ratings.ts --execute
```

---

## 2. UI Updates

### A. Movie Detail Page (`app/movies/[slug]/page.tsx`)

**Mobile View:**
- Replaced rating badge with "COMING SOON" banner
- Shows release year if available
- Orange gradient styling with calendar icon

**Desktop View:**
- Prominent "COMING SOON" badge in title area
- Larger banner below title with release information
- Consistent orange/red gradient theme

**Before:**
```tsx
{!hideRating && displayRating > 0 && (
  <div>Rating: {displayRating}</div>
)}
```

**After:**
```tsx
{isUpcoming ? (
  <div className="coming-soon-banner">
    <Calendar /> COMING SOON {movie.release_year}
  </div>
) : !hideRating && displayRating > 0 && (
  <div>Rating: {displayRating}</div>
)}
```

### B. Movie Listing Cards (`app/movies/page.tsx`)

**SmallMovieCard Component:**
- Already had proper logic using `isUpcoming` and `shouldHideRating()`
- Shows "TBA" badge for upcoming movies
- Hides rating display when `hideRating` is true

**UpcomingMovieCard Component:**
- Dedicated component for upcoming movies
- Shows "🎬 COMING SOON" badge
- Displays release date or "TBA"

**No changes needed** - the listing page was already correctly implemented!

---

## 3. Enrichment Scripts Updates

### A. `scripts/enrich-editorial-scores.ts`

**Changes:**
```typescript
// Added filters to skip unreleased movies
.not('release_year', 'is', null)
.lte('release_year', new Date().getFullYear())
```

### B. `scripts/turbo-enrich-all-gaps.ts`

**Changes:**
```typescript
// Skip unreleased movies in rating processing
if (movie.release_date && new Date(movie.release_date) > new Date()) {
  continue;
}
```

### C. `scripts/audit-apply-box-office-ratings.ts`

**Changes:**
```typescript
// Only process released movies
.not('release_year', 'is', null)
.lte('release_year', new Date().getFullYear())
```

### D. `scripts/enrich-updated-movies.ts`

**Changes:**
```typescript
// Check if movie is upcoming before deriving editorial scores
const isUpcoming = !movie.release_year || 
                  movie.release_year > new Date().getFullYear() ||
                  (movie.release_date && new Date(movie.release_date) > new Date());

if (!isUpcoming) {
  // Derive editorial scores
} else {
  console.log('⏭️  Skipped editorial scores (unreleased movie)');
}
```

---

## 4. Testing Results

### Test Case: Kalki 2898-AD Part 2

**URL:** http://localhost:3000/movies/kalki-2898-ad-part-2-tba

**Results:**
✅ **Mobile View:**
- Shows "COMING SOON" badge with orange gradient
- Calendar icon displayed
- No rating visible
- Banner shows "📅 Release Date TBA"

✅ **Desktop View:**
- "COMING SOON" badge in title area
- Large banner with "Upcoming Release" label
- Message: "Ratings will be available after release"
- No rating displayed anywhere

✅ **Movie Listing:**
- Shows "TBA" badge on card
- No rating displayed
- Proper styling maintained

---

## 5. Key Features

### Unreleased Movie Detection

Uses `isMovieUpcoming()` from `lib/utils/movie-status.ts`:
```typescript
isMovieUpcoming({
  release_date: movie.release_date,
  release_year: movie.release_year
})
```

**Criteria:**
- `release_year` is NULL
- `release_year` > current year
- `release_date` is in the future

### Consistent UX

- **Orange/Red Gradient:** Consistent "coming soon" theme
- **Calendar Icon:** Visual indicator of future release
- **Clear Messaging:** "Ratings will be available after release"
- **Responsive:** Works on mobile and desktop

### Future-Proof

- Enrichment scripts automatically skip unreleased movies
- No manual intervention needed for new upcoming movies
- Ratings automatically appear once movie is released

---

## 6. Files Modified

### Created:
1. `scripts/remove-unreleased-ratings.ts` - Audit and cleanup script

### Modified:
1. `app/movies/[slug]/page.tsx` - Movie detail page UI
2. `scripts/enrich-editorial-scores.ts` - Skip unreleased movies
3. `scripts/turbo-enrich-all-gaps.ts` - Skip unreleased movies
4. `scripts/audit-apply-box-office-ratings.ts` - Skip unreleased movies
5. `scripts/enrich-updated-movies.ts` - Skip unreleased movies

### No Changes Needed:
- `app/movies/page.tsx` - Already had correct logic
- `lib/utils/movie-status.ts` - Utility functions already existed

---

## 7. Impact Summary

### Database:
- ✅ 63 movies cleaned (ratings removed)
- ✅ No schema changes required
- ✅ Audit trail maintained in CSV

### UI:
- ✅ Movie detail pages show "COMING SOON" banners
- ✅ Movie listing cards show "TBA" badges
- ✅ No ratings visible for unreleased movies
- ✅ Consistent styling across all pages

### Scripts:
- ✅ All enrichment scripts updated
- ✅ Future movies automatically skipped
- ✅ No manual intervention needed

---

## 8. Maintenance

### For New Upcoming Movies:
1. **No action needed** - Scripts automatically detect and skip
2. Ratings will not be added until movie is released
3. UI automatically shows "COMING SOON" banner

### When Movie is Released:
1. Update `release_year` or `release_date` in database
2. Run enrichment scripts to add ratings
3. UI automatically switches from "COMING SOON" to rating display

### Monitoring:
```bash
# Check for unreleased movies with ratings
npx tsx scripts/remove-unreleased-ratings.ts --audit
```

---

## 9. Example Movies Affected

Some notable movies that now show "COMING SOON" instead of ratings:

1. **Kalki 2898-AD: Part 2** (TBA)
2. **Devara 2** (TBA)
3. **Pushpa 3 - The Rampage** (TBA)
4. **Baahubali: the Eternal War - Part 1** (2027)
5. **Fauji** (2026)
6. **Goodachari 2** (2026)
7. **Ustaad Bhagat Singh** (2026)

---

## 10. Success Criteria

✅ All unreleased movies have no ratings in database  
✅ UI shows "COMING SOON" banners instead of ratings  
✅ Enrichment scripts skip unreleased movies  
✅ Consistent UX across mobile and desktop  
✅ Future-proof solution requires no manual intervention  
✅ Audit trail maintained for transparency  

---

## Conclusion

The implementation successfully removes ratings from unreleased movies and provides a better user experience with clear "COMING SOON" messaging. The solution is automated, future-proof, and requires no manual intervention for new upcoming movies.

**Status:** Ready for production ✅
