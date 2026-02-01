# Validate and Fix All Movies — Orchestrator

End-to-end flow to **validate and fix movies** for all Telugu movies: wrong actor attribution, missing data, no data, and duplicates. Uses **actor as entity** (filmography discovery and validation per actor).

---

## Quick start

```bash
# Audit only (report missing, wrong attribution, data health, duplicates)
npm run movies:validate-and-fix:audit

# Audit top 50 actors (faster)
npm run movies:validate-and-fix:audit:top

# Full flow: audit + fix (report-only, no DB writes)
npm run movies:validate-and-fix:report

# Full flow: audit + fix (execute discovery and batch validation)
npm run movies:validate-and-fix:execute
```

---

## What the orchestrator runs

| Phase | Script | Output |
|-------|--------|--------|
| **Audit** | `audit-all-actors-filmography.ts` | `ALL-ACTORS-MISSING-MOVIES-*.csv`, `ALL-ACTORS-ATTRIBUTION-ISSUES-*.csv`, `ALL-ACTORS-AUDIT-SUMMARY-*.csv` (cwd) |
| **Audit** | `comprehensive-data-health-audit.ts` | `DATA-HEALTH-AUDIT-REPORT-*.md` (cwd) |
| **Audit** | `audit-database-integrity.ts` | `exact-duplicates.csv` in `--output-dir` (default `reports/`) |
| **Fix** (when `--execute`) | `batch-discover-all-actors.ts` | Adds missing films per actor (film-discovery-engine) |
| **Fix** (when `--execute`) | `batch-validate-all-actors.ts` | Validates and fixes per-actor filmography (validate-actor-complete) |
| **Summary** | (orchestrator) | `reports/validate-and-fix-all-movies-{timestamp}.json` |

---

## CLI options

| Option | Description |
|--------|-------------|
| `--phase=audit` | Run only audit steps (filmography, health, duplicates). |
| `--phase=fix` | Run only fix steps (discovery + batch validation). |
| `--phase=all` | Run audit then fix (default). |
| `--report-only` | Run fix phase in report mode (batch-validate report only, no DB writes). |
| `--execute` | Run fix phase with DB writes (discovery + batch validation). |
| `--top=N` | Limit to top N actors (audit-all-actors-filmography, discovery). |
| `--limit=N` | Limit actors in audit (testing). |
| `--output-dir=<path>` | Where to write summary and duplicate CSV (default `reports/`). |
| `--skip-duplicates` | Skip audit-database-integrity (duplicate detection). |
| `--skip-health` | Skip comprehensive-data-health-audit. |
| `--batch-size=N` | Batch size for batch-validate-all-actors (default 10). |

---

## Manual steps after audit

1. **Wrong attribution / reattribute when movie exists**  
   - Open `ALL-ACTORS-ATTRIBUTION-ISSUES-*.csv`.  
   - Feed decisions into `apply-manual-review-decisions.ts` (or repurpose its `WRONG_ATTRIBUTIONS_ACTIONS` / `MISSING_MOVIES_ACTIONS` from CSV).  
   - Or run `apply-attribution-fixes-from-audit.ts` if it accepts your audit format.

2. **Merge duplicates**  
   - Use `exact-duplicates.csv` from `reports/` (or `docs/audit-reports/` if audit-database-integrity was run with that output-dir).  
   - Run:  
     `npx tsx scripts/merge-duplicate-movies.ts --input=reports/exact-duplicates.csv --execute`

3. **Missing data (no hero/director/synopsis)**  
   - Use `DATA-HEALTH-AUDIT-REPORT-*.md` and `identify-movies-for-manual-review.ts` output.  
   - Optionally: `npx tsx scripts/validate-data-quality.ts --all --auto-fix`

---

## Related scripts (actor-as-entity)

- **Identification (find missing movies per actor):** `scripts/lib/film-discovery-engine.ts`, `scripts/discover-add-actor-films.ts`, `scripts/batch-discover-all-actors.ts`
- **Validation per actor:** `scripts/validate-actor-filmography.ts`, `scripts/validate-actor-complete.ts`, `scripts/batch-validate-all-actors.ts`
- **Reattribute when movie exists:** `scripts/apply-manual-review-decisions.ts`, `scripts/apply-attribution-fixes-from-audit.ts`
- **Duplicates:** `scripts/merge-duplicate-movies.ts`, `scripts/audit-database-integrity.ts`
