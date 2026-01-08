/**
 * CONTENT ENHANCER
 * 
 * Content enhancement pipeline for the extended content platform.
 * Handles fact extraction, timeline generation, category suggestion,
 * and sensitivity assignment.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  ContentSector, 
  ContentType, 
  ContentSubsector,
  AudienceProfile,
  ContentSensitivityLevel,
  VerificationStatus,
  SourceReference,
  SECTOR_DEFINITIONS,
  getSectorDefinition,
  getRequiredDisclaimerType,
  requiresFictionalLabel,
  SENSITIVITY_LEVEL_CONFIG,
} from '@/types/content-sectors';
import { classifyClaim, ClaimType, classifyDataObject } from '@/lib/intelligence/claim-classifier';

// ============================================================
// TYPES
// ============================================================

export interface ContentEnhancementInput {
  title: string;
  titleTe?: string;
  body: string;
  bodyTe?: string;
  existingSector?: ContentSector;
  existingType?: ContentType;
  sources?: SourceReference[];
  metadata?: Record<string, unknown>;
}

export interface EnhancedContent {
  // Extracted claims
  facts: ExtractedClaim[];
  opinions: ExtractedClaim[];
  quotes: ExtractedClaim[];
  
  // Suggested classification
  suggestedSector: ContentSector;
  suggestedSubsector?: ContentSubsector;
  suggestedContentType: ContentType;
  
  // Audience & Sensitivity
  suggestedAudienceProfile: AudienceProfile;
  suggestedSensitivityLevel: ContentSensitivityLevel;
  
  // Timeline (if applicable)
  timeline?: TimelineEvent[];
  hasTimeline: boolean;
  
  // Verification
  factConfidenceScore: number;
  sourceCount: number;
  verificationStatus: VerificationStatus;
  
  // Labels
  requiresFictionalLabel: boolean;
  requiresDisclaimer: boolean;
  disclaimerType?: string;
  
  // Metadata
  historicalPeriod?: string;
  geoContext?: string;
  
  // Keywords for tagging
  extractedKeywords: string[];
  suggestedTags: string[];
  
  // Processing metadata
  enhancedAt: string;
  enhancementVersion: string;
}

export interface ExtractedClaim {
  id: string;
  text: string;
  type: ClaimType;
  source?: string;
  confidence: number;
  context?: string;
  isVerified: boolean;
}

export interface TimelineEvent {
  id: string;
  date: string;
  dateApproximate?: boolean;
  title: string;
  description: string;
  source?: string;
  importance: 'major' | 'minor' | 'context';
}

// ============================================================
// KEYWORD PATTERNS FOR SECTOR DETECTION
// ============================================================

const SECTOR_KEYWORDS: Record<ContentSector, string[]> = {
  movies_cinema: [
    'movie', 'film', 'cinema', 'box office', 'director', 'actor', 'actress',
    'soundtrack', 'trailer', 'release', 'blockbuster', 'flop', 'hit',
    'సినిమా', 'చిత్రం', 'దర్శకుడు', 'నటుడు', 'నటి', 'పాట', 'బాక్స్ ఆఫీస్',
  ],
  auto_trends: [
    'trending', 'viral', 'buzz', 'meme', 'controversy', 'debate', 'fan war',
    'twitter', 'reddit', 'social media', 'reaction', 'news',
    'ట్రెండింగ్', 'వైరల్', 'మీమ్', 'వివాదం',
  ],
  actor_industry: [
    'actor', 'actress', 'celebrity', 'star', 'interview', 'biography',
    'career', 'comeback', 'filmography', 'personal life', 'controversy',
    'నటుడు', 'నటి', 'సెలబ్రిటీ', 'ఇంటర్వ్యూ', 'జీవిత చరిత్ర',
  ],
  crime_courts: [
    'crime', 'court', 'case', 'trial', 'verdict', 'lawsuit', 'legal',
    'scandal', 'investigation', 'arrest', 'conviction', 'acquittal',
    'నేరం', 'కోర్టు', 'కేసు', 'విచారణ', 'తీర్పు',
  ],
  archives_buried: [
    'archive', 'history', 'historical', 'forgotten', 'investigation',
    'documentary', 'decades ago', 'vintage', 'rare', 'buried',
    'చరిత్ర', 'పురాతన', 'మరచిపోయిన', 'దాచిన',
  ],
  what_if_fiction: [
    'what if', 'alternate', 'hypothetical', 'imagine', 'fiction',
    'speculative', 'theory', 'scenario', 'could have been',
    'ఊహాత్మక', 'కల్పిత', 'ఏమిటంటే',
  ],
  kids_family: [
    'kids', 'children', 'family', 'moral', 'story', 'bedtime', 'mythology',
    'educational', 'learning', 'game', 'puzzle', 'fun',
    'పిల్లలు', 'కుటుంబం', 'నీతి', 'కథ', 'పురాణం',
  ],
  pregnancy_wellness: [
    'pregnancy', 'pregnant', 'trimester', 'baby', 'nutrition', 'wellness',
    'health', 'parenting', 'conception', 'prenatal', 'postnatal',
    'గర్భం', 'బేబీ', 'పోషకాహారం', 'ఆరోగ్యం',
  ],
  food_bachelor: [
    'recipe', 'cooking', 'food', 'meal', 'kitchen', 'ingredient',
    'budget', 'hostel', 'bachelor', 'quick', 'easy',
    'వంట', 'ఆహారం', 'రెసిపీ', 'బడ్జెట్',
  ],
  stories_narratives: [
    'story', 'narrative', 'life', 'experience', 'journey', 'memoir',
    'కథ', 'అనుభవం', 'జీవితం',
  ],
  general: [],
};

const CONTENT_TYPE_KEYWORDS: Record<ContentType, string[]> = {
  review: ['review', 'rating', 'verdict', 'opinion', 'రివ్యూ', 'రేటింగ్'],
  article: ['article', 'news', 'report', 'వార్త'],
  story: ['story', 'tale', 'narrative', 'కథ'],
  timeline: ['timeline', 'chronology', 'history', 'events', 'టైమ్‌లైన్'],
  case_study: ['case study', 'analysis', 'deep dive', 'investigation'],
  recipe: ['recipe', 'ingredients', 'cooking', 'రెసిపీ', 'వంట'],
  guide: ['guide', 'how to', 'tutorial', 'steps', 'గైడ్'],
  quiz: ['quiz', 'test', 'trivia', 'క్విజ్'],
  listicle: ['list', 'top', 'best', 'worst', 'things', 'reasons'],
  opinion: ['opinion', 'think', 'believe', 'perspective', 'అభిప్రాయం'],
  analysis: ['analysis', 'breakdown', 'examine', 'విశ్లేషణ'],
  archive: ['archive', 'historical', 'vintage', 'old', 'పురాతన'],
  fictional: ['fiction', 'imagine', 'what if', 'alternate', 'కల్పిత'],
  interview: ['interview', 'conversation', 'talk', 'ఇంటర్వ్యూ'],
  biography: ['biography', 'life', 'story of', 'journey', 'జీవిత చరిత్ర'],
  explainer: ['explainer', 'explain', 'understand', 'what is', 'వివరణ'],
};

const SENSITIVITY_KEYWORDS: Record<ContentSensitivityLevel, string[]> = {
  none: [],
  mild: ['controversial', 'debate', 'argument'],
  moderate: ['violence', 'crime', 'scandal', 'controversy', 'adult'],
  high: ['murder', 'abuse', 'assault', 'explicit', 'graphic'],
  extreme: ['gore', 'torture', 'extreme violence', 'explicit content'],
};

// ============================================================
// MAIN ENHANCEMENT FUNCTION
// ============================================================

/**
 * Enhance content with extracted facts, suggested classifications,
 * and computed confidence scores.
 */
