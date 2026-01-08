# Telugu Portal Editorial Rating Model

> **Version**: 2.3 (Complete Manual Review)  
> **Last Updated**: January 7, 2026  
> **Total Movies Rated**: 6,770 (99.96% coverage)  
> **Total Movies in Database**: 6,773  
> **Upcoming/TBD**: 3 movies

## Overview

The Telugu Portal uses a **hybrid editorial rating system** that combines multiple data sources, industry benchmarks, and AI-assisted analysis to provide accurate, consistent ratings across all Telugu cinema.

### Key Principles
1. **Editorial Authority**: Ratings reflect considered editorial judgment, not just aggregated scores
2. **Historical Respect**: Classic films receive fair consideration for their era's context
3. **Legendary Director Recognition**: Films by acclaimed directors have elevated baselines
4. **Cross-Validation**: Ratings are validated against multiple sources (TMDB, IMDb, awards)
5. **Transparency**: All rating sources and adjustments are documented

## Rating Scale

| Score | Category | Description | Count |
|-------|----------|-------------|-------|
| 9.0 - 10.0 | **Masterpiece** | All-time classics, landmark cinema | ~20 |
| 8.0 - 8.9 | **Excellent** | Award-worthy, highly acclaimed | 436 |
| 7.0 - 7.9 | **Very Good** | Recommended, above average | 2,509 |
| 6.0 - 6.9 | **Good** | Decent, one-time watch | 1,571 |
| 5.0 - 5.9 | **Average** | Mixed reception, has flaws | 2,122 |
| 4.0 - 4.9 | **Below Average** | Poor execution, limited appeal | ~100 |
| < 4.0 | **Poor** | Critical failures | ~32 |

## Rating Priority (Waterfall)

When displaying ratings, we use this priority order:

```
1. Manual Editorial Override (if set by human reviewer)
   ↓
2. Cross-Referenced Rating (validated against TMDB, IMDb, industry consensus)
   ↓
3. Smart Rating (era-based, director/actor significance)
   ↓
4. AI-Generated Rating (from dimensions_json analysis)
   ↓
5. Default Conservative (7.0 for classics, 6.0 for others)
```

## Data Sources & Weights

| Source | Weight | Notes |
|--------|--------|-------|
| **IMDb Rating** | 30% | Most reliable for vote counts > 1000 |
| **TMDB Rating** | 20% | Good for recent films, weak for classics |
| **Awards** | 20% | Nandi, Filmfare, National Awards boost |
| **Classic/Blockbuster Status** | 15% | Industry-verified hits |
| **AI Dimensional Analysis** | 15% | Story, direction, music, performance scores |

## Validation Rules

### Cross-Reference Validation
- If TMDB differs by > 2.0 points: Blend 60% our_rating + 40% TMDB
- If movie has 2+ major awards: Minimum rating 7.5
- If marked as classic but rated < 7.0: Boost to 7.5
- If marked as blockbuster but rated < 7.0: Boost to 7.0
- If non-notable film rated 9+: Cap at 8.5

### Smart Rating (for unvalidated films)

#### Era-Based Scoring
| Era | Base Rating | Rationale |
|-----|-------------|-----------|
| Pre-1965 (Golden Era) | 6.5 | Historical significance, archival value |
| 1965-1979 | 6.3 | Classic era transitioning to color |
| 1980-1989 | 6.0 | Action/drama renaissance period |
| 1990-1999 | 5.8 | Peak production years |
| 2000-2009 | 5.5 | Modern transition period |
| 2010-2019 | 5.3 | Contemporary era |
| 2020+ | 5.0 | Current releases (stricter baseline) |

#### Director Boost Rules
- **Legendary Directors** (see list below): Minimum 7.0 for all films
- **Famous Directors**: +0.5 boost if rated < 7.0
- **New Talent**: Standard era-based rating

#### Star Cast Boost
- **Superstars** (Chiranjeevi, NTR, Krishna, etc.): +0.3 boost if rated < 6.5
- **Star Actors** (see list below): +0.2 boost

## Legendary Directors (Minimum 7.0 Guarantee)

These directors have such consistent excellence that their films are guaranteed a minimum 7.0:

