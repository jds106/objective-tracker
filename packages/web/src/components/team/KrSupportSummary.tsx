import type { Objective } from '@objective-tracker/shared';

interface KrSupportSummaryProps {
  managerObjectives: Objective[];
  reportObjectives: Objective[];
}

interface KrSupport {
  krId: string;
  krTitle: string;
  objectiveTitle: string;
  linkedObjectives: Array<{ id: string; title: string; ownerName?: string }>;
}

export function KrSupportSummary({ managerObjectives, reportObjectives }: KrSupportSummaryProps) {
  const krSupport: KrSupport[] = managerObjectives.flatMap(obj =>
    obj.keyResults.map(kr => {
      const linked = reportObjectives.filter(ro => ro.parentKeyResultId === kr.id);
      return {
        krId: kr.id,
        krTitle: kr.title,
        objectiveTitle: obj.title,
        linkedObjectives: linked.map(lo => ({ id: lo.id, title: lo.title })),
      };
    })
  );

  if (krSupport.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-100 mb-3">KR Support Summary</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {krSupport.map(ks => {
          const count = ks.linkedObjectives.length;
          const borderColour = count >= 2
            ? 'border-emerald-500/40'
            : count === 1
            ? 'border-amber-500/40'
            : 'border-red-500/40';
          const countColour = count >= 2
            ? 'text-emerald-400'
            : count === 1
            ? 'text-amber-400'
            : 'text-red-400';
          const label = count >= 2
            ? 'Well supported'
            : count === 1
            ? 'Partially supported'
            : 'Under-supported';

          return (
            <div
              key={ks.krId}
              className={`rounded-lg bg-surface-raised border ${borderColour} p-4`}
            >
              <p className="text-sm font-medium text-slate-200 truncate">{ks.krTitle}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{ks.objectiveTitle}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs font-medium ${countColour}`}>
                  {count} linked {count === 1 ? 'objective' : 'objectives'}
                </span>
                <span className="text-xs text-slate-600">&middot;</span>
                <span className={`text-xs ${countColour}`}>{label}</span>
              </div>
              {ks.linkedObjectives.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {ks.linkedObjectives.map(lo => (
                    <li key={lo.id} className="text-xs text-slate-400 truncate">
                      &rarr; {lo.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
