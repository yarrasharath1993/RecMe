import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;

const FILMS_TO_SEARCH = [
  { title: 'Indra', year: 2002 },
  { title: 'Gang Leader', year: 1991 },
  { title: 'Jagadeka Veerudu Athiloka Sundari', year: 1990 },
  { title: 'Rudraveena', year: 1988 },
  { title: 'Tagore', year: 2003 },
];

async function findCorrectIds() {
  console.log('\n=== FINDING CORRECT TMDB IDs FOR CHIRANJEEVI FILMS ===\n');
  
  for (const film of FILMS_TO_SEARCH) {
    console.log(`${film.title} (${film.year})`);
    
    // Search TMDB
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(film.title)}&year=${film.year}`;
    const res = await fetch(url);
    const data = await res.json();
    
    // Find Telugu version
    const teluguResults = data.results?.filter((m: any) => m.original_language === 'te') || [];
    const allResults = data.results || [];
    
    console.log(`  Total results: ${allResults.length}, Telugu: ${teluguResults.length}`);
    
    if (teluguResults.length > 0) {
      const best = teluguResults[0];
      console.log(`  ✅ Found Telugu: "${best.title}" (${best.id})`);
      console.log(`     Release: ${best.release_date}`);
      
      // Get cast to verify
      const castUrl = `https://api.themoviedb.org/3/movie/${best.id}/credits?api_key=${TMDB_API_KEY}`;
      const castRes = await fetch(castUrl);
      const castData = await castRes.json();
      
      const hasChiru = castData.cast?.some((c: any) => c.id === 147079);
      const chiruByName = castData.cast?.find((c: any) => 
        c.name.toLowerCase().includes('chiranjeevi')
      );
      
      if (hasChiru) {
        console.log(`     ✅ Chiranjeevi (147079) in cast`);
      } else if (chiruByName) {
        console.log(`     ⚠️  Found "${chiruByName.name}" (ID: ${chiruByName.id})`);
      } else {
        console.log(`     Top cast: ${castData.cast?.slice(0, 3).map((c: any) => c.name).join(', ') || 'N/A'}`);
      }
    } else if (allResults.length > 0) {
      console.log(`  No Telugu results. Other languages:`);
      allResults.slice(0, 3).forEach((m: any) => {
        console.log(`    - "${m.title}" (${m.id}) - ${m.original_language}`);
      });
    } else {
      console.log(`  ❌ No results found`);
    }
    
    console.log('');
    await new Promise(r => setTimeout(r, 300));
  }
}

findCorrectIds();
