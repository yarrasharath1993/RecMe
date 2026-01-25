# Database Integrity Audit - Usage Guide

## Quick Start

```bash
# Run full audit with all validators
npx tsx scripts/audit-database-integrity.ts

# Run specific validators only
npx tsx scripts/audit-database-integrity.ts --validators=duplicates,suspicious

# Enable fuzzy matching (slower but more thorough)
npx tsx scripts/audit-database-integrity.ts --fuzzy-matching

# Test with sample data first
npx tsx scripts/audit-database-integrity.ts --sample=100
```

## Available Validators

### 1. Duplicates (`duplicates`)
Detects exact and fuzzy duplicate movies:
- **Exact**: Same title+year, slug, TMDB/IMDb ID
- **Fuzzy**: Similar titles (transliteration variants, typos)

**Output**: `exact-duplicates.csv`, `fuzzy-duplicates.csv`

### 2. Suspicious Entries (`suspicious`)
Finds problematic entries:
- **Missing fields**: Critical data like director, hero, year
- **Unusual patterns**: Award ceremonies, TV shows, documentaries
- **Data inconsistencies**: Telugu movie without Telugu title, invalid years
- **Statistical outliers**: Abnormal runtime, cast size, etc.

**Output**: `suspicious-entries.csv`, `statistical-outliers.csv`

### 3. Attribution Validation (`attribution`)
Validates cast attributions:
- **Gender mismatches**: Male actor in heroine role, female in hero
- **Impossible pairings**: Same person as hero AND heroine
- **Deceased actors**: Actor in film after death year

**Output**: `wrong-cast-attribution.csv`, `language-mismatches.csv`

### 4. Timeline Validation (`timeline`)
Checks career timelines:
- **Before debut**: Movie before actor's first film
- **After death**: Movie after actor died
- **Impossible age**: Too young/old for role

**Output**: `timeline-issues.csv`

## CLI Options

| Option | Description | Example |
|--------|-------------|---------|
| `--validators` | Comma-separated list of validators | `--validators=duplicates,suspicious` |
| `--batch-size` | Process in batches (not implemented yet) | `--batch-size=500` |
| `--output-dir` | Where to save CSV reports | `--output-dir=docs/audit-reports` |
| `--fuzzy-matching` | Enable fuzzy duplicate detection | `--fuzzy-matching` |
| `--sample` | Test with N movies | `--sample=50` |

## Output Files

All files are saved to `docs/audit-reports/`:

### CSV Reports (Excel-compatible)
1. **exact-duplicates.csv** - High priority merges
2. **fuzzy-duplicates.csv** - Manual review needed
3. **suspicious-entries.csv** - Entries to investigate/delete
4. **wrong-cast-attribution.csv** - Cast corrections needed
5. **timeline-issues.csv** - Career timeline errors
6. **language-mismatches.csv** - Language field corrections
7. **statistical-outliers.csv** - Data entry errors

### Summary Report
- **DATABASE-AUDIT-SUMMARY.md** - Complete overview with statistics

## Interpreting Results

### Exact Duplicates (High Priority)
```csv
ID1,Title1,Year1,Slug1,ID2,Title2,Year2,Slug2,MatchType,Confidence,Action
uuid1,Bahubali,2015,bahubali,uuid2,Baahubali,2015,baahubali,exact_title_year,100%,merge_recommended
```
**Action**: Merge these movies immediately.

### Suspicious Entries
```csv
MovieID,Title,Year,IssueType,Severity,Details,MissingFields,UnusualPattern
uuid,Filmfare Awards South,2017,award_ceremony,critical,"Award ceremony incorrectly added as movie",hero;director,filmfare-awards
```
**Action**: Delete award ceremonies, fix missing fields for real movies.

### Cast Attribution Issues
```csv
MovieID,Title,Year,Actor,Role,Issue,Reason,Confidence,RecommendedFix
uuid,Movie A,2020,Female Actor,hero,wrong_gender,"Female actor in hero field",95%,move_to_heroine
```
**Action**: Swap hero/heroine or correct actor name.

### Timeline Issues
```csv
MovieID,Title,MovieYear,Actor,Issue,ActorDebutYear,ActorDeathYear,Confidence
uuid,Film X,2000,Actor Y,before_debut,2005,,90%
```
**Action**: Check movie year or actor name for errors.

## Performance Notes

- **Basic audit** (duplicates + suspicious): ~1 minute
- **With attribution**: ~12 minutes (fetches celebrity data)
- **With timeline**: ~12 minutes (analyzes full filmographies)
- **Full audit (all validators)**: ~12-15 minutes
- **Fuzzy matching**: +50% time (use sparingly)

## Handling Multiple Heroes/Heroines

The system automatically handles multi-starrer films:
- Comma-separated heroes: `"Hero1, Hero2, Hero3"`
- Comma-separated heroines: `"Heroine1, Heroine2"`
- All are validated individually for gender, timeline, etc.

## Next Steps After Audit

1. **Review CSV files in Excel/Google Sheets**
2. **Sort by Confidence/Severity** (High → Low)
3. **Start with exact duplicates** (quick wins)
4. **Fix critical missing fields**
5. **Investigate unusual patterns**
6. **Validate attribution issues**
7. **Re-run audit** to verify fixes

## Troubleshooting

### "Column does not exist" error
- Database schema mismatch
- Check which fields are queried in `audit-database-integrity.ts`

### Slow performance
- Use `--sample` for testing
- Disable `--fuzzy-matching` if not needed
- Run specific validators instead of all

### Empty celebrity data
- Check if `celebrities` table is populated
- Attribution validator requires this data

### Memory issues
- Reduce batch size (future feature)
- Run validators separately

## Maintenance

Run the audit regularly:
- **After bulk imports**: Check for duplicates
- **Monthly**: Full audit for data quality
- **Before releases**: Ensure clean data

---

**System Version**: 1.0  
**Last Updated**: 2026-01-12  
**Audit Runtime**: ~12-15 minutes for 1000 movies
