// Validation Analysis Types
export interface ValidationIssueExplanation {
  issue_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  field: string;
  explanation: string;
  recommended_action: 'auto_fix' | 'manual_review' | 'investigate';
  confidence: number;
  source_disagreement?: string[];
}

export interface ValidationAnalysis {
  total_issues: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  explanations: ValidationIssueExplanation[];
  overall_health: 'healthy' | 'degraded' | 'critical';
  summary: string;
}

// Governance Analysis Types
export interface GovernanceDecisionExplanation {
  entity_id: string;
  entity_type: 'movie' | 'celebrity' | 'review';
  decision: 'approved' | 'flagged' | 'rejected';
  rule_violations: string[];
  trust_score: number;
  trust_level: 'verified' | 'high' | 'medium' | 'low' | 'unverified';
  explanation: string;
  recommended_action: string;
}

export interface GovernanceAnalysis {
  total_decisions: number;
  approved_count: number;
  flagged_count: number;
  rejected_count: number;
  explanations: GovernanceDecisionExplanation[];
  trust_distribution: Record<string, number>;
  summary: string;
}

// Confidence Analysis Types
export interface ConfidenceDeltaExplanation {
  entity_id: string;
  entity_type: 'movie' | 'celebrity' | 'review';
  previous_confidence: number;
  current_confidence: number;
  delta: number;
  delta_percentage: number;
  reason: 'enrichment' | 'validation' | 'governance' | 'manual' | 'unknown';
  explanation: string;
  significance: 'major' | 'moderate' | 'minor';
}

export interface ConfidenceAnalysis {
  total_deltas: number;
  major_improvements: number;
  major_degradations: number;
  explanations: ConfidenceDeltaExplanation[];
  average_delta: number;
  summary: string;
}

// Change Summary Types
export interface ChangeSummary {
  period_start: string;
  period_end: string;
  movies_added: number;
  movies_updated: number;
  reviews_generated: number;
  reviews_enhanced: number;
  celebrities_added: number;
  celebrities_updated: number;
  trust_score_improvements: number;
  validation_issues_resolved: number;
  top_contributors: Array<{ source: string; count: number }>;
  summary: string;
  highlights: string[];
}

// Trend Analysis Types
export interface TrendSignal {
  signal_id: string;
  signal_type: 'emerging' | 'peaking' | 'declining' | 'stable';
  category: 'movie' | 'celebrity' | 'genre' | 'director' | 'trending_topic';
  entity_id?: string;
  entity_name?: string;
  velocity: number; // -1 to 1
  magnitude: number; // 0 to 1
  confidence: number;
  explanation: string;
  potential_impact: 'high' | 'medium' | 'low';
  recommended_editorial_angle?: string;
}

export interface TrendAnalysis {
  period_start: string;
  period_end: string;
  signals: TrendSignal[];
  top_emerging: TrendSignal[];
  top_peaking: TrendSignal[];
  summary: string;
}

// Editorial Idea Types
export interface EditorialIdea {
  idea_id: string;
  title: string;
  category: 'review' | 'feature' | 'list' | 'analysis' | 'news';
  priority: 'high' | 'medium' | 'low';
  rationale: string;
  data_points: string[];
  target_audience: string;
  estimated_engagement: 'high' | 'medium' | 'low';
  related_entities: Array<{ type: string; id: string; name: string }>;
  suggested_headline?: string;
  suggested_angle?: string;
}

export interface IdeaGeneration {
  generated_at: string;
  ideas: EditorialIdea[];
  high_priority_count: number;
  summary: string;
}

// Social Draft Types
export interface SocialDraft {
  draft_id: string;
  platform: 'telegram' | 'whatsapp';
  type: 'alert' | 'update' | 'trend' | 'idea' | 'summary';
  content: string;
  metadata: {
    priority: 'high' | 'medium' | 'low';
    requires_approval: boolean;
    suggested_send_time?: string;
    tags?: string[];
  };
}

export interface SocialDraftGeneration {
  generated_at: string;
  drafts: SocialDraft[];
  summary: string;
}

// SOS Alert Types
export interface SOSAlert {
  alert_id: string;
  severity: 'critical' | 'high' | 'medium';
  category: 'validation' | 'governance' | 'data_quality' | 'system' | 'trend';
  title: string;
  description: string;
  affected_entities: Array<{ type: string; id: string; name?: string }>;
  recommended_actions: string[];
  urgency: 'immediate' | 'within_hour' | 'within_day';
  generated_at: string;
}

// Input Types (what ClawDBot accepts)
export interface ValidationReportInput {
  report_id: string;
  generated_at: string;
  total_issues: number;
  issues: Array<{
    id: string;
    severity: string;
    field: string;
    message: string;
    confidence?: number;
    sources?: string[];
  }>;
}

export interface GovernanceReportInput {
  report_id: string;
  generated_at: string;
  decisions: Array<{
    entity_id: string;
    entity_type: string;
    decision: string;
    rule_violations?: string[];
    trust_score?: number;
    trust_level?: string;
  }>;
}

export interface ConfidenceDeltaInput {
  period_start: string;
  period_end: string;
  deltas: Array<{
    entity_id: string;
    entity_type: string;
    previous_confidence: number;
    current_confidence: number;
    reason?: string;
  }>;
}

export interface TrendInput {
  period_start: string;
  period_end: string;
  data_points: Array<{
    timestamp: string;
    category: string;
    entity_id?: string;
    entity_name?: string;
    metric: string;
    value: number;
  }>;
}

// Filmography Analysis Types
export interface FilmographyDiscoveryReport {
  actor: string;
  timestamp: string;
  discoveredFilms: Array<{
    title_en: string;
    title_te?: string;
    release_year: number;
    role: string;
    sources: string[];
    confidence: number;
    imdb_id?: string;
    tmdb_id?: number;
    language: string;
    character_name?: string;
    credits?: string;
    crewRoles?: string[];
    languages?: string[];
    roleNotes?: string;
  }>;
  existingMovies: Array<any>;
  sourceStats: {
    wikipedia: number;
    wikidata: number;
    tmdb: number;
    database: number;
  };
}

export interface MissingMovieRecommendation {
  film_id: string;
  title_en: string;
  release_year: number;
  role: string;
  crewRoles?: string[];
  language: string;
  confidence: number;
  sources: string[];
  reason: 'not_in_db' | 'different_spelling' | 'missing_year';
  recommended_action: 'add' | 'review' | 'investigate';
  priority: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface WrongAttributionRecommendation {
  movie_id: string;
  title_en: string;
  release_year: number;
  issue: 'not_in_sources' | 'wrong_role' | 'wrong_field' | 'duplicate';
  currentRole?: string;
  correctRole?: string;
  currentField?: string;
  correctField?: string;
  confidence: number;
  recommended_action: 'fix' | 'remove' | 'review' | 'investigate';
  priority: 'high' | 'medium' | 'low';
  explanation: string;
  fix_steps: string[];
}

export interface FilmographyAnalysis {
  actor: string;
  timestamp: string;
  missingMovies: MissingMovieRecommendation[];
  wrongAttributions: WrongAttributionRecommendation[];
  statistics: {
    totalDiscovered: number;
    totalInDatabase: number;
    missingCount: number;
    wrongAttributionCount: number;
    roleBreakdown: Record<string, number>;
    languageBreakdown: Record<string, number>;
    sourceBreakdown: Record<string, number>;
  };
  recommendations: {
    addMovies: MissingMovieRecommendation[];
    fixAttributions: WrongAttributionRecommendation[];
  };
  summary: string;
}
