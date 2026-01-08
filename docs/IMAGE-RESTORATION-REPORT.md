# Image Restoration Report

**Date:** January 8, 2026  
**Duration:** ~15 minutes  
**Result:** 92.6% poster coverage (6,270 / 6,769 movies)

## Executive Summary

Used existing fast parallel enrichment mechanisms to restore movie poster images from multiple sources. The approach leveraged pre-built scripts with 30 concurrent requests for 10-20x faster processing than sequential methods.

## Steps Executed

### Step 1: Fast Parallel Image Enrichment
**Script:** `scripts/enrich-images-fast.ts`  
**Command:**
```bash
npx tsx scripts/enrich-images-fast.ts --execute --limit=1000 --concurrency=30
```

**Results:**
- Processed: 983 movies
- Enriched: 443 movies (45%)
- Duration: ~10 minutes
- Speed: 1.7 movies/sec

**Sources Used (Waterfall):**
1. TMDB (primary)
2. Wikipedia (English)
3. Wikimedia Commons
4. Internet Archive

### Step 2: Telugu Wikipedia Enhancement
**Script:** Created inline script to search `te.wikipedia.org`  
**Rationale:** Many older Telugu films have articles on Telugu Wikipedia with poster images

**Example URLs discovered:**
- `https://upload.wikimedia.org/wikipedia/te/7/7f/దీనబంధు.png`
- `https://upload.wikimedia.org/wikipedia/te/f/fb/Bhakta_Prahlada_1942.jpg`
- `https://upload.wikimedia.org/wikipedia/te/a/a3/TeluguFilm_Suvrnamala.jpg`

**Results:**
- Additional 17 posters found from Telugu Wikipedia

### Step 3: Waterfall Enrichment (9 Sources)
**Script:** `scripts/enrich-waterfall.ts`  
**Command:**
```bash
npx tsx scripts/enrich-waterfall.ts --placeholders-only --batch --limit=600 --execute
```

**Sources:**
1. TMDB
2. Wikimedia Commons
3. Internet Archive
4. OMDB
5. Wikidata
6. Google Knowledge Graph
7. Letterboxd
8. Cinemaazi
9. AI inference

## Final Coverage

| Metric | Value |
|--------|-------|
| Total Movies | 6,769 |
| With Poster | 6,270 (92.6%) |
| Missing Poster | 499 (7.4%) |

### Images by Source

| Source | Count |
|--------|-------|
| TMDB | 4,321 |
| Wikimedia Commons | 1,325 |
| English Wikipedia | 1,180 |
| Internet Archive | 286 |
| Telugu Wikipedia | 6 |

### Remaining Gaps by Decade

| Decade | Missing |
|--------|---------|
| 1940s | 18 |
| 1950s | 55 |
| 1960s | 42 |
| 1970s | 78 |
| 1980s | 165 |
| 1990s | 80 |
| 2000s | 24 |
| 2010s | 30 |
| 2020s | 7 |

## Scripts Used

### Primary Scripts
- `scripts/enrich-images-fast.ts` - Parallel TMDB/Wiki/Archive enrichment
- `scripts/enrich-waterfall.ts` - 9-source cascading enrichment
- `scripts/enrich-wiki-posters.ts` - Wikipedia poster extraction (new)

### Supporting Infrastructure
- `lib/pipeline/execution-controller.ts` - Parallel execution with retry logic
- `lib/visual-intelligence/archival-sources.ts` - Source registry

## Key Learnings

1. **Telugu Wikipedia** (`te.wikipedia.org`) has poster images for older films not found on English Wikipedia
2. **Parallel processing** (30 concurrent requests) is 10-20x faster than sequential
3. **Waterfall approach** maximizes coverage by trying multiple sources
4. **1980s films** have the largest gap (165 missing) - likely need manual archival sources

## Recommendations for Remaining 499 Films

1. **National Film Archive of India** - Official repository for historic Indian cinema
2. **Cassette cover scans** - VHS/VCD covers from the 1980s-90s
3. **Telugu magazine archives** - Sitara, Jyothi, Cinema Rangam
4. **Newspaper film ads** - Andhra Patrika, Eenadu archives
5. **Manual Wikipedia contribution** - Upload posters to Telugu Wikipedia

## Commands Reference

```bash
# Fast parallel enrichment (primary)
pnpm enrich:posters --execute --limit=1000 --concurrency=30

# Waterfall with all 9 sources
npx tsx scripts/enrich-waterfall.ts --placeholders-only --batch --limit=500 --execute

# Wikipedia poster extraction
npx tsx scripts/enrich-wiki-posters.ts --execute --limit=500

# Check current status
npx tsx -e "..." # (inline status script)
```

## Performance Comparison

| Approach | Time for 1000 movies |
|----------|---------------------|
| Sequential (old) | ~4 hours |
| Parallel fast script | ~10 minutes |
| Waterfall (9 sources) | ~20 minutes |

