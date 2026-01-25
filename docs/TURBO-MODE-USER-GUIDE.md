# TURBO Mode User Guide

## Quick Start

Get up and running with TURBO mode in 3 simple steps:

### 1. Single Actor Enrichment

```bash
# Complete enrichment for one actor (TURBO mode)
npx tsx scripts/validate-actor-complete.ts \
  --actor="Chiranjeevi" \
  --full \
  --turbo \
  --execute
```

### 2. Batch Processing

```bash
# Process all actors with 3+ films
npx tsx scripts/batch-discover-all-smart.ts \
  --start-batch=1 \
  --execute
```

### 3. Check Status

```bash
# View enrichment status
npx tsx scripts/enrich-master.ts --status
```

---

## Speed Modes Explained

### Mode Comparison Table

| Feature | Normal | FAST | TURBO |
|---------|--------|------|-------|
| **Concurrent Requests** | 20 | 50 | 100 |
| **Rate Limit** | 200ms | 50ms | 25ms |
| **Speed Multiplier** | 1x | 5x | 20x |
| **Batch Time (26 actors)** | ~7 hours | ~90 min | ~22 min |
| **API Load** | Light | Medium | Heavy |
| **Recommended For** | Development | Testing | Production |

### When to Use Each Mode

#### Normal Mode
**Use When:**
- Developing new features
- Testing new scrapers
- Debugging data issues
- Working with unreliable network

**Command:**
```bash
npx tsx scripts/validate-actor-complete.ts --actor="Actor Name" --full --execute
```

#### FAST Mode (5x faster)
**Use When:**
- Testing in staging environment
- Small batch processing (1-5 actors)
- Quick data updates
- Good network, moderate API quotas

**Command:**
```bash
npx tsx scripts/validate-actor-complete.ts --actor="Actor Name" --full --fast --execute
```

#### TURBO Mode (20x faster)
**Use When:**
- Production batch processing
- Processing 10+ actors
- Stable network connection
- High API rate limits available
- Time-critical updates

**Command:**
```bash
npx tsx scripts/validate-actor-complete.ts --actor="Actor Name" --full --turbo --execute
```

---

## Command Reference

### validate-actor-complete.ts

Complete actor filmography validation and enrichment.

#### Syntax
```bash
npx tsx scripts/validate-actor-complete.ts [OPTIONS]
```

#### Options

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `--actor=NAME` | Actor name (required) | - | `--actor="Prabhas"` |
| `--full` | Run all phases | false | `--full` |
| `--turbo` | TURBO mode (100 concurrent) | false | `--turbo` |
| `--fast` | FAST mode (50 concurrent) | false | `--fast` |
| `--execute` | Apply changes (vs dry run) | false | `--execute` |
| `--report-only` | Generate report only | false | `--report-only` |
| `--enrich` | Run enrichment phases | false | `--enrich` |
| `--export` | Export filmography | false | `--export` |

#### Examples

**Report Only (No Changes):**
```bash
npx tsx scripts/validate-actor-complete.ts \
  --actor="Mahesh Babu" \
  --report-only
```

**Execute with Enrichment:**
```bash
npx tsx scripts/validate-actor-complete.ts \
  --actor="Mahesh Babu" \
  --execute \
  --enrich \
  --turbo
```

**Complete Workflow:**
```bash
npx tsx scripts/validate-actor-complete.ts \
  --actor="Mahesh Babu" \
  --full \
  --turbo \
  --execute
```

### enrich-master.ts

Master enrichment orchestrator for batch processing.

#### Syntax
```bash
npx tsx scripts/enrich-master.ts [OPTIONS]
```

#### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--full` | Run all 18 phases | `--full` |
| `--layer=N` | Run specific layer (0-6) | `--layer=1` |
| `--phase=NAME` | Run specific phase | `--phase=images` |
| `--actor=NAME` | Filter by actor | `--actor="Prabhas"` |
| `--director=NAME` | Filter by director | `--director="Rajamouli"` |
| `--slug=SLUG` | Single movie by slug | `--slug=baahubali-2` |
| `--turbo` | TURBO mode | `--turbo` |
| `--fast` | FAST mode | `--fast` |
| `--execute` | Apply changes | `--execute` |
| `--status` | Show enrichment status | `--status` |
| `--resume` | Resume from checkpoint | `--resume` |

#### Examples

**Check System Status:**
```bash
npx tsx scripts/enrich-master.ts --status
```

**Run Specific Layer:**
```bash
npx tsx scripts/enrich-master.ts \
  --layer=1 \
  --actor="Prabhas" \
  --turbo \
  --execute
```

**Full Enrichment with TURBO:**
```bash
npx tsx scripts/enrich-master.ts \
  --full \
  --turbo \
  --execute
```

**Resume After Failure:**
```bash
npx tsx scripts/enrich-master.ts \
  --resume \
  --execute
```

### batch-discover-all-smart.ts

Smart batch processor with automatic TURBO→FAST fallback.

#### Syntax
```bash
npx tsx scripts/batch-discover-all-smart.ts [OPTIONS]
```

#### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--start-batch=N` | Starting batch number | `--start-batch=1` |
| `--execute` | Apply changes | `--execute` |

#### Example

```bash
# Process all actors in batches (auto-fallback on errors)
npx tsx scripts/batch-discover-all-smart.ts \
  --start-batch=1 \
  --execute
```

**How It Works:**
1. Starts in TURBO mode (100 concurrent)
2. If errors detected → switches to FAST mode (50 concurrent)
3. Retries failed batch in FAST mode
4. Continues with remaining batches
5. Generates comprehensive report

---

## Multi-Source Data Flow

### Understanding the Pipeline

```
Step 1: Film Discovery
    ↓ Finds missing films from 9 sources
Step 2: Multi-Source Validation
    ↓ Validates against 21 sources, builds consensus
Step 3: Cast & Crew Enrichment
    ↓ Fetches hero, heroine, director, crew from 21 sources
Step 4: Display Data
    ↓ Tagline, synopsis, images, trivia
Step 5: Classification
    ↓ Genres, tags, ratings, audience fit
Step 6: Trust & Governance
    ↓ Scoring, validation, confidence tiers
Step 7: Profile Enrichment
    ↓ Biography, awards, statistics
Step 8: Changes Summary
    ↓ Report generation, export
```

### Consensus Building Example

**Scenario**: Finding the director of "Baahubali"

**Source Results:**
- TMDB: "S. S. Rajamouli" (confidence: 0.95)
- Wikipedia: "S.S. Rajamouli" (confidence: 0.85)
- IdleBrain: "SS Rajamouli" (confidence: 0.88)
- Letterboxd: "S. S. Rajamouli" (confidence: 0.92)
- IMDb: "S.S. Rajamouli" (confidence: 0.90)

**Consensus Algorithm:**
1. Normalize all values → "ss rajamouli"
2. Group similar values → all match
3. Calculate weighted confidence → (0.95+0.85+0.88+0.92+0.90)/5 = 0.90
4. Perfect consensus bonus → 0.90 × 1.1 = 0.99
5. **Result**: "S. S. Rajamouli" with 99% confidence → **AUTO-APPLY**

### Confidence Thresholds

| Confidence | Action | Description |
|------------|--------|-------------|
| **≥90%** | Auto-apply | High confidence, automatic update |
| **75-89%** | Flag conflict | Medium confidence, review recommended |
| **40-74%** | Manual review | Low confidence, requires manual verification |
| **<40%** | Skip | Insufficient data, no action taken |

---

## Workflow Examples

### Example 1: New Actor - Complete Setup

**Goal**: Add and enrich a new actor's complete filmography

**Steps:**

