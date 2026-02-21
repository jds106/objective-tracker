import { apiClient } from './api-client.js';
import type { ApiResponse, User, Objective, Cycle, UpdateUserInput } from '@objective-tracker/shared';

interface PasswordResetResult {
    message: string;
    temporaryPassword: string;
}

interface CompanyObjectiveInput {
    cycleId: string;
    title: string;
    description?: string;
}

interface CreateUserInput {
    email: string;
    password: string;
    displayName: string;
    jobTitle: string;
    managerId?: string | null;
    level?: number;
    department?: string;
    role?: 'admin' | 'standard';
}

// ── Users ────────────────────────────────────────────

export function createUser(input: CreateUserInput) {
    return apiClient.post<ApiResponse<User>>('/admin/users', input);
}

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

export function adminSetPassword(id: string, password: string) {
    return apiClient.put<ApiResponse<{ message: string }>>(`/admin/users/${id}/password`, { password });
}

// ── CSV Import ───────────────────────────────────────

export interface CsvImportRow {
    email: string;
    displayName: string;
    jobTitle: string;
    department?: string;
    managerEmail?: string;
    level?: number;
}

export interface CsvImportResult {
    results: Array<{ email: string; status: 'created' | 'skipped' | 'error'; message?: string }>;
    summary: { total: number; created: number; skipped: number; errors: number };
}

export function importUsersFromCsv(rows: CsvImportRow[]) {
    return apiClient.post<ApiResponse<CsvImportResult>>('/admin/users/import', { rows });
}

// ── Objectives ───────────────────────────────────────

export function getAllObjectives(cycleId?: string) {
    const query = cycleId ? `?cycleId=${cycleId}` : '';
    return apiClient.get<ApiResponse<Objective[]>>(`/admin/objectives${query}`);
}

export function createCompanyObjective(input: CompanyObjectiveInput) {
    return apiClient.post<ApiResponse<Objective>>('/admin/objectives/company', input);
}

// ── Cycles ──────────────────────────────────────────

export interface CreateCycleInput {
    name: string;
    startDate: string;
    endDate: string;
    status?: 'planning' | 'active' | 'review' | 'closed';
    quarters: Array<{
        name: string;
        startDate: string;
        endDate: string;
        reviewDeadline: string;
    }>;
}

export function createCycle(input: CreateCycleInput) {
    return apiClient.post<ApiResponse<Cycle>>('/admin/cycles', input);
}

export interface UpdateCycleApiInput {
    name?: string;
    startDate?: string;
    endDate?: string;
    status?: 'planning' | 'active' | 'review' | 'closed';
    quarters?: Array<{
        id?: string;
        name: string;
        startDate: string;
        endDate: string;
        reviewDeadline: string;
    }>;
}

export function updateCycle(id: string, updates: UpdateCycleApiInput) {
    return apiClient.put<ApiResponse<Cycle>>(`/admin/cycles/${id}`, updates);
}
