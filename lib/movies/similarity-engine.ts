/**
 * Movie Similarity Engine
 * Calculates and provides similar movie recommendations
 */

import type { Movie } from '@/types/reviews';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side usage
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export interface SimilarMovie {
  id: string;
  title_en: string;
  title_te?: string;
  slug: string;
  poster_url?: string;
  release_year?: number;
  runtime_minutes?: number;
  genres?: string[];
  avg_rating?: number;
  our_rating?: number;
  similarity_score?: number;
  similarity_reason?: string;
  relevanceScore?: number;
  hero?: string;
  director?: string;
}

export interface SupportingCastMember {
  name: string;
  role?: string;
  type?: string;
  order?: number;
}

export interface SimilarSection {
  id: string;
  title: string;
  title_te?: string;
  subtitle?: string;
  reason?: string;
  movies: SimilarMovie[];
  icon?: string;
  matchType: 'best' | 'director' | 'hero' | 'heroine' | 'genre' | 'era' | 'tags' | 'rating' | 'classics' | 'blockbusters' | 'recent' | 'music' | 'producer' | 'support_cast' | 'cinematographer' | 'production';
  priority: number;
  totalCount?: number;
}

export interface SimilarSectionWithVisual extends SimilarSection {
  visualConfidence?: number;
  hasArchivalImages?: boolean;
}

export interface SimilarityOptions {
  includeGenre?: boolean;
  includeDirector?: boolean;
  includeActor?: boolean;
  includeHeroine?: boolean;
  includeMusicDirector?: boolean;
  includeProducer?: boolean;
  includeCinematographer?: boolean;
  includeProductionCompany?: boolean;
  includeSupportCast?: boolean;
  includeEra?: boolean;
  includeBlockbusters?: boolean;
  includeClassics?: boolean;
  maxMoviesPerSection?: number;
  maxSections?: number;
}

// Extended movie type for similarity engine that includes cast/crew fields
export interface MovieWithCast extends Partial<Movie> {
  id?: string;
  heroine?: string;
  music_director?: string;
  producer?: string;
  supporting_cast?: SupportingCastMember[];
}

/**
 * Calculate similarity score between two movies
 */
export function calculateSimilarity(
  movie1: Movie,
  movie2: Partial<Movie>,
  options: SimilarityOptions = {}
): number {
  let score = 0;

  // Genre similarity
  if (options.includeGenre !== false && movie1.genres && movie2.genres) {
    const commonGenres = movie1.genres.filter(g => movie2.genres?.includes(g));
    score += (commonGenres.length / Math.max(movie1.genres.length, 1)) * 40;
  }

  // Director similarity
  if (options.includeDirector !== false && movie1.director && movie2.director) {
    if (movie1.director === movie2.director) {
      score += 30;
    }
  }

  // Actor similarity
  if (options.includeActor !== false && movie1.hero && movie2.hero) {
    if (movie1.hero === movie2.hero) {
      score += 20;
    }
  }

  // Era similarity
  if (options.includeEra !== false && movie1.release_year && movie2.release_year) {
    const yearDiff = Math.abs(movie1.release_year - movie2.release_year);
    if (yearDiff <= 5) {
      score += 10;
    } else if (yearDiff <= 10) {
      score += 5;
    }
  }

  return Math.min(score, 100);
}

/**
 * Get similar movie sections for a given movie
 * Can be called with (movie) or (movie, allMovies, options)
 * If allMovies is not provided, fetches from database
 */
