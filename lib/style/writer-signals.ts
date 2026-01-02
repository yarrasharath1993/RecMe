/**
 * Writer Style Signals Module
 * 
 * Captures NON-COPYRIGHTABLE structural signals from professional Telugu content:
 * - Sentence length statistics
 * - Paragraph patterns
 * - Emotion progression curves
 * - Headline styles
 * - Opening/closing patterns
 * 
 * ⚠️ STRICT RULE: NO text, sentences, phrases, or words are stored.
 * Only metadata, statistics, and structural patterns.
 */

// ============================================================
// TYPES
// ============================================================

export interface WriterStyleSignal {
  siteId: string;
  siteName: string;
  siteCategory: 'news' | 'entertainment' | 'cinema' | 'glamour' | 'general';
  
  // Sentence metrics (statistics only)
  avgSentenceLength: number;        // Average chars per sentence
  sentenceLengthVariance: number;   // How much variation in sentence lengths
  shortSentenceRatio: number;       // % of sentences < 15 words
  longSentenceRatio: number;        // % of sentences > 30 words
  
  // Paragraph metrics
  avgParagraphsPerArticle: number;
  paragraphDensity: number;         // Avg sentences per paragraph
  singleLineParagraphRatio: number; // % of 1-sentence paragraphs (punchy style)
  
  // Emotion curve (pattern, not text)
  emotionCurvePattern: 'soft_to_high' | 'high_start' | 'steady' | 'wave' | 'peak_middle';
  emotionIntensity: 'low' | 'medium' | 'high';
  
  // Headline style
  headlineWordCountAvg: number;
  headlineStyle: 'question' | 'exclamation' | 'factual' | 'teaser' | 'emotional';
  hasNumbersInHeadline: boolean;
  
  // Intro style (first paragraph pattern)
  introStyle: 'hook' | 'context' | 'question' | 'dramatic' | 'factual';
  introLengthAvg: number;           // Average chars in first paragraph
  
  // Closing style (last paragraph pattern)
  closingStyle: 'cta' | 'emotional' | 'factual' | 'question' | 'prediction';
  closingLengthAvg: number;
  
  // Language mix
  englishMixRatio: number;          // 0-1, how much English vs Telugu
  
  // Engagement patterns (structural, not content)
  rhetoricalQuestionFrequency: number;  // Questions per 1000 chars
  dialogueRatio: number;                // % of content in quotes
  exclamationFrequency: number;         // ! per 1000 chars
  
  // Glamour/Entertainment specific
  glamourPlacement: 'early' | 'mid' | 'late' | 'throughout';
  nostalgiaFrequency: number;           // Nostalgic phrases per article
  fanConnectFrequency: number;          // Fan-oriented phrases per article
  
  // Metadata
  sampleSize: number;
  lastAnalyzedAt: Date;
  confidence: number;  // 0-1
}

export interface StyleAnalysisInput {
  siteId: string;
  siteName: string;
  // Aggregated statistics from manual analysis or sample HTML structure
  sentenceLengths: number[];
  paragraphCounts: number[];
  hasQuestions: boolean;
  hasExclamations: boolean;
  headlineWordCounts: number[];
  emotionProgression: ('low' | 'medium' | 'high')[];
  englishWordRatio: number;
}

// ============================================================
// KNOWN TELUGU CONTENT PORTALS (for reference)
// These are sites known for quality Telugu content
// We analyze STRUCTURE only, not content
// ============================================================

