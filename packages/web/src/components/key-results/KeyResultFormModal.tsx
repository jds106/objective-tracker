import { useState, useEffect } from 'react';
import type { KeyResult, KeyResultType, KeyResultConfig, CreateKeyResultBody, UpdateKeyResultBody } from '@objective-tracker/shared';
import { Modal } from '../Modal.js';
import { KeyResultConfigForm } from './KeyResultConfigForm.js';

interface KeyResultFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateKeyResultBody | UpdateKeyResultBody) => Promise<void>;
  keyResult?: KeyResult;
}

const defaultConfigs: Record<KeyResultType, KeyResultConfig> = {
  percentage: { type: 'percentage', currentValue: 0 },
  metric: { type: 'metric', startValue: 0, currentValue: 0, targetValue: 100, unit: '', direction: 'increase' },
  milestone: { type: 'milestone', milestones: [] },
  binary: { type: 'binary', completed: false },
};

export function KeyResultFormModal({
  isOpen,
  onClose,
  onSubmit,
  keyResult,
}: KeyResultFormModalProps) {
  const isEdit = !!keyResult;
  const [title, setTitle] = useState(keyResult?.title ?? '');
  const [type, setType] = useState<KeyResultType>(keyResult?.type ?? 'percentage');
  const [config, setConfig] = useState<KeyResultConfig>(keyResult?.config ?? defaultConfigs.percentage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form state when the modal opens or the keyResult prop changes
  useEffect(() => {
    if (isOpen) {
      setTitle(keyResult?.title ?? '');
      setType(keyResult?.type ?? 'percentage');
      setConfig(keyResult?.config ?? defaultConfigs.percentage);
      setError(null);
    }
  }, [isOpen, keyResult]);

  const handleTypeChange = (newType: KeyResultType) => {
    setType(newType);
    setConfig(defaultConfigs[newType]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      if (isEdit) {
        await onSubmit({ title, config } as UpdateKeyResultBody);
      } else {
        await onSubmit({ title, type, config } as CreateKeyResultBody);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save key result');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Key Result' : 'Add Key Result'}
      maxWidth="max-w-lg"
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="kr-title" className="block text-sm font-medium text-slate-300">
            Title
          </label>
          <input
            id="kr-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="e.g. Reduce p95 latency below 200ms"
          />
        </div>

        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['percentage', 'metric', 'milestone', 'binary'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    type === t
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        <KeyResultConfigForm config={config} onChange={setConfig} />

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Key Result'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
