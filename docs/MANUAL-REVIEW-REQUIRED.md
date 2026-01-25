# Manual Review Required - Three Audit Reports

**Date:** January 18, 2026  
**Status:** Ready for Manual Review

## Overview

Three comprehensive audits have been completed to prepare for manual review and fixes:

1. **Gender Role Misclassifications** - 107 cases found
2. **Name Variations** - 58 names with variations found
3. **Disambiguation Cases** - All 7 confirmed different persons audited

---

## 1. Gender Role Misclassifications

**File:** `GENDER-ROLE-MISCLASSIFICATIONS.csv`  
**Total Cases:** 107

### Summary by Person

| Person | Misclassifications | Issue |
|--------|-------------------|-------|
| Jayasudha | 21 | Female actor listed as "hero" instead of "heroine" |
| Jamuna | 10 | Female actor listed as "hero" instead of "heroine" |
| S. J. Suryah | 3 | Male actor listed as "heroine" instead of "hero" |
| Alia Bhatt | 3 | Female actor listed as "hero" instead of "heroine" |
| Basil Joseph | 3 | Male actor listed as "heroine" instead of "hero" |
| Amitabh Bachchan | 2 | Male actor listed as "heroine" instead of "hero" |
| Karthi | 2 | Male actor listed as "heroine" instead of "hero" |
| Sanjay Dutt | 2 | Male actor listed as "heroine" instead of "hero" |
| Soubin Shahir | 2 | Male actor listed as "heroine" instead of "hero" |
| Vijay Sethupathi | 2 | Male actor listed as "heroine" instead of "hero" |
| Prakash Raj | 2 | Male actor listed as "heroine" instead of "hero" |
| Brahmanandam | 2 | Male actor listed as "heroine" instead of "hero" |
| K. R. Vijaya | 2 | Female actor listed as "hero" instead of "heroine" |
| Allu Rama Lingaiah | 2 | Male actor listed as "heroine" instead of "hero" |
| Anjali Devi | 2 | Female actor listed as "hero" instead of "heroine" |
| Others | 50+ | Various misclassifications |

### Action Required

1. **Review CSV file:** `GENDER-ROLE-MISCLASSIFICATIONS.csv`
2. **Verify each case** - Some may be legitimate (e.g., cross-gender roles)
3. **Create fix script** to move names from `hero` → `heroine` or `heroine` → `hero`
4. **Apply fixes** after manual verification

### Priority Cases

- **Jayasudha (21 cases)** - High priority, likely all errors
- **Jamuna (10 cases)** - High priority, likely all errors
- **S. J. Suryah (3 cases)** - Verify if legitimate cross-gender roles

---

## 2. Name Variations

**File:** `NAME-VARIATIONS-AUDIT.csv`  
**Total Cases:** 58 names with variations

### Top 20 Variations (by Occurrences)

| Rank | Canonical Name | Variations | Occurrences | Priority |
|------|---------------|------------|-------------|----------|
| 1 | Krishna | Krishna, T Krishna, T. Krishna | 54 | High |
| 2 | Sridevi | Sridevi, Y. Sridevi | 43 | High |
| 3 | K. Chakravarthy | Chakravarthy, K. Chakravarthy | 43 | High |
| 4 | Rajinikanth | Rajinikanth, S. Rajinikanth | 40 | ✅ Already handled |
| 5 | N. T. Rama Rao | N. T. Rama Rao, N.T. Rama Rao | 40 | Medium |
| 6 | K. V. Mahadevan | K. V. Mahadevan, K.V. Mahadevan | 31 | Medium |
| 7 | K. Vasu | P. Vasu, K. Vasu, Vasu, K Vasu | 25 | ⚠️ Different persons |
| 8 | K. Raghavendra Rao | K. Raghavendra Rao, K Raghavendra Rao | 25 | Medium |
| 9 | M. S. Viswanathan | M. S. Viswanathan, M.S. Viswanathan | 18 | Medium |
| 10 | T.V. Raju | T.V. Raju, T. V. Raju | 18 | Medium |
| 11 | K. S. R. Das | K. S. R. Das, O. S. R. Das | 13 | ⚠️ Verify if same person |
| 12 | S. P. Muthuraman | S. P. Muthuraman, S.P. Muthuraman | 11 | Medium |
| 13 | Murali Mohan | Murali Mohan, K. Murali Mohan | 10 | Medium |
| 14 | S. V. Krishna Reddy | S. V. Krishna Reddy, S.V. Krishna Reddy | 9 | Medium |
| 15 | M. M. Keeravani | M. M. Keeravani, M.M. Keeravani | 9 | Medium |
| 16 | Jayanth C. Paranjee | Jayanth C. Paranjee, Jayant Paranji | 6 | ✅ Documented |
| 17 | R. Madhavan | R. Madhavan, P. Madhavan | 4 | ⚠️ Different persons |
| 18 | S. Shankar | S. Shankar, N. Shankar | 7 | ⚠️ Different persons |
| 19 | V. Harikrishna | V Harikrishna, V. Harikrishna | 4 | Low |
| 20 | R. Chandru | R Chandru, R. Chandru | 3 | Low |

### Action Required

1. **Review CSV file:** `NAME-VARIATIONS-AUDIT.csv`
2. **Categorize variations:**
   - **Formatting only** (e.g., "R. Madhavan" vs "R Madhavan") - Standardize
   - **Different persons** (e.g., "K. Vasu" vs "P. Vasu") - Keep separate
   - **Same person, different spellings** (e.g., "Jayanth C. Paranjee" vs "Jayant Paranji") - Standardize
