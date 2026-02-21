import { ClockIcon } from '@heroicons/react/24/outline';
import type { Objective, CheckIn } from '@objective-tracker/shared';
import { formatRelativeTime } from '@objective-tracker/shared';
import { EmptyState } from '../EmptyState.js';

interface ActivityItem {
  checkIn: CheckIn;
  objectiveTitle: string;
  krTitle: string;
}

interface RecentActivityProps {
  objectives: Objective[];
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
      <EmptyState
        icon={<ClockIcon className="h-8 w-8" />}
        title="No recent activity"
        description="Your check-in history will appear here once you start recording progress."
        className="py-6"
      />
    );
  }

  return (
    <div className="space-y-3">
      {recent.map(item => (
        <div key={item.checkIn.id} className="flex items-start gap-3 py-2">
          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
            item.checkIn.newProgress > item.checkIn.previousProgress
              ? 'bg-emerald-500'
              : item.checkIn.newProgress < item.checkIn.previousProgress
                ? 'bg-red-500'
                : 'bg-slate-500'
          }`} />
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
