import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

interface GenderSwapFix {
  slug: string;
  title: string;
  year: number | null;
  actorToMove: string;
  newCorrectField: 'Hero' | 'Heroine';
}

// All 89 fixes from GENDER-SWAP-REMAINING-89.csv
const genderSwapFixes: GenderSwapFix[] = [
  // Hero → Heroine fixes (Female actors incorrectly in hero field)
  { slug: 'mawaali-1983', title: 'Mawaali', year: 1983, actorToMove: 'Sridevi', newCorrectField: 'Heroine' },
  { slug: 'angeekaaram-1977', title: 'Angeekaaram', year: 1977, actorToMove: 'Sridevi', newCorrectField: 'Heroine' },
  { slug: 'vaanam-2011', title: 'Vaanam', year: 2011, actorToMove: 'Anushka Shetty', newCorrectField: 'Heroine' },
  { slug: 'kottai-mariamman-2001', title: 'Kottai Mariamman', year: 2001, actorToMove: 'Roja', newCorrectField: 'Heroine' },
  { slug: 'mundadugu-1983', title: 'Mundadugu', year: 1983, actorToMove: 'Jaya Prada', newCorrectField: 'Heroine' },
  { slug: 'devi-l-2016', title: 'Devi(L)', year: 2016, actorToMove: 'Tamannaah', newCorrectField: 'Heroine' },
  { slug: 'devi-2-2019', title: 'Devi 2', year: 2019, actorToMove: 'Tamannaah', newCorrectField: 'Heroine' },
  { slug: 'padikathavan-2009', title: 'Padikathavan', year: 2009, actorToMove: 'Tamannaah', newCorrectField: 'Heroine' },
  { slug: 'best-actress-1996', title: 'Best Actress', year: 1996, actorToMove: 'Soundarya', newCorrectField: 'Heroine' },
  { slug: 'anbanavan-asaradhavan-adangadhavan-2017', title: 'Anbanavan Asaradhavan Adangadhavan', year: 2017, actorToMove: 'Tamannaah', newCorrectField: 'Heroine' },
  { slug: 'anna-chellelu-1993', title: 'Anna Chellelu', year: 1993, actorToMove: 'Soundarya', newCorrectField: 'Heroine' },
  { slug: 'jawab-hum-denge-1987', title: 'Jawab Hum Denge', year: 1987, actorToMove: 'Sridevi', newCorrectField: 'Heroine' },
  { slug: 'kanne-kalaimaane-2019', title: 'Kanne Kalaimaane', year: 2019, actorToMove: 'Tamannaah', newCorrectField: 'Heroine' },
  { slug: 'odela-2-2025', title: 'Odela 2', year: 2025, actorToMove: 'Tamannaah', newCorrectField: 'Heroine' },
  { slug: 'thillalangadi-2010', title: 'Thillalangadi', year: 2010, actorToMove: 'Tamannaah', newCorrectField: 'Heroine' },
  { slug: 'amma-mata-1972', title: 'Amma Mata', year: 1972, actorToMove: 'Sridevi', newCorrectField: 'Heroine' },
  { slug: 'rendu-2006', title: 'Rendu', year: 2006, actorToMove: 'Anushka Shetty', newCorrectField: 'Heroine' },
  { slug: 'kedi-2006', title: 'Kedi', year: 2006, actorToMove: 'Tamannaah', newCorrectField: 'Heroine' },
  { slug: 'devi-2020', title: 'Devi', year: 2020, actorToMove: 'Shruti Haasan', newCorrectField: 'Heroine' },
  { slug: 'oke-maata-2000', title: 'Oke Maata', year: 2000, actorToMove: 'Ramya Krishnan', newCorrectField: 'Heroine' },
  { slug: 'haisiyat-1984', title: 'Haisiyat', year: 1984, actorToMove: 'Jaya Prada', newCorrectField: 'Heroine' },
  { slug: 'vikram-2005', title: 'Vikramarkudu', year: 2005, actorToMove: 'Anushka Shetty', newCorrectField: 'Heroine' },
  { slug: 'angala-parameswari-2002', title: 'Angala Parameswari', year: 2002, actorToMove: 'Meena', newCorrectField: 'Heroine' },
  { slug: 'devadoothan-2000', title: 'Devadoothan', year: 2000, actorToMove: 'Jaya Prada', newCorrectField: 'Heroine' },
  { slug: 'o-baby-yentha-sakkagunnave-2019', title: 'Oh! Baby', year: 2019, actorToMove: 'Samantha', newCorrectField: 'Heroine' },
  { slug: 'action-2019', title: 'Action', year: 2019, actorToMove: 'Tamannaah', newCorrectField: 'Heroine' },
  { slug: 'anthahpuram-1998', title: 'Anthahpuram', year: 1998, actorToMove: 'Soundarya', newCorrectField: 'Heroine' },
  { slug: 'priya-1978', title: 'Priya', year: 1978, actorToMove: 'Sridevi', newCorrectField: 'Heroine' },
  { slug: 'vamsoddarakudu-2000', title: 'Vamsoddarakudu', year: 2000, actorToMove: 'Ramya Krishnan', newCorrectField: 'Heroine' },
  { slug: 'chuzhi-1973', title: 'Chuzhi', year: 1973, actorToMove: 'Savitri', newCorrectField: 'Heroine' },
  { slug: 'vanakkathukuriya-kathaliye-1978', title: 'Vanakkathukuriya Kathaliye', year: 1978, actorToMove: 'Sridevi', newCorrectField: 'Heroine' },
  { slug: 'the-desire-a-journey-of-a-woman-2011', title: 'The Desire: A Journey of a Woman', year: 2011, actorToMove: 'Jaya Prada', newCorrectField: 'Heroine' },
  { slug: 'insaniyat-1994', title: 'Insaniyat', year: 1994, actorToMove: 'Jaya Prada', newCorrectField: 'Heroine' },
  { slug: 'swetha-naagu-2004', title: 'Swetha Naagu', year: 2004, actorToMove: 'Soundarya', newCorrectField: 'Heroine' },
  { slug: 'kaloori-2007', title: 'Kaloori', year: 2007, actorToMove: 'Tamannaah', newCorrectField: 'Heroine' },
  { slug: 'petromax-2019', title: 'Petromax', year: 2019, actorToMove: 'Tamannaah', newCorrectField: 'Heroine' },
  { slug: 'jeevan-yudh-1997', title: 'Jeevan Yudh', year: 1997, actorToMove: 'Jaya Prada', newCorrectField: 'Heroine' },
  { slug: 'veer-1995', title: 'Veer', year: 1995, actorToMove: 'Jaya Prada', newCorrectField: 'Heroine' },
  { slug: 'behen-hogi-teri-2017', title: 'Behen Hogi Teri', year: 2017, actorToMove: 'Shruti Haasan', newCorrectField: 'Heroine' },
  { slug: 'devaraagam-1996', title: 'Devaraagam', year: 1996, actorToMove: 'Sridevi', newCorrectField: 'Heroine' },
  { slug: 'gift-1984', title: 'Gift', year: 1984, actorToMove: 'Sridevi', newCorrectField: 'Heroine' },
  { slug: 'do-lafzon-ki-kahani-2016', title: 'Do Lafzon Ki Kahani', year: 2016, actorToMove: 'Kajal Aggarwal', newCorrectField: 'Heroine' },
  { slug: 'swayamvaram-1982', title: 'Swayamvaram', year: 1982, actorToMove: 'Jaya Prada', newCorrectField: 'Heroine' },
  { slug: 'khamoshi-2019', title: 'Khamoshi', year: 2019, actorToMove: 'Tamannaah', newCorrectField: 'Heroine' },
  { slug: 'keni-2018', title: 'Keni', year: 2018, actorToMove: 'Jaya Prada', newCorrectField: 'Heroine' },
  { slug: 'paayum-puli-2015', title: 'Paayum Puli', year: 2015, actorToMove: 'Kajal Aggarwal', newCorrectField: 'Heroine' },
  { slug: 'pagalil-oru-iravu-1979', title: 'Pagalil Oru Iravu', year: 1979, actorToMove: 'Sridevi', newCorrectField: 'Heroine' },
  { slug: 'oonjaal-1977', title: 'Oonjaal', year: 1977, actorToMove: 'Sridevi', newCorrectField: 'Heroine' },
  { slug: 'vasuvum-saravananum-onna-padichavanga-2015', title: 'Vasuvum Saravananum Onna Padichavanga', year: 2015, actorToMove: 'Tamannaah', newCorrectField: 'Heroine' },
  { slug: 'seeta-kalyanam-1976', title: 'Seeta Kalyanam', year: 1976, actorToMove: 'Jaya Prada', newCorrectField: 'Heroine' },
  { slug: 'poojai-2014', title: 'Poojai', year: 2014, actorToMove: 'Shruti Haasan', newCorrectField: 'Heroine' },
  { slug: 'inji-iduppazhagi-2015', title: 'Inji Iduppazhagi', year: 2015, actorToMove: 'Anushka Shetty', newCorrectField: 'Heroine' },
  { slug: 'all-in-all-azhagu-raja-2013', title: 'All in All Azhagu Raja', year: 2013, actorToMove: 'Kajal Aggarwal', newCorrectField: 'Heroine' },
  { slug: 'poompatta-1971', title: 'Poompatta', year: 1971, actorToMove: 'Sridevi', newCorrectField: 'Heroine' },
  { slug: 'venghai-2011', title: 'Venghai', year: 2011, actorToMove: 'Tamannaah', newCorrectField: 'Heroine' },
  { slug: 'sesh-sanghat-2009', title: 'Sesh Sanghat', year: 2009, actorToMove: 'Jaya Prada', newCorrectField: 'Heroine' },
  { slug: 'kanden-kadhalai-2009', title: 'Kanden Kadhalai', year: 2009, actorToMove: 'Tamannaah', newCorrectField: 'Heroine' },
  { slug: 'devude-digivaste-1975', title: 'Devude Digivaste', year: 1975, actorToMove: 'Jaya Prada', newCorrectField: 'Heroine' },
  { slug: 'manavarali-pelli-1993', title: 'Manavarali Pelli', year: 1993, actorToMove: 'Soundarya', newCorrectField: 'Heroine' },
  { slug: 'jaag-utha-insan-1984', title: 'Jaag Utha Insan', year: 1984, actorToMove: 'Sridevi', newCorrectField: 'Heroine' },
  { slug: 'justice-rudramadevi-1990', title: 'Justice Rudramadevi', year: 1990, actorToMove: 'Jaya Prada', newCorrectField: 'Heroine' },
  { slug: 'madhura-swapnam-1982', title: 'Madhura Swapnam', year: 1982, actorToMove: 'Jaya Prada', newCorrectField: 'Heroine' },
  { slug: 'muddula-priyudu-1994', title: 'Muddula Priyudu', year: 1994, actorToMove: 'Ramya Krishnan', newCorrectField: 'Heroine' },
  { slug: 'suryavamsam-1998', title: 'Suryavamsam', year: 1998, actorToMove: 'Meena', newCorrectField: 'Heroine' },
  { slug: 'viyabari-2007', title: 'Viyabari', year: 2007, actorToMove: 'Tamannaah', newCorrectField: 'Heroine' },
  { slug: 'chand-sa-roshan-chehra-2005', title: 'Chand Sa Roshan Chehra', year: 2005, actorToMove: 'Tamannaah', newCorrectField: 'Heroine' },
  { slug: 'chandamama-2007', title: 'Chandamama', year: 2007, actorToMove: 'Kajal Aggarwal', newCorrectField: 'Heroine' },
  { slug: 'chandra-mukhi-1993', title: 'Chandra Mukhi', year: 1993, actorToMove: 'Sridevi', newCorrectField: 'Heroine' },
  { slug: 'chandralekha-1998', title: 'Chandralekha', year: 1998, actorToMove: 'Ramya Krishnan', newCorrectField: 'Heroine' },
  { slug: 'lust-stories-2-2023', title: 'Lust Stories 2', year: 2023, actorToMove: 'Tamannaah', newCorrectField: 'Heroine' },
  { slug: 'deergha-sumangali-bhava-1998', title: 'Deergha Sumangali Bhava', year: 1998, actorToMove: 'Ramya Krishnan', newCorrectField: 'Heroine' },
  { slug: 'lacchimdeviki-o-lekkundi-2016', title: 'Lacchimdeviki O Lekkundi', year: 2016, actorToMove: 'Lavanya Tripathi', newCorrectField: 'Heroine' },
  { slug: 'ragile-hrudayalu-1980', title: 'Ragile Hrudayalu', year: 1980, actorToMove: 'Jaya Prada', newCorrectField: 'Heroine' },
  { slug: 'yashoda-2022', title: 'Yashoda', year: 2022, actorToMove: 'Samantha', newCorrectField: 'Heroine' },
  { slug: 'golkonda-abbulu-1982', title: 'Golkonda Abbulu', year: 1982, actorToMove: 'Jaya Prada', newCorrectField: 'Heroine' },
  
  // Heroine → Hero fixes (Male actors incorrectly in heroine field)
  { slug: 'khaidi-kalidasu-1977', title: 'Khaidi Kalidasu', year: 1977, actorToMove: 'Sobhan Babu', newCorrectField: 'Hero' },
  { slug: 'chinnari-muddula-papa-1990', title: 'Chinnari Muddula Papa', year: 1990, actorToMove: 'Sobhan Babu', newCorrectField: 'Hero' },
  { slug: 'manavude-mahaneeyudu-1980', title: 'Manavude Mahaneeyudu', year: 1980, actorToMove: 'Sobhan Babu', newCorrectField: 'Hero' },
  { slug: 'jhummandi-naadam-2010', title: 'Jhummandi Naadam', year: 2010, actorToMove: 'Suman', newCorrectField: 'Hero' },
  { slug: 'chandi-the-power-of-woman-2013', title: 'Chandi: The Power of Woman', year: 2013, actorToMove: 'Krishnam Raju', newCorrectField: 'Hero' },
  { slug: 'jagamondi-1981', title: 'Jagamondi', year: 1981, actorToMove: 'Sobhan Babu', newCorrectField: 'Hero' },
  { slug: 'd-for-dopidi-2013', title: 'D for Dopidi', year: 2013, actorToMove: 'Sundeep Kishan', newCorrectField: 'Hero' },
  { slug: 'antha-mana-manchike-1972', title: 'Antha Mana Manchike', year: 1972, actorToMove: 'Krishna', newCorrectField: 'Hero' },
  { slug: 'rama-banam-1979', title: 'Rama Banam', year: 1979, actorToMove: 'Krishnam Raju', newCorrectField: 'Hero' },
  { slug: 'sneha-bandham-1973', title: 'Sneha Bandham', year: 1973, actorToMove: 'Krishna', newCorrectField: 'Hero' },
  { slug: 'bangaru-talli-1971', title: 'Bangaru Talli', year: 1971, actorToMove: 'Sobhan Babu', newCorrectField: 'Hero' },
  { slug: 's-p-bhayankar-1984', title: 'S. P. Bhayankar', year: 1984, actorToMove: 'Krishnam Raju', newCorrectField: 'Hero' },
  { slug: 'o-panaipothundi-babu-1998', title: 'O Panaipothundi Babu', year: 1998, actorToMove: 'Ravi Teja', newCorrectField: 'Hero' },
  { slug: 'pandirimancham-1991', title: 'Pandirimancham', year: 1991, actorToMove: 'Jagapathi Babu', newCorrectField: 'Hero' },
];

