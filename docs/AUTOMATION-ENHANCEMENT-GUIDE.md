# Actor Filmography Validation - Automation Enhancement Guide

## Overview

This guide documents the enhanced automation system for actor filmography validation, built to reduce manual review time from 3.5 hours → 50 minutes (76% reduction) per actor.

**Status**: Core infrastructure complete (7 new library modules created)
**Date**: January 12, 2026
**Target Actors**: All Telugu actors (tested on Venkatesh, Nani, Allari Naresh, Chiranjeevi, Pawan Kalyan, Mahesh Babu, Allu Arjun)

## What Was Built

### 1. Core Library Modules (✅ Complete)

#### [`scripts/lib/multi-source-orchestrator.ts`](../scripts/lib/multi-source-orchestrator.ts)
**Purpose**: Fetch data from all sources in parallel and build consensus

**Key Functions**:
- `fetchFromAllSources(query, fields)`: Fetch from TMDB, IMDb, Wikipedia, Wikidata, OMDB in parallel
- `buildConsensus(sources)`: Algorithm to determine best value from multiple sources
- `configureSource(sourceId, enabled)`: Enable/disable specific sources

**Consensus Algorithm**:
- Perfect consensus (all sources agree): 98% confidence → auto-apply
- Majority consensus (3+ sources): 90% confidence → auto-apply
- Weak consensus (2 sources): 75% confidence → flag for review
- Conflict (no agreement): 40% confidence → manual review

**Sources Integrated**:
- TMDB (95% confidence)
- IMDb (90% confidence)
- Wikipedia (85% confidence)
- Wikidata (80% confidence)
- OMDB (75% confidence)

---

#### [`scripts/lib/confidence-config.ts`](../scripts/lib/confidence-config.ts)
**Purpose**: Centralized configuration for all confidence thresholds

**Key Configuration**:
```typescript
CONFIDENCE_THRESHOLDS = {
  AUTO_FIX: {
    reattribute: 0.85,        // Re-attribute ghost entries
    add_missing: 0.85,        // Add missing films
    fix_tmdb_id: 0.80,        // Fix wrong TMDB IDs
    fill_tech_credits: 0.75,  // Fill cinematographer/editor/writer
    fix_duplicates: 0.90,     // Remove duplicates
  },
  FLAG_FOR_REVIEW: {
    reattribute: 0.60,
    add_missing: 0.70,
    fix_tmdb_id: 0.60,
    fill_tech_credits: 0.50,
  }
}
```

**Helper Functions**:
- `shouldAutoFix(action, confidence)`: Check if confidence meets auto-fix threshold
- `getActionForConfidence(action, confidence)`: Get recommended action
- `calculateWeightedConfidence(sources)`: Calculate weighted average from multiple sources
- `boostConfidenceForConsensus(baseConfidence, sourceCount)`: Boost for agreement

---

#### [`scripts/lib/imdb-scraper.ts`](../scripts/lib/imdb-scraper.ts)
**Purpose**: Scrape technical credits from IMDb full credits page

**Key Functions**:
- `scrapeIMDbCredits(imdbId)`: Scrape full credits page
- `searchIMDbId(title, year)`: Find IMDb ID for a film
- `getTechnicalCredits(title, year, imdbId)`: Get all tech credits
- `isActorInCast(credits, actorName)`: Verify actor presence
- `getActorRole(credits, actorName)`: Classify actor's role

**Data Extracted**:
- Cast with order and character names
- Cinematographer (Director of Photography)
- Editor (Film Editing)
- Writer (Writer, Screenplay, Story, Dialogue)
- Producer (Produced by)
- Music Director, Art Director, Costume Designer

**Features**:
- Rate limiting (1 second between requests)
- HTML parsing (no heavy dependencies)
- Confidence scoring based on completeness

---

#### [`scripts/lib/wikipedia-infobox-parser.ts`](../scripts/lib/wikipedia-infobox-parser.ts)
**Purpose**: Parse Telugu and English Wikipedia infoboxes for technical credits

**Key Functions**:
- `parseTeluguWikipediaInfobox(title, year)`: Parse Telugu Wikipedia infobox
- `parseEnglishWikipediaInfobox(title, year)`: Parse English Wikipedia infobox
- `parseWikipediaInfobox(title, year)`: Try Telugu first, fallback to English
- `isActorInWikipediaCast(infobox, actorName)`: Verify actor in cast

**Fields Parsed**:
- Telugu: దర్శకత్వం, చిత్రీకరణ, సంపాదకుడు, రచయిత, నిర్మాత, సంగీతం
- English: director, cinematography, editing, writer, producer, music

