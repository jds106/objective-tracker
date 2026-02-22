import type { Objective, KeyResultConfig } from '@objective-tracker/shared';
import { calculateProgress, calculateObjectiveProgress, calculateHealthStatus } from '@objective-tracker/shared';
import type { HealthStatus } from '@objective-tracker/shared';
import { useCycle } from '../../contexts/cycle.context.js';
import { ProgressRing } from '../ProgressRing.js';
import { StatusBadge } from '../StatusBadge.js';
import { HealthBadge } from '../HealthBadge.js';
import { BulkCheckInKRCard } from './BulkCheckInKRCard.js';

interface BulkCheckInObjectiveGroupProps {
  objective: Objective;
  editedConfigs: Map<string, KeyResultConfig>;
  notes: Map<string, string>;
  results: Map<string, 'success' | 'error'>;
  errors: Map<string, string>;
  onConfigChange: (krId: string, config: KeyResultConfig) => void;
  onNoteChange: (krId: string, note: string) => void;
}

const healthColourMap: Record<HealthStatus, string> = {
  on_track: 'text-emerald-500',
  at_risk: 'text-amber-500',
  behind: 'text-red-500',
  late: 'text-rose-500',
  not_started: 'text-slate-500',
};

export function BulkCheckInObjectiveGroup({
  objective,
  editedConfigs,
  notes,
  results,
  errors,
  onConfigChange,
  onNoteChange,
}: BulkCheckInObjectiveGroupProps) {
  const { selectedCycle } = useCycle();

  // Calculate live progress from edited configs
  const liveKrProgresses = objective.keyResults.map(kr => {
    const edited = editedConfigs.get(kr.id);
    return edited ? calculateProgress(edited) : kr.progress;
  });
  const liveProgress = calculateObjectiveProgress(liveKrProgresses);

  // Calculate live health status
  const allCheckIns = objective.keyResults.flatMap(kr => kr.checkIns);
  const health = calculateHealthStatus(liveProgress, selectedCycle, allCheckIns);

  return (
    <div className="rounded-xl bg-surface-raised border border-slate-700 overflow-hidden">
      {/* Objective header */}
      <div className="flex items-center gap-4 p-5 border-b border-slate-700/50">
        <ProgressRing
          progress={liveProgress}
          size={48}
          strokeWidth={4}
          className={healthColourMap[health]}
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-100 truncate">
            {objective.title}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={objective.status} />
            <HealthBadge status={health} />
          </div>
        </div>
      </div>

      {/* Key result cards */}
      <div className="p-4 space-y-3">
        {objective.keyResults.map(kr => (
          <BulkCheckInKRCard
            key={kr.id}
            keyResult={kr}
            editedConfig={editedConfigs.get(kr.id)}
            note={notes.get(kr.id) ?? ''}
            result={results.get(kr.id)}
            error={errors.get(kr.id)}
            onConfigChange={config => onConfigChange(kr.id, config)}
            onNoteChange={note => onNoteChange(kr.id, note)}
          />
        ))}
      </div>
    </div>
  );
}
