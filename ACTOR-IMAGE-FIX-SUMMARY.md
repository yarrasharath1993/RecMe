# Actor Image Poster Fix - Summary

## ✅ Issue Fixed

**Reported Issue**: http://localhost:3000/movies/pellam-chatu-mogudu-1992 was using a wrong image

**Root Cause**: Movie was using actress "Vanisri" headshot photo instead of movie poster:
- Wrong URL: `https://upload.wikimedia.org/wikipedia/commons/d/de/Vanisri.jpg`
- This is an actress photo, not the movie poster

## 🔍 Pattern Analysis

Found **4 movies** using the exact same wrong image:

| # | Title | Year | Slug | Status |
|---|-------|------|------|--------|
| 1 | Astulu Anthastulu | 1969 | astulu-anthastulu-1969 | ✅ Fixed |
| 2 | Pachhani Samsaram | 1970 | pachhani-samsaram-1970 | ✅ Fixed |
| 3 | Marapurani Talli | 1972 | marapurani-talli-1972 | ✅ Fixed |
| 4 | **Pellam Chatu Mogudu** | 1992 | pellam-chatu-mogudu-1992 | ✅ **Fixed** |

## 🔧 Solution Applied

- Set `poster_url` to `null` for all 4 movies
- System will now use **placeholder images with cast photos**
- Better UX than showing wrong actress photo
- Can be enriched later with correct posters

## 📊 Additional Issues Discovered

Comprehensive analysis of first 1000 movies found **27 more similar issues**:

### Issue Breakdown
- **23 movies**: Wikipedia Commons URLs with actor/actress names
- **2 movies**: Filenames match hero name (N.T. Rama Rao)
- **2 movies**: Filenames match heroine names (Jaya Prada, Swapna)

### Examples Found
- Krishna Prema (1943) - Contains "krishna" in URL
- Radhika (1947) - URL contains "Actress"
- Allari Bava (1980) - Using Jaya Prada photo
- Kondaveeti Simham (1981) - Using NTR police officer photo

## 🛠️ Tools Created

### 1. **fix-actor-image-posters.ts**
Comprehensive tool that:
- Scans all movies for actor images used as posters
- Detects patterns: Wikipedia URLs with actor names, cast name matches
- Auto-fixes with TMDB when available
- Generates detailed reports

```bash
# Run analysis
npx tsx scripts/fix-actor-image-posters.ts

# Fix issues
npx tsx scripts/fix-actor-image-posters.ts --execute
```

### 2. **fix-vanisri-image.ts**
Targeted fix for specific problematic URLs:
- Finds all movies using same actor image
- Attempts TMDB enrichment
- Lists movies needing manual review

```bash
npx tsx scripts/fix-vanisri-image.ts
npx tsx scripts/fix-vanisri-image.ts --execute
```

### 3. **fix-vanisri-complete.ts**
Complete solution (used for this fix):
- Sets poster_url to null for unfixable cases
- Enables placeholder system
- Provides clean fallback

```bash
npx tsx scripts/fix-vanisri-complete.ts --execute
```

### 4. **check-movie-image.ts**
Quick verification tool:
```bash
npx tsx scripts/check-movie-image.ts <slug>
```

## 📈 Results

### Immediate Fix
- ✅ 4 movies fixed immediately
- ✅ Wrong actress image removed
- ✅ Using placeholder with cast images
- ✅ All pages now display correctly

### Future Work
- 🔄 27 additional movies identified
- 🔄 Reports generated for review
- 🔄 Enrichment pipeline improvements planned

## 📁 Generated Reports

Location: `/reports/`
- `actor-image-posters-2026-01-13.json` - Full data (27 issues)
- `actor-image-posters-2026-01-13.tsv` - Spreadsheet format

## 🔒 Prevention Measures

### Detection Patterns Added
```typescript
const ACTOR_NAME_PATTERNS = [
  'vanisri', 'krishna', 'chiranjeevi', 'balakrishna',
  'nagarjuna', 'venkatesh', 'mahesh', 'pawan',
  'savitri', 'jayalalitha', 'vijayashanti',
  'actor', 'actress', 'person', 'portrait',
  'celebrity', 'star', 'profile', 'headshot'
];
```

### Validation Rules
- ❌ Reject Wikipedia URLs with person names
- ❌ Reject TMDB profile images
- ❌ Reject filenames matching cast names
- ✅ Prefer TMDB poster paths
- ✅ Use placeholder when uncertain

## ✅ Verification

**Before**: http://localhost:3000/movies/pellam-chatu-mogudu-1992
- Showed Vanisri actress photo

**After**: http://localhost:3000/movies/pellam-chatu-mogudu-1992
- Shows placeholder with cast images (hero, heroine, director)
- Better UX until proper poster is found

### Database Verification
```
Title: Pellam Chatu Mogudu
Year: 1992
Poster URL: null ✅ (was: Vanisri.jpg)
Status: Published
```

## 📝 Documentation

Comprehensive documentation created:
- `/docs/manual-review/ACTOR-IMAGE-POSTER-FIXES-2026-01-13.md`

Includes:
- Full issue analysis
- All patterns identified
- Scripts usage guide
- Prevention strategies
- Next steps

## 🎯 Next Steps

1. **Review 27 additional cases**
   - Check each manually
   - Determine if image is actually correct
   - Fix false positives if any

2. **Enrich older movies**
   - Try Internet Archive
   - Try Cinemaazi
   - Manual research for classics

3. **Update enrichment pipeline**
   - Add validation for new images
   - Reject actor image patterns
   - Prioritize verified poster sources

4. **Monitor for new issues**
   - Run periodic scans
   - Validate during enrichment
   - Review user reports

---

**Status**: ✅ **COMPLETE**  
**Movies Fixed**: 4  
**Similar Issues Found**: 27  
**Tools Created**: 4 scripts  
**Documentation**: Complete  
**Date**: January 13, 2026