**Features**:
- Handles multiple infobox formats
- Cleans wikilinks and references
- Confidence scoring
- Rate limiting (500ms between requests)

---

#### [`scripts/lib/missing-film-detector.ts`](../scripts/lib/missing-film-detector.ts)
**Purpose**: Detect films missing from database by comparing with TMDB filmography

**Key Functions**:
- `searchTMDBActor(actorName)`: Find actor on TMDB
- `fetchTMDBActorFilmography(actorId)`: Get complete filmography
- `classifyActorRole(castOrder, character)`: Classify lead/support/cameo
- `detectMissingFilms(actorName, existingFilms)`: Find missing Telugu films
- `getTMDBMovieDetails(tmdbId)`: Get details for adding to database

**Role Classification**:
- Cast order 1-2: Lead (95% confidence)
- Cast order 3-5: Support (85% confidence)
- Cast order 6-10: Support/Cameo (70% confidence)
- Cast order 11+: Cameo (60% confidence)
- Character with "cameo"/"special": Cameo (90% confidence)

**Output**:
```typescript
{
  actorName: string,
  missingFilms: MissingFilm[],
  autoAddCandidates: MissingFilm[],     // confidence >= 85%
  manualReviewCandidates: MissingFilm[], // confidence < 85%
}
```

---

#### [`scripts/lib/ghost-reattribution-engine.ts`](../scripts/lib/ghost-reattribution-engine.ts)
**Purpose**: Identify ghost entries and determine correct actor (NEVER deletes)

**Key Functions**:
- `analyzeGhostEntry(movie)`: Verify actor across all sources
- `batchAnalyzeGhostEntries(movies)`: Process multiple films
- `shouldAutoReattribute(analysis)`: Check if meets auto-fix threshold

**Multi-Source Verification**:
1. TMDB cast check
2. IMDb cast check (via scraper)
3. Wikipedia cast check (via infobox parser)
4. Wikidata cast check
5. OMDB cast check

**Decision Tree**:
- 3+ sources agree on different actor: Re-attribute (95% confidence)
- 2 sources agree: Re-attribute (80% confidence)
- 1 source suggests different actor: Flag for manual review
- 0 sources have data: Flag for manual review (NEVER delete)

**Critical Rule**: Never deletes ghost entries - always suggests re-attribution or flags for review

---

#### [`scripts/lib/tmdb-id-validator.ts`](../scripts/lib/tmdb-id-validator.ts)
**Purpose**: Validate TMDB IDs and find correct IDs when wrong

**Key Functions**:
- `validateTMDBId(movie)`: Validate current TMDB ID
- `batchValidateTMDBIds(movies)`: Process multiple films
- `shouldAutoFixTMDBId(result)`: Check if meets auto-fix threshold

**Validation Steps**:
1. Language check (must be Telugu: `te`)
2. Title match (70% similarity minimum)
3. Year match (within ±1 year)
4. Cast verification (if actor provided)
5. Cross-reference search for correct ID

**Auto-Fix Logic**:
- Wrong language + correct Telugu film found: Replace (95% confidence)
- Wrong title/year + correct film found: Replace (85% confidence)
- Actor not in cast + alternative found: Replace (80% confidence)
- Invalid but no alternative: Clear (70% confidence)
- Else: Flag for manual review

---

## Integration Tasks (Remaining Work)

### Task 1: Enhance `autofix-engine.ts` ✅ Core Built, Integration Needed

**File**: [`scripts/lib/autofix-engine.ts`](../scripts/lib/autofix-engine.ts)

**Changes Needed**:
1. Import new modules:
```typescript
import { fetchFromAllSources } from './multi-source-orchestrator';
import { CONFIDENCE_THRESHOLDS, shouldAutoFix } from './confidence-config';
import { detectMissingFilms } from './missing-film-detector';
import { analyzeGhostEntry } from './ghost-reattribution-engine';
import { validateTMDBId } from './tmdb-id-validator';
import { getTechnicalCredits } from './imdb-scraper';
import { parseWikipediaInfobox } from './wikipedia-infobox-parser';
```

