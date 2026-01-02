// AI Caption Generator for Hot Media
// Generates glamour-focused captions with safety rules

import type { CaptionVariant, GlamCategory, AudienceEmotion, GlamAngle, AIGlamAnalysis } from '@/types/media';
import { checkContentSafety, checkEntitySafety } from './safety-checker';

// Caption style templates by category
const CAPTION_TEMPLATES: Record<GlamCategory, string[]> = {
  beach_bikini: [
    '{name} స్టన్నింగ్ బీచ్ లుక్‌లో 🏖️ #BeachVibes #GlamourQueen',
    '{name} సన్‌కిస్డ్ గ్లో తో అద్భుతంగా కనిపిస్తున్నారు ☀️ #VacationMode',
    '{name} బీచ్ ఫ్యాషన్‌లో కిల్లింగ్ ఇట్ 🌊 #BeachBabe #SummerVibes',
  ],
  photoshoot_glam: [
    '{name} లేటెస్ట్ ఫోటోషూట్ నుండి స్టన్నింగ్ క్లిక్స్ 📸 #Photoshoot #GlamourAlert',
    '{name} క్యామెరా ముందు మ్యాజిక్ చేశారు ✨ #BTS #PhotoshootDiaries',
    '{name} ఈ ఫోటోషూట్‌లో అద్భుతంగా కనిపిస్తున్నారు 💫 #GlamourGoals',
  ],
  fashion_event: [
    '{name} ఫ్యాషన్ ఈవెంట్‌లో స్టైలిష్‌గా 👗 #FashionIcon #EventDiaries',
    '{name} ఈ ఈవెంట్‌లో టర్నింగ్ హెడ్స్ 🔥 #RedCarpet #FashionGoals',
    '{name} స్టైల్ స్టేట్‌మెంట్ మేకింగ్ 💃 #FashionWeek #Glamour',
  ],
  magazine_cover: [
    '{name} మ్యాగజైన్ కవర్‌పై స్టన్నింగ్‌గా 📰 #CoverGirl #MagazineShoot',
    '{name} ఈ ఎడిటోరియల్ షూట్‌లో అద్భుతం ✨ #Editorial #GlamourIcon',
    '{name} మ్యాగజైన్ కవర్ షూట్ వైరల్ 🔥 #MagazineCover #IconicShoot',
  ],
  viral_reel: [
    '{name} వైరల్ రీల్ ఇంటర్నెట్ దద్దరిల్లిస్తోంది 🎬 #ViralReel #Trending',
    '{name} ఈ రీల్ మిస్ అవ్వకండి! 📱 #ReelsFire #ViralContent',
    '{name} సోషల్ మీడియాలో ట్రెండింగ్ 🌟 #Viral #MustWatch',
  ],
  red_carpet: [
    '{name} రెడ్ కార్పెట్ మీద స్టన్నింగ్ ఎంట్రీ 👗✨ #RedCarpet #Glamour',
    '{name} ఈ ఈవెంట్‌లో షోస్టాపర్ 🌟 #Premiere #CelebrityStyle',
    '{name} రెడ్ కార్పెట్ లుక్ అద్భుతం 💫 #AwardShow #FashionIcon',
  ],
  gym_fitness: [
    '{name} ఫిట్‌నెస్ గోల్స్ సెట్ చేస్తున్నారు 💪 #FitnessMotivation #GymLife',
    '{name} వర్కౌట్ మోడ్‌లో 🔥 #FitFam #HealthyLifestyle',
    '{name} ఫిట్‌నెస్ జర్నీ ఇన్స్పైరింగ్ 🏋️ #GymGoals #FitAndFab',
  ],
  traditional_glam: [
    '{name} సాంప్రదాయ చీరలో అందంగా 🪷 #SareeGoals #TraditionalBeauty',
    '{name} ఎథ్నిక్ లుక్‌లో స్టన్నింగ్ 🌺 #IndianWear #ElegantLook',
    '{name} ట్రెడిషనల్ ఔట్‌ఫిట్‌లో గ్రేస్‌ఫుల్ 💫 #DesiGlam #ClassicBeauty',
  ],
  western_glam: [
    '{name} వెస్టర్న్ లుక్‌లో స్లేయింగ్ 👠 #WesternStyle #FashionForward',
    '{name} స్టైలిష్ వెస్టర్న్ ఔట్‌ఫిట్‌లో 🔥 #OOTD #StyleIcon',
    '{name} వెస్టర్న్ గ్లామ్ అవతార్‌లో 💃 #ChicStyle #FashionGoals',
  ],
  influencer: [
    '{name} ఇన్‌ఫ్లుయెన్సర్ గేమ్ స్ట్రాంగ్ 🌟 #Influencer #ContentCreator',
    '{name} సోషల్ మీడియా సెన్సేషన్ 📱 #Trending #ViralStar',
    '{name} ఇన్‌ఫ్లుయెన్సర్ లైఫ్ 💫 #DigitalStar #SocialMedia',
  ],
};

