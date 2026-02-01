/**
 * FILMOGRAPHY ANALYZER
 * 
 * Pure, read-only analyzer for filmography discovery reports.
 * Analyzes missing movies and wrong attributions, produces recommendations.
 * 
 * NO SIDE EFFECTS - Pure function: JSON in → JSON out
 */

import type { 
  FilmographyDiscoveryReport, 
  FilmographyAnalysis,
  MissingMovieRecommendation,
  WrongAttributionRecommendation
} from './types';
import { findMissingFilms, detectWrongAttributions } from '../../scripts/lib/film-discovery-engine';

// Helper function to normalize title (copied from film-discovery-engine to keep analyzer pure)
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[:.''!?-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Analyze filmography discovery report
 * Pure function - no side effects
 */
export async function analyzeFilmography(input: FilmographyDiscoveryReport): Promise<FilmographyAnalysis> {
  const actor = input.actor;
  const discoveredFilms = input.discoveredFilms;
  const existingMovies = input.existingMovies;
  
  // Find missing films (async function)
  const missingFilms = await findMissingFilms(discoveredFilms, existingMovies);
  
  // Detect wrong attributions (sync function)
  const wrongAttributions = detectWrongAttributions(discoveredFilms, existingMovies, actor);
  
  // Generate missing movie recommendations
  const missingMovieRecommendations = missingFilms.map(film => ({
    film_id: `${normalizeTitle(film.title_en)}-${film.release_year}`,
    title_en: film.title_en,
    release_year: film.release_year,
    role: film.role,
    crewRoles: film.crewRoles,
    language: film.language,
    confidence: film.confidence,
    sources: film.sources,
    reason: film.reason,
    recommended_action: determineActionForMissing(film),
    priority: determinePriorityForMissing(film),
    explanation: generateMissingExplanation(film),
  }));
  
  // Generate wrong attribution recommendations
  const wrongAttributionRecommendations = wrongAttributions.map(attr => ({
    movie_id: attr.movie.id,
    title_en: attr.movie.title_en || 'Unknown',
    release_year: attr.movie.release_year || 0,
    issue: attr.issue,
    currentRole: attr.currentRole,
    correctRole: attr.correctRole,
    currentField: attr.currentField,
    correctField: attr.correctField,
    confidence: attr.confidence,
    recommended_action: determineActionForWrongAttr(attr),
    priority: determinePriorityForWrongAttr(attr),
    explanation: generateWrongAttrExplanation(attr),
    fix_steps: generateFixSteps(attr),
  }));
  
  // Calculate statistics
  const roleBreakdown: Record<string, number> = {};
  const languageBreakdown: Record<string, number> = {};
  const sourceBreakdown: Record<string, number> = {};
  
  for (const film of discoveredFilms) {
    // Role breakdown
    const roleKey = film.role || 'unknown';
    roleBreakdown[roleKey] = (roleBreakdown[roleKey] || 0) + 1;
    
    // Crew roles
    if (film.crewRoles) {
      for (const crewRole of film.crewRoles) {
        roleBreakdown[crewRole] = (roleBreakdown[crewRole] || 0) + 1;
      }
    }
    
    // Language breakdown
    const lang = film.language || 'Unknown';
    languageBreakdown[lang] = (languageBreakdown[lang] || 0) + 1;
    
    // Source breakdown
    for (const source of film.sources) {
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
    }
  }
  
  // Filter recommendations by priority
  const highPriorityMissing = missingMovieRecommendations.filter(m => m.priority === 'high');
  const highPriorityWrongAttr = wrongAttributionRecommendations.filter(w => w.priority === 'high');
  
  // Generate summary
  const summary = generateSummary(
    discoveredFilms.length,
    existingMovies.length,
    missingFilms.length,
    wrongAttributions.length,
    highPriorityMissing.length,
    highPriorityWrongAttr.length
  );
  
  return {
    actor,
    timestamp: new Date().toISOString(),
    missingMovies: missingMovieRecommendations,
    wrongAttributions: wrongAttributionRecommendations,
    statistics: {
      totalDiscovered: discoveredFilms.length,
      totalInDatabase: existingMovies.length,
      missingCount: missingFilms.length,
      wrongAttributionCount: wrongAttributions.length,
      roleBreakdown,
      languageBreakdown,
      sourceBreakdown,
    },
    recommendations: {
      addMovies: highPriorityMissing,
      fixAttributions: highPriorityWrongAttr,
    },
    summary,
  };
}

// Helper functions (all pure)

function determineActionForMissing(film: any): 'add' | 'review' | 'investigate' {
  // High confidence with multiple sources → add
  if (film.confidence >= 0.8 && film.sources.length >= 2) {
    return 'add';
  }
  
  // Low confidence or single source → review
  if (film.confidence < 0.7 || film.sources.length === 1) {
    return 'review';
  }
  
  // Medium confidence → investigate
  return 'investigate';
}

function determinePriorityForMissing(film: any): 'high' | 'medium' | 'low' {
  // High confidence with multiple sources → high priority
  if (film.confidence >= 0.85 && film.sources.length >= 2) {
    return 'high';
  }
  
  // Low confidence → low priority
  if (film.confidence < 0.6) {
    return 'low';
  }
  
  return 'medium';
}

function generateMissingExplanation(film: any): string {
  const sources = film.sources.join(', ');
  const confidence = Math.round(film.confidence * 100);
  const role = film.crewRoles && film.crewRoles.length > 0 
    ? `${film.role} + ${film.crewRoles.join(', ')}`
    : film.role;
  
  return `${film.title_en} (${film.release_year}) is missing from database. Role: ${role}, Language: ${film.language}. Found in: ${sources}. Confidence: ${confidence}%.`;
}

function determineActionForWrongAttr(attr: any): 'fix' | 'remove' | 'review' | 'investigate' {
  if (attr.issue === 'not_in_sources') {
    return 'investigate'; // Need to verify if attribution is correct
  }
  
  if (attr.confidence >= 0.8) {
    return 'fix'; // High confidence → fix
  }
  
  if (attr.confidence < 0.6) {
    return 'review'; // Low confidence → manual review
  }
  
  return 'investigate';
}

function determinePriorityForWrongAttr(attr: any): 'high' | 'medium' | 'low' {
  if (attr.issue === 'wrong_role' && attr.confidence >= 0.8) {
    return 'high'; // Wrong role with high confidence is high priority
  }
  
  if (attr.issue === 'not_in_sources') {
    return 'medium'; // Need investigation
  }
  
  if (attr.confidence < 0.6) {
    return 'low';
  }
  
  return 'medium';
}

function generateWrongAttrExplanation(attr: any): string {
  const title = attr.movie.title_en || 'Unknown';
  const year = attr.movie.release_year || 'Unknown';
  
  switch (attr.issue) {
    case 'not_in_sources':
      return `${title} (${year}) is in database but not found in any discovery sources. This might indicate incorrect attribution.`;
    case 'wrong_role':
      return `${title} (${year}) has wrong role attribution. Current: ${attr.currentRole || 'unknown'} in ${attr.currentField || 'unknown'}, should be: ${attr.correctRole || 'unknown'} in ${attr.correctField || 'unknown'}.`;
    case 'wrong_field':
      return `${title} (${year}) is in wrong field. Currently in: ${attr.currentField || 'unknown'}, should be in: ${attr.correctField || 'unknown'}.`;
    case 'duplicate':
      return `${title} (${year}) appears to be a duplicate entry.`;
    default:
      return `${title} (${year}) has attribution issue: ${attr.issue}.`;
  }
}

function generateFixSteps(attr: any): string[] {
  const steps: string[] = [];
  
  switch (attr.issue) {
    case 'wrong_role':
    case 'wrong_field':
      if (attr.currentField) {
        steps.push(`Remove from ${attr.currentField} field`);
      }
      if (attr.correctField) {
        steps.push(`Add to ${attr.correctField} field`);
      }
      if (attr.correctRole) {
        steps.push(`Update role to: ${attr.correctRole}`);
      }
      break;
    case 'not_in_sources':
      steps.push('Verify if attribution is correct');
      steps.push('Check if movie exists in other sources');
      steps.push('If incorrect, remove attribution');
      break;
    case 'duplicate':
      steps.push('Identify duplicate entries');
      steps.push('Merge or remove duplicate');
      break;
  }
  
  return steps;
}

function generateSummary(
  totalDiscovered: number,
  totalInDatabase: number,
  missingCount: number,
  wrongAttrCount: number,
  highPriorityMissing: number,
  highPriorityWrongAttr: number
): string {
  const coverage = totalInDatabase > 0 
    ? Math.round((totalInDatabase / totalDiscovered) * 100)
    : 0;
  
  return `Filmography analysis for ${totalDiscovered} discovered films. ${totalInDatabase} films in database (${coverage}% coverage). ${missingCount} missing films identified (${highPriorityMissing} high priority). ${wrongAttrCount} wrong attributions detected (${highPriorityWrongAttr} high priority).`;
}
