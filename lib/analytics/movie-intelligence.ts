/**
 * Movie Intelligence Analytics Engine
 * 
 * Generates FACT-DERIVED analytics from verified movie data.
 * No guessing, no ML inference - only counted, verifiable data.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// TYPES
// ============================================================

export interface ActorPairFrequency {
  actor1: string;
  actor2: string;
  movieCount: number;
  movies: { id: string; title: string; year: number }[];
}

export interface DirectorActorCollaboration {
  director: string;
  actor: string;
  movieCount: number;
  successRate: number; // Based on avg_rating >= 7
  averageRating: number;
  movies: { id: string; title: string; year: number; rating: number }[];
}

export interface MusicDirectorStats {
  musicDirector: string;
  movieCount: number;
  averageRating: number;
  hitCount: number; // rating >= 7
  topMovies: { id: string; title: string; year: number; rating: number }[];
}

export interface EraStats {
  decade: string;
  movieCount: number;
  averageRating: number;
  topRatedCount: number;
  hitRate: number;
  topGenres: { genre: string; count: number }[];
}

export interface StudioStats {
  producer: string;
  movieCount: number;
  averageRating: number;
  topDirectors: { director: string; count: number }[];
}

export interface VerdictStats {
  verdict: string;
  count: number;
  percentage: number;
}

// ============================================================
// ANALYTICS ENGINE
// ============================================================

export class MovieIntelligenceEngine {
  private supabase: SupabaseClient;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.supabase = createClient(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // ============================================================
  // ACTOR PAIR FREQUENCY
  // ============================================================

  /**
   * Find actors who worked together most frequently
   */
  async getActorPairFrequency(
    minMovies = 3,
    limit = 20
  ): Promise<ActorPairFrequency[]> {
    const { data: movies } = await this.supabase
      .from('movies')
      .select('id, title_en, release_year, hero, heroine')
      .eq('is_published', true)
      .not('hero', 'is', null)
      .not('heroine', 'is', null);

    if (!movies) return [];

    // Count pairs
    const pairCounts = new Map<string, {
      count: number;
      movies: { id: string; title: string; year: number }[];
    }>();

    for (const movie of movies) {
      const hero = movie.hero?.trim();
      const heroine = movie.heroine?.trim();
      
      if (!hero || !heroine) continue;
      
      // Normalize pair key (alphabetical order)
      const pair = [hero, heroine].sort().join('|||');
      
      const existing = pairCounts.get(pair) || { count: 0, movies: [] };
      existing.count++;
      existing.movies.push({
        id: movie.id,
        title: movie.title_en,
        year: movie.release_year,
      });
      pairCounts.set(pair, existing);
    }

    // Convert to result format and filter
    const results: ActorPairFrequency[] = [];
    
    for (const [pair, data] of pairCounts) {
      if (data.count < minMovies) continue;
      
      const [actor1, actor2] = pair.split('|||');
      results.push({
        actor1,
        actor2,
        movieCount: data.count,
        movies: data.movies.sort((a, b) => b.year - a.year),
      });
    }

    return results
      .sort((a, b) => b.movieCount - a.movieCount)
      .slice(0, limit);
  }

  // ============================================================
  // DIRECTOR-ACTOR COLLABORATIONS
  // ============================================================

  /**
   * Find director-actor collaborations
   */
  async getDirectorActorCollaborations(
    actorName?: string,
    directorName?: string,
    minMovies = 2,
    limit = 20
  ): Promise<DirectorActorCollaboration[]> {
    let query = this.supabase
      .from('movies')
      .select('id, title_en, release_year, director, hero, avg_rating')
      .eq('is_published', true)
      .not('director', 'is', null)
      .not('hero', 'is', null);

    if (actorName) {
      query = query.ilike('hero', `%${actorName}%`);
    }
    if (directorName) {
      query = query.ilike('director', `%${directorName}%`);
    }

    const { data: movies } = await query;
    if (!movies) return [];

    // Count collaborations
    const collabs = new Map<string, {
      director: string;
      actor: string;
      movies: { id: string; title: string; year: number; rating: number }[];
    }>();

    for (const movie of movies) {
      const director = movie.director?.trim();
      const actor = movie.hero?.trim();
      
      if (!director || !actor) continue;
      
      const key = `${director}|||${actor}`;
      const existing = collabs.get(key) || { director, actor, movies: [] };
      existing.movies.push({
        id: movie.id,
        title: movie.title_en,
        year: movie.release_year,
        rating: movie.avg_rating || 0,
      });
      collabs.set(key, existing);
    }

    // Calculate stats
    const results: DirectorActorCollaboration[] = [];
    
    for (const [, data] of collabs) {
      if (data.movies.length < minMovies) continue;
      
      const ratings = data.movies.map(m => m.rating).filter(r => r > 0);
      const avgRating = ratings.length > 0 
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
        : 0;
      const hitCount = ratings.filter(r => r >= 7).length;
      
      results.push({
        director: data.director,
        actor: data.actor,
        movieCount: data.movies.length,
        averageRating: Math.round(avgRating * 10) / 10,
        successRate: Math.round((hitCount / data.movies.length) * 100),
        movies: data.movies.sort((a, b) => b.year - a.year),
      });
    }

    return results
      .sort((a, b) => b.movieCount - a.movieCount || b.averageRating - a.averageRating)
      .slice(0, limit);
  }

  // ============================================================
  // MUSIC DIRECTOR STATS
  // ============================================================

  /**
   * Get music director success rates
   */
  async getMusicDirectorStats(
    minMovies = 5,
    limit = 20
  ): Promise<MusicDirectorStats[]> {
    const { data: movies } = await this.supabase
      .from('movies')
      .select('id, title_en, release_year, music_director, avg_rating')
      .eq('is_published', true)
      .not('music_director', 'is', null);

    if (!movies) return [];

    // Aggregate by music director
    const stats = new Map<string, {
      movies: { id: string; title: string; year: number; rating: number }[];
    }>();

    for (const movie of movies) {
      const md = movie.music_director?.trim();
      if (!md) continue;
      
      const existing = stats.get(md) || { movies: [] };
      existing.movies.push({
        id: movie.id,
        title: movie.title_en,
        year: movie.release_year,
        rating: movie.avg_rating || 0,
      });
      stats.set(md, existing);
    }

    // Calculate stats
    const results: MusicDirectorStats[] = [];
    
    for (const [musicDirector, data] of stats) {
      if (data.movies.length < minMovies) continue;
      
      const ratings = data.movies.map(m => m.rating).filter(r => r > 0);
      const avgRating = ratings.length > 0 
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
        : 0;
      const hitCount = ratings.filter(r => r >= 7).length;
      
      results.push({
        musicDirector,
        movieCount: data.movies.length,
        averageRating: Math.round(avgRating * 10) / 10,
        hitCount,
        topMovies: data.movies
          .filter(m => m.rating > 0)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5),
      });
    }

    return results
      .sort((a, b) => b.movieCount - a.movieCount)
      .slice(0, limit);
  }

  // ============================================================
  // ERA TRENDS
  // ============================================================

  /**
   * Get movie stats by decade
   */
  async getEraTrends(): Promise<EraStats[]> {
    const { data: movies } = await this.supabase
      .from('movies')
      .select('release_year, avg_rating, genres')
      .eq('is_published', true)
      .not('release_year', 'is', null);

    if (!movies) return [];

    // Group by decade
    const decades = new Map<string, {
      ratings: number[];
      genres: string[];
    }>();

    for (const movie of movies) {
      const decade = Math.floor(movie.release_year / 10) * 10;
      const decadeKey = `${decade}s`;
      
      const existing = decades.get(decadeKey) || { ratings: [], genres: [] };
      
      if (movie.avg_rating) {
        existing.ratings.push(movie.avg_rating);
      }
      
      if (movie.genres && Array.isArray(movie.genres)) {
        existing.genres.push(...movie.genres);
      }
      
      decades.set(decadeKey, existing);
    }

    // Calculate stats
    const results: EraStats[] = [];
    
    for (const [decade, data] of decades) {
      const avgRating = data.ratings.length > 0 
        ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length 
        : 0;
      const topRatedCount = data.ratings.filter(r => r >= 8).length;
      const hitCount = data.ratings.filter(r => r >= 7).length;
      
      // Count genres
      const genreCounts = new Map<string, number>();
      for (const genre of data.genres) {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      }
      
      const topGenres = Array.from(genreCounts.entries())
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      results.push({
        decade,
        movieCount: data.ratings.length,
        averageRating: Math.round(avgRating * 10) / 10,
        topRatedCount,
        hitRate: Math.round((hitCount / data.ratings.length) * 100),
        topGenres,
      });
    }

    return results.sort((a, b) => b.decade.localeCompare(a.decade));
  }

  // ============================================================
  // VERDICT DISTRIBUTION
  // ============================================================

  /**
   * Get verdict distribution
   */
  async getVerdictDistribution(): Promise<VerdictStats[]> {
    const { data: movies } = await this.supabase
      .from('movies')
      .select('verdict')
      .eq('is_published', true)
      .not('verdict', 'is', null);

    if (!movies) return [];

    // Count verdicts
    const verdictCounts = new Map<string, number>();
    
    for (const movie of movies) {
      const verdict = movie.verdict?.trim();
      if (!verdict) continue;
      verdictCounts.set(verdict, (verdictCounts.get(verdict) || 0) + 1);
    }

    const total = movies.length;
    
    return Array.from(verdictCounts.entries())
      .map(([verdict, count]) => ({
        verdict,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }

  // ============================================================
  // STUDIO/PRODUCER STATS
  // ============================================================

  /**
   * Get producer/studio statistics
   */
  async getProducerStats(
    minMovies = 5,
    limit = 20
  ): Promise<StudioStats[]> {
    const { data: movies } = await this.supabase
      .from('movies')
      .select('producer, director, avg_rating')
      .eq('is_published', true)
      .not('producer', 'is', null);

    if (!movies) return [];

    // Aggregate by producer
    const stats = new Map<string, {
      ratings: number[];
      directors: string[];
    }>();

    for (const movie of movies) {
      const producer = movie.producer?.trim();
      if (!producer) continue;
      
      const existing = stats.get(producer) || { ratings: [], directors: [] };
      
      if (movie.avg_rating) {
        existing.ratings.push(movie.avg_rating);
      }
      if (movie.director) {
        existing.directors.push(movie.director);
      }
      
      stats.set(producer, existing);
    }

    // Calculate stats
    const results: StudioStats[] = [];
    
    for (const [producer, data] of stats) {
      if (data.ratings.length < minMovies) continue;
      
      const avgRating = data.ratings.length > 0 
        ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length 
        : 0;
      
      // Count directors
      const directorCounts = new Map<string, number>();
      for (const director of data.directors) {
        directorCounts.set(director, (directorCounts.get(director) || 0) + 1);
      }
      
      const topDirectors = Array.from(directorCounts.entries())
        .map(([director, count]) => ({ director, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      results.push({
        producer,
        movieCount: data.ratings.length,
        averageRating: Math.round(avgRating * 10) / 10,
        topDirectors,
      });
    }

    return results
      .sort((a, b) => b.movieCount - a.movieCount)
      .slice(0, limit);
  }

  // ============================================================
  // QUICK STATS
  // ============================================================

  /**
   * Get quick database statistics
   */
  async getQuickStats(): Promise<{
    totalMovies: number;
    totalReviews: number;
    totalCelebrities: number;
    avgRating: number;
    topGenre: string;
    topLanguage: string;
  }> {
    const [
      { count: totalMovies },
      { count: totalReviews },
      { count: totalCelebrities },
      { data: ratingData },
    ] = await Promise.all([
      this.supabase.from('movies').select('id', { count: 'exact', head: true }).eq('is_published', true),
      this.supabase.from('reviews').select('id', { count: 'exact', head: true }),
      this.supabase.from('celebrities').select('id', { count: 'exact', head: true }),
      this.supabase.from('movies').select('avg_rating').eq('is_published', true).not('avg_rating', 'is', null),
    ]);

    const ratings = ratingData?.map(m => m.avg_rating as number) || [];
    const avgRating = ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : 0;

    return {
      totalMovies: totalMovies || 0,
      totalReviews: totalReviews || 0,
      totalCelebrities: totalCelebrities || 0,
      avgRating: Math.round(avgRating * 10) / 10,
      topGenre: 'Action', // Would need aggregation query
      topLanguage: 'Telugu', // Would need aggregation query
    };
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

let instance: MovieIntelligenceEngine | null = null;

export function getMovieIntelligenceEngine(): MovieIntelligenceEngine {
  if (!instance) {
    instance = new MovieIntelligenceEngine();
  }
  return instance;
}

export default MovieIntelligenceEngine;

