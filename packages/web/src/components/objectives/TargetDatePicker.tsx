import type { TargetDateType, Cycle } from '@objective-tracker/shared';
import { formatDate } from '@objective-tracker/shared';

interface TargetDatePickerProps {
  targetDateType: TargetDateType;
  targetDate: string;
  onTypeChange: (type: TargetDateType) => void;
  onDateChange: (date: string) => void;
  cycle: Cycle;
  parentTargetDate?: string | null;
}

const TYPE_OPTIONS: Array<{ value: TargetDateType; label: string }> = [
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
  { value: 'arbitrary', label: 'Custom' },
];

function getQuarterLabel(q: { name: string; endDate: string }): string {
  return `${q.name} — ${formatDate(q.endDate)}`;
}

function getYearOptions(cycle: Cycle): number[] {
  const cycleYear = new Date(cycle.startDate).getFullYear();
  return [cycleYear - 1, cycleYear, cycleYear + 1];
}

export function TargetDatePicker({
  targetDateType,
  targetDate,
  onTypeChange,
  onDateChange,
  cycle,
  parentTargetDate,
}: TargetDatePickerProps) {
  const handleTypeChange = (type: TargetDateType) => {
    onTypeChange(type);

    // Auto-set a sensible date for the new type
    if (type === 'quarterly' && cycle.quarters.length > 0) {
      // Pick the quarter that currently matches or first one
      const now = new Date();
      const currentQ = cycle.quarters.find(q => now >= new Date(q.startDate) && now <= new Date(q.endDate));
      onDateChange((currentQ ?? cycle.quarters[0])!.endDate);
    } else if (type === 'annual') {
      const year = new Date(cycle.startDate).getFullYear();
      onDateChange(`${year}-12-31`);
    }
    // For 'arbitrary', keep the current date
  };

  const showWarning = parentTargetDate && targetDate > parentTargetDate;

  return (
    <div className="space-y-3">
      {/* Segmented control */}
      <div className="inline-flex rounded-lg bg-surface border border-slate-700 p-0.5">
        {TYPE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleTypeChange(opt.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              targetDateType === opt.value
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Type-specific input */}
      {targetDateType === 'quarterly' && (
        <select
          value={targetDate}
          onChange={e => onDateChange(e.target.value)}
          className="w-full rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {cycle.quarters.map(q => (
            <option key={q.id} value={q.endDate}>
              {getQuarterLabel(q)}
            </option>
          ))}
        </select>
      )}

      {targetDateType === 'annual' && (
        <select
          value={targetDate}
          onChange={e => onDateChange(e.target.value)}
          className="w-full rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {getYearOptions(cycle).map(year => (
            <option key={year} value={`${year}-12-31`}>
              {year} — 31 Dec {year}
            </option>
          ))}
        </select>
      )}

      {targetDateType === 'arbitrary' && (
        <input
          type="date"
          value={targetDate}
          onChange={e => onDateChange(e.target.value)}
          className="w-full rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      )}

      {/* Parent date warning */}
      {showWarning && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
          <p className="text-xs text-amber-300">
            This objective's target date is later than its parent's ({formatDate(parentTargetDate!)}).
            Child objectives should usually finish before their parent.
          </p>
        </div>
      )}
    </div>
  );
}
