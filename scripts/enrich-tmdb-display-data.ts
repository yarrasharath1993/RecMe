import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
const RATE_LIMIT_DELAY = 300; // ms between API calls

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchFromTMDB(tmdbId: number) {
  try {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=credits`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching TMDB data for ${tmdbId}:`, error);
    return null;
  }
}

function extractSupportingCast(credits: any, heroName: string, heroineName?: string) {
  if (!credits || !credits.cast) return [];
  
  const supportingCast: any[] = [];
  const heroNames = heroName.toLowerCase().split(',').map(n => n.trim());
  const heroineNames = heroineName ? heroineName.toLowerCase().split(',').map(n => n.trim()) : [];
  
  // Get top 10 cast members (excluding hero and heroine)
  const castMembers = credits.cast.slice(0, 15);
  
  for (const member of castMembers) {
    const memberName = member.name.toLowerCase();
    const isHero = heroNames.some(h => memberName.includes(h) || h.includes(memberName));
    const isHeroine = heroineNames.some(h => memberName.includes(h) || h.includes(memberName));
    
    if (!isHero && !isHeroine && member.character) {
      supportingCast.push({
        name: member.name,
        character: member.character,
        type: 'supporting'
      });
      
      if (supportingCast.length >= 8) break;
    }
  }
  
  return supportingCast;
}

async function enrichDisplayData(actorName: string, options: { execute: boolean; limit: number }) {
  console.log(`🎬 Enriching display data for ${actorName}...\n`);
  
  if (!TMDB_API_KEY) {
    console.error('❌ TMDB_API_KEY not found in environment variables');
    return;
  }
  
  // Fetch movies with TMDB IDs that are missing display data
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug, hero, heroine, tmdb_id, poster_url, synopsis, tagline, supporting_cast')
    .ilike('hero', `%${actorName}%`)
    .not('tmdb_id', 'is', null)
    .order('release_year', { ascending: false })
    .limit(options.limit);
  
  if (!movies || movies.length === 0) {
    console.log('No movies found with TMDB IDs');
    return;
  }
  
  // Filter movies that need enrichment
  const moviesToEnrich = movies.filter(m => {
    return !m.poster_url || !m.synopsis || !m.tagline || !m.supporting_cast || m.supporting_cast.length === 0;
  });
  
  console.log(`Found ${moviesToEnrich.length} movies needing enrichment out of ${movies.length} total\n`);
  
  if (!options.execute) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  let enrichedCount = 0;
  let errorCount = 0;
  
  for (const movie of moviesToEnrich) {
    console.log(`\n🎬 ${movie.release_year} | ${movie.title_en} (TMDB: ${movie.tmdb_id})`);
    
    const tmdbData = await fetchFromTMDB(movie.tmdb_id);
    
    if (!tmdbData) {
      console.log('   ❌ Failed to fetch TMDB data');
      errorCount++;
      await sleep(RATE_LIMIT_DELAY);
      continue;
    }
    
    const updates: any = {};
    const changes: string[] = [];
    
    // Poster URL
    if (!movie.poster_url && tmdbData.poster_path) {
      updates.poster_url = `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`;
      changes.push('Poster');
    }
    
    // Synopsis
    if (!movie.synopsis && tmdbData.overview) {
      updates.synopsis = tmdbData.overview;
      changes.push('Synopsis');
    }
    
    // Tagline
    if (!movie.tagline && tmdbData.tagline) {
      updates.tagline = tmdbData.tagline;
      changes.push('Tagline');
    }
    
    // Supporting Cast
    if ((!movie.supporting_cast || movie.supporting_cast.length === 0) && tmdbData.credits) {
      const supportingCast = extractSupportingCast(tmdbData.credits, movie.hero, movie.heroine);
      if (supportingCast.length > 0) {
        updates.supporting_cast = supportingCast;
        changes.push(`Supporting Cast (${supportingCast.length})`);
      }
    }
    
    if (Object.keys(updates).length === 0) {
      console.log('   ℹ️  No updates needed');
      await sleep(RATE_LIMIT_DELAY);
      continue;
    }
    
    console.log(`   📝 Updates: ${changes.join(', ')}`);
    
    if (options.execute) {
      const { error } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', movie.id);
      
      if (error) {
        console.log(`   ❌ Error updating: ${error.message}`);
        errorCount++;
      } else {
        console.log('   ✅ Updated successfully');
        enrichedCount++;
      }
    } else {
      console.log('   🔍 Would update (dry run)');
      enrichedCount++;
    }
    
    await sleep(RATE_LIMIT_DELAY);
  }
  
  console.log(`\n\n📊 Summary:`);
  console.log(`   ✅ Enriched: ${enrichedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total processed: ${moviesToEnrich.length}`);
  console.log(`\n✨ Display data enrichment complete!\n`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string = ''): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const actor = getArg('actor', 'Chiranjeevi');
const execute = hasFlag('execute');
const limit = parseInt(getArg('limit', '50'));

enrichDisplayData(actor, { execute, limit }).catch(console.error);
