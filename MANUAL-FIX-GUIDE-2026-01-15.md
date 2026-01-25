# Manual Fix Guide - 25 High-Value Movies
**Date:** January 15, 2026  
**Status:** Ready for Manual Data Entry

---

## 📋 Overview

Since automatic TMDB enrichment failed for these 25 movies, we'll manually add posters and ratings.

---

## 🎯 What You Need to Do

### Step 1: Fill in the CSV Template ✏️

**File:** `manual-fix-template.csv`

For each movie, fill in these columns:
- **New_Poster_URL**: Full URL to the movie poster image
- **New_Rating**: Rating from 0-10 (can use IMDb, your judgment, or estimate)
- **Notes**: Optional notes about the source

**Example:**
```csv
ID,Title,Year,...,New_Poster_URL,New_Rating,Notes
8182275f-e88d...,Badrinath,2011,...,https://image.tmdb.org/t/p/w500/abc123.jpg,7.2,Found on IMDb
```

### Step 2: Where to Find Posters & Ratings

#### Option A: IMDb (Recommended)
1. Go to https://www.imdb.com
2. Search for movie name + year + language
3. Copy poster URL (right-click image → Copy Image Address)
4. Use IMDb rating or your own estimate

#### Option B: Wikipedia
1. Search "[Movie Name] [Year] film"
2. Find poster image
3. Copy image URL
4. Estimate rating based on reception

#### Option C: Google Images
1. Search "[Movie Name] [Year] poster"
2. Find high-quality poster
3. Copy image URL
4. Estimate rating

#### Option D: Use Placeholders
If you can't find a poster, use a generic Telugu cinema poster or skip it.

---

## 🚀 Quick Start Commands

### Preview Changes (Dry Run):
```bash
cd /Users/sharathchandra/Projects/telugu-portal
npx tsx scripts/apply-manual-fixes.ts manual-fix-template.csv
```

### Apply Changes:
```bash
npx tsx scripts/apply-manual-fixes.ts manual-fix-template.csv --execute
```

### Publish Updated Movies:
```bash
npx tsx scripts/publish-44-validated-movies.ts --execute
```

---

## 📊 Priority Order

### **HIGHEST PRIORITY** (5 movies - Star Heroes)
These will have the biggest impact:

1. **Badrinath (2011)** - Allu Arjun
   - Should be easy to find on IMDb
   - High-value movie

2. **Chennakeshava Reddy (2002)** - Balakrishna
   - Popular movie
   - Should have good data

3. **Chaithanya (1991)** - Nagarjuna
   - Well-known film
   - Good poster available

4. **Nizhal Thedum Nenjangal (1982)** - Rajinikanth
   - Tamil film
   - Search Tamil title

5. **Well, If You Know Me (2015)** - Venkatesh
   - Recent film
   - Should be findable

**Time:** 20 minutes  
**Impact:** 5 high-value movies published

---

### **HIGH PRIORITY** (3 movies - Chiranjeevi Early Career)
Complete his filmography:

6. **Kothala Raayudu (1979)** - Chiranjeevi
7. **Sri Rambantu (1979)** - Chiranjeevi
8. **Aaj Ka Goonda Raj (1992)** - Chiranjeevi

**Time:** 15 minutes  
**Impact:** Complete early Chiranjeevi catalog

---

### **MEDIUM PRIORITY** (9 movies - Tamil Classics)
Historical importance:

9. **Pathini Deivam (1957)** - Gemini Ganesan
10. **Padhi Bhakti (1958)** - Gemini Ganesan
11. **Kaathavaraayan (1958)** - Sivaji Ganesan
12. **Kuravanji (1960)** - Sivaji Ganesan
13. **Paarthaal Pasi Theerum (1962)** - Sivaji Ganesan
14. **Kai Koduttha Dheivam (1964)** - Sivaji Ganesan
15. **Poojaikku Vandha Malar (1965)** - Gemini Ganesan
16. **Karunai Ullam (1978)** - Gemini Ganesan
17. **Karunamayudu (1978)** - Vijayachander

**Time:** 30-45 minutes  
**Impact:** Complete classic Tamil cinema collection

---

### **LOWER PRIORITY** (8 movies - Old Telugu Classics)
May be harder to find:

18. **Adarsham (1952)** - ANR
19. **Bratuku Theruvu (1953)** - ANR
20. **Shri Krishna Pandaviyam (1966)** - NTR
21. **Shri Krishnavataram (1967)** - NTR
22. **Iddaru Ammayilu (1972)** - ANR
23. **Amma Mata (1972)** - Sobhan Babu
24. **Jeevana Theeralu (1977)** - Krishnam Raju
25. **Bangaru Bommalu (1977)** - ANR

**Time:** 1-2 hours  
**Impact:** Complete classic collection

---

## 💡 Rating Guidelines

Since many old films don't have ratings, use these guidelines:

### Classic Films (Pre-1980):
- **Legendary actors** (NTR, ANR, Sivaji): 7.5-8.5
- **Well-known films**: 7.0-7.5
- **Lesser-known**: 6.5-7.0

