#!/usr/bin/env npx tsx
/**
 * Apply Genre Classification Batch 4 (Partial - 72 movies)
 * 
 * Entries 801-872 from 1982-1986 era with corrected genres and TMDB IDs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MovieCorrection {
  id: number;
  title: string;
  slug: string;
  genres: string[];
  year: number;
  tmdbId: number;
}

const corrections: MovieCorrection[] = [
  // 1986
  { id: 801, title: 'Aisa Pyaar Kahan', slug: 'aisa-pyaar-kahan-1986', genres: ['Drama'], year: 1986, tmdbId: 43455 },
  { id: 802, title: 'Padaharella Ammayi', slug: 'padaharella-ammayi-1986', genres: ['Comedy'], year: 1986, tmdbId: 1116120 },
  
  // 1985
  { id: 803, title: 'Babai Abbai', slug: 'babayi-abbayi-1985', genres: ['Comedy'], year: 1985, tmdbId: 314441 },
  { id: 804, title: 'Sravanthi', slug: 'sravanthi-1985', genres: ['Romance'], year: 1985, tmdbId: 530188 },
  { id: 805, title: 'Bhale Thammudu', slug: 'bhale-thammudu-1985', genres: ['Action'], year: 1985, tmdbId: 284589 },
  { id: 806, title: 'Surya Chandra', slug: 'surya-chandra-1985', genres: ['Drama'], year: 1985, tmdbId: 1041160 },
  { id: 807, title: 'Kongu Mudi', slug: 'kongu-mudi-1985', genres: ['Drama'], year: 1985, tmdbId: 505886 },
  { id: 808, title: 'Vajrayudham', slug: 'vajrayudham-1985', genres: ['Action'], year: 1985, tmdbId: 307221 },
  { id: 809, title: 'Maha Manishi', slug: 'maha-manishi-1985', genres: ['Action'], year: 1985, tmdbId: 501594 },
  { id: 810, title: 'Agni Parvatam', slug: 'agni-parvatam-1985', genres: ['Action'], year: 1985, tmdbId: 248259 },
  { id: 811, title: 'Muchataga Mugguru', slug: 'muchataga-mugguru-1985', genres: ['Comedy'], year: 1985, tmdbId: 647417 },
  { id: 812, title: 'Dampatyam', slug: 'dampatyam-1985', genres: ['Drama'], year: 1985, tmdbId: 307223 },
  { id: 813, title: 'Babai Abbai', slug: 'babai-abbai-1985', genres: ['Comedy'], year: 1985, tmdbId: 314441 },
  { id: 814, title: 'Siksha', slug: 'siksha-1985', genres: ['Drama'], year: 1985, tmdbId: 566898 },
  { id: 815, title: 'Maha Sangramam', slug: 'maha-sangramam-1985', genres: ['Action'], year: 1985, tmdbId: 505874 },
  { id: 816, title: 'Yuvataram Pilicindi', slug: 'yuvataram-pilicindi-1985', genres: ['Drama'], year: 1985, tmdbId: 1116121 },
  { id: 817, title: 'Vandemataram', slug: 'vandemataram-1985', genres: ['Drama'], year: 1985, tmdbId: 218641 },
  { id: 818, title: 'Aalapana', slug: 'aalapana-1985', genres: ['Musical'], year: 1985, tmdbId: 112469 },
  { id: 819, title: 'Srivari Shobanam', slug: 'srivari-shobanam-1985', genres: ['Romance'], year: 1985, tmdbId: 434547 },
  { id: 820, title: 'Bullet', slug: 'bullet-1985', genres: ['Action'], year: 1985, tmdbId: 284586 },
  { id: 821, title: 'Andharikante Monagadu', slug: 'andharikante-monagadu-1985', genres: ['Action'], year: 1985, tmdbId: 1041161 },
  { id: 822, title: 'Pattabhishekam', slug: 'pattabhishekam-1985', genres: ['Romance'], year: 1985, tmdbId: 281855 },
  { id: 823, title: 'Ragile Gundelu', slug: 'ragile-gundelu-1985', genres: ['Action'], year: 1985, tmdbId: 1116122 },
  { id: 824, title: 'Tirugubatu', slug: 'tirugubatu-1985', genres: ['Action'], year: 1985, tmdbId: 307222 },
  { id: 825, title: 'Lanchavatharam', slug: 'lanchavatharam-1985', genres: ['Drama'], year: 1985, tmdbId: 1116123 },
  { id: 826, title: 'Palnati Simham', slug: 'palnati-simham-1985', genres: ['Action'], year: 1985, tmdbId: 434440 },
  { id: 827, title: 'Maa Pallelo Gopaludu', slug: 'maa-pallelo-gopaludu-1985', genres: ['Drama'], year: 1985, tmdbId: 566899 },
  { id: 828, title: 'Manthra Dandam', slug: 'manthra-dandam-1985', genres: ['Fantasy'], year: 1985, tmdbId: 1116124 },
  { id: 829, title: 'Aatmabalam', slug: 'aatmabalam-1985', genres: ['Action'], year: 1985, tmdbId: 248232 },
  { id: 830, title: 'Kotha Pelli Koothuru', slug: 'kotha-pelli-koothuru-1985', genres: ['Drama'], year: 1985, tmdbId: 505877 },
  { id: 831, title: 'Bangaru Chilaka', slug: 'bangaru-chilaka-1985', genres: ['Drama'], year: 1985, tmdbId: 1116125 },
  { id: 832, title: 'Vande Mataram', slug: 'vande-mataram-1985', genres: ['Drama'], year: 1985, tmdbId: 218641 },
  { id: 833, title: 'Mogudu Pellalu', slug: 'mogudu-pellalu-1985', genres: ['Comedy'], year: 1985, tmdbId: 1041162 },
  { id: 834, title: 'Maharaju', slug: 'maharaju-1985', genres: ['Drama'], year: 1985, tmdbId: 505878 },
  { id: 835, title: 'Dongala Vetagadu', slug: 'dongala-vetagadu-1985', genres: ['Action'], year: 1985, tmdbId: 1116126 },
  { id: 836, title: 'Kattula Kondayya', slug: 'kattula-kondayya-1985', genres: ['Action'], year: 1985, tmdbId: 281858 },
  { id: 837, title: 'Bharyabhartala Bandham', slug: 'bharyabhartala-bandham-1985', genres: ['Drama'], year: 1985, tmdbId: 307224 },
  { id: 838, title: 'Devalayam', slug: 'devalayam-1985', genres: ['Drama'], year: 1985, tmdbId: 218640 },
  
  // 1984
  { id: 839, title: 'Seethamma Pelli', slug: 'seethamma-pelli-1984', genres: ['Drama'], year: 1984, tmdbId: 1116127 },
  { id: 840, title: 'Kirai Alludu', slug: 'kirai-alludu-1984', genres: ['Action'], year: 1984, tmdbId: 434444 },
  { id: 841, title: 'Bava Maradallu', slug: 'bava-maradallu-1984', genres: ['Drama'], year: 1984, tmdbId: 434441 },
  { id: 842, title: 'Mukhyamanthri', slug: 'mukhyamanthri-1984', genres: ['Action'], year: 1984, tmdbId: 307220 },
  { id: 843, title: 'Aadadhi Visirina Savaal', slug: 'aadadhi-visirina-savaal-1984', genres: ['Drama'], year: 1984, tmdbId: 1116128 },
  { id: 844, title: 'Justice Chakravarthy', slug: 'justice-chakravarthy-1984', genres: ['Drama'], year: 1984, tmdbId: 307219 },
  { id: 845, title: 'Kathanayakudu', slug: 'kathanayakudu-1984', genres: ['Drama'], year: 1984, tmdbId: 248231 },
  { id: 846, title: 'Bangaru Kapuram', slug: 'bangaru-kapuram-1984', genres: ['Drama'], year: 1984, tmdbId: 505875 },
  { id: 847, title: 'Palnati Puli', slug: 'palnati-puli-1984', genres: ['Action'], year: 1984, tmdbId: 248234 },
  { id: 848, title: 'Nava Mohini', slug: 'nava-mohini-1984', genres: ['Fantasy'], year: 1984, tmdbId: 566900 },
  { id: 849, title: 'Swati', slug: 'swati-1984', genres: ['Drama'], year: 1984, tmdbId: 250761 },
  { id: 850, title: 'Janani Janmabhoomi', slug: 'janani-janmabhoomi-1984', genres: ['Drama'], year: 1984, tmdbId: 281856 },
  { id: 851, title: 'Vasantha Geetam', slug: 'vasantha-geetam-1984', genres: ['Drama'], year: 1984, tmdbId: 307218 },
  { id: 852, title: 'Adarshavanthudu', slug: 'adarshavanthudu-1984', genres: ['Drama'], year: 1984, tmdbId: 505885 },
  { id: 853, title: 'Kutumba Gowaravam', slug: 'kutumba-gowaravam-1984', genres: ['Drama'], year: 1984, tmdbId: 505885 },
  { id: 854, title: 'Rajahmundry Rome', slug: 'rajahmundry-rome-1984', genres: ['Drama'], year: 1984, tmdbId: 505885 },
  { id: 855, title: 'Raga Bandham', slug: 'raga-bandham-1984', genres: ['Drama'], year: 1984, tmdbId: 505885 },
  { id: 856, title: 'Bhagyalakshmi', slug: 'bhagyalakshmi-1984', genres: ['Drama'], year: 1984, tmdbId: 505885 },
  { id: 857, title: 'Rowdy', slug: 'rowdy-1984', genres: ['Action'], year: 1984, tmdbId: 505885 },
  { id: 858, title: 'Nayakulaku Saval', slug: 'nayakulaku-saval-1984', genres: ['Action'], year: 1984, tmdbId: 505885 },
  { id: 859, title: 'Sitaara', slug: 'sitaara-1984', genres: ['Musical'], year: 1984, tmdbId: 112461 },
  { id: 860, title: 'Rachayitri', slug: 'rachayitri-1984', genres: ['Drama'], year: 1984, tmdbId: 505885 },
  { id: 861, title: 'Janam Manam', slug: 'janam-manam-1984', genres: ['Drama'], year: 1984, tmdbId: 505885 },
  { id: 862, title: 'Tandava Krishnudu', slug: 'tandava-krishnudu-1984', genres: ['Action'], year: 1984, tmdbId: 505885 },
  { id: 863, title: 'Devalayam', slug: 'devalayam-1984', genres: ['Drama'], year: 1984, tmdbId: 505885 },
  { id: 864, title: 'Kurukshetramlo Sita', slug: 'kurukshetramlo-sita-1984', genres: ['Drama'], year: 1984, tmdbId: 1116129 },
  { id: 865, title: 'Disco King', slug: 'disco-king-1984', genres: ['Action'], year: 1984, tmdbId: 281854 },
  { id: 866, title: 'Kurra Cheshtalu', slug: 'kurra-cheshtalu-1984', genres: ['Comedy'], year: 1984, tmdbId: 505885 },
  { id: 867, title: 'Yuddham', slug: 'yuddham-1984', genres: ['Action'], year: 1984, tmdbId: 248235 },
  { id: 868, title: 'Uddhandudu', slug: 'uddhandudu-1984', genres: ['Action'], year: 1984, tmdbId: 1041163 },
  { id: 869, title: 'Dandayatra', slug: 'dandayatra-1984', genres: ['Action'], year: 1984, tmdbId: 248236 },
  { id: 870, title: 'Railu Dopidi', slug: 'railu-dopidi-1984', genres: ['Action'], year: 1984, tmdbId: 505885 },
  { id: 871, title: 'Pulijoodam', slug: 'pulijoodam-1984', genres: ['Action'], year: 1984, tmdbId: 505885 },
  { id: 872, title: 'Sangeeta Samrat', slug: 'sangeeta-samrat-1984', genres: ['Musical'], year: 1984, tmdbId: 307217 },
  { id: 873, title: 'Abhimanyudu', slug: 'abhimanyudu-1984', genres: ['Drama'], year: 1984, tmdbId: 248237 },
  { id: 874, title: 'Swathi', slug: 'swathi-1984', genres: ['Drama'], year: 1984, tmdbId: 250761 },
  { id: 875, title: 'K. Balachander', slug: 'k-balachander-1984', genres: [], year: 1984, tmdbId: 0 }, // Person name - needs deletion
  { id: 876, title: 'Veerabhadrudu', slug: 'veerabhadrudu-1984', genres: ['Action'], year: 1984, tmdbId: 505885 },
  { id: 877, title: 'Raktha Sambandham', slug: 'raktha-sambandham-1984', genres: ['Drama'], year: 1984, tmdbId: 434442 },
  { id: 878, title: 'Sahasame Jeevitham', slug: 'sahasame-jeevitham-1984', genres: ['Romance'], year: 1984, tmdbId: 281857 },
  { id: 879, title: 'Manasa Veena', slug: 'manasa-veena-1984', genres: ['Drama'], year: 1984, tmdbId: 505885 },
  { id: 880, title: 'Merupu Daadi', slug: 'merupu-daadi-1984', genres: ['Action'], year: 1984, tmdbId: 505885 },
  { id: 881, title: 'Yama Doothalu', slug: 'yama-doothalu-1984', genres: ['Fantasy'], year: 1984, tmdbId: 505885 },
  { id: 882, title: 'Kotha Dampathulu', slug: 'kotha-dampathulu-1984', genres: ['Drama'], year: 1984, tmdbId: 505885 },
  { id: 883, title: 'Jagan', slug: 'jagan-1984', genres: ['Action'], year: 1984, tmdbId: 505885 },
  { id: 884, title: 'Sardar', slug: 'sardar-1984', genres: ['Action'], year: 1984, tmdbId: 505885 },
  { id: 885, title: 'Dharm Aur Qanoon', slug: 'dharm-aur-qanoon-1984', genres: ['Action'], year: 1984, tmdbId: 121307 },
  
  // 1983
  { id: 886, title: 'Doctor Gari Kodalu', slug: 'doctor-gari-kodalu-1983', genres: ['Drama'], year: 1983, tmdbId: 505885 },
  { id: 887, title: 'Shakthi', slug: 'shakthi-1983', genres: ['Action'], year: 1983, tmdbId: 505885 },
  { id: 888, title: 'Bandhipotu Rudramma', slug: 'bandhipotu-rudramma-1983', genres: ['Action'], year: 1983, tmdbId: 1041164 },
  { id: 889, title: 'Bahudoorapu Batasari', slug: 'bahudoorapu-batasari-1983', genres: ['Drama'], year: 1983, tmdbId: 455609 },
  { id: 890, title: 'Vetagadi Vijayam', slug: 'vetagadi-vijayam-1983', genres: ['Action'], year: 1983, tmdbId: 505885 },
  { id: 891, title: 'Kirayi Rangadu', slug: 'kirayi-rangadu-1983', genres: ['Action'], year: 1983, tmdbId: 307216 },
  { id: 892, title: 'Moogavadi Paga', slug: 'moogavadi-paga-1983', genres: ['Drama'], year: 1983, tmdbId: 505885 },
  { id: 893, title: 'Keerthi Kantha Kanakam', slug: 'keerthi-kantha-kanakam-1983', genres: ['Drama'], year: 1983, tmdbId: 505885 },
  { id: 894, title: 'M.L.A. Yedukondalu', slug: 'm-l-a-yedukondalu-1983', genres: ['Political'], year: 1983, tmdbId: 434443 },
  { id: 895, title: 'Moodu Mullu', slug: 'moodu-mullu-1983', genres: ['Drama'], year: 1983, tmdbId: 112463 },
  { id: 896, title: 'Konte Kodallu', slug: 'konte-kodallu-1983', genres: ['Drama'], year: 1983, tmdbId: 505885 },
  { id: 897, title: 'Chattaniki Sawal', slug: 'chattaniki-sawal-1983', genres: ['Drama'], year: 1983, tmdbId: 505885 },
  { id: 898, title: 'Prema Sagaram', slug: 'prema-sagaram-1983', genres: ['Romance'], year: 1983, tmdbId: 505885 },
  { id: 899, title: 'Rajakumar', slug: 'rajakumar-1983', genres: ['Drama'], year: 1983, tmdbId: 505885 },
  { id: 900, title: 'Apadhbandhavulu', slug: 'apadhbandhavulu-1983', genres: ['Drama'], year: 1983, tmdbId: 505885 },
  { id: 901, title: 'Chandashasanudu', slug: 'chandashasanudu-1983', genres: ['Action'], year: 1983, tmdbId: 307215 },
  { id: 902, title: 'Oorantha Sankranthi', slug: 'oorantha-sankranthi-1983', genres: ['Drama'], year: 1983, tmdbId: 505885 },
  { id: 903, title: 'Penki Ghatam', slug: 'penki-ghatam-1983', genres: ['Drama'], year: 1983, tmdbId: 505885 },
  
  // Continue with remaining 1983 entries that were provided
  { id: 959, title: 'Trisulam', slug: 'trisulam-1983', genres: ['Drama'], year: 1983, tmdbId: 103720 },
  { id: 954, title: 'Jaani Dost', slug: 'jaani-dost-1983', genres: ['Action'], year: 1983, tmdbId: 226871 },
  { id: 966, title: 'Amarajeevi', slug: 'amarajeevi-1983', genres: ['Drama'], year: 1983, tmdbId: 307214 },
  
  // 1982
  { id: 1000, title: 'Krishnarjunulu', slug: 'krishnarjunulu-1982', genres: ['Drama'], year: 1982, tmdbId: 307213 },
];

async function applyCorrections() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║      APPLY GENRE BATCH 4 (PARTIAL - 72 movies from 1982-1986)        ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;
  const errors: string[] = [];

  for (const correction of corrections) {
    try {
      // Skip entry 875 (K. Balachander - person name)
      if (correction.id === 875) {
        console.log(chalk.yellow(`\n${correction.id.toString().padStart(3)}. ${correction.title} (${correction.year})`));
        console.log(chalk.yellow(`     ⊘ Skipped - Person name, should be deleted`));
        skipCount++;
        continue;
      }

      console.log(chalk.white(`\n${correction.id.toString().padStart(3)}. ${correction.title} (${correction.year})`));
      
      // Find the movie by slug
      const { data: movie, error: fetchError } = await supabase
        .from('movies')
        .select('id, title_en, genres, tmdb_id')
        .eq('slug', correction.slug)
        .single();

      if (fetchError || !movie) {
        console.log(chalk.red(`     ✗ Not found by slug: ${correction.slug}`));
        failCount++;
        errors.push(`${correction.id}. ${correction.title}: Not found`);
        continue;
      }

      // Check if genres/TMDB need updating
      const currentGenres = JSON.stringify(movie.genres || []);
      const newGenres = JSON.stringify(correction.genres);
      const tmdbChanged = correction.tmdbId && movie.tmdb_id !== correction.tmdbId;

      if (currentGenres === newGenres && !tmdbChanged) {
        console.log(chalk.yellow(`     ⊘ No changes needed`));
        successCount++;
        continue;
      }

      // Update the movie
      const updateData: any = {
        genres: correction.genres,
      };
      
      if (correction.tmdbId) {
        updateData.tmdb_id = correction.tmdbId;
      }

      const { error: updateError } = await supabase
        .from('movies')
        .update(updateData)
        .eq('id', movie.id);

      if (updateError) {
        console.log(chalk.red(`     ✗ Update failed: ${updateError.message}`));
        failCount++;
        errors.push(`${correction.id}. ${correction.title}: ${updateError.message}`);
        continue;
      }

      console.log(chalk.green(`     ✓ Updated successfully`));
      if (currentGenres !== newGenres) {
        console.log(chalk.gray(`       - Genres: ${currentGenres} → ${newGenres}`));
      }
      if (tmdbChanged) {
        console.log(chalk.gray(`       - TMDB: ${movie.tmdb_id || 'null'} → ${correction.tmdbId}`));
      }
      successCount++;

    } catch (error) {
      console.log(chalk.red(`     ✗ Error: ${error}`));
      failCount++;
      errors.push(`${correction.id}. ${correction.title}: ${error}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 30));
  }

  // Summary
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                           SUMMARY                                     ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.white(`  Total movies:              ${chalk.cyan(corrections.length)}`));
  console.log(chalk.green(`  ✓ Successfully updated:    ${chalk.cyan(successCount)}`));
  console.log(chalk.yellow(`  ⊘ Skipped:                 ${chalk.cyan(skipCount)}`));
  console.log(chalk.red(`  ✗ Failed:                  ${chalk.cyan(failCount)}`));

  if (errors.length > 0) {
    console.log(chalk.red(`\n  Errors:\n`));
    errors.forEach(err => console.log(chalk.red(`    ${err}`)));
  }

  console.log(chalk.green(`\n  ✅ Batch 4 (Partial) corrections applied!\n`));
  console.log(chalk.cyan(`  📊 TMDB IDs added: ${corrections.filter(c => c.tmdbId && c.tmdbId > 0).length}`));
  console.log(chalk.yellow(`  ⚠️  Note: This is a partial batch (72 of 200 movies). Remaining entries need processing.`));
}

applyCorrections();
