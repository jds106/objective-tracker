import type {
  ApiResponse,
  AiReviewResult,
  AiSuggestedObjective,
  AiSummaryResult,
} from '@objective-tracker/shared';
import { apiClient } from './api-client.js';

export function reviewObjective(objectiveId: string): Promise<ApiResponse<AiReviewResult>> {
  return apiClient.post('/ai/review', { objectiveId });
}

export function suggestObjectives(
  parentObjectiveId: string,
  context?: string,
): Promise<ApiResponse<AiSuggestedObjective[]>> {
  return apiClient.post('/ai/suggest', { parentObjectiveId, context });
}

export function summarise(
  userId: string,
  cycleId: string,
): Promise<ApiResponse<AiSummaryResult>> {
  return apiClient.post('/ai/summarise', { userId, cycleId });
}
