/**
 * Navigation Configuration - Single Source of Truth
 * 
 * CATCHY NAMING CONVENTION:
 * - "Glam Zone" replaces "Hot"
 * - Creative Telugu names for sections
 * - All names are engaging and memorable
 */

export interface NavItem {
  id: string;
  label: string;
  labelEn: string;
  emoji?: string;
  href: string;
  gradient?: string;
  textColor?: string;
  isNew?: boolean;
  isGlam?: boolean;  // Replaces isHot
  isHot?: boolean;
  children?: NavItem[];
}

export interface NavGroup {
  id: string;
  label: string;
  labelEn: string;
  items: NavItem[];
}

// ============================================================
// CATCHY NAMES MAPPING
// ============================================================

export const CATCHY_NAMES = {
  // Main Sections
  glam: { te: '✨ గ్లామ్ జోన్', en: '✨ Glam Zone' },
  glamWorld: { te: '🌟 అందాల లోకం', en: '🌟 Glam World' },
  starGlow: { te: '⭐ స్టార్ గ్లో', en: '⭐ Star Glow' },
  
  // Entertainment
  filmBeat: { te: '🎥 సినీ బీట్', en: '🎥 Film Beat' },
  starPulse: { te: '💫 స్టార్ పల్స్', en: '💫 Star Pulse' },
  tollywoodTalk: { te: '🎭 టాలీవుడ్ టాక్', en: '🎭 Tollywood Talk' },
  
  // Sports
  sportsMasala: { te: '🏆 స్పోర్ట్స్ మసాలా', en: '🏆 Sports Masala' },
  cricketAdda: { te: '🏏 క్రికెట్ అడ్డా', en: '🏏 Cricket Adda' },
  
  // Politics
  politicalPulse: { te: '🗳️ పొలిటికల్ పల్స్', en: '🗳️ Political Pulse' },
  
  // Trending
  viralWave: { te: '🌊 వైరల్ వేవ్', en: '🌊 Viral Wave' },
  buzzFeed: { te: '🔥 బజ్ ఫీడ్', en: '🔥 Buzz Feed' },
  
  // Gossip
  masalaBytes: { te: '🌶️ మసాలా బైట్స్', en: '🌶️ Masala Bytes' },
  whispers: { te: '🤫 విస్పర్స్', en: '🤫 Whispers' },
  
  // Crime
  crimeFile: { te: '🔍 క్రైమ్ ఫైల్', en: '🔍 Crime File' },
  
  // Lifestyle
  lifeVibes: { te: '💖 లైఫ్ వైబ్స్', en: '💖 Life Vibes' },
  healthHub: { te: '🏥 హెల్త్ హబ్', en: '🏥 Health Hub' },
  foodFiesta: { te: '🍕 ఫుడ్ ఫీస్టా', en: '🍕 Food Fiesta' },
  
  // Astrology
  starSigns: { te: '🔮 రాశి రహస్యం', en: '🔮 Star Signs' },
  
  // Photos & Videos
  photoFlash: { te: '📸 ఫోటో ఫ్లాష్', en: '📸 Photo Flash' },
  videoWave: { te: '🎬 వీడియో వేవ్', en: '🎬 Video Wave' },
  
  // Fun
  funCorner: { te: '🎮 ఫన్ కార్నర్', en: '🎮 Fun Corner' },
  memeMasala: { te: '😂 మీమ్ మసాలా', en: '😂 Meme Masala' },
  quizTime: { te: '🧠 క్విజ్ టైమ్', en: '🧠 Quiz Time' },
  
  // Reviews
  movieMeter: { te: '🎬 మూవీ మీటర్', en: '🎬 Movie Meter' },
  
  // News
  newsWorld: { te: '🌍 వార్తల లోకం', en: '🌍 News World' },
  globalBeat: { te: '🌍 గ్లోబల్ బీట్', en: '🌍 Global Beat' },
  
  // Tech
  techTalk: { te: '💻 టెక్ టాక్', en: '💻 Tech Talk' },
  
  // Business
  bizBuzz: { te: '💼 బిజ్ బజ్', en: '💼 Biz Buzz' },
  
  // Jobs
  jobJunction: { te: '💼 జాబ్ జంక్షన్', en: '💼 Job Junction' },
};

// ============================================================
// MAIN NAVIGATION (Header - Consolidated)
// ============================================================

