/**
 * Writer Style Intelligence System
 * 
 * This module provides:
 * - Style signals from professional Telugu writers
 * - Style clusters for categorizing writing approaches
 * - AI-as-teacher pattern extraction
 * - Confidence scoring and no-AI gates
 * 
 * Key Principle: AI is a TEACHER, not a WRITER.
 * We learn patterns, not copy text.
 */

// Writer Style Signals
export {
  WriterStyleSignal,
  PREDEFINED_STYLE_SIGNALS,
  PREDEFINED_STYLE_SIGNALS as WRITER_STYLE_SIGNALS,
  aggregateStyleSignals,
  aggregateStyleSignals as aggregateSignals,
  getClusterRecommendation,
} from './writer-signals';

// Style Clusters
export {
  StyleCluster,
  StyleCharacteristics,
  STYLE_CLUSTERS,
  getClusterById,
  detectBestCluster,
  getClustersForContentType,
} from './style-clusters';

// AI Teacher (Pattern Learning)
export {
  AILearning,
  PatternExtraction,
  ComparisonResult,
  AI_LEARNINGS,
  extractPatterns,
  compareAndLearn,
  getApplicableLearnings,
  suggestBlockImprovements,
  recordLearningOutcome,
  getLearningStats,
} from './ai-teacher';

// Confidence Gate
export {
  ConfidenceResult,
  ConfidenceFactor,
  ContentForScoring,
  BatchSummary,
  THRESHOLDS,
  calculateConfidence,
  batchScore,
} from './confidence-gate';

