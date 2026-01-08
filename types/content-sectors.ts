/**
 * CONTENT SECTORS & TYPES
 * 
 * Comprehensive taxonomy for all content types supported by the platform.
 * This extends the existing content system without breaking changes.
 */

import { z } from 'zod';

// ============================================================
// CONTENT TYPES
// ============================================================

/**
 * Content type - defines the format/structure of the content
 */
export type ContentType = 
  | 'review'      // Movie/product review with ratings
  | 'article'     // Standard article/news piece
  | 'story'       // Narrative story (fiction or non-fiction)
  | 'timeline'    // Chronological event timeline
  | 'case_study'  // Deep-dive case analysis
  | 'recipe'      // Food recipe with ingredients/steps
  | 'guide'       // How-to guide or tutorial
  | 'quiz'        // Interactive quiz content
  | 'listicle'    // List-based article
  | 'opinion'     // Opinion piece/editorial
  | 'analysis'    // Data-driven analysis
  | 'archive'     // Historical/archival content
  | 'fictional'   // Fictional/speculative content
  | 'interview'   // Interview transcript/summary
  | 'biography'   // Person biography
  | 'explainer';  // Explainer content

export const ContentTypeSchema = z.enum([
  'review',
  'article',
  'story',
  'timeline',
  'case_study',
  'recipe',
  'guide',
  'quiz',
  'listicle',
  'opinion',
  'analysis',
  'archive',
  'fictional',
  'interview',
  'biography',
  'explainer',
]);

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  review: 'Review',
  article: 'Article',
  story: 'Story',
  timeline: 'Timeline',
  case_study: 'Case Study',
  recipe: 'Recipe',
  guide: 'Guide',
  quiz: 'Quiz',
  listicle: 'Listicle',
  opinion: 'Opinion',
  analysis: 'Analysis',
  archive: 'Archive',
  fictional: 'Fictional',
  interview: 'Interview',
  biography: 'Biography',
  explainer: 'Explainer',
};

// ============================================================
// CONTENT SECTORS (Main Categories)
// ============================================================

/**
 * Content sector - top-level content category
 */
export type ContentSector = 
  | 'movies_cinema'      // Movies & Cinema (core pillar)
  | 'auto_trends'        // Auto Trends & Buzz
  | 'actor_industry'     // Actor & Industry Stories
  | 'crime_courts'       // Crimes, Courts & Controversies
  | 'archives_buried'    // Archives & Buried Truths
  | 'what_if_fiction'    // What-If & Fiction
  | 'kids_family'        // Kids & Family Zone
  | 'pregnancy_wellness' // Pregnancy, Wellness & Family
  | 'food_bachelor'      // Food & Bachelor Life
  | 'stories_narratives' // Life Stories & Narratives
  | 'general';           // General/Uncategorized

export const ContentSectorSchema = z.enum([
  'movies_cinema',
  'auto_trends',
  'actor_industry',
  'crime_courts',
  'archives_buried',
  'what_if_fiction',
  'kids_family',
  'pregnancy_wellness',
  'food_bachelor',
  'stories_narratives',
  'general',
]);

// ============================================================
// SUBSECTORS (Detailed Categories)
// ============================================================

/**
 * Movies & Cinema subsectors
 */
export type MoviesCinemaSubsector = 
  | 'reviews'
  | 'cult_classics'
  | 'forgotten_gems'
  | 'famous_scenes'
  | 'box_office'
  | 'music_scores'
  | 'actor_pairs'
  | 'era_analysis'
  | 'remake_comparisons';

/**
 * Auto Trends subsectors
 */
export type AutoTrendsSubsector = 
  | 'daily_buzz'
  | 'reddit_highlights'
  | 'fan_wars'
  | 'popcorn_news'
  | 'meme_context'
  | 'social_trending';

/**
 * Actor & Industry subsectors
 */
export type ActorIndustrySubsector = 
  | 'life_events'
  | 'interviews'
  | 'career_arcs'
  | 'comebacks'
  | 'controversies'
  | 'on_set_stories'
  | 'filmography_analysis';

