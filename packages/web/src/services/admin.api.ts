import { apiClient } from './api-client.js';
import type {
    ApiResponse,
    User,
    Objective,
    Cycle,
    AdminCreateUserBody,
    UpdateUserAdminBody,
    CompanyObjectiveBody,
    AdminCreateObjectiveForUserBody,
    CreateCycleBody,
    UpdateCycleBody,
} from '@objective-tracker/shared';

interface PasswordResetResult {
    message: string;
    temporaryPassword: string;
}

// ── Users ────────────────────────────────────────────

export function createUser(input: AdminCreateUserBody) {
    return apiClient.post<ApiResponse<User>>('/admin/users', input);
}

export function getUsers() {
    return apiClient.get<ApiResponse<User[]>>('/admin/users');
}

export function updateUser(id: string, updates: UpdateUserAdminBody) {
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

export function createCompanyObjective(input: CompanyObjectiveBody) {
    return apiClient.post<ApiResponse<Objective>>('/admin/objectives/company', input);
}

export function createObjectiveForUser(input: AdminCreateObjectiveForUserBody) {
    return apiClient.post<ApiResponse<Objective>>('/admin/objectives/for-user', input);
}

// ── Cycles ──────────────────────────────────────────

export function createCycle(input: CreateCycleBody) {
    return apiClient.post<ApiResponse<Cycle>>('/admin/cycles', input);
}

export function updateCycle(id: string, updates: UpdateCycleBody) {
    return apiClient.put<ApiResponse<Cycle>>(`/admin/cycles/${id}`, updates);
}
