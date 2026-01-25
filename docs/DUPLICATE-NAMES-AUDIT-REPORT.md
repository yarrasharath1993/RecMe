# Duplicate Names Audit Report

**Date:** January 17, 2026  
**Total Movies Analyzed:** 1,000 published movies  
**Total Duplicate Cases Found:** 240

## Executive Summary

This audit identifies cases where the same name appears in multiple roles or time periods, potentially representing different people. The goal is to prevent incorrect attributions in celebrity profiles, similar to the S. Rajinikanth (producer) vs Rajinikanth (actor) issue that was recently fixed.

## High-Confidence Cases (Different Persons)

### 1. **Prabhu** (Confidence: 75%)
- **Issue:** Name appears as both producer and hero in different time periods
- **Producer Movies:** 6 movies (1992-2016)
  - Mannan (1992) - Producer: Prabhu
  - Devi(L) (2016) - Producer: Prabhu Deva
  - Abhinetri (2016) - Producer: Prabhu Deva
- **Hero Movies:** 15 movies (1988-1994)
  - Dharmathin Thalaivan (1988) - Hero: Rajinikanth, Prabhu
  - Guru Sishyan (1988) - Hero: Rajinikanth, Prabhu
  - Indhu (1994) - Hero: Prabhu Deva
- **Analysis:** 
  - "Prabhu" (hero) appears in 1988-1994 movies
  - "Prabhu Deva" (producer/director) appears in 1992-2016 movies
  - **Likely same person** (Prabhu/Prabhu Deva), but needs verification
- **Recommendation:** Verify if "Prabhu" and "Prabhu Deva" are the same person. If different, add disambiguation logic.

### 2. **Nagendra Babu** (Confidence: 75%)
- **Issue:** Name appears as producer (1983-1998) and hero (2008) with no overlap
- **Producer Movies:** 11 movies (1983-1998)
  - Mugguru Monagallu (1983) - Producer: Nagendra Babu
  - Trinetrudu (1988) - Producer: Nagendra Babu
  - Rudraveena (1988) - Producer: Nagendra Babu
- **Hero Movies:** 4 movies (1992-2008)
  - Agreement (1992) - Hero: Nagendra Babu
  - Hands Up! (2000) - Hero: Jayasudha, Brahmanandam, Nagendra Babu
  - Aapada Mokkulavaadu (2008) - Hero: Nagendra Babu
- **Analysis:**
  - Producer credits: 1983-1998
  - Hero credits: 1992-2008 (overlap exists, but different roles)
  - **Could be same person** (multi-talented), but 25-year gap in producer role suggests different person
- **Recommendation:** Research if Nagendra Babu (producer) and Nagendra Babu (actor) are the same person or different. If different, add disambiguation.

## Prefix Variation Cases (Potential Different Persons)

### 1. **R. Madhavan vs P. Madhavan**
- **R. Madhavan:** Actor (3 movies, 2020-2025)
  - Nishabdham (2020) - Hero
  - Rocketry: The Nambi Effect (2022) - Hero, Director
  - G.D.N (Biopic of G.D. Naidu) (2025) - Hero
- **P. Madhavan:** Director (1 movie, 1971)
  - Sabadham (1971) - Director
- **Analysis:** Different people (different time periods, different roles)
- **Status:** ✅ Already distinguishable by prefix

### 2. **S. Shankar vs N. Shankar**
- **S. Shankar:** Director (2 movies, 2007-2025)
  - Sivaji (2007) - Director
  - Game Changer (2025) - Director
- **N. Shankar:** Director/Producer (5 movies, 1997-2017)
  - Encounter (1997) - Director
  - Sri Ramulayya (1999) - Director
  - Jayam Manade Raa (2000) - Director
  - Bhadrachalam (2001) - Director
  - 2 Countries (2017) - Producer
- **Analysis:** Different people (S. Shankar is famous director, N. Shankar is different)
- **Status:** ✅ Already distinguishable by prefix

### 3. **P. Vasu vs K. Vasu**
- **P. Vasu:** Director (5 movies, 1992-2008)
  - Mannan (1992) - Director
  - Maharadhi (2007) - Director
  - Maharathi (2007) - Director
  - Krishnarjuna (2008) - Director
  - Kathanayakudu (2008) - Director
- **K. Vasu:** Director (5 movies, 1969-1973)
  - Raja Simha (1969) - Director
  - Pattindalla Bangaram (1971) - Director
  - Kalam Marindi (1972) - Director
  - Neramu Siksha (1973) - Director
  - Palletoori Bava (1973) - Director
- **Analysis:** Different people (different time periods)
- **Status:** ✅ Already distinguishable by prefix

## Known Fixed Cases

### **S. Rajinikanth vs Rajinikanth** ✅ FIXED
- **S. Rajinikanth:** Producer (pre-1975 movies)
  - Sri Satyanarayana Mahathyam (1964)
  - Chenchu Lakshmi (1943)
  - Sree Ramanjaneya Yuddham (1958)
  - Sati Sulochana (Indrajeet) (1961)
- **Rajinikanth:** Actor (post-1975 movies)
  - Apoorva Raagangal (1975) - Debut
  - 60+ movies as hero
- **Fix Applied:** Profile API now distinguishes between producer and actor profiles
- **Status:** ✅ Fixed in profile API

## Other Findings

### Low-Confidence Cases (238 cases)
Most of these are likely the same person appearing in multiple roles (e.g., actor-director, hero-heroine in same movie). Examples:
- **Rajinikanth:** hero (37), producer (1), heroine (1) - Same person, different roles
- **Kamal Haasan:** hero (19), writer (1) - Same person, multi-talented
- **Ajay Devgn:** hero (3), director (1), heroine (1) - Same person, multi-talented

### Prefix Variations Found (43 cases)
Most are formatting inconsistencies (e.g., "R. Madhavan" vs "R Madhavan") rather than different people. These should be standardized for consistency.

## Recommendations

### Immediate Actions
1. ✅ **S. Rajinikanth vs Rajinikanth** - Already fixed in profile API
2. 🔍 **Review Prabhu case** - Verify if "Prabhu" and "Prabhu Deva" are the same person
3. 🔍 **Review Nagendra Babu case** - Research if producer and actor are the same person

### Long-Term Improvements
1. **Name Disambiguation System:**
   - Add logic to profile API to handle high-confidence duplicate cases
   - Use time periods, role combinations, and prefix variations to distinguish

2. **Data Standardization:**
   - Standardize prefix formatting (R. vs R, S. vs S)
   - Create canonical name mapping for variations

3. **Profile API Enhancements:**
   - Add similar logic to S. Rajinikanth fix for other high-confidence cases
   - Consider adding "name_disambiguation" field to celebrities table

4. **Monitoring:**
   - Run this audit periodically to catch new duplicate cases
   - Add automated checks for new movies with duplicate name patterns

## Files Generated

- `DUPLICATE-NAMES-AUDIT.csv` - Full audit results (240 cases)
- `DUPLICATE-NAMES-SUMMARY.json` - Summary statistics
- `docs/DUPLICATE-NAMES-AUDIT-REPORT.md` - This report

## Next Steps

1. Review high-confidence cases with domain experts
2. Implement disambiguation logic for verified duplicate cases
3. Standardize name formatting across database
4. Add automated duplicate detection to data import process
