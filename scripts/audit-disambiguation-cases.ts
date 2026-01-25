import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Confirmed different persons from user review
 */
const CONFIRMED_DIFFERENT_PERSONS = [
  {
    name: 'Devaraj',
    rules: [
      { condition: 'director', years: [1977], description: '1970s director' },
      { condition: 'hero', years: [2022], description: 'Modern actor (Head Bush)' },
    ],
  },
  {
    name: 'Sudhakar',
    rules: [
      { condition: 'producer', years: [1982], description: 'Producer' },
      { condition: 'hero', years: [1982, 1990], description: 'Actor/Comedian' },
    ],
  },
  {
    name: 'Ram',
    rules: [
      { condition: 'music_director', years: [2010], description: 'Music director' },
      { condition: 'hero', years: [2020], description: 'Actor (Ram Pothineni)' },
    ],
  },
  {
    name: 'Sagar',
    rules: [
      { condition: 'director', years: [1995, 2016], description: 'Director' },
      { condition: 'hero', years: [2016], description: 'Singer/Actor' },
    ],
  },
  {
    name: 'Srikanth',
    rules: [
      { condition: 'hero', languages: ['Tamil'], description: 'Tamil actor (Meka Srikanth)' },
      { condition: 'hero', languages: ['Telugu'], description: 'Telugu actor' },
    ],
  },
  {
    name: 'Anil Kumar',
    rules: [
      { condition: 'director', years: [1985], description: '1980s director' },
      { condition: 'music_director', years: [2014], description: 'Modern music technician' },
    ],
  },
  {
    name: 'Vijay Bhaskar',
    rules: [
      { condition: 'director', years: [1982], description: 'Director/Writer (name ambiguity)' },
    ],
  },
];

interface DisambiguationCase {
  personName: string;
  rule: any;
  movies: Array<{
    id: string;
    title: string;
    year: number;
    slug: string;
    field: string;
    value: string;
    language?: string;
  }>;
  totalCount: number;
}

async function auditDisambiguationCases() {
  console.log('🔍 Auditing disambiguation cases for all 7 confirmed different persons...\n');

  const cases: DisambiguationCase[] = [];

  for (const person of CONFIRMED_DIFFERENT_PERSONS) {
    console.log(`📋 Processing: ${person.name}...\n`);

    // Fetch all movies with this name
    const { data: movies } = await supabase
      .from('movies')
      .select('id, title_en, release_year, slug, hero, heroine, director, producer, music_director, writer, language')
      .eq('is_published', true)
      .or(`hero.ilike.%${person.name}%,heroine.ilike.%${person.name}%,director.ilike.%${person.name}%,producer.ilike.%${person.name}%,music_director.ilike.%${person.name}%,writer.ilike.%${person.name}%`);

    if (!movies || movies.length === 0) {
      console.log(`   ⚠️  No movies found for ${person.name}\n`);
      continue;
    }

    // Process each rule
    for (const rule of person.rules) {
      const matchingMovies: DisambiguationCase['movies'] = [];

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

          const names = field.value.split(',').map(n => n.trim());
          const nameMatches = names.some(n => 
            n.toLowerCase().includes(person.name.toLowerCase())
          );

          if (nameMatches && field.field === rule.condition) {
            // Check year match
            if (rule.years && movie.release_year) {
              if (rule.years.includes(movie.release_year)) {
                matchingMovies.push({
                  id: movie.id,
                  title: movie.title_en || 'Unknown',
                  year: movie.release_year,
                  slug: movie.slug || '',
                  field: field.field,
                  value: field.value,
                  language: movie.language || undefined,
                });
              }
            }
            // Check language match
            else if (rule.languages && movie.language) {
              if (rule.languages.includes(movie.language)) {
                matchingMovies.push({
                  id: movie.id,
                  title: movie.title_en || 'Unknown',
                  year: movie.release_year || 0,
                  slug: movie.slug || '',
                  field: field.field,
                  value: field.value,
                  language: movie.language,
                });
              }
            }
            // No specific filter (e.g., Vijay Bhaskar)
            else if (!rule.years && !rule.languages) {
              matchingMovies.push({
                id: movie.id,
                title: movie.title_en || 'Unknown',
                year: movie.release_year || 0,
                slug: movie.slug || '',
                field: field.field,
                value: field.value,
                language: movie.language || undefined,
              });
            }
          }
        }
      }

      if (matchingMovies.length > 0) {
        cases.push({
          personName: person.name,
          rule,
          movies: matchingMovies,
          totalCount: matchingMovies.length,
        });

        console.log(`   ✅ ${rule.description}: ${matchingMovies.length} movies`);
        matchingMovies.slice(0, 5).forEach(m => {
          console.log(`      - ${m.title} (${m.year}) [${m.field}]`);
        });
        if (matchingMovies.length > 5) {
          console.log(`      ... and ${matchingMovies.length - 5} more`);
        }
        console.log('');
      }
    }
  }

  // Generate CSV report
  const csvHeader = 'Person Name,Rule Description,Condition,Filter Type,Filter Value,Movie ID,Title,Year,Slug,Field,Value,Language';
  const csvRows: string[] = [];

  cases.forEach(case_ => {
    case_.movies.forEach(movie => {
      const escape = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
      const filterType = case_.rule.years ? 'years' : case_.rule.languages ? 'languages' : 'none';
      const filterValue = case_.rule.years 
        ? case_.rule.years.join(',')
        : case_.rule.languages 
        ? case_.rule.languages.join(',')
        : 'N/A';
      
      csvRows.push([
        escape(case_.personName),
        escape(case_.rule.description),
        escape(case_.rule.condition),
        filterType,
        filterValue,
        movie.id,
        escape(movie.title),
        movie.year,
        escape(movie.slug),
        escape(movie.field),
        escape(movie.value),
        escape(movie.language || ''),
      ].join(','));
    });
  });

  const csvPath = path.join(process.cwd(), 'DISAMBIGUATION-CASES-AUDIT.csv');
  fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'), 'utf-8');

  // Generate summary
  console.log('\n📊 Summary:\n');
  cases.forEach(case_ => {
    console.log(`   ${case_.personName} - ${case_.rule.description}: ${case_.totalCount} movies`);
  });

  console.log(`\n📝 Detailed report saved to: ${csvPath}\n`);
  console.log('✨ Audit complete!\n');
}

auditDisambiguationCases().catch(console.error);
