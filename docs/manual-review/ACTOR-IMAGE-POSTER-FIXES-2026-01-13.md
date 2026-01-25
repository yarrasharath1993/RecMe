# Actor Image Poster Fixes - January 13, 2026

## Issue Summary

Movies were using actor/actress headshots or profile photos as movie posters instead of actual movie posters. This creates a poor user experience as the images don't represent the movie.

## Pattern Identified

### Primary Issue: Vanisri.jpg
**Problem**: 4 movies were using the same actress headshot from Wikipedia Commons
**URL**: `https://upload.wikimedia.org/wikipedia/commons/d/de/Vanisri.jpg`

### Movies Fixed

| Title | Year | Slug | Status |
|-------|------|------|--------|
| Astulu Anthastulu | 1969 | astulu-anthastulu-1969 | ✅ Fixed - Set to null (using placeholder) |
| Pachhani Samsaram | 1970 | pachhani-samsaram-1970 | ✅ Fixed - Set to null (using placeholder) |
| Marapurani Talli | 1972 | marapurani-talli-1972 | ✅ Fixed - Set to null (using placeholder) |
| Pellam Chatu Mogudu | 1992 | pellam-chatu-mogudu-1992 | ✅ Fixed - Set to null (using placeholder) |

## Additional Issues Found (First 1000 movies analyzed)

### By Pattern Type

1. **Wikipedia Commons Actor Names**: 23 movies
   - URLs contain actor/actress names in the filename
   - Examples: Krishna, NTR, Savitri, Jaya Prada, etc.

2. **Hero Name Matches**: 2 movies
   - Filename explicitly matches hero name (N.T. Rama Rao)

3. **Heroine Name Matches**: 2 movies
   - Filename explicitly matches heroine name (Jaya Prada, Swapna)

### Sample Issues (Need Review)

| Title | Year | Reason | Current URL |
|-------|------|--------|-------------|
| Krishna Prema | 1943 | Contains "krishna" | wikipedia.org/.../1943-KrishnaPrema_poster.jpg |
| Radhika | 1947 | Contains "actress" | wikipedia.org/.../Radhika_%28South_Indian_Actress%29.jpg |
| Paramanandayya Sishyulu | 1950 | Hero name match (NTR) | wikipedia.org/.../Paramanandayya_Sishyulu.jpg |
| Allari Bava | 1980 | Heroine: Jaya Prada | wikipedia.org/.../Jaya_Prada_graces_Perfect_Pati.jpg |
| Kondaveeti Simham | 1981 | Contains "NTR" | wikipedia.org/.../NTR_as_police_officer.jpg |

## Detection Logic

The automated detection system identifies suspicious poster images by:

1. **Source Check**: Images from Wikipedia/Wikimedia Commons
2. **Filename Analysis**: Contains common actor/actress names
3. **Cast Matching**: Filename matches hero/heroine names
4. **URL Patterns**: Contains words like "actor", "actress", "person", "portrait"

### Common Actor Names Detected
- Telugu stars: Vanisri, Krishna, Chiranjeevi, Balakrishna, Nagarjuna, Venkatesh, NTR
- Actresses: Savitri, Jayalalitha, Vijayashanti, Soundarya, Simran, Samantha
- Generic terms: actor, actress, person, portrait, headshot, celebrity, star, profile

## Solution Approach

### For Movies Found in TMDB
- Replace with correct TMDB poster
- Update tmdb_id for future reference

### For Movies NOT in TMDB (Older/Regional films)
- Set poster_url to null
- System will use placeholder with cast images
- Better than showing wrong image

## Scripts Created

1. **fix-actor-image-posters.ts**
   - Comprehensive analysis of all movies
   - Detects actor image patterns
   - Auto-fixes with TMDB data when available

2. **fix-vanisri-image.ts**
   - Targeted fix for specific problematic URL
   - Finds all movies using same actor image

3. **fix-vanisri-complete.ts**
   - Complete solution for identified issues
   - Sets to null when no alternative found

## Results

- **Immediate Fix**: 4 movies corrected (Vanisri.jpg issue)
- **Additional Issues Identified**: 27 movies in first 1000 analyzed
- **Auto-fixable**: 2 movies (had TMDB matches)
- **Manual Review Needed**: 25 movies (older films not in TMDB)

## Next Steps

1. **Run full analysis** on all movies (not just first 1000)
   ```bash
   npx tsx scripts/fix-actor-image-posters.ts
   ```

2. **Review manual cases** from generated reports:
   - `reports/actor-image-posters-2026-01-13.json`
   - `reports/actor-image-posters-2026-01-13.tsv`

3. **Enrich older movies** with proper posters:
   - Try Internet Archive
   - Try Cinemaazi (Indian film archive)
   - Manual research for classics

4. **Prevent future issues**:
   - Add validation in enrichment pipeline
   - Reject URLs matching actor name patterns
   - Prefer movie poster sources over general image searches

## Prevention

### Image Validation Rules
- ❌ Wikipedia URLs with person names in filename
- ❌ TMDB profile images (/profile/ URLs)
- ❌ Filenames matching cast member names
- ✅ TMDB poster URLs (/w500/ paths)
- ✅ Official movie poster images

### Enrichment Priority
1. TMDB (verified movie posters)
2. IMDb (when available)
3. Internet Archive (archival content)
4. Wikimedia Commons (only if movie-specific)
5. Manual review for classics

## Testing

After fixes, verify:
```bash
# Check specific movie
npx tsx scripts/check-movie-image.ts pellam-chatu-mogudu-1992

# View in browser
http://localhost:3000/movies/pellam-chatu-mogudu-1992
```

## Files Modified

### Scripts Created
- `/scripts/fix-actor-image-posters.ts` - Main detection/fix tool
- `/scripts/fix-vanisri-image.ts` - Targeted fix for specific URL
- `/scripts/fix-vanisri-complete.ts` - Complete solution
- `/scripts/check-movie-image.ts` - Quick movie data checker
- `/scripts/debug-specific-movie.ts` - Debug detection logic

### Reports Generated
- `/reports/actor-image-posters-2026-01-13.json`
- `/reports/actor-image-posters-2026-01-13.tsv`

---

**Issue Reported**: http://localhost:3000/movies/pellam-chatu-mogudu-1992  
**Status**: ✅ Fixed  
**Date**: January 13, 2026  
**Pattern**: 4 movies using same actress photo  
**Total Issues Found**: 31+ (4 fixed immediately, 27+ need review)
