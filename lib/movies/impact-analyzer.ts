/**
 * Movie Impact Analyzer
 * 
 * Calculates comprehensive counterfactual impact analysis for significant movies:
 * - Career trajectories (actors/directors launched, pivots, breakthroughs)
 * - Industry influence (genre shifts, budget trends, inspired movies)
 * - Box office ripple effects (immediate and long-term)
 * - Influence network (direct/indirect influences, cultural moments)
 * 
 * REUSES:
 * - similarity-engine.ts for finding inspired/similar movies
 * - Existing collaborations table for relationship data
 * - Movie ratings and review data for quality metrics
 */

import { createClient } from '@supabase/supabase-js';
import { getSimilarMovies, calculateSimilarity, type SimilarMovie } from './similarity-engine';

// ============================================================
// TYPES
// ============================================================

export interface MovieImpactAnalysis {
  movie_id: string;
  movie_title: string;
  release_year: number;
  
  // Career trajectories
  career_impact: CareerImpact;
  
  // Industry trends
  industry_influence: IndustryInfluence;
  
  // Box office ecosystem
  box_office_ripple: BoxOfficeRipple;
  
  // Influence network
  influence_graph: InfluenceGraph;
  
  // Meta
  confidence_score: number;
  calculated_at: Date;
  significance_tier: 'landmark' | 'influential' | 'notable' | 'standard';
}

export interface CareerImpact {
  actors_launched: Array<{
    name: string;
    slug?: string;
    first_major_role: boolean;
    debut_film: boolean;
    career_trajectory: 'superstar' | 'star' | 'character_actor' | 'one_hit' | 'steady';
    before_rating?: number;
    after_rating?: number;
    films_before: number;
    films_after: number;
    breakthrough_detected: boolean;
  }>;
  
  directors_established: Array<{
    name: string;
    slug?: string;
    breakthrough: boolean;
    career_pivot: boolean;
    genre_shift?: string;
    films_before: number;
    films_after: number;
    avg_rating_before?: number;
    avg_rating_after?: number;
  }>;
  
  career_pivots: Array<{
    name: string;
    role: 'actor' | 'director' | 'music_director' | 'producer';
    before_rating: number;
    after_rating: number;
    before_hit_rate?: number;
    after_hit_rate?: number;
    transformation_type: 'comeback' | 'peak' | 'genre_switch' | 'reinvention';
  }>;
}

export interface IndustryInfluence {
  genre_shift: {
    primary_genre: string;
    before_count: number;
    after_count: number;
    percentage_change: number;
    years_analyzed: number; // 3 years before/after
    confidence: number;
  };
  
  budget_trend: {
    avg_before?: number;
    avg_after?: number;
    trend: 'increased' | 'decreased' | 'stable' | 'unknown';
    confidence: number;
  };
  
  inspired_movies: Array<{
    title: string;
    slug: string;
    similarity_score: number;
    release_year: number;
    reasons: string[];
    is_copycat: boolean; // similarity > 0.75
  }>;
  
  copycat_count: number;
  inspiration_count: number; // similarity 0.60-0.75
  
  technical_innovation?: {
    category: 'vfx' | 'cinematography' | 'sound' | 'editing' | 'music' | 'storytelling';
    description: string;
    adopted_by_count: number;
  };
}

export interface BoxOfficeRipple {
  immediate_impact: {
    affected_releases: number; // Movies in same month
    clash_victims: string[]; // Movies that flopped due to clash
    beneficiaries: string[]; // Movies that benefited from hype
    total_impact: string; // e.g., "₹50 Crores impact"
    confidence: number;
  };
  
  long_term_trend: {
    years_affected: number; // How many years this movie's influence lasted
    genre_boost: number; // Percentage boost to genre popularity
    star_value_increase?: {
      hero?: number;
      heroine?: number;
      director?: number;
    };
    market_expansion?: boolean; // Did it expand Telugu cinema's reach?
  };
}

export interface InfluenceGraph {
  direct_influences: Array<{
    title: string;
    slug: string;
    year: number;
    influence_type: 'copied_plot' | 'inspired_style' | 'similar_theme' | 'remade' | 'spawned_franchise';
    similarity_score: number;
  }>;
  
  indirect_influences: Array<{
    title: string;
    slug: string;
    year: number;
    connection: string; // How it's connected (via another movie)
  }>;
  
  cultural_moments: Array<{
    type: 'dialogue' | 'song' | 'scene' | 'character' | 'trend';
    description: string;
    virality_score?: number;
    lasting_impact: boolean;
  }>;
  
