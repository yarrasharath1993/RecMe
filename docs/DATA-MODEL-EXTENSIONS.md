# Data Model Extensions (January 2026)

## Overview

This document describes the database schema extensions added to support Visual Intelligence and Smart Review enrichment features. All changes are additive and backward-compatible.

## Design Principles

1. **Additive Only** - No existing columns or tables are modified
2. **Null-Safe** - All new columns have defaults or allow NULL
3. **Backward Compatible** - Existing queries continue to work
4. **Indexed for Performance** - Key columns are indexed

## Movies Table Extensions

### Visual Intelligence Fields

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `poster_confidence` | DECIMAL(3,2) | NULL | Visual confidence score (0.0-1.0) |
| `poster_visual_type` | TEXT | NULL | Visual type classification |
| `archive_card_data` | JSONB | NULL | Archive card data for Tier 3 |
| `visual_verified_at` | TIMESTAMPTZ | NULL | When visual was verified |
| `visual_verified_by` | TEXT | NULL | Who/what verified the visual |

### Visual Type Constraint

```sql
CHECK (poster_visual_type IN (
  'original_poster',    -- Tier 1
  'archival_still',     -- Tier 2
  'magazine_ad',        -- Tier 2
  'song_book_cover',    -- Tier 2
  'newspaper_clipping', -- Tier 2
  'cassette_cover',     -- Tier 2
  'archive_card',       -- Tier 3
  'placeholder'         -- Tier 3
))
```

### Indexes

```sql
CREATE INDEX idx_movies_poster_visual_type ON movies(poster_visual_type);
CREATE INDEX idx_movies_poster_confidence ON movies(poster_confidence);
```

## Movie Reviews Table Extensions

### Smart Review Fields

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `smart_review` | JSONB | NULL | Structured smart review data |
| `smart_review_derived_at` | TIMESTAMPTZ | NULL | Derivation timestamp |
| `needs_human_review` | BOOLEAN | false | Flag for human review |

### Smart Review JSONB Structure

```json
{
  "why_to_watch": ["string"],
  "why_to_skip": ["string"],
  "critics_pov": "string | null",
  "audience_pov": "string | null",
  "legacy_status": "cult_classic | forgotten_gem | landmark | mainstream | null",
  "mood_suitability": ["string"],
  "content_warnings": ["string"],
  "best_of_tags": {
    "actor_best": "boolean",
    "director_best": "boolean",
    "music_best": "boolean"
  },
  "era_significance": "string | null",
  "derivation_confidence": "number"
}
```

### Indexes

```sql
CREATE INDEX idx_movie_reviews_needs_human_review 
ON movie_reviews(needs_human_review) WHERE needs_human_review = true;

CREATE INDEX idx_movie_reviews_smart_review 
ON movie_reviews((smart_review IS NOT NULL));
```

## Migration Files

### 005-add-visual-intelligence.sql

Adds visual confidence and archival tier support:
- poster_confidence
- poster_visual_type (with constraint)
- archive_card_data
- visual_verified_at
- visual_verified_by

### 006-add-smart-review-fields.sql

Adds smart review enrichment support:
- smart_review
- smart_review_derived_at
- needs_human_review

## TypeScript Types

### Archive Card Data

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

### Smart Review Fields

```typescript
interface SmartReviewFields {
  why_to_watch: string[];
  why_to_skip: string[];
  critics_pov: string | null;
  audience_pov: string | null;
  legacy_status: LegacyStatus;
  mood_suitability: string[];
  content_warnings: string[];
  best_of_tags: BestOfTags;
  era_significance: string | null;
  derivation_confidence: number;
}
```

## Query Examples

### Get Movies by Visual Tier

```sql
-- Tier 1: High confidence posters
SELECT * FROM movies 
WHERE poster_confidence >= 0.9;

-- Tier 3: Needs archive cards
SELECT * FROM movies 
WHERE poster_visual_type IN ('archive_card', 'placeholder')
  OR poster_confidence < 0.6;
```

### Get Reviews Needing Human Review

```sql
SELECT m.title_en, mr.smart_review
FROM movie_reviews mr
JOIN movies m ON mr.movie_id = m.id
WHERE mr.needs_human_review = true;
```

### Get Movies with Archive Cards

```sql
SELECT title_en, archive_card_data
FROM movies
WHERE archive_card_data IS NOT NULL;
```

## Data Flow

```
┌─────────────────┐      ┌─────────────────┐
│  Existing Data  │      │  External APIs  │
│  (poster_url)   │      │  (TMDB, etc.)   │
└────────┬────────┘      └────────┬────────┘
         │                        │
         ▼                        ▼
   ┌─────────────────────────────────────┐
   │     Visual Confidence Calculator    │
   └────────────────┬────────────────────┘
                    │
                    ▼
   ┌─────────────────────────────────────┐
   │         New Columns Added           │
   │  ┌───────────────────────────────┐  │
   │  │ poster_confidence             │  │
   │  │ poster_visual_type            │  │
   │  │ archive_card_data             │  │
   │  │ visual_verified_at/by         │  │
   │  └───────────────────────────────┘  │
   └─────────────────────────────────────┘
```

## Backward Compatibility

### Existing Queries

All existing queries continue to work:
- `poster_url` remains unchanged
- `poster_source` remains unchanged
- New columns default to NULL

### Gradual Adoption

Components can progressively adopt visual intelligence:
1. Check if `poster_confidence` exists
2. Use new UI components if available
3. Fall back to existing behavior otherwise

```typescript
// Example: Progressive enhancement
const tier = movie.poster_confidence 
  ? getTierFromConfidence(movie.poster_confidence)
  : null;

if (tier && tier === 3 && movie.archive_card_data) {
  return <ArchiveCard data={movie.archive_card_data} />;
}
return <MoviePoster url={movie.poster_url} />;
```

## Performance Considerations

### Index Usage

- `poster_visual_type` index for filtering by tier
- `poster_confidence` index for sorting by quality
- `needs_human_review` partial index for review queue

### JSONB Queries

For frequent JSONB queries, consider adding expression indexes:

```sql
-- If frequently querying by legacy_status
CREATE INDEX idx_smart_review_legacy 
ON movie_reviews((smart_review->>'legacy_status'));
```

## Rollback Procedure

If rollback is needed, columns can be dropped safely:

```sql
ALTER TABLE movies DROP COLUMN IF EXISTS poster_confidence;
ALTER TABLE movies DROP COLUMN IF EXISTS poster_visual_type;
ALTER TABLE movies DROP COLUMN IF EXISTS archive_card_data;
ALTER TABLE movies DROP COLUMN IF EXISTS visual_verified_at;
ALTER TABLE movies DROP COLUMN IF EXISTS visual_verified_by;

ALTER TABLE movie_reviews DROP COLUMN IF EXISTS smart_review;
ALTER TABLE movie_reviews DROP COLUMN IF EXISTS smart_review_derived_at;
ALTER TABLE movie_reviews DROP COLUMN IF EXISTS needs_human_review;
```

## Future Schema Considerations

Potential future extensions:
- `visual_alternatives` (JSONB): Multiple visual options per movie
- `visual_contributor_id`: Link to contributor who provided visual
- `smart_review_version`: Version tracking for derivation algorithm
- `user_feedback_score`: Aggregated user feedback on derived content

