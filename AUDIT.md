# Telugu Portal - Global System Audit

**Date:** January 11, 2026  
**Version:** 1.0  
**Scope:** Full platform audit for Governance + Entity Intelligence implementation

---

## Executive Summary

The Telugu Portal is a mature, well-structured movie intelligence platform with **4,857+ movies** and a sophisticated multi-layer enrichment pipeline. This audit identifies:

- ✅ **What Exists** - Comprehensive existing infrastructure
- ♻️ **What is Reusable** - Components ready for governance integration
- ⚠️ **What is Duplicated** - Areas needing consolidation
- ❌ **What is Missing** - Gaps for the governance plan

---

## 1. SCRIPTS INVENTORY

### Location: `/scripts/`

| Script | Purpose | Status | Reusable |
|--------|---------|--------|----------|
| `enrich-master.ts` | Master orchestrator (6 layers, parallel execution) | ✅ Active | ✅ Yes - extend for governance |
| `enrich-images-fast.ts` | Poster enrichment (TMDB → Wiki → Archive) | ✅ Active | ✅ Yes |
| `enrich-cast-crew.ts` | Cast/crew data enrichment | ✅ Active | ✅ Yes |
| `enrich-genres-direct.ts` | Genre fetch from TMDB/Wiki | ✅ Active | ✅ Yes |
| `auto-tag-movies.ts` | Mood tags, quality tags | ✅ Active | ✅ Yes |
| `enrich-safe-classification.ts` | Safe primary_genre & age_rating derivation | ✅ Active | ✅ Yes - KEY for governance |
| `enrich-taxonomy.ts` | Era, decade, tone, style tags | ✅ Active | ✅ Yes |
| `enrich-age-rating.ts` | TMDB-based age rating | ✅ Active | ✅ Yes |
| `enrich-content-flags.ts` | Biopic, remake, pan-india flags | ✅ Active | ✅ Yes |
| `enrich-audience-fit.ts` | Family watch, date movie derivation | ✅ Active | ✅ Yes |
| `enrich-trigger-warnings.ts` | Content warnings | ✅ Active | ✅ Yes |
| `enrich-tagline.ts` | Tagline enrichment with confidence | ✅ Active | ✅ Yes |
| `enrich-telugu-synopsis.ts` | Telugu synopsis via translation | ✅ Active | ✅ Yes |
| `enrich-trivia.ts` | Box office, cultural impact | ✅ Active | ✅ Yes |
| `enrich-trust-confidence.ts` | Trust badge & confidence scoring | ✅ Active | ✅ KEY - Extend for governance |
| `enrich-collaborations.ts` | Actor-director collaborations | ✅ Active | ✅ Yes |
| `cross-verify-audit.ts` | Multi-source validation | ✅ Active | ✅ KEY - Extend for disputes |
| `enrich-comparison-validation.ts` | Secondary source validation | ✅ Active | ✅ Yes |
| `validate-all.ts` | Final validation pass | ✅ Active | ✅ Yes |
| `seed-nagarjuna-entity.ts` | Entity page data seeder | ✅ Active | ✅ Template for others |

### Script Architecture Summary

```
Layer 1: Core Data (images, cast-crew) - PARALLEL
Layer 2: Classifications (genres, tags, age-rating) - SEQUENTIAL with deps
Layer 3: Derived Intelligence (audience-fit, trigger-warnings) - PARALLEL
Layer 4: Extended Metadata (tagline, synopsis, trivia) - PARALLEL
Layer 5: Trust & Graph (trust-confidence, collaborations) - SEQUENTIAL
Layer 6: Validation & Audit (cross-verify, validation) - SEQUENTIAL
```

**Key Insight:** The enrichment pipeline already has confidence scoring, validation, and checkpointing. Governance stages can be **inserted** without rewriting.

---

## 2. DATABASE SCHEMA INVENTORY

### Core Tables

| Table | Purpose | Governance Fields | Status |
|-------|---------|------------------|--------|
| `movies` | Movie data | `data_confidence`, `trust_badge`, `confidence_breakdown` | ✅ Has basic governance |
| `celebrities` | Celebrity profiles | `integrity_rules`, `fan_culture`, `actor_eras` | ⚠️ Migration 028 ready |
| `celebrity_awards` | Awards data | None | ❌ Needs governance fields |
| `celebrity_trivia` | Trivia entries | `is_verified`, `source` | ✅ Basic trust |
| `celebrity_milestones` | Career milestones | `importance`, `impact_score` | ✅ Basic scoring |
| `source_tiers` | Source trust tiers | Full governance | ✅ Complete |
| `enrichment_logs` | Enrichment tracking | `anomaly_flags`, `review_status` | ✅ Complete |

