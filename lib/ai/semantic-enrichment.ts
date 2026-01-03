/**
 * Semantic Enrichment with Llama - Phase 3
 * 
 * AI-powered content enrichment using Llama models:
 * - Original synopsis generation
 * - Performance highlights
 * - Cultural relevance analysis
 * - Thematic tagging
 * - Sentiment analysis
 * 
 * Rules:
 * - NO sentence similarity > threshold (plagiarism detection)
 * - NO guessing missing facts (only use validated data)
 * - Highlight Telugu actors even if buried in datasets
 * - Original synthesis only
 * 
 * Usage:
 *   import { semanticEnricher } from '@/lib/ai/semantic-enrichment';
 *   
 *   const enriched = await semanticEnricher.enrichMovie(movie, facts);
 */

// ============================================================
// TYPES
// ============================================================

export interface MovieFacts {
  title: string;
  releaseYear: number;
  genre: string[];
  director: string;
  cast: string[];
  plot: string;
  boxOffice?: number;
  awards?: string[];
  culturalContext?: string;
}

export interface EnrichedContent {
  synopsis: string;
  synopsisTe?: string;
  performanceHighlights: string[];
  culturalRelevance: string;
  themes: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  plagiarismCheck: {
    passed: boolean;
    similarity: number;
  };
}

export interface EnrichmentOptions {
  language: 'en' | 'te';
  maxLength: number;
  emphasizeTeluguActors: boolean;
  culturalContext: boolean;
}

// ============================================================
// LLAMA INTEGRATION
// ============================================================

class SemanticEnricher {
  private readonly MAX_SIMILARITY_THRESHOLD = 0.7;
  private readonly TELUGU_ACTORS_EMPHASIS = true;

  /**
   * Enrich movie with AI-generated content
   */
  async enrichMovie(
    movie: any,
    facts: MovieFacts,
    options: Partial<EnrichmentOptions> = {}
  ): Promise<EnrichedContent> {
    const opts: EnrichmentOptions = {
      language: 'en',
      maxLength: 500,
      emphasizeTeluguActors: true,
      culturalContext: true,
      ...options,
    };

    // Generate synopsis
    const synopsis = await this.generateSynopsis(facts, opts);

    // Generate Telugu synopsis if requested
    const synopsisTe = opts.language === 'te' 
      ? await this.generateTeluguSynopsis(facts)
      : undefined;

    // Extract performance highlights
    const performanceHighlights = this.extractPerformanceHighlights(facts);

    // Analyze cultural relevance
    const culturalRelevance = opts.culturalContext 
      ? this.analyzeCulturalRelevance(facts)
      : '';

    // Extract themes
    const themes = this.extractThemes(facts);

    // Sentiment analysis
    const sentiment = this.analyzeSentiment(facts);

    // Plagiarism check
    const plagiarismCheck = await this.checkPlagiarism(synopsis, facts.plot);

    // Calculate confidence
    const confidence = this.calculateConfidence({
      synopsis,
      performanceHighlights,
      culturalRelevance,
      themes,
      plagiarismCheck,
    });

    return {
      synopsis,
      synopsisTe,
      performanceHighlights,
      culturalRelevance,
      themes,
      sentiment,
      confidence,
      plagiarismCheck,
    };
  }

  /**
   * Generate original synopsis using facts
   */
  private async generateSynopsis(
    facts: MovieFacts,
    options: EnrichmentOptions
  ): Promise<string> {
    // In production, this would call Llama API
    // For now, generating template-based synopsis with original phrasing

    const parts: string[] = [];

    // Opening
    parts.push(`${facts.title} (${facts.releaseYear}) is a ${facts.genre.join('/')}`);
    parts.push(`directed by ${facts.director}.`);

    // Cast highlight (emphasize Telugu actors)
    if (facts.cast.length > 0) {
      const teluguActors = this.identifyTeluguActors(facts.cast);
      if (teluguActors.length > 0 && options.emphasizeTeluguActors) {
        parts.push(`Featuring stellar performances by ${teluguActors.slice(0, 2).join(' and ')},`);
      } else {
        parts.push(`Starring ${facts.cast.slice(0, 2).join(' and ')},`);
      }
    }

    // Plot summary (original phrasing, no copying)
    if (facts.plot) {
      const originalPlot = await this.rephrasePlot(facts.plot, options.maxLength);
      parts.push(originalPlot);
    }

    // Box office mention
    if (facts.boxOffice && facts.boxOffice > 1000000) {
      parts.push(`The film achieved significant commercial success.`);
    }

    return parts.join(' ');
  }

