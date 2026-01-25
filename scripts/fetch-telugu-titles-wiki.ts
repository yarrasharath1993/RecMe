#!/usr/bin/env npx tsx
/**
 * Fetch Telugu Titles from Telugu Wikipedia
 * Uses the Telugu Wikipedia API to get official Telugu titles
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TE_WIKI_API = 'https://te.wikipedia.org/w/api.php';
const EN_WIKI_API = 'https://en.wikipedia.org/w/api.php';

// Rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface WikiSearchResult {
  title: string;
  pageid: number;
}

async function searchTeluguWikipedia(movieTitle: string, year: number): Promise<string | null> {
  try {
    // Search patterns
    const searchTerms = [
      `${movieTitle} ${year} చిత్రం`,
      `${movieTitle} (${year} చిత్రం)`,
      `${movieTitle} చిత్రం`,
      movieTitle,
    ];
    
    for (const term of searchTerms) {
      const params = new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: term,
        format: 'json',
        srlimit: '3',
      });
      
      const response = await fetch(`${TE_WIKI_API}?${params}`);
      const data = await response.json();
      
      if (data.query?.search?.length > 0) {
        // Get the first result that looks like a film
        for (const result of data.query.search) {
          const title = result.title;
          // Check if it contains చిత్రం (film) or the year
          if (title.includes('చిత్రం') || title.includes(year.toString())) {
            // Extract the Telugu title (before the parentheses)
            const teluguTitle = title.split('(')[0].trim();
            if (teluguTitle && /[\u0C00-\u0C7F]/.test(teluguTitle)) {
              return teluguTitle;
            }
          }
        }
        
        // If no film-specific result, try the first Telugu result
        const firstResult = data.query.search[0].title;
        const teluguTitle = firstResult.split('(')[0].trim();
        if (teluguTitle && /[\u0C00-\u0C7F]/.test(teluguTitle)) {
          return teluguTitle;
        }
      }
      
      await delay(100); // Rate limit
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function getTeluguTitleFromEnglishWiki(movieTitle: string, year: number): Promise<string | null> {
  try {
    // Search English Wikipedia for the film
    const params = new URLSearchParams({
      action: 'query',
      titles: `${movieTitle} (${year} film)`,
      prop: 'langlinks',
      lllang: 'te',
      format: 'json',
    });
    
    const response = await fetch(`${EN_WIKI_API}?${params}`);
    const data = await response.json();
    
    const pages = data.query?.pages;
    if (pages) {
      for (const pageId in pages) {
        const langlinks = pages[pageId].langlinks;
        if (langlinks && langlinks.length > 0) {
          const teTitle = langlinks[0]['*'];
          // Extract title before parentheses
          const cleanTitle = teTitle.split('(')[0].trim();
          if (cleanTitle && /[\u0C00-\u0C7F]/.test(cleanTitle)) {
            return cleanTitle;
          }
        }
      }
    }
    
    // Try without year
    const params2 = new URLSearchParams({
      action: 'query',
      titles: `${movieTitle} (film)`,
      prop: 'langlinks',
      lllang: 'te',
      format: 'json',
    });
    
    const response2 = await fetch(`${EN_WIKI_API}?${params2}`);
    const data2 = await response2.json();
    
    const pages2 = data2.query?.pages;
    if (pages2) {
      for (const pageId in pages2) {
        const langlinks = pages2[pageId].langlinks;
        if (langlinks && langlinks.length > 0) {
          const teTitle = langlinks[0]['*'];
          const cleanTitle = teTitle.split('(')[0].trim();
          if (cleanTitle && /[\u0C00-\u0C7F]/.test(cleanTitle)) {
            return cleanTitle;
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function processYear(year: number, limit: number, dryRun: boolean) {
  console.log(chalk.yellow(`\n📆 Processing ${year} movies...`));
  
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, slug, title_en, title_te, release_year')
    .eq('is_published', true)
    .eq('release_year', year)
    .or('title_te.is.null,title_te.eq.')
    .order('title_en')
    .limit(limit);
  
  if (error || !movies) {
    console.log(chalk.red('Error:', error?.message));
    return { processed: 0, found: 0, updated: 0 };
  }
  
  let found = 0;
  let updated = 0;
  
  for (const movie of movies) {
    // Try Telugu Wikipedia first
    let teluguTitle = await searchTeluguWikipedia(movie.title_en, year);
    
    // If not found, try English Wikipedia langlinks
    if (!teluguTitle) {
      teluguTitle = await getTeluguTitleFromEnglishWiki(movie.title_en, year);
    }
    
    if (teluguTitle) {
      found++;
      console.log(chalk.green(`  ✓ ${movie.title_en} → ${teluguTitle}`));
      
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('movies')
          .update({ title_te: teluguTitle })
          .eq('id', movie.id);
        
        if (!updateError) updated++;
      }
    } else {
      console.log(chalk.gray(`  ✗ ${movie.title_en} - not found`));
    }
    
    await delay(200); // Rate limit between movies
  }
  
  return { processed: movies.length, found, updated: dryRun ? found : updated };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const yearArg = args.find(a => a.startsWith('--year='));
  const years = yearArg 
    ? [parseInt(yearArg.split('=')[1])]
    : [2024, 2023, 2022, 2021]; // Default to recent years
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 30;
  
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════╗
║        FETCH TELUGU TITLES FROM WIKIPEDIA                        ║
╚══════════════════════════════════════════════════════════════════╝

Mode: ${dryRun ? chalk.yellow('DRY RUN (use --execute to apply)') : chalk.green('EXECUTING')}
Years: ${years.join(', ')}
Limit per year: ${limit}
`));

  let totalProcessed = 0;
  let totalFound = 0;
  let totalUpdated = 0;
  
  for (const year of years) {
    const result = await processYear(year, limit, dryRun);
    totalProcessed += result.processed;
    totalFound += result.found;
    totalUpdated += result.updated;
  }
  
  console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════
                          SUMMARY                                  
═══════════════════════════════════════════════════════════════════

  Total processed: ${totalProcessed}
  Found on Wikipedia: ${totalFound} (${((totalFound/totalProcessed)*100).toFixed(1)}%)
  ${dryRun ? 'Would update' : 'Updated'}: ${totalUpdated}
  
  ${dryRun ? chalk.yellow('Run with --execute to apply changes') : chalk.green('✅ Changes applied!')}
`));
}

main().catch(console.error);
