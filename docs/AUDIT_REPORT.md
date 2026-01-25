# System Audit Report: Existing Enrichment & Intelligence Infrastructure

> **Date:** January 15, 2026  
> **Purpose:** Audit existing systems for Movie Impact & Intelligence System implementation  
> **Scope:** Enrichment pipelines, similarity engine, validation, review systems

---

## Executive Summary

The Telugu Portal has robust enrichment and intelligence infrastructure that can be **repurposed and extended** for the new Movie Impact & Intelligence System without rebuilding from scratch.

### Key Findings

**✅ Strong Foundations:**
- Mature enrichment orchestrator with checkpointing and parallel execution
- Sophisticated similarity engine with 12+ matching strategies
- Multi-source validation with consensus-based auto-fix
- Batch job patterns and scheduling infrastructure
- Existing confidence-like signals throughout the system

**⚠️ Gaps to Fill:**
- No formal confidence scoring system (signals exist but not aggregated)
- No entity relations table (text-based slug references only)
- No inference audit trail
- No pattern-based gap filling for missing data
- No counterfactual/impact analysis capability

**🎯 Reusable Components:** 85% of needed functionality exists and can be extended

---

## 1. Enrichment Pipeline Analysis

### 1.1 Master Orchestrator

**File:** [`scripts/enrich-master.ts`](../scripts/enrich-master.ts)

**Capabilities:**
- **Parallel execution**: Phases run in 6 layers with concurrent execution within layers
- **Checkpointing**: Resume-on-failure with `.enrichment-checkpoint.json`
- **Fast mode**: 50 concurrent requests, 50ms rate limit (5-10x faster than default)
- **Turbo mode**: 100 concurrent, 25ms rate limit for maximum speed
- **Multi-pass execution**: 4-pass system for complex dependencies
- **Anomaly detection**: Flags unusual data for manual review
- **Filter support**: By director, actor, slug for targeted enrichment

**Execution Layers:**
```
Layer 0: Pre-validation + Film discovery (if --actor specified)
Layer 1: Images + Cast/Crew (PARALLEL)
Layer 2: Genres → Auto-tags + Classification (PARALLEL)
Layer 3: Audience-fit + Trigger-warnings (PARALLEL)
Layer 4: Tagline + Synopsis + Trivia (PARALLEL)
Layer 5: Trust-confidence + Collaborations
Layer 6: Governance + Validation (SEQUENTIAL)
```

**Performance:**
- 100 movies: ~5 min (fast mode)
- 500 movies: ~15 min (fast mode)
- Supports resumption from any layer

**Reusable for Impact System:**
- ✅ Batch processing framework
- ✅ Parallel execution patterns
- ✅ Checkpointing mechanism
- ✅ Anomaly detection hooks
- ⚠️ **Extend:** Add new phases for impact calculation, confidence scoring

### 1.2 Cast & Crew Enrichment

**File:** [`scripts/enrich-cast-crew.ts`](../scripts/enrich-cast-crew.ts)

**Data Sources (Waterfall):**
1. TMDB Credits API (95% confidence) - Best for all fields
2. IMDb Full Credits (90% confidence) - Excellent for crew
3. Telugu Wikipedia Infobox (85% confidence) - Telugu-specific
4. Wikidata SPARQL (80% confidence) - Structured data
5. MovieBuff (70% confidence) - Telugu-specific reviews
6. JioSaavn (65% confidence) - Music director

**Fields Enriched:**
- Primary: hero, heroine, director
- Extended: music_director, producer
- Supporting cast: 5 actors with roles (JSONB array)
- Crew: cinematographer, editor, writer, choreographer (JSONB object)

**Capabilities:**
- Parallel processing (20-25 concurrent)
- Source confidence scoring per field
- Fuzzy matching for names
- Actor filmography validation
- Film discovery mode (finds missing films for actor)

**Existing Confidence Signals:**
- Source tier (1-3)
- Source weight (0.65-0.95)
- Consensus across sources
- Manual override tracking

**Reusable for Impact System:**
- ✅ Multi-source data fetching
- ✅ Confidence scoring per source
- ✅ Parallel execution pattern
- ✅ Filmography analysis (career trajectory data!)
- ⚠️ **Extend:** Track career milestones, breakthrough detection

### 1.3 Image Enrichment

**File:** [`scripts/enrich-images-fast.ts`](../scripts/enrich-images-fast.ts)

**Data Sources:**
1. TMDB (0.95 confidence)
2. Wikipedia (0.85 confidence)
3. Wikimedia Commons (0.80 confidence)
4. Internet Archive (0.75 confidence)

