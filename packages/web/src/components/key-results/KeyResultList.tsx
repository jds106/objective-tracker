import { useState } from 'react';
import { ChevronDownIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import type { KeyResult } from '@objective-tracker/shared';
import { ProgressBar } from '../ProgressBar.js';
import { EmptyState } from '../EmptyState.js';
import { CheckInTimeline } from '../check-ins/CheckInTimeline.js';

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
  const [expandedKRs, setExpandedKRs] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedKRs(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (keyResults.length === 0) {
    return (
      <EmptyState
        icon={<PresentationChartLineIcon className="h-8 w-8" />}
        title="No key results yet"
        description="Add key results to measure progress towards this objective."
        className="py-6"
      />
    );
  }

  return (
    <div className="space-y-3">
      {keyResults.map(kr => {
        const isExpanded = expandedKRs.has(kr.id);
        const sortedCheckIns = [...kr.checkIns].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        return (
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

            {(canEdit || onCheckIn || kr.checkIns.length > 0) && (
              <div className="mt-3 flex items-center gap-2">
                {onCheckIn && (
                  <button
                    onClick={() => onCheckIn(kr)}
                    className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
                  >
                    Check in
                  </button>
                )}
                {canEdit && (
                  <>
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
                  </>
                )}

                {kr.checkIns.length > 0 && (
                  <button
                    onClick={() => toggleExpanded(kr.id)}
                    className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
                  >
                    Check-ins ({kr.checkIns.length})
                    <motion.span
                      className="inline-flex"
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDownIcon className="h-3.5 w-3.5" />
                    </motion.span>
                  </button>
                )}
              </div>
            )}

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <CheckInTimeline checkIns={sortedCheckIns} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
