# Srikanth Duplicate Profile Fix

**Issue Reported**: Multiple actors with "srikanth" in name causing mixed filmography  
**URL**: `http://localhost:3000/movies?profile=srikanth`

---

## 🐛 Problem

When accessing `?profile=srikanth`, the profile shows movies from 2 different actors both named "Srikanth", mixing their filmographies together.

### Root Cause

1. **No celebrity profile found**: The API doesn't find a celebrity with slug "srikanth" in the `celebrities` table
2. **Falls back to movies search**: The API searches the `movies` table for actors named "srikanth"
3. **Broad matching**: The `ilike` query matches multiple actors:
   - "Srikanth" (main actor)
   - "Srikanth Meka" or "Srikanth Addala" (other actor)
4. **Filtering issue**: If both actors are just named "Srikanth" (single word), the exact match filter matches both

---

## ✅ Solution

### Step 1: Identify the Actors

Run this query to see all actors with "srikanth" in their name:

```sql
-- Find celebrities
SELECT id, name_en, name_te, slug, is_published 
FROM celebrities 
WHERE name_en ILIKE '%srikanth%' OR name_te ILIKE '%srikanth%';

-- Find unique hero names in movies
SELECT DISTINCT hero, COUNT(*) as movie_count
FROM movies
WHERE hero ILIKE '%srikanth%' AND is_published = true
GROUP BY hero
ORDER BY movie_count DESC;
```

### Step 2: Determine the Main Actor

Identify which "Srikanth" is the main/prominent actor (usually the one with more movies or higher profile).

### Step 3: Fix Slugs

**Option A: If celebrity profiles exist but have wrong slugs**

```sql
-- Update main actor to have slug "srikanth"
UPDATE celebrities 
SET slug = 'srikanth', updated_at = NOW()
WHERE id = '<main-actor-id>';

-- Update other actor(s) with specific slugs
UPDATE celebrities 
SET slug = 'srikanth-<surname>', updated_at = NOW()
WHERE id = '<other-actor-id>';
-- Example: 'srikanth-meka' or 'srikanth-addala'
```

**Option B: If celebrity profiles don't exist**

Create celebrity profiles for both actors:

```sql
-- Insert main actor
INSERT INTO celebrities (
  name_en, name_te, slug, gender, occupation, is_published, created_at, updated_at
) VALUES (
  'Srikanth', 'శ్రీకాంత్', 'srikanth', 'male', 'actor', true, NOW(), NOW()
) RETURNING id;

-- Insert other actor with specific slug
INSERT INTO celebrities (
  name_en, name_te, slug, gender, occupation, is_published, created_at, updated_at
) VALUES (
  'Srikanth Meka', 'శ్రీకాంత్ మేక', 'srikanth-meka', 'male', 'actor', true, NOW(), NOW()
) RETURNING id;
```

### Step 4: Verify

1. Check that the main actor has slug "srikanth":
   ```sql
   SELECT id, name_en, slug FROM celebrities WHERE slug = 'srikanth';
   ```

2. Test the API:
   ```bash
   curl "http://localhost:3000/api/profile/srikanth" | jq '.person'
   ```

3. Verify the profile shows only the main actor's movies

---

## 🔧 API Improvement (Optional)

The API could be improved to detect when multiple people match and warn about it. However, the proper fix is to ensure celebrity profiles exist with correct slugs.

---

## 📝 Best Practices

1. **Reserve simple slugs for main actors**: `srikanth` → main/prominent actor
2. **Use full-name slugs for others**: `srikanth-meka`, `srikanth-addala`
3. **Always create celebrity profiles**: Don't rely on movies table search
4. **Use slug_aliases**: For name variations (e.g., "Srikanth" vs "Shrikanth")

---

## 🎯 Expected Result

After the fix:
- `?profile=srikanth` → Shows main Srikanth's filmography only
- `?profile=srikanth-meka` → Shows Srikanth Meka's filmography (if exists)
- No mixing of filmographies

---

## 🔍 Diagnostic Commands

```bash
# Check API response
curl "http://localhost:3000/api/profile/srikanth" | jq '.person'

# Check movie count
curl "http://localhost:3000/api/profile/srikanth" | jq '.all_movies | length'

# Check if celebrity profile exists
curl "http://localhost:3000/api/profile/srikanth" | jq '.person.id'
# Should return a UUID, not null
```