// Entertainment Hub - Merged section with dropdown
export const ENTERTAINMENT_HUB: NavItem = {
  id: 'entertainment-hub',
  label: '🎬 వినోదం',
  labelEn: 'Entertainment',
  href: '/category/entertainment',
  children: [
    { id: 'glam', label: '✨ గ్లామ్ జోన్', labelEn: 'Glam Zone', href: '/hot', isGlam: true },
    { id: 'gossip', label: '🌶️ మసాలా బైట్స్', labelEn: 'Masala Bytes', href: '/category/gossip' },
    { id: 'entertainment', label: '🎥 సినీ బీట్', labelEn: 'Film Beat', href: '/category/entertainment' },
    { id: 'trending', label: '🌊 వైరల్ వేవ్', labelEn: 'Viral Wave', href: '/category/trending' },
    { id: 'reviews', label: '🎬 మూవీ మీటర్', labelEn: 'Movie Meter', href: '/reviews' },
  ],
};

// Primary Navigation Items (Top Bar)
export const PRIMARY_NAV: NavItem[] = [
  { id: 'home', label: '🏠 మన ఇల్లు', labelEn: 'Home', href: '/' },
  ENTERTAINMENT_HUB,
  { id: 'sports', label: '🏆 స్పోర్ట్స్ మసాలా', labelEn: 'Sports Masala', href: '/category/sports' },
  { id: 'politics', label: '🗳️ పొలిటికల్ పల్స్', labelEn: 'Political Pulse', href: '/category/politics' },
];

// Featured Pills (Gradient buttons in header) - GLAM instead of HOT
export const FEATURED_PILLS: NavItem[] = [
  { 
    id: 'glam', 
    label: '✨ గ్లామ్', 
    labelEn: 'Glam', 
    href: '/hot', 
    gradient: 'from-purple-500 to-pink-500',
    textColor: 'text-white',
    isGlam: true,
  },
  { 
    id: 'reviews', 
    label: '🎬 రివ్యూలు', 
    labelEn: 'Reviews', 
    href: '/reviews', 
    gradient: 'from-yellow-500 to-amber-500',
    textColor: 'text-black',
  },
];

// More Menu - Organized into 4 clear sections with card styling
export interface MenuSection {
  id: string;
  title: string;
  titleEn: string;
  emoji: string;
  gradient: string;
  items: NavItem[];
}

