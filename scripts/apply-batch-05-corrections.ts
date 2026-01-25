#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';

const MAIN_CSV = 'movies-missing-telugu-titles-2026-01-14.csv';

interface MovieRow {
  Slug: string;
  TitleEn: string;
  TitleTe: string;
  ReleaseYear: string;
  Hero: string;
  Heroine: string;
  Director: string;
}

// All Batch 05 corrections
const batch05Data: Record<string, Partial<MovieRow>> = {
  'hunt-2023': {
    TitleTe: 'హంట్',
    Heroine: 'No Female Lead'
  },
  'spark-2023': {
    TitleTe: 'స్పార్క్'
  },
  'my-name-is-shruthi-2023': {
    TitleTe: 'మై నేమ్ ఈజ్ శృతి',
    Hero: 'No Hero Lead'
  },
  'ala-ninnu-cheri-2023': {
    TitleTe: 'అలా నిన్ను చేరి'
  },
  'sagiletikatha-2023': {
    TitleTe: 'సగిలేటి కథ'
  },
  'mangalavaaram-2023': {
    TitleTe: 'మంగళవారం',
    Hero: 'No Hero Lead'
  },
  'o-saathiya-2023': {
    TitleTe: 'ఓ సాథియా'
  },
  'mr-king-2023': {
    TitleTe: 'మిస్టర్ కింగ్'
  },
  'premadesam-2023': {
    TitleTe: 'ప్రేమదేశం'
  },
  'vidhi-2023': {
    TitleTe: 'విధి'
  },
  'subramanyam-chigurupati-2023': {
    TitleEn: 'Salam Sainika',
    TitleTe: 'సలాం సైనికా',
    Director: 'Subramanyam Chigurupati'
  },
  'madhurapudi-granam-ane-nenu-2023': {
    TitleTe: 'మధురపూడి గ్రామం అనే నేను'
  },
  'sindhooram-2023': {
    TitleTe: 'సింధూరం'
  },
  'maama-mascheendra-2023': {
    TitleTe: 'మామ మశ్చీంద్ర'
  },
  'her-chapter-1-2023': {
    TitleTe: 'హర్: చాప్టర్ 1',
    Hero: 'No Hero Lead'
  },
  'saachi-2023': {
    TitleTe: 'సాచి',
    Hero: 'No Hero Lead'
  },
  'mentoo-2023': {
    TitleTe: '#మెన్ టూ'
  },
  'geetasakshigaa-2023': {
    TitleTe: 'గీత సాక్షిగా'
  },
  'peddha-kapu-1-2023': {
    TitleTe: 'పెద్ద కాపు - 1'
  },
  'ugram-2023': {
    TitleTe: 'ఉగ్రం'
  },
  'case-30-2023': {
    TitleTe: 'కేస్ 30'
  },
  'ustaad-2023': {
    TitleTe: 'ఉస్తాద్'
  },
  'suvarna-sundari-2023': {
    TitleTe: 'సువర్ణ సుందరి'
  },
  'bhuvanavijayam-2023': {
    TitleTe: 'భువన విజయం',
    Heroine: 'No Female Lead'
  },
  'circle-2023': {
    TitleTe: 'సర్కిల్'
  },
  'chakravyuham-2023': {
    TitleTe: 'చక్రవ్యూహం'
  },
  'antham-kadidi-aarambam-1981': {
    TitleTe: 'అంతం కాదిది ఆరంభం'
  },
  'spy-2023': {
    TitleTe: 'స్పై'
  },
  'aadikeshava-2023': {
    TitleTe: 'ఆదికేశవ'
  },
  'breathe-2023': {
    TitleTe: 'బ్రీత్'
  },
  'baby-2023': {
    TitleTe: 'బేబి'
  },
  'barla-narayana-2023': {
    TitleEn: 'Narayana & Co',
    TitleTe: 'నారాయణ & కో'
  },
  'nagumome-chaalu-le-2023': {
    TitleTe: 'నగుమోము చాలులే',
    Hero: 'No Hero Lead'
  },
  'plot-2023': {
    TitleTe: 'ప్లాట్',
    Heroine: 'No Female Lead'
  },
  'miss-shetty-mr-polishetty-2023': {
    TitleTe: 'మిస్ శెట్టి మిస్టర్ పోలిశెట్టి'
  },
  'music-school-2023': {
    TitleTe: 'మ్యూజిక్ స్కూల్'
  },
  '711-pm-2023': {
    TitleTe: '7:11 పి.ఎమ్'
  },
  'ahimsa-2023': {
    TitleTe: 'అహింస'
  },
  'jilebi-2023': {
    TitleTe: 'జిలేబి'
  },
  'mao-oori-cinema-2023': {
    TitleTe: 'మా ఊరి సినిమా'
  },
  'bhaag-saale-2023': {
    TitleTe: 'భాగ్ సాలే'
  },
  'bubblegum-2023': {
    TitleTe: 'బబుల్‌గమ్'
  },
  'kranthi-2023': {
    TitleTe: 'క్రాంతి',
    Hero: 'No Hero Lead'
  },
  'kousalya-supraja-rama-2008': {
    TitleTe: 'కౌసల్య సుప్రజ రామ',
    Heroine: 'No Female Lead'
  },
  'vinaro-bhagyamu-vishnu-katha-2023': {
    TitleTe: 'వినరో భాగ్యము విష్ణుకథ'
  },
  '10-rupees-2023': {
    TitleTe: '10 రూపాయలు',
    Heroine: 'No Female Lead'
  },
  'ramabanam-2023': {
    TitleTe: 'రామబాణం'
  },
  'maataraani-mounamidhi-2023': {
    TitleTe: 'మాటరాని మౌనమిది'
  },
  'martin-luther-king-2023': {
    TitleTe: 'మార్టిన్ లూథర్ కింగ్',
    Heroine: 'No Female Lead'
  },
  'pindam-2023': {
    TitleTe: 'పిండం'
  },
};

