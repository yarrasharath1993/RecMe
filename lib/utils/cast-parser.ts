/**
 * Cast Parser Utility
 * Parses movie cast data from multiple sources (hero/heroine fields + supporting_cast)
 * and returns a unified, properly labeled cast list.
 */

export interface SupportingCastMember {
  name: string;
  type?: string; // "hero2", "heroine2", "supporting", "cameo", etc.
  role?: string; // Optional character/role name
}

export interface ParsedCastMember {
  role: string;      // "Hero 1", "Heroine 2", "Director", etc.
  name: string;
  icon: 'actor' | 'actress' | 'director' | 'music' | 'camera' | 'writer' | 'producer' | 'art' | 'editor' | 'choreographer';
  order: number;     // For sorting (lower = higher priority)
}

export interface MovieCastData {
  hero?: string;
  heroine?: string;
  director?: string;
  music_director?: string;
  producer?: string;
  supporting_cast?: SupportingCastMember[];
}

/**
 * Splits a comma-separated string into trimmed, non-empty values
 */
function splitNames(value: string | undefined): string[] {
  if (!value || value === 'N/A') return [];
  return value
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0 && name !== 'N/A');
}

/**
 * Extracts a number from a type string (e.g., "hero2" -> 2, "heroine3" -> 3)
 */
function extractTypeNumber(type: string): number {
  const match = type.match(/\d+$/);
  return match ? parseInt(match[0], 10) : 1;
}

/**
 * Parses movie cast data and returns a unified, properly ordered cast list.
 * 
 * Handles:
 * - Comma-separated hero/heroine fields (e.g., "Actor A, Actor B")
 * - supporting_cast array with type: "hero2", "heroine2", etc.
 * - Deduplication of names
 * - Proper numbering (Hero 1, Hero 2, etc.)
 */
export function parseCastMembers(movie: MovieCastData): ParsedCastMember[] {
  const cast: ParsedCastMember[] = [];
  const seenNames = new Set<string>();
  
  // Helper to add cast member if not already seen
  const addMember = (member: ParsedCastMember) => {
    if (!member.name) return; // Guard against undefined/null names
    const normalizedName = member.name.toLowerCase().trim();
    if (normalizedName && !seenNames.has(normalizedName)) {
      seenNames.add(normalizedName);
      cast.push(member);
    }
  };

  // 1. Director (order: 0)
  if (movie.director && movie.director !== 'N/A') {
    splitNames(movie.director).forEach((name, idx) => {
      const label = splitNames(movie.director!).length > 1 ? `Director ${idx + 1}` : 'Director';
      addMember({
        role: label,
        name,
        icon: 'director',
        order: idx,
      });
    });
  }

  // 2. Collect all heroes from multiple sources
  const heroes: { name: string; number: number }[] = [];
  
  // From hero field (comma-separated)
  splitNames(movie.hero).forEach((name, idx) => {
    heroes.push({ name, number: idx + 1 });
  });
  
  // From supporting_cast with type "hero2", "hero3", etc.
  if (movie.supporting_cast) {
    movie.supporting_cast
      .filter(c => c.name && c.type && /^hero\d*$/i.test(c.type))
      .forEach(c => {
        const num = extractTypeNumber(c.type!);
        // Only add if this number slot isn't already filled
        if (!heroes.some(h => h.number === num)) {
          heroes.push({ name: c.name, number: num });
        }
      });
  }
  
  // Sort heroes by number and add to cast
  heroes.sort((a, b) => a.number - b.number);
  heroes.forEach((hero, idx) => {
    const label = heroes.length > 1 ? `Hero ${idx + 1}` : 'Hero';
    addMember({
      role: label,
      name: hero.name,
      icon: 'actor',
      order: 10 + idx,
    });
  });

  // 3. Collect all heroines from multiple sources
  const heroines: { name: string; number: number }[] = [];
  
  // From heroine field (comma-separated)
  splitNames(movie.heroine).forEach((name, idx) => {
    heroines.push({ name, number: idx + 1 });
  });
  
  // From supporting_cast with type "heroine2", "heroine3", etc.
  if (movie.supporting_cast) {
    movie.supporting_cast
      .filter(c => c.name && c.type && /^heroine\d*$/i.test(c.type))
      .forEach(c => {
        const num = extractTypeNumber(c.type!);
        if (!heroines.some(h => h.number === num)) {
          heroines.push({ name: c.name, number: num });
        }
      });
  }
  
  // Sort heroines by number and add to cast
  heroines.sort((a, b) => a.number - b.number);
  heroines.forEach((heroine, idx) => {
    const label = heroines.length > 1 ? `Heroine ${idx + 1}` : 'Heroine';
    addMember({
      role: label,
      name: heroine.name,
      icon: 'actress',
      order: 20 + idx,
    });
  });

  // 4. Music Director (order: 30)
  if (movie.music_director && movie.music_director !== 'N/A') {
    splitNames(movie.music_director).forEach((name, idx) => {
      addMember({
        role: 'Music',
        name,
        icon: 'music',
        order: 30 + idx,
      });
    });
  }

  // 5. Producer (order: 40)
  if (movie.producer && movie.producer !== 'N/A') {
    splitNames(movie.producer).forEach((name, idx) => {
      addMember({
        role: 'Producer',
        name,
        icon: 'producer',
        order: 40 + idx,
      });
    });
  }

  // 6. Remaining supporting cast (not hero/heroine types)
  if (movie.supporting_cast) {
    movie.supporting_cast
      .filter(c => c.name && (!c.type || (!c.type.startsWith('hero') && !c.type.startsWith('heroine'))))
      .forEach((c, idx) => {
        const role = c.role || c.type || 'Supporting';
        // Capitalize first letter of role
        const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);
        addMember({
          role: formattedRole,
          name: c.name,
          icon: 'actor',
          order: 50 + idx,
        });
      });
  }

  // Sort by order and return
  return cast.sort((a, b) => a.order - b.order);
}

/**
 * Simplified version for mobile cast chips - returns fewer members
 */
export function parseCastMembersCompact(movie: MovieCastData, maxCount: number = 6): ParsedCastMember[] {
  return parseCastMembers(movie).slice(0, maxCount);
}