/**
 * Crime & Courts subsectors
 */
export type CrimeCourtsSubsector = 
  | 'historic_crimes'
  | 'court_cases'
  | 'legal_battles'
  | 'scandals'
  | 'case_timelines'
  | 'industry_legal';

/**
 * Archives subsectors
 */
export type ArchivesSubsector = 
  | 'investigated'
  | 'documented_cases'
  | 'forgotten_incidents'
  | 'cultural_turning'
  | 'historical_context'
  | 'documented_bans'        // NEW: Historical bans and censorship
  | 'industry_strikes'       // NEW: Industry labor actions
  | 'forgotten_controversies'; // NEW: Buried controversies

/**
 * What-If & Fiction subsectors
 */
export type WhatIfSubsector = 
  | 'alternate_history'
  | 'hypotheticals'
  | 'speculative'
  | 'fan_theories';

/**
 * Kids & Family subsectors
 */
export type KidsFamilySubsector = 
  | 'moral_stories'
  | 'bedtime_stories'
  | 'mythology'
  | 'learning_guides'
  | 'mini_games'
  | 'illustrated_tales'
  | 'educational';

/**
 * Pregnancy & Wellness subsectors
 */
export type PregnancyWellnessSubsector = 
  | 'pregnancy_tips'
  | 'ttc_lifestyle'
  | 'nutrition'
  | 'emotional_wellness'
  | 'parenting_tips'
  | 'baby_care';

/**
 * Food & Bachelor subsectors
 */
export type FoodBachelorSubsector = 
  | 'simple_recipes'
  | 'budget_cooking'
  | 'hostel_hacks'
  | 'movie_snacks'
  | 'quick_meals'
  | 'bachelor_tips';

/**
 * All possible subsectors
 */
export type ContentSubsector = 
  | MoviesCinemaSubsector
  | AutoTrendsSubsector
  | ActorIndustrySubsector
  | CrimeCourtsSubsector
  | ArchivesSubsector
  | WhatIfSubsector
  | KidsFamilySubsector
  | PregnancyWellnessSubsector
  | FoodBachelorSubsector;

// ============================================================
// SECTOR DEFINITIONS
// ============================================================

export interface SectorDefinition {
  id: ContentSector;
  name: string;
  nameTe: string;
  description: string;
  icon: string;
  color: string;
  subsectors: { id: string; name: string; nameTe: string }[];
  allowedContentTypes: ContentType[];
  requiresFictionalLabel: boolean;
  requiresDisclaimer: boolean;
  disclaimerType?: string;
  isFamilySafeDefault: boolean;
  defaultAudienceProfile: AudienceProfile;
}