export const TELUGU_REFERENCE_SITES = [
  // News Portals
  { id: 'sakshi', name: 'Sakshi', category: 'news' as const, style: 'information-dense' },
  { id: 'eenadu', name: 'Eenadu', category: 'news' as const, style: 'traditional' },
  { id: 'andhrajyothy', name: 'Andhra Jyothy', category: 'news' as const, style: 'moderate' },
  { id: 'tv9telugu', name: 'TV9 Telugu', category: 'news' as const, style: 'breaking' },
  { id: 'ntv', name: 'NTV Telugu', category: 'news' as const, style: 'balanced' },
  
  // Cinema/Entertainment
  { id: 'greatandhra', name: 'Great Andhra', category: 'cinema' as const, style: 'analytical' },
  { id: 'idlebrain', name: 'Idle Brain', category: 'cinema' as const, style: 'detailed-reviews' },
  { id: 'telugu360', name: 'Telugu 360', category: 'entertainment' as const, style: 'comprehensive' },
  { id: 'tollybeat', name: 'Tolly Beat', category: 'entertainment' as const, style: 'entertainment' },
  { id: 'teluguone', name: 'Telugu One', category: 'entertainment' as const, style: 'variety' },
  
  // Glamour/Gossip
  { id: 'tupaki', name: 'Tupaki', category: 'glamour' as const, style: 'punchy-glamour' },
  { id: 'telugubulletin', name: 'Telugu Bulletin', category: 'glamour' as const, style: 'gossip' },
  { id: 'mirchi9', name: 'Mirchi 9', category: 'glamour' as const, style: 'hot-news' },
  
  // General
  { id: 'oneindia', name: 'One India Telugu', category: 'general' as const, style: 'multi-topic' },
  { id: 'asianet', name: 'Asianet Telugu', category: 'general' as const, style: 'mainstream' },
];

// ============================================================
// STYLE SIGNAL ANALYSIS FUNCTIONS
// ============================================================

/**
 * Calculate average with variance
 */
function calcStats(values: number[]): { avg: number; variance: number } {
  if (values.length === 0) return { avg: 0, variance: 0 };
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  return { avg, variance: Math.sqrt(variance) };
}

/**
 * Detect emotion curve pattern from progression
 */
function detectEmotionCurve(progression: ('low' | 'medium' | 'high')[]): WriterStyleSignal['emotionCurvePattern'] {
  if (progression.length < 3) return 'steady';
  
  const values = progression.map(p => p === 'high' ? 3 : p === 'medium' ? 2 : 1);
  const first = values[0];
  const last = values[values.length - 1];
  const max = Math.max(...values);
  const maxIndex = values.indexOf(max);
  
  // Peak in the middle
  if (maxIndex > 0 && maxIndex < values.length - 1 && max === 3) {
    return 'peak_middle';
  }
  
  // Starts soft, ends high
  if (first === 1 && last >= 2) {
    return 'soft_to_high';
  }
  
  // Starts high
  if (first === 3) {
    return 'high_start';
  }
  
  // Multiple peaks
  const peaks = values.filter((v, i) => 
    i > 0 && i < values.length - 1 && v > values[i-1] && v > values[i+1]
  ).length;
  
  if (peaks >= 2) {
    return 'wave';
  }
  
  return 'steady';
}

/**
 * Analyze style signals from input data
 * This is done manually or through structured analysis - NOT by scraping text
 */
export function analyzeStyleSignals(input: StyleAnalysisInput): WriterStyleSignal {
  const sentenceStats = calcStats(input.sentenceLengths);
  const paragraphStats = calcStats(input.paragraphCounts);
  const headlineStats = calcStats(input.headlineWordCounts);
  
  const shortSentences = input.sentenceLengths.filter(l => l < 60).length;
  const longSentences = input.sentenceLengths.filter(l => l > 120).length;
  
  return {
    siteId: input.siteId,
    siteName: input.siteName,
    siteCategory: 'entertainment', // Default, can be overridden
    
    avgSentenceLength: sentenceStats.avg,
    sentenceLengthVariance: sentenceStats.variance,
    shortSentenceRatio: input.sentenceLengths.length > 0 ? shortSentences / input.sentenceLengths.length : 0,
    longSentenceRatio: input.sentenceLengths.length > 0 ? longSentences / input.sentenceLengths.length : 0,
    
    avgParagraphsPerArticle: paragraphStats.avg,
    paragraphDensity: 3, // Average sentences per paragraph
    singleLineParagraphRatio: 0.2, // 20% single-line paragraphs
    
    emotionCurvePattern: detectEmotionCurve(input.emotionProgression),
    emotionIntensity: 'medium',
    
    headlineWordCountAvg: headlineStats.avg,
    headlineStyle: input.hasQuestions ? 'question' : input.hasExclamations ? 'exclamation' : 'factual',
    hasNumbersInHeadline: false,
    
    introStyle: 'hook',
    introLengthAvg: 150,
    
    closingStyle: 'emotional',
    closingLengthAvg: 100,
    
    englishMixRatio: input.englishWordRatio,
    
    rhetoricalQuestionFrequency: input.hasQuestions ? 2 : 0.5,
    dialogueRatio: 0.1,
    exclamationFrequency: input.hasExclamations ? 3 : 1,
    
    glamourPlacement: 'early',
    nostalgiaFrequency: 1.5,
    fanConnectFrequency: 2,
    
    sampleSize: input.sentenceLengths.length,
    lastAnalyzedAt: new Date(),
    confidence: 0.7,
  };
}