// Glam adjectives for AI variation
const GLAM_ADJECTIVES = [
  'stunning', 'gorgeous', 'elegant', 'beautiful', 'glamorous',
  'radiant', 'dazzling', 'breathtaking', 'captivating', 'mesmerizing',
];

// Emoji sets by mood
const MOOD_EMOJIS: Record<AudienceEmotion, string[]> = {
  excitement: ['🔥', '⚡', '💥', '🎉', '✨'],
  admiration: ['😍', '💕', '🌟', '💫', '👏'],
  nostalgia: ['💭', '🕰️', '📸', '🎬', '💝'],
  curiosity: ['👀', '🤔', '✨', '🔍', '💡'],
  bold: ['💪', '🔥', '👊', '💣', '⚡'],
};

/**
 * Detect audience emotion from content context
 */
function detectAudienceEmotion(text: string, category: GlamCategory): AudienceEmotion {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('throwback') || lowerText.includes('old') || lowerText.includes('memory')) {
    return 'nostalgia';
  }
  if (lowerText.includes('viral') || lowerText.includes('trending') || lowerText.includes('new')) {
    return 'excitement';
  }
  if (lowerText.includes('bold') || lowerText.includes('hot') || lowerText.includes('fire')) {
    return 'bold';
  }
  if (lowerText.includes('beautiful') || lowerText.includes('gorgeous') || lowerText.includes('stunning')) {
    return 'admiration';
  }
  
  // Default by category
  const categoryEmotions: Record<GlamCategory, AudienceEmotion> = {
    beach_bikini: 'excitement',
    photoshoot_glam: 'admiration',
    fashion_event: 'admiration',
    magazine_cover: 'admiration',
    viral_reel: 'excitement',
    red_carpet: 'admiration',
    gym_fitness: 'bold',
    traditional_glam: 'admiration',
    western_glam: 'excitement',
    influencer: 'curiosity',
  };
  
  return categoryEmotions[category] || 'admiration';
}

/**
 * Detect glam angle from content
 */
function detectGlamAngle(text: string, category: GlamCategory): GlamAngle {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('fashion') || lowerText.includes('style') || lowerText.includes('outfit')) {
    return 'fashion';
  }
  if (lowerText.includes('viral') || lowerText.includes('trending')) {
    return 'viral';
  }
  if (lowerText.includes('bold') || lowerText.includes('hot') || lowerText.includes('fire')) {
    return 'bold';
  }
  if (lowerText.includes('elegant') || lowerText.includes('grace') || lowerText.includes('classic')) {
    return 'elegant';
  }
  if (lowerText.includes('throwback') || lowerText.includes('classic') || lowerText.includes('old')) {
    return 'classic';
  }
  
  return 'glam';
}

/**
 * Suggest category from content/title
 */
export function suggestCategory(text: string): GlamCategory {
  const lowerText = text.toLowerCase();
  
  const categoryKeywords: Record<GlamCategory, string[]> = {
    beach_bikini: ['beach', 'bikini', 'swimwear', 'pool', 'vacation', 'maldives', 'goa'],
    photoshoot_glam: ['photoshoot', 'shoot', 'bts', 'behind the scenes', 'camera'],
    fashion_event: ['fashion', 'event', 'launch', 'opening', 'inauguration'],
    magazine_cover: ['magazine', 'cover', 'editorial', 'vogue', 'elle', 'cosmopolitan'],
    viral_reel: ['reel', 'viral', 'shorts', 'tiktok', 'trending video'],
    red_carpet: ['red carpet', 'premiere', 'award', 'gala', 'ceremony'],
    gym_fitness: ['gym', 'fitness', 'workout', 'exercise', 'yoga', 'pilates'],
    traditional_glam: ['saree', 'traditional', 'ethnic', 'lehenga', 'festival', 'wedding'],
    western_glam: ['western', 'dress', 'gown', 'casual', 'street style'],
    influencer: ['influencer', 'content', 'social media', 'instagram'],
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      return category as GlamCategory;
    }
  }
  
  return 'photoshoot_glam'; // Default
}

