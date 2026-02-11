import type { ApiResponse, User, Objective } from '@objective-tracker/shared';
import { apiClient } from './api-client.js';

export function getDirectReports(): Promise<ApiResponse<User[]>> {
  return apiClient.get('/users/me/reports');
}

export function getReportingChain(): Promise<ApiResponse<User[]>> {
  return apiClient.get('/users/me/chain');
}

export function getUserObjectives(userId: string, cycleId?: string): Promise<ApiResponse<Objective[]>> {
  const query = cycleId ? `?cycleId=${encodeURIComponent(cycleId)}` : '';
  return apiClient.get(`/users/${userId}/objectives${query}`);
}
