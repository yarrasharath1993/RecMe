# Telugu Portal: Celebrity & Movie Data Architecture Audit

> **Last Updated:** January 15, 2026  
> **Purpose:** Complete overview of celebrity and movie data structures and relationships for system enhancement planning

---

## Executive Summary

The Telugu Portal has a sophisticated data architecture connecting **celebrities** and **movies** through multiple relationship layers. The system tracks ~513 celebrities and ~5,029 movies with rich metadata, career trajectories, and collaborative relationships.

### Key Strengths
- ✅ Comprehensive celebrity profiles with industry identity, career stats, and fan culture
- ✅ Detailed movie metadata with extended cast/crew (supporting actors, technical crew)
- ✅ Multi-source data validation (TMDB, Wikipedia, Wikidata, IMDb)
- ✅ Relationship graphs (collaborations, romantic pairings, family dynasties)
- ✅ Awards tracking and career milestones
- ✅ Editorial scoring and smart reviews

### Key Gaps
- ⚠️ **No direct foreign key relationships** between movies and celebrities (text-based linking only)
- ⚠️ Romantic pairings and actor eras require manual generation due to text-based relationships
- ⚠️ ~60 celebrities without profile images (88.3% coverage)
- ⚠️ Pre-1990 movie data completeness is lower (~40% for pre-1980s)

---

## Table of Contents

