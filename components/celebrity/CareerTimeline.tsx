'use client';

/**
 * Career Timeline Component
 * Visualizes career milestones in a timeline format
 */

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { CelebrityMilestone } from '@/lib/celebrity/types';

interface CareerTimelineProps {
  milestones: CelebrityMilestone[];
  celebrityName: string;
  className?: string;
}

export function CareerTimeline({ milestones, celebrityName, className = '' }: CareerTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (milestones.length === 0) {
    return null;
  }

  const displayMilestones = isExpanded ? milestones : milestones.slice(0, 4);

  return (
    <section className={`${className}`}>
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
        <span>🎬</span>
        <span>Rise to Stardom</span>
      </h2>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700" />

        {/* Milestones */}
        <div className="space-y-6">
          {displayMilestones.map((milestone, index) => (
            <MilestoneCard 
              key={milestone.id || index} 
              milestone={milestone}
              isFirst={index === 0}
              isLast={index === displayMilestones.length - 1 && !isExpanded}
            />
          ))}
        </div>

        {/* Show more/less button */}
        {milestones.length > 4 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 ml-10 flex items-center gap-1 text-orange-400 hover:text-orange-300 text-sm transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show {milestones.length - 4} More Milestones
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
}

function MilestoneCard({ 
  milestone, 
  isFirst, 
  isLast 
}: { 
  milestone: CelebrityMilestone; 
  isFirst: boolean;
  isLast: boolean;
}) {
  const icon = getMilestoneIcon(milestone.milestone_type);
  const color = getMilestoneColor(milestone.milestone_type);
  const bgColor = getMilestoneBgColor(milestone.milestone_type);

  return (
    <div className="relative flex gap-4">
      {/* Timeline dot */}
      <div 
        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-lg ${bgColor}`}
        style={{ backgroundColor: `${color}20` }}
      >
        <span>{icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <span 
            className="text-sm font-medium px-2 py-0.5 rounded"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {milestone.year}
          </span>
          <span 
            className="text-xs uppercase tracking-wide"
            style={{ color }}
          >
            {formatMilestoneType(milestone.milestone_type)}
          </span>
        </div>

        <h3 className="text-[var(--text-primary)] font-medium mb-1">
          {milestone.title}
        </h3>
        
        {milestone.title_te && (
          <p className="text-orange-400 text-sm mb-1">
            {milestone.title_te}
          </p>
        )}

        {milestone.movie_title && (
          <p className="text-[var(--text-secondary)] text-sm">
            Film: <span className="text-[var(--text-secondary)]">{milestone.movie_title}</span>
          </p>
        )}

        {milestone.description && (
          <p className="text-[var(--text-secondary)] text-sm mt-2">
            {milestone.description}
          </p>
        )}

        {/* Impact indicator */}
        {milestone.impact_score && milestone.impact_score > 0.7 && (
          <div className="mt-2 flex items-center gap-1">
            <div className="flex gap-0.5">
              {[...Array(Math.round(milestone.impact_score * 5))].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1.5 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">High Impact</span>
          </div>
        )}
      </div>
    </div>
  );
}

function getMilestoneIcon(type: string): string {
  const icons: Record<string, string> = {
    debut: '🎬',
    breakthrough: '🚀',
    peak: '⭐',
    comeback: '🔥',
    downfall: '📉',
    retirement: '🎭',
    award: '🏆',
    record: '📊',
  };
  return icons[type] || '📌';
}

function getMilestoneColor(type: string): string {
  const colors: Record<string, string> = {
    debut: '#3B82F6',
    breakthrough: '#22C55E',
    peak: '#F59E0B',
    comeback: '#EF4444',
    downfall: '#6B7280',
    retirement: '#8B5CF6',
    award: '#FFD700',
    record: '#EC4899',
  };
  return colors[type] || '#6B7280';
}

function getMilestoneBgColor(type: string): string {
  const colors: Record<string, string> = {
    debut: 'bg-blue-500/20',
    breakthrough: 'bg-green-500/20',
    peak: 'bg-amber-500/20',
    comeback: 'bg-red-500/20',
    downfall: 'bg-gray-500/20',
    retirement: 'bg-purple-500/20',
    award: 'bg-yellow-500/20',
    record: 'bg-pink-500/20',
  };
  return colors[type] || 'bg-gray-500/20';
}

function formatMilestoneType(type: string): string {
  const labels: Record<string, string> = {
    debut: 'Debut',
    breakthrough: 'Breakthrough',
    peak: 'Peak',
    comeback: 'Comeback',
    downfall: 'Career Challenge',
    retirement: 'Retirement',
    award: 'Major Award',
    record: 'Record Breaking',
  };
  return labels[type] || type;
}


