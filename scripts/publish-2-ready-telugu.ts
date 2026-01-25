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

// IDs of the 2 ready-to-publish movies
const READY_MOVIES = [
  {
    id: '9b7b604c-6907-4c79-bd7f-dd22d1a3f974',
    title: 'Devara: Part 2',
    year: 2026,
    hero: 'N. T. Rama Rao Jr.'
  },
  {
    id: '340635c8-f4a4-410e-aa3f-ed1ba3f314f3',
    title: 'Jayammu Nischayammu Raa',
    year: 2016,
    hero: 'Srinivasa Reddy'
  }
];

async function main() {
  console.log(chalk.blue('\n🚀 PUBLISHING 2 READY TELUGU MOVIES\n'));
  
  if (DRY_RUN) {
    console.log(chalk.cyan('📝 DRY RUN MODE - No changes will be made\n'));
  } else {
    console.log(chalk.yellow('⚠️  EXECUTE MODE - Publishing movies...\n'));
  }

  let successCount = 0;
  let errorCount = 0;

  for (const movieData of READY_MOVIES) {
    console.log(chalk.cyan(`\n${'='.repeat(60)}`));
    console.log(chalk.cyan(`${movieData.title} (${movieData.year})`));
    console.log(chalk.cyan(`${'='.repeat(60)}\n`));
    
    // Verify movie exists and has all data
    const { data: movie, error: fetchError } = await supabase
      .from('movies')
      .select('id, title_en, release_year, hero, director, our_rating, poster_url, is_published')
      .eq('id', movieData.id)
      .single();

    if (fetchError || !movie) {
      console.error(chalk.red(`✗ Error fetching movie: ${fetchError?.message || 'Not found'}`));
      errorCount++;
      continue;
    }

    console.log(chalk.gray(`Title:       ${movie.title_en}`));
    console.log(chalk.gray(`Year:        ${movie.release_year}`));
    console.log(chalk.gray(`Hero:        ${movie.hero}`));
    console.log(chalk.gray(`Director:    ${movie.director}`));
    console.log(chalk.gray(`Rating:      ${movie.our_rating}`));
    console.log(chalk.gray(`Poster:      ${movie.poster_url ? 'YES' : 'NO'}`));
    console.log(chalk.gray(`Published:   ${movie.is_published}\n`));

    // Check if already published
    if (movie.is_published) {
      console.log(chalk.yellow('⚠️  Already published! Skipping...\n'));
      successCount++;
      continue;
    }

    // Verify all required data is present
    if (!movie.hero || !movie.director || !movie.our_rating || !movie.poster_url) {
      console.error(chalk.red('✗ Missing required data! Cannot publish.\n'));
      const missing = [];
      if (!movie.hero) missing.push('Hero');
      if (!movie.director) missing.push('Director');
      if (!movie.our_rating) missing.push('Rating');
      if (!movie.poster_url) missing.push('Poster');
      console.error(chalk.red(`  Missing: ${missing.join(', ')}\n`));
      errorCount++;
      continue;
    }

    if (DRY_RUN) {
      console.log(chalk.cyan('📝 Would publish this movie\n'));
      successCount++;
    } else {
      // Publish the movie
      const { error: updateError } = await supabase
        .from('movies')
        .update({ 
          is_published: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', movieData.id);

      if (updateError) {
        console.error(chalk.red(`✗ Failed to publish: ${updateError.message}\n`));
        errorCount++;
      } else {
        console.log(chalk.green('✅ PUBLISHED SUCCESSFULLY!\n'));
        successCount++;
      }
    }
  }

  console.log(chalk.blue('='.repeat(60)));
  console.log(chalk.blue('SUMMARY'));
  console.log(chalk.blue('='.repeat(60) + '\n'));

  console.log(chalk.cyan(`Total Movies:      ${READY_MOVIES.length}`));
  console.log(chalk.green(`Success:           ${successCount}`));
  if (errorCount > 0) {
    console.log(chalk.red(`Errors:            ${errorCount}\n`));
  }

  if (!DRY_RUN) {
    // Get updated Telugu movies count
    const { count: publishedCount } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('language', 'Telugu')
      .eq('is_published', true);

    const { count: unpublishedCount } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('language', 'Telugu')
      .eq('is_published', false);

    console.log(chalk.blue('='.repeat(60)));
    console.log(chalk.blue('TELUGU MOVIES STATUS'));
    console.log(chalk.blue('='.repeat(60) + '\n'));
    
    console.log(chalk.green(`✅ Published:    ${publishedCount}`));
    console.log(chalk.yellow(`⚠️  Unpublished:  ${unpublishedCount}\n`));

    const completionRate = publishedCount && (publishedCount + (unpublishedCount || 0)) ? 
      ((publishedCount / (publishedCount + (unpublishedCount || 0))) * 100).toFixed(2) : 0;
    console.log(chalk.cyan(`📊 Completion:   ${completionRate}%\n`));

    if (successCount > 0) {
      console.log(chalk.green('🎉 MOVIES PUBLISHED SUCCESSFULLY!\n'));
      
      if (unpublishedCount && unpublishedCount > 0) {
        console.log(chalk.yellow('📝 Next steps:'));
        console.log(chalk.yellow(`   ${unpublishedCount} Telugu movies still need work\n`));
        console.log(chalk.yellow('   Run: npx tsx scripts/complete-salaar-part-2.ts --execute\n'));
      } else {
        console.log(chalk.green('🏆 ALL TELUGU MOVIES PUBLISHED! 100% COMPLETE!\n'));
      }
    }
  } else {
    console.log(chalk.blue('📝 DRY RUN completed - no changes made'));
    console.log(chalk.blue('   Run with --execute to actually publish\n'));
  }

  console.log(chalk.blue('='.repeat(60) + '\n'));
}

main().catch(console.error);
