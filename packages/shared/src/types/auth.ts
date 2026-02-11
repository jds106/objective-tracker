import type { User } from './user.js';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  token: string;
  expiresAt: string;
}

export interface AuthProvider {
  authenticate(credentials: unknown): Promise<AuthResult>;
  validateToken(token: string): Promise<User | null>;
  revokeToken(token: string): Promise<void>;
}
