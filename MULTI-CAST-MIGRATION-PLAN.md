# Multi-Cast Support Migration Plan

**Date:** January 15, 2026  
**Status:** 🔴 **ACTION REQUIRED**

---

## 🐛 Problem Statement

Telugu cinema has many multi-starrers (movies with 2+ heroes), but our system currently stores:
- `hero` as a single STRING field
- `heroine` as a single STRING field

**Current Workaround:** 74 movies use comma-separated values like:
- `"Krishna, Sobhan Babu, Krishnam Raju"` (Kurukshetram)
- `"Chiranjeevi, Mohan Babu"` (Patnam Vachina Pativrathalu)

### Problems This Causes

1. **Search Broken:** Can't search for individual heroes properly
2. **Celebrity Linking Broken:** Can't link to "Krishna" profile when it's part of a comma-separated string
3. **Statistics Wrong:** Movie counts are incorrect for each actor
4. **Name Normalization Fails:** Search API can't normalize "Krishna, Sobhan Babu"

---

## ✅ Solution: Migrate to Array Fields

### Phase 1: Add New Array Fields ✅

Add to `movies` table:
```sql
ALTER TABLE movies 
ADD COLUMN heroes TEXT[] DEFAULT NULL,
ADD COLUMN heroines TEXT[] DEFAULT NULL;
```

### Phase 2: Migrate Existing Data

For each movie:
1. Parse `hero` field: `"Krishna, Sobhan Babu"` → `["Krishna", "Sobhan Babu"]`
2. Store in `heroes` array
3. Keep original `hero` for backward compatibility

```sql
-- Example migration
UPDATE movies
SET heroes = string_to_array(hero, ',')
WHERE hero LIKE '%,%';

-- Trim whitespace
UPDATE movies
SET heroes = array(
  SELECT trim(unnest(heroes))
)
WHERE heroes IS NOT NULL;
```

### Phase 3: Update All APIs

**Files to Update:**

1. `/app/api/movies/search/route.ts`
   ```typescript
   // Old: movie.hero
   // New: movie.heroes (array)
   
   if (movie.heroes && Array.isArray(movie.heroes)) {
     for (const hero of movie.heroes) {
       // Process each hero
     }
   }
   ```

2. `/app/api/profile/[slug]/route.ts`
   ```typescript
   // Old: .or(`hero.eq.${personName},heroine.eq.${personName}...`)
   // New: .or(`heroes.cs.{${personName}},heroines.cs.{${personName}}...`)
   ```

3. Frontend components that display cast

### Phase 4: Update Search Normalization

```typescript
// Handle both single hero and array
const heroNames = movie.heroes || (movie.hero ? [movie.hero] : []);

for (const heroName of heroNames) {
  const normalized = await normalizeCelebrityName(heroName);
  // ... aggregate
}
```

### Phase 5: Update Ingestion Scripts

All future movie ingestion should populate `heroes[]` array instead of `hero` string.

---

## 📊 Migration Statistics

```
Total movies: 5,162
Movies with multiple heroes: 74 (1.4%)
Movies with single hero: ~5,088 (98.6%)
```

**Sample Multi-Hero Movies:**
- Kurukshetram: Krishna, Sobhan Babu, Krishnam Raju (3 heroes)
- Patnam Vachina Pativrathalu: Chiranjeevi, Mohan Babu (2 heroes)
- Jai Jawan: Akkineni Nageswara Rao, Krishnam Raju (2 heroes)
- Sri Manjunatha: Arjun Sarja, Chiranjeevi (2 heroes)

---

## 🛠️ Implementation Steps

### Step 1: Schema Migration

```sql
-- Add new array columns
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS heroes TEXT[],
ADD COLUMN IF NOT EXISTS heroines TEXT[];

-- Create index for array searches
CREATE INDEX IF NOT EXISTS idx_movies_heroes ON movies USING GIN (heroes);
CREATE INDEX IF NOT EXISTS idx_movies_heroines ON movies USING GIN (heroines);
```

### Step 2: Data Migration

```typescript
// scripts/migrate-to-multi-cast.ts
// For each movie:
// 1. If hero contains comma, split it
// 2. Trim whitespace from each name
// 3. Store in heroes array
// 4. Keep original hero for compatibility
```

### Step 3: API Updates (Backward Compatible)

```typescript
// Helper function
function getHeroes(movie: Movie): string[] {
  // Prefer heroes array if available
  if (movie.heroes && Array.isArray(movie.heroes)) {
    return movie.heroes;
  }
  // Fallback to hero string
  if (movie.hero) {
    return movie.hero.split(',').map(h => h.trim());
  }
  return [];
}
```

### Step 4: Search API Update

```typescript
// In search aggregation
const heroNames = movie.heroes || (movie.hero ? [movie.hero] : []);

for (const heroName of heroNames) {
  if (heroName.toLowerCase().includes(query.toLowerCase())) {
    const normalized = await normalizeCelebrityName(heroName);
    // ... aggregate normally
  }
}
```

