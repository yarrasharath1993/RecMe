# Chiranjeevi Filmography Analysis System

## Overview

This system analyzes Chiranjeevi's complete filmography (160+ films across languages and roles), identifies missing movies, detects wrong attributions, and provides recommendations for fixes.

**Architecture:** Follows ClawDBot principles - separation of concerns between data collection, analysis, and execution.

## System Components

### 1. Data Collection Script
**File:** `scripts/collect-chiranjeevi-filmography.ts`

Collects filmography data from all sources:
- Wikipedia (English)
- Wikidata (SPARQL queries)
- TMDB (API)
- Database (queries ALL cast and crew fields)

**Output:** JSON report with discovered films and existing database movies.

### 2. ClawDBot Analyzer
**File:** `lib/clawdbot/filmography-analyzer.ts`

Pure, read-only analyzer that:
- Identifies missing movies
- Detects wrong attributions
- Generates recommendations with priorities
- NO execution, NO side effects

**Input:** Filmography discovery report JSON
**Output:** Analysis JSON with recommendations

### 3. Execution Script
**File:** `scripts/execute-chiranjeevi-fixes.ts`

Executes fixes based on ClawDBot's recommendations:
- Adds missing movies
- Fixes wrong attributions
- Requires human approval (or `--execute` flag)

## Usage

### Step 1: Collect Data

```bash
# Collect data from all sources
npm run chiranjeevi:collect

# Or with custom output path
npx tsx scripts/collect-chiranjeevi-filmography.ts --output=reports/my-discovery.json
```

**What it does:**
- Fetches films from Wikipedia, Wikidata, TMDB
- Queries database for existing movies (checks ALL fields: hero, heroine, supporting_cast, producer, director, music_director, cinematographer, crew)
- Merges and deduplicates discovered films
- Outputs JSON report

**Output:** `reports/chiranjeevi-filmography-discovery-{timestamp}.json`

### Step 2: Analyze with ClawDBot

```bash
# Analyze discovery report
npm run chiranjeevi:analyze

# Or with custom paths
npx tsx scripts/intel/clawdbot.ts --filmography-report=reports/my-discovery.json --output=reports/my-analysis.json
```

**What it does:**
- Reads discovery report
- Analyzes missing movies and wrong attributions
- Generates recommendations with priorities
- Outputs analysis JSON

**Output:** `reports/chiranjeevi-filmography-analysis.json`

### Step 3: Review Analysis

Open the analysis JSON file and review:
- Missing movies recommendations
- Wrong attribution recommendations
- Statistics (role breakdown, language breakdown, source breakdown)
- Priority levels (high, medium, low)

### Step 4: Execute Fixes

```bash
# Review mode (prompts for approval)
npm run chiranjeevi:execute

# Execute mode (auto-approves)
npm run chiranjeevi:execute -- --execute

# With custom analysis file
npx tsx scripts/execute-chiranjeevi-fixes.ts --analysis=reports/my-analysis.json --execute
```

**What it does:**
- Reads ClawDBot's analysis
- Shows recommendations
- Prompts for approval (unless `--execute` flag)
- Adds missing movies to database
- Fixes wrong attributions

## Features

### All Cast and Crew Roles

The system handles ALL roles:
- **Cast:** hero, heroine, supporting_cast, cameo, child_actor, voice
- **Crew:** producer, director, writer, music_director, cinematographer, editor, choreographer, lyricist, etc.

### Multi-Language Support

Detects and handles films in:
- Telugu
- Tamil
- Hindi
- Kannada
- Malayalam

### Wrong Attribution Detection

Detects:
1. **Not in Sources:** Movies in DB but not found in Wikipedia/Wikidata/TMDB
2. **Wrong Role:** Chiranjeevi listed as hero but should be producer/director/etc.
3. **Wrong Field:** Chiranjeevi in wrong field (e.g., hero instead of supporting_cast)
4. **Duplicates:** Same movie listed multiple times

### Cross-Reference Enhancement