export const SECTOR_DEFINITIONS: Record<ContentSector, SectorDefinition> = {
  movies_cinema: {
    id: 'movies_cinema',
    name: 'Movies & Cinema',
    nameTe: 'సినిమాలు & సినిమా',
    description: 'Movie reviews, analysis, and cinema culture',
    icon: '🎬',
    color: '#E50914',
    subsectors: [
      { id: 'reviews', name: 'Reviews', nameTe: 'రివ్యూలు' },
      { id: 'cult_classics', name: 'Cult Classics', nameTe: 'కల్ట్ క్లాసిక్స్' },
      { id: 'forgotten_gems', name: 'Forgotten Gems', nameTe: 'మరచిపోయిన రత్నాలు' },
      { id: 'famous_scenes', name: 'Famous Scenes', nameTe: 'ప్రసిద్ధ సన్నివేశాలు' },
      { id: 'box_office', name: 'Box Office', nameTe: 'బాక్స్ ఆఫీస్' },
      { id: 'music_scores', name: 'Music & BGM', nameTe: 'సంగీతం & బీజీఎం' },
      { id: 'actor_pairs', name: 'Actor Pairs', nameTe: 'నటుల జంటలు' },
      { id: 'era_analysis', name: 'Era Analysis', nameTe: 'యుగ విశ్లేషణ' },
      { id: 'remake_comparisons', name: 'Remake Comparisons', nameTe: 'రీమేక్ పోలికలు' },
    ],
    allowedContentTypes: ['review', 'article', 'analysis', 'listicle', 'timeline', 'opinion'],
    requiresFictionalLabel: false,
    requiresDisclaimer: false,
    isFamilySafeDefault: true,
    defaultAudienceProfile: 'general',
  },
  
  auto_trends: {
    id: 'auto_trends',
    name: 'Auto Trends & Buzz',
    nameTe: 'ట్రెండ్లు & బజ్',
    description: 'Daily entertainment buzz and trending topics',
    icon: '⚡',
    color: '#FF6B35',
    subsectors: [
      { id: 'daily_buzz', name: 'Daily Buzz', nameTe: 'రోజువారీ బజ్' },
      { id: 'reddit_highlights', name: 'Reddit Highlights', nameTe: 'రెడ్డిట్ హైలైట్స్' },
      { id: 'fan_wars', name: 'Fan Wars', nameTe: 'ఫ్యాన్ వార్స్' },
      { id: 'popcorn_news', name: 'Popcorn News', nameTe: 'పాప్‌కార్న్ న్యూస్' },
      { id: 'meme_context', name: 'Meme Context', nameTe: 'మీమ్ సందర్భం' },
      { id: 'social_trending', name: 'Social Trending', nameTe: 'సోషల్ ట్రెండింగ్' },
    ],
    allowedContentTypes: ['article', 'listicle', 'opinion', 'analysis'],
    requiresFictionalLabel: false,
    requiresDisclaimer: false,
    isFamilySafeDefault: true,
    defaultAudienceProfile: 'general',
  },
  
  actor_industry: {
    id: 'actor_industry',
    name: 'Actor & Industry Stories',
    nameTe: 'నటులు & ఇండస్ట్రీ కథలు',
    description: 'Celebrity stories, interviews, and industry news',
    icon: '🎭',
    color: '#9B59B6',
    subsectors: [
      { id: 'life_events', name: 'Life Events', nameTe: 'జీవిత సంఘటనలు' },
      { id: 'interviews', name: 'Interviews', nameTe: 'ఇంటర్వ్యూలు' },
      { id: 'career_arcs', name: 'Career Arcs', nameTe: 'కెరీర్ ఆర్క్స్' },
      { id: 'comebacks', name: 'Comebacks', nameTe: 'కంబ్యాక్స్' },
      { id: 'controversies', name: 'Controversies', nameTe: 'వివాదాలు' },
      { id: 'on_set_stories', name: 'On-Set Stories', nameTe: 'సెట్ కథలు' },
      { id: 'filmography_analysis', name: 'Filmography Analysis', nameTe: 'ఫిల్మోగ్రఫీ విశ్లేషణ' },
    ],
    allowedContentTypes: ['article', 'interview', 'biography', 'timeline', 'analysis', 'opinion'],
    requiresFictionalLabel: false,
    requiresDisclaimer: false,
    isFamilySafeDefault: true,
    defaultAudienceProfile: 'general',
  },
  
  crime_courts: {
    id: 'crime_courts',
    name: 'Crimes, Courts & Controversies',
    nameTe: 'నేరాలు, కోర్టులు & వివాదాలు',
    description: 'Legal cases, crime stories, and controversies',
    icon: '⚖️',
    color: '#34495E',
    subsectors: [
      { id: 'historic_crimes', name: 'Historic Crimes', nameTe: 'చారిత్రక నేరాలు' },
      { id: 'court_cases', name: 'Court Cases', nameTe: 'కోర్టు కేసులు' },
      { id: 'legal_battles', name: 'Legal Battles', nameTe: 'చట్టపరమైన పోరాటాలు' },
      { id: 'scandals', name: 'Scandals', nameTe: 'కుంభకోణాలు' },
      { id: 'case_timelines', name: 'Case Timelines', nameTe: 'కేసు టైమ్‌లైన్లు' },
      { id: 'industry_legal', name: 'Industry Legal', nameTe: 'ఇండస్ట్రీ లీగల్' },
    ],
    allowedContentTypes: ['article', 'timeline', 'case_study', 'analysis', 'archive'],
    requiresFictionalLabel: false,
    requiresDisclaimer: true,
    disclaimerType: 'legal',
    isFamilySafeDefault: false,
    defaultAudienceProfile: 'adult',
  },
  
  archives_buried: {
    id: 'archives_buried',
    name: 'Archives & Buried Truths',
    nameTe: 'ఆర్కైవ్స్ & దాచిన సత్యాలు',
    description: 'Historical investigations and forgotten incidents',
    icon: '📜',
    color: '#8B4513',
    subsectors: [
      { id: 'investigated', name: 'Investigated Archives', nameTe: 'పరిశోధించిన ఆర్కైవ్స్' },
      { id: 'documented_cases', name: 'Documented Cases', nameTe: 'డాక్యుమెంటెడ్ కేసులు' },
      { id: 'forgotten_incidents', name: 'Forgotten Incidents', nameTe: 'మరచిపోయిన సంఘటనలు' },
      { id: 'cultural_turning', name: 'Cultural Turning Points', nameTe: 'సాంస్కృతిక మలుపులు' },
      { id: 'historical_context', name: 'Historical Context', nameTe: 'చారిత్రక సందర్భం' },
      { id: 'documented_bans', name: 'Documented Bans', nameTe: 'నిషేధాలు డాక్యుమెంట్' },
      { id: 'industry_strikes', name: 'Industry Strikes', nameTe: 'పరిశ్రమ సమ్మెలు' },
      { id: 'forgotten_controversies', name: 'Forgotten Controversies', nameTe: 'మరచిపోయిన వివాదాలు' },
    ],
    allowedContentTypes: ['archive', 'article', 'timeline', 'case_study', 'analysis'],
    requiresFictionalLabel: false,
    requiresDisclaimer: true,
    disclaimerType: 'sensitive',
    isFamilySafeDefault: false,
    defaultAudienceProfile: 'adult',
  },
  
  what_if_fiction: {
    id: 'what_if_fiction',
    name: 'What-If & Fiction',
    nameTe: 'వాట్-ఇఫ్ & కల్పన',
    description: 'Speculative and fictional content',
    icon: '🌀',
    color: '#3498DB',
    subsectors: [
      { id: 'alternate_history', name: 'Alternate History', nameTe: 'ప్రత్యామ్నాయ చరిత్ర' },
      { id: 'hypotheticals', name: 'Hypotheticals', nameTe: 'హైపోథెటికల్స్' },
      { id: 'speculative', name: 'Speculative Essays', nameTe: 'ఊహాత్మక వ్యాసాలు' },
      { id: 'fan_theories', name: 'Fan Theories', nameTe: 'ఫ్యాన్ థియరీలు' },
    ],
    allowedContentTypes: ['fictional', 'article', 'story', 'opinion'],
    requiresFictionalLabel: true,
    requiresDisclaimer: true,
    disclaimerType: 'fictional',
    isFamilySafeDefault: true,
    defaultAudienceProfile: 'general',
  },
  
  kids_family: {
    id: 'kids_family',
    name: 'Kids & Family Zone',
    nameTe: 'పిల్లలు & కుటుంబ జోన్',
    description: 'Family-safe content for children',
    icon: '🧒',
    color: '#2ECC71',
    subsectors: [
      { id: 'moral_stories', name: 'Moral Stories', nameTe: 'నీతి కథలు' },
      { id: 'bedtime_stories', name: 'Bedtime Stories', nameTe: 'నిద్రపోయే కథలు' },
      { id: 'mythology', name: 'Mythology', nameTe: 'పురాణాలు' },
      { id: 'learning_guides', name: 'Learning Guides', nameTe: 'లెర్నింగ్ గైడ్స్' },
      { id: 'mini_games', name: 'Mini Games', nameTe: 'మినీ గేమ్స్' },
      { id: 'illustrated_tales', name: 'Illustrated Tales', nameTe: 'చిత్రాల కథలు' },
      { id: 'educational', name: 'Educational', nameTe: 'విద్యాసంబంధమైన' },
    ],
    allowedContentTypes: ['story', 'guide', 'quiz', 'article', 'listicle'],
    requiresFictionalLabel: false,
    requiresDisclaimer: false,
    isFamilySafeDefault: true,
    defaultAudienceProfile: 'kids',
  },
  
  pregnancy_wellness: {
    id: 'pregnancy_wellness',
    name: 'Pregnancy, Wellness & Family',
    nameTe: 'గర్భం, ఆరోగ్యం & కుటుంబం',
    description: 'Health and wellness content for families',
    icon: '🤱',
    color: '#E91E63',
    subsectors: [
      { id: 'pregnancy_tips', name: 'Pregnancy Tips', nameTe: 'గర్భధారణ చిట్కాలు' },
      { id: 'ttc_lifestyle', name: 'Trying to Conceive', nameTe: 'గర్భధారణ ప్రయత్నం' },
      { id: 'nutrition', name: 'Nutrition', nameTe: 'పోషకాహారం' },
      { id: 'emotional_wellness', name: 'Emotional Wellness', nameTe: 'భావోద్వేగ ఆరోగ్యం' },
      { id: 'parenting_tips', name: 'Parenting Tips', nameTe: 'పేరెంటింగ్ చిట్కాలు' },
      { id: 'baby_care', name: 'Baby Care', nameTe: 'బేబీ కేర్' },
    ],
    allowedContentTypes: ['article', 'guide', 'listicle', 'explainer'],
    requiresFictionalLabel: false,
    requiresDisclaimer: true,
    disclaimerType: 'medical',
    isFamilySafeDefault: true,
    defaultAudienceProfile: 'family',
  },
  
  food_bachelor: {
    id: 'food_bachelor',
    name: 'Food & Bachelor Life',
    nameTe: 'ఆహారం & బ్యాచిలర్ లైఫ్',
    description: 'Recipes and lifestyle tips',
    icon: '🍳',
    color: '#F39C12',
    subsectors: [
      { id: 'simple_recipes', name: 'Simple Recipes', nameTe: 'సింపుల్ రెసిపీలు' },
      { id: 'budget_cooking', name: 'Budget Cooking', nameTe: 'బడ్జెట్ వంట' },
      { id: 'hostel_hacks', name: 'Hostel Hacks', nameTe: 'హాస్టల్ హ్యాక్స్' },
      { id: 'movie_snacks', name: 'Movie Snacks', nameTe: 'మూవీ స్నాక్స్' },
      { id: 'quick_meals', name: 'Quick Meals', nameTe: 'క్విక్ మీల్స్' },
      { id: 'bachelor_tips', name: 'Bachelor Tips', nameTe: 'బ్యాచిలర్ చిట్కాలు' },
    ],
    allowedContentTypes: ['recipe', 'guide', 'listicle', 'article'],
    requiresFictionalLabel: false,
    requiresDisclaimer: false,
    isFamilySafeDefault: true,
    defaultAudienceProfile: 'general',
  },
  
  stories_narratives: {
    id: 'stories_narratives',
    name: 'Life Stories & Narratives',
    nameTe: 'జీవిత కథలు & కథనాలు',
    description: 'Personal stories and life narratives',
    icon: '📖',
    color: '#1ABC9C',
    subsectors: [],
    allowedContentTypes: ['story', 'article', 'opinion'],
    requiresFictionalLabel: false,
    requiresDisclaimer: false,
    isFamilySafeDefault: true,
    defaultAudienceProfile: 'general',
  },
  
  general: {
    id: 'general',
    name: 'General',
    nameTe: 'జనరల్',
    description: 'Uncategorized content',
    icon: '📄',
    color: '#95A5A6',
    subsectors: [],
    allowedContentTypes: ['article', 'story', 'opinion', 'listicle'],
    requiresFictionalLabel: false,
    requiresDisclaimer: false,
    isFamilySafeDefault: true,
    defaultAudienceProfile: 'general',
  },
};

