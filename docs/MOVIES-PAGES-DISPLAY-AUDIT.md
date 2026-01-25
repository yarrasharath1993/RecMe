# Movies Table & Pages Display Audit

> **Last Updated:** January 15, 2026  
> **Purpose:** Detailed audit of movies table structure and what data is displayed on each page type

---

## Executive Summary

### Brief Audit Summary

The Telugu Portal displays movie and celebrity data across **3 main page types**:

| Page Type | URL Pattern | Primary Purpose | Key Data Displayed |
|-----------|-------------|-----------------|-------------------|
| **Movies Listing** | `/movies` | Browse/filter movies | Poster, title, year, genre, rating, cast |
| **Movie Detail** | `/movies/[slug]` | Full movie information | All metadata, cast/crew, reviews, similar movies |
| **Celebrity Profile** | `/api/profile/[slug]` | Celebrity information | Bio, filmography, stats, collaborations, awards |

**Data Completeness:**
- ✅ **Movies Table**: 114 fields covering metadata, cast, ratings, reviews, enrichment
- ✅ **Coverage**: 84% posters, 100% primary cast, 50% TMDB IDs, 4% editorial scores
- ⚠️ **Gaps**: Music directors (38%), producers (26%), supporting cast (30%)

---

## Table of Contents

1. [Movies Table Complete Structure](#1-movies-table-complete-structure)
2. [Movies Listing Page (/movies)](#2-movies-listing-page-movies)
3. [Movie Detail Page (/movies/[slug])](#3-movie-detail-page-moviesslug)
4. [Celebrity Profile Pages](#4-celebrity-profile-pages)
5. [Data Flow & Architecture](#5-data-flow--architecture)

---

## 1. Movies Table Complete Structure

### 1.1 Complete Field Inventory

The `movies` table contains **~114 fields** organized into 15 categories:

#### A. Core Identity (7 fields)
```typescript
{
  id: UUID,                      // Primary key
  title_en: string,              // English title
  title_te?: string,             // Telugu title
  slug: string,                  // URL-friendly identifier (unique)
  original_title?: string,       // Original language title
  canonical_title?: string,      // Normalized for matching
  language?: string              // "Telugu"
}
```

#### B. Release Information (6 fields)
```typescript
{
  release_date?: Date,           // Full release date
  release_year?: number,         // Year (primary for sorting)
  decade?: string,               // "2000s", "1990s"
  status?: string,               // 'released' | 'upcoming' | 'in_production'
  runtime?: number,              // Runtime in minutes
  runtime_minutes?: number       // Alias
}
```

#### C. Visual Assets (6 fields)
```typescript
{
  poster_url?: string,           // Main poster image
  backdrop_url?: string,         // Hero/background image
  poster_confidence?: number,    // 0.0-1.0 quality score
  poster_visual_type?: string,   // 'original_poster' | 'archival_image'
  archival_source?: JSONB,       // Source metadata
  thumbnail_url?: string         // Thumbnail (if separate)
}
```

**Archival Source Structure:**
```typescript
archival_source: {
  source_type: 'tmdb' | 'wikipedia' | 'wikimedia' | 'archive_org',
  license: string,
  attribution: string,
  url: string
}
```

#### D. Primary Cast & Crew (6 fields - TEXT BASED)
```typescript
{
  // ⚠️ IMPORTANT: These are SLUG STRINGS, not foreign keys
  director?: string,             // "puri-jagannadh" (celebrity slug)
  hero?: string,                 // "mahesh-babu" (celebrity slug)
  heroine?: string,              // "ileana-dcruz" (celebrity slug)
  music_director?: string,       // "mani-sharma" (celebrity slug)
  producer?: string,             // Producer name or company
  cinematographer?: string       // Cinematographer name
}
```

**⚠️ Critical Note:** These are **not foreign keys** to the celebrities table. They are text-based slug references that require manual matching.

#### E. Extended Cast & Crew (2 fields - JSONB)
```typescript
{
  // Supporting actors (5 max recommended)
  supporting_cast?: Array<{
    name: string,                // Actor name (not slug!)
    role: string,                // "Villain", "Comedy", "Friend"
    order: number,               // Display order (1-5)
    type: 'supporting' | 'cameo' | 'special'
  }>,
  
  // Technical crew
  crew?: {
    cinematographer?: string,    // May duplicate field above
    editor?: string,
    writer?: string,
    screenplay?: string,
    choreographer?: string,
    art_director?: string,
    lyricist?: string,
    costume_designer?: string,
    production_designer?: string
  }
}
```

#### F. Synopsis & Marketing (6 fields)
```typescript
{
  synopsis?: string,             // Full synopsis (EN)
  synopsis_te?: string,          // Telugu synopsis
  overview?: string,             // Short description (TMDB)
  tagline?: string,              // Marketing tagline
  description?: string,          // Alias for synopsis
  plot?: string                  // Alias for synopsis
}
```

#### G. Genre & Classification (9 fields)
```typescript
{
  genres?: string[],             // Array: ["Action", "Drama"]
  primary_genre?: string,        // Main genre
  secondary_genres?: string[],   // Additional genres
  
  // Era & Style
  era?: string,                  // "Golden Era", "New Wave", "Modern"
  tone?: string,                 // "Dark", "Light", "Serious"
  style?: string,                // "Commercial", "Artistic", "Experimental"
  style_tags?: string[],         // Additional style descriptors
  
  // Mood & Vibe
  mood_tags?: string[]           // ["feel-good", "intense", "emotional"]
}
```

#### H. Ratings & Scores (11 fields)
```typescript
{
  // Primary ratings
  our_rating?: number,           // Editorial rating (1-10)
  avg_rating?: number,           // Average user rating
  
  // External ratings
  imdb_rating?: number,          // IMDb rating
  tmdb_rating?: number,          // TMDB rating  
  rt_rating?: number,            // Rotten Tomatoes
  metacritic_rating?: number,    // Metacritic score
  
  // Editorial scoring system
  editorial_score?: number,      // Derived score for unrated movies (1-10)
  editorial_score_breakdown?: JSONB,  // Score components
  editorial_score_confidence?: number, // 0.0-1.0
  
  rating_source?: string,        // 'external' | 'editorial_derived' | 'combined'
  rating_count?: number          // Number of ratings
}
```

**Editorial Score Breakdown Structure:**
```typescript
editorial_score_breakdown: {
  genre_baseline: number,        // Base score by genre (30% weight)
  era_adjustment: number,        // Era modifier
  director_average: number,      // Director's avg rating (40% weight)
  hero_average: number,          // Hero's avg rating
  metadata_bonus: number,        // Awards, classic status (30% weight)
  final_weights: {
    genre: 0.3,
    comparable: 0.4,
    metadata: 0.3
  }
}
```

#### I. Box Office & Commercial (5 fields)
```typescript
{
  // Structured box office data
  box_office?: JSONB,            // Detailed collections
  box_office_category?: string,  // Performance category
  budget?: string,               // Production budget (text)
  box_office_collection?: string,// Total collection (text)
  verdict?: string               // "Hit", "Flop", "Blockbuster"
}
```

**Box Office JSONB Structure:**
```typescript
box_office: {
  opening_day: string,           // "₹12 Cr"
  first_week: string,            // "₹45 Cr"
  lifetime_gross: string,        // "₹180 Cr"
  worldwide_gross: string,       // "₹250 Cr"
  budget: string,                // "₹50 Cr"
  verdict: string                // "Blockbuster"
}
```

**Box Office Categories:**
```sql
box_office_category CHECK (
  'industry-hit' |     -- Top grosser of year/era
  'blockbuster' |      -- Huge commercial success
  'super-hit' |        -- Very successful
  'hit' |              -- Commercially successful
  'average' |          -- Broke even
  'below-average' |    -- Lost money
  'disaster'           -- Major flop
)
```

#### J. Tags & Classification (8 fields)
```typescript
{
  // Boolean flags
  is_blockbuster?: boolean,
  is_classic?: boolean,
  is_underrated?: boolean,
  is_featured?: boolean,
  is_published?: boolean,
  is_trending?: boolean,
  
  // Content metadata
  certification?: string,        // Censor rating: "U", "U/A", "A"
  age_rating?: string           // Alias for certification
}
```

#### K. Content Flags & Awards (2 fields - JSONB)
```typescript
{
  // Content classification
  content_flags?: {
    pan_india: boolean,          // Pan-India release
    remake_of?: string,          // Original movie slug
    original_language?: string,  // If remake: "Hindi", "Tamil"
    sequel_number?: number,      // 2, 3, etc.
    franchise?: string,          // "Baahubali", "KGF"
    biopic: boolean,            // Based on real person
    based_on?: string,          // "True events", "Novel"
    debut_director: boolean,    // Director's debut
    debut_hero: boolean,        // Hero's debut
    debut_heroine: boolean      // Heroine's debut
  },
  
  // Awards tracking
  awards?: Array<{
    type: 'national' | 'international' | 'regional' | 'industry',
    category: string,            // "Best Actor", "Best Film"
    year: number,
    recipient: string,           // Person who won
    award_body: string          // "Filmfare", "Nandi"
  }>
}
```

#### L. External IDs & Sources (7 fields)
```typescript
{
  tmdb_id?: number,              // The Movie Database ID
  imdb_id?: string,              // IMDb ID (tt1234567)
  wikidata_id?: string,          // Wikidata QID
  wikipedia_url?: string,        // Wikipedia page URL
  
  // Data sourcing
  data_sources?: string[],       // ['tmdb', 'wikipedia', 'wikidata']
  source?: string,               // Primary source
  enrichment_source?: string     // Latest enrichment source
}
```

#### M. Data Quality & Governance (11 fields)
```typescript
{
  // Confidence & Trust
  data_confidence?: number,      // 0.0-1.0 overall confidence
  confidence_breakdown?: JSONB,  // Field-level confidence
  trust_badge?: string,          // UI badge: 'verified', 'high', 'medium'
  trust_score?: number,          // 0-100 governance score
  confidence_tier?: string,      // 'verified' | 'high' | 'medium' | 'low'
  
  // Enrichment tracking
  ingestion_status?: string,     // 'raw' | 'partial' | 'enriched' | 'verified'
  completeness_score?: number,   // 0.0-1.0 data completeness
  last_stage_completed?: string, // Latest pipeline stage
  stage_completed_at?: Date,
  last_enriched_at?: Date,
  
  // Content classification
  content_type?: string          // 'fact' | 'editorial' | 'archive'
}
```

#### N. Review & Editorial (6 fields)
```typescript
{
  // Review status
  has_review?: boolean,          // Has any review
  total_reviews?: number,        // Count of reviews
  featured_review?: string,      // Featured review text
  editorial_review?: string,     // Editorial review text
  
  // Smart review (AI-derived)
  smart_review?: JSONB,          // Structured insights
  smart_review_derived_at?: Date
}
```

**Smart Review Structure:**
```typescript
smart_review: {
  why_to_watch: string[],        // Reasons to watch
  why_to_skip: string[],         // Potential drawbacks
  critics_pov?: string,          // Critical perspective
  audience_pov?: string,         // Audience perspective
  legacy_status?: 'cult_classic' | 'forgotten_gem' | 'landmark' | 'mainstream',
  mood_suitability: string[],    // "Weekend watch", "Family viewing"
  content_warnings: string[],    // Violence, language, etc.
  best_of_tags: {
    actor_best: boolean,         // Actor's best performance
    director_best: boolean,      // Director's best work
    music_best: boolean          // Best music
  },
  era_significance?: string,     // Historical importance
  derivation_confidence: number  // 0.0-1.0
}
```

#### O. Additional Metadata (9 fields)
```typescript
{
  // Production info
  trivia?: JSONB,                // Production trivia & facts
  trailer_url?: string,          // Official trailer
  trailer_youtube_id?: string,   // YouTube video ID
  
  // Sensitivity & Content
  content_sensitivity?: JSONB,   // Content warnings
  audience_suitability?: string, // Target audience
  trigger_warnings?: string[],   // Specific warnings
  
  // Engagement metrics
  views?: number,                // Page views
  likes?: number,                // User likes
  
  // Timestamps
  created_at?: Date,
  updated_at?: Date
}
```

**Trivia JSONB Structure:**
```typescript
trivia: {
  shooting_locations: string[],  // Where it was shot
  production_trivia: string[],   // Behind-the-scenes facts
  cultural_impact: string,       // Cultural significance
  controversies: string[],       // Controversies
  box_office_records: string[], // Records broken
  technical_innovations: string[] // Technical achievements
}
```

---

## 2. Movies Listing Page (/movies)

### 2.1 Page Purpose
Browse and filter Telugu movies with grid/section views.

### 2.2 Data Displayed per Movie Card

```typescript
interface MovieCard {
  // Identity
  id: string,
  title_en: string,              // "Pokiri"
  title_te?: string,             // "పోకిరి"
  slug: string,                  // For navigation
  
  // Visuals
  poster_url?: string,           // Card poster
  
  // Basic info
  release_year?: number,         // "2006"
  release_date?: string,         // For upcoming movies
  genres: string[],              // ["Action", "Thriller"]
  
  // Cast (displayed below poster)
  director?: string,             // "Puri Jagannadh"
  hero?: string,                 // "Mahesh Babu"
  
  // Ratings (prominently displayed)
  our_rating?: number,           // Prioritized over avg_rating
  avg_rating: number,            // Fallback rating
  total_reviews: number,         // Review count
  
  // Tags
  is_classic?: boolean,          // Badge display
  is_blockbuster?: boolean,      // Badge display
  is_underrated?: boolean        // Badge display
}
```

### 2.3 View Modes

#### Section View (Default)
- Curated sections: "Blockbusters", "Classics", "By Director", etc.
- 8-20 movies per section
- Multiple sections loaded dynamically
- Lazy loading with intersection observer

#### Grid View (Filter Mode)
- 24 movies per page
- Infinite scroll pagination
- Advanced filtering

### 2.4 Filtering Capabilities

```typescript
interface ReviewFilters {
  // Sorting
  sortBy: 'rating' | 'release_year' | 'title' | 'popularity' | 'date_added',
  sortOrder: 'asc' | 'desc',
  
  // Basic filters
  genre?: string,                // Single genre
  language?: string,             // Default: "Telugu"
  era?: string,                  // Era classification
  
  // Cast/Crew filters
  actor?: string,                // Hero or heroine slug
  director?: string,             // Director slug
  profile?: string,              // Entity slug (any role)
  
  // Rating filters
  minRating?: number,            // Minimum rating
  maxRating?: number,            // Maximum rating
  
  // Year filters
  decade?: string,               // "2000s", "1990s"
  yearRange?: {
    from: number,
    to: number
  },
  
  // Tag filters
  isClassic?: boolean,
  isBlockbuster?: boolean,
  isUnderrated?: boolean,
  
  // Search
  searchQuery?: string           // Full-text search
}
```

### 2.5 API Endpoint

**URL:** `GET /api/movies`

**Query Parameters:**
- `limit`: Number of movies (default: 24)
- `offset`: Pagination offset
- `language`: Language filter (default: "Telugu")
- `genre`: Genre filter
- `actor`: Actor slug
- `director`: Director slug
- `yearFrom`, `yearTo`: Year range
- `minRating`: Minimum rating
- `underrated`, `blockbuster`, `classic`: Boolean filters
- `sortBy`: Sort column
- `sortOrder`: Sort direction

**Response Fields Selected:**
```sql
SELECT 
  id,
  title_en,
  title_te,
  slug,
  poster_url,
  release_year,
  release_date,
  genres,
  director,
  hero,
  heroine,
  our_rating,
  avg_rating,
  total_reviews,
  is_classic,
  is_blockbuster,
  is_underrated
FROM movies
WHERE language = 'Telugu'
  AND is_published = true
```

### 2.6 Special Features

**Mood-Based Filtering:**
Maps moods to genres for discovery:
```typescript
const MOOD_TO_GENRES = {
  'feel-good': ["Comedy", "Family", "Romance"],
  'intense': ["Thriller", "Action", "Crime"],
  'emotional': ["Drama", "Romance", "Family"],
  'thrilling': ["Thriller", "Mystery", "Crime"],
  'inspiring': ["Biographical", "Sports", "Drama"],
  'light': ["Comedy", "Romance", "Musical"],
  'dark': ["Thriller", "Horror", "Mystery"],
  'family': ["Family", "Comedy", "Animation"],
  'romantic': ["Romance", "Musical", "Drama"],
  'adventure': ["Fantasy", "Action"]
}
```

**Era Filtering:**
Quick filters for different time periods:
- 1950s-1970s: Classic Era
- 1980s-1990s: Golden Era
- 2000s-2010s: Modern Era
- 2020s: Contemporary

---

## 3. Movie Detail Page (/movies/[slug])

### 3.1 Page Purpose
Complete movie information with reviews, cast details, and recommendations.

### 3.2 Full Data Query

The page fetches **ALL fields** from the movies table:

```typescript
const { data: movie } = await supabase
  .from("movies")
  .select("*")              // Selects all 114 fields
  .eq("slug", slug)
  .eq("is_published", true)
  .single();
```

### 3.3 Page Sections & Data Display

#### Hero Section (Top Banner)
```typescript
{
  // Background
  backdrop_url: string,          // Full-width hero image
  
  // Primary info
  title_en: string,              // Large title
  title_te?: string,             // Telugu title below
  poster_url: string,            // Poster on left
  
  // Key metrics
  displayRating: number,         // Priority: editorial > featured review > our_rating > avg_rating
  release_year: number,
  runtime: number,               // "2h 30m"
  certification: string,         // "U/A"
  
  // Quick info
  genres: string[],              // Genre pills
  language: string,              // "Telugu"
  
  // Status handling
  status: string,                // "released" | "upcoming"
  release_date?: string          // For upcoming movies
}
```

**Rating Priority Logic:**
```typescript
const displayRating = 
  editorialReview?.verdict?.final_rating ||     // Priority 1: Editorial verdict
  featuredReview?.overall_rating ||              // Priority 2: Featured review
  movie.our_rating ||                            // Priority 3: Our rating
  Math.min(movie.avg_rating || 0, 8.5) ||       // Priority 4: TMDB (capped at 8.5)
  0;
```

#### Synopsis Section
```typescript
{
  synopsis_te?: string,          // Telugu synopsis (preferred)
  synopsis: string,              // English synopsis (fallback)
  tagline?: string,              // Marketing tagline
  overview?: string              // Short description (if synopsis missing)
}
```

#### Cast & Crew Section
```typescript
{
  // Primary cast (clickable links to profiles)
  director: string,              // With profile image
  hero: string,                  // With profile image
  heroine: string,               // With profile image
  music_director?: string,       // If available
  producer?: string,             // If available
  
  // Supporting cast (expandable section)
  supporting_cast: Array<{
    name: string,
    role: string,                // "Villain", "Comedy"
    order: number
  }>,
  
  // Technical crew (collapsible)
  crew: {
    cinematographer?: string,
    editor?: string,
    writer?: string,
    choreographer?: string,
    // ... other crew
  }
}
```

#### Rating Breakdown
```typescript
{
  our_rating: number,            // Main rating
  imdb_rating?: number,          // If available
  tmdb_rating?: number,          // If available
  
  // Editorial score (for movies without external ratings)
  editorial_score?: number,
  editorial_score_confidence: number,
  editorial_score_breakdown: {
    genre_baseline: number,
    director_average: number,
    hero_average: number,
    metadata_bonus: number
  }
}
```

#### Movie Details Grid
```typescript
{
  // Release info
  release_date: string,          // "April 28, 2006"
  release_year: number,
  language: string,
  
  // Production
  runtime: number,               // Minutes
  budget?: string,               // "₹50 Cr"
  certification: string,
  
  // Box office (if available)
  box_office: {
    opening_day: string,
    first_week: string,
    lifetime_gross: string,
    worldwide_gross: string,
    verdict: string
  },
  box_office_category: string,   // "Blockbuster"
  
  // External links
  tmdb_id: number,               // Link to TMDB
  imdb_id: string,               // Link to IMDb
  trailer_url?: string,          // Watch trailer
  wikipedia_url?: string         // Wikipedia article
}
```

#### Awards Section (if available)
```typescript
{
  awards: Array<{
    type: string,                // "National", "Filmfare"
    category: string,            // "Best Actor"
    year: number,
    recipient: string,
    award_body: string
  }>
}
```

#### Tags & Classification
```typescript
{
  // Visual badges
  is_blockbuster: boolean,       // "Blockbuster" badge
  is_classic: boolean,           // "Classic" badge
  is_underrated: boolean,        // "Hidden Gem" badge
  
  // Content flags
  content_flags: {
    pan_india: boolean,          // Pan-India badge
    remake_of?: string,          // "Remake of [Movie]"
    sequel_number?: number,      // "Part 2"
    franchise?: string,          // Franchise badge
    biopic: boolean,             // "Biopic" badge
    debut_director: boolean,     // "Directorial Debut"
    debut_hero: boolean          // "Acting Debut"
  },
  
  // Mood & vibe
  mood_tags: string[],           // "Feel-good", "Intense"
  style_tags: string[]           // Style descriptors
}
```

#### Reviews Section
Fetches from `movie_reviews` table:

```typescript
const { data: reviews } = await supabase
  .from("movie_reviews")
  .select("*")
  .eq("movie_id", movie.id)
  .eq("status", "published")
  .order("is_featured", { ascending: false })
  .order("created_at", { ascending: false });
```

**Review Data Displayed:**
```typescript
{
  // Header
  title: string,                 // Review title
  reviewer_name: string,         // Critic name
  reviewer_type: string,         // "critic" | "editor"
  overall_rating: number,        // Review rating
  created_at: Date,              // Publication date
  
  // Content
  summary: string,               // Quick summary
  summary_te?: string,           // Telugu summary
  
  // Detailed sections
  direction_review?: string,     // Direction analysis
  screenplay_review?: string,    // Screenplay analysis
  acting_review?: string,        // Acting analysis
  music_review?: string,         // Music analysis
  
  // Verdict
  verdict: string,               // Final verdict
  verdict_te?: string,           // Telugu verdict
  
  // Engagement
  views: number,                 // View count
  helpful_votes: number,         // Helpful votes
  
  // Editorial dimensions (if available)
  dimensions_json: {
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
}
```

#### Similar Movies Section
Uses similarity engine to generate 8-12 sections:

```typescript
const similarSections = await getSimilarMovieSections(movie, {
  maxSections: 12,               // Up to 12 sections
  maxMoviesPerSection: 20        // 20 movies each = ~200 total
});

// Section types generated:
// 1. "More from [Director]"
// 2. "More with [Hero]"
// 3. "More with [Heroine]"
// 4. "More from [Music Director]"
// 5. "More from [Producer]"
// 6. "Similar [Genre] Movies"
// 7. "From the [Era]"
// 8. "Supporting cast collaborations"
// 9. "Similar ratings"
// 10. "Same year releases"
// ... up to 12 sections
```

#### Smart Review Insights (if available)
```typescript
{
  smart_review: {
    why_to_watch: string[],      // 3-5 reasons
    why_to_skip: string[],       // 2-3 drawbacks
    critics_pov: string,         // Critical take
    audience_pov: string,        // Audience perspective
    legacy_status: string,       // Cultural status
    mood_suitability: string[],  // When to watch
    content_warnings: string[],  // Content advisories
    best_of_tags: {
      actor_best: boolean,
      director_best: boolean,
      music_best: boolean
    }
  }
}
```

#### Trivia Section (if available)
```typescript
{
  trivia: {
    shooting_locations: string[],
    production_trivia: string[],
    cultural_impact: string,
    controversies: string[],
    box_office_records: string[],
    technical_innovations: string[]
  }
}
```

### 3.4 Data Not Displayed (Backend Only)

These fields exist in the database but are not shown on the frontend:

```typescript
{
  // Quality metrics (used for filtering/sorting only)
  data_confidence: number,
  confidence_breakdown: Object,
  trust_score: number,
  completeness_score: number,
  ingestion_status: string,
  last_stage_completed: string,
  stage_completed_at: Date,
  
  // Internal tracking
  last_enriched_at: Date,
  enrichment_source: string,
  data_sources: string[],
  
  // Unused alternates
  description: string,           // Synonym for synopsis
  plot: string,                  // Synonym for synopsis
  
  // Engagement metrics (future use)
  views: number,
  likes: number
}
```

---

## 4. Celebrity Profile Pages

### 4.1 Page Purpose
Comprehensive celebrity information with filmography, stats, and career highlights.

### 4.2 API Endpoint

**URL:** `GET /api/profile/[slug]`

### 4.3 Data Returned

```typescript
interface ProfileResponse {
  // Core profile
  profile: {
    // Basic identity
    id: string,
    name_en: string,             // "Mahesh Babu"
    name_te: string,             // "మహేష్ బాబు"
    slug: string,
    profile_image: string,       // Profile photo
    cover_image_url: string,     // Banner image
    
    // Professional identity
    occupation: string[],        // ["actor", "producer"]
    industry_title: string,      // "Superstar"
    usp: string,                 // Unique selling point
    brand_pillars: string[],     // Key strengths
    legacy_impact: string,       // Career impact paragraph
    
    // Biography
    short_bio: string,           // Brief bio (EN)
    short_bio_te: string,        // Telugu bio
    full_bio?: string,           // Extended bio
    
    // Personal details
    birth_date: string,
    birth_place: string,
    gender: string,
    
    // External IDs
    tmdb_id: number,
    imdb_id: string,
    wikipedia_url: string,
    
    // Social links
    social_links: Array<{
      platform: string,
      url: string,
      handle: string
    }>,
    
    // Relationships
    family_relationships: {
      father?: { name: string, slug: string },
      mother?: { name: string, slug: string },
      spouse?: { name: string, slug: string },
      sons?: Array<{ name: string, slug: string }>,
      daughters?: Array<{ name: string, slug: string }>,
      siblings?: Array<{ name: string, slug: string }>
    },
    
    // On-screen pairings
    romantic_pairings: Array<{
      name: string,
      slug: string,
      count: number,
      highlight: string,
      films: string[]
    }>,
    
    // Career eras
    actor_eras: Array<{
      name: string,              // "Golden Era"
      years: string,             // "1986-2000"
      themes: string[],          // ["Action", "Romance"]
      key_films: string[]        // Notable movies
    }>,
    
    // Fan culture
    fan_culture: {
      fan_identity: string,      // "Mahesh Fans"
      cultural_titles: string[], // Fan-given titles
      viral_moments: string[],   // Memorable events
      trivia: string[]           // Fun facts
    }
  },
  
  // Career statistics
  stats: {
    total_movies: number,        // Total filmography
    hits: number,                // Hit movies
    flops: number,               // Flop movies
    hit_rate: number,            // Success percentage
    avg_rating: number,          // Average movie rating
    career_span: string,         // "1999-2024"
    debut_year: number,
    peak_year: number,
    awards_won: number,
    total_awards: number         // Including nominations
  },
  
  // Filmography (movies where they appear)
  filmography: Array<{
    // Movie details
    id: string,
    title_en: string,
    title_te: string,
    slug: string,
    poster_url: string,
    release_year: number,
    
    // Role info
    role: 'hero' | 'heroine' | 'director' | 'music_director' | 'producer' | 'supporting',
    character_name?: string,
    is_lead: boolean,
    is_cameo: boolean,
    
    // Performance
    our_rating: number,
    box_office_category: string,
    verdict: string,             // "Hit", "Flop", "Blockbuster"
    verdict_color: string,       // UI color code
    genres: string[]
  }>,
  
  // Top collaborations
  collaborations: {
    directors: Array<{
      name: string,
      slug: string,
      count: number,
      hit_rate: number,
      notable_films: string[]
    }>,
    music_directors: Array<{
      name: string,
      slug: string,
      count: number,
      hit_rate: number,
      notable_films: string[]
    }>,
    heroines: Array<{
      name: string,
      slug: string,
      count: number,
      chemistry_note: string,
      films: string[]
    }>
  },
  
  // Awards & milestones
  awards: Array<{
    id: string,
    award_name: string,          // "Filmfare Award"
    category: string,            // "Best Actor"
    year: number,
    movie_title: string,
    is_won: boolean,
    award_type: string           // "national", "filmfare", etc.
  }>,
  
  milestones: Array<{
    id: string,
    milestone_type: string,      // "debut", "breakthrough", etc.
    year: number,
    title: string,
    description: string,
    impact_score: number,
    movie_title?: string
  }>,
  
  // Trivia
  trivia: Array<{
    id: string,
    trivia_text: string,
    trivia_text_te: string,
    category: string,            // "personal", "career", etc.
    is_verified: boolean
  }>,
  
  // Related celebrities
  related: Array<{
    name: string,
    slug: string,
    profile_image: string,
    relation_type: string,       // "frequent_costar", "family", etc.
    relation_label: string,
    collaboration_count: number
  }>
}
```

### 4.4 Page Layout Sections

1. **Hero Section**
   - Cover image (backdrop)
   - Profile image (circular)
   - Name (EN + TE)
   - Industry title
   - Occupation tags
   - Social media links

2. **Quick Stats Bar**
   - Total movies
   - Hit rate %
   - Average rating
   - Awards count
   - Career span

3. **Biography Section**
   - Short bio (EN/TE)
   - Full bio (expandable)
   - Personal details (birth date, place)

4. **Brand Identity**
   - USP paragraph
   - Brand pillars (3-5 key attributes)
   - Legacy impact paragraph

5. **Career Timeline**
   - Actor eras with themes
   - Key films per era
   - Visual timeline

6. **Filmography Grid**
   - Sortable/filterable movie grid
   - Year, rating, verdict display
   - Role badges (hero, director, etc.)

7. **Top Collaborations**
   - Most frequent directors
   - Most frequent music directors
   - On-screen pairings (for actors)

8. **Awards Showcase**
   - Awards won vs nominated
   - Grouped by award type
   - Yearly timeline

9. **Career Milestones**
   - Debut, breakthrough, peak moments
   - Chronological display
   - Impact scores

10. **Family Dynasty** (if applicable)
    - Family tree visualization
    - Links to family members' profiles

11. **Fan Culture**
    - Fan identity & titles
    - Viral moments
    - Trivia & fun facts

12. **Related Celebrities**
    - Frequent collaborators
    - Family members
    - Similar era actors

---

## 5. Data Flow & Architecture

### 5.1 Data Pipeline Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA SOURCES                              │
├─────────────────────────────────────────────────────────────┤
│  TMDB → Wikipedia → Wikidata → IMDb → OMDb → Archive.org   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              ENRICHMENT PIPELINE                             │
├─────────────────────────────────────────────────────────────┤
│  Phase 1: Images (posters, backdrops)                       │
│  Phase 2: Cast & Crew (hero, director, supporting)          │
│  Phase 3: Editorial Scores (for unrated movies)             │
│  Phase 4: Validation (multi-source consensus)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                  MOVIES TABLE                                │
│                  (114 fields)                                │
├─────────────────────────────────────────────────────────────┤
│  • Core identity (7)      • Box office (5)                   │
│  • Release info (6)       • Tags (8)                         │
│  • Visual assets (6)      • Content flags (2)                │
│  • Cast/crew (8)          • External IDs (7)                 │
│  • Synopsis (6)           • Quality metrics (11)             │
│  • Genres (9)             • Reviews (6)                      │
│  • Ratings (11)           • Additional (9)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ↓             ↓             ↓
    ┌────────┐   ┌─────────┐   ┌──────────┐
    │ Movies │   │  Movie  │   │Celebrity │
    │ Listing│   │ Detail  │   │ Profile  │
    │  Page  │   │  Page   │   │   Page   │
    └────────┘   └─────────┘   └──────────┘
```

### 5.2 Query Performance

#### Movies Listing
- **Query Time:** ~100-200ms
- **Fields Selected:** 17 fields (optimized subset)
- **Pagination:** 24 movies per load
- **Indexes Used:**
  - `idx_movies_language`
  - `idx_movies_genres` (GIN)
  - `idx_movies_release_year`
  - `idx_movies_our_rating`

#### Movie Detail
- **Query Time:** ~200-400ms
- **Fields Selected:** ALL 114 fields
- **Additional Queries:**
  - Reviews (1 query)
  - Similar movies (dynamic, 8-12 queries)
- **Indexes Used:**
  - `idx_movies_slug` (unique)
  - `idx_movie_reviews_movie_id`

#### Celebrity Profile
- **Query Time:** ~300-600ms
- **Queries:**
  - Celebrity profile (1)
  - Filmography (1, joins movies)
  - Awards (1)
  - Milestones (1)
  - Trivia (1)
  - Collaborations (computed)
- **Indexes Used:**
  - `idx_celebrities_slug` (unique)
  - `idx_movies_hero`, `idx_movies_heroine`, `idx_movies_director`
  - `idx_celebrity_awards_celebrity_id`
  - `idx_celebrity_milestones_celebrity_id`

### 5.3 Caching Strategy

```typescript
// Next.js API Routes with caching
export const revalidate = 3600;  // 1 hour for listing pages
export const revalidate = 1800;  // 30 minutes for detail pages

// Static generation for popular movies
export async function generateStaticParams() {
  const movies = await getTopMovies(100);  // Top 100 movies
  return movies.map(m => ({ slug: m.slug }));
}
```

### 5.4 Data Freshness

| Data Type | Update Frequency | Source |
|-----------|------------------|--------|
| Movie metadata | Daily (TMDB sync) | Automated |
| Posters/images | Weekly batch | Enrichment script |
| Cast/crew | On-demand | Enrichment script |
| Editorial scores | Monthly | Enrichment script |
| Reviews | Real-time | Admin panel |
| User engagement | Real-time | User interactions |

---

## Summary: What Shows Where

### Movies Listing Page
**17 fields displayed:**
- Identity: title_en, title_te, slug
- Visual: poster_url
- Info: release_year, genres (array)
- Cast: director, hero
- Ratings: our_rating, avg_rating, total_reviews
- Tags: is_classic, is_blockbuster, is_underrated

### Movie Detail Page  
**~70 fields displayed** (62% of available data):
- ALL identity, release, visual fields
- ALL cast/crew (primary + supporting + crew object)
- ALL synopsis/marketing fields
- ALL genre/classification fields
- ALL ratings (our, avg, imdb, tmdb, editorial)
- ALL box office data
- ALL tags and content flags
- ALL awards
- ALL external IDs + trailer
- PLUS: Reviews, similar movies, insights

**NOT displayed** (~44 fields):
- Quality metrics (confidence, trust scores)
- Ingestion status tracking
- Last enriched timestamps
- Internal data sources tracking
- Engagement metrics (views, likes)
- Unused synonym fields

### Celebrity Profile Page
**ALL celebrity data** from multiple tables:
- celebrities table (60+ fields)
- celebrity_awards (all awards)
- celebrity_milestones (all milestones)
- celebrity_trivia (all trivia)
- Computed: filmography, collaborations, stats

---

**Document Maintained By:** Telugu Portal Team  
**Last Audit:** January 15, 2026  
**Page Coverage:** Movies (62% of fields), Celebrities (100% of relevant data)
