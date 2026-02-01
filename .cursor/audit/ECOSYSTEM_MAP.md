# Ecosystem Map

**Generated**: January 25, 2026  
**Scope**: Complete inventory of repositories, scripts, automation, and integrations

---

## Repositories

### Primary Repository
- **Name**: teluguvibes
- **Type**: Next.js monorepo
- **Location**: `c:\Users\mouni\Projects\teluguvibes`
- **Purpose**: Telugu movie intelligence platform

---

## Scripts Inventory

### Location: `/scripts/`

#### Enrichment Scripts (50+)
- `enrich-master.ts` - Master orchestrator (6 layers, parallel execution)
- `enrich-waterfall.ts` - Multi-source waterfall enrichment
- `enrich-cast-crew.ts` - Cast/crew data enrichment
- `enrich-images-fast.ts` - Poster enrichment (TMDB → Wiki → Archive)
- `enrich-genres-direct.ts` - Genre fetch from TMDB/Wiki
- `enrich-telugu-synopsis.ts` - Telugu synopsis via translation
- `enrich-tagline.ts` - Tagline enrichment with confidence
- `enrich-trivia.ts` - Box office, cultural impact
- `enrich-trust-confidence.ts` - Trust badge & confidence scoring
- `enrich-governance.ts` - Governance validation and trust scoring
- `enrich-synopsis-ai.ts` - AI synopsis generation (Groq)
- `enrich-genres-ai.ts` - AI genre inference (Groq)
- `enrich-tagline.ts` - AI tagline generation (Groq)
- `enrich-ai-inference.ts` - General AI inference (Groq)
- `enrich-celebrity-waterfall.ts` - Celebrity data enrichment
- `enrich-actor-profile.ts` - Actor profile enrichment
- `enrich-actor-awards.ts` - Awards enrichment
- `enrich-actor-statistics.ts` - Statistics enrichment
- `enrich-celebrity-metadata-from-wiki.ts` - Wikipedia metadata
- `enrich-movie-metadata-from-wiki.ts` - Movie Wikipedia data
- `enrich-movies-tmdb-turbo.ts` - Turbo TMDB enrichment
- `enrich-missing-genres.ts` - Missing genre fill
- `enrich-trailers-youtube.ts` - YouTube trailer enrichment
- `enrich-music-directors.ts` - Music director enrichment
- `enrich-producer-music.ts` - Producer/music enrichment
- `enrich-content-flags.ts` - Content flag derivation
- `enrich-safe-classification.ts` - Safe primary_genre & age_rating
- `enrich-taxonomy.ts` - Era, decade, tone, style tags
- `enrich-age-rating.ts` - TMDB-based age rating
- `enrich-audience-fit.ts` - Family watch, date movie derivation
- `enrich-trigger-warnings.ts` - Content warnings
- `enrich-cast-images.ts` - Cast image enrichment
- `enrich-cast-crew-tags.ts` - Cast/crew tag enrichment
- `enrich-affected-movies.ts` - Affected movies enrichment
- `enrich-incomplete-movies-turbo.ts` - Incomplete movie turbo fill
- `enrich-critical-gaps-turbo.ts` - Critical gaps turbo fill
- `enrich-high-value-validated.ts` - High-value validated enrichment
- `enrich-updated-movies.ts` - Updated movies refresh
- `enrich-tmdb-display-data.ts` - TMDB display data
- `enrich-movies-with-tmdb-ids.ts` - TMDB ID linking
- `enrich-genres-from-tmdb.ts` - TMDB genre fetch
- `enrich-images-multi-source.ts` - Multi-source image fetch
- `enrich-actor-fast.ts` - Fast actor enrichment
- `enrich-celebrity-metadata-from-wiki.ts` - Celebrity Wikipedia