// ============================================================
// AUDIENCE PROFILES
// ============================================================

export type AudienceProfile = 
  | 'kids'     // 0-12 years
  | 'family'   // All ages, family viewing
  | 'general'  // General audience (13+)
  | 'adult';   // Adults only (18+)

export const AudienceProfileSchema = z.enum(['kids', 'family', 'general', 'adult']);

export const AUDIENCE_PROFILE_LABELS: Record<AudienceProfile, { label: string; labelTe: string; ageRange: string }> = {
  kids: { label: 'Kids', labelTe: 'పిల్లలు', ageRange: '0-12' },
  family: { label: 'Family', labelTe: 'కుటుంబం', ageRange: 'All ages' },
  general: { label: 'General', labelTe: 'జనరల్', ageRange: '13+' },
  adult: { label: 'Adult', labelTe: 'పెద్దలు', ageRange: '18+' },
};

// ============================================================
// SENSITIVITY LEVELS
// ============================================================

export type ContentSensitivityLevel = 
  | 'none'      // No sensitive content
  | 'mild'      // Mildly sensitive
  | 'moderate'  // Moderately sensitive
  | 'high'      // Highly sensitive
  | 'extreme';  // Extremely sensitive (requires explicit consent)

export const SensitivityLevelSchema = z.enum(['none', 'mild', 'moderate', 'high', 'extreme']);