export const MORE_MENU_SECTIONS: MenuSection[] = [
  {
    id: 'glam-entertainment',
    title: '✨ గ్లామ్ & వినోదం',
    titleEn: '✨ Glam & Entertainment',
    emoji: '✨',
    gradient: 'from-purple-500 to-pink-500',
    items: [
      { id: 'glam', label: 'గ్లామ్ జోన్', labelEn: 'Glam Zone', emoji: '✨', href: '/hot', isGlam: true },
      { id: 'viral', label: 'వైరల్ వేవ్', labelEn: 'Viral Wave', emoji: '🌊', href: '/category/viral', isHot: true },
      { id: 'celebrities', label: 'స్టార్ ఫైల్', labelEn: 'Star File', emoji: '🌟', href: '/celebrities' },
      { id: 'movies', label: 'సినీ తాజా', labelEn: 'Cine Fresh', emoji: '🎥', href: '/movies' },
      { id: 'reviews', label: 'మూవీ మీటర్', labelEn: 'Movie Meter', emoji: '🎬', href: '/reviews' },
      { id: 'photos', label: 'ఫోటో ఫ్లాష్', labelEn: 'Photo Flash', emoji: '📸', href: '/photos', isNew: true },
    ],
  },
  {
    id: 'news-world',
    title: '🌍 వార్తల లోకం',
    titleEn: '🌍 News World',
    emoji: '🌍',
    gradient: 'from-blue-500 to-indigo-600',
    items: [
      { id: 'crime', label: 'క్రైమ్ ఫైల్', labelEn: 'Crime File', emoji: '🔍', href: '/category/crime', isNew: true },
      { id: 'world', label: 'గ్లోబల్ బీట్', labelEn: 'Global Beat', emoji: '🌍', href: '/category/world' },
      { id: 'business', label: 'బిజ్ బజ్', labelEn: 'Biz Buzz', emoji: '💼', href: '/category/business' },
      { id: 'tech', label: 'టెక్ టాక్', labelEn: 'Tech Talk', emoji: '💻', href: '/category/tech', isNew: true },
      { id: 'editorial', label: 'సంపాదకీయం', labelEn: 'Editorial', emoji: '📝', href: '/editorial' },
    ],
  },
  {
    id: 'life-vibes',
    title: '💖 లైఫ్ వైబ్స్',
    titleEn: '💖 Life Vibes',
    emoji: '💖',
    gradient: 'from-pink-500 to-rose-500',
    items: [
      { id: 'health', label: 'హెల్త్ హబ్', labelEn: 'Health Hub', emoji: '🏥', href: '/category/health', isNew: true },
      { id: 'lifestyle', label: 'లైఫ్ స్టైల్', labelEn: 'Lifestyle', emoji: '✨', href: '/category/lifestyle', isNew: true },
      { id: 'astrology', label: 'రాశి రహస్యం', labelEn: 'Star Signs', emoji: '🔮', href: '/astrology', isNew: true },
      { id: 'food', label: 'ఫుడ్ ఫీస్టా', labelEn: 'Food Fiesta', emoji: '🍕', href: '/category/food', isNew: true },
      { id: 'videos', label: 'వీడియో వేవ్', labelEn: 'Video Wave', emoji: '🎬', href: '/videos', isNew: true },
    ],
  },
  {
    id: 'fun-corner',
    title: '🎮 ఫన్ కార్నర్',
    titleEn: '🎮 Fun Corner',
    emoji: '🎮',
    gradient: 'from-emerald-500 to-teal-500',
    items: [
      { id: 'games', label: 'గేమ్ జోన్', labelEn: 'Game Zone', emoji: '🎮', href: '/games' },
      { id: 'memes', label: 'మీమ్ మసాలా', labelEn: 'Meme Masala', emoji: '😂', href: '/memes', isNew: true },
      { id: 'quizzes', label: 'క్విజ్ టైమ్', labelEn: 'Quiz Time', emoji: '🧠', href: '/quizzes', isNew: true },
      { id: 'stories', label: 'కథల కొలువు', labelEn: 'Story Corner', emoji: '📖', href: '/stories' },
      { id: 'webSeries', label: 'వెబ్ వరల్డ్', labelEn: 'Web World', emoji: '📺', href: '/web-series' },
      { id: 'jobs', label: 'జాబ్ జంక్షన్', labelEn: 'Job Junction', emoji: '💼', href: '/jobs', isNew: true },
    ],
  },
];

// ============================================================
// CATEGORY BAR (Secondary Nav - Below Header)
// ============================================================

export const CATEGORY_BAR: NavItem[] = [
  { id: 'home', label: '🏠 హోమ్', labelEn: 'Home', href: '/' },
  { id: 'glam', label: '✨ గ్లామ్', labelEn: 'Glam', href: '/hot', isGlam: true },
  { id: 'gossip', label: '🌶️ గాసిప్', labelEn: 'Gossip', href: '/category/gossip' },
  { id: 'sports', label: '🏏 స్పోర్ట్స్', labelEn: 'Sports', href: '/category/sports' },
  { id: 'politics', label: '🏛️ పాలిటిక్స్', labelEn: 'Politics', href: '/category/politics' },
  { id: 'entertainment', label: '🎬 వినోదం', labelEn: 'Entertainment', href: '/category/entertainment' },
  { id: 'trending', label: '📈 ట్రెండింగ్', labelEn: 'Trending', href: '/category/trending' },
];

// ============================================================
// QUICK LINKS (Sidebar & Mobile Bottom Nav)
// ============================================================

export const QUICK_LINKS: NavItem[] = [
  { id: 'home', label: 'హోమ్', labelEn: 'Home', emoji: '🏠', href: '/' },
  { id: 'glam', label: 'గ్లామ్ జోన్', labelEn: 'Glam Zone', emoji: '✨', href: '/hot' },
  { id: 'trending', label: 'ట్రెండింగ్', labelEn: 'Trending', emoji: '📈', href: '/category/trending' },
  { id: 'entertainment', label: 'వినోదం', labelEn: 'Entertainment', emoji: '🎬', href: '/category/entertainment' },
  { id: 'games', label: 'గేమ్ జోన్', labelEn: 'Game Zone', emoji: '🎮', href: '/games' },
];