  franchise_spawned: boolean;
  sequels?: string[];
  remakes?: string[];
}

// ============================================================
// MAIN ANALYZER
// ============================================================

export class MovieImpactAnalyzer {
  private supabase;
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  
  /**
   * Calculate comprehensive impact analysis for a movie
   */
  async analyzeMovieImpact(
    movieId: string,
    options: {
      includeCareer?: boolean;
      includeIndustry?: boolean;
      includeBoxOffice?: boolean;
      includeInfluence?: boolean;
    } = {}
  ): Promise<MovieImpactAnalysis | null> {
    const {
      includeCareer = true,
      includeIndustry = true,
      includeBoxOffice = true,
      includeInfluence = true,
    } = options;
    
    // Get movie data
    const { data: movie, error } = await this.supabase
      .from('movies')
      .select('*')
      .eq('id', movieId)
      .single();
    
    if (error || !movie) {
      console.error('Movie not found:', movieId);
      return null;
    }
    
    // Run analyses in parallel
    const [careerImpact, industryInfluence, boxOfficeRipple, influenceGraph] = 
      await Promise.all([
        includeCareer ? this.analyzeCareerTrajectories(movie) : Promise.resolve(this.getEmptyCareerImpact()),
        includeIndustry ? this.identifyIndustryShifts(movie) : Promise.resolve(this.getEmptyIndustryInfluence()),
        includeBoxOffice ? this.calculateBoxOfficeImpact(movie) : Promise.resolve(this.getEmptyBoxOfficeRipple()),
        includeInfluence ? this.buildInfluenceNetwork(movie) : Promise.resolve(this.getEmptyInfluenceGraph()),
      ]);
    
    // Calculate overall confidence and significance
    const confidence_score = this.calculateConfidence(movie, {
      careerImpact,
      industryInfluence,
      influenceGraph,
    });
    
    const significance_tier = this.determineSignificanceTier(movie, {
      careerImpact,
      industryInfluence,
      influenceGraph,
    });
    
    return {
      movie_id: movie.id,
      movie_title: movie.title_en,
      release_year: movie.release_year,
      career_impact: careerImpact,
      industry_influence: industryInfluence,
      box_office_ripple: boxOfficeRipple,
      influence_graph: influenceGraph,
      confidence_score,
      calculated_at: new Date(),
      significance_tier,
    };
  }
  
  /**
   * Analyze career trajectories - who did this movie launch/transform?
   */
  private async analyzeCareerTrajectories(movie: any): Promise<CareerImpact> {
    const actors_launched: CareerImpact['actors_launched'] = [];
    const directors_established: CareerImpact['directors_established'] = [];
    const career_pivots: CareerImpact['career_pivots'] = [];
    
    // Analyze hero's career
    if (movie.hero) {
      const heroTrajectory = await this.analyzeEntityCareer(
        movie.hero,
        'hero',
        movie.release_year
      );
      
      if (heroTrajectory) {
        if (heroTrajectory.is_breakthrough || heroTrajectory.is_debut) {
          actors_launched.push({
            name: movie.hero,
            first_major_role: heroTrajectory.is_breakthrough,
            debut_film: heroTrajectory.is_debut,
            career_trajectory: heroTrajectory.trajectory_type,
            before_rating: heroTrajectory.avg_rating_before,
            after_rating: heroTrajectory.avg_rating_after,
            films_before: heroTrajectory.films_before,
            films_after: heroTrajectory.films_after,
            breakthrough_detected: heroTrajectory.is_breakthrough,
          });
        }
        
        if (heroTrajectory.is_pivot) {
          career_pivots.push({
            name: movie.hero,
            role: 'actor',
            before_rating: heroTrajectory.avg_rating_before || 0,
            after_rating: heroTrajectory.avg_rating_after || 0,
            before_hit_rate: heroTrajectory.hit_rate_before,
            after_hit_rate: heroTrajectory.hit_rate_after,
            transformation_type: heroTrajectory.pivot_type || 'peak',
          });
        }
      }
    }
    
    // Analyze heroine's career
    if (movie.heroine) {
      const heroineTrajectory = await this.analyzeEntityCareer(
        movie.heroine,
        'heroine',
        movie.release_year
      );
      
      if (heroineTrajectory?.is_breakthrough || heroineTrajectory?.is_debut) {
        actors_launched.push({
          name: movie.heroine,
          first_major_role: heroineTrajectory.is_breakthrough,
          debut_film: heroineTrajectory.is_debut,
          career_trajectory: heroineTrajectory.trajectory_type,
          before_rating: heroineTrajectory.avg_rating_before,
          after_rating: heroineTrajectory.avg_rating_after,
          films_before: heroineTrajectory.films_before,
          films_after: heroineTrajectory.films_after,
          breakthrough_detected: heroineTrajectory.is_breakthrough,
        });
      }
    }
    
    // Analyze director's career
    if (movie.director) {
      const directorTrajectory = await this.analyzeEntityCareer(
        movie.director,
        'director',
        movie.release_year
      );
      
      if (directorTrajectory) {
        if (directorTrajectory.is_breakthrough || directorTrajectory.is_debut) {
          directors_established.push({
            name: movie.director,
            breakthrough: directorTrajectory.is_breakthrough,
            career_pivot: directorTrajectory.is_pivot,
            films_before: directorTrajectory.films_before,
            films_after: directorTrajectory.films_after,
            avg_rating_before: directorTrajectory.avg_rating_before,
            avg_rating_after: directorTrajectory.avg_rating_after,
          });
        }
      }
    }
    
    return {
      actors_launched,
      directors_established,
      career_pivots,
    };
  }
  
