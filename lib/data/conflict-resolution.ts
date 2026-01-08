/**
 * Conflict Resolution Engine - Phase 3 (Enhanced)
 * 
 * Resolves data conflicts from multiple sources using trust matrix:
 * - Release dates: Regional → Official → TMDB
 * - Cast/Crew: IMDb → Regional → TMDB
 * - Synopsis: Wikipedia → Regional → TMDB
 * - Ratings: IMDb (50%) + TMDB (30%) + Regional (20%)
 * - Box Office: Regional trade → Wikipedia → TMDB
 * - Awards: Wikidata → Wikipedia → OMDB
 * - Budget: Regional → Official → Wikipedia
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

export type DataSource = 
  | 'tmdb' 
  | 'imdb' 
  | 'omdb'
  | 'wikipedia' 
  | 'wikidata'
  | 'regional' 
  | 'official'
  | 'google_kg'
  | 'letterboxd'
  | 'internal';

export type FieldType = 
  // Core metadata
  | 'release_date' 
  | 'cast' 
  | 'crew' 
  | 'synopsis' 
  | 'rating' 
  | 'box_office' 
  | 'title' 
  | 'runtime'
  // Extended fields (Phase 3)
  | 'awards'
  | 'genre'
  | 'language'
  | 'production_house'
  | 'music_director'
  | 'budget'
  | 'ott_platform'
  | 'certification'
  | 'hero'
  | 'heroine'
  | 'director'
  | 'poster_url'
  | 'backdrop_url';

export interface SourceValue<T = unknown> {
  source: DataSource;
  value: T;
  confidence: number; // 0-1
  timestamp: Date;
  verified: boolean;
}

export interface ResolvedField<T = unknown> {
  rawValues: SourceValue<T>[];
  derivedValue: T;
  primarySource: DataSource;
  confidence: number;
  lastUpdated: Date;
  conflictResolutionMethod: ResolutionMethod;
  agreementLevel: AgreementLevel;
}

export type ResolutionMethod = 
  | 'single_source'
  | 'trust_based'
  | 'weighted_average'
  | 'unanimous'
  | 'majority_vote'
  | 'manual_override';

export type AgreementLevel = 
  | 'unanimous'      // All sources agree
  | 'consensus'      // 2+ high-trust sources agree
  | 'trust_weighted' // Used highest trust source
  | 'conflict';      // Significant disagreement

export interface ConflictResolutionResult {
  fields: Record<string, ResolvedField>;
  conflicts: Array<{
    field: string;
    sources: DataSource[];
    resolution: string;
    severity: 'critical' | 'warning' | 'info';
  }>;
  metadata: {
    totalSources: number;
    conflictsResolved: number;
    avgConfidence: number;
    dataQualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    needsManualReview: boolean;
  };
}

// ============================================================
// SOURCE TRUST MATRIX (Extended)
// ============================================================

const SOURCE_TRUST: Record<FieldType, Partial<Record<DataSource, number>>> = {
  // Core metadata
  release_date: {
    regional: 0.9,
    official: 0.95,
    tmdb: 0.7,
    imdb: 0.75,
    omdb: 0.75,
    wikipedia: 0.6,
    wikidata: 0.8,
    internal: 0.5,
  },
  cast: {
    imdb: 0.9,
    omdb: 0.85,
    regional: 0.8,
    tmdb: 0.75,
    wikipedia: 0.6,
    wikidata: 0.7,
    official: 0.85,
    internal: 0.6,
  },
  crew: {
    imdb: 0.9,
    omdb: 0.85,
    regional: 0.8,
    tmdb: 0.75,
    wikipedia: 0.6,
    wikidata: 0.7,
    official: 0.85,
    internal: 0.6,
  },
  synopsis: {
    wikipedia: 0.85,
    regional: 0.8,
    official: 0.9,
    tmdb: 0.7,
    imdb: 0.65,
    omdb: 0.65,
    google_kg: 0.6,
    internal: 0.5,
  },
  rating: {
    imdb: 0.5,
    omdb: 0.5,
    tmdb: 0.3,
    regional: 0.2,
    letterboxd: 0.15,
    wikipedia: 0,
    official: 0,
    internal: 0.1,
  },
  box_office: {
    regional: 0.95,
    wikipedia: 0.8,
    tmdb: 0.5,
    official: 0.85,
    imdb: 0.4,
    wikidata: 0.7,
    internal: 0.6,
  },
  title: {
    official: 0.95,
    regional: 0.85,
    tmdb: 0.75,
    imdb: 0.75,
    omdb: 0.75,
    wikipedia: 0.7,
    wikidata: 0.7,
    internal: 0.8,
  },
  runtime: {
    official: 0.9,
    imdb: 0.85,
    omdb: 0.85,
    tmdb: 0.8,
    regional: 0.75,
    wikipedia: 0.6,
    internal: 0.7,
  },
  
  // Extended fields (Phase 3)
  awards: {
    wikidata: 0.95,    // Structured, verified awards data
    wikipedia: 0.85,   // Detailed but unstructured
    omdb: 0.70,        // Summary only
    tmdb: 0.60,
    regional: 0.75,
    internal: 0.5,
  },
  genre: {
    tmdb: 0.9,
    imdb: 0.85,
    omdb: 0.85,
    wikipedia: 0.7,
    wikidata: 0.75,
    regional: 0.7,
    internal: 0.6,
  },
  language: {
    tmdb: 0.9,
    wikipedia: 0.85,
    wikidata: 0.9,
    imdb: 0.8,
    regional: 0.95,
    internal: 0.7,
  },
  production_house: {
    tmdb: 0.85,
    wikipedia: 0.8,
    wikidata: 0.85,
    regional: 0.9,
    official: 0.95,
    internal: 0.6,
  },
  music_director: {
    wikipedia: 0.85,
    wikidata: 0.8,
    tmdb: 0.75,
    regional: 0.9,
    official: 0.9,
    internal: 0.6,
  },
  budget: {
    regional: 0.9,
    wikipedia: 0.75,
    official: 0.95,
    tmdb: 0.5,
    wikidata: 0.7,
    internal: 0.5,
  },
  ott_platform: {
    official: 0.95,
    regional: 0.9,
    tmdb: 0.6,
    internal: 0.8,
  },
  certification: {
    official: 0.95,
    tmdb: 0.85,
    imdb: 0.8,
    regional: 0.85,
    internal: 0.7,
  },
  hero: {
    tmdb: 0.9,
    imdb: 0.85,
    omdb: 0.85,
    wikipedia: 0.75,
    regional: 0.85,
    internal: 0.7,
  },
  heroine: {
    tmdb: 0.9,
    imdb: 0.85,
    omdb: 0.85,
    wikipedia: 0.75,
    regional: 0.85,
    internal: 0.7,
  },
  director: {
    imdb: 0.95,
    omdb: 0.9,
    tmdb: 0.9,
    wikipedia: 0.85,
    wikidata: 0.85,
    regional: 0.85,
    official: 0.95,
    internal: 0.7,
  },
  poster_url: {
    tmdb: 0.95,
    imdb: 0.8,
    official: 0.9,
    regional: 0.6,
    internal: 0.5,
  },
  backdrop_url: {
    tmdb: 0.95,
    imdb: 0.7,
    official: 0.85,
    internal: 0.5,
  },
};

// Default trust for unlisted source-field combinations
const DEFAULT_TRUST = 0.5;

// ============================================================
// NAME NORMALIZATION (for comparing names across sources)
// ============================================================

const NAME_ALIASES: Record<string, string[]> = {
  'devi sri prasad': ['dsp', 'd.s.p.', 'devi sri prasad'],
  'ss rajamouli': ['s.s. rajamouli', 'rajamouli', 'ss rajamouli'],
  'ntr': ['n.t.r.', 'ntr jr', 'jr ntr', 'n. t. rama rao jr.'],
  'ram charan': ['ram charan tej', 'ramcharan'],
  'pawan kalyan': ['pawankalyan', 'power star'],
  'allu arjun': ['allu arjun', 'bunny', 'aa'],
  'mahesh babu': ['mahesh', 'prince mahesh babu'],
  'prabhas': ['prabhas raju', 'rebel star prabhas'],
  'trivikram': ['trivikram srinivas'],
  'sukumar': ['sukku', 'sukumar bandreddi'],
};

function normalizeName(name: string): string {
  const lower = name.toLowerCase().trim();
  
  // Check aliases
  for (const [canonical, aliases] of Object.entries(NAME_ALIASES)) {
    if (aliases.some(alias => lower.includes(alias) || alias.includes(lower))) {
      return canonical;
    }
  }
  
  // Remove common suffixes/prefixes
  return lower
    .replace(/\s+(jr\.?|sr\.?|ii|iii)$/i, '')
    .replace(/^(dr\.?|mr\.?|ms\.?|mrs\.?)\s+/i, '')
    .trim();
}

// ============================================================
// CONFLICT RESOLVER (Enhanced)
// ============================================================

class ConflictResolver {
  /**
   * Get trust score for a source-field combination
   */
  private getTrustScore(fieldType: FieldType, source: DataSource): number {
    return SOURCE_TRUST[fieldType]?.[source] ?? DEFAULT_TRUST;
  }

  /**
   * Check if two values represent the same thing (fuzzy matching)
   */
  valuesAgree(val1: unknown, val2: unknown, fieldType?: FieldType): boolean {
    if (val1 === val2) return true;
    if (val1 === null || val2 === null) return false;
    if (val1 === undefined || val2 === undefined) return false;
    
    // Number comparison with tolerance
    if (typeof val1 === 'number' && typeof val2 === 'number') {
      // For ratings, allow 0.5 difference
      if (fieldType === 'rating') {
        return Math.abs(val1 - val2) <= 0.5;
      }
      // For runtime, allow 5 minute difference
      if (fieldType === 'runtime') {
        return Math.abs(val1 - val2) <= 5;
      }
      // For budget/box office, allow 10% difference
      if (fieldType === 'budget' || fieldType === 'box_office') {
        const avg = (val1 + val2) / 2;
        return Math.abs(val1 - val2) / avg <= 0.1;
      }
      return Math.abs(val1 - val2) < 0.5;
    }
    
    // Date comparison with tolerance
    if (val1 instanceof Date && val2 instanceof Date) {
      const diffDays = Math.abs(val1.getTime() - val2.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7; // Within 7 days
    }
    
    // String comparison (normalize for names)
    if (typeof val1 === 'string' && typeof val2 === 'string') {
      const personFields: FieldType[] = ['hero', 'heroine', 'director', 'music_director'];
      if (fieldType && personFields.includes(fieldType)) {
        return normalizeName(val1) === normalizeName(val2);
      }
      return val1.toLowerCase().trim() === val2.toLowerCase().trim();
    }
    
    // Array comparison (check overlap)
    if (Array.isArray(val1) && Array.isArray(val2)) {
      const set1 = new Set(val1.map(v => typeof v === 'string' ? v.toLowerCase() : JSON.stringify(v)));
      const set2 = new Set(val2.map(v => typeof v === 'string' ? v.toLowerCase() : JSON.stringify(v)));
      const intersection = [...set1].filter(x => set2.has(x));
      // Consider agreement if 50%+ overlap
      return intersection.length >= Math.min(set1.size, set2.size) * 0.5;
    }
    
    return JSON.stringify(val1) === JSON.stringify(val2);
  }

  /**
   * Determine agreement level across sources
   */
  private determineAgreementLevel(sources: SourceValue[], fieldType: FieldType): AgreementLevel {
    if (sources.length <= 1) return 'unanimous';
    
    // Check if all sources agree
    const firstValue = sources[0].value;
    const allAgree = sources.every(s => this.valuesAgree(s.value, firstValue, fieldType));
    if (allAgree) return 'unanimous';
    
    // Check if high-trust sources agree
    const highTrustSources = sources.filter(s => s.confidence >= 0.8);
    if (highTrustSources.length >= 2) {
      const htFirst = highTrustSources[0].value;
      const htAgree = highTrustSources.every(s => this.valuesAgree(s.value, htFirst, fieldType));
      if (htAgree) return 'consensus';
    }
    
    // Check for majority
    const valueGroups = new Map<string, number>();
    sources.forEach(s => {
      const key = JSON.stringify(s.value);
      valueGroups.set(key, (valueGroups.get(key) || 0) + 1);
    });
    const maxGroup = Math.max(...valueGroups.values());
    if (maxGroup > sources.length / 2) return 'trust_weighted';
    
    return 'conflict';
  }

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
        confidence: sources[0].confidence * this.getTrustScore(fieldType, sources[0].source),
        lastUpdated: new Date(),
        conflictResolutionMethod: 'single_source',
        agreementLevel: 'unanimous',
      };
    }

    // Calculate weighted scores
    const scored = sources.map(s => ({
      ...s,
      score: this.getTrustScore(fieldType, s.source) * s.confidence * (s.verified ? 1.2 : 1.0),
    }));

    // Sort by score (descending)
    scored.sort((a, b) => b.score - a.score);
    
    // Determine agreement level
    const agreementLevel = this.determineAgreementLevel(sources, fieldType);

    // Special handling for ratings (weighted average)
    if (fieldType === 'rating') {
      const derivedValue = this.resolveRating(sources) as T;
      return {
        rawValues: sources,
        derivedValue,
        primarySource: 'imdb',
        confidence: this.calculateConfidence(scored, fieldType),
        lastUpdated: new Date(),
        conflictResolutionMethod: 'weighted_average',
        agreementLevel,
      };
    }

    // Check for unanimous agreement
    if (agreementLevel === 'unanimous') {
      return {
        rawValues: sources,
        derivedValue: scored[0].value,
        primarySource: scored[0].source,
        confidence: Math.min(1.0, scored[0].score * 1.1), // Boost for unanimous
        lastUpdated: new Date(),
        conflictResolutionMethod: 'unanimous',
        agreementLevel: 'unanimous',
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
      agreementLevel,
    };
  }

  /**
   * Resolve rating using weighted average
   */
  private resolveRating(sources: SourceValue<number>[]): number {
    let weightedSum = 0;
    let totalWeight = 0;

    sources.forEach(source => {
      const weight = this.getTrustScore('rating', source.source);
      if (weight > 0) {
        weightedSum += source.value * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
  }

  /**
   * Calculate overall confidence
   */
  private calculateConfidence(scoredSources: Array<SourceValue & { score: number }>, fieldType: FieldType): number {
    if (scoredSources.length === 0) return 0;
    
    // If top 2 sources agree (within threshold), high confidence
    if (scoredSources.length >= 2) {
      const top1 = scoredSources[0];
      const top2 = scoredSources[1];
      
      if (this.valuesAgree(top1.value, top2.value, fieldType)) {
        return Math.min((top1.score + top2.score) / 1.5, 1.0);
      }
    }

    // Otherwise, use top source confidence
    return Math.min(scoredSources[0].score, 1.0);
  }

  /**
   * Resolve all conflicts for a movie
   */
  resolveMovie(movieData: Record<DataSource, Record<string, unknown>>): ConflictResolutionResult {
    const fields: Record<string, ResolvedField> = {};
    const conflicts: ConflictResolutionResult['conflicts'] = [];

    // Extract sources
    const sources = Object.keys(movieData) as DataSource[];
    
    // Define fields to resolve with severity levels
    const fieldsToResolve: Array<{ name: string; type: FieldType; critical: boolean }> = [
      // Core fields (critical)
      { name: 'title', type: 'title', critical: true },
      { name: 'release_date', type: 'release_date', critical: true },
      { name: 'director', type: 'director', critical: true },
      { name: 'hero', type: 'hero', critical: true },
      
      // Important fields
      { name: 'heroine', type: 'heroine', critical: false },
      { name: 'synopsis', type: 'synopsis', critical: false },
      { name: 'runtime', type: 'runtime', critical: false },
      { name: 'rating', type: 'rating', critical: false },
      { name: 'genre', type: 'genre', critical: false },
      
      // Extended fields
      { name: 'box_office', type: 'box_office', critical: false },
      { name: 'awards', type: 'awards', critical: false },
      { name: 'music_director', type: 'music_director', critical: false },
      { name: 'production_house', type: 'production_house', critical: false },
      { name: 'budget', type: 'budget', critical: false },
      { name: 'ott_platform', type: 'ott_platform', critical: false },
      { name: 'certification', type: 'certification', critical: false },
      { name: 'language', type: 'language', critical: false },
      { name: 'poster_url', type: 'poster_url', critical: false },
      { name: 'backdrop_url', type: 'backdrop_url', critical: false },
    ];

    let criticalConflicts = 0;

    fieldsToResolve.forEach(({ name, type, critical }) => {
      // Collect values from all sources
      const sourceValues: SourceValue[] = [];
      
      sources.forEach(source => {
        const data = movieData[source];
        if (data && data[name] !== undefined && data[name] !== null) {
          sourceValues.push({
            source,
            value: data[name],
            confidence: (data.confidence as number) || 0.8,
            timestamp: new Date((data.timestamp as string) || Date.now()),
            verified: (data.verified as boolean) || false,
          });
        }
      });

      // Resolve if we have values
      if (sourceValues.length > 0) {
        const resolved = this.resolveField(type, sourceValues);
        fields[name] = resolved;

        // Track conflicts
        if (sourceValues.length > 1 && resolved.agreementLevel === 'conflict') {
          const severity = critical ? 'critical' : 
                          resolved.confidence < 0.6 ? 'warning' : 'info';
          
          if (severity === 'critical') criticalConflicts++;
          
          conflicts.push({
            field: name,
            sources: sourceValues.map(sv => sv.source),
            resolution: `Used ${resolved.primarySource} as primary source (${resolved.conflictResolutionMethod})`,
            severity,
          });
        }
      }
    });

    // Calculate metadata
    const confidences = Object.values(fields).map(f => f.confidence);
    const avgConfidence = confidences.length > 0 
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length 
      : 0;

    // Determine data quality grade
    const dataQualityGrade = this.calculateQualityGrade(avgConfidence, conflicts.length, sources.length);

    return {
      fields,
      conflicts,
      metadata: {
        totalSources: sources.length,
        conflictsResolved: conflicts.length,
        avgConfidence,
        dataQualityGrade,
        needsManualReview: criticalConflicts > 0 || avgConfidence < 0.6,
      },
    };
  }

  /**
   * Calculate data quality grade
   */
  private calculateQualityGrade(
    avgConfidence: number, 
    conflictCount: number, 
    sourceCount: number
  ): 'A' | 'B' | 'C' | 'D' | 'F' {
    let score = 100;

    // Confidence impact (0-40 points)
    score -= (1 - avgConfidence) * 40;

    // Conflicts impact (0-30 points)
    score -= Math.min(conflictCount * 5, 30);

    // Source diversity bonus (0-10 points)
    if (sourceCount >= 4) score += 10;
    else if (sourceCount >= 3) score += 5;
    else if (sourceCount <= 1) score -= 15;

    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Get conflict resolution history for a field
   */
  getResolutionHistory(resolvedField: ResolvedField): string {
    const history: string[] = [];
    
    history.push(`Method: ${resolvedField.conflictResolutionMethod}`);
    history.push(`Agreement: ${resolvedField.agreementLevel}`);
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
    const reliableSources: DataSource[] = ['official', 'imdb', 'omdb', 'regional', 'tmdb', 'wikidata'];
    if (!reliableSources.includes(resolvedField.primarySource)) {
      issues.push(`Primary source (${resolvedField.primarySource}) may not be reliable`);
    }

    // Check for conflict state
    if (resolvedField.agreementLevel === 'conflict') {
      issues.push('Sources have conflicting values - manual review recommended');
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
export function mergeMovieData(sources: Record<DataSource, Record<string, unknown>>): Record<string, unknown> {
  const resolved = conflictResolver.resolveMovie(sources);
  
  const merged: Record<string, unknown> = {};
  
  // Extract derived values
  Object.entries(resolved.fields).forEach(([field, data]) => {
    merged[field] = data.derivedValue;
    merged[`${field}_source`] = data.primarySource;
    merged[`${field}_confidence`] = data.confidence;
    merged[`${field}_agreement`] = data.agreementLevel;
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

  // Deduct for conflicts by severity
  result.conflicts.forEach(c => {
    if (c.severity === 'critical') score -= 15;
    else if (c.severity === 'warning') score -= 7;
    else score -= 3;
  });

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

/**
 * Get verified facts only (high confidence, unanimous or consensus)
 */
export function getVerifiedFacts(result: ConflictResolutionResult): Record<string, {
  value: unknown;
  confidence: number;
  sources: DataSource[];
}> {
  const verified: Record<string, { value: unknown; confidence: number; sources: DataSource[] }> = {};
  
  Object.entries(result.fields).forEach(([field, data]) => {
    // Only include if high confidence and good agreement
    if (data.confidence >= 0.75 && 
        (data.agreementLevel === 'unanimous' || data.agreementLevel === 'consensus')) {
      verified[field] = {
        value: data.derivedValue,
        confidence: data.confidence,
        sources: data.rawValues.map(rv => rv.source),
      };
    }
  });
  
  return verified;
}

/**
 * Get fields requiring manual review
 */
export function getFieldsRequiringReview(result: ConflictResolutionResult): string[] {
  return Object.entries(result.fields)
    .filter(([_, data]) => 
      data.agreementLevel === 'conflict' || 
      data.confidence < 0.6
    )
    .map(([field]) => field);
}
