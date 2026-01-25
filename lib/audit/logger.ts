/**
 * Audit Logger
 * 
 * Provides functions for logging audit events to the database
 * and generating audit reports.
 */

import { createClient } from '@supabase/supabase-js';
import type {
  AuditEvent,
  AuditEventType,
  AuditSeverity,
  AuditEntityType,
  AuditSummary,
} from './types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const getSupabase = () => createClient(supabaseUrl, supabaseKey);

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(event: Omit<AuditEvent, 'id' | 'created_at'>): Promise<string | null> {
  try {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        event_type: event.event_type,
        severity: event.severity,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        entity_name: event.entity_name,
        message: event.message,
        metadata: event.metadata || {},
        before_state: event.before_state,
        after_state: event.after_state,
        source: event.source,
        triggered_by: event.triggered_by || 'system',
        requires_review: event.requires_review || false,
        review_status: event.review_status || 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[AuditLogger] Failed to log event:', error.message);
      // Fallback to console logging
      console.log('[AUDIT]', JSON.stringify(event));
      return null;
    }

    return data?.id || null;
  } catch (err) {
    console.error('[AuditLogger] Error:', err);
    // Fallback to console logging
    console.log('[AUDIT]', JSON.stringify(event));
    return null;
  }
}

/**
 * Log a validation failure
 */
export async function logValidationFailure(
  entityType: AuditEntityType,
  entityId: string,
  entityName: string,
  ruleId: string,
  message: string,
  details?: Record<string, unknown>,
  source: string = 'governance-validator'
): Promise<void> {
  await logAuditEvent({
    event_type: 'validation_failure',
    severity: 'warning',
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    message: `Validation failed: ${ruleId} - ${message}`,
    metadata: { rule_id: ruleId, details },
    source,
    requires_review: true,
  });
}

/**
 * Log a trust score drop
 */
export async function logTrustScoreDrop(
  entityType: AuditEntityType,
  entityId: string,
  entityName: string,
  previousScore: number,
  newScore: number,
  reason: string,
  source: string = 'trust-scoring'
): Promise<void> {
  const dropPercentage = ((previousScore - newScore) / previousScore) * 100;
  const severity: AuditSeverity = dropPercentage > 20 ? 'error' : 'warning';

  await logAuditEvent({
    event_type: 'trust_score_drop',
    severity,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    message: `Trust score dropped from ${previousScore} to ${newScore} (${dropPercentage.toFixed(1)}% drop)`,
    metadata: {
      previous_score: previousScore,
      new_score: newScore,
      drop_percentage: dropPercentage,
      reason,
    },
    before_state: { trust_score: previousScore },
    after_state: { trust_score: newScore },
    source,
    requires_review: dropPercentage > 20,
  });
}

/**
 * Log a source conflict
 */
export async function logSourceConflict(
  entityType: AuditEntityType,
  entityId: string,
  entityName: string,
  field: string,
  sources: Array<{ name: string; value: unknown }>,
  source: string = 'cross-verify'
): Promise<void> {
  await logAuditEvent({
    event_type: 'source_conflict',
    severity: 'warning',
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    message: `Conflicting data for field "${field}" from ${sources.length} sources`,
    metadata: {
      field,
      conflicting_values: sources,
    },
    source,
    requires_review: true,
  });
}

/**
 * Log a speculative boundary crossing
 */
export async function logSpeculativeBoundary(
  entityType: AuditEntityType,
  entityId: string,
  entityName: string,
  boundaryType: string,
  details: string,
  source: string = 'content-filter'
): Promise<void> {
  await logAuditEvent({
    event_type: 'speculative_boundary',
    severity: 'error',
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    message: `Speculative content boundary crossed: ${boundaryType}`,
    metadata: {
      boundary_type: boundaryType,
      details,
    },
    source,
    requires_review: true,
  });
}

/**
 * Log a freshness decay event
 */
export async function logFreshnessDecay(
  entityType: AuditEntityType,
  entityId: string,
  entityName: string,
  daysSinceUpdate: number,
  newFreshnessScore: number,
  source: string = 'freshness-check'
): Promise<void> {
  await logAuditEvent({
    event_type: 'freshness_decay',
    severity: daysSinceUpdate > 180 ? 'warning' : 'info',
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    message: `Data freshness decayed: ${daysSinceUpdate} days since last update, score: ${newFreshnessScore}`,
    metadata: {
      days_since_update: daysSinceUpdate,
      freshness_score: newFreshnessScore,
    },
    source,
    requires_review: daysSinceUpdate > 180,
  });
}

