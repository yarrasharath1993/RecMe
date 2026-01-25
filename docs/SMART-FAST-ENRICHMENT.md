# Smart Fast Enrichment System

## Overview

**Purpose**: Intelligent, fast-only enrichment that skips slow tasks and focuses on quick data wins.

**Speed**: 2-5 minutes for all missing data (vs 30-60 minutes with slow tasks)

**Strategy**:
- ✅ Only process missing data (no waste)
- ✅ Use fast sources only (TMDB, Wikipedia, Wikidata)
- ⏭️  Skip slow tasks (images, AI translation, heavy scraping)
- 🚀 Run in TURBO mode (100 concurrent, 25ms rate limit)

---

## What It Does

### Fast Phases (Included)

| Phase | Source | Speed | What It Fills |
|-------|--------|-------|---------------|
| **Genres** | TMDB | ~30s | Missing genres[] array |
| **Cast/Crew** | TMDB, Wikipedia | ~60s | Hero, heroine, director, music director |
| **Taglines** | TMDB, Wikipedia, OMDB | ~30s | Catchy taglines (no AI) |
| **Classification** | Multi-signal | ~45s | Primary genre, age rating |
| **Taxonomy** | Rule-based | ~30s | Era, decade, tone, style |
| **Auto-tags** | Algorithm | ~20s | Blockbuster, classic, hidden gem |
| **Audience Fit** | Rule-based | ~30s | Family watch, date movie, group watch |
| **Governance** | Multi-factor | ~45s | Trust score, content type, confidence tier |

**Total**: ~4-5 minutes for all phases

### Slow Phases (Skipped)

| Phase | Why Slow | Time | Manual Command |
|-------|----------|------|----------------|
| **Images** | Multiple source fetching, image downloads | 30-45 min | `npx tsx scripts/enrich-images-fast.ts --only-empty --execute` |
| **Telugu Synopsis** | AI translation via Groq API | 10-20 min | `npx tsx scripts/enrich-telugu-synopsis.ts --execute` |
| **Trivia** | Multiple API calls, box office scraping | 10-15 min | `npx tsx scripts/enrich-trivia.ts --execute` |

---

## Usage

### Basic Usage

```bash
# Check what's missing (dry run)
npx tsx scripts/enrich-smart-fast.ts

# Fill all missing data
npx tsx scripts/enrich-smart-fast.ts --execute
```

### Filtered Usage

```bash
# Enrich specific actor's movies only
npx tsx scripts/enrich-smart-fast.ts --actor="Prabhas" --execute

# Enrich specific director's movies only
npx tsx scripts/enrich-smart-fast.ts --director="Rajamouli" --execute
```

### Options

- `--execute` - Apply changes (default: dry run)
- `--actor=NAME` - Filter by actor/hero
- `--director=NAME` - Filter by director
- `--help` - Show help message

---

## Sample Output

```
╔══════════════════════════════════════════════════════════════════════╗
║           🚀 SMART FAST ENRICHMENT SYSTEM                            ║
║                                                                      ║
║   Strategy: Quick wins only, skip slow tasks                        ║
║   Speed: 2-5 minutes for all missing data                           ║
║   Mode: EXECUTE                                                   ║
╚══════════════════════════════════════════════════════════════════════╝


📊 Checking for missing data...

  genres          8 missing - Fill missing genres (TMDB)
  cast-crew       4 missing - Fill missing cast/crew (TMDB, Wikipedia)
  tagline         30 missing - Fill missing taglines (TMDB, Wikipedia only)
  classification  41 missing - Fill missing classifications
  taxonomy        43 missing - Fill era, decade, tone
  auto-tags       3791 missing - Quality tags (blockbuster, classic, hidden gem)
  audience-fit    64 missing - Family watch, date movie, group watch
  governance      ✓ Complete - Trust scoring and validation

📈 Total missing fields: 3981

🚀 Running fast enrichment phases...

  ✓ genres: Filled 1/8 in 31.9s
  ✓ cast-crew: Filled 2/4 in 58.3s
  ✓ tagline: Filled 6/30 in 29.1s
  ✓ classification: Filled 38/41 in 43.7s
  ✓ taxonomy: Filled 40/43 in 28.4s
  ✓ auto-tags: Filled 3785/3791 in 18.2s
  ✓ audience-fit: Filled 61/64 in 31.5s
  ⏭️ governance: Skipped (already complete)

╔══════════════════════════════════════════════════════════════════════╗
║           📊 ENRICHMENT SUMMARY                                      ║
╚══════════════════════════════════════════════════════════════════════╝

  Total duration: 241.1s (4.0 minutes)
  Phases run: 7
  Successful: 7
  Fields filled: 3933

  Phase breakdown:
    ✓ genres          1 filled in 31.9s
    ✓ cast-crew       2 filled in 58.3s
    ✓ tagline         6 filled in 29.1s
    ✓ classification 38 filled in 43.7s
    ✓ taxonomy       40 filled in 28.4s
    ✓ auto-tags    3785 filled in 18.2s
    ✓ audience-fit   61 filled in 31.5s

  Skipped slow tasks (run manually if needed):
    🖼️  Images (30-45 min) - Use: npx tsx scripts/enrich-images-fast.ts --only-empty --execute
    📝 Telugu Synopsis (10-20 min with AI) - Use: npx tsx scripts/enrich-telugu-synopsis.ts --execute
    🎬 Trivia (10-15 min) - Use: npx tsx scripts/enrich-trivia.ts --execute

📊 Final coverage check...

  genres          ✓ 100% Complete
  cast-crew       ✓ 100% Complete
  tagline         24 still missing
  classification  ✓ 100% Complete
  taxonomy        ✓ 100% Complete
  auto-tags       6 still missing
  audience-fit    3 still missing
  governance      ✓ 100% Complete

✅ Smart Fast Enrichment Complete!
```

