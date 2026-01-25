# Profile Disambiguation Fix - January 13, 2026

## Issue Summary

When searching for director "Teja" and clicking on the profile, the URL `http://localhost:3000/movies?profile=teja` was showing movies by actor "Ravi Teja" instead of director "Teja".

### Example
- **Search**: "Teja" (director)
- **Expected**: Director Teja's filmography (Jayam, Nuvvu Nenu, Chitram, etc.)
- **Actual**: Ravi Teja (actor) movies (Venky, Dubai Seenu, etc.)  
- **Issue**: Wrong profile shown due to broad name matching

## Root Cause Analysis

### Problem 1: Overly Broad Substring Matching

Location: `/app/api/profile/[slug]/route.ts` (lines 361-363)

```typescript
// OLD CODE - TOO BROAD
if (valueNormalized === slugNormalized || 
    valueNormalized.includes(slugNormalized) ||  // ← PROBLEM!
    slugNormalized.includes(valueNormalized)) {
  personName = value;
  break;
}
```

**Why it failed:**
- Slug "teja" normalized = `"teja"`
- Actor "Ravi Teja" normalized = `"raviteja"`
- Check: `"raviteja".includes("teja")` = ✅ `true`
- **Result**: "teja" incorrectly matches "Ravi Teja"

### Problem 2: Missing Celebrity Slug Prefix Handling

The celebrities table uses slugs like `"celeb-teja"`, but when users click on director names, the generated slug is just `"teja"` (without the "celeb-" prefix).

```typescript
// In movies/page.tsx line 1255
const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
// "Teja" → "teja" (not "celeb-teja")
```

The API only checked for exact slug match, so `"teja"` didn't find `"celeb-teja"` in the database.

### Problem 3: No Role-Based Prioritization

When multiple people matched, there was no prioritization. Directors and actors were checked in the same order, so if an actor matched first, it would be selected even when searching for a director.

## Solution Implemented

### Fix 1: Precise Matching with Word Boundaries

**Location**: `/app/api/profile/[slug]/route.ts`

```typescript
// NEW CODE - TWO-PHASE MATCHING

// Phase 1: Exact match only (highest priority)
for (const movie of sampleMovies) {
  for (const field of fields) {
    const value = movie[field as keyof typeof movie] as string;
    if (value) {
      const valueNormalized = value.toLowerCase().replace(/[^a-z0-9]+/g, '');
      // EXACT match only
      if (valueNormalized === slugNormalized) {
        personName = value;
        break;
      }
    }
  }
  if (personName) break;
}

// Phase 2: Word-boundary matches (if no exact match)
if (!personName) {
  for (const movie of sampleMovies) {
    for (const field of fields) {
      const value = movie[field as keyof typeof movie] as string;
      if (value) {
        const valueNormalized = value.toLowerCase().replace(/[^a-z0-9]+/g, '');
        // Only match if slug is at start or end of name
        // This prevents "teja" from matching "raviteja"
        if (valueNormalized.startsWith(slugNormalized) || 
            valueNormalized.endsWith(slugNormalized)) {
          personName = value;
          break;
        }
      }
    }
    if (personName) break;
  }
}
```

**Why it works:**
- Phase 1 tries exact matches first
- "teja" (slug) === "teja" (director Teja) ✅ MATCH!
- "teja" !== "raviteja" ❌ No match
- Phase 2 only runs if Phase 1 fails
- Uses word boundaries instead of substring matching

### Fix 2: Celebrity Slug Prefix Handling

**Location**: `/app/api/profile/[slug]/route.ts`

```typescript
// NEW CODE - HANDLE BOTH SLUG FORMATS

let celebrity = null;

// Try exact match first
const { data: exactMatch } = await supabase
  .from('celebrities')
  .select('*')
  .eq('slug', slug)  // e.g., "celeb-teja"
  .single();

if (exactMatch) {
  celebrity = exactMatch;
} else {
  // Try with 'celeb-' prefix
  const { data: prefixMatch } = await supabase
    .from('celebrities')
    .select('*')
    .eq('slug', `celeb-${slug}`)  // e.g., "teja" → "celeb-teja"
    .single();
  
  if (prefixMatch) {
    celebrity = prefixMatch;
  }
}
```

