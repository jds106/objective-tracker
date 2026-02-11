import { useState, useEffect } from 'react';
import type { Objective } from '@objective-tracker/shared';
import * as usersApi from '../../services/users.api.js';
import * as cascadeApi from '../../services/cascade.api.js';

interface ParentLinkSelectorProps {
  parentObjectiveId: string | null;
  parentKeyResultId: string | null;
  onChange: (objectiveId: string | null, keyResultId: string | null) => void;
}

export function ParentLinkSelector({
  parentObjectiveId,
  parentKeyResultId,
  onChange,
}: ParentLinkSelectorProps) {
  const [enabled, setEnabled] = useState(!!parentObjectiveId);
  const [chainObjectives, setChainObjectives] = useState<Objective[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function loadChainObjectives() {
      setIsLoading(true);
      try {
        const { data: chain } = await usersApi.getReportingChain();
        const allObjectives: Objective[] = [];

        for (const user of chain) {
          try {
            const { data: objectives } = await usersApi.getUserObjectives(user.id);
            allObjectives.push(...objectives);
          } catch {
            // User might not have objectives
          }
        }

        if (!cancelled) setChainObjectives(allObjectives);
      } catch {
        // Silently handle - parent linking is optional
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadChainObjectives();
    return () => { cancelled = true; };
  }, [enabled]);

  const selectedObjective = chainObjectives.find(o => o.id === parentObjectiveId);

  const handleToggle = () => {
    if (enabled) {
      onChange(null, null);
    }
    setEnabled(!enabled);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggle}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            enabled ? 'bg-indigo-600' : 'bg-slate-600'
          }`}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
        <label className="text-sm font-medium text-slate-300 cursor-pointer" onClick={handleToggle}>
          Link to parent objective
        </label>
      </div>

      {enabled && (
        <div className="mt-3 space-y-3">
          {isLoading ? (
            <p className="text-sm text-slate-400">Loading objectives from your reporting chain...</p>
          ) : chainObjectives.length === 0 ? (
            <p className="text-sm text-slate-400">No objectives found in your reporting chain.</p>
          ) : (
            <>
              <div>
                <label htmlFor="parent-obj" className="block text-xs font-medium text-slate-400">
                  Parent Objective
                </label>
                <select
                  id="parent-obj"
                  value={parentObjectiveId ?? ''}
                  onChange={e => {
                    const value = e.target.value || null;
                    onChange(value, null);
                  }}
                  className="mt-1 block w-full rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select an objective...</option>
                  {chainObjectives.map(o => (
                    <option key={o.id} value={o.id}>{o.title}</option>
                  ))}
                </select>
              </div>

              {selectedObjective && selectedObjective.keyResults.length > 0 && (
                <div>
                  <label htmlFor="parent-kr" className="block text-xs font-medium text-slate-400">
                    Linked Key Result (optional)
                  </label>
                  <select
                    id="parent-kr"
                    value={parentKeyResultId ?? ''}
                    onChange={e => onChange(parentObjectiveId, e.target.value || null)}
                    className="mt-1 block w-full rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">None</option>
                    {selectedObjective.keyResults.map(kr => (
                      <option key={kr.id} value={kr.id}>{kr.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