/**
 * Suggest tags from content
 */
export function suggestTags(text: string, category: GlamCategory, entityName?: string): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Entity tag
  if (entityName) {
    tags.push(entityName.replace(/\s+/g, ''));
  }
  
  // Category tag
  tags.push(category.replace('_', ''));
  
  // Common glam tags
  if (lowerText.includes('photo')) tags.push('Photoshoot');
  if (lowerText.includes('video') || lowerText.includes('reel')) tags.push('Video');
  if (lowerText.includes('new') || lowerText.includes('latest')) tags.push('Latest');
  if (lowerText.includes('hot') || lowerText.includes('fire')) tags.push('Hot');
  if (lowerText.includes('trendin')) tags.push('Trending');
  
  // Telugu specific
  tags.push('Telugu');
  tags.push('Tollywood');
  
  return [...new Set(tags)].slice(0, 8);
}

/**
 * Generate caption variants using templates
 */
export function generateCaptionVariants(
  entityName: string,
  category: GlamCategory,
  originalText?: string
): CaptionVariant[] {
  const templates = CAPTION_TEMPLATES[category] || CAPTION_TEMPLATES.photoshoot_glam;
  const emotion = detectAudienceEmotion(originalText || '', category);
  const emojis = MOOD_EMOJIS[emotion];
  
  // Generate 3 variants with different styles
  const styles: Array<'glam' | 'fashion' | 'viral' | 'bold' | 'elegant'> = ['glam', 'fashion', 'bold'];
  
  return templates.slice(0, 3).map((template, index) => {
    const text = template.replace('{name}', entityName);
    const style = styles[index] || 'glam';
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    return {
      text,
      style,
      emoji,
      confidence: 0.7 + Math.random() * 0.25, // 70-95% confidence
    };
  });
}

/**
 * Full AI analysis for glam content
 */
export async function analyzeGlamContent(input: {
  url?: string;
  text?: string;
  entityName?: string;
  entityType?: string;
  platform?: string;
}): Promise<AIGlamAnalysis> {
  const { text = '', entityName = 'Celebrity', entityType, platform } = input;
  
  // Check entity safety first
  if (entityName) {
    const entityCheck = checkEntitySafety(entityName, entityType);
    if (entityCheck.isBlocked) {
      return {
        captions: [],
        suggestedCategory: 'photoshoot_glam',
        suggestedTags: [],
        audienceEmotion: 'admiration',
        glamAngle: 'glam',
        safety: {
          risk: 'blocked',
          flags: ['entity_blocked'],
          blockedReason: entityCheck.reason,
          requiresReview: false,
          autoApproveEligible: false,
        },
        confidence: 0,
      };
    }
  }
  
  // Detect category
  const suggestedCategory = suggestCategory(text);
  
  // Generate captions
  const captions = generateCaptionVariants(entityName, suggestedCategory, text);
  
  // Suggest tags
  const suggestedTags = suggestTags(text, suggestedCategory, entityName);
  
  // Detect emotion and angle
  const audienceEmotion = detectAudienceEmotion(text, suggestedCategory);
  const glamAngle = detectGlamAngle(text, suggestedCategory);
  
  // Run safety check on generated captions
  const bestCaption = captions[0]?.text || text;
  const safety = checkContentSafety({
    text: bestCaption,
    entityName,
    platform,
    isEmbed: platform === 'instagram' || platform === 'youtube' || platform === 'twitter',
  });
  
  // Calculate overall confidence
  const avgConfidence = captions.reduce((sum, c) => sum + c.confidence, 0) / (captions.length || 1);
  
  return {
    captions,
    suggestedCategory,
    suggestedTags,
    audienceEmotion,
    glamAngle,
    safety,
    confidence: avgConfidence,
  };
}

/**
 * Quick caption generation without full analysis
 */
export function quickGenerateCaption(
  entityName: string,
  category: GlamCategory
): string {
  const templates = CAPTION_TEMPLATES[category] || CAPTION_TEMPLATES.photoshoot_glam;
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace('{name}', entityName);
}

// ============================================================
// GLAMOUR CONTENT MODE (Extended AI Pipeline)
// ============================================================

