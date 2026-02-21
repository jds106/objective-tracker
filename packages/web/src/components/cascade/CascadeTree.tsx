import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CascadeNode } from '../../services/cascade.api.js';
import { CascadeTreeNode } from './CascadeTreeNode.js';

interface CascadeTreeProps {
  nodes: CascadeNode[];
}

interface TreeNodeRowProps {
  node: CascadeNode;
  depth: number;
}

function TreeNodeRow({ node, depth }: TreeNodeRowProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 48}px` }}>
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <motion.svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </motion.svg>
          </button>
        )}
        {!hasChildren && <span className="w-4 shrink-0" />}
        {depth > 0 && (
          <div className="w-6 border-t border-slate-700 shrink-0" />
        )}
        <CascadeTreeNode node={node} />
      </div>

      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 mt-2">
              {node.children.map(child => (
                <TreeNodeRow key={child.objective.id} node={child} depth={depth + 1} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CascadeTree({ nodes }: CascadeTreeProps) {
  if (nodes.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-8 text-center">
        No objectives found in your cascade view.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {nodes.map(node => (
        <TreeNodeRow key={node.objective.id} node={node} depth={0} />
      ))}
    </div>
  );
}
