import { useState } from 'react';
import { ClockIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import type { Objective, CheckIn } from '@objective-tracker/shared';
import { formatRelativeTime } from '@objective-tracker/shared';
import { EmptyState } from '../EmptyState.js';

const INITIAL_COUNT = 5;
const EXPANDED_COUNT = 20;

interface ActivityItem {
  checkIn: CheckIn;
  objectiveTitle: string;
  krTitle: string;
}

interface RecentActivityProps {
  objectives: Objective[];
}

function sourceIcon(source: CheckIn['source']): string {
  switch (source) {
    case 'web': return '🌐';
    case 'slack': return '💬';
    case 'mcp': return '🤖';
    default: return '';
  }
}

export function RecentActivity({ objectives }: RecentActivityProps) {
  const [expanded, setExpanded] = useState(false);
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

  const displayCount = expanded ? EXPANDED_COUNT : INITIAL_COUNT;
  const visible = activities.slice(0, displayCount);
  const hasMore = activities.length > INITIAL_COUNT;
  const showingAll = activities.length <= displayCount;

  if (activities.length === 0) {
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
    <div>
      <div className="space-y-3">
        {visible.map(item => (
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
                {item.checkIn.source && (
                  <span className="ml-1.5 text-xs" title={`Checked in via ${item.checkIn.source}`}>
                    {sourceIcon(item.checkIn.source)}
                  </span>
                )}
              </p>
              {item.checkIn.note && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">{item.checkIn.note}</p>
              )}
              <p className="text-xs text-slate-500 mt-0.5">
                {formatRelativeTime(item.checkIn.timestamp)}
                <span className="text-slate-600 ml-1">· {item.objectiveTitle}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-slate-400 hover:text-slate-300 hover:bg-surface-raised transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUpIcon className="h-3.5 w-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDownIcon className="h-3.5 w-3.5" />
              View all ({activities.length} check-ins)
            </>
          )}
        </button>
      )}
      {expanded && !showingAll && (
        <p className="mt-1 text-center text-xs text-slate-500">
          Showing {displayCount} of {activities.length} check-ins
        </p>
      )}
    </div>
  );
}