// ============================================================
// CATEGORY METADATA (Colors & Styles)
// ============================================================

export const CATEGORY_META: Record<string, {
  color: string;
  gradient: string;
  bgColor: string;
  glowColor: string;
  icon: string;
  name: { te: string; en: string };
  description: { te: string; en: string };
}> = {
  // Glam (formerly Hot)
  glam: {
    color: '#9b5de5',
    gradient: 'from-purple-500 to-pink-500',
    bgColor: 'rgba(155, 93, 229, 0.12)',
    glowColor: 'rgba(155, 93, 229, 0.4)',
    icon: '✨',
    name: { te: 'గ్లామ్ జోన్', en: 'Glam Zone' },
    description: { te: 'సెలబ్రిటీల అందాల ఫోటోలు, ఫ్యాషన్', en: 'Celebrity glamour photos, fashion' },
  },
  hot: {
    color: '#9b5de5',
    gradient: 'from-purple-500 to-pink-500',
    bgColor: 'rgba(155, 93, 229, 0.12)',
    glowColor: 'rgba(155, 93, 229, 0.4)',
    icon: '✨',
    name: { te: 'గ్లామ్ జోన్', en: 'Glam Zone' },
    description: { te: 'సెలబ్రిటీల అందాల ఫోటోలు, ఫ్యాషన్', en: 'Celebrity glamour photos, fashion' },
  },
  gossip: {
    color: '#f72585',
    gradient: 'from-pink-500 to-fuchsia-600',
    bgColor: 'rgba(247, 37, 133, 0.12)',
    glowColor: 'rgba(247, 37, 133, 0.4)',
    icon: '🌶️',
    name: { te: 'మసాలా బైట్స్', en: 'Masala Bytes' },
    description: { te: 'సెలబ్రిటీల గాసిప్ వార్తలు', en: 'Celebrity gossip news' },
  },
  entertainment: {
    color: '#7209b7',
    gradient: 'from-purple-600 to-indigo-600',
    bgColor: 'rgba(114, 9, 183, 0.12)',
    glowColor: 'rgba(114, 9, 183, 0.4)',
    icon: '🎥',
    name: { te: 'సినీ బీట్', en: 'Film Beat' },
    description: { te: 'సినిమా, టీవీ వినోద వార్తలు', en: 'Cinema, TV entertainment news' },
  },
  reviews: {
    color: '#ffd60a',
    gradient: 'from-yellow-400 to-amber-500',
    bgColor: 'rgba(255, 214, 10, 0.12)',
    glowColor: 'rgba(255, 214, 10, 0.4)',
    icon: '🎬',
    name: { te: 'మూవీ మీటర్', en: 'Movie Meter' },
    description: { te: 'సినిమా రివ్యూలు, రేటింగ్స్', en: 'Movie reviews, ratings' },
  },
  trending: {
    color: '#ff006e',
    gradient: 'from-pink-600 to-rose-600',
    bgColor: 'rgba(255, 0, 110, 0.12)',
    glowColor: 'rgba(255, 0, 110, 0.4)',
    icon: '🌊',
    name: { te: 'వైరల్ వేవ్', en: 'Viral Wave' },
    description: { te: 'ట్రెండింగ్ టాపిక్స్', en: 'Trending topics' },
  },
  sports: {
    color: '#06d6a0',
    gradient: 'from-emerald-500 to-teal-500',
    bgColor: 'rgba(6, 214, 160, 0.12)',
    glowColor: 'rgba(6, 214, 160, 0.4)',
    icon: '🏆',
    name: { te: 'స్పోర్ట్స్ మసాలా', en: 'Sports Masala' },
    description: { te: 'క్రికెట్, ఫుట్‌బాల్ వార్తలు', en: 'Cricket, Football news' },
  },
  politics: {
    color: '#4361ee',
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'rgba(67, 97, 238, 0.12)',
    glowColor: 'rgba(67, 97, 238, 0.4)',
    icon: '🗳️',
    name: { te: 'పొలిటికల్ పల్స్', en: 'Political Pulse' },
    description: { te: 'రాజకీయ వార్తలు', en: 'Political news' },
  },
  crime: {
    color: '#d00000',
    gradient: 'from-red-600 to-rose-700',
    bgColor: 'rgba(208, 0, 0, 0.12)',
    glowColor: 'rgba(208, 0, 0, 0.4)',
    icon: '🔍',
    name: { te: 'క్రైమ్ ఫైల్', en: 'Crime File' },
    description: { te: 'నేర వార్తలు', en: 'Crime news' },
  },
  viral: {
    color: '#ff006e',
    gradient: 'from-pink-600 to-purple-600',
    bgColor: 'rgba(255, 0, 110, 0.12)',
    glowColor: 'rgba(255, 0, 110, 0.4)',
    icon: '🌊',
    name: { te: 'వైరల్ వేవ్', en: 'Viral Wave' },
    description: { te: 'వైరల్ వీడియోలు', en: 'Viral videos' },
  },
  health: {
    color: '#38b000',
    gradient: 'from-green-500 to-lime-500',
    bgColor: 'rgba(56, 176, 0, 0.12)',
    glowColor: 'rgba(56, 176, 0, 0.4)',
    icon: '🏥',
    name: { te: 'హెల్త్ హబ్', en: 'Health Hub' },
    description: { te: 'ఆరోగ్యం, ఫిట్‌నెస్', en: 'Health, Fitness' },
  },
  lifestyle: {
    color: '#fb5607',
    gradient: 'from-orange-500 to-pink-500',
    bgColor: 'rgba(251, 86, 7, 0.12)',
    glowColor: 'rgba(251, 86, 7, 0.4)',
    icon: '✨',
    name: { te: 'లైఫ్ వైబ్స్', en: 'Life Vibes' },
    description: { te: 'లైఫ్‌స్టైల్, ఫ్యాషన్', en: 'Lifestyle, Fashion' },
  },
  astrology: {
    color: '#9d4edd',
    gradient: 'from-purple-500 to-violet-600',
    bgColor: 'rgba(157, 78, 221, 0.12)',
    glowColor: 'rgba(157, 78, 221, 0.4)',
    icon: '🔮',
    name: { te: 'రాశి రహస్యం', en: 'Star Signs' },
    description: { te: 'రాశిఫలాలు', en: 'Horoscope' },
  },
  food: {
    color: '#FFC107',
    gradient: 'from-amber-400 to-orange-500',
    bgColor: 'rgba(255, 193, 7, 0.12)',
    glowColor: 'rgba(255, 193, 7, 0.4)',
    icon: '🍕',
    name: { te: 'ఫుడ్ ఫీస్టా', en: 'Food Fiesta' },
    description: { te: 'వంటకాలు, రెసిపీలు', en: 'Recipes, Food' },
  },
  tech: {
    color: '#00b4d8',
    gradient: 'from-cyan-500 to-blue-600',
    bgColor: 'rgba(0, 180, 216, 0.12)',
    glowColor: 'rgba(0, 180, 216, 0.4)',
    icon: '💻',
    name: { te: 'టెక్ టాక్', en: 'Tech Talk' },
    description: { te: 'టెక్నాలజీ వార్తలు', en: 'Technology news' },
  },
  world: {
    color: '#8338ec',
    gradient: 'from-violet-600 to-purple-700',
    bgColor: 'rgba(131, 56, 236, 0.12)',
    glowColor: 'rgba(131, 56, 236, 0.4)',
    icon: '🌍',
    name: { te: 'గ్లోబల్ బీట్', en: 'Global Beat' },
    description: { te: 'అంతర్జాతీయ వార్తలు', en: 'International news' },
  },
  business: {
    color: '#ffd60a',
    gradient: 'from-yellow-400 to-amber-500',
    bgColor: 'rgba(255, 214, 10, 0.12)',
    glowColor: 'rgba(255, 214, 10, 0.4)',
    icon: '💼',
    name: { te: 'బిజ్ బజ్', en: 'Biz Buzz' },
    description: { te: 'వ్యాపార వార్తలు', en: 'Business news' },
  },
  games: {
    color: '#1E88E5',
    gradient: 'from-blue-500 to-cyan-500',
    bgColor: 'rgba(30, 136, 229, 0.12)',
    glowColor: 'rgba(30, 136, 229, 0.4)',
    icon: '🎮',
    name: { te: 'గేమ్ జోన్', en: 'Game Zone' },
    description: { te: 'గేమ్స్, టిప్స్', en: 'Games, Tips' },
  },
  memes: {
    color: '#ff006e',
    gradient: 'from-pink-500 to-orange-500',
    bgColor: 'rgba(255, 0, 110, 0.12)',
    glowColor: 'rgba(255, 0, 110, 0.4)',
    icon: '😂',
    name: { te: 'మీమ్ మసాలా', en: 'Meme Masala' },
    description: { te: 'ఫన్నీ మీమ్స్', en: 'Funny memes' },
  },
  quizzes: {
    color: '#8E24AA',
    gradient: 'from-purple-600 to-pink-600',
    bgColor: 'rgba(142, 36, 170, 0.12)',
    glowColor: 'rgba(142, 36, 170, 0.4)',
    icon: '🧠',
    name: { te: 'క్విజ్ టైమ్', en: 'Quiz Time' },
    description: { te: 'క్విజ్‌లు', en: 'Quizzes' },
  },
  editorial: {
    color: '#607D8B',
    gradient: 'from-gray-500 to-gray-600',
    bgColor: 'rgba(96, 125, 139, 0.12)',
    glowColor: 'rgba(96, 125, 139, 0.4)',
    icon: '📝',
    name: { te: 'సంపాదకీయం', en: 'Editorial' },
    description: { te: 'అభిప్రాయాలు', en: 'Opinions' },
  },
  jobs: {
    color: '#00BCD4',
    gradient: 'from-cyan-400 to-teal-500',
    bgColor: 'rgba(0, 188, 212, 0.12)',
    glowColor: 'rgba(0, 188, 212, 0.4)',
    icon: '💼',
    name: { te: 'జాబ్ జంక్షన్', en: 'Job Junction' },
    description: { te: 'ఉద్యోగ వార్తలు', en: 'Job news' },
  },
  stories: {
    color: '#4CAF50',
    gradient: 'from-green-500 to-emerald-600',
    bgColor: 'rgba(76, 175, 80, 0.12)',
    glowColor: 'rgba(76, 175, 80, 0.4)',
    icon: '📖',
    name: { te: 'కథల కొలువు', en: 'Story Corner' },
    description: { te: 'తెలుగు జీవిత కథలు', en: 'Telugu life stories' },
  },
  webSeries: {
    color: '#e63946',
    gradient: 'from-red-500 to-rose-600',
    bgColor: 'rgba(230, 57, 70, 0.12)',
    glowColor: 'rgba(230, 57, 70, 0.4)',
    icon: '📺',
    name: { te: 'వెబ్ వరల్డ్', en: 'Web World' },
    description: { te: 'వెబ్ సిరీస్ రివ్యూలు', en: 'Web series reviews' },
  },
  photos: {
    color: '#9c27b0',
    gradient: 'from-purple-500 to-pink-500',
    bgColor: 'rgba(156, 39, 176, 0.12)',
    glowColor: 'rgba(156, 39, 176, 0.4)',
    icon: '📸',
    name: { te: 'ఫోటో ఫ్లాష్', en: 'Photo Flash' },
    description: { te: 'ఫోటో గ్యాలరీలు', en: 'Photo galleries' },
  },
  videos: {
    color: '#f44336',
    gradient: 'from-orange-500 to-red-500',
    bgColor: 'rgba(244, 67, 54, 0.12)',
    glowColor: 'rgba(244, 67, 54, 0.4)',
    icon: '🎬',
    name: { te: 'వీడియో వేవ్', en: 'Video Wave' },
    description: { te: 'వీడియో న్యూస్, క్లిప్స్', en: 'Video news, clips' },
  },
  celebrities: {
    color: '#ffb703',
    gradient: 'from-yellow-400 to-orange-500',
    bgColor: 'rgba(255, 183, 3, 0.12)',
    glowColor: 'rgba(255, 183, 3, 0.4)',
    icon: '🌟',
    name: { te: 'స్టార్ ఫైల్', en: 'Star File' },
    description: { te: 'సెలబ్రిటీ ప్రొఫైల్స్', en: 'Celebrity profiles' },
  },
  movies: {
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-600',
    bgColor: 'rgba(139, 92, 246, 0.12)',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    icon: '🎥',
    name: { te: 'సినీ తాజా', en: 'Cine Fresh' },
    description: { te: 'మూవీ న్యూస్', en: 'Movie news' },
  },
};

