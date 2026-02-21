import type { ApiResponse, Objective, CascadeNode } from '@objective-tracker/shared';
import { apiClient } from './api-client.js';

// Re-export CascadeNode so existing imports from this file still work
export type { CascadeNode } from '@objective-tracker/shared';

export function getCascadeTree(cycleId?: string): Promise<ApiResponse<CascadeNode[]>> {
  const query = cycleId ? `?cycleId=${encodeURIComponent(cycleId)}` : '';
  return apiClient.get(`/cascade/tree${query}`);
}

export function getObjectiveCascadePath(objectiveId: string): Promise<ApiResponse<Objective[]>> {
  return apiClient.get(`/objectives/${objectiveId}/cascade`);
}
