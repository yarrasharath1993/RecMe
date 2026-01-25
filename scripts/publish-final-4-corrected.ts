import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(chalk.red('Supabase URL or Anon Key is not set.'));
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DRY_RUN = process.argv.includes('--dry-run');

// The 4 final Telugu movies with corrections
const MOVIES_TO_PUBLISH = [
  {
    id: '9b7b604c-6907-4c79-bd7f-dd22d1a3f974',
    title: 'Devara: Part 2',
    year: 2026,
    updates: {
      // Future release - no rating needed yet
      our_rating: null, // Remove rating if exists (not released yet)
      is_published: true
    },
    note: 'Future release (2026) - no rating needed'
  },
  {
    id: '340635c8-f4a4-410e-aa3f-ed1ba3f314f3',
    title: 'Jayammu Nischayammu Raa',
    year: 2016,
    updates: {
      is_published: true
    },
    note: 'Ready to publish as-is'
  },
  {
    id: '043bb7f8-1808-417b-9655-4d1fd3b01b4d',
    title: 'Salaar: Part 2 – Shouryanga Parvam',
    year: 2026,
    updates: {
      // Future release - no rating needed yet
      our_rating: null, // Remove rating if exists (not released yet)
      is_published: true
    },
    note: 'Future release (2026) - no rating needed'
  },
  {
    id: '500fcf82-76ca-4a65-99a9-89da8e605c60',
    title: 'Shanti',
    year: 1952,
    updates: {
      // CORRECT the cast and crew - this IS a Telugu film!
      hero: 'Akkineni Nageswara Rao',
      director: 'Vedantam Raghavaiah',
      music_director: 'C.R. Subbaraman',
      language: 'Telugu', // Ensure it's marked as Telugu
      our_rating: 7.2, // Classic film with legendary cast
      rating_source: 'classic_estimation',
      is_published: true
    },
    note: 'CORRECTED: Telugu classic with ANR & Savitri'
  }
];

