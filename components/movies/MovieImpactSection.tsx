/**
 * Movie Impact Section Component
 * 
 * Displays comprehensive impact analysis for significant movies:
 * - "Why This Movie Matters" - Cultural significance and achievements
 * - "Career Impact" - How it affected actors/directors' careers
 * - "What If This Didn't Exist?" - Counterfactual analysis
 * 
 * Feature-flagged for gradual rollout
 */

'use client';

import { useState } from 'react';
import type { MovieImpactAnalysis } from '@/lib/movies/impact-analyzer';
import { generateImpactSummary, generateCounterfactuals } from '@/lib/movies/impact-analyzer';

interface MovieImpactSectionProps {
  impact: MovieImpactAnalysis;
  movieTitle: string;
  releaseYear: number;
}

export function MovieImpactSection({ impact, movieTitle, releaseYear }: MovieImpactSectionProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  const impactSummary = generateImpactSummary(impact);
  const counterfactuals = generateCounterfactuals(impact);
  
  // Don't render if not significant enough
  if (impact.significance_tier === 'standard' && impact.confidence_score < 0.50) {
    return null;
  }
  
  return (
    <div className="movie-impact-section bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Movie Impact Analysis
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {impactSummary}
          </p>
        </div>
        <SignificanceBadge tier={impact.significance_tier} />
      </div>
      
      {/* Subsections */}
      <div className="space-y-4">
        {/* Why This Movie Matters */}
        <WhyItMattersSection
          impact={impact}
          movieTitle={movieTitle}
          isExpanded={expandedSection === 'matters'}
          onToggle={() => toggleSection('matters')}
        />
        
        {/* Career Impact */}
        {(impact.career_impact.actors_launched.length > 0 || 
          impact.career_impact.directors_established.length > 0 ||
          impact.career_impact.career_pivots.length > 0) && (
          <CareerImpactSection
            impact={impact}
            isExpanded={expandedSection === 'career'}
            onToggle={() => toggleSection('career')}
          />
        )}
        
        {/* Industry Influence */}
        {(impact.industry_influence.inspired_movies.length > 0 ||
          Math.abs(impact.industry_influence.genre_shift.percentage_change) >= 20) && (
          <IndustryInfluenceSection
            impact={impact}
            isExpanded={expandedSection === 'industry'}
            onToggle={() => toggleSection('industry')}
          />
        )}
        
        {/* What If This Didn't Exist */}
        {counterfactuals.length > 0 && (
          <CounterfactualSection
            counterfactuals={counterfactuals}
            movieTitle={movieTitle}
            isExpanded={expandedSection === 'counterfactual'}
            onToggle={() => toggleSection('counterfactual')}
          />
        )}
      </div>
      
      {/* Confidence Indicator */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        <span>Analysis Confidence: {Math.round(impact.confidence_score * 100)}%</span>
        <span>Calculated: {new Date(impact.calculated_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function SignificanceBadge({ tier }: { tier: string }) {
  const colors = {
    landmark: 'bg-purple-600 text-white',
    influential: 'bg-indigo-600 text-white',
    notable: 'bg-blue-600 text-white',
    standard: 'bg-gray-600 text-white',
  };
  
  const labels = {
    landmark: '⭐ Landmark Film',
    influential: '🎬 Influential',
    notable: '📽️ Notable',
    standard: '🎥 Standard',
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[tier as keyof typeof colors]}`}>
      {labels[tier as keyof typeof labels]}
    </span>
  );
}

function WhyItMattersSection({ 
  impact, 
  movieTitle, 
  isExpanded, 
  onToggle 
}: { 
  impact: MovieImpactAnalysis; 
  movieTitle: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasContent = 
    impact.career_impact.actors_launched.length > 0 ||
    impact.industry_influence.copycat_count > 0 ||
    impact.influence_graph.franchise_spawned ||
    impact.influence_graph.cultural_moments.length > 0;
  
  if (!hasContent) return null;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">✨</span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Why This Movie Matters
          </h3>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
          {impact.career_impact.actors_launched.map((actor, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">▸</span>
              <p className="text-gray-700 dark:text-gray-300">
                {actor.debut_film ? (
                  <>
                    <strong>{actor.name}</strong>'s debut film - launched their {actor.career_trajectory} career
                  </>
                ) : actor.breakthrough_detected ? (
                  <>
                    <strong>{actor.name}</strong>'s breakthrough role - established them as a major star
                  </>
                ) : null}
              </p>
            </div>
          ))}
          
          {impact.industry_influence.copycat_count >= 3 && (
            <div className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">▸</span>
              <p className="text-gray-700 dark:text-gray-300">
                Inspired <strong>{impact.industry_influence.copycat_count} similar films</strong> in subsequent years
              </p>
            </div>
          )}
          
          {impact.influence_graph.franchise_spawned && (
            <div className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 mt-0.5">▸</span>
              <p className="text-gray-700 dark:text-gray-300">
                Spawned a successful franchise with <strong>{impact.influence_graph.sequels?.length || 0} sequels</strong>
              </p>
            </div>
          )}
          
          {impact.influence_graph.cultural_moments.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-orange-600 dark:text-orange-400 mt-0.5">▸</span>
              <p className="text-gray-700 dark:text-gray-300">
                Created <strong>{impact.influence_graph.cultural_moments.length} lasting cultural moments</strong> (iconic dialogues, songs, or scenes)
              </p>
            </div>
          )}
          
          {Math.abs(impact.industry_influence.genre_shift.percentage_change) >= 25 && (
            <div className="flex items-start gap-2">
              <span className="text-red-600 dark:text-red-400 mt-0.5">▸</span>
              <p className="text-gray-700 dark:text-gray-300">
                {impact.industry_influence.genre_shift.primary_genre} movies {impact.industry_influence.genre_shift.percentage_change > 0 ? 'increased' : 'decreased'} by{' '}
                <strong>{Math.abs(impact.industry_influence.genre_shift.percentage_change)}%</strong> after this release
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CareerImpactSection({ 
  impact, 
  isExpanded, 
  onToggle 
}: { 
  impact: MovieImpactAnalysis;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚀</span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Career Impact
          </h3>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
          {impact.career_impact.actors_launched.map((actor, idx) => (
            <div key={idx} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">{actor.name}</h4>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  <span className="font-semibold">Role:</span>{' '}
                  {actor.debut_film ? 'Debut Film' : actor.first_major_role ? 'First Major Role' : 'Breakthrough Role'}
                </p>
                <p>
                  <span className="font-semibold">Career Trajectory:</span>{' '}
                  {actor.career_trajectory === 'superstar' ? '⭐ Superstar' : 
                   actor.career_trajectory === 'star' ? '🌟 Star' :
                   actor.career_trajectory === 'character_actor' ? '🎭 Character Actor' :
                   actor.career_trajectory === 'one_hit' ? '💫 One Hit Wonder' : '📈 Steady Career'}
                </p>
                {actor.before_rating && actor.after_rating && (
                  <p>
                    <span className="font-semibold">Rating Change:</span>{' '}
                    {actor.before_rating.toFixed(1)} → {actor.after_rating.toFixed(1)}{' '}
                    <span className="text-green-600 dark:text-green-400">
                      (+{(actor.after_rating - actor.before_rating).toFixed(1)})
                    </span>
                  </p>
                )}
                <p>
                  <span className="font-semibold">Filmography:</span>{' '}
                  {actor.films_before} films before, {actor.films_after} films after
                </p>
              </div>
            </div>
          ))}
          
          {impact.career_impact.directors_established.map((director, idx) => (
            <div key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">{director.name}</h4>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  <span className="font-semibold">Milestone:</span>{' '}
                  {director.breakthrough ? '🎬 Breakthrough Film' : director.career_pivot ? '🔄 Career Pivot' : '📽️ Notable Work'}
                </p>
                {director.avg_rating_before && director.avg_rating_after && (
                  <p>
                    <span className="font-semibold">Avg Rating:</span>{' '}
                    {director.avg_rating_before.toFixed(1)} → {director.avg_rating_after.toFixed(1)}
                  </p>
                )}
                <p>
                  <span className="font-semibold">Filmography:</span>{' '}
                  {director.films_before} films before, {director.films_after} films after
                </p>
              </div>
            </div>
          ))}
          
          {impact.career_impact.career_pivots.map((pivot, idx) => (
            <div key={idx} className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                {pivot.name} - {pivot.transformation_type === 'comeback' ? '🔥 Comeback' :
                             pivot.transformation_type === 'peak' ? '⛰️ Career Peak' :
                             pivot.transformation_type === 'genre_switch' ? '🔀 Genre Switch' : '✨ Reinvention'}
              </h4>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  <span className="font-semibold">Rating Transformation:</span>{' '}
                  {pivot.before_rating.toFixed(1)} → {pivot.after_rating.toFixed(1)}{' '}
                  <span className={pivot.after_rating > pivot.before_rating ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    ({pivot.after_rating > pivot.before_rating ? '+' : ''}{(pivot.after_rating - pivot.before_rating).toFixed(1)})
                  </span>
                </p>
                {pivot.before_hit_rate !== undefined && pivot.after_hit_rate !== undefined && (
                  <p>
                    <span className="font-semibold">Hit Rate:</span>{' '}
                    {pivot.before_hit_rate.toFixed(0)}% → {pivot.after_hit_rate.toFixed(0)}%
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IndustryInfluenceSection({ 
  impact, 
  isExpanded, 
  onToggle 
}: { 
  impact: MovieImpactAnalysis;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Industry Influence
          </h3>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
          {/* Genre Shift */}
          {Math.abs(impact.industry_influence.genre_shift.percentage_change) >= 20 && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-lg">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                Genre Trend Impact
              </h4>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  <span className="font-semibold">{impact.industry_influence.genre_shift.primary_genre}</span> movies{' '}
                  <span className={impact.industry_influence.genre_shift.percentage_change > 0 ? 'text-green-600 dark:text-green-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'}>
                    {impact.industry_influence.genre_shift.percentage_change > 0 ? 'increased' : 'decreased'} by{' '}
                    {Math.abs(impact.industry_influence.genre_shift.percentage_change)}%
                  </span>{' '}
                  in the {impact.industry_influence.genre_shift.years_analyzed / 2} years following this release
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {impact.industry_influence.genre_shift.before_count}
                    </div>
                    <div className="text-xs text-gray-500">Before</div>
                  </div>
                  <div className="text-2xl text-gray-400">→</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {impact.industry_influence.genre_shift.after_count}
                    </div>
                    <div className="text-xs text-gray-500">After</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Inspired Movies */}
          {impact.industry_influence.inspired_movies.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                Movies Inspired By This Film ({impact.industry_influence.inspired_movies.length})
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {impact.industry_influence.inspired_movies.slice(0, 5).map((movie, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-750 rounded"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{movie.title}</p>
                      <p className="text-xs text-gray-500">
                        {movie.release_year} • {movie.is_copycat ? '🔄 Copycat' : '💡 Inspired'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {Math.round(movie.similarity_score * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">Similarity</div>
                    </div>
                  </div>
                ))}
              </div>
              {impact.industry_influence.inspired_movies.length > 5 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  +{impact.industry_influence.inspired_movies.length - 5} more movies
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CounterfactualSection({ 
  counterfactuals, 
  movieTitle, 
  isExpanded, 
  onToggle 
}: { 
  counterfactuals: string[];
  movieTitle: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-purple-200 dark:border-purple-800">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤔</span>
          <h3 className="text-lg font-bold text-purple-900 dark:text-purple-200">
            What If This Movie Didn't Exist?
          </h3>
        </div>
        <svg 
          className={`w-5 h-5 text-purple-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="px-5 py-4 border-t border-purple-100 dark:border-purple-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Imagining Telugu cinema without <strong>{movieTitle}</strong>:
          </p>
          <div className="space-y-3">
            {counterfactuals.map((statement, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg"
              >
                <span className="text-purple-600 dark:text-purple-400 text-xl mt-0.5">→</span>
                <p className="text-gray-700 dark:text-gray-300">{statement}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
