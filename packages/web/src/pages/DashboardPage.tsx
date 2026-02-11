import { useAuth } from '../contexts/auth.context.js';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-100">
        Welcome back, {user?.displayName}
      </h2>
      <p className="mt-2 text-slate-400">
        Your objectives and key results will appear here.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-surface-raised border border-slate-700 p-6">
          <h3 className="text-sm font-medium text-slate-400">My Objectives</h3>
          <p className="mt-2 text-3xl font-bold text-slate-100">0</p>
          <p className="mt-1 text-sm text-slate-500">No objectives yet</p>
        </div>

        <div className="rounded-xl bg-surface-raised border border-slate-700 p-6">
          <h3 className="text-sm font-medium text-slate-400">Overall Progress</h3>
          <p className="mt-2 text-3xl font-bold text-slate-100">—</p>
          <p className="mt-1 text-sm text-slate-500">Create objectives to track progress</p>
        </div>

        <div className="rounded-xl bg-surface-raised border border-slate-700 p-6">
          <h3 className="text-sm font-medium text-slate-400">Upcoming Check-ins</h3>
          <p className="mt-2 text-3xl font-bold text-slate-100">—</p>
          <p className="mt-1 text-sm text-slate-500">No check-ins due</p>
        </div>
      </div>
    </div>
  );
}