2. Add multi-source validation function:
```typescript
async function validateFieldAcrossSources(
  movie: Movie,
  field: 'director' | 'heroine' | 'cinematographer' | 'editor' | 'writer',
  currentValue: string
): Promise<{ confidence: number; suggestedValue?: string; sources: string[] }> {
  const results = await fetchFromAllSources({
    title_en: movie.title_en,
    release_year: movie.release_year,
    tmdb_id: movie.tmdb_id,
    imdb_id: movie.imdb_id,
  }, [field]);
  
  const fieldResult = results.find(r => r.field === field);
  
  return {
    confidence: fieldResult?.consensusConfidence || 0,
    suggestedValue: fieldResult?.consensus || undefined,
    sources: fieldResult?.sources.map(s => s.sourceId) || [],
  };
}
```

3. Update `applyAutoFixes` to handle new issue types:
- `missing_film`: Call `detectMissingFilms` and add to database
- `ghost_entry`: Call `analyzeGhostEntry` and re-attribute
- `wrong_tmdb_id`: Call `validateTMDBId` and fix

---

### Task 2: Integrate Tech Credits into `enrich-cast-crew.ts` ✅ Parsers Built, Integration Needed

**File**: [`scripts/enrich-cast-crew.ts`](../scripts/enrich-cast-crew.ts)

**Changes Needed**:
1. Add IMDb and Wikipedia to source waterfall:
```typescript
const sources = [
  { name: 'TMDB', fn: tryTMDB, confidence: 0.95 },
  { name: 'IMDb', fn: tryIMDb, confidence: 0.90 },  // NEW
  { name: 'Wikipedia', fn: tryWikipedia, confidence: 0.85 },
  { name: 'Wikidata', fn: tryWikidata, confidence: 0.80 },
];
```

2. Implement `tryIMDb`:
```typescript
async function tryIMDb(movie: Movie): Promise<CastCrewResult | null> {
  if (!movie.imdb_id) return null;
  
  const credits = await scrapeIMDbCredits(movie.imdb_id);
  if (!credits) return null;
  
  return {
    cinematographer: getPrimaryCrew(credits, 'cinematographer'),
    editor: getPrimaryCrew(credits, 'editor'),
    writer: getPrimaryCrew(credits, 'writer'),
    producer: getPrimaryCrew(credits, 'producer'),
    musicDirector: getPrimaryCrew(credits, 'musicDirector'),
  };
}
```

3. Implement enhanced Wikipedia function:
```typescript
async function tryWikipedia(movie: Movie): Promise<CastCrewResult | null> {
  const infobox = await parseWikipediaInfobox(movie.title_en, movie.release_year);
  if (!infobox) return null;
  
  return {
    cinematographer: infobox.cinematographer,
    editor: infobox.editor,
    writer: infobox.writer,
    producer: infobox.producer,
    musicDirector: infobox.musicDirector,
    director: infobox.director,
  };
}
```

---

### Task 3: Integrate into `validate-actor-complete.ts` ✅ All Engines Built, Orchestration Needed

**File**: [`scripts/validate-actor-complete.ts`](../scripts/validate-actor-complete.ts)

**Enhanced Flow**:

