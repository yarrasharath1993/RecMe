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
const BATCH_SIZE = 100; // Process in batches

interface ReadyMovie {
  id: string;
  title_en: string;
  release_year: number;
  hero: string;
  director: string;
  our_rating: number;
  poster_url: string;
}

async function main() {
  console.log(chalk.blue('\n🚀 MASS PUBLISH - READY MOVIES\n'));
  
  if (DRY_RUN) {
    console.log(chalk.cyan('📝 DRY RUN MODE - No changes will be made\n'));
  } else {
    console.log(chalk.yellow('⚠️  EXECUTE MODE - Publishing movies...\n'));
  }

  // Fetch all unpublished movies with complete data
  console.log(chalk.gray('Fetching ready-to-publish movies...\n'));

  let allReadyMovies: ReadyMovie[] = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year, hero, director, our_rating, poster_url')
      .eq('is_published', false)
      .not('hero', 'is', null)
      .not('director', 'is', null)
      .not('our_rating', 'is', null)
      .not('poster_url', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) {
      console.error(chalk.red(`Error fetching movies: ${error.message}`));
      process.exit(1);
    }
    
    if (!data || data.length === 0) break;
    allReadyMovies = [...allReadyMovies, ...data as ReadyMovie[]];
    console.log(chalk.gray(`  Fetched ${allReadyMovies.length} movies...`));
    
    page++;
    if (data.length < pageSize) break;
  }

  console.log(chalk.green(`\n✓ Found ${allReadyMovies.length} movies ready to publish!\n`));

  if (allReadyMovies.length === 0) {
    console.log(chalk.yellow('No movies to publish. All done!'));
    return;
  }

  // Group by decade for reporting
  const by2020s = allReadyMovies.filter(m => m.release_year >= 2020);
  const by2010s = allReadyMovies.filter(m => m.release_year >= 2010 && m.release_year < 2020);
  const by2000s = allReadyMovies.filter(m => m.release_year >= 2000 && m.release_year < 2010);
  const by1990s = allReadyMovies.filter(m => m.release_year >= 1990 && m.release_year < 2000);
  const byOlder = allReadyMovies.filter(m => m.release_year < 1990);

  console.log(chalk.cyan('📊 BREAKDOWN BY DECADE:\n'));
  console.log(chalk.yellow(`  2020s: ${by2020s.length} movies`));
  console.log(chalk.yellow(`  2010s: ${by2010s.length} movies`));
  console.log(chalk.yellow(`  2000s: ${by2000s.length} movies`));
  console.log(chalk.yellow(`  1990s: ${by1990s.length} movies`));
  console.log(chalk.yellow(`  Older: ${byOlder.length} movies\n`));

  if (DRY_RUN) {
    console.log(chalk.cyan('═══════════════════════════════════════════'));
    console.log(chalk.cyan('DRY RUN SUMMARY'));
    console.log(chalk.cyan('═══════════════════════════════════════════\n'));
    console.log(chalk.green(`Would publish ${allReadyMovies.length} movies\n`));
    
    // Show first 10 as examples
    console.log(chalk.cyan('First 10 examples:\n'));
    allReadyMovies.slice(0, 10).forEach((movie, i) => {
      console.log(chalk.gray(`${i + 1}. ${movie.title_en} (${movie.release_year}) - ${movie.hero}`));
    });
    
    console.log(chalk.blue('\n═══════════════════════════════════════════'));
    console.log(chalk.blue('\n📝 To actually publish, run:'));
    console.log(chalk.blue('   npx tsx scripts/mass-publish-ready.ts --execute\n'));
    return;
  }

  // Execute mode - publish in batches
  console.log(chalk.cyan('═══════════════════════════════════════════'));
  console.log(chalk.cyan('PUBLISHING MOVIES'));
  console.log(chalk.cyan('═══════════════════════════════════════════\n'));

  let successCount = 0;
  let errorCount = 0;
  const totalBatches = Math.ceil(allReadyMovies.length / BATCH_SIZE);

  for (let i = 0; i < allReadyMovies.length; i += BATCH_SIZE) {
    const batch = allReadyMovies.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const movieIds = batch.map(m => m.id);

    console.log(chalk.cyan(`\nBatch ${batchNumber}/${totalBatches}: Publishing ${batch.length} movies...`));

    const { error } = await supabase
      .from('movies')
      .update({ 
        is_published: true,
        updated_at: new Date().toISOString()
      })
      .in('id', movieIds);

    if (error) {
      console.error(chalk.red(`✗ Batch ${batchNumber} failed: ${error.message}`));
      errorCount += batch.length;
    } else {
      console.log(chalk.green(`✓ Batch ${batchNumber} published (${batch.length} movies)`));
      successCount += batch.length;
      
      // Show a few examples from this batch
      batch.slice(0, 3).forEach(movie => {
        console.log(chalk.gray(`  • ${movie.title_en} (${movie.release_year})`));
      });
    }
  }

  console.log(chalk.blue('\n═══════════════════════════════════════════'));
  console.log(chalk.blue('PUBLICATION COMPLETE'));
  console.log(chalk.blue('═══════════════════════════════════════════\n'));

  console.log(chalk.green(`✅ Successfully Published:  ${successCount}`));
  if (errorCount > 0) {
    console.log(chalk.red(`❌ Errors:                  ${errorCount}`));
  }
  console.log(chalk.cyan(`📊 Total Processed:         ${allReadyMovies.length}\n`));

  // Get updated counts
  const { count: newPublishedCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true);

  const { count: newUnpublishedCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', false);

  console.log(chalk.blue('═══════════════════════════════════════════'));
  console.log(chalk.blue('NEW DATABASE STATUS'));
  console.log(chalk.blue('═══════════════════════════════════════════\n'));
  
  console.log(chalk.green(`✅ Published:    ${newPublishedCount}`));
  console.log(chalk.yellow(`⚠️  Unpublished:  ${newUnpublishedCount}`));
  
  const completionRate = newPublishedCount ? ((newPublishedCount / (newPublishedCount + (newUnpublishedCount || 0))) * 100).toFixed(1) : 0;
  console.log(chalk.cyan(`📈 Completion:   ${completionRate}%\n`));

  if (newUnpublishedCount && newUnpublishedCount > 0) {
    console.log(chalk.yellow(`📝 ${newUnpublishedCount} movies still need work (missing data)\n`));
  } else {
    console.log(chalk.green('🎉 ALL MOVIES PUBLISHED! 100% COMPLETE!\n'));
  }

  console.log(chalk.blue('═══════════════════════════════════════════\n'));
  console.log(chalk.green('🚀 Ready to deploy to production!\n'));
}

main().catch(console.error);
