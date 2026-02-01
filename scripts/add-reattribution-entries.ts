#!/usr/bin/env npx tsx
/**
 * Add films back to wrongAttributions with reattribution recommendations
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface WrongAttribution {
  movie_id: string;
  title_en: string;
  release_year: number;
  issue: string;
  confidence: number;
  recommended_action: string;
  priority: string;
  explanation: string;
  fix_steps: string[];
  currentRole?: string;
  correctRole?: string;
  currentField?: string;
  correctField?: string;
}

// Films that need reattribution (not removal)
const REATTRIBUTION_FILMS = [
  { title: 'Rojulu Marayi', year: 1984, correctActors: 'Different actors (Chiranjeevi not in cast)' },
  { title: 'Chalaki Chellamma', year: 1982, correctActors: 'Murali Mohan, Mohan' },
  { title: 'Rudra Tandava', year: 2015, correctActors: 'Different actors (often confused due to similarly named actors)' },
  { title: 'Okkadunnadu', year: 2007, correctActors: 'Different actors (often confused due to dubbing)' },
  { title: 'Aatagara', year: 2015, correctActors: 'Kannada film cast (Chiranjeevi does not appear)' }
];

async function findMovieIds(): Promise<Map<string, string>> {
  const movieIdMap = new Map<string, string>();
  
  for (const film of REATTRIBUTION_FILMS) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year')
      .ilike('title_en', `%${film.title}%`)
      .eq('release_year', film.year)
      .limit(1);
    
    if (error) {
      console.error(`Error finding ${film.title}:`, error);
      continue;
    }
    
    if (data && data.length > 0) {
      const key = `${film.title}-${film.year}`;
      movieIdMap.set(key, data[0].id);
      console.log(`Found: ${film.title} (${film.year}) -> ${data[0].id}`);
    } else {
      console.warn(`Not found in DB: ${film.title} (${film.year})`);
    }
  }
  
  return movieIdMap;
}

function createReattributionEntry(
  movieId: string,
  title: string,
  year: number,
  correctActors: string
): WrongAttribution {
  return {
    movie_id: movieId,
    title_en: title,
    release_year: year,
    issue: 'wrong_attribution',
    confidence: 0.9,
    recommended_action: 'reattribute',
    priority: 'high',
    explanation: `${title} (${year}) is incorrectly attributed to Chiranjeevi. Correct actors: ${correctActors}. This film should be reattributed to the correct cast members.`,
    fix_steps: [
      `Remove Chiranjeevi from hero/cast fields for ${title} (${year})`,
      `Identify correct actors: ${correctActors}`,
      `Reattribute movie to correct actors in appropriate fields (hero, supporting_cast, etc.)`,
      `Verify attribution matches actual cast`
    ]
  };
}

async function main() {
  console.log('Finding movie IDs in database...');
  const movieIdMap = await findMovieIds();
  
  if (movieIdMap.size === 0) {
    console.error('No movies found in database. Cannot proceed.');
    return;
  }
  
  console.log(`\nFound ${movieIdMap.size} movies. Adding to wrongAttributions...`);
  
  // Read current analysis
  const analysisPath = path.join(__dirname, '../reports/chiranjeevi-filmography-analysis.json');
  const analysisContent = fs.readFileSync(analysisPath, 'utf-8');
  const analysisData = JSON.parse(analysisContent);
  
  const filmographyData = analysisData.outputs[0].data;
  
  // Create reattribution entries
  const reattributionEntries: WrongAttribution[] = [];
  
  for (const film of REATTRIBUTION_FILMS) {
    const key = `${film.title}-${film.year}`;
    const movieId = movieIdMap.get(key);
    
    if (movieId) {
      const entry = createReattributionEntry(
        movieId,
        film.title,
        film.year,
        film.correctActors
      );
      reattributionEntries.push(entry);
    } else {
      console.warn(`Skipping ${film.title} - not found in database`);
    }
  }
  
  // Add to wrongAttributions
  filmographyData.wrongAttributions.push(...reattributionEntries);
  
  // Update statistics
  filmographyData.statistics.wrongAttributionCount = filmographyData.wrongAttributions.length;
  
  // Update summary
  const highPriorityMissing = filmographyData.missingMovies.filter(m => m.priority === 'high').length;
  const highPriorityWrong = filmographyData.wrongAttributions.filter(w => w.priority === 'high').length;
  
  filmographyData.summary = `Filmography analysis for ${filmographyData.statistics.totalDiscovered} discovered films. ${filmographyData.statistics.totalInDatabase} films in database (${Math.round((filmographyData.statistics.totalInDatabase / filmographyData.statistics.totalDiscovered) * 100)}% coverage). ${filmographyData.statistics.missingCount} missing films identified (${highPriorityMissing} high priority). ${filmographyData.statistics.wrongAttributionCount} wrong attributions detected (${highPriorityWrong} high priority).`;
  
  // Update timestamp
  filmographyData.timestamp = new Date().toISOString();
  
  // Write updated JSON
  analysisData.outputs[0].data = filmographyData;
  fs.writeFileSync(analysisPath, JSON.stringify(analysisData, null, 2), 'utf-8');
  
  console.log(`\n=== Reattribution Entries Added ===`);
  console.log(`Added ${reattributionEntries.length} films for reattribution`);
  console.log(`Total Wrong Attributions: ${filmographyData.wrongAttributions.length}`);
  console.log(`High Priority Wrong Attributions: ${highPriorityWrong}`);
  console.log(`\nUpdated file: ${analysisPath}`);
}

main().catch(console.error);
