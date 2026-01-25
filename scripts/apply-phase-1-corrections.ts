import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// PHASE 1: HERO DATA CORRECTIONS
// ============================================================================
// Add hero names researched from IMDb/Wikipedia for the 25 movies
// Format: { id, title, year, hero, notes }
// ============================================================================

const phase1Corrections = [
  // ADD YOUR CORRECTIONS HERE!
  // Example:
  // { id: 'abc123...', title: 'Movie Name', year: 2005, hero: 'Actor Name', notes: 'Found on IMDb' },
  
  // === ADD YOUR RESEARCHED DATA BELOW ===
  
  
  // === END OF CORRECTIONS ===
];

async function applyPhase1Corrections() {
  console.log('\n' + '='.repeat(80));
  console.log('🚨 PHASE 1: APPLYING HERO DATA CORRECTIONS');
  console.log('='.repeat(80) + '\n');

  if (phase1Corrections.length === 0) {
    console.log('⚠️  No corrections found!');
    console.log('\nPlease add your corrections to this file in the format:');
    console.log('{ id: "uuid", title: "Movie Name", year: 2005, hero: "Actor Name", notes: "Source" }');
    console.log('\nThen run this script again!\n');
    return;
  }

  console.log(`📝 Found ${phase1Corrections.length} corrections to apply\n`);

  const results = {
    updated: [] as string[],
    published: [] as string[],
    errors: [] as {title: string, error: string}[],
  };

  for (const correction of phase1Corrections) {
    console.log(`\n📝 Processing: ${correction.title} (${correction.year})`);
    console.log(`   Hero: ${correction.hero}`);
    if (correction.notes) console.log(`   Notes: ${correction.notes}`);

    try {
      // Update hero field
      const { data: updateData, error: updateError } = await supabase
        .from('movies')
        .update({ hero: correction.hero })
        .eq('id', correction.id)
        .select();

      if (updateError) {
        console.log(`   ❌ Update Error: ${updateError.message}`);
        results.errors.push({ title: correction.title, error: updateError.message });
        continue;
      }

      if (!updateData || updateData.length === 0) {
        console.log(`   ❌ Movie not found`);
        results.errors.push({ title: correction.title, error: 'Not found' });
        continue;
      }

      console.log(`   ✅ Hero updated!`);
      results.updated.push(correction.title);

      // Check if movie now has hero + director + rating → publish
      const movie = updateData[0];
      if (movie.hero && movie.director && (movie.our_rating || movie.our_rating === 0)) {
        const { error: publishError } = await supabase
          .from('movies')
          .update({ is_published: true })
          .eq('id', correction.id);

        if (publishError) {
          console.log(`   ⚠️  Couldn't publish: ${publishError.message}`);
        } else {
          console.log(`   🎉 PUBLISHED! (has hero + director + rating)`);
          results.published.push(correction.title);
        }
      } else {
        const missing = [];
        if (!movie.director) missing.push('director');
        if (!movie.our_rating && movie.our_rating !== 0) missing.push('rating');
        if (missing.length > 0) {
          console.log(`   📝 Not published yet (still needs: ${missing.join(', ')})`);
        }
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      results.errors.push({ title: correction.title, error: String(error) });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 PHASE 1 RESULTS');
  console.log('='.repeat(80));
  console.log(`\n✅ Updated: ${results.updated.length}/${phase1Corrections.length}`);
  console.log(`🎉 Published: ${results.published.length}/${phase1Corrections.length}`);

  if (results.updated.length > 0) {
    console.log('\n✅ Successfully Updated:');
    results.updated.forEach(t => console.log(`   - ${t}`));
  }

  if (results.published.length > 0) {
    console.log('\n🎉 Published Movies:');
    results.published.forEach(t => console.log(`   - ${t}`));
  }

  if (results.errors.length > 0) {
    console.log(`\n❌ Errors: ${results.errors.length}`);
    results.errors.forEach(e => console.log(`   - ${e.title}: ${e.error}`));
  }

  // Get updated counts
  const { count: teluguPublished } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('language', 'Telugu');

  const { count: teluguUnpublished } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', false)
    .eq('language', 'Telugu');

  console.log('\n' + '='.repeat(80));
  console.log('📈 UPDATED DATABASE STATUS');
  console.log('='.repeat(80));
  console.log(`Telugu Published:    ${teluguPublished?.toLocaleString()}`);
  console.log(`Telugu Unpublished:  ${teluguUnpublished?.toLocaleString()}`);
  console.log(`Progress:            ${((teluguPublished! / (teluguPublished! + teluguUnpublished!)) * 100).toFixed(2)}%`);
  console.log('='.repeat(80));

  return results;
}

applyPhase1Corrections()
  .then((results) => {
    if (results) {
      console.log(`\n🎉 Phase 1 complete! ${results.published.length} movies published!\n`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
