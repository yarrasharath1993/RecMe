import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 9 films to add Chiranjeevi to supporting cast
const FILMS_TO_UPDATE = [
  { title: 'Mana Voori Pandavulu', year: 1978, type: 'supporting' },
  { title: 'Tayaramma Bangarayya', year: 1979, type: 'cameo' },
  { title: 'Kottapeta Rowdy', year: 1980, type: 'cameo' },
  { title: 'Maa Inti Premayanam', year: 1983, type: 'cameo' },
  { title: 'Hands Up', year: 2000, type: 'cameo' },
  { title: 'Style', year: 2006, type: 'cameo' },
  { title: 'Magadheera', year: 2009, type: 'cameo' },
  { title: 'Jagadguru Adi Shankara', year: 2013, type: 'cameo' },
  { title: 'Bruce Lee: The Fighter', year: 2015, type: 'cameo' },
];

async function update() {
  console.log('\n=== ADDING CHIRANJEEVI TO 9 FILMS ===\n');
  
  let updated = 0;
  
  for (const film of FILMS_TO_UPDATE) {
    // Try exact match first, then partial
    let { data: current } = await supabase
      .from('movies')
      .select('id, title_en, supporting_cast')
      .eq('title_en', film.title)
      .eq('release_year', film.year)
      .single();
    
    if (!current) {
      // Try partial match
      const { data: partial } = await supabase
        .from('movies')
        .select('id, title_en, supporting_cast')
        .ilike('title_en', '%' + film.title.split(' ')[0] + '%')
        .eq('release_year', film.year)
        .limit(1);
      
      current = partial?.[0] ?? null;
    }
    
    if (!current) {
      console.log('? ' + film.title + ' (' + film.year + ') - not found');
      continue;
    }
    
    // Check if already has Chiranjeevi
    const cast = current.supporting_cast || [];
    if (cast.some((c: any) => c.name?.includes('Chiranjeevi'))) {
      console.log('? ' + current.title_en + ' - already has Chiranjeevi');
      continue;
    }
    
    // Add Chiranjeevi
    const newCast = [{ name: 'Chiranjeevi', type: film.type, order: 1 }, ...cast.map((c: any, i: number) => ({...c, order: i + 2}))];
    
    const { error } = await supabase
      .from('movies')
      .update({ supporting_cast: newCast })
      .eq('id', current.id);
    
    if (error) {
      console.log('❌ ' + current.title_en + ': ' + error.message);
    } else {
      updated++;
      console.log('✓ ' + current.title_en + ' (' + film.year + ') - Added Chiranjeevi (' + film.type + ')');
    }
  }
  
  // Add Prema Natakam as new movie
  console.log('\n=== ADDING NEW MOVIE: PREMA NATAKAM ===\n');
  
  const { error: insertError } = await supabase
    .from('movies')
    .insert({
      title_en: 'Prema Natakam',
      title_te: 'Prema Natakam',
      release_year: 1981,
      hero: 'Chiranjeevi, Murali Mohan',
      heroine: 'Sharada',
      slug: 'prema-natakam-1981',
      is_published: false,
      language: 'Telugu',
    });
  
  if (insertError) {
    if (insertError.code === '23505') {
      console.log('? Prema Natakam (1981) already exists');
    } else {
      console.log('❌ Prema Natakam: ' + insertError.message);
    }
  } else {
    console.log('✓ Added Prema Natakam (1981) - Heroes: Chiranjeevi, Murali Mohan - Heroine: Sharada');
    updated++;
  }
  
  console.log('\nTotal updated/added: ' + updated);
  
  // Final count
  const { count: heroCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .ilike('hero', '%Chiranjeevi%')
    .not('hero', 'ilike', '%Sarja%');
  
  console.log('\n=== FINAL CHIRANJEEVI COUNT ===');
  console.log('Lead/Multi-hero: ' + heroCount);
}

update();
