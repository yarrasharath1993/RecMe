#!/usr/bin/env npx tsx
/**
 * Publish Nagarjuna's Unpublished Movies
 * 
 * Makes 5 unpublished movies visible on his profile
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const DRY_RUN = process.argv.includes('--dry-run');

async function publishUnpublishedMovies() {
  console.log('📢 Publishing Nagarjuna\'s Unpublished Movies\n');
  console.log('='.repeat(80));
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN' : '✅ LIVE'}\n`);
  
  // Find unpublished Nagarjuna movies
  const { data: unpublishedMovies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, language')
    .eq('is_published', false)
    .ilike('hero', '%nagarjuna%')
    .not('hero', 'ilike', '%balakrishna%')
    .order('release_year');
  
  console.log(`📋 Found ${unpublishedMovies?.length || 0} unpublished movies:\n`);
  
  if (!unpublishedMovies || unpublishedMovies.length === 0) {
    console.log('   No unpublished movies found ✅\n');
    return;
  }
  
  unpublishedMovies.forEach((movie, index) => {
    console.log(`   ${index + 1}. ${movie.title_en} (${movie.release_year})`);
    console.log(`      Hero: ${movie.hero}`);
    console.log(`      Language: ${movie.language}`);
    console.log();
  });
  
  if (DRY_RUN) {
    console.log('[DRY RUN] Would publish these movies\n');
  } else {
    console.log('Publishing movies...\n');
    
    for (const movie of unpublishedMovies) {
      const { error } = await supabase
        .from('movies')
        .update({ is_published: true })
        .eq('id', movie.id);
      
      if (error) {
        console.log(`   ❌ ${movie.title_en}: Error - ${error.message}`);
      } else {
        console.log(`   ✅ ${movie.title_en}: Published`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Impact:\n');
  console.log(`   Nagarjuna's profile will show ${76 + (unpublishedMovies?.length || 0)} movies`);
  console.log(`   (was 76, now ${76 + (unpublishedMovies?.length || 0)})\n`);
  
  if (DRY_RUN) {
    console.log('📝 To publish, run without --dry-run:\n');
    console.log('   npx tsx scripts/publish-nagarjuna-unpublished-movies.ts\n');
  }
}

publishUnpublishedMovies().catch(console.error);
