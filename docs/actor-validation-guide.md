# Actor Filmography Validation Guide

A comprehensive workflow for validating and enriching actor filmographies in the Telugu Portal database. Based on the Daggubati Venkatesh (76 films) and Natural Star Nani (31 films) validation sessions.

## Overview

The validation workflow consists of four phases:

```
Phase 1: Collect → Phase 2: Validate → Phase 3: Fix → Phase 4: Export
```

## Quick Start

```bash
# Step 1: Generate report and review template
npx tsx scripts/validate-actor-filmography.ts --actor="Actor Name" --report-only

# Step 2: Run enrichment for missing data  
npx tsx scripts/enrich-cast-crew.ts --actor="Actor Name" --execute

# Step 3: After manual review, apply corrections
npx tsx scripts/apply-actor-corrections.ts --actor="Actor Name" --input="docs/actor-corrections.csv" --execute

# Step 4: Export final validated filmography
npx tsx scripts/export-actor-filmography.ts --actor="Actor Name" --format=all
```

## Workflow Phases

### Phase 1: Collect Data

The validator collects data from multiple sources:

| Source | Data Collected |
|--------|---------------|
| Database | All films with actor as hero |
| TMDB API | Telugu films from actor's credits |
| Wikipedia | Approximate film count |

### Phase 2: Validate

The validator detects five types of issues:

| Issue Type | Description | Example |
|------------|-------------|---------|
| **Ghost Entries** | Films wrongly attributed to actor | "Alasyam Amrutham" was attributed to Nani but stars Nikhil |
| **Missing Films** | Films in TMDB but not in database | "Jersey (2019)" missing from Nani's filmography |
| **Duplicates** | Same film with different slugs | "Chanti (1991)" and "Chanti (1992)" |
| **TMDB ID Issues** | Wrong TMDB ID (different language) | TMDB ID pointing to Hindi version |
| **Missing Fields** | Empty technical credits | Missing cinematographer, editor, writer |

### Phase 3: Apply Fixes

Two options for applying fixes:

#### Option A: Auto-Fix (High Confidence Issues)

```bash
npx tsx scripts/validate-actor-filmography.ts --actor="Actor Name" --auto-fix --execute
```

Auto-fix applies to:
- Duplicates with same TMDB ID (100% confidence)
- Ghost entries with suggested re-attribution (>90% confidence)

#### Option B: Manual Corrections

1. Review the generated template: `docs/actor-review-template.md`
2. Create corrections CSV:

```csv
action,slug,field,value
update,movie-slug-2020,heroine,Actress Name
re-attribute,wrong-movie-2019,hero,Correct Actor Name
delete,duplicate-slug-2018,,
clear,movie-slug-2017,tmdb_id,
```

3. Apply corrections:

```bash
npx tsx scripts/apply-actor-corrections.ts --actor="Actor Name" --input="corrections.csv" --execute
```

### Phase 4: Export

Generate final validated filmography:

```bash
# CSV format
npx tsx scripts/export-actor-filmography.ts --actor="Actor Name" --format=csv

# All formats (CSV, TSV, Markdown, JSON)
npx tsx scripts/export-actor-filmography.ts --actor="Actor Name" --format=all
```

## Output Files

| File | Description |
|------|-------------|
| `{actor}-anomalies.csv` | Issues requiring manual review |
| `{actor}-anomalies.json` | Full JSON report with all issues |
| `{actor}-review-template.md` | 4-section review template |
| `{actor}-review-template.csv` | Editable template for corrections |
| `{actor}-validation.json` | Complete validation results |
| `{actor}-final-filmography.csv` | Final validated filmography |

## Review Template Sections

The review template has four sections:

### Section 1: Ghost Entries (Re-attribute, don't delete)

Films incorrectly attributed to the actor. Always re-attribute to the correct actor rather than deleting.

**Action**: Change `hero` field to correct actor

### Section 2: Missing Films (Add to database)

Films found in TMDB but not in the database. Verify before adding.

**Action**: Add to database with correct metadata

### Section 3: Missing Technical Credits

Films with empty cinematographer, editor, writer, or producer fields.

**Action**: Fill in missing data from reliable sources

