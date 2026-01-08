#!/usr/bin/env npx tsx
/**
 * MASTER ENRICHMENT ORCHESTRATOR
 *
 * Runs all enrichment scripts in optimal order with checkpointing
 * for resume-on-failure. Generates comprehensive reports.
 *
 * Execution Order:
 *   1. Images (highest visual impact)
 *   2. Cast/Crew (essential metadata)
 *   3. Editorial Scores (for unrated movies)
 *   4. Validation (multi-source consensus)
 *   5. Synopsis enrichment
 *   6. Smart reviews derivation
 *
 * Usage:
 *   npx tsx scripts/enrich-master.ts --full --execute
 *   npx tsx scripts/enrich-master.ts --phase=images --execute
 *   npx tsx scripts/enrich-master.ts --resume --execute
 *   npx tsx scripts/enrich-master.ts --status  # Check current status
 */

import { createClient } from '@supabase/supabase-js';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string = ''): string => {
    const arg = args.find((a) => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const FULL = hasFlag('full');
const RESUME = hasFlag('resume');
const STATUS = hasFlag('status');
const EXECUTE = hasFlag('execute');
const PHASE = getArg('phase', '');
const LIMIT = getArg('limit', '500');
const CONCURRENCY = getArg('concurrency', '20');
const DIRECTOR = getArg('director', '');
const ACTOR = getArg('actor', '');
const SLUG = getArg('slug', '');

// Checkpoint file location
const CHECKPOINT_FILE = path.join(process.cwd(), '.enrichment-checkpoint.json');
const REPORT_DIR = path.join(process.cwd(), 'reports');

interface Checkpoint {
    started_at: string;
    last_phase: string;
    completed_phases: string[];
    failed_phases: string[];
    phase_stats: Record<string, { processed: number; enriched: number; duration_ms: number }>;
    resumable: boolean;
}

interface PhaseConfig {
    name: string;
    script: string;
    args: string[];
    description: string;
    priority: number;
}

// Phase definitions in execution order
const PHASES: PhaseConfig[] = [
    {
        name: 'images',
        script: 'scripts/enrich-images-fast.ts',
        args: ['--concurrency=' + CONCURRENCY],
        description: 'Poster images from TMDB, Wikipedia, Wikimedia, Internet Archive',
        priority: 1,
    },
    {
        name: 'cast-crew',
        script: 'scripts/enrich-cast-crew.ts',
        args: ['--extended', '--concurrency=' + CONCURRENCY],
        description: 'Hero, heroine, director, music director, producer, 5 supporting cast',
        priority: 2,
    },
    {
        name: 'editorial-scores',
        script: 'scripts/enrich-editorial-scores.ts',
        args: ['--unrated-only', '--concurrency=' + CONCURRENCY],
        description: 'Editorial scores for movies without external ratings',
        priority: 3,
    },
    {
        name: 'validation',
        script: 'scripts/validate-all.ts',
        args: ['--auto-fix', `--report=${REPORT_DIR}/validation-${Date.now()}.md`],
        description: 'Multi-source validation with auto-fix for 3+ consensus',
        priority: 4,
    },
];

// ============================================================================
// CHECKPOINT MANAGEMENT
// ============================================================================

function loadCheckpoint(): Checkpoint | null {
    try {
        if (fs.existsSync(CHECKPOINT_FILE)) {
            return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
        }
    } catch {
        // Ignore errors
    }
    return null;
}

function saveCheckpoint(checkpoint: Checkpoint): void {
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

function clearCheckpoint(): void {
    if (fs.existsSync(CHECKPOINT_FILE)) {
        fs.unlinkSync(CHECKPOINT_FILE);
    }
}

// ============================================================================
// SCRIPT EXECUTION
// ============================================================================

async function runPhase(phase: PhaseConfig, execute: boolean): Promise<{ success: boolean; duration_ms: number }> {
    return new Promise((resolve) => {
        const startTime = Date.now();

        const phaseArgs = [...phase.args, `--limit=${LIMIT}`];
        if (execute) {
            phaseArgs.push('--execute');
        }

        // Add director/actor/slug filters if provided
        if (DIRECTOR) {
            phaseArgs.push(`--director=${DIRECTOR}`);
        }
        if (ACTOR) {
            phaseArgs.push(`--actor=${ACTOR}`);
        }
        if (SLUG) {
            phaseArgs.push(`--slug=${SLUG}`);
        }

        console.log(chalk.cyan(`\n  Running: npx tsx ${phase.script} ${phaseArgs.join(' ')}\n`));

        const child: ChildProcess = spawn('npx', ['tsx', phase.script, ...phaseArgs], {
            stdio: 'inherit',
            shell: true,
        });

        child.on('close', (code) => {
            const duration_ms = Date.now() - startTime;
            resolve({
                success: code === 0,
                duration_ms,
            });
        });

        child.on('error', () => {
            const duration_ms = Date.now() - startTime;
            resolve({
                success: false,
                duration_ms,
            });
        });
    });
}

// ============================================================================
// STATUS CHECK
// ============================================================================

async function checkEnrichmentStatus(): Promise<void> {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           ENRICHMENT STATUS CHECK                                    ║
╚══════════════════════════════════════════════════════════════════════╝
`));

    // Get total movies
    const { count: totalMovies } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true })
        .eq('language', 'Telugu');

    console.log(`  Total Telugu movies: ${chalk.cyan(totalMovies)}\n`);

    // Check each data category
    const checks = [
        { label: 'Has poster image', query: () => supabase.from('movies').select('*', { count: 'exact', head: true }).eq('language', 'Telugu').not('poster_url', 'ilike', '%placeholder%').not('poster_url', 'is', null) },
        { label: 'Has hero', query: () => supabase.from('movies').select('*', { count: 'exact', head: true }).eq('language', 'Telugu').not('hero', 'is', null).not('hero', 'eq', 'Unknown') },
        { label: 'Has heroine', query: () => supabase.from('movies').select('*', { count: 'exact', head: true }).eq('language', 'Telugu').not('heroine', 'is', null).not('heroine', 'eq', 'Unknown') },
        { label: 'Has director', query: () => supabase.from('movies').select('*', { count: 'exact', head: true }).eq('language', 'Telugu').not('director', 'is', null).not('director', 'eq', 'Unknown') },
        { label: 'Has music director', query: () => supabase.from('movies').select('*', { count: 'exact', head: true }).eq('language', 'Telugu').not('music_director', 'is', null) },
        { label: 'Has producer', query: () => supabase.from('movies').select('*', { count: 'exact', head: true }).eq('language', 'Telugu').not('producer', 'is', null) },
        { label: 'Has supporting cast', query: () => supabase.from('movies').select('*', { count: 'exact', head: true }).eq('language', 'Telugu').not('supporting_cast', 'is', null).not('supporting_cast', 'eq', '[]') },
        { label: 'Has TMDB ID', query: () => supabase.from('movies').select('*', { count: 'exact', head: true }).eq('language', 'Telugu').not('tmdb_id', 'is', null) },
        { label: 'Has external rating', query: () => supabase.from('movies').select('*', { count: 'exact', head: true }).eq('language', 'Telugu').or('ox_rating.not.is.null,imdb_rating.not.is.null,tmdb_rating.not.is.null') },
        { label: 'Has editorial score', query: () => supabase.from('movies').select('*', { count: 'exact', head: true }).eq('language', 'Telugu').not('editorial_score', 'is', null) },
        { label: 'Has synopsis', query: () => supabase.from('movies').select('*', { count: 'exact', head: true }).eq('language', 'Telugu').not('synopsis_en', 'is', null) },
    ];

    console.log('  Data Coverage:\n');

    for (const check of checks) {
        const { count } = await check.query();
        const pct = totalMovies ? Math.round(((count || 0) / totalMovies) * 100) : 0;
        const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));

        const colorFn = pct >= 80 ? chalk.green : pct >= 50 ? chalk.yellow : chalk.red;
        console.log(`  ${check.label.padEnd(22)} [${bar}] ${colorFn(`${pct}%`)} (${count}/${totalMovies})`);
    }

    // Check checkpoint
    const checkpoint = loadCheckpoint();
    if (checkpoint) {
        console.log(chalk.cyan(`\n  Active Checkpoint:`));
        console.log(`    Started: ${checkpoint.started_at}`);
        console.log(`    Last phase: ${checkpoint.last_phase}`);
        console.log(`    Completed: ${checkpoint.completed_phases.join(', ') || 'None'}`);
        console.log(`    Failed: ${checkpoint.failed_phases.join(', ') || 'None'}`);
        console.log(chalk.yellow(`\n  Run with --resume to continue from last checkpoint.`));
    }
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

async function main(): Promise<void> {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           MASTER ENRICHMENT ORCHESTRATOR                             ║
║     Images → Cast/Crew → Scores → Validation                        ║
╚══════════════════════════════════════════════════════════════════════╝
`));

    // Ensure reports directory exists
    if (!fs.existsSync(REPORT_DIR)) {
        fs.mkdirSync(REPORT_DIR, { recursive: true });
    }

    // Status check mode
    if (STATUS) {
        await checkEnrichmentStatus();
        return;
    }

    // Determine phases to run
    let phasesToRun: PhaseConfig[] = [];

    if (PHASE) {
        // Single phase mode
        const phase = PHASES.find((p) => p.name === PHASE);
        if (!phase) {
            console.error(chalk.red(`Unknown phase: ${PHASE}`));
            console.log(`Available phases: ${PHASES.map((p) => p.name).join(', ')}`);
            return;
        }
        phasesToRun = [phase];
    } else if (RESUME) {
        // Resume from checkpoint
        const checkpoint = loadCheckpoint();
        if (!checkpoint) {
            console.log(chalk.yellow('  No checkpoint found. Starting from beginning.'));
            phasesToRun = PHASES;
        } else {
            console.log(`  Resuming from checkpoint (started ${checkpoint.started_at})`);
            phasesToRun = PHASES.filter((p) => !checkpoint.completed_phases.includes(p.name));
        }
    } else if (FULL) {
        // Full enrichment
        phasesToRun = PHASES;
        clearCheckpoint(); // Start fresh
    } else {
        // Default: show help
        console.log(`  Usage:`);
        console.log(`    --full           Run all enrichment phases`);
        console.log(`    --phase=NAME     Run specific phase (images, cast-crew, editorial-scores, validation)`);
        console.log(`    --resume         Resume from last checkpoint`);
        console.log(`    --status         Show current enrichment status`);
        console.log(`    --execute        Apply changes (default is dry run)`);
        console.log(`    --limit=N        Limit records per phase (default: 500)`);
        console.log(`\n  Filters (optional):`);
        console.log(`    --director=NAME  Filter movies by director (e.g., --director="Puri Jagannadh")`);
        console.log(`    --actor=NAME     Filter movies by actor/hero (e.g., --actor="Mahesh Babu")`);
        console.log(`    --slug=SLUG      Process a single movie by slug`);
        console.log(`\n  Examples:`);
        console.log(`    npx tsx scripts/enrich-master.ts --full --execute`);
        console.log(`    npx tsx scripts/enrich-master.ts --full --director="Puri Jagannadh" --execute`);
        console.log(`    npx tsx scripts/enrich-master.ts --phase=images --actor="Mahesh Babu" --execute`);
        console.log(`    npx tsx scripts/enrich-master.ts --slug=pokiri-2006 --full --execute`);
        return;
    }

    console.log(`  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`);
    console.log(`  Phases: ${phasesToRun.map((p) => p.name).join(' → ')}`);
    console.log(`  Limit per phase: ${LIMIT}`);
    console.log(`  Concurrency: ${CONCURRENCY}`);

    // Show active filters
    if (DIRECTOR || ACTOR || SLUG) {
        console.log(chalk.yellow(`\n  Active Filters:`));
        if (DIRECTOR) console.log(`    Director: "${DIRECTOR}"`);
        if (ACTOR) console.log(`    Actor: "${ACTOR}"`);
        if (SLUG) console.log(`    Slug: "${SLUG}"`);
    }

    // Initialize checkpoint
    let checkpoint = loadCheckpoint() || {
        started_at: new Date().toISOString(),
        last_phase: '',
        completed_phases: [],
        failed_phases: [],
        phase_stats: {},
        resumable: true,
    };

    const totalStartTime = Date.now();

    // Run each phase
    for (const phase of phasesToRun) {
        console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════
Phase ${phase.priority}: ${phase.name.toUpperCase()}
═══════════════════════════════════════════════════════════════════`));
        console.log(`  ${phase.description}\n`);

        checkpoint.last_phase = phase.name;
        saveCheckpoint(checkpoint);

        const result = await runPhase(phase, EXECUTE);

        checkpoint.phase_stats[phase.name] = {
            processed: 0, // Would need to parse output to get actual stats
            enriched: 0,
            duration_ms: result.duration_ms,
        };

        if (result.success) {
            checkpoint.completed_phases.push(phase.name);
            console.log(chalk.green(`\n  ✅ Phase ${phase.name} completed in ${(result.duration_ms / 1000).toFixed(1)}s`));
        } else {
            checkpoint.failed_phases.push(phase.name);
            console.log(chalk.red(`\n  ❌ Phase ${phase.name} failed after ${(result.duration_ms / 1000).toFixed(1)}s`));

            // Save checkpoint and exit
            saveCheckpoint(checkpoint);
            console.log(chalk.yellow(`\n  Checkpoint saved. Run with --resume to continue.`));
            return;
        }

        saveCheckpoint(checkpoint);
    }

    const totalDuration = Date.now() - totalStartTime;

    // Final summary
    console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════
📊 MASTER ENRICHMENT SUMMARY
═══════════════════════════════════════════════════════════════════`));
    console.log(`  Total duration: ${(totalDuration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`  Phases completed: ${checkpoint.completed_phases.length}/${phasesToRun.length}`);

    console.log(`\n  Phase Durations:`);
    for (const [name, stats] of Object.entries(checkpoint.phase_stats)) {
        console.log(`    ${name}: ${(stats.duration_ms / 1000).toFixed(1)}s`);
    }

    if (checkpoint.failed_phases.length > 0) {
        console.log(chalk.red(`\n  Failed phases: ${checkpoint.failed_phases.join(', ')}`));
    }

    // Clear checkpoint on full success
    if (checkpoint.failed_phases.length === 0 && checkpoint.completed_phases.length === phasesToRun.length) {
        clearCheckpoint();
        console.log(chalk.green(`\n  ✅ All phases completed successfully!`));
    }

    // Run final status check
    console.log('\n');
    await checkEnrichmentStatus();
}

main().catch(console.error);
