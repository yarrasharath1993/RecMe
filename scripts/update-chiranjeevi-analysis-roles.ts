#!/usr/bin/env npx tsx
/**
 * Update Chiranjeevi filmography analysis with revised role categorizations
 * Based on manual review feedback
 */

import * as fs from 'fs';
import * as path from 'path';

interface MissingMovie {
  film_id: string;
  title_en: string;
  release_year: number;
  role: string;
  language?: string;
  confidence: number;
  sources: string[];
  reason: string;
  recommended_action: string;
  priority: string;
  explanation: string;
  crewRoles?: string[];
}

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

interface FilmographyAnalysis {
  actor: string;
  timestamp: string;
  missingMovies: MissingMovie[];
  wrongAttributions: WrongAttribution[];
  statistics: {
    totalDiscovered: number;
    totalInDatabase: number;
    missingCount: number;
    wrongAttributionCount: number;
    roleBreakdown: Record<string, number>;
    languageBreakdown: Record<string, number>;
    sourceBreakdown: Record<string, number>;
  };
  recommendations: {
    addMovies: MissingMovie[];
    fixAttributions: WrongAttribution[];
  };
  summary: string;
}

// Award titles to remove
const AWARD_TITLES = [
  'Best Actor – Telugu',
  'Best Actor',
  'Special Award – South',
  'Lifetime Achievement Award – South',
  'Raghupathi Venkaiah Award'
];

// Films to change from "supporting" to "hero" (Main Lead)
const MAIN_LEAD_FILMS: Record<string, number> = {
  'Punnami Naagu': 1980,
  'Mondi Ghatam': 1982,
  'Mantri Gari Viyyankudu': 1983,
  'Intiguttu': 1984,
  'Rustum': 1984,
  'Goonda': 1984,
  'Hero': 1984,
  'Devanthakudu': 1984,
  'Mahanagaramlo Mayagadu': 1984,
  'Challenge': 1984,
  'Naagu': 1984,
  'Agni Gundam': 1984,
  'Puli': 1985,
  'Rakta Sindhuram': 1985,
  'Adavi Donga': 1985,
  'Vijetha': 1985,
  'Chattamtho Poratam': 1985,
  'Donga': 1985
};

// Films that are valid Main Leads (remove from wrongAttributions)
const VALID_MAIN_LEADS: Record<string, number> = {
  'Patnam Vachina Pativrathalu': 1982,
  'Billa Ranga': 1982,
  'S.P. Parasuram': 1994,
  'Chiranjeevi': 1985,
  'Intlo Ramayya Veedhilo Krishnayya': 1982,
  'Godfather': 2022,
  'Jwaala': 1985,
  'Stuartpuram Police Station': 1991,
  'Swayamkrushi': 1987,
  'Bhola Shankar': 2023,
  'Attaku Yamudu Ammayiki Mogudu': 1989,
  'Kirayi Rangadu': 1983,
  'Lankeswarudu': 1989,
  'Chattaniki Kallu Levu': 1981,
  'Kirayi Rowdylu': 1981,
  'Tingu Rangadu': 1982,
  'Yamakinkarudu': 1982,
  'Manchu Pallaki': 1982,
  'Puli Bebbuli': 1983
};

// Films that should be marked as cameo/special appearance
const CAMEO_FILMS: Record<string, number> = {
  'Tayaramma Bangarayya': 1979,
  'Aadavaallu Meeku Joharlu': 1981,
  'Prema Natakam': 1981,
  'Aatagara': 2015,
  'Family': 2020
};

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim();
}

function isAward(title: string): boolean {
  const normalized = normalizeTitle(title);
  return AWARD_TITLES.some(award => normalizeTitle(award) === normalized || normalized.includes('award'));
}

function isMainLead(title: string, year: number): boolean {
  // Case-insensitive matching
  const normalizedTitle = title.trim();
  return MAIN_LEAD_FILMS[normalizedTitle] === year || VALID_MAIN_LEADS[normalizedTitle] === year;
}

function isCameo(title: string, year: number): boolean {
  return CAMEO_FILMS[title] === year;
}