export async function enhanceContent(
  input: ContentEnhancementInput
): Promise<EnhancedContent> {
  const { title, titleTe, body, bodyTe, existingSector, existingType, sources = [] } = input;
  
  const combinedText = `${title} ${titleTe || ''} ${body} ${bodyTe || ''}`.toLowerCase();
  
  // 1. Extract claims (facts, opinions, quotes)
  const { facts, opinions, quotes } = extractClaims(body, sources);
  
  // 2. Suggest sector based on keywords
  const suggestedSector = existingSector || detectSector(combinedText);
  const sectorDef = getSectorDefinition(suggestedSector);
  
  // 3. Suggest subsector
  const suggestedSubsector = detectSubsector(combinedText, suggestedSector);
  
  // 4. Suggest content type
  const suggestedContentType = existingType || detectContentType(combinedText, suggestedSector);
  
  // 5. Detect sensitivity level
  const suggestedSensitivityLevel = detectSensitivityLevel(combinedText);
  
  // 6. Determine audience profile
  const suggestedAudienceProfile = determineAudienceProfile(
    suggestedSector,
    suggestedSensitivityLevel
  );
  
  // 7. Generate timeline if historical content
  const { timeline, hasTimeline } = generateTimeline(body, suggestedSector);
  
  // 8. Compute confidence score
  const factConfidenceScore = computeConfidenceScore(facts, sources);
  
  // 9. Determine verification status
  const verificationStatus = determineVerificationStatus(factConfidenceScore, sources.length);
  
  // 10. Check for required labels
  const needsFictionalLabel = requiresFictionalLabel(suggestedSector);
  const disclaimerType = getRequiredDisclaimerType(suggestedSector);
  
  // 11. Extract keywords and generate tags
  const extractedKeywords = extractKeywords(combinedText);
  const suggestedTags = generateTags(extractedKeywords, suggestedSector, suggestedSubsector);
  
  // 12. Detect historical period and geo context
  const historicalPeriod = detectHistoricalPeriod(combinedText);
  const geoContext = detectGeoContext(combinedText);
  
  return {
    facts,
    opinions,
    quotes,
    suggestedSector,
    suggestedSubsector,
    suggestedContentType,
    suggestedAudienceProfile,
    suggestedSensitivityLevel,
    timeline,
    hasTimeline,
    factConfidenceScore,
    sourceCount: sources.length,
    verificationStatus,
    requiresFictionalLabel: needsFictionalLabel,
    requiresDisclaimer: !!disclaimerType,
    disclaimerType: disclaimerType || undefined,
    historicalPeriod,
    geoContext,
    extractedKeywords,
    suggestedTags,
    enhancedAt: new Date().toISOString(),
    enhancementVersion: '1.0.0',
  };
}

