import type { ApiResponse, User, Objective, UpdateProfileInput } from '@objective-tracker/shared';
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

export function updateProfile(input: UpdateProfileInput): Promise<ApiResponse<User>> {
  return apiClient.put('/users/me', input);
}

export function uploadAvatar(file: File): Promise<ApiResponse<User>> {
  const formData = new FormData();
  formData.append('avatar', file);
  return apiClient.upload('/users/me/avatar', formData);
}

export function deleteAvatar(): Promise<ApiResponse<User>> {
  return apiClient.delete('/users/me/avatar');
}

export function changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
  return apiClient.post('/users/me/password', { currentPassword, newPassword });
}
