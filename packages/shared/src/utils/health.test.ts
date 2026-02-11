import { describe, it, expect } from 'vitest';
import { calculateHealthStatus, healthStatusColour, healthStatusLabel } from './health.js';
import type { CheckIn } from '../types/check-in.js';
import type { Cycle } from '../types/cycle.js';

function makeCycle(overrides: Partial<Cycle> = {}): Cycle {
  return {
    id: 'cycle-1',
    name: 'H1 2025',
    startDate: '2025-01-01T00:00:00.000Z',
    endDate: '2025-06-30T23:59:59.999Z',
    quarters: [],
    status: 'active',
    ...overrides,
  };
}

function makeCheckIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    id: 'ci-1',
    keyResultId: 'kr-1',
    userId: 'user-1',
    timestamp: '2025-03-15T10:00:00.000Z',
    previousProgress: 0,
    newProgress: 50,
    source: 'web',
    ...overrides,
  };
}

describe('calculateHealthStatus', () => {
  it('should return not_started when progress is 0 and no check-ins', () => {
    expect(calculateHealthStatus(0, null, [])).toBe('not_started');
  });

  it('should return not_started even with a cycle if no progress or check-ins', () => {
    expect(calculateHealthStatus(0, makeCycle(), [])).toBe('not_started');
  });

  it('should use simple thresholds when no cycle provided', () => {
    const checkIns = [makeCheckIn()];
    expect(calculateHealthStatus(80, null, checkIns)).toBe('on_track');
    expect(calculateHealthStatus(50, null, checkIns)).toBe('at_risk');
    expect(calculateHealthStatus(20, null, checkIns)).toBe('behind');
  });

  it('should return on_track when progress is ahead of expected', () => {
    // Cycle is Jan-Jun 2025. If we're at the start and have 10% progress, that's ahead.
    const cycle = makeCycle({
      startDate: new Date(Date.now() - 1000).toISOString(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(calculateHealthStatus(10, cycle, [makeCheckIn()])).toBe('on_track');
  });

  it('should return behind when progress is far below expected', () => {
    // Cycle is almost over but progress is 5%
    const cycle = makeCycle({
      startDate: new Date(Date.now() - 170 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(calculateHealthStatus(5, cycle, [makeCheckIn()])).toBe('behind');
  });

  it('should return at_risk when progress is moderately behind', () => {
    // Cycle halfway through, progress at ~25% (expected ~50%, diff is -25)
    const cycle = makeCycle({
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(calculateHealthStatus(25, cycle, [makeCheckIn()])).toBe('at_risk');
  });

  it('should handle zero-duration cycle gracefully', () => {
    const cycle = makeCycle({
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-01T00:00:00.000Z',
    });
    expect(calculateHealthStatus(50, cycle, [makeCheckIn()])).toBe('on_track');
  });
});

describe('healthStatusColour', () => {
  it('should return correct colour tokens', () => {
    expect(healthStatusColour('on_track')).toBe('emerald');
    expect(healthStatusColour('at_risk')).toBe('amber');
    expect(healthStatusColour('behind')).toBe('red');
    expect(healthStatusColour('not_started')).toBe('slate');
  });
});

describe('healthStatusLabel', () => {
  it('should return correct labels', () => {
    expect(healthStatusLabel('on_track')).toBe('On Track');
    expect(healthStatusLabel('at_risk')).toBe('At Risk');
    expect(healthStatusLabel('behind')).toBe('Behind');
    expect(healthStatusLabel('not_started')).toBe('Not Started');
  });
});