// ============================================================
// CLAIM EXTRACTION
// ============================================================

function extractClaims(
  body: string,
  sources: SourceReference[]
): { facts: ExtractedClaim[]; opinions: ExtractedClaim[]; quotes: ExtractedClaim[] } {
  const facts: ExtractedClaim[] = [];
  const opinions: ExtractedClaim[] = [];
  const quotes: ExtractedClaim[] = [];
  
  // Split into sentences
  const sentences = body.split(/[.!?।]+/).filter(s => s.trim().length > 10);
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    
    // Detect quotes
    if (trimmed.includes('"') || trimmed.includes('"') || trimmed.includes("'")) {
      quotes.push({
        id: uuidv4(),
        text: trimmed,
        type: 'opinion', // Quotes are typically opinions
        confidence: 0.7,
        isVerified: false,
      });
      continue;
    }
    
    // Use claim classifier
    const claimType = classifyClaim('content', trimmed);
    const claim: ExtractedClaim = {
      id: uuidv4(),
      text: trimmed,
      type: claimType,
      confidence: claimType === 'fact' ? 0.6 : 0.5,
      isVerified: false,
    };
    
    // Check if claim matches any source
    for (const source of sources) {
      if (source.claimText && trimmed.toLowerCase().includes(source.claimText.toLowerCase())) {
        claim.source = source.sourceName;
        claim.confidence = source.trustLevel;
        claim.isVerified = source.isVerified;
        break;
      }
    }
    
    if (claimType === 'fact') {
      facts.push(claim);
    } else {
      opinions.push(claim);
    }
  }
  
  return { facts, opinions, quotes };
}

// ============================================================
// SECTOR DETECTION
// ============================================================

function detectSector(text: string): ContentSector {
  const scores: Record<ContentSector, number> = {} as Record<ContentSector, number>;
  
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    scores[sector as ContentSector] = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[sector as ContentSector]++;
      }
    }
  }
  
  // Find sector with highest score
  let maxSector: ContentSector = 'general';
  let maxScore = 0;
  
  for (const [sector, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxSector = sector as ContentSector;
    }
  }
  
  return maxSector;
}

