import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const titles = [
  'Marana Porali',
  'Kalabha Mazha', 
  'Shubhapradam',
  'Betting Bangaraju',
  'Gunda Gardi'
];

async function main() {
  for (const title of titles) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year, hero, rating, poster_url')
      .ilike('title_en', `%${title}%`)
      .single();
    
    if (data) {
      console.log(`${data.id},${data.title_en},${data.release_year},${data.hero || 'N/A'},${data.rating || 'N/A'}`);
    }
  }
}

main();
