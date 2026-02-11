import { useState, useEffect, useCallback } from 'react';
import type {
  Objective,
  CreateObjectiveBody,
  UpdateObjectiveBody,
} from '@objective-tracker/shared';
import * as objectivesApi from '../services/objectives.api.js';

export function useObjectives(cycleId?: string) {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await objectivesApi.listMyObjectives(cycleId);
      setObjectives(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load objectives');
    } finally {
      setIsLoading(false);
    }
  }, [cycleId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = useCallback(async (input: CreateObjectiveBody) => {
    const { data } = await objectivesApi.createObjective(input);
    setObjectives(prev => [...prev, data]);
    return data;
  }, []);

  const update = useCallback(async (id: string, input: UpdateObjectiveBody) => {
    const { data } = await objectivesApi.updateObjective(id, input);
    setObjectives(prev => prev.map(o => o.id === id ? data : o));
    return data;
  }, []);

  const remove = useCallback(async (id: string) => {
    await objectivesApi.deleteObjective(id);
    setObjectives(prev => prev.filter(o => o.id !== id));
  }, []);

  return { objectives, isLoading, error, refetch: fetch, create, update, remove };
}
