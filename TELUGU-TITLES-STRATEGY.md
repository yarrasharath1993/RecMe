# Telugu Titles Enrichment Strategy

**Date:** January 15, 2026  
**Status:** In Progress

## Current Status

| Metric | Count | Percentage |
|--------|-------|------------|
| Total Published Movies | 5,396 | 100% |
| With Telugu Title | 736 | 13.6% |
| **Missing Telugu Title** | **4,660** | 86.4% |

## What Was Done Today

### 1. Applied Known Verified Titles ✅
- Applied **79** high-quality verified Telugu titles
- Covered popular movies from 2019-2024
- Examples: సలార్, పుష్ప, కల్కి, గేమ్ ఛేంజర్, etc.

### 2. Created Export Files
Movies needing Telugu titles have been exported to CSV files:

| File | Movies | Period |
|------|--------|--------|
| `telugu-needed-2020s.csv` | 589 | 2020-2029 |
| `telugu-needed-2010s.csv` | 795 | 2010-2019 |
| `telugu-needed-2000s.csv` | 716 | 2000-2009 |
| `telugu-needed-pre2000.csv` | 1,000+ | Before 2000 |

## Manual Review Strategy

### Priority 1: Recent Movies (2020-2026) - 589 movies
These are the most viewed and should be prioritized.

**How to fill:**
1. Open `telugu-needed-2020s.csv` in Excel/Google Sheets
2. For each movie, search Telugu Wikipedia:
   - `https://te.wikipedia.org/wiki/{Movie_Name}_(చిత్రం)`
3. Copy the Telugu title from the article title
4. Paste into the `title_te` column

### Priority 2: 2010s Movies - 795 movies
Popular films from the decade including many blockbusters.

### Priority 3: Pre-2010 Movies - 1,700+ movies
Classic Telugu cinema - requires careful research.

## Scripts Available

### 1. Apply Known Titles
```bash
npx tsx scripts/apply-known-telugu-titles.ts --execute
```
Applies verified Telugu titles from the hardcoded list.

### 2. Import from CSV
```bash
# Dry run first
npx tsx scripts/import-telugu-titles-csv.ts

# Then execute
npx tsx scripts/import-telugu-titles-csv.ts --execute

# Or specify a single file
npx tsx scripts/import-telugu-titles-csv.ts --file=telugu-needed-2020s.csv --execute
```

## CSV Format

The CSV files have this structure:
```
slug,title_en,year,hero,director,title_te
game-changer-2025,"Game Changer",2025,"Ram Charan","Shankar",గేమ్ ఛేంజర్
pushpa-2-the-rule-2024,"Pushpa 2: The Rule",2024,"Allu Arjun","Sukumar",పుష్ప 2: ది రూల్
```

**Important:** The `title_te` column must contain valid Telugu script characters (Unicode range `\u0C00-\u0C7F`).

## Common Telugu Title Patterns

| English Pattern | Telugu Pattern |
|-----------------|----------------|
| Name ending in -am | -ం (anuswara) |
| Double letters | Half characters (halant) |
| "The" prefix | ది |
| "Mr." | మిస్టర్ |
| Numbers | Keep as-is (1, 2, etc.) |
| Part 1/2 | పార్ట్ 1/2 |

## Next Steps

1. **Fill CSV files** with Telugu titles (manual task)
2. **Run import script** to apply changes
3. **Re-audit** to track progress:
   ```bash
   npx tsx -e "..." # Run audit script
   ```

## Target

Aim for **50%+ coverage** for recent movies (2019-2026) as the first milestone.

| Current | Target | Gap |
|---------|--------|-----|
| 13.6% | 50% | +1,962 titles needed |

## Resources

- Telugu Wikipedia: https://te.wikipedia.org
- Telugu films list: https://te.wikipedia.org/wiki/తెలుగు_చిత్రాల_జాబితా
- English Wikipedia (for cross-reference): https://en.wikipedia.org/wiki/List_of_Telugu_films_of_{year}
