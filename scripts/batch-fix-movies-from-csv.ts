import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import * as fs from 'fs';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(chalk.red('Supabase credentials not set'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const DRY_RUN = process.argv.includes('--dry-run');
const CSV_PATH = './MOVIE-AUDIT-ANOMALIES.csv';

interface MovieAnomaly {
  id: string;
  title_en: string;
  title_te: string;
  year: string;
  slug: string;
  anomaly_type: string;
  description: string;
  severity: string;
  current_value: string;
  expected_value: string;
}

function parseCSV(csvContent: string): MovieAnomaly[] {
  const lines = csvContent.split('\n');
  const movies: MovieAnomaly[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line (handle quoted fields)
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim());
    
    if (fields.length >= 10) {
      movies.push({
        id: fields[0],
        title_en: fields[1],
        title_te: fields[2],
        year: fields[3],
        slug: fields[4],
        anomaly_type: fields[5],
        description: fields[6],
        severity: fields[7],
        current_value: fields[8] || '',
        expected_value: fields[9] || '',
      });
    }
  }
  
  return movies;
}

async function main() {
  console.log(chalk.blue('\n🎬 BATCH FIX MOVIES FROM CSV\n'));
  
  if (DRY_RUN) {
    console.log(chalk.cyan('📝 DRY RUN MODE - No changes will be made\n'));
  } else {
    console.log(chalk.yellow('⚠️  EXECUTE MODE - Updating database...\n'));
  }

  // Read CSV
  if (!fs.existsSync(CSV_PATH)) {
    console.error(chalk.red(`CSV file not found: ${CSV_PATH}`));
    return;
  }

  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const movies = parseCSV(csvContent);
  
  console.log(chalk.cyan(`Loaded ${movies.length} movies from CSV\n`));

  // Group by anomaly type
  const missingYear = movies.filter(m => m.anomaly_type === 'missing_year');
  const unpublished = movies.filter(m => m.anomaly_type === 'unpublished_with_data');
  const missingRatings = movies.filter(m => m.anomaly_type === 'missing_ratings');
  const slugIssues = movies.filter(m => m.anomaly_type === 'slug_format_issue');
  const yearMismatches = movies.filter(m => m.anomaly_type === 'year_date_mismatch');
  const missingSynopsis = movies.filter(m => m.anomaly_type === 'missing_synopsis');
  const suspiciousTitles = movies.filter(m => m.anomaly_type === 'suspicious_title');

  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  // Process Missing Years
  console.log(chalk.cyan('═══════════════════════════════════════════'));
  console.log(chalk.cyan(`FIXING MISSING RELEASE YEARS (${missingYear.length} movies)`));
  console.log(chalk.cyan('═══════════════════════════════════════════\n'));

  for (const movie of missingYear) {
    const yearValue = movie.expected_value === 'TBA' ? null : 
                     movie.expected_value.match(/\d{4}/) ? parseInt(movie.expected_value.match(/\d{4}/)![0]) : null;
    
    console.log(chalk.yellow(`[${totalProcessed + 1}/${movies.length}] ${movie.title_en}`));
    console.log(chalk.gray(`  Year: ${yearValue || 'NULL'}`));

    if (!DRY_RUN) {
      const { error } = await supabase
        .from('movies')
        .update({ release_year: yearValue })
        .eq('id', movie.id);

      if (error) {
        console.log(chalk.red(`  ✗ Failed: ${error.message}\n`));
        totalFailed++;
      } else {
        console.log(chalk.green(`  ✅ Updated\n`));
        totalSuccess++;
      }
    } else {
      console.log(chalk.cyan(`  ⊳ Would update to: ${yearValue || 'NULL'}\n`));
      totalSuccess++;
    }
    totalProcessed++;
  }

  // Process Unpublished Movies
  console.log(chalk.cyan('═══════════════════════════════════════════'));
  console.log(chalk.cyan(`PUBLISHING MOVIES (${unpublished.length} movies)`));
  console.log(chalk.cyan('═══════════════════════════════════════════\n'));

  for (const movie of unpublished) {
    console.log(chalk.yellow(`[${totalProcessed + 1}/${movies.length}] ${movie.title_en}`));

    if (!DRY_RUN) {
      const { error } = await supabase
        .from('movies')
        .update({ is_published: true })
        .eq('id', movie.id);

      if (error) {
        console.log(chalk.red(`  ✗ Failed: ${error.message}\n`));
        totalFailed++;
      } else {
        console.log(chalk.green(`  ✅ Published\n`));
        totalSuccess++;
      }
    } else {
      console.log(chalk.cyan(`  ⊳ Would publish\n`));
      totalSuccess++;
    }
    totalProcessed++;
  }

  // Process Year Mismatches
  if (yearMismatches.length > 0) {
    console.log(chalk.cyan('═══════════════════════════════════════════'));
    console.log(chalk.cyan(`FIXING YEAR/DATE MISMATCHES (${yearMismatches.length} movies)`));
    console.log(chalk.cyan('═══════════════════════════════════════════\n'));

    for (const movie of yearMismatches) {
      const yearValue = parseInt(movie.expected_value);
      console.log(chalk.yellow(`[${totalProcessed + 1}/${movies.length}] ${movie.title_en}`));
      console.log(chalk.gray(`  New Year: ${yearValue}`));

      if (!DRY_RUN) {
        const { error } = await supabase
          .from('movies')
          .update({ release_year: yearValue })
          .eq('id', movie.id);

        if (error) {
          console.log(chalk.red(`  ✗ Failed: ${error.message}\n`));
          totalFailed++;
        } else {
          console.log(chalk.green(`  ✅ Updated\n`));
          totalSuccess++;
        }
      } else {
        console.log(chalk.cyan(`  ⊳ Would update year to: ${yearValue}\n`));
        totalSuccess++;
      }
      totalProcessed++;
    }
  }

  // Process Slug Issues
  if (slugIssues.length > 0) {
    console.log(chalk.cyan('═══════════════════════════════════════════'));
    console.log(chalk.cyan(`FIXING SLUG FORMATS (${slugIssues.length} movies)`));
    console.log(chalk.cyan('═══════════════════════════════════════════\n'));

    for (const movie of slugIssues) {
      console.log(chalk.yellow(`[${totalProcessed + 1}/${movies.length}] ${movie.title_en}`));
      console.log(chalk.gray(`  New Slug: ${movie.expected_value}`));

      if (!DRY_RUN) {
        const { error } = await supabase
          .from('movies')
          .update({ slug: movie.expected_value })
          .eq('id', movie.id);

        if (error) {
          console.log(chalk.red(`  ✗ Failed: ${error.message}\n`));
          totalFailed++;
        } else {
          console.log(chalk.green(`  ✅ Updated\n`));
          totalSuccess++;
        }
      } else {
        console.log(chalk.cyan(`  ⊳ Would update slug to: ${movie.expected_value}\n`));
        totalSuccess++;
      }
      totalProcessed++;
    }
  }

  // Process Suspicious Titles (just publish them)
  if (suspiciousTitles.length > 0) {
    console.log(chalk.cyan('═══════════════════════════════════════════'));
    console.log(chalk.cyan(`PUBLISHING SUSPICIOUS TITLES (${suspiciousTitles.length} movies)`));
    console.log(chalk.cyan('═══════════════════════════════════════════\n'));

    for (const movie of suspiciousTitles) {
      console.log(chalk.yellow(`[${totalProcessed + 1}/${movies.length}] ${movie.title_en}`));

      if (!DRY_RUN) {
        const { error } = await supabase
          .from('movies')
          .update({ is_published: true })
          .eq('id', movie.id);

        if (error) {
          console.log(chalk.red(`  ✗ Failed: ${error.message}\n`));
          totalFailed++;
        } else {
          console.log(chalk.green(`  ✅ Published\n`));
          totalSuccess++;
        }
      } else {
        console.log(chalk.cyan(`  ⊳ Would publish\n`));
        totalSuccess++;
      }
      totalProcessed++;
    }
  }

  // Skip missing ratings (these are pre-release, no action needed)
  console.log(chalk.gray(`\nSkipping ${missingRatings.length} pre-release movies with missing ratings (expected)\n`));
  totalSkipped += missingRatings.length;

  // Summary
  console.log(chalk.blue('═'.repeat(60)));
  console.log(chalk.blue('SUMMARY'));
  console.log(chalk.blue('═'.repeat(60) + '\n'));

  console.log(chalk.cyan(`Total Processed:    ${totalProcessed}`));
  console.log(chalk.green(`Successful:         ${totalSuccess}`));
  console.log(chalk.red(`Failed:             ${totalFailed}`));
  console.log(chalk.gray(`Skipped:            ${totalSkipped}\n`));

  if (missingSynopsis.length > 0) {
    console.log(chalk.yellow('⚠️  MANUAL ACTION REQUIRED:\n'));
    console.log(chalk.yellow(`${missingSynopsis.length} movies need synopses added manually:\n`));
    missingSynopsis.forEach((movie, i) => {
      console.log(chalk.gray(`${i + 1}. ${movie.title_en} (${movie.id.substring(0, 8)}...)`));
    });
    console.log('');
  }

  if (!DRY_RUN && totalSuccess > 0) {
    console.log(chalk.green('🎉 Movie anomalies fixed successfully!\n'));
    console.log(chalk.yellow('🔄 Changes are live - refresh your browser to see updates\n'));
  } else if (DRY_RUN) {
    console.log(chalk.blue('📝 DRY RUN completed\n'));
    console.log(chalk.blue('Run without --dry-run to apply changes:\n'));
    console.log(chalk.blue('  npx tsx scripts/batch-fix-movies-from-csv.ts\n'));
  }

  console.log(chalk.blue('═'.repeat(60) + '\n'));
}

main().catch(console.error);