export async function getSimilarMovieSections(
  movie: MovieWithCast,
  allMovies?: Movie[],
  options: SimilarityOptions = {}
): Promise<SimilarSection[]> {
  // Updated limits: minimum 50, maximum 100 for Discover More sections
  const maxMovies = options.maxMoviesPerSection || 100; // Increased to show more similar movies
  const maxSections = options.maxSections || 15; // Increased to show more sections
  const minMovies = 50; // Minimum movies per section
  const sections: SimilarSection[] = [];

  // If no allMovies provided, fetch from database
  let otherMovies: Movie[] = [];
  
  if (!allMovies || allMovies.length === 0) {
    const supabase = getSupabase();
    
    // Define query keys for tracking results
    type QueryKey = 'director' | 'hero_0' | 'hero_1' | 'hero_2' | 'heroine_0' | 'heroine_1' | 'heroine_2' | 'music' | 'producer' | 'cinematographer' | 'production_company' | 'genre' | 'genre_2' | 'era' | 'support_cast_0' | 'support_cast_1' | 'support_cast_2' | 'top_rated' | 'blockbuster' | 'classic';
    const queryKeys: QueryKey[] = [];
    const promises: Promise<Movie[]>[] = [];
    
    // Helper to check if valid UUID
    const isValidUUID = (id: string | undefined) => 
      id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const movieId = movie.id;
    
    const baseSelect = 'id, title_en, title_te, slug, poster_url, release_year, genres, avg_rating, our_rating, hero, heroine, director, music_director, producer, runtime_minutes, language';
    
    // Language filter - only show movies of the same language
    const movieLanguage = movie.language || 'Telugu';
    
    // Same director movies
    if (movie.director && options.includeDirector !== false) {
      queryKeys.push('director');
      let query = supabase
        .from('movies')
        .select(baseSelect)
        .eq('is_published', true)
        .eq('language', movieLanguage)
        .eq('director', movie.director);
      
      if (isValidUUID(movieId)) {
        query = query.neq('id', movieId!);
      }
      
      promises.push(
        Promise.resolve(
          query
            .order('our_rating', { ascending: false, nullsFirst: false })
            .limit(maxMovies)
            .then(({ data }) => (data || []) as Movie[])
        )
      );
    }
    
    // Same hero movies - support multiple heroes (comma-separated)
    const heroNames: string[] = [];
    if (movie.hero && options.includeActor !== false) {
      const heroes = movie.hero.split(',').map((h: string) => h.trim()).filter(Boolean);
      for (let i = 0; i < Math.min(3, heroes.length); i++) {
        const heroName = heroes[i];
        heroNames.push(heroName);
        queryKeys.push(`hero_${i}` as QueryKey);
        let query = supabase
          .from('movies')
          .select(baseSelect)
          .eq('is_published', true)
          .eq('language', movieLanguage)
          .or(`hero.ilike.%${heroName}%,supporting_cast.cs.{"name":"${heroName}"}`);
        
        if (isValidUUID(movieId)) {
          query = query.neq('id', movieId!);
        }
        
        promises.push(
          Promise.resolve(
            query
              .order('our_rating', { ascending: false, nullsFirst: false })
              .limit(maxMovies)
              .then(({ data }) => (data || []) as Movie[])
          )
        );
      }
    }
    
    // Same heroine movies - support multiple heroines (comma-separated)
    const heroineNames: string[] = [];
    if (movie.heroine && options.includeHeroine !== false) {
      const heroines = movie.heroine.split(',').map((h: string) => h.trim()).filter(Boolean);
      for (let i = 0; i < Math.min(3, heroines.length); i++) {
        const heroineName = heroines[i];
        heroineNames.push(heroineName);
        queryKeys.push(`heroine_${i}` as QueryKey);
        let query = supabase
          .from('movies')
          .select(baseSelect)
          .eq('is_published', true)
          .eq('language', movieLanguage)
          .or(`heroine.ilike.%${heroineName}%,supporting_cast.cs.{"name":"${heroineName}"}`);
        
        if (isValidUUID(movieId)) {
          query = query.neq('id', movieId!);
        }
        
        promises.push(
          Promise.resolve(
            query
              .order('our_rating', { ascending: false, nullsFirst: false })
              .limit(maxMovies)
              .then(({ data }) => (data || []) as Movie[])
          )
        );
      }
    }
    
    // Same music director movies
    if (movie.music_director && options.includeMusicDirector !== false) {
      queryKeys.push('music');
      let query = supabase
        .from('movies')
        .select(baseSelect)
        .eq('is_published', true)
        .eq('language', movieLanguage)
        .eq('music_director', movie.music_director);
      
      if (isValidUUID(movieId)) {
        query = query.neq('id', movieId!);
      }
      
      promises.push(
        Promise.resolve(
          query
            .order('our_rating', { ascending: false, nullsFirst: false })
            .limit(maxMovies)
            .then(({ data }) => (data || []) as Movie[])
        )
      );
    }
    
    // Same producer movies
    if (movie.producer && options.includeProducer !== false) {
      queryKeys.push('producer');
      let query = supabase
        .from('movies')
        .select(baseSelect)
        .eq('is_published', true)
        .eq('language', movieLanguage)
        .eq('producer', movie.producer);
      
      if (isValidUUID(movieId)) {
        query = query.neq('id', movieId!);
      }
      
      promises.push(
        Promise.resolve(
          query
            .order('our_rating', { ascending: false, nullsFirst: false })
            .limit(maxMovies)
            .then(({ data }) => (data || []) as Movie[])
        )
      );
    }
    
    // Same cinematographer movies
    if ((movie as any).cinematographer && options.includeCinematographer !== false) {
      queryKeys.push('cinematographer');
      let query = supabase
        .from('movies')
        .select(baseSelect)
        .eq('is_published', true)
        .eq('language', movieLanguage)
        .eq('cinematographer', (movie as any).cinematographer);
      
      if (isValidUUID(movieId)) {
        query = query.neq('id', movieId!);
      }
      
      promises.push(
        Promise.resolve(
          query
            .order('our_rating', { ascending: false, nullsFirst: false })
            .limit(maxMovies)
            .then(({ data }) => (data || []) as Movie[])
        )
      );
    }
    
    // Same production company movies
    if ((movie as any).production_company && options.includeProductionCompany !== false) {
      queryKeys.push('production_company');
      let query = supabase
        .from('movies')
        .select(baseSelect)
        .eq('is_published', true)
        .eq('language', movieLanguage)
        .eq('production_company', (movie as any).production_company);
      
      if (isValidUUID(movieId)) {
        query = query.neq('id', movieId!);
      }
      
      promises.push(
        Promise.resolve(
          query
            .order('our_rating', { ascending: false, nullsFirst: false })
            .limit(maxMovies)
            .then(({ data }) => (data || []) as Movie[])
        )
      );
    }
    
    // Support cast movies - find movies where support cast members appear as hero/heroine
    // Process up to 3 support cast members for more sections
    const supportCastNames: string[] = [];
    if (options.includeSupportCast !== false && movie.supporting_cast?.length) {
      for (let i = 0; i < Math.min(3, movie.supporting_cast.length); i++) {
        const castMember = movie.supporting_cast[i];
        if (castMember?.name) {
          supportCastNames.push(castMember.name);
          queryKeys.push(`support_cast_${i}` as QueryKey);
          // Search for movies where this actor is hero or heroine (same language)
          let query = supabase
            .from('movies')
            .select(baseSelect)
            .eq('is_published', true)
            .eq('language', movieLanguage)
            .or(`hero.eq.${castMember.name},heroine.eq.${castMember.name}`);
          
          if (isValidUUID(movieId)) {
            query = query.neq('id', movieId!);
          }
          
          promises.push(
            Promise.resolve(
              query
                .order('our_rating', { ascending: false, nullsFirst: false })
                .limit(maxMovies)
                .then(({ data }) => (data || []) as Movie[])
            )
          );
        }
      }
    }
    
    // Same genre movies - primary genre
    if (movie.genres && movie.genres.length > 0 && options.includeGenre !== false) {
      queryKeys.push('genre');
      let query = supabase
        .from('movies')
        .select(baseSelect)
        .eq('is_published', true)
        .eq('language', movieLanguage)
        .contains('genres', [movie.genres[0]]);
      
      if (isValidUUID(movieId)) {
        query = query.neq('id', movieId!);
      }
      
      promises.push(
        Promise.resolve(
          query
            .order('our_rating', { ascending: false, nullsFirst: false })
            .limit(maxMovies * 2)
            .then(({ data }) => (data || []) as Movie[])
        )
      );
    }
    
    // Secondary genre movies (if movie has multiple genres)
    if (movie.genres && movie.genres.length > 1 && options.includeGenre !== false) {
      queryKeys.push('genre_2');
      let query = supabase
        .from('movies')
        .select(baseSelect)
        .eq('is_published', true)
        .eq('language', movieLanguage)
        .contains('genres', [movie.genres[1]]);
      
      if (isValidUUID(movieId)) {
        query = query.neq('id', movieId!);
      }
      
      promises.push(
        Promise.resolve(
          query
            .order('our_rating', { ascending: false, nullsFirst: false })
            .limit(maxMovies * 2)
            .then(({ data }) => (data || []) as Movie[])
        )
      );
    }
    
    // Same era movies
    if (movie.release_year && options.includeEra !== false) {
      queryKeys.push('era');
      const decade = Math.floor(movie.release_year / 10) * 10;
      let query = supabase
        .from('movies')
        .select(baseSelect)
        .eq('is_published', true)
        .eq('language', movieLanguage)
        .gte('release_year', decade)
        .lt('release_year', decade + 10);
      
      if (isValidUUID(movieId)) {
        query = query.neq('id', movieId!);
      }
      
      promises.push(
        Promise.resolve(
          query
            .order('our_rating', { ascending: false, nullsFirst: false })
            .limit(maxMovies * 2)
            .then(({ data }) => (data || []) as Movie[])
        )
      );
    }
    
    // Highly rated movies (Top Rated section) - same language
    queryKeys.push('top_rated');
    {
      let query = supabase
        .from('movies')
        .select(baseSelect)
        .eq('is_published', true)
        .eq('language', movieLanguage)
        .gte('our_rating', 7.5);
      
      if (isValidUUID(movieId)) {
        query = query.neq('id', movieId!);
      }
      
      promises.push(
        Promise.resolve(
          query
            .order('our_rating', { ascending: false, nullsFirst: false })
            .limit(maxMovies * 2)
            .then(({ data }) => (data || []) as Movie[])
        )
      );
    }
    
    // Other blockbuster movies (if current movie is blockbuster)
    if ((movie as any).is_blockbuster && options.includeBlockbusters !== false) {
      queryKeys.push('blockbuster');
      let query = supabase
        .from('movies')
        .select(baseSelect)
        .eq('is_published', true)
        .eq('language', movieLanguage)
        .eq('is_blockbuster', true);
      
      if (isValidUUID(movieId)) {
        query = query.neq('id', movieId!);
      }
      
      promises.push(
        Promise.resolve(
          query
            .order('our_rating', { ascending: false, nullsFirst: false })
            .limit(maxMovies * 2)
            .then(({ data }) => (data || []) as Movie[])
        )
      );
    }
    
    // Other classic movies (if current movie is classic)
    if ((movie as any).is_classic && options.includeClassics !== false) {
      queryKeys.push('classic');
      let query = supabase
        .from('movies')
        .select(baseSelect)
        .eq('is_published', true)
        .eq('language', movieLanguage)
        .eq('is_classic', true);
      
      if (isValidUUID(movieId)) {
        query = query.neq('id', movieId!);
      }
      
      promises.push(
        Promise.resolve(
          query
            .order('our_rating', { ascending: false, nullsFirst: false })
            .limit(maxMovies * 2)
            .then(({ data }) => (data || []) as Movie[])
        )
      );
    }
    
    // Fetch all in parallel
    const results = await Promise.all(promises);
    
    // Build sections from results using queryKeys for mapping
    const resultMap = new Map<QueryKey, Movie[]>();
    queryKeys.forEach((key, index) => {
      resultMap.set(key, results[index] || []);
    });
    
    // Track used movie IDs to avoid duplicates
    const usedIds = new Set<string>();
    
    // Director section (priority 1) - only add if minimum movies
    const directorMovies = resultMap.get('director') || [];
    if (directorMovies.length >= minMovies) {
      sections.push({
        id: 'director',
        title: `More from ${movie.director}`,
        title_te: `${movie.director} మరిన్ని చిత్రాలు`,
        reason: 'same-director',
        movies: directorMovies.slice(0, maxMovies).map(m => {
          usedIds.add(m.id);
          return {
            ...m,
            similarity_score: 90,
            similarity_reason: `Same director: ${movie.director}`,
          };
        }),
        icon: '🎬',
        matchType: 'director',
        priority: 1,
      });
    }
    
    // Hero sections (priority 2, 2.1, 2.2) - up to 3 heroes
    for (let i = 0; i < heroNames.length; i++) {
      const heroName = heroNames[i];
      const heroMovies = (resultMap.get(`hero_${i}` as QueryKey) || []).filter(m => !usedIds.has(m.id));
      if (heroMovies.length >= minMovies) {
        sections.push({
          id: `hero_${i}`,
          title: `More ${heroName} Movies`,
          title_te: `${heroName} మరిన్ని సినిమాలు`,
          reason: 'same-hero',
          movies: heroMovies.slice(0, maxMovies).map(m => {
            usedIds.add(m.id);
            return {
              ...m,
              similarity_score: 85 - (i * 2),
              similarity_reason: `Features ${heroName}`,
            };
          }),
          icon: '⭐',
          matchType: 'hero',
          priority: 2 + (i * 0.1),
        });
      }
    }
    
    // Heroine sections (priority 3, 3.1, 3.2) - up to 3 heroines
    for (let i = 0; i < heroineNames.length; i++) {
      const heroineName = heroineNames[i];
      const heroineMovies = (resultMap.get(`heroine_${i}` as QueryKey) || []).filter(m => !usedIds.has(m.id));
      if (heroineMovies.length >= minMovies) {
        sections.push({
          id: `heroine_${i}`,
          title: `More ${heroineName} Movies`,
          title_te: `${heroineName} మరిన్ని సినిమాలు`,
          reason: 'same-heroine',
          movies: heroineMovies.slice(0, maxMovies).map(m => {
            usedIds.add(m.id);
            return {
              ...m,
              similarity_score: 82 - (i * 2),
              similarity_reason: `Features ${heroineName}`,
            };
          }),
          icon: '💫',
          matchType: 'heroine',
          priority: 3 + (i * 0.1),
        });
      }
    }
    
    // Support cast sections (priority 4, 5, 6) - up to 3 support cast members
    for (let i = 0; i < supportCastNames.length; i++) {
      const castName = supportCastNames[i];
      const supportCastMovies = (resultMap.get(`support_cast_${i}` as QueryKey) || []).filter(m => !usedIds.has(m.id));
      if (supportCastMovies.length >= minMovies) {
        sections.push({
          id: `support_cast_${i}`,
          title: `More with ${castName}`,
          title_te: `${castName} మరిన్ని సినిమాలు`,
          reason: 'same-support-cast',
          movies: supportCastMovies.slice(0, maxMovies).map(m => {
            usedIds.add(m.id);
            return {
              ...m,
              similarity_score: 75 - (i * 2),
              similarity_reason: `Features ${castName}`,
            };
          }),
          icon: '👥',
          matchType: 'support_cast',
          priority: 4 + i,
        });
      }
    }
    
    // Music director section (priority 7)
    const musicMovies = (resultMap.get('music') || []).filter(m => !usedIds.has(m.id));
    if (musicMovies.length >= minMovies) {
      sections.push({
        id: 'music',
        title: `More from ${movie.music_director}`,
        title_te: `${movie.music_director} సంగీతం`,
        reason: 'same-music-director',
        movies: musicMovies.slice(0, maxMovies).map(m => {
          usedIds.add(m.id);
          return {
            ...m,
            similarity_score: 70,
            similarity_reason: `Music by ${movie.music_director}`,
          };
        }),
        icon: '🎵',
        matchType: 'music',
        priority: 7,
      });
    }
    
    // Producer section (priority 8)
    const producerMovies = (resultMap.get('producer') || []).filter(m => !usedIds.has(m.id));
    if (producerMovies.length >= minMovies) {
      sections.push({
        id: 'producer',
        title: `More from ${movie.producer}`,
        title_te: `${movie.producer} నిర్మాణం`,
        reason: 'same-producer',
        movies: producerMovies.slice(0, maxMovies).map(m => {
          usedIds.add(m.id);
          return {
            ...m,
            similarity_score: 65,
            similarity_reason: `Produced by ${movie.producer}`,
          };
        }),
        icon: '📽️',
        matchType: 'producer',
        priority: 8,
      });
    }
    
    // Primary genre section (priority 9)
    const genreMovies = (resultMap.get('genre') || []).filter(m => !usedIds.has(m.id));
    if (genreMovies.length >= minMovies && movie.genres?.[0]) {
      const primaryGenre = movie.genres[0];
      sections.push({
        id: 'genre',
        title: `More ${primaryGenre} Movies`,
        title_te: `మరిన్ని ${primaryGenre} సినిమాలు`,
        reason: 'same-genre',
        movies: genreMovies.slice(0, maxMovies).map(m => {
          usedIds.add(m.id);
          return {
            ...m,
            similarity_score: 60,
            similarity_reason: `${primaryGenre} movie`,
          };
        }),
        icon: '🎭',
        matchType: 'genre',
        priority: 9,
      });
    }
    
    // Secondary genre section (priority 10)
    const genre2Movies = (resultMap.get('genre_2') || []).filter(m => !usedIds.has(m.id));
    if (genre2Movies.length >= minMovies && movie.genres?.[1]) {
      const secondaryGenre = movie.genres[1];
      sections.push({
        id: 'genre_2',
        title: `More ${secondaryGenre} Movies`,
        title_te: `మరిన్ని ${secondaryGenre} సినిమాలు`,
        reason: 'same-genre-secondary',
        movies: genre2Movies.slice(0, maxMovies).map(m => {
          usedIds.add(m.id);
          return {
            ...m,
            similarity_score: 58,
            similarity_reason: `${secondaryGenre} movie`,
          };
        }),
        icon: '🎭',
        matchType: 'genre',
        priority: 10,
      });
    }
    
    // Era section (priority 11)
    const eraMovies = (resultMap.get('era') || []).filter(m => !usedIds.has(m.id));
    if (eraMovies.length >= minMovies && movie.release_year) {
      const decade = Math.floor(movie.release_year / 10) * 10;
      sections.push({
        id: 'era',
        title: `Best of ${decade}s`,
        title_te: `${decade}ల ఉత్తమ చిత్రాలు`,
        reason: 'same-era',
        movies: eraMovies.slice(0, maxMovies).map(m => {
          usedIds.add(m.id);
          return {
            ...m,
            similarity_score: 55,
            similarity_reason: `${decade}s movie`,
          };
        }),
        icon: '📅',
        matchType: 'era',
        priority: 11,
      });
    }
    
    // Top Rated section (priority 12)
    const topRatedMovies = (resultMap.get('top_rated') || []).filter(m => !usedIds.has(m.id));
    if (topRatedMovies.length >= minMovies) {
      sections.push({
        id: 'top_rated',
        title: 'Top Rated Movies',
        title_te: 'అత్యుత్తమ సినిమాలు',
        reason: 'top-rated',
        movies: topRatedMovies.slice(0, maxMovies).map(m => {
          usedIds.add(m.id);
          return {
            ...m,
            similarity_score: 50,
            similarity_reason: 'Highly rated',
          };
        }),
        icon: '🏆',
        matchType: 'rating',
        priority: 12,
      });
    }
    
    // Cinematographer section (priority 13)
    const cinematographerMovies = (resultMap.get('cinematographer') || []).filter(m => !usedIds.has(m.id));
    if (cinematographerMovies.length >= minMovies && (movie as any).cinematographer) {
      sections.push({
        id: 'cinematographer',
        title: `Shot by ${(movie as any).cinematographer}`,
        title_te: `${(movie as any).cinematographer} ఛాయాగ్రహణం`,
        reason: 'same-cinematographer',
        movies: cinematographerMovies.slice(0, maxMovies).map(m => {
          usedIds.add(m.id);
          return {
            ...m,
            similarity_score: 62,
            similarity_reason: `Cinematography by ${(movie as any).cinematographer}`,
          };
        }),
        icon: '📷',
        matchType: 'cinematographer',
        priority: 13,
      });
    }
    
    // Production Company section (priority 14)
    const productionMovies = (resultMap.get('production_company') || []).filter(m => !usedIds.has(m.id));
    if (productionMovies.length >= minMovies && (movie as any).production_company) {
      sections.push({
        id: 'production_company',
        title: `More from ${(movie as any).production_company}`,
        title_te: `${(movie as any).production_company} నిర్మాణం`,
        reason: 'same-production-company',
        movies: productionMovies.slice(0, maxMovies).map(m => {
          usedIds.add(m.id);
          return {
            ...m,
            similarity_score: 58,
            similarity_reason: `Produced by ${(movie as any).production_company}`,
          };
        }),
        icon: '🏛️',
        matchType: 'production',
        priority: 14,
      });
    }
    
    // Blockbuster section (priority 15)
    const blockbusterMovies = (resultMap.get('blockbuster') || []).filter(m => !usedIds.has(m.id));
    if (blockbusterMovies.length >= minMovies) {
      sections.push({
        id: 'blockbuster',
        title: 'Other Blockbusters',
        title_te: 'ఇతర బ్లాక్‌బస్టర్లు',
        reason: 'blockbuster',
        movies: blockbusterMovies.slice(0, maxMovies).map(m => {
          usedIds.add(m.id);
          return {
            ...m,
            similarity_score: 52,
            similarity_reason: 'Box office blockbuster',
          };
        }),
        icon: '🔥',
        matchType: 'blockbusters',
        priority: 15,
      });
    }
    
    // Classic section (priority 16)
    const classicMovies = (resultMap.get('classic') || []).filter(m => !usedIds.has(m.id));
    if (classicMovies.length >= minMovies) {
      sections.push({
        id: 'classic',
        title: 'Other Classics',
        title_te: 'ఇతర క్లాసిక్‌లు',
        reason: 'classic',
        movies: classicMovies.slice(0, maxMovies).map(m => {
          usedIds.add(m.id);
          return {
            ...m,
            similarity_score: 48,
            similarity_reason: 'Timeless classic',
          };
        }),
        icon: '🎖️',
        matchType: 'classics',
        priority: 16,
      });
    }
    
    // Sort by priority and return limited sections
    return sections.sort((a, b) => a.priority - b.priority).slice(0, maxSections);
  }

  // If allMovies provided, use in-memory filtering (original logic)
  // Note: This path is less commonly used; primary path is database queries above
  otherMovies = allMovies.filter(m => m.id !== movie.id);
  const usedIdsInMemory = new Set<string>();

  // Section 1: Same Director
  if (movie.director && options.includeDirector !== false) {
    const directorMovies = otherMovies
      .filter(m => m.director === movie.director)
      .slice(0, maxMovies)
      .map(m => {
        usedIdsInMemory.add(m.id);
        return {
          ...m,
          similarity_score: 90,
          similarity_reason: `Same director: ${movie.director}`,
        };
      });

    if (directorMovies.length >= minMovies) {
      sections.push({
        id: 'director',
        title: `More from ${movie.director}`,
        title_te: `${movie.director} మరిన్ని చిత్రాలు`,
        reason: 'same-director',
        movies: directorMovies,
        icon: '🎬',
        matchType: 'director',
        priority: 1,
      });
    }
  }

  // Section 2: Same Hero
  if (movie.hero && options.includeActor !== false) {
    const heroMovies = otherMovies
      .filter(m => m.hero === movie.hero && !usedIdsInMemory.has(m.id))
      .slice(0, maxMovies)
      .map(m => {
        usedIdsInMemory.add(m.id);
        return {
          ...m,
          similarity_score: 85,
          similarity_reason: `Same lead: ${movie.hero}`,
        };
      });

    if (heroMovies.length >= minMovies) {
      sections.push({
        id: 'hero',
        title: `More ${movie.hero} Movies`,
        title_te: `${movie.hero} మరిన్ని సినిమాలు`,
        reason: 'same-hero',
        movies: heroMovies,
        icon: '⭐',
        matchType: 'hero',
        priority: 2,
      });
    }
  }

  // Section 3: Same Heroine
  if (movie.heroine && options.includeHeroine !== false) {
    const heroineMovies = otherMovies
      .filter(m => (m as MovieWithCast).heroine === movie.heroine && !usedIdsInMemory.has(m.id))
      .slice(0, maxMovies)
      .map(m => {
        usedIdsInMemory.add(m.id);
        return {
          ...m,
          similarity_score: 82,
          similarity_reason: `Same heroine: ${movie.heroine}`,
        };
      });

    if (heroineMovies.length >= minMovies) {
      sections.push({
        id: 'heroine',
        title: `More ${movie.heroine} Movies`,
        title_te: `${movie.heroine} మరిన్ని సినిమాలు`,
        reason: 'same-heroine',
        movies: heroineMovies,
        icon: '💫',
        matchType: 'heroine',
        priority: 3,
      });
    }
  }

  // Section 4: Same Genre
  if (movie.genres && movie.genres.length > 0 && options.includeGenre !== false) {
    const primaryGenre = movie.genres[0];
    const genreMovies = otherMovies
      .filter(m => m.genres?.includes(primaryGenre) && !usedIdsInMemory.has(m.id))
      .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
      .slice(0, maxMovies)
      .map(m => {
        usedIdsInMemory.add(m.id);
        return {
          ...m,
          similarity_score: 60,
          similarity_reason: `${primaryGenre} movie`,
        };
      });

    if (genreMovies.length >= minMovies) {
      sections.push({
        id: 'genre',
        title: `More ${primaryGenre} Movies`,
        title_te: `మరిన్ని ${primaryGenre} సినిమాలు`,
        reason: 'same-genre',
        movies: genreMovies,
        icon: '🎭',
        matchType: 'genre',
        priority: 7,
      });
    }
  }

  // Section 5: Same Era
  if (movie.release_year && options.includeEra !== false) {
    const decade = Math.floor(movie.release_year / 10) * 10;
    const eraMovies = otherMovies
      .filter(m => m.release_year && Math.floor(m.release_year / 10) * 10 === decade && !usedIdsInMemory.has(m.id))
      .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
      .slice(0, maxMovies)
      .map(m => {
        usedIdsInMemory.add(m.id);
        return {
          ...m,
          similarity_score: 55,
          similarity_reason: `${decade}s movie`,
        };
      });

    if (eraMovies.length >= minMovies) {
      sections.push({
        id: 'era',
        title: `Best of ${decade}s`,
        title_te: `${decade}ల ఉత్తమ చిత్రాలు`,
        reason: 'same-era',
        movies: eraMovies,
        icon: '📅',
        matchType: 'era',
        priority: 8,
      });
    }
  }

  return sections.sort((a, b) => a.priority - b.priority).slice(0, maxSections);
}

