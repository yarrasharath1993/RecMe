#!/usr/bin/env npx tsx
/**
 * Export Chiranjeevi filmography: Movie Name | Year | Role (for manual verification).
 * First batch: just movie name and role.
 *
 * Usage: npx tsx scripts/export-chiranjeevi-filmography-for-verification.ts
 *        npx tsx scripts/export-chiranjeevi-filmography-for-verification.ts --output=reports/chiru-verify-batch1.md
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CHIRU = 'Chiranjeevi';

function hasChiru(m: any): { role: string; character?: string } | null {
  const h = (m.hero || '').trim();
  const hv = (m.heroine || '').trim();
  if (h.toLowerCase().includes('chiranjeevi') && !h.toLowerCase().includes('sarja')) return { role: 'Hero' };
  if (hv.toLowerCase().includes('chiranjeevi') && !hv.toLowerCase().includes('sarja')) return { role: 'Heroine' };
  const sc = m.supporting_cast;
  if (!Array.isArray(sc)) return null;
  for (const c of sc) {
    const name = typeof c === 'object' ? c?.name : c;
    if (name && String(name).toLowerCase().includes('chiranjeevi') && !String(name).toLowerCase().includes('sarja')) {
      const type = (typeof c === 'object' && c?.type) ? c.type : 'supporting';
      const roleLabel = type === 'cameo' ? 'Cameo'
        : type === 'support' || type === 'supporting' ? 'Supporting'
        : type === 'villain' || type === 'antagonist' ? 'Villain'
        : type;
      return { role: roleLabel, character: typeof c === 'object' ? c?.role : undefined };
    }
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string) => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1].replace(/['"]/g, '') : '';
  };
  const outputPath = getArg('output') || 'reports/chiranjeevi-verify-batch1-movie-and-role.md';

  const { data: heroRows } = await supabase
    .from('movies')
    .select('id, title_en, slug, release_year, hero, supporting_cast')
    .eq('is_published', true)
    .ilike('hero', '%chiranjeevi%')
    .not('hero', 'ilike', '%sarja%');

  let supportingRows: any[] = [];
  let page = 0;
  const PAGE = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data: pageData } = await supabase
      .from('movies')
      .select('id, title_en, slug, release_year, hero, supporting_cast')
      .eq('is_published', true)
      .not('supporting_cast', 'is', null)
      .range(page * PAGE, (page + 1) * PAGE - 1);
    const rows = pageData || [];
    supportingRows = supportingRows.concat(rows);
    hasMore = rows.length === PAGE;
    page += 1;
  }

  const byId = new Map<string, any>();
  for (const m of heroRows || []) {
    byId.set(m.id, m);
  }
  for (const m of supportingRows) {
    if (hasChiru(m) && !(m.hero || '').toLowerCase().includes('chiranjeevi')) {
      byId.set(m.id, m);
    }
  }

  const all = Array.from(byId.values());
  const withRole = all.map(m => {
    const r = hasChiru(m);
    if (!r) return null;
    return {
      title: m.title_en || m.slug || '—',
      year: m.release_year ?? '—',
      role: r.role,
      character: r.character,
    };
  }).filter(Boolean) as { title: string; year: number | string; role: string; character?: string }[];

  withRole.sort((a, b) => {
    const y1 = typeof a.year === 'number' ? a.year : 0;
    const y2 = typeof b.year === 'number' ? b.year : 0;
    if (y1 !== y2) return y1 - y2;
    return (a.title || '').localeCompare(b.title || '');
  });

  let md = `# Chiranjeevi Filmography – Batch 1: Movie Name & Role\n\n`;
  md += `For manual verification. Generated: ${new Date().toISOString()}\n\n`;
  md += `| # | Movie | Year | Role | Character (if any) |\n`;
  md += `|---|-------|------|------|--------------------|\n`;
  withRole.forEach((row, i) => {
    md += `| ${i + 1} | ${row.title} | ${row.year} | ${row.role} | ${row.character || '—'} |\n`;
  });
  md += `\n**Total: ${withRole.length} entries.**\n`;

  const dir = path.dirname(outputPath);
  if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, md, 'utf8');
  console.log(`Wrote ${withRole.length} rows to ${outputPath}`);
}

main().catch(console.error);
