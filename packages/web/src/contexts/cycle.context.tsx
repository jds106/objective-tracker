import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Cycle } from '@objective-tracker/shared';
import * as cyclesApi from '../services/cycles.api.js';

interface CycleContextValue {
  activeCycle: Cycle | null;
  allCycles: Cycle[];
  isLoading: boolean;
  error: string | null;
}

const CycleContext = createContext<CycleContextValue | null>(null);

export function CycleProvider({ children }: { children: ReactNode }) {
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  const [allCycles, setAllCycles] = useState<Cycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [activeRes, allRes] = await Promise.allSettled([
        cyclesApi.getActiveCycle(),
        cyclesApi.getAllCycles(),
      ]);

      if (cancelled) return;

      if (activeRes.status === 'fulfilled') {
        setActiveCycle(activeRes.value.data);
      }
      if (allRes.status === 'fulfilled') {
        setAllCycles(allRes.value.data);
      }

      // Surface error only if both requests failed
      if (activeRes.status === 'rejected' && allRes.status === 'rejected') {
        const msg = activeRes.reason instanceof Error
          ? activeRes.reason.message
          : 'Failed to load cycles';
        setError(msg);
      }

      setIsLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <CycleContext.Provider value={{ activeCycle, allCycles, isLoading, error }}>
      {children}
    </CycleContext.Provider>
  );
}

export function useCycle(): CycleContextValue {
  const context = useContext(CycleContext);
  if (!context) throw new Error('useCycle must be used within CycleProvider');
  return context;
}
