import type { PercentageConfig as PercentageConfigType } from '@objective-tracker/shared';

interface PercentageConfigProps {
  config: PercentageConfigType;
  onChange: (config: PercentageConfigType) => void;
}

export function PercentageConfig({ config, onChange }: PercentageConfigProps) {
  return (
    <div>
      <label htmlFor="pct-value" className="block text-sm font-medium text-slate-300">
        Current Value ({config.currentValue}%)
      </label>
      <input
        id="pct-value"
        type="range"
        min={0}
        max={100}
        value={config.currentValue}
        onChange={e => onChange({ ...config, currentValue: Number(e.target.value) })}
        className="mt-2 w-full accent-indigo-500"
      />
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