  /**
   * Analyze an entity's (actor/director) career trajectory around a specific movie
   */
  private async analyzeEntityCareer(
    entityName: string,
    field: 'hero' | 'heroine' | 'director',
    releaseYear: number
  ): Promise<{
    is_debut: boolean;
    is_breakthrough: boolean;
    is_pivot: boolean;
    trajectory_type: 'superstar' | 'star' | 'character_actor' | 'one_hit' | 'steady';
    pivot_type?: 'comeback' | 'peak' | 'genre_switch' | 'reinvention';
    films_before: number;
    films_after: number;
    avg_rating_before?: number;
    avg_rating_after?: number;
    hit_rate_before?: number;
    hit_rate_after?: number;
  } | null> {
    // Get all movies for this entity
    const { data: allMovies } = await this.supabase
      .from('movies')
      .select('id, title_en, release_year, our_rating, avg_rating, is_blockbuster')
      .eq(field, entityName)
      .not('release_year', 'is', null)
      .order('release_year', { ascending: true });
    
    if (!allMovies || allMovies.length === 0) return null;
    
    const moviesBefore = allMovies.filter(m => m.release_year < releaseYear);
    const moviesAfter = allMovies.filter(m => m.release_year > releaseYear);
    
    const is_debut = moviesBefore.length === 0;
    
    // Calculate ratings before/after
    const ratedBefore = moviesBefore.filter(m => m.our_rating || m.avg_rating);
    const ratedAfter = moviesAfter.filter(m => m.our_rating || m.avg_rating);
    
    const avg_rating_before = ratedBefore.length > 0
      ? ratedBefore.reduce((sum, m) => sum + (m.our_rating || m.avg_rating || 0), 0) / ratedBefore.length
      : undefined;
    
    const avg_rating_after = ratedAfter.length > 0
      ? ratedAfter.reduce((sum, m) => sum + (m.our_rating || m.avg_rating || 0), 0) / ratedAfter.length
      : undefined;
    
    // Calculate hit rates
    const hit_rate_before = moviesBefore.length > 0
      ? (moviesBefore.filter(m => m.is_blockbuster).length / moviesBefore.length) * 100
      : undefined;
    
    const hit_rate_after = moviesAfter.length > 0
      ? (moviesAfter.filter(m => m.is_blockbuster).length / moviesAfter.length) * 100
      : undefined;
    
    // Detect breakthrough: significant improvement after this movie
    const is_breakthrough = 
      !is_debut &&
      avg_rating_before !== undefined &&
      avg_rating_after !== undefined &&
      (avg_rating_after - avg_rating_before) >= 1.0; // Rating improved by 1+ point
    
    // Detect pivot: career transformation
    const is_pivot = 
      avg_rating_before !== undefined &&
      avg_rating_after !== undefined &&
      Math.abs(avg_rating_after - avg_rating_before) >= 0.8;
    
    let pivot_type: 'comeback' | 'peak' | 'genre_switch' | 'reinvention' | undefined;
    if (is_pivot && avg_rating_before && avg_rating_after) {
      if (avg_rating_before < 6 && avg_rating_after > 7) {
        pivot_type = 'comeback';
      } else if (avg_rating_after >= 8) {
        pivot_type = 'peak';
      } else if (avg_rating_after < avg_rating_before) {
        pivot_type = 'genre_switch'; // Could be experiment
      }
    }
    
    // Determine trajectory type
    let trajectory_type: 'superstar' | 'star' | 'character_actor' | 'one_hit' | 'steady' = 'steady';
    if (moviesAfter.length >= 10 && (hit_rate_after || 0) >= 50) {
      trajectory_type = 'superstar';
    } else if (moviesAfter.length >= 5 && (avg_rating_after || 0) >= 7) {
      trajectory_type = 'star';
    } else if (moviesAfter.length <= 2) {
      trajectory_type = 'one_hit';
    } else if (moviesAfter.length >= 10) {
      trajectory_type = 'character_actor';
    }
    
    return {
      is_debut,
      is_breakthrough,
      is_pivot,
      trajectory_type,
      pivot_type,
      films_before: moviesBefore.length,
      films_after: moviesAfter.length,
      avg_rating_before,
      avg_rating_after,
      hit_rate_before,
      hit_rate_after,
    };
  }
  
