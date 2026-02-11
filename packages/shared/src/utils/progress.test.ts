import { describe, it, expect } from 'vitest';
import { calculateProgress, calculateObjectiveProgress } from './progress.js';

describe('calculateProgress', () => {
  describe('percentage', () => {
    it('should return the current value directly', () => {
      expect(calculateProgress({ type: 'percentage', currentValue: 50 })).toBe(50);
    });

    it('should clamp to 0', () => {
      expect(calculateProgress({ type: 'percentage', currentValue: -10 })).toBe(0);
    });

    it('should clamp to 100', () => {
      expect(calculateProgress({ type: 'percentage', currentValue: 120 })).toBe(100);
    });

    it('should handle 0', () => {
      expect(calculateProgress({ type: 'percentage', currentValue: 0 })).toBe(0);
    });

    it('should handle 100', () => {
      expect(calculateProgress({ type: 'percentage', currentValue: 100 })).toBe(100);
    });
  });

  describe('metric (increase)', () => {
    it('should calculate progress for an increase metric', () => {
      expect(calculateProgress({
        type: 'metric',
        startValue: 0,
        currentValue: 50,
        targetValue: 100,
        unit: 'deploys/week',
        direction: 'increase',
      })).toBe(50);
    });

    it('should return 100 when target is reached', () => {
      expect(calculateProgress({
        type: 'metric',
        startValue: 20,
        currentValue: 50,
        targetValue: 50,
        unit: 'deploys/week',
        direction: 'increase',
      })).toBe(100);
    });

    it('should clamp to 0 when below start', () => {
      expect(calculateProgress({
        type: 'metric',
        startValue: 20,
        currentValue: 10,
        targetValue: 50,
        unit: 'deploys/week',
        direction: 'increase',
      })).toBe(0);
    });

    it('should clamp to 100 when above target', () => {
      expect(calculateProgress({
        type: 'metric',
        startValue: 0,
        currentValue: 150,
        targetValue: 100,
        unit: 'deploys/week',
        direction: 'increase',
      })).toBe(100);
    });

    it('should handle equal start and target', () => {
      expect(calculateProgress({
        type: 'metric',
        startValue: 50,
        currentValue: 50,
        targetValue: 50,
        unit: 'deploys/week',
        direction: 'increase',
      })).toBe(100);

      expect(calculateProgress({
        type: 'metric',
        startValue: 50,
        currentValue: 40,
        targetValue: 50,
        unit: 'deploys/week',
        direction: 'increase',
      })).toBe(0);
    });
  });

  describe('metric (decrease)', () => {
    it('should calculate progress for a decrease metric', () => {
      expect(calculateProgress({
        type: 'metric',
        startValue: 100,
        currentValue: 50,
        targetValue: 0,
        unit: 'incidents/month',
        direction: 'decrease',
      })).toBe(50);
    });

    it('should return 100 when target is reached', () => {
      expect(calculateProgress({
        type: 'metric',
        startValue: 45,
        currentValue: 15,
        targetValue: 15,
        unit: 'min',
        direction: 'decrease',
      })).toBe(100);
    });

    it('should clamp to 0 when above start', () => {
      expect(calculateProgress({
        type: 'metric',
        startValue: 100,
        currentValue: 120,
        targetValue: 50,
        unit: 'ms',
        direction: 'decrease',
      })).toBe(0);
    });

    it('should handle equal start and target', () => {
      expect(calculateProgress({
        type: 'metric',
        startValue: 50,
        currentValue: 50,
        targetValue: 50,
        unit: 'ms',
        direction: 'decrease',
      })).toBe(100);

      expect(calculateProgress({
        type: 'metric',
        startValue: 50,
        currentValue: 60,
        targetValue: 50,
        unit: 'ms',
        direction: 'decrease',
      })).toBe(0);
    });
  });

  describe('milestone', () => {
    it('should calculate progress based on completed milestones', () => {
      expect(calculateProgress({
        type: 'milestone',
        milestones: [
          { id: '1', title: 'Phase 1', completed: true },
          { id: '2', title: 'Phase 2', completed: false },
          { id: '3', title: 'Phase 3', completed: false },
        ],
      })).toBeCloseTo(33.33, 1);
    });

    it('should return 0 for no completed milestones', () => {
      expect(calculateProgress({
        type: 'milestone',
        milestones: [
          { id: '1', title: 'Phase 1', completed: false },
          { id: '2', title: 'Phase 2', completed: false },
        ],
      })).toBe(0);
    });

    it('should return 100 for all completed milestones', () => {
      expect(calculateProgress({
        type: 'milestone',
        milestones: [
          { id: '1', title: 'Phase 1', completed: true },
          { id: '2', title: 'Phase 2', completed: true },
        ],
      })).toBe(100);
    });

    it('should return 0 for empty milestones array', () => {
      expect(calculateProgress({
        type: 'milestone',
        milestones: [],
      })).toBe(0);
    });
  });

  describe('binary', () => {
    it('should return 0 when not completed', () => {
      expect(calculateProgress({ type: 'binary', completed: false })).toBe(0);
    });

    it('should return 100 when completed', () => {
      expect(calculateProgress({ type: 'binary', completed: true })).toBe(100);
    });
  });
});

describe('calculateObjectiveProgress', () => {
  it('should return the mean of key result progresses', () => {
    expect(calculateObjectiveProgress([50, 100, 0])).toBe(50);
  });

  it('should return 0 for empty array', () => {
    expect(calculateObjectiveProgress([])).toBe(0);
  });

  it('should handle a single key result', () => {
    expect(calculateObjectiveProgress([75])).toBe(75);
  });

  it('should handle all at 100', () => {
    expect(calculateObjectiveProgress([100, 100, 100])).toBe(100);
  });
});
