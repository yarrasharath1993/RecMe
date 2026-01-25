import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NameOccurrence {
  name: string;
  role: string;
  movieCount: number;
  firstYear: number;
  lastYear: number;
  sampleMovies: string[];
}

interface DuplicateNameCase {
  name: string;
  occurrences: NameOccurrence[];
  isLikelyDifferentPerson: boolean;
  reason: string;
  confidence: number;
}

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function areLikelyDifferentPersons(occurrences: NameOccurrence[]): { isDifferent: boolean; reason: string; confidence: number } {
  if (occurrences.length < 2) {
    return { isDifferent: false, reason: 'Only one occurrence', confidence: 0 };
  }

  // Check 1: Different time periods (gap > 20 years suggests different person)
  const years = occurrences.flatMap(o => [o.firstYear, o.lastYear]).filter(y => y > 0);
  if (years.length > 0) {
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const gap = maxYear - minYear;
    
    // If gap is > 50 years, likely different person
    if (gap > 50) {
      return { 
        isDifferent: true, 
        reason: `Time gap of ${gap} years (${minYear}-${maxYear}) suggests different persons`,
        confidence: 90
      };
    }
  }

  // Check 2: Different roles (e.g., hero vs producer) with no overlap
  const roles = new Set(occurrences.map(o => o.role));
  if (roles.size === occurrences.length) {
    // All different roles - could be same person (multi-talented) or different
    // Check if there's a time overlap
    const hasTimeOverlap = occurrences.some((o1, i) => 
      occurrences.slice(i + 1).some(o2 => 
        (o1.firstYear <= o2.lastYear && o1.lastYear >= o2.firstYear)
      )
    );
    
    if (!hasTimeOverlap && roles.has('producer') && roles.has('hero')) {
      return {
        isDifferent: true,
        reason: `Different roles (${Array.from(roles).join(', ')}) with no time overlap`,
        confidence: 75
      };
    }
  }

  // Check 3: Name variations (S. Rajinikanth vs Rajinikanth)
  const names = occurrences.map(o => o.name);
  const hasPrefixVariation = names.some(n => n.includes('s.') || n.includes('s ')) && 
                             names.some(n => !n.includes('s.') && !n.includes('s '));
  if (hasPrefixVariation) {
    return {
      isDifferent: true,
      reason: 'Name prefix variation (e.g., S. Rajinikanth vs Rajinikanth)',
      confidence: 85
    };
  }

  // Check 4: Very different time periods for same role
  const roleGroups = new Map<string, NameOccurrence[]>();
  occurrences.forEach(o => {
    if (!roleGroups.has(o.role)) {
      roleGroups.set(o.role, []);
    }
    roleGroups.get(o.role)!.push(o);
  });

  for (const [role, group] of roleGroups.entries()) {
    if (group.length >= 2) {
      const years = group.flatMap(o => [o.firstYear, o.lastYear]).filter(y => y > 0);
      if (years.length > 0) {
        const gap = Math.max(...years) - Math.min(...years);
        if (gap > 40) {
          return {
            isDifferent: true,
            reason: `Same role (${role}) with ${gap} year gap suggests different persons`,
            confidence: 80
          };
        }
      }
    }
  }

  return { isDifferent: false, reason: 'Likely same person', confidence: 0 };
}

