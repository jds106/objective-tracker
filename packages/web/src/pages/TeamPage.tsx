import { UserGroupIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/auth.context.js';
import { useCycle } from '../contexts/cycle.context.js';
import { useReports } from '../hooks/useReports.js';
import { useObjectives } from '../hooks/useObjectives.js';
import { useTeamData } from '../hooks/useTeamData.js';
import { ReportCard } from '../components/team/ReportCard.js';
import { KrSupportSummary } from '../components/team/KrSupportSummary.js';
import { ErrorAlert } from '../components/ErrorAlert.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { EmptyState } from '../components/EmptyState.js';
import { PageTransition } from '../components/PageTransition.js';

export function TeamPage() {
  const { isAdmin } = useAuth();
  const { selectedCycle } = useCycle();
  const { reports, isLoading: reportsLoading, error: reportsError } = useReports();
  const { objectives: myObjectives } = useObjectives(selectedCycle?.id);
  const { reportData, isLoading: teamLoading, error: teamError } = useTeamData(reports, selectedCycle?.id);

  const isLoading = reportsLoading || teamLoading;
  const error = reportsError || teamError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <PageTransition>
        <EmptyState
          icon={
            <UserGroupIcon className="h-12 w-12" />
          }
          title="No direct reports"
          description={
            isAdmin
              ? "You don't have any direct reports yet. Go to the Admin panel to assign team members to your reporting line."
              : "You don't have any direct reports in the organisation. Ask your administrator to update the org structure if this doesn't look right."
          }
        />
      </PageTransition>
    );
  }

  const allReportObjectives = reportData.flatMap(rd => rd.objectives);

  return (
    <PageTransition>
      <h2 className="text-2xl font-bold text-slate-100">Team</h2>
      <p className="mt-1 text-slate-400">
        {reports.length} direct {reports.length === 1 ? 'report' : 'reports'}
      </p>

      {error && (
        <ErrorAlert
          message="Failed to load team data. Some information may be incomplete."
          className="mt-4"
        />
      )}

      {myObjectives.length > 0 && allReportObjectives.length > 0 && (
        <div className="mt-6">
          <KrSupportSummary
            managerObjectives={myObjectives}
            reportObjectives={allReportObjectives}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        <h3 className="text-lg font-semibold text-slate-100">Direct Reports</h3>
        {reportData.map(rd => (
          <ReportCard
            key={rd.user.id}
            user={rd.user}
            objectives={rd.objectives}
            cycle={selectedCycle}
          />
        ))}
      </div>
    </PageTransition>
  );
}
