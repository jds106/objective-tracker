import { motion } from 'framer-motion';

interface TreeLinkProps {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  nodeHeight: number;
  /** Depth of the target node — used for staggered entrance animation */
  depth?: number;
}

export function TreeLink({ sourceX, sourceY, targetX, targetY, nodeHeight, depth = 0 }: TreeLinkProps) {
  const startY = sourceY + nodeHeight;
  const endY = targetY;
  const midY = (startY + endY) / 2;

  const d = `M ${sourceX} ${startY} C ${sourceX} ${midY}, ${targetX} ${midY}, ${targetX} ${endY}`;

  return (
    <motion.path
      d={d}
      fill="none"
      stroke="#6366f1"
      strokeWidth={2}
      strokeOpacity={0.25}
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      exit={{ pathLength: 0, opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: depth * 0.12 }}
    />
  );
}
