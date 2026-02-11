import type { BinaryConfig as BinaryConfigType } from '@objective-tracker/shared';

interface BinaryConfigProps {
  config: BinaryConfigType;
  onChange: (config: BinaryConfigType) => void;
}

export function BinaryConfig({ config, onChange }: BinaryConfigProps) {
  return (
    <div className="flex items-center gap-3">
      <input
        id="binary-completed"
        type="checkbox"
        checked={config.completed}
        onChange={e =>
          onChange({
            ...config,
            completed: e.target.checked,
            completedAt: e.target.checked ? new Date().toISOString() : undefined,
          })
        }
        className="h-5 w-5 rounded border-slate-600 bg-surface text-indigo-600 focus:ring-indigo-500"
      />
      <label htmlFor="binary-completed" className="text-sm font-medium text-slate-300">
        {config.completed ? 'Completed' : 'Not yet completed'}
      </label>
    </div>
  );
}
