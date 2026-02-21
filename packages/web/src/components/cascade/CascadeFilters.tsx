import type { ObjectiveStatus, HealthStatus } from '@objective-tracker/shared';

interface CascadeFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: ObjectiveStatus | '';
  onStatusFilterChange: (value: ObjectiveStatus | '') => void;
  healthFilter: HealthStatus | '';
  onHealthFilterChange: (value: HealthStatus | '') => void;
}

export function CascadeFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  healthFilter,
  onHealthFilterChange,
}: CascadeFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="Search objectives…"
        aria-label="Search objectives"
        className="rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none w-full sm:w-64"
      />

      <select
        value={statusFilter}
        onChange={e => onStatusFilterChange(e.target.value as ObjectiveStatus | '')}
        aria-label="Filter by status"
        className="rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
      >
        <option value="">All statuses</option>
        <option value="draft">Draft</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <select
        value={healthFilter}
        onChange={e => onHealthFilterChange(e.target.value as HealthStatus | '')}
        aria-label="Filter by health"
        className="rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
      >
        <option value="">All health</option>
        <option value="on_track">On Track</option>
        <option value="at_risk">At Risk</option>
        <option value="behind">Behind</option>
        <option value="not_started">Not Started</option>
      </select>
    </div>
  );
}
