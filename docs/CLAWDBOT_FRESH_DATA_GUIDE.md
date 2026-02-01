# Getting Fresh Data for ClawDBot

## The Problem

**ClawDBot is READ-ONLY** - it only processes JSON files. It doesn't query the database directly.

If you use old reports, ClawDBot will analyze old data.

## Solution: Two-Step Process

### Step 1: Generate Fresh Validation Report

Run a validation script to get current database data:

```bash
# Generate fresh validation report for Chiranjeevi
npx tsx scripts/validate-actor-filmography.ts --actor="Chiranjeevi" --report-only
```

This creates a fresh report with current database data.

### Step 2: Convert & Feed to ClawDBot

Convert the report to ClawDBot format, then analyze:

```bash
# Convert report (manual or script)
# Then run ClawDBot
npx tsx scripts/intel/clawdbot.ts --validation-report=reports/chiranjeevi-fresh.json --generate-ideas --generate-drafts
```

## Current Database Status

**Chiranjeevi (as of today):**
- Total films in DB: **138**
- With TMDB ID: 133
- Without TMDB ID: 5
- Potential issues: 9 films with wrong TMDB linkage

## Why Only 138 Films?

Possible reasons for discrepancy with 160+ films:

1. **Not all films added yet** - Some films may not be in database
2. **Filtered out** - Wrong attributions, duplicates removed
3. **Different roles** - Films where Chiranjeevi is not "hero" (supporting, cameo, etc.)
4. **Database scope** - Database may focus on Telugu films only

## Getting Complete Picture

To see all Chiranjeevi films (including non-hero roles):

```bash
# Check all roles
npx tsx scripts/chiru-summary.ts  # Shows hero role only

# Check supporting cast, director, producer roles
# (Would need custom query)
```

## Best Practice

**Always use fresh reports** for ClawDBot analysis:

1. Run validation script → Get fresh JSON
2. Convert to ClawDBot format
3. Run ClawDBot analysis
4. Review results

This ensures ClawDBot analyzes current data, not stale reports.