```bash
# 1. Discover and add all films
npx tsx scripts/discover-add-actor-films.ts \
  --actor="New Actor Name" \
  --execute

# 2. Run complete validation and enrichment
npx tsx scripts/validate-actor-complete.ts \
  --actor="New Actor Name" \
  --full \
  --turbo \
  --execute

# 3. Export final filmography
npx tsx scripts/export-actor-filmography.ts \
  --actor="New Actor Name" \
  --format=all \
  --output=docs/new-actor-filmography
```

**Time**: ~5-10 minutes in TURBO mode

### Example 2: Update Existing Actor

**Goal**: Refresh data for an actor with recent releases

**Steps:**

```bash
# 1. Discover any new films
npx tsx scripts/discover-add-actor-films.ts \
  --actor="Prabhas" \
  --execute

# 2. Enrich only new/missing data
npx tsx scripts/enrich-master.ts \
  --actor="Prabhas" \
  --full \
  --turbo \
  --execute

# 3. Validate and export
npx tsx scripts/validate-actor-complete.ts \
  --actor="Prabhas" \
  --report-only
```

**Time**: ~3-5 minutes in TURBO mode

### Example 3: Batch Processing All Actors

**Goal**: Process all actors with 3+ films

**Steps:**

```bash
# 1. Run smart batch processor (auto-fallback)
npx tsx scripts/batch-discover-all-smart.ts \
  --start-batch=1 \
  --execute

# 2. Generate consolidated report
npx tsx scripts/generate-consolidated-discovery-report.ts

# 3. Check for issues
cat docs/CONSOLIDATED-DISCOVERY-REPORT.md
```

**Time**: ~22 minutes for 26 actors in TURBO mode

### Example 4: Fix Data Issues

**Goal**: Clean up duplicates and award entries

**Steps:**

```bash
# 1. Run cleanup script
npx tsx scripts/cleanup-discovery-issues.ts --execute

# 2. Re-validate affected actors
npx tsx scripts/validate-actor-complete.ts \
  --actor="Affected Actor" \
  --full \
  --execute

# 3. Verify changes
npx tsx scripts/generate-changes-summary.ts \
  --actor="Affected Actor"
```

**Time**: ~2-3 minutes per actor

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: Rate Limit Errors

**Symptoms:**
```
Error: 429 Too Many Requests from TMDB
```

**Causes:**
- TURBO mode with high API usage
- Multiple concurrent processes
- API quota exceeded

**Solutions:**

**Solution A**: Fallback to FAST mode
```bash
# Use FAST instead of TURBO
npx tsx scripts/validate-actor-complete.ts \
  --actor="Actor Name" \
  --full \
  --fast \
  --execute
```

**Solution B**: Use smart batch processor (auto-fallback)
```bash
# Automatically handles rate limits
npx tsx scripts/batch-discover-all-smart.ts \
  --start-batch=1 \
  --execute
```

**Solution C**: Increase rate limit delay
```bash
# Manual override (slower but safer)
npx tsx scripts/enrich-master.ts \
  --full \
  --rate-limit=100 \
  --execute
```

#### Issue 2: Source Timeouts

**Symptoms:**
```
Warning: IdleBrain fetch timeout after 15s
```

**Causes:**
- Slow network connection
- Source server issues
- Too many concurrent requests

**Solutions:**

**Solution A**: System continues automatically
- Consensus algorithm handles missing sources
- Other sources provide required data
- No manual intervention needed

**Solution B**: Retry failed sources
```bash
# Run validation again (only processes missing data)
npx tsx scripts/validate-actor-complete.ts \
  --actor="Actor Name" \
  --execute
```

#### Issue 3: Low Confidence Results

**Symptoms:**
```
⚠️ Manual review: Director - confidence 65%
```

**Causes:**
- Sources disagree on data
- Limited source coverage
- Data variations (spelling, formatting)

**Solutions:**

**Solution A**: Review anomaly report
```bash
# Check generated reports
cat docs/actor-name-enhanced-anomalies.csv
```

**Solution B**: Manual verification
1. Check the CSV report for conflicting values
2. Verify against primary sources (TMDB, Wikipedia)
3. Update database manually if needed

