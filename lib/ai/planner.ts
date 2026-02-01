/**
 * Planning agent (Claude-like / planner).
 * Consumes validation report, trends, or governance summary and returns a structured plan.
 * Uses smart-key-manager (Groq primary, OpenAI fallback). No DB write except optional audit.
 */

import { smartAI } from './smart-key-manager';
import { logAuditEvent } from '@/lib/audit/logger';

const PLANNER_SYSTEM_PROMPT = `You are a planning agent. You only output structured plans.
Input: validation report, trends, or governance summary.
Output: JSON with keys: priorities (array of strings), suggested_actions (array of { intent, action_type, params, confidence }), assumptions (array of strings), risks (array of strings).
Use intent values: APPLY_FIX, ENRICH_DATA, VALIDATE_DATA, IMPLEMENT_DRAFT, PUBLISH_CONTENT, UPDATE_CONFIG, MODIFY_SCHEMA.
No code, no execution, no opinions outside the structure.`;

export interface SuggestedAction {
  intent: string;
  action_type: string;
  params: Record<string, unknown>;
  confidence: number;
}

export interface PlanOutput {
  priorities: string[];
  suggested_actions: SuggestedAction[];
  assumptions: string[];
  risks: string[];
}

export interface PlannerInput {
  /** Validation summary or report snippet */
  validation_summary?: string;
  /** Trend summary or report snippet */
  trend_summary?: string;
  /** Governance summary or flags */
  governance_summary?: string;
}

export interface PlanResult {
  plan: PlanOutput;
  model: string;
  provider: string;
  latencyMs: number;
}

/**
 * Generate a structured plan from validation/trend/governance context.
 * Optionally logs "plan created" to audit_logs (event_type ai_generation, source planner).
 */
export async function generatePlan(
  input: PlannerInput,
  options: { logAudit?: boolean } = {}
): Promise<PlanResult | null> {
  const textParts: string[] = [];
  if (input.validation_summary) textParts.push(`Validation:\n${input.validation_summary}`);
  if (input.trend_summary) textParts.push(`Trends:\n${input.trend_summary}`);
  if (input.governance_summary) textParts.push(`Governance:\n${input.governance_summary}`);
  if (textParts.length === 0) return null;

  const userContent = textParts.join('\n\n');
  const messages = [
    { role: 'system' as const, content: PLANNER_SYSTEM_PROMPT },
    { role: 'user' as const, content: userContent },
  ];

  await smartAI.initialize();
  const result = await smartAI.chat(messages, {
    temperature: 0.3,
    maxTokens: 2000,
    jsonMode: true,
    preferQuality: true,
  });

  if (!result?.content) return null;

  let plan: PlanOutput;
  try {
    const parsed = JSON.parse(result.content) as PlanOutput;
    plan = {
      priorities: Array.isArray(parsed.priorities) ? parsed.priorities : [],
      suggested_actions: Array.isArray(parsed.suggested_actions) ? parsed.suggested_actions : [],
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
    };
  } catch {
    return null;
  }

  if (options.logAudit) {
    await logAuditEvent({
      event_type: 'ai_generation',
      severity: 'info',
      entity_type: 'system',
      entity_id: 'planner',
      entity_name: 'planner',
      message: 'Plan created',
      metadata: {
        source: 'planner',
        action_count: plan.suggested_actions.length,
        model: result.model,
        provider: result.provider,
      },
      source: 'planner',
      triggered_by: 'system',
    });
  }

  return {
    plan,
    model: result.model,
    provider: result.provider,
    latencyMs: result.latencyMs,
  };
}
