# Year/Title Mismatch Review Guide

## Overview

**65 movies** need manual review due to year or title mismatches between Wikipedia and our database.

## Review Categories

### Category 1: Year Mismatches (±1 year)
Most common - usually due to:
- Wikipedia using theatrical release date
- Database using official release date
- Regional vs. international release dates

**Action**: Usually safe to add attribution if title matches 100%

### Category 2: Title Variants
Different spellings or transliterations:
- "Prem Qaidi" (Wikipedia) vs "Prema Khaidi" (DB)
- "Indru" vs "Indra"
- "Bhale Kodallu" vs "Athalu Kodallu"

**Action**: Verify it's the same movie, then add attribution

### Category 3: Different Movies
Same title, different year = likely different movies
**Action**: Mark as "Truly Missing" if Wikipedia movie doesn't exist

## Review Process

### Step 1: Open the CSV
```bash
open YEAR-TITLE-MISMATCHES.csv
```

### Step 2: For Each Movie, Check:

1. **Title Match Score**
   - 100% = Same title, only year differs → Usually safe
   - 75-90% = Similar title → Needs verification
   - <75% = Different title → Careful review needed

2. **Year Difference**
   - ±1 year = Very likely same movie
   - ±2-3 years = Possibly same movie
   - >3 years = Likely different movie

3. **Cross-Reference**
   - Check Wikipedia article for that specific movie
   - Verify it's the Telugu version (not Tamil remake)
   - Confirm actor's role

### Step 3: Create Decision CSV

Mark each movie as:
- **APPROVE** = Add attribution (same movie, just year/title mismatch)
- **REJECT** = Different movie (don't add)
- **RESEARCH** = Need more information

## Examples from Your Data

### ✅ APPROVE - Clear Cases

```
Movie: Super
Wikipedia Year: 2011 | DB Year: 2010 | Match: 100%
Decision: APPROVE (±1 year, perfect title match)

Movie: Shiva  
Wikipedia Year: 1990 | DB Year: 1989 | Match: 100%
Decision: APPROVE (±1 year, perfect title match)

Movie: Life Is Beautiful
Wikipedia Year: 2013 | DB Year: 2012 | Match: 100%
Decision: APPROVE (±1 year, perfect title match)
```

### ⚠️ RESEARCH - Needs Verification

```
Movie: Prem Qaidi vs Prema Khaidi
Wikipedia: 1991 | DB: 1990 | Match: 75%
Decision: RESEARCH (Different spelling + year off)

Movie: Indru vs Indra
Wikipedia: 2003 | DB: 2002 | Match: 80%
Decision: RESEARCH (Could be Tamil version vs Telugu)

Movie: Bhale Kodallu vs Athalu Kodallu
Wikipedia: 1968 | DB: 1971 | Match: 78%
Decision: RESEARCH (Different titles, >2 years apart)
```

### ❌ REJECT - Likely Different Movies

```
Movie: Garjanam vs Gaanam
Wikipedia: 1981 | DB: 1983 | Match: 75%
Decision: REJECT (Different titles, 2 years apart - likely different)

Movie: Prem Nagar vs Prema Nagar
Wikipedia: 1974 | DB: 1971 | Match: 90%
Decision: REJECT (3 years apart - could be remake)
```

## Decision Matrix

| Match Score | Year Diff | Decision |
|-------------|-----------|----------|
| 100% | ±1 year | ✅ APPROVE |
| 100% | ±2 years | ⚠️ RESEARCH |
| 90-99% | ±1 year | ⚠️ RESEARCH |
| 75-89% | ±1 year | ⚠️ RESEARCH |
| 100% | >2 years | ❌ REJECT |
| <90% | >1 year | ❌ REJECT |

## Quick Actions

### Auto-Approve Safe Cases (±1 year, 100% match)
```bash
# This will be automated in the next script
grep "100.*EXISTS (YEAR MISMATCH)" YEAR-TITLE-MISMATCHES.csv | \
awk -F'","' '$8-$3<=1 && $8-$3>=-1 {print $0}'
```

### Manual Review Queue
All others need human review.

## Workflow

1. **Quick wins**: Process ±1 year, 100% match movies (auto-approve ~30 movies)
2. **Manual review**: Process remaining ~35 movies
3. **Apply fixes**: Run script to add approved attributions
4. **Mark rejected**: Update "truly missing" list

## Output Format

Create: `MISMATCH-DECISIONS.csv`

```csv
DB Movie ID,Actor,Wikipedia Title,DB Title,Wikipedia Year,DB Year,Match Score,Decision,Notes
b86e2547...,ali,Super,Super,2011,2010,100,APPROVE,Same movie - year off by 1
...
```

---

**Ready to proceed?**
Let me know when you want to:
1. Auto-approve the safe cases (~30 movies)
2. Generate manual review worksheet for remaining ~35
3. Apply the approved fixes
