import { Link } from 'react-router-dom';
import { calculateObjectiveProgress, calculateHealthStatus } from '@objective-tracker/shared';
import type { CascadeNode } from '../../services/cascade.api.js';
import { useCycle } from '../../contexts/cycle.context.js';
import { ProgressRing } from '../ProgressRing.js';
import { HealthBadge } from '../HealthBadge.js';

interface CascadeTreeNodeProps {
  node: CascadeNode;
}

export function CascadeTreeNode({ node }: CascadeTreeNodeProps) {
  const { activeCycle } = useCycle();
  const progress = calculateObjectiveProgress(node.objective.keyResults.map(kr => kr.progress));
  const allCheckIns = node.objective.keyResults.flatMap(kr => kr.checkIns);
  const health = calculateHealthStatus(progress, activeCycle, allCheckIns);

  return (
    <Link
      to={`/objectives/${node.objective.id}`}
      className="block w-56 rounded-lg bg-surface-raised border border-slate-700 p-3 hover:border-indigo-500/50 transition-colors"
    >
      <div className="flex items-start gap-2">
        <ProgressRing progress={progress} size={32} strokeWidth={3} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-200 truncate">{node.objective.title}</p>
          <p className="text-xs text-slate-500 truncate">{node.owner.displayName}</p>
        </div>
      </div>
      <div className="mt-2">
        <HealthBadge status={health} />
      </div>
    </Link>
  );
}