**Features:**
- Parallel processing (30 concurrent)
- Visual type classification: original_poster, archival_image, placeholder
- Archival source metadata (license, attribution)
- Confidence scoring per image

**Database Fields Updated:**
- `poster_url`
- `poster_confidence` (0.0-1.0)
- `poster_visual_type`
- `archival_source` (JSONB)

**Reusable for Impact System:**
- ✅ Confidence scoring model
- ✅ Multi-source waterfall pattern
- ✅ JSONB metadata storage pattern

---

## 2. Similarity Engine Analysis

**File:** [`lib/movies/similarity-engine.ts`](../lib/movies/similarity-engine.ts)

### 2.1 Core Algorithm

**Similarity Scoring (0-100 scale):**
- Genre overlap: 40 points max
- Director match: 25 points
- Hero match: 20 points
- Heroine match: 15 points
- Era/decade: 10 points
- Additional factors: rating similarity, tag matches

**Function:** `calculateSimilarity(movie1, movie2, options)`

### 2.2 Section Generation

**Function:** `getSimilarMovieSections(movie, allMovies?, options)`

Generates 8-12 sections with different matching strategies:

**Section Types:**
1. **Best Overall Matches** (composite score)
2. **Same Director** (director match)
3. **Same Hero** (hero match)
4. **Same Heroine** (heroine match)
5. **Same Music Director** (music_director match)
6. **Same Producer** (producer match)
7. **Similar Genre** (genre overlap)
8. **Same Era** (era/decade match)
9. **Supporting Cast Collaborations** (supporting_cast overlap)
10. **Same Cinematographer** (crew.cinematographer match)
11. **Blockbusters of Era** (is_blockbuster + era)
12. **Classics of Genre** (is_classic + genre)

**Relevance Scoring:**
- Recency boost: newer movies weighted higher
- Rating quality: higher ratings weighted higher
- Tag similarity: blockbuster, classic, underrated matches
- Supporting cast overlap detection

**Performance:**
- Target: 150-200 movies across 12 sections
- 20 movies per section max
- Smart deduplication across sections

### 2.3 Reusable for Impact System

**✅ Direct Use Cases:**
1. **Finding Inspired Movies**: Use similarity engine to find movies that copied/were influenced
2. **Career Trajectory**: Group movies by hero/director to analyze progression
3. **Genre Shift Detection**: Track genre distribution before/after a significant movie
4. **Collaboration Patterns**: Supporting cast/crew analysis for auto-fill

**⚠️ Extensions Needed:**
- Temporal analysis (before/after a specific movie)
- Influence scoring (beyond just similarity)
- Pattern detection for auto-fill inference

---

## 3. Validation System Analysis

**File:** [`scripts/validate-all.ts`](../scripts/validate-all.ts)  
**Library:** [`lib/validation/multi-source-validator.ts`](../lib/validation/multi-source-validator.ts)

### 3.1 Multi-Source Validation

**Validation Sources:**
```typescript
{
  TMDB: { tier: 1, weight: 1.0, enabled: true },
  Wikipedia: { tier: 2, weight: 0.85, enabled: true },
  Wikidata: { tier: 2, weight: 0.80, enabled: true },
  OMDB: { tier: 3, weight: 0.75, enabled: true }
}
```

**Consensus Logic:**
- **Auto-fix**: When 3+ sources agree with 80%+ total confidence
- **Manual review**: When sources disagree or confidence < 60%
- **Confidence calculation**: Weighted average of source confidences

**Fields Validated:**
- Core: title_en, release_year, runtime_minutes
- Cast: director, hero, heroine, music_director, producer
- Metadata: genres, certification, language

### 3.2 Validation Report Generation

**Output:** Markdown reports with:
- Auto-fixed items (what changed, which sources agreed)
- Needs review items (conflicting source values)
- Field breakdown statistics
- Anomaly detection results

**Batch Processing:**
- 100-500 movies per run
- Filter by field, decade, actor, director
- Filmography validation mode

### 3.3 Existing Confidence Signals

**Identified Signals Throughout System:**

1. **Source-based:**
   - `data_sources` array (TMDB, Wikipedia, etc.)
   - Source tier (1-3)
   - Source weight (0.65-1.0)
   - Consensus count

2. **Quality-based:**
   - `poster_confidence` (0.0-1.0)
   - `completeness_score` (0.0-1.0)
   - `data_confidence` (0.0-1.0) - exists but not fully utilized

