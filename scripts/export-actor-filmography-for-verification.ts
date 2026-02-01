#!/usr/bin/env npx tsx
/**
 * Export any actor's filmography: Movie Name | Year | Role (Batch 1 for manual verification).
 * Generalized from Chiranjeevi export; supports hero + supporting_cast + villain/cameo.
 *
 * Usage:
 *   npx tsx scripts/export-actor-filmography-for-verification.ts --actor="Krishna"
 *   npx tsx scripts/export-actor-filmography-for-verification.ts --actor="Chiranjeevi" --exclude=sarja
 *   npx tsx scripts/export-actor-filmography-for-verification.ts --actor="Daggubati Venkatesh" --output=reports/venkatesh-verify-batch1.md
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

function hasActor(m: any, actorName: string, excludePattern?: string): { role: string; character?: string } | null {
  const a = actorName.trim().toLowerCase();
  const ex = (excludePattern || '').trim().toLowerCase();
  const h = (m.hero || '').trim();
  const hv = (m.heroine || '').trim();
  if (h.toLowerCase().includes(a) && (!ex || !h.toLowerCase().includes(ex))) return { role: 'Hero' };
  if (hv.toLowerCase().includes(a) && (!ex || !hv.toLowerCase().includes(ex))) return { role: 'Heroine' };
  const sc = m.supporting_cast;
  if (!Array.isArray(sc)) return null;
  for (const c of sc) {
    const name = typeof c === 'object' ? c?.name : c;
    if (!name) continue;
    const n = String(name).toLowerCase();
    if (!n.includes(a) || (ex && n.includes(ex))) continue;
    const type = (typeof c === 'object' && c?.type) ? c.type : 'supporting';
    const roleLabel = type === 'cameo' ? 'Cameo'
      : type === 'support' || type === 'supporting' ? 'Supporting'
      : type === 'villain' || type === 'antagonist' ? 'Villain'
      : type;
    return { role: roleLabel, character: typeof c === 'object' ? c?.role : undefined };
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string) => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1].replace(/['"]/g, '') : '';
  };
  const actor = getArg('actor') || '';
  const exclude = getArg('exclude');
  const outputArg = getArg('output');

  if (!actor) {
    console.error('Usage: npx tsx scripts/export-actor-filmography-for-verification.ts --actor="Actor Name" [--exclude=pattern] [--output=path]');
    process.exit(1);
  }

  const actorSlug = actor.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const outputPath = outputArg || `reports/${actorSlug}-verify-batch1-movie-and-role.md`;

  let heroQuery = supabase
    .from('movies')
    .select('id, title_en, slug, release_year, hero, supporting_cast')
    .eq('is_published', true)
    .ilike('hero', `%${actor}%`);
  if (exclude) {
    heroQuery = heroQuery.not('hero', 'ilike', `%${exclude}%`);
  }
  const { data: heroRows } = await heroQuery;

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
  const actorLower = actor.toLowerCase();
  for (const m of supportingRows) {
    if (hasActor(m, actor, exclude) && !(m.hero || '').toLowerCase().includes(actorLower)) {
      byId.set(m.id, m);
    }
  }

  const all = Array.from(byId.values());
  const withRole = all.map(m => {
    const r = hasActor(m, actor, exclude);
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

  let md = `# ${actor} Filmography – Batch 1: Movie Name & Role\n\n`;
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
