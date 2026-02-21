import type { User, UserWithPassword, UserRole } from './user.js';
import type { Objective, ObjectiveStatus } from './objective.js';
import type { KeyResult, KeyResultType, KeyResultConfig } from './key-result.js';
import type { CheckIn } from './check-in.js';
import type { Cycle, CycleStatus, Quarter } from './cycle.js';

export interface CreateUserInput {
  email: string;
  displayName: string;
  jobTitle: string;
  managerId: string | null;
  level: number;
  department?: string;
  role?: UserRole;
  passwordHash: string;
}

export interface UpdateUserInput {
  displayName?: string;
  jobTitle?: string;
  managerId?: string | null;
  level?: number;
  department?: string;
  avatarUrl?: string | null;
  role?: UserRole;
}

export interface UserRepository {
  getById(id: string): Promise<UserWithPassword | null>;
  getByEmail(email: string): Promise<UserWithPassword | null>;
  getAll(): Promise<User[]>;
  getDirectReports(managerId: string): Promise<User[]>;
  getReportingChain(userId: string): Promise<User[]>;
  getDownwardTree(userId: string): Promise<User[]>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, updates: UpdateUserInput): Promise<User>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface CreateObjectiveInput {
  ownerId: string;
  cycleId: string;
  title: string;
  description: string;
  parentKeyResultId: string | null;
  parentObjectiveId: string | null;
}

export interface UpdateObjectiveInput {
  title?: string;
  description?: string;
  status?: ObjectiveStatus;
  parentKeyResultId?: string | null;
  parentObjectiveId?: string | null;
}

export interface ObjectiveRepository {
  getByUserId(userId: string, cycleId?: string): Promise<Objective[]>;
  getById(id: string): Promise<Objective | null>;
  /** Returns all objectives across all users. Used by admin endpoints. */
  getAll?(cycleId?: string): Promise<Objective[]>;
  create(input: CreateObjectiveInput): Promise<Objective>;
  update(id: string, updates: UpdateObjectiveInput): Promise<Objective>;
  delete(id: string): Promise<void>;
}

export interface CreateKeyResultInput {
  objectiveId: string;
  title: string;
  type: KeyResultType;
  config: KeyResultConfig;
}

export interface UpdateKeyResultInput {
  title?: string;
  config?: KeyResultConfig;
}

export interface KeyResultRepository {
  getById(id: string): Promise<KeyResult | null>;
  create(input: CreateKeyResultInput): Promise<KeyResult>;
  update(id: string, updates: UpdateKeyResultInput): Promise<KeyResult>;
  delete(id: string): Promise<void>;
  addCheckIn(keyResultId: string, checkIn: Omit<CheckIn, 'id'>): Promise<CheckIn>;
}

export interface UpdateCycleInput {
  name?: string;
  startDate?: string;
  endDate?: string;
  status?: CycleStatus;
  quarters?: Quarter[];
}

export interface CycleRepository {
  getAll(): Promise<Cycle[]>;
  getActive(): Promise<Cycle | null>;
  getById(id: string): Promise<Cycle | null>;
  create(cycle: Omit<Cycle, 'id'>): Promise<Cycle>;
  update(id: string, updates: UpdateCycleInput): Promise<Cycle>;
}