---

## Performance Comparison

| Approach | Time | Coverage | Notes |
|----------|------|----------|-------|
| **Full Enrichment** (enrich-master.ts --full) | 60-90 min | 100% | Includes images, AI, all sources |
| **Smart Fast** (enrich-smart-fast.ts) | 4-5 min | 99% | Skips images, AI, slow sources |
| **Individual Scripts** | 30-45 min | Varies | Manual script orchestration |

**Recommendation**: Use Smart Fast for 99% of needs, run slow tasks manually when needed.

---

## Architecture

### Data Flow

```
1. Check Missing Data
   ├── Query database for null/empty fields
   ├── Count missing for each phase
   └── Show summary

2. Run Fast Phases (Only if missing data exists)
   ├── Genres (TMDB only)
   ├── Cast/Crew (TMDB + Wikipedia)
   ├── Taglines (TMDB + Wikipedia + OMDB)
   ├── Classification (multi-signal consensus)
   ├── Taxonomy (rule-based)
   ├── Auto-tags (algorithm)
   ├── Audience Fit (rule-based)
   └── Governance (multi-factor)

3. Skip Slow Phases
   ├── Images (download + multiple sources)
   ├── Telugu Synopsis (AI translation)
   └── Trivia (heavy scraping)

4. Show Results
   ├── Fields filled per phase
   ├── Total duration
   └── Final coverage status
```

### Phase Configuration

Each phase is configured with:
- `name`: Phase identifier
- `script`: Script path to run
- `args`: Base arguments (concurrency, modes)
- `description`: Human-readable description
- `checkField`: Database field to check for missing data

### Smart Skip Logic

```typescript
// Only run phase if data is missing
const beforeCount = await countMissing(phase.checkField);
if (beforeCount === 0) {
  console.log('⏭️ Skipping (already complete)');
  continue;
}

// Run phase
await runPhase(phase, execute);

// Verify what was filled
const afterCount = await countMissing(phase.checkField);
const filled = beforeCount - afterCount;
```

---

## When to Use

### Use Smart Fast When:
- ✅ You need quick coverage improvements
- ✅ Working on initial enrichment
- ✅ Testing enrichment logic
- ✅ Running regular maintenance
- ✅ Time is limited (<5 min available)

### Use Full Enrichment When:
- 🎬 You need poster images
- 📝 You need Telugu synopses
- 📊 You need box office trivia
- 🔍 You want maximum coverage (100%)
- ⏰ You have 60-90 minutes available

### Use Manual Scripts When:
- 🎯 You need specific data type only
- 🔧 You're debugging enrichment logic
- 📋 You want fine-grained control
- 🚫 You want to exclude certain phases

---

## Troubleshooting

### Issue: "All fast-enrichable data is complete!"

**Cause**: No missing data found  
**Solution**: This is good! Run slow tasks manually if needed:

```bash
npx tsx scripts/enrich-images-fast.ts --only-empty --execute
npx tsx scripts/enrich-telugu-synopsis.ts --execute
```

### Issue: Some fields still missing after run

**Cause**: Source data not available  
**Solution**: These are typically edge cases where:
- Movie not in TMDB
- No Wikipedia page
- Very old/obscure films

**Action**: Review manually or wait for more sources

### Issue: Phase failed

**Cause**: API timeout, network issue, or invalid data  
**Solution**: Re-run the specific phase:

```bash
npx tsx scripts/enrich-genres-direct.ts --only-empty --execute
```

---

## Integration with Other Systems

### With Actor Profile Enrichment

```bash
# 1. Enrich movie data (fast)
npx tsx scripts/enrich-smart-fast.ts --actor="Prabhas" --execute

# 2. Enrich actor profile
npx tsx scripts/enrich-actor-profile.ts --actor="Prabhas" --execute

# 3. Enrich actor awards
npx tsx scripts/enrich-actor-awards.ts --actor="Prabhas" --execute
```

### With Batch Processing

```bash
# Process all actors with fast enrichment
npx tsx scripts/batch-discover-all-smart.ts --execute

# Then run smart fast for any remaining gaps
npx tsx scripts/enrich-smart-fast.ts --execute
```

### With Validation

```bash
# 1. Fast enrichment
npx tsx scripts/enrich-smart-fast.ts --execute

# 2. Validate results
npx tsx scripts/validate-all.ts --auto-fix --execute

# 3. Generate report
npx tsx scripts/generate-changes-summary.ts --last-24h
```

---

## Best Practices

1. **Run regularly**: Use as part of daily maintenance
2. **Check dry run first**: Always preview what will be filled
3. **Use filters**: Focus on specific actors/directors when needed
4. **Monitor results**: Check coverage after each run
5. **Fallback to full**: Use full enrichment for critical gaps

---

## Future Enhancements

### Planned Features

- [ ] **Incremental mode**: Only process new movies
- [ ] **Priority queue**: Fill high-priority fields first
- [ ] **Parallel phases**: Run independent phases simultaneously
- [ ] **Smart retry**: Auto-retry failed fields with backoff
- [ ] **Cache results**: Avoid re-fetching same data

### Optional Integrations

- [ ] **Slack notifications**: Alert on completion
- [ ] **Email reports**: Send enrichment summaries
- [ ] **Dashboard**: Real-time progress tracking
- [ ] **Scheduling**: Cron-based automatic runs

---

**Version**: 1.0  
**Status**: Production Ready  
**Maintained By**: Telugu Portal Engineering Team  
**Last Updated**: January 2026