// ============================================================
// FOOTER NAVIGATION
// ============================================================

export const FOOTER_LINKS = {
  about: [
    { href: '/about', label: { te: '🏢 మా గురించి', en: '🏢 About Us' } },
    { href: '/contact', label: { te: '📞 సంప్రదించండి', en: '📞 Contact' } },
    { href: '/advertise', label: { te: '📣 ప్రకటనలు', en: '📣 Advertise' } },
  ],
  legal: [
    { href: '/privacy', label: { te: '🔒 గోప్యతా విధానం', en: '🔒 Privacy Policy' } },
    { href: '/terms', label: { te: '📜 నిబంధనలు', en: '📜 Terms of Use' } },
    { href: '/disclaimer', label: { te: '⚠️ నిరాకరణ', en: '⚠️ Disclaimer' } },
  ],
  social: [
    { href: 'https://twitter.com/teluguvibes', label: 'Twitter', icon: 'twitter' },
    { href: 'https://instagram.com/teluguvibes', label: 'Instagram', icon: 'instagram' },
    { href: 'https://youtube.com/@teluguvibes', label: 'YouTube', icon: 'youtube' },
    { href: 'https://facebook.com/teluguvibes', label: 'Facebook', icon: 'facebook' },
  ],
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get category metadata by ID
 */
export function getCategoryMeta(id: string) {
  return CATEGORY_META[id] || {
    color: 'var(--brand-primary)',
    gradient: 'from-gray-500 to-gray-600',
    bgColor: 'var(--bg-hover)',
    glowColor: 'rgba(255, 107, 0, 0.3)',
    icon: '📰',
    name: { te: id, en: id },
    description: { te: '', en: '' },
  };
}

/**
 * Get all navigation items for mobile menu
 */
export function getAllNavItems(): NavGroup[] {
  return [
    { 
      id: 'main', 
      label: 'ప్రధాన', 
      labelEn: 'Main', 
      items: [
        { id: 'home', label: '🏠 హోమ్', labelEn: 'Home', href: '/' },
        { id: 'glam', label: '✨ గ్లామ్', labelEn: 'Glam', href: '/hot', isGlam: true },
        { id: 'reviews', label: '🎬 రివ్యూలు', labelEn: 'Reviews', href: '/reviews' },
      ]
    },
    { 
      id: 'entertainment', 
      label: 'వినోదం', 
      labelEn: 'Entertainment', 
      items: ENTERTAINMENT_HUB.children || []
    },
    { 
      id: 'news', 
      label: 'వార్తలు', 
      labelEn: 'News', 
      items: [
        { id: 'sports', label: '🏏 స్పోర్ట్స్', labelEn: 'Sports', href: '/category/sports' },
        { id: 'politics', label: '🏛️ రాజకీయాలు', labelEn: 'Politics', href: '/category/politics' },
      ]
    },
  ];
}

/**
 * Get category bar items
 */
export function getCategoryBarItems() {
  return {
    primary: CATEGORY_BAR.slice(0, 5),
    more: CATEGORY_BAR.slice(5),
  };
}

/**
 * Get entertainment hub items (for mega menu)
 */
export function getEntertainmentItems() {
  return ENTERTAINMENT_HUB.children || [];
}

/**
 * Get localized label for a nav item
 */
export function getLocalizedLabel(item: NavItem, lang: 'te' | 'en'): string {
  return lang === 'en' ? item.labelEn : item.label;
}

/**
 * Get localized section title
 */
export function getLocalizedSectionTitle(section: MenuSection, lang: 'te' | 'en'): string {
  return lang === 'en' ? section.titleEn : section.title;
}

/**
 * Get localized category name
 */
export function getLocalizedCategoryName(categoryId: string, lang: 'te' | 'en'): string {
  const meta = CATEGORY_META[categoryId];
  if (!meta) return categoryId;
  return meta.name[lang];
}

/**
 * Get localized category description
 */
export function getLocalizedCategoryDescription(categoryId: string, lang: 'te' | 'en'): string {
  const meta = CATEGORY_META[categoryId];
  if (!meta) return '';
  return meta.description[lang];
}

/**
 * Get localized footer link label
 */
export function getLocalizedFooterLabel(item: { label: { te: string; en: string } } | { label: string }, lang: 'te' | 'en'): string {
  if (typeof item.label === 'string') return item.label;
  return item.label[lang];
}