#### Validation Scripts (20+)
- `validate-all.ts` - Comprehensive validation
- `validate-movies.ts` - Movie validation
- `validate-actor-complete.ts` - Complete actor validation
- `validate-actor-filmography.ts` - Filmography validation
- `validate-actor-movies.ts` - Actor movies validation
- `validate-against-tmdb.ts` - TMDB cross-validation
- `validate-data-quality.ts` - Data quality checks
- `validate-archival-visuals.ts` - Archival visual validation
- `verify-batch.ts` - Batch verification
- `verify-db-connection.ts` - DB connection check
- `verify-fast-audit-fixes.ts` - Fast audit fixes
- `verify-missing-movies.ts` - Missing movie detection
- `verify-slug-policy.ts` - Slug policy verification
- `verify-teja-image.ts` - Image verification
- `verify-chiru-films.ts` - Chiranjeevi film verification
- `verify-multi-source-implementation.ts` - Multi-source verification
- `verify-api-is-using-new-query.ts` - API query verification

#### Audit Scripts (15+)
- `audit-all-movies-turbo.ts` - Turbo movie audit
- `audit-all-actors-filmography.ts` - Actor filmography audit
- `audit-actor-attribution.ts` - Attribution audit
- `audit-celebrity-profiles-complete.ts` - Profile completeness audit
- `audit-duplicate-celebrities.ts` - Duplicate detection
- `audit-movie-data-completeness.ts` - Data completeness audit
- `audit-missing-fields-detailed.ts` - Missing fields audit
- `automated-attribution-audit.ts` - Automated attribution audit
- `actor-filmography-audit.ts` - Filmography audit
- `analyze-incomplete-data.ts` - Incomplete data analysis
- `system-audit.ts` - System-wide audit
- `weekly-audit.ts` - Weekly scheduled audit
- `monitor-data-quality.ts` - Data quality monitoring
- `monitor-slow-tasks.ts` - Slow task monitoring

#### Batch Processing Scripts (10+)
- `batch-validate-all-actors.ts` - Batch actor validation
- `batch-enrich-celebrity-profiles.ts` - Batch celebrity enrichment
- `batch-discover-all-smart.ts` - Smart batch discovery
- `batch-discover-all-continuous.ts` - Continuous batch discovery
- `batch-enrich-reviews.ts` - Batch review enrichment
- `batch-fix-celebrity-images.ts` - Batch image fixes
- `run-full-enrichment-pipeline.ts` - Full pipeline runner
- `run-quick-wins-enrichment.ts` - Quick wins enrichment
- `run-slow-tasks-sequential.ts` - Sequential slow tasks
- `run-optimized-pipeline.ts` - Optimized pipeline

#### Intelligence Scripts (5+)
- `clawdbot.ts` - ClawDBot CLI entry point
- `analyze-actor-priorities.ts` - Actor priority analysis
- `detect-advanced-patterns.ts` - Advanced pattern detection
- `detect-and-fix-patterns.ts` - Pattern detection and fix
- `intel-writer-styles.ts` - Writer style intelligence

#### Fix Scripts (30+)
- `fix-cast-attribution.ts` - Cast attribution fixes
- `fix-wrong-hero-from-csv.ts` - Hero correction from CSV
- `fix-wrong-images.ts` - Image correction
- `fix-missing-critical-data-batch.ts` - Critical data batch fix
- `fix-low-confidence-synopsis.ts` - Low confidence synopsis fix
- `fix-incomplete-data-batch.ts` - Incomplete data batch fix
- `fix-critical-missing-fields.ts` - Critical fields fix
- `fix-chiru-tmdb-ids.ts` - Chiranjeevi TMDB ID fixes
- `fix-balakrishna-filmography.ts` - Balakrishna filmography fixes
- `fix-anr-name-order.ts` - ANR name order fixes
- `fix-advanced-patterns.ts` - Advanced pattern fixes
- `fix-actor-image-posters.ts` - Actor image poster fixes
- `fix-vanisri-complete.ts` - Vanisri complete fixes
- `fix-vanisri-image.ts` - Vanisri image fixes
- `fix-specific-movie-issues.ts` - Specific movie issue fixes
- `fix-nonstandard-genres.ts` - Nonstandard genre fixes
- `fix-validated-movies.ts` - Validated movie fixes
- `apply-attribution-fixes.ts` - Attribution fix application
- `apply-attribution-fixes-from-audit.ts` - Audit-based attribution fixes
- `apply-specific-fixes-2026.ts` - 2026-specific fixes
- `apply-movie-audit-fixes.ts` - Movie audit fix application
- `apply-genre-batch-1.ts` - Genre batch 1 application
- `apply-genre-batch-2.ts` - Genre batch 2 application
- `apply-genre-batch-3.ts` - Genre batch 3 application
- `apply-genre-batch-4-partial.ts` - Genre batch 4 partial
- `apply-rating-updates.ts` - Rating update application
- `apply-final-corrections-refined.ts` - Final corrections refined
- `apply-comprehensive-corrections.ts` - Comprehensive corrections
- `apply-all-phase-corrections-comprehensive.ts` - All phase corrections
- `apply-29-good-movies-corrections.ts` - 29 good movies corrections
- `apply-final-50-comprehensive.ts` - Final 50 comprehensive

