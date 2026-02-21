import { z } from 'zod';

const percentageConfigSchema = z.object({
  type: z.literal('percentage'),
  currentValue: z.number().min(0).max(100),
});

const metricConfigSchema = z.object({
  type: z.literal('metric'),
  startValue: z.number(),
  currentValue: z.number(),
  targetValue: z.number(),
  unit: z.string().min(1).max(50),
  direction: z.enum(['increase', 'decrease']),
});

const milestoneConfigSchema = z.object({
  type: z.literal('milestone'),
  milestones: z.array(z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(200),
    completed: z.boolean(),
    completedAt: z.string().datetime().optional(),
  })).min(1, 'At least one milestone is required'),
});

const binaryConfigSchema = z.object({
  type: z.literal('binary'),
  completed: z.boolean(),
  completedAt: z.string().datetime().optional(),
});

export const keyResultConfigSchema = z.discriminatedUnion('type', [
  percentageConfigSchema,
  metricConfigSchema,
  milestoneConfigSchema,
  binaryConfigSchema,
]);

export const createKeyResultSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  type: z.enum(['percentage', 'metric', 'milestone', 'binary']),
  config: keyResultConfigSchema,
}).refine(
  (data) => data.type === data.config.type,
  { message: 'Key result type must match config type', path: ['config', 'type'] },
);

export const updateKeyResultSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  config: keyResultConfigSchema.optional(),
});

export const checkInSchema = z.object({
  note: z.string().max(1000).optional(),
  config: keyResultConfigSchema,
  source: z.enum(['web', 'slack', 'mcp']).default('web'),
});

export type CreateKeyResultBody = z.infer<typeof createKeyResultSchema>;
export type UpdateKeyResultBody = z.infer<typeof updateKeyResultSchema>;
export type CheckInBody = z.infer<typeof checkInSchema>;
