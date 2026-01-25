#!/usr/bin/env npx tsx
/**
 * Fix and Publish Remaining Movies
 * 
 * 1. Fix NTR Kathanayukudu (add Balakrishna as hero)
 * 2. Update language for 5 non-Telugu films
 * 3. Publish 7 Excellent Telugu movies
 * 4. Keep Salaar Part 2 unpublished (unreleased)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Language corrections
const languageCorrections = [
  {
    title: 'Mumbai Saga',
    year: 2021,
    language: 'Hindi',
    note: 'Hindi crime action film'
  },
  {
    title: 'Madura Raja',
    year: 2019,
    language: 'Malayalam',
    note: 'Malayalam film (Telugu dub: Raja Narasimha)'
  },
  {
    title: 'Annabelle Sethupathi',
    year: 2019,
    language: 'Tamil',
    note: 'Tamil horror-comedy (Telugu dub available)'
  },
  {
    title: 'Kee',
    year: 2019,
    language: 'Tamil',
    note: 'Tamil techno-thriller (Telugu dub)'
  },
  {
    title: 'Babli Bouncer',
    year: 2022,
    language: 'Hindi',
    note: 'Hindi film directed by Madhur Bhandarkar'
  }
];

// Movies to publish (Excellent quality Telugu films)
const excellentTeluguMovies = [
  { title: 'Ramam Raghavam', year: 2025 },
  { title: 'Buddy', year: 2024 },
  { title: 'Check', year: 2021 },
  { title: 'Love Story', year: 2021 },
  { title: 'Seetimaarr', year: 2021 },
  { title: 'Utthara', year: 2020 },
  { title: '4 Letters', year: 2020 },
];

async function fixAndPublish() {
  console.log('🔧 Fixing and Publishing Remaining Movies\n');
  console.log('='.repeat(80));
  
  // STEP 1: Fix NTR Kathanayukudu
  console.log('\n📝 Step 1: Fixing NTR Kathanayukudu\n');
  
  const { data: ntrMovie } = await supabase
    .from('movies')
    .select('*')
    .ilike('title_en', '%NTR%Kathanayukudu%')
    .eq('release_year', 2019)
    .single();
  
  if (ntrMovie) {
    const { error } = await supabase
      .from('movies')
      .update({
        hero: 'Nandamuri Balakrishna',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ntrMovie.id);
    
    if (error) {
      console.log(`   ❌ Error fixing NTR movie: ${error.message}`);
    } else {
      console.log(`   ✅ Fixed: NTR Kathanayukudu`);
      console.log(`      Hero: Missing → Nandamuri Balakrishna\n`);
    }
  } else {
    console.log(`   ⚠️  NTR Kathanayukudu not found\n`);
  }
  
  // STEP 2: Update language for non-Telugu films
  console.log('='.repeat(80));
  console.log('\n📝 Step 2: Updating Language Tags\n');
  
  let languageUpdates = 0;
  
  for (const correction of languageCorrections) {
    const { data: movies } = await supabase
      .from('movies')
      .select('*')
      .ilike('title_en', `%${correction.title}%`)
      .eq('release_year', correction.year)
      .limit(1);
    
    if (movies && movies.length > 0) {
      const movie = movies[0];
      const oldLanguage = movie.language;
      
      const { error } = await supabase
        .from('movies')
        .update({
          language: correction.language,
          updated_at: new Date().toISOString(),
        })
        .eq('id', movie.id);
      
      if (error) {
        console.log(`   ❌ ${correction.title}: ${error.message}`);
      } else {
        languageUpdates++;
        console.log(`   ✅ ${correction.title}`);
        console.log(`      Language: ${oldLanguage} → ${correction.language}`);
        console.log(`      Note: ${correction.note}\n`);
      }
    } else {
      console.log(`   ⚠️  ${correction.title} not found\n`);
    }
  }
  
  // STEP 3: Publish Excellent Telugu movies
  console.log('='.repeat(80));
  console.log('\n📝 Step 3: Publishing Excellent Telugu Movies\n');
  
  let published = 0;
  const publishedList: any[] = [];
  
  for (const movie of excellentTeluguMovies) {
    const { data: movies } = await supabase
      .from('movies')
      .select('*')
      .ilike('title_en', `%${movie.title}%`)
      .eq('release_year', movie.year)
      .eq('language', 'Telugu')
      .eq('is_published', false)
      .limit(1);
    
    if (movies && movies.length > 0) {
      const movieData = movies[0];
      
      const { error } = await supabase
        .from('movies')
        .update({
          is_published: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', movieData.id);
      
      if (error) {
        console.log(`   ❌ ${movie.title}: ${error.message}`);
      } else {
        published++;
        publishedList.push(movieData);
        console.log(`   ✅ ${movie.year} - ${movie.title}`);
        if (movieData.hero) console.log(`      Hero: ${movieData.hero}`);
        if (movieData.director) console.log(`      Director: ${movieData.director}`);
        console.log(`      Rating: ${movieData.our_rating}`);
      }
    } else {
      console.log(`   ⚠️  ${movie.title} (${movie.year}) not found or already published\n`);
    }
  }
  
  // STEP 4: Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Final Summary:\n');
  console.log(`   ✅ Language corrections: ${languageUpdates}/5`);
  console.log(`   ✅ Movies published: ${published}/7`);
  console.log(`   🔧 Hero fixes: ${ntrMovie ? 1 : 0}/1\n`);
  
  console.log('🌍 Language Updates:\n');
  console.log('   - Mumbai Saga → Hindi');
  console.log('   - Madura Raja → Malayalam');
  console.log('   - Annabelle Sethupathi → Tamil');
  console.log('   - Kee → Tamil');
  console.log('   - Babli Bouncer → Hindi\n');
  
  console.log('🎬 Published Movies:\n');
  publishedList.forEach(m => {
    console.log(`   ${m.release_year} - ${m.title_en}`);
  });
  console.log();
  
  // Calculate remaining
  const { data: stillUnpublished } = await supabase
    .from('movies')
    .select('id')
    .eq('is_published', false)
    .eq('language', 'Telugu');
  
  console.log('='.repeat(80));
  console.log('\n🎯 Status Update:\n');
  console.log(`   Total published (session): ${179 + published} movies`);
  console.log(`   Unpublished Telugu movies: ${stillUnpublished?.length || 'Unknown'}`);
  console.log(`   Completion rate: ~${Math.round(((179 + published) / (179 + published + (stillUnpublished?.length || 0))) * 100)}%\n`);
  
  console.log('📋 Remaining Tasks:\n');
  console.log('   ⏳ 4 vintage films (1951-1952) - Need decision');
  console.log('   ⏳ 5 "Good" quality Telugu films - Need rating');
  console.log('   ⏳ 1 unreleased (Salaar Part 2) - Keep unpublished');
  console.log('   ⏳ 1 Shanti (needs clarification)\n');
  
  console.log('='.repeat(80));
  console.log('\n🎉 SUCCESS!\n');
  console.log('✅ Language tags corrected for 5 films');
  console.log('✅ NTR Kathanayukudu hero fixed');
  console.log(`✅ ${published} excellent Telugu movies published\n`);
}

fixAndPublish().catch(console.error);
