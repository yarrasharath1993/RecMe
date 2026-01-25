# Duplicate Profiles Audit & Fix Summary

## Overview
Comprehensive audit of duplicate profiles caused by spelling variations and inconsistent naming conventions across the database.

**Date**: January 14, 2026  
**Status**: Phase 1 Complete ✅

---

## Audit Results

### Initial Scan
- **Total duplicate groups found**: 72
- **Roles affected**: Heroes, Heroines, Directors, Music Directors, Producers, Writers, Cinematographers

### After Phase 1 Fixes
- **Remaining duplicate groups**: 65
- **Fixed in Phase 1**: 7 major groups
- **Movies corrected**: ~361 movies

---

## Phase 1 Fixes (Completed ✅)

### High-Impact Fixes

#### 1. **N. T. Rama Rao (NTR)**
- **Wrong**: "N.T. Rama Rao" (no spaces after dots)
- **Correct**: "N. T. Rama Rao"
- **Movies fixed**: 268 ✅
- **Impact**: Unified NTR's profile with proper spacing

#### 2. **N. T. Rama Rao Jr. (NTR Jr)**
- **Wrong**: "N.T. Rama Rao Jr."
- **Correct**: "N. T. Rama Rao Jr."
- **Movies fixed**: 24 ✅
- **Impact**: Unified NTR Jr's profile

#### 3. **Vamsi** (Director)
- **Wrong**: "Vamsy" (y instead of i)
- **Correct**: "Vamsi"
- **Movies fixed**: 40 ✅
- **Impact**: Major director profile unification

#### 4. **Sai Ram Shankar**
- **Wrong**: "Sairam Shankar" (no space)
- **Correct**: "Sai Ram Shankar"
- **Movies fixed**: 8 ✅

#### 5. **Rama Krishna**
- **Wrong**: "Ramakrishna" (no space)
- **Correct**: "Rama Krishna"
- **Movies fixed**: 6 ✅

#### 6. **Jaya Prada**
- **Wrong**: "Jayaprada" (no space)
- **Correct**: "Jaya Prada"
- **Movies fixed**: 2 ✅

#### 7. **Divyavani**
- **Wrong**: "Divya Vani" (space added)
- **Correct**: "Divyavani"
- **Movies fixed**: 5 ✅

#### 8. **K.R. Vijaya**
- **Wrong**: "K R Vijaya" (missing dots)
- **Correct**: "K.R. Vijaya"
- **Movies fixed**: 4 ✅

#### 9. **V. V. Vinayak** (Director)
- **Wrong**: "V.V. Vinayak" (no spaces)
- **Correct**: "V. V. Vinayak"
- **Movies fixed**: 4 ✅

---

## Remaining Duplicates (65 groups)

### Breakdown by Role
- **Heroes**: 1 group
- **Directors**: 25 groups
- **Music Directors**: 11 groups
- **Producers**: 14 groups
- **Writers**: 3 groups
- **Cinematographers**: 11 groups

### Common Patterns in Remaining Duplicates

#### 1. **Spacing in Initials**
Most remaining issues are inconsistent spacing in abbreviated names:
- "K.Raghavendra Rao" vs "K. Raghavendra Rao"
- "S.S. Rajamouli" vs "S. S. Rajamouli"
- "M.M. Keeravani" vs "M. M. Keeravani"

#### 2. **With/Without Dots**
- "K V Mahadevan" vs "K.V. Mahadevan"
- "S P Balasubrahmanyam" vs "S.P. Balasubrahmanyam"

#### 3. **Spacing in Names**
- "Rama Rao" vs "Ramarao"
- "Siva Kumar" vs "Sivakumar"

---

## Impact Summary

### Movies Fixed
- **Total movies corrected**: ~361
- **Largest fix**: N.T. Rama Rao (268 movies)
- **Second largest**: Vamsi director (40 movies)

### Profiles Unified
- ✅ NTR (Hero) - No more duplicate profiles
- ✅ NTR Jr (Hero) - Unified
- ✅ Vamsi (Director) - Unified
- ✅ Jaya Prada (Heroine) - Unified
- ✅ 5 other major profiles

