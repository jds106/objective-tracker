import type {
  ApiResponse,
  Objective,
  KeyResult,
  CheckIn,
  CreateObjectiveBody,
  UpdateObjectiveBody,
  CreateKeyResultBody,
  UpdateKeyResultBody,
  CheckInBody,
} from '@objective-tracker/shared';
import { apiClient } from './api-client.js';

export function listMyObjectives(cycleId?: string): Promise<ApiResponse<Objective[]>> {
  const query = cycleId ? `?cycleId=${encodeURIComponent(cycleId)}` : '';
  return apiClient.get(`/objectives${query}`);
}

export function getObjective(id: string): Promise<ApiResponse<Objective> & { canEdit?: boolean }> {
  return apiClient.get(`/objectives/${id}`);
}

export function getCompanyObjectives(cycleId?: string): Promise<ApiResponse<Objective[]>> {
  const query = cycleId ? `?cycleId=${encodeURIComponent(cycleId)}` : '';
  return apiClient.get(`/objectives/company${query}`);
}

export function createObjective(input: CreateObjectiveBody): Promise<ApiResponse<Objective>> {
  return apiClient.post('/objectives', input);
}

export function updateObjective(id: string, input: UpdateObjectiveBody): Promise<ApiResponse<Objective>> {
  return apiClient.put(`/objectives/${id}`, input);
}

export function deleteObjective(id: string): Promise<void> {
  return apiClient.delete(`/objectives/${id}`);
}

export function createKeyResult(objectiveId: string, input: CreateKeyResultBody): Promise<ApiResponse<KeyResult>> {
  return apiClient.post(`/objectives/${objectiveId}/key-results`, input);
}

export function updateKeyResult(id: string, input: UpdateKeyResultBody): Promise<ApiResponse<KeyResult>> {
  return apiClient.put(`/key-results/${id}`, input);
}

export function deleteKeyResult(id: string): Promise<void> {
  return apiClient.delete(`/key-results/${id}`);
}

export function recordCheckIn(keyResultId: string, input: CheckInBody): Promise<ApiResponse<CheckIn>> {
  return apiClient.post(`/key-results/${keyResultId}/check-in`, input);
}
