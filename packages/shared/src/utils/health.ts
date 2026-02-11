import type { CheckIn } from '../types/check-in.js';
import type { Cycle } from '../types/cycle.js';

export type HealthStatus = 'on_track' | 'at_risk' | 'behind' | 'not_started';

export function calculateHealthStatus(
  progress: number,
  cycle: Cycle | null,
  checkIns: CheckIn[],
): HealthStatus {
  if (progress === 0 && checkIns.length === 0) return 'not_started';

  if (!cycle) {
    // No cycle context — use simple thresholds
    if (progress >= 70) return 'on_track';
    if (progress >= 40) return 'at_risk';
    return 'behind';
  }

  const now = Date.now();
  const start = new Date(cycle.startDate).getTime();
  const end = new Date(cycle.endDate).getTime();
  const duration = end - start;

  if (duration <= 0) return 'on_track';

  const elapsed = Math.min(Math.max(now - start, 0), duration);
  const expectedProgress = (elapsed / duration) * 100;

  const diff = progress - expectedProgress;

  if (diff >= -10) return 'on_track';
  if (diff >= -25) return 'at_risk';
  return 'behind';
}

export function healthStatusColour(status: HealthStatus): string {
  switch (status) {
    case 'on_track':
      return 'emerald';
    case 'at_risk':
      return 'amber';
    case 'behind':
      return 'red';
    case 'not_started':
      return 'slate';
  }
}

export function healthStatusLabel(status: HealthStatus): string {
  switch (status) {
    case 'on_track':
      return 'On Track';
    case 'at_risk':
      return 'At Risk';
    case 'behind':
      return 'Behind';
    case 'not_started':
      return 'Not Started';
  }
}
