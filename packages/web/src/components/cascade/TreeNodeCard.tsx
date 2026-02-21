import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { calculateObjectiveProgress, calculateHealthStatus, type HealthStatus } from '@objective-tracker/shared';
import type { CascadeNode } from '../../services/cascade.api.js';
import { useCycle } from '../../contexts/cycle.context.js';
import { UserAvatar } from '../UserAvatar.js';
import { ProgressRing } from '../ProgressRing.js';
import { HealthBadge } from '../HealthBadge.js';

interface TreeNodeCardProps {
  node: CascadeNode;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  childCount: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const borderColours: Record<HealthStatus, string> = {
  on_track: 'border-emerald-500/50',
  at_risk: 'border-amber-500/50',
  behind: 'border-red-500/50',
  not_started: 'border-slate-600',
};

/** Level-based background tint — top-level objectives get an indigo wash */
function getNodeClasses(depth: number): { bg: string; titleClass: string; ringSize: number } {
  if (depth === 0) {
    return {
      bg: 'bg-indigo-500/[0.07]',
      titleClass: 'text-sm font-bold text-white truncate leading-tight',
      ringSize: 32,
    };
  }
  if (depth <= 2) {
    return {
      bg: 'bg-surface-raised',
      titleClass: 'text-xs font-semibold text-slate-200 truncate leading-tight',
      ringSize: 28,
    };
  }
  return {
    bg: 'bg-surface-raised',
    titleClass: 'text-xs font-medium text-slate-300 truncate leading-tight',
    ringSize: 26,
  };
}

export function TreeNodeCard({ node, x, y, width, height, depth, childCount, isExpanded, onToggle }: TreeNodeCardProps) {
  const navigate = useNavigate();
  const { activeCycle } = useCycle();

  const progress = calculateObjectiveProgress(node.objective.keyResults.map(kr => kr.progress));
  const allCheckIns = node.objective.keyResults.flatMap(kr => kr.checkIns);
  const health = calculateHealthStatus(progress, activeCycle, allCheckIns);
  const { bg, titleClass, ringSize } = getNodeClasses(depth);
  const hasChildren = childCount > 0;

  // Expand/collapse connector sits below the card, overlapping the bottom edge
  const connectorOverlap = 12;
  const totalHeight = hasChildren ? height + connectorOverlap : height;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ transformOrigin: `${x}px ${y + height / 2}px` }}
    >
      <foreignObject x={x - width / 2} y={y} width={width} height={totalHeight}>
        <div className="relative" style={{ height: totalHeight }}>
          {/* Card body */}
          <div
            className={`absolute inset-x-0 top-0 rounded-lg ${bg} border ${borderColours[health]} p-3.5 cursor-pointer hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-150 flex flex-col justify-between`}
            style={{ height }}
            onClick={() => navigate(`/objectives/${node.objective.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/objectives/${node.objective.id}`); } }}
            aria-label={`View objective: ${node.objective.title}`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <UserAvatar user={node.owner} size="sm" />
              <div className="min-w-0 flex-1">
                <p className={titleClass}>{node.objective.title}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{node.owner.displayName}</p>
              </div>
              <ProgressRing progress={progress} size={ringSize} strokeWidth={2.5} />
            </div>
            <div className="flex items-center justify-between mt-auto pt-1">
              <HealthBadge status={health} />
              {depth === 0 && (
                <span className="text-[10px] font-medium text-indigo-400/70 uppercase tracking-wider">Company</span>
              )}
            </div>
          </div>

          {/* Expand/collapse connector button — sits at bottom-centre, overlapping card edge */}
          {hasChildren && (
            <button
              onClick={e => {
                e.stopPropagation();
                onToggle();
              }}
              className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center h-6 w-6 rounded-full bg-slate-700 border border-slate-600 text-slate-400 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white transition-all duration-150 shadow-md z-10"
              style={{ top: height - connectorOverlap / 2 }}
              aria-label={isExpanded ? `Collapse (${childCount} children)` : `Expand (${childCount} children)`}
              title={`${childCount} child${childCount !== 1 ? 'ren' : ''}`}
            >
              <motion.svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </motion.svg>
            </button>
          )}
        </div>
      </foreignObject>
    </motion.g>
  );
}
