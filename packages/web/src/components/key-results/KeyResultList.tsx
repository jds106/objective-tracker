import type { KeyResult } from '@objective-tracker/shared';
import { ProgressBar } from '../ProgressBar.js';
import { EmptyState } from '../EmptyState.js';

interface KeyResultListProps {
  keyResults: KeyResult[];
  onCheckIn?: (kr: KeyResult) => void;
  onEdit?: (kr: KeyResult) => void;
  onDelete?: (kr: KeyResult) => void;
  canEdit?: boolean;
}

function krTypeLabel(type: string): string {
  switch (type) {
    case 'percentage': return 'Percentage';
    case 'metric': return 'Metric';
    case 'milestone': return 'Milestone';
    case 'binary': return 'Binary';
    default: return type;
  }
}

function krProgressDetail(kr: KeyResult): string {
  switch (kr.config.type) {
    case 'percentage':
      return `${Math.round(kr.config.currentValue)}%`;
    case 'metric': {
      const { currentValue, targetValue, unit } = kr.config;
      return `${currentValue} / ${targetValue} ${unit}`;
    }
    case 'milestone': {
      const done = kr.config.milestones.filter(m => m.completed).length;
      return `${done} / ${kr.config.milestones.length} milestones`;
    }
    case 'binary':
      return kr.config.completed ? 'Complete' : 'Not complete';
  }
}

export function KeyResultList({ keyResults, onCheckIn, onEdit, onDelete, canEdit = false }: KeyResultListProps) {
  if (keyResults.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
          </svg>
        }
        title="No key results yet"
        description="Add key results to measure progress towards this objective."
        className="py-6"
      />
    );
  }

  return (
    <div className="space-y-3">
      {keyResults.map(kr => (
        <div key={kr.id} className="rounded-lg bg-surface border border-slate-700 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-slate-200 truncate">{kr.title}</h4>
                <span className="text-xs text-slate-500 shrink-0">{krTypeLabel(kr.type)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{krProgressDetail(kr)}</p>
              <ProgressBar progress={kr.progress} className="mt-2" />
            </div>
            <span className="text-sm font-semibold text-slate-300 shrink-0">
              {Math.round(kr.progress)}%
            </span>
          </div>

          {canEdit && (
            <div className="mt-3 flex gap-2">
              {onCheckIn && (
                <button
                  onClick={() => onCheckIn(kr)}
                  className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                  Check in
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(kr)}
                  className="rounded-md bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-600 transition-colors"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(kr)}
                  className="rounded-md px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
