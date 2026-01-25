# Chiranjeevi Profile Slug Fix

**Issue Reported**: January 12, 2026  
**Issue**: `http://localhost:3000/movies?profile=chiranjeevi` was opening Chiranjeevi Sarja's profile instead of the megastar Chiranjeevi.

---

## 🐛 Root Cause

The main Chiranjeevi (Konidela Chiranjeevi, the megastar) had an auto-generated slug `"celeb-fba63e11"` instead of the human-readable slug `"chiranjeevi"`.

### How the Profile API Works

The `/api/profile/[slug]/route.ts` has a two-step fallback:

1. **Step 1**: Try to find celebrity by `slug` in the `celebrities` table
2. **Step 2**: If not found, search by name pattern in the `movies` table

When a user visited `?profile=chiranjeevi`:
- ❌ **Step 1 Failed**: No celebrity with slug="chiranjeevi" in the `celebrities` table
- ⚠️ **Step 2 Activated**: Searched movies table for actors named "chiranjeevi"
- 🐛 **Wrong Match**: Found "Chiranjeevi Sarja" first (alphabetically or by movie count)

---

## ✅ Solution

Updated the main Chiranjeevi's slug in the `celebrities` table:

```sql
UPDATE celebrities 
SET slug = 'chiranjeevi' 
WHERE id = 'fba63e11-4734-4978-9b91-dbc283e44e97';
```

### Before Fix:
- **Chiranjeevi (Megastar)**: `slug = "celeb-fba63e11"` ❌
- **URL**: Had to use `?profile=celeb-fba63e11` (not user-friendly)

### After Fix:
- **Chiranjeevi (Megastar)**: `slug = "chiranjeevi"` ✅
- **URL**: `?profile=chiranjeevi` now works correctly!

---

## 🔍 Diagnostic Process

1. **Checked the movies page** (`app/movies/page.tsx`):
   - Line 576: `entitySlug = filters.profile || slugify(filters.actor) || slugify(filters.director)`
   - ✅ Correctly passing slug to `EntityProfileLayout`

2. **Checked EntityProfileLayout** (`components/reviews/EntityProfileLayout.tsx`):
   - Line 177: Calls `/api/profile/${encodeURIComponent(entitySlug)}`
   - ✅ Correctly fetching from API

3. **Checked API route** (`app/api/profile/[slug]/route.ts`):
   - Line 276: `.eq('slug', slug).single()`
   - ⚠️ Returns error: "Cannot coerce to single JSON object" when multiple matches exist
   - 🐛 Falls back to Step 2 (name search), which found wrong actor

4. **Queried the database**:
   ```typescript
   // Found that Chiranjeevi had slug "celeb-fba63e11", not "chiranjeevi"
   const { data } = await supabase
     .from('celebrities')
     .select('name_en, slug')
     .ilike('name_en', '%chiranjeevi%');
   
   // Result: Chiranjeevi | Slug: "celeb-fba63e11" ❌
   ```

5. **Applied the fix**:
   ```typescript
   await supabase
     .from('celebrities')
     .update({ slug: 'chiranjeevi' })
     .eq('id', 'fba63e11-4734-4978-9b91-dbc283e44e97');
   ```

---

## 📝 Lessons Learned

### Problem: Auto-Generated Slugs
- Auto-generated slugs like `"celeb-fba63e11"` are not user-friendly
- They don't work for URL sharing or bookmarking
- They break when users expect human-readable URLs

### Best Practices for Celebrity Slugs

1. **Use human-readable slugs** for well-known celebrities:
   - ✅ `chiranjeevi` (for the megastar)
   - ✅ `prabhas`
   - ✅ `mahesh-babu`

2. **Use full-name slugs** for disambiguation:
   - ✅ `chiranjeevi-sarja` (for the other Chiranjeevi)
   - ✅ `ram-charan` vs `ram-pothineni`
   - ✅ `ntr-jr` vs `ntr-sr`

3. **Reserve simple slugs** for the most famous person:
   - `chiranjeevi` → Konidela Chiranjeevi (megastar)
   - `ntr` → NTR Jr. (current generation star)
   - `anr` → Akkineni Nageswara Rao

4. **API should prioritize celebrities table** over movies table search

---

## 🎯 Impact

- ✅ Fixed immediately
- ✅ No code changes required (only database update)
- ✅ URL now works as expected: `http://localhost:3000/movies?profile=chiranjeevi`
- ✅ Megastar Chiranjeevi's profile is now accessible via the friendly URL

---

## 🔧 Future Prevention

Consider adding:
1. **Unique constraint** on `celebrities.slug` column
2. **Validation** to prevent auto-generated slugs for major stars
3. **Admin UI** to review and update slugs for top celebrities
4. **Slug redirect system** (e.g., `chiranjeevi-konidela` → `chiranjeevi`)

---

**Status**: ✅ RESOLVED  
**Fix Applied**: January 12, 2026  
**Verified**: Working correctly
