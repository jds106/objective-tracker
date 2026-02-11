import type { KeyResultConfig } from '@objective-tracker/shared';
import { PercentageConfig } from './PercentageConfig.js';
import { MetricConfig } from './MetricConfig.js';
import { MilestoneConfig } from './MilestoneConfig.js';
import { BinaryConfig } from './BinaryConfig.js';

interface KeyResultConfigFormProps {
  config: KeyResultConfig;
  onChange: (config: KeyResultConfig) => void;
}

export function KeyResultConfigForm({ config, onChange }: KeyResultConfigFormProps) {
  switch (config.type) {
    case 'percentage':
      return <PercentageConfig config={config} onChange={onChange} />;
    case 'metric':
      return <MetricConfig config={config} onChange={onChange} />;
    case 'milestone':
      return <MilestoneConfig config={config} onChange={onChange} />;
    case 'binary':
      return <BinaryConfig config={config} onChange={onChange} />;
  }
}
