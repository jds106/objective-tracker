import type { CheckIn } from './check-in.js';

export type KeyResultType = 'percentage' | 'metric' | 'milestone' | 'binary';

export interface PercentageConfig {
  type: 'percentage';
  currentValue: number;
}

export interface MetricConfig {
  type: 'metric';
  startValue: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  direction: 'increase' | 'decrease';
}

export interface MilestoneItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface MilestoneConfig {
  type: 'milestone';
  milestones: MilestoneItem[];
}

export interface BinaryConfig {
  type: 'binary';
  completed: boolean;
  completedAt?: string;
}

export type KeyResultConfig = PercentageConfig | MetricConfig | MilestoneConfig | BinaryConfig;

export interface KeyResult {
  id: string;
  objectiveId: string;
  title: string;
  type: KeyResultType;
  config: KeyResultConfig;
  progress: number;
  checkIns: CheckIn[];
  createdAt: string;
  updatedAt: string;
}
