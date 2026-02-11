import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  colour?: string;
  className?: string;
}

export function ProgressBar({
  progress,
  colour = 'bg-indigo-500',
  className = '',
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`h-2 w-full rounded-full bg-slate-700 overflow-hidden ${className}`}>
      <motion.div
        className={`h-full rounded-full ${colour}`}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}