### User Experience Improvements
1. **Search**: Users now find complete filmographies in one place
2. **Navigation**: No confusion between duplicate profiles
3. **Data Quality**: Consistent naming across the platform
4. **SEO**: Better for search engines (no duplicate content)

---

## Technical Details

### Audit Script
**File**: `/scripts/audit-duplicate-profiles.ts`

**How it works**:
1. Scans all movies for each role (hero, heroine, director, etc.)
2. Normalizes names (removes spaces, dots, hyphens)
3. Groups variations of the same name
4. Reports potential duplicates with movie counts

### Fix Script
**File**: `/scripts/fix-top-duplicates.ts`

**Approach**:
1. Defines fix rules (wrong spelling → correct spelling)
2. Counts affected movies
3. Updates database in batch
4. Verifies fixes

---

## Next Steps

### Phase 2: Remaining Duplicates

#### Priority 1: High-Count Duplicates
Focus on duplicates with most movies:
1. Director names with initials (20+ groups)
2. Music directors (11 groups)
3. Producers (14 groups)

#### Priority 2: Standardization Rules
Establish consistent naming conventions:
1. **Initials**: Always use space after dots (e.g., "K. Raghavendra Rao")
2. **Compound names**: Check celebrity records for preferred spelling
3. **Common names**: Add to celebrity table for reference

#### Priority 3: Prevention
Implement validation:
1. Check against celebrity table when adding movies
2. Suggest corrections for common variations
3. Add warnings in admin interface

---

## Testing

### Verify Fixes
```bash
# Run audit to see remaining duplicates
npx tsx scripts/audit-duplicate-profiles.ts

# Check specific profile
curl http://localhost:3000/api/profile/n-t-rama-rao | jq .roles.actor.count

# Should show unified count (e.g., 62 movies for NTR)
```

### Browser Testing
Check these major profiles are now unified:
- http://localhost:3000/movies?profile=n-t-rama-rao (NTR)
- http://localhost:3000/movies?profile=vamsi (Director Vamsi)
- http://localhost:3000/movies?profile=jaya-prada (Jaya Prada)

---

## Files Created

### Scripts
- `/scripts/audit-duplicate-profiles.ts` - Main audit script
- `/scripts/fix-top-duplicates.ts` - Batch fix for major duplicates

### Reports
- `/docs/manual-review/DUPLICATE-PROFILES-AUDIT-2026-01-14.txt` - Full audit report
- `/DUPLICATE-PROFILES-AUDIT-SUMMARY-2026-01-14.md` - This summary

### Individual Fixes
- `/NITHIN-DUPLICATE-PROFILE-FIX-2026-01-14.md` - Nithin/Nithiin case study

---

## Recommendations

### For Database
1. **Add celebrity records** for top 100 actors/directors
2. **Standardize naming** using celebrity table as source of truth
3. **Create lookup table** for common name variations

### For Application
1. **Auto-suggest** from celebrity table when adding movies
2. **Validate** against known variations
3. **Show warning** if creating new variation of existing name

### For Data Entry
1. **Reference guide** for proper spelling of common names
2. **Validation rules** in admin interface
3. **Bulk update tools** for fixing variations

---

## Statistics

### Before Audit
- Unknown number of duplicate profiles
- Inconsistent naming across ~361+ movies
- Fragmented filmographies

### After Phase 1
- **72 → 65 duplicate groups** (7 fixed)
- **361 movies** corrected
- **9 major profiles** unified
- **Remaining work**: 65 groups to review

### Expected After Phase 2
- < 20 duplicate groups (low-priority cases)
- 90%+ naming consistency
- Complete filmographies for all major celebrities

---

**Status**: ✅ Phase 1 Complete  
**Next**: Phase 2 - Fix remaining 65 duplicate groups  
**Goal**: < 5% duplicate profiles across database

---

## Key Takeaways

1. **Pattern**: Most duplicates are spacing/punctuation issues, not different people
2. **Impact**: 361 movies affected by just 9 name variations
3. **Solution**: Batch fixes work well for clear patterns
4. **Prevention**: Need celebrity table + validation to prevent future duplicates
5. **Ongoing**: 65 more groups to review and fix systematically
