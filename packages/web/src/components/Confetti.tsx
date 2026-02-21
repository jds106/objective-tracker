import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  colour: string;
  delay: number;
}

const COLOURS = [
  '#818cf8', // indigo-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#f472b6', // pink-400
  '#60a5fa', // blue-400
  '#a78bfa', // violet-400
  '#fb923c', // orange-400
];

function createPieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.8,
    colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
    delay: Math.random() * 0.3,
  }));
}

interface ConfettiProps {
  /** Set to true to trigger the confetti burst */
  active: boolean;
  /** Duration in ms before auto-hiding (default 3000) */
  duration?: number;
  /** Number of confetti pieces (default 30) */
  count?: number;
}

export function Confetti({ active, duration = 3000, count = 30 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setPieces(createPieces(count));
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [active, count, duration]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {pieces.map(piece => (
          <motion.div
            key={piece.id}
            className="absolute w-2.5 h-2.5 rounded-sm"
            style={{
              left: `${piece.x}%`,
              top: `${piece.y}%`,
              backgroundColor: piece.colour,
            }}
            initial={{
              opacity: 1,
              scale: 0,
              rotate: 0,
              y: 0,
            }}
            animate={{
              opacity: [1, 1, 0],
              scale: piece.scale,
              rotate: piece.rotation + 360,
              y: '100vh',
              x: (Math.random() - 0.5) * 200,
            }}
            transition={{
              duration: 2 + Math.random(),
              delay: piece.delay,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Hook to trigger celebration on objective/KR completion.
 * Returns [showConfetti, triggerCelebration].
 */
export function useCelebration(): [boolean, () => void] {
  const [celebrating, setCelebrating] = useState(false);

  const trigger = useCallback(() => {
    setCelebrating(true);
    // Reset after animation completes
    setTimeout(() => setCelebrating(false), 3500);
  }, []);

  return [celebrating, trigger];
}
