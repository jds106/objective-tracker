import type { CheckIn } from '@objective-tracker/shared';

interface CheckInTimelineProps {
  checkIns: CheckIn[];
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function CheckInTimeline({ checkIns }: CheckInTimelineProps) {
  if (checkIns.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-3">No check-ins recorded yet.</p>
    );
  }

  const sorted = [...checkIns].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className="relative">
      <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-700" />
      <div className="space-y-4">
        {sorted.map(ci => {
          const diff = ci.newProgress - ci.previousProgress;
          return (
            <div key={ci.id} className="relative flex gap-4 pl-8">
              <div className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-slate-700 bg-surface-raised" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200">
                    {Math.round(ci.previousProgress)}% &rarr; {Math.round(ci.newProgress)}%
                  </span>
                  {diff !== 0 && (
                    <span className={`text-xs ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ({diff > 0 ? '+' : ''}{Math.round(diff)}%)
                    </span>
                  )}
                  <span className="text-xs text-slate-500 capitalize">{ci.source}</span>
                </div>
                {ci.note && (
                  <p className="mt-1 text-sm text-slate-400">{ci.note}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">{formatDate(ci.timestamp)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
