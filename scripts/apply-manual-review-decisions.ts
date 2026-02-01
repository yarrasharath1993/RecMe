#!/usr/bin/env npx tsx
/**
 * Apply manual review decisions to filmography analysis
 */

import * as fs from 'fs';
import * as path from 'path';

// Missing Movies Actions
const MISSING_MOVIES_ACTIONS: Record<string, {
  role: 'hero' | 'supporting' | 'cameo' | 'delete';
  notes?: string;
  yearCorrection?: number;
}> = {
  // Items 1-6: Hero
  'Punnami Naagu': { role: 'hero' },
  'Mondi Ghatam': { role: 'hero' },
  'Mantri Gari Viyyankudu': { role: 'hero' },
  'Intiguttu': { role: 'hero' },
  'Puli': { role: 'hero' },
  'Adavi Donga': { role: 'hero' },
  
  // Items 7-14: Supporting
  'Mana Voori Pandavulu': { role: 'supporting' },
  'Agni Sanskaram': { role: 'supporting' },
  'Prema Tarangalu': { role: 'supporting' },
  'Thodu Dongalu': { role: 'supporting' },
  'Ooriki Ichina Maata': { role: 'supporting' },
  'Paravathi Parameshwarulu': { role: 'supporting' },
  'Shivudu Shivudu Shivudu': { role: 'supporting' },
  'Allullostunnaru': { role: 'supporting' },
  
  // Items 15-22: RECLASSIFY as Hero (duplicates)
  'Kodama Simham': { role: 'hero', notes: 'Reclassify as Hero' },
  'Swayam Krushi': { role: 'hero', notes: 'Duplicate of Swayamkrushi - merge' },
  'Yudda Bhoomi': { role: 'hero', notes: 'Reclassify as Hero' },
  'Lankeshwarudu': { role: 'hero', notes: 'Duplicate of Lankeswarudu - merge' },
  'Pratibandh': { role: 'hero', notes: 'Reclassify as Hero' },
  'Mutha Mestri': { role: 'hero', notes: 'Duplicate of Muta Mestri - merge' },
  'The Gentleman': { role: 'hero', notes: 'Reclassify as Hero' },
  'S. P. Parasuram': { role: 'hero', notes: 'Duplicate of S.P. Parasuram - merge' },
  
  // Special cases
  'తెలుగోడు': { role: 'delete', notes: 'Invalid entry - DELETE' },
  'Hands Up!': { role: 'cameo', notes: 'Special appearance' },
  'Andarivaadu': { role: 'hero', notes: 'Hero (Dual role)' },
  'State Rowdy': { role: 'hero', yearCorrection: 1989, notes: 'Change year to 1989' },
  'Magadheera': { role: 'cameo', notes: 'Special appearance' }
};

// Wrong Attributions Actions
const WRONG_ATTRIBUTIONS_ACTIONS: Record<string, {
  role: 'hero' | 'supporting' | 'co-lead' | 'antagonist' | 'cameo';
  yearCorrection?: number;
  notes?: string;
  language?: string;
}> = {
  'Patnam Vachina Pativrathalu': { 
    role: 'hero', 
    yearCorrection: 1982,
    notes: 'Primary male lead (Gopi) - often mistaken for supporting'
  },
  'Oorukichina Maata': { role: 'co-lead', notes: 'Co-Lead/Supporting' },
  'Parvathi Parameswarulu': { role: 'supporting' },
  'Rakta Bandham': { role: 'supporting' },
  'I Love You': { role: 'supporting' },
  'Ranuva Veeran': { 
    role: 'antagonist', 
    language: 'Tamil',
    notes: 'Antagonist/Supporting (Tamil film)'
  },
  'Idi Katha Kaadu': { 
    role: 'antagonist', 
    notes: 'Antagonist (Role: Subanakhar)'
  },
  'Priya': { 
    role: 'supporting', 
    language: 'Tamil',
    notes: 'Supporting (Tamil film)'
  },
  'Oorukichchina Maata': { 
    role: 'co-lead', 
    notes: 'Merge with Oorukichina Maata (spelling variation)'
  },
  'Todu Dongalu': { role: 'co-lead', notes: 'Co-Lead (alongside Krishna)' },
  'Allullostunnaru': { role: 'co-lead' },
  'Aadavaallu Meeku Joharlu': { role: 'cameo', notes: 'Reclassify to Cameo' },
  'Prema Natakam': { role: 'cameo', notes: 'Reclassify to Cameo' },
  'Family': { role: 'cameo', notes: 'Cameo (Short Film)' },
  'Tayaramma Bangarayya': { role: 'cameo', notes: 'Cameo/Guest Appearance' },
  'Parvathi Parameshwarulu': { 
    role: 'supporting', 
    notes: 'Merge with Parvathi Parameswarulu (spelling variation)'
  }
};

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim();
}

