/**
 * CONSENSUS ENGINE
 * 
 * Implements multi-source consensus for fact verification.
 * Requires 3+ source agreement for auto-approval.
 * Flags conflicts for admin review.
 */

import { z } from 'zod';
import { crossValidateFacts, SourceData, Discrepancy } from './fact-validator';
import { classifyClaim, ClaimType } from './claim-classifier';

// ============================================================
// TYPES
// ============================================================

export interface VerifiedFact {
  field: string;
  value: unknown;
  claimType: ClaimType;
  sources: string[];
  consensus: number; // 0.0 - 1.0
  verifiedAt: string;
  verifiedBy: string | 'auto' | 'admin';
  locked: boolean;
  lockReason?: string;
  conflictId?: string;
}

export interface SourceClaim {
  source: string;
  value: unknown;
  trustLevel: number;
  fetchedAt: string;
}

export interface ConsensusResult {
  field: string;
  hasConsensus: boolean;
  consensusValue: unknown;
  consensusScore: number;
  claims: SourceClaim[];
  conflictSeverity?: 'none' | 'minor' | 'major' | 'critical';
  requiresReview: boolean;
  autoApproved: boolean;
  suggestedAction: string;
}

export interface ConflictRecord {
  id: string;
  field: string;
  entityType: 'movie' | 'celebrity' | 'review';
  entityId: string;
  claims: SourceClaim[];
  severity: 'minor' | 'major' | 'critical';
  status: 'open' | 'resolved' | 'dismissed';
  resolution?: {
    resolvedValue: unknown;
    resolvedBy: string;
    resolvedAt: string;
    reason: string;
  };
  createdAt: string;
}

// ============================================================
// SOURCE TRUST LEVELS (extended)
// ============================================================

export const SOURCE_TRUST: Record<string, number> = {
  // Primary sources (highest trust)
  official: 0.98,
  tmdb: 0.95,
  imdb: 0.94,
  
  // Verified databases
  wikidata: 0.90,
  wikipedia: 0.85,
  google_kg: 0.85,
  
  // Archives
  internet_archive: 0.80,
  wikimedia_commons: 0.80,
  
  // Internal
  admin_verified: 0.95,
  internal: 0.70,
  user_submitted: 0.40,
  
  // Lower trust
  news: 0.60,
  social: 0.40,
  youtube: 0.50,
  
  // Unknown
  unknown: 0.30,
};

/**
 * Minimum sources required for auto-approval
 */
export const MIN_SOURCES_FOR_CONSENSUS = 3;

/**
 * Minimum consensus score for auto-approval
 */
export const MIN_CONSENSUS_SCORE = 0.75;

// ============================================================
// CONSENSUS CALCULATION
// ============================================================

/**
 * Calculate consensus for a single field
 */
export function calculateFieldConsensus(
  field: string,
  claims: SourceClaim[]
): ConsensusResult {
  if (claims.length === 0) {
    return {
      field,
      hasConsensus: false,
      consensusValue: null,
      consensusScore: 0,
      claims: [],
      conflictSeverity: 'none',
      requiresReview: false,
      autoApproved: false,
      suggestedAction: 'No data available',
    };
  }

  if (claims.length === 1) {
    const claim = claims[0];
    return {
      field,
      hasConsensus: claim.trustLevel >= 0.9,
      consensusValue: claim.value,
      consensusScore: claim.trustLevel,
      claims,
      conflictSeverity: 'none',
      requiresReview: claim.trustLevel < 0.9,
      autoApproved: claim.trustLevel >= 0.9,
      suggestedAction: claim.trustLevel >= 0.9 
        ? 'Single trusted source - auto-approve' 
        : 'Single source - needs verification',
    };
  }

  // Group claims by normalized value
  const valueGroups = groupClaimsByValue(claims);
  
  // Find dominant value
  const sortedGroups = Object.entries(valueGroups)
    .map(([valueKey, groupClaims]) => ({
      valueKey,
      claims: groupClaims,
      totalTrust: groupClaims.reduce((sum, c) => sum + c.trustLevel, 0),
      count: groupClaims.length,
    }))
    .sort((a, b) => b.totalTrust - a.totalTrust);

  const dominant = sortedGroups[0];
  const totalTrust = claims.reduce((sum, c) => sum + c.trustLevel, 0);
  const consensusScore = dominant.totalTrust / totalTrust;
  const hasMultipleGroups = sortedGroups.length > 1;

  // Determine conflict severity
  let conflictSeverity: 'none' | 'minor' | 'major' | 'critical' = 'none';
  if (hasMultipleGroups) {
    const secondGroup = sortedGroups[1];
    const gap = dominant.totalTrust - secondGroup.totalTrust;
    
    if (gap < 0.2) {
      conflictSeverity = 'critical';
    } else if (gap < 0.4) {
      conflictSeverity = 'major';
    } else {
      conflictSeverity = 'minor';
    }
  }

  // Determine if auto-approve
  const autoApproved = 
    dominant.count >= MIN_SOURCES_FOR_CONSENSUS &&
    consensusScore >= MIN_CONSENSUS_SCORE &&
    conflictSeverity !== 'critical';

  return {
    field,
    hasConsensus: consensusScore >= MIN_CONSENSUS_SCORE,
    consensusValue: dominant.claims[0].value,
    consensusScore,
    claims,
    conflictSeverity,
    requiresReview: conflictSeverity === 'critical' || conflictSeverity === 'major',
    autoApproved,
    suggestedAction: getSuggestedAction(autoApproved, conflictSeverity, dominant.count),
  };
}

