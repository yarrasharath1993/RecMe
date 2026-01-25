/**
 * Fix Audited Review Types
 * 
 * Issue: Movies with _type: "audited_review" don't show rating cards
 * Solution: Either update _type to "editorial_review_v2" or update page component
 * 
 * This script finds all reviews with "audited_review" type and updates them
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

async function findAuditedReviews() {
  console.log(chalk.blue.bold('\n🔍 Finding reviews with "audited_review" type\n'));

  // Get all published reviews
  const { data: reviews, error } = await supabase
    .from('movie_reviews')
    .select(`
      id,
      movie_id,
      dimensions_json,
      status,
      overall_rating,
      movies (
        slug,
        title_en,
        release_year
      )
    `)
    .eq('status', 'published')
    .not('dimensions_json', 'is', null);

  if (error) {
    console.error(chalk.red('Error:'), error.message);
    return;
  }

  // Filter for audited_review type
  const auditedReviews = reviews.filter(r => {
    const dims = r.dimensions_json as any;
    return dims?._type === 'audited_review';
  });

  console.log(chalk.yellow(`Found ${auditedReviews.length} reviews with "audited_review" type\n`));

  return auditedReviews;
}

async function fixReview(review: any, execute: boolean) {
  const movie = review.movies as any;
  
  console.log(chalk.cyan(`${movie.title_en} (${movie.release_year})`));
  console.log(chalk.gray(`  Slug: ${movie.slug}`));
  console.log(chalk.gray(`  Review ID: ${review.id}`));
  console.log(chalk.gray(`  Rating: ${review.overall_rating}`));
  console.log(chalk.gray(`  URL: http://localhost:3000/movies/${movie.slug}`));

  if (execute) {
    // Update the _type field
    const dimensions = review.dimensions_json as any;
    dimensions._type = 'editorial_review_v2';

    const { error } = await supabase
      .from('movie_reviews')
      .update({
        dimensions_json: dimensions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', review.id);

    if (error) {
      console.log(chalk.red(`  ❌ Failed: ${error.message}`));
      return false;
    }

    console.log(chalk.green('  ✅ Updated _type to "editorial_review_v2"'));
    return true;
  } else {
    console.log(chalk.gray('  → Would update _type to "editorial_review_v2"'));
    return true;
  }
}

async function main() {
  const execute = process.argv.includes('--execute');

  if (execute) {
    console.log(chalk.yellow('⚠️  EXECUTE MODE - Will update database\n'));
  } else {
    console.log(chalk.blue('ℹ️  DRY RUN - No changes will be made\n'));
  }

  const auditedReviews = await findAuditedReviews();

  if (!auditedReviews || auditedReviews.length === 0) {
    console.log(chalk.green('✅ No reviews need fixing'));
    return;
  }

  console.log(chalk.blue.bold('\nReviews to fix:\n'));

  let fixed = 0;
  let failed = 0;

  for (const review of auditedReviews) {
    const success = await fixReview(review, execute);
    if (success) {
      fixed++;
    } else {
      failed++;
    }
    console.log(); // Empty line between reviews
  }

  console.log(chalk.blue.bold('\n📊 Summary\n'));
  console.log(chalk.white(`Total reviews: ${auditedReviews.length}`));
  
  if (execute) {
    console.log(chalk.green(`Fixed: ${fixed}`));
    console.log(chalk.red(`Failed: ${failed}`));
    
    console.log(chalk.blue('\n\n✅ Action Complete'));
    console.log(chalk.gray('These movies will now show rating cards with editorial scores.\n'));
  } else {
    console.log(chalk.yellow('\n💡 Run with --execute to apply these changes\n'));
  }
}

main().catch(console.error);
