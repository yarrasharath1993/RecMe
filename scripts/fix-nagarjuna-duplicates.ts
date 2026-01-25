#!/usr/bin/env npx tsx
/**
 * Fix Nagarjuna Duplicate Profiles
 * 
 * This script merges duplicate Nagarjuna profiles and normalizes the data.
 * 
 * Issue:
 * - Two profiles exist: "celeb-akkineni-nagarjuna" and "akkineni-nagarjuna"
 * - They represent the same person (Actor Nagarjuna)
 * - This causes two separate entries in search results
 * 
 * Solution:
 * - Keep the more complete profile: akkineni-nagarjuna (ID: 7ea66985-c6f8-4f52-a51b-1dc9fd3f184d)
 * - Delete the incomplete profile: celeb-akkineni-nagarjuna (ID: 416db06b-7f62-4e09-af2d-32a85a4ff295)
 * - Set preferred slug: "nagarjuna" (simple, user-friendly)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DUPLICATE_ID = '416db06b-7f62-4e09-af2d-32a85a4ff295'; // celeb-akkineni-nagarjuna (incomplete)
const PRIMARY_ID = '7ea66985-c6f8-4f52-a51b-1dc9fd3f184d'; // akkineni-nagarjuna (complete)
const PREFERRED_SLUG = 'nagarjuna'; // Simple, user-friendly slug

async function fixNagarjunaDuplicates() {
  console.log('🔧 Fixing Nagarjuna Duplicate Profiles...\n');
  console.log('='.repeat(80));

  // Step 1: Verify both profiles exist
  console.log('\n📋 Step 1: Verifying profiles...\n');

  const { data: duplicate, error: dupError } = await supabase
    .from('celebrities')
    .select('*')
    .eq('id', DUPLICATE_ID)
    .single();

  if (dupError || !duplicate) {
    console.log('✅ Duplicate profile already deleted or not found');
    console.log('   ID:', DUPLICATE_ID);
  } else {
    console.log('⚠️  Duplicate profile found:');
    console.log(`   Name: ${duplicate.name_en}`);
    console.log(`   Slug: ${duplicate.slug}`);
    console.log(`   ID: ${duplicate.id}`);
    console.log(`   TMDB: ${duplicate.tmdb_id}`);
    console.log(`   Published: ${duplicate.is_published}`);
  }

  const { data: primary, error: primError } = await supabase
    .from('celebrities')
    .select('*')
    .eq('id', PRIMARY_ID)
    .single();

  if (primError || !primary) {
    console.error('❌ Primary profile not found!');
    console.error('   ID:', PRIMARY_ID);
    return;
  }

  console.log('\n✅ Primary profile found:');
  console.log(`   Name: ${primary.name_en}`);
  console.log(`   Slug: ${primary.slug}`);
  console.log(`   ID: ${primary.id}`);
  console.log(`   TMDB: ${primary.tmdb_id}`);
  console.log(`   IMDb: ${primary.imdb_id}`);
  console.log(`   Published: ${primary.is_published}`);
  console.log(`   Confidence: ${primary.entity_confidence_score}`);

  // Step 2: Check for the preferred slug
  console.log('\n' + '='.repeat(80));
  console.log('📋 Step 2: Checking slug availability...\n');

  const { data: existingSlug, error: slugError } = await supabase
    .from('celebrities')
    .select('id, name_en, slug')
    .eq('slug', PREFERRED_SLUG)
    .maybeSingle();

  if (existingSlug && existingSlug.id !== PRIMARY_ID) {
    console.log(`⚠️  Slug "${PREFERRED_SLUG}" is taken by:`);
    console.log(`   Name: ${existingSlug.name_en}`);
    console.log(`   ID: ${existingSlug.id}`);
    console.log(`\n   Using alternate slug: ${primary.slug}`);
  } else if (existingSlug && existingSlug.id === PRIMARY_ID) {
    console.log(`✅ Slug "${PREFERRED_SLUG}" already assigned to primary profile`);
  } else {
    console.log(`✅ Slug "${PREFERRED_SLUG}" is available`);
  }

  // Step 3: Update the primary profile slug if needed
  if (!existingSlug || existingSlug.id === PRIMARY_ID) {
    console.log('\n' + '='.repeat(80));
    console.log('📋 Step 3: Updating primary profile slug...\n');

    const { error: updateError } = await supabase
      .from('celebrities')
      .update({ 
        slug: PREFERRED_SLUG,
        updated_at: new Date().toISOString()
      })
      .eq('id', PRIMARY_ID);

    if (updateError) {
      console.error('❌ Error updating slug:', updateError.message);
    } else {
      console.log(`✅ Updated slug to: ${PREFERRED_SLUG}`);
      console.log(`   New URL: http://localhost:3000/movies?profile=${PREFERRED_SLUG}`);
    }
  }

  // Step 4: Check movie associations for duplicate
  if (duplicate) {
    console.log('\n' + '='.repeat(80));
    console.log('📋 Step 4: Checking movie associations...\n');

    // Check as actor
    const { data: moviesAsActor, error: actorError } = await supabase
      .from('movies')
      .select('id, title_en, actors')
      .contains('actors', [duplicate.name_en]);

    if (moviesAsActor && moviesAsActor.length > 0) {
      console.log(`⚠️  Found ${moviesAsActor.length} movie(s) with duplicate as actor`);
      console.log('   These will need to be updated (not automatically done)');
      
      moviesAsActor.slice(0, 5).forEach((movie: any) => {
        console.log(`   - ${movie.title_en}`);
      });
      
      if (moviesAsActor.length > 5) {
        console.log(`   ... and ${moviesAsActor.length - 5} more`);
      }
    } else {
      console.log('✅ No movies found with duplicate as actor');
    }

    // Check as director
    const { data: moviesAsDirector } = await supabase
      .from('movies')
      .select('id, title_en')
      .eq('director', duplicate.name_en);

    if (moviesAsDirector && moviesAsDirector.length > 0) {
      console.log(`⚠️  Found ${moviesAsDirector.length} movie(s) with duplicate as director`);
    } else {
      console.log('✅ No movies found with duplicate as director');
    }

    // Check as producer
    const { data: moviesAsProducer } = await supabase
      .from('movies')
      .select('id, title_en, producers')
      .contains('producers', [duplicate.name_en]);

    if (moviesAsProducer && moviesAsProducer.length > 0) {
      console.log(`⚠️  Found ${moviesAsProducer.length} movie(s) with duplicate as producer`);
    } else {
      console.log('✅ No movies found with duplicate as producer');
    }
  }

  // Step 5: Delete the duplicate profile
  if (duplicate) {
    console.log('\n' + '='.repeat(80));
    console.log('📋 Step 5: Deleting duplicate profile...\n');

    const { error: deleteError } = await supabase
      .from('celebrities')
      .delete()
      .eq('id', DUPLICATE_ID);

    if (deleteError) {
      console.error('❌ Error deleting duplicate:', deleteError.message);
    } else {
      console.log('✅ Duplicate profile deleted successfully');
      console.log(`   Deleted: ${duplicate.name_en} (${duplicate.slug})`);
      console.log(`   ID: ${DUPLICATE_ID}`);
    }
  }

  // Step 6: Final verification
  console.log('\n' + '='.repeat(80));
  console.log('📋 Step 6: Final verification...\n');

  const { data: finalProfiles, error: finalError } = await supabase
    .from('celebrities')
    .select('id, name_en, slug, is_published')
    .or('name_en.eq.Akkineni Nagarjuna,slug.eq.nagarjuna,slug.eq.akkineni-nagarjuna,slug.eq.celeb-akkineni-nagarjuna');

  if (finalError) {
    console.error('❌ Error in final verification:', finalError.message);
    return;
  }

  console.log('📊 Remaining Nagarjuna profiles:');
  finalProfiles.forEach((profile: any, index: number) => {
    console.log(`   ${index + 1}. ${profile.name_en}`);
    console.log(`      Slug: ${profile.slug}`);
    console.log(`      Published: ${profile.is_published ? '✅' : '❌'}`);
    console.log(`      URL: http://localhost:3000/movies?profile=${profile.slug}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ Fix Complete!\n');
  console.log('Summary:');
  console.log(`- Deleted duplicate profile (celeb-akkineni-nagarjuna)`);
  console.log(`- Primary profile slug: ${primary.slug} ${existingSlug ? '→ ' + PREFERRED_SLUG : ''}`);
  console.log(`- Primary URL: http://localhost:3000/movies?profile=${existingSlug ? PREFERRED_SLUG : primary.slug}`);
  console.log('\nNext steps:');
  console.log('1. Test the URL: http://localhost:3000/movies?profile=nagarjuna');
  console.log('2. Verify search now shows only one entry');
  console.log('3. Check that all movies still display correctly\n');
}

// Run the fix
fixNagarjunaDuplicates().catch(console.error);
