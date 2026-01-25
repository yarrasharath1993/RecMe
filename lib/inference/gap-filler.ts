/**
 * Data Gap Filler - Pattern-Based Inference Engine
 * 
 * Auto-fills missing data (music_director, producer, supporting_cast) using
 * three strategies:
 * 1. Similarity-Based: Find similar movies with same hero+director
 * 2. Collaboration Pattern: Use director's frequent collaborators
 * 3. Era & Genre Pattern: Common actors in same era/genre
 * 
 * ALL inferred data:
 * - Marked as is_inferred=true
 * - Has confidence < 0.70
 * - Logged to inference_audit_log
 * - Added to entity_relations (NOT to main movie fields)
 * 
 * REUSES: similarity-engine.ts, collaborations table
 */

import { createClient } from '@supabase/supabase-js';
import { getSimilarMovies, calculateSimilarity } from '../movies/similarity-engine';

export interface InferenceResult {
  field_name: string;
  inferred_value: string;
  confidence: number;
  evidence: {
    method: string;
    similar_movies?: Array<{ id: string; title: string; value: string; similarity: number }>;
    pattern_strength?: number;
    frequency?: number;
    total_checked?: number;
    reasoning: string;
  };
  inference_type: 'similarity' | 'collaboration' | 'pattern';
}

export class DataGapFiller {
  private supabase;
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  
  /**
   * Infer missing music_director using similarity and collaboration patterns
   */
  async inferMusicDirector(movie: any): Promise<InferenceResult | null> {
    // Strategy 1: Similarity-based (same hero + director)
    const similarityResult = await this.inferFromSimilarity(
      movie,
      'music_director',
      { hero: true, director: true }
    );
    
    if (similarityResult && similarityResult.confidence >= 0.65) {
      return similarityResult;
    }
    
    // Strategy 2: Collaboration pattern (director's usual music director)
    const collaborationResult = await this.inferFromCollaboration(
      movie.director,
      'director',
      'music_director'
    );
    
    if (collaborationResult && collaborationResult.confidence >= 0.60) {
      return collaborationResult;
    }
    
    // Return best result if any
    if (similarityResult) return similarityResult;
    if (collaborationResult) return collaborationResult;
    
    return null;
  }
  
  /**
   * Infer missing producer using collaboration patterns
   */
  async inferProducer(movie: any): Promise<InferenceResult | null> {
    // Strategy 1: Director's frequent producer
    const directorCollaboration = await this.inferFromCollaboration(
      movie.director,
      'director',
      'producer'
    );
    
    if (directorCollaboration && directorCollaboration.confidence >= 0.60) {
      return directorCollaboration;
    }
    
    // Strategy 2: Hero's frequent producer
    const heroCollaboration = await this.inferFromCollaboration(
      movie.hero,
      'hero',
      'producer'
    );
    
    if (heroCollaboration && heroCollaboration.confidence >= 0.55) {
      return heroCollaboration;
    }
    
    // Return best result
    if (directorCollaboration) return directorCollaboration;
    if (heroCollaboration) return heroCollaboration;
    
    return null;
  }
  
  /**
   * Infer missing supporting cast using era/genre patterns
   */
  async inferSupportingCast(movie: any, maxCount: number = 2): Promise<InferenceResult[]> {
    const results: InferenceResult[] = [];
    
    // Strategy: Common supporting actors in same era + genre
    const commonActors = await this.findCommonActorsByEraGenre(
      movie.release_year,
      movie.genres?.[0] || 'drama',
      maxCount + 2 // Get extras in case some already exist
    );
    
    // Filter out actors already in this movie
    const existingCast = [
      movie.hero,
      movie.heroine,
      ...(movie.supporting_cast || []).map((c: any) => c.name),
    ].filter(Boolean);
    
    const newActors = commonActors.filter(actor => 
      !existingCast.some(existing => 
        existing.toLowerCase() === actor.name.toLowerCase()
      )
    );
    
    for (let i = 0; i < Math.min(maxCount, newActors.length); i++) {
      const actor = newActors[i];
      results.push({
        field_name: 'supporting_cast',
        inferred_value: actor.name,
        confidence: Math.min(actor.frequency / 100, 0.65), // Cap at 0.65
        evidence: {
          method: 'era_genre_pattern',
          frequency: actor.frequency,
          total_checked: actor.total_movies,
          pattern_strength: actor.frequency / actor.total_movies,
          reasoning: `Found in ${actor.frequency}% of similar ${movie.genres?.[0] || 'drama'} movies from ${Math.floor(movie.release_year / 10) * 10}s`,
        },
        inference_type: 'pattern',
      });
    }
    
    return results;
  }
  
