import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 1. Spelling fixes (update DB title to match Wikipedia)
const SPELLING_FIXES = [
  { old: 'Shivudu Shivudu Shivudu', new: 'Sivudu Sivudu Sivudu', year: 1983 },
  { old: 'Simhapoori Simham', new: 'Simhapuri Simham', year: 1983 },
  { old: 'Palleturi Monagadu', new: 'Palletoori Monagadu', year: 1983 },
  { old: 'Alludaa Majakaa', new: 'Alluda Majaka', year: 1995 },
];

// 2. Films to remove (Hindi dubs + placeholders)
const FILMS_TO_REMOVE = [
  { title: 'Zulm Ki Zanjeer', year: 1989 },
  { title: 'Meri Zindagi Ek Agneepath', year: 1998 },
  { title: 'Mega 159', year: 2026 },
  { title: 'Auto Jaani', year: 2026 },
];

// 3. Missing lead roles to add
const MISSING_LEADS = [
  { title: 'Mana Voori Pandavulu', year: 1978, character: 'Parthu' },
  { title: 'Idi Katha Kaadu', year: 1979, character: 'Subanakar' },
  { title: 'Mosagadu', year: 1980, character: 'Seshu' },
  { title: 'Kaali', year: 1980, character: 'GK' },
  { title: 'Prema Tarangalu', year: 1980, character: 'Kumar' },
  { title: '47 Rojulu', year: 1981, character: 'Kumar' },
  { title: 'Priya', year: 1981, character: 'Vijay' },
  { title: 'Chiranjeevi', year: 1985, character: 'Chiranjeevi' },
  { title: 'Puli', year: 1985, character: 'Kranthi' },
  { title: 'Sri Manjunatha', year: 2001, character: 'Manjunatha / Lord Siva' },
];

// 4. Missing cameos to add
const MISSING_CAMEOS = [
  { title: 'Tayaramma Bangarayya', year: 1979, character: "Jyothi's Husband" },
  { title: 'Kottapeta Rowdy', year: 1980, character: 'Prasanna Kumar' },
  { title: 'Aadavaallu Meeku Joharlu', year: 1981, character: 'Himself' },
  { title: 'Prema Natakam', year: 1981, character: 'Himself' },
  { title: 'Maa Inti Premayanam', year: 1983, character: 'Himself' },
  { title: 'Hands Up', year: 2000, character: "Saraswati's husband" },
  { title: 'Style', year: 2006, character: 'Himself' },
  { title: 'Magadheera', year: 2009, character: 'Himself' },
  { title: 'Jagadguru Adi Shankara', year: 2013, character: 'Manjunatha / Lord Siva' },
  { title: 'Bruce Lee: The Fighter', year: 2015, character: 'Himself' },
];

function generateSlug(title: string, year: number): string {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}-${year}`;
}

async function fixAll() {
  console.log('\n' + '='.repeat(60));
  console.log('CHIRANJEEVI FILMOGRAPHY - COMPREHENSIVE FIX');
  console.log('='.repeat(60));
  
  let totalFixed = 0;
  let totalRemoved = 0;
  let totalAdded = 0;
  let errors: string[] = [];

  // 1. FIX SPELLING VARIATIONS
  console.log('\n1. FIXING SPELLING VARIATIONS...');
  for (const fix of SPELLING_FIXES) {
    const { data, error } = await supabase
      .from('movies')
      .update({ 
        title_en: fix.new,
        slug: generateSlug(fix.new, fix.year)
      })
      .eq('title_en', fix.old)
      .eq('release_year', fix.year)
      .select();
    
    if (error) {
      errors.push(`Spelling fix "${fix.old}": ${error.message}`);
      console.log(`   ❌ "${fix.old}" → "${fix.new}": ${error.message}`);
    } else if (data && data.length > 0) {
      totalFixed++;
      console.log(`   ✓ "${fix.old}" → "${fix.new}"`);
    } else {
      console.log(`   ? "${fix.old}" not found`);
    }
  }

  // 2. REMOVE HINDI DUBS + PLACEHOLDERS
  console.log('\n2. REMOVING HINDI DUBS & PLACEHOLDERS...');
  for (const film of FILMS_TO_REMOVE) {
    const { data, error } = await supabase
      .from('movies')
      .delete()
      .ilike('title_en', `%${film.title}%`)
      .eq('release_year', film.year)
      .select();
    
    if (error) {
      errors.push(`Remove "${film.title}": ${error.message}`);
      console.log(`   ❌ "${film.title}": ${error.message}`);
    } else if (data && data.length > 0) {
      totalRemoved++;
      console.log(`   ✓ Removed "${film.title}" (${film.year})`);
    } else {
      console.log(`   ? "${film.title}" not found`);
    }
  }

  // 3. ADD MISSING LEAD ROLES
  console.log('\n3. ADDING MISSING LEAD ROLES...');
  for (const film of MISSING_LEADS) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('movies')
      .select('id')
      .ilike('title_en', film.title)
      .eq('release_year', film.year)
      .single();
    
    if (existing) {
      console.log(`   ? "${film.title}" already exists`);
      continue;
    }
    
    const { error } = await supabase
      .from('movies')
      .insert({
        title_en: film.title,
        title_te: film.title,
        release_year: film.year,
        hero: 'Chiranjeevi',
        slug: generateSlug(film.title, film.year),
        is_published: false,
        language: 'Telugu',
      });
    
    if (error) {
      if (error.code === '23505') {
        console.log(`   ? "${film.title}" already exists (slug conflict)`);
      } else {
        errors.push(`Add "${film.title}": ${error.message}`);
        console.log(`   ❌ "${film.title}": ${error.message}`);
      }
    } else {
      totalAdded++;
      console.log(`   ✓ Added "${film.title}" (${film.year})`);
    }
  }

  // 4. ADD MISSING CAMEOS
  console.log('\n4. ADDING MISSING CAMEOS...');
  for (const film of MISSING_CAMEOS) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('movies')
      .select('id')
      .ilike('title_en', film.title)
      .eq('release_year', film.year)
      .single();
    
    if (existing) {
      console.log(`   ? "${film.title}" already exists`);
      continue;
    }
    
    const { error } = await supabase
      .from('movies')
      .insert({
        title_en: film.title,
        title_te: film.title,
        release_year: film.year,
        supporting_cast: 'Chiranjeevi (Special Appearance)',
        slug: generateSlug(film.title, film.year),
        is_published: false,
        language: 'Telugu',
      });
    
    if (error) {
      if (error.code === '23505') {
        console.log(`   ? "${film.title}" already exists (slug conflict)`);
      } else {
        errors.push(`Add cameo "${film.title}": ${error.message}`);
        console.log(`   ❌ "${film.title}": ${error.message}`);
      }
    } else {
      totalAdded++;
      console.log(`   ✓ Added cameo "${film.title}" (${film.year})`);
    }
  }

  // SUMMARY
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Spelling fixes applied: ${totalFixed}`);
  console.log(`Films removed: ${totalRemoved}`);
  console.log(`Films added: ${totalAdded}`);
  console.log(`Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  // Get final count
  const { count } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .ilike('hero', '%Chiranjeevi%')
    .not('hero', 'ilike', '%Sarja%');
  
  const { count: cameoCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .ilike('supporting_cast', '%Chiranjeevi%');
  
  console.log(`\nFinal count:`);
  console.log(`  Lead roles (hero=Chiranjeevi): ${count}`);
  console.log(`  Cameos (in supporting_cast): ${cameoCount}`);
  console.log(`  Combined unique: ${(count || 0) + (cameoCount || 0)} (may have overlap)`);
}

fixAll();
