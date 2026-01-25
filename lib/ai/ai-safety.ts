/**
 * AI SAFETY MODULE
 * 
 * Enforces governance rules on AI-generated content.
 * Ensures AI summaries only use verified data and never present
 * speculation as fact.
 */

import {
  GovernanceContentType,
  TrustLevel,
  ConfidenceTier,
  AiPromptConstraints,
  AiOutputValidation,
} from '../governance/types';

// ============================================================
// PROMPT CONSTRAINTS
// ============================================================

/**
 * Default constraints for entity summaries
 */
export const ENTITY_SUMMARY_CONSTRAINTS: AiPromptConstraints = {
  allowed_content_types: ['verified_fact', 'archive'],
  excluded_content_types: ['speculative', 'fan_content', 'promotional', 'opinion'],
  min_trust_level: 'medium',
  excluded_fields: [
    'unverified_family_claims',
    'disputed_data',
    'speculation',
    'fan_opinions',
  ],
  max_speculation: 'none',
};

/**
 * Constraints for film comparisons
 */
export const FILM_COMPARISON_CONSTRAINTS: AiPromptConstraints = {
  allowed_content_types: ['verified_fact', 'archive'],
  excluded_content_types: ['speculative', 'fan_content', 'editorial', 'opinion'],
  min_trust_level: 'medium',
  excluded_fields: [
    'disputed_box_office',
    'unverified_ratings',
    'fan_opinions',
  ],
  max_speculation: 'none',
};

/**
 * Constraints for editorial content (more permissive but labeled)
 */
export const EDITORIAL_CONSTRAINTS: AiPromptConstraints = {
  allowed_content_types: ['verified_fact', 'archive', 'editorial'],
  excluded_content_types: ['speculative', 'fan_content'],
  min_trust_level: 'low',
  excluded_fields: [
    'disputed_data',
    'unverified_claims',
  ],
  required_disclaimer: 'Editorial content contains interpretation and opinion.',
  max_speculation: 'labeled',
};

// ============================================================
// INPUT VALIDATION
// ============================================================

/**
 * Filter data based on AI constraints
 */
export function filterDataForAi(
  data: Record<string, unknown>,
  constraints: AiPromptConstraints
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip excluded fields
    if (constraints.excluded_fields.includes(key)) {
      continue;
    }

    // Skip null/undefined
    if (value === null || value === undefined) {
      continue;
    }

    // Check content type if available
    if (key === 'content_type' && typeof value === 'string') {
      if (constraints.excluded_content_types.includes(value as GovernanceContentType)) {
        continue;
      }
    }

    // Include the field
    filtered[key] = value;
  }

  return filtered;
}

/**
 * Check if entity data is safe for AI summarization
 */
export function checkAiSafety(
  data: Record<string, unknown>,
  constraints: AiPromptConstraints = ENTITY_SUMMARY_CONSTRAINTS
): { safe: boolean; reason?: string; warnings: string[] } {
  const warnings: string[] = [];

  // Check trust score
  const trustScore = (data.trust_score as number) || 0;
  const minScore = getTrustScoreThreshold(constraints.min_trust_level);
  
  if (trustScore < minScore) {
    return {
      safe: false,
      reason: `Trust score too low: ${trustScore}% (minimum: ${minScore}%)`,
      warnings,
    };
  }

  // Check content type
  const contentType = data.content_type as GovernanceContentType | undefined;
  if (contentType && constraints.excluded_content_types.includes(contentType)) {
    return {
      safe: false,
      reason: `Content type "${contentType}" is excluded from AI processing`,
      warnings,
    };
  }

  // Check is_disputed
  if (data.is_disputed === true) {
    return {
      safe: false,
      reason: 'Data is disputed and cannot be used in AI summaries',
      warnings,
    };
  }

  // Check confidence tier
  const confidenceTier = data.confidence_tier as ConfidenceTier | undefined;
  if (confidenceTier === 'unverified') {
    return {
      safe: false,
      reason: 'Unverified data cannot be used in AI summaries',
      warnings,
    };
  }

  // Generate warnings
  if (trustScore < 70) {
    warnings.push(`Trust score is moderate (${trustScore}%). Some data may be incomplete.`);
  }

  if (data.governance_flags && Array.isArray(data.governance_flags)) {
    const flags = data.governance_flags as string[];
    if (flags.includes('needs_revalidation')) {
      warnings.push('Data may be outdated and needs revalidation.');
    }
    if (flags.includes('source_conflict')) {
      warnings.push('Some sources disagree on certain data points.');
    }
  }

  return { safe: true, warnings };
}

