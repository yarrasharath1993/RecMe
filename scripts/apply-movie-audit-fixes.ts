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

// User-provided expected values for missing years
const yearFixes: Record<string, number | null> = {
  'a34582fd-a861-45ab-8b5f-4190d6296bba': 2023, // Umapathi
  '2ac29b5b-1f24-42ed-af0c-399e037111e2': 2021, // Takshakudu
  '0dc041e2-92cc-4311-8c8e-170204298d94': 2025, // Euphoria
  '90b5d473-918b-4b28-890d-60ac4ed76174': 2024, // Band Melam
  '3eb55434-16e6-4c9c-b9ac-88f7ff54e0c8': 2022, // Arrtham
  'e0973669-4934-407d-aad1-6bccc3a6cce4': 2023, // Abhiram
  'd91f34c8-cef4-4fcd-a88f-2aa7ae9c6f3f': 2024, // Maate Mantramu
  '710aeabe-7bff-4b8f-89c1-e7f60e7a4e43': 2025, // What The Fish
  'c3b46098-0eaa-465c-96cf-d7b5b02a5c36': 1992, // Peddarikam
  // Year/Date mismatches
  '42fb455f-d2d6-4b48-9e61-1a0ba6cf8c17': 2024, // Guard: Revenge
  '9a788ea5-4e78-4e28-81ff-8976dd0fb9d5': 2026, // Salaar: Part 2
};

// Slug fixes
const slugFixes: Record<string, { slug: string; year?: number }> = {
  'a98974a0-85e0-4b80-8b03-daa3c738f50e': { slug: 'varanasi-2026', year: 2026 },  // Vāranāsi
  '9b7b604c-bf05-4a6d-b75e-7fd85e3bf78c': { slug: 'devara-part-2-2026', year: 2026 }, // Devara: Part 2
  '5f4d9c51-8d85-429a-b47b-2da0bc746c98': { slug: 'gd-naidu-2025', year: 2025 }, // G.D.N
};

interface MovieAnomaly {
  id: string;
  title_en: string;
  title_te: string;
  year: string;
  slug: string;
  anomaly_type: string;
  severity: string;
}

function parseCSV(csvContent: string): MovieAnomaly[] {
  const lines = csvContent.split('\n');
  const movies: MovieAnomaly[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
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
    
    if (fields.length >= 8) {
      movies.push({
        id: fields[0],
        title_en: fields[1],
        title_te: fields[2],
        year: fields[3],
        slug: fields[4],
        anomaly_type: fields[5],
        severity: fields[7],
      });
    }
  }
  
  return movies;
}