#### Data Processing Scripts (20+)
- `merge-duplicate-movies.ts` - Duplicate movie merge
- `link-missing-tmdb-ids.ts` - TMDB ID linking
- `link-missing-tmdb-ids-batch.ts` - Batch TMDB ID linking
- `link-tmdb-high-value.ts` - High-value TMDB linking
- `deduplicate-cast-members.ts` - Cast member deduplication
- `remove-movie.ts` - Movie removal
- `remove-tba-movie-ratings.ts` - TBA rating removal
- `remove-unreleased-ratings.ts` - Unreleased rating removal
- `remove-wrong-posters.ts` - Wrong poster removal
- `delete-placeholder-movies.ts` - Placeholder movie deletion
- `publish-quality-movies-batch-3-4-5.ts` - Quality movie publishing
- `publish-verified-telugu-movies.ts` - Verified Telugu movie publishing
- `quick-publish-ready-11.ts` - Quick publish ready
- `upsert-csv-movies-smart.ts` - Smart CSV movie upsert
- `sync-all-corrections-complete.ts` - Complete corrections sync
- `sync-all-telugu-titles-final.ts` - Final Telugu titles sync
- `update-chiranjeevi-batch1-writers.ts` - Chiranjeevi batch 1 writers
- `update-chiranjeevi-batch2-writers.ts` - Chiranjeevi batch 2 writers
- `update-chiranjeevi-final-display-data.ts` - Chiranjeevi final display
- `update-chiranjeevi-missing.ts` - Chiranjeevi missing updates
- `update-wikipedia-urls.ts` - Wikipedia URL updates
- `update-audit-corrections.ts` - Audit correction updates

#### Pipeline Scripts (5+)
- `run-hot-pipeline.ts` - Hot media pipeline
- `run-full-enrichment-pipeline.ts` - Full enrichment pipeline
- `run-quick-wins-enrichment.ts` - Quick wins enrichment
- `run-slow-tasks-sequential.ts` - Sequential slow tasks
- `run-optimized-pipeline.ts` - Optimized pipeline

#### Ingestion Scripts (10+)
- `ingest-all.ts` - Master ingestion orchestrator
- `ingest-wikipedia-movies.ts` - Wikipedia movie ingestion
- `ingest-tmdb-telugu.ts` - TMDB Telugu ingestion
- `ingest-social.ts` - Social media ingestion
- `discover-entities.ts` - Entity discovery
- `discover-new-celebs.ts` - New celebrity discovery
- `hot-ingest.ts` - Hot media ingestion
- `smart-movie-enrichment.ts` - Smart movie enrichment
- `populate-hot-media.ts` - Hot media population
- `seed-hot-media.ts` - Hot media seeding

