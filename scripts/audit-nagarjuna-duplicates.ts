#!/usr/bin/env tsx
/**
 * Audit Nagarjuna Duplicate Profiles
 * 
 * This script audits all celebrity profiles related to Nagarjuna
 * to identify duplicates causing multiple search entries.
 * 
 * Issue: 
 * - http://localhost:3000/movies?profile=nagarjuna-akkineni
 * - http://localhost:3000/movies?profile=akkineni-nagarjuna
 * Both URLs should point to the same person but currently show separate entries.
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

interface CelebrityProfile {
  id: string;
  name_en: string;
  name_te: string | null;
  slug: string;
  tmdb_id: number | null;
  imdb_id: string | null;
  is_published: boolean;
  entity_confidence_score: number | null;
  occupation: string[] | null;
  birth_date: string | null;
  profile_image: string | null;
  created_at: string;
  updated_at: string;
}

async function auditNagarjunaProfiles() {
  console.log('🔍 Auditing Nagarjuna Profiles...\n');
  console.log('='.repeat(80));

  // Search for all profiles with "nagarjuna" in name or slug
  const { data: profiles, error } = await supabase
    .from('celebrities')
    .select('*')
    .or('name_en.ilike.%nagarjuna%,slug.ilike.%nagarjuna%,slug.ilike.%akkineni%')
    .order('name_en');

  if (error) {
    console.error('❌ Error fetching profiles:', error);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('✅ No profiles found with "nagarjuna" in name or slug');
    return;
  }

  console.log(`📊 Found ${profiles.length} profile(s) matching "nagarjuna"\n`);

  // Group by TMDB ID to identify duplicates
  const byTmdbId = new Map<number, CelebrityProfile[]>();
  const byImdbId = new Map<string, CelebrityProfile[]>();
  const byName = new Map<string, CelebrityProfile[]>();
  
  profiles.forEach((profile: CelebrityProfile) => {
    // Group by TMDB ID
    if (profile.tmdb_id) {
      const existing = byTmdbId.get(profile.tmdb_id) || [];
      existing.push(profile);
      byTmdbId.set(profile.tmdb_id, existing);
    }

    // Group by IMDb ID
    if (profile.imdb_id) {
      const existing = byImdbId.get(profile.imdb_id) || [];
      existing.push(profile);
      byImdbId.set(profile.imdb_id, existing);
    }

    // Group by normalized name
    const normalizedName = profile.name_en.toLowerCase().replace(/[^a-z]/g, '');
    const existing = byName.get(normalizedName) || [];
    existing.push(profile);
    byName.set(normalizedName, existing);
  });

  // Display all profiles
  console.log('📋 All Nagarjuna-Related Profiles:\n');
  profiles.forEach((profile: CelebrityProfile, index: number) => {
    console.log(`${index + 1}. ${profile.name_en}`);
    console.log(`   ID: ${profile.id}`);
    console.log(`   Slug: ${profile.slug}`);
    console.log(`   TMDB ID: ${profile.tmdb_id || 'N/A'}`);
    console.log(`   IMDb ID: ${profile.imdb_id || 'N/A'}`);
    console.log(`   Telugu Name: ${profile.name_te || 'N/A'}`);
    console.log(`   Published: ${profile.is_published ? '✅' : '❌'}`);
    console.log(`   Confidence: ${profile.entity_confidence_score || 0}`);
    console.log(`   Occupation: ${profile.occupation?.join(', ') || 'N/A'}`);
    console.log(`   Birth Date: ${profile.birth_date || 'N/A'}`);
    console.log(`   Profile Image: ${profile.profile_image ? '✅' : '❌'}`);
    console.log(`   URL: http://localhost:3000/movies?profile=${profile.slug}`);
    console.log(`   Created: ${new Date(profile.created_at).toLocaleDateString()}`);
    console.log(`   Updated: ${new Date(profile.updated_at).toLocaleDateString()}`);
    console.log('');
  });

  // Check for duplicates by TMDB ID
  console.log('\n' + '='.repeat(80));
  console.log('🔎 Duplicate Analysis by TMDB ID:\n');
  
  let duplicatesFound = false;
  byTmdbId.forEach((profiles, tmdbId) => {
    if (profiles.length > 1) {
      duplicatesFound = true;
      console.log(`⚠️  TMDB ID ${tmdbId} has ${profiles.length} profiles:`);
      profiles.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name_en} (${p.slug})`);
        console.log(`      ID: ${p.id}`);
        console.log(`      Published: ${p.is_published}, Confidence: ${p.entity_confidence_score || 0}`);
      });
      console.log('');
    }
  });

  if (!duplicatesFound) {
    console.log('✅ No duplicates found by TMDB ID\n');
  }

  // Check for duplicates by IMDb ID
  console.log('\n' + '='.repeat(80));
  console.log('🔎 Duplicate Analysis by IMDb ID:\n');
  
  duplicatesFound = false;
  byImdbId.forEach((profiles, imdbId) => {
    if (profiles.length > 1) {
      duplicatesFound = true;
      console.log(`⚠️  IMDb ID ${imdbId} has ${profiles.length} profiles:`);
      profiles.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name_en} (${p.slug})`);
        console.log(`      ID: ${p.id}`);
        console.log(`      Published: ${p.is_published}, Confidence: ${p.entity_confidence_score || 0}`);
      });
      console.log('');
    }
  });

  if (!duplicatesFound) {
    console.log('✅ No duplicates found by IMDb ID\n');
  }

  // Check for similar names
  console.log('\n' + '='.repeat(80));
  console.log('🔎 Duplicate Analysis by Name Similarity:\n');
  
  duplicatesFound = false;
  byName.forEach((profiles, normalizedName) => {
    if (profiles.length > 1) {
      duplicatesFound = true;
      console.log(`⚠️  Similar name "${normalizedName}" has ${profiles.length} profiles:`);
      profiles.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name_en} (${p.slug})`);
        console.log(`      ID: ${p.id}`);
        console.log(`      Published: ${p.is_published}, Confidence: ${p.entity_confidence_score || 0}`);
      });
      console.log('');
    }
  });

  if (!duplicatesFound) {
    console.log('✅ No duplicates found by name similarity\n');
  }

  // Check movie associations
  console.log('\n' + '='.repeat(80));
  console.log('🎬 Checking Movie Associations:\n');
  
  for (const profile of profiles) {
    // Check as actor
    const { count: actorCount } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .contains('actors', [profile.name_en]);

    // Check as director
    const { count: directorCount } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('director', profile.name_en);

    // Check as producer
    const { count: producerCount } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .contains('producers', [profile.name_en]);

    const totalMovies = (actorCount || 0) + (directorCount || 0) + (producerCount || 0);

    if (totalMovies > 0) {
      console.log(`${profile.name_en} (${profile.slug}):`);
      console.log(`   Actor: ${actorCount || 0} movies`);
      console.log(`   Director: ${directorCount || 0} movies`);
      console.log(`   Producer: ${producerCount || 0} movies`);
      console.log(`   Total: ${totalMovies} movies`);
      console.log('');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📝 Summary:\n');
  console.log(`Total Profiles: ${profiles.length}`);
  console.log(`TMDB ID Groups: ${byTmdbId.size}`);
  console.log(`IMDb ID Groups: ${byImdbId.size}`);
  console.log(`Name Groups: ${byName.size}`);
  console.log('\n' + '='.repeat(80));

  // Generate recommendations
  console.log('\n💡 Recommendations:\n');
  
  if (byTmdbId.size > 0 && profiles.length > byTmdbId.size) {
    console.log('⚠️  Multiple profiles share the same TMDB ID - these are duplicates!');
    console.log('   Action: Merge duplicates, keeping the most complete profile');
  }

  if (profiles.length > 1) {
    console.log('\n⚠️  Multiple profiles found for Nagarjuna-related celebrities');
    console.log('   Action: Review and determine if these are:');
    console.log('   1. The same person with different slugs (merge required)');
    console.log('   2. Different people (e.g., Nagarjuna vs Akkineni Nageswara Rao)');
  }

  // Specific Nagarjuna check
  const nagarjunaProfiles = profiles.filter((p: CelebrityProfile) => 
    p.name_en.toLowerCase().includes('nagarjuna') && 
    !p.name_en.toLowerCase().includes('nageswara')
  );

  if (nagarjunaProfiles.length > 1) {
    console.log('\n🚨 CRITICAL: Multiple Nagarjuna profiles detected!');
    console.log('   These profiles should likely be merged:');
    nagarjunaProfiles.forEach((p: CelebrityProfile) => {
      console.log(`   - ${p.name_en} (${p.slug})`);
    });
  }

  console.log('\n✅ Audit complete!\n');
  console.log('Next steps:');
  console.log('1. Review the audit results above');
  console.log('2. Run fix-nagarjuna-duplicates.ts to merge duplicates');
  console.log('3. Verify the fix on http://localhost:3000\n');
}

// Run the audit
auditNagarjunaProfiles().catch(console.error);
