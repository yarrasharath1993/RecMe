# Fix Srikanth Meka Profile Image

## Problem

The profile image for Srikanth Meka (`?profile=srikanth-meka`) is showing the wrong image or no image.

## Root Cause

The API is returning `profile_image: null` and `id: null`, which means:
1. The celebrity profile with slug `srikanth-meka` doesn't exist in the `celebrities` table, OR
2. The profile exists but doesn't have a `profile_image` set, OR
3. The profile exists but the slug doesn't match exactly

## Solution

### Step 1: Check Current State

Run this query to see if the profile exists:

```sql
SELECT 
  id, 
  name_en, 
  slug, 
  profile_image,
  image_url,
  is_published
FROM celebrities 
WHERE slug = 'srikanth-meka'
   OR name_en ILIKE '%srikanth%meka%';
```

### Step 2: Find Correct Image URL

You need to find the correct profile image URL for Srikanth Meka. Good sources:
- [Wikipedia](https://en.wikipedia.org/wiki/Srikanth_(actor,_born_1968)) - Check the infobox image
- TMDB (The Movie Database) - Search for "Srikanth Meka" or "Meka Srikanth"
- Official social media profiles
- Movie databases

### Step 3: Update Profile Image

**If profile exists:**

```sql
UPDATE celebrities 
SET 
  profile_image = 'https://correct-image-url.jpg',  -- Replace with actual URL
  image_url = 'https://correct-image-url.jpg',     -- Replace with actual URL
  updated_at = NOW()
WHERE slug = 'srikanth-meka';
```

**If profile doesn't exist, create it:**

```sql
INSERT INTO celebrities (
  name_en,
  name_te,
  slug,
  gender,
  occupation,
  birth_date,
  profile_image,
  image_url,
  is_published,
  created_at,
  updated_at
) VALUES (
  'Srikanth Meka',
  'శ్రీకాంత్ మేక',
  'srikanth-meka',
  'male',
  'actor',
  '1968-03-23',
  'https://correct-image-url.jpg',  -- Replace with actual URL
  'https://correct-image-url.jpg',  -- Replace with actual URL
  true,
  NOW(),
  NOW()
) RETURNING id;
```

### Step 4: Verify

1. **Check the database:**
   ```sql
   SELECT id, name_en, slug, profile_image 
   FROM celebrities 
   WHERE slug = 'srikanth-meka';
   ```

2. **Test the API:**
   ```bash
   curl "http://localhost:3000/api/profile/srikanth-meka" | jq '.person | {name: .name, profile_image: .profile_image, id: .id}'
   ```

3. **Check the frontend:**
   - Visit: `http://localhost:3000/movies?profile=srikanth-meka`
   - Verify the profile image is correct

## Common Issues

### Issue 1: Wrong Image from Another Actor

If the wrong image is showing, it might be:
- Tamil actor Srikanth's image is being used
- Another actor's image is cached

**Fix:** Ensure both profiles have distinct images:
```sql
-- Check Tamil actor Srikanth
SELECT id, name_en, slug, profile_image 
FROM celebrities 
WHERE slug = 'srikanth';

-- Update both to have correct images
UPDATE celebrities SET profile_image = 'tamil-srikanth-image.jpg' WHERE slug = 'srikanth';
UPDATE celebrities SET profile_image = 'srikanth-meka-image.jpg' WHERE slug = 'srikanth-meka';
```

### Issue 2: Image URL Not Accessible

If the image URL is broken:
- Check if the URL is accessible
- Use a CDN or reliable image hosting
- Consider using TMDB image URLs (they're reliable)

### Issue 3: API Not Finding Profile

If `id: null` in API response:
- Verify the slug matches exactly: `srikanth-meka`
- Check if `is_published = true`
- Ensure the profile exists in the database

## Quick Fix Script

Use `fix-srikanth-meka-profile-image.sql` which includes all the diagnostic and fix queries.

## After Fix

1. Clear browser cache
2. Restart the Next.js dev server if needed
3. Test the profile page: `http://localhost:3000/movies?profile=srikanth-meka`
4. Verify the image displays correctly
