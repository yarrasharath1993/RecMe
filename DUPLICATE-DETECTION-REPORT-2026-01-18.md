# Duplicate Celebrity Detection Report

**Date**: 1/18/2026
**Total Celebrities**: 508
**Duplicate Groups Found**: 888

## Summary by Confidence

| Confidence | Count | Action Required |
|------------|-------|-----------------|
| 🔴 High | 2 | Immediate merge/deletion needed |
| 🟡 Medium | 886 | Manual review recommended |
| 🟢 Low | 0 | Optional review |

## Summary by Type

| Type | Count | Description |
|------|-------|-------------|
| Exact Name | 0 | Same normalized name (different IDs) |
| Similar Name | 7 | 80%+ name similarity |
| Name Variation | 881 | One name contains the other |
| External ID Match | 0 | Same TMDB/IMDB ID |
| Slug Match | 0 | Same URL slug |

## High Priority Issues (2)

### 1. Very similar names (92% match): "B. V. Prasad" vs "L. V. Prasad"

- **B. V. Prasad** (ID: 52cc1c29-8098-4faa-bccc-a55f48e63f26, Popularity: 54, Published: Yes)
  - **L. V. Prasad** (ID: 59b0a93f-6023-413e-8bcf-7833968f5fc2, Popularity: 48, Published: Yes)

**Type**: similar  
**Confidence**: high

---

### 2. Very similar names (91% match): "C. Pullaiah" vs "P. Pullaiah"

- **C. Pullaiah** (ID: 10b081ba-0472-4394-95ab-ba10e5078e23, Popularity: 52, Published: Yes)
  - **P. Pullaiah** (ID: 4ecaf338-5530-4de5-9b69-d55312d9dfd3, Popularity: 90, Published: Yes)

**Type**: similar  
**Confidence**: high


## Files Generated

1. **DUPLICATE-CELEBRITIES-ALL-2026-01-18.csv**
   - Complete list of all 888 duplicate groups
   - Includes all confidence levels
   - Full details for comparison

2. **DUPLICATE-CELEBRITIES-HIGH-PRIORITY-2026-01-18.csv**
   - Only high confidence duplicates (2 groups)
   - Action recommendations included
   - Ready for immediate processing

## Recommended Actions

### For High Confidence Duplicates

1. **Review DUPLICATE-CELEBRITIES-HIGH-PRIORITY-2026-01-18.csv**
2. **For each duplicate group:**
   - Verify they are truly the same person
   - Choose which record to keep (usually the published one with higher popularity)
   - Merge data from duplicate into the kept record
   - Update all movie references to point to kept record
   - Delete the duplicate record

### For Medium/Low Confidence

1. **Review DUPLICATE-CELEBRITIES-ALL-2026-01-18.csv**
2. **Manually verify** each potential duplicate
3. **Merge or dismiss** based on verification

## Database Cleanup Script

After manual review, use the cleanup script:

```bash
npx tsx scripts/merge-duplicate-celebrities.ts --input DUPLICATE-CELEBRITIES-HIGH-PRIORITY-2026-01-18.csv
```

---

**Generated**: 2026-01-18T17:35:25.436Z