async function main() {
  console.log(chalk.blue('\n🎬 APPLY MOVIE AUDIT FIXES\n'));
  
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
  const slugIssues = movies.filter(m => m.anomaly_type === 'slug_format_issue');
  const yearMismatches = movies.filter(m => m.anomaly_type === 'year_date_mismatch');
  const suspiciousTitles = movies.filter(m => m.anomaly_type === 'suspicious_title');

  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  // Fix Missing Years (only those with known values)
  console.log(chalk.cyan('═══════════════════════════════════════════'));
  console.log(chalk.cyan(`FIXING MISSING RELEASE YEARS`));
  console.log(chalk.cyan('═══════════════════════════════════════════\n'));

  const yearsToFix = missingYear.filter(m => yearFixes[m.id] !== undefined);
  console.log(chalk.gray(`${yearsToFix.length} of ${missingYear.length} have known release years\n`));

  for (const movie of yearsToFix) {
    const yearValue = yearFixes[movie.id];
    console.log(chalk.yellow(`[${totalProcessed + 1}] ${movie.title_en}`));
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

  // Publish Unpublished Movies
  console.log(chalk.cyan('═══════════════════════════════════════════'));
  console.log(chalk.cyan(`PUBLISHING MOVIES (${unpublished.length} movies)`));
  console.log(chalk.cyan('═══════════════════════════════════════════\n'));

  for (const movie of unpublished) {
    console.log(chalk.yellow(`[${totalProcessed + 1}] ${movie.title_en}`));

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

    // Rate limit
    if (!DRY_RUN && totalProcessed % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Fix Year Mismatches
  if (yearMismatches.length > 0) {
    console.log(chalk.cyan('═══════════════════════════════════════════'));
    console.log(chalk.cyan(`FIXING YEAR/DATE MISMATCHES (${yearMismatches.length} movies)`));
    console.log(chalk.cyan('═══════════════════════════════════════════\n'));

    for (const movie of yearMismatches) {
      const yearValue = yearFixes[movie.id];
      if (!yearValue) continue;

      console.log(chalk.yellow(`[${totalProcessed + 1}] ${movie.title_en}`));
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

  // Fix Slug Issues
  if (slugIssues.length > 0) {
    console.log(chalk.cyan('═══════════════════════════════════════════'));
    console.log(chalk.cyan(`FIXING SLUG FORMATS (${slugIssues.length} movies)`));
    console.log(chalk.cyan('═══════════════════════════════════════════\n'));

    for (const movie of slugIssues) {
      const fix = slugFixes[movie.id];
      if (!fix) continue;

      console.log(chalk.yellow(`[${totalProcessed + 1}] ${movie.title_en}`));
      console.log(chalk.gray(`  New Slug: ${fix.slug}`));

      if (!DRY_RUN) {
        const updateData: any = { slug: fix.slug };
        if (fix.year) {
          updateData.release_year = fix.year;
        }

        const { error } = await supabase
          .from('movies')
          .update(updateData)
          .eq('id', movie.id);

        if (error) {
          console.log(chalk.red(`  ✗ Failed: ${error.message}\n`));
          totalFailed++;
        } else {
          console.log(chalk.green(`  ✅ Updated\n`));
          totalSuccess++;
        }
      } else {
        console.log(chalk.cyan(`  ⊳ Would update slug to: ${fix.slug}\n`));
        totalSuccess++;
      }
      totalProcessed++;
    }
  }

  // Publish Suspicious Titles
  if (suspiciousTitles.length > 0) {
    console.log(chalk.cyan('═══════════════════════════════════════════'));
    console.log(chalk.cyan(`PUBLISHING SUSPICIOUS TITLES (${suspiciousTitles.length} movies)`));
    console.log(chalk.cyan('═══════════════════════════════════════════\n'));

    for (const movie of suspiciousTitles) {
      console.log(chalk.yellow(`[${totalProcessed + 1}] ${movie.title_en} (Valid creative title)`));

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

  // Summary
  console.log(chalk.blue('═'.repeat(60)));
  console.log(chalk.blue('SUMMARY'));
  console.log(chalk.blue('═'.repeat(60) + '\n'));

  console.log(chalk.cyan(`Total Processed:    ${totalProcessed}`));
  console.log(chalk.green(`Successful:         ${totalSuccess}`));
  console.log(chalk.red(`Failed:             ${totalFailed}\n`));

  console.log(chalk.yellow('📋 NOTES:\n'));
  console.log(chalk.gray(`• ${missingYear.length - yearsToFix.length} movies with missing years remain (TBA/unannounced)`));
  console.log(chalk.gray(`• Missing ratings for pre-release movies are expected (no action needed)`));
  console.log(chalk.gray(`• 3 movies need synopses added manually: Sahaa, Monster, Maha\n`));

  if (!DRY_RUN && totalSuccess > 0) {
    console.log(chalk.green('🎉 Movie audit fixes applied successfully!\n'));
    console.log(chalk.yellow('🔄 Changes are live - refresh your browser to see updates\n'));
  } else if (DRY_RUN) {
    console.log(chalk.blue('📝 DRY RUN completed\n'));
    console.log(chalk.blue('Run without --dry-run to apply changes:\n'));
    console.log(chalk.blue('  npx tsx scripts/apply-movie-audit-fixes.ts\n'));
  }

  console.log(chalk.blue('═'.repeat(60) + '\n'));
}

main().catch(console.error);
