# Srikanth Meka Fix - Correct Actor Identification

## Problem

After running the initial fix script, movies are still incorrectly split between the two Srikanth actors.

## Root Cause

According to [Wikipedia](https://en.wikipedia.org/wiki/Srikanth_(actor,_born_1968)):
- **Meka Srikanth** (born 1968) = Telugu actor, 120+ Telugu films, debuted 1991
- **Tamil actor Srikanth** = Different person, primarily Tamil/Malayalam films

The issue is that many Telugu movies in the database have hero field as just "Srikanth" instead of "Srikanth Meka" or "Meka Srikanth", making it impossible for the API to distinguish them.

## Solution

### Step 1: Update Hero Names in Movies Table

The key fix is to update Telugu movies to use "Srikanth Meka" instead of just "Srikanth":

```sql
-- Update Telugu movies to use "Srikanth Meka" for clarity
UPDATE movies
SET 
  hero = 'Srikanth Meka',
  updated_at = NOW()
WHERE hero = 'Srikanth'  -- Exact match only
  AND language = 'Telugu'
  AND is_published = true
  AND release_year >= 1991;  -- Srikanth Meka's career started in 1991
```

### Step 2: Ensure Celebrity Profiles Exist

**Tamil actor Srikanth:**
```sql
UPDATE celebrities 
SET 
  slug = 'srikanth',
  name_en = 'Srikanth',
  name_te = 'ஸ்ரீகாந்த்',
  updated_at = NOW()
WHERE id = '<tamil-srikanth-id>';
```

**Srikanth Meka (Telugu actor, born 1968):**
```sql
UPDATE celebrities 
SET 
  slug = 'srikanth-meka',
  name_en = 'Srikanth Meka',
  name_te = 'శ్రీకాంత్ మేక',
  birth_date = '1968-03-23',
  updated_at = NOW()
WHERE id = '<srikanth-meka-id>';
```

### Step 3: Verify

After running the updates:

1. **Check hero names:**
   ```sql
   SELECT hero, language, COUNT(*) 
   FROM movies 
   WHERE hero ILIKE '%srikanth%' AND is_published = true
   GROUP BY hero, language;
   ```

2. **Test API:**
   ```bash
   # Should show Tamil actor Srikanth (Tamil/Malayalam movies)
   curl "http://localhost:3000/api/profile/srikanth" | jq '.person.name, .all_movies | length'
   
   # Should show Srikanth Meka (Telugu movies)
   curl "http://localhost:3000/api/profile/srikanth-meka" | jq '.person.name, .all_movies | length'
   ```

## Expected Result

- `?profile=srikanth` → Tamil actor Srikanth (Tamil/Malayalam movies)
- `?profile=srikanth-meka` → Srikanth Meka (Telugu movies from 1991+)
- No mixing of filmographies

## Why This Works

The API uses the `hero` field in movies to match actors. By updating Telugu movies to say "Srikanth Meka" instead of just "Srikanth", the API can now:
1. Match "Srikanth Meka" → celebrity with slug "srikanth-meka"
2. Match "Srikanth" (in Tamil/Malayalam movies) → celebrity with slug "srikanth"

This is more reliable than trying to filter by language alone, because the API's matching logic checks the hero field first.
