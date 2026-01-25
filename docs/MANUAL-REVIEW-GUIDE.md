# Manual Review Guide - Remaining Issues

**Generated**: January 13, 2026  
**Total Movies Needing Review**: 190 (from first batch)  
**Review Files Location**: `docs/manual-review/`

---

## 📊 Overview

After automated fixes, **190 movies** require manual review across 5 categories:

| Category | Count | Priority | Estimated Time |
|----------|-------|----------|----------------|
| Wrong Hero Gender | 50 | High | 2-3 hours |
| No TMDB ID | 50 | Medium | 3-4 hours |
| Incomplete Data | 38 | Medium | 2 hours |
| Missing Images | 50 | Low | 2-3 hours |
| Potential Duplicates | 2 | High | 15 minutes |

**Total Estimated Time**: ~10-13 hours

---

## 🎯 Category 1: Wrong Hero Gender (50 movies)

**File**: `wrong-hero-gender-batch-[timestamp].csv`  
**Priority**: HIGH  
**Issue**: Female actresses listed in "hero" field

### Review Process

1. Open the CSV file
2. For each movie:
   - Click the URL to view the movie page
   - Verify if the hero is actually a female actress
   - Check director and year to confirm the movie
   - Decide action:
     - **SWAP**: Move hero to heroine, fetch correct male hero
     - **KEEP**: Female-led film, hero field is correct
     - **RESEARCH**: Need more information

### Common Cases

**Case 1: Data Entry Error**
```
Current: Hero = "Sridevi", Heroine = null
Action: Move Sridevi to heroine, research male lead
```

**Case 2: Female-Led Film**
```
Current: Hero = "Sridevi", Heroine = "Sridevi"
Action: Research if legitimate female-centric film
```

**Case 3: Both Wrong**
```
Current: Hero = "Sridevi", Heroine = "Kamal Haasan"
Action: Swap - Kamal Haasan to hero, Sridevi to heroine
```

### Quick Fix Script

For confirmed swaps, you can use:

```bash
# After manual verification, create fixes.json with:
# [{"slug": "movie-slug", "hero": "New Hero", "heroine": "New Heroine"}]

npx tsx scripts/apply-manual-fixes.ts --file=fixes.json --execute
```

---

## 🔍 Category 2: No TMDB ID (50 movies)

**File**: `no-tmdb-id-batch-[timestamp].csv`  
**Priority**: MEDIUM  
**Issue**: Movies not found in TMDB database

### Review Process

1. For each movie, research using:
   - **Wikipedia**: Search for "Telugu film [title] [year]"
   - **IMDb**: Search movie title + year
   - **TMDB Manual**: Search with alternate spellings
   - **Local Archives**: Telugu film databases

2. If found on Wikipedia/IMDb:
   - Extract: Director, Cast, Synopsis, Release Date
   - Find poster image
   - Update database manually

3. If not found anywhere:
   - Mark for deletion (likely invalid entry)
   - Or keep as placeholder for future research

### Research Template

For each movie, fill this template:

```
Movie: [Title]
Year: [Year]
Sources Checked: Wikipedia ☐ IMDb ☐ TMDB ☐ Other ☐
Found: Yes ☐ No ☐
If Yes:
  Director: _______________
  Hero: _______________
  Heroine: _______________
  Synopsis: _______________
  Image URL: _______________
Action: Update ☐ Delete ☐ Keep for Later ☐
```

### Bulk Update

After research, use:

```bash
# Create enrichment.json with research data
npx tsx scripts/bulk-enrich-from-research.ts --file=enrichment.json --execute
```

---

## 📊 Category 3: Incomplete Data (38 movies)

**File**: `incomplete-data-batch-[timestamp].csv`  
**Priority**: MEDIUM  
**Issue**: 3+ critical fields missing (director, cast, genres, synopsis, poster)

### Review Process

1. For each movie:
   - Check what fields are missing
   - Determine if movie has TMDB ID
   - If yes: Investigate why TMDB enrichment failed
   - If no: Research from Wikipedia/IMDb

