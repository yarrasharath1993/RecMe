/**
 * ROLE CLASSIFIER
 * 
 * Classifies actor roles (child, lead, supporting, cameo, voice)
 * based on film metadata and actor information.
 */

import type { DiscoveredFilm, CrewRoleType } from './film-discovery-engine';

export type RoleType = 'child_actor' | 'lead' | 'supporting' | 'cameo' | 'voice' | 'unknown';

export interface RoleClassification {
  type: RoleType;
  isPrimaryRole: boolean;
  appearsAs?: 'younger_version' | 'flashback' | 'guest' | 'special_appearance' | null;
  confidence: number;
  crewRoles?: CrewRoleType[]; // Multiple crew roles possible (e.g., actor + producer)
  languages?: string[]; // Multi-language support
}

// Known actor birth years for accurate child actor detection
const KNOWN_ACTOR_BIRTH_YEARS: Record<string, number> = {
  'Manchu Manoj': 1983,
  'Manchu Manoj Kumar': 1983,
  'Nani': 1984,
  'Chiranjeevi': 1955,
  'Mahesh Babu': 1975,
  'Allu Arjun': 1982,
  'Pawan Kalyan': 1971,
  'Venkatesh': 1960,
  'Daggubati Venkatesh': 1960,
  'Allari Naresh': 1982,
  'Ram Charan': 1985,
  'N. T. Rama Rao Jr': 1983,
  'Balakrishna': 1960,
};

/**
 * Get actor's birth year (if known)
 */
function getActorBirthYear(actorName: string): number | null {
  // Normalize actor name
  const normalized = actorName.trim();
  
  // Check direct match
  if (KNOWN_ACTOR_BIRTH_YEARS[normalized]) {
    return KNOWN_ACTOR_BIRTH_YEARS[normalized];
  }
  
  // Check partial match
  for (const [name, year] of Object.entries(KNOWN_ACTOR_BIRTH_YEARS)) {
    if (name.toLowerCase().includes(normalized.toLowerCase()) ||
        normalized.toLowerCase().includes(name.toLowerCase())) {
      return year;
    }
  }
  
  return null;
}

/**
 * Check if role is a child actor role
 */
function isChildActorRole(releaseYear: number, actorBirthYear: number): boolean {
  const ageAtRelease = releaseYear - actorBirthYear;
  return ageAtRelease < 18;
}

/**
 * Check if role is a cameo/special appearance
 */
function isCameoRole(film: DiscoveredFilm): boolean {
  const credits = film.credits?.toLowerCase() || '';
  const characterName = film.character_name?.toLowerCase() || '';
  
  const cameoKeywords = [
    'special appearance',
    'guest appearance',
    'guest role',
    'cameo',
    'special',
    'guest',
    'extended cameo',
    'friendly appearance',
  ];
  
  return cameoKeywords.some(keyword => 
    credits.includes(keyword) || characterName.includes(keyword)
  );
}

/**
 * Check if role is a voice role
 */
function isVoiceRole(film: DiscoveredFilm): boolean {
  const credits = film.credits?.toLowerCase() || '';
  const characterName = film.character_name?.toLowerCase() || '';
  
  const voiceKeywords = ['voice', 'dubbing', 'narrator', 'narration'];
  
  return voiceKeywords.some(keyword => 
    credits.includes(keyword) || characterName.includes(keyword)
  );
}

/**
 * Determine appearance type (younger version, flashback, etc.)
 */
function getAppearanceType(film: DiscoveredFilm): RoleClassification['appearsAs'] {
  const credits = film.credits?.toLowerCase() || '';
  const characterName = film.character_name?.toLowerCase() || '';
  
  if (credits.includes('younger') || characterName.includes('younger') || 
      characterName.includes('young')) {
    return 'younger_version';
  }
  
  if (credits.includes('flashback')) {
    return 'flashback';
  }
  
  if (credits.includes('guest') || credits.includes('special appearance')) {
    return 'special_appearance';
  }
  
  if (credits.includes('guest')) {
    return 'guest';
  }
  
  return null;
}

