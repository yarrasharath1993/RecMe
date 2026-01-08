# TeluguVibes Enrichment Flows

This document describes the enhanced data enrichment pipelines, including the new sources (MovieBuff, JioSaavn), compliance layer integration, and parallel execution patterns.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Waterfall Enrichment Strategy](#waterfall-enrichment-strategy)
3. [New Data Sources](#new-data-sources)
4. [Compliance Integration](#compliance-integration)
5. [Pipeline Execution](#pipeline-execution)
6. [API Reference](#api-reference)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENRICHMENT PIPELINE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐     │
│  │   Source    │   │ Compliance  │   │  Consensus  │   │   Output    │     │
│  │  Fetchers   │──▶│   Gateway   │──▶│   Builder   │──▶│   Writer    │     │
│  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘     │
│         │                 │                 │                 │             │
│         ▼                 ▼                 ▼                 ▼             │
│    15+ Sources     Rate Limiting      Data Fusion       Database           │
│    (APIs, Web)     ToS Compliance     Validation        Updates            │
│                    Privacy Check      Attribution                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Waterfall Enrichment Strategy

The waterfall strategy tries sources in priority order, stopping when sufficient data is obtained.

### Source Priority (High to Low)

| Priority | Source | Trust Score | Data Types |
|----------|--------|-------------|------------|
| 1 | TMDB | 0.95 | Cast, crew, images, synopsis |
| 2 | Wikipedia | 0.90 | Plot, reception, awards |
| 3 | OMDB | 0.85 | Ratings, runtime, awards |
| 4 | Wikidata | 0.85 | Structured facts, awards |
| 5 | Google KG | 0.80 | Entity context |
| 6 | MovieBuff | 0.75 | Cast, reviews (Telugu focus) |
| 7 | JioSaavn | 0.75 | Music metadata |
| 8 | Idlebrain | 0.70 | Reviews, gallery |
| 9 | GreatAndhra | 0.70 | Reviews, opinions |
| 10 | 123Telugu | 0.65 | Reviews, news |
| 11 | Archive.org | 0.80 | Historical images |
| 12 | AI (Groq) | 0.60 | Fallback generation |

### Waterfall Flow

```typescript
// Simplified waterfall logic
async function enrichMovie(movieId: string): Promise<EnrichmentResult> {
  const movie = await getMovie(movieId);
  const updates: Record<string, unknown> = {};
  
  // Try sources in order until all required fields are filled
  const requiredFields = ['synopsis', 'director', 'hero', 'poster_url'];
  
  for (const source of SOURCES_BY_PRIORITY) {
    // Check compliance
    if (!await safeFetcher.canFetch(source.id, source.url)) {
      continue;
    }
    
    // Fetch from source
    const data = await source.fetch(movie.title_en, movie.release_year);
    
    // Merge data for missing fields
    for (const field of requiredFields) {
      if (!movie[field] && !updates[field] && data[field]) {
        updates[field] = data[field];
      }
    }
    
    // Stop if all required fields are filled
    if (requiredFields.every(f => movie[f] || updates[f])) {
      break;
    }
  }
  
  // Apply updates
  await updateMovie(movieId, updates);
  
  return { movieId, fieldsUpdated: Object.keys(updates) };
}
```

---

## New Data Sources

### MovieBuff Integration

**File:** `lib/sources/fetchers/moviebuff-fetcher.ts`

MovieBuff provides Telugu-specific movie data including cast, crew, and user reviews.

```typescript
import { movieBuffFetcher } from '@/lib/sources/fetchers/moviebuff-fetcher';

// Search and fetch movie
const result = await movieBuffFetcher.fetchMovie('Pushpa 2', 2024);

// Returns:
// - movie: { title, year, synopsis, poster, genre, duration }
// - cast: [{ name, role, character, imageUrl }]
// - crew: [{ name, role, department }]
// - reviews: [{ author, rating, content, date }]
```

**Rate Limit:** 1 req/sec
**License:** Fair Use (with attribution)

### JioSaavn Integration

**File:** `lib/sources/fetchers/jiosaavn-fetcher.ts`

JioSaavn provides music metadata, useful for enriching the music_director field.

```typescript
import { jioSaavnFetcher, fetchMovieSoundtrack } from '@/lib/sources/fetchers/jiosaavn-fetcher';

// Get soundtrack info
const soundtrack = await fetchMovieSoundtrack('RRR', 2022);

// Returns:
// - musicDirector: 'M.M. Keeravani'
// - singers: ['Kala Bhairava', 'Kaala Bhairava', ...]
// - songCount: 8
// - songs: [{ name, singers }]
```

**Rate Limit:** 2 req/sec
**License:** API Terms

### Telugu Entertainment Sites

**File:** `lib/sources/fetchers/telugu-entertainment-fetcher.ts`

Unified fetcher for Idlebrain, GreatAndhra, 123Telugu, and Filmibeat.

```typescript
import { 
  teluguEntertainmentFetcher, 
  fetchTeluguReviews 
} from '@/lib/sources/fetchers/telugu-entertainment-fetcher';

// Get reviews from all Telugu sites
const reviews = await fetchTeluguReviews('Baahubali', 2015);

// Returns array of:
// - source: 'idlebrain' | 'greatandhra' | '123telugu' | 'filmibeat'
// - rating: number (normalized to 10-point scale)
// - verdict: string
// - pros/cons: string[]
// - summary: string
```

---

## Compliance Integration

Every enrichment operation goes through the compliance layer.

### Pre-Fetch Check

```typescript
import { safeFetcher, canFetch } from '@/lib/compliance';

// Check if we can fetch
const compliance = await canFetch('tmdb', url);

if (!compliance.allowed) {
  console.log('Cannot fetch:', compliance.reason);
  console.log('Wait time:', compliance.requiredDelay);
  return;
}

// Safe to proceed
const result = await safeFetcher.safeFetch('tmdb', url);
```

### Full Compliance Flow

```typescript
import { complianceGateway } from '@/lib/compliance';

// Fetch with all checks
const result = await complianceGateway.fetchWithCompliance('tmdb', url, {
  validatePrivacy: true,
  validateSafety: true,
  generateAttribution: true,
});

if (result.fetch.success) {
  console.log('Data:', result.fetch.data);
  console.log('License:', result.fetch.license);
  console.log('Attribution:', result.attribution?.text);
}

console.log('Compliance:', result.compliance);
// { privacyOk: true, safetyOk: true, usageOk: true }
```

### Rate Limiting

Each source has configured rate limits:

```typescript
// Automatic rate limiting
for (const movie of movies) {
  // Rate limiter automatically waits if needed
  const result = await safeFetcher.safeFetch('tmdb', url);
  
  // Check remaining tokens
  const status = safeFetcher.getRateLimitStatus('tmdb');
  console.log('Remaining:', status.remaining);
  console.log('Daily remaining:', status.dailyRemaining);
}
```

---

## Pipeline Execution

### Single Movie Enrichment

**API:** `POST /api/admin/movies/[id]/enrich`

```typescript
// Request
{
  "sources": ["tmdb", "omdb", "wikipedia"],  // or ["all"]
  "dryRun": false
}

// Response
{
  "success": true,
  "movieId": "uuid",
  "movieTitle": "Pushpa 2",
  "results": [
    { "source": "tmdb", "success": true, "fieldsUpdated": ["poster_url", "backdrop_url"] },
    { "source": "omdb", "success": true, "fieldsUpdated": ["runtime"] },
    { "source": "wikipedia", "success": true, "fieldsUpdated": ["synopsis"] }
  ],
  "totalFieldsUpdated": 4
}
```

### Batch Pipeline

**API:** `POST /api/admin/pipeline`

```typescript
// Start pipeline
{
  "action": "start",
  "type": "full_enrich",  // or "images_only", "reviews_only", "verification"
  "options": {
    "limit": 100,
    "language": "Telugu",
    "yearFrom": 2020,
    "concurrency": 5
  }
}

// Response
{
  "success": true,
  "pipelineId": "pipeline-1234567890-abc",
  "totalMovies": 100
}

// Check status
GET /api/admin/pipeline?id=pipeline-1234567890-abc

// Cancel
{
  "action": "cancel",
  "pipelineId": "pipeline-1234567890-abc"
}
```

### Bulk Operations

**API:** `POST /api/admin/bulk`

```typescript
// Bulk enrich
{
  "operation": "enrich",
  "movieIds": ["uuid1", "uuid2", "uuid3"],
  "options": {
    "sources": ["tmdb", "omdb"],
    "dryRun": false,
    "concurrency": 5
  }
}

// Other operations: "verify", "update_field", "regenerate_review", "delete", "tag"
```

---

## API Reference

### Movie CRUD

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/movies/[id]` | GET | Get movie details |
| `/api/admin/movies/[id]` | PUT | Update movie |
| `/api/admin/movies/[id]` | DELETE | Delete movie |
| `/api/admin/movies/[id]/enrich` | POST | Force enrich |

### Review Management

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/reviews/[id]/regenerate` | POST | Regenerate review |

### Verification

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/verification/[movieId]` | GET | Get verification status |
| `/api/admin/verification/[movieId]` | POST | Run verification |

### Bulk & Pipeline

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/bulk` | POST | Execute bulk operation |
| `/api/admin/pipeline` | GET | Get pipeline status |
| `/api/admin/pipeline` | POST | Start/cancel pipeline |

---

## CLI Commands

```bash
# Waterfall enrichment for all movies
npx tsx scripts/enrich-waterfall.ts --limit=100

# Enrich specific movie
npx tsx scripts/enrich-waterfall.ts --movie-id=uuid

# Master orchestrator
npx tsx scripts/enrich-master.ts --type=full

# Images only
npx tsx scripts/enrich-images-fast.ts --missing-only

# Generate reviews
npx tsx scripts/batch-enrich-reviews.ts --limit=50 --type=template

# Verification batch
npx tsx scripts/verify-batch.ts --limit=50 --execute
```

---

## Best Practices

1. **Always use compliance layer** - Never fetch directly, use `safeFetcher`
2. **Respect rate limits** - Let the rate limiter handle delays
3. **Generate attributions** - Track source for each field
4. **Prefer waterfall** - Stop early when data is sufficient
5. **Handle failures gracefully** - Log errors, continue with next source
6. **Monitor pipelines** - Use the dashboard to track progress
7. **Validate before saving** - Use consensus builder for multi-source data

