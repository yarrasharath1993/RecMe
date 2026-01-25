import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const tmdbApiKey = process.env.TMDB_API_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(chalk.red('Supabase credentials not set'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = parseInt(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '0') || 999;

interface Celebrity {
  id: string;
  name_en: string;
  slug: string;
  tmdb_id: number;
  profile_image: string | null;
  popularity_score: number;
}

async function fetchBestImageFromTMDB(tmdbId: number, name: string): Promise<string | null> {
  if (!tmdbApiKey) {
    return null;
  }

  try {
    // Get person images
    const imagesUrl = `https://api.themoviedb.org/3/person/${tmdbId}/images?api_key=${tmdbApiKey}`;
    const imagesResponse = await fetch(imagesUrl);
    const imagesData = await imagesResponse.json();

    if (imagesData.profiles && imagesData.profiles.length > 0) {
      // Sort by vote_average and take the best one
      const bestImage = imagesData.profiles.sort((a: any, b: any) => 
        (b.vote_average || 0) - (a.vote_average || 0)
      )[0];

      // Use original size for best quality
      return `https://image.tmdb.org/t/p/original${bestImage.file_path}`;
    }

    // Fallback: get person details for profile_path
    const detailsUrl = `https://api.themoviedb.org/3/person/${tmdbId}?api_key=${tmdbApiKey}`;
    const detailsResponse = await fetch(detailsUrl);
    const details = await detailsResponse.json();

    if (details.profile_path) {
      return `https://image.tmdb.org/t/p/original${details.profile_path}`;
    }

    return null;
  } catch (error: any) {
    console.error(chalk.red(`  TMDB Error for ${name}: ${error.message}`));
    return null;
  }
}

async function main() {
  console.log(chalk.blue('\n🎨 BATCH FIX CELEBRITY PROFILE IMAGES\n'));
  
  if (DRY_RUN) {
    console.log(chalk.cyan('📝 DRY RUN MODE - No changes will be made\n'));
  } else {
    console.log(chalk.yellow('⚠️  EXECUTE MODE - Updating images...\n'));
  }

  if (!tmdbApiKey) {
    console.error(chalk.red('❌ TMDB_API_KEY not set. Cannot fetch images.\n'));
    return;
  }

  console.log(chalk.cyan(`Processing limit: ${LIMIT === 999 ? 'ALL' : LIMIT} celebrities\n`));

  // Fetch celebrities needing fixes
  const { data: celebrities, error } = await supabase
    .from('celebrities')
    .select('id, name_en, slug, tmdb_id, profile_image, popularity_score')
    .eq('is_published', true)
    .not('tmdb_id', 'is', null)
    .or('profile_image.is.null,profile_image.like.%/w500/%')
    .order('popularity_score', { ascending: false, nullsFirst: false })
    .limit(LIMIT);

  if (error) {
    console.error(chalk.red(`Error fetching celebrities: ${error.message}`));
    return;
  }

  if (!celebrities || celebrities.length === 0) {
    console.log(chalk.green('✅ All celebrities already have high-quality images!\n'));
    return;
  }

  console.log(chalk.cyan(`Found ${celebrities.length} celebrities to fix\n`));

  let upgraded = 0;
  let added = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < celebrities.length; i++) {
    const celeb = celebrities[i] as Celebrity;
    const status = celeb.profile_image ? 'UPGRADE' : 'ADD';
    
    console.log(chalk.yellow(`[${i + 1}/${celebrities.length}] ${celeb.name_en} (${celeb.slug})`));
    console.log(chalk.gray(`  Status: ${status} | TMDB ID: ${celeb.tmdb_id} | Popularity: ${celeb.popularity_score || 0}`));

    // Fetch best image from TMDB
    const newImageUrl = await fetchBestImageFromTMDB(celeb.tmdb_id, celeb.name_en);

    if (!newImageUrl) {
      console.log(chalk.red(`  ✗ No image found on TMDB\n`));
      failed++;
      continue;
    }

    // Check if it's the same as current
    if (celeb.profile_image === newImageUrl) {
      console.log(chalk.gray(`  ⊳ Already has this image\n`));
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(chalk.cyan(`  ⊳ Would update to: ${newImageUrl.substring(0, 60)}...`));
      if (status === 'UPGRADE') upgraded++;
      else added++;
    } else {
      // Update database
      const { error: updateError } = await supabase
        .from('celebrities')
        .update({
          profile_image: newImageUrl,
          profile_image_source: 'tmdb_batch_upgrade',
          updated_at: new Date().toISOString()
        })
        .eq('id', celeb.id);

      if (updateError) {
        console.log(chalk.red(`  ✗ Failed: ${updateError.message}\n`));
        failed++;
      } else {
        console.log(chalk.green(`  ✅ Updated to HD image\n`));
        if (status === 'UPGRADE') upgraded++;
        else added++;
      }
    }

    // Rate limit: wait 250ms between requests
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  console.log(chalk.blue('═'.repeat(60)));
  console.log(chalk.blue('SUMMARY'));
  console.log(chalk.blue('═'.repeat(60) + '\n'));

  console.log(chalk.cyan(`Total Processed:    ${celebrities.length}`));
  console.log(chalk.green(`Upgraded to HD:     ${upgraded}`));
  console.log(chalk.green(`Added New Images:   ${added}`));
  console.log(chalk.gray(`Skipped (same):     ${skipped}`));
  console.log(chalk.red(`Failed:             ${failed}\n`));

  if (!DRY_RUN && (upgraded + added) > 0) {
    console.log(chalk.green('🎉 Celebrity images updated successfully!\n'));
    console.log(chalk.yellow('🔄 Changes are live - refresh your browser to see updates\n'));
  } else if (DRY_RUN) {
    console.log(chalk.blue('📝 DRY RUN completed\n'));
    console.log(chalk.blue('Run without --dry-run to apply changes:\n'));
    console.log(chalk.blue('  npx tsx scripts/batch-fix-celebrity-images.ts\n'));
    console.log(chalk.blue('Or limit to top N:\n'));
    console.log(chalk.blue('  npx tsx scripts/batch-fix-celebrity-images.ts --limit=20\n'));
  }

  console.log(chalk.blue('═'.repeat(60) + '\n'));
}

main().catch(console.error);
