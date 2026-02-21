import { useState, memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { User, Objective, Cycle } from '@objective-tracker/shared';
import { calculateObjectiveProgress, calculateHealthStatus } from '@objective-tracker/shared';
import { UserAvatar } from '../UserAvatar.js';
import { ProgressRing } from '../ProgressRing.js';
import { HealthBadge } from '../HealthBadge.js';
import { StatusBadge } from '../StatusBadge.js';

interface ReportCardProps {
  user: User;
  objectives: Objective[];
  cycle: Cycle | null;
}

function getCheckInRecency(objectives: Objective[]): { label: string; colour: string } {
  const allCheckIns = objectives.flatMap(o => o.keyResults.flatMap(kr => kr.checkIns));

  if (objectives.length === 0) {
    return { label: 'No objectives', colour: 'text-slate-500' };
  }

  if (allCheckIns.length === 0) {
    return { label: 'No check-ins', colour: 'text-red-400' };
  }

  const latest = Math.max(...allCheckIns.map(c => new Date(c.timestamp).getTime()));
  const daysSince = (Date.now() - latest) / (1000 * 60 * 60 * 24);

  if (daysSince <= 7) return { label: 'Up to date', colour: 'text-emerald-400' };
  if (daysSince <= 14) return { label: 'Check-in due', colour: 'text-amber-400' };
  return { label: 'Overdue', colour: 'text-red-400' };
}

export const ReportCard = memo(function ReportCard({ user, objectives, cycle }: ReportCardProps) {
  const [expanded, setExpanded] = useState(false);

  const avgProgress = useMemo(() => {
    const allProgress = objectives.map(o =>
      calculateObjectiveProgress(o.keyResults.map(kr => kr.progress))
    );
    return allProgress.length > 0
      ? allProgress.reduce((a, b) => a + b, 0) / allProgress.length
      : 0;
  }, [objectives]);

  const recency = useMemo(() => getCheckInRecency(objectives), [objectives]);

  return (
    <div className="rounded-xl bg-surface-raised border border-slate-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-4 hover:bg-slate-700/30 transition-colors text-left"
      >
        <UserAvatar user={user} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-200 truncate">{user.displayName}</p>
          <p className="text-xs text-slate-400 truncate">{user.jobTitle}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-xs font-medium ${recency.colour}`}>{recency.label}</span>
          <ProgressRing progress={avgProgress} size={36} strokeWidth={3} />
          <motion.svg
            className="h-4 w-4 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </motion.svg>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-slate-700/50 pt-3">
              {objectives.length === 0 ? (
                <p className="text-sm text-slate-500 py-2">No objectives this cycle.</p>
              ) : (
                objectives.map(obj => {
                  const progress = calculateObjectiveProgress(obj.keyResults.map(kr => kr.progress));
                  const checkIns = obj.keyResults.flatMap(kr => kr.checkIns);
                  const health = calculateHealthStatus(progress, cycle, checkIns);

                  return (
                    <Link
                      key={obj.id}
                      to={`/objectives/${obj.id}`}
                      className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-3 hover:bg-slate-800 transition-colors"
                    >
                      <ProgressRing progress={progress} size={28} strokeWidth={2.5} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-200 truncate">{obj.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={obj.status} />
                          <HealthBadge status={health} />
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
