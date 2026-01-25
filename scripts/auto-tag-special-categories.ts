import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { detectCategories, type SpecialCategory } from '../lib/movies/special-categories';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function autoTagSpecialCategories() {
  console.log('\n' + '='.repeat(80));
  console.log('🏷️  AUTO-TAGGING MOVIES WITH SPECIAL CATEGORIES');
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Fetch all published movies
    console.log('1️⃣  Fetching all published movies...\n');
    
    const { data: movies, error: fetchError } = await supabase
      .from('movies')
      .select('id, title_en, genres, our_rating, avg_rating, is_blockbuster, is_classic, is_underrated, tone, era')
      .eq('is_published', true);

    if (fetchError) {
      console.error('❌ Error fetching movies:', fetchError);
      return;
    }

    console.log(`   ✅ Found ${movies?.length || 0} published movies\n`);

    if (!movies || movies.length === 0) {
      console.log('   ⚠️  No movies found. Exiting.\n');
      return;
    }

    // Step 2: Detect categories for each movie
    console.log('2️⃣  Detecting categories for each movie...\n');
    
    const categoryCounts: Record<SpecialCategory, number> = {
      'stress-buster': 0,
      'popcorn': 0,
      'group-watch': 0,
      'watch-with-special-one': 0,
    };

    const updates: Array<{ id: string; categories: string[] }> = [];

    for (const movie of movies) {
      const detected = detectCategories(movie);
      
      if (detected.length > 0) {
        updates.push({
          id: movie.id,
          categories: detected,
        });

        detected.forEach(cat => {
          categoryCounts[cat]++;
        });
      }
    }

    console.log(`   ✅ Detected categories for ${updates.length} movies\n`);
    console.log('   📊 Category distribution:');
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      console.log(`      ${cat}: ${count} movies`);
    });
    console.log('');

    // Step 3: Update movies in batches
    console.log('3️⃣  Updating movies with detected categories...\n');
    
    const BATCH_SIZE = 50;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      
      for (const update of batch) {
        const { error: updateError } = await supabase
          .from('movies')
          .update({ special_categories: update.categories })
          .eq('id', update.id);

        if (updateError) {
          console.error(`   ❌ Error updating ${update.id}:`, updateError.message);
          errors++;
        } else {
          updated++;
        }
      }

      // Progress indicator
      if ((i + BATCH_SIZE) % 100 === 0 || i + BATCH_SIZE >= updates.length) {
        console.log(`   ⏳ Progress: ${Math.min(i + BATCH_SIZE, updates.length)}/${updates.length} movies processed...`);
      }
    }

    console.log('');
    console.log(`   ✅ Updated ${updated} movies`);
    if (errors > 0) {
      console.log(`   ⚠️  ${errors} errors occurred`);
    }
    console.log('');

    // Step 4: Verify updates
    console.log('4️⃣  Verifying updates...\n');
    
    const { data: verified, error: verifyError } = await supabase
      .from('movies')
      .select('id, title_en, special_categories')
      .not('special_categories', 'is', null)
      .limit(10);

    if (verifyError) {
      console.error('   ❌ Error verifying:', verifyError);
    } else {
      console.log(`   ✅ Verified: ${verified?.length || 0} movies with categories found`);
      if (verified && verified.length > 0) {
        console.log('   📝 Sample movies:');
        verified.slice(0, 5).forEach(m => {
          console.log(`      - ${m.title_en}: [${m.special_categories?.join(', ') || 'none'}]`);
        });
      }
      console.log('');
    }

    console.log('='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`\n✅ Auto-tagged ${updated} movies with special categories`);
    console.log('\n📈 Category breakdown:');
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} movies`);
    });
    console.log('\n💡 Next steps:');
    console.log('   1. Review the auto-tagged movies');
    console.log('   2. Import your CSV with import-special-categories-csv.ts for manual overrides');
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

autoTagSpecialCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
