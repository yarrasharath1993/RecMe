/**
 * Antigravity testing agent (adversarial).
 * Consumes a plan or ClawDBot analysis and returns structured critique, edge cases, and test scenarios.
 * Uses smart-key-manager (fast model). Optionally logs to audit_logs (event_type ai_generation, source antigravity).
 */

import { smartAI } from './smart-key-manager';
import { logAuditEvent } from '@/lib/audit/logger';

const TESTER_SYSTEM_PROMPT = `You are an adversarial testing agent. You only output critiques and test scenarios.
Input: a plan or analysis.
Output: JSON with keys: critiques (array of { concern, severity, suggestion }), edge_cases (array of strings), suggested_tests (array of strings).
Be strict and skeptical. No code, no execution.`;

export interface CritiqueItem {
  concern: string;
  severity: string;
  suggestion: string;
}

export interface TesterOutput {
  critiques: CritiqueItem[];
  edge_cases: string[];
  suggested_tests: string[];
}

export interface TesterResult {
  critique: TesterOutput;
  model: string;
  provider: string;
  latencyMs: number;
}

/**
 * Run adversarial review on a plan or analysis JSON.
 * Optionally logs to audit_logs (event_type ai_generation, source antigravity).
 */
export async function runAdversarialReview(
  planOrAnalysis: unknown,
  options: { logAudit?: boolean } = {}
): Promise<TesterResult | null> {
  const inputText = typeof planOrAnalysis === 'string'
    ? planOrAnalysis
    : JSON.stringify(planOrAnalysis).slice(0, 12000);

  const messages = [
    { role: 'system' as const, content: TESTER_SYSTEM_PROMPT },
    { role: 'user' as const, content: `Review this plan or analysis and output your adversarial critique as JSON.\n\n${inputText}` },
  ];

  await smartAI.initialize();
  const result = await smartAI.chat(messages, {
    temperature: 0.4,
    maxTokens: 2000,
    jsonMode: true,
    preferFast: true,
  });

  if (!result?.content) return null;

  let critique: TesterOutput;
  try {
    const parsed = JSON.parse(result.content) as TesterOutput;
    critique = {
      critiques: Array.isArray(parsed.critiques) ? parsed.critiques : [],
      edge_cases: Array.isArray(parsed.edge_cases) ? parsed.edge_cases : [],
      suggested_tests: Array.isArray(parsed.suggested_tests) ? parsed.suggested_tests : [],
    };
  } catch {
    return null;
  }

  if (options.logAudit) {
    await logAuditEvent({
      event_type: 'ai_generation',
      severity: 'info',
      entity_type: 'system',
      entity_id: 'antigravity',
      entity_name: 'antigravity',
      message: 'Adversarial review completed',
      metadata: {
        source: 'antigravity',
        critique_count: critique.critiques.length,
        edge_cases_count: critique.edge_cases.length,
        model: result.model,
        provider: result.provider,
      },
      source: 'antigravity',
      triggered_by: 'system',
    });
  }

  return {
    critique,
    model: result.model,
    provider: result.provider,
    latencyMs: result.latencyMs,
  };
}
