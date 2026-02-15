import type { Objective } from './objective.js';

export type UserRole = 'admin' | 'standard';

export interface User {
  id: string;
  email: string;
  displayName: string;
  jobTitle: string;
  managerId: string | null;
  level: number;
  department?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface UserFile {
  version: number;
  user: UserWithPassword;
  objectives: Objective[];
}
