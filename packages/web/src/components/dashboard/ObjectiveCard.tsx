import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Objective } from '@objective-tracker/shared';
import { calculateObjectiveProgress, calculateHealthStatus, type HealthStatus } from '@objective-tracker/shared';
import { useCycle } from '../../contexts/cycle.context.js';
import { ProgressRing } from '../ProgressRing.js';
import { HealthBadge } from '../HealthBadge.js';
import { StatusBadge } from '../StatusBadge.js';

interface ObjectiveCardProps {
  objective: Objective;
}

const healthBorderColours: Record<HealthStatus, string> = {
  on_track: 'border-l-emerald-500',
  at_risk: 'border-l-amber-500',
  behind: 'border-l-red-500',
  not_started: 'border-l-slate-600',
};

export const ObjectiveCard = memo(function ObjectiveCard({ objective }: ObjectiveCardProps) {
  const { activeCycle } = useCycle();

  const progress = useMemo(
    () => calculateObjectiveProgress(objective.keyResults.map(kr => kr.progress)),
    [objective.keyResults],
  );

  const health = useMemo(() => {
    const allCheckIns = objective.keyResults.flatMap(kr => kr.checkIns);
    return calculateHealthStatus(progress, activeCycle, allCheckIns);
  }, [objective.keyResults, progress, activeCycle]);

  return (
    <Link
      to={`/objectives/${objective.id}`}
      className={`block rounded-xl bg-surface-raised border border-slate-700 border-l-[3px] ${healthBorderColours[health]} p-6 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-150`}
      aria-label={`View objective: ${objective.title}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-100 truncate">
            {objective.title}
          </h3>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <StatusBadge status={objective.status} />
            <HealthBadge status={health} />
          </div>
        </div>
        <ProgressRing progress={progress} size={44} strokeWidth={3.5} />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {objective.keyResults.length} key result{objective.keyResults.length !== 1 ? 's' : ''}
      </p>
    </Link>
  );
});
