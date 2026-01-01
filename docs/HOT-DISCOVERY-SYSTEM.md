# Hot & Glamour Discovery System

## Overview

The Hot & Glamour Discovery System automatically discovers, validates, and ranks Telugu/Indian celebrities for the Hot section. It uses metadata-only sources and maintains legal compliance.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOT DISCOVERY PIPELINE                        │
└─────────────────────────────────────────────────────────────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
       ▼                      ▼                      ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Wikidata   │      │    TMDB     │      │   Google    │
│   SPARQL    │      │    API      │      │   Trends    │
└─────────────┘      └─────────────┘      └─────────────┘
       │                      │                      │
       └──────────────────────┼──────────────────────┘
                              │
                              ▼
                 ┌─────────────────────┐
                 │  Entity Discovery   │
                 │  (lib/hot/entity-   │
                 │   discovery.ts)     │
                 └─────────────────────┘
                              │
                              ▼
                 ┌─────────────────────┐
                 │  Social Resolution  │
                 │  (lib/social/       │
                 │   source-adapters)  │
                 └─────────────────────┘
                              │
                              ▼
                 ┌─────────────────────┐
                 │  Ranking Engine     │
                 │  (lib/hot/ranking-  │
                 │   engine.ts)        │
                 └─────────────────────┘
                              │
                              ▼
                 ┌─────────────────────┐
                 │  Hot Candidates     │
                 │  (v_hot_glamour_    │
                 │   candidates view)  │
                 └─────────────────────┘
```

## Components

### 1. Entity Discovery (`lib/hot/entity-discovery.ts`)

Automatically discovers Telugu celebrities from:
- **Wikidata**: SPARQL queries for actresses/models/anchors
- **TMDB**: Popular actresses search

```bash
# Preview discovery
pnpm run discover --dry

# Discover from Wikidata only
pnpm run discover --source=wikidata --limit=50

# Full pipeline
pnpm run discover --verbose
```

### 2. Social Handle Resolution (`lib/social/`)

Resolves official social handles using:
- Wikidata properties (P2003, P2002, P2397)
- TMDB external_ids API
- Wikipedia external links

Priority:
1. Instagram (highest glamour value)
2. YouTube
3. Twitter/X
4. TikTok
5. Snapchat (metadata only - no embed)

### 3. Ranking Engine (`lib/hot/ranking-engine.ts`)

Calculates hot_score using:

```
hot_score = 
  (popularity_score * 0.3) +
  (instagram_present * 15) +
  (youtube_present * 10) +
  (twitter_present * 5) +
  (tmdb_popularity / 5, max 20) +
  (trend_score * 0.1) +
  (glamour_weight * 15) +
  (embed_safety * 10)
```

### 4. Hot Candidates View

SQL materialized view combining all metrics:

```sql
SELECT * FROM v_hot_glamour_candidates
WHERE is_eligible = true
ORDER BY hot_score DESC
LIMIT 20;
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `pnpm discover` | Full discovery pipeline |
| `pnpm discover:dry` | Preview mode |
| `pnpm discover:wikidata` | Wikidata source only |
| `pnpm discover:rank` | Recalculate rankings only |
| `pnpm discover:full` | Verbose output |
| `pnpm hot:ingest --dry` | Preview hot content |
| `pnpm hot:ingest --smart` | Smart update mode |
| `pnpm hot:reset --confirm` | Reset all hot content |

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `celebrities` | Master celebrity data |
| `celebrity_social_profiles` | Verified social handles |
| `hot_media` | Hot content entries |
| `hot_image_references` | Image sources with licensing |
| `entity_discovery_log` | Discovery run logs |

### Views

| View | Purpose |
|------|---------|
| `v_hot_glamour_candidates` | Pre-computed rankings |
| `v_social_profiles_hot_priority` | Social profiles by glam priority |

## Validation Rules

### Eligibility Criteria

- ✅ Minimum 1 verified social profile
- ✅ At least one embeddable platform (Instagram/YouTube/Twitter)
- ✅ Popularity score ≥ 30
- ✅ Hot score ≥ 40 (configurable)

### Safety Checks

- ✅ No explicit keywords
- ✅ No political content flags
- ✅ Image license verified
- ✅ Face identity match

### Status Flags

| Status | Description |
|--------|-------------|
| ✅ READY | Passes all validations |
| ⚠️ NEEDS_REWORK | Requires adjustments |
| ❌ REJECTED | Failed validation |

## Legal Compliance

### What We DO:
- ✅ Use Wikidata SPARQL (public API)
- ✅ Use TMDB API (licensed)
- ✅ Use Instagram oEmbed
- ✅ Use YouTube oEmbed
- ✅ Store metadata only

### What We DON'T:
- ❌ Scrape social media pages
- ❌ Download copyrighted images
- ❌ Copy captions/content
- ❌ Access private accounts
- ❌ Store scraped data

## Configuration

### Ranking Config

```typescript
const DEFAULT_RANKING_CONFIG = {
  instagramWeight: 15,
  youtubeWeight: 10,
  tmdbWeight: 20,
  trendWeight: 10,
  glamourWeight: 15,
  embedSafetyWeight: 10,
  
  minScoreForEligibility: 40,
  minSocialProfiles: 1,
  minConfidence: 0.6,
  
  topNCandidates: 50,
};
```

### Platform Priority

```typescript
const HOT_CONTENT_PLATFORM_PRIORITY = [
  'instagram',  // Best for glamour
  'tiktok',     // Good for viral
  'youtube',    // Good for longer content
  'twitter',    // Good for news
  'facebook',   // Lower priority
];
```

## Maintenance

### Daily Tasks (Automated)
- Refresh materialized view every 15 minutes
- Update trending scores from analytics

### Weekly Tasks
- Run `pnpm discover --source=wikidata` for new celebrities
- Review flagged content in admin

### Monthly Tasks
- Audit image licenses
- Review blocking rules
- Update ranking weights if needed

## Monitoring

### Key Metrics
- Eligible candidates count
- Average hot_score
- Social profile coverage
- Content approval rate

### Alerts
- Discovery errors
- Low confidence scores
- License verification failures