/**
 * Glamour content structure (as per spec)
 * Output: Hook → Why trending → Glamour angle → Social buzz → Past relevance → Fan connect
 */
export interface GlamourContentStructure {
  hook: string;              // 2-3 emotional Telugu lines
  whyTrending: string;       // Why trending now
  glamourAngle: string;      // photoshoot / beach / event / nostalgia
  socialBuzz: string;        // Social buzz summary
  pastRelevance?: string;    // Movies, IPL, awards if applicable
  fanConnect: string;        // Closing fan-connect line
}

/**
 * Full glamour content output
 */
export interface GlamourContentOutput {
  teluguContent: string;           // Full Telugu content
  structure: GlamourContentStructure;
  variants: CaptionVariant[];      // 3 caption variants
  metadata: {
    category: GlamCategory;
    emotion: AudienceEmotion;
    angle: GlamAngle;
    tags: string[];
    confidence: number;
    adSafety: 'safe' | 'needs_review' | 'unsafe';
  };
}

// Hook templates by emotion (Telugu-first)
const HOOK_TEMPLATES: Record<AudienceEmotion, string[]> = {
  excitement: [
    '{name} ఫ్యాన్స్ కోసం మరో స్టన్నింగ్ సర్‌ప్రైజ్! 🔥',
    'వావ్! {name} ఈసారి మరింత స్టైలిష్‌గా 💫',
    '{name} లేటెస్ట్ లుక్ చూస్తే షాకవుతారు! ⚡',
  ],
  admiration: [
    '{name} ఎలగెన్స్ ఎవరూ కాపీ చేయలేరు 💕',
    'బ్యూటీ ఐకాన్ {name} మరో స్టన్నింగ్ అవతార్ 🌟',
    '{name} గ్రేస్ ముందు అందరూ స్తబ్దమే 💫',
  ],
  nostalgia: [
    '{name} ఈ క్లాసిక్ ఫోటో చూస్తే గుర్తొస్తోంది... 📸',
    'థ్రోబ్యాక్! {name} అప్పటి అందం ఇప్పటికీ మరవలేం 💝',
    '{name} ఈ పాత ఫోటో ఫ్యాన్స్ హార్ట్ మెల్ట్ చేసింది 🕰️',
  ],
  curiosity: [
    '{name} కొత్త అవతార్ చూశారా? 👀',
    'ఏమిటి {name} ఈ కొత్త లుక్ రహస్యం? ✨',
    '{name} ఈ ఫోటో వెనుక స్టోరీ తెలుసా? 🔍',
  ],
  bold: [
    '{name} బోల్డ్ లుక్ సోషల్ మీడియాలో సంచలనం! 💪',
    'హాట్! {name} ఈసారి లిమిట్స్ పుష్ చేశారు 🔥',
    '{name} ఫియర్‌లెస్ ఫోటోషూట్ వైరల్! ⚡',
  ],
};

