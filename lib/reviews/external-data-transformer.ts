/**
 * EXTERNAL DATA TRANSFORMER
 * 
 * Transforms raw external data (Wikipedia, Google KG, OMDb) into structured
 * review sections using templates. This reduces AI token usage by ~70%.
 * 
 * Flow:
 * 1. Extract key facts from raw text (Wikipedia synopsis: 1000+ words → key facts)
 * 2. Apply template patterns to structure the content
 * 3. Output matches EditorialReview format
 * 4. AI only refines/translates the pre-structured content
 */

import type { MultiSourceMovieData } from './multi-source-data';
import type { EditorialReview } from './editorial-review-generator';

// ============================================================
// TYPES
// ============================================================

export interface TransformedSection {
  source: 'wikipedia' | 'omdb' | 'google_kg' | 'wikidata' | 'tmdb' | 'template';
  content: string;
  contentTe?: string;
  confidence: number;
  needsAiRefinement: boolean;
  wordCount: number;
}

export interface TransformedReviewData {
  synopsis?: TransformedSection;
  reception?: TransformedSection;
  culturalImpact?: TransformedSection;
  awards?: {
    source: string;
    structured: Array<{ award: string; year?: number; category?: string }>;
    rawText?: string;
  };
  ratings?: {
    imdb?: number;
    rottenTomatoes?: string;
    metacritic?: number;
    tmdb?: number;
    aggregated?: number;
  };
  enrichmentSources: Record<string, string>;
  aiSectionsNeeded: string[];
}

// ============================================================
// SYNOPSIS EXTRACTION PATTERNS
// ============================================================

/**
 * Extract key story elements from Wikipedia plot
 * Goal: Reduce 1000+ words to 200-250 words while preserving:
 * - Protagonist identity
 * - Core conflict/premise
 * - Genre-appropriate stakes
 * - NO spoilers (skip ending details)
 */
function extractSynopsisFromWikipedia(
  rawPlot: string,
  movieData: { title: string; hero?: string; heroine?: string; genres?: string[] }
): TransformedSection {
  // Clean Wikipedia markup remnants
  let cleaned = rawPlot
    .replace(/\[\d+\]/g, '') // Remove citation markers [1], [2]
    .replace(/\{\{.*?\}\}/g, '') // Remove template markers
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  const totalWords = cleaned.split(/\s+/).length;

  // Strategy: Take first 40% of plot (usually setup without spoilers)
  // Then summarize key points
  const targetWordCount = 220;
  let extractedWords = 0;
  const selectedSentences: string[] = [];

  // First pass: Get opening sentences (usually safe, no spoilers)
  const openingSentenceLimit = Math.min(6, Math.ceil(sentences.length * 0.3));
  for (let i = 0; i < openingSentenceLimit && extractedWords < targetWordCount; i++) {
    const sentence = sentences[i];
    const words = sentence.split(/\s+/).length;
    
    // Skip sentences that might contain spoilers
    const spoilerKeywords = [
      'kills', 'dies', 'death', 'murdered', 'reveals', 'twist',
      'finally', 'eventually', 'in the end', 'climax', 'ending'
    ];
    
    if (spoilerKeywords.some(kw => sentence.toLowerCase().includes(kw))) {
      continue;
    }

    selectedSentences.push(sentence);
    extractedWords += words;
  }

  // If we need more content, add character introductions
  if (extractedWords < 150 && movieData.hero) {
    const heroMention = sentences.find(s => 
      s.toLowerCase().includes(movieData.hero?.toLowerCase() || '') &&
      !selectedSentences.includes(s)
    );
    if (heroMention) {
      selectedSentences.push(heroMention);
      extractedWords += heroMention.split(/\s+/).length;
    }
  }

  const extracted = selectedSentences.join(' ').trim();

  return {
    source: 'wikipedia',
    content: extracted || rawPlot.substring(0, 800), // Fallback to first 800 chars
    confidence: extracted.length > 200 ? 0.85 : 0.7,
    needsAiRefinement: true, // AI will polish and translate
    wordCount: extracted.split(/\s+/).length,
  };
}

// ============================================================
// RECEPTION EXTRACTION
// ============================================================

/**
 * Extract critics/audience reception from Wikipedia
 * Goal: Get consensus view, specific quotes, and ratings
 */
