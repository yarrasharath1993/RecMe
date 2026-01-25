# Duplicate Movie Merge Plan

**Generated**: 2026-01-12  
**Total Duplicate Pairs**: 28  
**Merge Strategy**: Data quality scoring + reference preservation

---

## 🎯 Merge Strategy

The merge script uses **intelligent data quality scoring** to decide which entry to keep:

### Scoring System (0-200 points):
- **Critical fields** (20 pts each): title_en, slug, release_year
- **High priority** (10 pts each): title_te, director, hero/heroine, genres
- **Medium priority** (5 pts each): runtime, poster, synopsis, language, external IDs
- **User engagement** (1 pt each): reviews, ratings

### Decision Logic:
1. **Highest score wins** → Better data quality
2. **Tie-breaker**: Most reviews/ratings
3. **Final tie**: Keep first entry (arbitrary but consistent)

---

## ✅ High Confidence Merges (100% Match)

### 1. Arjun S/O Vyjayanthi (2025)
- **Keep**: `8aaa133c...` (Score: 115)
- **Delete**: `6e1c52a0...` (Score: 115)
- **Reason**: Exact title match, equal quality

### 2. Bāhubali: The Epic (2025)
- **Keep**: `10ba590f...` (Score: 115)
- **Delete**: `8da290f9...` (Score: 110)
- **Reason**: Movie 1 has better data (higher score)

### 3. The Family Star (2024)
- **Keep**: `436d75ab...` (Score: 120) ✨
- **Delete**: `13d107f1...` (Score: 110)
- **Reason**: Movie 2 has more complete data

### 4. RRR: Behind & Beyond (2024)
- **Keep**: `c6aa0c78...` (Score: 120) ✨
- **Delete**: `388b05da...` (Score: 110)
- **Reason**: Movie 1 has better data quality

### 5. 10th Class Diaries (2022)
- **Keep**: `9e61ecf7...` (Score: 115) ✨
- **Delete**: `b677919a...` (Score: 105)
- **Reason**: Movie 2 has more complete data

---

## 🎬 TMDB ID Matches (98% Confidence)

### 2026 Releases

#### Fauji (2026) - Shah Rukh Khan
- **Keep**: `1250a707...` (Score: 120) ✨
- **Delete**: `5ac3e442...` "Fauzi" (Score: 90)
- **Reason**: Correct spelling + complete data
- **Note**: Also merging `ec935cb7...` "Fauzi" (2026)

#### Dragon (2026) - Final Title
- **Keep**: `16903466...` (Score: 120) ✨
- **Delete**: `dad25d47...` "NTR Neel" (Score: 90)
- **Reason**: Final title vs working title

#### The Raja Saab (2026)
- **Keep**: `3500c2bf...` (Score: 120) ✨
- **Delete**: `565a96a9...` "The Rajasaab" (Score: 110)
- **Reason**: Preferred spelling variant

### 2025 Releases

#### Bāhubali: The Epic (Multiple Variants)
- **Primary**: `10ba590f...` (keeping based on first merge)
- **Also merging**: `dd38c3da...` "Baahubali" (Score: 120 ✨)
- **Note**: Will consolidate to highest quality entry

#### The King of Kings → Andhra King Taluka
- **Keep**: `2d747ddf...` "Andhra King Taluka" (Score: 120) ✨
- **Delete**: `d79b6116...` "The King of Kings" (Score: 110)
- **Reason**: More complete data

#### Anaganaga Australia Lo
- **Keep**: `0e7dd87c...` "Anaganaga" (Score: 120)
- **Delete**: `feb72380...` "Anaganaga Australia Lo" (Score: 120)
- **Reason**: Shorter title (both equal quality)

#### Chaurya Paatam (Spelling)
- **Keep**: `a7aa9ae5...` "Chaurya Paatam" (Score: 120) ✨
- **Delete**: `4ac2b5ff...` "Chaurya Paatham" (Score: 115)
- **Reason**: Better data quality

#### Arjun S/O Vyjayanthi (Multiple Variants)
- **Keep**: `df62cba3...` "Arjun Son of Vyjayanthi" (Score: 115)
- **Also delete**: 
  - `8aaa133c...` "Arjun S/O Vyjayanthi"
  - `6e1c52a0...` "Arjun S/o Vyjayanthi"
- **Note**: Multiple spelling variants

---

## 📊 Merge Impact Summary

### By Score Range:
- **120 points (Excellent)**: 15 entries
- **115 points (Good)**: 8 entries
- **110 points (Fair)**: 6 entries
- **90-105 points (Incomplete)**: 5 entries

### Expected Outcomes:
- **Total merges**: 28 pairs → 28 movies consolidated
- **Database reduction**: ~28 duplicate entries removed
- **References updated**: Reviews, ratings, and other links preserved
- **Data quality**: Best data from both entries will be kept

---

## 🔄 Merge Process

### Phase 1: Data Consolidation
For each pair:
1. Fetch both movie records
2. Score both based on data quality
3. Select winner (higher score)
4. Merge best fields from both into winner

### Phase 2: Reference Updates
Update all database references:
- `movie_reviews.movie_id` → Point to kept movie
- `user_ratings.movie_id` → Point to kept movie
- Any other foreign keys → Updated automatically

### Phase 3: Cleanup
- Delete the duplicate entry
- Log merge operation for audit trail

---

## 🛡️ Safety Features

1. **Dry-run mode**: Preview changes before execution
2. **Data preservation**: Best data from both entries is kept
3. **Reference integrity**: All reviews/ratings are preserved
4. **Audit trail**: Complete log of all merges
5. **Rollback support**: Logs allow manual rollback if needed

---

## 🚀 Execution Commands

### Dry Run (Preview Only)
```bash
npx tsx scripts/merge-duplicate-movies.ts --input=docs/audit-reports/exact-duplicates.csv
```

### Execute All Merges
```bash
npx tsx scripts/merge-duplicate-movies.ts --input=docs/audit-reports/exact-duplicates.csv --execute
```

### Single Pair Merge (Testing)
```bash
npx tsx scripts/merge-duplicate-movies.ts --pair=uuid1,uuid2 --execute
```

---

## ⚠️ Important Notes

1. **Backup recommended**: Although the script is safe, consider a DB backup before running
2. **Review dry-run output**: Check the decisions before executing
3. **One-way operation**: Merges cannot be automatically undone
4. **Audit trail**: Check `merge-log-{timestamp}.json` after execution

---

## 📈 Expected Results

After execution:
- ✅ **28 duplicate movies removed**
- ✅ **All reviews and ratings preserved**
- ✅ **Database integrity maintained**
- ✅ **Best data quality retained**
- ✅ **Complete audit trail generated**

---

**Status**: Ready for execution  
**Recommendation**: ✅ Proceed with merges  
**Estimated time**: ~2-3 minutes
