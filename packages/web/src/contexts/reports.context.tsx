import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '@objective-tracker/shared';
import { useAuth } from './auth.context.js';
import * as usersApi from '../services/users.api.js';

interface ReportsContextValue {
  reports: User[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const ReportsContext = createContext<ReportsContextValue | null>(null);

export function ReportsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [reports, setReports] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!isAuthenticated) {
      setReports([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await usersApi.getDirectReports();
      setReports(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <ReportsContext.Provider value={{ reports, isLoading, error, refetch: fetchReports }}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports(): ReportsContextValue {
  const context = useContext(ReportsContext);
  if (!context) throw new Error('useReports must be used within ReportsProvider');
  return context;
}
