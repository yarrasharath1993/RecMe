/**
 * Fix Celebrity Data Corrections (Manual Review)
 * 
 * Based on manual review feedback - corrects:
 * - Industry titles
 * - Top pairings
 * - Upcoming projects (2026)
 * 
 * Usage:
 *   npx tsx scripts/fix-celebrity-data-corrections.ts --dry     # Preview
 *   npx tsx scripts/fix-celebrity-data-corrections.ts --execute # Apply
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================
// CORRECTION DATA (Manual Review - Jan 2026)
// ============================================================

interface CelebrityCorrection {
  slug: string;
  name_en: string;
  corrections: {
    industry_title?: string;
    usp?: string;
    romantic_pairings?: Array<{
      name: string;
      slug: string;
      count: number;
      highlight: string;
      films: string[];
    }>;
    upcoming_projects?: Array<{
      title: string;
      year: number;
      role: string;
      director?: string;
      status: string;
    }>;
    brand_pillars?: string[];
  };
}

const CORRECTIONS: CelebrityCorrection[] = [
  {
    slug: 'mahesh-babu',
    name_en: 'Mahesh Babu',
    corrections: {
      industry_title: 'Superstar / Prince',
      usp: 'Pan-India appeal + Class + Commercial dominance — Inherited Superstar legacy from father Krishna',
      romantic_pairings: [
        { 
          name: 'Samantha Ruth Prabhu', 
          slug: 'samantha', 
          count: 3, 
          highlight: 'Most successful pairing - Blockbusters',
          films: ['Dookudu', 'Seethamma Vakitlo Sirimalle Chettu', 'Aagadu']
        },
        { 
          name: 'Kajal Aggarwal', 
          slug: 'kajal-aggarwal', 
          count: 2, 
          highlight: 'Commercial hits',
          films: ['Businessman', 'Brahmotsavam']
        },
        { 
          name: 'Keerthy Suresh', 
          slug: 'keerthy-suresh', 
          count: 2, 
          highlight: 'Recent blockbusters',
          films: ['Sarkaru Vaari Paata', 'Guntur Kaaram']
        },
        { 
          name: 'Pooja Hegde', 
          slug: 'pooja-hegde', 
          count: 2, 
          highlight: 'Blockbuster pairing',
          films: ['Maharshi', 'Sarkaru Vaari Paata']
        },
        { 
          name: 'Shruti Haasan', 
          slug: 'shruti-haasan', 
          count: 2, 
          highlight: 'Commercial hits',
          films: ['Srimanthudu', 'Sarkaru Vaari Paata (special song)']
        },
        { 
          name: 'Preity Zinta', 
          slug: 'preity-zinta', 
          count: 1, 
          highlight: 'Early career',
          films: ['Raja Kumarudu']
        },
        { 
          name: 'Trisha', 
          slug: 'trisha-krishnan', 
          count: 1, 
          highlight: 'Blockbuster',
          films: ['Sainikudu']
        },
        { 
          name: 'Namrata Shirodkar', 
          slug: 'namrata-shirodkar', 
          count: 1, 
          highlight: 'Met on sets, now wife',
          films: ['Vamsi']
        }
      ],
      upcoming_projects: [
        { 
          title: 'SSMB 29 (Varanasi)', 
          year: 2027, 
          role: 'Lead', 
          director: 'S.S. Rajamouli',
          status: 'Filming - Global project'
        },
        { 
          title: 'Srinivasa Mangapuram', 
          year: 2026, 
          role: 'Lead',
          status: 'April 14, 2026 release'
        }
      ],
      brand_pillars: [
        'Superstar brand (inherited from Krishna)',
        'Prince of Telugu Cinema',
        '25+ years career spanning 4 decades',
        'Pan-India appeal with Maharshi, Sarileru Neekevvaru',
        'Global project with Rajamouli',
        'Family man image + Brand ambassador'
      ]
    }
  },
  {
    slug: 'allu-arjun',
    name_en: 'Allu Arjun',
    corrections: {
      industry_title: 'Icon Star',
      usp: 'Pushpa phenomenon + Dance king + Pan-India star — Redefined Telugu cinema reach globally',
      romantic_pairings: [
        { 
          name: 'Rashmika Mandanna', 
          slug: 'rashmika-mandanna', 
          count: 3, 
          highlight: 'Pushpa trilogy - Defining pairing',
          films: ['Pushpa: The Rise', 'Pushpa 2: The Rule', 'Pushpa 3: The Rampage']
        },
        { 
          name: 'Pooja Hegde', 
          slug: 'pooja-hegde', 
          count: 2, 
          highlight: 'Blockbuster pairing',
          films: ['DJ: Duvvada Jagannadham', 'Ala Vaikunthapurramuloo']
        },
        { 
          name: 'Samantha Ruth Prabhu', 
          slug: 'samantha', 
          count: 2, 
          highlight: 'Blockbuster combo',
          films: ['S/O Satyamurthy', 'Ala Vaikunthapurramuloo (item song)']
        },
        { 
          name: 'Shruti Haasan', 
          slug: 'shruti-haasan', 
          count: 2, 
          highlight: 'Commercial hits',
          films: ['Race Gurram', 'Duvvada Jagannadham']
        },
        { 
          name: 'Tamanna', 
          slug: 'tamannaah-bhatia', 
          count: 2, 
          highlight: 'Hit pairing',
          films: ['Badrinath', 'Julayi (item song)']
        },
        { 
          name: 'Kajal Aggarwal', 
          slug: 'kajal-aggarwal', 
          count: 2, 
          highlight: 'Successful pairing',
          films: ['Arya 2', 'Naa Peru Surya']
        },
        { 
          name: 'Ileana D\'Cruz', 
          slug: 'ileana-dcruz', 
          count: 2, 
          highlight: 'Early career hits',
          films: ['Julayi', 'Munna Michael (Hindi cameo)']
        }
      ],
      upcoming_projects: [
        { 
          title: 'Pushpa 3: The Rampage', 
          year: 2026, 
          role: 'Pushpa Raj',
          director: 'Sukumar',
          status: 'End of 2026 release'
        }
      ],
      brand_pillars: [
        'Icon Star (post-Pushpa)',
        'Pan-India phenomenon with Pushpa franchise',
        'Dance icon - Stylish Star legacy',
        'Mega family member (Chiranjeevi nephew)',
        '20+ year career',
        'National Film Award winner (Best Actor)',
        'Global recognition - Hollywood collaborations'
      ]
    }
  },
  {
    slug: 'prabhas',
    name_en: 'Prabhas',
    corrections: {
      industry_title: 'Rebel Star / Darling / Global Star',
      usp: 'Baahubali phenomenon + Pan-India pioneer + Diverse genres — First true Pan-India star from Telugu',
      romantic_pairings: [
        { 
          name: 'Anushka Shetty', 
          slug: 'anushka-shetty', 
          count: 4, 
          highlight: 'Most iconic pairing - Baahubali + Billa',
          films: ['Billa', 'Mirchi', 'Baahubali: The Beginning', 'Baahubali: The Conclusion']
        },
        { 
          name: 'Trisha Krishnan', 
          slug: 'trisha-krishnan', 
          count: 3, 
          highlight: 'Early career blockbusters',
          films: ['Varsham', 'Pournami', 'Bujjigadu']
        },
        { 
          name: 'Shraddha Kapoor', 
          slug: 'shraddha-kapoor', 
          count: 1, 
          highlight: 'Pan-India film',
          films: ['Saaho']
        },
        { 
          name: 'Pooja Hegde', 
          slug: 'pooja-hegde', 
          count: 1, 
          highlight: 'Pan-India release',
          films: ['Radhe Shyam']
        },
        { 
          name: 'Kriti Sanon', 
          slug: 'kriti-sanon', 
          count: 1, 
          highlight: 'Mythological epic',
          films: ['Adipurush']
        },
        { 
          name: 'Deepika Padukone', 
          slug: 'deepika-padukone', 
          count: 1, 
          highlight: 'Upcoming sci-fi',
          films: ['Kalki 2898 AD']
        }
      ],
      upcoming_projects: [
        { 
          title: 'The Raja Saab', 
          year: 2026, 
          role: 'Lead',
          director: 'Maruthi',
          status: 'January 2026 release - Horror comedy'
        },
        { 
          title: 'Fauzi', 
          year: 2026, 
          role: 'Lead',
          director: 'Hanu Raghavapudi',
          status: 'August 2026 release - Action drama'
        },
        { 
          title: 'Spirit', 
          year: 2027, 
          role: 'Lead',
          director: 'Sandeep Reddy Vanga',
          status: 'Filming'
        }
      ],
      brand_pillars: [
        'Rebel Star / Darling brand',
        'Global Star post-Baahubali',
        'Pan-India pioneer from Telugu',
        '20+ year career',
        'Rs 2000+ crore franchise (Baahubali)',
        'Most anticipated projects slate'
      ]
    }
  },
  {
    slug: 'ram-charan',
    name_en: 'Ram Charan',
    corrections: {
      industry_title: 'Mega Power Star / Global Star',
      usp: 'RRR global success + Dance excellence + Mega legacy — Oscar glory with Naatu Naatu',
      romantic_pairings: [
        { 
          name: 'Kajal Aggarwal', 
          slug: 'kajal-aggarwal', 
          count: 4, 
          highlight: 'Most frequent & iconic pairing',
          films: ['Magadheera', 'Naayak', 'Govindudu Andarivadele', 'Yevadu']
        },
        { 
          name: 'Samantha Ruth Prabhu', 
          slug: 'samantha', 
          count: 2, 
          highlight: 'Successful pairing',
          films: ['Yeto Vellipoyindhi Manasu', 'Rangasthalam']
        },
        { 
          name: 'Priyanka Chopra', 
          slug: 'priyanka-chopra', 
          count: 1, 
          highlight: 'Debut film',
          films: ['Zanjeer (Hindi remake)']
        },
        { 
          name: 'Shruti Haasan', 
          slug: 'shruti-haasan', 
          count: 1, 
          highlight: 'Commercial hit',
          films: ['Yevadu']
        },
        { 
          name: 'Alia Bhatt', 
          slug: 'alia-bhatt', 
          count: 1, 
          highlight: 'Pan-India blockbuster',
          films: ['RRR']
        },
        { 
          name: 'Kiara Advani', 
          slug: 'kiara-advani', 
          count: 1, 
          highlight: 'Blockbuster',
          films: ['Vinaya Vidheya Rama']
        },
        { 
          name: 'Pooja Hegde', 
          slug: 'pooja-hegde', 
          count: 1, 
          highlight: 'Multi-starrer',
          films: ['Acharya']
        }
      ],
      upcoming_projects: [
        { 
          title: 'Peddi', 
          year: 2026, 
          role: 'Lead',
          director: 'Buchi Babu Sana',
          status: 'March 27, 2026 release - Sports drama'
        },
        { 
          title: 'RC16', 
          year: 2026, 
          role: 'Lead',
          director: 'Buchi Babu Sana',
          status: 'In development'
        }
      ],
      brand_pillars: [
        'Mega Power Star (Chiranjeevi son)',
        'Global Star post-RRR',
        'Oscar winner (Naatu Naatu - Best Original Song)',
        'Magadheera phenomenon',
        'Dance icon like father',
        'Konidela Production Company'
      ]
    }
  },
  {
    slug: 'chiranjeevi',
    name_en: 'Chiranjeevi',
    corrections: {
      romantic_pairings: [
        { 
          name: 'Vijayashanti', 
          slug: 'vijayashanti', 
          count: 14, 
          highlight: 'Most legendary pairing in Telugu cinema',
          films: ['Khaidi', 'Kondaveeti Donga', 'Jagadeka Veerudu Athiloka Sundari', 'Gang Leader', 'Aapadbandhavudu', 'Aaj Ka Goonda Raj', 'Gharana Mogudu', 'Muta Mestri', 'Big Boss', 'Rikshavodu', 'Challenge', 'Rudraveena', 'Yamudiki Mogudu', 'Donga Mogudu']
        },
        { 
          name: 'Radha', 
          slug: 'radha', 
          count: 12, 
          highlight: 'Early career blockbusters',
          films: ['Khaidi', 'Vijetha', 'Mantri Gari Viyyankudu', 'Donga Mogudu', 'Abhilasha', 'Chantabbai', 'Veta', 'Pasivadi Pranam', 'Maga Maharaju', 'Jwala', 'Rakshasudu', 'Yamudiki Mogudu']
        },
        { 
          name: 'Meenakshi Seshadri', 
          slug: 'meenakshi-seshadri', 
          count: 8, 
          highlight: 'Pan-India appeal pairing',
          films: ['Aakhari Poratam', 'Gharana Mogudu', 'Muta Mestri', 'Adavi Donga', 'Ankusham', 'Trimurti', 'Sahasa Veerudu Sagara Kanya', 'Rowdy Alludu']
        },
        { 
          name: 'Ramya Krishnan', 
          slug: 'ramya-krishnan', 
          count: 6, 
          highlight: 'Power-packed chemistry',
          films: ['Aapadbandhavudu', 'Mutha Mestri', 'Big Boss', 'Alluda Majaka', 'Gharana Bullodu', 'Hitler']
        },
        {
          name: 'Soundarya',
          slug: 'soundarya',
          count: 5,
          highlight: 'Millennium era pairing',
          films: ['Indra', 'Snehamante Idera', 'Jai Chiranjeeva', 'Annayya', 'Master']
        },
        {
          name: 'Roja',
          slug: 'roja',
          count: 4,
          highlight: 'Family entertainer pairing',
          films: ['Hitler', 'Rikshavodu', 'Bavagaru Bagunnara', 'Shankar Dada MBBS']
        }
      ]
    }
  },
  {
    slug: 'akkineni-nagarjuna',
    name_en: 'Akkineni Nagarjuna',
    corrections: {
      romantic_pairings: [
        { 
          name: 'Soundarya', 
          slug: 'soundarya', 
          count: 5, 
          highlight: 'Most beloved pairing',
          films: ['Siva', 'Govinda Govinda', 'Rakshana', 'Criminal', 'Azad']
        },
        { 
          name: 'Ramya Krishnan', 
          slug: 'ramya-krishnan', 
          count: 5, 
          highlight: 'Multiple hits together',
          films: ['Criminal', 'Ramudochadu', 'Allari Alludu', 'Gharana Bullodu', 'Santosham']
        },
        { 
          name: 'Tabu', 
          slug: 'tabu', 
          count: 4, 
          highlight: 'Class pairing',
          films: ['Ninne Pelladata', 'Aavida Maa Aavide', 'Siva', 'Hello Brother']
        },
        { 
          name: 'Amala', 
          slug: 'amala-akkineni', 
          count: 3, 
          highlight: 'Real-life couple',
          films: ['Shiva', 'Agni Putrudu', 'Seetharamaiah Gari Manavaralu']
        },
        { 
          name: 'Shriya Saran', 
          slug: 'shriya-saran', 
          count: 3, 
          highlight: 'Comeback era pairing',
          films: ['Mass', 'Super', 'Bangaram']
        },
        { 
          name: 'Anushka Shetty', 
          slug: 'anushka-shetty', 
          count: 2, 
          highlight: 'Successful pairing',
          films: ['Don', 'Damarukam']
        }
      ]
    }
  }
];

// ============================================================
// MAIN
// ============================================================

async function applyCorrections(dryRun: boolean): Promise<void> {
  console.log(chalk.cyan('\n🔧 Applying Celebrity Data Corrections\n'));
  console.log(chalk.gray(`Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}\n`));

  let successCount = 0;
  let failCount = 0;

  for (const correction of CORRECTIONS) {
    console.log(chalk.blue(`Processing: ${correction.name_en}`));
    
    // Find the celebrity
    const { data: celeb, error: findError } = await supabase
      .from('celebrities')
      .select('id, name_en, slug, industry_title, romantic_pairings')
      .or(`slug.eq.${correction.slug},slug.ilike.%${correction.slug}%`)
      .limit(1)
      .single();
    
    if (findError || !celeb) {
      console.log(chalk.yellow(`  ⚠ Not found: ${correction.slug}`));
      
      // Try by name
      const { data: byName } = await supabase
        .from('celebrities')
        .select('id, name_en, slug')
        .ilike('name_en', `%${correction.name_en}%`)
        .limit(1)
        .single();
      
      if (!byName) {
        console.log(chalk.red(`  ✗ Could not find ${correction.name_en}`));
        failCount++;
        continue;
      }
      
      console.log(chalk.gray(`  → Found by name: ${byName.name_en} (${byName.slug})`));
    }
    
    const targetId = celeb?.id;
    
    if (!targetId) {
      failCount++;
      continue;
    }
    
    // Build update payload
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };
    
    if (correction.corrections.industry_title) {
      updatePayload.industry_title = correction.corrections.industry_title;
      console.log(chalk.gray(`  → Title: ${correction.corrections.industry_title}`));
    }
    
    if (correction.corrections.usp) {
      updatePayload.usp = correction.corrections.usp;
      console.log(chalk.gray(`  → USP updated`));
    }
    
    if (correction.corrections.romantic_pairings) {
      updatePayload.romantic_pairings = correction.corrections.romantic_pairings;
      console.log(chalk.gray(`  → Pairings: ${correction.corrections.romantic_pairings.length} entries`));
    }
    
    if (correction.corrections.brand_pillars) {
      updatePayload.brand_pillars = correction.corrections.brand_pillars;
      console.log(chalk.gray(`  → Brand pillars: ${correction.corrections.brand_pillars.length} items`));
    }
    
    // Handle fan_culture updates (upcoming_projects go inside)
    if (correction.corrections.upcoming_projects) {
      // Get current fan_culture
      const { data: current } = await supabase
        .from('celebrities')
        .select('fan_culture')
        .eq('id', targetId)
        .single();
      
      const fanCulture = current?.fan_culture || {};
      fanCulture.upcoming_projects = correction.corrections.upcoming_projects;
      updatePayload.fan_culture = fanCulture;
      console.log(chalk.gray(`  → Upcoming projects: ${correction.corrections.upcoming_projects.length} projects`));
    }
    
    if (dryRun) {
      console.log(chalk.green(`  ✓ Would update ${Object.keys(updatePayload).length - 1} fields`));
      successCount++;
      continue;
    }
    
    // Execute update
    const { error: updateError } = await supabase
      .from('celebrities')
      .update(updatePayload)
      .eq('id', targetId);
    
    if (updateError) {
      console.log(chalk.red(`  ✗ Update failed: ${updateError.message}`));
      failCount++;
    } else {
      console.log(chalk.green(`  ✓ Updated successfully`));
      successCount++;
    }
  }

  console.log(chalk.cyan('\n' + '═'.repeat(50)));
  console.log(chalk.green(`✓ Success: ${successCount}`));
  console.log(chalk.red(`✗ Failed: ${failCount}`));
  
  if (dryRun) {
    console.log(chalk.yellow('\n🔍 DRY RUN - No changes made'));
    console.log(chalk.gray('Run with --execute to apply these changes'));
  }
  
  console.log();
}

// CLI
const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');
applyCorrections(dryRun);
