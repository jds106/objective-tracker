import type { KeyResultConfig } from './key-result.js';

export interface CheckIn {
  id: string;
  keyResultId: string;
  userId: string;
  timestamp: string;
  previousProgress: number;
  newProgress: number;
  note?: string;
  source: 'web' | 'slack' | 'mcp';
  configSnapshot?: KeyResultConfig;
}
