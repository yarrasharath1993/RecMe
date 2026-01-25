import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CSVRow {
  title: string;
  year: string;
  categories: string;
}

function parseCSV(content: string): CSVRow[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Parse header
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const titleIdx = header.indexOf('title');
  const yearIdx = header.indexOf('year');
  const categoriesIdx = header.indexOf('categories');

  if (titleIdx === -1 || categoriesIdx === -1) {
    throw new Error('CSV must have "title" and "categories" columns');
  }

  // Parse rows
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length > 0 && values[titleIdx]) {
      rows.push({
        title: values[titleIdx] || '',
        year: yearIdx >= 0 ? (values[yearIdx] || '') : '',
        categories: values[categoriesIdx] || '',
      });
    }
  }

  return rows;
}

async function importSpecialCategoriesCSV(csvFilePath: string) {
  console.log('\n' + '='.repeat(80));
  console.log('📥 IMPORTING SPECIAL CATEGORIES FROM CSV');
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Read and parse CSV
    console.log(`1️⃣  Reading CSV file: ${csvFilePath}\n`);
    
    const csvContent = await fs.readFile(csvFilePath, 'utf-8');
    const records: CSVRow[] = parseCSV(csvContent);

    console.log(`   ✅ Parsed ${records.length} rows from CSV\n`);

    if (records.length === 0) {
      console.log('   ⚠️  No rows found in CSV. Exiting.\n');
      return;
    }

    // Step 2: Process each row
    console.log('2️⃣  Processing CSV rows...\n');
    
    let matched = 0;
    let notFound = 0;
    let updated = 0;
    let errors = 0;

    const validCategories = [
      'stress-buster',
      'popcorn',
      'group-watch',
      'watch-with-special-one',
    ];

    for (const row of records) {
      const title = row.title?.trim();
      const year = row.year ? parseInt(row.year) : null;
      const categories = row.categories
        ?.split(',')
        .map(c => c.trim().toLowerCase())
        .filter(c => validCategories.includes(c)) || [];

      if (!title) {
        console.log(`   ⚠️  Skipping row with no title: ${JSON.stringify(row)}`);
        continue;
      }

      if (categories.length === 0) {
        console.log(`   ⚠️  Skipping "${title}" - no valid categories found`);
        continue;
      }

      // Step 3: Find matching movie
      let query = supabase
        .from('movies')
        .select('id, title_en, release_year, special_categories')
        .ilike('title_en', title);

      if (year) {
        query = query.eq('release_year', year);
      }

      const { data: movies, error: searchError } = await query;

      if (searchError) {
        console.error(`   ❌ Error searching for "${title}":`, searchError);
        errors++;
        continue;
      }

      if (!movies || movies.length === 0) {
        console.log(`   ⚠️  Movie not found: "${title}" (${year || 'any year'})`);
        notFound++;
        continue;
      }

      if (movies.length > 1) {
        console.log(`   ⚠️  Multiple matches for "${title}" (${year || 'any year'}):`);
        movies.forEach(m => {
          console.log(`      - ${m.title_en} (${m.release_year})`);
        });
        console.log(`   → Using first match: ${movies[0].title_en}`);
      }

      const movie = movies[0];
      matched++;

      // Step 4: Merge categories (combine with existing)
      const existingCategories = (movie.special_categories || []) as string[];
      const mergedCategories = [...new Set([...existingCategories, ...categories])];

      // Step 5: Update movie
      const { error: updateError } = await supabase
        .from('movies')
        .update({ special_categories: mergedCategories })
        .eq('id', movie.id);

      if (updateError) {
        console.error(`   ❌ Error updating "${movie.title_en}":`, updateError);
        errors++;
      } else {
        updated++;
        console.log(`   ✅ Updated "${movie.title_en}" (${movie.release_year}): [${mergedCategories.join(', ')}]`);
      }
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`\n✅ Matched: ${matched} movies`);
    console.log(`⚠️  Not found: ${notFound} movies`);
    console.log(`✅ Updated: ${updated} movies`);
    if (errors > 0) {
      console.log(`❌ Errors: ${errors}`);
    }
    console.log('\n💡 Note: Categories were merged with existing auto-detected categories');
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error && error.message.includes('ENOENT')) {
      console.log('\n💡 Make sure the CSV file path is correct.');
      console.log('💡 Expected CSV format:');
      console.log('   title,year,categories');
      console.log('   Baahubali,2015,popcorn,group-watch');
      console.log('   Geetha Govindam,2018,stress-buster,watch-with-special-one');
    }
    process.exit(1);
  }
}

// Get CSV file path from command line argument
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error('❌ Please provide CSV file path as argument');
  console.log('\nUsage: npx tsx scripts/import-special-categories-csv.ts <path-to-csv>');
  console.log('\nExample:');
  console.log('  npx tsx scripts/import-special-categories-csv.ts special-categories.csv');
  console.log('\nCSV Format:');
  console.log('  title,year,categories');
  console.log('  Baahubali,2015,popcorn,group-watch');
  console.log('  Geetha Govindam,2018,stress-buster,watch-with-special-one');
  process.exit(1);
}

importSpecialCategoriesCSV(csvFilePath)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