```typescript
// PHASE 1: Discovery & Multi-Source Validation
console.log('Phase 1: Discovery & Multi-Source Validation');

// 1a. Detect duplicates (existing)
const duplicates = await detectDuplicates(actorFilms);

// 1b. Detect ghost entries (NEW)
const ghostAnalyses = await batchAnalyzeGhostEntries(
  actorFilms.map(f => ({
    movieId: f.id,
    title: f.title_en,
    releaseYear: f.release_year,
    currentActor: actorName,
    tmdbId: f.tmdb_id,
    imdbId: f.imdb_id,
  }))
);

// 1c. Detect missing films (NEW)
const missingAnalysis = await detectMissingFilms(actorName, actorFilms);

// 1d. Validate TMDB IDs (NEW)
const tmdbValidations = await batchValidateTMDBIds(
  actorFilms.filter(f => f.tmdb_id).map(f => ({
    title_en: f.title_en,
    release_year: f.release_year,
    hero: actorName,
    currentTmdbId: f.tmdb_id!,
  }))
);

// 1e. Multi-source field validation (NEW)
const fieldValidations = await Promise.all(
  actorFilms.map(async (film) => {
    const fields = ['cinematographer', 'editor', 'writer', 'producer'];
    const validations = await fetchFromAllSources({
      title_en: film.title_en,
      release_year: film.release_year,
      tmdb_id: film.tmdb_id,
      imdb_id: film.imdb_id,
    }, fields);
    
    return { filmId: film.id, validations };
  })
);

// PHASE 2: Intelligent Auto-Fix
console.log('Phase 2: Intelligent Auto-Fix');

// 2a. Auto-reattribute ghost entries (confidence >= 85%)
const autoReattribute = ghostAnalyses.filter(shouldAutoReattribute);
for (const ghost of autoReattribute) {
  await supabase
    .from('movies')
    .update({ hero: ghost.reattribution!.suggestedActor })
    .eq('id', ghost.movieId);
}

// 2b. Auto-add missing films (confidence >= 85%)
const autoAdd = missingAnalysis.autoAddCandidates;
for (const missing of autoAdd) {
  const details = await getTMDBMovieDetails(missing.tmdbId);
  await supabase.from('movies').insert({
    title_en: details.title,
    release_year: details.releaseYear,
    tmdb_id: missing.tmdbId,
    hero: missing.role === 'lead' ? actorName : null,
    supporting_cast: missing.role !== 'lead' ? [{ name: actorName, type: missing.role }] : null,
    // ... other fields
  });
}

// 2c. Auto-fix wrong TMDB IDs (confidence >= 80%)
const autoFixTMDB = tmdbValidations.filter(shouldAutoFixTMDBId);
for (const validation of autoFixTMDB) {
  if (validation.action === 'replace' && validation.suggestedId) {
    await supabase
      .from('movies')
      .update({ tmdb_id: validation.suggestedId })
      .eq('tmdb_id', validation.currentId);
  } else if (validation.action === 'clear') {
    await supabase
      .from('movies')
      .update({ tmdb_id: null })
      .eq('tmdb_id', validation.currentId);
  }
}

// 2d. Auto-fill tech credits (confidence >= 75%)
for (const { filmId, validations } of fieldValidations) {
  const updates: Record<string, string> = {};
  
  for (const validation of validations) {
    if (validation.consensusConfidence >= CONFIDENCE_THRESHOLDS.AUTO_FIX.fill_tech_credits) {
      if (validation.consensus) {
        updates[validation.field] = validation.consensus;
      }
    }
  }
  
  if (Object.keys(updates).length > 0) {
    await supabase
      .from('movies')
      .update(updates)
      .eq('id', filmId);
  }
}

// PHASE 3: Targeted Enrichment (existing, but only for gaps)
// Run enrich-cast-crew, enrich-tmdb-display-data, etc. only for remaining gaps

// PHASE 4: Enhanced Export
// Export with confidence breakdown and source attribution
```

---

## Expected Results

### Automation Coverage

| Priority | Manual (Before) | Automated (After) | Manual Remaining | Time Savings |
|----------|-----------------|-------------------|------------------|--------------|
| Missing Films (9) | 60 mins | 5 mins | 10 mins (review) | 75% |
| Ghost Entries (5) | 30 mins | 2 mins | 5 mins (review) | 83% |
| Tech Credits (115) | 2 hours | 20 mins | 30 mins (review) | 75% |
| Wrong TMDB IDs (6) | 20 mins | 3 mins | 5 mins (review) | 75% |
| **TOTAL** | **3.5 hours** | **30 mins** | **50 mins** | **76%** |

### Confidence Distribution (Expected)

- **Auto-Applied** (confidence >= 85%): ~65% of issues
- **Flagged for Review** (confidence 60-85%): ~25% of issues
- **Manual Required** (confidence < 60%): ~10% of issues

### Data Quality Improvement

- **Before**: 72% completeness (100% display, 0% tech credits)
- **After Auto-Fill**: 90%+ completeness (100% display, 80%+ tech credits)
- **After Manual Review**: 95%+ completeness

---

## Usage Examples

### 1. Validate Actor with All New Features

```bash
npx tsx scripts/validate-actor-complete.ts --actor="Pawan Kalyan" --full --execute
```

This will:
1. Detect duplicates, ghosts, missing films, wrong TMDB IDs
2. Validate all fields across TMDB, IMDb, Wikipedia, Wikidata, OMDB
3. Auto-fix high-confidence issues
4. Generate anomaly report for manual review
5. Export complete filmography

### 2. Test Missing Film Detection Only

```bash
npx tsx scripts/validate-actor-filmography.ts --actor="Mahesh Babu" --report-only
```

### 3. Fill Technical Credits from IMDb + Wikipedia

```bash
npx tsx scripts/enrich-cast-crew.ts --actor="Allu Arjun" --execute
```

---

## Testing Checklist

### Phase 1: Unit Testing (Per Module)
- [ ] `multi-source-orchestrator.ts`: Test consensus algorithm with mock data
- [ ] `confidence-config.ts`: Test threshold calculations
- [ ] `imdb-scraper.ts`: Test with known IMDb IDs
- [ ] `wikipedia-infobox-parser.ts`: Test with known Telugu films
- [ ] `missing-film-detector.ts`: Test with Pawan Kalyan (known 3 missing)
- [ ] `ghost-reattribution-engine.ts`: Test with known ghost entries
- [ ] `tmdb-id-validator.ts`: Test with known wrong TMDB IDs

