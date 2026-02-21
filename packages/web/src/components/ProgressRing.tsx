import { motion } from 'framer-motion';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  /** @deprecated Use className with text-* colour instead */
  colour?: string;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 4,
  colour,
  className = '',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(progress, 0), 100) / 100) * circumference;

  // Default to indigo-500 via currentColor if no explicit colour prop
  const strokeColour = colour ?? 'currentColor';

  return (
    <div className={`relative inline-flex items-center justify-center text-indigo-500 ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#334155"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColour}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="absolute text-xs font-semibold text-slate-200">
        {Math.round(progress)}%
      </span>
    </div>
  );
}
