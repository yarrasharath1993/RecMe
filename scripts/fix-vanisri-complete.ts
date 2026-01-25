/**
 * Complete fix for Vanisri.jpg issue
 * - Try multiple sources for correct posters
 * - If no source found, set to null to use placeholder system
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PROBLEMATIC_URL = 'https://upload.wikimedia.org/wikipedia/commons/d/de/Vanisri.jpg';

const MOVIES_TO_FIX = [
  {
    slug: 'astulu-anthastulu-1969',
    title: 'Astulu Anthastulu',
    year: 1969,
    action: 'set_null', // No poster available
  },
  {
    slug: 'pachhani-samsaram-1970',
    title: 'Pachhani Samsaram', 
    year: 1970,
    action: 'set_null',
  },
  {
    slug: 'marapurani-talli-1972',
    title: 'Marapurani Talli',
    year: 1972,
    action: 'set_null',
  },
  {
    slug: 'pellam-chatu-mogudu-1992',
    title: 'Pellam Chatu Mogudu',
    year: 1992,
    action: 'set_null',
  },
];

async function fixMovie(movie: typeof MOVIES_TO_FIX[0], execute: boolean) {
  console.log(chalk.cyan(`\n${movie.title} (${movie.year})`));
  console.log(chalk.gray(`  Slug: ${movie.slug}`));
  console.log(chalk.gray(`  URL: http://localhost:3000/movies/${movie.slug}`));

  // Get current data
  const { data: dbMovie } = await supabase
    .from('movies')
    .select('id, poster_url')
    .eq('slug', movie.slug)
    .single();

  if (!dbMovie) {
    console.log(chalk.red('  ❌ Movie not found in database'));
    return false;
  }

  console.log(chalk.gray(`  Current poster: ${dbMovie.poster_url}`));

  if (movie.action === 'set_null') {
    console.log(chalk.yellow('  → Setting to null (will use placeholder)'));

    if (execute) {
      const { error } = await supabase
        .from('movies')
        .update({
          poster_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dbMovie.id);

      if (error) {
        console.log(chalk.red(`  ❌ Failed: ${error.message}`));
        return false;
      }

      console.log(chalk.green('  ✅ Updated - will now use placeholder with cast images'));
      return true;
    } else {
      console.log(chalk.gray('  (Dry run - no changes made)'));
      return true;
    }
  }

  return false;
}

async function main() {
  const execute = process.argv.includes('--execute');

  console.log(chalk.blue.bold('\n🔧 Fixing Vanisri.jpg Image Issues\n'));

  if (execute) {
    console.log(chalk.yellow('⚠️  EXECUTE MODE - Will update database\n'));
  } else {
    console.log(chalk.blue('ℹ️  DRY RUN - No changes will be made\n'));
  }

  let fixed = 0;
  let failed = 0;

  for (const movie of MOVIES_TO_FIX) {
    const success = await fixMovie(movie, execute);
    if (success) {
      fixed++;
    } else {
      failed++;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(chalk.blue.bold('\n\n📊 Summary\n'));
  console.log(chalk.white(`Total movies: ${MOVIES_TO_FIX.length}`));
  
  if (execute) {
    console.log(chalk.green(`Fixed: ${fixed}`));
    console.log(chalk.red(`Failed: ${failed}`));
    
    console.log(chalk.blue('\n\n✅ Action Complete'));
    console.log(chalk.gray('These movies will now use placeholder images with cast photos'));
    console.log(chalk.gray('until better posters are found through enrichment.\n'));
  } else {
    console.log(chalk.yellow('\n💡 Run with --execute to apply these changes\n'));
  }
}

main().catch(console.error);
