# Batch Processing Quick Start

## Overview

Two complementary batch processing systems for systematic data quality improvement:

1. **Database-Level**: Audits and fixes issues across ALL movies
2. **Actor-Level**: Deep validation per actor using comprehensive filmography validation

---

## 🎯 Quick Commands

### Database Batch Processing (Movies)

```bash
# Full database audit
npx tsx scripts/audit-database-integrity.ts \
  --validators=duplicates,suspicious,attribution,timeline \
  --fuzzy-matching

# Merge duplicates
npx tsx scripts/merge-duplicate-movies.ts \
  --input=docs/audit-reports/full-database/exact-duplicates.csv \
  --execute

# Fix cast issues
npx tsx scripts/fix-cast-attribution.ts \
  --input=docs/audit-reports/full-database/wrong-cast-attribution.csv \
  --execute

# TURBO enrichment (all languages)
for lang in Telugu Tamil Hindi Malayalam Kannada; do
  npx tsx scripts/enrich-movies-tmdb-turbo.ts --language=$lang --limit=1000
done

# Auto-publish discovered movies
npx tsx scripts/publish-discovered-movies.ts --limit=3000 --execute
```

---

### Actor Batch Processing (Filmographies)

```bash
# 1. Analyze priorities (5 min)
npx tsx scripts/analyze-actor-priorities.ts --top=50

# 2. Process top 10 critical actors (2-3 hours)
npx tsx scripts/batch-validate-all-actors.ts \
  --actors="Chiranjeevi,Mahesh Babu,Prabhas,Allu Arjun,Jr NTR,Ram Charan,Venkatesh,Nagarjuna,Nani,Pawan Kalyan" \
  --mode=full \
  --batch-size=5

# 3. OR process all actors in batches (20-30 hours)
npx tsx scripts/batch-validate-all-actors.ts \
  --mode=full \
  --min-movies=5 \
  --batch-size=5

# 4. Resume if interrupted
npx tsx scripts/batch-validate-all-actors.ts --resume --mode=full
```

---

## 🎯 Recommended Workflow

### Phase 1: Database Cleanup (1 hour)
```bash
# Audit entire database
npx tsx scripts/audit-database-integrity.ts --validators=all --fuzzy-matching

# Fix critical issues
npx tsx scripts/merge-duplicate-movies.ts --execute
npx tsx scripts/fix-cast-attribution.ts --execute
```

### Phase 2: TMDB Enrichment (15 min)
```bash
# Enrich all languages in TURBO mode
for lang in Telugu Tamil Hindi Malayalam Kannada; do
  npx tsx scripts/enrich-movies-tmdb-turbo.ts --language=$lang --limit=1000
done
```

### Phase 3: Actor Deep Dive (3 hours for top 10)
```bash
# Identify priorities
npx tsx scripts/analyze-actor-priorities.ts --top=10

# Process critical actors
npx tsx scripts/batch-validate-all-actors.ts \
  --actors="<Top10FromAnalysis>" \
  --mode=full \
  --batch-size=5
```

### Phase 4: Publish & Report (5 min)
```bash
# Auto-publish eligible movies
npx tsx scripts/publish-discovered-movies.ts --execute

# Generate manual review lists
npx tsx scripts/generate-manual-review-lists.ts
```

---

## 📊 Expected Results

### After Database Processing
- **Movies audited**: 1,000+ 
- **Duplicates merged**: 3-10 pairs
- **Cast issues fixed**: 15-20 movies
- **Movies enriched**: 100-200 (TMDB data)
- **Newly published**: 40-50 movies
- **Duration**: ~1 hour

### After Actor Processing (Top 10)
- **Actors validated**: 10
- **Movies covered**: 500-1000
- **Films discovered**: 50-100 new entries
- **Data completeness**: 85%+ (up from 70%)
- **Duration**: 2-3 hours

### After Full Actor Processing (All)
- **Actors validated**: 50-100+
- **Movies covered**: 2,000-3,000
- **Films discovered**: 200-500 new entries
- **Data completeness**: 90%+ database-wide
- **Duration**: 20-30 hours (can run overnight/multi-day)

---

## 🔍 Monitoring Progress

### Database Processing
```bash
# Check audit results
cat docs/audit-reports/full-database/DATABASE-AUDIT-SUMMARY.md

# Review manual items
cat docs/audit-reports/full-database/MANUAL-REVIEW-LIST.md
```

### Actor Processing
```bash
# Check current progress
cat docs/batch-actor-validation/batch-progress.json | jq

# View results
cat docs/batch-actor-validation/batch-validation-results.csv

# Per-actor reports
ls docs/*-enhanced-anomalies.csv
```

---

## 🚀 Performance Tips