**Solution C**: Add more sources
- Enable additional Telugu sources in orchestrator
- Increase source coverage for regional films

#### Issue 4: Duplicate Films

**Symptoms:**
```
⚠️ Potential duplicate: Baahubali (2015) / Baahubali: The Beginning (2015)
```

**Causes:**
- Title variations across sources
- Different release formats
- Regional vs international titles

**Solutions:**

**Solution A**: Run cleanup script
```bash
npx tsx scripts/cleanup-discovery-issues.ts --execute
```

**Solution B**: Manual merge
1. Review duplicate report
2. Choose canonical version
3. Merge data, delete duplicate

#### Issue 5: Checkpoint Corruption

**Symptoms:**
```
Error: Cannot resume from checkpoint - invalid session
```

**Causes:**
- Process interrupted during save
- File system issues
- Manual checkpoint modification

**Solutions:**

**Solution A**: Clear checkpoint and restart
```bash
# Remove checkpoint file
rm .enrichment-checkpoint.json

# Start fresh
npx tsx scripts/enrich-master.ts \
  --full \
  --turbo \
  --execute
```

**Solution B**: Force new session
```bash
# Ignore existing checkpoint
npx tsx scripts/enrich-master.ts \
  --full \
  --execute
# (automatically creates new session)
```

#### Issue 6: Database Connection Errors

**Symptoms:**
```
Error: Supabase connection timeout
```

**Causes:**
- Network issues
- Supabase service down
- Rate limiting on database

**Solutions:**

**Solution A**: Check environment variables
```bash
# Verify .env.local has correct values
cat .env.local | grep SUPABASE
```

**Solution B**: Reduce concurrency
```bash
# Lower database load
npx tsx scripts/enrich-master.ts \
  --full \
  --concurrency=10 \
  --execute
```

**Solution C**: Retry with backoff
```bash
# Wait 5 minutes and retry
sleep 300
npx tsx scripts/enrich-master.ts --resume --execute
```

---

## Best Practices

### 1. Start with Discovery

Always run film discovery before enrichment:

```bash
# ✅ GOOD: Discover first
npx tsx scripts/discover-add-actor-films.ts --actor="Actor" --execute
npx tsx scripts/validate-actor-complete.ts --actor="Actor" --full --execute

# ❌ BAD: Skip discovery
npx tsx scripts/validate-actor-complete.ts --actor="Actor" --full --execute
```

**Why**: Discovery finds missing films before enrichment, ensuring complete coverage.

### 2. Use Report-Only First

Test with dry run before executing:

```bash
# ✅ GOOD: Review first
npx tsx scripts/validate-actor-complete.ts --actor="Actor" --report-only
# Review output
npx tsx scripts/validate-actor-complete.ts --actor="Actor" --execute

# ❌ BAD: Execute blindly
npx tsx scripts/validate-actor-complete.ts --actor="Actor" --execute
```

**Why**: Catch issues before making database changes.

### 3. Use TURBO for Batches Only

Choose appropriate speed mode:

```bash
# ✅ GOOD: TURBO for batch processing
npx tsx scripts/batch-discover-all-smart.ts --execute

# ✅ GOOD: Normal for single actor testing
npx tsx scripts/validate-actor-complete.ts --actor="Actor" --execute

# ❌ BAD: TURBO for testing
npx tsx scripts/validate-actor-complete.ts --actor="Actor" --turbo --execute
```

**Why**: TURBO mode puts heavy load on APIs; use for production batches only.

### 4. Monitor Progress

Check enrichment status regularly:

```bash
# Check overall status
npx tsx scripts/enrich-master.ts --status

# Check actor-specific status
npx tsx scripts/export-actor-filmography.ts \
  --actor="Actor Name" \
  --format=csv \
  --output=docs/status-check
```

### 5. Clean Up Regularly

Run cleanup before major batches:

```bash
# Clean up duplicates and awards
npx tsx scripts/cleanup-discovery-issues.ts --execute

# Then run batch processing
npx tsx scripts/batch-discover-all-smart.ts --execute
```

