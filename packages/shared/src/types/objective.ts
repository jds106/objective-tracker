import type { KeyResult } from './key-result.js';

export type ObjectiveStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'rolled_forward';

export type TargetDateType = 'quarterly' | 'annual' | 'arbitrary';

export interface Objective {
  id: string;
  ownerId: string;
  cycleId: string;
  title: string;
  description: string;
  parentKeyResultId: string | null;
  parentObjectiveId: string | null;
  status: ObjectiveStatus;
  targetDateType: TargetDateType;
  targetDate: string; // ISO 8601 date, e.g. "2026-03-31"
  keyResults: KeyResult[];
  createdAt: string;
  updatedAt: string;
  rolledForwardFrom?: string;
}
