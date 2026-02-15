import { apiClient } from './api-client.js';
import type { User, Objective, UpdateUserInput } from '@objective-tracker/shared';

interface ApiResponse<T> {
    data: T;
}

interface PasswordResetResult {
    message: string;
    temporaryPassword: string;
}

interface CompanyObjectiveInput {
    cycleId: string;
    title: string;
    description?: string;
}

// ── Users ────────────────────────────────────────────

export function getUsers() {
    return apiClient.get<ApiResponse<User[]>>('/admin/users');
}

export function updateUser(id: string, updates: UpdateUserInput) {
    return apiClient.put<ApiResponse<User>>(`/admin/users/${id}`, updates);
}

export function deleteUser(id: string) {
    return apiClient.delete<void>(`/admin/users/${id}`);
}

export function adminResetPassword(id: string) {
    return apiClient.post<ApiResponse<PasswordResetResult>>(`/admin/users/${id}/reset-password`, {});
}

// ── Objectives ───────────────────────────────────────

export function getAllObjectives(cycleId?: string) {
    const query = cycleId ? `?cycleId=${cycleId}` : '';
    return apiClient.get<ApiResponse<Objective[]>>(`/admin/objectives${query}`);
}

export function createCompanyObjective(input: CompanyObjectiveInput) {
    return apiClient.post<ApiResponse<Objective>>('/admin/objectives/company', input);
}