**Why**: Prevents re-adding known duplicates and award entries.

### 6. Review Changes

Always generate and review changes summary:

```bash
# After enrichment
npx tsx scripts/generate-changes-summary.ts --actor="Actor Name"

# Review the report
cat docs/actor-name-changes-summary.md
```

**Why**: Understand what was changed and verify correctness.

### 7. Export Final Data

Export filmography after enrichment:

```bash
# Export in all formats
npx tsx scripts/export-actor-filmography.ts \
  --actor="Actor Name" \
  --format=all \
  --output=docs/actor-final-filmography
```

**Why**: Creates backup and enables external validation.

---

## Performance Tips

### 1. Optimize Network

- **Use wired connection** for batch processing
- **Avoid VPN** during TURBO mode (adds latency)
- **Check latency** to source servers before running

### 2. Database Optimization

- **Index key fields** (hero, director, release_year)
- **Vacuum database** before large batches
- **Monitor connection pool** usage

### 3. API Key Management

- **Rotate API keys** for high-volume processing
- **Monitor quotas** (TMDB: 40 req/10s, Wikidata: 60 req/min)
- **Use multiple keys** if available

### 4. Resource Management

- **Close other applications** during TURBO mode
- **Monitor memory usage** (Node.js memory limits)
- **Use checkpoint system** for long-running batches

---

## FAQ

### Q: Can I run multiple enrichment processes simultaneously?

**A**: Not recommended. Run one process at a time to avoid:
- Database conflicts
- API rate limit exhaustion
- Resource contention

### Q: How do I know if TURBO mode is working?

**A**: Check the logs for:
```
🚀 TURBO mode enabled: 100 concurrent, 25ms rate limit
```

And monitor completion times (should be ~20x faster).

### Q: What happens if my process crashes?

**A**: Use the checkpoint system:
```bash
npx tsx scripts/enrich-master.ts --resume --execute
```

Enrichment continues from the last completed phase.

### Q: Can I customize confidence thresholds?

**A**: Yes, edit `scripts/lib/confidence-config.ts`:
```typescript
export const CONFIDENCE_THRESHOLDS = {
  AUTO_FIX: 0.90,  // Change to 0.95 for stricter
  MANUAL_REVIEW: 0.75,
  // ...
};
```

### Q: How do I add a new data source?

**A**: Follow the integration guide:
1. Create scraper in `scripts/lib/new-source-scraper.ts`
2. Add to `multi-source-orchestrator.ts`
3. Configure confidence in `confidence-config.ts`
4. Test with single movie first

### Q: What's the cost of running TURBO mode?

**A**: Primarily API quota usage:
- **TMDB**: ~2,000 requests per batch (within free tier)
- **Wikidata**: ~500 SPARQL queries (no limits)
- **Other sources**: Web scraping (no cost)

---

## Getting Help

### Log Files

Check logs for debugging:
```bash
# Batch processing logs
cat batch-all-actors.log
cat batch-turbo-output.log

# Cleanup logs
cat cleanup-discovery-issues.log

# Discovery reports
cat docs/*-discovery-report.csv
```

### Support Resources

- **Architecture Docs**: `docs/TURBO-MODE-ARCHITECTURE.md`
- **System Docs**: `docs/ACTOR-ENRICHMENT-SYSTEM.md`
- **Batch Summary**: `docs/BATCH-PROCESSING-SUMMARY.md`
- **Discovery Workflow**: `docs/DISCOVERY-FIRST-WORKFLOW.md`

### Community

- **GitHub Issues**: Report bugs or feature requests
- **Pull Requests**: Contribute improvements
- **Discussions**: Ask questions, share tips

---

## Version History

- **v1.0** (January 2026): Initial TURBO mode release
  - 20x performance improvement
  - 21-source orchestrator
  - Smart batch processing with auto-fallback
  - 100% success rate in testing

---

**Happy Enriching! 🚀**
