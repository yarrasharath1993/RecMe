#!/usr/bin/env npx tsx
/**
 * Import Telugu Names from TSV Batch File
 * 
 * Usage: npx tsx scripts/import-telugu-names-batch.ts
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
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

function cyan(text: string) { return `${colors.cyan}${text}${colors.reset}`; }
function green(text: string) { return `${colors.green}${text}${colors.reset}`; }
function yellow(text: string) { return `${colors.yellow}${text}${colors.reset}`; }
function white(text: string) { return `${colors.white}${text}${colors.reset}`; }
function bold(text: string) { return `${colors.bold}${text}${colors.reset}`; }

async function importTeluguNames() {
  console.log(cyan(bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           IMPORT TELUGU NAMES FROM BATCH FILE                         ║
╚═══════════════════════════════════════════════════════════════════════╝
`)));

  const tsvPath = 'docs/manual-review/TELUGU-NAMES-BATCH-1.tsv';
  console.log(white(`  Reading: ${tsvPath}\n`));

  const content = readFileSync(tsvPath, 'utf-8');
  const lines = content.split('\n');

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const line of lines) {
    // Skip comments and headers
    if (line.startsWith('#') || line.startsWith('id\t') || line.trim() === '') continue;

    const [id, name_en, name_te, occupation, wikipedia_url, imdb_url, notes, status] = line.split('\t');

    // Only process completed entries
    if (status?.trim() !== 'DONE' || !name_te?.trim()) {
      skipped++;
      continue;
    }

    // Find celebrity by slug
    const { data: celeb } = await supabase
      .from('celebrities')
      .select('id, name_en')
      .eq('slug', id.trim())
      .single();

    if (!celeb) {
      console.log(yellow(`  ⚠️  Not found: ${id} (${name_en})`));
      errors++;
      continue;
    }

    // Update Telugu name
    const { error } = await supabase
      .from('celebrities')
      .update({ name_te: name_te.trim() })
      .eq('id', celeb.id);

    if (error) {
      console.log(yellow(`  ⚠️  Error: ${name_en} - ${error.message}`));
      errors++;
    } else {
      console.log(green(`  ✓ ${name_en} → ${name_te.trim()}`));
      imported++;
    }
  }

  console.log(cyan(bold('\n╔═══════════════════════════════════════════════════════════════════════╗')));
  console.log(cyan(bold('║                        SUMMARY                                         ║')));
  console.log(cyan(bold('╚═══════════════════════════════════════════════════════════════════════╝\n')));

  console.log(green(`  ✅ Imported: ${imported}`));
  console.log(yellow(`  ⊘ Skipped: ${skipped} (not marked DONE or empty)`));
  if (errors > 0) {
    console.log(yellow(`  ⚠️  Errors: ${errors}`));
  }
  console.log('');
}

importTeluguNames().catch(console.error);
