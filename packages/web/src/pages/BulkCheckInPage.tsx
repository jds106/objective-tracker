import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context.js';
import { useCycle } from '../contexts/cycle.context.js';
import { useObjectives } from '../hooks/useObjectives.js';
import { useBulkCheckIn } from '../hooks/useBulkCheckIn.js';
import { BulkCheckInObjectiveGroup } from '../components/check-ins/BulkCheckInObjectiveGroup.js';
import { EmptyState } from '../components/EmptyState.js';
import { ErrorAlert } from '../components/ErrorAlert.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { PageTransition } from '../components/PageTransition.js';

export function BulkCheckInPage() {
  const { user } = useAuth();
  const { activeCycle } = useCycle();
  const { objectives, isLoading, error, refetch } = useObjectives(activeCycle?.id);

  // Filter to objectives with at least one KR and that are active or draft
  const eligibleObjectives = objectives.filter(
    obj => (obj.status === 'active' || obj.status === 'draft') && obj.keyResults.length > 0,
  );

  const totalKrs = eligibleObjectives.reduce((sum, obj) => sum + obj.keyResults.length, 0);

  const {
    editedConfigs,
    notes,
    results,
    errors: checkInErrors,
    isSubmitting,
    hasSubmitted,
    dirtyCount,
    successCount,
    errorCount,
    updateConfig,
    updateNote,
    resetAll,
    submitAll,
  } = useBulkCheckIn(eligibleObjectives, refetch);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  const allSucceeded = hasSubmitted && errorCount === 0 && successCount > 0;

  return (
    <PageTransition>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">
          Bulk Check-in
        </h2>
        <p className="mt-1 text-slate-400">
          Update all your key results in one go, {user?.displayName?.split(' ')[0]}.
          {totalKrs > 0 && (
            <span className="text-slate-500">
              {' '}{totalKrs} key result{totalKrs !== 1 ? 's' : ''} across {eligibleObjectives.length} objective{eligibleObjectives.length !== 1 ? 's' : ''}.
            </span>
          )}
        </p>
      </div>

      {error && (
        <ErrorAlert
          message="Failed to load your objectives. Please try again."
          onRetry={refetch}
          className="mb-6"
        />
      )}

      {/* Empty state */}
      {eligibleObjectives.length === 0 && !error && (
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Nothing to check in on"
          description="You have no active objectives with key results. Create some objectives first, then come back here."
          action={
            <Link
              to="/dashboard"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Go to Dashboard
            </Link>
          }
        />
      )}

      {/* Objective groups */}
      {eligibleObjectives.length > 0 && (
        <div className="space-y-6 pb-24">
          {eligibleObjectives.map(obj => (
            <BulkCheckInObjectiveGroup
              key={obj.id}
              objective={obj}
              editedConfigs={editedConfigs}
              notes={notes}
              results={results}
              errors={checkInErrors}
              onConfigChange={updateConfig}
              onNoteChange={updateNote}
            />
          ))}
        </div>
      )}

      {/* Sticky footer */}
      {eligibleObjectives.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 z-20 bg-surface-raised border-t border-slate-700 px-4 py-3 md:px-8">
          <div className="mx-auto max-w-6xl flex items-center justify-between">
            <div className="text-sm">
              {allSucceeded ? (
                <span className="text-emerald-400 font-medium">
                  ✓ All {successCount} check-in{successCount !== 1 ? 's' : ''} recorded!
                </span>
              ) : hasSubmitted && errorCount > 0 ? (
                <span className="text-red-400 font-medium">
                  {errorCount} of {successCount + errorCount} failed
                  {successCount > 0 && (
                    <span className="text-emerald-400 ml-2">
                      ({successCount} succeeded)
                    </span>
                  )}
                </span>
              ) : dirtyCount > 0 ? (
                <span className="text-slate-300">
                  <span className="font-semibold text-indigo-400">{dirtyCount}</span>
                  {' '}change{dirtyCount !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-slate-500">
                  No changes yet — adjust your key results above
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {allSucceeded ? (
                <Link
                  to="/dashboard"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                  Back to Dashboard
                </Link>
              ) : (
                <>
                  {(dirtyCount > 0 || hasSubmitted) && (
                    <button
                      type="button"
                      onClick={resetAll}
                      disabled={isSubmitting}
                      className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition-colors"
                    >
                      {hasSubmitted && errorCount > 0 ? 'Reset' : 'Discard'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={submitAll}
                    disabled={dirtyCount === 0 || isSubmitting}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting
                      ? 'Submitting…'
                      : hasSubmitted && errorCount > 0
                        ? `Retry ${errorCount} failed`
                        : `Submit all check-ins${dirtyCount > 0 ? ` (${dirtyCount})` : ''}`
                    }
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
