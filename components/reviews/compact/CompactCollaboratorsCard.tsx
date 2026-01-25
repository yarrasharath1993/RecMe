'use client';

import { Users, Film, Music, Camera } from 'lucide-react';
import { getCardClasses, premiumText, iconSizes } from './compact.styles';

interface Collaborator {
  name: string;
  count: number;
  avg_rating: number;
}

interface CompactCollaboratorsCardProps {
  collaborators: {
    directors?: Collaborator[];
    music?: Collaborator[];
    heroines?: Collaborator[];
  };
  className?: string;
}

export function CompactCollaboratorsCard({ collaborators, className = '' }: CompactCollaboratorsCardProps) {
  const sections = [
    {
      title: 'Directors',
      icon: <Film className={iconSizes.sm} />,
      data: collaborators.directors?.slice(0, 3) || [],
      color: 'text-purple-400',
    },
    {
      title: 'Music',
      icon: <Music className={iconSizes.sm} />,
      data: collaborators.music?.slice(0, 3) || [],
      color: 'text-cyan-400',
    },
    {
      title: 'Co-Stars',
      icon: <Users className={iconSizes.sm} />,
      data: collaborators.heroines?.slice(0, 3) || [],
      color: 'text-pink-400',
    },
  ];
  
  return (
    <div className={getCardClasses('neutral', className)}>
      <h3 className={`${premiumText.heading} mb-3`}>Top Collaborators</h3>
      
      <div className="space-y-3">
        {sections.map((section, idx) => (
          <div key={idx}>
            <div className={`${premiumText.subheading} mb-1.5 flex items-center gap-1.5 ${section.color}`}>
              {section.icon}
              {section.title}
            </div>
            <div className="space-y-1">
              {section.data.map((collab, cidx) => (
                <div 
                  key={cidx}
                  className="flex justify-between items-center p-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className={premiumText.body}>{collab.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/50">{collab.count}</span>
                    <span className="text-[10px] text-yellow-400 font-semibold">
                      {collab.avg_rating.toFixed(1)}★
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