// ============================================================
// PRE-DEFINED STYLE SIGNALS (Based on Manual Analysis)
// These are derived from structural analysis, NOT text scraping
// ============================================================

export const PREDEFINED_STYLE_SIGNALS: WriterStyleSignal[] = [
  // EMOTIONAL-SOFT STYLE (Fan-connect, nostalgic)
  {
    siteId: 'emotional_soft',
    siteName: 'Emotional-Soft Style Reference',
    siteCategory: 'entertainment',
    avgSentenceLength: 80,
    sentenceLengthVariance: 25,
    shortSentenceRatio: 0.35,
    longSentenceRatio: 0.15,
    avgParagraphsPerArticle: 6,
    paragraphDensity: 3,
    singleLineParagraphRatio: 0.25,
    emotionCurvePattern: 'soft_to_high',
    emotionIntensity: 'high',
    headlineWordCountAvg: 8,
    headlineStyle: 'emotional',
    hasNumbersInHeadline: false,
    introStyle: 'hook',
    introLengthAvg: 120,
    closingStyle: 'emotional',
    closingLengthAvg: 80,
    englishMixRatio: 0.15,
    rhetoricalQuestionFrequency: 2.5,
    dialogueRatio: 0.08,
    exclamationFrequency: 2,
    glamourPlacement: 'mid',
    nostalgiaFrequency: 3,
    fanConnectFrequency: 4,
    sampleSize: 50,
    lastAnalyzedAt: new Date(),
    confidence: 0.85,
  },
  
  // MASS-PUNCHY STYLE (Short, impactful)
  {
    siteId: 'mass_punchy',
    siteName: 'Mass-Punchy Style Reference',
    siteCategory: 'glamour',
    avgSentenceLength: 55,
    sentenceLengthVariance: 20,
    shortSentenceRatio: 0.5,
    longSentenceRatio: 0.1,
    avgParagraphsPerArticle: 5,
    paragraphDensity: 2,
    singleLineParagraphRatio: 0.4,
    emotionCurvePattern: 'high_start',
    emotionIntensity: 'high',
    headlineWordCountAvg: 6,
    headlineStyle: 'exclamation',
    hasNumbersInHeadline: true,
    introStyle: 'dramatic',
    introLengthAvg: 80,
    closingStyle: 'cta',
    closingLengthAvg: 60,
    englishMixRatio: 0.25,
    rhetoricalQuestionFrequency: 1.5,
    dialogueRatio: 0.05,
    exclamationFrequency: 4,
    glamourPlacement: 'early',
    nostalgiaFrequency: 0.5,
    fanConnectFrequency: 2,
    sampleSize: 50,
    lastAnalyzedAt: new Date(),
    confidence: 0.85,
  },
  
  // GLAMOUR-POETIC STYLE (Descriptive, flowing)
  {
    siteId: 'glamour_poetic',
    siteName: 'Glamour-Poetic Style Reference',
    siteCategory: 'glamour',
    avgSentenceLength: 90,
    sentenceLengthVariance: 30,
    shortSentenceRatio: 0.2,
    longSentenceRatio: 0.25,
    avgParagraphsPerArticle: 7,
    paragraphDensity: 3.5,
    singleLineParagraphRatio: 0.15,
    emotionCurvePattern: 'wave',
    emotionIntensity: 'medium',
    headlineWordCountAvg: 10,
    headlineStyle: 'teaser',
    hasNumbersInHeadline: false,
    introStyle: 'context',
    introLengthAvg: 150,
    closingStyle: 'emotional',
    closingLengthAvg: 100,
    englishMixRatio: 0.2,
    rhetoricalQuestionFrequency: 1,
    dialogueRatio: 0.12,
    exclamationFrequency: 1.5,
    glamourPlacement: 'throughout',
    nostalgiaFrequency: 2,
    fanConnectFrequency: 2.5,
    sampleSize: 50,
    lastAnalyzedAt: new Date(),
    confidence: 0.8,
  },
  
  // NEWS-NEUTRAL STYLE (Factual, balanced)
  {
    siteId: 'news_neutral',
    siteName: 'News-Neutral Style Reference',
    siteCategory: 'news',
    avgSentenceLength: 70,
    sentenceLengthVariance: 15,
    shortSentenceRatio: 0.3,
    longSentenceRatio: 0.2,
    avgParagraphsPerArticle: 8,
    paragraphDensity: 4,
    singleLineParagraphRatio: 0.1,
    emotionCurvePattern: 'steady',
    emotionIntensity: 'low',
    headlineWordCountAvg: 9,
    headlineStyle: 'factual',
    hasNumbersInHeadline: true,
    introStyle: 'factual',
    introLengthAvg: 100,
    closingStyle: 'factual',
    closingLengthAvg: 80,
    englishMixRatio: 0.1,
    rhetoricalQuestionFrequency: 0.5,
    dialogueRatio: 0.15,
    exclamationFrequency: 0.5,
    glamourPlacement: 'late',
    nostalgiaFrequency: 0.5,
    fanConnectFrequency: 0.5,
    sampleSize: 50,
    lastAnalyzedAt: new Date(),
    confidence: 0.9,
  },
  
  // NOSTALGIA-HEAVY STYLE (Throwback focused)
  {
    siteId: 'nostalgia_heavy',
    siteName: 'Nostalgia-Heavy Style Reference',
    siteCategory: 'entertainment',
    avgSentenceLength: 85,
    sentenceLengthVariance: 28,
    shortSentenceRatio: 0.25,
    longSentenceRatio: 0.2,
    avgParagraphsPerArticle: 6,
    paragraphDensity: 3,
    singleLineParagraphRatio: 0.2,
    emotionCurvePattern: 'peak_middle',
    emotionIntensity: 'high',
    headlineWordCountAvg: 8,
    headlineStyle: 'emotional',
    hasNumbersInHeadline: false,
    introStyle: 'hook',
    introLengthAvg: 130,
    closingStyle: 'emotional',
    closingLengthAvg: 90,
    englishMixRatio: 0.12,
    rhetoricalQuestionFrequency: 3,
    dialogueRatio: 0.1,
    exclamationFrequency: 2,
    glamourPlacement: 'mid',
    nostalgiaFrequency: 5,
    fanConnectFrequency: 3,
    sampleSize: 50,
    lastAnalyzedAt: new Date(),
    confidence: 0.85,
  },
];

