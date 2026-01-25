import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to generate slug
function generateSlug(title: string, year: number): string {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${year}`;
}

// The 7 missing historical movies with detailed information
const MISSING_MOVIES = [
  {
    title_en: 'Chivarku Migiledhi',
    release_year: 1953,
    director: 'Gutha Ramineedu',
    hero: 'Kanta Rao',
    heroine: 'Savitri',
    supporting_cast: ['Gummadi', 'T. Kanakam'],
    genres: ['Psychological Drama', 'Social'],
    synopsis: 'A profound psychological drama that showcased the early versatility of Savitri (Mahanati). The film explores complex emotional themes with nuanced performances.',
    music_director: 'Aswathama',
    producer: 'V.B. Rajendra Prasad',
    production_company: 'Jagapathi Art Pictures',
  },
  {
    title_en: 'Beedala Patlu',
    release_year: 1952,
    director: 'K. Ramnoth',
    hero: 'Chittoor V. Nagaiah',
    heroine: 'Lakshmi Rajyam, Tanguturi Suryakumari',
    supporting_cast: ['C.S.R. Anjaneyulu'],
    genres: ['Epic Drama'],
    synopsis: 'An adaptation of Victor Hugo\'s Les Misérables. This landmark film is known for its dramatic gravity and musical score. Nagaiah plays the role of Jean Valjean/Baru.',
    music_director: 'S.M. Subbaiah Naidu',
    producer: 'K. Ramnoth',
  },
  {
    title_en: 'Returning Soldier',
    release_year: 1945,
    director: 'P. Pullaiah',
    hero: 'Jaggayya',
    heroine: 'Kanchanamala, G. Varalakshmi',
    supporting_cast: [],
    genres: ['Social Realism', 'Drama'],
    synopsis: 'Historically significant for being one of the first Telugu films to address the social reintegration of soldiers following World War II. Features an early role by Jaggayya.',
    producer: 'Ragini Films',
  },
  {
    title_en: 'Bhakta Kabiru',
    release_year: 1944,
    director: 'R. Nagendra Rao',
    hero: 'Chittoor V. Nagaiah',
    heroine: '',
    supporting_cast: [],
    genres: ['Devotional', 'Biographical'],
    synopsis: 'A classic biographical devotional film highlighting the life of the mystic poet Kabir. Features one of Chittoor V. Nagaiah\'s most celebrated roles as the saint-poet Kabir.',
    music_director: 'Chittoor V. Nagaiah',
    producer: 'R. Nagendra Rao',
  },
  {
    title_en: 'Pantulamma',
    release_year: 1943,
    director: 'Y.V. Rao',
    hero: 'Mudigonda Lingamurthy',
    heroine: 'Lakshmi Rajyam',
    supporting_cast: ['P. Suribabu'],
    genres: ['Social Reform', 'Drama'],
    synopsis: 'Notable for its feminist undertones in an era where women\'s education was a radical subject. A pioneering film in Telugu cinema\'s exploration of social issues.',
    music_director: 'B. Rajarao',
    producer: 'Sarathi Films',
  },
  {
    title_en: 'Dharmapatni',
    release_year: 1941,
    director: 'P. Pullaiah',
    hero: 'Uppuluri Hanumantha Rao',
    heroine: 'P. Bhanumathi, Santha Kumari',
    supporting_cast: ['Akkineni Nageswara Rao'],
    genres: ['Social Drama'],
    synopsis: 'Highly significant for being the film that introduced Akkineni Nageswara Rao (ANR) to the screen as a child/teenage artist. A milestone in Telugu cinema history.',
    music_director: 'Saluri Rajeswara Rao',
    producer: 'Famous Films',
  },
  {
    title_en: 'Bhakta Prahlada',
    release_year: 1931,
    director: 'H.M. Reddy',
    hero: 'Valluru Subbaiah',
    heroine: 'Surabhi Kamalabai',
    supporting_cast: ['Master Krishna Rao'],
    genres: ['Mythological', 'First Telugu Talkie'],
    synopsis: 'The most important film in the history of Telugu cinema, marking the transition from silent films to talkies. This was the FIRST Telugu talkie ever made, directed by H.M. Reddy.',
    music_director: 'H.R. Padmanabha Sastry',
    producer: 'H.M. Reddy',
    production_company: 'Krishna Movies',
    cinematographer: 'Goverdhanbhai Patel',
  },
];

async function addMissingMovies() {
  console.log('=== ADDING 7 MISSING HISTORICAL MOVIES ===\n');
  
  let added = 0;
  let updated = 0;
  let errors = 0;
  
  for (const movie of MISSING_MOVIES) {
    const slug = generateSlug(movie.title_en, movie.release_year);
    
    // Check if movie already exists
    const { data: existing } = await supabase
      .from('movies')
      .select('id, title_en, is_published')
      .eq('slug', slug)
      .limit(1)
      .single();
    
    const movieData = {
      title_en: movie.title_en,
      slug: slug,
      release_year: movie.release_year,
      director: movie.director,
      hero: movie.hero || null,
      heroine: movie.heroine || null,
      supporting_cast: movie.supporting_cast || [],
      genres: movie.genres,
      synopsis: movie.synopsis,
      is_published: true,
      updated_at: new Date().toISOString(),
    };
    
    if (existing) {
      // Update existing movie
      const { error } = await supabase
        .from('movies')
        .update(movieData)
        .eq('id', existing.id);
      
      if (error) {
        console.log(`ERR updating ${movie.title_en} (${movie.release_year}): ${error.message}`);
        errors++;
      } else {
        console.log(`UPDATED: ${movie.title_en} (${movie.release_year})`);
        updated++;
      }
    } else {
      // Insert new movie
      const { error } = await supabase
        .from('movies')
        .insert({
          ...movieData,
          created_at: new Date().toISOString(),
        });
      
      if (error) {
        console.log(`ERR adding ${movie.title_en} (${movie.release_year}): ${error.message}`);
        errors++;
      } else {
        console.log(`ADDED: ${movie.title_en} (${movie.release_year}) - ${movie.genres.join(', ')}`);
        added++;
      }
    }
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`Movies added: ${added}`);
  console.log(`Movies updated: ${updated}`);
  console.log(`Errors: ${errors}`);
  
  // Print details of each movie
  console.log('\n=== MOVIE DETAILS ===');
  for (const movie of MISSING_MOVIES) {
    console.log(`\n📽️ ${movie.title_en} (${movie.release_year})`);
    console.log(`   Director: ${movie.director}`);
    console.log(`   Hero: ${movie.hero || 'N/A'}`);
    console.log(`   Heroine: ${movie.heroine || 'N/A'}`);
    console.log(`   Genre: ${movie.genres.join(', ')}`);
    console.log(`   Synopsis: ${movie.synopsis.substring(0, 100)}...`);
  }
}

addMissingMovies().catch(console.error);