async function applyGenderSwaps() {
  console.log(chalk.blue('\n🔧 Applying GENDER_SWAP fixes (Batch 3 - Final 89)...\n'));
  let fixedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (const swap of genderSwapFixes) {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('id, slug, title_en, hero, heroine')
        .eq('slug', swap.slug)
        .single();

      if (error || !data) {
        console.log(chalk.red(`❌ Not found: ${swap.slug}`));
        notFoundCount++;
        continue;
      }

      const updatePayload: any = {};
      const actorLower = normalizeName(swap.actorToMove);

      if (swap.newCorrectField === 'Hero') {
        // Move from heroine to hero
        updatePayload.hero = swap.actorToMove;
        if (data.heroine && normalizeName(data.heroine) === actorLower) {
          updatePayload.heroine = null;
        }
      } else {
        // Move from hero to heroine
        updatePayload.heroine = swap.actorToMove;
        if (data.hero && normalizeName(data.hero) === actorLower) {
          updatePayload.hero = null;
        }
      }

      const { error: updateError } = await supabase
        .from('movies')
        .update(updatePayload)
        .eq('id', data.id);

      if (updateError) {
        console.error(chalk.red(`❌ Error updating ${swap.slug}: ${updateError.message}`));
        errorCount++;
      } else {
        console.log(chalk.green(`✅ ${data.title_en || swap.title}: ${swap.actorToMove} → ${swap.newCorrectField.toLowerCase()}`));
        fixedCount++;
      }
    } catch (e: any) {
      console.error(chalk.red(`❌ Unexpected error for ${swap.slug}: ${e.message}`));
      errorCount++;
    }
  }

  console.log(chalk.blue(`\n📊 Summary:`));
  console.log(`   Fixed: ${chalk.green(fixedCount)}`);
  console.log(`   Not found: ${chalk.yellow(notFoundCount)}`);
  console.log(`   Errors: ${chalk.red(errorCount)}\n`);
}

applyGenderSwaps().catch(console.error);