  /**
   * Strategy 1: Infer from similar movies
   */
  private async inferFromSimilarity(
    movie: any,
    field: string,
    matchCriteria: { hero?: boolean; director?: boolean; heroine?: boolean }
  ): Promise<InferenceResult | null> {
    // Build query for similar movies
    let query = this.supabase
      .from('movies')
      .select(`id, title_en, ${field}, release_year, hero, director, genres`)
      .eq('is_published', true)
      .not(field, 'is', null)
      .not('id', 'eq', movie.id);
    
    // Apply match criteria
    if (matchCriteria.hero && movie.hero) {
      query = query.eq('hero', movie.hero);
    }
    if (matchCriteria.director && movie.director) {
      query = query.eq('director', movie.director);
    }
    if (matchCriteria.heroine && movie.heroine) {
      query = query.eq('heroine', movie.heroine);
    }
    
    const { data: similarMovies } = await query.limit(10);
    
    if (!similarMovies || similarMovies.length < 3) {
      return null; // Need at least 3 movies for confidence
    }
    
    // Count occurrences of each value
    const valueCounts = new Map<string, number>();
    for (const m of similarMovies) {
      const value = m[field];
      if (value) {
        valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
      }
    }
    
    // Find most common value
    let maxCount = 0;
    let mostCommon = '';
    for (const [value, count] of valueCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = value;
      }
    }
    
    // Calculate confidence
    const confidence = Math.min((maxCount / similarMovies.length) * 0.70, 0.70); // Cap at 0.70
    
    if (maxCount < 3) {
      return null; // Not enough agreement
    }
    