| Director | Known For | Films in DB |
|----------|-----------|-------------|
| **Bapu** | Artistic vision, mythological epics | 49 |
| **K. Viswanath** | Social dramas, cultural depth | ~30 |
| **Dasari Narayana Rao** | Mass entertainer classics | ~40 |

## Famous Directors List (Rating Boost Eligible)

- S. S. Rajamouli
- Ram Gopal Varma
- Trivikram Srinivas
- Puri Jagannadh
- Sukumar
- Koratala Siva
- Boyapati Srinu
- Srikanth Addala
- Vamshi Paidipally
- K. Raghavendra Rao
- B. Gopal
- Krishna Vamsi
- Shankar
- Mani Ratnam
- Sekhar Kammula
- Nag Ashwin
- Sandeep Reddy Vanga
- Prashanth Neel
- E. V. V. Satyanarayana (EVV)
- Jandhyala
- Relangi Narasimha Rao
- Vamsy

## Star Actors List (Rating Boost Eligible)

### Legends (Pre-1990)
- NTR Sr.
- Akkineni Nageswara Rao (ANR)
- Sobhan Babu
- Krishna
- Chiranjeevi

### Superstars (1990-2010)
- Chiranjeevi
- Venkatesh
- Nagarjuna
- Balakrishna
- Mohan Babu

### Current Stars (2010+)
- Mahesh Babu
- Prabhas
- Pawan Kalyan
- Jr. NTR
- Allu Arjun
- Ram Charan
- Ravi Teja
- Vijay Deverakonda
- Nani
- Ram Pothineni

## Rating Distribution (Current - January 7, 2026)

```
< 4:   █ (32)
4.x:   █ (100)
5.x:   ████████████████████ (2,122)
6.x:   ███████████████ (1,571)
7.x:   ████████████████████████ (2,509)
8.x:   ████ (436)
9+:    █ (20)
```

**Total Rated**: 6,770 movies  
**Upcoming/TBD**: 3 movies  
**Average Rating**: ~6.65  
**Range**: 3.8 - 9.5

## Landmark Films & Their Ratings

### Masterpieces (9.0+)
| Title | Year | Rating | Significance |
|-------|------|--------|--------------|
| Mayabazar | 1957 | 9.5 | Greatest Indian film ever made |
| RRR | 2022 | 9.2 | Global phenomenon, Oscar winner |
| Baahubali 2 | 2017 | 9.0 | All-time blockbuster |

### Excellent (8.0-8.9)
| Title | Year | Rating | Significance |
|-------|------|--------|--------------|
| Sankarabharanam | 1980 | 8.8 | National Award, music legend |
| Shiva | 1989 | 8.5 | Redefined action cinema |
| Thene Manasulu | 1965 | 8.2 | First Telugu color social film |
| Devadasu | 1953 | 8.2 | Legendary industry milestone |
| Kshana Kshanam | 1991 | 8.1 | RGV cult classic |
| Oopiri | 2016 | 8.0 | Modern critical acclaim |

### Very Good (7.5-7.9)
| Title | Year | Rating | Significance |
|-------|------|--------|--------------|
| Sri Krishna Rayabaram | 1960 | 7.8 | Mythological masterpiece |
| Shankar Dada M.B.B.S. | 2004 | 7.5 | Blockbuster remake |
| Appula Appa Rao | 1992 | 7.5 | Cult EVV comedy |
| Kula Gothralu | 1961 | 7.5 | National Award winner |
| Sneham | 1977 | 7.5 | Bapu classic |

## Manual Review Corrections (2026)

### Batch 1: Critical Adjustments
| Title | Year | Before | After | Reason |
|-------|------|--------|-------|--------|
| Shiva | 1989 | 5.8 | 8.5 | Landmark film, redefined action |
| Oopiri | 2016 | 5.5 | 8.0 | IMDb 8.0, modern classic |
| Shankar Dada M.B.B.S. | 2004 | 5.5 | 7.5 | Massive blockbuster |
| Appula Appa Rao | 1992 | 5.8 | 7.5 | Most popular Telugu comedy |
| Kula Gothralu | 1961 | 6.5 | 7.5 | National Award winner |

