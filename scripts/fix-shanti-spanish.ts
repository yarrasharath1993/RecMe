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
const SHANTI_ID = '500fcf82-76ca-4a65-99a9-89da8e605c60';

async function main() {
  console.log(chalk.blue('\n🔧 FIXING MISCLASSIFIED "SHANTI" (1952)\n'));
  
  if (DRY_RUN) {
    console.log(chalk.cyan('📝 DRY RUN MODE - No changes will be made\n'));
  } else {
    console.log(chalk.yellow('⚠️  EXECUTE MODE - Updating movie...\n'));
  }

  // Fetch movie details
  const { data: movie, error: fetchError } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, director, language, is_published')
    .eq('id', SHANTI_ID)
    .single();

  if (fetchError || !movie) {
    console.error(chalk.red(`✗ Error fetching movie: ${fetchError?.message || 'Not found'}`));
    process.exit(1);
  }

  console.log(chalk.cyan('Current Movie Status:\n'));
  console.log(chalk.gray(`Title:       ${movie.title_en}`));
  console.log(chalk.gray(`Year:        ${movie.release_year}`));
  console.log(chalk.gray(`Hero:        ${movie.hero}`));
  console.log(chalk.gray(`Director:    ${movie.director}`));
  console.log(chalk.gray(`Language:    ${movie.language}`));
  console.log(chalk.gray(`Published:   ${movie.is_published}\n`));

  console.log(chalk.yellow('Analysis:\n'));
  console.log(chalk.yellow(`  Hero "Jorge Mistral" is a Spanish actor`));
  console.log(chalk.yellow(`  Director "Arturo Ruiz Castillo" is Spanish`));
  console.log(chalk.yellow(`  Currently marked as: "${movie.language}"`));
  console.log(chalk.yellow(`  Should be: "Spanish"\n`));

  if (movie.language === 'Spanish') {
    console.log(chalk.green('✅ Language is already correct! Nothing to do.\n'));
    return;
  }

  if (DRY_RUN) {
    console.log(chalk.cyan('📝 Would change language from "Telugu" to "Spanish"\n'));
    console.log(chalk.cyan('📝 Would keep movie unpublished (correctly classified as non-Telugu)\n'));
  } else {
    console.log(chalk.cyan('📝 Changing language to Spanish...\n'));
    
    const { error: updateError } = await supabase
      .from('movies')
      .update({ 
        language: 'Spanish',
        updated_at: new Date().toISOString()
      })
      .eq('id', SHANTI_ID);

    if (updateError) {
      console.error(chalk.red(`✗ Failed to update language: ${updateError.message}\n`));
      process.exit(1);
    }
    
    console.log(chalk.green('✅ Language updated to Spanish!\n'));
    console.log(chalk.green('✅ Movie will remain unpublished (correctly classified)\n'));
  }

  if (!DRY_RUN) {
    // Get updated Telugu movies count
    const { count: teluguCount } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('language', 'Telugu');

    const { count: publishedTeluguCount } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('language', 'Telugu')
      .eq('is_published', true);

    const { count: spanishCount } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('language', 'Spanish');

    console.log(chalk.blue('='.repeat(60)));
    console.log(chalk.blue('DATABASE STATUS'));
    console.log(chalk.blue('='.repeat(60) + '\n'));
    
    console.log(chalk.cyan(`Telugu Movies:   ${teluguCount} (${publishedTeluguCount} published)`));
    console.log(chalk.cyan(`Spanish Movies:  ${spanishCount} (now includes Shanti)\n`));

    const completionRate = publishedTeluguCount && teluguCount ? 
      ((publishedTeluguCount / teluguCount) * 100).toFixed(2) : 0;
    console.log(chalk.green(`✅ Telugu Completion:   ${completionRate}%\n`));

    console.log(chalk.green('🎉 DATABASE CLEANED!\n'));
    console.log(chalk.green('   Shanti (1952) is now correctly classified as Spanish\n'));
    
    if (completionRate === '100.00') {
      console.log(chalk.green('🏆🏆🏆 CONGRATULATIONS! 🏆🏆🏆\n'));
      console.log(chalk.green('🎊 ALL TELUGU MOVIES (100%) ARE PUBLISHED!\n'));
      console.log(chalk.green(`   ${publishedTeluguCount}/${teluguCount} Telugu movies live!\n`));
      console.log(chalk.blue('🚀 Ready to deploy to production!\n'));
    }
  } else {
    console.log(chalk.blue('📝 DRY RUN completed - no changes made'));
    console.log(chalk.blue('   Run with --execute to actually update\n'));
  }

  console.log(chalk.blue('='.repeat(60) + '\n'));
}

main().catch(console.error);
