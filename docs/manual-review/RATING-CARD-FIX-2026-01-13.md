# Rating Card Fix - January 13, 2026

## Issue Summary

Movies with editorial reviews were showing in "old format" without rating cards because their review `_type` was set to `"audited_review"` instead of `"editorial_review_v2"`.

### Symptom
- Movie page displays without rating card
- No editorial scores visible (Story, Direction, Music, etc.)
- Appears in "old format" despite having full editorial review data

### Root Cause
The movie page component (`app/movies/[slug]/page.tsx`) only shows rating cards when:
```typescript
if (dims._type === "editorial_review_v2") {
  editorialReview = dims;
}
```

But some reviews had `_type: "audited_review"` from an older review format.

## Example Movie
**Pellam Chatu Mogudu (1992)**
- URL: http://localhost:3000/movies/pellam-chatu-mogudu-1992
- Had review with full editorial data
- Was showing old format without rating card
- ✅ Now fixed and showing rating card

## Movies Affected

### Total: 34 movies fixed

1. The Great Pre-Wedding Show (2025)
2. Bujjigaadu: Made in Chennai (2008)
3. 1980 Lo Radhekrishna (2024)
4. Oka Roju Raju (1944)
5. Naa Manasistha Raa (2001)
6. Raju Gari Gadhi 2 (2017)
7. Valliddari Vayasu Padahare (2006)
8. Valu Jada Tolu Beltu (1992)
9. Lingababu Love Story (1995)
10. Dongalu Baboi Dongalu (1984)
11. Nenu Naa Rakshasi (2011)
12. #69 Samskar Colony (2022)
13. Dabbuki Lokam Dasoham (1973)
14. Gopi Goda Meeda Pilli (2006)
15. Nenem...Chinna Pillana? (2013)
16. Maa Ayana Bangaram (1997)
17. Gandhi Puttina Desam (1973)
18. Katha Screenplay Darsakatvam Appalaraju (2011)
19. 7g Brindhavan Colony (2004)
20. Chitram Bhalare Vichitram (1992)
21. O Panaipothundi Babu (1998)
22. Srinatha Kavi Sarvabhowmudu (1993)
23. Ee Nagariniki Emaindi (2018)
24. Jayadev (2017)
25. Meeku Meere Maaku Meeme (2016)
26. Devudu Chesina Manushulu (2012)
27. Ye Mantram Vesave (2018)
28. Ala Ila Ela (2023)
29. Sri Satyanarayana Swamy (2007)
30. Niluvu Dopidi (1968)
31. Anaganaga Oka Durga (2017)
32. Ee Charithra Ye Siratho (1982)
33. Attintlo Adde Mogudu (1991)
34. **Pellam Chatu Mogudu (1992)** ← Originally reported

## Solution Applied

Updated the `dimensions_json._type` field from `"audited_review"` to `"editorial_review_v2"` for all affected reviews.

### Database Changes
```sql
-- Conceptually (actual implementation in TypeScript):
UPDATE movie_reviews
SET dimensions_json = jsonb_set(
  dimensions_json,
  '{_type}',
  '"editorial_review_v2"'
)
WHERE dimensions_json->>'_type' = 'audited_review'
AND status = 'published';
```

## Scripts Created

### 1. **check-review-type.ts**
Quick diagnostic tool to check a movie's review _type:
```bash
npx tsx scripts/check-review-type.ts <slug>
```

### 2. **fix-audited-review-types.ts**
Bulk fix for all movies with audited_review type:
```bash
# Dry run
npx tsx scripts/fix-audited-review-types.ts

# Execute
npx tsx scripts/fix-audited-review-types.ts --execute
```

### 3. **fix-single-review.ts**
Fix individual movie:
```bash
npx tsx scripts/fix-single-review.ts <slug> --execute
```

### 4. **check-movie-reviews.ts**
Comprehensive review checker:
```bash
npx tsx scripts/check-movie-reviews.ts <slug>
```