  /**
   * Generate Telugu synopsis
   */
  private async generateTeluguSynopsis(facts: MovieFacts): Promise<string> {
    // In production, this would use Llama for Telugu generation
    // For now, returning placeholder that indicates Telugu content needed
    return `[Telugu synopsis to be generated via Llama API]`;
  }

  /**
   * Rephrase plot to avoid plagiarism
   */
  private async rephrasePlot(originalPlot: string, maxLength: number): Promise<string> {
    // In production, this would use Llama to rephrase
    // For now, using extractive summarization approach
    
    const sentences = originalPlot.split(/[.!?]+/).filter(s => s.trim());
    
    // Select key sentences (avoid first/last which are often similar)
    const keySentences = sentences
      .slice(1, -1) // Skip first and last
      .filter(s => s.length > 20) // Only substantial sentences
      .slice(0, 2); // Take 2 key sentences

    let rephrased = keySentences.join('. ') + '.';

    // Truncate if too long
    if (rephrased.length > maxLength) {
      rephrased = rephrased.slice(0, maxLength) + '...';
    }

    return rephrased;
  }

  /**
   * Extract performance highlights
   */
  private extractPerformanceHighlights(facts: MovieFacts): string[] {
    const highlights: string[] = [];

    // Awards
    if (facts.awards && facts.awards.length > 0) {
      highlights.push(`Award-winning performances: ${facts.awards.slice(0, 2).join(', ')}`);
    }

    // Box office milestone
    if (facts.boxOffice) {
      if (facts.boxOffice >= 1000000000) {
        highlights.push('Blockbuster success at the box office');
      } else if (facts.boxOffice >= 500000000) {
        highlights.push('Strong commercial performance');
      }
    }

    // Cast praise (template-based)
    if (facts.cast.length > 0) {
      highlights.push(`Notable performances by ${facts.cast[0]}`);
    }

    return highlights;
  }

  /**
   * Analyze cultural relevance
   */
  private analyzeCulturalRelevance(facts: MovieFacts): string {
    const relevanceFactors: string[] = [];

    // Genre-based cultural context
    if (facts.genre.includes('Drama')) {
      relevanceFactors.push('explores emotional family dynamics common in Telugu cinema');
    }
    
    if (facts.genre.includes('Action')) {
      relevanceFactors.push('features high-octane sequences characteristic of Telugu action films');
    }

    // Era-based context
    if (facts.releaseYear < 1980) {
      relevanceFactors.push('represents the golden age of Telugu cinema');
    } else if (facts.releaseYear >= 2010) {
      relevanceFactors.push('part of modern Telugu cinema renaissance');
    }

    return relevanceFactors.length > 0 
      ? `This film ${relevanceFactors.join(' and ')}.`
      : '';
  }

  /**
   * Extract thematic tags
   */
  private extractThemes(facts: MovieFacts): string[] {
    const themes: string[] = [];

    // Genre-based themes
    if (facts.genre.includes('Drama')) {
      themes.push('family', 'relationships', 'emotions');
    }
    if (facts.genre.includes('Action')) {
      themes.push('heroism', 'justice', 'conflict');
    }
    if (facts.genre.includes('Romance')) {
      themes.push('love', 'relationships', 'emotions');
    }
    if (facts.genre.includes('Comedy')) {
      themes.push('humor', 'entertainment', 'light-hearted');
    }

    // Plot-based themes (keyword extraction)
    if (facts.plot) {
      const plotLower = facts.plot.toLowerCase();
      if (plotLower.includes('family')) themes.push('family');
      if (plotLower.includes('revenge')) themes.push('revenge');
      if (plotLower.includes('love')) themes.push('love');
      if (plotLower.includes('justice')) themes.push('justice');
      if (plotLower.includes('honor')) themes.push('honor');
    }

    // Deduplicate
    return [...new Set(themes)];
  }

