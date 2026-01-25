# ✅ Manual Fix System - Ready to Use
**Date:** January 15, 2026  
**Status:** All Tools Created | 3 Options Available

---

## 🎯 Choose Your Path

### **OPTION 1: Super Quick (5 minutes)** ⚡ FASTEST
Add estimated ratings to all 25 movies immediately.

```bash
cd /Users/sharathchandra/Projects/telugu-portal

# Preview ratings
npx tsx scripts/quick-add-ratings.ts

# Apply ratings
npx tsx scripts/quick-add-ratings.ts --execute

# Check results & publish
npx tsx scripts/publish-44-validated-movies.ts --execute
```

**Result:** 25 movies with ratings (but no posters yet)  
**Time:** 5 minutes  
**Limitation:** Won't publish without posters

---

### **OPTION 2: Manual Entry (20-120 minutes)** 🎨 BEST QUALITY
Fill in the CSV with real poster URLs and ratings.

```bash
# 1. Open the CSV template
open manual-fix-template.csv

# 2. Fill in New_Poster_URL and New_Rating columns
#    (See MANUAL-FIX-GUIDE-2026-01-15.md for details)

# 3. Preview changes
npx tsx scripts/apply-manual-fixes.ts

# 4. Apply changes
npx tsx scripts/apply-manual-fixes.ts --execute

# 5. Publish
npx tsx scripts/publish-44-validated-movies.ts --execute
```

**Result:** 25 movies with real posters and ratings  
**Time:** 20 minutes (top 8) to 2 hours (all 25)  
**Best for:** High-quality data

---

### **OPTION 3: Hybrid (10-30 minutes)** 🚀 RECOMMENDED
Quick ratings now, add posters later.

```bash
# 1. Add estimated ratings (5 minutes)
npx tsx scripts/quick-add-ratings.ts --execute

# 2. Manually add posters for top 5 star heroes
#    Edit manual-fix-template.csv - only fill poster URLs
#    for Badrinath, Chennakeshava Reddy, etc.

# 3. Apply poster fixes
npx tsx scripts/apply-manual-fixes.ts --execute

# 4. Publish movies with both poster + rating
npx tsx scripts/publish-44-validated-movies.ts --execute
```

**Result:** Top 5-8 movies fully ready, rest have ratings  
**Time:** 10-30 minutes  
**Best for:** Quick wins + incremental improvement

---

## 📊 What's Available

### Created Files:
1. ✅ **`manual-fix-template.csv`**
   - Template with all 25 movies
   - Fill in poster URLs and ratings

2. ✅ **`scripts/apply-manual-fixes.ts`**
   - Reads CSV and applies fixes
   - Supports dry run mode

3. ✅ **`scripts/quick-add-ratings.ts`**
   - Instantly adds estimated ratings
   - Based on film era and stars

4. ✅ **`MANUAL-FIX-GUIDE-2026-01-15.md`**
   - Complete guide
   - Search tips, rating guidelines

5. ✅ **`scripts/publish-44-validated-movies.ts`**
   - Checks which movies are ready
   - Publishes movies with poster + rating

---

## 🎯 Estimated Ratings (Option 1)

The quick-add script uses these ratings:

| Category | Rating | Movies |
|----------|--------|--------|
| **Sivaji Ganesan Masterpieces** | 8.0-8.2 | Paarthaal Pasi Theerum |
| **NTR Mythologicals** | 8.0-8.1 | Krishna Pandaviyam, Krishnavataram |
| **Rajinikanth Tamil** | 8.0 | Nizhal Thedum Nenjangal |
| **Tamil Classics** | 7.7-7.9 | Sivaji, Gemini Ganesan films |
| **Telugu Classics** | 7.5-7.8 | ANR, Sobhan Babu films |
| **Star Heroes Modern** | 7.4-7.5 | Allu Arjun, Nagarjuna, Balakrishna |
| **Chiranjeevi Early** | 7.0-7.4 | First films, popular films |

---

## 💡 Recommendations

### For SPEED (5 minutes):
```bash
npx tsx scripts/quick-add-ratings.ts --execute
```
Then work on posters incrementally.

### For QUALITY (2 hours):
Fill in `manual-fix-template.csv` completely, then:
```bash
npx tsx scripts/apply-manual-fixes.ts --execute
npx tsx scripts/publish-44-validated-movies.ts --execute
```

### For BALANCE (30 minutes):
1. Quick-add ratings (5 min)
2. Manually find posters for top 8 movies (20 min)
3. Apply & publish (5 min)

---

## 🔍 Quick Search Guide

### Badrinath (2011) - Allu Arjun
**IMDb:** https://www.imdb.com/find?q=Badrinath+2011+Telugu

### Chennakeshava Reddy (2002) - Balakrishna
**Search:** "Chennakesava Reddy 2002"

### NTR Mythologicals:
**Wikipedia:** Search actor filmography → Find year

### Tamil Films:
**Add "Tamil":** "Paarthaal Pasi Theerum 1962 Tamil"

---

## ✅ Verification Commands

```bash
# Check current status
npx tsx scripts/publish-44-validated-movies.ts

# Check how many have ratings
echo "SELECT COUNT(*) FROM movies WHERE our_rating IS NOT NULL AND id IN (...)" | psql

# Check how many have posters
echo "SELECT COUNT(*) FROM movies WHERE poster_url IS NOT NULL AND id IN (...)" | psql
```

---

## 🚀 Quick Start (Right Now!)

**If you want results in 5 minutes:**

```bash
cd /Users/sharathchandra/Projects/telugu-portal
npx tsx scripts/quick-add-ratings.ts --execute
echo "✅ Ratings added! Now work on posters incrementally."
```

**If you want to do it properly (30 min):**

```bash
# 1. Quick ratings
npx tsx scripts/quick-add-ratings.ts --execute

# 2. Open CSV
open manual-fix-template.csv

# 3. Fill in poster URLs for top 8 movies:
#    - Badrinath, Chennakeshava Reddy, Chaithanya, Nizhal Thedum Nenjangal
#    - Well If You Know Me, Kothala Raayudu, Sri Rambantu, Aaj Ka Goonda Raj

# 4. Apply
npx tsx scripts/apply-manual-fixes.ts --execute

# 5. Publish
npx tsx scripts/publish-44-validated-movies.ts --execute
```

---

## 📦 All Files Summary

| File | Purpose | When to Use |
|------|---------|-------------|
| `manual-fix-template.csv` | Data entry | Fill with posters/ratings |
| `scripts/apply-manual-fixes.ts` | Apply CSV data | After filling CSV |
| `scripts/quick-add-ratings.ts` | Quick estimated ratings | For instant results |
| `scripts/publish-44-validated-movies.ts` | Check & publish | After fixes applied |
| `MANUAL-FIX-GUIDE-2026-01-15.md` | Detailed guide | Reference |

---

## 🎊 Success Metrics

After Option 1 (Quick):
- ✅ 25 movies have ratings
- ⏳ 0 movies ready to publish (need posters)

After Option 2 (Manual Full):
- ✅ 25 movies have posters
- ✅ 25 movies have ratings
- ✅ 25 movies ready to publish

After Option 3 (Hybrid):
- ✅ 25 movies have ratings
- ✅ 5-8 movies have posters
- ✅ 5-8 movies ready to publish

---

**Current Status:** ✅ **ALL TOOLS READY**  
**Next Action:** Choose Option 1, 2, or 3 and execute  
**Recommended:** Option 3 (Hybrid) for best balance