// Why trending templates
const TRENDING_TEMPLATES: Record<GlamCategory, string[]> = {
  beach_bikini: [
    'వేకేషన్ ఫోటోలు షేర్ చేయడంతో ట్రెండింగ్‌లో నిలిచారు.',
    'బీచ్ వేర్‌లో స్టన్నింగ్ లుక్ ఇంటర్నెట్ సెన్సేషన్.',
    'సమ్మర్ వైబ్స్ ఫోటోషూట్ ఫ్యాన్స్ హార్ట్స్ దొంగిలించింది.',
  ],
  photoshoot_glam: [
    'లేటెస్ట్ ఫోటోషూట్ ఫ్యాన్స్‌ని మెస్మరైజ్ చేసింది.',
    'మ్యాగజైన్ షూట్ ఫోటోలు వైరల్ అవుతున్నాయి.',
    'న్యూ ఇయర్ స్పెషల్ ఫోటోషూట్ రిలీజ్.',
  ],
  fashion_event: [
    'ఫ్యాషన్ ఈవెంట్‌లో స్టేజ్ షేక్ చేశారు.',
    'బ్రాండ్ లాంచ్ ఈవెంట్‌లో షో స్టాపర్‌గా నిలిచారు.',
    'ఫ్యాషన్ వీక్‌లో హెడ్ టర్నర్ లుక్.',
  ],
  magazine_cover: [
    'ప్రముఖ మ్యాగజైన్ కవర్‌లో కనిపించారు.',
    'ఎడిటోరియల్ షూట్ ఫోటోలు చర్చనీయాంశం.',
    'కవర్ షూట్ ఫోటోలు సోషల్ మీడియాలో వైరల్.',
  ],
  viral_reel: [
    'రీల్ మిలియన్ వ్యూస్ దాటింది.',
    'డ్యాన్స్ వీడియో ట్రెండింగ్ టాప్‌లో.',
    'షార్ట్ వీడియో సోషల్ మీడియాలో సంచలనం.',
  ],
  red_carpet: [
    'అవార్డ్ ఫంక్షన్‌లో స్టన్నింగ్ ఎంట్రీ.',
    'రెడ్ కార్పెట్ లుక్ ఫ్యాషన్ క్రిటిక్స్ అప్రీషియేషన్.',
    'ప్రీమియర్ లుక్ హైలైట్ ఆఫ్ ది ఈవెంట్.',
  ],
  gym_fitness: [
    'ఫిట్‌నెస్ జర్నీ ఫ్యాన్స్‌ను ఇన్స్పైర్ చేస్తోంది.',
    'వర్కవుట్ వీడియో మోటివేషన్ ఐకాన్‌గా వైరల్.',
    'ట్రాన్స్‌ఫార్మేషన్ ఫోటోస్ ట్రెండింగ్.',
  ],
  traditional_glam: [
    'ట్రెడిషనల్ ఔట్‌ఫిట్‌లో క్లాసీ లుక్ అభిమానుల హృదయాల్లో.',
    'ఫెస్టివల్ స్పెషల్ లుక్ షేర్ చేశారు.',
    'ఎథ్నిక్ వేర్‌లో ఎలిగెంట్ అవతార్.',
  ],
  western_glam: [
    'వెస్టర్న్ ఔట్‌ఫిట్‌లో స్టైలిష్ లుక్.',
    'స్ట్రీట్ స్టైల్ ఫోటోస్ ఫ్యాషన్ గోల్స్.',
    'క్యాజువల్ షిక్ లుక్ ట్రెండింగ్.',
  ],
  influencer: [
    'కంటెంట్ క్రియేటర్‌గా న్యూ హైట్స్.',
    'ఇన్‌ఫ్లుయెన్సర్ గేమ్ స్ట్రాంగ్.',
    'సోషల్ మీడియా ప్రెజెన్స్ గ్రో అవుతోంది.',
  ],
};

// Fan connect closing lines
const FAN_CONNECT_LINES = [
  '{name} ఫ్యాన్స్ ఈ ఫోటోలు చూసి ప్రౌడ్ ఫీల్ అవుతున్నారు! 🙌',
  'మీ ఫేవరేట్ {name} మరిన్ని సర్‌ప్రైజెస్ తీసుకువస్తారు! 💫',
  '{name} జర్నీ చూస్తే ప్రతి ఫ్యాన్ హ్యాపీ! 💝',
  'మీరు కూడా {name} ఫ్యాన్ అయితే షేర్ చేయండి! 🔁',
  '{name} ను ఫాలో చేస్తే మిస్ అవ్వరు! 📱',
];

/**
 * Generate full glamour content structure
 * REUSE: Extends existing caption generation with structured format
 */