/**
 * Log an AI generation event
 */
export async function logAIGeneration(
  entityType: AuditEntityType,
  entityId: string,
  entityName: string,
  promptType: string,
  model: string,
  inputSummary: string,
  outputSummary: string,
  source: string = 'ai-generator'
): Promise<void> {
  await logAuditEvent({
    event_type: 'ai_generation',
    severity: 'info',
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    message: `AI content generated using ${model} with ${promptType} prompt`,
    metadata: {
      prompt_type: promptType,
      model,
      input_summary: inputSummary,
      output_summary: outputSummary,
    },
    source,
  });
}

/**
 * Log a governance rule violation
 */
export async function logGovernanceViolation(
  entityType: AuditEntityType,
  entityId: string,
  entityName: string,
  ruleId: string,
  ruleName: string,
  violation: string,
  source: string = 'governance-engine'
): Promise<void> {
  await logAuditEvent({
    event_type: 'governance_violation',
    severity: 'critical',
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    message: `Governance rule violated: ${ruleId} - ${ruleName}`,
    metadata: {
      rule_id: ruleId,
      rule_name: ruleName,
      violation,
    },
    source,
    requires_review: true,
  });
}

/**
 * Get audit summary for a time period
 */
export async function getAuditSummary(
  startDate: Date,
  endDate: Date
): Promise<AuditSummary | null> {
  try {
    const supabase = getSupabase();
    
    const { data: events, error } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error || !events) {
      console.error('[AuditLogger] Failed to get summary:', error?.message);
      return null;
    }

    // Calculate summary
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const entityCounts: Record<string, { count: number; name?: string; type: string }> = {};

    for (const event of events) {
      // Count by type
      eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
      
      // Count by severity
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      
      // Track entity frequency
      if (event.entity_id) {
        const key = `${event.entity_type}:${event.entity_id}`;
        if (!entityCounts[key]) {
          entityCounts[key] = { count: 0, name: event.entity_name, type: event.entity_type };
        }
        entityCounts[key].count++;
      }
    }

    // Get top affected entities
    const topEntities = Object.entries(entityCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([key, data]) => ({
        entity_type: data.type as AuditEntityType,
        entity_id: key.split(':')[1],
        entity_name: data.name,
        event_count: data.count,
      }));

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      events_by_type: eventsByType as Record<AuditEventType, number>,
      events_by_severity: eventsBySeverity as Record<AuditSeverity, number>,
      top_affected_entities: topEntities,
      pending_reviews: events.filter(e => e.requires_review && e.review_status === 'pending').length,
      critical_issues: events.filter(e => e.severity === 'critical').length,
    };
  } catch (err) {
    console.error('[AuditLogger] Error getting summary:', err);
    return null;
  }
}

/**
 * Batch log multiple events
 */
export async function logAuditEventsBatch(
  events: Array<Omit<AuditEvent, 'id' | 'created_at'>>
): Promise<number> {
  try {
    const supabase = getSupabase();
    
    const insertData = events.map(event => ({
      event_type: event.event_type,
      severity: event.severity,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      entity_name: event.entity_name,
      message: event.message,
      metadata: event.metadata || {},
      before_state: event.before_state,
      after_state: event.after_state,
      source: event.source,
      triggered_by: event.triggered_by || 'system',
      requires_review: event.requires_review || false,
      review_status: event.review_status || 'pending',
    }));

    const { data, error } = await supabase
      .from('audit_logs')
      .insert(insertData)
      .select('id');

    if (error) {
      console.error('[AuditLogger] Batch insert failed:', error.message);
      return 0;
    }

    return data?.length || 0;
  } catch (err) {
    console.error('[AuditLogger] Batch error:', err);
    return 0;
  }
}

export default {
  logAuditEvent,
  logValidationFailure,
  logTrustScoreDrop,
  logSourceConflict,
  logSpeculativeBoundary,
  logFreshnessDecay,
  logAIGeneration,
  logGovernanceViolation,
  getAuditSummary,
  logAuditEventsBatch,
};
