'use client';

/**
 * CollaboratorStats Component
 * 
 * Displays an actor's frequent collaborators grouped by role
 * (directors, music directors, cinematographers, writers, editors)
 * in a compact, premium card format.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  Clapperboard,
  Music,
  Camera,
  Pen,
  Film,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Types
interface Collaborator {
  name: string;
  count: number;
  movies: Array<{ title: string; year: number; slug: string }>;
}

interface CollaboratorsByRole {
  directors: Collaborator[];
  music_directors: Collaborator[];
  cinematographers: Collaborator[];
  writers: Collaborator[];
  editors: Collaborator[];
  producers: Collaborator[];
}

interface CollaboratorStatsProps {
  collaborators: CollaboratorsByRole;
  actorName?: string;  // Optional for ProfileSection usage
  onCollaboratorClick?: (name: string, role: string) => void;
  className?: string;
}

// Role configuration
const ROLE_CONFIG: Array<{
  key: keyof CollaboratorsByRole;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = [
  { key: 'directors', label: 'Directors', icon: Clapperboard, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  { key: 'music_directors', label: 'Music', icon: Music, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  { key: 'cinematographers', label: 'Cinematography', icon: Camera, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  { key: 'writers', label: 'Writers', icon: Pen, color: 'text-green-400', bgColor: 'bg-green-500/10' },
  { key: 'editors', label: 'Editors', icon: Film, color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
  { key: 'producers', label: 'Producers', icon: Users, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
];

export function CollaboratorStats({
  collaborators,
  actorName: _actorName, // Reserved for future use (e.g., filtering)
  onCollaboratorClick,
  className = '',
}: CollaboratorStatsProps) {
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  // Filter roles that have collaborators
  const activeRoles = ROLE_CONFIG.filter(
    (role) => collaborators[role.key]?.length > 0
  );

  if (activeRoles.length === 0) {
    return null;
  }

  return (
    <section className={`${className}`}>
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
        <Users className="w-4 h-4" />
        Frequent Collaborators
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeRoles.map((role) => {
          const Icon = role.icon;
          const roleCollaborators = collaborators[role.key];
          const isExpanded = expandedRole === role.key;
          const displayCollaborators = isExpanded
            ? roleCollaborators
            : roleCollaborators.slice(0, 3);

          return (
            <div
              key={role.key}
              className="rounded-xl border border-[var(--border-primary)] overflow-hidden"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              {/* Role Header */}
              <div
                className={`px-3 py-2 flex items-center gap-2 ${role.bgColor}`}
              >
                <Icon className={`w-4 h-4 ${role.color}`} />
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  {role.label}
                </span>
                <span className="ml-auto text-[10px] text-[var(--text-tertiary)]">
                  {roleCollaborators.length} collaborators
                </span>
              </div>

              {/* Collaborator List */}
              <div className="px-3 py-2 space-y-1.5">
                {displayCollaborators.map((collab) => (
                  <CollaboratorRow
                    key={collab.name}
                    collaborator={collab}
                    roleColor={role.color}
                    onClick={() => onCollaboratorClick?.(collab.name, role.key)}
                  />
                ))}

                {/* Show More/Less Button */}
                {roleCollaborators.length > 3 && (
                  <button
                    onClick={() =>
                      setExpandedRole(isExpanded ? null : role.key)
                    }
                    className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        +{roleCollaborators.length - 3} more
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Individual collaborator row
function CollaboratorRow({
  collaborator,
  roleColor,
  onClick,
}: {
  collaborator: Collaborator;
  roleColor: string;
  onClick?: () => void;
}) {
  const [showMovies, setShowMovies] = useState(false);

  return (
    <div className="group">
      <div className="flex items-center justify-between">
        <button
          onClick={onClick}
          className="text-sm text-[var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors truncate flex-1 text-left"
        >
          {collaborator.name}
        </button>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold ${roleColor} tabular-nums`}
          >
            {collaborator.count}
          </span>
          <button
            onClick={() => setShowMovies(!showMovies)}
            className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            {showMovies ? 'hide' : 'films'}
          </button>
        </div>
      </div>

      {/* Movies Dropdown */}
      {showMovies && (
        <div className="mt-1 pl-2 border-l-2 border-[var(--border-primary)] space-y-0.5">
          {collaborator.movies.slice(0, 5).map((movie) => (
            <Link
              key={movie.slug}
              href={`/movies/${movie.slug}`}
              className="block text-[11px] text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] truncate transition-colors"
            >
              {movie.title} ({movie.year})
            </Link>
          ))}
          {collaborator.movies.length > 5 && (
            <span className="text-[10px] text-[var(--text-tertiary)]">
              +{collaborator.movies.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default CollaboratorStats;
