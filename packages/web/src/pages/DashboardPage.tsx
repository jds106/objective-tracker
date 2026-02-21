import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ExclamationCircleIcon, CheckCircleIcon, QueueListIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import type { CreateObjectiveBody, UpdateObjectiveBody, KeyResult, Objective } from '@objective-tracker/shared';
import { calculateObjectiveProgress, calculateHealthStatus, type HealthStatus, formatRelativeTime } from '@objective-tracker/shared';
import { useAuth } from '../contexts/auth.context.js';
import { useCycle } from '../contexts/cycle.context.js';
import { useObjectives } from '../hooks/useObjectives.js';
import { StatCards } from '../components/dashboard/StatCards.js';
import { ObjectiveCard } from '../components/dashboard/ObjectiveCard.js';
import { RecentActivity } from '../components/dashboard/RecentActivity.js';
import { CreateObjectiveButton } from '../components/dashboard/CreateObjectiveButton.js';
import { ObjectiveFormModal } from '../components/objectives/ObjectiveFormModal.js';
import { EmptyState } from '../components/EmptyState.js';
import { ErrorAlert } from '../components/ErrorAlert.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { PageTransition } from '../components/PageTransition.js';

const healthOrder: Record<HealthStatus, number> = {
  behind: 0,
  at_risk: 1,
  not_started: 2,
  on_track: 3,
};

export function DashboardPage() {
  const { user } = useAuth();
  const { activeCycle, selectedCycle, isHistorical } = useCycle();
  const { objectives, isLoading, error, refetch, create } = useObjectives(selectedCycle?.id);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreate = async (input: CreateObjectiveBody | UpdateObjectiveBody) => {
    await create(input as CreateObjectiveBody);
  };

  const sortedObjectives = [...objectives].sort((a, b) => {
    const aProgress = calculateObjectiveProgress(a.keyResults.map(kr => kr.progress));
    const bProgress = calculateObjectiveProgress(b.keyResults.map(kr => kr.progress));
    const aCheckIns = a.keyResults.flatMap(kr => kr.checkIns);
    const bCheckIns = b.keyResults.flatMap(kr => kr.checkIns);
    const aHealth = calculateHealthStatus(aProgress, selectedCycle, aCheckIns);
    const bHealth = calculateHealthStatus(bProgress, selectedCycle, bCheckIns);
    return healthOrder[aHealth] - healthOrder[bHealth];
  });

  // Find stale KRs — active objectives with KRs that haven't been updated in 14+ days
  const STALE_DAYS = 14;
  const staleNudges = useMemo(() => {
    const now = Date.now();
    const staleThreshold = STALE_DAYS * 24 * 60 * 60 * 1000;
    const nudges: Array<{ objective: Objective; keyResult: KeyResult; daysSince: number }> = [];

    for (const obj of objectives) {
      if (obj.status !== 'active' && obj.status !== 'draft') continue;
      for (const kr of obj.keyResults) {
        if (kr.progress >= 100) continue; // Already complete
        const lastCheckIn = kr.checkIns.length > 0
          ? Math.max(...kr.checkIns.map(ci => new Date(ci.timestamp).getTime()))
          : new Date(obj.createdAt).getTime();
        const elapsed = now - lastCheckIn;
        if (elapsed >= staleThreshold) {
          nudges.push({
            objective: obj,
            keyResult: kr,
            daysSince: Math.floor(elapsed / (24 * 60 * 60 * 1000)),
          });
        }
      }
    }

    return nudges.sort((a, b) => b.daysSince - a.daysSince).slice(0, 5);
  }, [objectives]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <PageTransition>
      <h2 className="text-3xl font-bold tracking-tight text-slate-100">
        Welcome back, {user?.displayName}
      </h2>
      <p className="mt-1 text-slate-400">
        {selectedCycle
          ? (selectedCycle.quarters.find(q => {
              const now = new Date();
              return now >= new Date(q.startDate) && now <= new Date(q.endDate);
            })?.name ?? selectedCycle.name)
          : 'No active cycle'}
        {isHistorical && (
          <span className="ml-2 text-xs text-amber-400">(viewing historical cycle)</span>
        )}
      </p>

      {error && (
        <ErrorAlert
          message="Failed to load your objectives. Please try again."
          onRetry={refetch}
          className="mt-4"
        />
      )}

      {!activeCycle && !isLoading && !isHistorical && (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <ExclamationCircleIcon className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="text-sm text-amber-300">
              <p className="font-medium">No active cycle</p>
              <p className="mt-1 text-amber-400/80">
                Objectives can only be created within an active cycle.
                {user?.role === 'admin'
                  ? ' Go to the Admin panel to create one.'
                  : ' Contact your administrator to set up an objective cycle.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <StatCards objectives={objectives} />
      </div>

      {/* Stale KR nudges */}
      {!isHistorical && staleNudges.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BellAlertIcon className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-300">Needs attention</h3>
          </div>
          <div className="space-y-2">
            {staleNudges.map(nudge => (
              <Link
                key={nudge.keyResult.id}
                to={`/objectives/${nudge.objective.id}`}
                className="flex items-center justify-between gap-3 rounded-lg bg-surface/50 px-3 py-2 hover:bg-surface transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                    {nudge.keyResult.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {nudge.objective.title} · {Math.round(nudge.keyResult.progress)}% complete
                  </p>
                </div>
                <span className="text-xs text-amber-400/80 shrink-0 whitespace-nowrap">
                  {nudge.daysSince}d ago
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">My Objectives</h3>
          {!isHistorical && objectives.some(o => o.keyResults.length > 0) && (
            <Link
              to="/check-in"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition-colors"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Check in on all
            </Link>
          )}
        </div>

        {objectives.length === 0 ? (
          <EmptyState
            icon={<QueueListIcon className="h-12 w-12" />}
            title={isHistorical ? 'No objectives in this cycle' : 'No objectives yet'}
            description={
              isHistorical
                ? 'There are no objectives recorded for this historical cycle.'
                : 'Create your first objective to start tracking your goals and key results.'
            }
            action={
              !isHistorical && activeCycle && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                  Create Objective
                </button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedObjectives.map(obj => (
              <ObjectiveCard key={obj.id} objective={obj} />
            ))}
            {!isHistorical && activeCycle && <CreateObjectiveButton onClick={() => setShowCreateModal(true)} />}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Recent Activity</h3>
        <div className="rounded-xl bg-surface-raised border border-slate-700 p-6">
          <RecentActivity objectives={objectives} />
        </div>
      </div>

      {activeCycle && (
        <ObjectiveFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          cycleId={activeCycle.id}
        />
      )}
    </PageTransition>
  );
}
