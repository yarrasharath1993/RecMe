#!/usr/bin/env npx tsx
/**
 * Awards Enrichment Script
 * 
 * Searches for movie awards using Google Custom Search API.
 * Parses results to extract award information.
 * 
 * Award types detected:
 * - National Film Awards (India)
 * - Filmfare Awards South
 * - Nandi Awards (Andhra Pradesh)
 * - SIIMA Awards
 * - ZEE Cine Awards
 * 
 * Requires:
 *   GOOGLE_CSE_API_KEY - Google API Key with Custom Search enabled
 *   GOOGLE_CSE_ID - Custom Search Engine ID
 * 
 * Usage:
 *   npx tsx scripts/enrich-awards.ts --limit=50
 *   npx tsx scripts/enrich-awards.ts --dry
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// CONFIGURATION
// ============================================================

const GOOGLE_CSE_API_KEY = process.env.GOOGLE_CSE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
const RATE_LIMIT_MS = 3000; // Very conservative - 1 request per 3 seconds

// Award patterns to detect
const AWARD_PATTERNS = [
  { pattern: /national\s*film\s*award/i, type: 'national', name: 'National Film Award' },
  { pattern: /filmfare\s*award/i, type: 'filmfare', name: 'Filmfare Award' },
  { pattern: /nandi\s*award/i, type: 'nandi', name: 'Nandi Award' },
  { pattern: /siima/i, type: 'siima', name: 'SIIMA Award' },
  { pattern: /zee\s*cine/i, type: 'zee', name: 'ZEE Cine Award' },
  { pattern: /iifa/i, type: 'iifa', name: 'IIFA Award' },
  { pattern: /oscar/i, type: 'oscar', name: 'Academy Award' },
  { pattern: /golden\s*globe/i, type: 'golden_globe', name: 'Golden Globe' },
];

// Category patterns
const CATEGORY_PATTERNS = [
  { pattern: /best\s*(feature\s*)?film/i, category: 'Best Film' },
  { pattern: /best\s*director/i, category: 'Best Director' },
  { pattern: /best\s*actor/i, category: 'Best Actor' },
  { pattern: /best\s*actress/i, category: 'Best Actress' },
  { pattern: /best\s*music/i, category: 'Best Music' },
  { pattern: /best\s*cinematography/i, category: 'Best Cinematography' },
  { pattern: /best\s*supporting/i, category: 'Best Supporting Role' },
  { pattern: /best\s*debut/i, category: 'Best Debut' },
  { pattern: /best\s*telugu/i, category: 'Best Telugu Film' },
  { pattern: /critics?\s*choice/i, category: 'Critics Choice' },
  { pattern: /popular/i, category: 'Most Popular' },
];

// ============================================================
// TYPES
// ============================================================

interface Award {
  type: string;
  name: string;
  category?: string;
  year?: number;
  recipient?: string;
}

interface GoogleSearchResult {
  items?: Array<{
    title: string;
    snippet: string;
    link: string;
  }>;
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
// GOOGLE SEARCH
// ============================================================

async function searchForAwards(title: string, year?: number): Promise<string[]> {
  if (!GOOGLE_CSE_API_KEY || !GOOGLE_CSE_ID) {
    return [];
  }

  const query = `"${title}" ${year || ''} Telugu movie award winner Filmfare Nandi National`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_CSE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}&num=5`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.log(chalk.yellow('\n⚠️  Rate limited by Google. Waiting...'));
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      return [];
    }

    const data: GoogleSearchResult = await response.json();
    
    // Combine all text from results
    const texts: string[] = [];
    for (const item of data.items || []) {
      texts.push(item.title);
      texts.push(item.snippet);
    }

    return texts;
  } catch (error) {
    console.error(chalk.red(`Error searching for ${title}:`), error);
    return [];
  }
}

// ============================================================
// AWARD EXTRACTION
// ============================================================

function extractAwards(texts: string[], movieYear?: number): Award[] {
  const awards: Award[] = [];
  const seen = new Set<string>();
  const combinedText = texts.join(' ');

  for (const awardDef of AWARD_PATTERNS) {
    if (awardDef.pattern.test(combinedText)) {
      const award: Award = {
        type: awardDef.type,
        name: awardDef.name,
      };

      // Try to find category
      for (const catDef of CATEGORY_PATTERNS) {
        if (catDef.pattern.test(combinedText)) {
          award.category = catDef.category;
          break;
        }
      }

      // Try to extract year (look for 4-digit years near the award mention)
      const yearMatch = combinedText.match(/\b(20[0-2][0-9]|19[89][0-9])\b/);
      if (yearMatch) {
        const extractedYear = parseInt(yearMatch[1]);
        // Only use year if it's around the movie's release year
        if (!movieYear || Math.abs(extractedYear - movieYear) <= 2) {
          award.year = extractedYear;
        }
      }

      // Create unique key to avoid duplicates
      const key = `${award.type}-${award.category || 'general'}`;
      if (!seen.has(key)) {
        seen.add(key);
        awards.push(award);
      }
    }
  }

  return awards;
}

// ============================================================
// MAIN FUNCTION
// ============================================================

async function enrichAwards(limit: number, dryRun: boolean): Promise<void> {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════╗
║         AWARDS ENRICHMENT (Google Custom Search)                 ║
╚══════════════════════════════════════════════════════════════════╝
`));

  if (!GOOGLE_CSE_API_KEY || !GOOGLE_CSE_ID) {
    console.error(chalk.red('❌ Missing Google CSE credentials'));
    console.log(chalk.gray('   Set GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID in .env.local'));
    return;
  }

  const supabase = getSupabaseClient();

  // Focus on high-rated movies that are more likely to have awards
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, our_rating, avg_rating, is_blockbuster, awards')
    .or('awards.is.null,awards.eq.[]')
    .eq('is_published', true)
    .gte('avg_rating', 7) // Only check highly rated movies
    .order('avg_rating', { ascending: false })
    .limit(limit);

  if (error) {
    console.error(chalk.red('Error fetching movies:'), error.message);
    return;
  }

  if (!movies || movies.length === 0) {
    console.log(chalk.green('✅ No movies need awards enrichment!'));
    return;
  }

  console.log(chalk.gray(`Found ${movies.length} high-rated movies to check for awards\n`));
  console.log(chalk.yellow(`⚠️  Google CSE has 100 free queries/day. Using ${movies.length} queries.\n`));

  if (dryRun) {
    console.log(chalk.yellow('🔍 DRY RUN MODE - No changes will be made\n'));
  }

  let processed = 0;
  let withAwards = 0;
  let failed = 0;

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    process.stdout.write(`\r  ${i + 1}/${movies.length} - Searching: ${movie.title_en?.substring(0, 35)}...`);

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));

    const searchResults = await searchForAwards(movie.title_en, movie.release_year);
    
    if (searchResults.length === 0) {
      processed++;
      continue;
    }

    const awards = extractAwards(searchResults, movie.release_year);

    if (awards.length === 0) {
      processed++;
      continue;
    }

    withAwards++;

    if (dryRun) {
      console.log(chalk.green(`\n  ✓ ${movie.title_en}: ${awards.length} award(s) found`));
      awards.forEach(a => console.log(chalk.gray(`      - ${a.name}${a.category ? ` (${a.category})` : ''}`)));
      processed++;
      continue;
    }

    // Update the movie
    const { error: updateError } = await supabase
      .from('movies')
      .update({ awards })
      .eq('id', movie.id);

    if (updateError) {
      failed++;
    } else {
      processed++;
    }
  }

  console.log(`\n`);
  console.log(chalk.green(`\n✅ Awards enrichment complete!`));
  console.log(chalk.gray(`   Processed: ${processed}`));
  console.log(chalk.gray(`   Found awards: ${withAwards}`));
  console.log(chalk.gray(`   Failed: ${failed}`));

  // Show sample results
  if (!dryRun && withAwards > 0) {
    const { data: samples } = await supabase
      .from('movies')
      .select('title_en, awards')
      .not('awards', 'eq', '[]')
      .not('awards', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (samples?.length) {
      console.log(chalk.cyan('\n📋 Sample results:'));
      samples.forEach(m => {
        const awardsList = (m.awards as Award[])
          .map(a => a.name)
          .join(', ');
        console.log(`   ${m.title_en}: ${awardsList}`);
      });
    }
  }
}

// ============================================================
// CLI
// ============================================================

const args = process.argv.slice(2);
const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '30');
const dryRun = args.includes('--dry') || args.includes('--dry-run');

enrichAwards(limit, dryRun).catch(console.error);

