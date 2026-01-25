# ANR Name Order Duplicate Fix - COMPLETE ✅

## Issue
Legendary actor **Akkineni Nageswara Rao (ANR)** had **duplicate profiles** due to name ordering variations:

- ❌ `http://localhost:3000/movies?profile=nageshwara-rao-akkineni` (Last name first)
- ✅ `http://localhost:3000/movies?profile=akkineni-nageswara-rao` (First name first)

**Total filmography split across 2 profiles!**

## Root Cause

**Name Ordering Inconsistency**:
- Some movies credited him as **"Akkineni Nageswara Rao"** (First Last)
- Others used **"Nageshwara Rao Akkineni"** (Last First)
- Additional variations: "A. Nageswara Rao", "ANR"

This created multiple profile pages for the same legendary actor.

## Investigation Results

### Name Variations Found:
```
"Akkineni Nageswara Rao"    : 219 movies (hero) ✅ Master name
"Nageshwara Rao Akkineni"   : 12 movies (hero) + 1 (heroine) + 1 (producer)
"A. Nageswara Rao"          : 1 movie (hero)
"ANR"                       : 4 movies (hero)
──────────────────────────────────────────
Total: 238 movies split across 4 name variations
```

### Celebrity Record:
- **Name**: Akkineni Nageswara Rao
- **Slug**: `akkineni-nageswara-rao`
- **Telugu**: అక్కినేని నాగేశ్వరరావు
- **TMDB ID**: 237254

## Solution

**Master Name Established**: **"Akkineni Nageswara Rao"**
- Matches celebrity record
- Follows Telugu naming convention (First name - Last name)
- Standard usage in industry

### Fix Implementation:

```typescript
// Merged all variations into master name
const masterName = 'Akkineni Nageswara Rao';
const variations = [
  'Nageshwara Rao Akkineni',  // Last-first order
  'A. Nageswara Rao',         // Abbreviated
  'ANR',                       // Acronym
];

// Updated across all roles
for (const variation of variations) {
  await supabase
    .from('movies')
    .update({ hero: masterName })  // Also heroine, producer
    .eq('hero', variation);
}
```

## Results

### Movies Fixed:

**Hero Field**: 17 movies
- "Nageshwara Rao Akkineni" → "Akkineni Nageswara Rao": 12 movies
- "A. Nageswara Rao" → "Akkineni Nageswara Rao": 1 movie
- "ANR" → "Akkineni Nageswara Rao": 4 movies

**Other Fields**: 2 movies
- Heroine field (data error): 1 movie
- Producer field: 1 movie

**Total Fixed**: **19 movies**

### Final Unified Profile:

**Akkineni Nageswara Rao**: **236 movies** ✅
- URL: http://localhost:3000/movies?profile=akkineni-nageswara-rao
- Complete filmography from 1949-2000
- All roles unified (actor, producer)

### Duplicate Profile Eliminated:

**Nageshwara Rao Akkineni**: **0 movies** ✅
- URL: http://localhost:3000/movies?profile=nageshwara-rao-akkineni
- Now empty (no hero movies)
- Should redirect or show 404

## Impact

### For Users:
- ✅ **Complete filmography** - All 236 ANR movies in one place
- ✅ **No confusion** - Only one canonical profile
- ✅ **Better search** - Find all ANR movies easily
- ✅ **Accurate data** - Proper name order maintained

### For Database:
- ✅ **Data consistency** - Single name spelling across all movies
- ✅ **No fragmentation** - Complete career view
- ✅ **Standards established** - First-Last name order

## Name Ordering Pattern

This fix reveals a broader issue: **Last name vs First name ordering**

### Common in Telugu Cinema:
Many celebrities can be credited either way:
- "Akkineni Nageswara Rao" ✅ OR "Nageswara Rao Akkineni"
- "Chiranjeevi Konidela" OR "Konidela Chiranjeevi"
- "Daggubati Ramanaidu" OR "Ramanaidu Daggubati"

