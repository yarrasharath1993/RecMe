r# Multi-Hero Support - Complete Implementation Guide

**Date:** January 15, 2026  
**Status:** 📋 **READY TO IMPLEMENT**

---

## 🎯 Executive Summary

**Problem:** Telugu cinema has many multi-starrers (movies with 2+ heroes), but our system only supports single hero per movie.

**Current Workaround:** 74 movies use comma-separated strings like `"Krishna, Sobhan Babu, Krishnam Raju"` which breaks:
- ❌ Search (can't find individual heroes)
- ❌ Celebrity profiles (movies don't show up)
- ❌ Statistics (movie counts are wrong)
- ❌ Name normalization (search duplication)

**Solution:** Migrate to array-based schema (`heroes[]`, `heroines[]`) to properly support multiple cast members.

---

## 📊 Current State Analysis

### Audit Results

```
Total Movies: 5,162
Movies with multiple heroes (comma-separated): 74 (1.4%)
Movies with single hero: ~5,088 (98.6%)
```

### Sample Multi-Hero Movies

1. **Kurukshetram** - `"Krishna, Sobhan Babu, Krishnam Raju"` (3 heroes)
2. **Patnam Vachina Pativrathalu** - `"Chiranjeevi, Mohan Babu"` (2 heroes)
3. **Jai Jawan** - `"Akkineni Nageswara Rao, Krishnam Raju"` (2 heroes)
4. **Sri Manjunatha** - `"Arjun Sarja, Chiranjeevi"` (2 heroes)
5. **Anthapuram** - `"Jagapathi Babu, Sai Kumar"` (2 heroes)

### Current Schema

```typescript
interface Movie {
  hero: string;              // ❌ Single string (limiting)
  heroine: string;           // ❌ Single string (limiting)
  director: string;          // OK (rarely multiple directors)
  producer: string;          // ❌ Should be array
  producers: string[];       // ✅ Already array
  supporting_cast: object[]; // ✅ Already array
}
```

---

## ✅ Proposed Solution

### New Schema

```typescript
interface Movie {
  // New array fields
  heroes: string[];          // ✅ Array of hero names
  heroines: string[];        // ✅ Array of heroine names
  
  // Keep old fields for compatibility
  hero: string;              // Deprecated, but maintained
  heroine: string;           // Deprecated, but maintained
  
  // Other fields...
}
```

### Migration SQL

```sql
-- Step 1: Add columns
ALTER TABLE movies ADD COLUMN IF NOT EXISTS heroes TEXT[];
ALTER TABLE movies ADD COLUMN IF NOT EXISTS heroines TEXT[];

-- Step 2: Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_movies_heroes 
ON movies USING GIN (heroes);

CREATE INDEX IF NOT EXISTS idx_movies_heroines 
ON movies USING GIN (heroines);

-- Step 3: Migrate existing data
-- For movies with comma-separated heroes
UPDATE movies
SET heroes = string_to_array(hero, ',')
WHERE hero LIKE '%,%';

-- Trim whitespace
UPDATE movies
SET heroes = array(
  SELECT trim(both ' ' from unnest(heroes))
)
WHERE heroes IS NOT NULL;

-- For movies with single hero
UPDATE movies
SET heroes = ARRAY[hero]
WHERE hero IS NOT NULL 
AND hero NOT LIKE '%,%' 
AND (heroes IS NULL OR array_length(heroes, 1) IS NULL);
```

---

## 🛠️ Implementation Steps

### Phase 1: Database Schema ✅ Ready

1. Run SQL migration (see `multi-cast-migration.sql`)
2. Add `heroes[]` and `heroines[]` columns
3. Create GIN indexes
4. Migrate 74 comma-separated movies

**Script:** `migrate-to-multi-cast-schema.ts`

### Phase 2: API Updates 📝 To Do

#### Update 1: Search API

**File:** `/app/api/movies/search/route.ts`

```typescript
// OLD CODE:
if (movie.hero && movie.hero.toLowerCase().includes(query.toLowerCase())) {
  const normalized = await normalizeCelebrityName(movie.hero);
  // ... aggregate
}

// NEW CODE:
const heroNames = movie.heroes || (movie.hero ? [movie.hero] : []);
for (const heroName of heroNames) {
  if (heroName.toLowerCase().includes(query.toLowerCase())) {
    const normalized = await normalizeCelebrityName(heroName);
    // ... aggregate (each hero separately)
  }
}
```

#### Update 2: Profile API

**File:** `/app/api/profile/[slug]/route.ts`

```typescript
// OLD CODE:
.or(`hero.eq.${personName},heroine.eq.${personName},director.eq.${personName}...`)

// NEW CODE:
.or(`
  heroes.cs.{${personName}},
  heroines.cs.{${personName}},
  hero.eq.${personName},
  heroine.eq.${personName},
  director.eq.${personName}...
`)

// Note: .cs is Supabase "contains" operator for arrays
// heroes.cs.{Krishna} finds movies where heroes array contains "Krishna"
```

#### Update 3: Movies Page

**File:** `/app/movies/page.tsx`

Display all heroes, not just first one:

```typescript
// OLD:
<div>{movie.hero}</div>

// NEW:
<div>
  {(movie.heroes || [movie.hero].filter(Boolean)).map((hero, i) => (
    <Link key={i} href={`/movies?profile=${slugify(hero)}`}>
      {hero}
    </Link>
  )).reduce((prev, curr) => [prev, ', ', curr])}
</div>
```

### Phase 3: Testing 🧪 To Do

**Test Cases:**

1. **Single Hero Movie (Backward Compat)**
   - Movie: "Baahubali"
   - Before: `{ hero: "Prabhas" }`
   - After: `{ hero: "Prabhas", heroes: ["Prabhas"] }`
   - ✅ Search for "Prabhas" should find it
   - ✅ Prabhas profile should show movie

2. **Multi-Hero Movie (New Feature)**
   - Movie: "Kurukshetram"
   - Before: `{ hero: "Krishna, Sobhan Babu, Krishnam Raju" }`
   - After: `{ hero: "Krishna, Sobhan Babu, Krishnam Raju", heroes: ["Krishna", "Sobhan Babu", "Krishnam Raju"] }`
   - ✅ Search for "Krishna" should find it
   - ✅ Search for "Sobhan Babu" should find it
   - ✅ Krishna profile should show movie
   - ✅ Sobhan Babu profile should show movie
   - ✅ Krishnam Raju profile should show movie

3. **Search Aggregation**
   - Search "Krishna"
   - ✅ Should show "Krishna" once (not duplicated)
   - ✅ Movie count should include Kurukshetram and his solo movies

---

## 📝 Scripts Created

### Audit Scripts
1. ✅ `audit-movie-schema-multicast.ts` - Analyzes current schema
2. ✅ `migrate-to-multi-cast-schema.ts` - Performs migration

### Files Generated
1. ✅ `multi-cast-migration.sql` - SQL script for manual execution
2. ✅ `MULTI-CAST-MIGRATION-PLAN.md` - Detailed plan
3. ✅ `MULTI-HERO-SUPPORT-SUMMARY.md` - This file

---

## 🚀 Quick Start Guide

### Step 1: Add Database Columns

Run in Supabase SQL Editor:

```sql
ALTER TABLE movies ADD COLUMN IF NOT EXISTS heroes TEXT[];
ALTER TABLE movies ADD COLUMN IF NOT EXISTS heroines TEXT[];
CREATE INDEX IF NOT EXISTS idx_movies_heroes ON movies USING GIN (heroes);
CREATE INDEX IF NOT EXISTS idx_movies_heroines ON movies USING GIN (heroines);
```

### Step 2: Migrate Data

```bash
# Preview changes
npx tsx scripts/migrate-to-multi-cast-schema.ts --dry-run

# Apply migration
npx tsx scripts/migrate-to-multi-cast-schema.ts
```

### Step 3: Update Search API

Edit `/app/api/movies/search/route.ts` to handle `heroes[]` arrays.

### Step 4: Update Profile API

Edit `/app/api/profile/[slug]/route.ts` to query `heroes.cs.{name}`.

### Step 5: Test

```bash
# Restart dev server
npm run dev

# Test search for "Krishna"
# - Should find Kurukshetram
# - Should show single "Krishna" entry

# Test Krishna's profile
# - Should show Kurukshetram in filmography
```

---

## 💡 Key Benefits

### Before Migration

```
Movie: Kurukshetram
Hero: "Krishna, Sobhan Babu, Krishnam Raju"

❌ Search "Krishna" → Not found (exact match fails)
❌ Krishna's profile → Movie missing
❌ Sobhan Babu's profile → Movie missing
❌ Movie count → Wrong for all 3 actors
```

### After Migration

```
Movie: Kurukshetram
Hero: "Krishna, Sobhan Babu, Krishnam Raju"  (kept for compatibility)
Heroes: ["Krishna", "Sobhan Babu", "Krishnam Raju"]  (NEW!)

✅ Search "Krishna" → Found!
✅ Krishna's profile → Shows Kurukshetram
✅ Sobhan Babu's profile → Shows Kurukshetram
✅ Krishnam Raju's profile → Shows Kurukshetram
✅ Movie counts → Accurate for all actors
✅ Search aggregation → Works correctly
```

---

## ⚠️ Important Notes

### Backward Compatibility

- **Keep `hero` and `heroine` fields** - Don't delete them
- **Read from arrays first, fall back to string** - `movie.heroes || [movie.hero]`
- **Gradual migration** - No breaking changes

### Performance

- **GIN indexes** - Added for efficient array searches
- **Name caching** - Normalization cache already in place
- **Query optimization** - Use `heroes.cs.{name}` for array contains

### Future Enhancements

1. **directors[]** - Support for co-directors
2. **writers[]** - Support for multiple writers
3. **producers[]** - Already supported, just use it
4. **UI improvements** - Show all cast members
5. **Cast order** - Add `main_hero_index` for display order

---

## 📊 Impact Analysis

### Movies Affected: 74 (1.4%)
### Celebrities Affected: ~150+ (all in multi-starrers)
### Users Impacted: All (better search results)

### Timeline

- **Prep & Schema:** 1-2 hours
- **Data Migration:** 30 minutes
- **API Updates:** 2-3 hours
- **Testing:** 2-3 hours
- **Total:** 1 day

---

## ✅ Success Criteria

- [ ] Schema migration complete (heroes[], heroines[] columns exist)
- [ ] 74 comma-separated movies migrated to arrays
- [ ] Search API handles arrays correctly
- [ ] Profile API queries arrays with .cs operator
- [ ] Each hero in multi-starrer shows the movie on their profile
- [ ] Search doesn't duplicate results
- [ ] Movie counts are accurate
- [ ] No regression in single-hero movies
- [ ] Performance remains good (indexes work)

---

## 🎯 Next Actions

1. **TODAY:** Add database columns via Supabase dashboard
2. **TODAY:** Run migration script
3. **TODAY:** Update search API
4. **TOMORROW:** Update profile API
5. **TOMORROW:** Test all multi-hero movies
6. **TOMORROW:** Deploy to production

---

**Priority:** 🔴 **HIGH** - Affects 74 movies and search accuracy

**Status:** 📋 **READY TO IMPLEMENT**

**Owner:** Development Team

**Estimated Time:** 1 day

---

**Related Issues:**
- Nagarjuna duplicates (fixed) ✅
- Search name normalization (fixed) ✅
- Multi-hero support (this document) 📋