1. [Celebrity Data Structure](#1-celebrity-data-structure)
2. [Movie Data Structure](#2-movie-data-structure)
3. [Relationship Layer](#3-relationship-layer)
4. [Data Enrichment Pipeline](#4-data-enrichment-pipeline)
5. [Connectivity Patterns](#5-connectivity-patterns)
6. [Enhancement Opportunities](#6-enhancement-opportunities)

---

## 1. Celebrity Data Structure

### 1.1 Core Celebrity Profile (`celebrities` table)

#### Basic Identity
```typescript
{
  id: UUID,
  name_en: string,           // "Akkineni Nagarjuna"
  name_te?: string,           // "అక్కినేని నాగార్జున"
  slug: string,               // "akkineni-nagarjuna" (unique identifier)
  profile_image?: string,     // Profile photo URL
  cover_image_url?: string,   // Banner image
  gender?: 'male' | 'female' | 'other',
  birth_date?: Date,
  death_date?: Date,
  birth_place?: string,
  nationality?: string
}
```

#### Professional Identity
```typescript
{
  occupation: string[],       // ['actor', 'producer', 'director']
  industry_title?: string,    // "The Celluloid Scientist", "Megastar"
  usp?: string,               // Unique selling point
  brand_pillars?: string[],   // ["Genre versatility", "Technical modernism"]
  legacy_impact?: string      // Industry impact paragraph
}
```

#### Biography
```typescript
{
  short_bio?: string,         // 2-3 sentence summary (EN)
  short_bio_te?: string,      // Telugu version
  full_bio?: string,          // Complete biography (EN)
  full_bio_te?: string,       // Telugu version
  biography?: string,         // Alias for full_bio
  biography_te?: string       // Alias for full_bio_te
}
```

#### Career Statistics
```typescript
{
  total_movies?: number,      // Total filmography count
  hits_count?: number,        // Number of hit movies
  flops_count?: number,       // Number of flops
  hit_rate?: number,          // Success percentage (0-100)
  awards_count?: number,      // Total awards won
  debut_movie?: string,       // First film
  debut_year?: number,        // Career start year
  breakthrough_movie?: string,// Breakthrough film
  peak_year?: number,         // Career peak
  era?: string                // 'legend' | 'golden' | 'classic' | 'current' | 'emerging'
}
```

#### Relationships & Connections
```typescript
{
  // Family dynasty graph
  family_relationships?: {
    father?: { name: string, slug: string },
    mother?: { name: string, slug: string },
    spouse?: { name: string, slug: string },
    sons?: Array<{ name: string, slug: string }>,
    daughters?: Array<{ name: string, slug: string }>,
    siblings?: Array<{ name: string, slug: string }>,
    nephews?: Array<{ name: string, slug: string }>
  },
  
  // On-screen pairings
  romantic_pairings?: Array<{
    name: string,
    slug: string,
    count: number,              // Number of movies together
    highlight: string,          // What makes them special
    films: string[]             // Movie titles
  }>,
  
  spouse?: string,              // Spouse name (text field)
  children_count?: number,
  family_details?: Object       // Additional family info
}
```

#### Career Eras
```typescript
{
  actor_eras?: Array<{
    name: string,               // "Golden Era", "Experimental Phase"
    years: string,              // "1986-2000"
    themes: string[],           // ["Action", "Romance", "Family Drama"]
    key_films: string[]         // Notable movies from this era
  }>
}
```

#### Fan Culture & Trivia
```typescript
{
  fan_culture?: {
    fan_identity: string,       // "Mega Fans", "Nag Army"
    cultural_titles: string[],  // Titles given by fans
    viral_moments: string[],    // Memorable fan events
    trivia: string[]            // Interesting facts
  },
  
  nicknames?: string[],         // Popular nicknames
  signature_style?: string,     // Acting/directing style
  known_for?: string[]          // Famous for these things
}
```

#### External IDs & Social Links
```typescript
{
  tmdb_id?: number,             // The Movie Database ID
  imdb_id?: string,             // IMDb ID (e.g., "nm0001234")
  wikidata_id?: string,         // Wikidata QID
  wikipedia_url?: string,       // Wikipedia page URL
  
  social_links?: Array<{
    platform: 'instagram' | 'twitter' | 'facebook' | 'youtube',
    url: string,
    handle?: string
  }>,
  
  instagram_handle?: string,
  twitter_handle?: string,
  youtube_channel?: string
}
```

#### Data Quality & Governance
```typescript
{
  trust_score?: number,         // 0-100 trust score
  confidence_tier?: string,     // 'verified' | 'high' | 'medium' | 'low'
  entity_confidence_score?: number,  // 0.0-1.0
  freshness_score?: number,     // Data freshness indicator
  is_verified?: boolean,        // Verified by editors
  is_published?: boolean,       // Publicly visible
  enrichment_status?: string,   // 'pending' | 'partial' | 'complete'
  last_enriched_at?: Date,
  popularity_score?: number     // For trending/featured
}
```

#### Integrity Rules
```typescript
{
  integrity_rules?: {
    exclude_movies: string[],   // Movies to not include in filmography
    notes: string[],            // Special handling notes
    flag_as_antagonist: string[] // Mark specific roles as villain
  }
}
```

### 1.2 Celebrity Sub-Entities

#### Celebrity Awards (`celebrity_awards` table)
```typescript
{
  id: UUID,
  celebrity_id: UUID,           // References celebrities.id
  award_name: string,           // "Filmfare Award"
  award_type: 'national' | 'filmfare' | 'nandi' | 'siima' | 'cinemaa' | 'other',
  category: string,             // "Best Actor", "Best Director"
  year: number,
  movie_id?: UUID,              // References movies.id
  movie_title?: string,
  is_won: boolean,              // true = won, false = nominated
  is_nomination?: boolean,
  award_body?: string,          // Award organization name
  source?: string,              // Data source
  source_url?: string,          // Verification URL
  created_at: Date,
  updated_at: Date
}
```

#### Celebrity Trivia (`celebrity_trivia` table)
```typescript
{
  id: UUID,
  celebrity_id: UUID,
  trivia_text: string,          // The trivia content (EN)
  trivia_text_te?: string,      // Telugu version
  category: 'personal' | 'career' | 'fun_fact' | 'controversy' | 'family' | 'education',
  source_url?: string,
  is_verified: boolean,
  is_published: boolean,
  display_order: number,        // For sorting
  created_at: Date,
  updated_at: Date
}
```

#### Celebrity Milestones (`celebrity_milestones` table)
```typescript
{
  id: UUID,
  celebrity_id: UUID,
  milestone_type: 'debut' | 'breakthrough' | 'peak' | 'comeback' | 
                  'downfall' | 'retirement' | 'award' | 'record',
  year: number,
  movie_id?: UUID,
  movie_title?: string,
  title: string,                // Milestone title (EN)
  title_te?: string,            // Telugu
  description?: string,         // Details (EN)
  description_te?: string,      // Telugu
  impact_score: number,         // 0.0-1.0 significance
  importance: 'major' | 'minor' | 'notable',
  is_published: boolean,
  created_at: Date,
  updated_at: Date
}
```

---

## 2. Movie Data Structure

### 2.1 Core Movie Data (`movies` table)

#### Basic Identity
```typescript
{
  id: UUID,
  title_en: string,             // "Pokiri"
  title_te?: string,            // "పోకిరి"
  slug: string,                 // "pokiri-2006"
  original_title?: string,      // Original language title
  canonical_title?: string      // Normalized title for matching
}
```

#### Release Information
```typescript
{
  release_date?: Date,          // Release date
  release_year?: number,        // Year (computed or explicit)
  decade?: string,              // "2000s", "1990s"
  status?: 'released' | 'upcoming' | 'in_production',
  language?: string,            // "Telugu"
  runtime?: number              // Duration in minutes
}
```

#### Visual Assets
```typescript
{
  poster_url?: string,          // Main poster
  backdrop_url?: string,        // Background/hero image
  poster_confidence?: number,   // 0.0-1.0 confidence score
  poster_visual_type?: string,  // 'original_poster' | 'archival_image' | 'placeholder'
  
  archival_source?: {
    source_type: string,        // 'tmdb' | 'wikipedia' | 'archive_org'
    license: string,
    attribution: string
  }
}
```

#### Cast & Crew (Text-based references)
```typescript
{
  // Primary cast (stored as slug strings, NOT foreign keys)
  hero?: string,                // "mahesh-babu" (celebrity slug)
  heroine?: string,             // "ileana-dcruz" (celebrity slug)
  director?: string,            // "puri-jagannadh" (celebrity slug)
  music_director?: string,      // "mani-sharma" (celebrity slug)
  producer?: string,            // Producer name or production company
  cinematographer?: string,     // DoP name
  
  // Supporting cast (JSONB array)
  supporting_cast?: Array<{
    name: string,               // Actor name
    role: string,               // "Comedy" | "Villain" | "Friend"
    order: number,              // Display order (1-5)
    type: 'supporting' | 'cameo' | 'special'
  }>,
  
  // Extended crew (JSONB object)
  crew?: {
    cinematographer?: string,
    editor?: string,
    writer?: string,
    choreographer?: string,
    art_director?: string,
    lyricist?: string
  }
}
```

#### Synopsis & Marketing
```typescript
{
  synopsis?: string,            // Full synopsis (EN)
  synopsis_te?: string,         // Telugu synopsis
  overview?: string,            // Short description (from TMDB)
  tagline?: string,             // Marketing tagline
  
  // Trivia and production info (JSONB)
  trivia?: {
    shooting_locations: string[],
    production_trivia: string[],
    cultural_impact: string,
    controversies: string[]
  }
}
```

#### Genres & Classification
```typescript
{
  genres?: string[],            // ["Action", "Drama", "Thriller"]
  primary_genre?: string,       // Main genre
  secondary_genres?: string[],  // Additional genres
  
  era?: string,                 // "Golden Era", "New Wave"
  tone?: string,                // "Dark", "Light-hearted"
  style?: string,               // "Commercial", "Artistic"
  style_tags?: string[],        // Additional style tags
  mood_tags?: string[]          // "feel-good", "edge-of-seat"
}
```

#### Ratings & Reviews
```typescript
{
  // User ratings
  our_rating?: number,          // Site rating (1-10)
  avg_rating?: number,          // Average user rating
  
  // External ratings
  imdb_rating?: number,         // IMDb rating
  tmdb_rating?: number,         // TMDB rating
  rt_rating?: number,           // Rotten Tomatoes
  
  // Editorial scoring
  editorial_score?: number,     // Derived score (1-10)
  editorial_score_breakdown?: { // Score components
    genre_baseline: number,
    era_adjustment: number,
    director_average: number,
    hero_average: number,
    metadata_bonus: number,
    final_weights: Object
  },
  editorial_score_confidence?: number,  // 0.0-1.0
  rating_source?: 'external' | 'editorial_derived' | 'combined'
}
```

#### Box Office & Performance
```typescript
{
  // Structured box office data (JSONB)
  box_office?: {
    opening_day: string,
    first_week: string,
    lifetime_gross: string,
    worldwide_gross: string,
    budget: string,
    verdict: string
  },
  
  box_office_category?: 'industry-hit' | 'blockbuster' | 'super-hit' | 
                        'hit' | 'average' | 'below-average' | 'disaster',
  
  budget?: string,              // Production budget (text)
  certification?: string,       // Censor rating
  age_rating?: string          // Age suitability
}
```

#### Tags & Metadata
```typescript
{
  is_blockbuster?: boolean,
  is_classic?: boolean,
  is_underrated?: boolean,
  is_featured?: boolean,
  is_published?: boolean,
  
  // Content flags (JSONB)
  content_flags?: {
    pan_india: boolean,
    remake_of?: string,
    original_language?: string,
    sequel_number?: number,
    franchise?: string,
    biopic: boolean,
    based_on?: string,
    debut_director: boolean,
    debut_hero: boolean
  },
  
  // Awards (JSONB array)
  awards?: Array<{
    type: 'national' | 'international' | 'regional',
    category: string,
    year: number,
    recipient: string
  }>
}
```

#### External IDs & Sources
```typescript
{
  tmdb_id?: number,             // The Movie Database ID
  imdb_id?: string,             // IMDb ID
  wikidata_id?: string,         // Wikidata QID
  wikipedia_url?: string,       // Wikipedia page
  
  data_sources?: string[],      // ['tmdb', 'wikipedia', 'wikidata']
  source?: string               // Primary source
}
```

#### Data Quality & Enrichment
```typescript
{
  data_confidence?: number,     // 0.0-1.0 confidence score
  confidence_breakdown?: Object,// Explainability
  trust_badge?: string,         // UI display badge
  
  ingestion_status?: 'raw' | 'partial' | 'enriched' | 'verified' | 'published',
  completeness_score?: number,  // 0.0-1.0 completeness
  last_stage_completed?: string,
  stage_completed_at?: Date,
  
  content_type?: string,        // 'fact' | 'editorial' | 'user_submitted'
  content_sensitivity?: Object, // Content warnings
  audience_suitability?: string
}
```

#### Review System
```typescript
{
  has_review?: boolean,
  featured_review?: string,
  editorial_review?: string,
  
  // Smart review (JSONB)
  smart_review?: {
    why_to_watch: string[],
    why_to_skip: string[],
    critics_pov?: string,
    audience_pov?: string,
    legacy_status?: 'cult_classic' | 'forgotten_gem' | 'landmark' | 'mainstream',
    mood_suitability: string[],
    content_warnings: string[],
    best_of_tags: {
      actor_best: boolean,
      director_best: boolean,
      music_best: boolean
    },
    era_significance?: string,
    derivation_confidence: number
  }
}
```

### 2.2 Movie Sub-Entities

#### Movie Reviews (`movie_reviews` table)
```typescript
{
  id: UUID,
  movie_id: UUID,
  title: string,
  title_te?: string,
  content: string,              // Full review text (EN)
  content_te?: string,          // Telugu review
  
  // Review metadata
  author_name?: string,
  reviewer_name?: string,
  reviewer_type?: 'critic' | 'audience' | 'editor' | 'expert',
  
  // Rating
  rating?: number,
  overall_rating?: number,
  
  // Status
  is_featured?: boolean,
  is_published?: boolean,
  status: 'draft' | 'published' | 'archived',
  
  // Engagement
  likes?: number,
  views?: number,
  helpful_votes?: number,
  
  // Structured review sections
  summary?: string,
  summary_te?: string,
  direction_review?: string,
  screenplay_review?: string,
  acting_review?: string,
  music_review?: string,
  verdict?: string,
  verdict_te?: string,
  
  // Verdicts per category
  story_verdict?: string,
  performance_verdict?: string,
  direction_verdict?: string,
  music_verdict?: string,
  technical_verdict?: string,
  final_verdict?: string,
  
  // Smart review integration
  smart_review?: Object,        // AI-derived insights
  smart_review_derived_at?: Date,
  needs_human_review?: boolean,
  
  created_at: Date,
  updated_at: Date
}
```

---

## 3. Relationship Layer

### 3.1 Professional Collaborations (`collaborations` table)

Tracks working relationships between industry entities:

```typescript
{
  id: UUID,
  entity1_type: 'actor' | 'director' | 'music_director' | 'producer' | 'writer',
  entity1_name: string,
  entity2_type: 'actor' | 'director' | 'music_director' | 'producer' | 'writer',
  entity2_name: string,
  
  // Collaboration metrics
  collaboration_count: number,  // Number of movies together
  movie_ids: UUID[],            // Array of movie IDs
  first_collab_year: number,    // First collaboration
  last_collab_year: number,     // Most recent
  
  // Success metrics
  hit_rate: number,             // % of successful movies
  avg_rating: number,           // Average rating of collaborations
  notable_films: string[],      // Top films
  
  created_at: Date,
  updated_at: Date
}
```

**Example Queries:**
- "Find all actor-director pairs who've worked 5+ times"
- "Show Mahesh Babu's most frequent collaborators"
- "Which music director has the highest hit rate with Chiranjeevi?"

### 3.2 Narrative Events (`narrative_events` table)

Story-level relationships and industry moments:

```typescript
{
  id: UUID,
  event_type: 'career_turning_point' | 'controversy' | 'rivalry' | 
              'shared_event' | 'milestone' | 'industry_moment',
  event_label: string,          // Event name
  event_year: number,
  event_date?: Date,
  
  // Connections
  entity_ids: UUID[],           // Related celebrities
  entity_names: string[],       // Names for display
  movie_ids: UUID[],            // Related movies
  movie_titles: string[],       // Titles for display
  
  // Details
  description: string,
  source_url?: string,
  is_verified: boolean,
  content_type: 'fact' | 'reported' | 'speculative',
  significance_score: number,   // 1-10
  
  created_at: Date,
  updated_at: Date
}
```

**Example Events:**
- "Baahubali breakthrough moment" (career_turning_point)
- "NTR-ANR rivalry" (rivalry)
- "100th film celebration" (milestone)

### 3.3 Movie Similarities (`movie_similarities` table)

Precomputed recommendations:

```typescript
{
  movie_id: UUID,               // Source movie
  similar_movie_id: UUID,       // Similar movie
  similarity_score: number,     // 0.0-1.0
  similarity_type: 'cast' | 'genre' | 'era' | 'tone' | 'thematic' | 'audience' | 'composite',
  common_factors: string[],     // What makes them similar
  computed_at: Date
}
```

### 3.4 Career Milestones (`career_milestones` table)

Different from `celebrity_milestones` - focuses on career trajectory:

```typescript
{
  id: UUID,
  entity_type: 'actor' | 'director' | 'music_director',
  entity_name: string,
  milestone_type: 'debut' | 'first_hit' | 'blockbuster' | 'comeback' | 
                  'award_win' | 'milestone_film' | 'retirement' | 
                  'director_debut' | 'producer_debut',
  movie_id?: UUID,
  movie_title?: string,
  year: number,
  description: string,
  significance: string,
  created_at: Date
}
```

---

## 4. Data Enrichment Pipeline

### 4.1 Data Sources

The system aggregates data from multiple sources with confidence scoring:

| Source | Priority | Confidence | Best For |
|--------|----------|------------|----------|
| TMDB | 1 | 0.95 | Popular films, cast/crew, posters |
| Wikipedia | 2 | 0.85 | Regional cinema, bios, historical data |
| Wikidata | 3 | 0.80 | Structured metadata, relationships |
| Wikimedia Commons | 4 | 0.80 | Historical images |
| Internet Archive | 5 | 0.75 | Vintage posters, rare content |
| IMDb | 6 | 0.90 | Ratings, cast, international data |
| OMDB | 7 | 0.85 | Ratings aggregation |

### 4.2 Enrichment Phases

The master orchestrator (`scripts/enrich-master.ts`) runs enrichment in optimal order:

**Phase 1: Images** (`scripts/enrich-images-fast.ts`)
- Source waterfall: TMDB → Wikipedia → Wikimedia → Archive.org
- Parallel processing (30 concurrent requests)
- Updates: `poster_url`, `poster_confidence`, `poster_visual_type`, `archival_source`
- Current coverage: 84% (4,214/5,029)

**Phase 2: Cast & Crew** (`scripts/enrich-cast-crew.ts`)
- Extended mode includes: hero, heroine, director, music_director, producer, 5 supporting actors, crew
- Source waterfall: TMDB Credits API → Wikipedia Infobox v2.0 → Wikidata SPARQL
- Updates: `hero`, `heroine`, `director`, `music_director`, `producer`, `supporting_cast`, `crew`
- Current coverage: Hero/Heroine/Director ~100%, Music ~38%, Producer ~26%, Supporting ~30%

**Phase 3: Editorial Scores** (`scripts/enrich-editorial-scores.ts`)
- For movies without external ratings (IMDB/TMDB/RT)
- Components:
  - Genre + Era Baseline (30%)
  - Comparable Movies (40%) - director's/hero's other films
  - Metadata Signals (30%) - awards, classic status, Wikipedia presence
- Updates: `editorial_score`, `editorial_score_breakdown`, `editorial_score_confidence`, `rating_source`
- Current coverage: 4% (213 movies)

**Phase 4: Validation** (`scripts/validate-all.ts`)
- Multi-source consensus validation
- Auto-fix when 3+ sources agree with 80%+ confidence
- Generates detailed reports of discrepancies

### 4.3 Enrichment Tracking

**Enrichment Changes Log** (`enrichment_changes` table):
```typescript
{
  id: UUID,
  timestamp: Date,
  actor_name?: string,          // Context
  action: 'added' | 'updated' | 'deleted' | 'merged',
  entity_type: 'film' | 'award' | 'profile' | 'statistic',
  entity_id: string,
  entity_title: string,
  
  // Change details
  field_changed?: string,
  old_value?: string,
  new_value?: string,
  
  // Validation
  source?: string,
  confidence: number,           // 0.0-1.0
  trust_score: number,          // 0-100
  validation_score: number,
  
  // Governance
  governance_flags: string[],
  requires_manual_review: boolean,
  
  // Consensus tracking
  consensus_sources?: {
    sources: string[],
    agreement: number
  },
  
  change_reason?: string,
  session_id?: string,
  script_name?: string
}
```

---

## 5. Connectivity Patterns

### 5.1 How Celebrities Connect to Movies

**Current Implementation (Text-based):**

Movies store celebrity references as **slug strings**, not foreign keys:

```sql
-- In movies table
SELECT 
  title_en,
  hero,              -- "mahesh-babu" (slug string)
  heroine,           -- "ileana-dcruz" (slug string)
  director           -- "puri-jagannadh" (slug string)
FROM movies
WHERE slug = 'pokiri-2006';
```

```sql
-- Linking requires slug matching
SELECT m.* 
FROM movies m
WHERE m.hero = 'mahesh-babu'  -- Match by slug
   OR m.heroine = 'mahesh-babu'
   OR m.director = 'mahesh-babu';
```

**Supporting Cast (JSONB):**

```sql
-- Supporting cast stored as JSONB array
SELECT 
  title_en,
  supporting_cast
FROM movies
WHERE slug = 'pokiri-2006';

-- Result:
-- supporting_cast: [
--   {"name": "Prakash Raj", "role": "Villain", "order": 1},
--   {"name": "Sayaji Shinde", "role": "Police Officer", "order": 2}
-- ]

-- Query for movies with specific supporting actor
SELECT title_en
FROM movies
WHERE supporting_cast @> '[{"name": "Prakash Raj"}]'::jsonb;
```

### 5.2 Filmography Generation

The system attempts to generate filmography by matching slugs:

```typescript
// From scripts/auto-generate-filmography-data.ts
const celebMovies = movies.filter(m => 
  m.hero === celeb.slug || 
  m.heroine === celeb.slug || 
  m.director === celeb.slug ||
  (m.supporting_cast && 
   Array.isArray(m.supporting_cast) && 
   m.supporting_cast.some(actor => actor.name === celeb.name_en))
);
```

**Problem:** This text-based approach is fragile:
- Name changes require manual updates across all movies
- No referential integrity
- Supporting cast uses `name` (not slug), causing matching issues
- Automated relationship analysis is complex

### 5.3 Collaboration Discovery

The `collaborations` table is populated by analyzing movies:

```typescript
// Pseudo-code for collaboration tracking
for each movie {
  if (hero && director) {
    upsert collaboration(
      entity1_type: 'actor',
      entity1_name: hero,
      entity2_type: 'director',
      entity2_name: director,
      increment collaboration_count,
      add movie_id to movie_ids
    );
  }
  
  if (hero && music_director) {
    upsert collaboration(
      entity1_type: 'actor',
      entity1_name: hero,
      entity2_type: 'music_director',
      entity2_name: music_director
    );
  }
}
```

### 5.4 Romantic Pairings

Generated by analyzing hero-heroine frequency:

```typescript
// From scripts/auto-generate-filmography-data.ts
function calculateRomanticPairings(celebSlug, movies) {
  const pairings = new Map();
  
  for (const movie of movies) {
    if (movie.hero === celebSlug && movie.heroine) {
      pairings.set(movie.heroine, {
        count: (pairings.get(movie.heroine)?.count || 0) + 1,
        films: [...(pairings.get(movie.heroine)?.films || []), movie.title_en]
      });
    }
    if (movie.heroine === celebSlug && movie.hero) {
      pairings.set(movie.hero, {
        count: (pairings.get(movie.hero)?.count || 0) + 1,
        films: [...(pairings.get(movie.hero)?.films || []), movie.title_en]
      });
    }
  }
  
  return Array.from(pairings.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);  // Top 10 pairings
}
```

### 5.5 Actor Eras

Generated by analyzing movie timeline and themes:

```typescript
function calculateActorEras(movies) {
  const moviesByDecade = groupBy(movies, m => Math.floor(m.release_year / 10) * 10);
  
  return Object.entries(moviesByDecade).map(([decade, films]) => ({
    name: getEraName(decade),  // e.g., "Golden Era", "Commercial Phase"
    years: `${decade}-${parseInt(decade) + 9}`,
    themes: extractGenres(films),
    key_films: getTopRated(films, 3)
  }));
}
```

---

## 6. Enhancement Opportunities

### 6.1 Critical: Database Schema Enhancement

**Current Problem:**
- Movies reference celebrities via slug strings (no foreign keys)
- No referential integrity
- Complex to maintain and query
- Supporting cast uses names instead of slugs

**Proposed Solution:**

```sql
-- Add foreign key columns (keep text fields for backward compatibility)
ALTER TABLE movies ADD COLUMN hero_id UUID REFERENCES celebrities(id);
ALTER TABLE movies ADD COLUMN heroine_id UUID REFERENCES celebrities(id);
ALTER TABLE movies ADD COLUMN director_id UUID REFERENCES celebrities(id);
ALTER TABLE movies ADD COLUMN music_director_id UUID REFERENCES celebrities(id);
ALTER TABLE movies ADD COLUMN producer_id UUID REFERENCES celebrities(id);

-- Create migration to populate IDs from slugs
UPDATE movies m
SET hero_id = c.id
FROM celebrities c
WHERE m.hero = c.slug;

-- Create junction table for supporting cast
CREATE TABLE movie_cast (
  id UUID PRIMARY KEY,
  movie_id UUID REFERENCES movies(id),
  celebrity_id UUID REFERENCES celebrities(id),
  role_type TEXT CHECK (role_type IN ('hero', 'heroine', 'supporting', 'cameo', 'special')),
  character_name TEXT,
  role_description TEXT,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_movie_cast_movie ON movie_cast(movie_id);
CREATE INDEX idx_movie_cast_celebrity ON movie_cast(celebrity_id);
CREATE INDEX idx_movie_cast_role_type ON movie_cast(role_type);
```

**Benefits:**
- Referential integrity
- Cascading updates when celebrity data changes
- Efficient queries and joins
- Automated filmography generation
- Better relationship discovery

### 6.2 Enhanced Relationship Tracking

**Celebrity Filmography Table:**

```sql
CREATE TABLE celebrity_filmography (
  id UUID PRIMARY KEY,
  celebrity_id UUID REFERENCES celebrities(id),
  movie_id UUID REFERENCES movies(id),
  role_type TEXT,              -- 'hero', 'heroine', 'director', 'music_director', etc.
  character_name TEXT,
  is_lead BOOLEAN DEFAULT false,
  is_cameo BOOLEAN DEFAULT false,
  display_order INTEGER,
  
  -- Performance tracking
  movie_verdict TEXT,          -- 'hit', 'flop', 'blockbuster'
  box_office_status TEXT,
  our_rating DECIMAL(3,1),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(celebrity_id, movie_id, role_type)
);
```

**Benefits:**
- One source of truth for filmography
- Easy to query "all movies where X is the hero"
- Can track multiple roles (actor who also directed)
- Performance analysis per role type

### 6.3 Advanced Analytics Views

**Create materialized views for common queries:**

```sql
-- Celebrity career summary
CREATE MATERIALIZED VIEW celebrity_career_stats AS
SELECT 
  c.id,
  c.name_en,
  c.slug,
  COUNT(DISTINCT cf.movie_id) as total_movies,
  COUNT(DISTINCT cf.movie_id) FILTER (WHERE cf.is_lead) as lead_roles,
  COUNT(DISTINCT cf.movie_id) FILTER (WHERE m.box_office_category IN ('hit', 'blockbuster', 'super-hit')) as hits,
  ROUND(AVG(m.our_rating), 2) as avg_rating,
  MIN(m.release_year) as debut_year,
  MAX(m.release_year) as latest_year,
  ARRAY_AGG(DISTINCT m.primary_genre) FILTER (WHERE m.primary_genre IS NOT NULL) as genres_worked
FROM celebrities c
LEFT JOIN celebrity_filmography cf ON c.id = cf.celebrity_id
LEFT JOIN movies m ON cf.movie_id = m.id
GROUP BY c.id, c.name_en, c.slug;

-- Top collaborations
CREATE MATERIALIZED VIEW top_collaboration_pairs AS
SELECT 
  entity1_name,
  entity1_type,
  entity2_name,
  entity2_type,
  collaboration_count,
  hit_rate,
  avg_rating,
  notable_films
FROM collaborations
WHERE collaboration_count >= 3
ORDER BY 
  CASE 
    WHEN entity1_type = 'actor' AND entity2_type = 'director' THEN 1
    WHEN entity1_type = 'actor' AND entity2_type = 'music_director' THEN 2
    ELSE 3
  END,
  collaboration_count DESC;
```

### 6.4 Enhanced Search & Discovery

**Full-text search across entities:**

```sql
-- Add full-text search columns
ALTER TABLE celebrities ADD COLUMN search_vector tsvector;
ALTER TABLE movies ADD COLUMN search_vector tsvector;

-- Update triggers
CREATE OR REPLACE FUNCTION celebrity_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name_en, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.short_bio, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.industry_title, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER celebrity_search_update
  BEFORE INSERT OR UPDATE ON celebrities
  FOR EACH ROW
  EXECUTE FUNCTION celebrity_search_vector_update();

-- GIN indexes
CREATE INDEX idx_celebrities_search ON celebrities USING GIN(search_vector);
CREATE INDEX idx_movies_search ON movies USING GIN(search_vector);
```

### 6.5 Data Quality Improvements

**Automated data quality checks:**

```sql
-- View for incomplete profiles
CREATE VIEW incomplete_celebrity_profiles AS
SELECT 
  id,
  name_en,
  slug,
  CASE WHEN profile_image IS NULL THEN 1 ELSE 0 END +
  CASE WHEN short_bio IS NULL THEN 1 ELSE 0 END +
  CASE WHEN birth_date IS NULL THEN 1 ELSE 0 END +
  CASE WHEN industry_title IS NULL THEN 1 ELSE 0 END +
  CASE WHEN total_movies IS NULL OR total_movies = 0 THEN 1 ELSE 0 END +
  CASE WHEN awards_count IS NULL OR awards_count = 0 THEN 1 ELSE 0 END as missing_fields_count,
  
  ROUND(
    (6.0 - (
      CASE WHEN profile_image IS NULL THEN 1 ELSE 0 END +
      CASE WHEN short_bio IS NULL THEN 1 ELSE 0 END +
      CASE WHEN birth_date IS NULL THEN 1 ELSE 0 END +
      CASE WHEN industry_title IS NULL THEN 1 ELSE 0 END +
      CASE WHEN total_movies IS NULL OR total_movies = 0 THEN 1 ELSE 0 END +
      CASE WHEN awards_count IS NULL OR awards_count = 0 THEN 1 ELSE 0 END
    )) * 100 / 6.0, 
    2
  ) as completeness_percentage
FROM celebrities
WHERE is_published = true
ORDER BY completeness_percentage ASC;

-- View for movies missing key data
CREATE VIEW incomplete_movies AS
SELECT 
  id,
  title_en,
  slug,
  release_year,
  CASE WHEN poster_url IS NULL THEN 'poster' END,
  CASE WHEN hero IS NULL AND director IS NULL THEN 'cast/crew' END,
  CASE WHEN synopsis IS NULL THEN 'synopsis' END,
  CASE WHEN our_rating IS NULL AND editorial_score IS NULL THEN 'rating' END
FROM movies
WHERE is_published = true
  AND (
    poster_url IS NULL OR
    (hero IS NULL AND director IS NULL) OR
    synopsis IS NULL OR
    (our_rating IS NULL AND editorial_score IS NULL)
  );
```

### 6.6 API Enhancements

**Celebrity profile API with relationships:**

```typescript
// GET /api/celebrity/{slug}
interface CelebrityProfileResponse {
  profile: Celebrity;
  statistics: {
    total_movies: number;
    hits: number;
    hit_rate: number;
    avg_rating: number;
    awards_won: number;
    career_span: string;
  };
  filmography: Array<{
    movie: Movie;
    role: string;
    verdict: string;
    year: number;
  }>;
  top_collaborations: Array<{
    name: string;
    type: string;
    count: number;
    highlight: string;
  }>;
  awards: CelebrityAward[];
  milestones: CelebrityMilestone[];
  trivia: CelebrityTrivia[];
  related_celebrities: Array<{
    name: string;
    relation_type: string;
    collaboration_count?: number;
  }>;
}
```

**Movie detail API with cast details:**

```typescript
// GET /api/movie/{slug}
interface MovieDetailResponse {
  movie: Movie;
  cast: Array<{
    celebrity: Celebrity;
    role: string;
    character_name?: string;
    is_lead: boolean;
  }>;
  crew: Array<{
    celebrity: Celebrity;
    role: string;
    department: string;
  }>;
  reviews: MovieReview[];
  similar_movies: Array<{
    movie: Movie;
    similarity_score: number;
    common_factors: string[];
  }>;
  narrative_context: NarrativeEvent[];
}
```

### 6.7 Recommendation Engine

**Content-based filtering:**

```sql
-- Find similar movies based on cast, genre, era
CREATE FUNCTION find_similar_movies(
  p_movie_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  similar_movie_id UUID,
  title_en TEXT,
  similarity_score DECIMAL,
  match_factors TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH source_movie AS (
    SELECT hero, heroine, director, music_director, genres, era, release_year
    FROM movies
    WHERE id = p_movie_id
  )
  SELECT 
    m.id,
    m.title_en,
    (
      CASE WHEN m.hero = sm.hero THEN 0.3 ELSE 0 END +
      CASE WHEN m.heroine = sm.heroine THEN 0.2 ELSE 0 END +
      CASE WHEN m.director = sm.director THEN 0.25 ELSE 0 END +
      CASE WHEN m.music_director = sm.music_director THEN 0.15 ELSE 0 END +
      CASE WHEN m.genres && sm.genres THEN 0.1 ELSE 0 END
    ) as similarity_score,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN m.hero = sm.hero THEN 'Same Hero' END,
      CASE WHEN m.heroine = sm.heroine THEN 'Same Heroine' END,
      CASE WHEN m.director = sm.director THEN 'Same Director' END,
      CASE WHEN m.music_director = sm.music_director THEN 'Same Music Director' END,
      CASE WHEN m.genres && sm.genres THEN 'Similar Genre' END
    ], NULL) as match_factors
  FROM movies m, source_movie sm
  WHERE m.id != p_movie_id
    AND m.is_published = true
  HAVING (
    CASE WHEN m.hero = sm.hero THEN 0.3 ELSE 0 END +
    CASE WHEN m.heroine = sm.heroine THEN 0.2 ELSE 0 END +
    CASE WHEN m.director = sm.director THEN 0.25 ELSE 0 END +
    CASE WHEN m.music_director = sm.music_director THEN 0.15 ELSE 0 END +
    CASE WHEN m.genres && sm.genres THEN 0.1 ELSE 0 END
  ) > 0.3
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

**Collaborative filtering:**

```typescript
// User watching patterns
interface UserHistory {
  userId: string;
  watched: string[];  // Movie IDs
  liked: string[];    // Movie IDs
  rated: Map<string, number>;  // Movie ID -> rating
}

// Recommend based on similar users
function getRecommendations(userId: string) {
  // 1. Find users with similar taste
  // 2. Find movies they liked that current user hasn't seen
  // 3. Weight by similarity score
  // 4. Return top N
}
```

---

## Summary: Data Architecture at a Glance

### Core Tables

| Table | Records | Purpose | Key Fields |
|-------|---------|---------|------------|
| `celebrities` | ~513 | Celebrity profiles | name, slug, occupation, bio, stats, relationships |
| `movies` | ~5,029 | Movie metadata | title, slug, cast (text), crew, ratings, genres |
| `celebrity_awards` | Variable | Awards tracking | celebrity_id, award, year, category |
| `celebrity_trivia` | Variable | Fun facts | celebrity_id, content, category |
| `celebrity_milestones` | Variable | Career milestones | celebrity_id, type, year, impact_score |
| `movie_reviews` | Variable | Editorial reviews | movie_id, content, ratings, verdicts |
| `collaborations` | Variable | Professional pairs | entity1, entity2, count, hit_rate |
| `narrative_events` | Variable | Industry moments | entities, movies, significance |
| `movie_similarities` | Variable | Recommendations | movie pairs, similarity score, factors |
| `career_milestones` | Variable | Career trajectory | entity, milestone_type, movie |

### Relationship Patterns

```
Celebrity ──(text slug)──> Movie.hero/heroine/director
          ├──(FK)──> celebrity_awards
          ├──(FK)──> celebrity_trivia
          ├──(FK)──> celebrity_milestones
          └──(text)──> collaborations
          
Movie ──(FK)──> movie_reviews
      ├──(text)──> Celebrity (via slug matching)
      ├──(FK)──> movie_similarities
      └──(ref)──> narrative_events

collaborations ──(text)──> Celebrity pairs
narrative_events ──(arrays)──> Celebrities + Movies
```

### Data Quality Scores

| Metric | Coverage | Status |
|--------|----------|--------|
| Celebrity Profiles | 77% complete | ⚠️ Good |
| Celebrity Images | 88.3% | ⚠️ Good |
| Movie Posters | 84% | ⚠️ Good |
| Hero/Heroine/Director | ~100% | ✅ Excellent |
| Music Director | 38% | 🔴 Needs work |
| Producer | 26% | 🔴 Needs work |
| Supporting Cast | 30% | 🔴 Needs work |
| TMDB IDs | 50% | ⚠️ Moderate |
| Editorial Scores | 4% | 🔴 Growing |

---

## Next Steps for Enhancement

### Priority 1: Database Architecture (High Impact)
1. **Add foreign key relationships** between movies and celebrities
2. **Create `movie_cast` junction table** for proper many-to-many relationships
3. **Migrate existing text-based references** to ID-based references
4. **Maintain backward compatibility** with text fields during transition

### Priority 2: Data Completeness (Medium Impact)
1. **Enrich missing music directors** (~2,400 movies)
2. **Enrich missing producers** (~3,000 movies)
3. **Expand supporting cast coverage** (~3,500 movies)
4. **Fill missing celebrity images** (~60 profiles)
5. **Add TMDB IDs** to pre-1990 movies (~2,500 movies)

### Priority 3: Analytics & Discovery (High Value)
1. **Create materialized views** for common queries
2. **Implement full-text search** with tsvector
3. **Build recommendation engine** (content + collaborative filtering)
4. **Generate automated insights** (career trajectories, success patterns)

### Priority 4: API & User Experience (User-Facing)
1. **Enhanced celebrity profile API** with relationships
2. **Movie detail API** with full cast/crew details
3. **Discovery APIs** (similar movies, collaborations, dynasties)
4. **Trending and personalization** APIs

### Priority 5: Data Quality & Governance (Ongoing)
1. **Automated data quality checks**
2. **Confidence score improvements**
3. **Multi-source validation expansion**
4. **Editorial review queue** for low-confidence data

---

**Document Maintained By:** Telugu Portal Architecture Team  
**Last Audit Date:** January 15, 2026  
**Next Review:** Q2 2026