  /**
   * Identify industry shifts caused by this movie
   */
  private async identifyIndustryShifts(movie: any): Promise<IndustryInfluence> {
    const releaseYear = movie.release_year;
    const primaryGenre = movie.genres?.[0] || 'drama';
    
    // Analyze genre trends 3 years before/after
    const yearsBefore = 3;
    const yearsAfter = 3;
    
    const { data: genreMoviesBefore } = await this.supabase
      .from('movies')
      .select('id')
      .contains('genres', [primaryGenre])
      .gte('release_year', releaseYear - yearsBefore)
      .lt('release_year', releaseYear);
    
    const { data: genreMoviesAfter } = await this.supabase
      .from('movies')
      .select('id')
      .contains('genres', [primaryGenre])
      .gt('release_year', releaseYear)
      .lte('release_year', releaseYear + yearsAfter);
    
    const before_count = genreMoviesBefore?.length || 0;
    const after_count = genreMoviesAfter?.length || 0;
    const percentage_change = before_count > 0
      ? ((after_count - before_count) / before_count) * 100
      : 0;
    
    // Find inspired/similar movies (using similarity engine)
    const { data: laterMovies } = await this.supabase
      .from('movies')
      .select('id, title_en, slug, release_year, genres, director, hero')
      .gt('release_year', releaseYear)
      .lte('release_year', releaseYear + 5)
      .limit(100);
    
    const inspired_movies: IndustryInfluence['inspired_movies'] = [];
    let copycat_count = 0;
    let inspiration_count = 0;
    
    if (laterMovies) {
      for (const laterMovie of laterMovies) {
        // Skip if same director or hero (that's just their style, not inspiration)
        if (laterMovie.director === movie.director || laterMovie.hero === movie.hero) {
          continue;
        }
        
        const similarity = calculateSimilarity(movie, laterMovie, {
          includeGenre: true,
          includeDirector: false, // Exclude to find true inspiration
          includeActor: false,
        });
        
        if (similarity >= 60) {
          const is_copycat = similarity >= 75;
          if (is_copycat) copycat_count++;
          else inspiration_count++;
          
          const reasons: string[] = [];
          if (movie.genres?.some(g => laterMovie.genres?.includes(g))) {
            reasons.push('Similar genre');
          }
          
          inspired_movies.push({
            title: laterMovie.title_en,
            slug: laterMovie.slug,
            similarity_score: similarity / 100,
            release_year: laterMovie.release_year,
            reasons,
            is_copycat,
          });
        }
      }
    }
    
    // Sort by similarity
    inspired_movies.sort((a, b) => b.similarity_score - a.similarity_score);
    
    return {
      genre_shift: {
        primary_genre: primaryGenre,
        before_count,
        after_count,
        percentage_change: Math.round(percentage_change),
        years_analyzed: yearsBefore + yearsAfter,
        confidence: before_count >= 5 && after_count >= 5 ? 0.80 : 0.50,
      },
      budget_trend: {
        trend: 'unknown',
        confidence: 0.30, // Low confidence without actual budget data
      },
      inspired_movies: inspired_movies.slice(0, 10), // Top 10
      copycat_count,
      inspiration_count,
    };
  }
  