### Section 4: TMDB ID Corrections

Films with incorrect TMDB IDs (wrong language version, not found, etc.).

**Action**: Find correct Telugu TMDB ID or clear invalid ID

## Key Learnings from Validation Sessions

### Venkatesh (76 films, 1986-2025)

- 21 ghost entries required re-attribution
- Multi-starrer handling: F2, F3, SVSC needed hero2 field
- Split music credits: "Songs: X, BGM: Y" format
- Box office data added for major hits

### Nani (31 films, 2008-2026)

- 4 missing films restored (Jersey, Eega, Devadas, Aaha Kalyanam)
- TMDB IDs often pointed to non-Telugu versions
- Technical credits (editor, writer) were 80% missing
- Debut year 2008 added to known actors list

## Validation Rules

```typescript
const VALIDATION_RULES = {
  // Ghost entry detection threshold
  ghostThreshold: 0.3, // Actor must appear in at least 30% of TMDB cast checks
  
  // Duplicate detection
  duplicateTitleSimilarity: 0.85,
  duplicateYearTolerance: 1,
  
  // TMDB language check
  validLanguages: ['te', 'Telugu'],
  
  // Multi-starrer handling
  multiHeroFields: ['hero', 'hero2', 'supporting_cast.type=hero2'],
};
```

## Supported Actors (with Known Debut Years)

| Actor | Debut Year | Validated |
|-------|------------|-----------|
| Daggubati Venkatesh | 1986 | ✅ 76 films |
| Natural Star Nani | 2008 | ✅ 31 films |
| Chiranjeevi | 1978 | - |
| Mahesh Babu | 1999 | - |
| Pawan Kalyan | 1996 | - |
| Nagarjuna | 1986 | - |
| Ram Charan | 2007 | - |
| Allu Arjun | 2003 | - |
| Prabhas | 2002 | - |
| Jr NTR | 2001 | - |

## Best Practices

1. **Don't Delete Ghost Entries**: Re-attribute to correct actor instead
2. **Verify TMDB IDs**: Check language is Telugu before using
3. **Handle Multi-Starrers**: Use hero2 field or supporting_cast with type
4. **Split Music Credits**: Use "X (Songs), Y (BGM)" format when applicable
5. **Batch Reviews**: Process 50 films at a time for manual review
6. **Cross-Reference**: Use TMDB, Wikipedia, and IMDb for verification

## Troubleshooting

### "Actor not found" Error

Ensure actor name matches database exactly. Try variations:
- "Nani" vs "Natural Star Nani"
- "Venkatesh" vs "Daggubati Venkatesh"

### High Number of Ghost Entries

If >50% films are flagged as ghosts, the actor name might be matching incorrectly. Check the hero field pattern.

### TMDB API Rate Limiting

The validator includes rate limiting (100ms delay). For large filmographies, use `--fast` flag with caution:

```bash
npx tsx scripts/validate-actor-filmography.ts --actor="Actor Name" --fast
```

### Missing Debut Year

Add to `KNOWN_DEBUT_YEARS` in `scripts/actor-filmography-audit.ts`:

```typescript
export const KNOWN_DEBUT_YEARS: Record<string, number> = {
  // ... existing entries
  'new actor name': 2010,
};
```

## Script Reference

| Script | Purpose |
|--------|---------|
| `validate-actor-filmography.ts` | Main orchestrator |
| `actor-filmography-audit.ts` | Duplicate and invalid entry detection |
| `validate-actor-movies.ts` | TMDB cast cross-reference |
| `apply-actor-corrections.ts` | Batch correction application |
| `export-actor-filmography.ts` | Final export generation |
| `enrich-cast-crew.ts` | Auto-fill missing data from TMDB |
| `lib/autofix-engine.ts` | Confidence scoring and auto-fix rules |
| `lib/filter-utils.ts` | Actor/director filtering utilities |

## Contributing

To add support for a new actor:

1. Add debut year to `KNOWN_DEBUT_YEARS`
2. Run validation: `npx tsx scripts/validate-actor-filmography.ts --actor="New Actor" --report-only`
3. Review and apply corrections
4. Export final filmography
5. Update this guide with validation status
