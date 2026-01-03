/**
 * Conflict Resolution Engine - Phase 2
 * 
 * Resolves data conflicts from multiple sources using trust matrix:
 * - Release dates: Regional → Official → TMDB
 * - Cast/Crew: IMDb → Regional → TMDB
 * - Synopsis: Wikipedia → Regional → TMDB
 * - Ratings: IMDb (50%) + TMDB (30%) + Regional (20%)
 * - Box Office: Regional trade → Wikipedia → TMDB
 * 
 * Stores both raw values (immutable) and derived values (computed)
 * 
 * Usage:
 *   import { conflictResolver } from '@/lib/data/conflict-resolution';
 *   
 *   const resolved = conflictResolver.resolve(sources);
 */

// ============================================================
// TYPES
// ============================================================

export type DataSource = 'tmdb' | 'imdb' | 'wikipedia' | 'regional' | 'official';
export type FieldType = 'release_date' | 'cast' | 'crew' | 'synopsis' | 'rating' | 'box_office' | 'title' | 'runtime';

export interface SourceValue<T = any> {
  source: DataSource;
  value: T;
  confidence: number; // 0-1
  timestamp: Date;
  verified: boolean;
}

export interface ResolvedField<T = any> {
  rawValues: SourceValue<T>[];
  derivedValue: T;
  primarySource: DataSource;
  confidence: number;
  lastUpdated: Date;
  conflictResolutionMethod: string;
}

export interface ConflictResolutionResult {
  fields: Record<string, ResolvedField>;
  conflicts: Array<{
    field: string;
    sources: DataSource[];
    resolution: string;
  }>;
  metadata: {
    totalSources: number;
    conflictsResolved: number;
    avgConfidence: number;
  };
}

// ============================================================
// SOURCE TRUST MATRIX
// ============================================================

const SOURCE_TRUST: Record<FieldType, Record<DataSource, number>> = {
  release_date: {
    regional: 0.9,    // Regional sources know local release dates best
    official: 0.95,   // Official sources (studio) are most reliable
    tmdb: 0.7,
    imdb: 0.75,
    wikipedia: 0.6,
  },
  cast: {
    imdb: 0.9,        // IMDb specializes in cast/crew
    regional: 0.8,
    tmdb: 0.75,
    wikipedia: 0.6,
    official: 0.85,
  },
  crew: {
    imdb: 0.9,
    regional: 0.8,
    tmdb: 0.75,
    wikipedia: 0.6,
    official: 0.85,
  },
  synopsis: {
    wikipedia: 0.85,  // Wikipedia has detailed, factual synopses
    regional: 0.8,
    official: 0.9,
    tmdb: 0.7,
    imdb: 0.65,
  },
  rating: {
    imdb: 0.5,        // Weighted combination
    tmdb: 0.3,
    regional: 0.2,
    wikipedia: 0,
    official: 0,
  },
  box_office: {
    regional: 0.9,    // Regional trade publications most accurate
    wikipedia: 0.7,
    tmdb: 0.5,
    official: 0.85,
    imdb: 0.4,
  },
  title: {
    official: 0.95,
    regional: 0.85,
    tmdb: 0.75,
    imdb: 0.75,
    wikipedia: 0.7,
  },
  runtime: {
    official: 0.9,
    imdb: 0.85,
    tmdb: 0.8,
    regional: 0.75,
    wikipedia: 0.6,
  },
};

// ============================================================
// CONFLICT RESOLVER
// ============================================================