#### Utility Scripts (20+)
- `quick-status.ts` - Quick status check
- `quick-enrichment-pipeline.ts` - Quick enrichment pipeline
- `quick-fix-gaps.ts` - Quick gap fixes
- `quick-add-ratings.ts` - Quick rating addition
- `watch-progress.ts` - Progress watcher
- `chiru-summary.ts` - Chiranjeevi summary
- `show-chiranjeevi-dupes.ts` - Chiranjeevi duplicates display
- `recalibrate-rating-breakdowns.ts` - Rating breakdown recalibration
- `refresh-hot-media.ts` - Hot media refresh
- `refresh-hot-telugu.ts` - Hot Telugu refresh
- `restore-aakasa-ramanna-2010.ts` - Movie restoration
- `restore-from-audit.ts` - Audit-based restoration
- `restore-from-benchmarks.ts` - Benchmark-based restoration
- `restore-nagarjuna-movie-associations.ts` - Nagarjuna associations restore
- `revert-music-director-fixes.ts` - Music director fix revert
- `review-all-potential-fixes.ts` - Potential fix review
- `review-final-duplicates.ts` - Final duplicate review
- `review-missing-data.ts` - Missing data review
- `research-final-3-movies.ts` - Final 3 movies research
- `research-remaining-hero-issues.ts` - Remaining hero issues research
- `reattribute-correct-heroes.ts` - Correct hero reattribution
- `set-heroine-na.ts` - Heroine NA setting
- `set-poster-placeholders.ts` - Poster placeholder setting
- `tag-all-movies.ts` - Movie tagging
- `tags-rebuild.ts` - Tag rebuild
- `smart-tag-generator.ts` - Smart tag generation
- `smart-telugu-transliterate.ts` - Smart Telugu transliteration
- `calculate-movie-impact.ts` - Movie impact calculation
- `calculate-data-confidence.ts` - Data confidence calculation
- `generate-attribution-changes-report.ts` - Attribution changes report
- `generate-manual-review-lists.ts` - Manual review list generation
- `generate-priority-queue.ts` - Priority queue generation
- `generate-industry-titles.ts` - Industry title generation
- `generate-canonical-reviews.ts` - Canonical review generation
- `find-correct-tmdb.ts` - Correct TMDB finder
- `final-genre-cleanup.ts` - Final genre cleanup
- `fetch-telugu-titles-wiki.ts` - Telugu titles Wikipedia fetch
- `fetch-missing-profile-images.ts` - Missing profile image fetch
- `fetch-instagram-embeds.ts` - Instagram embed fetch
- `fetch-glamour-images.ts` - Glamour image fetch
- `template-vs-ai-compare.ts` - Template vs AI comparison
- `templates-evolve.ts` - Template evolution
- `templates-publish.ts` - Template publishing
- `rewrite-editorial-reviews.ts` - Editorial review rewrite
- `reviews-coverage.ts` - Review coverage
- `reviews-enhance.ts` - Review enhancement
- `process-confirmed-corrections.ts` - Confirmed correction processing
- `process-remaining-issues.ts` - Remaining issue processing
- `complete-genre-enrichment.ts` - Complete genre enrichment
- `check-ghost-chiru.ts` - Ghost Chiranjeevi check
- `test-automation-modules.ts` - Automation module testing
- `test-balachander-movies.ts` - Balachander movie testing
- `test-enrich-cast-crew-v4.ts` - Cast/crew enrichment v4 testing
- `test-multi-source.ts` - Multi-source testing
- `test-multi-source-validation.ts` - Multi-source validation testing
- `test-nagarjuna-fixes.ts` - Nagarjuna fix testing
- `test-nagarjuna-search-fix.ts` - Nagarjuna search fix testing
- `test-profile-api-directly.ts` - Profile API direct testing
- `test-profile-fix.ts` - Profile fix testing
- `test-profile-movie-count-fix.ts` - Profile movie count fix testing
- `test-profile-query-fix.ts` - Profile query fix testing
- `test-search-performance.ts` - Search performance testing
- `test-telugu-sources.ts` - Telugu source testing
- `test-viral-ingestion.ts` - Viral ingestion testing
- `turbo-enrich-all-gaps.ts` - Turbo gap enrichment
- `turbo-poster-fetch.ts` - Turbo poster fetch
- `safe-reset.ts` - Safe reset
- `seed-category-content.ts` - Category content seeding
- `seed-nagarjuna-entity.ts` - Nagarjuna entity seeding

