import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface TeluguFix {
  searchTitle: string;
  searchYear: number;
  updates: {
    title_en?: string;
    release_year?: number;
    hero?: string;
    director?: string;
    our_rating?: number;
  };
  shouldPublish: boolean;
  notes: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
}

const teluguFixes: TeluguFix[] = [
  // CRITICAL - Year Errors (Decades Off!)
  {
    searchTitle: 'State Rowdy',
    searchYear: 2007,
    updates: {
      release_year: 1989,
      hero: 'Chiranjeevi',
      director: 'B. Gopal',
      our_rating: 7.0,
    },
    shouldPublish: true,
    notes: 'CRITICAL: Year 1989 not 2007! Chiranjeevi classic',
    priority: 'CRITICAL',
  },
  {
    searchTitle: 'Varakatnam',
    searchYear: 2007,
    updates: {
      release_year: 1969,
      hero: 'N. T. Rama Rao',
      director: 'N. T. Rama Rao',
      our_rating: 7.5,
    },
    shouldPublish: true,
    notes: 'CRITICAL: Year 1969 not 2007! NTR self-directed',
    priority: 'CRITICAL',
  },
  
  // CRITICAL - Hero Errors
  {
    searchTitle: 'Swayam Krushi',
    searchYear: 1987,
    updates: {
      hero: 'Chiranjeevi',
      director: 'K. Viswanath',
      our_rating: 8.2,
    },
    shouldPublish: true,
    notes: 'CRITICAL: Hero is Chiranjeevi! K. Viswanath masterpiece',
    priority: 'CRITICAL',
  },
  {
    searchTitle: 'Poola Rangadu',
    searchYear: 1967,
    updates: {
      hero: 'Akkineni Nageswara Rao',
      director: 'Adurthi Subba Rao',
      our_rating: 7.8,
    },
    shouldPublish: true,
    notes: 'CRITICAL: Hero is ANR not Sunil! (Sunil was in 2012 remake)',
    priority: 'CRITICAL',
  },
  {
    searchTitle: 'Sita Rama Kalyanam',
    searchYear: 1986,
    updates: {
      hero: 'Nandamuri Balakrishna',
      director: 'Jandhyala',
      our_rating: 6.8,
    },
    shouldPublish: true,
    notes: 'Director: Jandhyala (not NTR)',
    priority: 'CRITICAL',
  },
  
  // HIGH - Title Fixes
  {
    searchTitle: 'Vikram',
    searchYear: 2005,
    updates: {
      title_en: 'Vikramarkudu',
      hero: 'Ravi Teja',
      director: 'S. S. Rajamouli',
      our_rating: 8.1,
    },
    shouldPublish: true,
    notes: 'Fix title: Vikramarkudu (Rajamouli blockbuster)',
    priority: 'HIGH',
  },
  {
    searchTitle: 'మెంటల్',
    searchYear: 2016,
    updates: {
      title_en: 'Mental (Appatlo Okadundevadu)',
      hero: 'Sree Vishnu',
      director: 'Sagar K Chandra',
      our_rating: 7.6,
    },
    shouldPublish: true,
    notes: 'Fix title and director',
    priority: 'HIGH',
  },
  
  // HIGH - Add Missing Hero
  {
    searchTitle: 'Bhale Mogudu Bhale Pellam',
    searchYear: 2011,
    updates: {
      hero: 'Rajendra Prasad',
      director: 'Dinesh Baboo',
      our_rating: 5.2,
    },
    shouldPublish: true,
    notes: 'Add hero: Rajendra Prasad',
    priority: 'HIGH',
  },
  
  // NORMAL - Verify & Publish
  {
    searchTitle: 'Shubhapradam',
    searchYear: 2010,
    updates: {
      hero: 'Allari Naresh',
      director: 'K. Viswanath',
      our_rating: 6.1,
    },
    shouldPublish: true,
    notes: 'Musical drama by K. Viswanath',
    priority: 'NORMAL',
  },
  {
    searchTitle: 'Betting Bangaraju',
    searchYear: 2010,
    updates: {
      hero: 'Allari Naresh',
      director: 'E. Sattibabu',
      our_rating: 5.8,
    },
    shouldPublish: true,
    notes: 'Romantic comedy',
    priority: 'NORMAL',
  },
  
  // SPECIAL - Unreleased (Update but don't publish)
  {
    searchTitle: 'Salaar: Part 2 – Shouryanga Parvam',
    searchYear: 2023,
    updates: {
      release_year: 2026,
      hero: 'Prabhas',
      director: 'Prashanth Neel',
    },
    shouldPublish: false, // Don't publish unreleased films
    notes: 'Unreleased film - update data but don\'t publish',
    priority: 'NORMAL',
  },
];

