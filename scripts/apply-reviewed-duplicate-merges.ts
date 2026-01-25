#!/usr/bin/env npx tsx
/**
 * Apply Reviewed Duplicate Merges
 * 
 * Based on user review of DUPLICATES-AUDIT-RESULTS.csv
 * - Merges confirmed duplicates
 * - Skips false positives marked as REJECT MERGE
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { readFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DuplicateRecord {
  type: string;
  category: string;
  id1: string;
  id2: string;
  slug1: string;
  slug2: string;
  name1: string;
  name2: string;
  year1?: number | null;
  year2?: number | null;
  match_type: string;
  confidence: number;
  reason: string;
  action: string;
  data_completeness1: string;
  data_completeness2: string;
}

// List of pairs to REJECT (false positives from user review)
const REJECTED_PAIRS = new Set<string>();

// Add rejected pairs based on user review
function initializeRejectedPairs() {
  const rejected = [
    // Batch 1
    'madonna-the-confessions-tour-2006|sundaraniki-thondarekkuva-2006',
    'the-king-of-kings-2025|andhra-king-taluka-2025',
    'radha-krishna-2021|krish-2021',
    'arjun-reddy-2017|dwaraka-2017',
    'ranasthalam-2019|abhinetri-2016',
    'dhruva-2016|dhuruvangal-pathinaaru-2016',
    'mental-madhilo-2017|appatlo-okadundevadu-2016',
    'ooriki-uttharana-2021|utthara-2020',
    
    // Batch 2
    'govindudu-andarivadele-2014|yevadu-2014',
    'friends-book-2012|gunde-jhallumandi-2008',
    
    // Batch 3
    'vikramarkudu-2006|vikram-2005',
    'anand-2004|anandamanandamaye-2004',
    'pelli-kani-prasad-2008|pelli-kani-prasad-2003',
    'avunanna-kadanna-2005|avuna-2003',
    'evaru-2019|seshu-2002',
    'khushi-2001|kabhi-khushi-kabhie-gham-2001',
    
    // Batch 4
    'pelli-1997|maa-nannaki-pelli-1997',
    'drohi-2010|drohi-1996',
    'swami-vivekananda-1998|swami-vivekananda-1994',
    'mukundan-unni-associates-2022|kundan-1993',
    'peddarikam-tba|peddarikam-1992',
    'priyathama-neevachata-kusalama-2013|priyathama-1992',
    'nee-thodu-kavali-2002|parishkaram-1991',
    'bobbili-vamsam-1999|shatruvu-1991',
    'led-zeppelin-celebration-day-2012|anna-thammudu-1990',
    
    // Batch 5
    'poola-rangadu-2012|poola-rangadu-1989',
    'neninthe-2010|vicky-daada-1989',
    'comedy-express-2010|abhinandana-1988',
    'state-rowdy-1989|yuddha-bhoomi-1988',
    'naa-style-veru-2009|vishwanatha-nayakudu-1987',
    'mutha-mestri-1993|chanakya-sapatham-1986',
    'nee-kosam-1999|aranyakanda-1986',
    'kaashmora-2016|kashmora-1986',
    'ramu-1987|adavi-donga-1985',
    'indhu-1994|rakta-sindhuram-1985',
    'nireekshana-1986|s-p-bhayankar-1984',
    
    // Adarshavanthudu false positives (all 1984 films)
    'adarshavanthudu-1984|nayakulaku-saval-1984',
    'adarshavanthudu-1984|bhagyalakshmi-1984',
    'adarshavanthudu-1984|railu-dopidi-1984',
    'adarshavanthudu-1984|manasa-veena-1984',
    'adarshavanthudu-1984|kurra-cheshtalu-1984',
    'adarshavanthudu-1984|janam-manam-1984',
    'adarshavanthudu-1984|yama-doothalu-1984',
    'adarshavanthudu-1984|veerabhadrudu-1984',
    'adarshavanthudu-1984|devalayam-1984',
    'adarshavanthudu-1984|jagan-1984',
    'adarshavanthudu-1984|doctor-gari-kodalu-1983',
    'adarshavanthudu-1984|shakthi-1983',
    'adarshavanthudu-1984|konte-kodallu-1983',
    'adarshavanthudu-1984|keerthi-kantha-kanakam-1983',
    'adarshavanthudu-1984|moogavadi-paga-1983',
    'adarshavanthudu-1984|vetagadi-vijayam-1983',
    'adarshavanthudu-1984|chattaniki-sawal-1983',
    'adarshavanthudu-1984|rajakumar-1983',
    'adarshavanthudu-1984|apadhbandhavulu-1983',
    'adarshavanthudu-1984|oorantha-sankranthi-1983',
    
    // More false positives
    'kanchana-2-2015|kanchana-ganga-1984',
    'mitrudu-2009|amayakudu-kadhu-asadhyudu-1983',
    'maga-maharaju-1983|sivudu-sivudu-sivudu-1983',
    'puli-1985|mantri-gari-viyyankudu-1983',
    'gopala-krishnudu-1982|ekalavya-1982',
    'illale-devatha-1985|devata-1982',
    'manchu-pallaki-1982|mondi-ghatam-1982',
    'satyabhama-2024|satyabhama-1981',
    'thodu-needa-1983|prema-pichchi-1981',
    'manasulo-maata-1999|jathagadu-1981',
    'donga-sachinollu-2008|challenge-ramudu-1980',
    'bhadradri-ramudu-2004|bebbuli-1980',
    'ee-charithra-ye-siratho-1982|nijam-1980',
    'mesthri-2009|buchi-babu-1980',
    'pistha-2009|guru-1980',
    'tiger-harischandra-prasad-2003|akbar-salim-anarkali-1979',
    'vaana-2008|melu-kolupu-1978',
    'ammoru-1995|mundadugu-1978',
    'vara-prasad-potti-prasad-2011|bangaru-manishi-1976',
    'vamsi-2000|vemulawada-bheemakavi-1976',
    'iddaru-iddare-1990|iddaru-iddare-1976',
    'andaru-dongale-dorikithe-2004|andaru-dongale-1974',
    'poola-rangadu-2012|poola-rangadu-1967',
    'rama-rama-krishna-krishna-2010|bangaru-thimmaraju-1964',
    'sita-rama-kalyanam-1986|seetha-rama-kalyanam-1961',
    'appu-chesi-pappu-koodu-2008|appu-chesi-pappu-koodu-1959',
    
    // More false positives
    'v-for-vendetta-2006|vivah-2006',
    'bangaru-kutumbam-1994|brahmachari-mogudu-1994',
    'bangaru-kutumbam-1994|yamaleela-1994',
  ];
  
  for (const pair of rejected) {
    REJECTED_PAIRS.add(pair);
    // Also add reverse order
    const [slug1, slug2] = pair.split('|');
    REJECTED_PAIRS.add(`${slug2}|${slug1}`);
  }
}

function shouldReject(slug1: string, slug2: string): boolean {
  const key1 = `${slug1}|${slug2}`;
  const key2 = `${slug2}|${slug1}`;
  return REJECTED_PAIRS.has(key1) || REJECTED_PAIRS.has(key2);
}

function calculateDataScore(movie: any): number {
  let score = 0;
  if (movie.title_en) score += 20;
  if (movie.title_te) score += 10;
  if (movie.slug) score += 20;
  if (movie.release_year) score += 20;
  if (movie.director) score += 10;
  if (movie.hero || movie.heroine) score += 10;
  if (movie.tmdb_id) score += 15;
  if (movie.imdb_id) score += 10;
  if (movie.poster_url && !movie.poster_url.includes('placeholder')) score += 10;
  if (movie.synopsis) score += 5;
  if (movie.producer) score += 5;
  if (movie.music_director) score += 5;
  return score;
}

async function fetchMovie(id: string) {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) {
    return null;
  }
  return data;
}

async function mergeMovies(id1: string, id2: string, record: DuplicateRecord, execute: boolean) {
  const movie1 = await fetchMovie(id1);
  const movie2 = await fetchMovie(id2);
  
  if (!movie1 || !movie2) {
    console.log(chalk.red(`  ❌ One or both movies not found`));
    return false;
  }
  
  // Determine which to keep based on data quality
  const score1 = calculateDataScore(movie1);
  const score2 = calculateDataScore(movie2);
  
  let keepId: string;
  let deleteId: string;
  let keepMovie: any;
  let deleteMovie: any;
  
  if (score1 > score2) {
    keepId = id1;
    deleteId = id2;
    keepMovie = movie1;
    deleteMovie = movie2;
  } else if (score2 > score1) {
    keepId = id2;
    deleteId = id1;
    keepMovie = movie2;
    deleteMovie = movie1;
  } else {
    // Equal scores - prefer the one with better title (more complete)
    if ((movie1.title_en?.length || 0) >= (movie2.title_en?.length || 0)) {
      keepId = id1;
      deleteId = id2;
      keepMovie = movie1;
      deleteMovie = movie2;
    } else {
      keepId = id2;
      deleteId = id1;
      keepMovie = movie2;
      deleteMovie = movie1;
    }
  }
  
  console.log(chalk.yellow(`\n  ${record.name1} (${record.year1}) ↔ ${record.name2} (${record.year2})`));
  console.log(chalk.gray(`    Keep: ${keepMovie.slug} (score: ${Math.max(score1, score2)})`));
  console.log(chalk.gray(`    Delete: ${deleteMovie.slug} (score: ${Math.min(score1, score2)})`));
  
  if (!execute) {
    console.log(chalk.yellow(`    (Dry run - no changes)`));
    return true;
  }
  
  // Merge data: take non-null fields from deleteMovie if keepMovie is missing them
  const updates: any = {};
  const fieldsToMerge = [
    'title_te', 'director', 'hero', 'heroine', 'producer', 'music_director',
    'tmdb_id', 'imdb_id', 'poster_url', 'synopsis', 'genres', 'runtime_minutes',
    'language', 'avg_rating', 'total_reviews'
  ];
  
  for (const field of fieldsToMerge) {
    if (!keepMovie[field] && deleteMovie[field]) {
      updates[field] = deleteMovie[field];
    }
  }
  
  // Update kept movie if there's data to merge
  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from('movies')
      .update(updates)
      .eq('id', keepId);
    
    if (updateError) {
      console.log(chalk.red(`    ❌ Update failed: ${updateError.message}`));
      return false;
    }
    console.log(chalk.green(`    ✓ Merged ${Object.keys(updates).length} fields`));
  }
  
  // Update foreign key references before deletion
  const tablesToUpdate = [
    'career_milestones',
    'movie_reviews',
    'user_ratings',
    'movie_ratings',
  ];
  
  let refsUpdated = 0;
  for (const table of tablesToUpdate) {
    try {
      const { data, error: updateError } = await supabase
        .from(table)
        .update({ movie_id: keepId })
        .eq('movie_id', deleteId)
        .select();
      
      if (!updateError && data) {
        refsUpdated += data.length;
      }
    } catch (e) {
      // Table might not exist or column might be different, skip
    }
  }
  
  if (refsUpdated > 0) {
    console.log(chalk.gray(`    ✓ Updated ${refsUpdated} references`));
  }
  
  // Delete the duplicate
  const { error: deleteError } = await supabase
    .from('movies')
    .delete()
    .eq('id', deleteId);
  
  if (deleteError) {
    console.log(chalk.red(`    ❌ Delete failed: ${deleteError.message}`));
    // If it's a foreign key constraint, try to unpublish instead
    if (deleteError.message.includes('foreign key constraint')) {
      console.log(chalk.yellow(`    ⚠️  Attempting to unpublish instead...`));
      const { error: unpublishError } = await supabase
        .from('movies')
        .update({ is_published: false })
        .eq('id', deleteId);
      
      if (!unpublishError) {
        console.log(chalk.yellow(`    ✓ Unpublished duplicate (has references)`));
        return true;
      }
    }
    return false;
  }
  
  console.log(chalk.green(`    ✅ Duplicate deleted`));
  return true;
}

async function main() {
  console.log(chalk.bold('\n🔧 APPLYING REVIEWED DUPLICATE MERGES\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');
  
  initializeRejectedPairs();
  
  const csvPath = resolve(process.cwd(), 'DUPLICATES-AUDIT-RESULTS.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');
  
  // Simple CSV parser that handles quoted fields
  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }
  
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = parseCSVLine(lines[0]);
  const records: DuplicateRecord[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;
    
    const record: any = {};
    headers.forEach((header, idx) => {
      let value = values[idx] || '';
      // Remove quotes if present
      value = value.replace(/^"|"$/g, '');
      record[header.trim()] = value;
    });
    
    // Parse year as number
    if (record.year1) {
      const year = parseInt(record.year1);
      record.year1 = isNaN(year) ? null : year;
    }
    if (record.year2) {
      const year = parseInt(record.year2);
      record.year2 = isNaN(year) ? null : year;
    }
    
    records.push(record as DuplicateRecord);
  }
  
  const execute = process.argv.includes('--execute');
  
  if (!execute) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE - No changes will be made\n'));
    console.log(chalk.yellow('   Add --execute flag to apply merges\n'));
  }
  
  let merged = 0;
  let rejected = 0;
  let errors = 0;
  let skipped = 0;
  
  for (const record of records) {
    if (record.type !== 'movie') {
      skipped++;
      continue;
    }
    
    // Check if this pair should be rejected
    if (shouldReject(record.slug1, record.slug2)) {
      console.log(chalk.gray(`  ⏭️  REJECTED: ${record.name1} ↔ ${record.name2}`));
      rejected++;
      continue;
    }
    
    // Process merge
    const success = await mergeMovies(record.id1, record.id2, record, execute);
    if (success) {
      merged++;
    } else {
      errors++;
    }
  }
  
  console.log(chalk.bold('\n' + '═'.repeat(70)));
  console.log(chalk.bold('📊 SUMMARY\n'));
  console.log(`  Merged: ${chalk.green(merged)}`);
  console.log(`  Rejected (false positives): ${chalk.yellow(rejected)}`);
  console.log(`  Errors: ${chalk.red(errors)}`);
  console.log(`  Skipped: ${chalk.gray(skipped)}`);
  console.log();
  
  if (!execute) {
    console.log(chalk.yellow('⚠️  This was a DRY RUN. No changes were made.'));
    console.log(chalk.yellow('   Run with --execute to apply merges.\n'));
  }
}

main().catch(console.error);
