#!/usr/bin/env npx tsx
/**
 * Analyze Incomplete Data Movies
 * 
 * Categories:
 * 1. Award shows/TV shows (should be deleted)
 * 2. Real movies that can be enriched from TMDB
 * 3. Obscure movies needing manual research
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Pattern to identify non-movie entries
const NON_MOVIE_PATTERNS = [
  /best (actress|actor|supporting)/i,
  /^national film awards/i,
  /^iifa/i,
  /^filmfare/i,
  /^nandi awards/i,
  /indian idol/i,
  /kapil sharma/i,
  /drama juniors/i,
  /overall contribution/i,
  /^padma (vibhushan|bhushan|shri)/i,
];

const INCOMPLETE_MOVIES = [
  "1st-iifa-utsavam-2015",
  "balu-abcdefg-2005",
  "prince-of-peace-2012",
  "bhale-mogudu-bhale-pellam-2011",
  "andaru-dongale-dorikithe-2004",
  "apparao-driving-school-2004",
  "iddaru-attala-muddula-alludu-2006",
  "dagudumoota-dandakore-2015",
  "palanati-brahmanaidu-2003",
  "vamsoddarakudu-2000",
  "padma-vibhushan-2011",
  "best-supporting-actress-tamil-2002",
  "national-film-awards-2003",
  "best-actress-tamil-2001",
  "best-actress-kannada-2004",
  "premaku-swagatham-2002",
  "jayam-manade-raa-2000",
  "sangolli-rayanna-2012",
  "indian-idol-2021",
  "sri-renukadevi-2003",
  "overall-contribution-to-telugu-film-industry-2007",
  "sesh-sangat-2009",
  "drama-juniors-4-telugu-2023",
  "perfect-pati-2018",
  "ee-snehatheerathu-2004",
  "the-kapil-sharma-show-season-2-2021",
  "kizhakku-kadalkarai-salai-2006",
  "sakutumba-saparivaara-sametham-2000",
  "o-baby-yentha-sakkagunnave-2019",
  "kana-kandaen-2005",
  "meri-warrant-2010",
  "mayajalam-2006",
  "vallamai-tharayo-2008",
  "roja-kootam-2002",
  "nambiar-2014",
  "-2016",
  "joot-2004",
  "ethiri-en-3-2012",
];

interface AnalysisResult {
  slug: string;
  title: string;
  year: number;
  category: 'delete_non_movie' | 'enrich_tmdb' | 'manual_research';
  reason: string;
  missingFields: string[];
  tmdbData?: any;
  action: string;
}

async function searchTMDB(title: string, year: number) {
  if (!TMDB_API_KEY) return null;

  try {
    const searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}&language=en-US`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.results || data.results.length === 0) return null;

    const movie = data.results[0];
    
    // Get full details
    const detailsUrl = `${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
    const detailsResponse = await fetch(detailsUrl);
    const details = await detailsResponse.json();
    
    return details;
  } catch (error) {
    return null;
  }
}

function isNonMovie(title: string): boolean {
  return NON_MOVIE_PATTERNS.some(pattern => pattern.test(title));
}

function getMissingFields(movie: any): string[] {
  const missing: string[] = [];
  
  if (!movie.director) missing.push('director');
  if (!movie.hero && !movie.heroine) missing.push('cast');
  if (!movie.genres || movie.genres.length === 0) missing.push('genres');
  if (!movie.synopsis_en && !movie.synopsis_te) missing.push('synopsis');
  if (!movie.poster_url) missing.push('poster');
  
  return missing;
}

async function analyzeMovie(slug: string): Promise<AnalysisResult> {
  // Get from database
  const { data: movie } = await supabase
    .from('movies')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!movie) {
    return {
      slug,
      title: 'NOT FOUND',
      year: 0,
      category: 'manual_research',
      reason: 'Movie not found in database',
      missingFields: [],
      action: 'Skip - not found',
    };
  }

  const missingFields = getMissingFields(movie);

  // Check if it's a non-movie entry
  if (isNonMovie(movie.title_en)) {
    return {
      slug,
      title: movie.title_en,
      year: movie.release_year,
      category: 'delete_non_movie',
      reason: 'Award show/TV show/Non-movie entry',
      missingFields,
      action: 'DELETE - not a movie',
    };
  }

  // Try TMDB enrichment
  const tmdbData = await searchTMDB(movie.title_en, movie.release_year);

  if (tmdbData) {
    return {
      slug,
      title: movie.title_en,
      year: movie.release_year,
      category: 'enrich_tmdb',
      reason: 'Found in TMDB - can auto-enrich',
      missingFields,
      tmdbData,
      action: 'AUTO-ENRICH from TMDB',
    };
  }

  // Needs manual research
  return {
    slug,
    title: movie.title_en,
    year: movie.release_year,
    category: 'manual_research',
    reason: 'Not found in TMDB - needs manual research',
    missingFields,
    action: 'MANUAL RESEARCH needed',
  };
}

async function main() {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           ANALYZE INCOMPLETE DATA MOVIES (38 total)                   ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  const results: AnalysisResult[] = [];

  for (let i = 0; i < INCOMPLETE_MOVIES.length; i++) {
    const slug = INCOMPLETE_MOVIES[i];
    console.log(chalk.gray(`  [${i + 1}/${INCOMPLETE_MOVIES.length}] Analyzing: ${slug}...`));
    
    const result = await analyzeMovie(slug);
    results.push(result);
    
    // Rate limit
    await new Promise(r => setTimeout(r, 300));
  }

  // Categorize results
  const toDelete = results.filter(r => r.category === 'delete_non_movie');
  const toEnrich = results.filter(r => r.category === 'enrich_tmdb');
  const toResearch = results.filter(r => r.category === 'manual_research');

  console.log(chalk.blue.bold(`\n\n═══════════════════════════════════════════════════════════════════════\n`));
  console.log(chalk.green.bold('  ✅ ANALYSIS COMPLETE!\n'));

  // Statistics
  console.log(chalk.cyan('  📊 BREAKDOWN:\n'));
  console.log(chalk.red(`    🗑️  Delete (Non-movies):     ${toDelete.length}`));
  console.log(chalk.green(`    ✨ Auto-Enrich (TMDB):      ${toEnrich.length}`));
  console.log(chalk.yellow(`    🔍 Manual Research:         ${toResearch.length}\n`));

  // Show details
  if (toDelete.length > 0) {
    console.log(chalk.red.bold('  🗑️  TO DELETE (Non-Movie Entries):\n'));
    toDelete.forEach((r, i) => {
      console.log(chalk.gray(`    ${i + 1}. ${r.title} (${r.year}) - ${r.reason}`));
    });
    console.log();
  }

  if (toEnrich.length > 0) {
    console.log(chalk.green.bold('  ✨ CAN AUTO-ENRICH FROM TMDB:\n'));
    toEnrich.forEach((r, i) => {
      console.log(chalk.gray(`    ${i + 1}. ${r.title} (${r.year})`));
      console.log(chalk.cyan(`       Missing: ${r.missingFields.join(', ')}`));
      if (r.tmdbData) {
        const cast = r.tmdbData.credits?.cast?.slice(0, 2).map((c: any) => c.name).join(', ');
        console.log(chalk.green(`       TMDB: ${r.tmdbData.title} | Cast: ${cast || 'N/A'}`));
      }
    });
    console.log();
  }

  if (toResearch.length > 0) {
    console.log(chalk.yellow.bold('  🔍 NEED MANUAL RESEARCH:\n'));
    toResearch.forEach((r, i) => {
      console.log(chalk.gray(`    ${i + 1}. ${r.title} (${r.year})`));
      console.log(chalk.gray(`       Missing: ${r.missingFields.join(', ')}`));
    });
    console.log();
  }

  // Generate reports
  const csvPath = resolve(process.cwd(), 'docs/manual-review/incomplete-data-analysis.csv');
  const csv = generateCSV(results);
  writeFileSync(csvPath, csv);
  console.log(chalk.green(`  ✅ CSV report: docs/manual-review/incomplete-data-analysis.csv\n`));

  // Generate deletion list
  const deletePath = resolve(process.cwd(), 'docs/manual-review/incomplete-data-to-delete.txt');
  const deleteList = toDelete.map(r => r.slug).join('\n');
  writeFileSync(deletePath, deleteList);
  console.log(chalk.green(`  ✅ Deletion list: docs/manual-review/incomplete-data-to-delete.txt\n`));

  // Generate enrichment list
  const enrichPath = resolve(process.cwd(), 'docs/manual-review/incomplete-data-to-enrich.txt');
  const enrichList = toEnrich.map(r => r.slug).join('\n');
  writeFileSync(enrichPath, enrichList);
  console.log(chalk.green(`  ✅ Enrichment list: docs/manual-review/incomplete-data-to-enrich.txt\n`));

  console.log(chalk.blue.bold(`═══════════════════════════════════════════════════════════════════════\n`));
  console.log(chalk.cyan('  NEXT STEPS:\n'));
  console.log(chalk.gray('    1. Review the deletion list - confirm non-movies'));
  console.log(chalk.gray('    2. Run batch delete for non-movie entries'));
  console.log(chalk.gray('    3. Run batch enrich for movies found in TMDB'));
  console.log(chalk.gray('    4. Manually research remaining movies\n'));
}

function generateCSV(results: AnalysisResult[]): string {
  let csv = 'Slug,Title,Year,Category,Reason,Missing Fields,Action,TMDB Found\n';
  
  results.forEach(r => {
    csv += [
      `"${r.slug}"`,
      `"${r.title}"`,
      r.year,
      r.category,
      `"${r.reason}"`,
      `"${r.missingFields.join(', ')}"`,
      `"${r.action}"`,
      r.tmdbData ? 'Yes' : 'No',
    ].join(',') + '\n';
  });
  
  return csv;
}

main().catch(console.error);
