#!/usr/bin/env npx tsx
/**
 * Check Nagarjuna Profile Slug Status
 * 
 * Verify which URLs will work after the fix
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSlugStatus() {
  console.log('🔍 Checking Nagarjuna Profile Slug Status\n');
  console.log('='.repeat(80));

  const slugsToCheck = [
    'nagarjuna',
    'akkineni-nagarjuna',
    'nagarjuna-akkineni',
    'celeb-akkineni-nagarjuna',
  ];

  for (const slug of slugsToCheck) {
    const { data: profile, error } = await supabase
      .from('celebrities')
      .select('id, name_en, slug, is_published')
      .eq('slug', slug)
      .maybeSingle();

    console.log(`\nSlug: "${slug}"`);
    console.log(`URL: http://localhost:3000/movies?profile=${slug}`);
    
    if (profile) {
      console.log(`✅ EXISTS in database`);
      console.log(`   Name: ${profile.name_en}`);
      console.log(`   Published: ${profile.is_published ? '✅' : '❌'}`);
      console.log(`   Status: WILL WORK`);
    } else {
      console.log(`❌ NOT FOUND in celebrities table`);
      console.log(`   Status: MIGHT WORK via fallback (searches movies table)`);
      console.log(`   Recommendation: Redirect to correct slug`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Current Status:\n');
  console.log('✅ http://localhost:3000/movies?profile=nagarjuna');
  console.log('   → Primary slug, will work perfectly\n');
  
  console.log('⚠️  http://localhost:3000/movies?profile=akkineni-nagarjuna');
  console.log('   → Old slug, might work via fallback but not recommended\n');
  
  console.log('📝 Recommendation:');
  console.log('   Add slug redirects or aliases for better UX');
}

checkSlugStatus().catch(console.error);