### Existing Governance Columns (Migration 021)

```sql
-- Already on movies table:
data_confidence FLOAT          -- 0.0 to 1.0
trust_badge VARCHAR            -- 'verified', 'high', 'medium', 'low', 'unverified'
confidence_breakdown JSONB     -- Detailed breakdown
last_validated_at TIMESTAMP    -- Freshness tracking
comparison_signals JSONB       -- Secondary source signals
```

### Entity Page Columns (Migration 028 - Ready)

```sql
-- On celebrities table (new):
industry_title TEXT            -- e.g., "The Celluloid Scientist"
usp TEXT                       -- Unique selling point
brand_pillars JSONB            -- Key characteristics
legacy_impact TEXT             -- Industry impact description
family_relationships JSONB     -- Dynasty graph
romantic_pairings JSONB        -- On-screen chemistry
actor_eras JSONB               -- Career era classification
integrity_rules JSONB          -- What NOT to include
fan_culture JSONB              -- Fan engagement data
```

### Missing Columns (Need Migration 029)

```sql
-- Movies governance (to add):
content_type ENUM              -- 'fact', 'archive', 'opinion', 'editorial', 'speculative', 'kids'
trust_score INT                -- 0-100 (more granular than badge)
trust_explanation JSONB        -- Explainability
freshness_score INT            -- 0-100 decay metric
confidence_tier VARCHAR        -- 'high', 'medium', 'low' (explicit)

-- Celebrities governance (to add):
entity_confidence_score FLOAT  -- 0.0 to 1.0
entity_trust_explanation JSONB -- Explainability
```

---

## 3. API ROUTES INVENTORY

### Existing Routes

| Route | Purpose | Governance | Reusable |
|-------|---------|-----------|----------|
| `GET /api/actors/stats` | Actor statistics aggregation | None | ✅ Extend for governance |
| `GET /api/movies/search` | Movie + person search | None | ✅ Yes |
| `GET /api/movies` | Movie listing | None | ✅ Yes |
| `GET /api/movies/sections` | Section-based movie data | None | ✅ Yes |
| `GET /api/profile/[slug]` | Unified entity profile | ✅ Has integrity_rules | ✅ KEY - Extend further |
| `POST /api/admin/movies/[id]/regenerate` | Regenerate movie data | None | ✅ Yes |

### Missing Routes (To Create)

| Route | Purpose |
|-------|---------|
| `GET /api/governance/rules` | Fetch active governance rules |
| `POST /api/governance/validate` | Validate content against rules |
| `GET /api/governance/audit/[entity]` | Get audit log for entity |
| `POST /api/admin/governance/override` | Manual governance override |

---

## 4. LIBRARY MODULES INVENTORY

### Location: `/lib/`

#### Enrichment (`/lib/enrichment/`)

| Module | Purpose | Reusable |
|--------|---------|----------|
| `anomaly-detector.ts` | Detect data anomalies | ✅ KEY - Extend for disputes |
| `enrichment-logger.ts` | Log enrichment activities | ✅ Yes |
| `enrichment-reporter.ts` | Generate enrichment reports | ✅ Yes |
| `genre-patterns.ts` | Genre derivation patterns | ✅ Yes |
| `safe-classification.ts` | Safe genre/rating classification | ✅ KEY - Governance foundation |
| `translation-service.ts` | Multi-model translation | ✅ Yes |

**Key Finding:** `safe-classification.ts` already implements:
- Multi-signal consensus
- Confidence thresholds
- Safety-first approach (never downgrades)
- Explicit uncertainty storage

This is **exactly** what the governance plan needs. Extend, don't rewrite.

#### Validation (`/lib/validation/`)

| Module | Purpose | Reusable |
|--------|---------|----------|
| `multi-source-validator.ts` | Multi-source validation | ✅ KEY - Core governance |
| `index.ts` | Validation exports | ✅ Yes |

**Key Finding:** `multi-source-validator.ts` already has:
- Source tier weighting
- Disagreement detection
- Confidence impact calculation
- Manual review flagging

#### Comparison Sources (`/lib/sources/comparison/`)

| Module | Purpose | Reusable |
|--------|---------|----------|
| `base-adapter.ts` | Base adapter interface | ✅ Yes |
| `rotten-tomatoes.ts` | RT scores | ✅ Yes |
| `filmibeat.ts` | Regional ratings | ✅ Yes |
| `google-kg.ts` | Entity validation | ✅ Yes |
| `idlebrain-sentiment.ts` | Sentiment analysis | ✅ Yes |
| `music-popularity.ts` | Music signals | ✅ Yes |
| `trailer-visibility.ts` | Trailer metrics | ✅ Yes |
| `types.ts` | Type definitions | ✅ KEY - Complete |

