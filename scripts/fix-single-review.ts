/**
 * Fix a single movie's review type
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

async function fixMovieReview(slug: string, execute: boolean) {
  console.log(chalk.blue(`\nChecking movie: ${slug}\n`));

  // Get movie
  const { data: movie } = await supabase
    .from('movies')
    .select('id, title_en, slug')
    .eq('slug', slug)
    .single();

  if (!movie) {
    console.error(chalk.red('Movie not found'));
    return;
  }

  console.log(chalk.cyan(`Movie: ${movie.title_en}`));

  // Get reviews
  const { data: reviews } = await supabase
    .from('movie_reviews')
    .select('*')
    .eq('movie_id', movie.id)
    .eq('status', 'published');

  if (!reviews || reviews.length === 0) {
    console.log(chalk.red('No reviews found'));
    return;
  }

  console.log(chalk.gray(`Found ${reviews.length} review(s)\n`));

  for (const review of reviews) {
    console.log(chalk.white(`Review ID: ${review.id}`));
    
    if (!review.dimensions_json) {
      console.log(chalk.yellow('  No dimensions_json - skipping'));
      continue;
    }

    const dims = review.dimensions_json as any;
    console.log(`  Current _type: ${dims._type}`);

    if (dims._type === 'audited_review') {
      console.log(chalk.yellow('  Needs fixing!'));

      if (execute) {
        dims._type = 'editorial_review_v2';

        const { error } = await supabase
          .from('movie_reviews')
          .update({
            dimensions_json: dims,
            updated_at: new Date().toISOString(),
          })
          .eq('id', review.id);

        if (error) {
          console.log(chalk.red(`  ❌ Failed: ${error.message}`));
        } else {
          console.log(chalk.green('  ✅ Fixed!'));
        }
      } else {
        console.log(chalk.gray('  Would update to editorial_review_v2'));
      }
    } else if (dims._type === 'editorial_review_v2') {
      console.log(chalk.green('  ✅ Already correct'));
    } else {
      console.log(chalk.yellow(`  Unknown type: ${dims._type}`));
    }
  }
}

const slug = process.argv[2] || 'pellam-chatu-mogudu-1992';
const execute = process.argv.includes('--execute');

if (execute) {
  console.log(chalk.yellow('⚠️  EXECUTE MODE\n'));
} else {
  console.log(chalk.blue('ℹ️  DRY RUN\n'));
}

fixMovieReview(slug, execute).catch(console.error);