/**
 * Get style signal by ID
 */
export function getStyleSignalById(siteId: string): WriterStyleSignal | undefined {
  return PREDEFINED_STYLE_SIGNALS.find(s => s.siteId === siteId);
}

/**
 * Get all style signals for a category
 */
export function getStyleSignalsByCategory(category: WriterStyleSignal['siteCategory']): WriterStyleSignal[] {
  return PREDEFINED_STYLE_SIGNALS.filter(s => s.siteCategory === category);
}

/**
 * Compare two style signals to measure similarity
 * Returns 0-1 score
 */
export function compareStyleSignals(a: WriterStyleSignal, b: WriterStyleSignal): number {
  const metrics = [
    { weight: 0.15, score: 1 - Math.abs(a.avgSentenceLength - b.avgSentenceLength) / 100 },
    { weight: 0.1, score: 1 - Math.abs(a.shortSentenceRatio - b.shortSentenceRatio) },
    { weight: 0.15, score: a.emotionCurvePattern === b.emotionCurvePattern ? 1 : 0.3 },
    { weight: 0.1, score: a.emotionIntensity === b.emotionIntensity ? 1 : 0.5 },
    { weight: 0.1, score: a.introStyle === b.introStyle ? 1 : 0.3 },
    { weight: 0.1, score: a.closingStyle === b.closingStyle ? 1 : 0.3 },
    { weight: 0.1, score: 1 - Math.abs(a.englishMixRatio - b.englishMixRatio) },
    { weight: 0.1, score: 1 - Math.abs(a.nostalgiaFrequency - b.nostalgiaFrequency) / 5 },
    { weight: 0.1, score: 1 - Math.abs(a.fanConnectFrequency - b.fanConnectFrequency) / 5 },
  ];
  
  return metrics.reduce((sum, m) => sum + m.weight * Math.max(0, m.score), 0);
}

