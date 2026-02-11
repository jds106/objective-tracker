import type { Objective, CheckIn } from '@objective-tracker/shared';

interface ActivityItem {
  checkIn: CheckIn;
  objectiveTitle: string;
  krTitle: string;
}

interface RecentActivityProps {
  objectives: Objective[];
}

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function RecentActivity({ objectives }: RecentActivityProps) {
  const activities: ActivityItem[] = [];

  for (const obj of objectives) {
    for (const kr of obj.keyResults) {
      for (const ci of kr.checkIns) {
        activities.push({
          checkIn: ci,
          objectiveTitle: obj.title,
          krTitle: kr.title,
        });
      }
    }
  }

  activities.sort((a, b) =>
    new Date(b.checkIn.timestamp).getTime() - new Date(a.checkIn.timestamp).getTime(),
  );

  const recent = activities.slice(0, 5);

  if (recent.length === 0) {
    return (
      <div className="text-sm text-slate-500 py-4">
        No recent activity. Record a check-in to see updates here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recent.map(item => (
        <div key={item.checkIn.id} className="flex items-start gap-3 py-2">
          <div className="mt-1 h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-200">
              <span className="font-medium">{item.krTitle}</span>
              <span className="text-slate-400">
                {' '}{Math.round(item.checkIn.previousProgress)}% → {Math.round(item.checkIn.newProgress)}%
              </span>
            </p>
            {item.checkIn.note && (
              <p className="text-xs text-slate-400 mt-0.5 truncate">{item.checkIn.note}</p>
            )}
            <p className="text-xs text-slate-500 mt-0.5">
              {formatRelativeTime(item.checkIn.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
