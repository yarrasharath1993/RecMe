'use client';

import { Sparkles } from 'lucide-react';
import { getCardClasses, premiumText } from './compact.styles';

interface CompactLegacyCardProps {
  legacy: string;
  className?: string;
}

export function CompactLegacyCard({ legacy, className = '' }: CompactLegacyCardProps) {
  return (
    <div className={getCardClasses('primary', `${className} relative overflow-hidden`)}>
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 pointer-events-none" />
      
      <div className="relative">
        <h3 className={`${premiumText.heading} mb-3 flex items-center gap-2`}>
          <Sparkles className="w-4 h-4" />
          Legacy & Impact
        </h3>
        
        <div className="prose prose-sm prose-invert max-w-none">
          <p className="text-xs text-white/80 leading-relaxed whitespace-pre-line">
            {legacy}
          </p>
        </div>
      </div>
      
      {/* Decorative corner accent */}
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-purple-500/20 to-transparent rounded-tl-full blur-xl" />
    </div>
  );
}