/**
 * Classify actor's role in a film (including crew roles)
 */
export function classifyActorRole(
  film: DiscoveredFilm,
  actorName: string
): RoleClassification {
  // Get actor birth year
  const birthYear = getActorBirthYear(actorName);
  
  // Collect crew roles from film
  const crewRoles: CrewRoleType[] = film.crewRoles || [];
  
  // Collect languages
  const languages: string[] = film.languages || (film.language ? [film.language] : []);
  
  // Check for child actor role (only if no crew roles, or crew roles are secondary)
  if (birthYear && isChildActorRole(film.release_year, birthYear) && crewRoles.length === 0) {
    return {
      type: 'child_actor',
      isPrimaryRole: false,
      appearsAs: getAppearanceType(film),
      confidence: 0.95,
      crewRoles: crewRoles.length > 0 ? crewRoles : undefined,
      languages: languages.length > 0 ? languages : undefined,
    };
  }
  
  // Check for voice role
  if (isVoiceRole(film)) {
    return {
      type: 'voice',
      isPrimaryRole: false,
      appearsAs: null,
      confidence: 0.90,
      crewRoles: crewRoles.length > 0 ? crewRoles : undefined,
      languages: languages.length > 0 ? languages : undefined,
    };
  }
  
  // Check for cameo role
  if (isCameoRole(film)) {
    return {
      type: 'cameo',
      isPrimaryRole: false,
      appearsAs: getAppearanceType(film),
      confidence: 0.85,
      crewRoles: crewRoles.length > 0 ? crewRoles : undefined,
      languages: languages.length > 0 ? languages : undefined,
    };
  }
  
  // Check if lead role
  if (film.role === 'hero' || film.role === 'heroine') {
    return {
      type: 'lead',
      isPrimaryRole: true,
      appearsAs: null,
      confidence: 0.90,
      crewRoles: crewRoles.length > 0 ? crewRoles : undefined,
      languages: languages.length > 0 ? languages : undefined,
    };
  }
  
  // Default to supporting (but may have crew roles)
  return {
    type: 'supporting',
    isPrimaryRole: crewRoles.length === 0, // Primary if no crew roles
    appearsAs: getAppearanceType(film),
    confidence: 0.75,
    crewRoles: crewRoles.length > 0 ? crewRoles : undefined,
    languages: languages.length > 0 ? languages : undefined,
  };
}

/**
 * Batch classify roles for multiple films
 */
export function batchClassifyRoles(
  films: DiscoveredFilm[],
  actorName: string
): Map<DiscoveredFilm, RoleClassification> {
  const classifications = new Map<DiscoveredFilm, RoleClassification>();
  
  for (const film of films) {
    const classification = classifyActorRole(film, actorName);
    classifications.set(film, classification);
  }
  
  return classifications;
}

/**
 * Get summary statistics for role classifications
 */
export function getRoleStatistics(classifications: Map<DiscoveredFilm, RoleClassification>): {
  total: number;
  childActor: number;
  lead: number;
  supporting: number;
  cameo: number;
  voice: number;
  unknown: number;
} {
  let childActor = 0;
  let lead = 0;
  let supporting = 0;
  let cameo = 0;
  let voice = 0;
  let unknown = 0;
  
  for (const classification of classifications.values()) {
    switch (classification.type) {
      case 'child_actor':
        childActor++;
        break;
      case 'lead':
        lead++;
        break;
      case 'supporting':
        supporting++;
        break;
      case 'cameo':
        cameo++;
        break;
      case 'voice':
        voice++;
        break;
      default:
        unknown++;
    }
  }
  
  return {
    total: classifications.size,
    childActor,
    lead,
    supporting,
    cameo,
    voice,
    unknown,
  };
}
