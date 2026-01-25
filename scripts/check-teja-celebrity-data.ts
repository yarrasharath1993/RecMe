/**
 * Check Teja's celebrity data including images
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTejaCelebrity() {
  console.log('\n🔍 Checking Teja celebrity data...\n');

  // Check for Teja in celebrities
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('slug', 'celeb-teja')
    .single();

  if (!celebrity) {
    console.log('❌ No celebrity record found for celeb-teja');
    return;
  }

  console.log('✅ Celebrity record found:');
  console.log('  Name:', celebrity.name_en);
  console.log('  Slug:', celebrity.slug);
  console.log('  Primary Role:', celebrity.primary_role);
  console.log('  Birth Year:', celebrity.birth_year);
  console.log('\nImage URLs:');
  console.log('  image_url:', celebrity.image_url || 'NULL');
  console.log('  profile_image_url:', celebrity.profile_image_url || 'NULL');
  console.log('\nOther data:');
  console.log('  Bio:', celebrity.bio_en ? celebrity.bio_en.substring(0, 100) + '...' : 'NULL');
  console.log('  Birth Place:', celebrity.birth_place || 'NULL');
  console.log('  Awards:', celebrity.awards ? JSON.stringify(celebrity.awards).substring(0, 100) + '...' : 'NULL');
  
  // Check if there are other people named Teja
  console.log('\n\n🔍 Checking for other celebrities with "Teja" in name...\n');
  
  const { data: allTejas } = await supabase
    .from('celebrities')
    .select('name_en, slug, primary_role, image_url')
    .or('name_en.ilike.%teja%,slug.ilike.%teja%');

  if (allTejas && allTejas.length > 0) {
    allTejas.forEach((celeb, idx) => {
      console.log(`${idx + 1}. ${celeb.name_en}`);
      console.log(`   Slug: ${celeb.slug}`);
      console.log(`   Role: ${celeb.primary_role || 'N/A'}`);
      console.log(`   Image: ${celeb.image_url ? celeb.image_url.substring(0, 60) + '...' : 'NULL'}`);
      console.log();
    });
  }
}

checkTejaCelebrity().catch(console.error);
