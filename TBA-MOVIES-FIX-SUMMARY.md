# TBA Movies Rating & Banner Fix Summary

**Date:** January 17, 2026  
**Status:** ✅ Complete

## Issues Found

1. **Ratings showing on TBA/unreleased movies** (e.g., `lenin-tba`)
2. **Missing "Coming Soon" banner** for unreleased movies (e.g., `vrushakarma-tba`)
3. **Rating displayed without hideRating check** on desktop view (line 691)
4. **Metadata showing ratings** for unreleased movies

## Fixes Applied

### 1. Enhanced `isMovieUpcoming()` Function ✅
**File:** `lib/utils/movie-status.ts`

**Change:** Added check for `-tba` slugs as primary indicator of unreleased status
```typescript
// If slug ends with -tba, it's definitely unreleased
if (movie.slug && movie.slug.endsWith('-tba')) {
  return true;
}
```

**Impact:** All movies with `-tba` slugs are now correctly identified as upcoming/unreleased.

### 2. Fixed Rating Display on Desktop ✅
**File:** `app/movies/[slug]/page.tsx` (line 691)

**Before:**
```tsx
) : displayRating > 0 && !editorialReview && (
```

**After:**
```tsx
) : !hideRating && displayRating > 0 && !editorialReview && (
```

**Impact:** Ratings no longer show for unreleased movies on desktop view.

### 3. Fixed Metadata Generation ✅
**File:** `app/movies/[slug]/page.tsx` (`generateMetadata` function)

**Change:** Added upcoming check to prevent showing ratings in metadata
```typescript
const isUpcoming = movie.slug?.endsWith('-tba') || 
                   (movie.release_year && movie.release_year > new Date().getFullYear()) ||
                   (movie.release_date && new Date(movie.release_date) > new Date()) ||
                   (!movie.release_date && !movie.release_year);

const description = movie.synopsis || 
  (isUpcoming 
    ? `${movie.title_en} directed by ${movie.director}. Coming soon.`
    : `${movie.title_en} directed by ${movie.director}.${movie.avg_rating ? ` Rating: ${movie.avg_rating}/10` : ''}`);
```

**Impact:** SEO metadata no longer shows ratings for unreleased movies.

### 4. Removed Ratings from TBA Movies ✅
**Script:** `scripts/remove-tba-movie-ratings.ts`

**Results:**
- ✅ Removed ratings from **15 TBA movies**
- ✅ Generated audit report: `TBA-MOVIES-RATINGS-REMOVED.csv`

**Movies Fixed:**
1. Magic (magic-tba) - 7.0 → removed
2. Lenin (lenin-tba) - 6.3 → removed ⭐
3. Naa Katha (naa-katha-tba) - 6.5 → removed
4. Takshakudu (takshakudu-tba) - 6.0 → removed
5. Natudu (natudu-tba) - 6.0 → removed
6. Inner City Blues (inner-city-blues-tba) - 6.8 → removed
7. Nakshatra Poratam (nakshatra-poratam-tba) - 6.5 → removed
8. Euphoria (euphoria-tba) - 7.5 → removed
9. Umapathi (umapathi-tba) - 6.5 → removed
10. Reppa (reppa-tba) - 6.4 → removed
11. Edhureetha (edhureetha-tba) - 6.2 → removed
12. Sahaa (sahaa-tba) - 5.5 → removed
13. Anaganaga Oka Rowdy (anaganaga-oka-rowdy-tba) - 5.8 → removed
14. Janakiram (janakiram-tba) - 6.0 → removed
15. Mysaa (mysaa-tba) - 6.5 → removed

## Banner Display Logic

The "Coming Soon" banner is displayed when:
- ✅ `isUpcoming === true` (now includes `-tba` slug check)
- ✅ Shows on both mobile and desktop views
- ✅ Displays release year if available
- ✅ Shows appropriate label from `getUpcomingLabel()`

**Banner Locations:**
1. **Mobile:** Top badge + enhanced banner below title
2. **Desktop:** Badge in title area + large banner below title

## Testing

### Test Cases Verified:
- ✅ `http://localhost:3000/movies/lenin-tba` - No rating, shows banner
- ✅ `http://localhost:3000/movies/vrushakarma-tba` - No rating, shows banner
- ✅ All other `-tba` movies - No ratings, show banners

### Expected Behavior:
1. **TBA Movies (`-tba` slug):**
   - ✅ No ratings displayed anywhere
   - ✅ "COMING SOON" banner visible
   - ✅ Metadata shows "Coming soon" instead of rating

2. **Unreleased Movies (future year):**
   - ✅ No ratings displayed
   - ✅ "COMING SOON" banner visible
   - ✅ Shows release year if available

3. **Released Movies:**
   - ✅ Ratings displayed normally
   - ✅ No "COMING SOON" banner
   - ✅ Metadata includes rating

## Files Modified

1. `lib/utils/movie-status.ts` - Enhanced `isMovieUpcoming()` function
2. `app/movies/[slug]/page.tsx` - Fixed rating display and metadata
3. `scripts/remove-tba-movie-ratings.ts` - New script for cleanup

## Prevention

The updated `isMovieUpcoming()` function now:
- ✅ Checks `-tba` slugs first (most reliable indicator)
- ✅ Checks future release years
- ✅ Checks future release dates
- ✅ Treats missing release info as upcoming

This ensures that:
- New TBA movies automatically show banners
- Ratings won't be displayed for unreleased content
- Future-proof solution requires no manual intervention

## Summary

✅ **All issues resolved:**
- Ratings removed from 15 TBA movies
- Banner logic fixed for all unreleased movies
- Rating display fixed on desktop view
- Metadata fixed to not show ratings for unreleased movies

**Status:** Ready for production ✅
