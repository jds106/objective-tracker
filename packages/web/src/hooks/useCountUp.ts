import { useState, useEffect, useRef } from 'react';

/**
 * Animates a number from 0 to `end` over `duration` ms using requestAnimationFrame.
 * Returns the current animated value (integer).
 */
export function useCountUp(end: number, duration = 600): number {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    if (end <= 0) {
      setValue(0);
      return;
    }

    startTime.current = null;

    function step(timestamp: number) {
      if (startTime.current === null) {
        startTime.current = timestamp;
      }

      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end));

      if (progress < 1) {
        rafId.current = requestAnimationFrame(step);
      }
    }

    rafId.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId.current);
    };
  }, [end, duration]);

  return value;
}