async function auditDuplicateNames() {
  console.log('🔍 Auditing duplicate names across roles and time periods...\n');

  // Fetch all movies with all relevant fields
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, heroine, director, producer, music_director, writer')
    .eq('is_published', true)
    .not('release_year', 'is', null);

  if (error) {
    console.error('Error fetching movies:', error.message);
    return;
  }

  if (!movies || movies.length === 0) {
    console.log('No movies found.');
    return;
  }

  console.log(`📊 Analyzing ${movies.length} published movies...\n`);

  // Collect all name occurrences
  const nameMap = new Map<string, Map<string, NameOccurrence>>();

  for (const movie of movies) {
    const fields = [
      { value: movie.hero, role: 'hero' },
      { value: movie.heroine, role: 'heroine' },
      { value: movie.director, role: 'director' },
      { value: movie.producer, role: 'producer' },
      { value: movie.music_director, role: 'music_director' },
      { value: movie.writer, role: 'writer' },
    ];

    for (const field of fields) {
      if (!field.value) continue;

      // Split by comma to handle multiple names
      const names = field.value.split(',').map(n => n.trim()).filter(n => n.length > 0);

      for (const name of names) {
        const normalized = normalizeName(name);
        
        if (!nameMap.has(normalized)) {
          nameMap.set(normalized, new Map());
        }

        const roleMap = nameMap.get(normalized)!;
        const roleKey = `${normalized}::${field.role}`;

        if (!roleMap.has(roleKey)) {
          roleMap.set(roleKey, {
            name: name, // Keep original casing
            role: field.role,
            movieCount: 0,
            firstYear: movie.release_year || 9999,
            lastYear: movie.release_year || 0,
            sampleMovies: [],
          });
        }

        const occurrence = roleMap.get(roleKey)!;
        occurrence.movieCount++;
        
        if (movie.release_year) {
          if (movie.release_year < occurrence.firstYear) {
            occurrence.firstYear = movie.release_year;
          }
          if (movie.release_year > occurrence.lastYear) {
            occurrence.lastYear = movie.release_year;
          }
        }

        if (occurrence.sampleMovies.length < 3) {
          occurrence.sampleMovies.push(movie.title_en || 'Unknown');
        }
      }
    }
  }

  // Find names that appear in multiple roles or time periods
  const duplicateCases: DuplicateNameCase[] = [];

  for (const [normalizedName, roleMap] of nameMap.entries()) {
    if (roleMap.size >= 2) {
      // Name appears in multiple roles
      const occurrences = Array.from(roleMap.values());
      const { isDifferent, reason, confidence } = areLikelyDifferentPersons(occurrences);
      
      if (isDifferent || occurrences.length >= 2) {
        duplicateCases.push({
          name: occurrences[0].name, // Use first occurrence's original name
          occurrences,
          isLikelyDifferentPerson: isDifferent,
          reason,
          confidence,
        });
      }
    }
  }

  // Sort by confidence (highest first)
  duplicateCases.sort((a, b) => b.confidence - a.confidence);

  console.log(`📋 Found ${duplicateCases.length} potential duplicate name cases\n`);

  // Generate detailed report
  const report: any[] = [];

  for (const case_ of duplicateCases) {
    const row = {
      name: case_.name,
      occurrences_count: case_.occurrences.length,
      roles: case_.occurrences.map(o => o.role).join(', '),
      total_movies: case_.occurrences.reduce((sum, o) => sum + o.movieCount, 0),
      year_range: `${Math.min(...case_.occurrences.map(o => o.firstYear))}-${Math.max(...case_.occurrences.map(o => o.lastYear))}`,
      is_likely_different_person: case_.isLikelyDifferentPerson ? 'YES' : 'NO',
      confidence: case_.confidence,
      reason: case_.reason,
      sample_movies: case_.occurrences.map(o => `${o.role}(${o.movieCount}): ${o.sampleMovies.join(', ')}`).join(' | '),
    };
    report.push(row);
  }

  // Export to CSV
  const csvPath = path.join(process.cwd(), 'DUPLICATE-NAMES-AUDIT.csv');
  const csvHeader = 'Name,Occurrences Count,Roles,Total Movies,Year Range,Is Likely Different Person,Confidence,Reason,Sample Movies';
  const csvRows = report.map(row => {
    const escape = (val: any) => `"${String(val).replace(/"/g, '""')}"`;
    return [
      escape(row.name),
      row.occurrences_count,
      escape(row.roles),
      row.total_movies,
      escape(row.year_range),
      escape(row.is_likely_different_person),
      row.confidence,
      escape(row.reason),
      escape(row.sample_movies),
    ].join(',');
  });
  fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'), 'utf-8');

  console.log('📊 Summary by Confidence Level:\n');
  const highConfidence = duplicateCases.filter(c => c.confidence >= 75);
  const mediumConfidence = duplicateCases.filter(c => c.confidence >= 50 && c.confidence < 75);
  const lowConfidence = duplicateCases.filter(c => c.confidence < 50);

  console.log(`  🔴 High Confidence (≥75%): ${highConfidence.length} cases`);
  console.log(`  🟡 Medium Confidence (50-74%): ${mediumConfidence.length} cases`);
  console.log(`  🟢 Low Confidence (<50%): ${lowConfidence.length} cases`);

  console.log('\n📝 Top 20 High-Confidence Cases:\n');
  highConfidence.slice(0, 20).forEach((case_, index) => {
    console.log(`${index + 1}. ${case_.name}`);
    console.log(`   Roles: ${case_.occurrences.map(o => `${o.role}(${o.movieCount})`).join(', ')}`);
    console.log(`   Years: ${case_.occurrences.map(o => `${o.firstYear}-${o.lastYear}`).join(', ')}`);
    console.log(`   Reason: ${case_.reason}`);
    console.log(`   Confidence: ${case_.confidence}%`);
    console.log('');
  });

  console.log(`\n✅ Detailed report saved to: ${csvPath}\n`);
  console.log('✨ Audit complete!\n');
}

auditDuplicateNames().catch(console.error);
