import type { KeyResult } from './key-result.js';

export type ObjectiveStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'rolled_forward';

export interface Objective {
  id: string;
  ownerId: string;
  cycleId: string;
  title: string;
  description: string;
  parentKeyResultId: string | null;
  parentObjectiveId: string | null;
  status: ObjectiveStatus;
  keyResults: KeyResult[];
  createdAt: string;
  updatedAt: string;
  rolledForwardFrom?: string;
}
