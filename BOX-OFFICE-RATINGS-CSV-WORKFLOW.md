# Box Office Ratings - Manual Review Workflow

## 📊 CSV Export Complete!

**File Created:** `box-office-ratings-export-2026-01-14.csv`  
**Total Movies:** 1,000  
**File Size:** 151 KB

---

## 📁 CSV Structure

The CSV contains the following columns:

| Column | Description | Editable |
|--------|-------------|----------|
| Slug | Movie identifier | ❌ No |
| Title (English) | English title | ❌ No |
| Title (Telugu) | Telugu title | ❌ No |
| Release Year | Year of release | ❌ No |
| Box Office Category | industry-hit, blockbuster, super-hit, hit, average, below-average | ✅ Yes |
| Current Rating | Current rating (our_rating) | ❌ No (reference) |
| TMDB/Avg Rating | Average rating from TMDB | ❌ No (reference) |
| Review Rating | Editorial review rating | ❌ No (reference) |
| Director | Director name | ❌ No (reference) |
| Hero | Lead actor | ❌ No (reference) |
| Heroine | Lead actress | ❌ No (reference) |
| Genres | Movie genres | ❌ No (reference) |
| Is Blockbuster | Boolean flag | ❌ No (reference) |
| Is Classic | Boolean flag | ❌ No (reference) |
| Is Underrated | Boolean flag | ❌ No (reference) |
| Story Score | Story score from review | ❌ No (reference) |
| Direction Score | Direction score from review | ❌ No (reference) |
| Performance Score | Average performance score | ❌ No (reference) |
| **Suggested Rating** | **YOUR CORRECTED RATING** | ✅ **Yes - Fill This!** |
| **Notes** | **YOUR COMMENTS** | ✅ **Yes - Optional** |

---

## 🔄 Workflow

### Step 1: Open the CSV
```bash
# File location
/Users/sharathchandra/Projects/telugu-portal/box-office-ratings-export-2026-01-14.csv
```

Open in:
- Excel
- Google Sheets
- Numbers
- Any CSV editor

### Step 2: Review Movies

For each movie, review:
1. **Box Office Category** - Is it correct?
2. **Current Rating** - Does it match the quality?
3. **Component Scores** - Story, Direction, Performance
4. **TMDB Rating** - External reference

### Step 3: Fill Corrections

In the **"Suggested Rating"** column, enter your corrected rating (1.0 - 10.0):

```
Examples:
- 8.5  (for excellent films)
- 7.2  (for good films)
- 6.0  (for average films)
- 9.0  (for masterpieces)
```

### Step 4: Add Notes (Optional)

In the **"Notes"** column, add reasons for changes:

```
Examples:
- "Overrated, should be lower"
- "Classic film, deserves higher"
- "Box office hit but mediocre quality"
- "Hidden gem, needs recognition"
```

### Step 5: Save and Return

Save the CSV with a new name:
```
box-office-ratings-REVIEWED.csv
```

---

## 📥 Import Your Corrections

### Dry Run (Preview)
```bash
npx tsx scripts/import-box-office-ratings-csv.ts \
  --file=box-office-ratings-REVIEWED.csv
```

This shows what would change without applying updates.

### Execute (Apply Changes)
```bash
npx tsx scripts/import-box-office-ratings-csv.ts \
  --file=box-office-ratings-REVIEWED.csv \
  --execute
```

This applies your corrections to the database.

---

## 📊 Current Distribution

### By Box Office Category
```
Average           673 movies (67.3%)
Hit               231 movies (23.1%)
Super Hit          55 movies (5.5%)
Blockbuster        20 movies (2.0%)
Below Average      11 movies (1.1%)
Industry Hit       10 movies (1.0%)
```

### By Current Rating
```
9.0-10.0          30 movies (3.0%)
8.0-8.9          407 movies (40.7%)
7.0-7.9          563 movies (56.3%)
```

---

## 🎯 Review Guidelines

### What to Look For

1. **Overrated Movies**
   - Current rating too high for quality
   - Box office success inflated rating unfairly
   - Poor reviews but high score

2. **Underrated Movies**
   - Quality films with low ratings
   - Hidden gems not properly recognized
   - Critical acclaim but average box office

3. **Misclassified Categories**
   - Wrong box office category assigned
   - Industry hit that's actually just a hit
   - Average film marked as blockbuster

4. **Rating Anomalies**
   - Rating doesn't match component scores
   - Outliers compared to similar films
   - Era-adjusted ratings off

### Rating Scale Reference

| Rating | Category | Description |
|--------|----------|-------------|
| 9.0-10.0 | Masterpiece | Best of the best, legendary |
| 8.0-8.9 | Excellent | Outstanding quality |
| 7.0-7.9 | Great | Very good, recommended |
| 6.0-6.9 | Good | Solid, worth watching |
| 5.0-5.9 | Average | Decent but forgettable |
| 4.0-4.9 | Below Average | Weak, skip unless fan |
| 1.0-3.9 | Poor | Avoid |

---

## 💡 Tips

1. **Sort by Rating** to find outliers quickly
2. **Filter by Category** to review groups
3. **Check Component Scores** for consistency
4. **Compare Similar Films** for fairness
5. **Consider Era** when reviewing classics
6. **Use Notes** to document reasoning

---

## 🚀 Quick Commands

### Generate Fresh Export
```bash
npx tsx scripts/export-box-office-ratings-csv.ts
```

### Import Your Corrections (Dry Run)
```bash
npx tsx scripts/import-box-office-ratings-csv.ts \
  --file=your-file.csv
```

### Import Your Corrections (Execute)
```bash
npx tsx scripts/import-box-office-ratings-csv.ts \
  --file=your-file.csv \
  --execute
```

### Check Results
```bash
npx tsx scripts/audit-all-box-office-final.ts
```

---

## 📋 Sample CSV Rows

```csv
Slug,Title (English),Release Year,Box Office Category,Current Rating,Suggested Rating,Notes
pokiri-2006,"Pokiri",2006,blockbuster,8.7,9.0,"Legendary mass film"
magadheera-2009,"Magadheera",2009,industry-hit,9.0,,"Rating is correct"
khaleja-2010,"Khaleja",2010,below-average,6.5,7.0,"Underrated gem"
```

---

## ✅ Checklist

Before returning the CSV:

- [ ] Reviewed all movies (or at least high-priority ones)
- [ ] Filled "Suggested Rating" for corrections
- [ ] Added "Notes" for significant changes
- [ ] Saved file with clear name
- [ ] Ready to import

---

**Need Help?**
- Check existing rating distribution
- Compare with similar films
- Consider box office + quality balance
- Document your reasoning in Notes

**File Location:** `/Users/sharathchandra/Projects/telugu-portal/box-office-ratings-export-2026-01-14.csv`
