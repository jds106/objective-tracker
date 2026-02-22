import { useState, useMemo } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { CascadeNode } from '@objective-tracker/shared';
import { calculateObjectiveProgress, formatDate } from '@objective-tracker/shared';
import { useCascadeTree } from '../../hooks/useCascadeTree.js';
import { useCycle } from '../../contexts/cycle.context.js';
import { useAuth } from '../../contexts/auth.context.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { UserAvatar } from '../UserAvatar.js';
import { ProgressRing } from '../ProgressRing.js';
import { StatusBadge } from '../StatusBadge.js';

const LINKABLE_STATUSES = new Set(['draft', 'active']);

interface ParentObjectivePickerProps {
  parentObjectiveId: string | null;
  parentKeyResultId: string | null;
  onChange: (objectiveId: string | null, keyResultId: string | null) => void;
  excludeObjectiveId?: string;
  childTargetDate?: string;
}

interface FlatEntry {
  node: CascadeNode;
  groupLabel: string;
}

/** Flatten the cascade tree into a list of linkable objectives, grouped by owner. */
function flattenTree(
  nodes: CascadeNode[],
  currentUserId: string | undefined,
  excludeObjectiveId: string | undefined,
): FlatEntry[] {
  const entries: FlatEntry[] = [];

  function walk(node: CascadeNode) {
    const obj = node.objective;
    if (
      LINKABLE_STATUSES.has(obj.status) &&
      node.owner.id !== currentUserId &&
      obj.id !== excludeObjectiveId
    ) {
      const groupLabel = node.owner.level === 0
        ? 'Company Objectives'
        : `${node.owner.displayName} \u00B7 ${node.owner.jobTitle}`;
      entries.push({ node, groupLabel });
    }
    for (const child of node.children) {
      walk(child);
    }
  }

  for (const root of nodes) {
    walk(root);
  }

  return entries;
}

export function ParentObjectivePicker({
  parentObjectiveId,
  parentKeyResultId,
  onChange,
  excludeObjectiveId,
  childTargetDate,
}: ParentObjectivePickerProps) {
  const { user } = useAuth();
  const { selectedCycle } = useCycle();
  const { tree, isLoading } = useCascadeTree(selectedCycle?.id);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);

  const allEntries = useMemo(
    () => flattenTree(tree, user?.id, excludeObjectiveId),
    [tree, user?.id, excludeObjectiveId],
  );

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return allEntries;
    const lower = debouncedQuery.toLowerCase();
    return allEntries.filter(
      e =>
        e.node.objective.title.toLowerCase().includes(lower) ||
        e.node.owner.displayName.toLowerCase().includes(lower),
    );
  }, [allEntries, debouncedQuery]);

  // Group by owner for display
  const grouped = useMemo(() => {
    const groups: Array<{ label: string; entries: FlatEntry[] }> = [];
    let currentLabel = '';
    for (const entry of filtered) {
      if (entry.groupLabel !== currentLabel) {
        currentLabel = entry.groupLabel;
        groups.push({ label: currentLabel, entries: [entry] });
      } else {
        groups[groups.length - 1].entries.push(entry);
      }
    }
    return groups;
  }, [filtered]);

  const selectedEntry = allEntries.find(
    e => e.node.objective.id === parentObjectiveId,
  );

  const handleSelect = (node: CascadeNode) => {
    onChange(node.objective.id, null);
  };

  const handleRemove = () => {
    onChange(null, null);
    setQuery('');
  };

  const handleKrSelect = (krId: string) => {
    onChange(parentObjectiveId, krId === parentKeyResultId ? null : krId);
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-700 bg-surface-raised p-4">
        <p className="text-sm text-slate-400">Loading available objectives...</p>
      </div>
    );
  }

  // Selected state: summary card
  if (selectedEntry) {
    const { node } = selectedEntry;
    const obj = node.objective;
    const progress = calculateObjectiveProgress(obj.keyResults.map(kr => kr.progress));

    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
          <div className="flex items-start gap-3">
            <UserAvatar user={node.owner} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">{obj.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {node.owner.displayName} &middot; {node.owner.jobTitle}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={obj.status} />
                <span className="text-xs text-slate-500">
                  {obj.keyResults.length} key result{obj.keyResults.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <ProgressRing progress={progress} size={36} strokeWidth={3} />
          </div>

          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Remove link
            </button>
            <button
              type="button"
              onClick={() => { onChange(null, null); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Change
            </button>
          </div>
        </div>

        {/* Parent date warning */}
        {childTargetDate && obj.targetDate && childTargetDate > obj.targetDate && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
            <p className="text-xs text-amber-300">
              This objective's target date is later than the parent's ({formatDate(obj.targetDate)}).
              Child objectives should usually finish before their parent.
            </p>
          </div>
        )}

        {/* KR pills for optional KR linking */}
        {obj.keyResults.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">
              Link to a specific key result (optional)
            </p>
            <div className="flex flex-wrap gap-2">
              {obj.keyResults.map(kr => (
                <button
                  key={kr.id}
                  type="button"
                  onClick={() => handleKrSelect(kr.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    kr.id === parentKeyResultId
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {kr.title}
                  <span className="ml-1.5 text-slate-400">
                    {Math.round(kr.progress)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Unselected state: search + card list
  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by objective title or owner name..."
          className="block w-full rounded-lg bg-surface border border-slate-600 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Card list */}
      <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-700 bg-surface-raised divide-y divide-slate-700/50">
        {filtered.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-slate-500">
              {debouncedQuery ? 'No matching objectives' : 'No linkable objectives available'}
            </p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.label}>
              {/* Group header */}
              <div className="sticky top-0 bg-surface-raised/95 backdrop-blur-sm px-4 py-2 border-b border-slate-700/50">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {group.label}
                </p>
              </div>

              {/* Cards */}
              {group.entries.map(({ node }) => {
                const obj = node.objective;
                const progress = calculateObjectiveProgress(
                  obj.keyResults.map(kr => kr.progress),
                );

                return (
                  <button
                    key={obj.id}
                    type="button"
                    onClick={() => handleSelect(node)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-700/30 transition-colors focus:outline-none focus:bg-slate-700/30"
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar user={node.owner} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {obj.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {node.owner.displayName} &middot; {node.owner.jobTitle}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <StatusBadge status={obj.status} />
                          <span className="text-xs text-slate-500">
                            {obj.keyResults.length} key result{obj.keyResults.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <ProgressRing progress={progress} size={32} strokeWidth={3} />
                    </div>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