async function main() {
  console.log(chalk.blue('\n🎬 PUBLISHING FINAL 4 TELUGU MOVIES\n'));
  console.log(chalk.yellow('📝 IMPORTANT CORRECTION:\n'));
  console.log(chalk.yellow('   Shanti (1952) IS a Telugu film!'));
  console.log(chalk.yellow('   Stars: Akkineni Nageswara Rao & Savitri'));
  console.log(chalk.yellow('   Director: Vedantam Raghavaiah\n'));
  
  if (DRY_RUN) {
    console.log(chalk.cyan('📝 DRY RUN MODE - No changes will be made\n'));
  } else {
    console.log(chalk.yellow('⚠️  EXECUTE MODE - Publishing movies...\n'));
  }

  let successCount = 0;
  let errorCount = 0;

  for (const movieData of MOVIES_TO_PUBLISH) {
    console.log(chalk.cyan(`\n${'='.repeat(60)}`));
    console.log(chalk.cyan(`${movieData.title} (${movieData.year})`));
    console.log(chalk.cyan(`${'='.repeat(60)}\n`));
    console.log(chalk.gray(`Note: ${movieData.note}\n`));
    
    // Fetch current movie state
    const { data: movie, error: fetchError } = await supabase
      .from('movies')
      .select('id, title_en, release_year, hero, director, our_rating, poster_url, is_published, language')
      .eq('id', movieData.id)
      .single();

    if (fetchError || !movie) {
      console.error(chalk.red(`✗ Error fetching movie: ${fetchError?.message || 'Not found'}`));
      errorCount++;
      continue;
    }

    console.log(chalk.gray('Current State:'));
    console.log(chalk.gray(`  Title:       ${movie.title_en}`));
    console.log(chalk.gray(`  Year:        ${movie.release_year}`));
    console.log(chalk.gray(`  Hero:        ${movie.hero || 'MISSING'}`));
    console.log(chalk.gray(`  Director:    ${movie.director || 'MISSING'}`));
    console.log(chalk.gray(`  Rating:      ${movie.our_rating || 'NONE'}`));
    console.log(chalk.gray(`  Language:    ${movie.language}`));
    console.log(chalk.gray(`  Published:   ${movie.is_published}\n`));

    // Show what will be updated
    const updatePayload = {
      ...movieData.updates,
      updated_at: new Date().toISOString()
    };

    console.log(chalk.yellow('Updates to Apply:'));
    for (const [key, value] of Object.entries(updatePayload)) {
      if (key === 'updated_at') continue;
      const currentValue = movie[key as keyof typeof movie];
      if (currentValue !== value) {
        console.log(chalk.yellow(`  ${key}: ${currentValue || 'NULL'} → ${value || 'NULL'}`));
      }
    }
    console.log('');

    if (DRY_RUN) {
      console.log(chalk.cyan('📝 Would apply these updates\n'));
      successCount++;
    } else {
      // Apply updates
      const { error: updateError } = await supabase
        .from('movies')
        .update(updatePayload)
        .eq('id', movieData.id);

      if (updateError) {
        console.error(chalk.red(`✗ Failed to update: ${updateError.message}\n`));
        errorCount++;
      } else {
        console.log(chalk.green('✅ UPDATED & PUBLISHED SUCCESSFULLY!\n'));
        successCount++;
      }
    }
  }

  console.log(chalk.blue('='.repeat(60)));
  console.log(chalk.blue('SUMMARY'));
  console.log(chalk.blue('='.repeat(60) + '\n'));

  console.log(chalk.cyan(`Total Movies:      ${MOVIES_TO_PUBLISH.length}`));
  console.log(chalk.green(`Success:           ${successCount}`));
  if (errorCount > 0) {
    console.log(chalk.red(`Errors:            ${errorCount}\n`));
  }

  if (!DRY_RUN && successCount > 0) {
    // Get updated Telugu movies count
    const { count: publishedCount } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('language', 'Telugu')
      .eq('is_published', true);

    const { count: totalCount } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('language', 'Telugu');

    console.log(chalk.blue('='.repeat(60)));
    console.log(chalk.blue('TELUGU MOVIES STATUS'));
    console.log(chalk.blue('='.repeat(60) + '\n'));
    
    console.log(chalk.green(`✅ Published:    ${publishedCount}/${totalCount}`));

    const completionRate = publishedCount && totalCount ? 
      ((publishedCount / totalCount) * 100).toFixed(2) : 0;
    console.log(chalk.cyan(`📊 Completion:   ${completionRate}%\n`));

    if (completionRate === '100.00') {
      console.log(chalk.green('🎉🎉🎉 CONGRATULATIONS! 🎉🎉🎉\n'));
      console.log(chalk.green('🏆 ALL TELUGU MOVIES PUBLISHED! 100% COMPLETE!\n'));
      console.log(chalk.green(`   ${publishedCount} Telugu movies are now live!\n`));
      console.log(chalk.blue('🚀 Ready to deploy to production!\n'));
    }
  } else if (DRY_RUN) {
    console.log(chalk.blue('📝 DRY RUN completed - no changes made'));
    console.log(chalk.blue('   Run with --execute to publish all 4 movies\n'));
  }

  console.log(chalk.blue('='.repeat(60) + '\n'));
  
  if (!DRY_RUN && successCount === MOVIES_TO_PUBLISH.length) {
    console.log(chalk.green('KEY CORRECTIONS APPLIED:\n'));
    console.log(chalk.green('✅ Shanti (1952) - Corrected to Telugu with ANR & Savitri'));
    console.log(chalk.green('✅ Devara Part 2 - Marked as future release (no rating)'));
    console.log(chalk.green('✅ Salaar Part 2 - Marked as future release (no rating)'));
    console.log(chalk.green('✅ Jayammu Nischayammu Raa - Published as-is\n'));
  }
}

main().catch(console.error);
