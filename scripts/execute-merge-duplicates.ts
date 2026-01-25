#!/usr/bin/env npx tsx
/**
 * Execute Duplicate Celebrity Merges
 * Safely deletes duplicate celebrity profiles after verification
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

function cyan(text: string) { return `${colors.cyan}${text}${colors.reset}`; }
function green(text: string) { return `${colors.green}${text}${colors.reset}`; }
function yellow(text: string) { return `${colors.yellow}${text}${colors.reset}`; }
function red(text: string) { return `${colors.red}${text}${colors.reset}`; }
function white(text: string) { return `${colors.white}${text}${colors.reset}`; }
function bold(text: string) { return `${colors.bold}${text}${colors.reset}`; }

interface DuplicateGroup {
  celebrities: Array<{ id: string; name: string; slug: string; }>;
}

async function executeMerge() {
  console.log(cyan(bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           EXECUTE DUPLICATE CELEBRITY MERGES                          ║
║           Deleting Verified Duplicates                                ║
╚═══════════════════════════════════════════════════════════════════════╝
`)));

  // Load audit to get list of duplicates
  const auditPath = resolve(process.cwd(), 'docs/manual-review/DUPLICATE-CELEBRITIES-AUDIT.json');
  const audit = JSON.parse(readFileSync(auditPath, 'utf8'));
  
  const highPriority = audit.duplicate_groups.filter((g: any) => g.severity === 'high');
  
  console.log(white(`  Total duplicate groups: ${highPriority.length}\n`));
  
  let deleted = 0;
  let errors = 0;
  
  for (const group of highPriority) {
    // Sort by score to keep the best one
    const scored = group.celebrities.map((c: any) => {
      let score = (c.confidence_score || 0) * 10;
      if (c.is_published) score += 50;
      if (c.has_bio) score += 30;
      return { ...c, score };
    });
    
    scored.sort((a: any, b: any) => b.score - a.score);
    
    const primary = scored[0];
    const duplicates = scored.slice(1);
    
    console.log(yellow(`  ${group.reason}`));
    console.log(green(`    ✅ KEEP: ${primary.name} (${primary.slug})`));
    
    for (const dup of duplicates) {
      const { error } = await supabase
        .from('celebrities')
        .delete()
        .eq('id', dup.id);
      
      if (error) {
        console.log(red(`    ❌ ERROR deleting ${dup.name}: ${error.message}`));
        errors++;
      } else {
        console.log(white(`    🗑️  Deleted: ${dup.name} (${dup.slug})`));
        deleted++;
      }
    }
    
    console.log('');
  }
  
  console.log(cyan(bold('╔═══════════════════════════════════════════════════════════════════════╗')));
  console.log(cyan(bold('║                        CLEANUP COMPLETE                                ║')));
  console.log(cyan(bold('╚═══════════════════════════════════════════════════════════════════════╝\n')));
  
  console.log(green(`  ✅ Profiles deleted: ${deleted}`));
  if (errors > 0) {
    console.log(red(`  ❌ Errors: ${errors}`));
  }
  console.log('');
  
  console.log(cyan(bold('  🚀 NEXT STEPS:\n')));
  console.log(white('  1. Re-run duplicate audit: npx tsx scripts/audit-duplicate-celebrities.ts'));
  console.log(white('  2. Verify cleanup was successful'));
  console.log(white('  3. Proceed with enrichment: npx tsx scripts/enrich-minimal-profiles.ts\n'));
}

executeMerge().catch(console.error);
