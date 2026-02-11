import { useState } from 'react';
import type { MilestoneConfig as MilestoneConfigType, MilestoneItem } from '@objective-tracker/shared';
import { generateId } from '@objective-tracker/shared';

interface MilestoneConfigProps {
  config: MilestoneConfigType;
  onChange: (config: MilestoneConfigType) => void;
}

export function MilestoneConfig({ config, onChange }: MilestoneConfigProps) {
  const [newTitle, setNewTitle] = useState('');

  const addMilestone = () => {
    if (!newTitle.trim()) return;
    const milestone: MilestoneItem = {
      id: generateId(),
      title: newTitle.trim(),
      completed: false,
    };
    onChange({ ...config, milestones: [...config.milestones, milestone] });
    setNewTitle('');
  };

  const toggleMilestone = (id: string) => {
    onChange({
      ...config,
      milestones: config.milestones.map(m =>
        m.id === id
          ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : undefined }
          : m,
      ),
    });
  };

  const removeMilestone = (id: string) => {
    onChange({
      ...config,
      milestones: config.milestones.filter(m => m.id !== id),
    });
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">
        Milestones
      </label>

      {config.milestones.length > 0 && (
        <ul className="space-y-2">
          {config.milestones.map((m, i) => (
            <li key={m.id} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-5 shrink-0">{i + 1}.</span>
              <input
                type="checkbox"
                checked={m.completed}
                onChange={() => toggleMilestone(m.id)}
                className="h-4 w-4 rounded border-slate-600 bg-surface text-indigo-600 focus:ring-indigo-500"
              />
              <span className={`text-sm flex-1 ${m.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                {m.title}
              </span>
              <button
                type="button"
                onClick={() => removeMilestone(m.id)}
                className="text-slate-500 hover:text-red-400 transition-colors"
                aria-label={`Remove ${m.title}`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMilestone(); } }}
          placeholder="Add a milestone..."
          className="flex-1 rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={addMilestone}
          disabled={!newTitle.trim()}
          className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600 disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
