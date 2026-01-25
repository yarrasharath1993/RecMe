import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NameVariation {
  canonical: string;
  variations: string[];
  occurrences: number;
  movies: Array<{ title: string; year: number; field: string; value: string }>;
}

function normalizeName(name: string): string {
  // Remove extra spaces, convert to lowercase
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function extractBaseName(name: string): string {
  // Remove prefixes like "S.", "R.", "K.", etc.
  const withoutPrefix = name.replace(/^[A-Z]\.\s*/i, '').replace(/^[A-Z]\s+/i, '');
  return normalizeName(withoutPrefix);
}

async function auditNameVariations() {
  console.log('🔍 Auditing name variations for standardization...\n');

  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, heroine, director, producer, music_director, writer')
    .eq('is_published', true);

  if (error) {
    console.error('Error fetching movies:', error.message);
    return;
  }

  if (!movies || movies.length === 0) {
    console.log('No movies found.');
    return;
  }

  console.log(`📊 Analyzing ${movies.length} published movies...\n`);

  // Collect all names with their variations
  const nameMap = new Map<string, Set<string>>();
  const nameOccurrences = new Map<string, Array<{ title: string; year: number; field: string; value: string }>>();

  for (const movie of movies) {
    const fields = [
      { value: movie.hero, field: 'hero' },
      { value: movie.heroine, field: 'heroine' },
      { value: movie.director, field: 'director' },
      { value: movie.producer, field: 'producer' },
      { value: movie.music_director, field: 'music_director' },
      { value: movie.writer, field: 'writer' },
    ];

    for (const field of fields) {
      if (!field.value) continue;

      const names = field.value.split(',').map(n => n.trim()).filter(n => n.length > 0);

      for (const name of names) {
        const baseName = extractBaseName(name);
        const normalized = normalizeName(name);

        if (!nameMap.has(baseName)) {
          nameMap.set(baseName, new Set());
        }
        nameMap.get(baseName)!.add(normalized);

        if (!nameOccurrences.has(normalized)) {
          nameOccurrences.set(normalized, []);
        }
        nameOccurrences.get(normalized)!.push({
          title: movie.title_en || 'Unknown',
          year: movie.release_year || 0,
          field: field.field,
          value: name,
        });
      }
    }
  }

  // Find names with multiple variations
  const variations: NameVariation[] = [];

  for (const [baseName, variantSet] of nameMap.entries()) {
    if (variantSet.size > 1) {
      const variantArray = Array.from(variantSet);
      const allOccurrences: Array<{ title: string; year: number; field: string; value: string }> = [];
      
      variantArray.forEach(variant => {
        const occurrences = nameOccurrences.get(variant) || [];
        allOccurrences.push(...occurrences);
      });

      // Determine canonical name (most common or longest)
      const variantCounts = variantArray.map(v => ({
        variant: v,
        count: (nameOccurrences.get(v) || []).length,
      }));
      variantCounts.sort((a, b) => b.count - a.count);
      const canonical = variantCounts[0].variant;

      variations.push({
        canonical,
        variations: variantArray,
        occurrences: allOccurrences.length,
        movies: allOccurrences.slice(0, 10), // Sample movies
      });
    }
  }

  // Sort by occurrences (most common first)
  variations.sort((a, b) => b.occurrences - a.occurrences);

  console.log(`📋 Found ${variations.length} names with variations\n`);

  // Generate CSV report
  const csvHeader = 'Canonical Name,Variations,Total Occurrences,Sample Movies';
  const csvRows = variations.map(v => {
    const escape = (val: any) => `"${String(val).replace(/"/g, '""')}"`;
    const variationsStr = v.variations.join(' | ');
    const sampleMoviesStr = v.movies
      .map(m => `${m.title} (${m.year}) [${m.field}]`)
      .join('; ');
    return [
      escape(v.canonical),
      escape(variationsStr),
      v.occurrences,
      escape(sampleMoviesStr),
    ].join(',');
  });

  const csvPath = path.join(process.cwd(), 'NAME-VARIATIONS-AUDIT.csv');
  fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'), 'utf-8');

  // Generate summary
  console.log('📊 Top 30 Name Variations:\n');
  variations.slice(0, 30).forEach((v, i) => {
    console.log(`${i + 1}. ${v.canonical}`);
    console.log(`   Variations: ${v.variations.join(', ')}`);
    console.log(`   Occurrences: ${v.occurrences}`);
    console.log(`   Sample: ${v.movies[0]?.title} (${v.movies[0]?.year})`);
    console.log('');
  });

  console.log(`\n📝 Detailed report saved to: ${csvPath}\n`);
  console.log('✨ Audit complete!\n');
}

auditNameVariations().catch(console.error);
