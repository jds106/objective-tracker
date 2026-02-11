import { useState, useEffect } from 'react';
import type { User } from '@objective-tracker/shared';
import * as usersApi from '../services/users.api.js';

export function useReports() {
  const [reports, setReports] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await usersApi.getDirectReports();
        if (!cancelled) setReports(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load reports');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { reports, isLoading, error };
}