### Batch 2: Historical Milestones
| Title | Year | Before | After | Reason |
|-------|------|--------|-------|--------|
| Thene Manasulu | 1965 | 6.5 | 8.2 | First color social film, launched Krishna |
| Sri Krishna Rayabaram | 1960 | 6.5 | 7.8 | Legendary mythological, famous padyams |
| Sneham | 1977 | 6.5 | 7.5 | Bapu artistic benchmark |
| Pekata Papa Rao | 1993 | 6.0 | 7.2 | Highly successful Rajendra Prasad comedy |

### Batch 3: Commercial Hits
| Title | Year | Before | After | Reason |
|-------|------|--------|-------|--------|
| Peddannayya | 1997 | 6.0 | 7.0 | Balakrishna commercial success |
| Asadhyudu | 1968 | 6.5 | 7.0 | Trendsetting spy thriller |
| April 1 Vidudala | 1991 | 6.0 | 7.2 | Cult classic comedy |
| Amma Rajinama | 1998 | 6.0 | 7.0 | Respected social drama |

### Batch 4: Bapu Films Boost
All 49 Bapu-directed films guaranteed minimum 7.0:
- Mana Voori Pandavulu: 6.3 → 7.0
- Toorpu Velle Railu: 6.0 → 7.0
- Radha Gopalam: 5.5 → 7.0
- Srinatha Kavi Sarvabhowmudu: 5.8 → 7.0
- *And 5 more films*

### Inflated Ratings Reduced
| Title | Year | Before | After | Reason |
|-------|------|--------|-------|--------|
| Gangotri | 2003 | 7.5 | 5.5 | Commercial hit but mediocre reviews |
| First Day First Show | 2022 | 7.5 | 4.5 | Critically panned |
| Superman | 1980 | 7.5 | 5.0 | Kitsch value only |
| Malini & Co. | 2015 | 9.5 | 5.5 | Average film, inflated AI rating |

### Data Integrity Fixes
- **Naadi Aada Janme (1965)**: Language corrected from English → Telugu
- **Leelamahal Centre**: Merged duplicate entries
- **Sahakutumbaanaam (2026)**: Marked as upcoming/TBD
- **Man Of The Match (2026)**: Marked as upcoming/TBD
- **Shashtipoorthi (2025)**: Marked as upcoming/TBD

## Database Schema

### movies table
```sql
our_rating DECIMAL(3,1)  -- Editorial rating (primary)
avg_rating DECIMAL(3,1)  -- TMDB rating (reference)
rating_source VARCHAR     -- 'manual', 'cross_ref', 'smart', 'ai', 'default'
is_classic BOOLEAN       -- Classic status flag
is_blockbuster BOOLEAN   -- Blockbuster status flag
is_underrated BOOLEAN    -- Underrated gem flag
```

### movie_reviews table
```sql
overall_rating DECIMAL(3,1)  -- Synced with movies.our_rating
dimensions_json JSONB        -- Contains breakdown scores
  → verdict.final_rating     -- Synced with our_rating
  → story_screenplay.story_score
  → direction_technicals.direction_score
  → direction_technicals.music_score
  → direction_technicals.cinematography_score
  → performances.lead_actors[].score
```

## UI Display Logic

### reviews/page.tsx (Listing)
```typescript
import { getDisplayRating } from "@/lib/ratings/editorial-rating";

// All movie cards use centralized rating logic
<span>{getDisplayRating(movie).toFixed(1)}</span>
```

### reviews/[slug]/page.tsx (Detail)
```typescript
import { getDisplayRating, getRatingCategory, getCategoryLabel } from "@/lib/ratings/editorial-rating";

const displayRating = isUpcoming ? 0 : getDisplayRating(movie);
const category = getRatingCategory(displayRating);
const label = getCategoryLabel(category); // "Masterpiece", "Excellent", etc.
```

## Breakdown Score Calibration

When overall rating is updated, breakdown scores are calibrated:

1. Calculate average of all breakdown scores
2. Compute delta = new_overall - avg_breakdown
3. Apply delta to each score (capped at 1.0-10.0)
4. Round to 1 decimal place

**Example**: If overall is updated from 6.0 to 8.0:
- Story score 6.5 → 8.5
- Direction score 5.8 → 7.8
- Music score 6.0 → 8.0

## Anomaly Detection

The system flags movies for manual review when:

