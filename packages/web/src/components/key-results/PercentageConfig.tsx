import type { PercentageConfig as PercentageConfigType } from '@objective-tracker/shared';
import { RangeSlider } from '../ui/RangeSlider.js';

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
      <RangeSlider
        id="pct-value"
        value={config.currentValue}
        onChange={v => onChange({ ...config, currentValue: v })}
        min={0}
        max={100}
        aria-label="Percentage value"
        className="mt-3"
      />
      <div className="flex justify-between text-xs text-slate-500 mt-2">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
