import { useState, useEffect, useCallback } from 'react';
import type { Objective } from '@objective-tracker/shared';
import * as objectivesApi from '../services/objectives.api.js';

export function useObjective(id: string) {
  const [objective, setObjective] = useState<Objective | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await objectivesApi.getObjective(id);
      setObjective(response.data);
      setCanEdit(response.canEdit ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load objective');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { objective, canEdit, isLoading, error, refetch: fetch };
}
