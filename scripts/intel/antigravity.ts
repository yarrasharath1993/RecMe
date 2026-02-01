#!/usr/bin/env tsx
/**
 * Antigravity CLI (adversarial testing agent).
 * Reads a plan or ClawDBot output and produces structured critique, edge cases, and test scenarios.
 * Uses Groq/OpenAI via smart-key-manager. Optionally logs to audit_logs.
 */

import { readFileSync } from 'fs';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { parseArgs } from 'util';
import * as dotenv from 'dotenv';
import { runAdversarialReview } from '@/lib/ai/tester';

dotenv.config({ path: '.env.local' });

const { values } = parseArgs({
  options: {
    'plan': { type: 'string' },
    'input': { type: 'string' },
    'output': { type: 'string', default: 'stdout' },
    'audit': { type: 'boolean', default: false },
    'help': { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
});

function showHelp() {
  console.log(`
Antigravity CLI (adversarial testing agent)

Reviews a plan or analysis and outputs critiques, edge cases, and suggested tests.

USAGE:
  npx tsx scripts/intel/antigravity.ts [OPTIONS]

OPTIONS:
  --plan <path>    Path to plan JSON (e.g. from planner.ts --output)
  --input <path>   Path to any JSON file (plan or ClawDBot analysis)
  --output <path>  Output file path (default: stdout)
  --audit          Log "adversarial review completed" to audit_logs (source: antigravity)
  --help, -h       Show this help message

EXAMPLES:
  npx tsx scripts/intel/antigravity.ts --plan=reports/plan.json --output=reports/critique.json
  npx tsx scripts/intel/antigravity.ts --input=reports/clawdbot-analysis.json --audit

Requires GROQ_API_KEY or OPENAI_API_KEY in .env.local.
`);
}

async function main(): Promise<void> {
  if (values.help) {
    showHelp();
    process.exit(0);
  }

  const inputPath = values.plan ?? values.input;
  if (!inputPath) {
    console.error('Error: provide --plan or --input with a file path.');
    showHelp();
    process.exit(1);
  }

  let planOrAnalysis: unknown;
  try {
    const raw = readFileSync(inputPath, 'utf-8');
    planOrAnalysis = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read or parse input file:', err);
    process.exit(1);
  }

  try {
    const result = await runAdversarialReview(planOrAnalysis, { logAudit: values.audit ?? false });
    if (!result) {
      console.error('Antigravity failed to produce a critique.');
      process.exit(1);
    }

    const outputPayload = {
      critique: result.critique,
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
      console.log(`Critique written to ${outPath}`);
    }
  } catch (err) {
    console.error('Antigravity error:', err);
    process.exit(1);
  }
}

main();