3. **Create standardization script** for formatting-only variations
4. **Document different persons** in disambiguation map

### Priority Cases

- **Krishna (54 occurrences)** - High priority, likely formatting only
- **Sridevi (43 occurrences)** - High priority, verify Y. Sridevi is same person
- **K. Chakravarthy (43 occurrences)** - High priority, verify if "Chakravarthy" alone refers to same person
- **K. S. R. Das vs O. S. R. Das (13 occurrences)** - Verify if same person

---

## 3. Disambiguation Cases

**File:** `DISAMBIGUATION-CASES-AUDIT.csv`  
**Total Cases:** 7 confirmed different persons

### Detailed Breakdown

#### 1. Devaraj
- **1970s Director:** 2 movies
  - Sainthadamma Sainthadu (1977)
  - Kavikkuyil (1977)
- **Modern Actor:** 0 movies found (may need to search for "Head Bush" specifically)
- **Action:** Verify modern actor movies are correctly tagged

#### 2. Sudhakar
- **Producer:** 0 movies found (may need broader search)
- **Actor/Comedian:** 2 movies
  - Agni Pravesam (1990)
  - Inikkum Ilamai (1982)
- **Action:** Verify producer movies are correctly tagged

#### 3. Ram
- **Music Director:** 2 movies
  - 1940 Lo Oka Gramam (2010)
  - Prema Rajyam (2010)
- **Actor (Ram Pothineni):** 4 movies
  - Putham Pudhu Kaalai (2020)
  - Utthara (2020)
  - 4 Letters (2020)
  - Neevalle Nenunna (2020)
- **Action:** ✅ Clear separation by year and role

#### 4. Sagar
- **Director:** 3 movies
  - Amma Donga! (1995)
  - Appatlo Okadundevadu (2016)
  - Bharata Simham (1995)
- **Singer/Actor:** 1 movie
  - Siddhartha (2016)
- **Action:** ✅ Clear separation by role

#### 5. Srikanth
- **Tamil Actor (Meka Srikanth):** 0 movies found (may need language-specific search)
- **Telugu Actor:** 149 movies
  - Antahpuram (1998)
  - Maa Nannaki Pelli (1997)
  - Kana Kandaen (2005)
  - Roja Kootam (2002)
  - Muthyam (2001)
  - ... and 144 more
- **Action:** ⚠️ Need to verify Tamil movies are correctly tagged with language

#### 6. Anil Kumar
- **1980s Director:** 1 movie
  - Bangaru Chilaka (1985)
- **Modern Music Technician:** 1 movie
  - Choosinodiki Choosinanta (2014)
- **Action:** ✅ Clear separation by year and role

#### 7. Vijay Bhaskar
- **Director/Writer:** 1 movie
  - Idi Pellantara (1982)
- **Action:** ⚠️ Name ambiguity - may need manual review of all occurrences

### Action Required

1. **Review CSV file:** `DISAMBIGUATION-CASES-AUDIT.csv`
2. **Verify missing cases:**
   - Devaraj (modern actor) - Search for "Head Bush" movies
   - Sudhakar (producer) - Search for producer credits
   - Srikanth (Tamil actor) - Verify Tamil language movies
3. **Implement full disambiguation logic** in profile API for all 7 cases
4. **Test profile pages** for each person to ensure correct filtering

### Implementation Priority

1. **High Priority:**
   - Ram (clear year/role separation)
   - Sagar (clear role separation)
   - Anil Kumar (clear year/role separation)

2. **Medium Priority:**
   - Devaraj (need to find modern actor movies)
   - Sudhakar (need to find producer movies)

3. **Low Priority:**
   - Srikanth (need language-based filtering)
   - Vijay Bhaskar (name ambiguity, may need manual review)

---

## Files Generated

### Audit Reports
- `GENDER-ROLE-MISCLASSIFICATIONS.csv` - 107 cases
- `NAME-VARIATIONS-AUDIT.csv` - 58 names with variations
- `DISAMBIGUATION-CASES-AUDIT.csv` - All 7 confirmed different persons

### Scripts
- `scripts/audit-gender-role-misclassifications.ts`
- `scripts/audit-name-variations.ts`
- `scripts/audit-disambiguation-cases.ts`

---

## Recommended Review Order

1. **Gender Role Misclassifications** (Highest Impact)
   - Review top 10 persons (Jayasudha, Jamuna, etc.)
   - Create fix script
   - Apply fixes

2. **Name Variations** (Medium Impact)
   - Review top 20 variations
   - Categorize: formatting vs different persons
   - Standardize formatting-only variations

3. **Disambiguation Cases** (Lower Impact, Already Partially Handled)
   - Verify missing cases
   - Implement full filtering logic
   - Test profile pages

---

## Next Steps

1. ✅ **Audits Complete** - All three audits completed
2. 🔍 **Manual Review** - Review CSV files for accuracy
3. 🔧 **Create Fix Scripts** - Based on manual review findings
4. ✅ **Apply Fixes** - Execute fix scripts
5. 🧪 **Test** - Verify fixes work correctly

---

## Notes

- Most gender misclassifications are likely data entry errors
- Name variations are mostly formatting inconsistencies
- Disambiguation cases are already partially handled in profile API
- All fixes should be applied incrementally with testing
