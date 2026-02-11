import { Link } from 'react-router-dom';
import type { Objective } from '@objective-tracker/shared';
import { calculateObjectiveProgress, calculateHealthStatus } from '@objective-tracker/shared';
import { useCycle } from '../../contexts/cycle.context.js';
import { ProgressRing } from '../ProgressRing.js';
import { HealthBadge } from '../HealthBadge.js';
import { StatusBadge } from '../StatusBadge.js';

interface ObjectiveCardProps {
  objective: Objective;
}

export function ObjectiveCard({ objective }: ObjectiveCardProps) {
  const { activeCycle } = useCycle();
  const progress = calculateObjectiveProgress(objective.keyResults.map(kr => kr.progress));
  const allCheckIns = objective.keyResults.flatMap(kr => kr.checkIns);
  const health = calculateHealthStatus(progress, activeCycle, allCheckIns);

  return (
    <Link
      to={`/objectives/${objective.id}`}
      className="block rounded-xl bg-surface-raised border border-slate-700 p-6 hover:border-slate-600 transition-colors"
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
}
