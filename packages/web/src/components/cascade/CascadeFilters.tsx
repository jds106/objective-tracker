import type { ObjectiveStatus, HealthStatus } from '@objective-tracker/shared';
import { Select } from '../ui/Select.js';

interface CascadeFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: ObjectiveStatus | '';
  onStatusFilterChange: (value: ObjectiveStatus | '') => void;
  healthFilter: HealthStatus | '';
  onHealthFilterChange: (value: HealthStatus | '') => void;
}

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rolled_forward', label: 'Rolled Forward' },
];

const healthOptions = [
  { value: '', label: 'All health' },
  { value: 'on_track', label: 'On Track' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'behind', label: 'Behind' },
  { value: 'late', label: 'Late' },
  { value: 'not_started', label: 'Not Started' },
];

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
        className="rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:shadow-sm focus:shadow-indigo-500/20 w-full sm:w-64"
      />

      <Select
        value={statusFilter}
        onChange={v => onStatusFilterChange(v as ObjectiveStatus | '')}
        options={statusOptions}
        aria-label="Filter by status"
        className="w-40"
      />

      <Select
        value={healthFilter}
        onChange={v => onHealthFilterChange(v as HealthStatus | '')}
        options={healthOptions}
        aria-label="Filter by health"
        className="w-40"
      />
    </div>
  );
}
