# Nagarjuna Missing Movies Report

**Date:** January 15, 2026  
**Issue:** 34+ movies missing from database (28 confirmed missing + user mentions 110+ total)

---

## Audit Summary

### Current State

| Category | Count |
|----------|-------|
| Known Filmography | 96 movies (from reference list) |
| **User Claims** | **110+ movies** |
| In Database (Total) | 81 movies |
| In Database (Published) | 76 movies |
| In Database (Unpublished) | 5 movies |
| **Missing from Database** | **28 movies** |
| **Additional Missing (110-96)** | **14+ movies** |

---

## Quick Win: Publish 5 Unpublished Movies

These are **already in the database** but marked `is_published = false`:

1. ✅ **Kirai Dada** (1987) - Telugu
2. ✅ **Geetanjali** (1989) - Telugu - **CLASSIC FILM**
3. ✅ **Govinda Govinda** (1994) - Telugu
4. ✅ **Criminal** (1994/1995) - Telugu

**Action:** Run `npx tsx scripts/publish-nagarjuna-unpublished-movies.ts`

**Impact:** 76 → 81 movies on profile ✅

---

## Missing from Database: 28 Movies

### 1960s - Child Artist (2 movies)

1. **Velugu Needalu** (1961)
   - Role: Baby
   - Language: Telugu

2. **Sudigundalu** (1968)
   - Role: Child artist
   - Language: Telugu

### 1980s (3 movies)

3. **Agni Putrudu** (1987)
   - Role: Kalidaasu
   - Language: Telugu

4. **Vicky Daada** (1989)
   - Role: Vikram
   - Language: Telugu

5. **Agni** (1989)
   - Role: Pavan Kumar
   - Language: Telugu

### 1990s (8 movies)

6. **Khuda Gawah** (1992)
   - Role: Inspector Raja Mirza
   - Language: **Hindi** ⭐
   - Co-star: Amitabh Bachchan

7. **Drohi** (1992)
   - Alternate title of: Antham
   - Language: Telugu
   - Note: Might be duplicate entry

8. **Varasudu** (1993)
   - Role: Vinay
   - Language: Telugu

9. **Angaarey** (1998)
   - Role: Raja Lokhande
   - Language: **Hindi** ⭐

10. **Chandralekha** (1998)
    - Role: Raj Kapoor (Seeta Rama Rao)
    - Language: Telugu

11. **Zakhm** (1998)
    - Role: Raman Desai
    - Language: **Hindi** ⭐
    - **Critical acclaim**

12. **Seetharama Raju** (1999)
    - Role: Ramaraju
    - Language: Telugu

13. **Ravoyi Chandamama** (1999)
    - Role: Sashi
    - Language: Telugu

### 2000s (8 movies)

14. **Nuvvu Vasthavani** (2000)
    - Role: Chinni Krishna
    - Language: Telugu

15. **Ninne Premistha** (2000)
    - Role: Srinivas
    - Language: Telugu

16. **Adhipathi** (2001)
    - Role: Jagan
    - Language: Telugu

17. **Agni Varsha** (2002)
    - Role: Yavakri
    - Language: **Hindi** ⭐

18. **LOC Kargil** (2003)
    - Role: Major Padmapani Acharya
    - Language: **Hindi** ⭐
    - **War epic**

19. **Don** (2007)
    - Role: Suri
    - Language: Telugu

20. **Krishnarjuna** (2008)
    - Role: Lord Krishna / Bangaram
    - Language: Telugu

21. **King** (2008)
    - Triple role: Raja Chandra Pratap Varma, Bottu Seenu, Sarath
    - Language: Telugu

### 2010s (4 movies)

22. **Jagadguru Adi Shankara** (2013)
    - Role: Chandaludu
    - Language: Telugu

23. **Manam** (2014)
    - Dual role: Seetharamudu & Nageswara Rao "Bittu"
    - Language: Telugu
    - **ICONIC FAMILY FILM** ⭐⭐⭐
    - Co-stars: ANR, Naga Chaitanya

24. **Thozha** (2016)
    - Tamil version of Oopiri
    - Role: Vikramaditya
    - Language: **Tamil** ⭐

25. **Devadas** (2018)
    - Role: Deva
    - Language: Telugu
    - Co-star: Nani

### 2020s (3 movies)

26. **Brahmāstra: Part One – Shiva** (2022)
    - Role: Anish Shetty
    - Language: **Hindi** ⭐
    - **Major Bollywood blockbuster**
    - Directed by: Ayan Mukerji

27. **Kuberaa** (2025)
    - Role: Deepak Tej
    - Language: Telugu
    - **Upcoming**

28. **Coolie** (2025)
    - Role: Simon Xavier
    - Language: Telugu/Tamil
    - **Upcoming**
    - Co-star: Rajinikanth

---

## Critical Missing Films

### Must-Add Priority 1 (High Impact)

1. **Manam** (2014) - Iconic family film with ANR
2. **Brahmāstra** (2022) - Recent Bollywood blockbuster
3. **Khuda Gawah** (1992) - With Amitabh Bachchan
4. **LOC Kargil** (2003) - War epic
5. **King** (2008) - Triple role
6. **Devadas** (2018) - With Nani

