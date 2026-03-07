import { motion } from 'framer-motion';
import type { Objective } from '@objective-tracker/shared';
import { calculateObjectiveProgress } from '@objective-tracker/shared';
import { ProgressRing } from '../ProgressRing.js';
import { useCountUp } from '../../hooks/useCountUp.js';

interface StatCardsProps {
  objectives: Objective[];
  isAdmin?: boolean;
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const animated = useCountUp(value);
  return <>{animated}{suffix}</>;
}

const cardClass = 'rounded-xl bg-gradient-to-br from-surface-raised to-surface border border-slate-700/50 p-6';

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' as const },
};

export function StatCards({ objectives, isAdmin = false }: StatCardsProps) {
  const objectiveCount = objectives.length;

  const overallProgress = objectiveCount > 0
    ? calculateObjectiveProgress(
      objectives.map(o =>
        calculateObjectiveProgress(o.keyResults.map(kr => kr.progress)),
      ),
    )
    : 0;

  const totalCheckIns = objectives.reduce(
    (sum, o) => sum + o.keyResults.reduce((krSum, kr) => krSum + kr.checkIns.length, 0),
    0,
  );

  const activeCount = objectives.filter(o => o.status === 'active').length;

  return (
    <motion.div
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div className={cardClass} variants={fadeUp}>
        <h3 className="text-sm font-medium text-slate-400">{isAdmin ? 'All Objectives' : 'My Objectives'}</h3>
        <p className="mt-2 text-4xl font-bold tracking-tight text-white tabular-nums">
          <AnimatedNumber value={objectiveCount} />
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {objectiveCount === 0 ? 'No objectives yet' : `${activeCount} active`}
        </p>
      </motion.div>

      <motion.div className={cardClass} variants={fadeUp}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-slate-400">Overall Progress</h3>
            <p className="mt-2 text-4xl font-bold tracking-tight text-white tabular-nums">
              {objectiveCount > 0 ? <AnimatedNumber value={Math.round(overallProgress)} suffix="%" /> : '\u2014'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {objectiveCount > 0
                ? (isAdmin ? 'Across all users' : 'Across all objectives')
                : 'Create objectives to track progress'}
            </p>
          </div>
          {objectiveCount > 0 && (
            <ProgressRing progress={overallProgress} size={56} strokeWidth={5} />
          )}
        </div>
      </motion.div>

      <motion.div className={cardClass} variants={fadeUp}>
        <h3 className="text-sm font-medium text-slate-400">Check-ins</h3>
        <p className="mt-2 text-4xl font-bold tracking-tight text-white tabular-nums">
          {totalCheckIns > 0 ? <AnimatedNumber value={totalCheckIns} /> : '\u2014'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {totalCheckIns > 0
            ? (isAdmin ? 'Total across all users' : 'Total recorded')
            : 'No check-ins yet'}
        </p>
      </motion.div>
    </motion.div>
  );
}