### Modern Films (1990+):
- Check IMDb if available
- Use box office success as indicator
- Popular heroes: 7.0+

### When in Doubt:
Use **7.0** as a safe default for classics.

---

## 🎨 Poster URL Tips

### Good Poster URLs:
✅ `https://image.tmdb.org/t/p/w500/abc123.jpg`  
✅ `https://upload.wikimedia.org/wikipedia/en/a/ab/Movie.jpg`  
✅ `https://m.media-amazon.com/images/M/abc.jpg`  
✅ Any CDN or image host

### Bad Poster URLs:
❌ Google Image search result pages  
❌ Pinterest links  
❌ Embedded thumbnails  
❌ Social media previews

**Test:** URL should end with `.jpg`, `.png`, or `.webp`

---

## 📝 Example CSV Entry

```csv
ID,Title,Year,Hero,Director,Current_Poster,Current_Rating,New_Poster_URL,New_Rating,Notes
8182275f-e88d-4453-b855-4bb1695ef80c,Badrinath,2011,Allu Arjun,V. V. Vinayak,NULL,NULL,https://image.tmdb.org/t/p/w500/xyz.jpg,7.2,Found on IMDb - popular film
092508fb-f084-443b-aa50-3c6d06b6ec12,Chennakeshava Reddy,2002,Nandamuri Balakrishna,V. V. Vinayak,NULL,NULL,https://upload.wikimedia.org/wikipedia/en/a/ab/Movie.jpg,7.5,Classic Balakrishna blockbuster
```

---

## 🔍 Search Tips

### For Tamil Films:
- Add "Tamil" to search: "Kai Koduttha Dheivam 1964 Tamil"
- Try actor name: "Sivaji Ganesan Kai Koduttha Dheivam"
- Search Wikipedia for Tamil title

### For Old Telugu Films:
- Try alternate spellings: "Sri Krishna Pandaviyam" vs "Srikrishna Pandaviyam"
- Add "Telugu film" to search
- Search actor filmography on Wikipedia

### For Chiranjeevi Films:
- Search "Chiranjeevi filmography"
- Find the year
- Click through to individual film page

---

## ⚡ Speed Run Method

If you want to do this FAST (30 minutes for all 25):

1. **Use estimated ratings** (don't research each one):
   - Star heroes (Phase 2): 7.5
   - Chiranjeevi: 7.2
   - Tamil classics: 7.8
   - Telugu classics: 7.5

2. **Skip posters initially** (focus on ratings first)
   - Publish with ratings only
   - Add posters later

3. **Run the script**:
```bash
npx tsx scripts/apply-manual-fixes.ts --execute
npx tsx scripts/publish-44-validated-movies.ts --execute
```

---

## 📊 Expected Results

After filling in the CSV and running the script:

| Scenario | Movies Ready to Publish |
|----------|-------------------------|
| All 25 filled (poster + rating) | 25 (100%) |
| Only ratings filled | 0 (need posters too) |
| Star heroes only (5) | 5 (20%) |
| Top 8 (stars + Chiranjeevi) | 8 (32%) |

---

## 🚨 Common Issues

### Issue 1: Poster URL doesn't work
**Solution:** Test URL in browser first. If it loads an image, it's good.

### Issue 2: CSV parsing error
**Solution:** Make sure no commas in the Notes field. Use semicolons instead.

### Issue 3: Rating validation error
**Solution:** Ratings must be 0-10, use decimal format (7.5 not 7,5).

### Issue 4: Movie not found
**Solution:** Check the ID matches exactly from the template.

---

## 📦 Files Involved

1. **`manual-fix-template.csv`** - Fill this in
2. **`scripts/apply-manual-fixes.ts`** - Script to apply
3. **`scripts/publish-44-validated-movies.ts`** - Script to publish

---

## ✅ Verification

After applying fixes, verify:

```bash
# Check how many movies now have posters and ratings
npx tsx scripts/publish-44-validated-movies.ts
```

This will show you which movies are ready to publish.

---

## 🎯 Final Steps

1. **Fill CSV** with poster URLs and ratings (20-60 minutes)
2. **Preview changes**: `npx tsx scripts/apply-manual-fixes.ts`
3. **Apply fixes**: `npx tsx scripts/apply-manual-fixes.ts --execute`
4. **Verify results**: `npx tsx scripts/publish-44-validated-movies.ts`
5. **Publish**: `npx tsx scripts/publish-44-validated-movies.ts --execute`

---

## 💪 You've Got This!

**Minimum Time:** 20 minutes (just star heroes)  
**Maximum Time:** 2 hours (all 25 movies)  
**Recommended:** Start with top 8, publish, then do rest later

**Ready?** Open `manual-fix-template.csv` and start filling it in!

---

**Status:** ⏳ **AWAITING MANUAL DATA ENTRY**  
**Next:** Fill in manual-fix-template.csv with poster URLs and ratings
