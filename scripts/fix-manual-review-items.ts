#!/usr/bin/env npx tsx
/**
 * Fix manual review items:
 * 1. Add lead cast to Siddhalingeshwara Mahima (1981)
 * 2. Remove 1st IIFA Utsavam (award ceremony, not a movie)
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

async function fixManualReviewItems() {
  console.log(chalk.bold('\n🔧 FIXING MANUAL REVIEW ITEMS\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');

  // 1. Fix Siddhalingeshwara Mahima - Add lead cast
  console.log(chalk.yellow('1. Fixing Siddhalingeshwara Mahima (1981)...'));
  const { data: siddhalingeshwara, error: fetchError1 } = await supabase
    .from('movies')
    .select('id, slug, title_en, hero, heroine')
    .eq('slug', 'siddhalingeshwara-mahima-1981')
    .single();

  if (fetchError1 || !siddhalingeshwara) {
    console.log(chalk.red(`   ❌ Not found: siddhalingeshwara-mahima-1981`));
  } else {
    const { error: updateError1 } = await supabase
      .from('movies')
      .update({
        hero: 'Lokesh',
        heroine: 'Jayanthi',
        director: 'Hunsur Krishnamurthy',
        music_director: 'Krishna Chakra',
        producer: 'Lingam Shanmugam & Muddula Krishna Rao',
      })
      .eq('id', siddhalingeshwara.id);

    if (updateError1) {
      console.log(chalk.red(`   ❌ Error: ${updateError1.message}`));
    } else {
      console.log(chalk.green(`   ✅ Updated:`));
      console.log(`      Hero: Lokesh`);
      console.log(`      Heroine: Jayanthi`);
      console.log(`      Director: Hunsur Krishnamurthy`);
      console.log(`      Music Director: Krishna Chakra`);
      console.log(`      Producer: Lingam Shanmugam & Muddula Krishna Rao`);
    }
  }

  console.log();

  // 2. Remove 1st IIFA Utsavam - Award ceremony, not a movie
  console.log(chalk.yellow('2. Removing 1st IIFA Utsavam (award ceremony)...'));
  const { data: iifa, error: fetchError2 } = await supabase
    .from('movies')
    .select('id, slug, title_en')
    .eq('slug', '1st-iifa-utsavam-2015')
    .single();

  if (fetchError2 || !iifa) {
    console.log(chalk.red(`   ❌ Not found: 1st-iifa-utsavam-2015`));
  } else {
    // Check if there are any related records (reviews, ratings, etc.) before deleting
    const { count: reviewsCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('movie_id', iifa.id);

    const { count: ratingsCount } = await supabase
      .from('ratings')
      .select('*', { count: 'exact', head: true })
      .eq('movie_id', iifa.id);

    if (reviewsCount && reviewsCount > 0) {
      console.log(chalk.yellow(`   ⚠️  Warning: ${reviewsCount} review(s) found. Consider handling reviews first.`));
    }

    if (ratingsCount && ratingsCount > 0) {
      console.log(chalk.yellow(`   ⚠️  Warning: ${ratingsCount} rating(s) found. Consider handling ratings first.`));
    }

    // Delete the movie
    const { error: deleteError } = await supabase
      .from('movies')
      .delete()
      .eq('id', iifa.id);

    if (deleteError) {
      console.log(chalk.red(`   ❌ Error deleting: ${deleteError.message}`));
    } else {
      console.log(chalk.green(`   ✅ Removed: ${iifa.title_en} (${iifa.slug})`));
      console.log(`      Reason: Award ceremony, not a feature film`);
    }
  }

  console.log();
  console.log(chalk.bold('═'.repeat(70)));
  console.log(chalk.bold('✅ MANUAL REVIEW ITEMS PROCESSED\n'));
}

fixManualReviewItems().catch(console.error);
