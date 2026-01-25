import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(chalk.red('Supabase credentials not set'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const DRY_RUN = process.argv.includes('--dry-run');

interface MovieFix {
  id: string;
  title_en: string;
  title_te?: string;
  release_year?: number | string;
  slug?: string;
  action: 'update_year' | 'publish' | 'fix_slug' | 'add_synopsis';
  expectedValue: string;
  anomalyType: string;
}

// Batch 1: Missing release_year (critical) - Using full UUIDs from CSV
const batch1_missingYear: MovieFix[] = [
  { id: 'f04c0dcd-bbf6-4fd7-ba75-32b5b9f5d1a3', title_en: 'AA22xA6', release_year: null, action: 'update_year', expectedValue: 'TBA', anomalyType: 'missing_year' },
  { id: 'a34582fd-a861-45ab-8b5f-4190d6296bba', title_en: 'Umapathi', title_te: 'ఉమాపతి', release_year: 2023, action: 'update_year', expectedValue: '2023', anomalyType: 'missing_year' },
  { id: '50d562f6-70b0-4a8f-8795-564a24b2da9a', title_en: 'Oh..! Sukumari', title_te: 'ఓ..! సుకుమారి', release_year: null, action: 'update_year', expectedValue: 'TBA', anomalyType: 'missing_year' },
  { id: '2ac29b5b-1f24-42ed-af0c-399e037111e2', title_en: 'Takshakudu', title_te: 'తక్షకుడు', release_year: 2021, action: 'update_year', expectedValue: '2021', anomalyType: 'missing_year' },
  { id: '62ff2985-5995-4c9d-84ef-0393342a97db', title_en: 'Pushpa 3 - The Rampage', title_te: 'పుష్ప 3 - ది రాంపేజ్', release_year: null, action: 'update_year', expectedValue: 'TBA', anomalyType: 'missing_year' },
  { id: 'b4a1cdb1-e53a-40e9-9c0f-00de7e170a96', title_en: 'Comrade Kalyan', title_te: 'కామ్రేడ్ కళ్యాణ్', release_year: null, action: 'update_year', expectedValue: 'TBA', anomalyType: 'missing_year' },
  { id: '436f66ec-1b0c-455c-a0a3-20dd786fb3cd', title_en: 'Illicit Relationship', title_te: 'ఇల్లిసిట్ రిలేషన్ షిప్', release_year: null, action: 'update_year', expectedValue: 'TBA', anomalyType: 'missing_year' },
  { id: '0dc041e2-92cc-4311-8c8e-170204298d94', title_en: 'Euphoria', title_te: 'యుఫోరియా', release_year: 2025, action: 'update_year', expectedValue: '2025', anomalyType: 'missing_year' },
  { id: '90b5d473-918b-4b28-890d-60ac4ed76174', title_en: 'Band Melam', title_te: 'బ్యాండ్ మేళం', release_year: 2024, action: 'update_year', expectedValue: '2024', anomalyType: 'missing_year' },
  { id: '9349ed3e-60b2-4e8e-b1fe-32d6dcfb16b1', title_en: 'Asuragana Rudra', title_te: 'అసురగణ రుద్ర', release_year: null, action: 'update_year', expectedValue: 'TBA', anomalyType: 'missing_year' },
  { id: 'f2fada23-b9c1-4f0a-840a-bf79bf3bbacb', title_en: 'Garividi Lakshmi', title_te: 'గరివిడి లక్ష్మి', release_year: null, action: 'update_year', expectedValue: 'TBA', anomalyType: 'missing_year' },
  { id: '9bec9780-64df-43c8-ba42-d2ccb0d39a3d', title_en: 'DQ 41', title_te: 'డీక్యూ 41', release_year: null, action: 'update_year', expectedValue: 'TBA', anomalyType: 'missing_year' },
  { id: '3eb55434-16e6-4c9c-b9ac-88f7ff54e0c8', title_en: 'Arrtham', title_te: 'అర్థం', release_year: 2022, action: 'update_year', expectedValue: '2022', anomalyType: 'missing_year' },
  { id: 'ae3cab6e-cb6b-40e5-854e-94d1a69ce0d1', title_en: 'HaiLesso', title_te: 'హైలెస్సో', release_year: null, action: 'update_year', expectedValue: 'TBA', anomalyType: 'missing_year' },
  { id: '6e2f5c00-c8cf-47f7-8dd9-54c8ae528b7d', title_en: 'Kirathaka', title_te: 'కిరాతక', release_year: null, action: 'update_year', expectedValue: 'TBA', anomalyType: 'missing_year' },
  { id: '5798b7f3-5a17-4d6c-b31a-f8f3ca3d57a0', title_en: 'Biker', title_te: 'బైకర్', release_year: null, action: 'update_year', expectedValue: 'TBA', anomalyType: 'missing_year' },
  { id: 'e0973669-4934-407d-aad1-6bccc3a6cce4', title_en: 'Abhiram', title_te: 'అభిరామ్', release_year: 2023, action: 'update_year', expectedValue: '2023', anomalyType: 'missing_year' },
  { id: '3e471652-8d76-4b16-9b93-d5f83aed2fba', title_en: 'Amaran in the City', title_te: 'అమరన్ ఇన్ ది సిటీ', release_year: null, action: 'update_year', expectedValue: 'TBA', anomalyType: 'missing_year' },
  { id: '4edf9132-d1f0-46db-94a8-3be23cc27e2f', title_en: 'Legacy', title_te: 'లెగసీ', release_year: null, action: 'update_year', expectedValue: 'TBA', anomalyType: 'missing_year' },
  { id: 'd91f34c8-cef4-4fcd-a88f-2aa7ae9c6f3f', title_en: 'Maate Mantramu', title_te: 'మాటే మంత్రము', release_year: 2024, action: 'update_year', expectedValue: '2024', anomalyType: 'missing_year' },
  { id: '710aeabe-7bff-4b8f-89c1-e7f60e7a4e43', title_en: 'What The Fish', title_te: 'వాట్ ది ఫిష్', release_year: 2025, action: 'update_year', expectedValue: '2025', anomalyType: 'missing_year' },
  { id: 'c3b46098-0eaa-465c-96cf-d7b5b02a5c36', title_en: 'Peddarikam', title_te: 'పె

ద్దరికం', release_year: 1992, action: 'update_year', expectedValue: '1992', anomalyType: 'missing_year' },
];

// Batch 2-6: Unpublished movies with all data (low severity - just need to publish)
const unpublishedMovies: string[] = [
  // Batch 2
  '55df6ffa', 'e14081ce', '9fbb2a89', 'a3856586', '7d871488', 'dbedf906', '403cecd6', '491c411e',
  '013b7d19', 'efacc0d0', 'bfea3463', '5f5d3e98', 'c28a87b3', 'a1229efe', 'd79b6116',
  // Batch 3
  '347cf1d3', 'ceb92c6e', 'cbde9d05', '11cf9ae5', '02480c17', 'bba5164b', 'd5394c77', 'c8d8acb3',
  '974fd9d8', '821e69ba', '3d8ecd93', 'd0dc465b', '4d783b62', '89c1d923', '82b5a541', '190271f9',
  'fb647558', '60a2500f', '6673c226', '32174d6c', 'd852880a', '13634e8d', 'd1e04660', 'a9d41d6f',
  'eff5e331', 'b5c08365', '244b0e93', 'dbcaed11', '0ce4565e', 'e46bf1d4', '5c5ccd83', 'c824c7d9',
  '1731fae4', 'c2f5d811', '92cc86bd', '841cd6eb', '4cc2e762', 'a650d1af', 'e6fefce9', '3a5a22d4',
  '312d0971', 'e595bb1a', '8792dce3', 'b4680fc7', 'e9461446', '20fbec03', 'de83e75d', '54e592eb',
  '0a89625a', 'a2535f18',
  // Batch 4
  '4d4272df', '1a3780b5', '8d5661d7', '743c6a23', '59843167', 'a1abae5b', '6281e969', '63ffe204',
  'ddbe0d65', '8b272985', '4f90abdc', '84090509', '17b4ccf8', '3e4aa894', 'edaf6d0b', '5c7e40c9',
  'c5891998', 'b5fe3fa1', 'ffb85958', '3240c902', 'f5eb03f0', 'b9b2b025', '6cf3915e', '53e84445',
  'cea3a5bd', '2ff765c5', 'da3e4f86', '87037082', 'ea6d1668', 'ef6a1926', 'c0b1887d', '969e53bd',
  'f181d300', '6e7551a6', '01ffe924', '7cdc48bc', '0740dc21', '7b6a9a37', '956565f0', '98f8408c',
  '793f0570', '19a3b00d', '8edd51b9', 'd9875672', 'a0b1a3f1', '82ee344b',
  // Batch 5
  '55fc1695', '2a647298', '1b33fc0d', '0121a07d', 'ecf04919', 'dc82e7f0', 'aedeeacd', 'f2e679da',
  '24ad0344', '5f7cac48', 'a78899c8', '43ab6c25', '3f3ee76a', 'b483f1d3', '551f4b34', 'ea12c6e6',
  '483048dc', '0df69328', '0438cb34', '99c15167', '0c0bcee9', '2b192376', 'fb6e165d', '9ac376b5',
  '696c209b', 'c9ff441d', 'b50189ae', '815a26e8', '49b460cc', '3d5f62d9', '0ca61e56', '002af0f5',
  'a0fd2224', '8b005096', 'f00064c5', '66a6d89d', 'f3837497', 'ec7a1fad', '3488d0ba', 'ee420087',
  '163f48dd', '6d1d2367', 'b28d034e', '9c5294f7', '0b7c0d39', 'dc55bbfd', '24db641d', 'b7eee55d',
  'f2aef9b1', '09880704',
  // Batch 6
  '2c1020b3', 'ca6ace65', '46743597', '8185b0a6', '8673c4bb', '8e3e6645', '6e62bfa7', 'fdc99234',
  '73852771', '401046a0', '6dbc0db8', '157d7f31', 'd943e10c', 'f3c2c8ce', 'ec2e0a6f', '3339bc29',
  '26e1907c', '473a6ace', '8156a1c9', 'b9cbdc87', 'e1e24dd0', '633346a4', '3f605ec6', '8da5f217',
  'd831e68e', 'eedba982', 'f4be5434', '5b3b4ff8', 'd4e870ec', 'f5672885', '2bb2a51e', '359ac426',
  '638cc713', '891b1345', 'dd469fe4', 'b1b1d27d', '6c48bb21', '5bfc95a5', '0e49aa08', 'f027be68',
  '42871b84', '3ed1ee9e', 'dccb9b54', 'b7004ded', '679d3675', '016ab76e', 'b8f2602f', '4f175da2',
  '783e3717', '08417205',
  // Batch 7
  '329e30ea', 'b36f8a8a', '027732ac', '7819bc36', 'be16d506', '0470db7c', 'e0d25bac', '830f9b70',
  '12972dd5', '72b79c6d', 'b9bcd372', '35a58d79', '88204f3f', 'dee28527', '48fec23b', '78cdb553',
  '15772a78', 'fa9cce86', 'edd384c3', 'f539626f', '69884271', '3bc980d8', '317d4fcd', 'aae5fc35',
  '09ca5843', '1e863abf', '1922b125', '496b0cea', '876c25ab', 'eb36a249', '5770e453', 'f63f8f79',
  'edba5b22', '60ce68fe', '5cd59aa6', '6c94536a', 'd85c288e', '1ec7c2ea', '56e4bc94', '70754cdb',
  '575f85e1', '47699c93', 'e093ac19', '0b0303e1', '4be04257', 'b6c4d5b6', 'dfac2e5b', '9470027b',
  'c346ffc7', 'b27127b7',
  // Batch 8
  'aa9a479f', '7badf75c', '1379a711', 'e478a768', '1491da18', '9e2bdc23', '8cd34eb3', '75c3e488',
  'cd5bee1f', '15564d81', '116c6698', '410e8add', '015c3683', 'c1abe45b', 'e07cec7b', 'e0dea6e4',
  'd4cf18ec', '634a1010', '7e649f49', '37d6de3f', '07fd9a9c', '2e6205fa', '381147ee', '3fe73a50',
  'a6085078', 'd2de1bc7', '83bba356', '6505fa05', '1e00b9d8', 'e4902edd', 'af0d6f90', '7f76fdbb',
  '94cf2b3a', '4fff8777', 'eb3d0399', 'd251adbe', 'da5b0ed9', '221ac69e', 'bc854111', 'c35a5f4b',
  'e7628c5e', '2b3fcc13', 'da384a2a', 'd4b0ca84', '173ac918', '65a72a08', 'fe850895', '0c60aad4',
  // Batch 9
  'ff0e2218', 'd097e594', '2cd060de', '60174a35', '26335af9', 'e1e0fd44', '00ed562a', '50fa34ab',
  'd58809d5', 'ab1d8eae', 'b94545e3', 'ee04ef14', '540d5c48', 'fa6a71b0', 'c942359c', 'a9261a50',
  '7075c4ec',
];

// Special cases: Year/Date mismatches
const yearMismatches: MovieFix[] = [
  { id: '42fb455f', title_en: 'Guard: Revenge', release_year: 2024, action: 'update_year', expectedValue: '2024', anomalyType: 'year_date_mismatch' },
  { id: '9a788ea5', title_en: 'Salaar: Part 2', release_year: 2026, action: 'update_year', expectedValue: '2026', anomalyType: 'year_date_mismatch' },
];

// Special cases: Slug format issues
const slugFixes: MovieFix[] = [
  { id: 'a98974a0', title_en: 'Vāranāsi', slug: 'varanasi-2026', release_year: 2026, action: 'fix_slug', expectedValue: 'varanasi-2026', anomalyType: 'slug_format_issue' },
  { id: '9b7b604c', title_en: 'Devara: Part 2', slug: 'devara-part-2-2026', release_year: 2026, action: 'fix_slug', expectedValue: 'devara-part-2-2026', anomalyType: 'slug_format_issue' },
  { id: '5f4d9c51', title_en: 'G.D.N', slug: 'gd-naidu-2025', release_year: 2025, action: 'fix_slug', expectedValue: 'gd-naidu-2025', anomalyType: 'slug_format_issue' },
];

// Special cases: Missing synopsis
const synopsisMissing: MovieFix[] = [
  { id: '2526bbf3', title_en: 'Sahaa', action: 'add_synopsis', expectedValue: 'Add Synopsis', anomalyType: 'missing_synopsis' },
  { id: '6033a2e0', title_en: 'Monster', action: 'add_synopsis', expectedValue: 'Add Full Synopsis', anomalyType: 'missing_synopsis' },
  { id: '4576fe1c', title_en: 'Maha', action: 'add_synopsis', expectedValue: 'Add Full Synopsis', anomalyType: 'missing_synopsis' },
];

async function main() {
  console.log(chalk.blue('\n🎬 BATCH FIX MOVIE ANOMALIES\n'));
  
  if (DRY_RUN) {
    console.log(chalk.cyan('📝 DRY RUN MODE - No changes will be made\n'));
  } else {
    console.log(chalk.yellow('⚠️  EXECUTE MODE - Updating database...\n'));
  }

  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  // Process Batch 1: Missing Years
  console.log(chalk.cyan('═══════════════════════════════════════════'));
  console.log(chalk.cyan('BATCH 1: FIXING MISSING RELEASE YEARS'));
  console.log(chalk.cyan('═══════════════════════════════════════════\n'));

  for (const movie of batch1_missingYear) {
    const yearValue = movie.expectedValue === 'TBA' ? null : parseInt(movie.expectedValue);
    console.log(chalk.yellow(`[${totalProcessed + 1}] ${movie.title_en}`));
    console.log(chalk.gray(`  ID: ${movie.id} | Year: ${yearValue || 'NULL'}`));

    if (!DRY_RUN) {
      const updateData: any = { release_year: yearValue };
      if (movie.title_te) {
        updateData.title_te = movie.title_te;
      }

      const { error } = await supabase
        .from('movies')
        .update(updateData)
        .eq('id', movie.id);

      if (error) {
        console.log(chalk.red(`  ✗ Failed: ${error.message}\n`));
        totalFailed++;
      } else {
        console.log(chalk.green(`  ✅ Updated\n`));
        totalSuccess++;
      }
    } else {
      console.log(chalk.cyan(`  ⊳ Would update to: ${yearValue || 'NULL'}\n`));
      totalSuccess++;
    }
    totalProcessed++;
  }

  // Process Unpublished Movies
  console.log(chalk.cyan('═══════════════════════════════════════════'));
  console.log(chalk.cyan('BATCH 2-6: PUBLISHING MOVIES WITH ALL DATA'));
  console.log(chalk.cyan('═══════════════════════════════════════════\n'));
  console.log(chalk.gray(`Total movies to publish: ${unpublishedMovies.length}\n`));

  for (const movieId of unpublishedMovies) {
    console.log(chalk.yellow(`[${totalProcessed + 1}] Publishing ${movieId}`));

    if (!DRY_RUN) {
      const { error } = await supabase
        .from('movies')
        .update({ is_published: true })
        .eq('id', movieId);

      if (error) {
        console.log(chalk.red(`  ✗ Failed: ${error.message}\n`));
        totalFailed++;
      } else {
        console.log(chalk.green(`  ✅ Published\n`));
        totalSuccess++;
      }
    } else {
      console.log(chalk.cyan(`  ⊳ Would publish\n`));
      totalSuccess++;
    }
    totalProcessed++;
  }

  // Process Year Mismatches
  console.log(chalk.cyan('═══════════════════════════════════════════'));
  console.log(chalk.cyan('FIXING YEAR/DATE MISMATCHES'));
  console.log(chalk.cyan('═══════════════════════════════════════════\n'));

  for (const movie of yearMismatches) {
    console.log(chalk.yellow(`[${totalProcessed + 1}] ${movie.title_en}`));
    console.log(chalk.gray(`  ID: ${movie.id} | New Year: ${movie.release_year}`));

    if (!DRY_RUN) {
      const { error } = await supabase
        .from('movies')
        .update({ release_year: movie.release_year })
        .eq('id', movie.id);

      if (error) {
        console.log(chalk.red(`  ✗ Failed: ${error.message}\n`));
        totalFailed++;
      } else {
        console.log(chalk.green(`  ✅ Updated\n`));
        totalSuccess++;
      }
    } else {
      console.log(chalk.cyan(`  ⊳ Would update year to: ${movie.release_year}\n`));
      totalSuccess++;
    }
    totalProcessed++;
  }

  // Process Slug Fixes
  console.log(chalk.cyan('═══════════════════════════════════════════'));
  console.log(chalk.cyan('FIXING SLUG FORMATS'));
  console.log(chalk.cyan('═══════════════════════════════════════════\n'));

  for (const movie of slugFixes) {
    console.log(chalk.yellow(`[${totalProcessed + 1}] ${movie.title_en}`));
    console.log(chalk.gray(`  ID: ${movie.id} | New Slug: ${movie.slug}`));

    if (!DRY_RUN) {
      const updateData: any = { slug: movie.slug };
      if (movie.release_year) {
        updateData.release_year = movie.release_year;
      }

      const { error } = await supabase
        .from('movies')
        .update(updateData)
        .eq('id', movie.id);

      if (error) {
        console.log(chalk.red(`  ✗ Failed: ${error.message}\n`));
        totalFailed++;
      } else {
        console.log(chalk.green(`  ✅ Updated\n`));
        totalSuccess++;
      }
    } else {
      console.log(chalk.cyan(`  ⊳ Would update slug to: ${movie.slug}\n`));
      totalSuccess++;
    }
    totalProcessed++;
  }

  // Summary
  console.log(chalk.blue('═'.repeat(60)));
  console.log(chalk.blue('SUMMARY'));
  console.log(chalk.blue('═'.repeat(60) + '\n'));

  console.log(chalk.cyan(`Total Processed:    ${totalProcessed}`));
  console.log(chalk.green(`Successful:         ${totalSuccess}`));
  console.log(chalk.red(`Failed:             ${totalFailed}\n`));

  if (synopsisMissing.length > 0) {
    console.log(chalk.yellow('⚠️  MANUAL ACTION REQUIRED:\n'));
    console.log(chalk.yellow('The following movies need synopses added manually:\n'));
    synopsisMissing.forEach((movie, i) => {
      console.log(chalk.gray(`${i + 1}. ${movie.title_en} (${movie.id})`));
    });
    console.log('');
  }

  if (!DRY_RUN && totalSuccess > 0) {
    console.log(chalk.green('🎉 Movie anomalies fixed successfully!\n'));
    console.log(chalk.yellow('🔄 Changes are live - refresh your browser to see updates\n'));
  } else if (DRY_RUN) {
    console.log(chalk.blue('📝 DRY RUN completed\n'));
    console.log(chalk.blue('Run without --dry-run to apply changes:\n'));
    console.log(chalk.blue('  npx tsx scripts/batch-fix-movie-anomalies.ts\n'));
  }

  console.log(chalk.blue('═'.repeat(60) + '\n'));
}

main().catch(console.error);
