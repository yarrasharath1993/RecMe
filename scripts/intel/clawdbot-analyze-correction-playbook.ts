#!/usr/bin/env tsx
/**
 * ClawDBot: Analyze the Chiranjeevi correction summary and output insights + playbook for reuse on another actor.
 *
 * 1. Loads reports/clawdbot-chiranjeevi-correction-summary.json (governance-style).
 * 2. Runs ClawDBot governance analyzer on it.
 * 3. Loads lib/clawdbot/learnings/actor-filmography-lessons.json.
 * 4. Outputs: governance analysis + "Recommended actions for next actor" (from playbook/lessons).
 *
 * Usage:
 *   npx tsx scripts/intel/clawdbot-analyze-correction-playbook.ts
 *   npx tsx scripts/intel/clawdbot-analyze-correction-playbook.ts --output=reports/clawdbot-playbook-analysis.json
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { analyzeGovernanceReport } from '../../lib/clawdbot/governance-analyzer';
import type { GovernanceReportInput } from '../../lib/clawdbot/types';
import chalk from 'chalk';

const ROOT = process.cwd();
const CORRECTION_SUMMARY_PATH = join(ROOT, 'reports', 'clawdbot-chiranjeevi-correction-summary.json');
const LESSONS_PATH = join(ROOT, 'lib', 'clawdbot', 'learnings', 'actor-filmography-lessons.json');
const PLAYBOOK_PATH = join(ROOT, 'docs', 'clawdbot', 'ACTOR_FILMOGRAPHY_CORRECTION_PLAYBOOK.md');

function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string) => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1].replace(/['"]/g, '') : '';
  };
  const outputPath = getArg('output');

  console.log(chalk.cyan.bold('\nClawDBot: Actor Filmography Correction Playbook Analysis\n'));
  console.log(chalk.gray('  Correction summary: ' + CORRECTION_SUMMARY_PATH));
  console.log(chalk.gray('  Lessons: ' + LESSONS_PATH));
  console.log(chalk.gray('  Playbook: ' + PLAYBOOK_PATH + '\n'));

  if (!existsSync(CORRECTION_SUMMARY_PATH)) {
    console.error(chalk.red('Correction summary not found: ' + CORRECTION_SUMMARY_PATH));
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(CORRECTION_SUMMARY_PATH, 'utf8'));
  const input: GovernanceReportInput = {
    report_id: raw.report_id || 'actor-filmography-correction',
    generated_at: raw.generated_at || new Date().toISOString(),
    decisions: (raw.decisions || []).map((d: any) => ({
      entity_id: d.entity_id,
      entity_type: d.entity_type || 'movie',
      decision: d.decision,
      rule_violations: d.rule_violations,
      trust_score: d.trust_score,
      trust_level: d.trust_level,
    })),
  };

  const analysis = analyzeGovernanceReport(input);

  console.log(chalk.green('Governance analysis'));
  console.log('  ' + analysis.summary);
  console.log('  Approved: ' + analysis.approved_count);
  console.log('  Flagged: ' + analysis.flagged_count);
  console.log('  Rejected: ' + analysis.rejected_count);
  console.log('  Trust distribution: ' + JSON.stringify(analysis.trust_distribution));

  let lessons: any = {};
  if (existsSync(LESSONS_PATH)) {
    lessons = JSON.parse(readFileSync(LESSONS_PATH, 'utf8'));
    console.log(chalk.cyan('\nStructured lessons (for next actor)'));
    console.log('  Role corrections: ' + Object.keys(lessons.role_corrections || {}).join(', '));
    console.log('  Removals: ' + Object.keys(lessons.removals || {}).join(', '));
    console.log('  Duplicates: ' + Object.keys(lessons.duplicates || {}).join(', '));
    console.log('  Add missing: ' + Object.keys(lessons.add_missing || {}).join(', '));
  }

  const recommendedForNextActor = [
    '1. Export filmography: movie name + role (batch 1) for the new actor.',
    '2. Manual review: note role corrections (hero/villain/supporting/cameo), removals, duplicates, missing films.',
    '3. Apply role corrections using the same patterns (see playbook): hero→villain, supporting→hero, hero→supporting, supporting→cameo.',
    '4. Remove actor from films that are not in filmography; set hero to correct lead.',
    '5. Merge duplicates: keep one row per film (preferred title), delete duplicate rows.',
    '6. Add missing films/roles; set is_published true where needed.',
    '7. Re-export and verify; ensure villain/cameo/supporting show in profile.',
    '8. Use playbook: docs/clawdbot/ACTOR_FILMOGRAPHY_CORRECTION_PLAYBOOK.md',
    '9. Use lessons: lib/clawdbot/learnings/actor-filmography-lessons.json',
  ];

  console.log(chalk.yellow('\nRecommended actions for next actor'));
  recommendedForNextActor.forEach(line => console.log('  ' + line));

  const output = {
    correction_summary_path: CORRECTION_SUMMARY_PATH,
    playbook_path: PLAYBOOK_PATH,
    lessons_path: LESSONS_PATH,
    governance_analysis: analysis,
    lessons_summary: lessons?.description ? { description: lessons.description, scripts: lessons.scripts } : {},
    recommended_for_next_actor: recommendedForNextActor,
    generated_at: new Date().toISOString(),
  };

  if (outputPath) {
    writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
    console.log(chalk.green('\nWrote: ' + outputPath));
  } else {
    console.log(chalk.gray('\n(Use --output=path to write full JSON)'));
  }
  console.log('');
}

main();