async function applyTeluguFixes() {
  console.log('🚀 Applying Critical Telugu Corrections...\n');
  console.log('='.repeat(80));
  
  const results = {
    fixed: [] as string[],
    published: [] as string[],
    skipped: [] as string[],
    errors: [] as { title: string; error: string }[],
  };
  
  // Sort by priority
  const sortedFixes = [...teluguFixes].sort((a, b) => {
    const priorityOrder = { CRITICAL: 0, HIGH: 1, NORMAL: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  for (const fix of sortedFixes) {
    const priorityLabel = fix.priority === 'CRITICAL' ? '🚨' : 
                          fix.priority === 'HIGH' ? '⚡' : '📽️';
    
    console.log(`\n${priorityLabel} ${fix.searchTitle} (${fix.searchYear})`);
    console.log(`   Priority: ${fix.priority}`);
    console.log(`   Notes: ${fix.notes}`);
    
    try {
      // Find movie by title and year
      const { data: movies, error: findError } = await supabase
        .from('movies')
        .select('id, title_en, release_year, hero, director, is_published')
        .eq('title_en', fix.searchTitle)
        .eq('release_year', fix.searchYear)
        .limit(2);
      
      if (findError) {
        console.log(`   ❌ Search error: ${findError.message}`);
        results.errors.push({ title: fix.searchTitle, error: findError.message });
        continue;
      }
      
      if (!movies || movies.length === 0) {
        console.log(`   ❌ Not found in database`);
        results.errors.push({ title: fix.searchTitle, error: 'Not found' });
        continue;
      }
      
      if (movies.length > 1) {
        console.log(`   ⚠️  Multiple matches (${movies.length}), using first`);
      }
      
      const movie = movies[0];
      console.log(`   ✓ Found: ${movie.id}`);
      console.log(`   Current: ${movie.hero || 'no hero'} | ${movie.director || 'no director'} | ${movie.release_year}`);
      
      // Apply updates
      const updates: any = { ...fix.updates };
      if (fix.shouldPublish && fix.updates.release_year && fix.updates.release_year <= 2024) {
        updates.is_published = true;
      }
      
      const { error: updateError } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', movie.id);
      
      if (updateError) {
        console.log(`   ❌ Update failed: ${updateError.message}`);
        results.errors.push({ title: fix.searchTitle, error: updateError.message });
        continue;
      }
      
      console.log(`   ✅ Updated!`);
      if (fix.updates.title_en) console.log(`      Title: ${fix.updates.title_en}`);
      if (fix.updates.release_year) console.log(`      Year: ${fix.updates.release_year}`);
      if (fix.updates.hero) console.log(`      Hero: ${fix.updates.hero}`);
      if (fix.updates.director) console.log(`      Director: ${fix.updates.director}`);
      
      results.fixed.push(fix.searchTitle);
      
      if (fix.shouldPublish && (!fix.updates.release_year || fix.updates.release_year <= 2024)) {
        console.log(`   ✅ Published!`);
        results.published.push(fix.searchTitle);
      } else {
        console.log(`   ⏭️  Not published (unreleased or future film)`);
        results.skipped.push(fix.searchTitle);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      results.errors.push({ title: fix.searchTitle, error: String(error) });
    }
  }
  
  // Final Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RESULTS');
  console.log('='.repeat(80));
  
  console.log(`\n✅ Fixed & Updated: ${results.fixed.length}`);
  results.fixed.forEach(item => console.log(`   - ${item}`));
  
  console.log(`\n📢 Published: ${results.published.length}`);
  results.published.forEach(item => console.log(`   - ${item}`));
  
  console.log(`\n⏭️  Skipped Publishing: ${results.skipped.length}`);
  results.skipped.forEach(item => console.log(`   - ${item}`));
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors: ${results.errors.length}`);
    results.errors.forEach(item => console.log(`   - ${item.title}: ${item.error}`));
  }
  
  // Get updated counts
  const { count: teluguPublished } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('language', 'Telugu');
  
  const { count: teluguUnpublished } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', false)
    .eq('language', 'Telugu');
  
  console.log('\n' + '='.repeat(80));
  console.log('📈 DATABASE STATUS');
  console.log('='.repeat(80));
  console.log(`Telugu Published: ${teluguPublished || 'unknown'}`);
  console.log(`Telugu Unpublished: ${teluguUnpublished || 'unknown'}`);
  console.log('='.repeat(80));
  
  // Show breakdown by priority
  const critical = sortedFixes.filter(f => f.priority === 'CRITICAL' && results.fixed.includes(f.searchTitle)).length;
  const high = sortedFixes.filter(f => f.priority === 'HIGH' && results.fixed.includes(f.searchTitle)).length;
  const normal = sortedFixes.filter(f => f.priority === 'NORMAL' && results.fixed.includes(f.searchTitle)).length;
  
  console.log('\n🎯 By Priority:');
  console.log(`   CRITICAL: ${critical}/${sortedFixes.filter(f => f.priority === 'CRITICAL').length} fixed`);
  console.log(`   HIGH: ${high}/${sortedFixes.filter(f => f.priority === 'HIGH').length} fixed`);
  console.log(`   NORMAL: ${normal}/${sortedFixes.filter(f => f.priority === 'NORMAL').length} fixed`);
  
  return results;
}

applyTeluguFixes()
  .then((results) => {
    console.log('\n✅ Telugu critical corrections applied!');
    console.log(`\n🎉 ${results.published.length} movies published!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
