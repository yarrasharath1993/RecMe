#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { parseArgs } from 'util';
import {
  analyzeValidationReport,
  analyzeGovernanceReport,
  analyzeConfidenceDelta,
  generateChangeSummary,
  analyzeTrends,
  generateEditorialIdeas,
  generateSocialDrafts
} from '@/lib/clawdbot';
import { analyzeFilmography } from '@/lib/clawdbot/filmography-analyzer';
import type {
  ValidationReportInput,
  GovernanceReportInput,
  ConfidenceDeltaInput,
  TrendInput,
  FilmographyDiscoveryReport
} from '@/lib/clawdbot/types';

const { values } = parseArgs({
  options: {
    'validation-report': { type: 'string' },
    'governance-report': { type: 'string' },
    'confidence-delta': { type: 'string' },
    'trend-input': { type: 'string' },
    'change-summary-input': { type: 'string' },
    'filmography-report': { type: 'string' },
    'generate-ideas': { type: 'boolean' },
    'generate-drafts': { type: 'boolean' },
    'output': { type: 'string', default: 'stdout' },
    'help': { type: 'boolean', short: 'h' }
  },
  allowPositionals: true
});

function showHelp() {
  console.log(`
ClawDBot Intelligence System CLI

USAGE:
  npx tsx scripts/intel/clawdbot.ts [OPTIONS]

OPTIONS:
  --validation-report <path>     Path to validation report JSON file
  --governance-report <path>     Path to governance report JSON file
  --confidence-delta <path>       Path to confidence delta JSON file
  --trend-input <path>            Path to trend input JSON file
  --change-summary-input <path>   Path to change summary input JSON file
  --filmography-report <path>     Path to filmography discovery report JSON file
  --generate-ideas                Generate editorial ideas from analyses
  --generate-drafts               Generate social media drafts from analyses
  --output <path>                 Output file path (default: stdout)
  --help, -h                      Show this help message

EXAMPLES:
  # Analyze validation report
  npx tsx scripts/intel/clawdbot.ts --validation-report=reports/validation.json

  # Analyze trends and generate ideas/drafts
  npx tsx scripts/intel/clawdbot.ts --trend-input=reports/trends.json --generate-ideas --generate-drafts

  # Save output to file
  npx tsx scripts/intel/clawdbot.ts --validation-report=report.json --output=output.json

INPUT FORMATS:
  See lib/clawdbot/examples/ for sample JSON files:
  - validation-report.sample.json
  - governance-report.sample.json
  - confidence-delta.sample.json
  - trend-input.sample.json

For more information, see docs/CLAWDBOT.md
`);
}

async function main(): Promise<void> {
  // Show help if requested or no arguments provided
  if (values.help || (!values['validation-report'] && !values['governance-report'] && 
      !values['confidence-delta'] && !values['trend-input'] && !values['change-summary-input'] && 
      !values['filmography-report'])) {
    showHelp();
    if (values.help) {
      process.exit(0);
    }
    // If no args but help not explicitly requested, still show help and exit
    if (!values.help) {
      process.exit(0);
    }
  }

  try {
    const outputs: any[] = [];

    // Route validation report
    if (values['validation-report']) {
      const input = JSON.parse(readFileSync(values['validation-report'], 'utf-8')) as ValidationReportInput;
      const analysis = analyzeValidationReport(input);
      outputs.push({ type: 'validation_analysis', data: analysis });
    }

    // Route governance report
    if (values['governance-report']) {
      const input = JSON.parse(readFileSync(values['governance-report'], 'utf-8')) as GovernanceReportInput;
      const analysis = analyzeGovernanceReport(input);
      outputs.push({ type: 'governance_analysis', data: analysis });
    }

    // Route confidence delta
    if (values['confidence-delta']) {
      const input = JSON.parse(readFileSync(values['confidence-delta'], 'utf-8')) as ConfidenceDeltaInput;
      const analysis = analyzeConfidenceDelta(input);
      outputs.push({ type: 'confidence_analysis', data: analysis });
    }

    // Route trend input
    if (values['trend-input']) {
      const input = JSON.parse(readFileSync(values['trend-input'], 'utf-8')) as TrendInput;
      const analysis = analyzeTrends(input);
      outputs.push({ type: 'trend_analysis', data: analysis });
    }

    // Route change summary input
    if (values['change-summary-input']) {
      const input = JSON.parse(readFileSync(values['change-summary-input'], 'utf-8'));
      const summary = generateChangeSummary(input);
      outputs.push({ type: 'change_summary', data: summary });
    }

    // Route filmography report
    if (values['filmography-report']) {
      const input = JSON.parse(readFileSync(values['filmography-report'], 'utf-8')) as FilmographyDiscoveryReport;
      const analysis = await analyzeFilmography(input);
      outputs.push({ type: 'filmography_analysis', data: analysis });
    }

    // Generate ideas if requested
    if (values['generate-ideas']) {
      // Collect all analyses for idea generation
      const ideaInput: any = {};
      outputs.forEach(output => {
        if (output.type === 'validation_analysis') ideaInput.validation_analysis = output.data;
        if (output.type === 'governance_analysis') ideaInput.governance_analysis = output.data;
        if (output.type === 'confidence_analysis') ideaInput.confidence_analysis = output.data;
        if (output.type === 'trend_analysis') ideaInput.trend_analysis = output.data;
        if (output.type === 'change_summary') ideaInput.change_summary = output.data;
        if (output.type === 'filmography_analysis') ideaInput.filmography_analysis = output.data;
      });
      
      const ideas = generateEditorialIdeas(ideaInput);
      outputs.push({ type: 'editorial_ideas', data: ideas });
    }

    // Generate social drafts if requested
    if (values['generate-drafts']) {
      const draftInput: any = {};
      outputs.forEach(output => {
        if (output.type === 'validation_analysis') draftInput.validation_analysis = output.data;
        if (output.type === 'governance_analysis') draftInput.governance_analysis = output.data;
        if (output.type === 'confidence_analysis') draftInput.confidence_analysis = output.data;
        if (output.type === 'trend_analysis') draftInput.trend_analysis = output.data;
        if (output.type === 'change_summary') draftInput.change_summary = output.data;
        if (output.type === 'filmography_analysis') draftInput.filmography_analysis = output.data;
      });
      
      const drafts = generateSocialDrafts(draftInput);
      outputs.push({ type: 'social_drafts', data: drafts });
    }

    // Output results
    if (values.output === 'stdout') {
      console.log(JSON.stringify({ outputs }, null, 2));
    } else {
      // Write to file
      const fs = await import('fs/promises');
      await fs.writeFile(values.output as string, JSON.stringify({ outputs }, null, 2));
    }

  } catch (error) {
    console.error('ClawDBot CLI Error:', error);
    process.exit(1);
  }
}

main();