class ConflictResolver {
  /**
   * Resolve conflicts for a field across multiple sources
   */
  resolveField<T>(
    fieldType: FieldType,
    sources: SourceValue<T>[]
  ): ResolvedField<T> {
    if (sources.length === 0) {
      throw new Error('No sources provided');
    }

    // Single source - no conflict
    if (sources.length === 1) {
      return {
        rawValues: sources,
        derivedValue: sources[0].value,
        primarySource: sources[0].source,
        confidence: sources[0].confidence,
        lastUpdated: new Date(),
        conflictResolutionMethod: 'single_source',
      };
    }

    // Multiple sources - apply resolution strategy
    const trustScores = SOURCE_TRUST[fieldType];
    
    // Calculate weighted scores
    const scored = sources.map(s => ({
      ...s,
      score: trustScores[s.source] * s.confidence * (s.verified ? 1.2 : 1.0),
    }));

    // Sort by score (descending)
    scored.sort((a, b) => b.score - a.score);

    // Special handling for ratings (weighted average)
    if (fieldType === 'rating') {
      const derivedValue = this.resolveRating(sources) as T;
      return {
        rawValues: sources,
        derivedValue,
        primarySource: 'imdb', // Primary source for ratings
        confidence: this.calculateConfidence(scored),
        lastUpdated: new Date(),
        conflictResolutionMethod: 'weighted_average',
      };
    }

    // For other fields, use highest-trust source
    const primary = scored[0];
    
    return {
      rawValues: sources,
      derivedValue: primary.value,
      primarySource: primary.source,
      confidence: primary.score,
      lastUpdated: new Date(),
      conflictResolutionMethod: 'trust_based',
    };
  }

