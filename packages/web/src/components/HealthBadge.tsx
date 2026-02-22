import type { HealthStatus } from '@objective-tracker/shared';
import { healthStatusLabel } from '@objective-tracker/shared';

const statusStyles: Record<HealthStatus, { dot: string; text: string }> = {
  on_track: { dot: 'bg-health-on-track', text: 'text-emerald-400' },
  at_risk: { dot: 'bg-health-at-risk', text: 'text-amber-400' },
  behind: { dot: 'bg-health-behind', text: 'text-red-400' },
  late: { dot: 'bg-rose-500', text: 'text-rose-400' },
  not_started: { dot: 'bg-health-not-started', text: 'text-slate-400' },
};

interface HealthBadgeProps {
  status: HealthStatus;
  className?: string;
}

export function HealthBadge({ status, className = '' }: HealthBadgeProps) {
  const style = statusStyles[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${style.text} ${className}`}>
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {healthStatusLabel(status)}
    </span>
  );
}
