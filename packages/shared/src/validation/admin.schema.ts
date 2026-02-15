import { z } from 'zod';

export const updateUserAdminSchema = z.object({
    displayName: z.string().min(1).max(100).optional(),
    jobTitle: z.string().min(1).max(100).optional(),
    role: z.enum(['admin', 'standard']).optional(),
    managerId: z.string().uuid().nullable().optional(),
    level: z.number().int().min(1).max(10).optional(),
    department: z.string().max(100).optional(),
});

export const companyObjectiveSchema = z.object({
    cycleId: z.string().uuid('Cycle ID must be a valid UUID'),
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional().default(''),
});

export type UpdateUserAdminBody = z.infer<typeof updateUserAdminSchema>;
export type CompanyObjectiveBody = z.infer<typeof companyObjectiveSchema>;