function detectSubsector(text: string, sector: ContentSector): ContentSubsector | undefined {
  const sectorDef = SECTOR_DEFINITIONS[sector];
  if (!sectorDef || sectorDef.subsectors.length === 0) {
    return undefined;
  }
  
  // Simple keyword matching for subsectors
  for (const sub of sectorDef.subsectors) {
    if (text.includes(sub.id.replace('_', ' ')) || text.includes(sub.name.toLowerCase())) {
      return sub.id as ContentSubsector;
    }
  }
  
  return undefined;
}

// ============================================================
// CONTENT TYPE DETECTION
// ============================================================

function detectContentType(text: string, sector: ContentSector): ContentType {
  const sectorDef = SECTOR_DEFINITIONS[sector];
  const allowedTypes = sectorDef.allowedContentTypes;
  
  let bestType: ContentType = allowedTypes[0] || 'article';
  let maxScore = 0;
  
  for (const [type, keywords] of Object.entries(CONTENT_TYPE_KEYWORDS)) {
    if (!allowedTypes.includes(type as ContentType)) continue;
    
    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score++;
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestType = type as ContentType;
    }
  }
  
  return bestType;
}

// ============================================================
// SENSITIVITY DETECTION
// ============================================================

function detectSensitivityLevel(text: string): ContentSensitivityLevel {
  // Check from most severe to least
  const levels: ContentSensitivityLevel[] = ['extreme', 'high', 'moderate', 'mild', 'none'];
  
  for (const level of levels) {
    const keywords = SENSITIVITY_KEYWORDS[level];
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return level;
      }
    }
  }
  
  return 'none';
}

// ============================================================
// AUDIENCE PROFILE
// ============================================================

function determineAudienceProfile(
  sector: ContentSector,
  sensitivity: ContentSensitivityLevel
): AudienceProfile {
  const sectorDef = SECTOR_DEFINITIONS[sector];
  
  // Override based on sensitivity
  if (sensitivity === 'extreme' || sensitivity === 'high') {
    return 'adult';
  }
  
  if (sensitivity === 'moderate') {
    return 'general';
  }
  
  return sectorDef.defaultAudienceProfile;
}

// ============================================================
// TIMELINE GENERATION
// ============================================================

function generateTimeline(
  body: string,
  sector: ContentSector
): { timeline: TimelineEvent[]; hasTimeline: boolean } {
  // Only generate timelines for historical/case content
  const timelineSectors: ContentSector[] = ['crime_courts', 'archives_buried', 'actor_industry'];
  
  if (!timelineSectors.includes(sector)) {
    return { timeline: [], hasTimeline: false };
  }
  
  const timeline: TimelineEvent[] = [];
  
  // Simple pattern matching for dates
  const datePatterns = [
    /(\d{4})\s*[-:]\s*(.+?)(?:\.|$)/g,  // 2020: Event happened
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/gi,
    /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
  ];
  
  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(body)) !== null) {
      const dateStr = match[0];
      const eventText = match[2] || match[0];
      
      // Extract year from match
      const yearMatch = dateStr.match(/\d{4}/);
      if (yearMatch) {
        timeline.push({
          id: uuidv4(),
          date: yearMatch[0],
          dateApproximate: true,
          title: eventText.slice(0, 50).trim(),
          description: eventText.trim(),
          importance: 'minor',
        });
      }
    }
  }
  
  // Sort by date
  timeline.sort((a, b) => a.date.localeCompare(b.date));
  
  // Mark first and last as major
  if (timeline.length > 0) {
    timeline[0].importance = 'major';
    if (timeline.length > 1) {
      timeline[timeline.length - 1].importance = 'major';
    }
  }
  
  return { timeline, hasTimeline: timeline.length > 0 };
}

// ============================================================
// CONFIDENCE SCORING
// ============================================================

function computeConfidenceScore(
  facts: ExtractedClaim[],
  sources: SourceReference[]
): number {
  if (facts.length === 0) {
    return 0;
  }
  
  // Base score from source count
  let baseScore = Math.min(sources.length * 15, 45); // Max 45 from sources
  
  // Add score from verified facts
  const verifiedFacts = facts.filter(f => f.isVerified);
  const verificationScore = (verifiedFacts.length / facts.length) * 35; // Max 35 from verification
  
  // Add score from source trust levels
  const avgTrust = sources.length > 0
    ? sources.reduce((sum, s) => sum + s.trustLevel, 0) / sources.length
    : 0;
  const trustScore = avgTrust * 20; // Max 20 from trust levels
  
  const totalScore = Math.round(baseScore + verificationScore + trustScore);
  return Math.min(Math.max(totalScore, 0), 100);
}