function parseCSV(content: string): MovieRow[] {
  const lines = content.split('\n');
  const rows: MovieRow[] = [];

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
      rows.push({
        Slug: values[0],
        TitleEn: values[1].replace(/^"|"$/g, ''),
        TitleTe: values[2],
        ReleaseYear: values[3],
        Hero: values[4].replace(/^"|"$/g, ''),
        Heroine: values[5].replace(/^"|"$/g, ''),
        Director: values[6].replace(/^"|"$/g, ''),
      });
    }
  }

  return rows;
}

function stringifyCSV(rows: MovieRow[]): string {
  const lines = ['Slug,Title (English),Title (Telugu - FILL THIS),Release Year,Hero,Heroine,Director'];
  
  for (const row of rows) {
    const values = [
      row.Slug,
      `"${row.TitleEn.replace(/"/g, '""')}"`,
      row.TitleTe,
      row.ReleaseYear,
      `"${row.Hero.replace(/"/g, '""')}"`,
      `"${row.Heroine.replace(/"/g, '""')}"`,
      `"${row.Director.replace(/"/g, '""')}"`,
    ];
    lines.push(values.join(','));
  }
  
  return lines.join('\n');
}

async function applyBatch05Corrections() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║         APPLYING BATCH 05 CORRECTIONS (2023 Movies)                 ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  const mainContent = readFileSync(MAIN_CSV, 'utf-8');
  const mainRecords = parseCSV(mainContent);
  
  const movieMap = new Map<string, MovieRow>();
  mainRecords.forEach(movie => movieMap.set(movie.Slug, movie));

  console.log(chalk.green(`✓ Loaded ${mainRecords.length} movies from main CSV\n`));

  let updatedCount = 0;
  let teluguTitlesAdded = 0;
  let castCorrections = 0;
  let directorCorrections = 0;

  for (const [slug, correction] of Object.entries(batch05Data)) {
    const movie = movieMap.get(slug);
    if (movie) {
      let hasChanges = false;
      const changes: string[] = [];

      if (correction.TitleEn && correction.TitleEn !== movie.TitleEn) {
        changes.push(`EN: "${movie.TitleEn}" → "${correction.TitleEn}"`);
        movie.TitleEn = correction.TitleEn;
        hasChanges = true;
      }

      if (correction.TitleTe && correction.TitleTe !== movie.TitleTe) {
        changes.push(`TE: "${movie.TitleTe || 'EMPTY'}" → "${correction.TitleTe}"`);
        movie.TitleTe = correction.TitleTe;
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
        console.log(chalk.cyan(`${updatedCount}. ${movie.TitleEn} (${slug})`));
        changes.forEach(change => console.log(chalk.gray(`   ${change}`)));
      }
    }
  }

  const updatedCSV = stringifyCSV(Array.from(movieMap.values()));
  const backupFile = MAIN_CSV.replace('.csv', '-before-batch05.csv');
  
  writeFileSync(backupFile, mainContent);
  writeFileSync(MAIN_CSV, updatedCSV);

  const filled = Array.from(movieMap.values()).filter(m => m.TitleTe && m.TitleTe.trim().length > 0).length;
  const total = mainRecords.length;
  const percentage = Math.round((filled / total) * 100);

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                            SUMMARY                                      '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green(`✅ Movies updated: ${updatedCount}`));
  console.log(chalk.green(`✅ Telugu titles added: ${teluguTitlesAdded}`));
  console.log(chalk.yellow(`✅ Cast corrections: ${castCorrections}`));
  console.log(chalk.yellow(`✅ Director corrections: ${directorCorrections}`));
  console.log(chalk.cyan(`\n📊 Total Telugu titles: ${filled}/${total} (${percentage}%)`));
  console.log(chalk.yellow(`⏳ Still pending: ${total - filled}\n`));

  const barLength = 50;
  const filledBars = Math.round((percentage / 100) * barLength);
  const emptyBars = barLength - filledBars;
  
  console.log(chalk.cyan('Overall Progress:'));
  console.log(chalk.green('█'.repeat(filledBars)) + chalk.gray('░'.repeat(emptyBars)) + ` ${percentage}%\n`);

  console.log(chalk.cyan(`📁 Backup: ${backupFile}`));
  console.log(chalk.green(`📁 Updated: ${MAIN_CSV}\n`));

  console.log(chalk.green.bold('✅ Batch 05 corrections applied successfully!\n'));
  console.log(chalk.yellow('🎯 Next: Batch 06 (2023 - 2of3, 50 movies)\n'));
}

applyBatch05Corrections().catch(console.error);
