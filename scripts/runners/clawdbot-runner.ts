#!/usr/bin/env tsx

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';
import { getAllowedRunScriptActions } from '@/lib/execution/allowlist';

const execAsync = promisify(exec);

interface RunnerConfig {
  schedule_interval_minutes: number;
  output_directory: string;
  telegram_enabled: boolean;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  whatsapp_enabled: boolean;
  log_file: string;
  /** Optional: path to approved handoff JSON; if set and execute_handoff, run allowlisted scripts from actions */
  handoff_path?: string;
  /** Run allowlisted run_script actions from handoff (only when approved_by === 'human') */
  execute_handoff: boolean;
  /** If true, only log what would be run; do not execute */
  dry_run_handoff: boolean;
}

async function runClawDBot() {
  const config = loadConfig();
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] ClawDBot Runner: Starting...`);

  try {
    // 0. Optional: run allowlisted scripts from approved handoff
    if (config.handoff_path && (config.execute_handoff || config.dry_run_handoff)) {
      await runApprovedHandoff(config);
    }

    // 1. Collect latest reports (from existing pipelines or DB)
    const reports = await collectLatestReports();

    // 2. Invoke ClawDBot CLI
    const outputs = await invokeClawDBot(reports);

    // 3. Save outputs
    await saveOutputs(outputs, config.output_directory, timestamp);

    // 4. Route to destinations
    if (config.telegram_enabled && outputs.outputs && outputs.outputs.length > 0) {
      await sendToTelegram(outputs, config);
    }

    // 5. Log results
    await logResults(timestamp, outputs, config.log_file);

    console.log(`[${timestamp}] ClawDBot Runner: Completed successfully`);

  } catch (error) {
    console.error(`[${timestamp}] ClawDBot Runner Error:`, error);
    await logError(timestamp, error, config.log_file);
  }
}

async function collectLatestReports(): Promise<any> {
  // Read from files or query Supabase for latest reports
  // This is I/O - runner's responsibility, not ClawDBot's
  
  const reports: any = {};
  
  // Example: Read validation report if exists
  const validationReportPath = join(process.cwd(), 'reports', 'latest-validation-report.json');
  if (existsSync(validationReportPath)) {
    try {
      reports.validation = JSON.parse(readFileSync(validationReportPath, 'utf-8'));
    } catch (error) {
      console.warn('Failed to read validation report:', error);
    }
  }

  // Example: Read governance report if exists
  const governanceReportPath = join(process.cwd(), 'reports', 'latest-governance-report.json');
  if (existsSync(governanceReportPath)) {
    try {
      reports.governance = JSON.parse(readFileSync(governanceReportPath, 'utf-8'));
    } catch (error) {
      console.warn('Failed to read governance report:', error);
    }
  }

  // Example: Read trend data if exists
  const trendDataPath = join(process.cwd(), 'reports', 'latest-trend-data.json');
  if (existsSync(trendDataPath)) {
    try {
      reports.trend = JSON.parse(readFileSync(trendDataPath, 'utf-8'));
    } catch (error) {
      console.warn('Failed to read trend data:', error);
    }
  }

  // Example: Query Supabase for governance decisions
  // (Runner handles DB access, not ClawDBot)
  // This would require Supabase client setup in the runner
  
  return reports;
}

async function invokeClawDBot(reports: any): Promise<any> {
  // Build CLI command with collected reports
  const args: string[] = [];
  const tempFiles: string[] = [];
  
  // Ensure temp directory exists
  const tempDir = join(process.cwd(), 'temp');
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }

  if (reports.validation) {
    const tempFile = join(tempDir, `validation-${Date.now()}.json`);
    writeFileSync(tempFile, JSON.stringify(reports.validation));
    args.push(`--validation-report=${tempFile}`);
    tempFiles.push(tempFile);
  }

  if (reports.governance) {
    const tempFile = join(tempDir, `governance-${Date.now()}.json`);
    writeFileSync(tempFile, JSON.stringify(reports.governance));
    args.push(`--governance-report=${tempFile}`);
    tempFiles.push(tempFile);
  }

  if (reports.trend) {
    const tempFile = join(tempDir, `trend-${Date.now()}.json`);
    writeFileSync(tempFile, JSON.stringify(reports.trend));
    args.push(`--trend-input=${tempFile}`);
    tempFiles.push(tempFile);
  }

  if (args.length === 0) {
    console.log('No reports to analyze');
    return { outputs: [] };
  }

  // Add flags for idea and draft generation
  args.push('--generate-ideas');
  args.push('--generate-drafts');

  // Invoke CLI
  const command = `npx tsx scripts/intel/clawdbot.ts ${args.join(' ')}`;
  const { stdout } = await execAsync(command);
  
  // Clean up temp files
  const fs = await import('fs/promises');
  for (const file of tempFiles) {
    try {
      await fs.unlink(file);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
  
  return JSON.parse(stdout);
}

async function saveOutputs(outputs: any, outputDir: string, timestamp: string) {
  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Save to files
  const outputFile = join(outputDir, `clawdbot-${timestamp.replace(/:/g, '-')}.json`);
  writeFileSync(outputFile, JSON.stringify(outputs, null, 2));
  console.log(`Outputs saved to: ${outputFile}`);
}

async function sendToTelegram(outputs: any, config: RunnerConfig) {
  // Extract SOS alerts and high-priority drafts
  // Send via Telegram bot API
  // This is I/O - runner's responsibility
  
  if (!config.telegram_bot_token || !config.telegram_chat_id) {
    console.warn('Telegram credentials not configured, skipping Telegram send');
    return;
  }

  const { sendTelegramDraft } = await import('./telegram-sender');
  
  // Find all social drafts
  const draftsOutput = outputs.outputs?.find((o: any) => o.type === 'social_drafts');
  if (draftsOutput && draftsOutput.data && draftsOutput.data.drafts) {
    const drafts = draftsOutput.data.drafts;
    
    // Send high-priority drafts that don't require approval
    for (const draft of drafts) {
      if (draft.metadata.priority === 'high' && !draft.metadata.requires_approval) {
        try {
          await sendTelegramDraft(draft, config);
          console.log(`Sent Telegram draft: ${draft.draft_id}`);
        } catch (error) {
          console.error(`Failed to send Telegram draft ${draft.draft_id}:`, error);
        }
      }
    }
  }
}

async function logResults(timestamp: string, outputs: any, logFile: string) {
  // Ensure log directory exists
  const logDir = join(logFile, '..');
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }

  // Append to log file
  const logEntry = `[${timestamp}] ClawDBot Runner: Completed\n`;
  appendFileSync(logFile, logEntry);
}

async function logError(timestamp: string, error: any, logFile: string) {
  // Ensure log directory exists
  const logDir = join(logFile, '..');
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }

  // Append error to log file
  const errorEntry = `[${timestamp}] ClawDBot Runner Error: ${error instanceof Error ? error.message : String(error)}\n`;
  appendFileSync(logFile, errorEntry);
}

function loadConfig(): RunnerConfig {
  // Load from env or config file
  return {
    schedule_interval_minutes: parseInt(process.env.CLAWDBOT_INTERVAL_MINUTES || '60'),
    output_directory: process.env.CLAWDBOT_OUTPUT_DIR || join(process.cwd(), 'reports', 'clawdbot'),
    telegram_enabled: process.env.TELEGRAM_ENABLED === 'true',
    telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN,
    telegram_chat_id: process.env.TELEGRAM_CHAT_ID,
    whatsapp_enabled: process.env.WHATSAPP_ENABLED === 'true',
    log_file: process.env.CLAWDBOT_LOG_FILE || join(process.cwd(), 'logs', 'clawdbot-runner.log'),
    handoff_path: process.env.CLAWDBOT_APPROVED_HANDOFF,
    execute_handoff: process.env.CLAWDBOT_EXECUTE_HANDOFF === 'true',
    dry_run_handoff: process.env.CLAWDBOT_DRY_RUN_HANDOFF === 'true',
  };
}

/**
 * If approved handoff file exists and approved_by === 'human', run allowlisted run_script actions.
 * With dry_run_handoff, only log what would be run.
 */
async function runApprovedHandoff(config: RunnerConfig): Promise<void> {
  const path = config.handoff_path!;
  if (!existsSync(path)) {
    console.log(`[Handoff] No file at ${path}, skipping`);
    return;
  }
  let handoff: { approved_by?: string; actions?: unknown[] };
  try {
    handoff = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (e) {
    console.warn('[Handoff] Failed to parse handoff file:', e);
    return;
  }
  if (handoff.approved_by !== 'human') {
    console.log('[Handoff] approved_by is not "human", skipping execution');
    return;
  }
  const actions = Array.isArray(handoff.actions) ? handoff.actions : [];
  const allowed = getAllowedRunScriptActions(actions);
  if (allowed.length === 0) {
    console.log('[Handoff] No allowlisted run_script actions');
    return;
  }
  if (config.dry_run_handoff) {
    console.log('[Handoff] Dry run - would execute:', allowed.map(a => `${a.script_name} ${(a.args ?? []).join(' ')}`.trim()));
    return;
  }
  for (const action of allowed) {
    const args = (action.args ?? []).join(' ');
    const command = args ? `npm run ${action.script_name} -- ${args}` : `npm run ${action.script_name}`;
    console.log(`[Handoff] Running: ${command}`);
    try {
      const { stdout, stderr } = await execAsync(command);
      if (stdout) console.log(stdout);
      if (stderr) console.warn(stderr);
    } catch (e) {
      console.error(`[Handoff] Failed: ${command}`, e);
    }
  }
}

// Main execution
if (require.main === module) {
  runClawDBot()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
