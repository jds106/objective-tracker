import { z } from 'zod';

export const createObjectiveSchema = z.object({
  cycleId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).default(''),
  parentKeyResultId: z.string().uuid().nullable().default(null),
  parentObjectiveId: z.string().uuid().nullable().default(null),
});

export const updateObjectiveSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled', 'rolled_forward']).optional(),
  parentKeyResultId: z.string().uuid().nullable().optional(),
  parentObjectiveId: z.string().uuid().nullable().optional(),
});

export type CreateObjectiveBody = z.infer<typeof createObjectiveSchema>;
export type UpdateObjectiveBody = z.infer<typeof updateObjectiveSchema>;
