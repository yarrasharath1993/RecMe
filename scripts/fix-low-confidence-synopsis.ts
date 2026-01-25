#!/usr/bin/env npx tsx
/**
 * FIX LOW CONFIDENCE SYNOPSIS
 * 
 * Targets the 15 movies with AI-generated synopses (30% confidence)
 * and attempts to find proper Telugu synopses from reliable sources.
 * 
 * Sources (in priority order):
 * 1. Telugu Wikipedia (95% confidence)
 * 2. English Wikipedia + Translation (85% confidence)
 * 3. TMDB Overview + Translation (80% confidence)
 * 4. Wikidata Telugu (70% confidence)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import Groq from 'groq-sdk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface Movie {
  id: string;
  title_en: string;
  title_te?: string;
  release_year: number;
  synopsis_te?: string;
  synopsis_te_source?: string;
}

// Fetch Telugu Wikipedia synopsis
async function fetchTeluguWikiSynopsis(title: string, year: number): Promise<{ synopsis: string; source: string; confidence: number } | null> {
  try {
    const searchUrl = `https://te.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(title)}&srlimit=3&origin=*`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    if (!searchData.query?.search?.length) return null;
    
    for (const result of searchData.query.search) {
      const pageUrl = `https://te.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro&explaintext&pageids=${result.pageid}&origin=*`;
      const pageRes = await fetch(pageUrl);
      const pageData = await pageRes.json();
      const page = pageData.query?.pages?.[result.pageid];
      
      if (page?.extract && page.extract.length > 100) {
        const synopsis = page.extract.split('\n')[0].trim();
        if (synopsis.length > 100) {
          return { synopsis, source: 'telugu_wikipedia', confidence: 0.95 };
        }
      }
    }
    return null;
  } catch (error) {
    console.error(chalk.red(`  ❌ Telugu Wiki error: ${error}`));
    return null;
  }
}

// Fetch English Wikipedia and translate
async function fetchEnglishWikiAndTranslate(title: string, year: number): Promise<{ synopsis: string; source: string; confidence: number } | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(title + ' ' + year + ' film')}&srlimit=3&origin=*`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    if (!searchData.query?.search?.length) return null;
    
    for (const result of searchData.query.search) {
      const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro&explaintext&pageids=${result.pageid}&origin=*`;
      const pageRes = await fetch(pageUrl);
      const pageData = await pageRes.json();
      const page = pageData.query?.pages?.[result.pageid];
      
      if (page?.extract && page.extract.length > 100) {
        const englishSynopsis = page.extract.split('\n').slice(0, 3).join(' ').trim();
        
        // Translate to Telugu using Groq
        try {
          const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: 'You are a professional translator. Translate the following English movie synopsis to Telugu. Provide ONLY the Telugu translation, no explanations.',
              },
              {
                role: 'user',
                content: englishSynopsis,
              },
            ],
            temperature: 0.3,
            max_tokens: 500,
          });
          
          const translation = completion.choices[0]?.message?.content?.trim();
          if (translation && translation.length > 50) {
            return { synopsis: translation, source: 'english_wikipedia_translated', confidence: 0.85 };
          }
        } catch (translateError) {
          console.error(chalk.red(`  ❌ Translation error: ${translateError}`));
        }
      }
    }
    return null;
  } catch (error) {
    console.error(chalk.red(`  ❌ English Wiki error: ${error}`));
    return null;
  }
}

// Fetch TMDB overview and translate
async function fetchTMDBAndTranslate(title: string, year: number): Promise<{ synopsis: string; source: string; confidence: number } | null> {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return null;
    
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}&year=${year}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    if (!searchData.results?.length) return null;
    
    const movie = searchData.results[0];
    if (movie.overview && movie.overview.length > 50) {
      // Translate to Telugu
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a professional translator. Translate the following English movie synopsis to Telugu. Provide ONLY the Telugu translation, no explanations.',
            },
            {
              role: 'user',
              content: movie.overview,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        });
        
        const translation = completion.choices[0]?.message?.content?.trim();
        if (translation && translation.length > 50) {
          return { synopsis: translation, source: 'tmdb_overview_translated', confidence: 0.80 };
        }
      } catch (translateError) {
        console.error(chalk.red(`  ❌ Translation error: ${translateError}`));
      }
    }
    return null;
  } catch (error) {
    console.error(chalk.red(`  ❌ TMDB error: ${error}`));
    return null;
  }
}

async function enrichMovie(movie: Movie, execute: boolean): Promise<{ success: boolean; source?: string; confidence?: number }> {
  console.log(chalk.cyan(`\n  Processing: ${movie.title_en} (${movie.release_year})`));
  
  // Try sources in priority order
  let result = await fetchTeluguWikiSynopsis(movie.title_en, movie.release_year);
  if (result) {
    console.log(chalk.green(`    ✓ Found Telugu Wikipedia synopsis (95% confidence)`));
  } else {
    result = await fetchEnglishWikiAndTranslate(movie.title_en, movie.release_year);
    if (result) {
      console.log(chalk.green(`    ✓ Found English Wikipedia + Translation (85% confidence)`));
    } else {
      result = await fetchTMDBAndTranslate(movie.title_en, movie.release_year);
      if (result) {
        console.log(chalk.green(`    ✓ Found TMDB + Translation (80% confidence)`));
      }
    }
  }
  
  if (!result) {
    console.log(chalk.red(`    ❌ No high-quality synopsis found`));
    return { success: false };
  }
  
  if (execute) {
    const { error } = await supabase
      .from('movies')
      .update({
        synopsis_te: result.synopsis,
        synopsis_te_source: result.source,
        synopsis_te_confidence: result.confidence,
        updated_at: new Date().toISOString(),
      })
      .eq('id', movie.id);
    
    if (error) {
      console.error(chalk.red(`    ❌ Database update failed: ${error.message}`));
      return { success: false };
    }
    
    console.log(chalk.green(`    ✅ Updated in database`));
  } else {
    console.log(chalk.yellow(`    (Dry run) Would update with ${result.source}`));
  }
  
  return { success: true, source: result.source, confidence: result.confidence };
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  
  console.log(chalk.magenta.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           FIX LOW CONFIDENCE SYNOPSIS                                ║
║           Target: 15 movies with generated_basic source              ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  console.log(`  Mode: ${execute ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`);
  console.log('');
  
  // Fetch movies with low confidence synopsis
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, synopsis_te, synopsis_te_source')
    .eq('synopsis_te_source', 'generated_basic')
    .order('release_year', { ascending: false });
  
  if (error) {
    console.error(chalk.red('  ❌ Error fetching movies:'), error.message);
    return;
  }
  
  if (!movies || movies.length === 0) {
    console.log(chalk.yellow('  No movies with low confidence synopsis found.'));
    return;
  }
  
  console.log(chalk.cyan(`  Found ${movies.length} movies to process\n`));
  
  const stats = {
    total: movies.length,
    success: 0,
    failed: 0,
    sources: {} as Record<string, number>,
  };
  
  for (const movie of movies) {
    const result = await enrichMovie(movie as Movie, execute);
    
    if (result.success) {
      stats.success++;
      if (result.source) {
        stats.sources[result.source] = (stats.sources[result.source] || 0) + 1;
      }
    } else {
      stats.failed++;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           SUMMARY                                                    ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  console.log(`  Total Movies:        ${stats.total}`);
  console.log(`  Successfully Fixed:  ${chalk.green(stats.success.toString())} (${Math.round(stats.success/stats.total*100)}%)`);
  console.log(`  Failed:              ${chalk.red(stats.failed.toString())} (${Math.round(stats.failed/stats.total*100)}%)`);
  
  if (Object.keys(stats.sources).length > 0) {
    console.log(`\n  Sources Used:`);
    Object.entries(stats.sources).forEach(([source, count]) => {
      console.log(`    ${source}: ${count}`);
    });
  }
  
  if (!execute) {
    console.log(chalk.yellow(`\n  💡 Run with --execute to apply changes`));
  }
  
  console.log('');
}

main().catch(console.error);
