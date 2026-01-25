import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugNagarjunaIssue() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 DEBUGGING NAGARJUNA PROFILE ISSUES');
  console.log('='.repeat(80) + '\n');

  // 1. Check celebrities table
  console.log('1️⃣  Checking celebrities table...\n');
  const { data: celebrities, error: celebError } = await supabase
    .from('celebrities')
    .select('id, name, slug, slug_aliases')
    .ilike('name', '%nagarjuna%');

  if (celebError) {
    console.log('Error:', celebError);
  } else {
    console.log(`Found ${celebrities?.length} celebrity entries:`);
    celebrities?.forEach(c => {
      console.log(`  - ${c.name}`);
      console.log(`    Slug: ${c.slug}`);
      console.log(`    Aliases: ${c.slug_aliases || 'None'}`);
      console.log(`    ID: ${c.id}\n`);
    });
  }

  // 2. Check movie counts for different name variations
  console.log('2️⃣  Checking movie counts by name variations...\n');
  
  const nameVariations = [
    'Akkineni Nagarjuna',
    'Nagarjuna Akkineni',
    'Nagarjuna',
    'nagarjuna',
  ];

  for (const name of nameVariations) {
    const { count } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .or(`hero.ilike.%${name}%,heroine.ilike.%${name}%,director.ilike.%${name}%`);

    console.log(`  "${name}": ${count} movies`);
  }

  // 3. Get all movies with Nagarjuna in any field
  console.log('\n3️⃣  Getting all Nagarjuna movies...\n');
  
  const { data: allMovies, error: moviesError } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, director, language, is_published')
    .eq('is_published', true)
    .or('hero.ilike.%nagarjuna%,heroine.ilike.%nagarjuna%,director.ilike.%nagarjuna%');

  if (moviesError) {
    console.log('Error:', moviesError);
  } else {
    console.log(`Total movies found: ${allMovies?.length}\n`);
    
    // Group by role
    const asHero = allMovies?.filter(m => m.hero?.toLowerCase().includes('nagarjuna')) || [];
    const asDirector = allMovies?.filter(m => m.director?.toLowerCase().includes('nagarjuna')) || [];
    
    console.log(`  As Hero: ${asHero.length} movies`);
    console.log(`  As Director: ${asDirector.length} movies`);
    
    // Group by language
    const languages = new Map<string, number>();
    allMovies?.forEach(m => {
      const lang = m.language || 'Unknown';
      languages.set(lang, (languages.get(lang) || 0) + 1);
    });
    
    console.log('\n  By Language:');
    languages.forEach((count, lang) => {
      console.log(`    ${lang}: ${count} movies`);
    });

    // Sample hero field values
    console.log('\n  Sample hero field values:');
    const heroValues = new Set<string>();
    asHero.slice(0, 20).forEach(m => {
      if (m.hero && m.hero.toLowerCase().includes('nagarjuna')) {
        heroValues.add(m.hero);
      }
    });
    heroValues.forEach(h => console.log(`    - "${h}"`));
  }

  // 4. Check what the profile API would return
  console.log('\n4️⃣  Simulating profile API query for "nagarjuna" slug...\n');
  
  const { data: profileMovies, error: profileError } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, director, language')
    .eq('is_published', true)
    .or('hero.ilike.%nagarjuna%,heroine.ilike.%nagarjuna%,director.ilike.%nagarjuna%');

  if (profileError) {
    console.log('Error:', profileError);
  } else {
    console.log(`Profile API would return: ${profileMovies?.length} movies`);
  }

  // 5. Check search aggregation issue
  console.log('\n5️⃣  Checking search aggregation (name normalization)...\n');
  
  const { data: searchMovies } = await supabase
    .from('movies')
    .select('hero, director')
    .eq('is_published', true)
    .or('hero.ilike.%nagarjuna%,director.ilike.%nagarjuna%');

  const nameOccurrences = new Map<string, number>();
  
  searchMovies?.forEach(m => {
    [m.hero, m.director].forEach(field => {
      if (field && field.toLowerCase().includes('nagarjuna')) {
        // Split by comma for multi-cast
        const names = field.split(',').map(n => n.trim());
        names.forEach(name => {
          if (name.toLowerCase().includes('nagarjuna')) {
            nameOccurrences.set(name, (nameOccurrences.get(name) || 0) + 1);
          }
        });
      }
    });
  });

  console.log('  Name variations in database:');
  Array.from(nameOccurrences.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      console.log(`    "${name}": ${count} occurrences`);
    });

  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`\n✅ Celebrity entries: ${celebrities?.length}`);
  console.log(`✅ Total movies (broad search): ${allMovies?.length}`);
  console.log(`✅ Profile API count: ${profileMovies?.length}`);
  console.log(`✅ Name variations: ${nameOccurrences.size}`);
  console.log('\n' + '='.repeat(80) + '\n');
}

debugNagarjunaIssue()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