/**
 * Group claims by their normalized values
 */
function groupClaimsByValue(claims: SourceClaim[]): Record<string, SourceClaim[]> {
  const groups: Record<string, SourceClaim[]> = {};

  for (const claim of claims) {
    const normalizedKey = normalizeValueForComparison(claim.value);
    if (!groups[normalizedKey]) {
      groups[normalizedKey] = [];
    }
    groups[normalizedKey].push(claim);
  }

  return groups;
}

/**
 * Normalize value for comparison
 */
function normalizeValueForComparison(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  
  if (typeof value === 'string') {
    return value.toLowerCase().trim().replace(/\s+/g, ' ');
  }
  
  if (typeof value === 'number') {
    // Round to avoid floating point issues
    return String(Math.round(value * 100) / 100);
  }
  
  if (Array.isArray(value)) {
    return value
      .map(v => normalizeValueForComparison(v))
      .sort()
      .join('|');
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

/**
 * Get suggested action based on consensus result
 */
function getSuggestedAction(
  autoApproved: boolean,
  conflictSeverity: string,
  sourceCount: number
): string {
  if (autoApproved) {
    return `Auto-approved: ${sourceCount} sources agree`;
  }
  
  switch (conflictSeverity) {
    case 'critical':
      return 'Critical conflict: Manual review required';
    case 'major':
      return 'Major conflict: Admin verification recommended';
    case 'minor':
      return 'Minor conflict: Majority value suggested';
    default:
      return 'Insufficient sources: Additional verification needed';
  }
}

// ============================================================
// MULTI-FIELD CONSENSUS
// ============================================================

export interface EntityConsensusResult {
  entityType: string;
  entityId: string;
  verifiedFacts: VerifiedFact[];
  pendingFacts: ConsensusResult[];
  conflicts: ConflictRecord[];
  overallConfidence: number;
  completeness: number;
  needsReview: boolean;
}

/**
 * Build consensus for all fields of an entity
 */
export function buildEntityConsensus(
  entityType: string,
  entityId: string,
  sourcesData: SourceData[]
): EntityConsensusResult {
  // Collect all fields across sources
  const allFields = new Set<string>();
  for (const source of sourcesData) {
    Object.keys(source.data).forEach(f => allFields.add(f));
  }

  const verifiedFacts: VerifiedFact[] = [];
  const pendingFacts: ConsensusResult[] = [];
  const conflicts: ConflictRecord[] = [];

  for (const field of allFields) {
    // Collect claims for this field
    const claims: SourceClaim[] = [];
    
    for (const source of sourcesData) {
      const value = source.data[field];
      if (value !== undefined && value !== null) {
        claims.push({
          source: source.source,
          value,
          trustLevel: SOURCE_TRUST[source.source] || SOURCE_TRUST.unknown,
          fetchedAt: source.fetchedAt,
        });
      }
    }

    if (claims.length === 0) continue;

    // Calculate consensus
    const consensus = calculateFieldConsensus(field, claims);
    const claimType = classifyClaim(field, consensus.consensusValue).claimType;

    if (consensus.autoApproved) {
      // Auto-verify
      verifiedFacts.push({
        field,
        value: consensus.consensusValue,
        claimType,
        sources: consensus.claims.map(c => c.source),
        consensus: consensus.consensusScore,
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'auto',
        locked: false,
      });
    } else if (consensus.requiresReview) {
      // Create conflict
      const conflictId = `${entityType}-${entityId}-${field}-${Date.now()}`;
      conflicts.push({
        id: conflictId,
        field,
        entityType: entityType as 'movie' | 'celebrity' | 'review',
        entityId,
        claims: consensus.claims,
        severity: consensus.conflictSeverity as 'minor' | 'major' | 'critical',
        status: 'open',
        createdAt: new Date().toISOString(),
      });

      pendingFacts.push({
        ...consensus,
        conflictSeverity: consensus.conflictSeverity,
      });
    } else {
      // Pending but no major conflict
      pendingFacts.push(consensus);
    }
  }

  // Calculate overall metrics
  const totalFields = verifiedFacts.length + pendingFacts.length;
  const overallConfidence = totalFields > 0
    ? (verifiedFacts.reduce((sum, f) => sum + f.consensus, 0) +
       pendingFacts.reduce((sum, f) => sum + f.consensusScore, 0)) / totalFields
    : 0;

  const completeness = allFields.size > 0
    ? (verifiedFacts.length + pendingFacts.filter(p => p.hasConsensus).length) / allFields.size
    : 0;

  return {
    entityType,
    entityId,
    verifiedFacts,
    pendingFacts,
    conflicts,
    overallConfidence,
    completeness,
    needsReview: conflicts.length > 0,
  };
}

// ============================================================
// CONFLICT RESOLUTION
// ============================================================

/**
 * Resolve a conflict with admin decision
 */
export function resolveConflict(
  conflict: ConflictRecord,
  resolvedValue: unknown,
  resolvedBy: string,
  reason: string
): ConflictRecord {
  return {
    ...conflict,
    status: 'resolved',
    resolution: {
      resolvedValue,
      resolvedBy,
      resolvedAt: new Date().toISOString(),
      reason,
    },
  };
}

/**
 * Lock a verified fact
 */
export function lockFact(
  fact: VerifiedFact,
  lockedBy: string,
  reason: string
): VerifiedFact {
  return {
    ...fact,
    locked: true,
    lockReason: `Locked by ${lockedBy}: ${reason}`,
    verifiedBy: lockedBy,
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Unlock a fact (requires admin)
 */
export function unlockFact(
  fact: VerifiedFact,
  unlockedBy: string
): VerifiedFact {
  return {
    ...fact,
    locked: false,
    lockReason: undefined,
  };
}

// ============================================================
// ZOD SCHEMAS
// ============================================================

export const VerifiedFactSchema = z.object({
  field: z.string(),
  value: z.unknown(),
  claimType: z.enum(['fact', 'opinion', 'derived', 'unknown']),
  sources: z.array(z.string()),
  consensus: z.number().min(0).max(1),
  verifiedAt: z.string().datetime(),
  verifiedBy: z.string(),
  locked: z.boolean(),
  lockReason: z.string().optional(),
  conflictId: z.string().optional(),
});

export const ConflictRecordSchema = z.object({
  id: z.string(),
  field: z.string(),
  entityType: z.enum(['movie', 'celebrity', 'review']),
  entityId: z.string(),
  claims: z.array(z.object({
    source: z.string(),
    value: z.unknown(),
    trustLevel: z.number(),
    fetchedAt: z.string(),
  })),
  severity: z.enum(['minor', 'major', 'critical']),
  status: z.enum(['open', 'resolved', 'dismissed']),
  resolution: z.object({
    resolvedValue: z.unknown(),
    resolvedBy: z.string(),
    resolvedAt: z.string().datetime(),
    reason: z.string(),
  }).optional(),
  createdAt: z.string().datetime(),
});

export const EntityConsensusResultSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  verifiedFacts: z.array(VerifiedFactSchema),
  pendingFacts: z.array(z.object({
    field: z.string(),
    hasConsensus: z.boolean(),
    consensusValue: z.unknown(),
    consensusScore: z.number(),
    claims: z.array(z.object({
      source: z.string(),
      value: z.unknown(),
      trustLevel: z.number(),
      fetchedAt: z.string(),
    })),
    conflictSeverity: z.enum(['none', 'minor', 'major', 'critical']).optional(),
    requiresReview: z.boolean(),
    autoApproved: z.boolean(),
    suggestedAction: z.string(),
  })),
  conflicts: z.array(ConflictRecordSchema),
  overallConfidence: z.number().min(0).max(1),
  completeness: z.number().min(0).max(1),
  needsReview: z.boolean(),
});