export async function generateGlamourContent(input: {
  entityName: string;
  category?: GlamCategory;
  context?: string;
  pastMovies?: string[];
  pastAchievements?: string[];
  platform?: string;
}): Promise<GlamourContentOutput> {
  const {
    entityName,
    category = suggestCategory(input.context || ''),
    context = '',
    pastMovies = [],
    pastAchievements = [],
    platform,
  } = input;
  
  // Detect emotion and angle
  const emotion = detectAudienceEmotion(context, category);
  const angle = detectGlamAngle(context, category);
  
  // Generate hook
  const hookTemplates = HOOK_TEMPLATES[emotion];
  const hook = hookTemplates[Math.floor(Math.random() * hookTemplates.length)]
    .replace('{name}', entityName);
  
  // Generate why trending
  const trendingTemplates = TRENDING_TEMPLATES[category];
  const whyTrending = trendingTemplates[Math.floor(Math.random() * trendingTemplates.length)];
  
  // Glamour angle description
  const glamourAngleMap: Record<GlamAngle, string> = {
    glam: 'గ్లామరస్ ఫోటోషూట్ స్టైల్‌లో',
    fashion: 'ఫ్యాషన్ ఫార్వర్డ్ లుక్‌తో',
    viral: 'వైరల్ మోమెంట్‌తో',
    bold: 'బోల్డ్ అండ్ బ్యూటిఫుల్ అవతార్‌లో',
    elegant: 'ఎలిగెంట్ అండ్ క్లాసీ స్టైల్‌లో',
    classic: 'క్లాసిక్ థ్రోబ్యాక్ వైబ్స్‌తో',
  };
  const glamourAngle = glamourAngleMap[angle] || 'స్టన్నింగ్ న్యూ లుక్‌తో';
  
  // Social buzz
  const socialBuzz = `సోషల్ మీడియాలో ఫ్యాన్స్ ఈ ఫోటోలను షేర్ చేస్తూ ${entityName} అందానికి ట్రిబ్యూట్ ఇస్తున్నారు.`;
  
  // Past relevance (if available)
  let pastRelevance: string | undefined;
  if (pastMovies.length > 0 || pastAchievements.length > 0) {
    const movieMention = pastMovies.length > 0 ? 
      `${pastMovies.slice(0, 2).join(', ')} సినిమాల్లో మెప్పించిన ${entityName}` : '';
    const achievementMention = pastAchievements.length > 0 ?
      `${pastAchievements[0]} అచీవ్‌మెంట్` : '';
    pastRelevance = [movieMention, achievementMention].filter(Boolean).join('. ');
  }
  
  // Fan connect
  const fanConnect = FAN_CONNECT_LINES[Math.floor(Math.random() * FAN_CONNECT_LINES.length)]
    .replace('{name}', entityName);
  
  // Build structure
  const structure: GlamourContentStructure = {
    hook,
    whyTrending,
    glamourAngle,
    socialBuzz,
    pastRelevance,
    fanConnect,
  };
  
  // Generate full Telugu content
  const teluguContent = [
    hook,
    '',
    whyTrending,
    glamourAngle,
    '',
    socialBuzz,
    pastRelevance ? `\n${pastRelevance}` : '',
    '',
    fanConnect,
  ].filter(Boolean).join('\n');
  
  // Generate caption variants
  const variants = generateCaptionVariants(entityName, category, context);
  
  // Generate tags
  const tags = suggestTags(context, category, entityName);
  
  // Check safety
  const safety = checkContentSafety({
    text: teluguContent,
    entityName,
    platform,
    isEmbed: platform === 'instagram' || platform === 'youtube',
  });
  
  // Calculate confidence
  const avgVariantConfidence = variants.reduce((sum, v) => sum + v.confidence, 0) / variants.length;
  const confidence = safety.risk === 'low' ? avgVariantConfidence : avgVariantConfidence * 0.7;
  
  // AdSense safety
  let adSafety: 'safe' | 'needs_review' | 'unsafe' = 'safe';
  if (safety.risk === 'medium' || safety.requiresReview) {
    adSafety = 'needs_review';
  } else if (safety.risk === 'blocked') {
    adSafety = 'unsafe';
  }
  
  return {
    teluguContent,
    structure,
    variants,
    metadata: {
      category,
      emotion,
      angle,
      tags,
      confidence,
      adSafety,
    },
  };
}

/**
 * Check if content follows AdSense guidelines
 * Telugu-first, subtle sensuality, no clickbait
 */
export function isAdSenseSafe(content: string, entityName: string): {
  safe: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Check for clickbait patterns
  const clickbaitPatterns = [
    /shocking/i, /unbelievable/i, /won't believe/i, /jaw dropping/i,
    /షాకింగ్/i, /నమ్మలేం/i, /అంతే అయిపోయింది/i,
  ];
  
  for (const pattern of clickbaitPatterns) {
    if (pattern.test(content)) {
      warnings.push('Clickbait language detected');
      break;
    }
  }
  
  // Check for explicit language
  const explicitPatterns = [
    /sexy/i, /hot body/i, /revealing/i, /seductive/i,
    /సెక్సీ/i, /హాట్ బాడీ/i,
  ];
  
  for (const pattern of explicitPatterns) {
    if (pattern.test(content)) {
      warnings.push('Explicit language detected');
      break;
    }
  }
  
  // Check content length (too short = low quality)
  if (content.length < 100) {
    warnings.push('Content too short');
  }
  
  return {
    safe: warnings.length === 0,
    warnings,
  };
}

