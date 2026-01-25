'use client';

import Link from 'next/link';
import { Users, Heart } from 'lucide-react';
import { getCardClasses, premiumText } from './compact.styles';

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
}

interface CompactDynastyCardProps {
  family: { [key: string]: FamilyMember[] };
  pairings: Pairing[];
  className?: string;
}

export function CompactDynastyCard({ family, pairings, className = '' }: CompactDynastyCardProps) {
  // Get immediate family members
  const immediateFamily = [
    ...(family.Spouse || []),
    ...(family.Parents || []).slice(0, 2),
    ...(family.Children || []),
  ].slice(0, 5);
  
  return (
    <div className={getCardClasses('success', className)}>
      <h3 className={`${premiumText.heading} mb-3 flex items-center gap-2`}>
        <Users className="w-4 h-4" />
        Dynasty
      </h3>
      
      {/* Family Section */}
      <div className="mb-4">
        <div className={`${premiumText.subheading} mb-2 text-green-400`}>Family</div>
        <div className="space-y-1">
          {immediateFamily.map((member, idx) => (
            <div key={idx} className="flex justify-between items-center p-1.5 rounded bg-white/5">
              {member.slug ? (
                <Link 
                  href={`/movies?profile=${member.slug}`}
                  className="text-xs text-white/90 hover:text-white transition-colors"
                >
                  {member.name}
                </Link>
              ) : (
                <span className={premiumText.body}>{member.name}</span>
              )}
              <span className={premiumText.caption}>{member.relation}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Romantic Pairings */}
      <div>
        <div className={`${premiumText.subheading} mb-2 text-pink-400 flex items-center gap-1.5`}>
          <Heart className="w-3 h-3" />
          Top Pairings
        </div>
        <div className="flex flex-wrap gap-1.5">
          {pairings.slice(0, 3).map((pairing, idx) => (
            pairing.slug ? (
              <Link
                key={idx}
                href={`/movies?profile=${pairing.slug}`}
                className="px-2 py-1 rounded-md text-[10px] font-medium bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-colors border border-pink-500/30"
              >
                {pairing.name} ({pairing.count})
              </Link>
            ) : (
              <span
                key={idx}
                className="px-2 py-1 rounded-md text-[10px] font-medium bg-pink-500/20 text-pink-300 border border-pink-500/30"
              >
                {pairing.name} ({pairing.count})
              </span>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