3. **Verification-based:**
   - `is_verified` boolean
   - `is_published` boolean
   - Manual overrides count
   - `trust_score` (0-100) - partially implemented

4. **External IDs:**
   - Has `tmdb_id` (+20 confidence)
   - Has `imdb_id` (+15 confidence)
   - Has `wikidata_id` (+10 confidence)

### 3.4 Reusable for Impact System

**✅ Confidence Scoring Foundation:**
- Multi-source consensus algorithm already exists
- Weighted averaging logic
- Tier-based prioritization
- Anomaly detection

**⚠️ Missing:**
- Aggregated confidence_score field (not persisted)
- Confidence breakdown JSON (not stored)
- Inference tracking (no audit log)

---

## 4. Review & Editorial System Analysis

### 4.1 Editorial Review Structure

**Database:** `movie_reviews` table

**Review Dimensions:**
```typescript
{
  story: { rating: number, notes: string },
  direction: { rating: number, notes: string },
  performances: { rating: number, notes: string },
  music: { rating: number, notes: string },
  cinematography: { rating: number, notes: string },
  editing: { rating: number, notes: string },
  production: { rating: number, notes: string },
  entertainment: { rating: number, notes: string },
  rewatch: { rating: number, notes: string },
  verdict: {
    final_rating: number,
    one_liner: string,
    who_should_watch: string,
    who_should_skip: string
  }
}
```

**Smart Review Fields:**
```typescript
{
  why_to_watch: string[],
  why_to_skip: string[],
  critics_pov: string,
  audience_pov: string,
  legacy_status: 'cult_classic' | 'forgotten_gem' | 'landmark' | 'mainstream',
  mood_suitability: string[],
  content_warnings: string[],
  best_of_tags: {
    actor_best: boolean,
    director_best: boolean,
    music_best: boolean
  },
  era_significance: string,
  derivation_confidence: number
}
```

### 4.2 Reusable for Impact System

**✅ Already Contains Impact Data:**
- `legacy_status` field - cultural impact classification
- `era_significance` - historical importance
- `best_of_tags` - career highlights (actor_best, director_best)
- `derivation_confidence` - confidence scoring model

**⚠️ Extend for Counterfactual:**
- Add `career_impact` analysis
- Add `industry_influence` data
- Link to breakthrough/debut tagging

---

## 5. Data Quality Tracking

### 5.1 Existing Quality Metrics

**In Movies Table:**
- `ingestion_status`: raw, partial, enriched, verified, published
- `completeness_score`: 0.0-1.0
- `last_stage_completed`: tracks pipeline progress
- `data_confidence`: 0.0-1.0 (exists but underutilized)
- `confidence_breakdown`: JSONB (exists but not populated)
- `trust_badge`: 'verified', 'high', 'medium', 'low'
- `trust_score`: 0-100 (partially implemented)

**In Enrichment:**
- Stage tracking with timestamps
- Source count tracking
- Manual override detection
- Anomaly flags

### 5.2 Governance Infrastructure

**Existing:**
- `content_type`: 'fact', 'editorial', 'archive', 'disputed'
- `governance_flags`: TEXT[] array
- `enrichment_status`: 'pending', 'partial', 'complete'
- `last_enriched_at`: timestamp

**Missing:**
- Inference audit log (no table)
- Confidence calculation history
- Auto-fill tracking
- Review queue for inferred data

---

## 6. Batch Job Infrastructure

### 6.1 Existing Patterns

**Checkpointing:**
```json
// .enrichment-checkpoint.json
{
  "lastCompletedPhase": "images",
  "lastCompletedLayer": 1,
  "completedPhases": ["images", "cast-crew"],
  "startedAt": "2026-01-15T10:30:00Z",
  "resumable": true
}
```

**Parallel Execution:**
- Layer-based grouping
- Promise.all() for concurrent phases
- Rate limiting (50-100ms between requests)
- Concurrency limits (20-100 concurrent)

**Error Handling:**
- Try-catch per movie
- Continue on error
- Error logging to checkpoint
- Resumption from last successful phase

**Scheduling:**
- Weekly runs for top movies
- Monthly full runs
- On-demand targeted runs (by actor, director, slug)

### 6.2 Reusable Patterns

**✅ For Impact System:**
- Checkpointing for long-running impact calculations
- Parallel processing for 500+ movies
- Layer-based execution for dependency management
- Error recovery and resumption

**✅ For Confidence Scoring:**
- Batch calculation pattern
- Incremental updates (weekly)
- Full recalculation (monthly)

