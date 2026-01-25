# Teja Profile Image Fix - COMPLETE ✅

## Issue
The profile page for director Teja at `http://localhost:3000/movies?profile=teja` was showing the **WRONG person's image** - an image of "Jessie Tejada" (an American actor) instead of director Teja.

## Root Cause

The `celebrities` table had the **WRONG TMDB ID** for director Teja:

```
❌ Stored TMDB ID: 2170806
   → This belongs to: Jessie Tejada (American actor)
   → Image: https://image.tmdb.org/t/p/w185/pMfEf8LLJ8x1uLGos0VMpBRk2mf.jpg
```

The API was fetching the profile image from TMDB using this incorrect ID, resulting in the wrong person's photo being displayed.

## Investigation Process

### 1. Checked API Response
```bash
$ curl http://localhost:3000/api/profile/teja | jq .person.image_url

"https://image.tmdb.org/t/p/w185/pMfEf8LLJ8x1uLGos0VMpBRk2mf.jpg"
```

### 2. Checked Celebrity Record
```sql
SELECT tmdb_id, profile_image FROM celebrities WHERE slug = 'celeb-teja';

tmdb_id: 2170806
profile_image: https://image.tmdb.org/t/p/w185/pMfEf8LLJ8x1uLGos0VMpBRk2mf.jpg
```

### 3. Verified TMDB Person
```bash
$ curl "https://api.themoviedb.org/3/person/2170806?api_key=xxx"

{
  "name": "Jessie Tejada",  ← WRONG PERSON!
  "known_for_department": "Acting",
  "profile_path": "/pMfEf8LLJ8x1uLGos0VMpBRk2mf.jpg"
}
```

### 4. Found Correct TMDB ID
Searched TMDB for "Teja" and found:

```
✅ TMDB ID: 441339
   Name: Teja
   Known For: Directing
   Known for: Nene Raju Nene Mantri (2017), Nijam (2003), Sita (2019)
   Profile Image: NULL (no image on TMDB)
```

## Solution

Updated the celebrity record:

```typescript
await supabase
  .from('celebrities')
  .update({
    tmdb_id: 441339,        // Correct director Teja
    profile_image: null     // Clear wrong image
  })
  .eq('slug', 'celeb-teja');
```

## Results

### Before Fix
- **TMDB ID**: 2170806 (Jessie Tejada) ❌
- **Profile Image**: Wrong person's photo ❌
- **API Response**: Returns incorrect image

### After Fix
- **TMDB ID**: 441339 (Director Teja) ✅
- **Profile Image**: NULL (no image available) ✅
- **API Response**: Returns `null` for image_url ✅

```bash
$ curl http://localhost:3000/api/profile/teja | jq .person.image_url

null
```

## Why Director Teja Has No Image

TMDB person ID 441339 (correct director Teja) has **NO profile image** on TMDB. This is normal for many Indian film personalities who don't have comprehensive TMDB profiles.

### Options to Add Image

1. **Manual Upload**: Add a high-quality image of director Teja to the `celebrities` table:
   ```sql
   UPDATE celebrities 
   SET profile_image = 'url-to-image',
       profile_image_source = 'manual'
   WHERE slug = 'celeb-teja';
   ```

2. **Wikipedia/Commons**: Find image from Wikipedia/Wikimedia Commons

3. **Official Sources**: Use official promotional images or press photos

4. **Leave as NULL**: Profile will show initials "T" as avatar fallback ✅ (Current state)

## Files Modified

### Database
- `celebrities` table:
  - Updated `tmdb_id`: 2170806 → 441339
  - Cleared `profile_image`: URL → NULL

### Scripts Created
- `/scripts/verify-teja-image.ts` - Investigation script
- `/scripts/find-correct-teja-tmdb.ts` - TMDB search script
- `/scripts/fix-teja-tmdb-id.ts` - Fix implementation

## Impact

This fix ensures:
- ✅ Correct TMDB ID for director Teja
- ✅ No wrong person's image displayed
- ✅ Profile data integrity maintained
- ✅ Foundation for adding correct image later

## Testing

### API Test
```bash
# Verify API returns correct data
curl -s http://localhost:3000/api/profile/teja | jq '{name: .person.name, image: .person.image_url}'

# Should show:
{
  "name": "Teja",
  "image": null
}
```

### Browser Test
1. Visit: http://localhost:3000/movies?profile=teja
2. ✅ Should show director Teja's name
3. ✅ Should show "T" avatar (initials fallback)
4. ✅ Should NOT show Jessie Tejada's image
5. ✅ Should show correct filmography (Jayam, Nuvvu Nenu, etc.)

## Related Issues

This was part of a larger fix for the Teja profile page:

1. **Profile Matching** ✅ Fixed - "teja" now correctly shows director, not Ravi Teja
   - See: `/PROFILE-FIX-COMPLETE-2026-01-13.md`

2. **Wrong Image** ✅ Fixed - Removed Jessie Tejada's image
   - See: This document

3. **Old Format Rating Card** ✅ Fixed - Updated review type
   - See: `/docs/manual-review/RATING-CARD-FIX-2026-01-13.md`

## Next Steps

1. **Optional**: Find and upload a good quality image of director Teja
   - Recommended size: At least 500x500px
   - Source: Wikipedia, official press photos, or movie stills
   - Format: JPG or PNG
   - License: Public domain or fair use

2. **Verify**: Check if other celebrities have wrong TMDB IDs
   - Run audit script on all celebrity TMDB IDs
   - Verify image sources match person names

---

**Issue**: Wrong image (Jessie Tejada) shown for director Teja  
**Root Cause**: Incorrect TMDB ID (2170806 instead of 441339)  
**Fix**: Updated celebrity record with correct TMDB ID  
**Status**: ✅ **FIXED AND VERIFIED**  
**Date**: January 13, 2026

**Test URL**: http://localhost:3000/movies?profile=teja  
**Expected**: No wrong image, shows initials "T" as fallback ✅  
**Result**: CORRECT! Wrong image removed, profile works correctly.
