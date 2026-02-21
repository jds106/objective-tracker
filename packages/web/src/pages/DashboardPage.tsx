import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CreateObjectiveBody, UpdateObjectiveBody } from '@objective-tracker/shared';
import { calculateObjectiveProgress, calculateHealthStatus, type HealthStatus } from '@objective-tracker/shared';
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
  const { activeCycle } = useCycle();
  const { objectives, isLoading, error, refetch, create } = useObjectives(activeCycle?.id);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreate = async (input: CreateObjectiveBody | UpdateObjectiveBody) => {
    await create(input as CreateObjectiveBody);
  };

  const sortedObjectives = [...objectives].sort((a, b) => {
    const aProgress = calculateObjectiveProgress(a.keyResults.map(kr => kr.progress));
    const bProgress = calculateObjectiveProgress(b.keyResults.map(kr => kr.progress));
    const aCheckIns = a.keyResults.flatMap(kr => kr.checkIns);
    const bCheckIns = b.keyResults.flatMap(kr => kr.checkIns);
    const aHealth = calculateHealthStatus(aProgress, activeCycle, aCheckIns);
    const bHealth = calculateHealthStatus(bProgress, activeCycle, bCheckIns);
    return healthOrder[aHealth] - healthOrder[bHealth];
  });

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
        {activeCycle
          ? (activeCycle.quarters.find(q => {
              const now = new Date();
              return now >= new Date(q.startDate) && now <= new Date(q.endDate);
            })?.name ?? activeCycle.name)
          : 'No active cycle'}
      </p>

      {error && (
        <ErrorAlert
          message="Failed to load your objectives. Please try again."
          onRetry={refetch}
          className="mt-4"
        />
      )}

      {!activeCycle && !isLoading && (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
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

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">My Objectives</h3>
          {objectives.some(o => o.keyResults.length > 0) && (
            <Link
              to="/check-in"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Check in on all
            </Link>
          )}
        </div>

        {objectives.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            }
            title="No objectives yet"
            description="Create your first objective to start tracking your goals and key results."
            action={
              activeCycle && (
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
            {activeCycle && <CreateObjectiveButton onClick={() => setShowCreateModal(true)} />}
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
