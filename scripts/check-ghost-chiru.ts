import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;

const SUSPECT_FILMS = [
  { title: 'Rudra Tandava', tmdb_id: 540012 },
  { title: 'Aatagara', tmdb_id: 400859 },
  { title: 'Auto Jaani', tmdb_id: 341935 },
  { title: 'Mana Shankara Vara Prasad Garu', tmdb_id: 1146313 },
];

async function checkGhosts() {
  console.log('\n=== CHECKING POTENTIAL GHOST ENTRIES ===\n');
  
  for (const film of SUSPECT_FILMS) {
    console.log(`${film.title} (TMDB: ${film.tmdb_id})`);
    
    const url = `https://api.themoviedb.org/3/movie/${film.tmdb_id}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
    const res = await fetch(url);
    const data = await res.json();
    
    console.log(`  Title: ${data.title}`);
    console.log(`  Language: ${data.original_language}`);
    console.log(`  Year: ${data.release_date?.split('-')[0] || 'N/A'}`);
    console.log(`  Top cast:`);
    data.credits?.cast?.slice(0, 3).forEach((c: any) => {
      console.log(`    - ${c.name} (ID: ${c.id})`);
    });
    
    // Check if this is a Kannada film (Chiranjeevi Sarja)
    if (data.original_language === 'kn') {
      console.log(`  ⚠️  KANNADA FILM - likely Chiranjeevi Sarja, not Megastar Chiranjeevi!`);
    }
    
    console.log('');
    await new Promise(r => setTimeout(r, 250));
  }
}

checkGhosts();
