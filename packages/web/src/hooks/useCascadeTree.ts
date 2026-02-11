import { useState, useEffect, useCallback } from 'react';
import type { CascadeNode } from '../services/cascade.api.js';
import * as cascadeApi from '../services/cascade.api.js';

export function useCascadeTree(cycleId?: string) {
  const [tree, setTree] = useState<CascadeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await cascadeApi.getCascadeTree(cycleId);
      setTree(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cascade tree');
    } finally {
      setIsLoading(false);
    }
  }, [cycleId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { tree, isLoading, error, refetch: fetch };
}