**✅ For Auto-Fill:**
- Targeted runs (missing music_director, producer)
- Confidence thresholds
- Review flagging

---

## 7. Collaboration Analysis

**Table:** `collaborations`

**Tracks:**
- entity1 (type + name)
- entity2 (type + name)
- collaboration_count
- movie_ids array
- first_collab_year, last_collab_year
- hit_rate (percentage)
- avg_rating
- notable_films array

**Used For:**
- Celebrity profile pages
- "Frequent collaborators" sections
- Pattern detection (director-music director pairs)

**Reusable for Impact System:**
- ✅ Collaboration pattern detection for auto-fill
- ✅ Career trajectory analysis (collaboration evolution)
- ✅ Influence network building

---

## 8. Identified Reusable Components

### 8.1 High-Value Reuse

| Component | Location | Reuse Case | Effort |
|-----------|----------|------------|--------|
| Similarity Engine | `lib/movies/similarity-engine.ts` | Find inspired movies, pattern detection | ✅ Direct use |
| Multi-source Validator | `lib/validation/multi-source-validator.ts` | Confidence calculation | ⚠️ Extend algorithm |
| Batch Orchestrator | `scripts/enrich-master.ts` | Impact calculation jobs | ⚠️ Add new phases |
| Collaboration Tracker | `collaborations` table | Pattern inference | ✅ Direct query |
| Filmography Analysis | `enrich-cast-crew.ts` | Career trajectories | ⚠️ Extract + enhance |
| Checkpointing | `.enrichment-checkpoint.json` | Long-running jobs | ✅ Use pattern |
| Parallel Execution | Layer-based execution | Batch processing | ✅ Use pattern |
| Confidence Scoring | Per-source weights | Aggregate confidence | ⚠️ Create aggregator |

### 8.2 Gaps Requiring New Development

| Gap | Current State | Required | Priority |
|-----|---------------|----------|----------|
| **Confidence Aggregation** | Signals exist, not aggregated | Calculator + persistence | HIGH |
| **Entity Relations Table** | Text-based slugs only | New table + population | HIGH |
| **Inference Audit Log** | No tracking | New table + logging | HIGH |
| **Pattern-based Auto-fill** | Manual enrichment only | Inference engine | MEDIUM |
| **Impact Analysis** | No capability | Complete new system | HIGH |
| **Counterfactual Engine** | No capability | Complete new system | HIGH |
| **Review Queue** | No admin interface | Admin UI + workflow | MEDIUM |

---

## 9. Data Architecture Analysis

### 9.1 Current State

**Movies Table:** ~114 fields
- Core identity, release info, visual assets
- **Text-based cast:** hero, heroine, director (slugs, not FKs)
- Extended cast: supporting_cast (JSONB), crew (JSONB)
- Ratings, box office, tags, content flags
- Quality metrics (partially used)

**Celebrities Table:** ~60+ fields
- Profile, bio, career stats
- family_relationships, romantic_pairings, actor_eras (JSONB)
- Awards, milestones, trivia (separate tables)

**Relationship Tracking:**
- `collaborations` table (entity pairs)
- `narrative_events` table (industry moments)
- `movie_similarities` table (precomputed)
- `career_milestones` table (trajectory)

### 9.2 Schema Extension Plan (Additive Only)

**New Tables Needed:**
1. `entity_relations` - Normalize movie-celebrity relationships
2. `inference_audit_log` - Track all inferences
3. (Movies) Add fields: `confidence_score`, `confidence_breakdown`, `inference_flags`, `impact_analysis`, `governance_flags`

**No Destructive Changes:**
- Keep existing text-based hero/heroine/director fields
- entity_relations is supplementary index
- All new fields are additive (ADD COLUMN IF NOT EXISTS)

---

## 10. Recommendations

### 10.1 Quick Wins (Reuse Heavy)

1. **Confidence Scoring** - Aggregate existing signals
   - Input: data_sources, poster_confidence, completeness_score, external IDs
   - Output: confidence_score (0-1), confidence_breakdown (JSON)
   - Effort: 2-3 days

2. **Pattern Detection** - Use similarity engine
   - Find movies with same hero+director for collaboration patterns
   - Detect common supporting actors in genre/era
   - Effort: 3-4 days

3. **Career Trajectory** - Extract from filmography
   - Parse existing actor filmography data
   - Detect first major role, breakthrough, peak
   - Effort: 4-5 days

### 10.2 Medium Effort (Extend Existing)