// ============================================================
// VERIFICATION STATUS
// ============================================================

function determineVerificationStatus(
  confidenceScore: number,
  sourceCount: number
): VerificationStatus {
  if (confidenceScore >= 80 && sourceCount >= 3) {
    return 'verified';
  }
  if (confidenceScore >= 50 && sourceCount >= 1) {
    return 'pending';
  }
  return 'draft';
}

// ============================================================
// KEYWORD EXTRACTION
// ============================================================

function extractKeywords(text: string): string[] {
  // Simple keyword extraction - in production, use NLP library
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why',
    'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'not', 'only', 'same', 'so', 'than', 'too',
    'very', 'just', 'also', 'now', 'this', 'that', 'these', 'those',
  ]);
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
  
  // Count frequency
  const freq: Record<string, number> = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }
  
  // Sort by frequency and return top 20
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

function generateTags(
  keywords: string[],
  sector: ContentSector,
  subsector?: ContentSubsector
): string[] {
  const tags = new Set<string>();
  
  // Add sector as tag
  tags.add(sector.replace('_', '-'));
  
  // Add subsector if present
  if (subsector) {
    tags.add(subsector.replace('_', '-'));
  }
  
  // Add top keywords as tags
  for (const keyword of keywords.slice(0, 5)) {
    tags.add(keyword);
  }
  
  return Array.from(tags);
}

// ============================================================
// CONTEXT DETECTION
// ============================================================

function detectHistoricalPeriod(text: string): string | undefined {
  // Detect decade/era mentions
  const decadePattern = /(\d{4})s|(\d{2})s era/i;
  const match = text.match(decadePattern);
  
  if (match) {
    return match[0];
  }
  
  // Check for era keywords
  const eras = [
    { pattern: /golden era|golden age/i, era: '1950s-1960s' },
    { pattern: /classic era|classics/i, era: '1970s-1990s' },
    { pattern: /modern era|recent/i, era: '2000s-present' },
    { pattern: /silent era|silent film/i, era: '1910s-1930s' },
  ];
  
  for (const { pattern, era } of eras) {
    if (pattern.test(text)) {
      return era;
    }
  }
  
  return undefined;
}

function detectGeoContext(text: string): string | undefined {
  const locations = [
    { pattern: /telangana|hyderabad/i, location: 'Telangana' },
    { pattern: /andhra pradesh|vijayawada|visakhapatnam/i, location: 'Andhra Pradesh' },
    { pattern: /bollywood|mumbai|maharashtra/i, location: 'Maharashtra' },
    { pattern: /kollywood|chennai|tamil nadu/i, location: 'Tamil Nadu' },
    { pattern: /tollywood/i, location: 'Telugu States' },
  ];
  
  for (const { pattern, location } of locations) {
    if (pattern.test(text)) {
      return location;
    }
  }
  
  return undefined;
}

// ============================================================
// BATCH ENHANCEMENT
// ============================================================

/**
 * Enhance multiple content items in batch
 */
export async function enhanceContentBatch(
  inputs: ContentEnhancementInput[]
): Promise<EnhancedContent[]> {
  const results: EnhancedContent[] = [];
  
  for (const input of inputs) {
    const enhanced = await enhanceContent(input);
    results.push(enhanced);
  }
  
  return results;
}

/**
 * Quick sector detection without full enhancement
 */
export function quickDetectSector(text: string): {
  sector: ContentSector;
  confidence: number;
} {
  const scores: Record<ContentSector, number> = {} as Record<ContentSector, number>;
  let maxScore = 0;
  
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    scores[sector as ContentSector] = 0;
    for (const keyword of keywords) {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        scores[sector as ContentSector]++;
      }
    }
    if (scores[sector as ContentSector] > maxScore) {
      maxScore = scores[sector as ContentSector];
    }
  }
  
  let bestSector: ContentSector = 'general';
  for (const [sector, score] of Object.entries(scores)) {
    if (score === maxScore && score > 0) {
      bestSector = sector as ContentSector;
      break;
    }
  }
  
  // Confidence based on keyword matches
  const confidence = maxScore > 0 ? Math.min(maxScore / 5, 1) : 0;
  
  return { sector: bestSector, confidence };
}

