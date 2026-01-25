#!/usr/bin/env npx tsx
/**
 * Delete Confirmed Bad Movies
 * 
 * Removes movies with completely wrong data from manual review
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const BAD_MOVIES = [
  { id: '4f1d41e1-1abd-49cc-be6b-06cb1301e013', title: 'Jack', reason: 'Jackie Brown (1997) data - wrong movie' },
  { id: '7fe26824-3387-450e-836c-9d787e256768', title: 'Devil', reason: 'Late Night with the Devil data - wrong movie' },
  { id: '7c4d5d48-47b7-427f-ada0-fb8b79ae2ddf', title: 'Swathimuthyam', reason: 'Production house listed as hero' },
  { id: '66a71777-30bc-41a8-85d7-c04d7245aaf7', title: 'Super Raja', reason: 'Self-referential data (all fields same)' },
  { id: 'b1a6907b-f9a9-4e3f-9783-3e436c248901', title: 'Most Eligible Bachelor', reason: 'Wrong director & music director' },
  { id: 'cacdae23-751b-4c9e-a0bd-4e0a110aeff5', title: 'Hello!', reason: 'Wrong cast (Pandavulu Pandavulu Tummeda data)' },
];

async function deleteBadMovies() {
  console.log('🗑️  Deleting Confirmed Bad Movies\n');
  console.log('='.repeat(80));
  
  // First, verify these movies exist
  console.log('\n📋 Verifying movies to delete:\n');
  
  const movieIds = BAD_MOVIES.map(m => m.id);
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, release_year')
    .in('id', movieIds);
  
  if (!movies || movies.length === 0) {
    console.log('   ❌ No movies found with these IDs!\n');
    return;
  }
  
  console.log(`   Found ${movies.length} out of ${BAD_MOVIES.length} movies:\n`);
  
  BAD_MOVIES.forEach(bad => {
    const found = movies.find(m => m.id === bad.id);
    if (found) {
      console.log(`   ✅ ${found.title_en || found.title} (${found.release_year})`);
      console.log(`      Reason: ${bad.reason}`);
    } else {
      console.log(`   ❌ NOT FOUND: ${bad.title}`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('\n⚠️  Proceeding with deletion...\n');
  
  // First, delete related career_milestones
  const { error: milestonesError } = await supabase
    .from('career_milestones')
    .delete()
    .in('movie_id', movieIds);
  
  if (milestonesError) {
    console.log(`   ⚠️  Career milestones deletion: ${milestonesError.message}`);
  } else {
    console.log('   ✅ Related career milestones deleted');
  }
  
  // Now delete the movies
  const { error } = await supabase
    .from('movies')
    .delete()
    .in('id', movieIds);
  
  if (error) {
    console.log(`   ❌ Error deleting movies: ${error.message}\n`);
    return;
  }
  
  // Verify deletion
  const { data: remaining } = await supabase
    .from('movies')
    .select('id')
    .in('id', movieIds);
  
  if (remaining && remaining.length > 0) {
    console.log(`   ⚠️  ${remaining.length} movies still exist (deletion may have failed)\n`);
  } else {
    console.log('   ✅ All bad movies successfully deleted!\n');
  }
  
  console.log('='.repeat(80));
  console.log('\n📊 Deletion Summary:\n');
  console.log(`   Movies deleted: ${movies.length}`);
  console.log(`   Remaining unpublished movies: ~${448 - movies.length}\n`);
  console.log('📋 What was deleted:\n');
  console.log('   1. Jack - Wrong movie (Jackie Brown)');
  console.log('   2. Devil - Wrong movie (Late Night with the Devil)');
  console.log('   3. Swathimuthyam - Production house as hero');
  console.log('   4. Super Raja - Self-referential data');
  console.log('   5. Most Eligible Bachelor - Wrong metadata');
  console.log('   6. Hello! - Wrong cast\n');
  console.log('='.repeat(80));
  console.log('\n✅ Database cleaned! Ready for next review batch.\n');
}

deleteBadMovies().catch(console.error);