#### Runner Scripts (2)
- `runners/clawdbot-runner.ts` - ClawDBot 24/7 runner
- `runners/telegram-sender.ts` - Telegram message sender

#### Intel Scripts (1)
- `intel/clawdbot.ts` - ClawDBot CLI entry point

#### Content Platform Scripts (7)
- `content-platform/` - Content platform scripts

#### Library Scripts (48)
- `lib/` - Shared library modules (48 TypeScript files)

---

## Cron Jobs & Scheduled Tasks

### Identified Scheduled Tasks

1. **Weekly Audit** (`scripts/weekly-audit.ts`)
   - Schedule: Every Sunday at 2 AM
   - Purpose: Comprehensive weekly system audit
   - Status: Documented, manual execution

2. **Data Quality Monitoring** (`scripts/monitor-data-quality.ts`)
   - Schedule: Daily at 6 AM (recommended)
   - Purpose: Data completeness and quality checks
   - Status: Documented, manual execution
   - Cron Example: `0 6 * * * cd /path/to/project && npx tsx scripts/monitor-data-quality.ts`

3. **ClawDBot Runner** (`scripts/runners/clawdbot-runner.ts`)
   - Schedule: Configurable interval (default: 60 minutes)
   - Purpose: 24/7 intelligence and trend analysis
   - Status: Implemented, requires manual start
   - Environment: `CLAWDBOT_INTERVAL_MINUTES` (default: 60)

4. **Slow Tasks Monitor** (`scripts/monitor-slow-tasks.ts`)
   - Schedule: Continuous monitoring (setInterval every 10 seconds)
   - Purpose: Monitor long-running enrichment tasks
   - Status: Implemented, manual execution

---

## Bots

### ClawDBot
- **Type**: Read-only intelligence system
- **Location**: `lib/clawdbot/`, `scripts/intel/clawdbot.ts`, `scripts/runners/clawdbot-runner.ts`
- **Purpose**: Audit, trend analysis, idea generation
- **Status**: Implemented
- **Autonomy**: None (always invoked by runner or CLI)
- **Side Effects**: None (read-only, JSON in/out)

