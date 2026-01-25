#!/usr/bin/env npx tsx
/**
 * EXPORT ACTOR FILMOGRAPHY
 * 
 * Generate final validated filmography export in various formats.
 * Based on Venkatesh (76 films) and Nani (31 films) export workflows.
 * 
 * Usage:
 *   npx tsx scripts/export-actor-filmography.ts --actor="Nani" --format=csv
 *   npx tsx scripts/export-actor-filmography.ts --actor="Venkatesh" --format=markdown
 *   npx tsx scripts/export-actor-filmography.ts --actor="Mahesh Babu" --format=all
 * 
 * Output Formats:
 *   csv      - CSV with all fields
 *   tsv      - Tab-separated values
 *   markdown - Formatted markdown table
 *   json     - Full JSON export
 *   all      - All formats
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

// ============================================================
// TYPES
// ============================================================

interface ExportMovie {
  id: string;
  title_en: string;
  release_year: number;
  slug: string;
  hero: string | null;
  heroine: string | null;
  director: string | null;
  music_director: string | null;
  producer: string | null;
  cinematographer: string | null;
  tmdb_id: number | null;
  genres: string[] | null;
  crew: {
    editor?: string;
    writer?: string;
    cinematographer?: string;
  } | null;
  supporting_cast: Array<{ name: string; type?: string }> | null;
  box_office?: string | null;
  box_office_data?: Record<string, any> | null;
}

type ExportFormat = 'csv' | 'tsv' | 'markdown' | 'json' | 'all';

interface ExportOptions {
  actor: string;
  format: ExportFormat;
  outputDir: string;
  includeEmpty: boolean;
  sortBy: 'year' | 'title' | 'rating';
  sortOrder: 'asc' | 'desc';
}

// ============================================================
// CLI PARSING
// ============================================================

function parseArgs(): ExportOptions {
  const args = process.argv.slice(2);
  
  const getArg = (name: string, defaultValue: string = ''): string => {
    const arg = args.find((a) => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : defaultValue;
  };
  
  const hasFlag = (name: string): boolean => args.includes(`--${name}`);

  const actor = getArg('actor', '');
  
  if (!actor) {
    printHelp();
    process.exit(1);
  }

  return {
    actor,
    format: getArg('format', 'csv') as ExportFormat,
    outputDir: getArg('output', 'docs'),
    includeEmpty: hasFlag('include-empty'),
    sortBy: getArg('sort', 'year') as 'year' | 'title' | 'rating',
    sortOrder: getArg('order', 'desc') as 'asc' | 'desc',
  };
}

function printHelp(): void {
  console.log(`
${chalk.cyan.bold('EXPORT ACTOR FILMOGRAPHY')}

${chalk.yellow('Usage:')}
  npx tsx scripts/export-actor-filmography.ts --actor="Actor Name" [options]

${chalk.yellow('Options:')}
  --actor=NAME         ${chalk.gray('Required: Actor name to export')}
  --format=FORMAT      ${chalk.gray('Output format: csv, tsv, markdown, json, all (default: csv)')}
  --output=DIR         ${chalk.gray('Output directory (default: docs)')}
  --sort=FIELD         ${chalk.gray('Sort by: year, title, rating (default: year)')}
  --order=ORDER        ${chalk.gray('Sort order: asc, desc (default: desc)')}
  --include-empty      ${chalk.gray('Include movies with missing fields')}

${chalk.yellow('Examples:')}
  # Export as CSV
  npx tsx scripts/export-actor-filmography.ts --actor="Nani" --format=csv
  
  # Export all formats
  npx tsx scripts/export-actor-filmography.ts --actor="Venkatesh" --format=all
  
  # Export sorted by title
  npx tsx scripts/export-actor-filmography.ts --actor="Mahesh Babu" --sort=title --order=asc

${chalk.yellow('Output Files:')}
  docs/{actor}-final-filmography.csv
  docs/{actor}-final-filmography.tsv
  docs/{actor}-final-filmography.md
  docs/{actor}-final-filmography.json
`);
}

// ============================================================
// EXPORT FUNCTIONS
// ============================================================

function generateCSV(movies: ExportMovie[], delimiter: string = ','): string {
  const headers = [
    'Year', 'Title', 'Slug', 'Hero', 'Heroine', 'Director', 'Music Director',
    'Cinematographer', 'Editor', 'Writer', 'Producer', 'TMDB ID', 'Genres'
  ];
  
  const lines: string[] = [headers.join(delimiter)];
  
  for (const movie of movies) {
    const row = [
      movie.release_year || '',
      escapeField(movie.title_en, delimiter),
      movie.slug || '',
      escapeField(movie.hero || '', delimiter),
      escapeField(movie.heroine || '', delimiter),
      escapeField(movie.director || '', delimiter),
      escapeField(movie.music_director || '', delimiter),
      escapeField(movie.cinematographer || movie.crew?.cinematographer || '', delimiter),
      escapeField(movie.crew?.editor || '', delimiter),
      escapeField(movie.crew?.writer || '', delimiter),
      escapeField(movie.producer || '', delimiter),
      movie.tmdb_id || '',
      escapeField(movie.genres?.join('; ') || '', delimiter),
    ];
    lines.push(row.join(delimiter));
  }
  
  return lines.join('\n');
}

function escapeField(value: string, delimiter: string): string {
  if (!value) return '';
  if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function generateMarkdown(movies: ExportMovie[], actor: string): string {
  const lines: string[] = [];
  
  lines.push(`# ${actor} Complete Filmography`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Total Films: ${movies.length}`);
  lines.push('');
  
  // Summary by decade
  const decades: Record<string, number> = {};
  for (const movie of movies) {
    const decade = Math.floor((movie.release_year || 2000) / 10) * 10;
    decades[`${decade}s`] = (decades[`${decade}s`] || 0) + 1;
  }
  
  lines.push('## Summary by Decade');
  lines.push('');
  lines.push('| Decade | Films |');
  lines.push('|--------|-------|');
  for (const [decade, count] of Object.entries(decades).sort().reverse()) {
    lines.push(`| ${decade} | ${count} |`);
  }
  lines.push('');
  
  // Full filmography table
  lines.push('## Full Filmography');
  lines.push('');
  lines.push('| Year | Title | Heroine | Director | Music Director |');
  lines.push('|------|-------|---------|----------|----------------|');
  
  for (const movie of movies) {
    lines.push(`| ${movie.release_year} | ${movie.title_en} | ${movie.heroine || '-'} | ${movie.director || '-'} | ${movie.music_director || '-'} |`);
  }
  lines.push('');
  
  // Technical credits section
  lines.push('## Technical Credits');
  lines.push('');
  lines.push('| Year | Title | Cinematographer | Editor | Writer |');
  lines.push('|------|-------|-----------------|--------|--------|');
  
  for (const movie of movies) {
    const cine = movie.cinematographer || movie.crew?.cinematographer || '-';
    const editor = movie.crew?.editor || '-';
    const writer = movie.crew?.writer || '-';
    
    // Only include if at least one technical credit exists
    if (cine !== '-' || editor !== '-' || writer !== '-') {
      lines.push(`| ${movie.release_year} | ${movie.title_en} | ${cine} | ${editor} | ${writer} |`);
    }
  }
  
  return lines.join('\n');
}

function generateJSON(movies: ExportMovie[], actor: string): object {
  return {
    actor,
    timestamp: new Date().toISOString(),
    totalFilms: movies.length,
    filmography: movies.map(movie => ({
      year: movie.release_year,
      title: movie.title_en,
      slug: movie.slug,
      hero: movie.hero,
      heroine: movie.heroine,
      director: movie.director,
      musicDirector: movie.music_director,
      cinematographer: movie.cinematographer || movie.crew?.cinematographer,
      editor: movie.crew?.editor,
      writer: movie.crew?.writer,
      producer: movie.producer,
      tmdbId: movie.tmdb_id,
      genres: movie.genres,
      supportingCast: movie.supporting_cast,
      boxOffice: movie.box_office,
    })),
    statistics: {
      byDecade: Object.entries(
        movies.reduce((acc, m) => {
          const decade = Math.floor((m.release_year || 2000) / 10) * 10;
          acc[`${decade}s`] = (acc[`${decade}s`] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort().reverse(),
      missingFields: {
        cinematographer: movies.filter(m => !m.cinematographer && !m.crew?.cinematographer).length,
        editor: movies.filter(m => !m.crew?.editor).length,
        writer: movies.filter(m => !m.crew?.writer).length,
        producer: movies.filter(m => !m.producer).length,
        tmdbId: movies.filter(m => !m.tmdb_id).length,
      },
      genreDistribution: movies
        .flatMap(m => m.genres || [])
        .reduce((acc, g) => {
          acc[g] = (acc[g] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
    },
  };
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  const options = parseArgs();

  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           EXPORT ACTOR FILMOGRAPHY                                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Actor: ${chalk.yellow(options.actor)}`);
  console.log(`  Format: ${chalk.gray(options.format)}`);
  console.log(`  Sort: ${chalk.gray(`${options.sortBy} (${options.sortOrder})`)}`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Fetch movies
    console.log(chalk.cyan('\n  📂 Fetching filmography...'));
    
    let query = supabase
      .from('movies')
      .select(`
        id, title_en, release_year, slug, hero, heroine, director,
        music_director, producer, cinematographer, tmdb_id, genres,
        crew, supporting_cast, box_office, box_office_data
      `)
      .ilike('hero', `%${options.actor}%`);
    
    // Apply sorting
    if (options.sortBy === 'year') {
      query = query.order('release_year', { ascending: options.sortOrder === 'asc' });
    } else if (options.sortBy === 'title') {
      query = query.order('title_en', { ascending: options.sortOrder === 'asc' });
    }
    
    const { data: movies, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!movies || movies.length === 0) {
      console.log(chalk.yellow(`  ⚠️  No movies found for ${options.actor}`));
      return;
    }

    console.log(chalk.green(`     Found ${movies.length} films`));

    // Ensure output directory exists
    if (!fs.existsSync(options.outputDir)) {
      fs.mkdirSync(options.outputDir, { recursive: true });
    }

    const actorSlug = options.actor.toLowerCase().replace(/\s+/g, '-');
    const basePath = `${options.outputDir}/${actorSlug}-final-filmography`;
    const savedFiles: string[] = [];

    // Generate exports
    console.log(chalk.cyan('\n  📝 Generating exports...'));

    if (options.format === 'csv' || options.format === 'all') {
      const csv = generateCSV(movies as ExportMovie[]);
      fs.writeFileSync(`${basePath}.csv`, csv);
      savedFiles.push(`${basePath}.csv`);
    }

    if (options.format === 'tsv' || options.format === 'all') {
      const tsv = generateCSV(movies as ExportMovie[], '\t');
      fs.writeFileSync(`${basePath}.tsv`, tsv);
      savedFiles.push(`${basePath}.tsv`);
    }

    if (options.format === 'markdown' || options.format === 'all') {
      const md = generateMarkdown(movies as ExportMovie[], options.actor);
      fs.writeFileSync(`${basePath}.md`, md);
      savedFiles.push(`${basePath}.md`);
    }

    if (options.format === 'json' || options.format === 'all') {
      const json = generateJSON(movies as ExportMovie[], options.actor);
      fs.writeFileSync(`${basePath}.json`, JSON.stringify(json, null, 2));
      savedFiles.push(`${basePath}.json`);
    }

    // Print summary
    console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════════
📊 EXPORT SUMMARY
═══════════════════════════════════════════════════════════════════════
`));

    console.log(`  Actor: ${chalk.yellow(options.actor)}`);
    console.log(`  Total films: ${chalk.green(movies.length)}`);
    
    // Statistics
    const stats = {
      cinematographer: movies.filter(m => !m.cinematographer && !m.crew?.cinematographer).length,
      editor: movies.filter(m => !m.crew?.editor).length,
      writer: movies.filter(m => !m.crew?.writer).length,
      producer: movies.filter(m => !m.producer).length,
      tmdbId: movies.filter(m => !m.tmdb_id).length,
    };
    
    if (Object.values(stats).some(v => v > 0)) {
      console.log(chalk.gray('\n  Missing data:'));
      if (stats.cinematographer > 0) console.log(chalk.gray(`     Cinematographer: ${stats.cinematographer}`));
      if (stats.editor > 0) console.log(chalk.gray(`     Editor: ${stats.editor}`));
      if (stats.writer > 0) console.log(chalk.gray(`     Writer: ${stats.writer}`));
      if (stats.producer > 0) console.log(chalk.gray(`     Producer: ${stats.producer}`));
      if (stats.tmdbId > 0) console.log(chalk.gray(`     TMDB ID: ${stats.tmdbId}`));
    }

    console.log(chalk.cyan(`\n  📄 Files saved:`));
    for (const file of savedFiles) {
      console.log(chalk.green(`     ${file}`));
    }

  } catch (error) {
    console.error(chalk.red('\n  ❌ Export failed:'), error);
    process.exit(1);
  }
}

// Run if main module
if (require.main === module) {
  main().catch(console.error);
}

// Export for programmatic use
export {
  generateCSV,
  generateMarkdown,
  generateJSON,
  type ExportMovie,
  type ExportFormat,
  type ExportOptions,
};
