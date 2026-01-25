'use client';

import { Quote, Sparkles, TrendingUp } from 'lucide-react';
import { getCardClasses, premiumText } from './compact.styles';

interface Dialogue {
  dialogue: string;
  movie_title?: string;
  year?: number;
  movie_slug?: string;
}

interface FanCulture {
  viral_moments?: string[];
  trivia?: string[];
  signature_dialogues?: Dialogue[];
  cultural_titles?: string[];
}

interface CompactCultureCardProps {
  culture: FanCulture;
  className?: string;
}

export function CompactCultureCard({ culture, className = '' }: CompactCultureCardProps) {
  return (
    <div className={getCardClasses('accent', className)}>
      <h3 className={`${premiumText.heading} mb-3 flex items-center gap-2`}>
        <Sparkles className="w-4 h-4" />
        Fan Culture
      </h3>
      
      {/* Signature Dialogues */}
      {culture.signature_dialogues && culture.signature_dialogues.length > 0 && (
        <div className="mb-3">
          <div className={`${premiumText.subheading} mb-2 text-orange-400 flex items-center gap-1.5`}>
            <Quote className="w-3 h-3" />
            Iconic Lines
          </div>
          <div className="space-y-2">
            {culture.signature_dialogues.slice(0, 2).map((dialogue, idx) => (
              <div 
                key={idx}
                className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20"
              >
                <div className="text-xs text-white/90 italic mb-1">
                  &ldquo;{dialogue.dialogue}&rdquo;
                </div>
                <div className={`${premiumText.caption} flex justify-between`}>
                  <span>{dialogue.movie_title}</span>
                  <span>{dialogue.year}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Viral Moments */}
      {culture.viral_moments && culture.viral_moments.length > 0 && (
        <div>
          <div className={`${premiumText.subheading} mb-2 text-purple-400 flex items-center gap-1.5`}>
            <TrendingUp className="w-3 h-3" />
            Viral Moments
          </div>
          <div className="space-y-1">
            {culture.viral_moments.slice(0, 3).map((moment, idx) => (
              <div 
                key={idx}
                className="text-[10px] text-white/70 leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-purple-400"
              >
                {moment}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
