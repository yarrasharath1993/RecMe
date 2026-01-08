# TeluguVibes Intelligence Capabilities

This document provides a comprehensive audit of all data intelligence, enrichment, validation, and pipeline capabilities in the TeluguVibes platform.

## Table of Contents

1. [Data Sources](#data-sources)
2. [Enrichment Scripts](#enrichment-scripts)
3. [Validation Systems](#validation-systems)
4. [Review Generation](#review-generation)
5. [Parallel Execution](#parallel-execution)
6. [Compliance Layer](#compliance-layer)
7. [Admin APIs](#admin-apis)

---

## Data Sources

### Tier 1: Primary Movie Data APIs

| Source | File | What it Provides | Rate Limit |
|--------|------|------------------|------------|
| **TMDB** | `lib/sources/fetchers/tmdb-fetcher.ts` | Cast, crew, ratings, posters, backdrops | 40 req/sec |
| **OMDb** | `lib/sources/fetchers/omdb-fetcher.ts` | IMDB/RT/Metacritic ratings, awards | 10 req/sec |
| **Wikidata** | `lib/sources/fetchers/wikidata-awards-fetcher.ts` | Structured awards, facts (SPARQL) | 50 req/sec |
| **Wikipedia** | `lib/sources/fetchers/wikipedia-fetcher.ts` | Plot, reception, legacy, sections | 100 req/sec |
| **Google KG** | `lib/sources/fetchers/google-kg-fetcher.ts` | Entity descriptions, context | 10 req/sec |

### Tier 2: Archival and Image Sources

| Source | File | What it Provides | License |
|--------|------|------------------|---------|
| **Wikimedia Commons** | `scripts/enrich-waterfall.ts` | CC-licensed archival images | CC-BY-SA |
| **Internet Archive** | `scripts/enrich-waterfall.ts` | Public domain materials | Public Domain |
| **NFAI** | `lib/visual-intelligence/archival-sources.ts` | Government film archive stills | Archive License |
| **Letterboxd** | `scripts/enrich-waterfall.ts` | Community posters | Fair Use |
| **Cinemaazi** | `scripts/enrich-waterfall.ts` | Indian film archive | Archive License |

### Tier 3: Telugu Entertainment Sources

| Source | File | What it Provides | Status |
|--------|------|------------------|--------|
| **MovieBuff** | `lib/sources/fetchers/moviebuff-fetcher.ts` | Cast, crew, reviews | NEW |
| **JioSaavn** | `lib/sources/fetchers/jiosaavn-fetcher.ts` | Music, songs, albums | NEW |
| **Idlebrain** | `lib/writer-intelligence/signal-extractor.ts` | Reviews, gallery | Configured |
| **GreatAndhra** | `lib/writer-intelligence/signal-extractor.ts` | Reviews, opinions | Configured |
| **123Telugu** | `lib/writer-intelligence/signal-extractor.ts` | Reviews, news | Configured |
| **Filmibeat** | `lib/writer-intelligence/signal-extractor.ts` | Glamour, gossip | Configured |

### Tier 4: News Sources

| Source | File | What it Provides |
|--------|------|------------------|
| **Sakshi** | `lib/writer-intelligence/signal-extractor.ts` | News, RSS feed |
| **Eenadu** | `lib/writer-intelligence/signal-extractor.ts` | Traditional news |
| **Andhra Jyothy** | `lib/writer-intelligence/signal-extractor.ts` | Editorials |
| **NewsData.io** | `lib/news-sources.ts` | Telugu news aggregation |

---

## Enrichment Scripts

### Core Enrichment Pipeline

| Script | Purpose | Command |
|--------|---------|---------|
| `enrich-waterfall.ts` | 9-source cascading enrichment | `npx tsx scripts/enrich-waterfall.ts` |
| `enrich-master.ts` | Master orchestrator for all enrichments | `npx tsx scripts/enrich-master.ts` |
| `enrich-cast-crew.ts` | Cast/crew enrichment from TMDB | `npx tsx scripts/enrich-cast-crew.ts` |
| `enrich-synopsis-ai.ts` | AI-generated synopses | `npx tsx scripts/enrich-synopsis-ai.ts` |
| `enrich-awards-wikipedia.ts` | Awards extraction | `npx tsx scripts/enrich-awards-wikipedia.ts` |
| `enrich-images-fast.ts` | Fast parallel image fetch | `npx tsx scripts/enrich-images-fast.ts` |
| `enrich-from-omdb.ts` | OMDB ratings/awards | `npx tsx scripts/enrich-from-omdb.ts` |
| `enrich-from-wikidata.ts` | Wikidata structured data | `npx tsx scripts/enrich-from-wikidata.ts` |
| `enrich-from-wikipedia.ts` | Wikipedia sections | `npx tsx scripts/enrich-from-wikipedia.ts` |
| `enrich-celebrity-waterfall.ts` | Celebrity data enrichment | `npx tsx scripts/enrich-celebrity-waterfall.ts` |

### Waterfall Strategy

The waterfall enrichment follows this priority order:

```
1. TMDB (highest trust, official API)
2. Wikipedia (curated content, CC-BY-SA)
3. OMDB (IMDB data, ratings)
4. Wikidata (structured facts, CC0)
5. Google KG (entity context)
6. Regional sources (Telugu-specific)
7. Archival sources (historical images)
8. AI Fallback (Groq LLM for gaps)
```

---

## Validation Systems

### Multi-Source Validator

**File:** `lib/validation/multi-source-validator.ts`

Cross-validates movie data with consensus-based auto-fix:
- 3+ sources agree with 80%+ confidence → Auto-fix
- Otherwise → Flag for manual review

```typescript
import { validateMovie, validateBatch } from '@/lib/validation/multi-source-validator';

const result = await validateMovie(movieId);
```

### Conflict Resolution Engine

**File:** `lib/data/conflict-resolution.ts`

Trust matrix for resolving conflicts:

| Field | Priority Order |
|-------|---------------|
| Release Date | Regional → Official → TMDB |
| Cast/Crew | IMDb → Regional → TMDB |
| Synopsis | Wikipedia → Regional → TMDB |
| Ratings | IMDb (50%) + TMDB (30%) + Regional (20%) |
| Box Office | Regional trade → Wikipedia → TMDB |
| Awards | Wikidata → Wikipedia → OMDB |

### Consensus Builder

**File:** `lib/verification/consensus-builder.ts`

Smart verification with auto-resolution:
- Wikipedia title suffixes (e.g., "(film)" removal)
- Date format normalization
- Name alias matching
- Spelling variant detection

### Cast Validator

**File:** `lib/validation/cast-validator.ts`

Validates cast/crew data:
- Name standardization
- Role verification
- Gender detection
- Duplicate detection

---

## Review Generation

### 15-Dimension Review Model

**File:** `lib/reviews/multi-axis-review.ts`

Comprehensive review dimensions:
1. Story & Screenplay
2. Direction
3. Lead Performance
4. Supporting Cast
5. Music & BGM
6. Cinematography
7. Production Values
8. Entertainment Value
9. Emotional Impact
10. Technical Excellence
11. Originality
12. Pacing
13. Dialogues
14. Climax Impact
15. Rewatch Value

### 9-Section Editorial Reviews

**File:** `lib/reviews/editorial-review-generator.ts`

AI-generated review sections:
1. Opening Hook
2. Story Overview
3. Performance Analysis
4. Technical Breakdown
5. Music & Audio
6. Highs & Lows
7. Audience Fit
8. Comparison Context
9. Final Verdict

### Template-Based Reviews

**File:** `lib/reviews/template-reviews.ts`

Fast, template-driven review generation:
- No AI calls needed
- Uses verified facts
- Confidence-boosted from verification data

### Coverage Engine

**File:** `lib/reviews/coverage-engine.ts`

Coverage statistics:
- Movies with reviews
- Movies without reviews
- Review source breakdown (human/AI/template)
- Quality metrics

---

## Parallel Execution

### Execution Controller

**File:** `lib/pipeline/execution-controller.ts`

Features:
- Bounded parallel execution (configurable concurrency)
- Retry with exponential backoff
- Error isolation per task
- Progress tracking

```typescript
import { createExecutionController } from '@/lib/pipeline/execution-controller';

const controller = createExecutionController({
  concurrency: 5,
  maxRetries: 3,
  timeout: 30000,
});

await controller.execute(tasks);
```

### Batch Fetcher

**File:** `lib/verification/batch-fetcher.ts`

Multi-source parallel fetching:
- Per-source rate limiting
- Token bucket algorithm
- Progress callbacks
- Resume capability

### AI Key Manager

**File:** `lib/ai/smart-key-manager.ts`

Multi-provider key rotation:
- Groq, OpenAI, Cohere, HuggingFace
- Automatic failover on rate limits
- Health-based key scoring
- Pre-warmed fallbacks

---

## Compliance Layer

### Overview

**Directory:** `lib/compliance/`

Unified privacy and compliance layer:

| Module | Purpose |
|--------|---------|
| `safe-fetcher.ts` | Rate limiting, ToS compliance, robots.txt |
| `compliance-validator.ts` | License validation, privacy checks |
| `data-reviewer.ts` | Unified data review, consensus |
| `attribution-generator.ts` | Proper source attribution |
| `types.ts` | Type definitions |
| `index.ts` | Unified exports |

### SafeFetcher

```typescript
import { safeFetcher } from '@/lib/compliance';

// Check if fetch is allowed
const canFetch = await safeFetcher.canFetch('tmdb', url);

// Fetch with compliance
const result = await safeFetcher.safeFetch('tmdb', url);
```

### ComplianceValidator

```typescript
import { complianceValidator } from '@/lib/compliance';

// Validate usage rights
const usage = complianceValidator.validateUsage({ source: 'tmdb', url });

// Check privacy
const privacy = complianceValidator.checkPrivacy(data);

// Check content safety
const safety = await complianceValidator.checkContentSafety({ text, source });
```

### DataReviewer

```typescript
import { dataReviewer } from '@/lib/compliance';

// Review movie data from multiple sources
const review = await dataReviewer.reviewMovieData({
  movieId: 'uuid',
  title: 'Movie Title',
  sources: [
    { source: 'tmdb', data: {...}, url: '...' },
    { source: 'wikipedia', data: {...}, url: '...' },
  ],
});
```

### AttributionGenerator

```typescript
import { attributionGenerator } from '@/lib/compliance';

// Generate movie page attributions
const attributions = attributionGenerator.generateMoviePageAttributions(
  'Movie Title',
  '/reviews/movie-slug',
  sources
);
```

### ComplianceGateway

Unified interface for all compliance operations:

```typescript
import { complianceGateway } from '@/lib/compliance';

// Fetch with full compliance checking
const result = await complianceGateway.fetchWithCompliance('tmdb', url, {
  validatePrivacy: true,
  validateSafety: true,
  generateAttribution: true,
});

// Quick compliance check
const quick = complianceGateway.quickCheck('tmdb', data);
```

---

## Admin APIs

### Movie CRUD

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/movies/[id]` | GET | Get movie details |
| `/api/admin/movies/[id]` | PUT | Update movie |
| `/api/admin/movies/[id]` | DELETE | Delete movie |
| `/api/admin/movies/[id]/enrich` | POST | Force enrich movie |

### Review Management

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/reviews/[id]` | GET | Get review details |
| `/api/admin/reviews/[id]` | PUT | Update review |
| `/api/admin/reviews/[id]/regenerate` | POST | Regenerate review |

### Verification

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/verification/[movieId]` | GET | Get verification status |
| `/api/admin/verification/[movieId]` | POST | Run verification |

### Bulk Operations

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/bulk` | POST | Bulk operations |
| `/api/admin/pipeline` | GET | Pipeline status |
| `/api/admin/pipeline` | POST | Pipeline control |
| `/api/admin/pending-reviews` | GET | Movies without reviews |

---

## Dashboard Integration

### Data Intelligence Dashboard v3 (NEW)

**File:** `app/admin/data-intelligence/page.tsx`

**URL:** `/admin/data-intelligence`

The unified command center for all data operations:

**Tabs:**

| Tab | Purpose | Key Features |
|-----|---------|--------------|
| 📊 Overview | Quick actions | Movie search, force enrich, verify, generate reviews |
| ⏳ Pending Reviews | Review queue | Filter by recent/classic/popular, bulk generate |
| 🔌 Sources | Source management | 15+ sources, compliance badges, enable/disable |
| ✏️ Editor | Review editing | 9-section editor, template/AI regeneration |
| ⚡ Pipeline | Pipeline control | Start/stop pipelines, progress monitoring |
| 📦 Bulk | Batch operations | Bulk enrich, verify, generate reviews |
| ✅ Verify | Data verification | Cross-reference, confidence scores |

**Key Actions:**
- Force enrich single movie from selected sources
- Generate reviews (Template or AI method)
- Run data verification with cross-referencing
- Start/stop enrichment pipelines
- Bulk operations on multiple movies
- View and filter pending reviews

**APIs:**
- `GET /api/movies/search?q=&limit=` - Search movies
- `POST /api/admin/movies/[id]/enrich` - Force enrich
- `POST /api/admin/reviews/[id]/regenerate` - Regenerate review
- `POST /api/admin/verification/[movieId]` - Run verification
- `GET /api/admin/pending-reviews?filter=&page=` - Pending reviews
- `POST /api/admin/bulk` - Bulk operations
- `GET/POST /api/admin/pipeline` - Pipeline control

### Visual Intelligence Dashboard

**File:** `app/admin/visual-intelligence/page.tsx`

Features:
- Movie coverage stats
- Review coverage stats
- Visual confidence tiers
- Force fetch CTAs
- Bulk operations

### Coverage Dashboard

**File:** `app/admin/coverage/page.tsx`

Features:
- Language breakdown
- Decade breakdown
- Quality metrics
- Missing data reports

---

## Quick Reference

### CLI Commands

```bash
# Enrich all movies
npx tsx scripts/enrich-master.ts

# Enrich specific movie
npx tsx scripts/enrich-waterfall.ts --movie-id=uuid

# Generate reviews
npx tsx scripts/batch-enrich-reviews.ts --limit=100

# Verify batch
npx tsx scripts/verify-batch.ts --limit=50 --execute

# Validate all
npx tsx scripts/validate-all.ts
```

### Environment Variables

```env
# Primary APIs
TMDB_API_KEY=
OMDB_API_KEY=
GOOGLE_KG_API_KEY=

# AI Providers
GROQ_API_KEY=
OPENAI_API_KEY=

# Database
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# News APIs
NEWSDATA_API_KEY=
GNEWS_API_KEY=
```

