import { useState, useMemo } from 'react';
import type { ObjectiveStatus, HealthStatus } from '@objective-tracker/shared';
import { calculateObjectiveProgress, calculateHealthStatus } from '@objective-tracker/shared';
import { useCycle } from '../contexts/cycle.context.js';
import { useCascadeTree } from '../hooks/useCascadeTree.js';
import { CascadeTree } from '../components/cascade/CascadeTree.js';
import { CascadeFilters } from '../components/cascade/CascadeFilters.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import type { CascadeNode } from '../services/cascade.api.js';

function filterNode(
  node: CascadeNode,
  search: string,
  statusFilter: ObjectiveStatus | '',
  healthFilter: HealthStatus | '',
): CascadeNode | null {
  const filteredChildren = node.children
    .map(child => filterNode(child, search, statusFilter, healthFilter))
    .filter((n): n is CascadeNode => n !== null);

  const matchesSearch = !search
    || node.objective.title.toLowerCase().includes(search.toLowerCase())
    || node.owner.displayName.toLowerCase().includes(search.toLowerCase());

  const matchesStatus = !statusFilter || node.objective.status === statusFilter;

  const progress = calculateObjectiveProgress(node.objective.keyResults.map(kr => kr.progress));
  const allCheckIns = node.objective.keyResults.flatMap(kr => kr.checkIns);
  const health = calculateHealthStatus(progress, null, allCheckIns);
  const matchesHealth = !healthFilter || health === healthFilter;

  const selfMatches = matchesSearch && matchesStatus && matchesHealth;

  if (selfMatches || filteredChildren.length > 0) {
    return { ...node, children: filteredChildren };
  }

  return null;
}

export function CascadeTreePage() {
  const { activeCycle } = useCycle();
  const { tree, isLoading } = useCascadeTree(activeCycle?.id);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ObjectiveStatus | ''>('');
  const [healthFilter, setHealthFilter] = useState<HealthStatus | ''>('');

  const filteredTree = useMemo(() => {
    if (!search && !statusFilter && !healthFilter) return tree;
    return tree
      .map(node => filterNode(node, search, statusFilter, healthFilter))
      .filter((n): n is CascadeNode => n !== null);
  }, [tree, search, statusFilter, healthFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-100">Cascade View</h2>
      <p className="mt-1 text-slate-400">
        See how objectives cascade through the organisation.
      </p>

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

      <div className="mt-6">
        <CascadeTree nodes={filteredTree} />
      </div>
    </div>
  );
}
