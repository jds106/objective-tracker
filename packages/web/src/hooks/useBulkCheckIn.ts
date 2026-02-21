import { useState, useCallback, useEffect } from 'react';
import type { KeyResultConfig, Objective } from '@objective-tracker/shared';
import { calculateProgress } from '@objective-tracker/shared';
import * as objectivesApi from '../services/objectives.api.js';

interface BulkCheckInState {
  editedConfigs: Map<string, KeyResultConfig>;
  notes: Map<string, string>;
  results: Map<string, 'success' | 'error'>;
  errors: Map<string, string>;
  isSubmitting: boolean;
  hasSubmitted: boolean;
}

export function useBulkCheckIn(objectives: Objective[], onComplete: () => Promise<void>) {
  const [state, setState] = useState<BulkCheckInState>({
    editedConfigs: new Map(),
    notes: new Map(),
    results: new Map(),
    errors: new Map(),
    isSubmitting: false,
    hasSubmitted: false,
  });

  // Build a lookup of original KR configs for dirty detection
  const originalConfigs = new Map<string, KeyResultConfig>();
  const originalProgresses = new Map<string, number>();
  for (const obj of objectives) {
    for (const kr of obj.keyResults) {
      originalConfigs.set(kr.id, kr.config);
      originalProgresses.set(kr.id, kr.progress);
    }
  }

  const getEditedConfig = useCallback((krId: string): KeyResultConfig | undefined => {
    return state.editedConfigs.get(krId);
  }, [state.editedConfigs]);

  const getNote = useCallback((krId: string): string => {
    return state.notes.get(krId) ?? '';
  }, [state.notes]);

  const getResult = useCallback((krId: string): 'success' | 'error' | undefined => {
    return state.results.get(krId);
  }, [state.results]);

  const getError = useCallback((krId: string): string | undefined => {
    return state.errors.get(krId);
  }, [state.errors]);

  const updateConfig = useCallback((krId: string, config: KeyResultConfig) => {
    setState(prev => {
      const next = new Map(prev.editedConfigs);
      next.set(krId, config);
      return { ...prev, editedConfigs: next };
    });
  }, []);

  const updateNote = useCallback((krId: string, note: string) => {
    setState(prev => {
      const next = new Map(prev.notes);
      next.set(krId, note);
      return { ...prev, notes: next };
    });
  }, []);

  // A KR is dirty if its progress changed or a non-empty note was added
  const isDirty = useCallback((krId: string): boolean => {
    const originalProgress = originalProgresses.get(krId) ?? 0;
    const editedConfig = state.editedConfigs.get(krId);
    const note = state.notes.get(krId)?.trim();

    if (note) return true;
    if (!editedConfig) return false;

    const newProgress = calculateProgress(editedConfig);
    return Math.round(newProgress) !== Math.round(originalProgress);
  }, [state.editedConfigs, state.notes, originalProgresses]);

  const getDirtyKrIds = useCallback((): string[] => {
    const dirty: string[] = [];
    for (const obj of objectives) {
      for (const kr of obj.keyResults) {
        if (isDirty(kr.id)) {
          dirty.push(kr.id);
        }
      }
    }
    return dirty;
  }, [objectives, isDirty]);

  const dirtyCount = getDirtyKrIds().length;

  const resetAll = useCallback(() => {
    setState({
      editedConfigs: new Map(),
      notes: new Map(),
      results: new Map(),
      errors: new Map(),
      isSubmitting: false,
      hasSubmitted: false,
    });
  }, []);

  const submitAll = useCallback(async () => {
    const dirtyIds = getDirtyKrIds();
    if (dirtyIds.length === 0) return;

    setState(prev => ({
      ...prev,
      isSubmitting: true,
      results: new Map(),
      errors: new Map(),
    }));

    const promises = dirtyIds.map(async (krId) => {
      const config = state.editedConfigs.get(krId);
      const originalConfig = originalConfigs.get(krId);
      if (!config && !originalConfig) {
        throw new Error('No config found');
      }
      const note = state.notes.get(krId)?.trim();

      return objectivesApi.recordCheckIn(krId, {
        config: config ?? originalConfig!,
        note: note || undefined,
        source: 'web',
      });
    });

    const settled = await Promise.allSettled(promises);

    const nextResults = new Map<string, 'success' | 'error'>();
    const nextErrors = new Map<string, string>();

    settled.forEach((result, idx) => {
      const krId = dirtyIds[idx];
      if (result.status === 'fulfilled') {
        nextResults.set(krId, 'success');
      } else {
        nextResults.set(krId, 'error');
        nextErrors.set(
          krId,
          result.reason instanceof Error ? result.reason.message : 'Check-in failed',
        );
      }
    });

    setState(prev => ({
      ...prev,
      isSubmitting: false,
      hasSubmitted: true,
      results: nextResults,
      errors: nextErrors,
    }));

    // Refetch objectives to update the underlying data
    await onComplete();
  }, [getDirtyKrIds, state.editedConfigs, state.notes, originalConfigs, onComplete]);

  const successCount = Array.from(state.results.values()).filter(r => r === 'success').length;
  const errorCount = Array.from(state.results.values()).filter(r => r === 'error').length;

  // Warn on unsaved changes
  useEffect(() => {
    if (dirtyCount > 0 && !state.hasSubmitted) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
      };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
    }
  }, [dirtyCount, state.hasSubmitted]);

  return {
    editedConfigs: state.editedConfigs,
    notes: state.notes,
    results: state.results,
    errors: state.errors,
    isSubmitting: state.isSubmitting,
    hasSubmitted: state.hasSubmitted,
    dirtyCount,
    successCount,
    errorCount,
    getEditedConfig,
    getNote,
    getResult,
    getError,
    isDirty,
    updateConfig,
    updateNote,
    resetAll,
    submitAll,
  };
}
