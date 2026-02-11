import type { MetricConfig as MetricConfigType } from '@objective-tracker/shared';

interface MetricConfigProps {
  config: MetricConfigType;
  onChange: (config: MetricConfigType) => void;
}

export function MetricConfig({ config, onChange }: MetricConfigProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="metric-start" className="block text-xs font-medium text-slate-400">
            Start
          </label>
          <input
            id="metric-start"
            type="number"
            value={config.startValue}
            onChange={e => onChange({ ...config, startValue: Number(e.target.value) })}
            className="mt-1 block w-full rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="metric-current" className="block text-xs font-medium text-slate-400">
            Current
          </label>
          <input
            id="metric-current"
            type="number"
            value={config.currentValue}
            onChange={e => onChange({ ...config, currentValue: Number(e.target.value) })}
            className="mt-1 block w-full rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="metric-target" className="block text-xs font-medium text-slate-400">
            Target
          </label>
          <input
            id="metric-target"
            type="number"
            value={config.targetValue}
            onChange={e => onChange({ ...config, targetValue: Number(e.target.value) })}
            className="mt-1 block w-full rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="metric-unit" className="block text-xs font-medium text-slate-400">
            Unit
          </label>
          <input
            id="metric-unit"
            type="text"
            value={config.unit}
            onChange={e => onChange({ ...config, unit: e.target.value })}
            placeholder="e.g. ms, users, %"
            className="mt-1 block w-full rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="metric-direction" className="block text-xs font-medium text-slate-400">
            Direction
          </label>
          <select
            id="metric-direction"
            value={config.direction}
            onChange={e => onChange({ ...config, direction: e.target.value as 'increase' | 'decrease' })}
            className="mt-1 block w-full rounded-lg bg-surface border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
          >
            <option value="increase">Increase</option>
            <option value="decrease">Decrease</option>
          </select>
        </div>
      </div>
    </div>
  );
}
