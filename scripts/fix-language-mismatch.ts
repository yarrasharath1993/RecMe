#!/usr/bin/env npx tsx

/**
 * FIX LANGUAGE MISMATCH
 * 
 * Audits and fixes movies with incorrect language tags.
 * Checks TMDB original_language and updates the database.
 * 
 * Usage:
 *   pnpm fix:language --audit              # Audit only, no changes
 *   pnpm fix:language --fix                # Fix mismatched movies
 *   pnpm fix:language --fix --unpublish    # Fix and unpublish non-Telugu
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

interface CLIArgs {
  audit: boolean;
  fix: boolean;
  unpublish: boolean;
  limit?: number;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  return {
    audit: args.includes('--audit'),
    fix: args.includes('--fix'),
    unpublish: args.includes('--unpublish'),
    limit: args.find(a => a.startsWith('--limit='))
      ? parseInt(args.find(a => a.startsWith('--limit='))!.split('=')[1])
      : undefined,
  };
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  return createClient(supabaseUrl, supabaseKey);
}

async function getTMDBLanguage(tmdbId: number): Promise<{
  original_language: string;
  spoken_languages: string[];
  production_countries: string[];
} | null> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY not set');
  }

  try {
    const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      console.error(`  TMDB API error for ${tmdbId}: ${res.status}`);
      return null;
    }

    const data = await res.json();
    
    return {
      original_language: data.original_language || 'unknown',
      spoken_languages: (data.spoken_languages || []).map((l: any) => l.iso_639_1),
      production_countries: (data.production_countries || []).map((c: any) => c.iso_3166_1),
    };
  } catch (error: any) {
    console.error(`  Error fetching TMDB data for ${tmdbId}:`, error.message);
    return null;
  }
}

function mapLanguageCode(tmdbCode: string): string {
  const mapping: Record<string, string> = {
    'te': 'Telugu',
    'hi': 'Hindi',
    'ta': 'Tamil',
    'ml': 'Malayalam',
    'kn': 'Kannada',
    'en': 'English',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'es': 'Spanish',
    'fr': 'French',
  };
  return mapping[tmdbCode] || tmdbCode.toUpperCase();
}

interface MovieIssue {
  id: string;
  title_en: string;
  slug: string;
  tmdb_id: number;
  current_language: string;
  tmdb_original_language: string;
  correct_language: string;
  action: 'update' | 'unpublish';
}

async function main(): Promise<void> {
  const args = parseArgs();
  const supabase = getSupabaseClient();

  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║           LANGUAGE MISMATCH DETECTOR & FIXER                 ║
╚══════════════════════════════════════════════════════════════╝
`));

  if (!args.audit && !args.fix) {
    console.log(chalk.yellow('Please specify --audit or --fix'));
    console.log(chalk.gray('\nUsage:'));
    console.log(chalk.gray('  pnpm fix:language --audit'));
    console.log(chalk.gray('  pnpm fix:language --fix'));
    console.log(chalk.gray('  pnpm fix:language --fix --unpublish'));
    return;
  }

  console.log(chalk.gray(`Mode: ${args.fix ? chalk.green('FIX') : chalk.yellow('AUDIT')}`));
  if (args.unpublish) {
    console.log(chalk.gray(`Unpublish non-Telugu movies: ${chalk.red('YES')}`));
  }
  console.log('');

  // Fetch movies that claim to be Telugu
  const query = supabase
    .from('movies')
    .select('id, title_en, slug, tmdb_id, language, is_published')
    .or('language.eq.Telugu,language.eq.te,language.is.null')
    .not('tmdb_id', 'is', null)
    .eq('is_published', true);

  if (args.limit) {
    query.limit(args.limit);
  }

  const { data: movies, error } = await query;

  if (error) {
    console.error(chalk.red('Error fetching movies:'), error.message);
    return;
  }

  console.log(chalk.cyan(`📊 Found ${movies?.length || 0} movies tagged as Telugu\n`));

  const issues: MovieIssue[] = [];
  let checked = 0;

  for (const movie of movies || []) {
    checked++;
    process.stdout.write(chalk.gray(`\r  Checking ${checked}/${movies!.length}...`));

    if (!movie.tmdb_id) continue;

    const tmdbData = await getTMDBLanguage(movie.tmdb_id);
    
    if (!tmdbData) {
      await new Promise(r => setTimeout(r, 250)); // Rate limit
      continue;
    }

    // Check if original language is Telugu
    const isTeluguOriginal = tmdbData.original_language === 'te';
    const hasTeluguSpoken = tmdbData.spoken_languages.includes('te');

    if (!isTeluguOriginal && !hasTeluguSpoken) {
      // This movie is NOT Telugu
      const correctLanguage = mapLanguageCode(tmdbData.original_language);
      
      issues.push({
        id: movie.id,
        title_en: movie.title_en,
        slug: movie.slug,
        tmdb_id: movie.tmdb_id,
        current_language: movie.language || 'null',
        tmdb_original_language: tmdbData.original_language,
        correct_language: correctLanguage,
        action: args.unpublish ? 'unpublish' : 'update',
      });
    }

    // Rate limit (40 requests per 10 seconds = 250ms per request)
    await new Promise(r => setTimeout(r, 250));
  }

  process.stdout.write('\n\n');

  // Report findings
  console.log(chalk.bold.red(`❌ Found ${issues.length} movies with incorrect language tags\n`));

  if (issues.length === 0) {
    console.log(chalk.green('✅ No language mismatches found!\n'));
    return;
  }

  // Display issues
  console.log(chalk.yellow('┌────────────────────────────────────────────────────────────────────────────┐'));
  console.log(chalk.yellow('│ Movies with incorrect language tags:                                       │'));
  console.log(chalk.yellow('└────────────────────────────────────────────────────────────────────────────┘\n'));

  issues.slice(0, 20).forEach((issue, i) => {
    console.log(chalk.white(`${i + 1}. ${chalk.bold(issue.title_en)}`));
    console.log(chalk.gray(`   Slug: ${issue.slug}`));
    console.log(chalk.gray(`   Current: ${issue.current_language} → Correct: ${issue.correct_language} (${issue.tmdb_original_language})`));
    console.log(chalk.gray(`   URL: http://localhost:3000/reviews/${issue.slug}`));
    console.log('');
  });

  if (issues.length > 20) {
    console.log(chalk.gray(`   ... and ${issues.length - 20} more\n`));
  }

  // Fix if requested
  if (args.fix) {
    console.log(chalk.cyan.bold(`\n🔧 FIXING ${issues.length} movies...\n`));

    let fixed = 0;
    let failed = 0;

    for (const issue of issues) {
      try {
        const updateData: any = {
          language: issue.correct_language,
          updated_at: new Date().toISOString(),
        };

        if (args.unpublish) {
          updateData.is_published = false;
        }

        const { error: updateError } = await supabase
          .from('movies')
          .update(updateData)
          .eq('id', issue.id);

        if (updateError) {
          console.error(chalk.red(`  ✗ ${issue.title_en}: ${updateError.message}`));
          failed++;
        } else {
          const action = args.unpublish ? 'updated & unpublished' : 'updated';
          console.log(chalk.green(`  ✓ ${issue.title_en} → ${issue.correct_language} (${action})`));
          fixed++;
        }
      } catch (error: any) {
        console.error(chalk.red(`  ✗ ${issue.title_en}: ${error.message}`));
        failed++;
      }
    }

    console.log(chalk.bold(`\n╔══════════════════════════════════════════════════════════════╗`));
    console.log(chalk.bold(`║                       SUMMARY                                 ║`));
    console.log(chalk.bold(`╚══════════════════════════════════════════════════════════════╝`));
    console.log(chalk.green(`\n  ✅ Fixed:   ${fixed}`));
    console.log(chalk.red(`  ❌ Failed:  ${failed}`));
    console.log(chalk.cyan(`  📊 Total:   ${issues.length}\n`));

    if (args.unpublish) {
      console.log(chalk.yellow('ℹ️  Non-Telugu movies have been unpublished.'));
      console.log(chalk.yellow('   They can be re-published from their respective language sections.\n'));
    }
  } else {
    console.log(chalk.yellow(`\n⚠️  AUDIT MODE - No changes made`));
    console.log(chalk.gray(`   Run with --fix to update these movies\n`));
  }
}

main().catch(console.error);




