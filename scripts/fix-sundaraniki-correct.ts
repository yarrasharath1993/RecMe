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

const MOVIE_ID = '06fbeb2c-ab89-423c-9e63-6009e3e96688';

// Verified correct data
const CORRECTIONS = {
  title_en: 'Sundaraniki Thondarekkuva',
  hero: 'Baladitya',
  music_director: 'Nagaraj',
  our_rating: 5.5,
  // SunNXT poster - trying to construct URL
  // Will need manual poster URL from SunNXT
};

async function main() {
  console.log(chalk.blue('\n🎯 APPLYING VERIFIED CORRECTIONS - FINAL MOVIE!\n'));

  // Fetch current movie
  const { data: movie, error: fetchError } = await supabase
    .from('movies')
    .select('*')
    .eq('id', MOVIE_ID)
    .single();

  if (fetchError || !movie) {
    console.log(chalk.red('✗ Movie not found'));
    return;
  }

  console.log(chalk.yellow('Current Data (INCORRECT):'));
  console.log(chalk.gray(`  Title: ${movie.title_en}`));
  console.log(chalk.gray(`  Hero: ${movie.hero} ❌ (Wrong!)`));
  console.log(chalk.gray(`  Music Director: ${movie.music_director || 'NULL'}`));
  console.log(chalk.gray(`  Rating: ${movie.our_rating || 'NULL'}\n`));

  console.log(chalk.green('Verified Corrections:'));
  console.log(chalk.green(`  Title: ${CORRECTIONS.title_en} ✓`));
  console.log(chalk.green(`  Hero: ${CORRECTIONS.hero} ✓ (CORRECT!)`));
  console.log(chalk.green(`  Music Director: ${CORRECTIONS.music_director} ✓`));
  console.log(chalk.green(`  Rating: ${CORRECTIONS.our_rating} ✓\n`));

  const newSlug = slugify(CORRECTIONS.title_en, { lower: true, strict: true }) + '-2006';

  const updatePayload = {
    title_en: CORRECTIONS.title_en,
    slug: newSlug,
    hero: CORRECTIONS.hero,
    music_director: CORRECTIONS.music_director,
    our_rating: CORRECTIONS.our_rating,
    updated_at: new Date().toISOString()
  };

  const { error: updateError } = await supabase
    .from('movies')
    .update(updatePayload)
    .eq('id', MOVIE_ID);

  if (updateError) {
    console.log(chalk.red(`✗ Update failed: ${updateError.message}`));
    return;
  }

  console.log(chalk.green('✅ ALL CORRECTIONS APPLIED!\n'));
  console.log(chalk.yellow('Changes Made:'));
  console.log(chalk.yellow(`  → Title: "Sundaraniki Tondarekkuva" → "Sundaraniki Thondarekkuva"`));
  console.log(chalk.yellow(`  → Slug: ${movie.slug} → ${newSlug}`));
  console.log(chalk.yellow(`  → Hero: "Allari Naresh" → "Baladitya" ✓`));
  console.log(chalk.yellow(`  → Music Director: NULL → "Nagaraj" ✓`));
  console.log(chalk.yellow(`  → Rating: 5.2 → 5.5 ✓\n`));

  console.log(chalk.cyan('📝 Still Needs:'));
  console.log(chalk.cyan('  → Poster URL from SunNXT\n'));

  console.log(chalk.blue('============================================================'));
  console.log(chalk.blue('VERIFICATION NOTES'));
  console.log(chalk.blue('============================================================\n'));
  console.log(chalk.yellow('✓ Lead Actor: Baladitya (Bala Adithya)'));
  console.log(chalk.yellow('✓ Lead Actress: Suhasini Maniratnam'));
  console.log(chalk.yellow('✓ Music: Nagaraj'));
  console.log(chalk.yellow('✓ Director: Phani Prakash'));
  console.log(chalk.yellow('✓ Streaming: SunNXT Official Site\n'));
  console.log(chalk.red('⚠️  Note: Do NOT confuse with "Ante Sundaraniki" (2022) starring Nani\n'));
  console.log(chalk.blue('============================================================\n'));

  console.log(chalk.cyan('📤 Next Steps:'));
  console.log(chalk.cyan('  1. Get poster URL from SunNXT'));
  console.log(chalk.cyan('  2. Apply poster URL'));
  console.log(chalk.cyan('  3. Publish movie → 100%!\n'));
}

main().catch(console.error);