### Telegram Bot (Planned)
- **Type**: Notification bot
- **Location**: `scripts/runners/telegram-sender.ts`
- **Purpose**: Send ClawDBot insights and alerts
- **Status**: Implemented, requires configuration
- **Environment Variables**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_ENABLED`

---

## Webhooks

### Identified Webhook Patterns

1. **Slack Webhook** (Documented, not implemented)
   - Purpose: Real-time data quality alerts
   - Location: `monitoring/README.md` (documentation only)
   - Status: Planned

2. **Telegram Webhook** (Potential)
   - Purpose: Receive Telegram bot updates
   - Status: Not implemented (currently uses polling)

3. **GitHub Actions Webhooks** (Potential)
   - Purpose: CI/CD integration
   - Status: Not implemented

---

## Automation Loops

### Active Loops

1. **Enrichment Pipeline Loop**
   - Trigger: Manual or scheduled
   - Components: `enrich-master.ts` → Multi-source orchestrator → Validator → Governance
   - Frequency: On-demand or scheduled
   - Human Gate: Yes (manual trigger)

2. **Validation Loop**
   - Trigger: After enrichment or scheduled
   - Components: `validate-all.ts` → Multi-source validator → Confidence scoring
   - Frequency: On-demand or scheduled
   - Human Gate: Yes (manual trigger)

3. **ClawDBot Analysis Loop**
   - Trigger: Runner (scheduled) or CLI (manual)
   - Components: Runner → ClawDBot CLI → Analyzers → Outputs
   - Frequency: Configurable (default: 60 minutes)
   - Human Gate: Yes (runner requires manual start, outputs require approval)

4. **Data Quality Monitoring Loop**
   - Trigger: Scheduled (cron) or manual
   - Components: `monitor-data-quality.ts` → Quality checks → Reports
   - Frequency: Daily (recommended)
   - Human Gate: Yes (manual cron setup)

5. **Slow Task Monitor Loop**
   - Trigger: Continuous (setInterval)
   - Components: `monitor-slow-tasks.ts` → Progress checks → Console output
   - Frequency: Every 10 seconds
   - Human Gate: Yes (manual execution)

### Feedback Loops

1. **Enrichment → Validation → Fix → Enrichment**
   - Type: Data quality improvement loop
   - Human Gate: Yes (fixes require manual approval)
   - Risk: Low (read-only validation, manual fixes)

2. **ClawDBot Analysis → Insights → Human Review → Implementation**
   - Type: Intelligence → Action loop
   - Human Gate: Yes (all actions require human approval)
   - Risk: Low (ClawDBot is read-only)

3. **Governance → Trust Score → Content Type → Publishing**
   - Type: Content governance loop
   - Human Gate: Yes (publishing requires approval)
   - Risk: Medium (affects content visibility)

---

## LLM Touchpoints

### Groq API Usage
- **Primary Model**: `llama-3.3-70b-versatile`
- **Fallback Models**: `llama-3.1-8b-instant`, `mixtral-8x7b-32768`, `llama3-70b-8192`, `gemma2-9b-it`
- **Usage Locations**:
  - `lib/ai/smart-key-manager.ts` - Centralized AI manager
  - `scripts/enrich-synopsis-ai.ts` - Synopsis generation
  - `scripts/enrich-genres-ai.ts` - Genre inference
  - `scripts/enrich-tagline.ts` - Tagline generation
  - `scripts/enrich-ai-inference.ts` - General inference
  - `scripts/enrich-waterfall.ts` - Waterfall enrichment (last resort)
  - `scripts/enrich-celebrity-waterfall.ts` - Celebrity enrichment
  - `scripts/ai-complete-all-profiles.ts` - Profile completion
  - `scripts/template-vs-ai-compare.ts` - Template comparison
  - `lib/enrichment/translation-service.ts` - Translation service
  - `scripts/fix-low-confidence-synopsis.ts` - Synopsis fixes
  - `scripts/detect-advanced-patterns.ts` - Pattern detection

### OpenAI API Usage
- **Models**: `gpt-4o-mini`, `gpt-4o`, `gpt-3.5-turbo`
- **Usage**: Fallback when Groq unavailable
- **Location**: `lib/ai/smart-key-manager.ts`

### Google Generative AI Usage
- **Status**: Not found in codebase
- **Potential**: Google KG API used (not Generative AI)

---

## External Services

### APIs Used
1. **TMDB** (The Movie Database)
   - Rate Limit: 40 req/sec
   - Purpose: Movie metadata, cast, crew, posters

2. **OMDb** (Open Movie Database)
   - Rate Limit: 10 req/sec
   - Purpose: IMDb ratings, awards

3. **Wikidata**
   - Rate Limit: 50 req/sec
   - Purpose: Structured data, SPARQL queries

4. **Wikipedia**
   - Rate Limit: 100 req/sec
   - Purpose: Infoboxes, filmography tables

5. **Google Knowledge Graph**
   - Rate Limit: 10 req/sec
   - Purpose: Entity descriptions

6. **Groq API**
   - Rate Limit: 30 req/min (configurable)
   - Purpose: LLM inference

7. **OpenAI API**
   - Rate Limit: 60 req/min (configurable)
   - Purpose: LLM inference (fallback)

8. **Telegram Bot API**
   - Rate Limit: 30 messages/sec
   - Purpose: Notifications

### Databases
1. **Supabase** (PostgreSQL)
   - Purpose: Primary database
   - Tables: movies, celebrities, reviews, etc.

---

## Relationships

### Data Flow
```
External APIs → Enrichment Scripts → Multi-Source Orchestrator → Validator → Governance → Database
```

### Intelligence Flow
```
Database → Reports → ClawDBot → Insights → Human Review → Implementation
```

### Automation Flow
```
Scheduler → Runner → Scripts → Database → Reports → ClawDBot → Outputs → Human Review
```

---

## Notes

- All automation requires manual triggers or explicit scheduling
- No fully autonomous loops identified
- All LLM usage is gated by manual script execution
- ClawDBot is read-only and non-autonomous
- All database writes require explicit script execution