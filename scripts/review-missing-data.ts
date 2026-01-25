#!/usr/bin/env npx tsx
/**
 * REVIEW MISSING DATA
 * 
 * Shows which movies need ratings and checks Q-title slug conflicts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALL_44_IDS = [
  'b994c347-d1e4-4edd-96f5-79f8baca9bea',
  'd20403fb-8432-4565-85c4-961d128206cb',
  '8ac900ab-636a-4b62-8ea9-449341cd3539',
  '8182275f-e88d-4453-b855-4bb1695ef80c',
  '5cd8b5da-c6cc-4acc-822a-361acc6e6803',
  '1f339783-8a95-40dc-a318-fdb69edc331e',
  '5e4052c0-9936-4bc9-9284-5adf79dcf4f4',
  'bb35eb63-49c4-42aa-a405-7ca08b8a813d',
  '6dcf4ef0-f5e9-4717-96dd-14513908ce02',
  '06fbeb2c-ab89-423c-9e63-6009e3e96688',
  '092508fb-f084-443b-aa50-3c6d06b6ec12',
  'ff32a1f8-e0a8-41fd-9fe9-5f9ffb94b6fa',
  '5205c2dc-2f36-48c9-9807-3153e897adbd',
  'fd10c7b5-1e25-4bcc-b82d-b4c6d1b48485',
  'e1124ed1-4aee-40ec-a97e-f5ecd5966a8d',
  '6d038721-fec0-4ba3-a90b-acbb26ef088e',
  '86e58157-d33f-48d1-a562-7413efddffd9',
  '32d1c1ea-abd5-44ae-980e-369ba2f6ab96',
  '95639c8c-fad3-4ef9-b2a3-0e1b06040346',
  '1d57f0ef-c4ed-4b34-b453-b608ce213ba3',
  '9fcf70da-160e-4635-af49-538749378675',
  '6212f700-84e3-4c84-bedc-570a48747a3d',
  '06506eed-73d6-43dd-af5e-66030ac47b65',
  '0a0d8345-02a7-4343-ada9-89ea66b5f912',
  '90c2fb7e-6c92-45a4-81c4-a6c18b32e742',
  'bbf3b8b2-ff2a-4ded-a6c3-86e9c9f17a7e',
  'd230d639-8927-40d7-9889-79f95e18d21f',
  '1a2d75cb-f7af-44c0-b7ad-eaf4b4bcfc31',
  '2d2300e8-75f4-40fa-9d89-11b728749949',
  'f0b669a6-227e-46c8-bdca-8778aef704d8',
  'b7aad561-d88c-44b1-bd47-7076d669d0b5',
  '1196ac9f-472a-446a-9f7b-41b8ad8bdb75',
  '2ced2102-12ab-4391-9e5b-40ae526c7b11',
  '5d98fdb3-4b6e-4037-a7ea-02794d6a00a4',
  '2142390d-8c14-4236-9aae-eb20edaa95cd',
  '3bbeed9a-30c4-458c-827a-11f4df9582c4',
  '4bf8c217-ffe2-489d-809d-50a499ac3cd1',
  '7f0b003c-b15f-4087-9003-0efc1d959658',
  '5d95bc5d-9490-4664-abc6-d2a9e29a05a8',
  '426e74fb-e35c-49c7-b5dd-ec88d9bd53c3',
  'aa6a8a7d-f47e-42a0-b938-3145ad479fb3',
  'f86df043-4436-46ee-a4b6-6889d3b29f2e',
  '8892bf0a-d4fb-45c9-8cd6-5ca00fbdd80a',
  'f6069bac-c8e0-43a6-9742-22cd0cb22ac1',
];

const Q_TITLE_IDS = [
  'bbf3b8b2-ff2a-4ded-a6c3-86e9c9f17a7e', // Q12985478 → Kothala Raayudu
  '1a2d75cb-f7af-44c0-b7ad-eaf4b4bcfc31', // Q16311395 → Karunamayudu
  'f0b669a6-227e-46c8-bdca-8778aef704d8', // Q12982331 → Bangaru Bommalu
];

async function reviewMissingData() {
  console.log(chalk.blue.bold('\n📋 REVIEW MISSING DATA\n'));
  
  // Fetch all 44 movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, slug, release_year, hero, director, poster_url, our_rating, is_published')
    .in('id', ALL_44_IDS)
    .order('release_year', { ascending: false });
  
  if (error || !movies) {
    console.log(chalk.red(`✗ Error: ${error?.message}`));
    return;
  }
  
  console.log(chalk.green(`✓ Found ${movies.length}/44 movies\n`));
  
  // Categorize movies
  const needRating: any[] = [];
  const needPoster: any[] = [];
  const needBoth: any[] = [];
  const ready: any[] = [];
  const published: any[] = [];
  
  for (const movie of movies) {
    if (movie.is_published) {
      published.push(movie);
    } else if (movie.poster_url && movie.our_rating) {
      ready.push(movie);
    } else if (!movie.poster_url && !movie.our_rating) {
      needBoth.push(movie);
    } else if (!movie.poster_url) {
      needPoster.push(movie);
    } else if (!movie.our_rating) {
      needRating.push(movie);
    }
  }
  
  // Print categories
  console.log(chalk.green.bold(`✅ PUBLISHED (${published.length} movies)\n`));
  for (const movie of published) {
    console.log(chalk.green(`  ✓ ${movie.title_en} (${movie.release_year})`));
    console.log(chalk.gray(`    Slug: ${movie.slug}`));
  }
  
  console.log(chalk.cyan.bold(`\n🎯 READY TO PUBLISH (${ready.length} movies)\n`));
  for (const movie of ready) {
    console.log(chalk.cyan(`  ⊳ ${movie.title_en} (${movie.release_year}) - ${movie.hero}`));
    console.log(chalk.gray(`    Poster: ✓ Rating: ${movie.our_rating}`));
  }
  
  console.log(chalk.yellow.bold(`\n⚠️  NEED RATING ONLY (${needRating.length} movies)\n`));
  for (const movie of needRating) {
    console.log(chalk.yellow(`  ⚠ ${movie.title_en} (${movie.release_year}) - ${movie.hero}`));
    console.log(chalk.gray(`    Has poster, missing rating`));
  }
  
  console.log(chalk.magenta.bold(`\n⚠️  NEED POSTER ONLY (${needPoster.length} movies)\n`));
  for (const movie of needPoster) {
    console.log(chalk.magenta(`  ⚠ ${movie.title_en} (${movie.release_year}) - ${movie.hero}`));
    console.log(chalk.gray(`    Has rating: ${movie.our_rating}`));
  }
  
  console.log(chalk.red.bold(`\n❌ NEED BOTH (${needBoth.length} movies)\n`));
  for (const movie of needBoth) {
    console.log(chalk.red(`  ✗ ${movie.title_en} (${movie.release_year}) - ${movie.hero}`));
  }
  
  // Check Q-titles
  console.log(chalk.blue.bold('\n🔍 Q-TITLE SLUG CONFLICTS\n'));
  
  const qTitles = movies.filter(m => Q_TITLE_IDS.includes(m.id));
  
  for (const movie of qTitles) {
    console.log(chalk.cyan(`\n${movie.title_en} (${movie.release_year})`));
    console.log(chalk.gray(`  Current slug: ${movie.slug}`));
    console.log(chalk.gray(`  Published: ${movie.is_published ? 'YES' : 'NO'}`));
    
    // Check if desired slug exists
    let desiredSlug = '';
    if (movie.id === 'bbf3b8b2-ff2a-4ded-a6c3-86e9c9f17a7e') {
      desiredSlug = 'kothala-raayudu-1979';
    } else if (movie.id === '1a2d75cb-f7af-44c0-b7ad-eaf4b4bcfc31') {
      desiredSlug = 'karunamayudu-1978';
    } else if (movie.id === 'f0b669a6-227e-46c8-bdca-8778aef704d8') {
      desiredSlug = 'bangaru-bommalu-1977';
    }
    
    const { data: conflict } = await supabase
      .from('movies')
      .select('id, title_en, slug, release_year, is_published')
      .eq('slug', desiredSlug)
      .single();
    
    if (conflict) {
      console.log(chalk.red(`  ✗ CONFLICT: Slug "${desiredSlug}" already exists`));
      console.log(chalk.red(`     Other movie: ${conflict.title_en} (${conflict.release_year})`));
      console.log(chalk.red(`     Other ID: ${conflict.id.substring(0, 8)}...`));
      console.log(chalk.red(`     Other published: ${conflict.is_published ? 'YES' : 'NO'}`));
      
      if (conflict.id === movie.id) {
        console.log(chalk.yellow(`     SAME MOVIE - no conflict`));
      } else {
        console.log(chalk.yellow(`     SOLUTION: Keep Q-title or merge duplicates`));
      }
    } else {
      console.log(chalk.green(`  ✓ No conflict - can rename to: ${desiredSlug}`));
    }
  }
  
  // Summary
  console.log(chalk.blue.bold('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('SUMMARY'));
  console.log(chalk.blue.bold('='.repeat(60) + '\n'));
  
  console.log(chalk.green(`Published:                 ${published.length}`));
  console.log(chalk.cyan(`Ready to Publish:          ${ready.length}`));
  console.log(chalk.yellow(`Need Rating Only:          ${needRating.length}`));
  console.log(chalk.magenta(`Need Poster Only:          ${needPoster.length}`));
  console.log(chalk.red(`Need Both:                 ${needBoth.length}`));
  console.log(chalk.white(`Total:                     ${movies.length}`));
  
  console.log(chalk.blue('\n' + '='.repeat(60) + '\n'));
  
  // Export lists
  if (needRating.length > 0) {
    console.log(chalk.yellow('\n📝 Movies needing ratings:'));
    console.log(needRating.map(m => `  - ${m.title_en} (${m.release_year})`).join('\n'));
  }
}

reviewMissingData()
  .then(() => {
    console.log(chalk.green('✓ Review completed'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('✗ Review failed:'), error);
    process.exit(1);
  });