  /**
   * Resolve rating using weighted average
   */
  private resolveRating(sources: SourceValue<number>[]): number {
    const trustScores = SOURCE_TRUST.rating;
    
    let weightedSum = 0;
    let totalWeight = 0;

    sources.forEach(source => {
      const weight = trustScores[source.source];
      if (weight > 0) {
        weightedSum += source.value * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculate overall confidence
   */
  private calculateConfidence(scoredSources: any[]): number {
    if (scoredSources.length === 0) return 0;
    
    // If top 2 sources agree (within threshold), high confidence
    if (scoredSources.length >= 2) {
      const top1 = scoredSources[0];
      const top2 = scoredSources[1];
      
      if (this.valuesAgree(top1.value, top2.value)) {
        return Math.min((top1.score + top2.score) / 2, 1.0);
      }
    }

    // Otherwise, use top source confidence
    return Math.min(scoredSources[0].score, 1.0);
  }

  /**
   * Check if two values agree (within tolerance)
   */
  private valuesAgree(val1: any, val2: any): boolean {
    if (typeof val1 === 'number' && typeof val2 === 'number') {
      return Math.abs(val1 - val2) < 0.5;
    }
    
    if (val1 instanceof Date && val2 instanceof Date) {
      const diffDays = Math.abs(val1.getTime() - val2.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7; // Within 7 days
    }
    
    if (typeof val1 === 'string' && typeof val2 === 'string') {
      return val1.toLowerCase().trim() === val2.toLowerCase().trim();
    }
    
    return JSON.stringify(val1) === JSON.stringify(val2);
  }

  /**
   * Resolve all conflicts for a movie
   */
  resolveMovie(movieData: Record<DataSource, any>): ConflictResolutionResult {
    const fields: Record<string, ResolvedField> = {};
    const conflicts: ConflictResolutionResult['conflicts'] = [];

    // Extract sources
    const sources = Object.keys(movieData) as DataSource[];
    
    // Define fields to resolve
    const fieldsToResolve: Array<{ name: string; type: FieldType }> = [
      { name: 'release_date', type: 'release_date' },
      { name: 'title', type: 'title' },
      { name: 'synopsis', type: 'synopsis' },
      { name: 'runtime', type: 'runtime' },
      { name: 'rating', type: 'rating' },
      { name: 'box_office', type: 'box_office' },
    ];

    fieldsToResolve.forEach(({ name, type }) => {
      // Collect values from all sources
      const sourceValues: SourceValue[] = [];
      
      sources.forEach(source => {
        const data = movieData[source];
        if (data && data[name] !== undefined && data[name] !== null) {
          sourceValues.push({
            source,
            value: data[name],
            confidence: data.confidence || 0.8,
            timestamp: new Date(data.timestamp || Date.now()),
            verified: data.verified || false,
          });
        }
      });

      // Resolve if we have values
      if (sourceValues.length > 0) {
        const resolved = this.resolveField(type, sourceValues);
        fields[name] = resolved;

        // Track conflicts
        if (sourceValues.length > 1) {
          const uniqueValues = new Set(sourceValues.map(sv => JSON.stringify(sv.value)));
          if (uniqueValues.size > 1) {
            conflicts.push({
              field: name,
              sources: sourceValues.map(sv => sv.source),
              resolution: `Used ${resolved.primarySource} as primary source`,
            });
          }
        }
      }
    });

    // Calculate metadata
    const confidences = Object.values(fields).map(f => f.confidence);
    const avgConfidence = confidences.length > 0 
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length 
      : 0;

    return {
      fields,
      conflicts,
      metadata: {
        totalSources: sources.length,
        conflictsResolved: conflicts.length,
        avgConfidence,
      },
    };
  }

  /**
   * Get conflict resolution history for a field
   */
  getResolutionHistory(resolvedField: ResolvedField): string {
    const history: string[] = [];
    
    history.push(`Method: ${resolvedField.conflictResolutionMethod}`);
    history.push(`Primary Source: ${resolvedField.primarySource}`);
    history.push(`Confidence: ${(resolvedField.confidence * 100).toFixed(1)}%`);
    
    if (resolvedField.rawValues.length > 1) {
      history.push('\nRaw Values:');
      resolvedField.rawValues.forEach(rv => {
        history.push(`  - ${rv.source}: ${JSON.stringify(rv.value)} (confidence: ${(rv.confidence * 100).toFixed(0)}%)`);
      });
    }
    
    history.push(`\nDerived Value: ${JSON.stringify(resolvedField.derivedValue)}`);
    
    return history.join('\n');
  }

  /**
   * Detect staleness (should data be re-fetched?)
   */
  isStale(resolvedField: ResolvedField, maxAgeDays: number = 90): boolean {
    const ageInDays = (Date.now() - resolvedField.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    return ageInDays > maxAgeDays;
  }

  /**
   * Validate resolution quality
   */
  validateResolution(resolvedField: ResolvedField): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check confidence threshold
    if (resolvedField.confidence < 0.5) {
      issues.push('Low confidence resolution (< 50%)');
    }

    // Check if primary source is reliable
    const reliableSources: DataSource[] = ['official', 'imdb', 'regional'];
    if (!reliableSources.includes(resolvedField.primarySource)) {
      issues.push(`Primary source (${resolvedField.primarySource}) may not be reliable`);
    }

    // Check for conflicting high-trust sources
    const highTrustSources = resolvedField.rawValues.filter(rv => rv.confidence > 0.8);
    if (highTrustSources.length > 1) {
      const uniqueValues = new Set(highTrustSources.map(rv => JSON.stringify(rv.value)));
      if (uniqueValues.size > 1) {
        issues.push('Multiple high-trust sources with conflicting values');
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const conflictResolver = new ConflictResolver();
export default conflictResolver;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Merge movie data from multiple sources
 */
export function mergeMovieData(sources: Record<DataSource, any>): any {
  const resolved = conflictResolver.resolveMovie(sources);
  
  const merged: any = {};
  
  // Extract derived values
  Object.entries(resolved.fields).forEach(([field, data]) => {
    merged[field] = data.derivedValue;
    merged[`${field}_source`] = data.primarySource;
    merged[`${field}_confidence`] = data.confidence;
  });

  // Store raw sources for audit trail
  merged._sources = sources;
  merged._conflicts = resolved.conflicts;
  merged._metadata = resolved.metadata;

  return merged;
}

/**
 * Get data quality score based on resolution
 */
export function getDataQualityScore(result: ConflictResolutionResult): number {
  let score = 100;

  // Deduct for conflicts
  score -= result.metadata.conflictsResolved * 5;

  // Deduct for low confidence
  if (result.metadata.avgConfidence < 0.7) {
    score -= 20;
  } else if (result.metadata.avgConfidence < 0.8) {
    score -= 10;
  }

  // Deduct for single source
  if (result.metadata.totalSources === 1) {
    score -= 15;
  }

  return Math.max(score, 0);
}