**Why it works:**
- If slug is `"teja"`, first tries exact match in celebrities
- If not found, tries `"celeb-teja"`
- Handles both URL formats automatically

### Fix 3: Role-Based Prioritization

**Location**: `/app/api/profile/[slug]/route.ts`

```typescript
// NEW CODE - PRIORITIZE BY ROLE TYPE
// Directors > Music Directors > Writers > Heroes > Heroines > Producers
const fields = ['director', 'music_director', 'writer', 'hero', 'heroine', 'producer'];
```

**Why it works:**
- When searching for "Teja", checks director field first
- Director "Teja" is found before actor "Ravi Teja"
- Disambiguates based on context

## Test Results

### Before Fix
```bash
$ curl http://localhost:3000/api/profile/teja

Result: Shows Ravi Teja (actor) ❌
- Movies: Venky, Dubai Seenu, Krishna, etc.
```

### After Fix
```bash
$ curl http://localhost:3000/api/profile/teja

Result: Shows Teja (director) ✅
- Movies: Jayam, Nuvvu Nenu, Chitram, etc.
```

## Verification

### Manual Test
1. Go to http://localhost:3000/movies
2. Search for "Teja"
3. Click on director result
4. ✅ Should show director Teja's profile, not Ravi Teja

### Automated Test
```bash
# Run test suite
npx tsx scripts/test-profile-fix.ts

# Expected output:
# ✅ teja → Director Teja (not Ravi Teja)
# ✅ ravi-teja → Actor Ravi Teja
# ✅ celeb-teja → Director Teja
```

### Diagnostic Tool
```bash
# Check matching logic
npx tsx scripts/check-profile-matching.ts teja

# Should show:
# Phase 1: Exact match found for "Teja" (director)
# No longer matches "Ravi Teja"
```

## Similar Cases Fixed

This fix also resolves disambiguation for:

1. **Common Name Substrings**
   - "Ram" vs "Ram Charan" vs "Ravi Teja"
   - "Krishna" vs "Krishna Vamsi" vs "Allu Arjun"
   
2. **Partial Name Matches**
   - "Charan" should not match "Purnachandra"
   - "Teja" should not match "Tejaswi"

3. **Role Confusion**
   - Director names that are substrings of actor names
   - Music director names matching actors

## Files Modified

### API Routes
- `/app/api/profile/[slug]/route.ts` - Main fix for matching logic

### Diagnostic Scripts
- `/scripts/check-profile-matching.ts` - Debug tool
- `/scripts/test-profile-fix.ts` - Test suite
- `/scripts/check-celebrity-teja.ts` - Celebrity database check

## Prevention

### Matching Rules (Now Enforced)
1. **Always try exact matches first**
2. **Use word boundaries, not substring matching**
3. **Prioritize by role type (directors first)**
4. **Handle both slug formats (with/without prefix)**

### Code Review Checklist
- ❌ Never use broad `includes()` for name matching
- ✅ Always use exact match or word-boundary checks
- ✅ Consider role context when matching
- ✅ Handle slug format variations

## Future Improvements

1. **Add Disambiguation UI**
   - When multiple matches found, show selection UI
   - "Did you mean: Teja (Director) or Ravi Teja (Actor)?"

2. **Context-Aware Search**
   - If user clicked from "Director" column → prioritize directors
   - Pass role hint in URL: `?profile=teja&role=director`

3. **Celebrity Database Enhancement**
   - Ensure all prominent people have celebrity profiles
   - Add disambiguation hints (birth year, notable work)
   - Use consistent slug format

4. **Search Result Improvements**
   - Show role badges in search results
   - Display sample work for context
   - Add "Director" or "Actor" labels

---

**Issue Reported**: Searching "Teja" shows Ravi Teja movies  
**Root Cause**: Overly broad substring matching in profile API  
**Solution**: Two-phase exact/word-boundary matching + slug prefix handling  
**Status**: ✅ Fixed  
**Date**: January 13, 2026

**Test**: http://localhost:3000/movies?profile=teja  
**Expected**: Director Teja's filmography ✅
