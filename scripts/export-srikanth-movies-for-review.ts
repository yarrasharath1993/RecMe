/**
 * Export all movies with "srikanth" in hero field for manual review
 * Outputs CSV with all relevant details to help assign between two actors
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Movie {
  id: string;
  title_en: string;
  title_te?: string;
  hero: string;
  release_year?: number;
  language?: string;
  director?: string;
  slug: string;
  poster_url?: string;
  is_published: boolean;
}

// Tamil actor Srikanth's known movies (for reference)
const TAMIL_SRIKANTH_MOVIES = [
  'Blackmail', 'Dinasari', 'Konjam Kadhal Konjam Modhal', 'Mathru',
  'Operation Laila', 'Sathamindri Mutham Tha', 'Aanandhapuram Diaries', 'Maya Puthagam',
  'Bagheera', 'Kannai Nambathey', 'Echo', 'Amala', 'Pindam', 'Ravanasura',
  'Maha', 'Coffee with Kadhal', '10th Class Diaries',
  'Mirugaa', 'Y', 'Jai Sena', 'Asalem Jarigindi',
  'Rocky: The Revenge', 'Raagala 24 Gantallo', 'Marshal',
  'Lie',
  'Sowkarpettai', 'Nambiar', 'Sarrainodu',
  'Om Shanti Om',
  'Kathai Thiraikathai Vasanam Iyakkam',
  'Nanban', 'Paagan', 'Hero', 'Nippu',
  'Sathurangam', 'Dhada', 'Uppukandam Brothers Back in Action',
  'Drohi', 'Rasikkum Seemane', 'Police Police',
  'Indira Vizha',
  'Poo', 'Vallamai Tharayo',
  'Aadavari Matalaku Ardhalu Verule',
  'Mercury Pookkal', 'Uyir', 'Kizhakku Kadarkarai Salai',
  'Kana Kandaen', 'Oru Naal Oru Kanavu', 'Bambara Kannaley',
  'Aayitha Ezhuthu', 'Bose', 'Varnajalam',
  'Parthiban Kanavu', 'Priyamana Thozhi', 'Manasellam', 'Okariki Okaru',
  'Roja Kootam', 'April Mathathil'
].map(m => m.toLowerCase());

function escapeCsv(value: string | null | undefined): string {
  if (!value) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function checkIfTamilSrikanth(title: string): boolean {
  const titleLower = title.toLowerCase();
  return TAMIL_SRIKANTH_MOVIES.some(knownTitle => 
    titleLower.includes(knownTitle) || knownTitle.includes(titleLower)
  );
}

async function exportSrikanthMovies() {
  console.log('🔍 Fetching all movies with "srikanth" in hero field...\n');

  // Fetch all movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, title_te, hero, release_year, language, director, slug, poster_url, is_published')
    .ilike('hero', '%srikanth%')
    .order('release_year', { ascending: false })
    .order('title_en');

  if (error) {
    console.error(`❌ Error fetching movies: ${error.message}`);
    process.exit(1);
  }

  if (!movies || movies.length === 0) {
    console.log('No movies found');
    return;
  }

  console.log(`✅ Found ${movies.length} movies\n`);

  // Prepare CSV data
  const csvRows: string[] = [];
  
  // Header
  csvRows.push([
    'id',
    'title_en',
    'title_te',
    'hero',
    'release_year',
    'language',
    'director',
    'slug',
    'is_published',
    'suggested_actor',
    'notes'
  ].join(','));

  // Data rows
  movies.forEach((movie: Movie) => {
    const heroLower = (movie.hero || '').toLowerCase();
    const titleLower = (movie.title_en || '').toLowerCase();
    
    // Determine suggested actor
    let suggestedActor = '';
    let notes = '';

    // Check if hero name contains "meka" or "addala"
    if (heroLower.includes('meka') || heroLower.includes('addala')) {
      suggestedActor = 'Srikanth Meka';
      notes = 'Hero name contains "Meka" or "Addala"';
    }
    // Check if it's in Tamil Srikanth's known list
    else if (checkIfTamilSrikanth(movie.title_en || '')) {
      suggestedActor = 'Tamil Srikanth';
      notes = 'Matches known Tamil Srikanth filmography';
    }
    // Check by language
    else if (movie.language === 'Telugu') {
      suggestedActor = 'Srikanth Meka';
      notes = 'Telugu movie (Srikanth Meka is Telugu actor)';
    }
    else if (movie.language === 'Tamil' || movie.language === 'Malayalam') {
      suggestedActor = 'Tamil Srikanth';
      notes = `${movie.language} movie (Tamil Srikanth works in Tamil/Malayalam)`;
    }
    // Check by year (Srikanth Meka started in 1991)
    else if (movie.release_year && movie.release_year >= 1991 && !movie.language) {
      suggestedActor = 'Srikanth Meka';
      notes = 'Year >= 1991, no language specified (likely Telugu)';
    }
    else {
      suggestedActor = 'REVIEW NEEDED';
      notes = 'Unable to determine - manual review required';
    }

    csvRows.push([
      escapeCsv(movie.id),
      escapeCsv(movie.title_en),
      escapeCsv(movie.title_te),
      escapeCsv(movie.hero),
      escapeCsv(movie.release_year?.toString()),
      escapeCsv(movie.language),
      escapeCsv(movie.director),
      escapeCsv(movie.slug),
      escapeCsv(movie.is_published ? 'Yes' : 'No'),
      escapeCsv(suggestedActor),
      escapeCsv(notes)
    ].join(','));
  });

  // Write to file
  const outputPath = path.join(process.cwd(), 'SRIKANTH-MOVIES-REVIEW.csv');
  fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf-8');

  console.log(`✅ Exported ${movies.length} movies to: ${outputPath}\n`);

  // Summary statistics
  const bySuggested = movies.reduce((acc, movie) => {
    const heroLower = (movie.hero || '').toLowerCase();
    const titleLower = (movie.title_en || '').toLowerCase();
    
    let suggested = '';
    if (heroLower.includes('meka') || heroLower.includes('addala')) {
      suggested = 'Srikanth Meka';
    } else if (checkIfTamilSrikanth(movie.title_en || '')) {
      suggested = 'Tamil Srikanth';
    } else if (movie.language === 'Telugu') {
      suggested = 'Srikanth Meka';
    } else if (movie.language === 'Tamil' || movie.language === 'Malayalam') {
      suggested = 'Tamil Srikanth';
    } else {
      suggested = 'REVIEW NEEDED';
    }
    
    acc[suggested] = (acc[suggested] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📊 Summary by suggested actor:');
  Object.entries(bySuggested).forEach(([actor, count]) => {
    console.log(`   ${actor}: ${count} movies`);
  });
  console.log('');

  // Language breakdown
  const byLanguage = movies.reduce((acc, movie) => {
    const lang = movie.language || 'Unknown';
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📊 Summary by language:');
  Object.entries(byLanguage).forEach(([lang, count]) => {
    console.log(`   ${lang}: ${count} movies`);
  });
  console.log('');

  // Hero name variations
  const heroVariations = new Set(movies.map(m => m.hero).filter(Boolean));
  console.log(`📊 Hero name variations found: ${heroVariations.size}`);
  heroVariations.forEach(hero => {
    const count = movies.filter(m => m.hero === hero).length;
    console.log(`   "${hero}": ${count} movies`);
  });
  console.log('');

  console.log('✅ Export complete!');
  console.log(`📝 Review the CSV file and update the "suggested_actor" column as needed.`);
  console.log(`   Then use the updated CSV to fix the database.\n`);
}

exportSrikanthMovies()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
