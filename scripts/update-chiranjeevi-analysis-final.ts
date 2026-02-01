#!/usr/bin/env npx tsx
/**
 * Final update to Chiranjeevi filmography analysis based on manual review corrections
 */

import * as fs from 'fs';
import * as path from 'path';

interface FilmographyAnalysis {
  actor: string;
  timestamp: string;
  missingMovies: any[];
  wrongAttributions: any[];
  statistics: any;
  recommendations: {
    addMovies: any[];
    fixAttributions: any[];
  };
  summary: string;
}

// Films that are Main Leads (remove from wrongAttributions or update)
const MAIN_LEADS_TO_VERIFY: Record<string, number> = {
  'Agni Samskaram': 1980,
  'Inti Guttu': 1984,
  'Kaali': 1980,
  'Andarivadu': 2005,
  'Acharya': 2022,
  'Vishwambhara': 2026
};

// Films that are NOT ATTRIBUTED (should be removed from wrongAttributions)
const NOT_ATTRIBUTED: Record<string, number> = {
  'Rojulu Marayi': 1984,
  'Chalaki Chellamma': 1982,
  'Rudra Tandava': 2015,
  'Okkadunnadu': 2007,
  'Aatagara': 2015
};

// Films that should NOT be fixed (they're correctly hero, not producer)
const CORRECT_HERO_FILMS: Record<string, number> = {
  'Trinetrudu': 1988,
  'Manchi Donga': 1988,
  'Rudraveena': 1988
};

function normalizeTitle(title: string): string {
  return title.trim();
}

function main() {
  const analysisPath = path.join(__dirname, '../reports/chiranjeevi-filmography-analysis.json');
  const analysisContent = fs.readFileSync(analysisPath, 'utf-8');
  const analysisData = JSON.parse(analysisContent);
  
  const filmographyData: FilmographyAnalysis = analysisData.outputs[0].data;
  
  console.log('Starting final corrections...');
  
  // Step 1: Remove NOT ATTRIBUTED films from wrongAttributions
  const originalWrongCount = filmographyData.wrongAttributions.length;
  filmographyData.wrongAttributions = filmographyData.wrongAttributions.filter(attr => {
    const title = normalizeTitle(attr.title_en);
    return !(NOT_ATTRIBUTED[title] === attr.release_year);
  });
  const removedNotAttributed = originalWrongCount - filmographyData.wrongAttributions.length;
  console.log(`Removed ${removedNotAttributed} NOT ATTRIBUTED films from wrongAttributions`);
  
  // Step 2: Remove verified Main Leads from wrongAttributions
  filmographyData.wrongAttributions = filmographyData.wrongAttributions.filter(attr => {
    const title = normalizeTitle(attr.title_en);
    // Remove verified main leads
    if (MAIN_LEADS_TO_VERIFY[title] === attr.release_year) {
      return false;
    }
    return true;
  });
  const removedMainLeads = originalWrongCount - removedNotAttributed - filmographyData.wrongAttributions.length;
  console.log(`Removed ${removedMainLeads} verified main leads from wrongAttributions`);
  
  // Step 3: Remove incorrect "high priority fixes" from recommendations
  // These films are correctly attributed as hero, NOT producer
  const originalFixCount = filmographyData.recommendations.fixAttributions.length;
  filmographyData.recommendations.fixAttributions = filmographyData.recommendations.fixAttributions.filter(fix => {
    const title = normalizeTitle(fix.title_en);
    return !(CORRECT_HERO_FILMS[title] === fix.release_year && fix.correctRole === 'Producer');
  });
  const removedIncorrectFixes = originalFixCount - filmographyData.recommendations.fixAttributions.length;
  console.log(`Removed ${removedIncorrectFixes} incorrect producer fixes from recommendations`);
  
  // Step 4: Also remove these from wrongAttributions if they're there with wrong_role issue
  filmographyData.wrongAttributions = filmographyData.wrongAttributions.filter(attr => {
    const title = normalizeTitle(attr.title_en);
    // Remove if it's one of the correct hero films with wrong_role issue
    if (attr.issue === 'wrong_role' && CORRECT_HERO_FILMS[title] === attr.release_year) {
      return false;
    }
    return true;
  });
  
  // Step 5: Update statistics
  filmographyData.statistics.wrongAttributionCount = filmographyData.wrongAttributions.length;
  
  // Step 6: Update summary
  const highPriorityMissing = filmographyData.missingMovies.filter(m => m.priority === 'high').length;
  const highPriorityWrong = filmographyData.wrongAttributions.filter(w => w.priority === 'high').length;
  
  filmographyData.summary = `Filmography analysis for ${filmographyData.statistics.totalDiscovered} discovered films. ${filmographyData.statistics.totalInDatabase} films in database (${Math.round((filmographyData.statistics.totalInDatabase / filmographyData.statistics.totalDiscovered) * 100)}% coverage). ${filmographyData.statistics.missingCount} missing films identified (${highPriorityMissing} high priority). ${filmographyData.statistics.wrongAttributionCount} wrong attributions detected (${highPriorityWrong} high priority).`;
  
  // Step 7: Update timestamp
  filmographyData.timestamp = new Date().toISOString();
  
  // Write updated JSON
  analysisData.outputs[0].data = filmographyData;
  fs.writeFileSync(analysisPath, JSON.stringify(analysisData, null, 2), 'utf-8');
  
  console.log('\n=== Final Corrections Summary ===');
  console.log(`Wrong Attributions: ${filmographyData.wrongAttributions.length} (removed ${removedNotAttributed + removedMainLeads} total)`);
  console.log(`High Priority Fixes: ${filmographyData.recommendations.fixAttributions.length} (removed ${removedIncorrectFixes} incorrect fixes)`);
  console.log(`\nUpdated file: ${analysisPath}`);
}

main();
