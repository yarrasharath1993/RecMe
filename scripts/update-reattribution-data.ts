#!/usr/bin/env npx tsx
/**
 * Update reattribution entries with correct attribution data
 */

import * as fs from 'fs';
import * as path from 'path';

// Correct attribution data
const CORRECT_ATTRIBUTIONS: Record<string, {
  correctActors: string;
  notes: string;
  specialAction?: string;
}> = {
  'Rojulu Marayi': {
    correctActors: 'Murali Mohan, Kavitha',
    notes: 'Family drama. Not a Chiranjeevi film. IMDB confirms his absence.'
  },
  'Chalaki Chellamma': {
    correctActors: 'Karthik, Kavitha',
    notes: 'Chiranjeevi does not appear in this cast.'
  },
  'Rudra Tandava': {
    correctActors: 'Kishore, Radhika Kumaraswamy',
    notes: 'Kannada action film. Chiranjeevi has no role or cameo.'
  },
  'Okkadunnadu': {
    correctActors: 'Gopichand, Mahesh Manjrekar',
    notes: 'Directed by Chandra Sekhar Yeleti. Chiranjeevi is not in the cast.'
  },
  'Aatagara': {
    correctActors: 'Chiranjeevi Sarja',
    notes: 'Kannada mystery thriller starring Chiranjeevi Sarja (the late Kannada actor). Database confused the "Megastar" with his namesake.',
    specialAction: 'Update name to Chiranjeevi Sarja to prevent future cross-linking'
  }
};

function main() {
  const analysisPath = path.join(__dirname, '../reports/chiranjeevi-filmography-analysis.json');
  const analysisContent = fs.readFileSync(analysisPath, 'utf-8');
  const analysisData = JSON.parse(analysisContent);
  
  const filmographyData = analysisData.outputs[0].data;
  
  console.log('Updating reattribution entries with correct data...');
  
  let updatedCount = 0;
  
  // Update wrongAttributions with correct attribution data
  filmographyData.wrongAttributions = filmographyData.wrongAttributions.map((attr: any) => {
    const title = attr.title_en;
    const correctData = CORRECT_ATTRIBUTIONS[title];
    
    if (correctData) {
      updatedCount++;
      const fixSteps = [
        `Remove Chiranjeevi from hero/cast fields for ${title} (${attr.release_year})`,
        `Reattribute to correct actors: ${correctData.correctActors}`,
        `Update movie attribution in appropriate fields (hero, supporting_cast, etc.)`,
        `Verify attribution matches actual cast`
      ];
      
      if (correctData.specialAction) {
        fixSteps.push(correctData.specialAction);
      }
      
      return {
        ...attr,
        issue: 'wrong_attribution',
        explanation: `${title} (${attr.release_year}) is incorrectly attributed to Chiranjeevi. ${correctData.notes} Correct actors: ${correctData.correctActors}.`,
        fix_steps: fixSteps,
        correctActors: correctData.correctActors,
        notes: correctData.notes
      };
    }
    
    return attr;
  });
  
  // Update timestamp
  filmographyData.timestamp = new Date().toISOString();
  
  // Write updated JSON
  analysisData.outputs[0].data = filmographyData;
  fs.writeFileSync(analysisPath, JSON.stringify(analysisData, null, 2), 'utf-8');
  
  console.log(`\n=== Updated ${updatedCount} Reattribution Entries ===`);
  console.log(`Updated file: ${analysisPath}`);
}

main();
