# Database Integrity Audit Summary

**Generated**: 2026-01-12T21:44:18.596Z  
**Total Movies Checked**: 1000

---

## 🔍 DUPLICATE DETECTION

### Exact Duplicates: **6**
- Same title + year: High priority for merge
- Same slug: Immediate merge recommended
- Same TMDB/IMDb ID: Verify and merge


**Top 10 Exact Duplicates:**
1. "Fauji" (2026) vs "Fauzi" (2026) - same_tmdb_id
2. "Akhanda 2: Thaandavam" (2025) vs "Akhanda 2" (2025) - same_tmdb_id
3. "Chaurya Paatham" (2025) vs "Chaurya Paatam" (2025) - same_tmdb_id
4. "The King of Kings" (2025) vs "Andhra King Taluka" (2025) - same_tmdb_id
5. "Like, Share & Subscribe" (2022) vs "Like Share & Subscribe" (2022) - same_tmdb_id
6. "F3: Fun and Frustration" (2022) vs "F3" (2022) - same_tmdb_id


### Fuzzy Duplicates: **42**
- Likely transliteration variants, typos, or subtitle additions
- Manual review recommended

---

## 🚨 SUSPICIOUS ENTRIES

### Missing Fields: **674**
- Critical: 55
- High: 2
- Medium: 617

### Unusual Patterns: **1**
- Award ceremonies: 0
- TV shows: 1
- Documentaries: 0
- Other non-movies: 0

### Data Inconsistencies: **863**

### Statistical Outliers: **27**

---

## 👥 ATTRIBUTION VALIDATION

### Cast Mismatches: **3**
- Wrong gender: 0
- Impossible pairings: 3
- Deceased actors: 0

---

## ⏰ TIMELINE VALIDATION

### Timeline Issues: **0**
- Before debut: 0
- After death: 0
- Impossible age: 0

---

## 📊 SUMMARY STATISTICS

| Category | Issues Found | Severity Breakdown |
|----------|--------------|-------------------|
| Exact Duplicates | 6 | Critical: 6 |
| Fuzzy Duplicates | 42 | Review: 42 |
| Suspicious Entries | 1538 | Critical: 1, High: 57 |
| Cast Attribution | 3 | High: 3 |
| Timeline Issues | 0 | High: 0 |

**Total Issues Found**: 1616

---

## 📁 GENERATED FILES

- `exact-duplicates.csv` - 6 exact duplicates
- `fuzzy-duplicates.csv` - 42 fuzzy duplicates
- `suspicious-entries.csv` - 1538 suspicious entries
- `wrong-cast-attribution.csv` - 3 cast issues
- `timeline-issues.csv` - 0 timeline issues
- `statistical-outliers.csv` - 27 outliers

---

## 🎯 RECOMMENDED ACTIONS

### High Priority (Immediate Action)
1. **Delete Award Ceremonies**: 0 entries
2. **Merge Exact Duplicates**: 6 pairs
3. **Fix Gender Mismatches**: 0 issues
4. **Investigate Timeline Issues**: 0 high severity issues

### Medium Priority (Review & Fix)
1. **Review Fuzzy Duplicates**: 42 potential duplicates
2. **Enrich Missing Data**: 674 movies with missing fields
3. **Fix Data Inconsistencies**: 863 issues

### Low Priority (Optional)
1. **Review Statistical Outliers**: 27 outliers
2. **Age-related Timeline Issues**: 0 low severity

---

**Audit Complete!** ✅