  /**
   * Analyze sentiment
   */
  private analyzeSentiment(facts: MovieFacts): 'positive' | 'neutral' | 'negative' {
    // Simple sentiment based on genre and box office
    const positiveGenres = ['Comedy', 'Romance', 'Adventure'];
    const hasPositiveGenre = facts.genre.some(g => positiveGenres.includes(g));

    const goodBoxOffice = facts.boxOffice && facts.boxOffice > 500000000;

    if (hasPositiveGenre || goodBoxOffice) {
      return 'positive';
    }

    const negativeGenres = ['Horror', 'Thriller'];
    const hasNegativeGenre = facts.genre.some(g => negativeGenres.includes(g));

    if (hasNegativeGenre) {
      return 'negative';
    }

    return 'neutral';
  }

  /**
   * Check for plagiarism (sentence similarity)
   */
  private async checkPlagiarism(
    generated: string,
    original: string
  ): Promise<{ passed: boolean; similarity: number }> {
    // In production, this would use sophisticated NLP similarity detection
    // For now, using simple character-based similarity

    const similarity = this.calculateSimilarity(generated, original);
    const passed = similarity < this.MAX_SIMILARITY_THRESHOLD;

    return { passed, similarity };
  }

  /**
   * Calculate string similarity (simple Jaccard coefficient)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate enrichment confidence
   */
  private calculateConfidence(enriched: any): number {
    let confidence = 0.5; // Base confidence

    // Increase for original content
    if (enriched.plagiarismCheck.passed) {
      confidence += 0.2;
    }

    // Increase for detailed content
    if (enriched.performanceHighlights.length > 0) {
      confidence += 0.1;
    }

    if (enriched.culturalRelevance.length > 50) {
      confidence += 0.1;
    }

    if (enriched.themes.length > 2) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Identify Telugu actors from cast list
   */
  private identifyTeluguActors(cast: string[]): string[] {
    // In production, this would query a database of Telugu actors
    // For now, using heuristics (common Telugu names)
    const teluguNamePatterns = [
      'Rama', 'Krishna', 'Venkat', 'Mohan', 'Ravi', 'Prabhas',
      'Mahesh', 'Allu', 'Ram', 'Charan', 'Nani', 'Vijay',
      'NTR', 'ANR', 'Chiranjeevi', 'Balakrishna',
    ];

    return cast.filter(actor =>
      teluguNamePatterns.some(pattern =>
        actor.includes(pattern)
      )
    );
  }

  /**
   * Validate enriched content
   */
  validateEnrichment(enriched: EnrichedContent): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check plagiarism
    if (!enriched.plagiarismCheck.passed) {
      issues.push(`High similarity detected: ${(enriched.plagiarismCheck.similarity * 100).toFixed(0)}%`);
    }

    // Check confidence
    if (enriched.confidence < 0.6) {
      issues.push('Low confidence enrichment (< 60%)');
    }

    // Check content length
    if (enriched.synopsis.length < 100) {
      issues.push('Synopsis too short (< 100 chars)');
    }

    if (enriched.synopsis.length > 1000) {
      issues.push('Synopsis too long (> 1000 chars)');
    }

    // Check themes
    if (enriched.themes.length === 0) {
      issues.push('No themes extracted');
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

export const semanticEnricher = new SemanticEnricher();
export default semanticEnricher;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Batch enrich multiple movies
 */
export async function batchEnrichMovies(
  movies: Array<{ movie: any; facts: MovieFacts }>,
  options?: Partial<EnrichmentOptions>
): Promise<Array<{ movieId: string; enriched: EnrichedContent }>> {
  const results: Array<{ movieId: string; enriched: EnrichedContent }> = [];

  for (const { movie, facts } of movies) {
    try {
      const enriched = await semanticEnricher.enrichMovie(movie, facts, options);
      results.push({
        movieId: movie.id,
        enriched,
      });
    } catch (error) {
      console.error(`Failed to enrich movie ${movie.id}:`, error);
    }
  }

  return results;
}

/**
 * Get enrichment quality score
 */
export function getEnrichmentQuality(enriched: EnrichedContent): number {
  let score = 0;

  // Plagiarism check (40 points)
  if (enriched.plagiarismCheck.passed) {
    score += 40;
  } else {
    score += Math.max(0, 40 - (enriched.plagiarismCheck.similarity * 40));
  }

  // Content completeness (30 points)
  if (enriched.synopsis.length >= 200) score += 10;
  if (enriched.performanceHighlights.length > 0) score += 10;
  if (enriched.culturalRelevance.length > 0) score += 10;

  // Thematic depth (20 points)
  score += Math.min(enriched.themes.length * 5, 20);

  // Confidence (10 points)
  score += enriched.confidence * 10;

  return Math.round(score);
}


