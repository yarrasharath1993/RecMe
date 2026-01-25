#!/usr/bin/env npx tsx
/**
 * Check Nagarjuna Data Loss
 * 
 * This script checks what data might have been lost from the deleted
 * nagarjuna-akkineni profile and compares with the current profile.
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

const CURRENT_ID = '7ea66985-c6f8-4f52-a51b-1dc9fd3f184d'; // Current nagarjuna profile
const DELETED_ID = '416db06b-7f62-4e09-af2d-32a85a4ff295'; // Deleted profile

async function checkDataLoss() {
  console.log('🔍 Checking Nagarjuna Data Loss...\n');
  console.log('='.repeat(80));

  // Get current profile
  const { data: current, error: currentError } = await supabase
    .from('celebrities')
    .select('*')
    .eq('id', CURRENT_ID)
    .single();

  if (currentError || !current) {
    console.error('❌ Cannot find current profile');
    return;
  }

  console.log('📋 Current Profile (nagarjuna):');
  console.log(`   ID: ${current.id}`);
  console.log(`   Name: ${current.name_en}`);
  console.log(`   Slug: ${current.slug}`);
  console.log(`   TMDB: ${current.tmdb_id}`);
  console.log(`   IMDb: ${current.imdb_id}`);
  console.log(`   Birth Date: ${current.birth_date}`);
  console.log(`   Short Bio: ${current.short_bio ? `${current.short_bio.substring(0, 100)}...` : 'N/A'}`);
  console.log(`   Profile Image: ${current.profile_image ? '✅' : '❌'}`);
  console.log(`   Occupation: ${current.occupation?.join(', ') || 'N/A'}`);
  console.log(`   Confidence: ${current.entity_confidence_score}`);

  // Check for deleted profile (it should be gone)
  const { data: deleted, error: deletedError } = await supabase
    .from('celebrities')
    .select('*')
    .eq('id', DELETED_ID)
    .maybeSingle();

  console.log('\n' + '='.repeat(80));
  if (deleted) {
    console.log('⚠️  Deleted profile still exists!');
    console.log(`   ID: ${deleted.id}`);
    console.log(`   Name: ${deleted.name_en}`);
    console.log(`   Slug: ${deleted.slug}`);
    console.log(`   TMDB: ${deleted.tmdb_id}`);
  } else {
    console.log('❌ Deleted profile is gone (cannot recover directly)');
  }

  // Check movies table for any references to the old profile name
  console.log('\n' + '='.repeat(80));
  console.log('🎬 Checking movie associations...\n');

  // Check movies where Nagarjuna is actor
  const { data: moviesAsActor, count: actorCount } = await supabase
    .from('movies')
    .select('id, title_en, actors', { count: 'exact' })
    .contains('actors', [current.name_en]);

  console.log(`   Movies as Actor: ${actorCount || 0}`);
  if (moviesAsActor && moviesAsActor.length > 0) {
    moviesAsActor.slice(0, 5).forEach((movie: any) => {
      console.log(`   - ${movie.title_en}`);
    });
    if (moviesAsActor.length > 5) {
      console.log(`   ... and ${moviesAsActor.length - 5} more`);
    }
  }

  // Check movies as producer
  const { count: producerCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .contains('producers', [current.name_en]);

  console.log(`   Movies as Producer: ${producerCount || 0}`);

  // Check if there are any movie associations with the old slug format
  const { data: oldSlugMovies, count: oldSlugCount } = await supabase
    .from('movies')
    .select('id, title_en, actors', { count: 'exact' })
    .or('actors.cs.{"Akkineni Nagarjuna"},actors.cs.{"nagarjuna-akkineni"}');

  if (oldSlugCount && oldSlugCount > 0) {
    console.log(`\n   ⚠️  Found ${oldSlugCount} movies potentially using old reference`);
  }

  // Check celebrity_awards table
  console.log('\n' + '='.repeat(80));
  console.log('🏆 Checking awards data...\n');

  const { data: awards, count: awardsCount } = await supabase
    .from('celebrity_awards')
    .select('*', { count: 'exact' })
    .eq('celebrity_id', CURRENT_ID);

  console.log(`   Awards for current profile: ${awardsCount || 0}`);

  const { data: deletedAwards, count: deletedAwardsCount } = await supabase
    .from('celebrity_awards')
    .select('*', { count: 'exact' })
    .eq('celebrity_id', DELETED_ID);

  if (deletedAwardsCount && deletedAwardsCount > 0) {
    console.log(`   ⚠️  Awards still linked to deleted profile: ${deletedAwardsCount}`);
    console.log('   These need to be migrated!');
  } else {
    console.log(`   Awards for deleted profile: 0`);
  }

  // Check celebrity_relationships
  console.log('\n' + '='.repeat(80));
  console.log('👨‍👩‍👧‍👦 Checking relationships...\n');

  const { data: relationships, count: relCount } = await supabase
    .from('celebrity_relationships')
    .select('*', { count: 'exact' })
    .or(`celebrity_id_1.eq.${CURRENT_ID},celebrity_id_2.eq.${CURRENT_ID}`);

  console.log(`   Relationships for current profile: ${relCount || 0}`);

  const { data: deletedRel, count: delRelCount } = await supabase
    .from('celebrity_relationships')
    .select('*', { count: 'exact' })
    .or(`celebrity_id_1.eq.${DELETED_ID},celebrity_id_2.eq.${DELETED_ID}`);

  if (delRelCount && delRelCount > 0) {
    console.log(`   ⚠️  Relationships still linked to deleted profile: ${delRelCount}`);
    console.log('   These need to be migrated!');
  } else {
    console.log(`   Relationships for deleted profile: 0`);
  }

  // Check celebrity_social_profiles
  console.log('\n' + '='.repeat(80));
  console.log('📱 Checking social profiles...\n');

  const { data: social, count: socialCount } = await supabase
    .from('celebrity_social_profiles')
    .select('*', { count: 'exact' })
    .eq('celebrity_id', CURRENT_ID);

  console.log(`   Social profiles for current: ${socialCount || 0}`);

  const { data: deletedSocial, count: delSocialCount } = await supabase
    .from('celebrity_social_profiles')
    .select('*', { count: 'exact' })
    .eq('celebrity_id', DELETED_ID);

  if (delSocialCount && delSocialCount > 0) {
    console.log(`   ⚠️  Social profiles still linked to deleted: ${delSocialCount}`);
    console.log('   These need to be migrated!');
  } else {
    console.log(`   Social profiles for deleted: 0`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 Data Loss Summary:\n');

  const hasDataLoss = delSocialCount > 0 || delRelCount > 0 || deletedAwardsCount > 0;

  if (hasDataLoss) {
    console.log('⚠️  POTENTIAL DATA LOSS DETECTED!');
    console.log(`   - Awards to migrate: ${deletedAwardsCount || 0}`);
    console.log(`   - Relationships to migrate: ${delRelCount || 0}`);
    console.log(`   - Social profiles to migrate: ${delSocialCount || 0}`);
    console.log('\n   ACTION REQUIRED: Run data migration script!');
  } else {
    console.log('✅ No orphaned data found');
    console.log('   All relational data appears to be intact');
  }

  console.log('\n' + '='.repeat(80));
}

checkDataLoss().catch(console.error);