function main() {
  const analysisPath = path.join(__dirname, '../reports/chiranjeevi-filmography-analysis.json');
  const analysisContent = fs.readFileSync(analysisPath, 'utf-8');
  const analysisData = JSON.parse(analysisContent);
  
  const filmographyData: FilmographyAnalysis = analysisData.outputs[0].data;
  
  // Step 1: Remove award entries from missingMovies
  const originalMissingCount = filmographyData.missingMovies.length;
  filmographyData.missingMovies = filmographyData.missingMovies.filter(movie => {
    return !isAward(movie.title_en);
  });
  const removedAwardsCount = originalMissingCount - filmographyData.missingMovies.length;
  console.log(`Removed ${removedAwardsCount} award entries from missingMovies`);
  
  // Step 2: Update role categorizations for missingMovies
  let updatedToHero = 0;
  filmographyData.missingMovies = filmographyData.missingMovies.map(movie => {
    if (movie.role === 'supporting' && isMainLead(movie.title_en, movie.release_year)) {
      updatedToHero++;
      const sourcesStr = movie.sources.join(', ');
      const languageStr = movie.language || 'Unknown';
      return { 
        ...movie, 
        role: 'hero',
        explanation: `${movie.title_en} (${movie.release_year}) is missing from database. Role: hero, Language: ${languageStr}. Found in: ${sourcesStr}. Confidence: ${Math.round(movie.confidence * 100)}%.`
      };
    }
    // Also update explanations for films that are already hero but have wrong explanation
    if (movie.role === 'hero' && movie.explanation.includes('Role: supporting')) {
      const sourcesStr = movie.sources.join(', ');
      const languageStr = movie.language || 'Unknown';
      return {
        ...movie,
        explanation: `${movie.title_en} (${movie.release_year}) is missing from database. Role: hero, Language: ${languageStr}. Found in: ${sourcesStr}. Confidence: ${Math.round(movie.confidence * 100)}%.`
      };
    }
    return movie;
  });
  console.log(`Updated ${updatedToHero} missing movies from "supporting" to "hero"`);
  
  // Step 3: Update wrongAttributions - remove verified main leads
  const originalWrongCount = filmographyData.wrongAttributions.length;
  filmographyData.wrongAttributions = filmographyData.wrongAttributions.filter(attr => {
    // Keep high priority wrong_role issues (producer fixes)
    if (attr.issue === 'wrong_role' && attr.priority === 'high') {
      return true;
    }
    // Remove verified main leads
    if (attr.issue === 'not_in_sources' && isMainLead(attr.title_en, attr.release_year)) {
      return false;
    }
    return true;
  });
  const removedValidLeads = originalWrongCount - filmographyData.wrongAttributions.length;
  console.log(`Removed ${removedValidLeads} verified main leads from wrongAttributions`);
  
  // Step 4: Update cameo films in wrongAttributions
  filmographyData.wrongAttributions = filmographyData.wrongAttributions.map(attr => {
    if (isCameo(attr.title_en, attr.release_year)) {
      return {
        ...attr,
        priority: 'low',
        recommended_action: 'review',
        explanation: `${attr.title_en} (${attr.release_year}) is a cameo/special appearance. Verify attribution.`
      };
    }
    return attr;
  });
  
  // Step 5: Recalculate statistics
  const roleBreakdown: Record<string, number> = {};
  const languageBreakdown: Record<string, number> = {};
  const sourceBreakdown: Record<string, number> = {};
  
  filmographyData.missingMovies.forEach(movie => {
    roleBreakdown[movie.role] = (roleBreakdown[movie.role] || 0) + 1;
    if (movie.language) {
      languageBreakdown[movie.language] = (languageBreakdown[movie.language] || 0) + 1;
    }
    movie.sources.forEach(source => {
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
    });
  });
  
  filmographyData.statistics = {
    ...filmographyData.statistics,
    missingCount: filmographyData.missingMovies.length,
    wrongAttributionCount: filmographyData.wrongAttributions.length,
    roleBreakdown,
    languageBreakdown,
    sourceBreakdown
  };
  
  // Step 6: Update recommendations
  filmographyData.recommendations.fixAttributions = filmographyData.wrongAttributions.filter(
    attr => attr.priority === 'high' && attr.recommended_action === 'fix'
  );
  
  // Step 7: Update summary
  const highPriorityMissing = filmographyData.missingMovies.filter(m => m.priority === 'high').length;
  const highPriorityWrong = filmographyData.wrongAttributions.filter(w => w.priority === 'high').length;
  
  filmographyData.summary = `Filmography analysis for ${filmographyData.statistics.totalDiscovered} discovered films. ${filmographyData.statistics.totalInDatabase} films in database (${Math.round((filmographyData.statistics.totalInDatabase / filmographyData.statistics.totalDiscovered) * 100)}% coverage). ${filmographyData.statistics.missingCount} missing films identified (${highPriorityMissing} high priority). ${filmographyData.statistics.wrongAttributionCount} wrong attributions detected (${highPriorityWrong} high priority).`;
  
  // Step 8: Update timestamp
  filmographyData.timestamp = new Date().toISOString();
  
  // Write updated JSON
  analysisData.outputs[0].data = filmographyData;
  fs.writeFileSync(analysisPath, JSON.stringify(analysisData, null, 2), 'utf-8');
  
  console.log('\n=== Summary ===');
  console.log(`Missing Movies: ${filmographyData.missingMovies.length} (was ${originalMissingCount})`);
  console.log(`Wrong Attributions: ${filmographyData.wrongAttributions.length} (was ${originalWrongCount})`);
  console.log(`High Priority Fixes: ${highPriorityWrong}`);
  console.log(`\nUpdated file: ${analysisPath}`);
}

main();
