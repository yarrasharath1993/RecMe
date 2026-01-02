/**
 * Confidence Scoring & No-AI Gate
 * 
 * This module determines:
 * 1. Whether template-only content is good enough to publish
 * 2. When AI assistance might be needed (rare cases only)
 * 3. Quality thresholds that block poor content
 * 
 * The goal is to MINIMIZE AI usage by having strong templates.
 */

import { calculateTeluguEmotionScore } from '../validation/telugu-emotion';
import { extractPatterns, PatternExtraction } from './ai-teacher';
import { StyleCluster, getClusterById } from './style-clusters';

// ============================================================
// TYPES
// ============================================================

export interface ConfidenceResult {
  score: number;
  status: 'READY' | 'NEEDS_REFINEMENT' | 'NEEDS_AI_HELP' | 'REJECTED';
  factors: ConfidenceFactor[];
  recommendation: string;
  canPublish: boolean;
  needsAI: boolean;
}

export interface ConfidenceFactor {
  name: string;
  score: number;
  weight: number;
  weightedScore: number;
  feedback: string;
}

export interface ContentForScoring {
  content: string;
  title?: string;
  clusterId?: string;
  contentType: 'hot' | 'news' | 'glamour' | 'sports' | 'politics' | 'entertainment';
}

// ============================================================
// THRESHOLDS
// ============================================================

export const THRESHOLDS = {
  // Score thresholds
  READY: 75,           // Auto-publish
  REFINEMENT: 50,      // Template variants, no AI
  AI_HELP: 30,         // Consider AI assistance (rare)
  REJECTED: 0,         // Too poor quality
  
  // Factor thresholds
  MIN_CONTENT_LENGTH: 200,
  MAX_CONTENT_LENGTH: 1500,
  OPTIMAL_CONTENT_LENGTH: { min: 400, max: 800 },
  MIN_TELUGU_PURITY: 0.5,
  MIN_EMOTION_SCORE: 30,
  MIN_PUNCHY_RATIO: 0.15,
  MAX_SENTENCE_LENGTH: 150,
};

// ============================================================
// CONFIDENCE SCORING
// ============================================================

/**
 * Calculate confidence score for template-generated content
 */
export function calculateConfidence(input: ContentForScoring): ConfidenceResult {
  const factors: ConfidenceFactor[] = [];
  
  const patterns = extractPatterns(input.content);
  const emotionResult = calculateTeluguEmotionScore(input.content);
  const cluster = input.clusterId ? getClusterById(input.clusterId) : undefined;
  
  // Factor 1: Content Length (weight: 0.15)
  const lengthFactor = scoreLengthFactor(input.content.length);
  factors.push(lengthFactor);
  
  // Factor 2: Telugu Purity (weight: 0.20)
  const teluguFactor = scoreTeluguPurity(patterns.teluguPurity);
  factors.push(teluguFactor);
  
  // Factor 3: Emotional Resonance (weight: 0.25)
  const emotionFactor = scoreEmotionalResonance(emotionResult.score, input.contentType);
  factors.push(emotionFactor);
  
  // Factor 4: Structure Quality (weight: 0.15)
  const structureFactor = scoreStructure(patterns);
  factors.push(structureFactor);
  
  // Factor 5: Opening Impact (weight: 0.10)
  const openingFactor = scoreOpening(patterns, input.content);
  factors.push(openingFactor);
  
  // Factor 6: Closing Strength (weight: 0.10)
  const closingFactor = scoreClosing(patterns, input.content);
  factors.push(closingFactor);
  
  // Factor 7: Style Cluster Match (weight: 0.05)
  const clusterFactor = scoreClusterMatch(patterns, cluster);
  factors.push(clusterFactor);
  
  // Calculate weighted total
  const totalScore = factors.reduce((sum, f) => sum + f.weightedScore, 0);
  
  // Determine status
  let status: ConfidenceResult['status'] = 'REJECTED';
  let recommendation = '';
  let canPublish = false;
  let needsAI = false;
  
  if (totalScore >= THRESHOLDS.READY) {
    status = 'READY';
    recommendation = 'Content is ready for publication. No AI needed.';
    canPublish = true;
    needsAI = false;
  } else if (totalScore >= THRESHOLDS.REFINEMENT) {
    status = 'NEEDS_REFINEMENT';
    recommendation = 'Content needs template refinement. Try different block variants.';
    canPublish = false;
    needsAI = false;
  } else if (totalScore >= THRESHOLDS.AI_HELP) {
    status = 'NEEDS_AI_HELP';
    recommendation = 'Content is weak. Consider AI-assisted improvement (optional).';
    canPublish = false;
    needsAI = true;
  } else {
    status = 'REJECTED';
    recommendation = 'Content is too poor. Regenerate with different template.';
    canPublish = false;
    needsAI = false;
  }
  
  return {
    score: Math.round(totalScore),
    status,
    factors,
    recommendation,
    canPublish,
    needsAI,
  };
}

// ============================================================
// FACTOR SCORING FUNCTIONS
// ============================================================

