#!/usr/bin/env npx tsx
/**
 * Awards Enrichment via Wikipedia
 * 
 * Fetches award-winning Telugu movies from Wikipedia list pages:
 * - National Film Award for Best Telugu Feature Film
 * - Filmfare Award for Best Film – Telugu
 * - Nandi Award for Best Feature Film
 * 
 * Much more reliable than Google CSE and has no quota limits.
 * 
 * Usage:
 *   npx tsx scripts/enrich-awards-wikipedia.ts
 *   npx tsx scripts/enrich-awards-wikipedia.ts --dry
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// CONFIGURATION
// ============================================================

const WIKI_API_BASE = 'https://en.wikipedia.org/w/api.php';

// Award list pages on Wikipedia
const AWARD_PAGES = [
  {
    title: 'National_Film_Award_for_Best_Telugu_Feature_Film',
    type: 'national',
    name: 'National Film Award',
    category: 'Best Telugu Feature Film',
    parser: 'national', // Special parser for this format
  },
  {
    title: 'Filmfare_Award_for_Best_Film_–_Telugu',
    type: 'filmfare',
    name: 'Filmfare Award',
    category: 'Best Film – Telugu',
    parser: 'default',
  },
  {
    title: 'Nandi_Award_for_Best_Feature_Film',
    type: 'nandi',
    name: 'Nandi Award',
    category: 'Best Feature Film',
    parser: 'default',
  },
  {
    title: 'South_Indian_International_Movie_Awards',
    type: 'siima',
    name: 'SIIMA Award',
    category: 'Best Film – Telugu',
    parser: 'siima',
  },
  {
    title: 'CineMAA_Awards',
    type: 'cinemaa',
    name: 'CineMAA Award',
    category: 'Best Film',
    parser: 'default',
  },
];

// ============================================================
// TYPES
// ============================================================

interface Award {
  type: string;
  name: string;
  category: string;
  year: number;
}

interface AwardWinner {
  movieTitle: string;
  year: number;
  awards: Award[];
}

// ============================================================
// SUPABASE CLIENT
// ============================================================

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }
  return createClient(url, key);
}

// ============================================================
// WIKIPEDIA FETCHER
// ============================================================

async function fetchWikipediaPage(pageTitle: string): Promise<string | null> {
  const url = `${WIKI_API_BASE}?` + new URLSearchParams({
    action: 'query',
    titles: pageTitle,
    prop: 'extracts',
    explaintext: 'true',
    format: 'json',
    origin: '*',
  });

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const pages = data?.query?.pages;
    if (!pages) return null;

    const pageId = Object.keys(pages)[0];
    return pages[pageId]?.extract || null;
  } catch (error) {
    console.error(chalk.red(`Error fetching ${pageTitle}:`), error);
    return null;
  }
}

async function fetchWikipediaWikitext(pageTitle: string): Promise<string | null> {
  const url = `${WIKI_API_BASE}?` + new URLSearchParams({
    action: 'parse',
    page: pageTitle,
    prop: 'wikitext',
    format: 'json',
    origin: '*',
  });

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    return data?.parse?.wikitext?.['*'] || null;
  } catch (error) {
    console.error(chalk.red(`Error fetching wikitext for ${pageTitle}:`), error);
    return null;
  }
}

// ============================================================
// AWARD PARSING
// ============================================================

function parseAwardWinners(wikitext: string, awardConfig: typeof AWARD_PAGES[0]): AwardWinner[] {
  // Use specialized parser based on config
  if (awardConfig.parser === 'national') {
    return parseNationalFilmAwards(wikitext, awardConfig);
  } else if (awardConfig.parser === 'siima') {
    return parseSIIMAAwards(wikitext, awardConfig);
  }
  return parseDefaultAwards(wikitext, awardConfig);
}

/**
 * Parse National Film Awards - has specific table format with rowspan years
 * Format: | [[2nd National Film Awards|1954<br>{{small|(2nd)}}]] and ''[[Film Title]]''
 */
