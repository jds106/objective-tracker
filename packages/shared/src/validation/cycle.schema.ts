import { z } from 'zod';

const quarterSchema = z.object({
  name: z.string().min(1).max(50),
  startDate: z.string().date(),
  endDate: z.string().date(),
  reviewDeadline: z.string().date(),
}).refine(
  (q) => q.startDate < q.endDate,
  { message: 'Quarter start date must be before end date', path: ['endDate'] },
);

export const createCycleSchema = z.object({
  name: z.string().min(1, 'Cycle name is required').max(50),
  startDate: z.string().date(),
  endDate: z.string().date(),
  quarters: z.array(quarterSchema).min(1, 'At least one quarter is required'),
  status: z.enum(['planning', 'active', 'review', 'closed']).default('planning'),
}).refine(
  (c) => c.startDate < c.endDate,
  { message: 'Cycle start date must be before end date', path: ['endDate'] },
);

export type CreateCycleBody = z.infer<typeof createCycleSchema>;
