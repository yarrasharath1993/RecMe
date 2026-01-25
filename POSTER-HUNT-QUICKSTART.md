# Poster Hunt - Quick Start 🚀
**Target:** 20 movies  
**Time:** 30 min - 3 hours (your choice)  
**Impact:** Publish up to 20 more movies!

---

## ⚡ **3-STEP PROCESS:**

### **Step 1: Find Posters** (Main work)
1. Open: `poster-hunt-ready.csv`
2. For each movie, search Google/IMDb/Wikipedia
3. Copy poster image URL
4. Paste into `New_Poster_URL` column
5. Save file

### **Step 2: Apply Posters** (1 command)
```bash
cd /Users/sharathchandra/Projects/telugu-portal
npx tsx scripts/apply-manual-fixes.ts poster-hunt-ready.csv --execute
```

### **Step 3: Publish** (1 command)
```bash
npx tsx scripts/publish-44-validated-movies.ts --execute
```

**Done!** Your movies are live! 🎉

---

## 🎯 **PRIORITIZE:**

### **HIGH PRIORITY (6 movies - 30 min)** ⭐
**Biggest impact - Do these first!**

1. **Chennakeshava Reddy (2002)** - Balakrishna
   - Google: `Chennakesava Reddy 2002 Balakrishna poster`
   
2. **Chaithanya (1991)** - Nagarjuna
   - Google: `Chaitanya 1991 Nagarjuna poster`
   
3. **Nizhal Thedum Nenjangal (1982)** - Rajinikanth
   - Google: `Nizhalgal 1980 Rajinikanth poster Tamil`
   
4. **Aaj Ka Goonda Raj (1992)** - Chiranjeevi
   - Google: `Aaj Ka Goonda Raj 1992 Chiranjeevi poster`
   
5. **Sri Rambantu (1979)** - Chiranjeevi
   - Google: `Sri Rambantu 1979 Chiranjeevi poster`
   
6. **Well, If You Know Me (2015)** - Venkatesh
   - Google: `Yennai Arindhaal 2015 Ajith poster` (Tamil original)

---

## 📋 **SEARCH TIPS:**

### **Google Images (Easiest):**
1. Search: `[Movie Name] [Year] [Actor] poster`
2. Click Tools → Size → Large
3. Right-click image → Copy Image Address
4. Paste into CSV

### **IMDb (Most Reliable):**
1. Go to: `imdb.com`
2. Search movie name + year
3. Click Photos tab
4. Right-click poster → Copy Image Address

### **Wikipedia:**
1. Search: `[Movie Name] [Year] film wikipedia`
2. Look for poster in info box
3. Right-click → Copy Image Address

---

## ✅ **GOOD POSTER URLS:**

✅ `https://image.tmdb.org/t/p/w500/abc123.jpg`  
✅ `https://upload.wikimedia.org/wikipedia/en/...`  
✅ `https://m.media-amazon.com/images/...`

❌ Google search result pages  
❌ Pinterest links  
❌ Social media previews

---

## 💪 **MILESTONES:**

- **5 found:** Good start! 25%
- **10 found:** Halfway there! 50%
- **15 found:** Almost done! 75%
- **20 found:** COMPLETE! 100% 🎉

---

## 🎊 **EXPECTED RESULTS:**

| Posters Found | Movies Published | Total Published |
|---------------|------------------|-----------------|
| **6 (HIGH)** | 6 star heroes | 13 total |
| **14 (HIGH+MED)** | 14 classics | 21 total |
| **20 (ALL)** | All 20 movies | 27 total |

---

## 📁 **FILES:**

- **`poster-hunt-ready.csv`** ← Fill this in
- **`POSTER-HUNT-GUIDE-2026-01-15.md`** ← Detailed guide
- **`scripts/apply-manual-fixes.ts`** ← Apply script

---

## 🚀 **READY?**

1. ✅ Open `poster-hunt-ready.csv`
2. ✅ Start with HIGH PRIORITY (6 movies)
3. ✅ Search Google for each one
4. ✅ Paste poster URLs
5. ✅ Run apply script
6. ✅ Publish!

**Let's go!** 💪
