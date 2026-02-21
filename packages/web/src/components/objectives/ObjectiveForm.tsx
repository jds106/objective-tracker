import { useState } from 'react';
import { ParentLinkSelector } from './ParentLinkSelector.js';

interface ObjectiveFormData {
  title: string;
  description: string;
  parentObjectiveId: string | null;
  parentKeyResultId: string | null;
}

interface ObjectiveFormProps {
  initialData?: ObjectiveFormData;
  onSubmit: (data: ObjectiveFormData) => void;
  isSubmitting: boolean;
  submitLabel: string;
}

export function ObjectiveForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel,
}: ObjectiveFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [parentObjectiveId, setParentObjectiveId] = useState<string | null>(initialData?.parentObjectiveId ?? null);
  const [parentKeyResultId, setParentKeyResultId] = useState<string | null>(initialData?.parentKeyResultId ?? null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, description, parentObjectiveId, parentKeyResultId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="obj-title" className="block text-sm font-medium text-slate-300">
          Title
        </label>
        <input
          id="obj-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="mt-1 block w-full rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="e.g. Improve platform reliability to 99.9% uptime"
        />
      </div>

      <div>
        <label htmlFor="obj-description" className="block text-sm font-medium text-slate-300">
          Description
        </label>
        <textarea
          id="obj-description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Describe what this objective aims to achieve and why it matters..."
        />
      </div>

      <ParentLinkSelector
        parentObjectiveId={parentObjectiveId}
        parentKeyResultId={parentKeyResultId}
        onChange={(objId, krId) => {
          setParentObjectiveId(objId);
          setParentKeyResultId(krId);
        }}
      />

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
