import type { Objective } from '@objective-tracker/shared';
import { calculateObjectiveProgress, calculateProgress } from '@objective-tracker/shared';
import { ProgressRing } from '../ProgressRing.js';

interface StatCardsProps {
  objectives: Objective[];
}

export function StatCards({ objectives }: StatCardsProps) {
  const objectiveCount = objectives.length;

  const overallProgress = objectiveCount > 0
    ? calculateObjectiveProgress(
        objectives.map(o =>
          calculateObjectiveProgress(o.keyResults.map(kr => kr.progress)),
        ),
      )
    : 0;

  const totalCheckIns = objectives.reduce(
    (sum, o) => sum + o.keyResults.reduce((krSum, kr) => krSum + kr.checkIns.length, 0),
    0,
  );

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-xl bg-surface-raised border border-slate-700 p-6">
        <h3 className="text-sm font-medium text-slate-400">My Objectives</h3>
        <p className="mt-2 text-3xl font-bold text-slate-100">{objectiveCount}</p>
        <p className="mt-1 text-sm text-slate-500">
          {objectiveCount === 0 ? 'No objectives yet' : `${objectives.filter(o => o.status === 'active').length} active`}
        </p>
      </div>

      <div className="rounded-xl bg-surface-raised border border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-slate-400">Overall Progress</h3>
            <p className="mt-2 text-3xl font-bold text-slate-100">
              {objectiveCount > 0 ? `${Math.round(overallProgress)}%` : '\u2014'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {objectiveCount > 0 ? 'Across all objectives' : 'Create objectives to track progress'}
            </p>
          </div>
          {objectiveCount > 0 && (
            <ProgressRing progress={overallProgress} size={56} strokeWidth={5} />
          )}
        </div>
      </div>

      <div className="rounded-xl bg-surface-raised border border-slate-700 p-6">
        <h3 className="text-sm font-medium text-slate-400">Check-ins</h3>
        <p className="mt-2 text-3xl font-bold text-slate-100">{totalCheckIns || '\u2014'}</p>
        <p className="mt-1 text-sm text-slate-500">
          {totalCheckIns > 0 ? 'Total recorded' : 'No check-ins yet'}
        </p>
      </div>
    </div>
  );
}