2. Priority fields to fill:
   - **Director** (most important)
   - **Hero/Heroine** (for search and filtering)
   - **Genres** (for categorization)
   - **Synopsis** (for content)
   - **Poster** (for visual appeal)

### Quick Actions

**If TMDB ID exists but enrichment failed:**
```bash
# Re-run TMDB enrichment with force flag
npx tsx scripts/enrich-movies-tmdb-turbo.ts --force --movies="slug1,slug2,slug3" --execute
```

**If no TMDB ID:**
- Research manually (see Category 2 process)
- Or mark for batch research session

---

## 🖼️  Category 4: Missing Images (50 movies)

**File**: `missing-images-batch-[timestamp].csv`  
**Priority**: LOW  
**Issue**: No poster image available

### Review Process

1. For each movie, search for images:
   
   **Source 1: Google Images**
   - Search: "[Title] [Year] telugu movie poster"
   - Look for high-quality official posters
   - Verify it's the correct movie (check year, cast)

   **Source 2: Wikipedia**
   - Search movie on Wikipedia
   - Check infobox for poster image
   - Use Wikipedia Commons URL

   **Source 3: IMDb**
   - Find movie on IMDb
   - Right-click poster, copy image URL
   - Verify it's high resolution

   **Source 4: Internet Archive**
   - Search for movie promotional materials
   - Old film posters may be archived

2. Image Quality Standards:
   - Minimum: 300x450 pixels
   - Preferred: 500x750 pixels or higher
   - Format: JPG or PNG
   - Should be official poster, not screenshot

### Bulk Image Update

After collecting image URLs:

```bash
# Create images.json:
# [{"slug": "movie-slug", "poster_url": "https://..."}]

npx tsx scripts/bulk-update-images.ts --file=images.json --execute
```

---

## 🔄 Category 5: Potential Duplicates (2 movies)

**File**: `potential-duplicates-batch-[timestamp].csv`  
**Priority**: HIGH  
**Issue**: Same title and year, possibly duplicate entries

### Review Process

For each pair:

1. **Compare Both Movies**:
   - Open both URLs side-by-side
   - Compare: Director, Cast, Synopsis, Release Date, Runtime
   - Check: Number of reviews, ratings, completeness

2. **Determine Action**:
   
   **MERGE** if:
   - Identical movie, just duplicate entry
   - One has better/more complete data
   - Same director and cast
   
   **KEEP BOTH** if:
   - Different directors (remake or regional version)
   - Different cast (distinct movies)
   - Different plots/genres
   - One is dubbed/remake version
   
   **DELETE ONE** if:
   - Clear placeholder or test entry
   - Obvious data error

3. **Merge Process** (if merging):
   - Choose movie with better data as "keeper"
   - Copy missing fields from duplicate to keeper
   - Update reviews/ratings to point to keeper
   - Delete duplicate

### Merge Script

```bash
# After decision, create merge-pairs.json:
# [{"keep": "slug1", "delete": "slug2"}]

npx tsx scripts/merge-duplicates.ts --file=merge-pairs.json --execute
```

---

## 📝 Review Workflow

### Daily Review Session (2-3 hours)

**Hour 1: High Priority**
1. Review potential duplicates (2 movies, 15 min)
2. Review wrong hero gender (20 movies, 45 min)

**Hour 2: Medium Priority**
1. Research no TMDB ID movies (15 movies, 60 min)

**Hour 3: Completion**
1. Research incomplete data (20 movies, 40 min)
2. Find missing images (10 movies, 20 min)

### Weekly Goal

- **Week 1**: Complete all high priority (52 movies)
- **Week 2**: Complete medium priority (88 movies)
- **Week 3**: Complete low priority (50 movies)

---

## 🛠️ Helper Scripts

### 1. Apply Manual Fixes
```bash
npx tsx scripts/apply-manual-fixes.ts --file=fixes.json --execute
```

