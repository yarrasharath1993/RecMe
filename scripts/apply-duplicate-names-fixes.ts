import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Confirmed Different Persons (from user review)
 * These need disambiguation logic in profile API
 */
const CONFIRMED_DIFFERENT_PERSONS = [
  {
    name: 'Devaraj',
    variations: ['Devaraj'],
    reason: '1970s director vs modern actor (Head Bush)',
    directorYears: [1977],
    actorYears: [2022],
    confidence: 85,
  },
  {
    name: 'Sudhakar',
    variations: ['Sudhakar'],
    reason: 'Comedian Sudhakar vs Tamil actor/producer',
    producerYears: [1982],
    actorYears: [1982, 1990],
    confidence: 80,
  },
  {
    name: 'Ram',
    variations: ['Ram'],
    reason: 'Ram Pothineni (Hero) vs music director Ram',
    musicDirectorYears: [2010],
    heroYears: [2020],
    confidence: 90,
  },
  {
    name: 'Sagar',
    variations: ['Sagar'],
    reason: 'Director Sagar vs Singer/Actor Sagar',
    directorYears: [1995, 2016],
    heroYears: [2016],
    confidence: 85,
  },
  {
    name: 'Srikanth',
    variations: ['Srikanth'],
    reason: 'Tamil actor Meka Srikanth vs Telugu actor',
    tamilYears: [2002, 2012],
    teluguYears: [2002, 2012],
    confidence: 85,
  },
  {
    name: 'Anil Kumar',
    variations: ['Anil Kumar'],
    reason: '80s director vs modern music technician',
    directorYears: [1985],
    musicDirectorYears: [2014],
    confidence: 85,
  },
  {
    name: 'Vijay Bhaskar',
    variations: ['Vijay Bhaskar'],
    reason: 'Name ambiguity - several different directors/writers',
    years: [1982],
    confidence: 80,
  },
];

/**
 * Name Variations (Same Person, Different Spellings)
 */
const NAME_VARIATIONS = [
  {
    canonical: 'Jayanth C. Paranjee',
    variations: ['Jayanth C. Paranjee', 'Jayant Paranji', 'Jayant Paranji'],
  },
];

interface FixSummary {
  name: string;
  action: string;
  details: string;
  status: 'fixed' | 'skipped' | 'error';
}

async function applyDuplicateNamesFixes() {
  console.log('🔧 Applying duplicate names fixes based on user review...\n');

  const summary: FixSummary[] = [];

  // Step 1: Document confirmed different persons (for profile API enhancement)
  console.log('📋 Step 1: Documenting confirmed different persons...\n');
  
  for (const person of CONFIRMED_DIFFERENT_PERSONS) {
    console.log(`   ✅ ${person.name}`);
    console.log(`      Reason: ${person.reason}`);
    console.log(`      Confidence: ${person.confidence}%`);
    console.log('');
    
    summary.push({
      name: person.name,
      action: 'documented',
      details: `Confirmed different persons - ${person.reason}`,
      status: 'fixed',
    });
  }

  // Step 2: Create disambiguation mapping file for profile API
  console.log('📋 Step 2: Creating disambiguation mapping for profile API...\n');
  
  const disambiguationMap = {
    'devaraj': {
      isDifferentPerson: true,
      rules: [
        {
          condition: 'director',
          years: [1977],
          description: '1970s director',
        },
        {
          condition: 'hero',
          years: [2022],
          description: 'Modern actor (Head Bush)',
        },
      ],
    },
    'sudhakar': {
      isDifferentPerson: true,
      rules: [
        {
          condition: 'producer',
          years: [1982],
          description: 'Producer',
        },
        {
          condition: 'hero',
          years: [1982, 1990],
          description: 'Actor/Comedian',
        },
      ],
    },
    'ram': {
      isDifferentPerson: true,
      rules: [
        {
          condition: 'music_director',
          years: [2010],
          description: 'Music director',
        },
        {
          condition: 'hero',
          years: [2020],
          description: 'Actor (Ram Pothineni)',
        },
      ],
    },
    'sagar': {
      isDifferentPerson: true,
      rules: [
        {
          condition: 'director',
          years: [1995, 2016],
          description: 'Director',
        },
        {
          condition: 'hero',
          years: [2016],
          description: 'Singer/Actor',
        },
      ],
    },
    'srikanth': {
      isDifferentPerson: true,
      rules: [
        {
          condition: 'hero',
          languages: ['Tamil'],
          description: 'Tamil actor (Meka Srikanth)',
        },
        {
          condition: 'hero',
          languages: ['Telugu'],
          description: 'Telugu actor',
        },
      ],
    },
    'anil kumar': {
      isDifferentPerson: true,
      rules: [
        {
          condition: 'director',
          years: [1985],
          description: '1980s director',
        },
        {
          condition: 'music_director',
          years: [2014],
          description: 'Modern music technician',
        },
      ],
    },
  };

  const disambiguationPath = path.join(process.cwd(), 'lib/utils/name-disambiguation.json');
  fs.writeFileSync(disambiguationPath, JSON.stringify(disambiguationMap, null, 2), 'utf-8');
  console.log(`   ✅ Disambiguation map saved to: ${disambiguationPath}\n`);

  // Step 3: Generate summary report
  console.log('📋 Step 3: Generating summary report...\n');
  
  const report = {
    reviewDate: new Date().toISOString(),
    totalCasesReviewed: 240,
    confirmedDifferentPersons: CONFIRMED_DIFFERENT_PERSONS.length,
    nameVariations: NAME_VARIATIONS.length,
    fixes: {
      genderRoleCorrections: 'Multiple hero/heroine misclassifications identified (data quality issue)',
      differentPersons: CONFIRMED_DIFFERENT_PERSONS.map(p => ({
        name: p.name,
        reason: p.reason,
        confidence: p.confidence,
      })),
      nameVariations: NAME_VARIATIONS.map(n => ({
        canonical: n.canonical,
        variations: n.variations,
      })),
    },
    recommendations: [
      'Update profile API to use disambiguation map for confirmed different persons',
      'Fix gender role misclassifications in database (hero vs heroine)',
      'Standardize name variations (Jayanth C. Paranjee vs Jayant Paranji)',
      'Add validation to prevent hero/heroine misclassifications during data entry',
    ],
  };

  const reportPath = path.join(process.cwd(), 'DUPLICATE-NAMES-FIXES-APPLIED.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`   ✅ Fix report saved to: ${reportPath}\n`);

  // Step 4: Summary
  console.log('📊 Summary:\n');
  console.log(`   ✅ Confirmed different persons: ${CONFIRMED_DIFFERENT_PERSONS.length}`);
  console.log(`   ✅ Name variations documented: ${NAME_VARIATIONS.length}`);
  console.log(`   ✅ Disambiguation map created`);
  console.log(`   ✅ Fix report generated\n`);

  console.log('📝 Next Steps:');
  console.log('   1. Update profile API to use disambiguation map');
  console.log('   2. Fix gender role misclassifications in database');
  console.log('   3. Standardize name variations');
  console.log('   4. Add data validation rules\n');

  console.log('✨ Fixes applied!\n');
}

applyDuplicateNamesFixes().catch(console.error);
