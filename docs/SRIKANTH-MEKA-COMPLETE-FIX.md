# Complete Fix for Srikanth Meka

## Issues to Fix

1. ✅ **Profile Image**: Wrong or missing profile image for Srikanth Meka
2. ✅ **Hero Name**: "10th Class Diaries" has hero as "Srikanth" instead of "Srikanth Meka"
3. ✅ **Poster URLs**: Movies like "Satruvu (2013)" have wrong year posters

## Quick Fix Steps

### Step 1: Find TMDB Profile Image

**Option A: Using TMDB Website**
1. Go to: https://www.themoviedb.org/search?query=Srikanth+Meka
2. Find the correct person (Meka Srikanth, born 1968)
3. Click on the profile
4. Right-click the profile image → Copy image address
5. Use that URL

**Option B: Using TMDB API**
```bash
# Search for person
curl "https://api.themoviedb.org/3/search/person?api_key=YOUR_KEY&query=Srikanth+Meka"

# Get person details (use person_id from search)
curl "https://api.themoviedb.org/3/person/{person_id}?api_key=YOUR_KEY"

# Get images (best quality)
curl "https://api.themoviedb.org/3/person/{person_id}/images?api_key=YOUR_KEY"
```

**Image URL Format:**
- Original: `https://image.tmdb.org/t/p/original/{profile_path}`
- Medium: `https://image.tmdb.org/t/p/w500/{profile_path}`

### Step 2: Run SQL Fixes

Run the SQL script: `fix-srikanth-meka-complete.sql`

**Key Updates:**
1. Update profile image URL (replace placeholder with actual TMDB URL)
2. Fix "10th Class Diaries" hero name
3. Check and update poster URLs for movies with wrong posters

### Step 3: Fix Poster URLs

For movies with wrong year posters (like Satruvu 2013):

**Find Correct Poster:**
1. Search TMDB: https://www.themoviedb.org/search?query=Satruvu
2. Filter by year 2013
3. Get poster_path from movie details
4. Use: `https://image.tmdb.org/t/p/w500/{poster_path}`

**Or use alternative sources:**
- IMP Awards: https://www.impawards.com/intl/india/2013/shatruvu_ver2.html
- Ragalahari: https://www.ragalahari.com

**Update in Database:**
```sql
UPDATE movies
SET 
  poster_url = 'https://image.tmdb.org/t/p/w500/CORRECT_POSTER_PATH.jpg',
  updated_at = NOW()
WHERE slug = 'satruvu-2013';
```

## SQL Scripts Created

1. **`fix-srikanth-meka-complete.sql`** - Complete fix with all updates
2. **`fix-srikanth-meka-posters.sql`** - Focused on poster URL fixes
3. **`fix-srikanth-hero-names.sql`** - Already includes "10th Class Diaries" fix

## Verification

After running fixes:

1. **Check Profile:**
   ```bash
   curl "http://localhost:3000/api/profile/srikanth-meka" | jq '.person.profile_image'
   ```

2. **Check Movie:**
   ```bash
   curl "http://localhost:3000/api/movies/10th-class-diaries-2022" | jq '.hero'
   ```

3. **Check Poster:**
   ```bash
   curl "http://localhost:3000/api/movies/satruvu-2013" | jq '{title: .title_en, year: .release_year, poster: .poster_url}'
   ```

## Expected Results

- ✅ Profile image displays correctly for `?profile=srikanth-meka`
- ✅ "10th Class Diaries" shows hero as "Srikanth Meka"
- ✅ Satruvu (2013) shows correct 2013 poster
- ✅ All Srikanth Meka movies have correct posters matching their release years