  /**
   * Calculate box office ripple effects
   */
  private async calculateBoxOfficeImpact(movie: any): Promise<BoxOfficeRipple> {
    // Get movies released in same month
    const { data: sameMonthMovies } = await this.supabase
      .from('movies')
      .select('id, title_en, release_date, box_office')
      .eq('release_year', movie.release_year)
      .not('id', 'eq', movie.id)
      .limit(20);
    
    const affected_releases = sameMonthMovies?.length || 0;
    
    // Simplified analysis (without detailed box office data)
    return {
      immediate_impact: {
        affected_releases,
        clash_victims: [],
        beneficiaries: [],
        total_impact: 'Unknown', // Would require actual box office data
        confidence: 0.40,
      },
      long_term_trend: {
        years_affected: movie.is_blockbuster ? 2 : 0,
        genre_boost: movie.is_blockbuster ? 25 : 0,
        market_expansion: movie.is_blockbuster || movie.is_classic,
      },
    };
  }
  
  /**
   * Build influence network graph
   */
  private async buildInfluenceNetwork(movie: any): Promise<InfluenceGraph> {
    // Check for sequels/franchises
    const titleWords = movie.title_en.toLowerCase().split(' ');
    const hasNumbering = /\b(2|ii|3|iii|part|chapter)\b/i.test(movie.title_en);
    
    const { data: potentialSequels } = await this.supabase
      .from('movies')
      .select('id, title_en, slug, release_year')
      .gt('release_year', movie.release_year)
      .limit(50);
    
    const sequels: string[] = [];
    if (potentialSequels) {
      for (const sequel of potentialSequels) {
        const sequelWords = sequel.title_en.toLowerCase().split(' ');
        const commonWords = titleWords.filter(w => sequelWords.includes(w));
        if (commonWords.length >= 2 && /\b(2|ii|3|iii|part|chapter)\b/i.test(sequel.title_en)) {
          sequels.push(sequel.title_en);
        }
      }
    }
    
    // Extract cultural moments from trivia if available
    const cultural_moments: InfluenceGraph['cultural_moments'] = [];
    if (movie.trivia) {
      // Parse trivia array for cultural impact
      const triviaItems = Array.isArray(movie.trivia) ? movie.trivia : [];
      for (const item of triviaItems) {
        if (typeof item === 'string') {
          if (item.toLowerCase().includes('dialogue') || item.toLowerCase().includes('quote')) {
            cultural_moments.push({
              type: 'dialogue',
              description: item,
              lasting_impact: true,
            });
          } else if (item.toLowerCase().includes('song') || item.toLowerCase().includes('music')) {
            cultural_moments.push({
              type: 'song',
              description: item,
              lasting_impact: true,
            });
          }
        }
      }
    }
    
    return {
      direct_influences: [], // Will be populated from inspired_movies
      indirect_influences: [],
      cultural_moments,
      franchise_spawned: sequels.length > 0,
      sequels: sequels.length > 0 ? sequels : undefined,
    };
  }
  
