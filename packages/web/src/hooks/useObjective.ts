import { useState, useEffect, useCallback } from 'react';
import type { Objective } from '@objective-tracker/shared';
import * as objectivesApi from '../services/objectives.api.js';

export function useObjective(id: string) {
  const [objective, setObjective] = useState<Objective | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await objectivesApi.getObjective(id);
      setObjective(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load objective');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { objective, isLoading, error, refetch: fetch };
}
