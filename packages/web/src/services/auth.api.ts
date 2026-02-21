import type { ApiResponse, AuthResult, User } from '@objective-tracker/shared';
import { apiClient } from './api-client.js';

export function login(email: string, password: string): Promise<ApiResponse<AuthResult>> {
  return apiClient.post('/auth/login', { email, password });
}

export interface RegisterFormData {
  email: string;
  password: string;
  displayName: string;
  jobTitle: string;
  managerId?: string | null;
  managerEmail?: string;
  level?: number;
  department?: string;
}

export function register(input: RegisterFormData): Promise<ApiResponse<AuthResult>> {
  return apiClient.post('/auth/register', input);
}

export function logout(): Promise<void> {
  return apiClient.post('/auth/logout', {});
}

export function getMe(): Promise<ApiResponse<User>> {
  return apiClient.get('/users/me');
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string;
}

export function forgotPassword(email: string): Promise<ApiResponse<ForgotPasswordResponse>> {
  return apiClient.post('/auth/forgot-password', { email });
}

export interface ResetPasswordResponse {
  message: string;
}

export function resetPassword(token: string, password: string): Promise<ApiResponse<ResetPasswordResponse>> {
  return apiClient.post('/auth/reset-password', { token, password });
}
