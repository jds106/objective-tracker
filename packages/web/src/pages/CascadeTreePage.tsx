import { useState, useMemo, lazy, Suspense } from 'react';
import type { ObjectiveStatus, HealthStatus, Cycle } from '@objective-tracker/shared';
import { calculateObjectiveProgress, calculateHealthStatus } from '@objective-tracker/shared';
import { useCycle } from '../contexts/cycle.context.js';
import { useCascadeTree } from '../hooks/useCascadeTree.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { D3CascadeTree } from '../components/cascade/D3CascadeTree.js';
import { CascadeFilters } from '../components/cascade/CascadeFilters.js';
import { ErrorAlert } from '../components/ErrorAlert.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { PageTransition } from '../components/PageTransition.js';
import type { CascadeNode } from '../services/cascade.api.js';

const D3NetworkGraph = lazy(() =>
  import('../components/cascade/D3NetworkGraph.js').then(m => ({ default: m.D3NetworkGraph })),
);

type ViewMode = 'tree' | 'network';

function filterNode(
  node: CascadeNode,
  search: string,
  statusFilter: ObjectiveStatus | '',
  healthFilter: HealthStatus | '',
  activeCycle: Cycle | null,
): CascadeNode | null {
  const filteredChildren = node.children
    .map(child => filterNode(child, search, statusFilter, healthFilter, activeCycle))
    .filter((n): n is CascadeNode => n !== null);

  const matchesSearch = !search
    || node.objective.title.toLowerCase().includes(search.toLowerCase())
    || node.owner.displayName.toLowerCase().includes(search.toLowerCase());

  const matchesStatus = !statusFilter || node.objective.status === statusFilter;

  const progress = calculateObjectiveProgress(node.objective.keyResults.map(kr => kr.progress));
  const allCheckIns = node.objective.keyResults.flatMap(kr => kr.checkIns);
  const health = calculateHealthStatus(progress, activeCycle, allCheckIns);
  const matchesHealth = !healthFilter || health === healthFilter;

  const selfMatches = matchesSearch && matchesStatus && matchesHealth;

  if (selfMatches || filteredChildren.length > 0) {
    return { ...node, children: filteredChildren };
  }

  return null;
}

export function CascadeTreePage() {
  const { activeCycle } = useCycle();
  const { tree, isLoading, error, refetch } = useCascadeTree(activeCycle?.id);

  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [statusFilter, setStatusFilter] = useState<ObjectiveStatus | ''>('');
  const [healthFilter, setHealthFilter] = useState<HealthStatus | ''>('');

  const filteredTree = useMemo(() => {
    if (!debouncedSearch && !statusFilter && !healthFilter) return tree;
    return tree
      .map(node => filterNode(node, debouncedSearch, statusFilter, healthFilter, activeCycle))
      .filter((n): n is CascadeNode => n !== null);
  }, [tree, debouncedSearch, statusFilter, healthFilter, activeCycle]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <PageTransition className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Cascade View</h2>
            <p className="mt-1 text-slate-400">
              See how objectives cascade through the organisation.
            </p>
          </div>

          {/* View mode toggle */}
          <div className="flex rounded-lg bg-surface-raised border border-slate-700 p-0.5">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'tree'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tree
            </button>
            <button
              onClick={() => setViewMode('network')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'network'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Network
            </button>
          </div>
        </div>

        {error && (
          <ErrorAlert
            message="Failed to load the cascade tree. Please try again."
            onRetry={refetch}
            className="mt-4"
          />
        )}

        <div className="mt-6">
          <CascadeFilters
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            healthFilter={healthFilter}
            onHealthFilterChange={setHealthFilter}
          />
        </div>
      </div>

      <div className="mt-6 flex-1 min-h-0">
        {viewMode === 'tree' ? (
          <D3CascadeTree nodes={filteredTree} />
        ) : (
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner />
            </div>
          }>
            <D3NetworkGraph nodes={filteredTree} activeCycle={activeCycle} />
          </Suspense>
        )}
      </div>
    </PageTransition>
  );
}
