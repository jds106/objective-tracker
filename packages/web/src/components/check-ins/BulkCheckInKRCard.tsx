import { useState } from 'react';
import type { KeyResult, KeyResultConfig } from '@objective-tracker/shared';
import { calculateProgress } from '@objective-tracker/shared';
import { KeyResultConfigForm } from '../key-results/KeyResultConfigForm.js';

interface BulkCheckInKRCardProps {
  keyResult: KeyResult;
  editedConfig: KeyResultConfig | undefined;
  note: string;
  result: 'success' | 'error' | undefined;
  error: string | undefined;
  onConfigChange: (config: KeyResultConfig) => void;
  onNoteChange: (note: string) => void;
}

function krTypeLabel(type: string): string {
  switch (type) {
    case 'percentage': return 'Percentage';
    case 'metric': return 'Metric';
    case 'milestone': return 'Milestone';
    case 'binary': return 'Binary';
    default: return type;
  }
}

function typeBadgeColour(type: string): string {
  switch (type) {
    case 'percentage': return 'bg-blue-500/20 text-blue-300';
    case 'metric': return 'bg-purple-500/20 text-purple-300';
    case 'milestone': return 'bg-amber-500/20 text-amber-300';
    case 'binary': return 'bg-emerald-500/20 text-emerald-300';
    default: return 'bg-slate-500/20 text-slate-300';
  }
}

export function BulkCheckInKRCard({
  keyResult,
  editedConfig,
  note,
  result,
  error,
  onConfigChange,
  onNoteChange,
}: BulkCheckInKRCardProps) {
  const [showNote, setShowNote] = useState(false);

  const currentConfig = editedConfig ?? keyResult.config;
  const previousProgress = keyResult.progress;
  const newProgress = calculateProgress(currentConfig);
  const diff = Math.round(newProgress) - Math.round(previousProgress);
  const hasChanged = diff !== 0;

  return (
    <div className={`rounded-lg border p-4 transition-colors ${
      result === 'success'
        ? 'bg-emerald-500/5 border-emerald-500/30'
        : result === 'error'
          ? 'bg-red-500/5 border-red-500/30'
          : 'bg-surface border-slate-700'
    }`}>
      {/* Header: title + type badge + progress delta */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-slate-200 truncate">{keyResult.title}</h4>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${typeBadgeColour(keyResult.type)}`}>
              {krTypeLabel(keyResult.type)}
            </span>
          </div>
        </div>

        {/* Progress delta */}
        <div className="text-right shrink-0">
          {hasChanged ? (
            <div className="text-sm font-semibold">
              <span className="text-slate-400">{Math.round(previousProgress)}%</span>
              <span className="text-slate-600 mx-1">&rarr;</span>
              <span className={diff > 0 ? 'text-emerald-400' : 'text-red-400'}>
                {Math.round(newProgress)}%
              </span>
              <span className={`text-xs ml-1 ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ({diff > 0 ? '+' : ''}{diff}%)
              </span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-slate-400">
              {Math.round(previousProgress)}%
            </span>
          )}
        </div>
      </div>

      {/* Inline config form */}
      <div className="mt-3">
        <KeyResultConfigForm
          config={currentConfig}
          onChange={onConfigChange}
          checkInMode
        />
      </div>

      {/* Note toggle + textarea */}
      <div className="mt-3">
        {!showNote && !note ? (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            + Add note
          </button>
        ) : (
          <textarea
            value={note}
            onChange={e => onNoteChange(e.target.value)}
            rows={2}
            placeholder="What progress was made?"
            className="block w-full rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        )}
      </div>

      {/* Post-submit indicator */}
      {result === 'success' && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Check-in recorded
        </div>
      )}
      {result === 'error' && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error ?? 'Check-in failed'}
        </div>
      )}
    </div>
  );
}
