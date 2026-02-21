import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <motion.div
      className={`flex flex-col items-center justify-center py-14 text-center ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {icon && (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-slate-200">{title}</h3>
      <p className="mt-2 text-sm text-slate-400 max-w-md">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