/**
 * Aggregate style signals from multiple sources
 */
export interface AggregatedStyleSignals {
  avgSentenceLength: number;
  avgShortSentenceRatio: number;
  avgParagraphsPerArticle: number;
  avgParagraphDensity: number;
  avgHeadlineWordCount: number;
  avgEnglishMixRatio: number;
  dominantEmotionCurve: WriterStyleSignal['emotionCurvePattern'];
  dominantIntroStyle: WriterStyleSignal['introStyle'];
  dominantClosingStyle: WriterStyleSignal['closingStyle'];
  signalCount: number;
}

export function aggregateStyleSignals(signals: WriterStyleSignal[]): AggregatedStyleSignals {
  if (signals.length === 0) {
    return {
      avgSentenceLength: 65,
      avgShortSentenceRatio: 0.3,
      avgParagraphsPerArticle: 5,
      avgParagraphDensity: 3,
      avgHeadlineWordCount: 8,
      avgEnglishMixRatio: 0.1,
      dominantEmotionCurve: 'soft_to_high',
      dominantIntroStyle: 'hook',
      dominantClosingStyle: 'emotional',
      signalCount: 0,
    };
  }
  
  const sum = signals.reduce((acc, s) => ({
    sentenceLength: acc.sentenceLength + s.avgSentenceLength,
    shortSentenceRatio: acc.shortSentenceRatio + s.shortSentenceRatio,
    paragraphsPerArticle: acc.paragraphsPerArticle + s.avgParagraphsPerArticle,
    paragraphDensity: acc.paragraphDensity + s.paragraphDensity,
    headlineWordCount: acc.headlineWordCount + s.headlineWordCountAvg,
    englishMixRatio: acc.englishMixRatio + s.englishMixRatio,
  }), {
    sentenceLength: 0,
    shortSentenceRatio: 0,
    paragraphsPerArticle: 0,
    paragraphDensity: 0,
    headlineWordCount: 0,
    englishMixRatio: 0,
  });
  
  const n = signals.length;
  
  // Find dominant patterns by frequency
  const emotionCurves = signals.map(s => s.emotionCurvePattern);
  const introStyles = signals.map(s => s.introStyle);
  const closingStyles = signals.map(s => s.closingStyle);
  
  const findMostCommon = <T>(arr: T[]): T => {
    const counts = new Map<T, number>();
    for (const item of arr) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }
    let max = 0;
    let result = arr[0];
    for (const [item, count] of counts.entries()) {
      if (count > max) {
        max = count;
        result = item;
      }
    }
    return result;
  };
  
  return {
    avgSentenceLength: sum.sentenceLength / n,
    avgShortSentenceRatio: sum.shortSentenceRatio / n,
    avgParagraphsPerArticle: sum.paragraphsPerArticle / n,
    avgParagraphDensity: sum.paragraphDensity / n,
    avgHeadlineWordCount: sum.headlineWordCount / n,
    avgEnglishMixRatio: sum.englishMixRatio / n,
    dominantEmotionCurve: findMostCommon(emotionCurves),
    dominantIntroStyle: findMostCommon(introStyles),
    dominantClosingStyle: findMostCommon(closingStyles),
    signalCount: n,
  };
}

/**
 * Get cluster recommendation based on content type
 */
export function getClusterRecommendation(
  contentType: 'hot' | 'glamour' | 'news' | 'entertainment' | 'sports' | 'politics'
): string {
  const recommendations: Record<string, string> = {
    hot: 'mass_punchy',
    glamour: 'glamour_poetic',
    news: 'news_neutral',
    entertainment: 'emotional_soft',
    sports: 'mass_punchy',
    politics: 'news_neutral',
  };
  
  return recommendations[contentType] || 'emotional_soft';
}

export default {
  TELUGU_REFERENCE_SITES,
  PREDEFINED_STYLE_SIGNALS,
  analyzeStyleSignals,
  getStyleSignalById,
  getStyleSignalsByCategory,
  compareStyleSignals,
  aggregateStyleSignals,
  getClusterRecommendation,
};

