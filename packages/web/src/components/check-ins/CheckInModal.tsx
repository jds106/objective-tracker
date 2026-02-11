import { useState } from 'react';
import type { KeyResult, KeyResultConfig, CheckInBody } from '@objective-tracker/shared';
import { calculateProgress } from '@objective-tracker/shared';
import { Modal } from '../Modal.js';
import { KeyResultConfigForm } from '../key-results/KeyResultConfigForm.js';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CheckInBody) => Promise<void>;
  keyResult: KeyResult;
}

export function CheckInModal({ isOpen, onClose, onSubmit, keyResult }: CheckInModalProps) {
  const [config, setConfig] = useState<KeyResultConfig>(keyResult.config);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newProgress = calculateProgress(config);
  const previousProgress = keyResult.progress;
  const diff = newProgress - previousProgress;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        config,
        note: note.trim() || undefined,
        source: 'web',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Check in: ${keyResult.title}`} maxWidth="max-w-lg">
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-surface border border-slate-700 p-4">
          <p className="text-sm text-slate-400 mb-1">Progress change</p>
          <p className="text-lg font-semibold text-slate-100">
            {Math.round(previousProgress)}%
            <span className="text-slate-500 mx-2">&rarr;</span>
            <span className={diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : ''}>
              {Math.round(newProgress)}%
            </span>
            {diff !== 0 && (
              <span className={`text-sm ml-2 ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ({diff > 0 ? '+' : ''}{Math.round(diff)}%)
              </span>
            )}
          </p>
        </div>

        <KeyResultConfigForm config={config} onChange={setConfig} />

        <div>
          <label htmlFor="checkin-note" className="block text-sm font-medium text-slate-300">
            Note (optional)
          </label>
          <textarea
            id="checkin-note"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            className="mt-1 block w-full rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="What progress was made?"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Recording...' : 'Record Check-in'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
