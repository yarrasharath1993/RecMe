# Telugu Portal Data Enrichment Guide

> **Last Updated:** January 7, 2026  
> **Current Status:** Full enrichment system with enhanced Wikipedia scraper, extended cast, editorial scores, and multi-source validation

## Current Coverage (as of last run)

| Data Field | Coverage | Count |
|------------|----------|-------|
| Poster Images | 84% | 4,214/5,029 |
| Hero/Heroine/Director | 100% | ~5,015 |
| Music Director | 38% | 1,899 |
| Producer | 26% | 1,321 |
| Supporting Cast | 30% | 1,511 |
| TMDB ID | 50% | 2,513 |
| Editorial Score | 4% | 213 |

This document outlines the complete data enrichment strategy for the Telugu Portal, including image enrichment, extended cast/crew data, editorial scores, validation, and smart reviews.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Master Orchestrator](#2-master-orchestrator)
3. [Image Enrichment](#3-image-enrichment)
4. [Extended Cast & Crew](#4-extended-cast--crew)
5. [Editorial Scores](#5-editorial-scores)
6. [Multi-Source Validation](#6-multi-source-validation)
7. [Page Coverage Check](#7-page-coverage-check)
8. [Running the Scripts](#8-running-the-scripts)
9. [Architecture](#9-architecture)

---

## 1. Quick Start

### Complete Enrichment Pipeline (Recommended)

Run all enrichment phases in optimal order with one command:

```bash
# Preview what would happen
npx tsx scripts/enrich-master.ts --full

# Execute all phases
npx tsx scripts/enrich-master.ts --full --execute

# Resume from failure
npx tsx scripts/enrich-master.ts --resume --execute

# Check current status
npx tsx scripts/enrich-master.ts --status
```

### Individual Scripts

```bash
# Images
npx tsx scripts/enrich-images-fast.ts --limit=500 --execute

# Cast & Crew (extended: music, producer, 5 supporting)
npx tsx scripts/enrich-cast-crew.ts --extended --limit=500 --execute

# Editorial Scores (for unrated movies)
npx tsx scripts/enrich-editorial-scores.ts --unrated-only --execute

# Multi-Source Validation (auto-fix 3+ consensus)
npx tsx scripts/validate-all.ts --auto-fix --report=./reports/validation.md

# Check page data coverage
npx tsx scripts/check-page-coverage.ts --page=reviews
```

---

## 2. Master Orchestrator

**Script:** `scripts/enrich-master.ts`

Runs all enrichment phases in optimal order with checkpointing for resume-on-failure.

### Execution Order
1. **Images** (highest visual impact)
2. **Cast/Crew** (essential metadata)
3. **Editorial Scores** (for unrated movies)
4. **Validation** (multi-source consensus)

### Commands

```bash
# Full enrichment pipeline
npx tsx scripts/enrich-master.ts --full --execute

# Run specific phase only
npx tsx scripts/enrich-master.ts --phase=images --execute
npx tsx scripts/enrich-master.ts --phase=cast-crew --execute
npx tsx scripts/enrich-master.ts --phase=editorial-scores --execute
npx tsx scripts/enrich-master.ts --phase=validation --execute

# Resume from checkpoint after failure
npx tsx scripts/enrich-master.ts --resume --execute

# Check current status and coverage
npx tsx scripts/enrich-master.ts --status
```

### Options

| Option | Description |
|--------|-------------|
| `--full` | Run all enrichment phases |
| `--phase=NAME` | Run specific phase (images, cast-crew, editorial-scores, validation) |
| `--resume` | Resume from last checkpoint |
| `--status` | Show current enrichment status |
| `--execute` | Apply changes (default is dry run) |
| `--limit=N` | Limit records per phase (default: 500) |
| `--concurrency=N` | Parallel requests (default: 20) |

### Checkpoint Recovery

Progress is saved to `.enrichment-checkpoint.json`. If a phase fails, run `--resume` to continue from where it stopped.

---

## 3. Image Enrichment

**Script:** `scripts/enrich-images-fast.ts`

Uses parallel processing (up to 30 concurrent requests) to find movie posters from multiple sources.

### Source Waterfall (Priority Order)

| Source | Confidence | Best For |
|--------|------------|----------|
| TMDB | 0.95 | Popular films with TMDB IDs |
| Wikipedia | 0.85 | Indian regional cinema |
| Wikimedia Commons | 0.80 | Historical/archival images |
| Internet Archive | 0.75 | Vintage posters and stills |

### Commands

```bash
# Preview (dry run)
npx tsx scripts/enrich-images-fast.ts --limit=100 --concurrency=25

# Execute updates
npx tsx scripts/enrich-images-fast.ts --limit=500 --concurrency=25 --execute

# Full run for all movies
npx tsx scripts/enrich-images-fast.ts --concurrency=30 --execute
```

### Database Fields Updated

```sql
poster_url           -- The image URL
poster_confidence    -- 0.0-1.0 confidence score
poster_visual_type   -- 'original_poster', 'archival_image', 'placeholder'
archival_source      -- JSONB with source_type, license, attribution
```

---

## 4. Extended Cast & Crew

**Script:** `scripts/enrich-cast-crew.ts`

Enhanced to include music director, producer, 5 supporting actors, and extended crew.

### Fields Enriched

| Category | Fields |
|----------|--------|
| Leads | hero, heroine, director |
| Crew | music_director, producer |
| Supporting | 5 actors with names and roles |
| Extended Crew | cinematographer, editor, writer, choreographer |

### Source Waterfall

1. **TMDB Credits API** (confidence: 0.95) - Best for all fields
2. **Wikipedia Infobox Enhanced v2.0** (confidence: 0.85) - Multi-pattern extraction
3. **Wikidata SPARQL** (confidence: 0.80)

### Wikipedia Scraper Enhancement (v2.0)

The Wikipedia scraper was enhanced on Jan 7, 2026 to better extract data from varied infobox formats:

- **Multiple URL patterns**: `title_(year_Telugu_film)`, `title_(year_film)`, `title_(Telugu_film)`, etc.
- **Robust field extraction**: Uses 4 different regex patterns to match various Wikipedia table formats
- **Telugu film verification**: Validates that the Wikipedia page is for a Telugu film
- **Extended crew extraction**: Cinematography, Edited by, Written by, Screenplay

**Before enhancement:** 0% Wikipedia success rate  
**After enhancement:** ~8% Wikipedia fallback success (recovering data when TMDB fails)

### Commands

```bash
# Standard enrichment
npx tsx scripts/enrich-cast-crew.ts --limit=500 --execute

# Extended mode (all fields including crew)
npx tsx scripts/enrich-cast-crew.ts --extended --limit=500 --execute

# Missing specific fields
npx tsx scripts/enrich-cast-crew.ts --missing-hero --limit=100 --execute
npx tsx scripts/enrich-cast-crew.ts --missing-director --limit=100 --execute
npx tsx scripts/enrich-cast-crew.ts --missing-heroine --limit=100 --execute
npx tsx scripts/enrich-cast-crew.ts --missing-music --limit=100 --execute
npx tsx scripts/enrich-cast-crew.ts --missing-producer --limit=100 --execute
```

### Database Schema (from migration 008)

```sql
-- Supporting cast JSONB array
supporting_cast: [
  {"name": "Brahmanandam", "role": "Comedy", "order": 1, "type": "supporting"},
  {"name": "Prakash Raj", "role": "Villain", "order": 2, "type": "supporting"},
  ...
]

-- Crew JSONB object
crew: {
  "cinematographer": "P.S. Vinod",
  "editor": "Marthand K. Venkatesh",
  "writer": "Trivikram Srinivas",
  "choreographer": "Prem Rakshith"
}
```

---

## 5. Editorial Scores

**Script:** `scripts/enrich-editorial-scores.ts`

Generates scores for movies without external ratings (IMDB, TMDB, RT) using weighted combination.

### Scoring Components

| Component | Weight | Description |
|-----------|--------|-------------|
| Genre + Era Baseline | 30% | Base score by genre (e.g., Drama=7.0) + era bonus |
| Comparable Movies | 40% | Average rating of director's/hero's other films |
| Metadata Signals | 30% | Awards, classic status, Wikipedia presence |

### Commands

```bash
# Score unrated movies only
npx tsx scripts/enrich-editorial-scores.ts --unrated-only --limit=500 --execute

# Recalculate all movies
npx tsx scripts/enrich-editorial-scores.ts --recalculate --execute

# With minimum confidence threshold
npx tsx scripts/enrich-editorial-scores.ts --min-confidence=0.6 --execute
```

### Database Fields Updated

```sql
editorial_score           -- 1-10 derived score
editorial_score_breakdown -- JSONB with component scores
editorial_score_confidence -- 0.0-1.0 confidence
rating_source             -- 'external', 'editorial_derived', 'combined'
```

---

## 6. Multi-Source Validation

**Script:** `scripts/validate-all.ts`

Validates movie data across multiple sources with consensus-based auto-fix.

### Validation Logic

- **Auto-fix**: When 3+ sources agree with 80%+ confidence
- **Needs review**: When sources disagree or low confidence
- **Generates report**: Markdown file with all changes and recommendations

### Sources Checked

- TMDB Credits API
- Wikipedia Infobox
- Wikidata
- OMDB (when available)

### Commands

```bash
# Report only (no changes)
npx tsx scripts/validate-all.ts --limit=500

# Auto-fix with 3+ consensus
npx tsx scripts/validate-all.ts --limit=500 --auto-fix

# Generate detailed report
npx tsx scripts/validate-all.ts --auto-fix --report=./reports/validation.md

# Validate specific field
npx tsx scripts/validate-all.ts --field=director --auto-fix

# Validate specific decade
npx tsx scripts/validate-all.ts --decade=2010 --auto-fix

# Only movies with TMDB ID
npx tsx scripts/validate-all.ts --has-tmdb --auto-fix
```

### Report Format

Generated report includes:
- Auto-fixed items (what changed, which sources agreed)
- Needs review items (table of all source values, recommendation)
- Field breakdown statistics

---

## 7. Page Coverage Check

**Script:** `scripts/check-page-coverage.ts`

Verifies that all required fields for movie reviews and celebrity pages have data.

### Commands

```bash
# Check movie review page coverage
npx tsx scripts/check-page-coverage.ts --page=reviews

# Check celebrity page coverage
npx tsx scripts/check-page-coverage.ts --page=celebrities

# Check all pages
npx tsx scripts/check-page-coverage.ts --all

# Filter by decade
npx tsx scripts/check-page-coverage.ts --page=reviews --decade=2020
```

### Coverage Categories

| Category | Fields Checked |
|----------|---------------|
| Essential | title, slug, release_year, genres |
| Visual | poster_url, backdrop_url |
| Cast | director, hero, heroine, music_director, producer, supporting_cast, crew |
| Metadata | synopsis, tmdb_id, runtime, certification, trailer |
| Ratings | our_rating, imdb_rating, tmdb_rating, editorial_score |
| Reviews | has_review, featured_review, editorial_review, smart_review |

---

## 8. Running the Scripts

### Prerequisites

```bash
cd /Users/sharathchandra/Projects/telugu-portal

# Ensure environment is configured
cp .env.example .env.local
# Edit .env.local with:
#   NEXT_PUBLIC_SUPABASE_URL=...
#   SUPABASE_SERVICE_ROLE_KEY=...
#   TMDB_API_KEY=... (optional but recommended)
```

### Daily Workflow

```bash
# 1. Check current status
npx tsx scripts/enrich-master.ts --status

# 2. Run full pipeline
npx tsx scripts/enrich-master.ts --full --limit=200 --execute

# 3. Check page coverage
npx tsx scripts/check-page-coverage.ts --page=reviews
```

### Nightly Batch (Automated)

```bash
#!/bin/bash
# scripts/nightly-enrichment.sh
LOG_DIR="./logs/$(date +%Y-%m-%d)"
mkdir -p $LOG_DIR

npx tsx scripts/enrich-master.ts \
  --full --limit=100 --execute \
  > "$LOG_DIR/enrichment.log" 2>&1

npx tsx scripts/check-page-coverage.ts \
  --all > "$LOG_DIR/coverage.log"
```

---

## 9. Architecture

### Enrichment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    MASTER ORCHESTRATOR                          │
│                  (enrich-master.ts)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase 1          Phase 2          Phase 3          Phase 4    │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐    ┌────────┐ │
│  │  Images  │ ──► │Cast/Crew │ ──► │Editorial │ ──►│Validate│ │
│  └──────────┘     └──────────┘     │  Scores  │    └────────┘ │
│                                    └──────────┘                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │                │                │               │
         ▼                ▼                ▼               ▼
    ┌─────────┐      ┌─────────┐      ┌─────────┐    ┌─────────┐
    │  TMDB   │      │  TMDB   │      │ Genre   │    │  TMDB   │
    │ Wiki    │      │ Wiki    │      │ Track   │    │ Wiki    │
    │ Archive │      │Wikidata │      │ Record  │    │Wikidata │
    └────┬────┘      └────┬────┘      └────┬────┘    └────┬────┘
         │                │                │               │
         └────────────────┴────────────────┴───────────────┘
                                  │
                          ┌───────▼───────┐
                          │   SUPABASE    │
                          │   DATABASE    │
                          └───────────────┘
```

### Core Libraries

| Library | Purpose |
|---------|---------|
| `lib/reviews/editorial-score-engine.ts` | Weighted score calculation |
| `lib/validation/multi-source-validator.ts` | Consensus validation |
| `lib/pipeline/execution-controller.ts` | Parallel execution with retry |
| `lib/visual-intelligence/visual-confidence.ts` | Visual type detection |

### Database Schema Extensions

```sql
-- Migration 008: Extended Cast
movies.producer           TEXT
movies.supporting_cast    JSONB  -- [{name, role, order, type}]
movies.crew               JSONB  -- {cinematographer, editor, ...}
movies.editorial_score    DECIMAL(3,1)
movies.editorial_score_breakdown  JSONB
movies.editorial_score_confidence DECIMAL(3,2)
movies.rating_source      TEXT   -- 'external', 'editorial_derived'
```

---

## Enrichment Metrics

### Current Coverage (Updated)

| Data Type | Target | Priority |
|-----------|--------|----------|
| Poster Images | 95% | 🔴 High |
| Lead Actor (hero) | 99% | 🔴 High |
| Lead Actress | 95% | 🟡 Medium |
| Director | 99% | 🔴 High |
| Music Director | 90% | 🟡 Medium |
| Producer | 80% | 🟡 Medium |
| Supporting Cast | 70% | 🟢 Low |
| Synopsis | 90% | 🔴 High |
| Editorial Score | 100% (for unrated) | 🟡 Medium |
| Validated Data | 90% | 🟡 Medium |

---

## Changelog

### 2026-01-07 (v2.0)
- Created master orchestrator with checkpointing
- Added extended cast enrichment (music, producer, 5 supporting, crew)
- Implemented editorial score engine for unrated movies
- Built multi-source validation with auto-fix
- Added page coverage check utility
- Updated review page UX for extended cast display
- **Enhanced Wikipedia scraper (v2.0)**: Multi-pattern extraction for diverse infobox formats

### Success Rate Analysis

| Era | Success Rate | Reason |
|-----|--------------|--------|
| 2010s-2020s | 87-96% | Most have TMDB data |
| 1990s-2000s | 61-67% | Mixed TMDB coverage, Wikipedia helps |
| Pre-1990 | 20-40% | Many lack TMDB IDs, need manual curation |

**Known Limitations:**
- ~2,515 movies without TMDB IDs (mostly pre-1990)
- ~1,480 movies with TMDB IDs but empty crew sections
- Classic films (pre-1980) require archival/manual research
- Some directors have ~50+ films without extended data (e.g., K. Vasu, Dasari Narayana Rao)
- Enhanced documentation

### 2026-01-06 (v1.0)
- Created `enrich-images-fast.ts` with parallel processing
- Cleaned up 55 garbage records
- Reached 84% image coverage

---

*Document maintained by Telugu Portal Team*