function getTrustScoreThreshold(level: TrustLevel): number {
  switch (level) {
    case 'verified': return 90;
    case 'high': return 70;
    case 'medium': return 50;
    case 'low': return 30;
    case 'unverified': return 0;
    default: return 50;
  }
}

// ============================================================
// OUTPUT VALIDATION
// ============================================================

/**
 * Validate AI-generated output for governance compliance
 */
export function validateAiOutput(
  output: string,
  constraints: AiPromptConstraints = ENTITY_SUMMARY_CONSTRAINTS
): AiOutputValidation {
  const violations: AiOutputValidation['violations'] = [];
  const warnings: string[] = [];
  const requiredEdits: string[] = [];

  // Check for speculation markers
  if (constraints.max_speculation === 'none') {
    const speculationPatterns = [
      /\bprobably\b/gi,
      /\bmight\b/gi,
      /\bpossibly\b/gi,
      /\blikely\b/gi,
      /\bit is believed\b/gi,
      /\brumored\b/gi,
      /\ballegedly\b/gi,
      /\bunconfirmed\b/gi,
    ];

    for (const pattern of speculationPatterns) {
      if (pattern.test(output)) {
        violations.push({
          type: 'speculation',
          description: `Found speculative language: "${output.match(pattern)?.[0]}"`,
        });
      }
    }
  }

  // Check for missing attribution
  if (output.includes('according to') || output.includes('source:')) {
    // Attribution present - good
  } else if (output.length > 500) {
    warnings.push('Long output without clear source attribution');
  }

  // Check for opinion presented as fact
  const opinionPatterns = [
    /\bis the best\b/gi,
    /\bis the worst\b/gi,
    /\bundoubtedly\b/gi,
    /\bobviously\b/gi,
    /\bclearly\b/gi,
  ];

  for (const pattern of opinionPatterns) {
    if (pattern.test(output)) {
      warnings.push(`Found opinion language: "${output.match(pattern)?.[0]}"`);
    }
  }

  // Check for required disclaimer
  if (constraints.required_disclaimer && !output.includes('Editorial') && !output.includes('editorial')) {
    requiredEdits.push(`Add disclaimer: "${constraints.required_disclaimer}"`);
  }

  return {
    is_valid: violations.length === 0,
    violations,
    warnings,
    required_edits: requiredEdits,
  };
}

// ============================================================
// PROMPT GENERATION
// ============================================================

/**
 * Generate a governed prompt prefix
 */
export function generatePromptPrefix(
  constraints: AiPromptConstraints
): string {
  const lines: string[] = [
    '## GOVERNANCE CONSTRAINTS',
    '',
    '**ALLOWED content types:**',
    constraints.allowed_content_types.map((t) => `- ${t}`).join('\n'),
    '',
    '**EXCLUDED content types:**',
    constraints.excluded_content_types.map((t) => `- ${t}`).join('\n'),
    '',
    `**Minimum trust level:** ${constraints.min_trust_level}`,
    '',
    '**DO NOT include:**',
    constraints.excluded_fields.map((f) => `- ${f}`).join('\n'),
    '',
    `**Speculation allowed:** ${constraints.max_speculation}`,
    '',
  ];

  if (constraints.required_disclaimer) {
    lines.push(`**Required disclaimer:** ${constraints.required_disclaimer}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  return lines.join('\n');
}

/**
 * Prepare entity data for AI summarization
 */
export function prepareEntityForAi(
  entity: Record<string, unknown>,
  constraints: AiPromptConstraints = ENTITY_SUMMARY_CONSTRAINTS
): { data: Record<string, unknown>; prompt: string; safe: boolean; reason?: string } {
  // Check safety first
  const safetyCheck = checkAiSafety(entity, constraints);
  if (!safetyCheck.safe) {
    return {
      data: {},
      prompt: '',
      safe: false,
      reason: safetyCheck.reason,
    };
  }

  // Filter data
  const filteredData = filterDataForAi(entity, constraints);

  // Generate prompt prefix
  const promptPrefix = generatePromptPrefix(constraints);

  // Generate warnings section
  const warningsSection = safetyCheck.warnings.length > 0
    ? `\n**Warnings:**\n${safetyCheck.warnings.map((w) => `- ${w}`).join('\n')}\n`
    : '';

  return {
    data: filteredData,
    prompt: promptPrefix + warningsSection,
    safe: true,
  };
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Constraint presets
  ENTITY_SUMMARY_CONSTRAINTS,
  FILM_COMPARISON_CONSTRAINTS,
  EDITORIAL_CONSTRAINTS,
  
  // Functions
  filterDataForAi,
  checkAiSafety,
  validateAiOutput,
  generatePromptPrefix,
  prepareEntityForAi,
};
