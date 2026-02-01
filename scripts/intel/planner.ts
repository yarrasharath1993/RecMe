#!/usr/bin/env tsx
/**
 * Planner CLI (Claude-like planning agent).
 * Reads validation/trend/governance reports and outputs a structured plan via LLM.
 * Uses Groq/OpenAI via smart-key-manager. Optionally logs to audit_logs.
 */

import { readFileSync } from 'fs';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { parseArgs } from 'util';
import * as dotenv from 'dotenv';
import { generatePlan, type PlannerInput } from '@/lib/ai/planner';

dotenv.config({ path: '.env.local' });

const { values, positionals } = parseArgs({
  options: {
    'validation-report': { type: 'string' },
    'trend-input': { type: 'string' },
    'governance-report': { type: 'string' },
    'input': { type: 'string' },
    'output': { type: 'string', default: 'stdout' },
    'audit': { type: 'boolean', default: false },
    'help': { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
});

// Fallback: npm on Windows sometimes does not forward args after --; use first positional as --input
if (!values.input && !values['validation-report'] && !values['trend-input'] && !values['governance-report'] && positionals?.length) {
  const first = positionals[0];
  if (first && !first.startsWith('-')) {
    values.input = first;
  }
}
if (!values.output && positionals?.length >= 2 && !positionals[1].startsWith('-')) {
  values.output = positionals[1];
}

function showHelp() {
  console.log(`
Planner CLI (planning agent)

Reads validation, trend, or governance reports and outputs a structured plan.

USAGE:
  npx tsx scripts/intel/planner.ts [OPTIONS]

OPTIONS:
  --validation-report <path>  Path to validation report JSON (or path to file with "validation" context)
  --trend-input <path>         Path to trend input JSON
  --governance-report <path>   Path to governance report JSON
  --input <path>               Path to a single JSON file; will use as context (expects keys like summary or raw text)
  --output <path>              Output file path (default: stdout)
  --audit                      Log "plan created" to audit_logs (source: planner)
  --help, -h                   Show this help message

EXAMPLES:
  npx tsx scripts/intel/planner.ts --validation-report=reports/validation.json --output=reports/plan.json
  npx tsx scripts/intel/planner.ts --trend-input=reports/trends.json --audit
  npx tsx scripts/intel/planner.ts --input=reports/context.json --output=reports/plan.json

Requires GROQ_API_KEY or OPENAI_API_KEY in .env.local.
`);
}

async function main(): Promise<void> {
  if (values.help) {
    showHelp();
    process.exit(0);
  }

  const input: PlannerInput = {};

  if (values['validation-report']) {
    const raw = readFileSync(values['validation-report'], 'utf-8');
    try {
      const data = JSON.parse(raw);
      input.validation_summary = typeof data.summary === 'string' ? data.summary : JSON.stringify(data).slice(0, 8000);
    } catch {
      input.validation_summary = raw.slice(0, 8000);
    }
  }
  if (values['trend-input']) {
    const raw = readFileSync(values['trend-input'], 'utf-8');
    try {
      const data = JSON.parse(raw);
      input.trend_summary = typeof data.summary === 'string' ? data.summary : JSON.stringify(data).slice(0, 8000);
    } catch {
      input.trend_summary = raw.slice(0, 8000);
    }
  }
  if (values['governance-report']) {
    const raw = readFileSync(values['governance-report'], 'utf-8');
    try {
      const data = JSON.parse(raw);
      input.governance_summary = typeof data.summary === 'string' ? data.summary : JSON.stringify(data).slice(0, 8000);
    } catch {
      input.governance_summary = raw.slice(0, 8000);
    }
  }
  if (values.input) {
    const raw = readFileSync(values.input, 'utf-8');
    try {
      const data = JSON.parse(raw);
      if (data.validation_summary) input.validation_summary = String(data.validation_summary).slice(0, 8000);
      if (data.trend_summary) input.trend_summary = String(data.trend_summary).slice(0, 8000);
      if (data.governance_summary) input.governance_summary = String(data.governance_summary).slice(0, 8000);
      if (!input.validation_summary && !input.trend_summary && !input.governance_summary) {
        input.validation_summary = JSON.stringify(data).slice(0, 8000);
      }
    } catch {
      input.validation_summary = raw.slice(0, 8000);
    }
  }

  if (!input.validation_summary && !input.trend_summary && !input.governance_summary) {
    console.error('Error: provide at least one of --validation-report, --trend-input, --governance-report, or --input');
    showHelp();
    process.exit(1);
  }

  try {
    const result = await generatePlan(input, { logAudit: values.audit ?? false });
    if (!result) {
      console.error('Planner failed to produce a plan.');
      process.exit(1);
    }

    const outputPayload = {
      plan: result.plan,
      meta: { model: result.model, provider: result.provider, latencyMs: result.latencyMs },
    };
    const outJson = JSON.stringify(outputPayload, null, 2);

    if (values.output === 'stdout') {
      console.log(outJson);
    } else {
      const outPath = values.output as string;
      const dir = dirname(outPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(outPath, outJson, 'utf-8');
      console.log(`Plan written to ${outPath}`);
    }
  } catch (err) {
    console.error('Planner error:', err);
    process.exit(1);
  }
}

main();
