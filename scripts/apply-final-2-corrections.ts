import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import slugify from 'slugify';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(chalk.red('Supabase credentials not set.'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface MovieCorrection {
  id: string;
  title: string;
  year: number;
  rating: number;
  posterUrl: string;
  notes: string;
}

const corrections: MovieCorrection[] = [
  {
    id: '5cd8b5da-c6cc-4acc-822a-361acc6e6803',
    title: 'Kalabha Mazha',
    year: 2011,
    rating: 5.2,
    posterUrl: 'https://images.moviebuff.com/29ae38db-c28d-454c-a55f-c97f6e826e01',
    notes: 'Malayalam film directed by K. Suku'
  },
  {
    id: '5205c2dc-2f36-48c9-9807-3153e897adbd',
    title: 'Gundagardi',
    year: 1997,
    rating: 6.7,
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BMTc5MjEzNjgyMV5BMl5BanBnXkFtZTgwNjg2MzI1MzE@._V1_.jpg',
    notes: 'Hindi action film, title corrected from "Gunda Gardi" to "Gundagardi"'
  }
];

const DRY_RUN = !process.argv.includes('--execute');

async function main() {
  console.log(chalk.blue('\n📝 APPLYING FINAL 2 MOVIE CORRECTIONS\n'));
  
  if (DRY_RUN) {
    console.log(chalk.yellow('🔍 DRY RUN MODE - No changes will be made'));
    console.log(chalk.yellow('   Run with --execute to apply changes\n'));
  }

  let successCount = 0;
  let errorCount = 0;

  for (const correction of corrections) {
    console.log(chalk.cyan(`${correction.title} (${correction.year})`));
    console.log(chalk.gray(`  ID: ${correction.id}`));
    console.log(chalk.gray(`  Note: ${correction.notes}`));

    // Fetch existing movie
    const { data: existing, error: fetchError } = await supabase
      .from('movies')
      .select('id, title_en, slug, our_rating, poster_url, release_year')
      .eq('id', correction.id)
      .single();

    if (fetchError || !existing) {
      console.log(chalk.red(`  ✗ Movie not found: ${fetchError?.message || 'Not found'}\n`));
      errorCount++;
      continue;
    }

    console.log(chalk.yellow(`  Current title: ${existing.title_en}`));
    console.log(chalk.yellow(`  Current rating: ${existing.our_rating || 'NULL'}`));
    console.log(chalk.yellow(`  Current poster: ${existing.poster_url ? 'YES' : 'NO'}`));

    let updatePayload: any = {};
    let changes: string[] = [];

    // Check title change
    if (existing.title_en !== correction.title) {
      const newSlug = slugify(correction.title, { lower: true, strict: true }) + `-${correction.year}`;
      
      // Check for slug conflicts
      const { data: conflictCheck } = await supabase
        .from('movies')
        .select('id, title_en')
        .eq('slug', newSlug)
        .neq('id', correction.id)
        .maybeSingle();

      if (conflictCheck) {
        console.log(chalk.red(`  ✗ Slug conflict: "${newSlug}" already exists (${conflictCheck.title_en})`));
        console.log(chalk.red(`    Skipping title update\n`));
        errorCount++;
        continue;
      }

      updatePayload.title_en = correction.title;
      updatePayload.slug = newSlug;
      changes.push(`Title: ${existing.title_en} → ${correction.title}`);
      changes.push(`Slug: ${existing.slug} → ${newSlug}`);
    }

    // Check rating change
    if (existing.our_rating !== correction.rating) {
      updatePayload.our_rating = correction.rating;
      changes.push(`Rating: ${existing.our_rating || 'NULL'} → ${correction.rating}`);
    }

    // Check poster change
    if (!existing.poster_url || existing.poster_url !== correction.posterUrl) {
      updatePayload.poster_url = correction.posterUrl;
      changes.push(`Poster: ${existing.poster_url ? 'Updated' : 'Added'}`);
    }

    if (changes.length === 0) {
      console.log(chalk.gray(`  ⊳ No changes needed\n`));
      successCount++;
      continue;
    }

    // Display changes
    changes.forEach(change => console.log(chalk.green(`  → ${change}`)));

    if (DRY_RUN) {
      console.log(chalk.cyan(`  ⊳ DRY RUN - Would update\n`));
      successCount++;
    } else {
      updatePayload.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('movies')
        .update(updatePayload)
        .eq('id', correction.id);

      if (updateError) {
        console.log(chalk.red(`  ✗ Update failed: ${updateError.message}\n`));
        errorCount++;
      } else {
        console.log(chalk.green(`  ✓ Updated successfully\n`));
        successCount++;
      }
    }
  }

  console.log(chalk.blue('============================================================'));
  console.log(chalk.blue('SUMMARY'));
  console.log(chalk.blue('============================================================\n'));
  console.log(chalk.cyan(`Total Movies:      ${corrections.length}`));
  console.log(chalk.green(`Success:           ${successCount}`));
  console.log(chalk.red(`Errors:            ${errorCount}\n`));

  if (DRY_RUN) {
    console.log(chalk.yellow('📝 DRY RUN completed - no changes made'));
    console.log(chalk.yellow('   Run with --execute to apply changes\n'));
  } else {
    if (successCount === corrections.length) {
      console.log(chalk.green('🎉 ALL CORRECTIONS APPLIED!\n'));
      console.log(chalk.yellow('📤 Next: Publish these movies'));
      console.log(chalk.yellow('   npx tsx scripts/publish-44-validated-movies.ts --execute\n'));
    } else {
      console.log(chalk.yellow('⚠️  Some corrections succeeded, check errors above\n'));
    }
  }

  console.log(chalk.blue('============================================================\n'));
}

main().catch(console.error);
