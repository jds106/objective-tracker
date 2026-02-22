import { z } from 'zod';

const targetDateTypeSchema = z.enum(['quarterly', 'annual', 'arbitrary']);
const targetDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be YYYY-MM-DD');

export const createObjectiveSchema = z.object({
  cycleId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).default(''),
  parentKeyResultId: z.string().uuid().nullable().default(null),
  parentObjectiveId: z.string().uuid().nullable().default(null),
  targetDateType: targetDateTypeSchema.default('quarterly'),
  targetDate: targetDateSchema,
});

export const updateObjectiveSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled', 'rolled_forward']).optional(),
  parentKeyResultId: z.string().uuid().nullable().optional(),
  parentObjectiveId: z.string().uuid().nullable().optional(),
  targetDateType: targetDateTypeSchema.optional(),
  targetDate: targetDateSchema.optional(),
});

export type CreateObjectiveBody = z.infer<typeof createObjectiveSchema>;
export type UpdateObjectiveBody = z.infer<typeof updateObjectiveSchema>;
