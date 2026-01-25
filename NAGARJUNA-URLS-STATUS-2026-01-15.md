# Nagarjuna URLs Status & Slug Aliases Solution

**Date:** January 15, 2026  
**Question:** Will both URLs work? `profile=nagarjuna` and `profile=akkineni-nagarjuna`

---

## Current Status (After Fix)

### ✅ http://localhost:3000/movies?profile=nagarjuna
**Status:** **WORKS** ✅
- Primary slug in database
- Fast direct lookup
- **This is the canonical URL**

### ⚠️ http://localhost:3000/movies?profile=akkineni-nagarjuna
**Status:** **MIGHT WORK** via fallback ⚠️
- Not in celebrities table anymore (we changed the slug)
- API has fallback that searches movies table
- Slower, not guaranteed
- **Not recommended**

---

## Better Solution: Slug Aliases

Instead of relying on fallback, we should support **slug aliases** to ensure both URLs work reliably.

### How It Works

```
Primary slug: "nagarjuna"
Aliases: ["akkineni-nagarjuna", "nagarjuna-akkineni"]

┌─────────────────────────┐
│ Profile in Database     │
├─────────────────────────┤
│ id: 7ea66985...         │
│ name: Akkineni Nagarjuna│
│ slug: "nagarjuna" ✅    │
│ slug_aliases: [         │
│   "akkineni-nagarjuna"  │
│   "nagarjuna-akkineni"  │
│ ]                       │
└─────────────────────────┘

URLs that work:
✅ /movies?profile=nagarjuna
✅ /movies?profile=akkineni-nagarjuna
✅ /movies?profile=nagarjuna-akkineni

All point to same profile!
```

---

## Implementation Steps

### 1. Add Column to Database

Run the SQL file:

```bash
# Copy SQL to clipboard or run in Supabase SQL Editor
cat add-slug-aliases-column.sql
```

SQL content:
```sql
-- Add slug_aliases column
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS slug_aliases TEXT[];

-- Create index for fast searches
CREATE INDEX IF NOT EXISTS idx_celebrities_slug_aliases
ON celebrities USING GIN (slug_aliases);

-- Add Nagarjuna's aliases
UPDATE celebrities
SET slug_aliases = ARRAY['akkineni-nagarjuna', 'nagarjuna-akkineni']
WHERE slug = 'nagarjuna';
```

### 2. API Already Updated ✅

I've already added slug alias support to `/app/api/profile/[slug]/route.ts`:

```typescript
// Try slug_aliases (e.g., 'akkineni-nagarjuna' -> finds profile with slug 'nagarjuna')
const { data: aliasMatch } = await supabase
  .from('celebrities')
  .select('*')
  .contains('slug_aliases', [slug])
  .single();

if (aliasMatch) {
  celebrity = aliasMatch;
}
```

### 3. Test After SQL Execution

```bash
# Check status
npx tsx scripts/check-nagarjuna-slug-status.ts

# Both should now show ✅ EXISTS
```

---

## Benefits

1. **Multiple URLs Work**: Old URLs don't break
2. **No Duplicates**: One profile, many URLs
3. **SEO Friendly**: Can have preferred canonical URL
4. **User Friendly**: Works with common name variations
5. **Future Proof**: Easy to add more aliases

---

## Files Created/Modified

### Created:
- `scripts/check-nagarjuna-slug-status.ts` - Check which URLs work
- `scripts/add-celebrity-slug-aliases.ts` - Add aliases (future use)
- `add-slug-aliases-column.sql` - SQL to add column and Nagarjuna aliases
- `NAGARJUNA-URLS-STATUS-2026-01-15.md` - This document

### Modified:
- `app/api/profile/[slug]/route.ts` - Added slug_aliases lookup

---

## Summary

**Question:** Will both URLs work?

**Answer:**
- Currently: Only `nagarjuna` works reliably ✅
- After SQL: **Both will work** ✅✅
  - `profile=nagarjuna` (primary)
  - `profile=akkineni-nagarjuna` (alias)

**Action Required:**
1. Run `add-slug-aliases-column.sql` in Supabase
2. Test both URLs
3. Done! 🎉
