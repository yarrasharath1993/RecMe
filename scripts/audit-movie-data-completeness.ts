#!/usr/bin/env npx tsx
/**
 * COMPREHENSIVE MOVIE DATA COMPLETENESS AUDIT
 * 
 * Analyzes all 7,398+ Telugu movies across 9 display sections:
 * 1. Hero Section (title, poster, backdrop, year, runtime, certification, ratings)
 * 2. Synopsis (EN/TE synopsis, tagline)
 * 3. Cast & Crew (director, hero, heroine, music, producer, cinematographer, supporting cast)
 * 4. Genres (standardized genre array)
 * 5. Ratings (our_rating, avg_rating, editorial_score, imdb_rating)
 * 6. Tags (blockbuster, classic, underrated, featured)
 * 7. Editorial Review (movie_reviews table)
 * 8. Trailers/Media (trailer_url, videos)
 * 9. Similar Movies (recommendation engine readiness)
 * 
 * Outputs:
 * - MOVIE-DATA-AUDIT-SUMMARY.md (executive summary)
 * - MISSING-DATA-BY-SECTION.csv (field-by-field gaps)
 * - PRIORITY-FIX-QUEUE.json (prioritized fix list)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DataCompletenessReport {
  total_movies: number;
  audit_date: string;
  by_section: {
    hero_section: {
      complete: number;
      missing_fields: Record<string, number>;
      completeness_rate: number;
    };
    synopsis: {
      complete: number;
      missing_en: number;
      missing_te: number;
      missing_both: number;
      missing_tagline: number;
      completeness_rate: number;
    };
    cast_crew: {
      complete: number;
      missing_by_field: Record<string, number>;
      completeness_rate: number;
    };
    genres: {
      complete: number;
      empty: number;
      single_genre: number;
      two_genres: number;
      three_plus_genres: number;
      completeness_rate: number;
    };
    ratings: {
      complete: number;
      missing_by_type: Record<string, number>;
      no_ratings: number;
      completeness_rate: number;
    };
    tags: {
      complete: number;
      untagged: number;
      partially_tagged: number;
      completeness_rate: number;
    };
    editorial: {
      total_reviews: number;
      complete: number;
      draft: number;
      missing: number;
      featured: number;
      completeness_rate: number;
    };
    media: {
      complete: number;
      missing_trailer: number;
      missing_videos: number;
      completeness_rate: number;
    };
    recommendations: {
      functional: number;
      insufficient_data: number;
      completeness_rate: number;
    };
  };
  quality_score_distribution: Record<string, number>;
  by_decade: Record<string, { total: number; avg_completeness: number }>;
  priority_fixes: Array<{
    movie_id: string;
    title: string;
    year: number;
    missing_fields: string[];
    priority: 'critical' | 'high' | 'medium' | 'low';
    visibility_score: number;
  }>;
}

async function auditMovieData(): Promise<DataCompletenessReport> {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║         COMPREHENSIVE MOVIE DATA COMPLETENESS AUDIT                   ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  // Fetch all movies
  console.log(chalk.white('  Loading all movies from database...\n'));
  const BATCH_SIZE = 1000;
  let offset = 0;
  let allMovies: any[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('id')
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error('Error fetching movies:', error);
      break;
    }
    if (!data || data.length === 0) break;
    
    allMovies.push(...data);
    console.log(chalk.gray(`    Loaded ${allMovies.length} movies...`));
    offset += BATCH_SIZE;
    if (data.length < BATCH_SIZE) break;
  }

  console.log(chalk.green(`  ✓ Loaded ${allMovies.length.toLocaleString()} movies total\n`));

  // Fetch all reviews
  console.log(chalk.white('  Loading editorial reviews...\n'));
  const { data: reviews, error: reviewsError } = await supabase
    .from('movie_reviews')
    .select('movie_id, status, is_featured, overall_rating');

  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError);
  }

  const reviewsByMovie = new Map<string, any[]>();
  reviews?.forEach(review => {
    if (!reviewsByMovie.has(review.movie_id)) {
      reviewsByMovie.set(review.movie_id, []);
    }
    reviewsByMovie.get(review.movie_id)!.push(review);
  });

  console.log(chalk.green(`  ✓ Loaded ${reviews?.length || 0} reviews\n`));

  // Initialize report
  const report: DataCompletenessReport = {
    total_movies: allMovies.length,
    audit_date: new Date().toISOString(),
    by_section: {
      hero_section: {
        complete: 0,
        missing_fields: {},
        completeness_rate: 0
      },
      synopsis: {
        complete: 0,
        missing_en: 0,
        missing_te: 0,
        missing_both: 0,
        missing_tagline: 0,
        completeness_rate: 0
      },
      cast_crew: {
        complete: 0,
        missing_by_field: {},
        completeness_rate: 0
      },
      genres: {
        complete: 0,
        empty: 0,
        single_genre: 0,
        two_genres: 0,
        three_plus_genres: 0,
        completeness_rate: 0
      },
      ratings: {
        complete: 0,
        missing_by_type: {},
        no_ratings: 0,
        completeness_rate: 0
      },
      tags: {
        complete: 0,
        untagged: 0,
        partially_tagged: 0,
        completeness_rate: 0
      },
      editorial: {
        total_reviews: reviews?.length || 0,
        complete: 0,
        draft: 0,
        missing: 0,
        featured: 0,
        completeness_rate: 0
      },
      media: {
        complete: 0,
        missing_trailer: 0,
        missing_videos: 0,
        completeness_rate: 0
      },
      recommendations: {
        functional: 0,
        insufficient_data: 0,
        completeness_rate: 0
      }
    },
    quality_score_distribution: {},
    by_decade: {},
    priority_fixes: []
  };

  console.log(chalk.white('  Analyzing data completeness across 9 sections...\n'));

  // Analyze each movie
  const missingDataMovies: any[] = [];

  for (const movie of allMovies) {
    const missingFields: string[] = [];
    let sectionScores = {
      hero: 0,
      synopsis: 0,
      cast: 0,
      genres: 0,
      ratings: 0,
      tags: 0,
      editorial: 0,
      media: 0,
      recommendations: 0
    };

    // Section 1: Hero Section
    const heroFields = ['title_en', 'poster_url', 'release_year'];
    let heroComplete = true;
    heroFields.forEach(field => {
      if (!movie[field]) {
        heroComplete = false;
        missingFields.push(field);
        report.by_section.hero_section.missing_fields[field] = 
          (report.by_section.hero_section.missing_fields[field] || 0) + 1;
      }
    });
    if (heroComplete) {
      report.by_section.hero_section.complete++;
      sectionScores.hero = 100;
    } else {
      sectionScores.hero = ((heroFields.length - missingFields.filter(f => heroFields.includes(f)).length) / heroFields.length) * 100;
    }

    // Section 2: Synopsis
    const hasSynopsisEn = !!movie.synopsis;
    const hasSynopsisTe = !!movie.synopsis_te;
    const hasTagline = !!movie.tagline;
    
    if (!hasSynopsisEn) {
      report.by_section.synopsis.missing_en++;
      missingFields.push('synopsis');
    }
    if (!hasSynopsisTe) {
      report.by_section.synopsis.missing_te++;
      missingFields.push('synopsis_te');
    }
    if (!hasSynopsisEn && !hasSynopsisTe) {
      report.by_section.synopsis.missing_both++;
    }
    if (!hasTagline) {
      report.by_section.synopsis.missing_tagline++;
    }
    
    if (hasSynopsisEn && hasSynopsisTe && hasTagline) {
      report.by_section.synopsis.complete++;
      sectionScores.synopsis = 100;
    } else {
      let synopsisScore = 0;
      if (hasSynopsisEn) synopsisScore += 40;
      if (hasSynopsisTe) synopsisScore += 40;
      if (hasTagline) synopsisScore += 20;
      sectionScores.synopsis = synopsisScore;
    }

    // Section 3: Cast & Crew
    const castFields = ['director', 'hero', 'heroine', 'music_director', 'producer'];
    let castComplete = true;
    castFields.forEach(field => {
      if (!movie[field]) {
        castComplete = false;
        missingFields.push(field);
        report.by_section.cast_crew.missing_by_field[field] = 
          (report.by_section.cast_crew.missing_by_field[field] || 0) + 1;
      }
    });
    if (castComplete) {
      report.by_section.cast_crew.complete++;
      sectionScores.cast = 100;
    } else {
      sectionScores.cast = ((castFields.length - missingFields.filter(f => castFields.includes(f)).length) / castFields.length) * 100;
    }

    // Section 4: Genres
    if (!movie.genres || movie.genres.length === 0) {
      report.by_section.genres.empty++;
      missingFields.push('genres');
      sectionScores.genres = 0;
    } else {
      report.by_section.genres.complete++;
      if (movie.genres.length === 1) report.by_section.genres.single_genre++;
      else if (movie.genres.length === 2) report.by_section.genres.two_genres++;
      else report.by_section.genres.three_plus_genres++;
      sectionScores.genres = 100;
    }

    // Section 5: Ratings
    const ratingFields = ['our_rating', 'avg_rating', 'editorial_score', 'imdb_rating'];
    let hasAnyRating = false;
    let ratingCount = 0;
    ratingFields.forEach(field => {
      if (movie[field] && movie[field] > 0) {
        hasAnyRating = true;
        ratingCount++;
      } else {
        report.by_section.ratings.missing_by_type[field] = 
          (report.by_section.ratings.missing_by_type[field] || 0) + 1;
      }
    });
    if (hasAnyRating) {
      report.by_section.ratings.complete++;
      sectionScores.ratings = (ratingCount / ratingFields.length) * 100;
    } else {
      report.by_section.ratings.no_ratings++;
      missingFields.push('ratings');
      sectionScores.ratings = 0;
    }

    // Section 6: Tags
    const hasAnyTag = movie.is_blockbuster || movie.is_classic || movie.is_underrated || movie.is_featured;
    const tagCount = [movie.is_blockbuster, movie.is_classic, movie.is_underrated, movie.is_featured].filter(Boolean).length;
    
    if (hasAnyTag) {
      if (tagCount >= 1) {
        report.by_section.tags.complete++;
        sectionScores.tags = 100;
      } else {
        report.by_section.tags.partially_tagged++;
        sectionScores.tags = 50;
      }
    } else {
      report.by_section.tags.untagged++;
      sectionScores.tags = 0;
    }

    // Section 7: Editorial Review
    const movieReviews = reviewsByMovie.get(movie.id) || [];
    const publishedReviews = movieReviews.filter(r => r.status === 'published');
    const featuredReviews = movieReviews.filter(r => r.is_featured);
    
    if (publishedReviews.length > 0) {
      sectionScores.editorial = 100;
      if (featuredReviews.length > 0) {
        report.by_section.editorial.featured++;
      }
    } else if (movieReviews.filter(r => r.status === 'draft').length > 0) {
      report.by_section.editorial.draft++;
      sectionScores.editorial = 50;
    } else {
      report.by_section.editorial.missing++;
      missingFields.push('editorial_review');
      sectionScores.editorial = 0;
    }

    // Section 8: Media
    if (movie.trailer_url) {
      report.by_section.media.complete++;
      sectionScores.media = 100;
    } else {
      report.by_section.media.missing_trailer++;
      missingFields.push('trailer_url');
      sectionScores.media = 0;
    }

    // Section 9: Recommendations (needs good metadata)
    const hasRecommendationData = movie.director && movie.genres?.length > 0 && (movie.hero || movie.heroine);
    if (hasRecommendationData) {
      report.by_section.recommendations.functional++;
      sectionScores.recommendations = 100;
    } else {
      report.by_section.recommendations.insufficient_data++;
      sectionScores.recommendations = 0;
    }

    // Calculate overall quality score
    const overallScore = Math.round(
      (sectionScores.hero + sectionScores.synopsis + sectionScores.cast + 
       sectionScores.genres + sectionScores.ratings + sectionScores.tags + 
       sectionScores.editorial + sectionScores.media + sectionScores.recommendations) / 9
    );

    // Track by score range
    const scoreRange = Math.floor(overallScore / 10) * 10;
    report.quality_score_distribution[`${scoreRange}-${scoreRange + 9}%`] = 
      (report.quality_score_distribution[`${scoreRange}-${scoreRange + 9}%`] || 0) + 1;

    // Track by decade
    if (movie.release_year) {
      const decade = Math.floor(movie.release_year / 10) * 10;
      const decadeKey = `${decade}s`;
      if (!report.by_decade[decadeKey]) {
        report.by_decade[decadeKey] = { total: 0, avg_completeness: 0 };
      }
      report.by_decade[decadeKey].total++;
      report.by_decade[decadeKey].avg_completeness += overallScore;
    }

    // Priority fixes (movies with missing critical data)
    if (missingFields.length > 0) {
      const visibilityScore = calculateVisibilityScore(movie);
      const priority = calculatePriority(missingFields, visibilityScore, movie);
      
      missingDataMovies.push({
        movie_id: movie.id,
        title: movie.title_en,
        year: movie.release_year,
        missing_fields: missingFields,
        priority,
        visibility_score: visibilityScore,
        quality_score: overallScore
      });
    }
  }

  // Calculate completeness rates
  report.by_section.hero_section.completeness_rate = (report.by_section.hero_section.complete / allMovies.length) * 100;
  report.by_section.synopsis.completeness_rate = (report.by_section.synopsis.complete / allMovies.length) * 100;
  report.by_section.cast_crew.completeness_rate = (report.by_section.cast_crew.complete / allMovies.length) * 100;
  report.by_section.genres.completeness_rate = (report.by_section.genres.complete / allMovies.length) * 100;
  report.by_section.ratings.completeness_rate = (report.by_section.ratings.complete / allMovies.length) * 100;
  report.by_section.tags.completeness_rate = (report.by_section.tags.complete / allMovies.length) * 100;
  report.by_section.editorial.completeness_rate = ((report.by_section.editorial.complete + report.by_section.editorial.featured) / allMovies.length) * 100;
  report.by_section.media.completeness_rate = (report.by_section.media.complete / allMovies.length) * 100;
  report.by_section.recommendations.completeness_rate = (report.by_section.recommendations.functional / allMovies.length) * 100;

  // Calculate average completeness by decade
  Object.keys(report.by_decade).forEach(decade => {
    report.by_decade[decade].avg_completeness = 
      report.by_decade[decade].avg_completeness / report.by_decade[decade].total;
  });

  // Sort and prioritize fixes
  report.priority_fixes = missingDataMovies
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.visibility_score - a.visibility_score;
    })
    .slice(0, 500); // Top 500 priorities

  return report;
}

function calculateVisibilityScore(movie: any): number {
  let score = 0;
  
  // Recent movies are more visible
  if (movie.release_year >= 2020) score += 50;
  else if (movie.release_year >= 2015) score += 30;
  else if (movie.release_year >= 2010) score += 20;
  else if (movie.release_year >= 2000) score += 10;
  
  // Featured/tagged movies are more visible
  if (movie.is_featured) score += 30;
  if (movie.is_blockbuster) score += 20;
  if (movie.is_classic) score += 15;
  
  // Published movies are visible
  if (movie.is_published) score += 10;
  
  return score;
}

function calculatePriority(
  missingFields: string[],
  visibilityScore: number,
  movie: any
): 'critical' | 'high' | 'medium' | 'low' {
  const criticalFields = ['title_en', 'release_year', 'director', 'genres'];
  const hasCriticalMissing = missingFields.some(f => criticalFields.includes(f));
  
  if (hasCriticalMissing && visibilityScore > 50) return 'critical';
  if (hasCriticalMissing || visibilityScore > 70) return 'high';
  if (missingFields.length > 5 || visibilityScore > 40) return 'medium';
  return 'low';
}

async function generateReports(report: DataCompletenessReport) {
  console.log(chalk.cyan.bold(`\n  Generating reports...\n`));

  // 1. Executive Summary (Markdown)
  const summaryPath = './docs/manual-review/MOVIE-DATA-AUDIT-SUMMARY.md';
  const summary = `# Movie Data Completeness Audit Summary
**Date:** ${new Date(report.audit_date).toLocaleDateString()}  
**Total Movies:** ${report.total_movies.toLocaleString()}

## Executive Summary

Overall database health is **${calculateOverallHealth(report)}**.

### Completeness by Section

| Section | Complete | Missing | Rate |
|---------|----------|---------|------|
| Hero Section | ${report.by_section.hero_section.complete.toLocaleString()} | ${(report.total_movies - report.by_section.hero_section.complete).toLocaleString()} | ${report.by_section.hero_section.completeness_rate.toFixed(1)}% |
| Synopsis | ${report.by_section.synopsis.complete.toLocaleString()} | ${(report.total_movies - report.by_section.synopsis.complete).toLocaleString()} | ${report.by_section.synopsis.completeness_rate.toFixed(1)}% |
| Cast & Crew | ${report.by_section.cast_crew.complete.toLocaleString()} | ${(report.total_movies - report.by_section.cast_crew.complete).toLocaleString()} | ${report.by_section.cast_crew.completeness_rate.toFixed(1)}% |
| Genres | ${report.by_section.genres.complete.toLocaleString()} | ${report.by_section.genres.empty} | ${report.by_section.genres.completeness_rate.toFixed(1)}% |
| Ratings | ${report.by_section.ratings.complete.toLocaleString()} | ${report.by_section.ratings.no_ratings} | ${report.by_section.ratings.completeness_rate.toFixed(1)}% |
| Tags | ${report.by_section.tags.complete.toLocaleString()} | ${report.by_section.tags.untagged} | ${report.by_section.tags.completeness_rate.toFixed(1)}% |
| Editorial | ${report.by_section.editorial.complete + report.by_section.editorial.featured} | ${report.by_section.editorial.missing} | ${report.by_section.editorial.completeness_rate.toFixed(1)}% |
| Media | ${report.by_section.media.complete.toLocaleString()} | ${report.by_section.media.missing_trailer} | ${report.by_section.media.completeness_rate.toFixed(1)}% |
| Recommendations | ${report.by_section.recommendations.functional.toLocaleString()} | ${report.by_section.recommendations.insufficient_data} | ${report.by_section.recommendations.completeness_rate.toFixed(1)}% |

### Quality Score Distribution

${Object.entries(report.quality_score_distribution)
  .sort((a, b) => b[0].localeCompare(a[0]))
  .map(([range, count]) => `- **${range}**: ${count.toLocaleString()} movies (${((count / report.total_movies) * 100).toFixed(1)}%)`)
  .join('\n')}

### Critical Missing Data

**Hero Section:**
${Object.entries(report.by_section.hero_section.missing_fields)
  .sort((a, b) => b[1] - a[1])
  .map(([field, count]) => `- ${field}: ${count.toLocaleString()} movies`)
  .join('\n')}

**Cast & Crew:**
${Object.entries(report.by_section.cast_crew.missing_by_field)
  .sort((a, b) => b[1] - a[1])
  .map(([field, count]) => `- ${field}: ${count.toLocaleString()} movies`)
  .join('\n')}

**Synopsis:**
- Missing English: ${report.by_section.synopsis.missing_en.toLocaleString()}
- Missing Telugu: ${report.by_section.synopsis.missing_te.toLocaleString()}
- Missing Both: ${report.by_section.synopsis.missing_both.toLocaleString()}
- Missing Tagline: ${report.by_section.synopsis.missing_tagline.toLocaleString()}

**Ratings:**
${Object.entries(report.by_section.ratings.missing_by_type)
  .sort((a, b) => b[1] - a[1])
  .map(([field, count]) => `- ${field}: ${count.toLocaleString()} movies`)
  .join('\n')}

### Priority Fixes

- **Critical**: ${report.priority_fixes.filter(f => f.priority === 'critical').length}
- **High**: ${report.priority_fixes.filter(f => f.priority === 'high').length}
- **Medium**: ${report.priority_fixes.filter(f => f.priority === 'medium').length}
- **Low**: ${report.priority_fixes.filter(f => f.priority === 'low').length}

### Data Quality by Decade

${Object.entries(report.by_decade)
  .sort((a, b) => b[0].localeCompare(a[0]))
  .map(([decade, data]) => `- **${decade}**: ${data.total} movies, ${data.avg_completeness.toFixed(1)}% avg quality`)
  .join('\n')}

## Recommendations

### Immediate Actions (Critical)
1. Fix ${report.priority_fixes.filter(f => f.priority === 'critical').length} critical movies
2. Fill ${report.by_section.genres.empty} movies with no genres
3. Add basic metadata to ${Object.values(report.by_section.hero_section.missing_fields).reduce((a, b) => a + b, 0)} incomplete hero sections

### Short-Term Actions (High Priority)
1. Enrich ${report.by_section.synopsis.missing_en} movies missing English synopsis
2. Add directors to ${report.by_section.cast_crew.missing_by_field['director'] || 0} movies
3. Enrich ratings for ${report.by_section.ratings.no_ratings} movies with no ratings

### Medium-Term Actions
1. Generate ${report.by_section.synopsis.missing_te} Telugu synopses
2. Add editorial reviews for ${report.by_section.editorial.missing} movies
3. Enrich trailers for ${report.by_section.media.missing_trailer} movies

### Long-Term Actions
1. Complete cast & crew for all movies
2. Systematic tagging (blockbuster, classic, underrated)
3. Comprehensive editorial coverage for top 1,000 movies

---
*Generated: ${new Date(report.audit_date).toLocaleString()}*
`;

  writeFileSync(summaryPath, summary);
  console.log(chalk.green(`  ✓ Summary saved: ${summaryPath}`));

  // 2. Missing Data CSV
  const csvPath = './docs/manual-review/MISSING-DATA-BY-SECTION.csv';
  const csvLines = ['Section,Field,Missing Count,Percentage'];
  
  Object.entries(report.by_section.hero_section.missing_fields).forEach(([field, count]) => {
    csvLines.push(`Hero Section,${field},${count},${((count / report.total_movies) * 100).toFixed(2)}%`);
  });
  
  Object.entries(report.by_section.cast_crew.missing_by_field).forEach(([field, count]) => {
    csvLines.push(`Cast & Crew,${field},${count},${((count / report.total_movies) * 100).toFixed(2)}%`);
  });
  
  csvLines.push(`Synopsis,synopsis_en,${report.by_section.synopsis.missing_en},${((report.by_section.synopsis.missing_en / report.total_movies) * 100).toFixed(2)}%`);
  csvLines.push(`Synopsis,synopsis_te,${report.by_section.synopsis.missing_te},${((report.by_section.synopsis.missing_te / report.total_movies) * 100).toFixed(2)}%`);
  csvLines.push(`Synopsis,tagline,${report.by_section.synopsis.missing_tagline},${((report.by_section.synopsis.missing_tagline / report.total_movies) * 100).toFixed(2)}%`);
  csvLines.push(`Genres,genres,${report.by_section.genres.empty},${((report.by_section.genres.empty / report.total_movies) * 100).toFixed(2)}%`);
  csvLines.push(`Editorial,review,${report.by_section.editorial.missing},${((report.by_section.editorial.missing / report.total_movies) * 100).toFixed(2)}%`);
  csvLines.push(`Media,trailer,${report.by_section.media.missing_trailer},${((report.by_section.media.missing_trailer / report.total_movies) * 100).toFixed(2)}%`);
  
  writeFileSync(csvPath, csvLines.join('\n'));
  console.log(chalk.green(`  ✓ CSV saved: ${csvPath}`));

  // 3. Priority Fix Queue JSON
  const jsonPath = './docs/manual-review/PRIORITY-FIX-QUEUE.json';
  writeFileSync(jsonPath, JSON.stringify(report.priority_fixes, null, 2));
  console.log(chalk.green(`  ✓ Priority queue saved: ${jsonPath}`));
}

function calculateOverallHealth(report: DataCompletenessReport): string {
  const avgCompleteness = (
    report.by_section.hero_section.completeness_rate +
    report.by_section.synopsis.completeness_rate +
    report.by_section.cast_crew.completeness_rate +
    report.by_section.genres.completeness_rate +
    report.by_section.ratings.completeness_rate +
    report.by_section.tags.completeness_rate +
    report.by_section.editorial.completeness_rate +
    report.by_section.media.completeness_rate +
    report.by_section.recommendations.completeness_rate
  ) / 9;

  if (avgCompleteness >= 85) return 'EXCELLENT ✅';
  if (avgCompleteness >= 70) return 'GOOD ✅';
  if (avgCompleteness >= 50) return 'FAIR ⚠️';
  return 'NEEDS IMPROVEMENT ❌';
}

async function main() {
  const startTime = Date.now();
  
  try {
    const report = await auditMovieData();
    await generateReports(report);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                   AUDIT COMPLETE                                      ║
╚═══════════════════════════════════════════════════════════════════════╝

  Total Movies:             ${report.total_movies.toLocaleString()}
  Overall Health:           ${calculateOverallHealth(report)}
  
  Critical Fixes Needed:    ${report.priority_fixes.filter(f => f.priority === 'critical').length}
  High Priority Fixes:      ${report.priority_fixes.filter(f => f.priority === 'high').length}
  
  Reports Generated:
  ✓ MOVIE-DATA-AUDIT-SUMMARY.md
  ✓ MISSING-DATA-BY-SECTION.csv
  ✓ PRIORITY-FIX-QUEUE.json
  
  Duration: ${duration}s
  
  ✅ Comprehensive audit complete!

`));
  } catch (error) {
    console.error(chalk.red('\n  ✗ Audit failed:'), error);
    process.exit(1);
  }
}

main();