/**
 * Apply visual confidence boost to sections
 * Sections with verified archival images get boosted in display
 */
export function applyVisualConfidenceBoost(
  sections: SimilarSection[],
  visualData?: { movieId: string; confidence: number; hasArchival: boolean }[]
): SimilarSectionWithVisual[] {
  if (!visualData || visualData.length === 0) {
    return sections.map(s => ({ ...s, visualConfidence: 0.5, hasArchivalImages: false }));
  }

  const visualMap = new Map(visualData.map(v => [v.movieId, v]));

  return sections.map(section => {
    const moviesWithVisual = section.movies.map(movie => {
      const visual = visualMap.get(movie.id);
      return {
        ...movie,
        visualConfidence: visual?.confidence || 0.5,
        hasArchivalImages: visual?.hasArchival || false,
      };
    });

    // Calculate section-level visual confidence
    const avgConfidence =
      moviesWithVisual.reduce((sum, m) => sum + (m.visualConfidence || 0.5), 0) /
      moviesWithVisual.length;

    const hasArchival = moviesWithVisual.some(m => m.hasArchivalImages);

    return {
      ...section,
      movies: moviesWithVisual,
      visualConfidence: avgConfidence,
      hasArchivalImages: hasArchival,
    };
  });
}

/**
 * Get quick similar movies without sections
 */
export function getQuickSimilar(
  movie: Movie,
  allMovies: Movie[],
  limit = 6
): SimilarMovie[] {
  const otherMovies = allMovies.filter(m => m.id !== movie.id);

  return otherMovies
    .map(m => ({
      ...m,
      similarity_score: calculateSimilarity(movie, m),
      similarity_reason: 'overall-similarity',
    }))
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, limit);
}

