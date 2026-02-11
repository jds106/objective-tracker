import type { ApiResponse, Objective } from '@objective-tracker/shared';
import { apiClient } from './api-client.js';

export interface CascadeNode {
  objective: Objective;
  owner: { id: string; displayName: string; jobTitle: string; level: number };
  children: CascadeNode[];
}

export function getCascadeTree(cycleId?: string): Promise<ApiResponse<CascadeNode[]>> {
  const query = cycleId ? `?cycleId=${encodeURIComponent(cycleId)}` : '';
  return apiClient.get(`/cascade/tree${query}`);
}

export function getObjectiveCascadePath(objectiveId: string): Promise<ApiResponse<Objective[]>> {
  return apiClient.get(`/objectives/${objectiveId}/cascade`);
}
