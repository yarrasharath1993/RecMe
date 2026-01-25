'use client';

/**
 * PersonalTab Component
 * 
 * Personal life and fan culture tab for entity profiles.
 * Contains: Family Dynasty, Romantic Pairings, Entrepreneurial Ventures, Trivia, Viral Moments
 */

import { useState } from 'react';
import Link from 'next/link';
import { 
  Heart, Users, Building2, Sparkles, MessageCircle,
  ChevronRight, ChevronDown, ChevronUp, Briefcase,
  GraduationCap, Zap, ExternalLink
} from 'lucide-react';

// Types
interface FamilyMember {
  name: string;
  slug?: string;
  relation: string;
}

interface Pairing {
  name: string;
  slug?: string;
  count: number;
  highlight?: string;
  films?: string[];
}

interface Dynasty {
  family_relationships: Record<string, FamilyMember[]>;
  romantic_pairings?: Pairing[];
}

interface FanCulture {
  cultural_titles?: string[];
  trivia?: string[];
  viral_moments?: string[];
  pairings?: Pairing[];
  entrepreneurial?: string[];
  tech_edge?: string;
}

interface PersonalTabProps {
  dynasty: Dynasty;
  fanCulture: FanCulture;
  className?: string;
}

// Glassmorphic Section Card
function SectionCard({ 
  children, 
  className = '',
  gradient = 'default'
}: { 
  children: React.ReactNode; 
  className?: string;
  gradient?: 'default' | 'pink' | 'blue' | 'green' | 'purple';
}) {
  const bgGradients = {
    default: 'rgba(255,255,255,0.08), rgba(255,255,255,0.02)',
    pink: 'rgba(236, 72, 153, 0.12), rgba(236, 72, 153, 0.04)',
    blue: 'rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.04)',
    green: 'rgba(34, 197, 94, 0.12), rgba(34, 197, 94, 0.04)',
    purple: 'rgba(139, 92, 246, 0.12), rgba(139, 92, 246, 0.04)',
  };

  return (
    <div 
      className={`p-5 rounded-2xl backdrop-blur-sm ${className}`}
      style={{
        background: `linear-gradient(135deg, ${bgGradients[gradient].split(', ')[0]} 0%, ${bgGradients[gradient].split(', ')[1]} 100%)`,
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {children}
    </div>
  );
}

// Family Dynasty Section
function FamilyDynastySection({ familyRelationships }: { familyRelationships: Record<string, FamilyMember[]> }) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Filter to only include entries where value is an array with items
  const relationGroups = Object.entries(familyRelationships || {})
    .filter(([_, members]) => Array.isArray(members) && members.length > 0);

  if (!relationGroups.length) return null;

  const relationIcons: Record<string, string> = {
    'Spouse': '💍',
    'Children': '👨‍👧‍👦',
    'Parents': '👨‍👩‍👧',
    'Siblings': '👫',
    'Extended Family': '👪',
    'In-laws': '🤝',
    'default': '👤',
  };

  return (
    <SectionCard gradient="pink">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-pink-400" />
        Family Dynasty
      </h3>

      <div className="space-y-2">
        {relationGroups.map(([group, members]) => (
          <div 
            key={group}
            className="rounded-xl overflow-hidden"
            style={{
              background: expandedGroup === group 
                ? 'rgba(236, 72, 153, 0.1)' 
                : 'rgba(255,255,255,0.03)',
            }}
          >
            <button
              onClick={() => setExpandedGroup(expandedGroup === group ? null : group)}
              className="w-full p-3 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{relationIcons[group] || relationIcons.default}</span>
                <div>
                  <h4 className="font-medium text-white">{group}</h4>
                  <p className="text-xs text-white/50">{members?.length || 0} member{(members?.length || 0) > 1 ? 's' : ''}</p>
                </div>
              </div>
              {expandedGroup === group ? (
                <ChevronUp className="w-4 h-4 text-white/50" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/50" />
              )}
            </button>

            {expandedGroup === group && Array.isArray(members) && (
              <div className="px-3 pb-3 space-y-2">
                {members.map((member, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div>
                      <span className="text-sm font-medium text-white">{member.name}</span>
                      <span className="text-xs text-white/50 ml-2">({member.relation})</span>
                    </div>
                    {member.slug && (
                      <Link 
                        href={`/movies?profile=${member.slug}`}
                        className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// Romantic Pairings Section
function RomanticPairingsSection({ pairings }: { pairings: Pairing[] }) {
  if (!pairings?.length) return null;

  return (
    <SectionCard gradient="pink">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Heart className="w-5 h-5 text-pink-400" />
        Iconic On-Screen Pairs
      </h3>

      <div className="space-y-3">
        {pairings.slice(0, 5).map((pair, index) => (
          <div 
            key={pair.name}
            className="p-3 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.02) 100%)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {pair.slug ? (
                  <Link 
                    href={`/movies?profile=${pair.slug}`}
                    className="font-medium text-white hover:text-pink-400 transition-colors"
                  >
                    {pair.name}
                  </Link>
                ) : (
                  <span className="font-medium text-white">{pair.name}</span>
                )}
              </div>
              <span className="text-sm text-pink-400">{pair.count} films</span>
            </div>
            
            {pair.highlight && (
              <p className="text-sm text-white/60">{pair.highlight}</p>
            )}

            {pair.films && pair.films.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {pair.films.slice(0, 3).map((film, i) => (
                  <span 
                    key={i}
                    className="px-2 py-0.5 rounded text-xs bg-white/10 text-white/70"
                  >
                    {film}
                  </span>
                ))}
                {pair.films.length > 3 && (
                  <span className="text-xs text-white/50">+{pair.films.length - 3} more</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// Entrepreneurial Ventures Section
function EntrepreneurialSection({ ventures }: { ventures: string[] }) {
  if (!ventures?.length) return null;

  return (
    <SectionCard gradient="green">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-green-400" />
        Entrepreneurial Ventures
      </h3>

      <div className="space-y-2">
        {ventures.map((venture, index) => (
          <div 
            key={index}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.02) 100%)',
            }}
          >
            <div className="p-2 rounded-lg bg-green-500/20">
              <Briefcase className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-sm text-white/80">{venture}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// Tech Edge / Unique Background Section
function TechEdgeSection({ techEdge }: { techEdge: string }) {
  if (!techEdge) return null;

  return (
    <SectionCard gradient="blue">
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-blue-400" />
        Unique Background
      </h3>

      <div 
        className="p-4 rounded-xl flex items-start gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
        }}
      >
        <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-white/80 leading-relaxed">{techEdge}</p>
      </div>
    </SectionCard>
  );
}

// Trivia & Fun Facts Section
function TriviaSection({ trivia, viralMoments }: { trivia?: string[]; viralMoments?: string[] }) {
  const [showAll, setShowAll] = useState(false);

  const allFacts = [...(trivia || []), ...(viralMoments || [])];
  if (!allFacts.length) return null;

  const displayFacts = showAll ? allFacts : allFacts.slice(0, 5);

  return (
    <SectionCard gradient="purple">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-400" />
        Fun Facts & Trivia
      </h3>

      <div className="space-y-2">
        {displayFacts.map((fact, index) => (
          <div 
            key={index}
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.02) 100%)',
            }}
          >
            <span className="text-purple-400">💡</span>
            <p className="text-sm text-white/80 leading-relaxed">{fact}</p>
          </div>
        ))}
      </div>

      {allFacts.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 w-full py-2 rounded-lg text-sm font-medium text-purple-400 hover:bg-purple-500/10 transition-colors"
        >
          {showAll ? 'Show Less' : `Show All ${allFacts.length} Facts`}
        </button>
      )}
    </SectionCard>
  );
}

// Cultural Titles Section
function CulturalTitlesSection({ titles }: { titles: string[] }) {
  if (!titles?.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {titles.map((title, index) => (
        <span
          key={index}
          className="px-4 py-2 rounded-full text-sm font-medium"
          style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(249, 115, 22, 0.08) 100%)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            color: 'rgb(251, 146, 60)',
          }}
        >
          {title}
        </span>
      ))}
    </div>
  );
}

export function PersonalTab({
  dynasty,
  fanCulture,
  className = '',
}: PersonalTabProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cultural Titles */}
      {fanCulture.cultural_titles && fanCulture.cultural_titles.length > 0 && (
        <CulturalTitlesSection titles={fanCulture.cultural_titles} />
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Family Dynasty */}
        <FamilyDynastySection familyRelationships={dynasty.family_relationships || {}} />

        {/* Romantic Pairings */}
        <RomanticPairingsSection pairings={dynasty.romantic_pairings || fanCulture.pairings || []} />
      </div>

      {/* Entrepreneurial Ventures */}
      {fanCulture.entrepreneurial && fanCulture.entrepreneurial.length > 0 && (
        <EntrepreneurialSection ventures={fanCulture.entrepreneurial} />
      )}

      {/* Tech Edge / Unique Background */}
      {fanCulture.tech_edge && (
        <TechEdgeSection techEdge={fanCulture.tech_edge} />
      )}

      {/* Trivia & Fun Facts */}
      <TriviaSection 
        trivia={fanCulture.trivia} 
        viralMoments={fanCulture.viral_moments} 
      />
    </div>
  );
}

export default PersonalTab;