function main() {
  const analysisPath = path.join(__dirname, '../reports/chiranjeevi-filmography-analysis.json');
  const analysisContent = fs.readFileSync(analysisPath, 'utf-8');
  const analysisData = JSON.parse(analysisContent);
  
  const filmographyData = analysisData.outputs[0].data;
  
  console.log('Applying manual review decisions...');
  
  // Update missing movies
  let updatedMissing = 0;
  let deletedMissing = 0;
  filmographyData.missingMovies = filmographyData.missingMovies
    .map((movie: any) => {
      const action = MISSING_MOVIES_ACTIONS[movie.title_en];
      if (!action) return movie;
      
      if (action.role === 'delete') {
        deletedMissing++;
        return null; // Mark for deletion
      }
      
      updatedMissing++;
      const updated = {
        ...movie,
        role: action.role,
        recommended_action: action.role === 'hero' ? 'add' : action.role === 'cameo' ? 'add_cameo' : 'add_supporting',
        priority: action.role === 'hero' ? 'high' : 'medium',
        notes: action.notes
      };
      
      if (action.yearCorrection) {
        updated.release_year = action.yearCorrection;
        updated.notes = `${updated.notes || ''} Year corrected to ${action.yearCorrection}`.trim();
      }
      
      return updated;
    })
    .filter((movie: any) => movie !== null); // Remove deleted entries
  
  console.log(`Updated ${updatedMissing} missing movies, deleted ${deletedMissing}`);
  
  // Update wrong attributions
  let updatedWrong = 0;
  filmographyData.wrongAttributions = filmographyData.wrongAttributions
    .map((attr: any) => {
      const action = WRONG_ATTRIBUTIONS_ACTIONS[attr.title_en];
      if (!action) return attr;
      
      // Skip reattribution entries (already handled)
      if (attr.issue === 'wrong_attribution' && attr.recommended_action === 'reattribute') {
        return attr;
      }
      
      updatedWrong++;
      const updated = {
        ...attr,
        issue: 'wrong_role',
        recommended_action: 'reclassify',
        priority: action.role === 'hero' ? 'high' : 'medium',
        correctRole: action.role,
        notes: action.notes,
        language: action.language || attr.language
      };
      
      if (action.yearCorrection) {
        updated.release_year = action.yearCorrection;
        updated.notes = `${updated.notes || ''} Year corrected to ${action.yearCorrection}`.trim();
      }
      
      // Update fix steps
      updated.fix_steps = [
        `Reclassify ${attr.title_en} (${updated.release_year}) to ${action.role}`,
        `Update role field to: ${action.role}`,
        action.language ? `Update language to: ${action.language}` : null,
        action.notes ? `Note: ${action.notes}` : null
      ].filter(step => step !== null);
      
      return updated;
    });
  
  console.log(`Updated ${updatedWrong} wrong attributions`);
  
  // Update statistics
  filmographyData.statistics.missingCount = filmographyData.missingMovies.length;
  filmographyData.statistics.wrongAttributionCount = filmographyData.wrongAttributions.length;
  
  // Update summary
  const highPriorityMissing = filmographyData.missingMovies.filter((m: any) => m.priority === 'high').length;
  const highPriorityWrong = filmographyData.wrongAttributions.filter((w: any) => w.priority === 'high').length;
  
  filmographyData.summary = `Filmography analysis for ${filmographyData.statistics.totalDiscovered} discovered films. ${filmographyData.statistics.totalInDatabase} films in database (${Math.round((filmographyData.statistics.totalInDatabase / filmographyData.statistics.totalDiscovered) * 100)}% coverage). ${filmographyData.statistics.missingCount} missing films identified (${highPriorityMissing} high priority). ${filmographyData.statistics.wrongAttributionCount} wrong attributions detected (${highPriorityWrong} high priority). Manual review completed.`;
  
  // Update timestamp
  filmographyData.timestamp = new Date().toISOString();
  
  // Write updated JSON
  analysisData.outputs[0].data = filmographyData;
  fs.writeFileSync(analysisPath, JSON.stringify(analysisData, null, 2), 'utf-8');
  
  console.log(`\n=== Manual Review Decisions Applied ===`);
  console.log(`Missing Movies: ${filmographyData.missingMovies.length} (${updatedMissing} updated, ${deletedMissing} deleted)`);
  console.log(`Wrong Attributions: ${filmographyData.wrongAttributions.length} (${updatedWrong} updated)`);
  console.log(`High Priority Missing: ${highPriorityMissing}`);
  console.log(`High Priority Wrong: ${highPriorityWrong}`);
  console.log(`\nUpdated file: ${analysisPath}`);
}

main();
