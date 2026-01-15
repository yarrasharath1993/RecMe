/**
 * CHANGES TRACKER UTILITY
 *
 * Tracks all enrichment changes with governance and validation integration.
 * Provides audit trail for all add/update/delete operations.
 *
 * Features:
 * - Change tracking for films, awards, profiles
 * - Governance trust score integration
 * - Validation confidence tracking
 * - Session management
 * - Automated logging to database
 * - Change summary generation
 *
 * Usage:
 *   import { ChangesTracker } from './lib/changes-tracker';
 *   
 *   const tracker = new ChangesTracker('session-id', 'script-name');
 *   tracker.trackAdd('film', 'movie-id', 'Movie Title', { confidence: 0.95, trustScore: 92 });
 *   const summary = tracker.generateSummary();
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// TYPES
// ============================================================

export type ChangeAction = 'added' | 'updated' | 'deleted' | 'merged';
export type EntityType = 'film' | 'award' | 'profile' | 'statistic';

export interface ChangeRecord {
  timestamp: string;
  actor_name?: string;
  action: ChangeAction;
  entity_type: EntityType;
  entity_id: string;
  entity_title: string;
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  source?: string;
  confidence?: number;
  trust_score?: number;
  validation_score?: number;
  governance_flags?: string[];
  requires_manual_review?: boolean;
  consensus_sources?: {
    sources: string[];
    agreement: number;
  };
  change_reason?: string;
}

export interface ChangesSummary {
  session_id: string;
  script_name: string;
  started_at: string;
  ended_at: string;
  total_changes: number;
  by_action: Record<ChangeAction, number>;
  by_entity: Record<EntityType, number>;
  avg_confidence: number;
  avg_trust_score: number;
  high_confidence_changes: number;
  manual_review_required: number;
  actor_breakdown: Array<{
    actor_name: string;
    changes: number;
    avg_confidence: number;
  }>;
  source_breakdown: Array<{
    source: string;
    changes: number;
  }>;
}

// ============================================================
// CHANGES TRACKER CLASS
// ============================================================

export class ChangesTracker {
  private sessionId: string;
  private scriptName: string;
  private startedAt: string;
  private changes: ChangeRecord[] = [];
  private enableDbLogging: boolean;

  constructor(sessionId: string, scriptName: string, enableDbLogging: boolean = true) {
    this.sessionId = sessionId;
    this.scriptName = scriptName;
    this.startedAt = new Date().toISOString();
    this.enableDbLogging = enableDbLogging;
  }

  /**
   * Track an addition (film, award, profile added)
   */
  async trackAdd(
    entityType: EntityType,
    entityId: string,
    entityTitle: string,
    options: {
      actorName?: string;
      source?: string;
      confidence?: number;
      trustScore?: number;
      validationScore?: number;
      consensusSources?: { sources: string[]; agreement: number };
      changeReason?: string;
      governanceFlags?: string[];
    } = {}
  ): Promise<void> {
    const change: ChangeRecord = {
      timestamp: new Date().toISOString(),
      actor_name: options.actorName,
      action: 'added',
      entity_type: entityType,
      entity_id: entityId,
      entity_title: entityTitle,
      source: options.source,
      confidence: options.confidence,
      trust_score: options.trustScore,
      validation_score: options.validationScore,
      consensus_sources: options.consensusSources,
      change_reason: options.changeReason || 'New entity added',
      governance_flags: options.governanceFlags || [],
      requires_manual_review: (options.confidence || 1) < 0.9, // Require review if confidence < 90%
    };

    this.changes.push(change);

    if (this.enableDbLogging) {
      await this.logToDatabase(change);
    }
  }

  /**
   * Track an update (field changed)
   */
  async trackUpdate(
    entityType: EntityType,
    entityId: string,
    entityTitle: string,
    fieldChanged: string,
    oldValue: string | undefined,
    newValue: string | undefined,
    options: {
      actorName?: string;
      source?: string;
      confidence?: number;
      trustScore?: number;
      validationScore?: number;
      consensusSources?: { sources: string[]; agreement: number };
      changeReason?: string;
      governanceFlags?: string[];
    } = {}
  ): Promise<void> {
    const change: ChangeRecord = {
      timestamp: new Date().toISOString(),
      actor_name: options.actorName,
      action: 'updated',
      entity_type: entityType,
      entity_id: entityId,
      entity_title: entityTitle,
      field_changed: fieldChanged,
      old_value: oldValue,
      new_value: newValue,
      source: options.source,
      confidence: options.confidence,
      trust_score: options.trustScore,
      validation_score: options.validationScore,
      consensus_sources: options.consensusSources,
      change_reason: options.changeReason || `Updated ${fieldChanged}`,
      governance_flags: options.governanceFlags || [],
      requires_manual_review: (options.confidence || 1) < 0.9,
    };

    this.changes.push(change);

    if (this.enableDbLogging) {
      await this.logToDatabase(change);
    }
  }

  /**
   * Track a deletion (entity removed)
   */
  async trackDelete(
    entityType: EntityType,
    entityId: string,
    entityTitle: string,
    options: {
      actorName?: string;
      changeReason?: string;
      confidence?: number;
      trustScore?: number;
    } = {}
  ): Promise<void> {
    const change: ChangeRecord = {
      timestamp: new Date().toISOString(),
      actor_name: options.actorName,
      action: 'deleted',
      entity_type: entityType,
      entity_id: entityId,
      entity_title: entityTitle,
      change_reason: options.changeReason || 'Entity deleted',
      confidence: options.confidence,
      trust_score: options.trustScore,
      requires_manual_review: false, // Deletions usually don't need review
    };

    this.changes.push(change);

    if (this.enableDbLogging) {
      await this.logToDatabase(change);
    }
  }

  /**
   * Track a merge (duplicate entities merged)
   */
  async trackMerge(
    entityType: EntityType,
    keptEntityId: string,
    keptEntityTitle: string,
    mergedEntityId: string,
    mergedEntityTitle: string,
    options: {
      actorName?: string;
      changeReason?: string;
    } = {}
  ): Promise<void> {
    const change: ChangeRecord = {
      timestamp: new Date().toISOString(),
      actor_name: options.actorName,
      action: 'merged',
      entity_type: entityType,
      entity_id: keptEntityId,
      entity_title: `${keptEntityTitle} ← ${mergedEntityTitle}`,
      change_reason: options.changeReason || `Merged ${mergedEntityTitle} into ${keptEntityTitle}`,
      requires_manual_review: false,
    };

    this.changes.push(change);

    if (this.enableDbLogging) {
      await this.logToDatabase(change);
    }
  }

  /**
   * Log change to database (async, non-blocking)
   */
  private async logToDatabase(change: ChangeRecord): Promise<void> {
    try {
      await supabase.from('enrichment_changes').insert({
        timestamp: change.timestamp,
        actor_name: change.actor_name,
        action: change.action,
        entity_type: change.entity_type,
        entity_id: change.entity_id,
        entity_title: change.entity_title,
        field_changed: change.field_changed,
        old_value: change.old_value,
        new_value: change.new_value,
        source: change.source,
        confidence: change.confidence,
        trust_score: change.trust_score,
        validation_score: change.validation_score,
        governance_flags: change.governance_flags || [],
        requires_manual_review: change.requires_manual_review || false,
        consensus_sources: change.consensus_sources
          ? JSON.stringify(change.consensus_sources)
          : null,
        change_reason: change.change_reason,
        session_id: this.sessionId,
        script_name: this.scriptName,
      });
    } catch (error) {
      console.error('Error logging change to database:', error);
      // Don't throw - logging should not block the enrichment process
    }
  }

  /**
   * Get all changes
   */
  getChanges(): ChangeRecord[] {
    return this.changes;
  }

  /**
   * Get changes by action
   */
  getChangesByAction(action: ChangeAction): ChangeRecord[] {
    return this.changes.filter((c) => c.action === action);
  }

  /**
   * Get changes by entity type
   */
  getChangesByEntity(entityType: EntityType): ChangeRecord[] {
    return this.changes.filter((c) => c.entity_type === entityType);
  }

  /**
   * Get changes requiring manual review
   */
  getManualReviewChanges(): ChangeRecord[] {
    return this.changes.filter((c) => c.requires_manual_review);
  }

  /**
   * Generate comprehensive summary
   */
  generateSummary(): ChangesSummary {
    const endedAt = new Date().toISOString();

    // Count by action
    const by_action: Record<ChangeAction, number> = {
      added: 0,
      updated: 0,
      deleted: 0,
      merged: 0,
    };
    this.changes.forEach((c) => {
      by_action[c.action] = (by_action[c.action] || 0) + 1;
    });

    // Count by entity type
    const by_entity: Record<EntityType, number> = {
      film: 0,
      award: 0,
      profile: 0,
      statistic: 0,
    };
    this.changes.forEach((c) => {
      by_entity[c.entity_type] = (by_entity[c.entity_type] || 0) + 1;
    });

    // Average confidence and trust score
    const changesWithConfidence = this.changes.filter((c) => c.confidence !== undefined);
    const avg_confidence = changesWithConfidence.length > 0
      ? changesWithConfidence.reduce((sum, c) => sum + (c.confidence || 0), 0) / changesWithConfidence.length
      : 0;

    const changesWithTrustScore = this.changes.filter((c) => c.trust_score !== undefined);
    const avg_trust_score = changesWithTrustScore.length > 0
      ? changesWithTrustScore.reduce((sum, c) => sum + (c.trust_score || 0), 0) / changesWithTrustScore.length
      : 0;

    // High confidence changes (confidence >= 0.9)
    const high_confidence_changes = this.changes.filter((c) => (c.confidence || 0) >= 0.9).length;

    // Manual review required
    const manual_review_required = this.changes.filter((c) => c.requires_manual_review).length;

    // Actor breakdown
    const actorChanges = new Map<string, { count: number; confidences: number[] }>();
    this.changes.forEach((c) => {
      if (c.actor_name) {
        if (!actorChanges.has(c.actor_name)) {
          actorChanges.set(c.actor_name, { count: 0, confidences: [] });
        }
        const actorData = actorChanges.get(c.actor_name)!;
        actorData.count++;
        if (c.confidence !== undefined) {
          actorData.confidences.push(c.confidence);
        }
      }
    });

    const actor_breakdown = Array.from(actorChanges.entries())
      .map(([actor_name, data]) => ({
        actor_name,
        changes: data.count,
        avg_confidence: data.confidences.length > 0
          ? data.confidences.reduce((sum, c) => sum + c, 0) / data.confidences.length
          : 0,
      }))
      .sort((a, b) => b.changes - a.changes);

    // Source breakdown
    const sourceChanges = new Map<string, number>();
    this.changes.forEach((c) => {
      if (c.source) {
        sourceChanges.set(c.source, (sourceChanges.get(c.source) || 0) + 1);
      }
    });

    const source_breakdown = Array.from(sourceChanges.entries())
      .map(([source, changes]) => ({ source, changes }))
      .sort((a, b) => b.changes - a.changes);

    return {
      session_id: this.sessionId,
      script_name: this.scriptName,
      started_at: this.startedAt,
      ended_at: endedAt,
      total_changes: this.changes.length,
      by_action,
      by_entity,
      avg_confidence,
      avg_trust_score,
      high_confidence_changes,
      manual_review_required,
      actor_breakdown,
      source_breakdown,
    };
  }

  /**
   * Export changes to CSV format
   */
  exportToCSV(): string {
    const headers = [
      'timestamp',
      'actor_name',
      'action',
      'entity_type',
      'entity_id',
      'entity_title',
      'field_changed',
      'old_value',
      'new_value',
      'source',
      'confidence',
      'trust_score',
      'validation_score',
      'requires_manual_review',
      'change_reason',
    ];

    const rows = this.changes.map((change) => [
      change.timestamp,
      change.actor_name || '',
      change.action,
      change.entity_type,
      change.entity_id,
      change.entity_title,
      change.field_changed || '',
      change.old_value || '',
      change.new_value || '',
      change.source || '',
      change.confidence?.toString() || '',
      change.trust_score?.toString() || '',
      change.validation_score?.toString() || '',
      change.requires_manual_review ? 'true' : 'false',
      change.change_reason || '',
    ]);

    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  }

  /**
   * Clear all changes (use with caution)
   */
  clear(): void {
    this.changes = [];
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Create a new changes tracker for a session
 */
export function createChangesTracker(sessionId: string, scriptName: string, enableDbLogging: boolean = true): ChangesTracker {
  return new ChangesTracker(sessionId, scriptName, enableDbLogging);
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(prefix: string = 'session'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Query recent changes from database
 */
export async function queryRecentChanges(
  options: {
    actorName?: string;
    action?: ChangeAction;
    entityType?: EntityType;
    sessionId?: string;
    limit?: number;
    sinceHours?: number;
  } = {}
): Promise<ChangeRecord[]> {
  try {
    let query = supabase.from('enrichment_changes').select('*');

    if (options.actorName) {
      query = query.eq('actor_name', options.actorName);
    }

    if (options.action) {
      query = query.eq('action', options.action);
    }

    if (options.entityType) {
      query = query.eq('entity_type', options.entityType);
    }

    if (options.sessionId) {
      query = query.eq('session_id', options.sessionId);
    }

    if (options.sinceHours) {
      const since = new Date(Date.now() - options.sinceHours * 60 * 60 * 1000).toISOString();
      query = query.gte('timestamp', since);
    }

    query = query.order('timestamp', { ascending: false }).limit(options.limit || 100);

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((row) => ({
      timestamp: row.timestamp,
      actor_name: row.actor_name,
      action: row.action as ChangeAction,
      entity_type: row.entity_type as EntityType,
      entity_id: row.entity_id,
      entity_title: row.entity_title,
      field_changed: row.field_changed,
      old_value: row.old_value,
      new_value: row.new_value,
      source: row.source,
      confidence: row.confidence,
      trust_score: row.trust_score,
      validation_score: row.validation_score,
      governance_flags: row.governance_flags,
      requires_manual_review: row.requires_manual_review,
      consensus_sources: row.consensus_sources
        ? JSON.parse(row.consensus_sources)
        : undefined,
      change_reason: row.change_reason,
    }));
  } catch (error) {
    console.error('Error querying recent changes:', error);
    return [];
  }
}
