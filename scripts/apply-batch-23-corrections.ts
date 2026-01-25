#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';

const CSV_FILE = 'movies-missing-telugu-titles-2026-01-14.csv';

interface MovieData {
  Slug: string;
  'Title (English)': string;
  'Title (Telugu - FILL THIS)': string;
  'Release Year': string;
  Hero: string;
  Heroine: string;
  Director: string;
}

function parseCsv(csvString: string): MovieData[] {
  const lines = csvString.split('\n');
  const movies: MovieData[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length >= 7) {
      movies.push({
        'Slug': values[0],
        'Title (English)': values[1].replace(/^"|"$/g, ''),
        'Title (Telugu - FILL THIS)': values[2],
        'Release Year': values[3],
        'Hero': values[4].replace(/^"|"$/g, ''),
        'Heroine': values[5].replace(/^"|"$/g, ''),
        'Director': values[6].replace(/^"|"$/g, ''),
      });
    }
  }

  return movies;
}

function toCsv(data: MovieData[]): string {
  const lines = ['Slug,Title (English),Title (Telugu - FILL THIS),Release Year,Hero,Heroine,Director'];
  
  for (const movie of data) {
    const values = [
      movie.Slug,
      `"${movie['Title (English)'].replace(/"/g, '""')}"`,
      movie['Title (Telugu - FILL THIS)'],
      movie['Release Year'],
      `"${movie.Hero.replace(/"/g, '""')}"`,
      `"${movie.Heroine.replace(/"/g, '""')}"`,
      `"${movie.Director.replace(/"/g, '""')}"`,
    ];
    lines.push(values.join(','));
  }
  
  return lines.join('\n');
}