#### Pipeline (`/lib/pipeline/`)

| Module | Purpose | Reusable |
|--------|---------|----------|
| `execution-controller.ts` | Pipeline execution control | ✅ Yes |
| `index.ts` | Pipeline exports | ✅ Yes |

#### AI (`/lib/ai/`)

| Module | Purpose | Reusable |
|--------|---------|----------|
| `index.ts` | AI utilities | ✅ Yes |
| `smart-key-manager.ts` | Multi-model API key rotation | ✅ Yes |

#### Other Key Modules

| Module | Purpose | Reusable |
|--------|---------|----------|
| `/lib/celebrity/types.ts` | Celebrity type definitions | ✅ Extend |
| `/lib/compliance/` | Safe fetcher, compliance | ✅ Yes |
| `/lib/movies/similarity-engine.ts` | Movie similarity | ✅ Yes |
| `/lib/movies/recommend-me.ts` | Recommendations | ✅ Yes |
| `/lib/reviews/review-insights.ts` | Review analysis | ✅ Yes |

---

## 5. UI COMPONENTS INVENTORY

### Review Components (`/components/reviews/`)

| Component | Purpose | Governance | Reusable |
|-----------|---------|-----------|----------|
| `TrustBadge.tsx` | Trust level display | ✅ Complete | ✅ KEY |
| `ProfileSection.tsx` | Unified entity profile | ⚠️ Basic | ✅ Extend |
| `ActorProfileSection.tsx` | Actor-specific profile | ⚠️ Basic | ✅ Merge into ProfileSection |
| `CollaboratorStats.tsx` | Collaborator display | None | ✅ Yes |
| `GenreMilestones.tsx` | Career milestones | None | ✅ Yes |
| `CompactCast.tsx` | Cast display | None | ✅ Yes |
| `AgeRatingBadge.tsx` | Age rating display | None | ✅ Yes |
| `AudienceFitBadges.tsx` | Audience fit display | None | ✅ Yes |
| `ContentWarnings.tsx` | Trigger warnings | None | ✅ Yes |
| `SpeculativeDisclaimer.tsx` | Speculative content warning | ✅ Complete | ✅ KEY |
| `QuickVerdictCard.tsx` | Movie verdict | None | ✅ Yes |
| `BoxOfficeCard.tsx` | Box office display | None | ✅ Yes |
| `WhyWatchSkip.tsx` | Watch recommendation | None | ✅ Yes |

**Key Finding:** `TrustBadge.tsx` is already complete with:
- 5 trust levels (verified, high, medium, low, unverified)
- Score-based level derivation
- Confidence breakdown tooltip
- Visual affordances

`SpeculativeDisclaimer.tsx` provides speculative content labeling.

### Missing UI Components

| Component | Purpose |
|-----------|---------|
| `FreshnessIndicator.tsx` | Show data freshness |
| `ConfidenceTooltip.tsx` | Explain confidence score |
| `GovernanceOverrideUI.tsx` | Admin override interface |
| `DisputedDataBanner.tsx` | Show disputed data warning |

---

## 6. TYPE DEFINITIONS INVENTORY

### Location: `/types/`

| File | Purpose | Governance Types |
|------|---------|-----------------|
| `database.ts` | Database types | Has `TrustLevel`, `content_type` |
| `reviews.ts` | Review types | Basic |
| `content-sectors.ts` | Content taxonomy | ✅ Complete - 'fact', 'opinion', 'speculative' |
| `/lib/celebrity/types.ts` | Celebrity types | Basic |
| `/lib/sources/comparison/types.ts` | Source types | ✅ Complete |
| `/lib/enrichment/types.ts` | Enrichment types | ✅ Complete |

**Key Finding:** `content-sectors.ts` already defines:
- `ContentType`: review, article, opinion, archive, **fictional**, etc.
- `claimType`: 'fact', 'opinion', 'quote'
- `fact_confidence_score`

This aligns with the governance plan's content type needs.

---

## 7. WHAT IS REUSABLE (Summary)

### Directly Reusable for Governance

1. **`lib/enrichment/safe-classification.ts`**
   - Multi-signal consensus
   - Confidence thresholds
   - Safety-first approach
   - → Add governance rule enforcement

2. **`lib/validation/multi-source-validator.ts`**
   - Source tier weighting
   - Disagreement detection
   - → Add disputed flagging

