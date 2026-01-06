/**
 * Celebrity Profile Types
 * Types for celebrity enrichment, awards, milestones, and trivia
 */

// ============================================================
// CORE TYPES
// ============================================================

export interface CelebrityProfile {
  id: string;
  slug: string;
  name_en: string;
  name_te?: string;
  gender?: 'male' | 'female' | 'other';
  birth_date?: string;
  death_date?: string;
  birth_place?: string;
  occupation?: string[];
  
  // Bio
  short_bio?: string;
  short_bio_te?: string;
  full_bio?: string;
  full_bio_te?: string;
  
  // Personal
  education?: string;
  spouse?: string;
  children_count?: number;
  height?: string;
  nicknames?: string[];
  family_details?: Record<string, unknown>;
  
  // Career
  debut_year?: number;
  debut_movie?: string;
  breakthrough_movie?: string;
  peak_year?: number;
  known_for?: string[];
  signature_style?: string;
  era?: 'legend' | 'golden' | 'classic' | 'current' | 'emerging';
  
  // Stats
  total_movies?: number;
  hits_count?: number;
  flops_count?: number;
  hit_rate?: number;
  awards_count?: number;
  popularity_score?: number;
  
  // External IDs
  tmdb_id?: number;
  imdb_id?: string;
  wikidata_id?: string;
  wikipedia_url?: string;
  
  // Media
  profile_image?: string;
  profile_image_source?: string;
  gallery_images?: string[];
  
  // Social
  instagram_handle?: string;
  twitter_handle?: string;
  youtube_channel?: string;
  
  // Meta
  enrichment_status?: 'pending' | 'partial' | 'complete';
  last_enriched_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CelebrityAward {
  id?: string;
  celebrity_id: string;
  award_name: string;
  award_type: 'national' | 'filmfare' | 'nandi' | 'siima' | 'cinemaa' | 'other';
  category?: string;
  year?: number;
  movie_id?: string;
  movie_title?: string;
  is_won: boolean;
  is_nomination?: boolean;
  source?: string;
  source_url?: string;
}

export interface CelebrityTrivia {
  id?: string;
  celebrity_id: string;
  trivia_text: string;
  trivia_text_te?: string;
  category: 'personal' | 'career' | 'fun_fact' | 'controversy' | 'family' | 'education';
  source_url?: string;
  is_verified?: boolean;
  is_published?: boolean;
  display_order?: number;
}

export interface CelebrityMilestone {
  id?: string;
  celebrity_id: string;
  milestone_type: 'debut' | 'breakthrough' | 'peak' | 'comeback' | 'downfall' | 'retirement' | 'award' | 'record';
  year: number;
  movie_id?: string;
  movie_title?: string;
  title: string;
  title_te?: string;
  description?: string;
  description_te?: string;
  impact_score?: number;
  is_published?: boolean;
}

// ============================================================
// ENRICHMENT TYPES
// ============================================================

export interface CelebrityEnrichmentData {
  // Basic Info
  name_en?: string;
  name_te?: string;
  gender?: string;
  birth_date?: string;
  death_date?: string;
  birth_place?: string;
  
  // Bio
  short_bio?: string;
  full_bio?: string;
  
  // Personal
  education?: string;
  spouse?: string;
  children_count?: number;
  height?: string;
  nicknames?: string[];
  
  // Career
  occupation?: string[];
  debut_year?: number;
  debut_movie?: string;
  known_for?: string[];
  
  // Media
  profile_image?: string;
  profile_image_source?: string;
  
  // External IDs
  tmdb_id?: number;
  imdb_id?: string;
  wikidata_id?: string;
  wikipedia_url?: string;
  
  // Awards (from enrichment)
  awards?: CelebrityAward[];
  
  // Trivia (from enrichment)
  trivia?: CelebrityTrivia[];
}

export interface EnrichmentResult {
  celebrity_id: string;
  name: string;
  source: 'tmdb' | 'wikipedia' | 'wikidata' | 'imdb' | 'ai' | 'none';
  data: CelebrityEnrichmentData;
  fields_updated: string[];
  awards_found: number;
  trivia_found: number;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface CelebrityProfileResponse {
  celebrity: CelebrityProfile;
  awards: CelebrityAward[];
  milestones: CelebrityMilestone[];
  trivia: CelebrityTrivia[];
  filmography: FilmographyItem[];
  related_celebrities: RelatedCelebrity[];
}

export interface FilmographyItem {
  movie_id: string;
  title_en: string;
  title_te?: string;
  slug: string;
  release_year: number;
  poster_url?: string;
  role?: string;
  role_type?: 'lead' | 'supporting' | 'cameo' | 'voice' | 'special_appearance';
  verdict?: string;
  verdict_color?: string;
  our_rating?: number;
  genres?: string[];
  director?: string;
  is_debut?: boolean;
  is_blockbuster?: boolean;
  is_iconic?: boolean;
}

export interface RelatedCelebrity {
  id: string;
  slug: string;
  name_en: string;
  name_te?: string;
  profile_image?: string;
  occupation?: string;
  collaboration_count: number;
  relation_type: 'costar' | 'director' | 'producer' | 'music_director';
}

export interface AwardsSummary {
  total: number;
  national: number;
  filmfare: number;
  nandi: number;
  siima: number;
  other: number;
}

export interface CareerStats {
  total_movies: number;
  hits: number;
  average: number;
  flops: number;
  hit_rate: number;
  active_years: string;
  peak_years: string;
  debut_year?: number;
  awards_won: number;
}

// ============================================================
// FILMOGRAPHY GROUPING
// ============================================================

export interface FilmographyByDecade {
  decade: string; // "2020s", "2010s", etc.
  movies: FilmographyItem[];
}

export interface FilmographyByGenre {
  genre: string;
  movies: FilmographyItem[];
}

export interface FilmographyByVerdict {
  verdict: 'blockbuster' | 'hit' | 'average' | 'flop' | 'unknown';
  movies: FilmographyItem[];
}