    return {
      field_name: field,
      inferred_value: mostCommon,
      confidence,
      evidence: {
        method: 'similarity_based',
        similar_movies: similarMovies
          .filter(m => m[field] === mostCommon)
          .map(m => ({
            id: m.id,
            title: m.title_en,
            value: m[field],
            similarity: calculateSimilarity(movie, m, matchCriteria),
          })),
        pattern_strength: maxCount / similarMovies.length,
        reasoning: `Found in ${maxCount}/${similarMovies.length} similar movies with same ${Object.keys(matchCriteria).filter(k => matchCriteria[k as keyof typeof matchCriteria]).join('+')}`,
      },
      inference_type: 'similarity',
    };
  }
  
  /**
   * Strategy 2: Infer from collaboration patterns
   */
  private async inferFromCollaboration(
    entityName: string | null | undefined,
    entityRole: string,
    targetRole: string
  ): Promise<InferenceResult | null> {
    if (!entityName) return null;
    
    // Query movies where entity appears in given role
    const fieldMap: Record<string, string> = {
      hero: 'hero',
      director: 'director',
      heroine: 'heroine',
    };
    
    const entityField = fieldMap[entityRole];
    if (!entityField) return null;
    
    const targetField = fieldMap[targetRole] || targetRole;
    
    // Get movies with this entity
    const { data: movies } = await this.supabase
      .from('movies')
      .select(`id, title_en, ${targetField}`)
      .eq(entityField, entityName)
      .not(targetField, 'is', null)
      .limit(20);
    
    if (!movies || movies.length < 3) {
      return null;
    }
    
    // Count collaborator occurrences
    const collaboratorCounts = new Map<string, number>();
    for (const m of movies) {
      const collaborator = m[targetField];
      if (collaborator) {
        collaboratorCounts.set(collaborator, (collaboratorCounts.get(collaborator) || 0) + 1);
      }
    }
    
    // Find most frequent collaborator
    let maxCount = 0;
    let mostFrequent = '';
    for (const [collaborator, count] of collaboratorCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = collaborator;
      }
    }
    
    // Calculate confidence
    const confidence = Math.min((maxCount / movies.length) * 0.65, 0.65); // Cap at 0.65
    
    if (maxCount < 3) {
      return null;
    }
    
    return {
      field_name: targetRole,
      inferred_value: mostFrequent,
      confidence,
      evidence: {
        method: 'collaboration_pattern',
        frequency: maxCount,
        total_checked: movies.length,
        pattern_strength: maxCount / movies.length,
        reasoning: `${entityName} worked with ${mostFrequent} in ${maxCount}/${movies.length} previous films`,
      },
      inference_type: 'collaboration',
    };
  }
  
  /**
   * Strategy 3: Find common actors by era and genre
   */
  private async findCommonActorsByEraGenre(
    releaseYear: number,
    primaryGenre: string,
    limit: number = 5
  ): Promise<Array<{ name: string; frequency: number; total_movies: number }>> {
    if (!releaseYear) return [];
    
    const decade = Math.floor(releaseYear / 10) * 10;
    const yearRange = [decade, decade + 9];
    
    // Get movies from same era and genre with supporting cast
    const { data: movies } = await this.supabase
      .from('movies')
      .select('id, supporting_cast')
      .contains('genres', [primaryGenre])
      .gte('release_year', yearRange[0])
      .lte('release_year', yearRange[1])
      .not('supporting_cast', 'is', null)
      .limit(100);
    
    if (!movies || movies.length < 10) {
      return [];
    }
    
    // Count actor occurrences
    const actorCounts = new Map<string, number>();
    for (const movie of movies) {
      if (Array.isArray(movie.supporting_cast)) {
        for (const cast of movie.supporting_cast) {
          if (cast.name) {
            actorCounts.set(cast.name, (actorCounts.get(cast.name) || 0) + 1);
          }
        }
      }
    }
    
    // Convert to array and sort by frequency
    const actors = Array.from(actorCounts.entries())
      .map(([name, count]) => ({
        name,
        frequency: Math.round((count / movies.length) * 100),
        total_movies: movies.length,
      }))
      .filter(a => a.frequency >= 15) // At least 15% frequency
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
    
    return actors;
  }
  
  /**
   * Log inference to audit trail
   */
  async logInference(
    movieId: string,
    movieTitle: string,
    inference: InferenceResult,
    batchId?: string
  ): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('inference_audit_log')
      .insert({
        entity_type: 'movie',
        entity_id: movieId,
        entity_identifier: movieTitle,
        field_name: inference.field_name,
        inference_type: 'auto_fill',
        inferred_value: inference.inferred_value,
        confidence: inference.confidence,
        evidence: inference.evidence as any,
        status: 'pending',
        inference_source: 'gap-filler',
        batch_id: batchId,
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Failed to log inference:', error);
      return null;
    }
    
    return data?.id || null;
  }
  
  /**
   * Create entity_relation from inference
   */
  async createEntityRelation(
    movieId: string,
    movieTitle: string,
    movieYear: number,
    movieSlug: string,
    inference: InferenceResult
  ): Promise<boolean> {
    const roleTypeMap: Record<string, string> = {
      music_director: 'music',
      producer: 'producer',
      supporting_cast: 'supporting',
    };
    
    const entityTypeMap: Record<string, string> = {
      music_director: 'music_director',
      producer: 'producer',
      supporting_cast: 'actor',
    };
    
    const { error } = await this.supabase
      .from('entity_relations')
      .insert({
        movie_id: movieId,
        movie_title: movieTitle,
        movie_year: movieYear,
        movie_slug: movieSlug,
        entity_type: entityTypeMap[inference.field_name] || 'other',
        entity_name: inference.inferred_value,
        role_type: roleTypeMap[inference.field_name] || 'other',
        is_verified: false,
        is_inferred: true,
        confidence: inference.confidence,
        inference_source: inference.inference_type,
        data_source: 'inference',
        source_metadata: inference.evidence as any,
      });
    
    if (error) {
      console.error('Failed to create entity relation:', error);
      return false;
    }
    
    return true;
  }
}