export const SENSITIVITY_LEVEL_CONFIG: Record<ContentSensitivityLevel, { 
  label: string; 
  color: string;
  requiresWarning: boolean;
  visibleInFamilySafe: boolean;
}> = {
  none: { label: 'None', color: '#2ECC71', requiresWarning: false, visibleInFamilySafe: true },
  mild: { label: 'Mild', color: '#3498DB', requiresWarning: false, visibleInFamilySafe: true },
  moderate: { label: 'Moderate', color: '#F39C12', requiresWarning: true, visibleInFamilySafe: false },
  high: { label: 'High', color: '#E74C3C', requiresWarning: true, visibleInFamilySafe: false },
  extreme: { label: 'Extreme', color: '#9B59B6', requiresWarning: true, visibleInFamilySafe: false },
};

// ============================================================
// VERIFICATION STATUS
// ============================================================

export type VerificationStatus = 
  | 'draft'     // Initial draft
  | 'pending'   // Pending review
  | 'verified'  // Verified by admin
  | 'locked'    // Locked, no edits allowed
  | 'rejected'; // Rejected

export const VerificationStatusSchema = z.enum(['draft', 'pending', 'verified', 'locked', 'rejected']);

export const VERIFICATION_STATUS_CONFIG: Record<VerificationStatus, {
  label: string;
  color: string;
  canEdit: boolean;
  canPublish: boolean;
}> = {
  draft: { label: 'Draft', color: '#95A5A6', canEdit: true, canPublish: false },
  pending: { label: 'Pending Review', color: '#F39C12', canEdit: true, canPublish: false },
  verified: { label: 'Verified', color: '#2ECC71', canEdit: true, canPublish: true },
  locked: { label: 'Locked', color: '#3498DB', canEdit: false, canPublish: true },
  rejected: { label: 'Rejected', color: '#E74C3C', canEdit: true, canPublish: false },
};

