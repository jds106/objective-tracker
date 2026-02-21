import { useState, useEffect, useRef, useMemo } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { Objective } from '@objective-tracker/shared';
import * as usersApi from '../../services/users.api.js';
import * as objectivesApi from '../../services/objectives.api.js';

const LINKABLE_STATUSES = new Set(['draft', 'active']);

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
  const [companyObjectives, setCompanyObjectives] = useState<Objective[]>([]);
  const [chainObjectives, setChainObjectives] = useState<Objective[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter to only linkable statuses
  const activeCompanyObjectives = useMemo(
    () => companyObjectives.filter(o => LINKABLE_STATUSES.has(o.status)),
    [companyObjectives],
  );
  const activeChainObjectives = useMemo(
    () => chainObjectives.filter(o => LINKABLE_STATUSES.has(o.status)),
    [chainObjectives],
  );

  const allObjectives = useMemo(
    () => [...activeCompanyObjectives, ...activeChainObjectives],
    [activeCompanyObjectives, activeChainObjectives],
  );

  // Search filtering
  const lowerQuery = query.toLowerCase().trim();
  const filteredCompany = lowerQuery
    ? activeCompanyObjectives.filter(o => o.title.toLowerCase().includes(lowerQuery))
    : activeCompanyObjectives;
  const filteredChain = lowerQuery
    ? activeChainObjectives.filter(o => o.title.toLowerCase().includes(lowerQuery))
    : activeChainObjectives;
  const flatFiltered = [...filteredCompany, ...filteredChain];

  const selectedObjective = allObjectives.find(o => o.id === parentObjectiveId);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function loadObjectives() {
      setIsLoading(true);
      try {
        const [companyResult, chainResult] = await Promise.allSettled([
          objectivesApi.getCompanyObjectives(),
          usersApi.getReportingChain(),
        ]);

        const companyObjs: Objective[] =
          companyResult.status === 'fulfilled' ? companyResult.value.data : [];

        const chain =
          chainResult.status === 'fulfilled' ? chainResult.value.data : [];

        const chainObjs: Objective[] = [];
        for (const user of chain) {
          try {
            const { data: objectives } = await usersApi.getUserObjectives(user.id);
            chainObjs.push(...objectives);
          } catch {
            // User might not have objectives
          }
        }

        if (!cancelled) {
          setCompanyObjectives(companyObjs);
          setChainObjectives(chainObjs);
        }
      } catch {
        // Silently handle — parent linking is optional
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadObjectives();
    return () => { cancelled = true; };
  }, [enabled]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-option]');
    items[highlightIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex]);

  const handleToggle = () => {
    if (enabled) {
      onChange(null, null);
      setQuery('');
    }
    setEnabled(!enabled);
  };

  const handleSelect = (objective: Objective) => {
    onChange(objective.id, null);
    setQuery('');
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const handleClear = () => {
    onChange(null, null);
    setQuery('');
    setIsOpen(false);
    setHighlightIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
      setHighlightIndex(0);
      e.preventDefault();
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(i => (i + 1) % flatFiltered.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(i => (i - 1 + flatFiltered.length) % flatFiltered.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < flatFiltered.length) {
          handleSelect(flatFiltered[highlightIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  function renderGroupedResults() {
    if (flatFiltered.length === 0) {
      return (
        <li className="px-3 py-2 text-sm text-slate-500">
          {lowerQuery ? 'No matching objectives' : 'No linkable objectives found'}
        </li>
      );
    }

    const items: React.ReactNode[] = [];
    let index = 0;

    if (filteredCompany.length > 0) {
      items.push(
        <li key="group-company" className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Company Objectives
        </li>,
      );
      for (const obj of filteredCompany) {
        const i = index++;
        items.push(
          <li
            key={obj.id}
            data-option
            className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
              i === highlightIndex
                ? 'bg-indigo-600/30 text-slate-100'
                : 'text-slate-300 hover:bg-slate-700/50'
            }`}
            onMouseEnter={() => setHighlightIndex(i)}
            onMouseDown={e => { e.preventDefault(); handleSelect(obj); }}
          >
            <span className="block truncate">{obj.title}</span>
            <span className="block text-xs text-slate-500 mt-0.5 capitalize">{obj.status}</span>
          </li>,
        );
      }
    }

    if (filteredChain.length > 0) {
      items.push(
        <li key="group-chain" className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
          Reporting Chain
        </li>,
      );
      for (const obj of filteredChain) {
        const i = index++;
        items.push(
          <li
            key={obj.id}
            data-option
            className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
              i === highlightIndex
                ? 'bg-indigo-600/30 text-slate-100'
                : 'text-slate-300 hover:bg-slate-700/50'
            }`}
            onMouseEnter={() => setHighlightIndex(i)}
            onMouseDown={e => { e.preventDefault(); handleSelect(obj); }}
          >
            <span className="block truncate">{obj.title}</span>
            <span className="block text-xs text-slate-500 mt-0.5 capitalize">{obj.status}</span>
          </li>,
        );
      }
    }

    return items;
  }

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
            <p className="text-sm text-slate-400">Loading available objectives...</p>
          ) : (
            <>
              <div ref={containerRef} className="relative">
                <label htmlFor="parent-obj-search" className="block text-xs font-medium text-slate-400">
                  Parent Objective
                </label>

                {selectedObjective ? (
                  <div className="mt-1 flex items-center gap-2 rounded-lg bg-surface border border-slate-600 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-100 truncate">{selectedObjective.title}</p>
                      <p className="text-xs text-slate-500 capitalize">{selectedObjective.status}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-slate-400 hover:text-slate-200 shrink-0"
                      aria-label="Clear selection"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative mt-1">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                      <input
                        ref={inputRef}
                        id="parent-obj-search"
                        type="text"
                        value={query}
                        onChange={e => {
                          setQuery(e.target.value);
                          setIsOpen(true);
                          setHighlightIndex(0);
                        }}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search objectives..."
                        className="block w-full rounded-lg bg-surface border border-slate-600 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        autoComplete="off"
                        role="combobox"
                        aria-expanded={isOpen}
                        aria-haspopup="listbox"
                        aria-autocomplete="list"
                      />
                    </div>

                    {isOpen && (
                      <ul
                        ref={listRef}
                        role="listbox"
                        className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-lg bg-surface-raised border border-slate-600 py-1 shadow-xl"
                      >
                        {renderGroupedResults()}
                      </ul>
                    )}
                  </>
                )}
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