function extractReceptionFromWikipedia(rawReception: string): TransformedSection {
  // Clean and split into sentences
  const cleaned = rawReception
    .replace(/\[\d+\]/g, '')
    .replace(/\{\{.*?\}\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  
  // Look for key reception indicators
  const criticsKeywords = ['critics', 'praised', 'criticized', 'reviewed', 'reception', 'audiences'];
  const ratingKeywords = ['rated', 'score', 'stars', 'out of', 'percent', '%'];
  
  const relevantSentences: string[] = [];
  
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    
    // Include sentences about critical reception
    if (criticsKeywords.some(kw => lower.includes(kw))) {
      relevantSentences.push(sentence);
    }
    
    // Include rating information
    if (ratingKeywords.some(kw => lower.includes(kw))) {
      relevantSentences.push(sentence);
    }
    
    // Stop at ~150 words
    if (relevantSentences.join(' ').split(/\s+/).length > 150) break;
  }

  const extracted = relevantSentences.join(' ').trim();

  return {
    source: 'wikipedia',
    content: extracted || cleaned.substring(0, 500),
    confidence: extracted.length > 100 ? 0.8 : 0.6,
    needsAiRefinement: true,
    wordCount: extracted.split(/\s+/).length,
  };
}

// ============================================================
// CULTURAL IMPACT / LEGACY EXTRACTION
// ============================================================

/**
 * Extract cultural significance and legacy from Wikipedia
 */
function extractLegacyFromWikipedia(rawLegacy: string): TransformedSection {
  const cleaned = rawLegacy
    .replace(/\[\d+\]/g, '')
    .replace(/\{\{.*?\}\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  
  // Keywords indicating cultural significance
  const impactKeywords = [
    'iconic', 'landmark', 'influential', 'milestone', 'remembered',
    'celebrated', 'classic', 'cult', 'phenomenon', 'box office',
    'highest-grossing', 'blockbuster', 'award', 'recognition',
    'tribute', 'remake', 'inspired', 'legacy'
  ];
  
  const relevantSentences: string[] = [];
  
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    
    if (impactKeywords.some(kw => lower.includes(kw))) {
      relevantSentences.push(sentence);
    }
    
    if (relevantSentences.join(' ').split(/\s+/).length > 120) break;
  }

  const extracted = relevantSentences.join(' ').trim();

  return {
    source: 'wikipedia',
    content: extracted || cleaned.substring(0, 400),
    confidence: extracted.length > 80 ? 0.8 : 0.6,
    needsAiRefinement: true,
    wordCount: extracted.split(/\s+/).length,
  };
}

// ============================================================
// GOOGLE KG CONTEXT EXTRACTION
// ============================================================

/**
 * Extract useful context from Google Knowledge Graph description
 */
function extractFromGoogleKG(description: string): TransformedSection {
  // Google KG descriptions are usually concise
  const cleaned = description.trim();
  
  return {
    source: 'google_kg',
    content: cleaned,
    confidence: 0.75,
    needsAiRefinement: cleaned.length < 50, // Short descriptions need expansion
    wordCount: cleaned.split(/\s+/).length,
  };
}

// ============================================================
// AWARDS STRUCTURING
// ============================================================

interface StructuredAward {
  award: string;
  year?: number;
  category?: string;
}

/**
 * Parse and structure awards from OMDb and Wikidata
 */
function structureAwards(
  omdbAwards?: string,
  wikidataAwards?: Array<{ award_name: string; year?: number; result?: string }>
): TransformedReviewData['awards'] {
  const structured: StructuredAward[] = [];
  
  // Process Wikidata structured awards
  if (wikidataAwards && wikidataAwards.length > 0) {
    for (const award of wikidataAwards) {
      structured.push({
        award: award.award_name,
        year: award.year,
        category: award.result === 'won' ? 'Won' : 'Nominated',
      });
    }
  }
  
  // Parse OMDb awards text
  if (omdbAwards && omdbAwards !== 'N/A') {
    // Examples: "Won 3 Oscars", "5 wins & 10 nominations"
    const oscarMatch = omdbAwards.match(/Won (\d+) Oscar/i);
    if (oscarMatch) {
      structured.push({
        award: 'Academy Award (Oscar)',
        category: 'Won',
      });
    }
    
    const winsMatch = omdbAwards.match(/(\d+) win/i);
    const nomsMatch = omdbAwards.match(/(\d+) nomination/i);
    
    // Don't duplicate - OMDb is raw text backup
  }

  return {
    source: wikidataAwards && wikidataAwards.length > 0 ? 'wikidata' : 'omdb',
    structured,
    rawText: omdbAwards,
  };
}

// ============================================================
// MAIN TRANSFORMER
// ============================================================

/**
 * Transform multi-source data into structured review sections
 * This is called BEFORE AI generation to pre-structure content
 */
export function transformExternalData(
  multiSource: MultiSourceMovieData,
  movieData: {
    title: string;
    titleTe?: string;
    hero?: string;
    heroine?: string;
    genres?: string[];
    releaseYear?: number;
  }
): TransformedReviewData {
  const result: TransformedReviewData = {
    enrichmentSources: {},
    aiSectionsNeeded: [],
  };

  // 1. Synopsis from Wikipedia
  if (multiSource.synopsis?.text) {
    result.synopsis = extractSynopsisFromWikipedia(
      multiSource.synopsis.text,
      { title: movieData.title, hero: movieData.hero, heroine: movieData.heroine, genres: movieData.genres }
    );
    result.enrichmentSources['synopsis'] = multiSource.synopsis.source;
  } else {
    result.aiSectionsNeeded.push('synopsis');
  }

  // 2. Reception from Wikipedia
  if (multiSource.reception?.text) {
    result.reception = extractReceptionFromWikipedia(multiSource.reception.text);
    result.enrichmentSources['reception'] = 'wikipedia';
  } else {
    result.aiSectionsNeeded.push('perspectives');
  }

  // 3. Cultural Impact / Legacy
  if (multiSource.legacy?.text) {
    result.culturalImpact = extractLegacyFromWikipedia(multiSource.legacy.text);
    result.enrichmentSources['cultural_impact'] = 'wikipedia';
  } else if (multiSource.synopsis?.source === 'google_kg') {
    // Use Google KG description as fallback context
    result.culturalImpact = extractFromGoogleKG(multiSource.synopsis.text);
    result.enrichmentSources['cultural_impact'] = 'google_kg';
  } else {
    result.aiSectionsNeeded.push('cultural_impact');
  }

  // 4. Awards
  const wikidataAwards = multiSource.awards?.structured?.map(a => ({
    award_name: typeof a === 'string' ? a : a.award || a.award_name || '',
    year: typeof a === 'object' ? a.year : undefined,
    result: typeof a === 'object' ? a.result : 'won',
  }));
  
  if ((wikidataAwards && wikidataAwards.length > 0) || multiSource.awards?.rawText) {
    result.awards = structureAwards(multiSource.awards?.rawText, wikidataAwards);
    result.enrichmentSources['awards'] = result.awards.source;
  }

  // 5. Ratings (pass through)
  if (multiSource.ratings) {
    result.ratings = {
      imdb: multiSource.ratings.imdb,
      rottenTomatoes: multiSource.ratings.rottenTomatoes,
      metacritic: multiSource.ratings.metacritic,
      tmdb: multiSource.ratings.tmdb,
    };
    
    // Calculate aggregated rating
    const validRatings: number[] = [];
    if (multiSource.ratings.imdb) validRatings.push(multiSource.ratings.imdb);
    if (multiSource.ratings.tmdb) validRatings.push(multiSource.ratings.tmdb);
    if (multiSource.ratings.metacritic) validRatings.push(multiSource.ratings.metacritic / 10);
    
    if (validRatings.length > 0) {
      result.ratings.aggregated = validRatings.reduce((a, b) => a + b, 0) / validRatings.length;
    }
    
    result.enrichmentSources['ratings'] = 'multi_source';
  }

  // Determine which sections AI must generate from scratch
  const alwaysAiSections = [
    'story_screenplay',
    'performances',
    'direction_technicals',
    'why_watch',
    'why_skip',
    'verdict',
  ];
  
  result.aiSectionsNeeded = [...new Set([...result.aiSectionsNeeded, ...alwaysAiSections])];

  return result;
}

// ============================================================
// TEMPLATE APPLICATION
// ============================================================

/**
 * Apply Telugu templates to transformed content
 * Uses patterns from template-reviews.ts and atomic-blocks.ts
 */
export function applyTemplatePatterns(
  transformed: TransformedReviewData,
  movieData: {
    title: string;
    titleTe?: string;
    hero?: string;
    director?: string;
    genres?: string[];
  }
): TransformedReviewData {
  // Apply genre-specific analysis templates
  const primaryGenre = movieData.genres?.[0] || 'Drama';
  
  // Template for synopsis intro (Telugu)
  if (transformed.synopsis && !transformed.synopsis.contentTe) {
    const heroName = movieData.hero || movieData.title;
    const directorName = movieData.director || 'దర్శకుడు';
    
    // Apply hook template pattern
    const hookTemplate = `${directorName} దర్శకత్వంలో, ${heroName} ప్రధాన పాత్రలో నటించిన ఈ ${primaryGenre} చిత్రం...`;
    
    transformed.synopsis.contentTe = hookTemplate;
    // AI will complete and refine this
  }

  return transformed;
}

// ============================================================
// EXPORTS
// ============================================================

export {
  extractSynopsisFromWikipedia,
  extractReceptionFromWikipedia,
  extractLegacyFromWikipedia,
  extractFromGoogleKG,
  structureAwards,
};

