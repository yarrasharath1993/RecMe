#!/usr/bin/env npx tsx
/**
 * AI SYNOPSIS ENRICHMENT
 * 
 * Generates synopsis for movies missing them using Groq AI.
 * Uses movie metadata (title, year, director, cast) to generate accurate descriptions.
 * 
 * Usage:
 *   npx tsx scripts/enrich-synopsis-ai.ts --dry          # Preview mode
 *   npx tsx scripts/enrich-synopsis-ai.ts --apply        # Apply changes
 *   npx tsx scripts/enrich-synopsis-ai.ts --apply --limit=100
 *   npx tsx scripts/enrich-synopsis-ai.ts --apply --force  # Regenerate all
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

// ============================================================
// CONFIG
// ============================================================

const RATE_LIMIT_MS = 300; // Conservative rate limiting
const BATCH_SIZE = 5; // Process in small batches

interface Movie {
  id: string;
  title_en: string;
  title_te: string | null;
  release_year: number | null;
  director: string | null;
  hero: string | null;
  heroine: string | null;
  music_director: string | null;
  genres: string[] | null;
  synopsis: string | null;
}

interface SynopsisResult {
  synopsis_en: string;
  synopsis_te?: string;
  confidence: number;
}

// ============================================================
// SUPABASE
// ============================================================

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================================
// GROQ AI
// ============================================================

function getGroq(): Groq {
  const apiKey = process.env.GROQ_API_KEY_UNLIMITED || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not set');
  }
  return new Groq({ apiKey });
}

async function generateSynopsis(movie: Movie, groq: Groq): Promise<SynopsisResult | null> {
  const prompt = `You are a Telugu cinema expert. Generate a movie synopsis based on available information.

MOVIE DETAILS:
- Title (English): ${movie.title_en}
- Title (Telugu): ${movie.title_te || 'Not available'}
- Year: ${movie.release_year || 'Unknown'}
- Director: ${movie.director || 'Unknown'}
- Hero (Lead Actor): ${movie.hero || 'Unknown'}
- Heroine (Lead Actress): ${movie.heroine || 'Unknown'}
- Music Director: ${movie.music_director || 'Unknown'}
- Genres: ${movie.genres?.join(', ') || 'Unknown'}

INSTRUCTIONS:
Generate a 2-3 sentence synopsis that:
1. Describes the main plot or premise
2. Mentions key characters or themes
3. Is factual and informative (not promotional)
4. Uses general knowledge about the movie if you recognize it
5. If you don't recognize the movie, create a plausible synopsis based on the genre, cast, and title

Return JSON:
{
  "synopsis_en": "English synopsis (2-3 sentences)",
  "confidence": 0-100 (how confident you are about accuracy)
}

If the movie is very obscure and you have no information, still provide a genre-appropriate synopsis.
Return ONLY valid JSON.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = completion.choices[0]?.message?.content || '';
    
    // Extract JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.synopsis_en || parsed.synopsis_en.length < 20) {
      return null;
    }

    return {
      synopsis_en: parsed.synopsis_en,
      synopsis_te: parsed.synopsis_te,
      confidence: parsed.confidence || 50,
    };
  } catch (error: any) {
    if (error.status === 429) {
      // Rate limited - wait and retry
      console.log(chalk.yellow('\n   Rate limited, waiting 10s...'));
      await new Promise(r => setTimeout(r, 10000));
      return generateSynopsis(movie, groq); // Retry
    }
    console.error(chalk.red(`   AI error for ${movie.title_en}:`), error.message);
    return null;
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  const force = args.includes('--force');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 200;

  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════╗
║           AI SYNOPSIS ENRICHMENT (Groq llama-3.3-70b)            ║
╚══════════════════════════════════════════════════════════════════╝
`));

  const groqKey = process.env.GROQ_API_KEY_UNLIMITED || process.env.GROQ_API_KEY;
  if (!groqKey) {
    console.error(chalk.red('❌ GROQ_API_KEY not set in .env.local'));
    process.exit(1);
  }

  console.log(chalk.gray(`  Limit: ${limit} movies`));
  console.log(chalk.gray(`  Force regenerate: ${force ? 'Yes' : 'No'}`));
  console.log('');

  if (dryRun) {
    console.log(chalk.yellow.bold('🔍 DRY RUN MODE - No changes will be made'));
    console.log(chalk.gray('   Add --apply to save changes to database\n'));
  } else {
    console.log(chalk.green.bold('⚡ APPLY MODE - Will update database\n'));
  }

  const supabase = getSupabase();
  const groq = getGroq();

  // Get movies missing synopsis
  let query = supabase
    .from('movies')
    .select(`
      id, title_en, title_te, release_year,
      director, hero, heroine, music_director,
      genres, synopsis
    `)
    .eq('is_published', true)
    .order('release_year', { ascending: false });

  if (!force) {
    query = query.is('synopsis', null);
  }

  query = query.limit(limit);

  const { data: movies, error } = await query;

  if (error) {
    console.error(chalk.red('Error fetching movies:'), error.message);
    process.exit(1);
  }

  if (!movies || movies.length === 0) {
    console.log(chalk.green('✅ All movies have synopsis!'));
    return;
  }

  console.log(chalk.cyan(`📋 Processing ${movies.length} movies...\n`));

  let generated = 0;
  let failed = 0;
  let lowConfidence = 0;

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i] as Movie;
    
    process.stdout.write(`\r  [${i + 1}/${movies.length}] ${movie.title_en?.substring(0, 40).padEnd(40)}...`);

    const result = await generateSynopsis(movie, groq);

    if (!result) {
      failed++;
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
      continue;
    }

    if (result.confidence < 30) {
      lowConfidence++;
    }

    if (dryRun) {
      generated++;
      console.log(chalk.green(`\n    ✓ Synopsis (${result.confidence}% confidence): "${result.synopsis_en.substring(0, 80)}..."`));
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
      continue;
    }

    // Apply update
    const { error: updateError } = await supabase
      .from('movies')
      .update({
        synopsis: result.synopsis_en,
        synopsis_te: result.synopsis_te || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', movie.id);

    if (updateError) {
      failed++;
      console.error(chalk.red(`\n   Error updating ${movie.title_en}:`), updateError.message);
    } else {
      generated++;
    }

    await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
  }

  // Summary
  console.log('\n');
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════'));
  console.log(chalk.bold('📊 AI SYNOPSIS ENRICHMENT SUMMARY'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════\n'));

  console.log(`  Total Processed:    ${movies.length}`);
  console.log(`  ${chalk.green('Generated:')}         ${generated}`);
  console.log(`  ${chalk.yellow('Low Confidence:')}    ${lowConfidence}`);
  console.log(`  ${chalk.red('Failed:')}            ${failed}`);

  if (dryRun && generated > 0) {
    console.log(chalk.yellow('\n⚠️  This was a DRY RUN. Run with --apply to save changes.'));
  } else if (!dryRun && generated > 0) {
    console.log(chalk.green('\n✅ Synopsis saved to database!'));
    
    // Show updated stats
    const { count } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .not('synopsis', 'is', null);
    
    const { count: total } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    console.log(chalk.cyan(`\n📈 Synopsis coverage: ${count}/${total} (${Math.round(100 * (count || 0) / (total || 1))}%)`));
  }

  console.log('');
}

main().catch(console.error);


