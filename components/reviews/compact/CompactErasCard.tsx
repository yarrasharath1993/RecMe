'use client';

import { Calendar, Sparkles } from 'lucide-react';
import { getCardClasses, premiumText } from './compact.styles';

interface Era {
  name: string;
  years: string;
  themes: string[];
  key_films: string[];
  highlights?: string;
  movie_count?: number;
}

interface CompactErasCardProps {
  eras: Era[];
  className?: string;
}

export function CompactErasCard({ eras, className = '' }: CompactErasCardProps) {
  const colors = [
    'from-orange-500/20 to-yellow-500/20 border-orange-500/30',
    'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  ];
  
  return (
    <div className={getCardClasses('accent', className)}>
      <h3 className={`${premiumText.heading} mb-4 flex items-center gap-2`}>
        <Calendar className="w-4 h-4" />
        Career Eras
      </h3>
      
      <div className="relative">
        {/* Timeline connector */}
        <div className="absolute left-3 top-6 bottom-6 w-0.5 bg-gradient-to-b from-orange-500/50 via-purple-500/50 to-cyan-500/50" />
        
        <div className="space-y-4">
          {eras.map((era, idx) => (
            <div key={idx} className="relative pl-8">
              {/* Timeline dot */}
              <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-gradient-to-br from-white/20 to-white/10 border-2 border-white/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              
              <div className={`p-3 rounded-lg border backdrop-blur-sm bg-gradient-to-br ${colors[idx % colors.length]}`}>
                <div className="flex justify-between items-start mb-1.5">
                  <h4 className="text-sm font-bold text-white">{era.name}</h4>
                  <span className="text-xs text-white/70 font-mono">{era.years}</span>
                </div>
                
                {era.movie_count && (
                  <div className="text-[10px] text-white/60 mb-1.5">
                    {era.movie_count} films
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1 mb-2">
                  {era.themes.slice(0, 4).map((theme, tidx) => (
                    <span 
                      key={tidx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/10 text-white/80"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
                
                <div className="text-[10px] text-white/70 leading-relaxed">
                  <span className="font-semibold text-white/90">Key Films:</span> {era.key_films.slice(0, 3).join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
