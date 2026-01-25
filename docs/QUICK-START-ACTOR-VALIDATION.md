# Quick Start: Actor Validation & Enrichment

## 🚀 One-Command Validation (NEW)

```bash
# Full validation, enrichment, and export in one command
npx tsx scripts/validate-actor-complete.ts --actor="Actor Name" --full

# Time: 30-45 minutes (mostly automated)
```

---

## 📋 Step-by-Step Workflow

### Step 1: Discovery (5 mins)
```bash
npx tsx scripts/validate-actor-complete.ts --actor="Actor Name" --report-only
```

**Output**:
- `docs/actor-name-anomalies.csv` - All detected issues
- `docs/actor-name-manual-review-template.csv` - Template for corrections

**Review**: Check for duplicates, wrong TMDB IDs, missing films

---

### Step 2: Auto-Fix (10 mins)
```bash
npx tsx scripts/validate-actor-complete.ts --actor="Actor Name" --execute
```

**Auto-fixes**:
- ✅ Removes duplicates (confidence >= 0.85)
- ✅ Clears wrong TMDB IDs
- ✅ Fixes high-confidence data issues

**Manual**: Address remaining edge cases (re-attributions, missing films)

---

### Step 3: Enrichment (15 mins)
```bash
npx tsx scripts/validate-actor-complete.ts --actor="Actor Name" --enrich
```

**Auto-enriches**:
- ✅ Cast & Crew (hero, heroine, director, music, producer)
- ✅ Display Data (poster, synopsis, tagline, supporting cast)
- ✅ Images (TMDB → Wikipedia → Wikimedia → Archive)

**Coverage**: ~80-90% of missing data

---

### Step 4: Export (2 mins)
```bash
npx tsx scripts/validate-actor-complete.ts --actor="Actor Name" --export
```

**Generates**:
- `docs/actor-name-final-filmography.csv`
- `docs/actor-name-final-filmography.tsv`
- `docs/actor-name-final-filmography.md`
- `docs/actor-name-final-filmography.json`

---

## 📊 Success Metrics (Based on Chiranjeevi)

| Metric | Before | After | Time |
|--------|--------|-------|------|
| Total Films | 135 | 149 | - |
| Data Completeness | 60% | 98.2% | 1-2 hours |
| Missing Posters | 45+ | 4 | 15 mins |
| Missing Synopsis | 80+ | 1 | 10 mins |
| Missing Technical Credits | 120+ | 20 | 30 mins |

---

## 🛠️ Manual Corrections (Optional)

### If you need to fill remaining data manually:

```bash
# 1. Export current state
npx tsx scripts/export-actor-filmography.ts --actor="Actor Name" --format=csv

# 2. Edit CSV with missing data

# 3. Apply corrections
npx tsx scripts/apply-actor-corrections.ts \
  --actor="Actor Name" \
  --input=docs/actor-corrections.csv \
  --execute
```

---

## 📦 Individual Scripts (Advanced)

If you need to run specific phases:

```bash
# Discovery only
npx tsx scripts/validate-actor-filmography.ts --actor="Actor Name" --report-only

# Cast & Crew enrichment
npx tsx scripts/enrich-cast-crew.ts --actor="Actor Name" --execute

# Display data enrichment
npx tsx scripts/enrich-tmdb-display-data.ts --actor="Actor Name" --execute

# Image enrichment
npx tsx scripts/enrich-images-fast.ts --actor="Actor Name" --execute

# Export
npx tsx scripts/export-actor-filmography.ts --actor="Actor Name" --format=all
```

---

## ✅ Validation Checklist

### After running `--full`, verify:

- [ ] Total film count matches expected (check TMDB credits)
- [ ] No duplicates (check by title and TMDB ID)
- [ ] No wrong attributions (all films have correct hero)
- [ ] >= 95% data completeness (poster, synopsis, tagline, crew)
- [ ] All cameos/special appearances correctly classified
- [ ] All 2026 releases marked as "Upcoming" or with correct release date

---

## 🎯 Next Actors to Validate

**Priority 1 (Major Stars)**:
- Pawan Kalyan (~70 films)
- Mahesh Babu (~30 films)
- Allu Arjun (~25 films)
- Jr NTR (~30 films)

**Priority 2 (Character Actors)**:
- Brahmanandam (~1000 films, need sampling strategy)
- Prakash Raj (~300 films)
- Jagapathi Babu (~120 films)

**Priority 3 (New Generation)**:
- Vijay Deverakonda (~15 films)
- Rashmika Mandanna (~30 films)
- Samantha Ruth Prabhu (~50 films)

---

## 📚 Resources

- **Complete Workflow**: `docs/actor-validation-complete-workflow.md`
- **Chiranjeevi Case Study**: `docs/chiranjeevi-validation-summary.md`
- **Script Reference**: `scripts/validate-actor-complete.ts`

---

## 💡 Tips

1. **Always start with `--report-only`** to see what needs fixing
2. **Run `--execute` only after reviewing anomalies** to avoid data loss
3. **Manual review is fastest in CSV** format (use Excel/Google Sheets)
4. **Multi-source images** (Wikipedia often has posters when TMDB doesn't)
5. **Writer credits are hardest to find** - use IMDb full credits page
6. **1980s films may not have online posters** - acceptable gap
7. **Upcoming 2026 films** - mark as "TBA" for missing data

---

**Last Updated**: Jan 12, 2026  
**Validated Actors**: Venkatesh ✅ | Nani ✅ | Allari Naresh ✅ | Chiranjeevi ✅