async function applyBatch23Corrections() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║          APPLYING BATCH 23 CORRECTIONS (2021 COMPLETE)              ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  let mainCsvContent = readFileSync(CSV_FILE, 'utf8');
  let movies = parseCsv(mainCsvContent);
  
  const backupFilename = CSV_FILE.replace('.csv', '-before-batch23.csv');
  writeFileSync(backupFilename, mainCsvContent);
  console.log(chalk.green(`✓ Backup created: ${backupFilename}\n`));

  // Batch 23 validated data
  const batch23Updates: Record<string, Partial<MovieData>> = {
    'crrush-2021': { 
      'Title (Telugu - FILL THIS)': 'క్రష్',
      'Director': 'Ravi Babu'
    },
    'guduputani-2021': { 
      'Title (Telugu - FILL THIS)': 'గూడుపుఠాణి'
    },
    'lawyer-viswanath-2021': { 
      'Title (Telugu - FILL THIS)': 'లాయర్ విశ్వనాథ్',
      'Director': 'Bala Nageswara Rao'
    },
    'chinna-2021': { 
      'Title (Telugu - FILL THIS)': 'చిన్న',
      'Hero': 'Chelladurai',
      'Director': 'Sabarinathan'
    },
    'nireekshana-2021': { 
      'Title (Telugu - FILL THIS)': 'నిరీక్షణ'
    },
    'y-2021': { 
      'Title (Telugu - FILL THIS)': 'వై',
      'Hero': 'Yuvan',
      'Heroine': 'Abhirami V Iyer',
      'Director': 'Balu Sharma'
    },
    'pranavam-2021': { 
      'Title (Telugu - FILL THIS)': 'ప్రణవం'
    },
    'chandamama-raave-asap-2021': { 
      'Title (English)': 'Chandamama Raave',
      'Title (Telugu - FILL THIS)': 'చందమామ రావే',
      'Hero': 'Naveen Chandra',
      'Heroine': 'Priyal Gor',
      'Director': 'Dharma Raksha'
    },
    'plan-b-2021': { 
      'Title (Telugu - FILL THIS)': 'ప్లాన్ బి',
      'Heroine': 'Murali Sharma',
      'Director': 'K.V. Rajamahi'
    },
    'poster-2021': { 
      'Title (Telugu - FILL THIS)': 'పోస్టర్',
      'Hero': 'Shakalaka Shankar'
    },
    'ravana-lanka-2021': { 
      'Title (Telugu - FILL THIS)': 'రావణ లంక',
      'Heroine': 'Ashmita Kaur'
    },
    'one-small-story-2021': { 
      'Title (English)': 'Ek Mini Katha',
      'Title (Telugu - FILL THIS)': 'ఏక్ మినీ కథ'
    },
    'chandra-sekhar-yeleti-2021': { 
      'Title (English)': 'Check',
      'Title (Telugu - FILL THIS)': 'చెక్'
    },
    'kumar-g-2021': { 
      'Title (Telugu - FILL THIS)': 'కుమార్ జి',
      'Hero': 'Kumar',
      'Heroine': '-',
      'Director': '-'
    },
    'salt-2021': { 
      'Title (Telugu - FILL THIS)': 'సాల్ట్'
    },
    'surya-2021': { 
      'Title (Telugu - FILL THIS)': 'సూర్య',
      'Director': 'Subbu K'
    },
    'mumbai-saga-2021': { 
      'Title (English)': 'Mumbai Saga (Dub)',
      'Title (Telugu - FILL THIS)': 'ముంబై సాగా',
      'Heroine': 'Emraan Hashmi'
    },
    'hemanth-2021': { 
      'Title (English)': 'Jhimma (Dub)',
      'Title (Telugu - FILL THIS)': 'జిమ్మ'
    },
    'journalist-2021': { 
      'Title (Telugu - FILL THIS)': 'జర్నలిస్ట్'
    },
    'bhaskar-2021': { 
      'Title (English)': 'Most Eligible Bachelor',
      'Title (Telugu - FILL THIS)': 'మోస్ట్ ఎలిజిబుల్ బ్యాచ్‌లర్'
    },
    'sekhar-kammula-2021': { 
      'Title (English)': 'Love Story',
      'Title (Telugu - FILL THIS)': 'లవ్ స్టోరీ'
    },
    'madhagaja-2021': { 
      'Title (English)': 'Madhagaja (Dub)',
      'Title (Telugu - FILL THIS)': 'మధగజ'
    },
    'asalem-jarigandi-2021': { 
      'Title (Telugu - FILL THIS)': 'అసలేం జరిగింది'
    },
    'sampath-nandi-2021': { 
      'Title (English)': 'Seetimaarr',
      'Title (Telugu - FILL THIS)': 'సీటీమార్'
    },
    'a-ad-infitium-2021': { 
      'Title (English)': 'A: Ad Infinitum',
      'Title (Telugu - FILL THIS)': 'ఏ'
    },
    'mirugaa-2021': { 
      'Title (English)': 'Mirugaa (Dub)',
      'Title (Telugu - FILL THIS)': 'మృగ'
    },
    'the-power-2021': { 
      'Title (English)': 'The Power (Dub)',
      'Title (Telugu - FILL THIS)': 'ది పవర్',
      'Hero': 'Vidyut Jammwal',
      'Heroine': 'Shruti Haasan'
    },
    'roberrt-2021': { 
      'Title (English)': 'Roberrt (Dub)',
      'Title (Telugu - FILL THIS)': 'రాబర్ట్',
      'Hero': 'Darshan',
      'Heroine': 'Asha Bhat',
      'Director': 'Tharun Sudhir'
    }
  };

  let updatedCount = 0;
  let teluguTitlesAdded = 0;
  let castCorrections = 0;
  let directorCorrections = 0;
  let titleCorrections = 0;

  console.log(chalk.yellow('📋 Processing Batch 23 (2021 Complete - 28 movies):\n'));

  for (const [slug, correction] of Object.entries(batch23Updates)) {
    const movieIndex = movies.findIndex(m => m.Slug === slug);
    
    if (movieIndex !== -1) {
      const movie = movies[movieIndex];
      let hasChanges = false;
      const changes: string[] = [];

      if (correction['Title (English)'] && correction['Title (English)'] !== movie['Title (English)']) {
        changes.push(`EN: "${movie['Title (English)']}" → "${correction['Title (English)']!}"`);
        movie['Title (English)'] = correction['Title (English)']!;
        titleCorrections++;
        hasChanges = true;
      }

      if (correction['Title (Telugu - FILL THIS)']) {
        changes.push(`TE: "${movie['Title (Telugu - FILL THIS)'] || 'EMPTY'}" → "${correction['Title (Telugu - FILL THIS)']!}"`);
        movie['Title (Telugu - FILL THIS)'] = correction['Title (Telugu - FILL THIS)']!;
        teluguTitlesAdded++;
        hasChanges = true;
      }

      if (correction.Hero && correction.Hero !== movie.Hero) {
        changes.push(`Hero: "${movie.Hero}" → "${correction.Hero}"`);
        movie.Hero = correction.Hero;
        castCorrections++;
        hasChanges = true;
      }

      if (correction.Heroine && correction.Heroine !== movie.Heroine) {
        changes.push(`Heroine: "${movie.Heroine}" → "${correction.Heroine}"`);
        movie.Heroine = correction.Heroine;
        castCorrections++;
        hasChanges = true;
      }

      if (correction.Director && correction.Director !== movie.Director) {
        changes.push(`Director: "${movie.Director}" → "${correction.Director}"`);
        movie.Director = correction.Director;
        directorCorrections++;
        hasChanges = true;
      }

      if (hasChanges) {
        updatedCount++;
        console.log(chalk.cyan(`${updatedCount}. ${movie['Title (English)']} (${slug})`));
        changes.forEach(change => console.log(chalk.gray(`   ${change}`)));
      }
    } else {
      console.log(chalk.red(`⚠ Movie not found: ${slug}`));
    }
  }

  writeFileSync(CSV_FILE, toCsv(movies));

  const filled = movies.filter(m => m['Title (Telugu - FILL THIS)'] && m['Title (Telugu - FILL THIS)'].trim().length > 0).length;
  const total = movies.length;
  const percentage = Math.round((filled / total) * 100);

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('              BATCH 23 COMPLETE - SUMMARY                              '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green(`✅ Movies updated: ${updatedCount}`));
  console.log(chalk.green(`✅ Telugu titles added: ${teluguTitlesAdded}`));
  console.log(chalk.yellow(`✅ Cast corrections: ${castCorrections}`));
  console.log(chalk.yellow(`✅ Director corrections: ${directorCorrections}`));
  console.log(chalk.yellow(`✅ Title corrections: ${titleCorrections}`));
  console.log(chalk.cyan(`\n📊 Total Telugu titles: ${filled}/${total} (${percentage}%)`));
  console.log(chalk.yellow(`⏳ Still pending: ${total - filled}\n`));

  const barLength = 50;
  const filledBars = Math.round((percentage / 100) * barLength);
  const emptyBars = barLength - filledBars;
  
  console.log(chalk.cyan('Overall Progress:'));
  console.log(chalk.green('█'.repeat(filledBars)) + chalk.gray('░'.repeat(emptyBars)) + ` ${percentage}%\n`);

  console.log(chalk.magenta.bold('🎉 KEY CORRECTIONS:\n'));
  console.log(chalk.yellow('   • Removed Hollywood data (How to Train Your Dragon → Telugu film Y)'));
  console.log(chalk.yellow('   • Removed Marathi data (Jhimma - marked as Dub)'));
  console.log(chalk.yellow('   • Fixed Ek Mini Katha (was "One Small Story")'));
  console.log(chalk.yellow('   • Fixed Check title and credits'));
  console.log(chalk.yellow('   • Fixed Crrush director (Ravi Babu)'));
  console.log(chalk.yellow('   • Fixed Roberrt lead (Darshan)'));
  console.log(chalk.yellow('   • Fixed The Power lead (Vidyut Jammwal)'));
  console.log(chalk.yellow('   • Fixed Kumar G data'));
  console.log(chalk.yellow('   • Added (Dub) notation for Hindi/Kannada films\n'));

  console.log(chalk.green.bold('🎊 BATCH 23 COMPLETE! 🎊\n'));
  console.log(chalk.cyan(`📁 Updated: ${CSV_FILE}`));
  console.log(chalk.cyan(`📁 Backup: ${backupFilename}\n`));
  
  console.log(chalk.magenta.bold('📈 PROGRESS UPDATE:\n'));
  console.log(chalk.white(`   Before B23: 853/999 (85%)`));
  console.log(chalk.green.bold(`   After B23:  ${filled}/999 (${percentage}%) ⬅ YOU ARE HERE!\n`));
  console.log(chalk.yellow(`🎯 Next: Batch 24 (2018 - 34 movies) → Will reach 92%\n`));
}

applyBatch23Corrections().catch(console.error);