function scoreLengthFactor(length: number): ConfidenceFactor {
  const weight = 0.15;
  let score = 0;
  let feedback = '';
  
  if (length < THRESHOLDS.MIN_CONTENT_LENGTH) {
    score = 20;
    feedback = `Content too short (${length} chars). Minimum is ${THRESHOLDS.MIN_CONTENT_LENGTH}.`;
  } else if (length > THRESHOLDS.MAX_CONTENT_LENGTH) {
    score = 60;
    feedback = `Content too long (${length} chars). Consider trimming.`;
  } else if (length >= THRESHOLDS.OPTIMAL_CONTENT_LENGTH.min && 
             length <= THRESHOLDS.OPTIMAL_CONTENT_LENGTH.max) {
    score = 100;
    feedback = 'Content length is optimal.';
  } else {
    score = 80;
    feedback = 'Content length is acceptable.';
  }
  
  return {
    name: 'Content Length',
    score,
    weight,
    weightedScore: score * weight,
    feedback,
  };
}

function scoreTeluguPurity(purity: number): ConfidenceFactor {
  const weight = 0.20;
  const percentage = purity * 100;
  let score = 0;
  let feedback = '';
  
  if (purity >= 0.8) {
    score = 100;
    feedback = `Excellent Telugu purity (${percentage.toFixed(0)}%)`;
  } else if (purity >= 0.6) {
    score = 80;
    feedback = `Good Telugu purity (${percentage.toFixed(0)}%)`;
  } else if (purity >= THRESHOLDS.MIN_TELUGU_PURITY) {
    score = 60;
    feedback = `Acceptable Telugu purity (${percentage.toFixed(0)}%). Consider reducing English.`;
  } else {
    score = 30;
    feedback = `Low Telugu purity (${percentage.toFixed(0)}%). Too much English/Roman text.`;
  }
  
  return {
    name: 'Telugu Purity',
    score,
    weight,
    weightedScore: score * weight,
    feedback,
  };
}

function scoreEmotionalResonance(
  emotionScore: number,
  contentType: ContentForScoring['contentType']
): ConfidenceFactor {
  const weight = 0.25;
  
  // Different content types need different emotion levels
  const emotionTargets: Record<string, number> = {
    hot: 40,        // Moderate excitement
    glamour: 45,    // Appreciation, admiration
    entertainment: 50, // High engagement
    sports: 55,     // Excitement, pride
    politics: 35,   // Measured, analytical
    news: 30,       // Neutral to moderate
  };
  
  const target = emotionTargets[contentType] || 40;
  const distance = Math.abs(emotionScore - target);
  
  let score = 0;
  let feedback = '';
  
  if (emotionScore >= THRESHOLDS.MIN_EMOTION_SCORE) {
    if (distance <= 15) {
      score = 100;
      feedback = `Emotion score (${emotionScore}) perfect for ${contentType} content.`;
    } else if (distance <= 25) {
      score = 80;
      feedback = `Emotion score (${emotionScore}) good for ${contentType} content.`;
    } else {
      score = 60;
      feedback = `Emotion score (${emotionScore}) slightly off for ${contentType}. Target: ${target}.`;
    }
  } else {
    score = 30;
    feedback = `Low emotional resonance (${emotionScore}). Add fan-connect or cultural elements.`;
  }
  
  return {
    name: 'Emotional Resonance',
    score,
    weight,
    weightedScore: score * weight,
    feedback,
  };
}

