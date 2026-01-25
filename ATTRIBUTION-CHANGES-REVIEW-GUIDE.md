# 📋 Attribution Changes Review Guide

**File:** `ATTRIBUTION-CHANGES-REVIEW.csv`  
**Total Changes:** 2,944 attributions  
**Movies Affected:** 616 unique movies  
**Celebrities:** 108

---

## 🎯 What's in This Report

This CSV contains **every attribution change** that was applied to your database from the Wikipedia audit. Each row represents one celebrity being added to one movie's cast list.

---

## 📊 CSV Structure

### Key Columns:

| Column | Description | Example |
|--------|-------------|---------|
| **Movie Title (EN)** | English movie title | "Aatagadu" |
| **Movie Title (TE)** | Telugu movie title | "ఆటాగాడు" |
| **Year** | Release year | 1980 |
| **Celebrity Name** | Person attributed | "Ali" |
| **Role Type** | Role from Wikipedia | "Best Child Actor" |
| **Attribution Added** | What was added | `{"name":"Ali","role":"Best Child Actor","type":"General"}` |
| **Current Field Value** | Full current value | Shows all cast members |

### For Your Review:

| Column | Purpose |
|--------|---------|
| **Review Status** | *(Blank - you fill)* Mark as: ✓ Approved, ✗ Reject, ? Needs Check |
| **Review Notes** | *(Blank - you fill)* Add any comments |

---

## 🔍 How to Review

### Step 1: Open in Spreadsheet App
```bash
# Mac
open ATTRIBUTION-CHANGES-REVIEW.csv

# Or in Excel/Google Sheets
# Import the CSV file
```

### Step 2: Sort & Filter

**Recommended sorting:**
1. Sort by "Movie Title (EN)" to review movie-by-movie
2. Or sort by "Celebrity Name" to review per-celebrity
3. Or sort by "Year" to review chronologically

**Use filters:**
- Filter by Celebrity Name to check specific people
- Filter by Year range (e.g., 1980-1990)
- Filter by Role Type to check specific roles

### Step 3: Review Each Entry

For each row, check:

✅ **Correct Attribution?**
   - Is this celebrity in this movie?
   - Is the role correct?
   - Is the cast type (Lead/Supporting) accurate?

❌ **Incorrect?**
   - Mark "Review Status" as "✗ Reject"
   - Add reason in "Review Notes"

❓ **Unsure?**
   - Mark as "? Needs Check"
   - Research on IMDB/Wikipedia
   - Add findings in notes

### Step 4: Save Your Review

Save the CSV with your review marks:
```
ATTRIBUTION-CHANGES-REVIEW-COMPLETED.csv
```

---

## 🎬 Sample Review Examples

### Example 1: Correct Attribution
```csv
Movie: "Aatagadu", Year: 1980
Celebrity: "Ali"
Role: "Best Child Actor"
Review Status: ✓ Approved
Review Notes: "Correct - Ali was child actor in this film"
```

### Example 2: Wrong Movie
```csv
Movie: "Barfi!", Year: 2023
Celebrity: "Anurag Basu"
Role: "Director"
Review Status: ✗ Reject
Review Notes: "Wrong - Anurag Basu is the director, not cast member"
```

### Example 3: Needs Verification
```csv
Movie: "Daughters' Destiny", Year: 2023
Celebrity: "Anurag Basu"
Role: "Actor"
Review Status: ? Needs Check
Review Notes: "Need to verify if he acted or only directed"
```

---

## 📈 Statistics to Check

### Field Distribution:
- **cast_members:** 2,944 entries
- All attributions went to `cast_members` JSONB field

### Top Movies (Most Attributions):
Check movies with many attributions - they might need special review

### Celebrity Coverage:
- 108 celebrities processed
- Each entry shows what was added for that celebrity

---

## ⚠️ Common Issues to Watch For

### 1. Role Confusion
- **Issue:** Directors/Producers marked as "Actor"
- **Why:** Wikipedia table parsing can misidentify roles
- **Action:** Mark as reject if role is wrong

### 2. Duplicate Names
- **Issue:** Common names (e.g., "Naresh") might be wrong person
- **Why:** Name disambiguation challenges
- **Action:** Check if the slug/ID matches the right person

### 3. Cross-Language Films
- **Issue:** Tamil/Malayalam films with Telugu cast
- **Why:** Audit includes cross-language work
- **Action:** Verify if person was in Telugu version

### 4. Multiple Entries Per Movie
- **Issue:** Same person appears multiple times
- **Why:** JSONB array allows multiple entries
- **Action:** Check if it's correct (e.g., dual roles) or duplicate

---

## ✅ After Review

### Generate Clean List

Filter your reviewed CSV:
1. Keep rows marked "✓ Approved"
2. Remove rows marked "✗ Reject"
3. Research rows marked "? Needs Check"

### Revert Bad Changes

For rejected attributions, we can create a revert script:
```typescript
// Will be provided after your review
revert-incorrect-attributions.ts
```

### Apply Additional Fixes

For entries needing correction (not removal), document:
- What needs to change
- Correct role/field
- We'll create targeted fix script

---

## 📊 Quick Stats for Your DB

After review, run in Supabase:

```sql
-- Count movies with cast members
SELECT COUNT(*) FROM movies WHERE cast_members IS NOT NULL;

-- Count total cast member entries
SELECT COUNT(*) 
FROM movies, jsonb_array_elements(cast_members) AS cm
WHERE cast_members IS NOT NULL;

-- Top 20 movies by cast size
SELECT 
  title_en,
  jsonb_array_length(cast_members) as cast_count
FROM movies
WHERE cast_members IS NOT NULL
ORDER BY cast_count DESC
LIMIT 20;

-- Verify specific celebrity
SELECT 
  title_en,
  release_year,
  cast_members
FROM movies, jsonb_array_elements(cast_members) AS cm
WHERE cm->>'name' ILIKE '%Ali%'
ORDER BY release_year;
```

---

## 🎯 Priority Review Areas

### High Priority:
1. **Recent films (2020-2024)** - Most relevant
2. **Big stars (Chiranjeevi, Prabhas, etc.)** - High visibility
3. **Director/Producer entries** - Often miscategorized

### Medium Priority:
4. **Supporting cast** - Check if roles match
5. **Cross-language films** - Verify Telugu involvement
6. **Older films (pre-1980)** - Historical accuracy

### Low Priority:
7. **Background roles** - Less critical
8. **Cameo appearances** - Usually correct from Wikipedia

---

## 📞 Questions?

If you find patterns of issues:
- Let me know the pattern
- I can create targeted fix scripts
- Can re-run specific celebrity audits

---

**Start reviewing!** Open the CSV and mark your review status for each entry. 🎬