### Solution Strategy:
1. **Check celebrity table** for canonical spelling
2. **Use First-Last order** as default (Telugu convention)
3. **Merge variations** into master name
4. **Document standard** in naming guidelines

## Related Fixes

This is similar to other duplicate profile issues fixed today:

1. **Nithin/Nithiin** - Spelling variation
   - Fixed: 1 movie (Youth 2002)
   - Result: Unified "Nithiin" profile (27 movies)

2. **Name spacing** - "N.T. Rama Rao" vs "N. T. Rama Rao"
   - Fixed: 268 movies
   - Result: Standardized spacing after dots

3. **ANR Name Order** - This fix
   - Fixed: 19 movies
   - Result: Unified "Akkineni Nageswara Rao" profile (236 movies)

## Testing

### Verify Correct Profile:
```bash
# Should show 236 movies
curl http://localhost:3000/api/profile/akkineni-nageswara-rao | jq .roles.actor.count
```

### Browser Test:
1. Visit: **http://localhost:3000/movies?profile=akkineni-nageswara-rao**
   - ✅ Should show **"Akkineni Nageswara Rao"**
   - ✅ Should show **236 movies**
   - ✅ Complete filmography from 1949-2000

2. Visit: **http://localhost:3000/movies?profile=nageshwara-rao-akkineni**
   - ✅ Should be **empty** or show 404
   - ✅ Or redirect to correct profile

## Files Created

### Scripts:
- `/scripts/check-anr-duplicate.ts` - Investigation script
- `/scripts/fix-anr-name-order.ts` - Fixed hero field (17 movies)
- `/scripts/fix-anr-all-roles.ts` - Fixed all roles (2 more movies)

### Documentation:
- `/ANR-NAME-ORDER-FIX-2026-01-14.md` - This report

## Recommendations

### Prevent Future Name Order Duplicates:

1. **Celebrity Table Enhancement**:
   ```sql
   ALTER TABLE celebrities ADD COLUMN name_aliases TEXT[];
   -- Store: ['Nageshwara Rao Akkineni', 'ANR', 'A. Nageswara Rao']
   ```

2. **Validation at Entry**:
   - Check for reversed name order
   - Warn if creating variation
   - Suggest canonical name from celebrity table

3. **Bulk Audit**:
   - Scan for other last-first vs first-last duplicates
   - Common patterns: "Surname FirstName" vs "FirstName Surname"

4. **Naming Guidelines**:
   - Document standard: First name - Last name order
   - Exceptions: When celebrity is known by reversed order
   - Reference: Celebrity table as source of truth

## Additional Name Order Candidates

Other celebrities that might have similar issues:

### High Priority (Check These):
- **Chiranjeevi Konidela** / Konidela Chiranjeevi
- **Daggubati Ramanaidu** / Ramanaidu Daggubati  
- **Allu Aravind** / Aravind Allu
- **Akkineni Nagarjuna** / Nagarjuna Akkineni
- **Nandamuri Balakrishna** / Balakrishna Nandamuri

### Audit Script:
```bash
# Check for reversed name patterns
npx tsx scripts/audit-name-order-duplicates.ts
```

---

**Issue**: ANR had 2 profiles due to name order (First-Last vs Last-First)  
**Root Cause**: Inconsistent name ordering across 19 movies  
**Fix**: Merged all variations into "Akkineni Nageswara Rao" (First-Last)  
**Status**: ✅ **FIXED AND VERIFIED**  
**Date**: January 14, 2026

**Test URL**: http://localhost:3000/movies?profile=akkineni-nageswara-rao  
**Expected**: Complete 236-movie filmography ✅  
**Result**: UNIFIED! No more duplicate profiles.

**Related Pattern**: Name order duplicates - A new category of duplicates discovered  
**Next**: Audit other celebrities for similar last-first vs first-last issues