## Results

### ✅ Fixed: 34 movies
- All reviews updated successfully
- Rating cards now display correctly
- Editorial scores visible (Story, Direction, Music, etc.)
- Modern movie page layout active

### 📊 Impact
- **User Experience**: Significantly improved - users can now see detailed ratings
- **Data Completeness**: Unlocked hidden editorial data
- **Page Format**: Modern format with rating card vs old plain format

## Rating Card Components

When `_type === "editorial_review_v2"`, the page displays:

1. **CompactRatings** - Shows 8 editorial scores:
   - Story
   - Direction
   - Music
   - Cinematography
   - Pacing
   - Emotion
   - Originality
   - Editing

2. **QuickVerdictCard** - Shows:
   - Why Watch
   - Why Skip
   - Final Verdict
   - Quality Score
   - Awards
   - Cultural Highlights

3. **ReviewAccordion** - Detailed reviews:
   - Performance analysis
   - Story/Screenplay
   - Direction/Technicals
   - Cultural impact

## Verification

### Before Fix
```bash
$ npx tsx scripts/check-review-type.ts pellam-chatu-mogudu-1992
_type value: audited_review
❌ This is why the rating card is not showing!
```

### After Fix
```bash
$ npx tsx scripts/check-review-type.ts pellam-chatu-mogudu-1992
_type value: editorial_review_v2
✅ _type is correct
```

### Page Check
Visit: http://localhost:3000/movies/pellam-chatu-mogudu-1992
- ✅ Rating card visible
- ✅ Editorial scores displayed
- ✅ Modern layout active

## Prevention

### For Future Reviews
Ensure all new editorial reviews use `_type: "editorial_review_v2"`:

```typescript
const dimensions = {
  _type: "editorial_review_v2", // Must be this value!
  verdict: { ... },
  story_screenplay: { ... },
  direction_technicals: { ... },
  performances: { ... },
  // ... other fields
};
```

### Validation
Add validation in review creation pipeline:
```typescript
if (dimensions._type !== "editorial_review_v2") {
  throw new Error("Invalid review _type");
}
```

## Related Issues

### Actor Image Issue (Same Movie)
- Earlier fixed: Wrong actress photo used as poster
- Set poster_url to null → using placeholder
- See: `ACTOR-IMAGE-FIX-SUMMARY.md`

## Files Modified

### Scripts Created
- `/scripts/check-review-type.ts` - Diagnostic tool
- `/scripts/fix-audited-review-types.ts` - Bulk fix tool
- `/scripts/fix-single-review.ts` - Single movie fix
- `/scripts/check-movie-reviews.ts` - Comprehensive checker

### Database Changes
- 34 records in `movie_reviews` table updated
- Field: `dimensions_json._type`
- Changed from: `"audited_review"`
- Changed to: `"editorial_review_v2"`

## Architecture Notes

### Page Component Logic
Location: `app/movies/[slug]/page.tsx`

```typescript
// Extract editorial review from dimensions_json if available
let editorialReview: any = null;
if (featuredReview?.dimensions_json) {
  const dims = featuredReview.dimensions_json as any;
  if (dims._type === "editorial_review_v2") {
    editorialReview = dims;
  }
}
```

### Rating Card Conditional
```typescript
{editorialReview && !hideRating && (
  <CompactRatings ratings={[...]} />
)}
```

### Why This Matters
- Without correct `_type`, `editorialReview` is `null`
- When `null`, rating card components don't render
- Page falls back to basic layout without editorial scores

---

**Issue Reported**: http://localhost:3000/movies/pellam-chatu-mogudu-1992 showing old format, no rating card  
**Root Cause**: `_type: "audited_review"` instead of `"editorial_review_v2"`  
**Solution**: Updated _type field for all affected reviews  
**Status**: ✅ Fixed  
**Movies Affected**: 34  
**Date**: January 13, 2026