### Priority 2 (Notable Films)

7. **Zakhm** (1998) - Hindi, critically acclaimed
8. **Agni Varsha** (2002) - Hindi mythology
9. **Jagadguru Adi Shankara** (2013) - Spiritual film
10. **Thozha** (2016) - Tamil version of Oopiri

### Priority 3 (Complete Filmography)

- All 1980s movies (3 films)
- All 1990s movies (remaining)
- All 2000s movies (remaining)
- Child artist movies (2 films)

---

## Language Distribution

### Missing by Language

| Language | Missing Count | Notable Films |
|----------|---------------|---------------|
| **Telugu** | 18 | Manam, King, Devadas |
| **Hindi** | 7 | Brahmāstra, Khuda Gawah, LOC Kargil |
| **Tamil** | 1 | Thozha |
| **Upcoming** | 2 | Kuberaa, Coolie |

**Issue:** Most **Hindi films** are missing!

---

## Additional Missing (110+ claim)

User mentions **110+ movies** but reference list only has 96.  
**Missing 14+ additional movies** not identified yet.

### Possible Sources

1. **Alternate versions:**
   - Oopiri (Telugu) vs Thozha (Tamil) - Counted as 2?
   - Gaganam (Telugu) vs Payanam (Tamil) - Counted as 2?

2. **Special appearances/Cameos:**
   - Movies where Nagarjuna had cameo roles
   - Not listed in main filmography

3. **Unreleased/Shelved:**
   - Movies announced but not released
   - Movies in production

4. **Guest appearances:**
   - Song appearances
   - Special roles

5. **Dubbed versions:**
   - Hindi dubs of Telugu films
   - Tamil dubs counted separately

---

## Action Plan

### Phase 1: Publish Existing (Immediate)

```bash
# Publish 5 unpublished movies
npx tsx scripts/publish-nagarjuna-unpublished-movies.ts

# Result: 76 → 81 movies ✅
```

### Phase 2: Add High-Priority Missing (1-2 weeks)

**Add these 6 critical films:**
1. Manam (2014)
2. Brahmāstra (2022)
3. Khuda Gawah (1992)
4. LOC Kargil (2003)
5. King (2008)
6. Devadas (2018)

**Result: 81 → 87 movies**

### Phase 3: Add All Missing (1-2 months)

**Add all 28 missing films**

**Result: 81 → 109 movies** (close to 110+)

### Phase 4: Verify Additional Movies

**Research and add the 14+ additional movies mentioned**

**Result: 109 → 110+ movies** ✅

---

## Data Sources

### Where to Get Movie Data

1. **IMDb** - https://www.imdb.com/name/nm0615382/
2. **Wikipedia** - Nagarjuna filmography page
3. **TMDB** - The Movie Database
4. **Telugu Cinema Database**
5. **Bollywood Hungama** - For Hindi films

### Required Data Fields

For each movie:
- `title_en` (English title)
- `title_te` (Telugu title)
- `release_year`
- `language` (Telugu/Hindi/Tamil)
- `hero` (set to "Akkineni Nagarjuna")
- `director`
- `poster_url` (optional but recommended)
- `our_rating` (optional)
- `genres` (optional)
- `is_published = true`

---

## SQL Template for Adding Movies

```sql
-- Example for adding Manam
INSERT INTO movies (
  title_en,
  title_te,
  slug,
  release_year,
  language,
  hero,
  is_published
) VALUES (
  'Manam',
  'మనం',
  'manam-2014',
  2014,
  'Telugu',
  'Akkineni Nagarjuna',
  true
);

-- Repeat for each missing movie
```

---

## Summary

### Current Status
- ✅ API fix applied (shows all published movies)
- ⚠️  5 movies unpublished (quick fix available)
- ❌ 28 movies missing from database
- ❌ 14+ additional movies not identified

### Target
- **110+ movies** in Nagarjuna's profile

### Progress
- Current: 76 movies (69%)
- After Phase 1: 81 movies (74%)
- After Phase 2: 87 movies (79%)
- After Phase 3: 109 movies (99%)
- After Phase 4: 110+ movies (100%) ✅

### Priority Actions
1. **Run publish script** (5 min) → +5 movies
2. **Add 6 critical films** (1-2 weeks) → +6 movies
3. **Add all 28 missing** (1-2 months) → +22 movies
4. **Research additional 14+** → Complete filmography

---

## Next Steps

### Immediate (You Can Do Now)

```bash
# 1. Publish unpublished movies
npx tsx scripts/publish-nagarjuna-unpublished-movies.ts

# 2. Restart dev server
npm run dev

# 3. Verify profile
Open: http://localhost:3000/movies?profile=nagarjuna
Expected: 81 movies (was 76)
```

### Short-term (This Week)

1. Add Manam (2014) - Most critical
2. Add Brahmāstra (2022) - Recent hit
3. Add Devadas (2018) - Recent film

### Long-term (This Month)

1. Add all 28 missing movies
2. Research and add 14+ additional movies
3. Achieve 110+ complete filmography

---

**Questions?**
- Need help adding movies to database?
- Need data enrichment scripts?
- Need TMDB integration for automatic data fetch?
