/**
 * Fix Teja's TMDB ID to the correct director Teja
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixTejaTMDBID() {
  console.log('\n🔧 Fixing Teja TMDB ID...\n');

  // Check current state
  const { data: before } = await supabase
    .from('celebrities')
    .select('*')
    .eq('slug', 'celeb-teja')
    .single();

  console.log('BEFORE:');
  console.log('  Name:', before?.name_en);
  console.log('  TMDB ID:', before?.tmdb_id, '← WRONG! (Jessie Tejada)');
  console.log('  Profile Image:', before?.profile_image || 'NULL');

  // Update to correct TMDB ID
  const correctTMDBID = 441339; // Director Teja

  const { error } = await supabase
    .from('celebrities')
    .update({
      tmdb_id: correctTMDBID,
      profile_image: null, // Clear the wrong image
    })
    .eq('slug', 'celeb-teja');

  if (error) {
    console.error('\n❌ Error updating:', error);
    return;
  }

  // Verify the fix
  const { data: after } = await supabase
    .from('celebrities')
    .select('*')
    .eq('slug', 'celeb-teja')
    .single();

  console.log('\nAFTER:');
  console.log('  Name:', after?.name_en);
  console.log('  TMDB ID:', after?.tmdb_id, '← CORRECT! (Director Teja)');
  console.log('  Profile Image:', after?.profile_image || 'NULL');

  console.log('\n✅ Fixed! Teja now has the correct TMDB ID');
  console.log('   TMDB Profile: https://www.themoviedb.org/person/' + correctTMDBID);
  console.log('\nNote: Director Teja has no profile image on TMDB, so image_url is NULL');
  console.log('      You may need to manually add a good quality image later.');
}

fixTejaTMDBID().catch(console.error);
