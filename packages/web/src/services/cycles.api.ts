import type { ApiResponse, Cycle } from '@objective-tracker/shared';
import { apiClient } from './api-client.js';

export function getActiveCycle(): Promise<ApiResponse<Cycle>> {
  return apiClient.get('/cycles/active');
}

export function getAllCycles(): Promise<ApiResponse<Cycle[]>> {
  return apiClient.get('/cycles');
}