// ============================================================
// AGE GROUPS (for Kids content)
// ============================================================

export type KidsAgeGroup = '0-3' | '4-6' | '7-10' | '11-13';

export const KidsAgeGroupSchema = z.enum(['0-3', '4-6', '7-10', '11-13']);

export const KIDS_AGE_GROUP_LABELS: Record<KidsAgeGroup, { label: string; labelTe: string }> = {
  '0-3': { label: 'Toddlers (0-3)', labelTe: 'చిన్నపిల్లలు (0-3)' },
  '4-6': { label: 'Preschool (4-6)', labelTe: 'ప్రీస్కూల్ (4-6)' },
  '7-10': { label: 'School Age (7-10)', labelTe: 'స్కూల్ ఏజ్ (7-10)' },
  '11-13': { label: 'Tweens (11-13)', labelTe: 'ట్వీన్స్ (11-13)' },
};

// ============================================================
// SOURCE REFERENCE TYPES
// ============================================================

export interface SourceReference {
  id: string;
  sourceType: string;
  sourceName: string;
  sourceUrl?: string;
  trustLevel: number;
  claimType: 'fact' | 'opinion' | 'quote';
  claimText?: string;
  isVerified: boolean;
  fetchedAt: string;
}

export const SourceReferenceSchema = z.object({
  id: z.string(),
  sourceType: z.string(),
  sourceName: z.string(),
  sourceUrl: z.string().url().optional(),
  trustLevel: z.number().min(0).max(1),
  claimType: z.enum(['fact', 'opinion', 'quote']),
  claimText: z.string().optional(),
  isVerified: z.boolean(),
  fetchedAt: z.string(),
});

