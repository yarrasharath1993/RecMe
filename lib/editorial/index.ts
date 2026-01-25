/**
 * EDITORIAL MODULE
 * 
 * Auto-generates editorial content from movie and entity data.
 * All content is algorithmically derived - no AI speculation.
 */

export {
  // Main generator
  generateEditorialViews,
  
  // Individual generators
  generateTurningPoints,
  generatePhaseAnalysis,
  analyzeCultMassBalance,
  analyzeCriticalAudienceGap,
  analyzeFamilyLegacy,
  
  // Types
  type CareerTurningPoint,
  type PhaseAnalysis,
  type CultMassBalance,
  type CriticalAudienceGap,
  type FamilyLegacyAnalysis,
  type EditorialViewsData,
  type MovieForAnalysis,
} from './editorial-views';
