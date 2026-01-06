# Visual Intelligence Specification

## Overview

The Visual Intelligence system provides archival-grade poster handling for the Telugu movie review portal. It implements a 3-tier visual classification system that ensures transparent provenance and honest representation of movie visuals.

## Core Principles

1. **Never generate AI/fake posters** - All visuals must be authentic
2. **Never overwrite existing valid poster data** - All operations are additive
3. **Transparent visual provenance** - Users know exactly what they're seeing
4. **Respect for classic films** - Archive cards honor films without available posters

## Visual Tier System

### Tier 1: Original Posters (Confidence 0.9-1.0)

Official movie posters from verified sources.

**Sources:**
- TMDB (The Movie Database)
- IMDB
- Official studio releases
- Verified Wikipedia/Wikimedia uploads

**Visual Type:** `original_poster`

**Display:** Green checkmark badge indicating "Verified"

### Tier 2: Archival Visuals (Confidence 0.6-0.8)

Historical archival materials that represent the film authentically.

**Sources:**
- Film stills from verified archives
- Magazine advertisements
- Song book covers
- Newspaper clippings
- Cassette/audio covers

**Visual Types:**
- `archival_still`
- `magazine_ad`
- `song_book_cover`
- `newspaper_clipping`
- `cassette_cover`

**Display:** Amber film icon badge indicating "Archival"

### Tier 3: Archive Reference Cards (Confidence 0.3-0.5)

Reference cards displayed when no authentic visual is available.

**Visual Types:**
- `archive_card`
- `placeholder`

**Display:** Gray archive icon with film information

## Database Schema

### Movies Table Extensions

```sql
-- Visual confidence score (0.0-1.0)
poster_confidence DECIMAL(3,2) DEFAULT NULL

-- Visual type classification
poster_visual_type TEXT DEFAULT NULL
  CHECK (poster_visual_type IN (
    'original_poster', 
    'archival_still', 
    'magazine_ad', 
    'song_book_cover', 
    'newspaper_clipping', 
    'cassette_cover', 
    'archive_card', 
    'placeholder'
  ))

-- Archive card data (JSON)
archive_card_data JSONB DEFAULT NULL

-- Verification tracking
visual_verified_at TIMESTAMPTZ DEFAULT NULL
visual_verified_by TEXT DEFAULT NULL
```

### Archive Card Data Structure

```typescript
interface ArchiveCardData {
  title: string;
  year: number;
  lead_actor?: string;
  studio?: string;
  archive_reason: 'pre_poster_era' | 'lost_media' | 'no_digital_source' | 'regional_release';
  verified_limitation: boolean;
  metadata_source?: string;
  notes?: string;
}
```

## Archive Reasons

| Reason | Description | Typical Era |
|--------|-------------|-------------|
| `pre_poster_era` | Film predates theatrical poster marketing | Pre-1950s |
| `lost_media` | Original posters have been lost | 1950s-1970s |
| `no_digital_source` | Physical posters exist but aren't digitized | 1960s-1980s |
| `regional_release` | Limited release without marketing materials | Any era |

## Confidence Calculation

### Formula

```
confidence = tierBaseRange + (sourceQualityScore * rangeSpan)
```

### Source Quality Scoring

**Tier 1 Sources:**
- TMDB: 1.0
- IMDB: 0.9
- Other verified: 0.7

**Tier 2 Sources:**
- Film Heritage Foundation: 1.0
- Wikimedia Commons: 0.9
- Internet Archive: 0.8
- Manual archival: 0.5

**Tier 3 Sources:**
- Proper archive card: 0.8
- Placeholder: 0.3

## Visual Confidence in Recommendations

When visual confidence boost is enabled:

```
displayRank = relevanceScore * (1 + (confidence - 0.3) / 0.7 * 0.1)
```

This provides up to 10% ranking boost for movies with high visual confidence.

## Components

### VisualConfidenceBadge

Displays visual provenance indicator.

```tsx
<VisualConfidenceBadge
  tier={1}
  visualType="original_poster"
  confidence={0.95}
  source="tmdb"
  position="top-right"
/>
```

### ArchiveCard

Displays reference card for Tier 3 movies.

```tsx
<ArchiveCard
  data={archiveCardData}
  size="md"
  showDetails={true}
/>
```

## Scripts

| Script | Purpose |
|--------|---------|
| `backfill-visual-confidence.ts` | Calculate confidence for all movies |
| `validate-archival-visuals.ts` | Validate and report on visual quality |

## Usage

### Calculating Visual Confidence

```typescript
import { calculateVisualConfidence } from '@/lib/visual-intelligence';

const result = await calculateVisualConfidence({
  posterUrl: movie.poster_url,
  posterSource: movie.poster_source,
  releaseYear: movie.release_year,
  validateUrl: true,
});

// result.tier, result.confidence, result.visualType
```

### Generating Archive Cards

```typescript
import { generateArchiveCardData } from '@/lib/visual-intelligence';

const cardData = generateArchiveCardData({
  id: movie.id,
  title_en: movie.title_en,
  release_year: movie.release_year,
  hero: movie.hero,
  director: movie.director,
  poster_url: movie.poster_url,
});
```

### Applying Visual Boost to Recommendations

```typescript
import { applyVisualConfidenceBoost } from '@/lib/movies/similarity-engine';

const boostedSections = applyVisualConfidenceBoost(sections, {
  confidenceThreshold: 0.3,
  maxBoostFactor: 0.1,
  boostSectionPriority: true,
});
```

## Migration Path

1. Run schema migration: `005-add-visual-intelligence.sql`
2. Execute backfill: `npx tsx scripts/backfill-visual-confidence.ts --dry-run`
3. Review results and run without `--dry-run`
4. Validate: `npx tsx scripts/validate-archival-visuals.ts`

## Future Enhancements

- Integration with Internet Archive API for Tier 2 sourcing
- Automated detection of poster quality/resolution
- Manual verification workflow for archive cards
- Crowdsourced archival visual contributions

