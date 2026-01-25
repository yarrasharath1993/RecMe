/**
 * Compact Card Design System
 * Premium styling tokens for profile page compact cards
 */

// Premium card base styles - glassmorphism effect
export const premiumCard = `
  backdrop-blur-md
  rounded-xl
  p-4
  border border-white/10
  hover:border-white/20
  transition-all duration-300
  hover:shadow-2xl hover:shadow-purple-500/10
  bg-gradient-to-br from-white/5 to-white/3
`;

// Spacing system for compact layouts
export const compactSpacing = {
  cardPadding: 'p-4',
  sectionGap: 'gap-4',
  itemGap: 'gap-2',
  tightGap: 'gap-1.5',
  microGap: 'gap-1',
};

// Typography system for premium look
export const premiumText = {
  heading: 'text-sm font-bold text-white/90 uppercase tracking-wider',
  subheading: 'text-xs font-semibold text-white/80',
  body: 'text-xs text-white/70',
  caption: 'text-[10px] text-white/60',
  stat: 'text-2xl font-black text-white',
  miniStat: 'text-lg font-bold text-white/90',
};

// Color tokens for different card types
export const cardColors = {
  primary: {
    bg: 'from-purple-500/20 to-blue-500/20',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/10',
  },
  accent: {
    bg: 'from-orange-500/20 to-yellow-500/20',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/10',
  },
  success: {
    bg: 'from-green-500/20 to-emerald-500/20',
    border: 'border-green-500/30',
    text: 'text-green-400',
    glow: 'shadow-green-500/10',
  },
  neutral: {
    bg: 'from-white/8 to-white/4',
    border: 'border-white/10',
    text: 'text-white/80',
    glow: 'shadow-white/5',
  },
};

// Icon size tokens
export const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

// Helper function to combine card styles
export const getCardClasses = (variant: 'primary' | 'accent' | 'success' | 'neutral' = 'neutral', className?: string) => {
  const colors = cardColors[variant];
  return `${premiumCard} bg-gradient-to-br ${colors.bg} ${colors.border} hover:${colors.glow} ${className || ''}`;
};
