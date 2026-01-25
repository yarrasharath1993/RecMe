const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  const wikiTitles = [
    { title: 'Kushi', year: 2001 },
    { title: 'Nuvvu Vastavani', year: 2000 },
    { title: 'Dhairyam', year: 2005 },
    { title: 'Desamuduru', year: 2007 },
  ];
  
  console.log('Checking exact database titles:\n');
  
  for (const wiki of wikiTitles) {
    const { data } = await supabase
      .from('movies')
      .select('title_en, release_year')
      .eq('release_year', wiki.year)
      .ilike('title_en', `%${wiki.title}%`)
      .limit(1);
    
    if (data && data[0]) {
      console.log(`Wikipedia: "${wiki.title}" (${wiki.year})`);
      console.log(`Database:  "${data[0].title_en}" (${data[0].release_year})`);
      console.log(`Match: ${wiki.title === data[0].title_en ? 'EXACT' : 'DIFFERENT'}\n`);
    }
  }
})();