Checks ALL database fields:
- Cast: `hero`, `heroine`, `supporting_cast`, `cast_members`
- Crew: `director`, `directors`, `producer`, `producers`, `music_director`, `cinematographer`, `crew` (JSONB)

## Report Formats

### Discovery Report

```json
{
  "actor": "Chiranjeevi",
  "timestamp": "2026-01-25T...",
  "discoveredFilms": [...],
  "existingMovies": [...],
  "sourceStats": {
    "wikipedia": 150,
    "wikidata": 140,
    "tmdb": 145,
    "database": 138
  }
}
```

### Analysis Report

```json
{
  "actor": "Chiranjeevi",
  "timestamp": "2026-01-25T...",
  "missingMovies": [...],
  "wrongAttributions": [...],
  "statistics": {
    "totalDiscovered": 160,
    "totalInDatabase": 138,
    "missingCount": 22,
    "wrongAttributionCount": 5,
    "roleBreakdown": {...},
    "languageBreakdown": {...}
  },
  "recommendations": {
    "addMovies": [...],
    "fixAttributions": [...]
  },
  "summary": "..."
}
```

## Examples

### Example 1: Complete Workflow

```bash
# 1. Collect data
npm run chiranjeevi:collect

# 2. Analyze
npm run chiranjeevi:analyze

# 3. Review analysis file
# Open reports/chiranjeevi-filmography-analysis.json

# 4. Execute fixes
npm run chiranjeevi:execute
```

### Example 2: Custom Paths

```bash
# Collect with custom output
npx tsx scripts/collect-chiranjeevi-filmography.ts --output=reports/chiru-discovery.json

# Analyze custom file
npx tsx scripts/intel/clawdbot.ts --filmography-report=reports/chiru-discovery.json --output=reports/chiru-analysis.json

# Execute with custom analysis
npx tsx scripts/execute-chiranjeevi-fixes.ts --analysis=reports/chiru-analysis.json --execute
```

### Example 3: Verbose Mode

```bash
# See detailed progress
npx tsx scripts/collect-chiranjeevi-filmography.ts --verbose
npx tsx scripts/execute-chiranjeevi-fixes.ts --analysis=reports/chiranjeevi-filmography-analysis.json --verbose
```

## Safety Features

1. **Human Approval Required:** Execution script prompts for approval (unless `--execute` flag)
2. **Dry Run Capability:** Review analysis before executing
3. **High Priority Filtering:** Only high-priority recommendations are executed by default
4. **Error Handling:** Failed operations are logged, execution continues
5. **Duplicate Prevention:** Checks for existing movies before adding

## Troubleshooting

### Issue: Analysis file not found

**Solution:** Run `npm run chiranjeevi:collect` and `npm run chiranjeevi:analyze` first.

### Issue: No missing movies found

**Possible reasons:**
- All films already in database
- Discovery sources incomplete
- Actor name mismatch

**Solution:** Check discovery report to see what sources returned.

### Issue: Wrong attributions not detected

**Possible reasons:**
- Sources don't have complete role information
- Confidence threshold too high

**Solution:** Review analysis JSON to see confidence scores and sources.

## Notes

- Chiranjeevi's birth year: 1955 (for child actor detection)
- Known for multi-language films (Telugu, Tamil, Hindi, Kannada)
- Has credits in ALL roles: actor, producer, director, writer, music director, cinematographer, etc.
- Some films may be remakes/dubs - handled appropriately
- Wikipedia is primary source but cross-verified with TMDB/Wikidata

## Architecture Notes

- **Data Collection Script** = Handles all I/O (fetching, querying DB) - can have side effects
- **ClawDBot Analyzer** = Pure functions only, NO side effects, NO execution - produces recommendations
- **Execution Script** = Executes fixes with human approval - has side effects (writes to DB)
- Follows ClawDBot principles: READ-ONLY analysis, separation of concerns, human-in-the-loop

## Related Documentation

- `docs/CLAWDBOT.md` - ClawDBot system overview
- `docs/CLAWDBOT_WRAPPER_GUIDE.md` - Using ClawDBot with fresh data
- `docs/CLAWDBOT_TESTING_GUIDE.md` - Testing ClawDBot
