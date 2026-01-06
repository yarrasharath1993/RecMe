'use client';

/**
 * Related Celebrities Component
 * Displays frequent collaborators and co-stars
 */

import Image from 'next/image';
import Link from 'next/link';
import { Users, Film, Clapperboard, Music } from 'lucide-react';
import type { RelatedCelebrity } from '@/lib/celebrity/types';

interface RelatedCelebritiesProps {
  celebrities: RelatedCelebrity[];
  className?: string;
}

export function RelatedCelebrities({ celebrities, className = '' }: RelatedCelebritiesProps) {
  if (celebrities.length === 0) {
    return null;
  }

  return (
    <section className={`${className}`}>
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Users className="w-5 h-5 text-purple-400" />
        <span>Frequent Collaborators</span>
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {celebrities.map((celeb) => (
          <CollaboratorCard key={celeb.id} celebrity={celeb} />
        ))}
      </div>
    </section>
  );
}

function CollaboratorCard({ celebrity }: { celebrity: RelatedCelebrity }) {
  const imageUrl = celebrity.profile_image || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(celebrity.name_en)}&background=random&size=200`;

  const RelationIcon = getRelationIcon(celebrity.relation_type);

  return (
    <Link
      href={`/celebrity/${celebrity.slug}`}
      className="group relative bg-gray-800/50 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors"
    >
      {/* Image */}
      <div className="aspect-square relative">
        <Image
          src={imageUrl}
          alt={celebrity.name_en}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Collaboration count badge */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-purple-500/80 rounded-full text-xs font-medium text-white flex items-center gap-1">
          <Film className="w-3 h-3" />
          {celebrity.collaboration_count}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-white font-medium text-sm truncate group-hover:text-orange-400 transition-colors">
          {celebrity.name_en}
        </h3>
        {celebrity.name_te && (
          <p className="text-orange-400/70 text-xs truncate">
            {celebrity.name_te}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1 text-gray-400 text-xs">
          <RelationIcon className="w-3 h-3" />
          <span>{formatRelationType(celebrity.relation_type)}</span>
        </div>
      </div>
    </Link>
  );
}

function getRelationIcon(type: string): any {
  const icons: Record<string, any> = {
    costar: Users,
    director: Clapperboard,
    producer: Film,
    music_director: Music,
  };
  return icons[type] || Users;
}

function formatRelationType(type: string): string {
  const labels: Record<string, string> = {
    costar: 'Co-star',
    director: 'Director',
    producer: 'Producer',
    music_director: 'Music Director',
  };
  return labels[type] || type;
}


