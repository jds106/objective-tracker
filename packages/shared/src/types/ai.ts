/** AI review of objective quality — returned by POST /api/ai/review */
export interface AiReviewResult {
  /** Overall quality score 1–10 */
  score: number;
  /** One-sentence summary of the objective's quality */
  summary: string;
  /** Specific suggestions grouped by category */
  suggestions: AiSuggestion[];
  /** Strengths worth keeping */
  strengths: string[];
}

export interface AiSuggestion {
  category: 'clarity' | 'measurability' | 'ambition' | 'alignment' | 'specificity';
  message: string;
  /** Optional rewrite suggestion */
  rewrite?: string;
}

/** AI-generated objective suggestions — returned by POST /api/ai/suggest */
export interface AiSuggestedObjective {
  title: string;
  description: string;
  suggestedKeyResults: Array<{
    title: string;
    type: 'percentage' | 'metric' | 'milestone' | 'binary';
  }>;
  rationale: string;
}

/** AI cycle/review summary — returned by POST /api/ai/summarise */
export interface AiSummaryResult {
  /** High-level overview */
  overview: string;
  /** Key highlights and wins */
  highlights: string[];
  /** At-risk objectives with reasons */
  atRisk: Array<{
    objectiveTitle: string;
    reason: string;
    recommendation: string;
  }>;
  /** Recommendations for next cycle */
  recommendations: string[];
}

/** Request body for POST /api/ai/review */
export interface AiReviewRequest {
  objectiveId: string;
}

/** Request body for POST /api/ai/suggest */
export interface AiSuggestRequest {
  /** Parent objective ID to generate child suggestions for */
  parentObjectiveId: string;
  /** Optional context about the role/level of the person */
  context?: string;
}

/** Request body for POST /api/ai/summarise */
export interface AiSummariseRequest {
  /** User ID to summarise for (or 'company' for company-wide) */
  userId: string;
  /** Cycle ID to summarise */
  cycleId: string;
}
