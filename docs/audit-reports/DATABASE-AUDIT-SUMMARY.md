# Database Integrity Audit Summary

**Generated**: 2026-01-12T20:05:32.598Z  
**Total Movies Checked**: 1000

---

## 🔍 DUPLICATE DETECTION

### Exact Duplicates: **28**
- Same title + year: High priority for merge
- Same slug: Immediate merge recommended
- Same TMDB/IMDb ID: Verify and merge


**Top 10 Exact Duplicates:**
1. "Arjun S/O Vyjayanthi" (2025) vs "Arjun S/o Vyjayanthi" (2025) - exact_title_year
2. "Bāhubali: The Epic" (2025) vs "Bāhubali: The Epic" (2025) - exact_title_year
3. "The Family Star" (2024) vs "The Family Star" (2024) - exact_title_year
4. "RRR: Behind & Beyond" (2024) vs "RRR: Behind & Beyond" (2024) - exact_title_year
5. "10th Class Diaries" (2022) vs "10th Class Diaries" (2022) - exact_title_year
6. "Fauzi" (null) vs "Fauji" (2026) - same_tmdb_id
7. "NTR Neel" (null) vs "Dragon" (2026) - same_tmdb_id
8. "The Raja Saab" (2026) vs "The Rajasaab" (2026) - same_tmdb_id
9. "Fauzi" (null) vs "Fauzi" (2026) - same_tmdb_id
10. "The King of Kings" (2025) vs "Andhra King Taluka" (2025) - same_tmdb_id


### Fuzzy Duplicates: **0**
- Likely transliteration variants, typos, or subtitle additions
- Manual review recommended

---

## 🚨 SUSPICIOUS ENTRIES

### Missing Fields: **679**
- Critical: 61
- High: 3
- Medium: 615

### Unusual Patterns: **1**
- Award ceremonies: 0
- TV shows: 1
- Documentaries: 0
- Other non-movies: 0

### Data Inconsistencies: **872**

### Statistical Outliers: **27**

---

## 👥 ATTRIBUTION VALIDATION

### Cast Mismatches: **17**
- Wrong gender: 0
- Impossible pairings: 17
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
| Exact Duplicates | 28 | Critical: 28 |
| Fuzzy Duplicates | 0 | Review: 0 |
| Suspicious Entries | 1552 | Critical: 1, High: 64 |
| Cast Attribution | 17 | High: 17 |
| Timeline Issues | 0 | High: 0 |

**Total Issues Found**: 1624

---

## 📁 GENERATED FILES

- `exact-duplicates.csv` - 28 exact duplicates
- `fuzzy-duplicates.csv` - 0 fuzzy duplicates
- `suspicious-entries.csv` - 1552 suspicious entries
- `wrong-cast-attribution.csv` - 17 cast issues
- `timeline-issues.csv` - 0 timeline issues
- `statistical-outliers.csv` - 27 outliers

---

## 🎯 RECOMMENDED ACTIONS

### High Priority (Immediate Action)
1. **Delete Award Ceremonies**: 0 entries
2. **Merge Exact Duplicates**: 28 pairs
3. **Fix Gender Mismatches**: 0 issues
4. **Investigate Timeline Issues**: 0 high severity issues

### Medium Priority (Review & Fix)
1. **Review Fuzzy Duplicates**: 0 potential duplicates
2. **Enrich Missing Data**: 679 movies with missing fields
3. **Fix Data Inconsistencies**: 872 issues

### Low Priority (Optional)
1. **Review Statistical Outliers**: 27 outliers
2. **Age-related Timeline Issues**: 0 low severity

---

**Audit Complete!** ✅
