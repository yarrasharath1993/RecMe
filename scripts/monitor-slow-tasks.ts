#!/usr/bin/env npx tsx
/**
 * REAL-TIME TASK MONITOR
 *
 * Monitors progress of slow enrichment tasks with live updates
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

const TERMINAL_BASE = '/Users/sharathchandra/.cursor/projects/Users-sharathchandra-Library-Application-Support-Cursor-Workspaces-1767815514091-workspace-json/terminals';

interface TaskProgress {
  name: string;
  terminal: string;
  current: number;
  total: number;
  enriched?: number;
  status: 'running' | 'completed' | 'not_started';
}

function parseTerminalOutput(terminalFile: string): TaskProgress | null {
  try {
    const content = fs.readFileSync(path.join(TERMINAL_BASE, terminalFile), 'utf-8');
    
    // Synopsis task
    if (content.includes('TELUGU SYNOPSIS ENRICHMENT')) {
      const processedMatch = content.match(/Processed: (\d+)\/(\d+)/);
      const summaryMatch = content.match(/Total enriched:\s+(\d+) movies/);
      
      if (summaryMatch) {
        return {
          name: 'Synopsis',
          terminal: terminalFile,
          current: parseInt(summaryMatch[1]),
          total: parseInt(summaryMatch[1]),
          status: 'completed',
        };
      } else if (processedMatch) {
        return {
          name: 'Synopsis',
          terminal: terminalFile,
          current: parseInt(processedMatch[1]),
          total: parseInt(processedMatch[2]),
          status: 'running',
        };
      }
    }
    
    // Image task
    if (content.includes('FAST IMAGE ENRICHMENT')) {
      const progressMatch = content.match(/(\d+)% \((\d+)\/(\d+)\) \| Enriched: (\d+)/);
      const summaryMatch = content.match(/Total enriched:\s+(\d+)/);
      
      if (summaryMatch) {
        return {
          name: 'Images',
          terminal: terminalFile,
          current: parseInt(summaryMatch[1]),
          total: parseInt(summaryMatch[1]),
          enriched: parseInt(summaryMatch[1]),
          status: 'completed',
        };
      } else if (progressMatch) {
        return {
          name: 'Images',
          terminal: terminalFile,
          current: parseInt(progressMatch[2]),
          total: parseInt(progressMatch[3]),
          enriched: parseInt(progressMatch[4]),
          status: 'running',
        };
      }
    }
    
    return null;
  } catch (err) {
    return null;
  }
}

function displayProgress(tasks: TaskProgress[]) {
  console.clear();
  console.log(chalk.magenta.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           🐌 SLOW TASKS MONITOR                                      ║
║           Updated: ${new Date().toLocaleTimeString()}                                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  tasks.forEach((task) => {
    const percent = task.total > 0 ? ((task.current / task.total) * 100).toFixed(0) : 0;
    const statusIcon = task.status === 'completed' ? '✅' : task.status === 'running' ? '🔄' : '⏸️';
    const statusColor = task.status === 'completed' ? chalk.green : task.status === 'running' ? chalk.cyan : chalk.gray;

    console.log(statusColor(`  ${statusIcon} ${task.name}`));
    console.log(`     Progress: ${task.current}/${task.total} (${percent}%)`);
    if (task.enriched !== undefined) {
      console.log(`     Enriched: ${task.enriched}`);
    }
    
    // Progress bar
    const barLength = 50;
    const filled = Math.round((task.current / task.total) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    console.log(statusColor(`     [${bar}]`));
    console.log('');
  });

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const runningCount = tasks.filter(t => t.status === 'running').length;

  if (completedCount === tasks.length) {
    console.log(chalk.green.bold('  🎉 All tasks completed!\n'));
  } else if (runningCount > 0) {
    console.log(chalk.cyan(`  ⏳ ${runningCount} task(s) running...\n`));
  }
}

async function main() {
  const terminals = fs.readdirSync(TERMINAL_BASE).filter(f => f.endsWith('.txt'));
  
  // Monitor every 5 seconds
  const interval = setInterval(() => {
    const tasks: TaskProgress[] = [];
    
    for (const terminal of terminals) {
      const progress = parseTerminalOutput(terminal);
      if (progress) {
        tasks.push(progress);
      }
    }
    
    if (tasks.length > 0) {
      displayProgress(tasks);
      
      // Stop monitoring if all tasks are completed
      if (tasks.every(t => t.status === 'completed')) {
        clearInterval(interval);
        console.log(chalk.green('  Monitoring stopped. All tasks completed.\n'));
        process.exit(0);
      }
    } else {
      console.log(chalk.yellow('  No active tasks found.\n'));
    }
  }, 5000);
  
  // Initial display
  console.log(chalk.cyan('  Starting monitor...\n'));
}

main().catch(console.error);
