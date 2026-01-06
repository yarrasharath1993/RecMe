# Smart Review Specification

## Overview

The Smart Review system automatically derives structured review fields from movie metadata and existing review content. It enriches the review experience while preserving original review text.

## Core Principles

1. **Derive, don't invent** - All data comes from existing metadata
2. **Preserve original reviews** - Smart fields are additive
3. **Flag for human review** - Uncertain derivations are marked
4. **Provide confidence scores** - Users know how reliable the data is

## Smart Review Fields

### SmartReviewFields Interface

```typescript
interface SmartReviewFields {
  why_to_watch: string[];      // Reasons to watch this movie
  why_to_skip: string[];       // Potential reasons to skip
  critics_pov: string | null;   // Critical perspective
  audience_pov: string | null;  // Audience perspective
  legacy_status: LegacyStatus;  // Cultural status
  mood_suitability: string[];   // Suitable moods
  content_warnings: string[];   // Content warnings
  best_of_tags: BestOfTags;     // Best-of flags
  era_significance: string | null; // Era significance
  derivation_confidence: number; // 0-1 confidence score
}
```

### Field Derivation Sources

| Field | Primary Source | Secondary Source | Confidence |
|-------|---------------|------------------|------------|
| `why_to_watch` | Review strengths | Genre patterns | Medium-High |
| `why_to_skip` | Review weaknesses | Certification | Low-Medium |
| `critics_pov` | Review summary | Verdict | High |
| `audience_pov` | Dimension scores | Rating | Medium |
| `legacy_status` | Classification tags | Era + rating | Medium |
| `mood_suitability` | Audience signals | Genre mapping | High |
| `content_warnings` | Certification | Genre inference | Medium |
| `best_of_tags` | Filmography comparison | Rating delta | Requires query |
| `era_significance` | Era + classification | Cultural tags | Low |

## Legacy Status Types

| Status | Description | Indicators |
|--------|-------------|------------|
| `cult_classic` | Small but devoted fanbase | `is_cult` flag |
| `forgotten_gem` | Quality film that didn't get recognition | `is_underrated` + high rating |
| `landmark` | Industry-changing or culturally significant | `is_classic` + `is_blockbuster` |
| `mainstream` | Popular and well-known | `is_blockbuster` only |

## Content Warning Categories

- `violence` - Violent content
- `gore` - Graphic violence
- `language` - Strong language
- `sexual_content` - Sexual themes
- `nudity` - Nudity
- `substance_use` - Drug/alcohol use
- `frightening_scenes` - Horror elements
- `mature_themes` - Adult themes
- `discrimination` - Discriminatory content
- `suicide_self_harm` - Self-harm themes

## Mood Suitability Types

- `feel-good` - Uplifting, positive
- `intense` - Gripping, tense
- `emotional` - Touching, moving
- `thought-provoking` - Intellectual
- `light-hearted` - Fun, casual
- `romantic` - Love stories
- `thrilling` - Exciting, suspenseful
- `nostalgic` - Classic feel
- `inspirational` - Motivating
- `dark` - Serious, heavy
- `action-packed` - High energy
- `family-friendly` - All ages

## Best-of Tags

```typescript
interface BestOfTags {
  actor_best: boolean;    // Among lead actor's best
  director_best: boolean; // Among director's best
  music_best: boolean;    // Among music director's best
}
```

### Best-of Determination

A movie qualifies as "best" when:
1. It is the highest-rated film in the person's filmography, OR
2. Its rating exceeds the person's average by more than 1.0 points

## Database Schema

```sql
-- Smart review JSONB storage
smart_review JSONB DEFAULT NULL

-- Derivation timestamp
smart_review_derived_at TIMESTAMPTZ DEFAULT NULL

-- Human review flag
needs_human_review BOOLEAN DEFAULT false
```

## Derivation Confidence

### Confidence Factors

| Factor | Weight |
|--------|--------|
| Has review data | 0.30 |
| Has ratings | 0.20 |
| Has genres | 0.15 |
| Has classification tags | 0.15 |
| Has filmography stats | 0.10 |
| Has derived content | 0.10 |

### Confidence Thresholds

- **High (0.7+)**: Data is reliable, minimal human review needed
- **Medium (0.5-0.7)**: Some fields may need verification
- **Low (<0.5)**: Significant human review recommended

## Fields Needing Human Review

The following fields are automatically flagged:

1. `era_significance` - Often speculative
2. `legacy_status` - Subjective assessment
3. `content_warnings` - Safety-critical
4. `why_to_skip` - Can be controversial

## Genre-Based Derivations

### Genre to Content Warnings

| Genre | Warnings |
|-------|----------|
| Horror | `frightening_scenes`, `violence` |
| Thriller | `violence`, `mature_themes` |
| Action | `violence` |
| Crime | `violence`, `mature_themes` |
| War | `violence`, `gore` |

### Genre to Mood Suitability

| Genre | Moods |
|-------|-------|
| Action | `action-packed`, `intense`, `thrilling` |
| Drama | `emotional`, `thought-provoking` |
| Comedy | `light-hearted`, `feel-good` |
| Romance | `romantic`, `emotional` |
| Horror | `dark`, `intense` |
| Family | `family-friendly`, `feel-good` |

### Genre to Watch Reasons

| Genre | Reasons |
|-------|---------|
| Action | "Thrilling action sequences" |
| Drama | "Emotionally engaging story" |
| Comedy | "Guaranteed laughs" |
| Romance | "Heartwarming love story" |

## Usage

### Deriving Smart Review

```typescript
import { deriveSmartReviewFields } from '@/lib/reviews/smart-review-derivation';

const input: SmartReviewDerivationInput = {
  movie: { /* movie data */ },
  review: { /* optional review data */ },
  actorStats: { /* optional filmography stats */ },
};

const smartReview = deriveSmartReviewFields(input);
```

### Batch Processing

```typescript
import { batchDeriveSmartReviews } from '@/lib/reviews/smart-review-derivation';

const result = await batchDeriveSmartReviews(movieIds, {
  batchSize: 10,
});
```

### Checking Fields for Review

```typescript
import { getFieldsNeedingReview } from '@/lib/reviews/smart-review-derivation';

const flaggedFields = getFieldsNeedingReview(smartReview);
// ['era_significance', 'legacy_status', ...]
```

## Scripts

| Script | Purpose |
|--------|---------|
| `backfill-smart-reviews.ts` | Derive smart reviews for all movies |

### Usage

```bash
# Dry run
npx tsx scripts/backfill-smart-reviews.ts --dry-run

# Process with limit
npx tsx scripts/backfill-smart-reviews.ts --limit 100

# Force re-derive
npx tsx scripts/backfill-smart-reviews.ts --force
```

## Migration Path

1. Run schema migration: `006-add-smart-review-fields.sql`
2. Execute backfill: `npx tsx scripts/backfill-smart-reviews.ts --dry-run`
3. Review results and run without `--dry-run`
4. Review flagged entries in admin panel

## Future Enhancements

- AI-assisted derivation for richer content
- Crowd-sourced verification workflow
- A/B testing of derived vs manual content
- User feedback integration
- Cross-language content derivation

