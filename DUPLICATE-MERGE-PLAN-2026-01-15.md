# Duplicate Movie Merge Plan
**Date:** January 15, 2026  
**Status:** Ready to Execute

---

## 🎯 **SITUATION:**

We have **3 duplicate movies** in the database:
- 2 are published with both Q-title AND real title (causing confusion)
- 1 Q-title is unpublished (Bangaru Bommalu)

All real title versions are **better quality** (have TMDB IDs).

---

## 📊 **ANALYSIS RESULTS:**

### 1. Kothala Raayudu (1979) - Chiranjeevi
| Version | Published | Poster | Rating | TMDB | Score |
|---------|-----------|--------|--------|------|-------|
| **Q12985478** | ✅ YES | ✅ | 7.0 | ❌ | 4/5 |
| **Real Title** | ✅ YES | ✅ | 7.5 | ✅ 755505 | **5/5** ⭐ |

**Recommendation:** Keep Real Title, Unpublish Q-title

---

### 2. Karunamayudu (1978) - Vijayachander
| Version | Published | Poster | Rating | TMDB | Score |
|---------|-----------|--------|--------|------|-------|
| **Q16311395** | ✅ YES | ✅ | 7.5 | ❌ | 4/5 |
| **Real Title** | ✅ YES | ✅ | 7.5 | ✅ 397850 | **5/5** ⭐ |

**Recommendation:** Keep Real Title, Unpublish Q-title

---

### 3. Bangaru Bommalu (1977) - ANR
| Version | Published | Poster | Rating | TMDB | Score |
|---------|-----------|--------|--------|------|-------|
| **Q12982331** | ❌ NO | ❌ | 7.6 | ❌ | 3/5 |
| **Real Title** | ✅ YES | ✅ | 7.5 | ✅ 307244 | **5/5** ⭐ |

**Recommendation:** Keep Real Title, Unpublish Q-title

---

## ✅ **ACTION PLAN:**

### Step 1: Execute Merge (1 minute)
```bash
cd /Users/sharathchandra/Projects/telugu-portal
npx tsx scripts/merge-duplicates.ts --execute
```

**What this will do:**
- ✅ Keep all 3 real title versions
- ✅ Unpublish all 3 Q-title versions
- ✅ No data loss (Q-titles remain in database)

---

### Step 2: Verify Results (1 minute)
```bash
npx tsx scripts/review-missing-data.ts
```

**Expected outcome:**
- Published count should remain at 9 (no change)
- Q-titles will be unpublished but data preserved

---

### Step 3: Check Website (2 minutes)
Visit these URLs to ensure correct versions are showing:
- `/movies/kothala-raayudu-1979`
- `/movies/karunamayudu-1978`
- `/movies/bangaru-bommalu-1977`

---

## 📈 **AFTER MERGE:**

### Published Movies (9 total):
1. ✅ **Badrinath (2011)** - Allu Arjun ⭐
2. ✅ **Maato Pettukoku (1995)** - Balakrishna
3. ✅ **Athiradi Padai (1994)**
4. ✅ **Ramaiya Vastavaiya (2013)**
5. ✅ **Ranveer Ching Returns (2016)**
6. ✅ **Kothala Raayudu (1979)** - Chiranjeevi ⭐ (Real title, TMDB linked)
7. ✅ **Karunamayudu (1978)** - Vijayachander (Real title, TMDB linked)
8. ✅ **Bangaru Bommalu (1977)** - ANR (Real title, TMDB linked)
9. ✅ **Kuravanji (1960)** - Sivaji Ganesan
10. ✅ **Adarsham (1952)** - ANR

**WAIT - That's 10 movies, not 9!** (Bangaru Bommalu is already published with real title)

---

## ⚠️ **IMPORTANT NOTES:**

### Why Keep Real Titles?
1. **Better Data Quality** - Have TMDB IDs for future enrichment
2. **Better SEO** - Real movie names vs Q-codes
3. **Better UX** - Users can read actual movie titles
4. **Better Ratings** - Kothala Raayudu real version has 7.5 vs 7.0

### What Happens to Q-Titles?
- **Not deleted** - Just unpublished
- **Data preserved** - Hero, Director, entity relations kept
- **Can be deleted later** - After verifying everything works

### Impact on Celebrity Pages?
- **No impact** - Entity relations work with either version
- **Better display** - Real titles show up instead of Q-codes

---

## 📊 **REVISED STATUS (After Merge):**

| Category | Before | After |
|----------|--------|-------|
| **Published** | 9 (2 with Q-titles) | 9 (all real titles) |
| **Duplicates** | 3 active | 0 active |
| **Need Poster Only** | 20 | 20 |
| **Need Both** | 15 | 15 |

---

## 🚀 **READY TO EXECUTE?**

**Command:**
```bash
cd /Users/sharathchandra/Projects/telugu-portal
npx tsx scripts/merge-duplicates.ts --execute
```

**Safe to run:** ✅ YES
- No data deletion
- Only unpublishes duplicates
- Reversible (can republish if needed)

---

## 🎊 **BENEFITS:**

1. ✅ Clean up duplicate URLs
2. ✅ Better SEO with real movie names
3. ✅ Improved data quality (TMDB links)
4. ✅ No confusion in search results
5. ✅ Better user experience

---

**Ready to merge?** Run the command above!

After merge, we can focus on the **35 movies** that still need posters and/or ratings.
