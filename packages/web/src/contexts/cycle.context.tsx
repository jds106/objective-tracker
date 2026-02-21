import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Cycle } from '@objective-tracker/shared';
import * as cyclesApi from '../services/cycles.api.js';

interface CycleContextValue {
  /** The system-wide active cycle (status === 'active') */
  activeCycle: Cycle | null;
  /** The currently selected cycle for viewing — defaults to activeCycle */
  selectedCycle: Cycle | null;
  /** Whether viewing a historical (non-active) cycle */
  isHistorical: boolean;
  /** All cycles available */
  allCycles: Cycle[];
  /** Switch which cycle is selected */
  selectCycle: (cycleId: string) => void;
  /** Reset to the active cycle */
  resetToActive: () => void;
  isLoading: boolean;
  error: string | null;
}

const CycleContext = createContext<CycleContextValue | null>(null);

export function CycleProvider({ children }: { children: ReactNode }) {
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  const [allCycles, setAllCycles] = useState<Cycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
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

  const selectedCycle = selectedCycleId
    ? allCycles.find(c => c.id === selectedCycleId) ?? activeCycle
    : activeCycle;

  const isHistorical = !!(selectedCycle && activeCycle && selectedCycle.id !== activeCycle.id);

  const selectCycle = useCallback((cycleId: string) => {
    setSelectedCycleId(cycleId);
  }, []);

  const resetToActive = useCallback(() => {
    setSelectedCycleId(null);
  }, []);

  return (
    <CycleContext.Provider value={{
      activeCycle,
      selectedCycle,
      isHistorical,
      allCycles,
      selectCycle,
      resetToActive,
      isLoading,
      error,
    }}>
      {children}
    </CycleContext.Provider>
  );
}

export function useCycle(): CycleContextValue {
  const context = useContext(CycleContext);
  if (!context) throw new Error('useCycle must be used within CycleProvider');
  return context;
}