### Faster Processing
1. **Use TURBO mode**: 46x faster than sequential
2. **Increase batch size**: Process more in parallel (use 10 for reports, 5 for full)
3. **Skip enrichment**: Use `--mode=execute` instead of `--mode=full`
4. **Filter by priority**: Use `--min-movies=20` to focus on high-impact

### Resource Management
1. **Network**: TURBO mode uses parallel API calls (respect rate limits)
2. **CPU**: Reduce `--batch-size` if CPU constrained
3. **Memory**: Process actors incrementally if memory limited
4. **Disk**: Clean up old reports periodically

---

## 🛠️ Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| API rate limit exceeded | Add `--batch-delay=10000` |
| Network timeout | Retry with `--resume` flag |
| Out of memory | Reduce `--batch-size` to 3 |
| Process takes too long | Use `--mode=report` first |
| Interrupted processing | Use `--resume` to continue |

### Debug Commands
```bash
# Test single movie enrichment
npx tsx scripts/enrich-movies-tmdb.ts --movie-id="<UUID>"

# Test single actor
npx tsx scripts/validate-actor-complete.ts --actor="Test Actor" --report-only

# Check database stats
npx tsx scripts/analyze-actor-priorities.ts --top=5
```

---

## 📁 Output Files Reference

### Database Audit Outputs
```
docs/audit-reports/full-database/
├── exact-duplicates.csv              # Merge candidates
├── fuzzy-duplicates.csv              # Review for potential merges
├── suspicious-entries.csv            # Data quality issues
├── wrong-cast-attribution.csv        # Cast errors
├── COMPLETE-AUDIT-SUMMARY.md         # Comprehensive report
└── MANUAL-REVIEW-LIST.md             # Action items (145 items)
```

### Actor Batch Outputs
```
docs/batch-actor-validation/
├── batch-progress.json               # Real-time progress
├── batch-summary.json                # Final summary
└── batch-validation-results.csv      # All results

docs/
├── actor-priority-analysis.csv       # Prioritized actor list
├── {actor-slug}-enhanced-anomalies.csv     # Per-actor issues
└── {actor-slug}-final-filmography.csv      # Complete filmography
```

---

## 📋 Checklists

### Before Starting
- [ ] `.env.local` configured with API keys (TMDB, Groq)
- [ ] Database connection working
- [ ] Sufficient disk space (~1GB for reports)
- [ ] Network stable (for API calls)

### After Database Processing
- [ ] Review `MANUAL-REVIEW-LIST.md` (145 items)
- [ ] Check `COMPLETE-AUDIT-SUMMARY.md` for metrics
- [ ] Verify published movies visible on site
- [ ] Archive old reports

### After Actor Processing
- [ ] Review `batch-validation-results.csv`
- [ ] Check failed actors (if any)
- [ ] Validate data completeness improved
- [ ] Export final filmographies
- [ ] Update manual review queue

---

## 🎯 Success Metrics

### Database Quality
- ✅ Duplicate rate: <0.5% (down from ~2%)
- ✅ Attribution accuracy: 99%+ (up from ~95%)
- ✅ Published movies: 2,800+ (up from 2,200)
- ✅ TMDB linking: 85%+ (up from 70%)

### Actor Filmographies
- ✅ Data completeness: 90%+ (up from 70%)
- ✅ Missing films discovered: 200-500 new entries
- ✅ Directors: 95%+ movies have directors
- ✅ Posters: 90%+ movies have images

---

## 📞 Next Steps

### Immediate (This Week)
1. Run database audit and review results
2. Process top 10 critical actors
3. Review and merge flagged duplicates

### Short-term (This Month)
1. Complete batch processing for all actors
2. Regular audit schedule (weekly)
3. Monitor new film additions

### Long-term (Next Quarter)
1. Automated nightly batch jobs
2. Data governance framework
3. Quality metrics dashboard

---

**Ready to start?**

```bash
# Quick test run (5 minutes)
npx tsx scripts/analyze-actor-priorities.ts --top=5
npx tsx scripts/batch-validate-all-actors.ts --mode=report --batch-size=2

# Production run (3-4 hours)
npx tsx scripts/audit-database-integrity.ts --validators=all --fuzzy-matching
npx tsx scripts/batch-validate-all-actors.ts --mode=full --batch-size=5 --min-movies=10
```

---

For detailed documentation, see:
- [Full Database Audit Plan](./full_database_audit_&_fix_79b8cf79.plan.md)
- [Batch Actor Validation Guide](./BATCH-ACTOR-VALIDATION-GUIDE.md)
- [Complete Audit Summary](./audit-reports/full-database/COMPLETE-AUDIT-SUMMARY.md)
