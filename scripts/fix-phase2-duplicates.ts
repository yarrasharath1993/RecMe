/**
 * Phase 2: Systematic duplicate profile fixes
 * Based on recommendations:
 * 1. Standardize initials (dots with spaces: "K. Raghavendra Rao")
 * 2. Merge compound name variations
 * 3. Fix high-volume directors first
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MergeRule {
  role: string;
  field: string;
  variations: string[];
  masterName: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

// Phase 2 merge rules - focusing on high-volume and clear cases
const mergeRules: MergeRule[] = [
  // ============================================================
  // HIGH PRIORITY: Directors with 20+ movies
  // ============================================================
  {
    role: 'Director',
    field: 'director',
    variations: ['A.Kodandarami Reddy', 'A. Kodandarami Reddy', 'Kodanda Rami Reddy', 'Kodandarami Reddy'],
    masterName: 'A. Kodandarami Reddy',
    description: 'A. Kodandarami Reddy - Major director (33+ movies)',
    priority: 'high',
  },
  {
    role: 'Director',
    field: 'director',
    variations: ['K.Raghavendra Rao', 'K. Raghavendra Rao'],
    masterName: 'K. Raghavendra Rao',
    description: 'K. Raghavendra Rao - Major director (25+ movies)',
    priority: 'high',
  },
  {
    role: 'Director',
    field: 'director',
    variations: ['S.V. Krishna Reddy', 'S.V.Krishna Reddy', 'S. V. Krishna Reddy'],
    masterName: 'S. V. Krishna Reddy',
    description: 'S. V. Krishna Reddy - Major director (20+ movies)',
    priority: 'high',
  },
  {
    role: 'Director',
    field: 'director',
    variations: ['S.S. Rajamouli', 'S. S. Rajamouli'],
    masterName: 'S. S. Rajamouli',
    description: 'S. S. Rajamouli - Major director',
    priority: 'high',
  },
  
  // ============================================================
  // HIGH PRIORITY: Music Directors with 10+ movies
  // ============================================================
  {
    role: 'Music Director',
    field: 'music_director',
    variations: ['M.M. Keeravani', 'M. M. Keeravani', 'M.M.Keeravani'],
    masterName: 'M. M. Keeravani',
    description: 'M. M. Keeravani - Major music director',
    priority: 'high',
  },
  {
    role: 'Music Director',
    field: 'music_director',
    variations: ['Devi Sri Prasad', 'Devi Sri Prasad', 'DeviSriPrasad'],
    masterName: 'Devi Sri Prasad',
    description: 'Devi Sri Prasad - Major music director',
    priority: 'high',
  },
  {
    role: 'Music Director',
    field: 'music_director',
    variations: ['S.A. Rajkumar', 'S. A. Rajkumar', 'S.A.Rajkumar'],
    masterName: 'S. A. Rajkumar',
    description: 'S. A. Rajkumar - Major music director',
    priority: 'high',
  },
  {
    role: 'Music Director',
    field: 'music_director',
    variations: ['K.V. Mahadevan', 'K. V. Mahadevan', 'K.V.Mahadevan'],
    masterName: 'K. V. Mahadevan',
    description: 'K. V. Mahadevan - Legendary music director',
    priority: 'high',
  },
  {
    role: 'Music Director',
    field: 'music_director',
    variations: ['S.P. Balasubrahmanyam', 'S. P. Balasubrahmanyam', 'S.P.Balasubrahmanyam'],
    masterName: 'S. P. Balasubrahmanyam',
    description: 'S. P. Balasubrahmanyam - Legendary singer/composer',
    priority: 'high',
  },
  
  // ============================================================
  // MEDIUM PRIORITY: Directors with 10+ movies
  // ============================================================
  {
    role: 'Director',
    field: 'director',
    variations: ['I.V. Sasi', 'I. V. Sasi', 'I.V.Sasi'],
    masterName: 'I. V. Sasi',
    description: 'I. V. Sasi - Director (19 movies)',
    priority: 'medium',
  },
  {
    role: 'Director',
    field: 'director',
    variations: ['B.Gopal', 'B. Gopal'],
    masterName: 'B. Gopal',
    description: 'B. Gopal - Director (17 movies)',
    priority: 'medium',
  },
  {
    role: 'Director',
    field: 'director',
    variations: ['Kodi Rama Krishna', 'Kodi Ramakrishna', 'Kodi RamaKrishna'],
    masterName: 'Kodi Ramakrishna',
    description: 'Kodi Ramakrishna - Director (15 movies)',
    priority: 'medium',
  },
  {
    role: 'Director',
    field: 'director',
    variations: ['E.V.V. Satyanarayana', 'E. V. V. Satyanarayana', 'E.V.V.Satyanarayana'],
    masterName: 'E. V. V. Satyanarayana',
    description: 'E. V. V. Satyanarayana - Director (14 movies)',
    priority: 'medium',
  },
  {
    role: 'Director',
    field: 'director',
    variations: ['S.V. Rajendra Singh', 'S. V. Rajendra Singh', 'S.V.Rajendra Singh'],
    masterName: 'S. V. Rajendra Singh',
    description: 'S. V. Rajendra Singh - Director (13 movies)',
    priority: 'medium',
  },
  {
    role: 'Director',
    field: 'director',
    variations: ['Relangi Narasimha Rao', 'Relangi Narasimharao'],
    masterName: 'Relangi Narasimha Rao',
    description: 'Relangi Narasimha Rao - Director (12 movies)',
    priority: 'medium',
  },
  
  // ============================================================
  // MEDIUM PRIORITY: Producers with 10+ movies
  // ============================================================
  {
    role: 'Producer',
    field: 'producer',
    variations: ['D.Rama Naidu', 'D. Rama Naidu', 'D.Ramanaidu', 'D. Ramanaidu'],
    masterName: 'D. Rama Naidu',
    description: 'D. Rama Naidu - Legendary producer',
    priority: 'high',
  },
  {
    role: 'Producer',
    field: 'producer',
    variations: ['Allu Aravind', 'Allu Arvind'],
    masterName: 'Allu Aravind',
    description: 'Allu Aravind - Major producer',
    priority: 'medium',
  },
  {
    role: 'Producer',
    field: 'producer',
    variations: ['C.Ashwini Dutt', 'C. Ashwini Dutt', 'C.Aswini Dutt', 'C. Aswini Dutt'],
    masterName: 'C. Ashwini Dutt',
    description: 'C. Ashwini Dutt - Major producer',
    priority: 'medium',
  },
  
  // ============================================================
  // MEDIUM PRIORITY: Cinematographers
  // ============================================================
  {
    role: 'Cinematographer',
    field: 'cinematographer',
    variations: ['C.Ram Prasad', 'C. Ram Prasad', 'C.Ramprasad'],
    masterName: 'C. Ram Prasad',
    description: 'C. Ram Prasad - Cinematographer (11 movies)',
    priority: 'medium',
  },
  {
    role: 'Cinematographer',
    field: 'cinematographer',
    variations: ['Gnana Shekar V.S.', 'Gnana Shekar V. S.'],
    masterName: 'Gnana Shekar V. S.',
    description: 'Gnana Shekar V. S. - Cinematographer (8 movies)',
    priority: 'medium',
  },
  {
    role: 'Cinematographer',
    field: 'cinematographer',
    variations: ['M.V. Raghu', 'M. V. Raghu', 'M.V.Raghu'],
    masterName: 'M. V. Raghu',
    description: 'M. V. Raghu - Cinematographer (7 movies)',
    priority: 'medium',
  },
  {
    role: 'Cinematographer',
    field: 'cinematographer',
    variations: ['P.S. Vinod', 'P. S. Vinod', 'P.S.Vinod'],
    masterName: 'P. S. Vinod',
    description: 'P. S. Vinod - Cinematographer (7 movies)',
    priority: 'medium',
  },
  {
    role: 'Cinematographer',
    field: 'cinematographer',
    variations: ['K.K. Senthil Kumar', 'K. K. Senthil Kumar'],
    masterName: 'K. K. Senthil Kumar',
    description: 'K. K. Senthil Kumar - Cinematographer (7 movies)',
    priority: 'medium',
  },
  {
    role: 'Cinematographer',
    field: 'cinematographer',
    variations: ['K.S. Prakash', 'K. S. Prakash', 'K.S.Prakash'],
    masterName: 'K. S. Prakash',
    description: 'K. S. Prakash - Cinematographer (6 movies)',
    priority: 'medium',
  },
  {
    role: 'Cinematographer',
    field: 'cinematographer',
    variations: ['V.Srinivasa Reddy', 'V. Srinivasa Reddy'],
    masterName: 'V. Srinivasa Reddy',
    description: 'V. Srinivasa Reddy - Cinematographer (6 movies)',
    priority: 'medium',
  },
  {
    role: 'Cinematographer',
    field: 'cinematographer',
    variations: ['P.G. Vinda', 'P. G. Vinda', 'P.G.Vinda'],
    masterName: 'P. G. Vinda',
    description: 'P. G. Vinda - Cinematographer (5 movies)',
    priority: 'medium',
  },
  {
    role: 'Cinematographer',
    field: 'cinematographer',
    variations: ['S.R. Kathir', 'S. R. Kathir', 'S.R.Kathir'],
    masterName: 'S. R. Kathir',
    description: 'S. R. Kathir - Cinematographer (4 movies)',
    priority: 'medium',
  },
];

async function mergeProfile(rule: MergeRule): Promise<{ success: boolean; count: number }> {
  console.log(`\n🔧 [${rule.priority.toUpperCase()}] ${rule.description}`);
  console.log(`   Master name: "${rule.masterName}"`);
  
  let totalUpdated = 0;
  
  for (const variation of rule.variations) {
    if (variation === rule.masterName) {
      continue; // Skip the master name itself
    }
    
    // Count movies with this variation
    const { count } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .eq(rule.field, variation);
    
    if (!count || count === 0) {
      continue;
    }
    
    console.log(`   Merging: "${variation}" (${count} movies)`);
    
    // Update movies
    const { error } = await supabase
      .from('movies')
      .update({ [rule.field]: rule.masterName })
      .eq(rule.field, variation);
    
    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      return { success: false, count: totalUpdated };
    }
    
    totalUpdated += count;
  }
  
  if (totalUpdated > 0) {
    console.log(`   ✅ Merged ${totalUpdated} movies into master profile`);
  } else {
    console.log(`   ✅ Already merged or no variations found`);
  }
  
  return { success: true, count: totalUpdated };
}

async function fixPhase2() {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 PHASE 2: SYSTEMATIC DUPLICATE MERGING');
  console.log('='.repeat(80));
  console.log('\nStandardization Rules:');
  console.log('  - Initials: Use spaces after dots (e.g., "K. Raghavendra Rao")');
  console.log('  - Compound names: Use industry-standard spelling');
  console.log('  - Multiple variations: Merge into single master profile');
  console.log('\n' + '='.repeat(80));

  // Group by priority
  const highPriority = mergeRules.filter(r => r.priority === 'high');
  const mediumPriority = mergeRules.filter(r => r.priority === 'medium');
  const lowPriority = mergeRules.filter(r => r.priority === 'low');

  let stats = {
    high: { total: 0, success: 0, movies: 0 },
    medium: { total: 0, success: 0, movies: 0 },
    low: { total: 0, success: 0, movies: 0 },
  };

  // Process HIGH priority first
  if (highPriority.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('🔥 HIGH PRIORITY (Major Directors & Music Directors)');
    console.log('='.repeat(80));
    
    for (const rule of highPriority) {
      const result = await mergeProfile(rule);
      stats.high.total++;
      if (result.success) stats.high.success++;
      stats.high.movies += result.count;
    }
  }

  // Process MEDIUM priority
  if (mediumPriority.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 MEDIUM PRIORITY (10+ Movies Each)');
    console.log('='.repeat(80));
    
    for (const rule of mediumPriority) {
      const result = await mergeProfile(rule);
      stats.medium.total++;
      if (result.success) stats.medium.success++;
      stats.medium.movies += result.count;
    }
  }

  // Process LOW priority
  if (lowPriority.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('📌 LOW PRIORITY (< 10 Movies)');
    console.log('='.repeat(80));
    
    for (const rule of lowPriority) {
      const result = await mergeProfile(rule);
      stats.low.total++;
      if (result.success) stats.low.success++;
      stats.low.movies += result.count;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📈 PHASE 2 SUMMARY');
  console.log('='.repeat(80));
  
  const totalRules = stats.high.total + stats.medium.total + stats.low.total;
  const totalSuccess = stats.high.success + stats.medium.success + stats.low.success;
  const totalMovies = stats.high.movies + stats.medium.movies + stats.low.movies;
  
  console.log(`\nTotal merge rules: ${totalRules}`);
  console.log(`✅ Successfully merged: ${totalSuccess}`);
  console.log(`📽️  Total movies updated: ${totalMovies}`);
  
  console.log('\nBreakdown:');
  console.log(`  🔥 High Priority: ${stats.high.success}/${stats.high.total} rules, ${stats.high.movies} movies`);
  console.log(`  📊 Medium Priority: ${stats.medium.success}/${stats.medium.total} rules, ${stats.medium.movies} movies`);
  console.log(`  📌 Low Priority: ${stats.low.success}/${stats.low.total} rules, ${stats.low.movies} movies`);

  console.log('\n💡 NEXT STEPS:');
  console.log('   1. Run audit again: npx tsx scripts/audit-duplicate-profiles.ts');
  console.log('   2. Check major profiles are unified');
  console.log('   3. Review remaining low-priority duplicates');
  console.log('   4. Consider adding celebrity records for top names');

  console.log('\n' + '='.repeat(80));
  console.log('✅ Phase 2 complete!\n');
}

fixPhase2().catch(console.error);