  /**
   * Calculate overall confidence in the analysis
   */
  private calculateConfidence(
    movie: any,
    analysis: {
      careerImpact: CareerImpact;
      industryInfluence: IndustryInfluence;
      influenceGraph: InfluenceGraph;
    }
  ): number {
    let score = 0;
    let factors = 0;
    
    // Data completeness
    if (movie.our_rating || movie.avg_rating) { score += 0.15; factors++; }
    if (movie.hero && movie.director) { score += 0.15; factors++; }
    if (movie.release_year && movie.release_year >= 1970) { score += 0.10; factors++; }
    
    // Analysis richness
    if (analysis.careerImpact.actors_launched.length > 0) { score += 0.20; factors++; }
    if (analysis.industryInfluence.inspired_movies.length >= 3) { score += 0.20; factors++; }
    if (analysis.influenceGraph.cultural_moments.length > 0) { score += 0.10; factors++; }
    
    // Quality signals
    if (movie.is_blockbuster || movie.is_classic) { score += 0.10; factors++; }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Determine significance tier
   */
  private determineSignificanceTier(
    movie: any,
    analysis: {
      careerImpact: CareerImpact;
      industryInfluence: IndustryInfluence;
      influenceGraph: InfluenceGraph;
    }
  ): 'landmark' | 'influential' | 'notable' | 'standard' {
    let score = 0;
    
    // Landmark indicators
    if (movie.is_classic) score += 3;
    if (analysis.careerImpact.actors_launched.length >= 2) score += 2;
    if (analysis.industryInfluence.copycat_count >= 5) score += 3;
    if (analysis.influenceGraph.franchise_spawned) score += 2;
    if (analysis.influenceGraph.cultural_moments.length >= 3) score += 2;
    
    // Influential indicators
    if (movie.is_blockbuster) score += 1;
    if (analysis.careerImpact.career_pivots.length >= 1) score += 1;
    if (analysis.industryInfluence.inspired_movies.length >= 5) score += 1;
    if (Math.abs(analysis.industryInfluence.genre_shift.percentage_change) >= 30) score += 2;
    
    if (score >= 8) return 'landmark';
    if (score >= 5) return 'influential';
    if (score >= 2) return 'notable';
    return 'standard';
  }
  
  // Empty state helpers
  private getEmptyCareerImpact(): CareerImpact {
    return {
      actors_launched: [],
      directors_established: [],
      career_pivots: [],
    };
  }
  
  private getEmptyIndustryInfluence(): IndustryInfluence {
    return {
      genre_shift: {
        primary_genre: '',
        before_count: 0,
        after_count: 0,
        percentage_change: 0,
        years_analyzed: 0,
        confidence: 0,
      },
      budget_trend: { trend: 'unknown', confidence: 0 },
      inspired_movies: [],
      copycat_count: 0,
      inspiration_count: 0,
    };
  }
  
  private getEmptyBoxOfficeRipple(): BoxOfficeRipple {
    return {
      immediate_impact: {
        affected_releases: 0,
        clash_victims: [],
        beneficiaries: [],
        total_impact: 'Unknown',
        confidence: 0,
      },
      long_term_trend: {
        years_affected: 0,
        genre_boost: 0,
      },
    };
  }
  
  private getEmptyInfluenceGraph(): InfluenceGraph {
    return {
      direct_influences: [],
      indirect_influences: [],
      cultural_moments: [],
      franchise_spawned: false,
    };
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generate human-readable impact summary
 */
export function generateImpactSummary(analysis: MovieImpactAnalysis): string {
  const parts: string[] = [];
  
  // Career impact
  if (analysis.career_impact.actors_launched.length > 0) {
    const actor = analysis.career_impact.actors_launched[0];
    if (actor.debut_film) {
      parts.push(`This was ${actor.name}'s debut film, launching their career.`);
    } else if (actor.breakthrough_detected) {
      parts.push(`This was ${actor.name}'s breakthrough role, establishing them as a star.`);
    }
  }
  
  // Industry influence
  if (analysis.industry_influence.copycat_count >= 3) {
    parts.push(`This movie inspired ${analysis.industry_influence.copycat_count} similar films in the following years.`);
  }
  
  if (Math.abs(analysis.industry_influence.genre_shift.percentage_change) >= 25) {
    const direction = analysis.industry_influence.genre_shift.percentage_change > 0 ? 'increased' : 'decreased';
    parts.push(
      `${analysis.industry_influence.genre_shift.primary_genre} movies ${direction} by ${Math.abs(analysis.industry_influence.genre_shift.percentage_change)}% after this release.`
    );
  }
  
  // Cultural impact
  if (analysis.influence_graph.franchise_spawned) {
    parts.push(`This movie spawned a successful franchise with ${analysis.influence_graph.sequels?.length || 0} sequels.`);
  }
  
  if (parts.length === 0) {
    return `This ${analysis.significance_tier} film made its mark on Telugu cinema.`;
  }
  
  return parts.join(' ');
}

/**
 * Get counterfactual "What If" statements
 */
export function generateCounterfactuals(analysis: MovieImpactAnalysis): string[] {
  const whatIfs: string[] = [];
  
  // Career counterfactuals
  for (const actor of analysis.career_impact.actors_launched) {
    if (actor.debut_film) {
      whatIfs.push(`Without this movie, ${actor.name} might not have entered the film industry.`);
    } else if (actor.breakthrough_detected) {
      whatIfs.push(`Without this breakthrough role, ${actor.name} might have remained a character actor.`);
    }
  }
  
  // Industry counterfactuals
  if (analysis.industry_influence.copycat_count >= 3) {
    whatIfs.push(
      `Without this movie's success, we might not have seen the wave of ${analysis.industry_influence.genre_shift.primary_genre} films that followed.`
    );
  }
  
  if (analysis.industry_influence.genre_shift.percentage_change >= 30) {
    whatIfs.push(
      `This movie's success significantly boosted ${analysis.industry_influence.genre_shift.primary_genre} genre popularity by ${analysis.industry_influence.genre_shift.percentage_change}%.`
    );
  }
  
  // Franchise counterfactuals
  if (analysis.influence_graph.franchise_spawned) {
    whatIfs.push(
      `Without this film, the ${analysis.influence_graph.sequels?.length || 0}-movie franchise that followed wouldn't exist.`
    );
  }
  
  return whatIfs;
}