4. **Entity Relations** - Create supplementary table
   - Populate from existing movie fields
   - No schema changes to movies table
   - Effort: 5-7 days

5. **Auto-fill Pipeline** - Use similarity + patterns
   - Leverage similarity engine for "similar movies"
   - Use collaboration table for "usual suspects"
   - Effort: 7-10 days

### 10.3 New Development Required

6. **Movie Impact Engine** - New capability
   - Career trajectory analysis (reuse filmography data)
   - Industry shift detection (aggregate genre/budget trends)
   - Influence network (use similarity engine)
   - Effort: 10-14 days

7. **Counterfactual Analysis** - New capability
   - "What if" scenarios
   - Timeline visualization
   - Impact quantification
   - Effort: 7-10 days

8. **Review Queue UI** - New admin interface
   - Show pending inferences
   - Approve/reject workflow
   - Bulk operations
   - Effort: 5-7 days

---

## 11. Risk Assessment

### 11.1 Low Risk

- ✅ Confidence scoring (all inputs available)
- ✅ Entity relations (non-destructive addition)
- ✅ Batch jobs (proven patterns)
- ✅ Pattern detection (similarity engine exists)

### 11.2 Medium Risk

- ⚠️ Auto-fill accuracy (inference quality depends on patterns)
- ⚠️ Performance (impact calculation for 5000+ movies)
- ⚠️ Fuzzy matching (entity name to celebrity slug linking)

### 11.3 Mitigation Strategies

1. **Auto-fill Quality:**
   - Start with high-confidence inferences only (>0.7)
   - Require manual review for all inferred data
   - Log all evidence for transparency

2. **Performance:**
   - Use batch jobs (not real-time)
   - Cache impact analysis results
   - Incremental updates (weekly for top movies)

3. **Fuzzy Matching:**
   - Use existing celebrity name variations
   - Confidence threshold for linking (>0.8)
   - Manual review queue for uncertain matches

---

## 12. Implementation Strategy

### 12.1 Phase Prioritization

**Phase 1 (Week 1): Foundation**
- Create 3 new tables (confidence, relations, audit log)
- Build confidence calculator (reuse signals)
- No user-facing changes

**Phase 2 (Week 2-3): Impact Features** ⭐ PRIORITY
- Build movie impact analyzer
- Create UI components
- Calculate for top 500 movies
- User-facing value immediately

**Phase 3 (Week 4): Confidence System**
- Backfill confidence scores
- Expose in admin UI
- Use for data quality reports

**Phase 4 (Week 5): Entity Relations**
- Populate from existing data
- Link to celebrities
- Enable advanced queries

**Phase 5 (Week 6-7): Auto-fill**
- Build inference engine
- Run for music directors, producers
- All flagged for review

**Phase 6 (Week 8): Governance**
- Admin review interface
- Weekly audit job
- Quality reports

**Phase 7 (Week 9): Rollout**
- Feature flags
- Gradual enable
- Monitor metrics

### 12.2 Success Criteria

- ✅ 85% code reuse (vs building from scratch)
- ✅ Zero destructive schema changes
- ✅ All inferences have confidence + audit trail
- ✅ Impact analysis for 500+ movies in week 3
- ✅ 2000+ auto-filled data points with review
- ✅ <200ms page load impact for new features

---

## Conclusion

The Telugu Portal has **excellent foundation** for the Movie Impact & Intelligence System. Approximately **85% of needed functionality exists** and can be repurposed:

**Strengths:**
- Robust enrichment orchestrator with parallel execution
- Sophisticated similarity engine (12+ strategies)
- Multi-source validation with consensus logic
- Existing confidence signals throughout
- Proven batch job patterns
- Collaboration tracking infrastructure

**Gaps:**
- Confidence scoring not aggregated (signals exist)
- No entity relations table (text-based only)
- No inference audit trail
- No pattern-based auto-fill
- No impact/counterfactual analysis

**Recommended Approach:**
1. **Reuse heavy** - Extend existing systems, don't rebuild
2. **Additive only** - New tables and fields, zero destructive changes
3. **Batch-focused** - Heavy computation in background jobs
4. **Confidence-first** - Every inference tracked with confidence + evidence
5. **Gradual rollout** - Feature flags, start with top movies

**Estimated Effort:**
- New development: 35-40 days
- With reuse: 20-25 days (**40% reduction**)

---

**Document Maintained By:** Telugu Portal Engineering  
**Last Updated:** January 15, 2026  
**Next Review:** Phase 2 completion