### Phase 2: Integration Testing
- [ ] Enhanced `autofix-engine.ts`: Test with Nani's data (known issues)
- [ ] Enhanced `enrich-cast-crew.ts`: Test tech credit filling
- [ ] Enhanced `validate-actor-complete.ts`: End-to-end test with Pawan Kalyan

### Phase 3: Production Testing
- [ ] Pawan Kalyan: 3 missing + 2 ghosts + 3 wrong IDs
- [ ] Mahesh Babu: 0 missing + 1 ghost + 1 wrong ID
- [ ] Allu Arjun: 6 missing + 2 ghosts + 2 wrong IDs

---

## Performance Considerations

1. **Rate Limiting**:
   - TMDB: Default limits apply
   - IMDb: 1 second between requests (implemented)
   - Wikipedia: 500ms between requests (implemented)

2. **Parallel Execution**:
   - Multi-source orchestrator runs all sources in parallel
   - Significant speed improvement over sequential waterfall

3. **Caching**:
   - Consider caching TMDB/IMDb responses for repeated queries
   - Not implemented yet, but recommended for production

---

## Maintenance

### Updating Confidence Thresholds

Edit [`scripts/lib/confidence-config.ts`](../scripts/lib/confidence-config.ts):

```typescript
export const CONFIDENCE_THRESHOLDS = {
  AUTO_FIX: {
    reattribute: 0.90,  // Increase to 90% for higher safety
    // ... other thresholds
  }
}
```

Or via CLI:
```bash
npx tsx scripts/validate-actor-complete.ts \
  --actor="Actor Name" \
  --threshold-reattribute=0.90 \
  --threshold-fill-tech-credits=0.80 \
  --execute
```

### Adding New Data Sources

1. Add to `multi-source-orchestrator.ts`:
```typescript
async function fetchFromNewSource(query): Promise<FieldSources> {
  // Implement fetcher
}

// Add to fetchFromAllSources()
const newSourceData = await fetchFromNewSource(query);
```

2. Add confidence in `confidence-config.ts`:
```typescript
SOURCES: {
  new_source: 0.85,
}
```

---

## Troubleshooting

### Issue: IMDb scraping fails

**Solution**: Check if IMDb HTML structure changed. Update selectors in `imdb-scraper.ts`.

### Issue: Wikipedia parsing fails for Telugu

**Solution**: Check Telugu infobox field names. Wikipedia infoboxes vary by language.

### Issue: Too many auto-fixes

**Solution**: Increase confidence thresholds in `confidence-config.ts`.

### Issue: TMDB API rate limit exceeded

**Solution**: Add delays between batch operations or reduce concurrency.

---

## Success Metrics

### Current Status (7 actors validated)
- **Actors**: Venkatesh, Nani, Allari Naresh, Chiranjeevi, Pawan Kalyan, Mahesh Babu, Allu Arjun
- **Films**: 447 films validated
- **Avg Completeness**: ~85% (100% display, 70% tech credits after manual review)
- **Total Time**: ~3.5 hours (with manual review)
- **Automation**: ~78% time reduction vs pure manual

### Target Metrics (with full integration)
- **Auto-Fix Rate**: 65%+ of issues
- **Manual Review**: 25% of issues
- **Completeness**: 90%+ after auto-fix, 95%+ after manual review
- **Time per Actor**: 50 minutes (30 mins automated + 20 mins review)

---

## Next Steps

1. **Complete Integration Tasks** (Tasks 1-3 above)
2. **Run Tests** (Use Pawan Kalyan, Mahesh Babu, Allu Arjun as test subjects)
3. **Iterate on Thresholds** (Based on test results)
4. **Production Deployment** (Roll out to all Telugu actors)
5. **Monitor & Refine** (Track auto-fix success rate, adjust thresholds)

---

## References

- Plan: [`.cursor/plans/automate_actor_validation_f401aaf7.plan.md`](../.cursor/plans/automate_actor_validation_f401aaf7.plan.md)
- Batch Validation Summary: [`docs/BATCH-VALIDATION-SUMMARY-JAN-2026.md`](./BATCH-VALIDATION-SUMMARY-JAN-2026.md)
- Chiranjeevi Case Study: [`docs/chiranjeevi-validation-summary.md`](./chiranjeevi-validation-summary.md)
