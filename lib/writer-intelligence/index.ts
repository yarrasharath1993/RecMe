/**
 * WRITER-STYLE INTELLIGENCE SYSTEM
 * 
 * A comprehensive Telugu content generation system that:
 * 1. Learns structural patterns from professional Telugu writers (legally)
 * 2. Maps content types to appropriate style profiles
 * 3. Enforces NO-AI publishing rule
 * 4. Generates content using pure templates
 * 5. Evolves templates based on performance
 * 
 * CORE PRINCIPLE:
 * Templates are the primary writing system.
 * AI can only analyze, compare, and suggest - never generate published text.
 */

// ============================================================
// EXPORTS
// ============================================================

// Signal Extractor - Legal metadata-only extraction
export {
  extractWriterStyleSignals,
  deriveParagraphCount,
  derivePunctuationDensity,
  deriveHeadlineWordCountFromURL,
  deriveIntroBlockRatio,
  deriveEnglishMixRatio,
  deriveGlamourBlockPosition,
  deriveClosingBlockPattern,
  derivePublishTimePattern,
  deriveImageToTextRatio,
  TELUGU_SITE_OBSERVATION_MATRIX,
  getObservationTargets,
  getObservationTargetsByTier,
  type WriterStyleSignals,
  type SiteObservation,
} from './signal-extractor';

// Style Profiles - Editorial style definitions
export {
  TELUGU_STYLE_PROFILES,
  CONTENT_TYPE_MAPPINGS,
  AUDIENCE_MAPPINGS,
  getProfileById,
  getProfileForContentType,
  getProfileForSection,
  getProfilesForAudience,
  recordProfileUsage,
  getProfileStats,
  type StyleProfile,
  type ContentTypeMapping,
  type AudienceMapping,
} from './style-profiles';

// No-AI Enforcement
export {
  NO_AI_PUBLISH,
  ENFORCEMENT_MODE,
  detectContentSource,
  isPublishableSource,
  checkPublishingGate,
  logAIAssist,
  logViolation,
  getAIAssistLogs,
  getViolationLogs,
  isAIOperationAllowed,
  ALLOWED_AI_OPERATIONS,
  FORBIDDEN_AI_OPERATIONS,
  generateWithTemplateFirst,
  getEnforcementStats,
  type ContentSource,
  type PublishGateResult,
  type AIAssistLog,
  type ViolationLog,
} from './no-ai-enforcement';

// Template Generators
export {
  generateHook,
  generateContext,
  generateEmotion,
  generateFanConnect,
  generateClosing,
  generateTemplateArticle,
  generateArticleWithProfile,
  getTemplateStats as getGeneratorStats,
  HOOK_TEMPLATES,
  CONTEXT_TEMPLATES,
  EMOTION_TEMPLATES,
  CLOSING_TEMPLATES,
  FAN_CONNECT_TEMPLATES,
  type TemplateValues,
  type GeneratedParagraph,
  type GeneratedArticle,
} from './template-generators';

// Seed Data
export {
  CELEBRITIES,
  MOVIES,
  EVENT_TEMPLATES,
  getCelebrityById,
  getCelebrityByName,
  getMovieById,
  getMoviesByCelebrity,
  getRandomEventTemplate,
  generateRandomScenario,
  getImageSearchTerms,
  type Celebrity,
  type Movie,
  type EventTemplate,
} from './seed-data';

// ============================================================
// UNIFIED INTERFACE
// ============================================================

import { getProfileForContentType, type StyleProfile } from './style-profiles';
import { checkPublishingGate, ENFORCEMENT_MODE } from './no-ai-enforcement';
import { generateTemplateArticle, type GeneratedArticle, type TemplateValues } from './template-generators';

/**
 * Generate publishable content using the full Writer Intelligence System
 * 
 * This is the main entry point for content generation:
 * 1. Selects appropriate style profile
 * 2. Generates content using templates
 * 3. Validates against publishing gate
 * 4. Returns only if approved
 */
export async function generatePublishableContent(
  contentType: string,
  values: TemplateValues,
  options?: {
    profileId?: string;
    skipPublishGate?: boolean;
  }
): Promise<{
  article: GeneratedArticle;
  publishingApproval: ReturnType<typeof checkPublishingGate>;
  profile: StyleProfile;
}> {
  // 1. Get style profile
  const profile = options?.profileId 
    ? (await import('./style-profiles')).getProfileById(options.profileId)!
    : getProfileForContentType(contentType);
  
  // 2. Generate article using templates
  const article = generateTemplateArticle(contentType, values, {
    profileId: profile.id,
  });
  
  // 3. Check publishing gate
  const publishingApproval = checkPublishingGate({
    id: `article_${Date.now()}`,
    source: 'template',
    templateId: article.profileId,
    confidence: article.templateConfidence,
  });
  
  // 4. Return result
  return {
    article,
    publishingApproval,
    profile,
  };
}

/**
 * Quick system status check
 */
export function getSystemStatus(): {
  enforcementMode: string;
  noAiPublishEnabled: boolean;
  profileCount: number;
  observationSitesCount: number;
  templateCounts: {
    hooks: number;
    contexts: number;
    emotions: number;
    closings: number;
  };
} {
  const { getTemplateStats } = require('./template-generators');
  const { TELUGU_SITE_OBSERVATION_MATRIX } = require('./signal-extractor');
  const { TELUGU_STYLE_PROFILES } = require('./style-profiles');
  const stats = getTemplateStats();
  
  return {
    enforcementMode: ENFORCEMENT_MODE,
    noAiPublishEnabled: process.env.NO_AI_PUBLISH !== 'false',
    profileCount: TELUGU_STYLE_PROFILES.length,
    observationSitesCount: TELUGU_SITE_OBSERVATION_MATRIX.length,
    templateCounts: {
      hooks: stats.totalHookTemplates,
      contexts: stats.totalContextTemplates,
      emotions: stats.totalEmotionTemplates,
      closings: stats.totalClosingTemplates,
    },
  };
}

/**
 * Validate content before publishing
 */
export function validateForPublishing(content: {
  id: string;
  source?: string;
  templateId?: string;
  aiGenerated?: boolean;
  humanEdited?: boolean;
  confidence?: number;
}): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  gate: ReturnType<typeof checkPublishingGate>;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check publishing gate
  const gate = checkPublishingGate({
    id: content.id,
    source: content.source as any,
    templateId: content.templateId,
    aiGenerated: content.aiGenerated,
    humanEdited: content.humanEdited,
    confidence: content.confidence,
  });
  
  if (!gate.allowed) {
    errors.push(gate.reason);
  }
  
  if (gate.requiresHumanReview) {
    warnings.push('Content requires human review before publishing');
  }
  
  if ((content.confidence || 0) < 0.7) {
    warnings.push('Template confidence below recommended threshold (0.7)');
  }
  
  if (!content.templateId && !content.humanEdited) {
    errors.push('Content must have a template ID or be marked as human-edited');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    gate,
  };
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  generatePublishableContent,
  getSystemStatus,
  validateForPublishing,
};