function parseNationalFilmAwards(wikitext: string, awardConfig: typeof AWARD_PAGES[0]): AwardWinner[] {
  const winners: AwardWinner[] = [];
  const lines = wikitext.split('\n');
  let currentYear: number | null = null;

  for (const line of lines) {
    // Match year patterns like: [[2nd National Film Awards|1954<br>{{small|(2nd)}}]]
    // or | align="center" rowspan="3" | [[2nd National Film Awards|1954<br>
    const yearMatch = line.match(/\[\[[^\]]*\|(19[5-9]\d|20[0-2]\d)/);
    if (yearMatch) {
      currentYear = parseInt(yearMatch[1]);
    }

    // Also check for simple year pattern in table cell
    const simpleYearMatch = line.match(/\|\s*align="center"[^|]*\|\s*\[\[[^\]]*\|(19[5-9]\d|20[0-2]\d)/);
    if (simpleYearMatch) {
      currentYear = parseInt(simpleYearMatch[1]);
    }

    // Extract film titles: ! scope="row" | ''[[Film Title]]'' or ''[[Film Title (year film)|Display]]''
    const filmMatch = line.match(/scope="row"[^|]*\|\s*''\[\[([^\]|]+)/);
    if (filmMatch && currentYear) {
      let title = filmMatch[1];
      // Clean title
      title = title.replace(/\s*\(\d{4}\s*film\)/i, '').trim();
      title = title.replace(/\s*\(film\)/i, '').trim();

      if (title.length > 2) {
        addWinner(winners, title, currentYear, awardConfig);
      }
    }
  }

  return winners;
}

/**
 * Parse SIIMA Awards - multiple categories, need to filter Telugu
 */
function parseSIIMAAwards(wikitext: string, awardConfig: typeof AWARD_PAGES[0]): AwardWinner[] {
  const winners: AwardWinner[] = [];
  const lines = wikitext.split('\n');
  let currentYear: number | null = null;
  let inTeluguSection = false;

  for (const line of lines) {
    // Check for Telugu section headers
    if (/==.*Telugu.*==/i.test(line) || /Telugu/i.test(line)) {
      inTeluguSection = true;
    }
    // Check for other language sections to exit Telugu context
    if (/==.*(Tamil|Malayalam|Kannada).*==/i.test(line)) {
      inTeluguSection = false;
    }

    // Extract year from section headers like "== 2012 ==" or "=== 2023 ==="
    const yearMatch = line.match(/==+\s*(20[1-2]\d)\s*==+/);
    if (yearMatch) {
      currentYear = parseInt(yearMatch[1]);
    }

    // Also try table cell years
    const cellYearMatch = line.match(/\|\s*(20[1-2]\d)(?:\s*\||\s*$)/);
    if (cellYearMatch) {
      currentYear = parseInt(cellYearMatch[1]);
    }

    // Look for film titles in Telugu context
    if (currentYear) {
      const filmMatches = line.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g);
      for (const match of filmMatches) {
        let title = match[1];
        // Skip non-film entries
        if (shouldSkipTitle(title)) continue;
        
        title = cleanTitle(title);
        if (title.length > 2) {
          addWinner(winners, title, currentYear, awardConfig);
        }
      }
    }
  }

  return winners;
}

// Helper functions for parsing
function shouldSkipTitle(title: string): boolean {
  const skipPatterns = [
    'Productions', 'Films', 'Studios', 'National Film', 'Award', 'Category:',
    'Picture', 'Cinema', 'Ceremony', 'List of', 'Government', 'Ministry',
    'Director', 'Actor', 'Actress', 'Music', 'Wikipedia', 'File:'
  ];
  return skipPatterns.some(p => title.includes(p));
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*\(\d{4}\s*film\)/i, '')
    .replace(/\s*\(film\)/i, '')
    .replace(/\s*\(Indian film\)/i, '')
    .replace(/\s*\(Telugu film\)/i, '')
    .trim();
}

function addWinner(
  winners: AwardWinner[], 
  title: string, 
  year: number, 
  awardConfig: typeof AWARD_PAGES[0]
): void {
  const existing = winners.find(w => 
    w.movieTitle.toLowerCase() === title.toLowerCase() && 
    w.year === year
  );
  
  if (existing) {
    if (!existing.awards.some(a => a.type === awardConfig.type)) {
      existing.awards.push({
        type: awardConfig.type,
        name: awardConfig.name,
        category: awardConfig.category,
        year,
      });
    }
  } else {
    winners.push({
      movieTitle: title,
      year,
      awards: [{
        type: awardConfig.type,
        name: awardConfig.name,
        category: awardConfig.category,
        year,
      }],
    });
  }
}

/**
 * Default parser for Filmfare, Nandi, CineMAA
 */
function parseDefaultAwards(wikitext: string, awardConfig: typeof AWARD_PAGES[0]): AwardWinner[] {
  const winners: AwardWinner[] = [];
  const lines = wikitext.split('\n');
  let currentYear: number | null = null;
  
  for (const line of lines) {
    // Extract year from patterns like "1954 (2nd)" or "| 2023"
    const yearMatch = line.match(/\|\s*(19[5-9]\d|20[0-2]\d)(?:\s*\(|\s*\||\s*$)/);
    if (yearMatch) {
      currentYear = parseInt(yearMatch[1]);
    }
    
    // Also try to find year in section headers like "== 1954 (2nd) =="
    const headerYearMatch = line.match(/==\s*(19[5-9]\d|20[0-2]\d)/);
    if (headerYearMatch) {
      currentYear = parseInt(headerYearMatch[1]);
    }

    // Extract film titles from wiki links
    const filmMatches = line.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g);
    
    for (const match of filmMatches) {
      let title = match[1];
      
      if (shouldSkipTitle(title)) continue;
      
      title = cleanTitle(title);
      
      // Try to extract year from title if not found
      if (!currentYear) {
        const titleYearMatch = title.match(/\((\d{4})\)/);
        if (titleYearMatch) {
          currentYear = parseInt(titleYearMatch[1]);
          title = title.replace(/\s*\(\d{4}\)/, '').trim();
        }
      }
      
      if (title && currentYear && title.length > 2) {
        addWinner(winners, title, currentYear, awardConfig);
      }
    }
  }
  
  return winners;
}

// ============================================================
// DATABASE MATCHING
// ============================================================

async function matchAndUpdateMovies(
  supabase: ReturnType<typeof getSupabaseClient>,
  winners: AwardWinner[],
  dryRun: boolean
): Promise<{ matched: number; updated: number }> {
  let matched = 0;
  let updated = 0;

  for (const winner of winners) {
    // Try to find the movie in our database
    // Use case-insensitive matching and try variations
    const { data: movies } = await supabase
      .from('movies')
      .select('id, title_en, release_year, awards')
      .or(`title_en.ilike.${winner.movieTitle},title_en.ilike.%${winner.movieTitle}%`)
      .limit(5);

    if (!movies || movies.length === 0) continue;

    // Find best match by year
    let bestMatch = movies.find(m => m.release_year === winner.year);
    if (!bestMatch) {
      // Try adjacent years
      bestMatch = movies.find(m => 
        Math.abs((m.release_year || 0) - winner.year) <= 1
      );
    }
    if (!bestMatch) {
      bestMatch = movies[0]; // Use first match
    }

    matched++;

    // Merge awards with existing
    const existingAwards = (bestMatch.awards as Award[]) || [];
    const newAwards = [...existingAwards];

    for (const award of winner.awards) {
      const alreadyHas = existingAwards.some(a => 
        a.type === award.type && a.year === award.year
      );
      if (!alreadyHas) {
        newAwards.push(award);
      }
    }

    if (newAwards.length > existingAwards.length) {
      if (dryRun) {
        console.log(chalk.green(`  ✓ ${bestMatch.title_en} (${bestMatch.release_year}): +${newAwards.length - existingAwards.length} award(s)`));
        winner.awards.forEach(a => console.log(chalk.gray(`      - ${a.name} (${a.year})`)));
      } else {
        const { error } = await supabase
          .from('movies')
          .update({ awards: newAwards })
          .eq('id', bestMatch.id);

        if (!error) {
          updated++;
        }
      }
    }
  }

  return { matched, updated };
}

// ============================================================
// MAIN FUNCTION
// ============================================================

async function enrichAwardsFromWikipedia(dryRun: boolean): Promise<void> {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════╗
║         AWARDS ENRICHMENT (Wikipedia)                            ║
╚══════════════════════════════════════════════════════════════════╝
`));

  const supabase = getSupabaseClient();
  const allWinners: AwardWinner[] = [];

  // Process each award page
  for (const awardConfig of AWARD_PAGES) {
    console.log(chalk.yellow(`\n📜 Fetching ${awardConfig.name} winners...`));
    
    const wikitext = await fetchWikipediaWikitext(awardConfig.title);
    
    if (!wikitext) {
      console.log(chalk.red(`   ❌ Could not fetch ${awardConfig.title}`));
      continue;
    }

    console.log(chalk.gray(`   Fetched ${(wikitext.length / 1024).toFixed(1)} KB of wikitext`));

    const winners = parseAwardWinners(wikitext, awardConfig);
    console.log(chalk.green(`   ✓ Found ${winners.length} award entries`));

    // Merge with existing winners
    for (const winner of winners) {
      const existing = allWinners.find(w => 
        w.movieTitle.toLowerCase() === winner.movieTitle.toLowerCase() &&
        w.year === winner.year
      );
      
      if (existing) {
        existing.awards.push(...winner.awards);
      } else {
        allWinners.push(winner);
      }
    }
  }

  console.log(chalk.cyan(`\n📊 Total unique award-winning movies found: ${allWinners.length}`));

  if (dryRun) {
    console.log(chalk.yellow('\n🔍 DRY RUN MODE - Showing what would be updated:\n'));
  }

  // Match and update movies in database
  console.log(chalk.yellow('\n🔗 Matching with database...\n'));
  const { matched, updated } = await matchAndUpdateMovies(supabase, allWinners, dryRun);

  console.log(chalk.green(`\n✅ Awards enrichment complete!`));
  console.log(chalk.gray(`   Award winners found: ${allWinners.length}`));
  console.log(chalk.gray(`   Matched in database: ${matched}`));
  console.log(chalk.gray(`   ${dryRun ? 'Would update' : 'Updated'}: ${dryRun ? matched : updated}`));

  // Show some samples
  if (!dryRun && updated > 0) {
    const { data: samples } = await supabase
      .from('movies')
      .select('title_en, release_year, awards')
      .not('awards', 'eq', '[]')
      .not('awards', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (samples?.length) {
      console.log(chalk.cyan('\n📋 Sample results:'));
      samples.forEach(m => {
        const awards = (m.awards as Award[]).map(a => `${a.name} (${a.year})`).join(', ');
        console.log(`   ${m.title_en} (${m.release_year}): ${awards}`);
      });
    }
  }
}

// ============================================================
// CLI
// ============================================================

const args = process.argv.slice(2);
const dryRun = args.includes('--dry') || args.includes('--dry-run');

enrichAwardsFromWikipedia(dryRun).catch(console.error);

