# 159 Movies with TMDB IDs - Auto-Enrichable

**Status:** ✅ Ready for automatic genre enrichment from TMDB

---

## 📊 **Summary**

```
Total Movies:           159
- Have Director:        123 (77%)
- Have Hero:            126 (79%)
- Have Heroine:         109 (69%)

All 159 movies have valid TMDB IDs and can be automatically enriched!
```

---

## 🎯 **Distribution by Decade**

| Decade | Count | Percentage |
|--------|-------|------------|
| 2020s  | 2     | 1%         |
| 2010s  | 30    | 19%        |
| 2000s  | 27    | 17%        |
| 1990s  | 29    | 18%        |
| 1980s  | 36    | 23%        |
| 1970s  | 16    | 10%        |
| 1960s  | 9     | 6%         |
| 1950s  | 10    | 6%         |

**Peak Era:** 1980s (36 movies - 23%)

---

## 🚀 **How to Auto-Enrich**

### Option 1: Use Existing TMDB Enrichment Script
```bash
npx tsx scripts/enrich-movies-tmdb-turbo.ts
```

### Option 2: Use Genre-Specific Script (if exists)
```bash
npx tsx scripts/enrich-genres-from-tmdb.ts --execute
```

### Option 3: Batch Process with Master Enricher
```bash
npx tsx scripts/enrich-master.ts --phase=genres-direct --fast --execute
```

---

## 📋 **Sample Movies (First 20)**

1. **Bomma Adirindi Dimma Tirigindi** (2021) - TMDB: 823441
2. **Family - A Made at Home Short Film** (2020) - TMDB: 1129970
3. **2 Hours Love** (2019) - TMDB: 631934
4. **Nanne Preethse: I Love You** (2019) - TMDB: 628368
5. **Kavacha** (2019) - TMDB: 590906
6. **Police officer** (2019) - TMDB: 749574
7. **Premier Padmini** (2019) - TMDB: 658152
8. **Ammachi Yemba Nenapu** (2018) - TMDB: 586119
9. **Operation 2019** (2018) - TMDB: 791058
10. **Aatwaja** (2018) - TMDB: 1017859
11. **Anaganaga Oka Durga** (2017) - TMDB: 485855
12. **Shuddhi** (2017) - TMDB: 453419
13. **Vennello Hai Hai** (2016) - TMDB: 401902
14. **Ethiri En 3** (2016) - TMDB: 280880
15. **Shivalinga** (2016) - TMDB: 414206
16. **Ranna** (2015) - TMDB: 417878
17. **Yavvanam Oka Fantasy** (2015) - TMDB: 526288
18. **Exploring ''Shiva'' Movie After 25 Years** (2014) - TMDB: 1328515
19. **Ambareesha** (2014) - TMDB: 465027
20. **Sri Vasavi Vaibhavam** (2013) - TMDB: 313294

... and 139 more movies

---

## 📁 **Full List**

See complete list with URLs in:
- `AUTO-ENRICHABLE-MOVIES.txt` (682 lines, organized by decade)

---

## ✅ **Next Steps**

1. **Recommended:** Run turbo enrichment script
   ```bash
   npx tsx scripts/enrich-movies-tmdb-turbo.ts
   ```

2. **Expected Result:** All 159 movies will get genres from TMDB

3. **Remaining Work:** After enrichment, only 127 movies without TMDB IDs will need manual genre classification

---

## 📈 **Impact**

```
Before:  286 movies without genres
After:   127 movies without genres (55% reduction!)

This auto-enrichment will reduce manual work by more than half! 🎉
```

---

**Generated:** 2026-01-13  
**Script:** `display-auto-enrichable-movies.ts`  
**Source:** `MOVIES-NEEDING-GENRES.csv`