// ============================================================
// EXTENDED POST TYPE
// ============================================================

export interface ExtendedPostContent {
  // Existing fields (preserved)
  id: string;
  title: string;
  title_te?: string;
  slug: string;
  body?: string;
  body_te?: string;
  
  // New fields
  content_type: ContentType;
  content_sector: ContentSector;
  content_subsector?: ContentSubsector;
  audience_profile: AudienceProfile;
  sensitivity_level: ContentSensitivityLevel;
  
  // Verification
  fact_confidence_score: number;
  source_count: number;
  source_refs: SourceReference[];
  verification_status: VerificationStatus;
  
  // Publishing
  publish_batch_id?: string;
  scheduled_publish_at?: string;
  
  // Labels
  fictional_label: boolean;
  historical_period?: string;
  geo_context?: string;
  age_group?: KidsAgeGroup;
  
  // Disclaimers
  requires_disclaimer: boolean;
  disclaimer_type?: string;
  disclaimer_text?: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get sector definition by ID
 */
export function getSectorDefinition(sectorId: ContentSector): SectorDefinition {
  return SECTOR_DEFINITIONS[sectorId] || SECTOR_DEFINITIONS.general;
}

/**
 * Check if content type is allowed for sector
 */
export function isContentTypeAllowedForSector(
  contentType: ContentType,
  sectorId: ContentSector
): boolean {
  const sector = getSectorDefinition(sectorId);
  return sector.allowedContentTypes.includes(contentType);
}

/**
 * Get required disclaimers for sector
 */
export function getRequiredDisclaimerType(sectorId: ContentSector): string | null {
  const sector = getSectorDefinition(sectorId);
  if (sector.requiresDisclaimer && sector.disclaimerType) {
    return sector.disclaimerType;
  }
  return null;
}

/**
 * Check if sector requires fictional label
 */
export function requiresFictionalLabel(sectorId: ContentSector): boolean {
  const sector = getSectorDefinition(sectorId);
  return sector.requiresFictionalLabel;
}

/**
 * Get all sectors as options for dropdown
 */
export function getSectorOptions(): { value: ContentSector; label: string; icon: string }[] {
  return Object.values(SECTOR_DEFINITIONS).map(sector => ({
    value: sector.id,
    label: sector.name,
    icon: sector.icon,
  }));
}

/**
 * Get subsector options for a given sector
 */
export function getSubsectorOptions(sectorId: ContentSector): { value: string; label: string }[] {
  const sector = getSectorDefinition(sectorId);
  return sector.subsectors.map(sub => ({
    value: sub.id,
    label: sub.name,
  }));
}

/**
 * Get content type options
 */
export function getContentTypeOptions(): { value: ContentType; label: string }[] {
  return Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => ({
    value: value as ContentType,
    label,
  }));
}

