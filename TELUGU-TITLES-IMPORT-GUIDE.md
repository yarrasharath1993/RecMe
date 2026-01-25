# Telugu Titles Import Guide

**Date:** January 15, 2026  
**Status:** Ready for Import

---

## Overview

This guide explains how to import Telugu titles for movies that are missing them.

---

## Current Status

- **Total movies without Telugu titles:** 5,103
- **CSV file generated:** `movies-missing-telugu-titles-2026-01-14.csv`

---

## Workflow

### Step 1: Fill in Telugu Titles in CSV

1. Open the CSV file:
   ```bash
   open movies-missing-telugu-titles-2026-01-14.csv
   ```

2. Fill in the **"Title (Telugu - FILL THIS)"** column with Telugu titles

3. Save the file

### Step 2: Preview Changes (Dry Run)

Before applying changes, preview what will be updated:

```bash
npx tsx scripts/import-telugu-titles-csv.ts --dry-run
```

This will show you:
- How many movies will be updated
- Sample entries
- No actual changes will be made

### Step 3: Import Telugu Titles

When you're ready to apply the changes:

```bash
npx tsx scripts/import-telugu-titles-csv.ts
```

This will:
- Read the CSV file
- Update all movies with Telugu titles filled in
- Skip movies with empty Telugu title column
- Show success/failure for each movie

---

## CSV Format

The CSV has these columns:

| Column | Description | Example |
|--------|-------------|---------|
| **Slug** | Movie identifier (don't change) | `kalki-2898-ad-part-2-tba` |
| **Title (English)** | English title (reference only) | `Kalki 2898-AD: Part 2` |
| **Title (Telugu - FILL THIS)** | **Fill this column** | `కల్కి 2898 AD: పార్ట్ 2` |
| **Release Year** | Year (reference only) | `2025` |
| **Hero** | Hero name (reference only) | `Prabhas` |
| **Heroine** | Heroine name (reference only) | `Deepika Padukone` |
| **Director** | Director name (reference only) | `Nag Ashwin` |

**Important:** Only the **"Title (Telugu - FILL THIS)"** column will be imported!

---

## Tips

1. **Work in batches:** You don't have to fill all 5,103 at once. Import what you've completed, then continue later.

2. **Use Telugu keyboard:** Make sure you have Telugu input enabled on your system.

3. **Verify titles:** Double-check Telugu spellings before importing.

4. **Check import:** After importing, verify a few movies on the website to ensure titles display correctly.

---

## Example

**Before (CSV row):**
```
kalki-2898-ad-part-2-tba,Kalki 2898-AD: Part 2,,2025,Prabhas,Deepika Padukone,Nag Ashwin
```

**After filling:**
```
kalki-2898-ad-part-2-tba,Kalki 2898-AD: Part 2,కల్కి 2898 AD: పార్ట్ 2,2025,Prabhas,Deepika Padukone,Nag Ashwin
```

**Import result:**
```
✓ Kalki 2898-AD: Part 2 → కల్కి 2898 AD: పార్ట్ 2
```

---

## Troubleshooting

### "No Telugu titles found in CSV"
- Make sure you're editing the correct column: **"Title (Telugu - FILL THIS)"**
- Check that the file is saved

### Import fails for specific movies
- Check the slug matches exactly
- Verify Telugu text is properly encoded (UTF-8)

---

## Progress Tracking

You can check how many movies still need Telugu titles at any time:

```bash
npx tsx scripts/get-missing-telugu-titles.ts
```

This will regenerate the CSV with remaining movies.

---

## Next Steps

1. ✅ CSV file generated with 5,103 movies
2. ⏳ Fill in Telugu titles (in progress)
3. ⏳ Import filled titles
4. ⏳ Verify on website
5. ⏳ Repeat until all movies have Telugu titles

---

**Happy translating! 🎬**
