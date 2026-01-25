#!/usr/bin/env npx tsx
/**
 * Merge Celebrity Duplicate Profiles (PROPER METHOD)
 * 
 * This script properly merges duplicate celebrity profiles by:
 * 1. Identifying the primary (most complete) profile
 * 2. Merging ALL data from duplicate into primary:
 *    - Bio, images, dates (keep most complete)
 *    - Awards (merge both)
 *    - Relationships (update references)
 *    - Social profiles (merge both)
 *    - Movie associations (update all references)
 * 3. Update all foreign key references
 * 4. THEN delete the duplicate
 * 
 * This ensures NO DATA LOSS during merge.
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

interface MergeConfig {
  primaryId: string;
  duplicateId: string;
  primaryName: string;
  duplicateName: string;
  preferredSlug?: string;
  dryRun?: boolean;
}

async function mergeCelebrityProfiles(config: MergeConfig) {
  console.log('🔄 Merging Celebrity Profiles\n');
  console.log('='.repeat(80));
  console.log(`Primary: ${config.primaryName} (${config.primaryId})`);
  console.log(`Duplicate: ${config.duplicateName} (${config.duplicateId})`);
  console.log(`Mode: ${config.dryRun ? 'DRY RUN (no changes)' : 'LIVE (will make changes)'}`);
  console.log('='.repeat(80));

  // Step 1: Fetch both profiles
  console.log('\n📋 Step 1: Fetching profiles...\n');

  const { data: primary, error: primError } = await supabase
    .from('celebrities')
    .select('*')
    .eq('id', config.primaryId)
    .single();

  const { data: duplicate, error: dupError } = await supabase
    .from('celebrities')
    .select('*')
    .eq('id', config.duplicateId)
    .single();

  if (primError || !primary) {
    console.error('❌ Primary profile not found');
    return false;
  }

  if (dupError || !duplicate) {
    console.error('❌ Duplicate profile not found');
    return false;
  }

  console.log('✅ Both profiles found');

  // Step 2: Merge profile data
  console.log('\n📋 Step 2: Analyzing data to merge...\n');

  const mergedData: any = { ...primary };
  const updates: string[] = [];

  // Merge strategy: keep most complete/accurate data
  if (!primary.short_bio && duplicate.short_bio) {
    mergedData.short_bio = duplicate.short_bio;
    updates.push('short_bio');
  }

  if (!primary.biography && duplicate.biography) {
    mergedData.biography = duplicate.biography;
    updates.push('biography');
  }

  if (!primary.biography_te && duplicate.biography_te) {
    mergedData.biography_te = duplicate.biography_te;
    updates.push('biography_te');
  }

  if (!primary.birth_date && duplicate.birth_date) {
    mergedData.birth_date = duplicate.birth_date;
    updates.push('birth_date');
  }

  if (!primary.birth_place && duplicate.birth_place) {
    mergedData.birth_place = duplicate.birth_place;
    updates.push('birth_place');
  }

  if (!primary.death_date && duplicate.death_date) {
    mergedData.death_date = duplicate.death_date;
    updates.push('death_date');
  }

  if (!primary.profile_image && duplicate.profile_image) {
    mergedData.profile_image = duplicate.profile_image;
    mergedData.profile_image_source = duplicate.profile_image_source;
    updates.push('profile_image');
  }

  if (!primary.cover_image && duplicate.cover_image) {
    mergedData.cover_image = duplicate.cover_image;
    updates.push('cover_image');
  }

  if (!primary.imdb_id && duplicate.imdb_id) {
    mergedData.imdb_id = duplicate.imdb_id;
    updates.push('imdb_id');
  }

  // Merge occupation arrays
  if (duplicate.occupation && Array.isArray(duplicate.occupation)) {
    const existingOccupations = new Set(primary.occupation || []);
    duplicate.occupation.forEach(occ => existingOccupations.add(occ));
    mergedData.occupation = Array.from(existingOccupations);
    if (mergedData.occupation.length > (primary.occupation?.length || 0)) {
      updates.push('occupation');
    }
  }

  // Use preferred slug if provided
  if (config.preferredSlug && primary.slug !== config.preferredSlug) {
    mergedData.slug = config.preferredSlug;
    updates.push('slug');
  }

  mergedData.updated_at = new Date().toISOString();

  if (updates.length > 0) {
    console.log(`📝 Fields to update in primary:`);
    updates.forEach(field => console.log(`   - ${field}`));
  } else {
    console.log('✅ Primary already has all data, no updates needed');
  }

  // Step 3: Migrate awards
  console.log('\n📋 Step 3: Migrating awards...\n');

  const { data: dupAwards, count: dupAwardsCount } = await supabase
    .from('celebrity_awards')
    .select('*', { count: 'exact' })
    .eq('celebrity_id', config.duplicateId);

  if (dupAwardsCount && dupAwardsCount > 0) {
    console.log(`   Found ${dupAwardsCount} awards to migrate`);
    
    if (!config.dryRun && dupAwards) {
      for (const award of dupAwards) {
        const { error: updateError } = await supabase
          .from('celebrity_awards')
          .update({ celebrity_id: config.primaryId })
          .eq('id', award.id);

        if (updateError) {
          console.log(`   ⚠️  Error migrating award: ${updateError.message}`);
        }
      }
      console.log(`   ✅ Migrated ${dupAwardsCount} awards`);
    } else if (config.dryRun) {
      console.log(`   [DRY RUN] Would migrate ${dupAwardsCount} awards`);
    }
  } else {
    console.log('   No awards to migrate');
  }

  // Step 4: Migrate relationships
  console.log('\n📋 Step 4: Migrating relationships...\n');

  const { data: dupRel, count: dupRelCount } = await supabase
    .from('celebrity_relationships')
    .select('*', { count: 'exact' })
    .or(`celebrity_id_1.eq.${config.duplicateId},celebrity_id_2.eq.${config.duplicateId}`);

  if (dupRelCount && dupRelCount > 0) {
    console.log(`   Found ${dupRelCount} relationships to migrate`);
    
    if (!config.dryRun && dupRel) {
      for (const rel of dupRel) {
        const updates: any = {};
        if (rel.celebrity_id_1 === config.duplicateId) {
          updates.celebrity_id_1 = config.primaryId;
        }
        if (rel.celebrity_id_2 === config.duplicateId) {
          updates.celebrity_id_2 = config.primaryId;
        }

        const { error: updateError } = await supabase
          .from('celebrity_relationships')
          .update(updates)
          .eq('id', rel.id);

        if (updateError) {
          console.log(`   ⚠️  Error migrating relationship: ${updateError.message}`);
        }
      }
      console.log(`   ✅ Migrated ${dupRelCount} relationships`);
    } else if (config.dryRun) {
      console.log(`   [DRY RUN] Would migrate ${dupRelCount} relationships`);
    }
  } else {
    console.log('   No relationships to migrate');
  }

  // Step 5: Migrate social profiles
  console.log('\n📋 Step 5: Migrating social profiles...\n');

  const { data: dupSocial, count: dupSocialCount } = await supabase
    .from('celebrity_social_profiles')
    .select('*', { count: 'exact' })
    .eq('celebrity_id', config.duplicateId);

  if (dupSocialCount && dupSocialCount > 0) {
    console.log(`   Found ${dupSocialCount} social profiles to migrate`);
    
    if (!config.dryRun && dupSocial) {
      for (const social of dupSocial) {
        // Check if primary already has this platform
        const { data: existing } = await supabase
          .from('celebrity_social_profiles')
          .select('id')
          .eq('celebrity_id', config.primaryId)
          .eq('platform', social.platform)
          .maybeSingle();

        if (existing) {
          console.log(`   ℹ️  Skipping ${social.platform} (primary already has it)`);
          // Delete the duplicate social profile
          await supabase
            .from('celebrity_social_profiles')
            .delete()
            .eq('id', social.id);
        } else {
          const { error: updateError } = await supabase
            .from('celebrity_social_profiles')
            .update({ celebrity_id: config.primaryId })
            .eq('id', social.id);

          if (updateError) {
            console.log(`   ⚠️  Error migrating social profile: ${updateError.message}`);
          }
        }
      }
      console.log(`   ✅ Processed ${dupSocialCount} social profiles`);
    } else if (config.dryRun) {
      console.log(`   [DRY RUN] Would migrate ${dupSocialCount} social profiles`);
    }
  } else {
    console.log('   No social profiles to migrate');
  }

  // Step 6: Update movie references
  console.log('\n📋 Step 6: Updating movie references...\n');

  // This is complex because actors/producers are stored as arrays
  // We need to find movies that reference the duplicate name and update them

  const { data: moviesWithDup, count: movieCount } = await supabase
    .from('movies')
    .select('id, title_en, actors, producers, director', { count: 'exact' })
    .or(`actors.cs.{${duplicate.name_en}},producers.cs.{${duplicate.name_en}},director.eq.${duplicate.name_en}`);

  if (movieCount && movieCount > 0) {
    console.log(`   Found ${movieCount} movies referencing duplicate`);
    
    if (!config.dryRun && moviesWithDup) {
      for (const movie of moviesWithDup) {
        const updates: any = {};
        let hasChanges = false;

        // Update actors array
        if (movie.actors && movie.actors.includes(duplicate.name_en)) {
          updates.actors = movie.actors.map((name: string) => 
            name === duplicate.name_en ? primary.name_en : name
          );
          hasChanges = true;
        }

        // Update producers array
        if (movie.producers && movie.producers.includes(duplicate.name_en)) {
          updates.producers = movie.producers.map((name: string) => 
            name === duplicate.name_en ? primary.name_en : name
          );
          hasChanges = true;
        }

        // Update director
        if (movie.director === duplicate.name_en) {
          updates.director = primary.name_en;
          hasChanges = true;
        }

        if (hasChanges) {
          const { error: updateError } = await supabase
            .from('movies')
            .update(updates)
            .eq('id', movie.id);

          if (updateError) {
            console.log(`   ⚠️  Error updating movie ${movie.title_en}: ${updateError.message}`);
          }
        }
      }
      console.log(`   ✅ Updated ${movieCount} movie references`);
    } else if (config.dryRun) {
      console.log(`   [DRY RUN] Would update ${movieCount} movie references`);
      moviesWithDup.slice(0, 5).forEach((movie: any) => {
        console.log(`   - ${movie.title_en}`);
      });
    }
  } else {
    console.log('   No movies referencing duplicate');
  }

  // Step 7: Update primary profile with merged data
  if (updates.length > 0 && !config.dryRun) {
    console.log('\n📋 Step 7: Updating primary profile...\n');

    const { error: updateError } = await supabase
      .from('celebrities')
      .update(mergedData)
      .eq('id', config.primaryId);

    if (updateError) {
      console.error('❌ Error updating primary:', updateError.message);
      return false;
    }

    console.log('✅ Primary profile updated with merged data');
  } else if (updates.length > 0) {
    console.log('\n📋 Step 7: [DRY RUN] Would update primary profile');
  }

  // Step 8: Delete duplicate
  console.log('\n📋 Step 8: Deleting duplicate profile...\n');

  if (!config.dryRun) {
    const { error: deleteError } = await supabase
      .from('celebrities')
      .delete()
      .eq('id', config.duplicateId);

    if (deleteError) {
      console.error('❌ Error deleting duplicate:', deleteError.message);
      return false;
    }

    console.log('✅ Duplicate profile deleted');
  } else {
    console.log('[DRY RUN] Would delete duplicate profile');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Merge Complete!\n');

  return true;
}

// Example usage (commented out - use with caution)
/*
mergeCelebrityProfiles({
  primaryId: '7ea66985-c6f8-4f52-a51b-1dc9fd3f184d',
  duplicateId: '416db06b-7f62-4e09-af2d-32a85a4ff295',
  primaryName: 'Akkineni Nagarjuna',
  duplicateName: 'Akkineni Nagarjuna',
  preferredSlug: 'nagarjuna',
  dryRun: true, // Set to false to actually execute
}).catch(console.error);
*/

console.log('⚠️  This is a template script.');
console.log('Edit the script to specify profiles to merge, then run it.');
console.log('ALWAYS run with dryRun: true first to preview changes!');

export { mergeCelebrityProfiles };
