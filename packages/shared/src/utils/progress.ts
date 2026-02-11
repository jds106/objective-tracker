import type { KeyResultConfig } from '../types/key-result.js';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateProgress(config: KeyResultConfig): number {
  switch (config.type) {
    case 'percentage':
      return clamp(config.currentValue, 0, 100);

    case 'metric': {
      const { startValue, currentValue, targetValue, direction } = config;
      if (direction === 'increase') {
        if (targetValue === startValue) return currentValue >= targetValue ? 100 : 0;
        return clamp(((currentValue - startValue) / (targetValue - startValue)) * 100, 0, 100);
      } else {
        if (startValue === targetValue) return currentValue <= targetValue ? 100 : 0;
        return clamp(((startValue - currentValue) / (startValue - targetValue)) * 100, 0, 100);
      }
    }

    case 'milestone': {
      if (config.milestones.length === 0) return 0;
      const completed = config.milestones.filter(m => m.completed).length;
      return (completed / config.milestones.length) * 100;
    }

    case 'binary':
      return config.completed ? 100 : 0;
  }
}

export function calculateObjectiveProgress(keyResultProgresses: number[]): number {
  if (keyResultProgresses.length === 0) return 0;
  return keyResultProgresses.reduce((sum, p) => sum + p, 0) / keyResultProgresses.length;
}