### Step 5: Profile API Update

```typescript
// Query with array support
.or(`
  heroes.cs.{${personName}},
  heroines.cs.{${personName}},
  hero.eq.${personName},
  heroine.eq.${personName},
  director.eq.${personName}
`)
```

---

## 🧪 Testing Plan

### Test Cases

1. **Single Hero Movie**
   - Before: `hero: "Chiranjeevi"`
   - After: `heroes: ["Chiranjeevi"]`
   - Search: Should still work
   - Profile: Should still show movie

2. **Multi-Hero Movie**
   - Before: `hero: "Krishna, Sobhan Babu"`
   - After: `heroes: ["Krishna", "Sobhan Babu"]`
   - Search: Both names should appear
   - Profile: Both actors should show this movie

3. **Backward Compatibility**
   - Old API calls using `hero` should still work
   - Gradual migration over time

---

## 📝 Migration Script Template

```typescript
#!/usr/bin/env npx tsx
/**
 * Migrate to Multi-Cast Schema
 * 
 * This script:
 * 1. Adds heroes[] and heroines[] columns
 * 2. Migrates comma-separated values to arrays
 * 3. Maintains backward compatibility
 */

import { createClient } from '@supabase/supabase-js';

async function migrateToMultiCast() {
  // 1. Add columns (if not exists)
  // 2. Migrate data
  // 3. Verify
  // 4. Update indexes
}
```

---

## ⚠️ Risks & Mitigation

### Risk 1: Breaking Changes
**Mitigation:** Keep old `hero/heroine` fields, update gradually

### Risk 2: Name Parsing Errors
**Mitigation:** Manual review of 74 comma-separated movies

### Risk 3: Performance Impact
**Mitigation:** Add GIN indexes on array columns

### Risk 4: Search Performance
**Mitigation:** Cache normalization, optimize queries

---

## 🎯 Benefits After Migration

1. ✅ **Accurate Statistics:** Each actor gets proper movie count
2. ✅ **Better Search:** Can find all heroes individually
3. ✅ **Proper Linking:** Each hero links to their profile
4. ✅ **Future-Proof:** Ready for multi-starrers
5. ✅ **Clean Data:** No more comma-separated hacks

---

## 📅 Rollout Plan

### Week 1: Preparation
- [ ] Add heroes/heroines columns to schema
- [ ] Create migration script with dry-run mode
- [ ] Test on sample movies

### Week 2: Data Migration
- [ ] Run migration script on 74 comma-separated movies
- [ ] Manual verification of results
- [ ] Update indexes

### Week 3: API Updates
- [ ] Update search API to handle arrays
- [ ] Update profile API to query arrays
- [ ] Update frontend components
- [ ] Maintain backward compatibility

### Week 4: Testing & Rollout
- [ ] Test all multi-hero movies
- [ ] Test single-hero movies (no regression)
- [ ] Test search for each hero
- [ ] Deploy to production

---

## 📄 Scripts to Create

1. `migrate-to-multi-cast-schema.ts` - Schema migration
2. `parse-comma-separated-cast.ts` - Data migration
3. `verify-multi-cast-migration.ts` - Verification
4. `update-search-for-multi-cast.ts` - Search API update
5. `update-profile-for-multi-cast.ts` - Profile API update

---

## 🎬 Example: How It Should Work

### Before (Broken)

**Movie:** Kurukshetram
```json
{
  "hero": "Krishna, Sobhan Babu, Krishnam Raju",
  "title_en": "Kurukshetram"
}
```

**Search for "Krishna":**
- ❌ Doesn't find it (search looks for exact match, not substring)

**Krishna's Profile:**
- ❌ Movie doesn't appear (can't match "Krishna" to "Krishna, Sobhan Babu, Krishnam Raju")

### After (Fixed)

**Movie:** Kurukshetram
```json
{
  "hero": "Krishna, Sobhan Babu, Krishnam Raju",  // kept for compatibility
  "heroes": ["Krishna", "Sobhan Babu", "Krishnam Raju"]  // NEW!
}
```

**Search for "Krishna":**
- ✅ Finds "Krishna" (iterates through heroes array)
- ✅ Aggregates correctly

**Krishna's Profile:**
- ✅ Shows Kurukshetram (query: `heroes.cs.{Krishna}`)

**Sobhan Babu's Profile:**
- ✅ Shows Kurukshetram (query: `heroes.cs.{Sobhan Babu}`)

---

## 🚀 Priority

**HIGH PRIORITY** - This affects:
- 74 movies immediately
- All future multi-starrers
- Search accuracy
- Celebrity statistics

**Recommended:** Start migration this week

---

**Status:** 🔴 **READY TO IMPLEMENT**  
**Next Step:** Run `migrate-to-multi-cast-schema.ts` with dry-run mode
