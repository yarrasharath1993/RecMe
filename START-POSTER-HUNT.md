# 🚀 START POSTER HUNT - 19 MOVIES
**Ready to Fill In:** `POSTER-HUNT-19-MOVIES.csv`

---

## ⚡ **3 SIMPLE STEPS:**

### **STEP 1: Open CSV** (1 second)
```bash
open POSTER-HUNT-19-MOVIES.csv
```

### **STEP 2: Fill Poster URLs** (30 min - 2 hours)
For each movie:
1. Copy the search term from "Notes" column
2. Paste into Google Images
3. Find poster, right-click → Copy Image Address
4. Paste URL into `New_Poster_URL` column

### **STEP 3: Apply & Publish** (2 commands)
```bash
# Apply posters
npx tsx scripts/apply-manual-fixes.ts POSTER-HUNT-19-MOVIES.csv --execute

# Publish movies
npx tsx scripts/publish-44-validated-movies.ts --execute
```

**DONE!** 🎉

---

## 🎯 **START WITH HIGH PRIORITY (5 movies - 25 min):**

### **1. Chennakeshava Reddy (2002) - Balakrishna** ⭐
**Search:** `Chennakesava Reddy 2002 Balakrishna poster`

**Where to look:**
- Google Images (easiest)
- IMDb: https://www.imdb.com/find?q=Chennakesava+Reddy+2002
- TMDB: https://www.themoviedb.org/search?query=Chennakesava+Reddy

---

### **2. Chaitanya (1991) - Nagarjuna** ⭐
**Search:** `Chaitanya 1991 Nagarjuna Telugu poster`

**Tips:**
- Try both spellings: "Chaitanya" and "Chaithanya"
- Add "Nagarjuna filmography" if direct search fails

---

### **3. Aaj Ka Goonda Raj (1992) - Chiranjeevi** ⭐
**Search:** `Aaj Ka Goonda Raj 1992 Chiranjeevi poster`

**Note:** Hindi title, poster may be in Devanagari

---

### **4. Sri Rambantu (1979) - Chiranjeevi** ⭐
**Search:** `Sri Rambantu 1979 Chiranjeevi poster`

**Note:** Early Chiranjeevi film

---

### **5. Nizhalgal (1980) - Rajinikanth** ⭐⭐⭐
**Search:** `Nizhalgal 1980 Rajinikanth poster Tamil`

**Note:** Tamil classic, VERIFIED year is 1980 (not 1982!)

---

## 📝 **HOW TO FILL CSV:**

### **Example:**

**Before:**
```csv
092508fb...,Chennakeshava Reddy,2002,Balakrishna,...,NULL,7.8,,,
```

**After:**
```csv
092508fb...,Chennakeshava Reddy,2002,Balakrishna,...,NULL,7.8,https://image.tmdb.org/t/p/w500/abc123.jpg,,
```

---

## 💡 **QUICK TIPS:**

### **Google Images:**
1. Search movie name + year + actor + "poster"
2. Click "Tools" → "Size" → "Large"
3. Right-click image → "Copy Image Address"
4. Paste into CSV

### **Good URLs:**
✅ `https://image.tmdb.org/t/p/w500/...`  
✅ `https://upload.wikimedia.org/...`  
✅ `https://m.media-amazon.com/...`

### **Bad URLs:**
❌ Google search result pages  
❌ Pinterest links  
❌ Social media embeds

---

## 📊 **PRIORITY LEVELS:**

| Priority | Count | Time | Start Here? |
|----------|-------|------|-------------|
| **HIGH** | 5 | 25 min | ✅ **YES - START HERE** |
| **MEDIUM** | 8 | 1 hour | After HIGH |
| **LOW** | 6 | 1 hour | Last (optional) |

---

## 🎊 **MILESTONES:**

- **5 found (HIGH):** 🎉 Publish 5 star heroes!
- **10 found:** 🎊 Halfway there!
- **15 found:** 🏆 Almost complete!
- **19 found:** 🎯 ALL DONE!

---

## 🚀 **COMMANDS READY TO USE:**

```bash
# 1. Open CSV
open POSTER-HUNT-19-MOVIES.csv

# 2. After filling, preview changes
npx tsx scripts/apply-manual-fixes.ts POSTER-HUNT-19-MOVIES.csv

# 3. Apply posters
npx tsx scripts/apply-manual-fixes.ts POSTER-HUNT-19-MOVIES.csv --execute

# 4. Publish movies
npx tsx scripts/publish-44-validated-movies.ts --execute

# 5. Verify results
npx tsx scripts/review-missing-data.ts
```

---

## 📈 **EXPECTED RESULTS:**

### **If you find 5 (HIGH):**
- ✅ 5 star hero movies published
- ✅ 12 total published (7 current + 5 new)
- ✅ **Major traffic boost!**

### **If you find 13 (HIGH + MEDIUM):**
- ✅ 13 classics published
- ✅ 20 total published
- ✅ **45% of all 44 movies!**

### **If you find all 19:**
- ✅ 19 movies published
- ✅ 26 total published (7 current + 19 new)
- ✅ **59% complete!** 🏆

---

## ⏱️ **TIME COMMITMENT:**

- **Quick Win (5 movies):** 25-30 minutes
- **Good Progress (13 movies):** 1.5 hours
- **Complete (19 movies):** 2-3 hours

**Start small, build momentum!**

---

## ✅ **READY?**

```bash
cd /Users/sharathchandra/Projects/telugu-portal
open POSTER-HUNT-19-MOVIES.csv
```

**Start with row 1: Chennakeshava Reddy!** 💪

---

**Questions?** Check `POSTER-HUNT-GUIDE-2026-01-15.md` for detailed help.

**Let's go!** 🚀
