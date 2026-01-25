#!/usr/bin/env npx tsx
/**
 * TURBO POSTER FETCH
 * 
 * Multi-source poster fetching from:
 * - Wikipedia Commons
 * - IMPAwards
 * - IMDb
 * - TMDB (fallback)
 * - Wikipedia pages
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;

interface PosterSource {
  id: string;
  title: string;
  year: number;
  sourceUrl: string;
  sourceType: 'wikipedia' | 'imdb' | 'impawards' | 'wikimedia' | 'social' | 'tmdb';
  notes: string;
}

// User-provided poster sources
const POSTER_SOURCES: PosterSource[] = [
  { id: 'bbf3b8b2-ff2a-4ded-a6c3-86e9c9f17a7e', title: 'Kothala Raayudu', year: 1979, sourceUrl: 'https://en.wikipedia.org/wiki/Kothala_Raayudu', sourceType: 'wikipedia', notes: 'Wikipedia page' },
  { id: 'd230d639-8927-40d7-9889-79f95e18d21f', title: 'Sri Rambantu', year: 1979, sourceUrl: 'https://www.imdb.com/title/tt0246251/mediaindex/', sourceType: 'imdb', notes: 'IMDb gallery' },
  { id: '8182275f-e88d-4453-b855-4bb1695ef80c', title: 'Badrinath', year: 2011, sourceUrl: 'www.impawards.com', sourceType: 'impawards', notes: 'IMPAwards' },
  { id: '6212f700-84e3-4c84-bedc-570a48747a3d', title: 'Nizhal Thedum Nenjangal', year: 1982, sourceUrl: 'www.instagram.com', sourceType: 'social', notes: 'Instagram' },
  { id: 'd20403fb-8432-4565-85c4-961d128206cb', title: 'Well If You Know Me', year: 2015, sourceUrl: 'www.facebook.com', sourceType: 'social', notes: 'Yennai Arindhaal' },
  { id: 'f6069bac-c8e0-43a6-9742-22cd0cb22ac1', title: 'Adarsham', year: 1952, sourceUrl: 'upload.wikimedia.org', sourceType: 'wikimedia', notes: 'Commons' },
  { id: '8892bf0a-d4fb-45c9-8cd6-5ca00fbdd80a', title: 'Bratuku Theruvu', year: 1953, sourceUrl: 'upload.wikimedia.org', sourceType: 'wikimedia', notes: 'Commons' },
  { id: 'f86df043-4436-46ee-a4b6-6889d3b29f2e', title: 'Pathini Deivam', year: 1957, sourceUrl: 'upload.wikimedia.org', sourceType: 'wikimedia', notes: 'Commons' },
  { id: '426e74fb-e35c-49c7-b5dd-ec88d9bd53c3', title: 'Padhi Bhakti', year: 1958, sourceUrl: 'upload.wikimedia.org', sourceType: 'wikimedia', notes: 'Commons' },
  { id: 'aa6a8a7d-f47e-42a0-b938-3145ad479fb3', title: 'Kaathavaraayan', year: 1958, sourceUrl: 'upload.wikimedia.org', sourceType: 'wikimedia', notes: 'Commons' },
  { id: '5d95bc5d-9490-4664-abc6-d2a9e29a05a8', title: 'Kuravanji', year: 1960, sourceUrl: 'upload.wikimedia.org', sourceType: 'wikimedia', notes: 'Commons' },
  { id: '7f0b003c-b15f-4087-9003-0efc1d959658', title: 'Paarthaal Pasi Theerum', year: 1962, sourceUrl: 'upload.wikimedia.org', sourceType: 'wikimedia', notes: 'Commons' },
  { id: '4bf8c217-ffe2-489d-809d-50a499ac3cd1', title: 'Kai Koduttha Dheivam', year: 1964, sourceUrl: 'upload.wikimedia.org', sourceType: 'wikimedia', notes: 'Commons' },
  { id: '3bbeed9a-30c4-458c-827a-11f4df9582c4', title: 'Poojaikku Vandha Malar', year: 1965, sourceUrl: 'upload.wikimedia.org', sourceType: 'wikimedia', notes: 'Commons' },
  { id: '2142390d-8c14-4236-9aae-eb20edaa95cd', title: 'Shri Krishna Pandaviyam', year: 1966, sourceUrl: 'upload.wikimedia.org', sourceType: 'wikimedia', notes: 'Commons' },
  { id: '5d98fdb3-4b6e-4037-a7ea-02794d6a00a4', title: 'Shri Krishnavataram', year: 1967, sourceUrl: 'upload.wikimedia.org', sourceType: 'wikimedia', notes: 'Commons' },
  { id: '1196ac9f-472a-446a-9f7b-41b8ad8bdb75', title: 'Iddaru Ammayilu', year: 1972, sourceUrl: 'upload.wikimedia.org', sourceType: 'wikimedia', notes: 'Commons' },
  { id: '2ced2102-12ab-4391-9e5b-40ae526c7b11', title: 'Amma Mata', year: 1972, sourceUrl: 'upload.wikimedia.org', sourceType: 'wikimedia', notes: 'Commons' },
  { id: 'b7aad561-d88c-44b1-bd47-7076d669d0b5', title: 'Jeevana Theeralu', year: 1977, sourceUrl: 'upload.wikimedia.org', sourceType: 'wikimedia', notes: 'Commons' },
  { id: 'f0b669a6-227e-46c8-bdca-8778aef704d8', title: 'Bangaru Bommalu', year: 1977, sourceUrl: 'upload.wikimedia.org', sourceType: 'wikimedia', notes: 'Commons' },
  { id: '2d2300e8-75f4-40fa-9d89-11b728749949', title: 'Karunai Ullam', year: 1978, sourceUrl: 'upload.wikimedia.org', sourceType: 'wikimedia', notes: 'Commons' },
  { id: '1a2d75cb-f7af-44c0-b7ad-eaf4b4bcfc31', title: 'Karunamayudu', year: 1978, sourceUrl: 'upload.wikimedia.org', sourceType: 'wikimedia', notes: 'Commons' },
];

// Add missing movies
const MISSING_MOVIES = [
  { id: '092508fb-f084-443b-aa50-3c6d06b6ec12', title: 'Chennakeshava Reddy', year: 2002 },
  { id: '1d57f0ef-c4ed-4b34-b453-b608ce213ba3', title: 'Chaithanya', year: 1991 },
  { id: '95639c8c-fad3-4ef9-b2a3-0e1b06040346', title: 'Aaj Ka Goonda Raj', year: 1992 },
];

const args = process.argv.slice(2);
const hasFlag = (name: string): boolean => args.includes(`--${name}`);
const EXECUTE = hasFlag('execute');

async function searchWikimediaCommons(title: string, year: number): Promise<string | null> {
  try {
    // Search Wikimedia Commons for the film poster
    const searchQuery = `${title} ${year} poster`;
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srnamespace=6&format=json&origin=*`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.query?.search && data.query.search.length > 0) {
      // Get first result
      const firstResult = data.query.search[0];
      const filename = firstResult.title.replace('File:', '');
      
      // Get image info
      const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
      const imageResponse = await fetch(imageInfoUrl);
      
      if (!imageResponse.ok) return null;
      
      const imageData = await imageResponse.json();
      const pages = imageData.query?.pages;
      
      if (pages) {
        const pageId = Object.keys(pages)[0];
        const imageUrl = pages[pageId]?.imageinfo?.[0]?.url;
        
        if (imageUrl) {
          return imageUrl;
        }
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function searchWikipediaPage(url: string): Promise<string | null> {
  try {
    // Extract title from Wikipedia URL
    const titleMatch = url.match(/\/wiki\/(.+)$/);
    if (!titleMatch) return null;
    
    const pageTitle = titleMatch[1];
    
    // Get page images using Wikipedia API
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${pageTitle}&prop=pageimages&pithumbsize=500&format=json&origin=*`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) return null;
    
    const data = await response.json();
    const pages = data.query?.pages;
    
    if (pages) {
      const pageId = Object.keys(pages)[0];
      const thumbnail = pages[pageId]?.thumbnail?.source;
      
      if (thumbnail) {
        return thumbnail;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function searchTMDB(title: string, year: number): Promise<string | null> {
  if (!TMDB_API_KEY) return null;
  
  try {
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0 && data.results[0].poster_path) {
      return `https://image.tmdb.org/t/p/w500${data.results[0].poster_path}`;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function turboPosterFetch() {
  console.log(chalk.blue.bold('\n🚀 TURBO POSTER FETCH\n'));
  console.log(chalk.cyan(`Fetching posters from multiple sources for ${POSTER_SOURCES.length + MISSING_MOVIES.length} movies\n`));
  
  if (!EXECUTE) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE'));
    console.log(chalk.yellow('    Use --execute to apply changes\n'));
  }
  
  const stats = {
    total: POSTER_SOURCES.length + MISSING_MOVIES.length,
    processed: 0,
    found: 0,
    notFound: 0,
    bySource: {
      wikimedia: 0,
      wikipedia: 0,
      tmdb: 0,
      manual: 0,
      failed: 0,
    },
  };
  
  // Process movies with known sources
  for (const source of POSTER_SOURCES) {
    stats.processed++;
    
    console.log(chalk.cyan(`\n[${stats.processed}/${stats.total}] ${source.title} (${source.year})`));
    console.log(chalk.gray(`  Source: ${source.sourceType} - ${source.notes}`));
    
    let posterUrl: string | null = null;
    let foundSource = '';
    
    // Try to fetch based on source type
    if (source.sourceType === 'wikimedia' || source.sourceType === 'wikipedia') {
      if (source.sourceType === 'wikipedia') {
        posterUrl = await searchWikipediaPage(source.sourceUrl);
        foundSource = 'wikipedia';
      } else {
        posterUrl = await searchWikimediaCommons(source.title, source.year);
        foundSource = 'wikimedia';
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Fallback to TMDB
    if (!posterUrl) {
      console.log(chalk.yellow(`  ⚠️  Could not fetch from ${source.sourceType}, trying TMDB...`));
      posterUrl = await searchTMDB(source.title, source.year);
      if (posterUrl) {
        foundSource = 'tmdb';
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    if (posterUrl) {
      console.log(chalk.green(`  ✓ Found poster via ${foundSource}`));
      console.log(chalk.gray(`    URL: ${posterUrl.substring(0, 60)}...`));
      
      if (EXECUTE) {
        const { error: updateError } = await supabase
          .from('movies')
          .update({
            poster_url: posterUrl,
            poster_confidence: foundSource === 'wikimedia' ? 0.9 : foundSource === 'wikipedia' ? 0.85 : 0.8,
            data_sources: ['manual', foundSource],
            updated_at: new Date().toISOString(),
          })
          .eq('id', source.id);
        
        if (updateError) {
          console.log(chalk.red(`    ✗ Update failed: ${updateError.message}`));
          stats.bySource.failed++;
        } else {
          console.log(chalk.green(`    ✓ Poster added`));
          stats.found++;
          stats.bySource[foundSource as keyof typeof stats.bySource]++;
        }
      } else {
        stats.found++;
        stats.bySource[foundSource as keyof typeof stats.bySource]++;
      }
    } else {
      console.log(chalk.red(`  ✗ No poster found`));
      stats.notFound++;
    }
  }
  
  // Process remaining movies with TMDB search
  for (const movie of MISSING_MOVIES) {
    stats.processed++;
    
    console.log(chalk.cyan(`\n[${stats.processed}/${stats.total}] ${movie.title} (${movie.year})`));
    console.log(chalk.gray(`  Searching TMDB...`));
    
    const posterUrl = await searchTMDB(movie.title, movie.year);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (posterUrl) {
      console.log(chalk.green(`  ✓ Found poster via TMDB`));
      console.log(chalk.gray(`    URL: ${posterUrl.substring(0, 60)}...`));
      
      if (EXECUTE) {
        const { error: updateError } = await supabase
          .from('movies')
          .update({
            poster_url: posterUrl,
            poster_confidence: 0.8,
            data_sources: ['tmdb'],
            updated_at: new Date().toISOString(),
          })
          .eq('id', movie.id);
        
        if (updateError) {
          console.log(chalk.red(`    ✗ Update failed: ${updateError.message}`));
          stats.bySource.failed++;
        } else {
          console.log(chalk.green(`    ✓ Poster added`));
          stats.found++;
          stats.bySource.tmdb++;
        }
      } else {
        stats.found++;
        stats.bySource.tmdb++;
      }
    } else {
      console.log(chalk.red(`  ✗ No poster found`));
      stats.notFound++;
    }
  }
  
  // Summary
  console.log(chalk.blue.bold('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('TURBO POSTER FETCH SUMMARY'));
  console.log(chalk.blue.bold('='.repeat(60) + '\n'));
  
  console.log(chalk.white(`Total Movies:          ${stats.total}`));
  console.log(chalk.white(`Processed:             ${stats.processed}`));
  console.log(chalk.green(`Posters Found:         ${stats.found}`));
  console.log(chalk.red(`Not Found:             ${stats.notFound}`));
  
  console.log(chalk.gray('\nBy Source:'));
  console.log(chalk.white(`  Wikimedia Commons:   ${stats.bySource.wikimedia}`));
  console.log(chalk.white(`  Wikipedia:           ${stats.bySource.wikipedia}`));
  console.log(chalk.white(`  TMDB:                ${stats.bySource.tmdb}`));
  console.log(chalk.white(`  Manual:              ${stats.bySource.manual}`));
  console.log(chalk.red(`  Failed:              ${stats.bySource.failed}`));
  
  const successRate = stats.processed > 0 ? 
    Math.round((stats.found / stats.processed) * 100) : 0;
  console.log(chalk.white(`\nSuccess Rate:          ${successRate}%`));
  
  if (!EXECUTE) {
    console.log(chalk.yellow('\n⚠️  DRY RUN - No changes made'));
    console.log(chalk.yellow('   Run with --execute to apply'));
  } else if (stats.found > 0) {
    console.log(chalk.green(`\n✓ Added ${stats.found} posters!`));
    console.log(chalk.cyan('\n📤 Next: Add ratings and publish'));
    console.log(chalk.gray('   npx tsx scripts/quick-add-ratings.ts --execute'));
    console.log(chalk.gray('   npx tsx scripts/publish-44-validated-movies.ts --execute'));
  }
  
  console.log(chalk.blue('\n' + '='.repeat(60) + '\n'));
}

turboPosterFetch()
  .then(() => {
    console.log(chalk.green('✓ Turbo poster fetch completed'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('✗ Turbo poster fetch failed:'), error);
    process.exit(1);
  });
