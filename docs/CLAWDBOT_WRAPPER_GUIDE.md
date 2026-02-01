# ClawDBot Database Wrapper Guide

**Fresh Database Data → ClawDBot Analysis**

---

## Overview

The ClawDBot wrapper queries the database directly, runs validation, converts results to ClawDBot format, and feeds them to ClawDBot automatically. **No need for manual report generation!**

---

## Quick Start

### Basic Usage

```bash
# Direct command (recommended)
npx tsx scripts/intel/clawdbot-wrapper.ts --actor="Chiranjeevi"

# With ideas and drafts
npx tsx scripts/intel/clawdbot-wrapper.ts --actor="Chiranjeevi" --generate-ideas --generate-drafts

# Save to file
npx tsx scripts/intel/clawdbot-wrapper.ts --actor="Daggubati Venkatesh" --output=reports/venkatesh-analysis.json

# Via npm script (alternative)
npm run clawdbot:fresh -- --actor="Chiranjeevi"
```

---

## Command Reference

### Required Options

- `--actor="Actor Name"` - Actor name to analyze (required)

### Optional Options

- `--generate-ideas` - Generate editorial ideas from analyses
- `--generate-drafts` - Generate social media drafts from analyses
- `--output=<path>` - Save output to file (default: stdout)
- `--verbose, -v` - Show detailed progress
- `--help, -h` - Show help message

---

## Examples

### Example 1: Quick Validation Analysis

```bash
npm run clawdbot:fresh -- --actor="Mahesh Babu"
```

**What it does:**
1. Queries database for Mahesh Babu's movies
2. Runs validation checks (duplicates, wrong attribution, TMDB issues)
3. Converts to ClawDBot format
4. Analyzes with ClawDBot
5. Prints results to console

---

### Example 2: Full Analysis with Ideas & Drafts

```bash
npm run clawdbot:fresh -- --actor="Chiranjeevi" --generate-ideas --generate-drafts --output=reports/chiranjeevi-fresh-analysis.json
```

**What it does:**
1. Queries database for Chiranjeevi's movies (fresh data!)
2. Runs validation checks
3. Converts to ClawDBot format
4. Analyzes with ClawDBot
5. Generates editorial ideas
6. Generates social media drafts
7. Saves everything to `reports/chiranjeevi-fresh-analysis.json`

---

### Example 3: Verbose Mode

```bash
npm run clawdbot:fresh -- --actor="Daggubati Venkatesh" --verbose
```

**What it shows:**
- Step-by-step progress
- Database query details
- Validation progress
- Conversion details
- ClawDBot invocation details

---

## How It Works

### Step 1: Database Query

The wrapper queries the database directly:

```typescript
// Fetches all movies where actor is hero
const { data: movies } = await supabase
  .from('movies')
  .select('id, title_en, release_year, hero, tmdb_id, slug')
  .ilike('hero', `%${actor}%`)
  .order('release_year', { ascending: false });
```

**Result:** Fresh data from database (not from old reports)

---

### Step 2: Validation

Runs validation checks using `runActorValidation()`:

- **Duplicates**: Same TMDB ID or similar title+year
- **Wrong Attribution**: Actor not found in TMDB cast
- **No Verification**: Missing TMDB ID

**Result:** Validation result with issues categorized

---

### Step 3: Conversion

Converts validation result to ClawDBot format:

```typescript
const clawdbotInput = convertValidationResultToClawDBot(actor, validationResult);
```

**Result:** ClawDBot-compatible JSON format

---

### Step 4: ClawDBot Analysis

Invokes ClawDBot with converted data:

```bash
npx tsx scripts/intel/clawdbot.ts --validation-report=<temp-file> --generate-ideas --generate-drafts
```

**Result:** ClawDBot analysis output

---

## Comparison: Wrapper vs Manual

### Manual Process (Old Way)

```bash
# Step 1: Generate validation report
npx tsx scripts/validate-actor-filmography.ts --actor="Chiranjeevi" --report-only

# Step 2: Convert report manually (or with script)
# ... manual conversion ...

# Step 3: Run ClawDBot
npx tsx scripts/intel/clawdbot.ts --validation-report=reports/chiranjeevi-validation.json --generate-ideas --generate-drafts
```

**Problems:**
- Multiple steps
- Report might be old
- Manual conversion needed
- Easy to use wrong file

---

### Wrapper Process (New Way)

```bash
# One command - everything automatic!
npm run clawdbot:fresh -- --actor="Chiranjeevi" --generate-ideas --generate-drafts
```

**Benefits:**
- Single command
- Always fresh data
- Automatic conversion
- No manual steps

---

## Output Format

The wrapper produces the same output format as ClawDBot:

```json
{
  "outputs": [
    {
      "type": "validation_analysis",
      "data": {
        "total_issues": 27,
        "critical_count": 0,
        "high_count": 27,
        "explanations": [...],
        "overall_health": "degraded",
        "summary": "..."
      }
    },
    {
      "type": "editorial_ideas",
      "data": {...}
    },
    {
      "type": "social_drafts",
      "data": {...}
    }
  ]
}
```

---

## Troubleshooting

### Issue: "Actor not found"

**Solution:** Check actor name spelling. Use exact name as in database.

```bash
# Check what's in database first
npx tsx scripts/chiru-summary.ts  # For Chiranjeevi
```

---

### Issue: "No movies found"

**Possible causes:**
- Actor name doesn't match database
- Actor has no movies as "hero" (might be in other roles)
- Database connection issue

**Solution:** Verify actor name and check database connection.

---

### Issue: "TMDB API rate limit"

**Solution:** The wrapper includes rate limiting (100ms between calls). If you hit limits, wait a few minutes and retry.

---

## Best Practices

1. **Always use fresh data**: The wrapper queries database directly - always current!

2. **Save outputs**: Use `--output` to save results for later review:
   ```bash
   npm run clawdbot:fresh -- --actor="Actor" --output=reports/actor-analysis.json
   ```

3. **Generate ideas/drafts**: Include `--generate-ideas --generate-drafts` for complete analysis:
   ```bash
   npm run clawdbot:fresh -- --actor="Actor" --generate-ideas --generate-drafts
   ```

4. **Use verbose mode**: When debugging, use `--verbose`:
   ```bash
   npm run clawdbot:fresh -- --actor="Actor" --verbose
   ```

---

## Integration with Existing Workflows

### With Validation Scripts

The wrapper uses the same validation logic as `validate-actor-movies.ts`, so results are consistent.

### With ClawDBot Runner

The wrapper can be integrated into the runner for scheduled analysis:

```typescript
// In clawdbot-runner.ts
import { runActorValidation } from '../validate-actor-movies';
import { convertValidationResultToClawDBot } from '@/lib/clawdbot/converters/validation-converter';

// Use wrapper logic for fresh data
```

---

## Files Created

- `scripts/intel/clawdbot-wrapper.ts` - Main wrapper script
- `lib/clawdbot/converters/validation-converter.ts` - Conversion utilities
- `docs/CLAWDBOT_WRAPPER_GUIDE.md` - This guide

---

## Next Steps

1. ✅ Test wrapper with different actors
2. ✅ Integrate into scheduled workflows
3. ✅ Add support for governance reports
4. ✅ Add support for trend analysis

---

## See Also

- **ClawDBot Testing Guide**: `docs/CLAWDBOT_TESTING_GUIDE.md`
- **ClawDBot Documentation**: `docs/CLAWDBOT.md`
- **Fresh Data Guide**: `docs/CLAWDBOT_FRESH_DATA_GUIDE.md`