function scoreStructure(patterns: PatternExtraction): ConfidenceFactor {
  const weight = 0.15;
  let score = 0;
  let feedback = '';
  
  const checks = {
    hasParagraphs: patterns.paragraphCounts.length >= 2,
    hasPunchySentences: patterns.punchySentenceRatio >= THRESHOLDS.MIN_PUNCHY_RATIO,
    hasRhetoricalQ: patterns.hasRhetoricalQuestion,
    sentencesNotTooLong: patterns.sentenceLengths.every(l => l <= THRESHOLDS.MAX_SENTENCE_LENGTH),
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  
  score = (passedChecks / totalChecks) * 100;
  
  const issues: string[] = [];
  if (!checks.hasParagraphs) issues.push('needs more paragraphs');
  if (!checks.hasPunchySentences) issues.push('add shorter punchy sentences');
  if (!checks.sentencesNotTooLong) issues.push('some sentences too long');
  
  if (issues.length === 0) {
    feedback = 'Structure is well-organized.';
  } else {
    feedback = `Structure issues: ${issues.join(', ')}.`;
  }
  
  return {
    name: 'Structure Quality',
    score,
    weight,
    weightedScore: score * weight,
    feedback,
  };
}

function scoreOpening(patterns: PatternExtraction, content: string): ConfidenceFactor {
  const weight = 0.10;
  let score = 0;
  let feedback = '';
  
  const firstLine = content.split(/[।.!?\n]/)[0] || '';
  const firstLineLength = firstLine.trim().length;
  
  // Good openings are punchy and engaging
  if (patterns.openingStyle === 'hook' && firstLineLength < 60) {
    score = 100;
    feedback = 'Strong hook opening.';
  } else if (patterns.openingStyle === 'question') {
    score = 90;
    feedback = 'Question opening creates curiosity.';
  } else if (patterns.openingStyle === 'dramatic') {
    score = 85;
    feedback = 'Dramatic opening grabs attention.';
  } else if (firstLineLength < 80) {
    score = 70;
    feedback = 'Opening is adequate but could be punchier.';
  } else {
    score = 50;
    feedback = 'Opening too long. Start with a hook.';
  }
  
  return {
    name: 'Opening Impact',
    score,
    weight,
    weightedScore: score * weight,
    feedback,
  };
}

function scoreClosing(patterns: PatternExtraction, content: string): ConfidenceFactor {
  const weight = 0.10;
  let score = 0;
  let feedback = '';
  
  const paragraphs = content.split(/\n\n+/);
  const lastPara = paragraphs[paragraphs.length - 1] || '';
  
  // Check for fan-connect or emotional closing
  const hasFanConnect = /ప్రేమ|అభిమానం|ఫ్యాన్స్|హృదయం|గర్వం|ఎదురుచూ/.test(lastPara);
  const hasCTA = /షేర్|కామెంట్|లైక్|ఫాలో/.test(lastPara);
  
  if (patterns.closingStyle === 'emotional' && hasFanConnect) {
    score = 100;
    feedback = 'Strong emotional closing with fan connect.';
  } else if (patterns.closingStyle === 'cta') {
    score = 85;
    feedback = 'Good call-to-action closing.';
  } else if (patterns.closingStyle === 'prediction') {
    score = 80;
    feedback = 'Forward-looking closing creates anticipation.';
  } else if (hasFanConnect || hasCTA) {
    score = 75;
    feedback = 'Closing has some engagement elements.';
  } else {
    score = 50;
    feedback = 'Add fan-connect or emotional closing.';
  }
  
  return {
    name: 'Closing Strength',
    score,
    weight,
    weightedScore: score * weight,
    feedback,
  };
}

function scoreClusterMatch(
  patterns: PatternExtraction,
  cluster?: StyleCluster
): ConfidenceFactor {
  const weight = 0.05;
  
  if (!cluster) {
    return {
      name: 'Style Cluster Match',
      score: 70,
      weight,
      weightedScore: 70 * weight,
      feedback: 'No style cluster specified. Using default scoring.',
    };
  }
  
  let matches = 0;
  let total = 0;
  
  // Check against cluster characteristics (if defined)
  if (cluster.characteristics) {
    if (cluster.characteristics.sentenceLengthAvg) {
      total++;
      const avgLength = patterns.sentenceLengths.reduce((a, b) => a + b, 0) / 
                       (patterns.sentenceLengths.length || 1);
      if (avgLength <= cluster.characteristics.sentenceLengthAvg + 20 &&
          avgLength >= cluster.characteristics.sentenceLengthAvg - 20) {
        matches++;
      }
    }
    
    if (cluster.characteristics.paragraphCount) {
      total++;
      if (patterns.paragraphCounts.length >= cluster.characteristics.paragraphCount.min &&
          patterns.paragraphCounts.length <= cluster.characteristics.paragraphCount.max) {
        matches++;
      }
    }
    
    if (cluster.characteristics.rhetoricalQuestions !== undefined) {
      total++;
      if (patterns.hasRhetoricalQuestion === cluster.characteristics.rhetoricalQuestions) {
        matches++;
      }
    }
  }
  
  const matchRatio = total > 0 ? matches / total : 0.7;
  const score = matchRatio * 100;
  
  return {
    name: 'Style Cluster Match',
    score,
    weight,
    weightedScore: score * weight,
    feedback: matchRatio >= 0.7 
      ? `Good match with ${cluster.name} style.`
      : `Style differs from ${cluster.name}. Consider adjusting.`,
  };
}

// ============================================================
// BATCH OPERATIONS
// ============================================================

/**
 * Score multiple content pieces and return summary
 */
export function batchScore(
  contents: ContentForScoring[]
): { results: ConfidenceResult[]; summary: BatchSummary } {
  const results = contents.map(calculateConfidence);
  
  const summary: BatchSummary = {
    total: results.length,
    ready: results.filter(r => r.status === 'READY').length,
    needsRefinement: results.filter(r => r.status === 'NEEDS_REFINEMENT').length,
    needsAI: results.filter(r => r.status === 'NEEDS_AI_HELP').length,
    rejected: results.filter(r => r.status === 'REJECTED').length,
    avgScore: results.reduce((sum, r) => sum + r.score, 0) / (results.length || 1),
    noAIRate: results.filter(r => !r.needsAI).length / (results.length || 1),
  };
  
  return { results, summary };
}

export interface BatchSummary {
  total: number;
  ready: number;
  needsRefinement: number;
  needsAI: number;
  rejected: number;
  avgScore: number;
  noAIRate: number;
}

export default {
  THRESHOLDS,
  calculateConfidence,
  batchScore,
};