### 2. Bulk Enrich from Research
```bash
npx tsx scripts/bulk-enrich-from-research.ts --file=enrichment.json --execute
```

### 3. Bulk Update Images
```bash
npx tsx scripts/bulk-update-images.ts --file=images.json --execute
```

### 4. Merge Duplicates
```bash
npx tsx scripts/merge-duplicates.ts --file=merge-pairs.json --execute
```

### 5. Delete Invalid Entries
```bash
npx tsx scripts/delete-movies.ts --file=delete-list.json --execute
```

---

## 📊 Progress Tracking

### Checklist

#### High Priority (52 movies)
- [ ] Potential Duplicates (2 movies) - 15 min
- [ ] Wrong Hero Gender Batch 1 (50 movies) - 2-3 hours

#### Medium Priority (88 movies)
- [ ] No TMDB ID Batch 1 (50 movies) - 3-4 hours
- [ ] Incomplete Data Batch 1 (38 movies) - 2 hours

#### Low Priority (50 movies)
- [ ] Missing Images Batch 1 (50 movies) - 2-3 hours

### Running Total
```
Reviewed: ___ / 190
Fixed: ___ 
Deleted: ___
Pending: ___
```

---

## 💡 Tips & Best Practices

### Research Tips

1. **Use Multiple Sources**: Cross-verify data from 2+ sources
2. **Check Release Year**: Ensures you're looking at correct movie
3. **Verify Cast**: Compare with known filmographies
4. **Trust Official Sources**: Wikipedia > Blogs
5. **Document Uncertainty**: Flag low-confidence data

### Data Entry Standards

1. **Names**: Use most common English spelling
2. **Titles**: Include year if commonly used
3. **Genres**: Use standard TMDB genre names
4. **Synopsis**: 2-3 sentences, avoid spoilers
5. **Images**: High quality, official posters only

### Time-Saving Strategies

1. **Batch Similar Movies**: Research same actor/director together
2. **Use Templates**: Copy-paste research template
3. **Keyboard Shortcuts**: Learn CSV editor shortcuts
4. **Prioritize**: Focus on high-impact movies first
5. **Take Breaks**: 10-minute break every hour

---

## 📈 Quality Metrics

After completing manual review, aim for:

```
✓ Data Completeness: >95%
✓ Cast Accuracy: >98%
✓ Image Coverage: >90%
✓ Synopsis Coverage: >85%
✓ Zero Duplicates: 100%
```

---

## 🆘 Need Help?

### Common Issues

**Q: Movie exists but can't find any data**
A: Flag for deletion or keep as placeholder. Update status to "research needed"

**Q: Multiple versions of same movie (remake/dub)**
A: Keep all versions, add note in synopsis: "Telugu remake of..." or "Dubbed from Hindi"

**Q: Conflicting data across sources**
A: Use most authoritative source (Wikipedia > IMDb > Blogs). Add note in admin field.

**Q: Can't determine if duplicate**
A: Keep both, add note for future review. Better safe than deleting valid data.

**Q: Image copyright concerns**
A: Use only promotional posters, Wikipedia Commons, or official distributor images

---

## ✅ Completion Checklist

When all manual review is done:

- [ ] All CSV files processed
- [ ] Helper scripts run for bulk updates
- [ ] Database backup created
- [ ] Sample verification (check 10 random movies)
- [ ] Update DATA-QUALITY-MASTER-SUMMARY.md
- [ ] Run final audit to verify improvements
- [ ] Celebrate! 🎉

---

**Next Steps After Manual Review**:
1. Run comprehensive audit again
2. Generate updated metrics
3. Identify any new patterns
4. Schedule ongoing maintenance

---

**End of Manual Review Guide**

**Files to Review**:
- `wrong-hero-gender-batch-[timestamp].csv`
- `no-tmdb-id-batch-[timestamp].csv`
- `incomplete-data-batch-[timestamp].csv`
- `missing-images-batch-[timestamp].csv`
- `potential-duplicates-batch-[timestamp].csv`

All files are in: `docs/manual-review/`
