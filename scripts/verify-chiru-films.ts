import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;

const FILMS_TO_CHECK = [
  { title: 'Indra', tmdb_id: 143649 },
  { title: 'Gang Leader', tmdb_id: 279096 },
  { title: 'Jagadeka Veerudu Athiloka Sundari', tmdb_id: 115020 },
  { title: 'Rudraveena', tmdb_id: 115024 },
  { title: 'Khaidi No.150', tmdb_id: 407532 },
];

async function verifyFilms() {
  console.log('\n=== VERIFYING CHIRANJEEVI FILMS ON TMDB ===\n');
  console.log('Chiranjeevi TMDB Person ID: 147079\n');
  
  for (const film of FILMS_TO_CHECK) {
    console.log(`${film.title} (TMDB ID: ${film.tmdb_id})`);
    
    const url = `https://api.themoviedb.org/3/movie/${film.tmdb_id}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.credits?.cast) {
      console.log('  No cast data found');
      continue;
    }
    
    // Check if Chiranjeevi (ID 147079) is in cast
    const chiranjeevi = data.credits.cast.find((c: any) => c.id === 147079);
    
    console.log(`  Language: ${data.original_language}`);
    console.log(`  Top 3 cast:`);
    data.credits.cast.slice(0, 3).forEach((c: any) => {
      console.log(`    - ${c.name} (ID: ${c.id}) as "${c.character || 'N/A'}"`);
    });
    
    if (chiranjeevi) {
      console.log(`  ✅ Chiranjeevi found in cast (order: ${chiranjeevi.order})`);
    } else {
      const hasName = data.credits.cast.some((c: any) => 
        c.name.toLowerCase().includes('chiranjeevi')
      );
      if (hasName) {
        const found = data.credits.cast.find((c: any) => 
          c.name.toLowerCase().includes('chiranjeevi')
        );
        console.log(`  ⚠️  Found by name: "${found.name}" (ID: ${found.id}) - DIFFERENT ID!`);
      } else {
        console.log(`  ❌ Chiranjeevi NOT in cast`);
      }
    }
    console.log('');
    
    await new Promise(r => setTimeout(r, 250));
  }
}

verifyFilms();
