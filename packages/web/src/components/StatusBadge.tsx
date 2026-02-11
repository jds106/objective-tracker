import type { ObjectiveStatus } from '@objective-tracker/shared';

const statusConfig: Record<ObjectiveStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-700 text-slate-300' },
  active: { label: 'Active', className: 'bg-indigo-500/20 text-indigo-300' },
  completed: { label: 'Completed', className: 'bg-emerald-500/20 text-emerald-300' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/20 text-red-300' },
  rolled_forward: { label: 'Rolled Forward', className: 'bg-amber-500/20 text-amber-300' },
};

interface StatusBadgeProps {
  status: ObjectiveStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className} ${className}`}>
      {config.label}
    </span>
  );
}
