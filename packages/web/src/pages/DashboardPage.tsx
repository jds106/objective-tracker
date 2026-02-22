import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ExclamationCircleIcon, CheckCircleIcon, QueueListIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import type { KeyResult, Objective } from '@objective-tracker/shared';
import { calculateObjectiveProgress, calculateHealthStatus, formatDate, formatRelativeTime, type HealthStatus } from '@objective-tracker/shared';
import { useAuth } from '../contexts/auth.context.js';
import { useCycle } from '../contexts/cycle.context.js';
import { useObjectives } from '../hooks/useObjectives.js';
import { StatCards } from '../components/dashboard/StatCards.js';
import { ObjectiveCard } from '../components/dashboard/ObjectiveCard.js';
import { RecentActivity } from '../components/dashboard/RecentActivity.js';
import { CreateObjectiveButton } from '../components/dashboard/CreateObjectiveButton.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { EmptyState } from '../components/EmptyState.js';
import { ErrorAlert } from '../components/ErrorAlert.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { PageTransition } from '../components/PageTransition.js';

type SortBy = 'target_date' | 'completion' | 'name' | 'last_updated';

const CLOSED_STATUSES = new Set(['completed', 'cancelled', 'rolled_forward']);

export function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const { activeCycle, selectedCycle, isHistorical } = useCycle();
  const { objectives, isLoading, error, refetch } = useObjectives(selectedCycle?.id);
  const [sortBy, setSortBy] = useState<SortBy>('target_date');

  const activeObjectives = useMemo(
    () => objectives.filter(o => !CLOSED_STATUSES.has(o.status)),
    [objectives],
  );
  const historicalObjectives = useMemo(
    () => objectives.filter(o => CLOSED_STATUSES.has(o.status)),
    [objectives],
  );

  const sortedObjectives = useMemo(() => {
    const list = [...activeObjectives];
    switch (sortBy) {
      case 'target_date':
        return list.sort((a, b) => (a.targetDate ?? '').localeCompare(b.targetDate ?? ''));
      case 'completion':
        return list.sort((a, b) => {
          const ap = calculateObjectiveProgress(a.keyResults.map(kr => kr.progress));
          const bp = calculateObjectiveProgress(b.keyResults.map(kr => kr.progress));
          return bp - ap;
        });
      case 'name':
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case 'last_updated':
        return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      default:
        return list;
    }
  }, [activeObjectives, sortBy]);

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
          <div className="flex items-center gap-3">
            {activeObjectives.length > 1 && (
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortBy)}
                className="rounded-lg bg-surface border border-slate-700 px-2 py-1 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                aria-label="Sort objectives"
              >
                <option value="target_date">Sort: Target date</option>
                <option value="completion">Sort: Completion %</option>
                <option value="name">Sort: Name</option>
                <option value="last_updated">Sort: Last updated</option>
              </select>
            )}
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
        </div>

        {activeObjectives.length === 0 && historicalObjectives.length === 0 ? (
          <EmptyState
            icon={<QueueListIcon className="h-12 w-12" />}
            title={isHistorical ? 'No objectives in this cycle' : 'No objectives yet'}
            description={
              isHistorical
                ? 'There are no objectives recorded for this historical cycle.'
                : isAdmin
                  ? 'Use the Admin panel to create company objectives or objectives for users.'
                  : 'Create your first objective to start tracking your goals and key results.'
            }
            action={
              !isHistorical && !isAdmin && activeCycle && (
                <Link
                  to="/objectives/new"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                  Create Objective
                </Link>
              )
            }
          />
        ) : (
          <>
            {activeObjectives.length === 0 ? (
              <p className="text-sm text-slate-500 mb-4">No active objectives. All objectives are in the historical section below.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sortedObjectives.map(obj => (
                  <ObjectiveCard key={obj.id} objective={obj} />
                ))}
                {!isHistorical && !isAdmin && activeCycle && <CreateObjectiveButton />}
              </div>
            )}
          </>
        )}
      </div>

      {/* Historical objectives */}
      {historicalObjectives.length > 0 && (
        <div className="mt-8">
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 group-open:text-slate-300 transition-colors">
                  ▸
                </span>
                <h3 className="text-sm font-semibold text-slate-400 group-open:text-slate-300 transition-colors">
                  Historical Objectives ({historicalObjectives.length})
                </h3>
              </div>
            </summary>
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-700 bg-surface-raised">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left text-xs text-slate-500">
                    <th className="px-4 py-2 font-medium">Title</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Target Date</th>
                    <th className="px-4 py-2 font-medium text-right">Progress</th>
                    <th className="px-4 py-2 font-medium text-right">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {historicalObjectives.map(obj => {
                    const p = calculateObjectiveProgress(obj.keyResults.map(kr => kr.progress));
                    return (
                      <tr key={obj.id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-4 py-2">
                          <Link to={`/objectives/${obj.id}`} className="text-slate-200 hover:text-indigo-300 transition-colors truncate block max-w-xs">
                            {obj.title}
                          </Link>
                        </td>
                        <td className="px-4 py-2">
                          <StatusBadge status={obj.status} />
                        </td>
                        <td className="px-4 py-2 text-slate-400 text-xs">
                          {obj.targetDate ? formatDate(obj.targetDate) : '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-300 text-xs">
                          {Math.round(p)}%
                        </td>
                        <td className="px-4 py-2 text-right text-slate-500 text-xs">
                          {formatRelativeTime(obj.updatedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Recent Activity</h3>
        <div className="rounded-xl bg-surface-raised border border-slate-700 p-6">
          <RecentActivity objectives={objectives} />
        </div>
      </div>

    </PageTransition>
  );
}