3. **`components/reviews/TrustBadge.tsx`**
   - Complete trust visualization
   - → No changes needed

4. **`scripts/enrich-trust-confidence.ts`**
   - Trust scoring
   - → Add governance validation stages

5. **`lib/sources/comparison/*`**
   - All adapters ready
   - → Enable via feature flags

6. **`types/content-sectors.ts`**
   - Content type taxonomy
   - → Use directly

---

## 8. WHAT IS DUPLICATED

| Area | Duplication | Resolution |
|------|-------------|------------|
| Profile Components | `ActorProfileSection` vs `ProfileSection` | Merge into `ProfileSection` |
| Trust Types | Multiple TrustLevel definitions | Consolidate in `/types/governance.ts` |
| Confidence Scoring | In multiple scripts | Extract to `/lib/governance/scoring.ts` |

---

## 9. WHAT IS MISSING

### Critical Gaps

| Gap | Priority | Location |
|-----|----------|----------|
| **Governance Rules Engine** | 🔴 High | `/lib/governance/rules.ts` |
| **Governance Validators** | 🔴 High | `/lib/governance/validators.ts` |
| **Explainability Module** | 🔴 High | `/lib/governance/explainability.ts` |
| **Content Type on Movies** | 🔴 High | Migration 029 |
| **Freshness Decay Logic** | 🟡 Medium | `/lib/governance/freshness.ts` |
| **AI Prompt Templates** | 🟡 Medium | `/prompts/` |
| **Governance API Routes** | 🟡 Medium | `/app/api/governance/` |

### Schema Gaps

```sql
-- Movies table needs:
content_type VARCHAR(50)
trust_score INT
trust_explanation JSONB
freshness_score INT
confidence_tier VARCHAR(20)

-- Celebrities table needs:
entity_confidence_score FLOAT
entity_trust_explanation JSONB
```

---

## 10. MIGRATION PATH

### Phase 1: Governance Foundation (Week 1)

1. Create `/lib/governance/` module:
   - `rules.ts` - Machine-readable rules
   - `validators.ts` - Rule enforcement
   - `explainability.ts` - Score explanations

2. Create Migration 029:
   - Add `content_type`, `trust_score`, `trust_explanation`, `freshness_score`, `confidence_tier` to `movies`
   - Add `entity_confidence_score`, `entity_trust_explanation` to `celebrities`

3. Apply Migration 028 (entity page columns)

### Phase 2: Pipeline Integration (Week 2)

1. Extend `enrich-master.ts`:
   - Add `governanceValidate()` stage
   - Add `trustScoreCompute()` stage
   - Add `freshnessDecayCheck()` stage
   - Add `confidenceExplain()` stage

2. Extend `safe-classification.ts`:
   - Add governance rule checks
   - Add content type derivation

3. Extend `multi-source-validator.ts`:
   - Add disputed flagging
   - Add source conflict logging

### Phase 3: Entity Intelligence (Week 3)

1. Complete `ProfileSection.tsx`:
   - Era views
   - Dynasty graph
   - Pairing chemistry
   - Achievements section

2. Create entity seed scripts for top celebrities

### Phase 4: UI & AI Safety (Week 4)

1. Add UI signals:
   - Freshness indicator
   - Confidence tooltips
   - Disputed data banners

2. Create governed AI prompts:
   - `/prompts/summarize-entity.txt`
   - `/prompts/compare-films.txt`
   - `/prompts/editorial-outline.txt`

---

## 11. RISK ASSESSMENT

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing pipeline | High | Additive-only changes, feature flags |
| Performance degradation | Medium | Parallel governance checks |
| Data migration failures | Medium | Rollback scripts, dry-run mode |
| AI hallucination | High | Strict governance filters, no AI writes without validation |

---

## 12. CONCLUSION

The Telugu Portal has **excellent foundational infrastructure** for governance:

✅ Multi-source validation exists  
✅ Trust scoring exists  
✅ Confidence breakdown exists  
✅ Safe classification exists  
✅ Source tier weighting exists  
✅ Content type taxonomy exists  
✅ UI components (TrustBadge, SpeculativeDisclaimer) exist  

**The governance plan requires:**

1. **Create** `/lib/governance/` module (rules engine)
2. **Extend** existing validation with governance rules
3. **Add** missing database columns (content_type, trust_score, etc.)
4. **Complete** entity profile UI components
5. **Enable** comparison sources via feature flags

**No rewrites required.** The plan is achievable through extension and integration.

---

**Next Step:** Create `/lib/governance/` module with rules engine.