1. **Classics rated below 7.0** - May need boost
2. **Non-notables rated 9.0+** - May be inflated
3. **TMDB discrepancy > 2.0** - Needs validation
4. **Ratings below 4.0** - Verify accuracy

### Current Anomaly Status
- Very low ratings (<4.5): 29 movies (verified accurate)
- Large TMDB discrepancies: 43 movies (most are old films where TMDB is unreliable)
- Category mismatches: 0 (all resolved)

## API Response

All API endpoints return `our_rating`:

```json
{
  "id": "uuid",
  "title_en": "Movie Title",
  "our_rating": 7.5,
  "avg_rating": 6.8,
  "is_classic": true,
  "is_blockbuster": false
}
```

## Future Enhancements

1. **User Voting Integration**: Weight user votes with critic scores
2. **Temporal Decay**: Adjust ratings for films that age poorly
3. **Re-release Impact**: Update ratings when films are re-evaluated
4. **Regional Variations**: Support for different rating preferences by region
5. **AI Re-analysis**: Periodic re-evaluation using newer AI models

---

## Changelog

### v2.3 (January 7, 2026) - Complete Manual Review
- **Second batch of manual corrections applied**:
  - Thene Manasulu (1965): 6.5 → 8.2 (Historic first Telugu color social film)
  - Sri Krishna Rayabaram (1960): 6.5 → 7.8 (Mythological masterpiece)
  - Sneham (1977): 6.5 → 7.5 (Bapu classic)
  - Pekata Papa Rao (1993): 6.0 → 7.2 (Popular Rajendra Prasad comedy)
  - Peddannayya (1997): 6.0 → 7.0 (Balakrishna commercial hit)
  - Asadhyudu (1968): 6.5 → 7.0 (Trendsetting spy thriller)
  - Ramba Rambabu (1990): 6.0 → 6.5 (Popular comedy)
- **Bapu Films**: All 49 Bapu-directed films guaranteed minimum 7.0
- **Upcoming/TBD**: Marked Man Of The Match, Shashtipoorthi as TBD
- **Coverage**: 99.96% (6,770 of 6,773 movies rated)

### v2.2 (January 7, 2026) - Manual Review Updates
- Applied manual review corrections for 11 landmark films
- **Severe Under-ratings Fixed**:
  - Shiva (1989): 6.5 → 8.5 (Landmark RGV film)
  - Oopiri (2016): 6.5 → 8.0 (IMDb 8.0, critically acclaimed)
  - Shankar Dada M.B.B.S. (2004): 6.0 → 7.5 (Blockbuster remake)
  - Appula Appa Rao (1992): 6.0 → 7.5 (Cult EVV comedy)
  - Kula Gothralu (1961): 6.5 → 7.5 (National Award winner)
- **Notable Hits Fixed**:
  - April 1 Vidudala (1991): 6.0 → 7.2 (Classic comedy)
  - Kshemamga Velli Labhamga Randi (2000): 5.5 → 6.8
  - Amma Rajinama (1998): 6.0 → 7.0
  - Sriramachandrulu (2003): 5.5 → 6.5
- **Data Integrity**: Fixed language for Naadi Aada Janme, marked Sahakutumbaanaam as upcoming
- **Smart Default Logic Refined**:
  - Added landmark title patterns (Shankar Dada, Shiva, Khaidi, etc.)
  - Added comedy era directors (EVV, Jandhyala) with higher base ratings
  - Improved post-2000 modern film handling

### v2.1 (January 7, 2026) - Full Revalidation
- **Full revalidation of all 6,773 movies**
- Coverage increased from 74% to 100%
- Applied 1,650+ new ratings to previously unrated movies
- Adjusted 3 low-rated classics (boosted to 7.5)
- Synced 4,291 reviews with updated movie ratings
- Identified 43 movies with large TMDB discrepancies
- Flagged 29 very low-rated movies for review
- Updated documentation with current statistics

### v2.0 (January 2026)
- Applied 2026 industry standards review
- Upgraded 3 classics (Sankarabharanam, Devadasu, Kshana Kshanam)
- Reduced 4 inflated ratings
- Increased 4 underrated films
- Merged duplicate entries (Leela Mahal Center)
- Added comprehensive documentation

### v1.0 (December 2025)
- Initial AI-generated ratings
- Basic cross-reference with TMDB
- Breakdown score calibration
