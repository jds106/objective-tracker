import { z } from 'zod';

export const adminCreateUserSchema = z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    displayName: z.string().min(1, 'Display name is required').max(100),
    jobTitle: z.string().min(1, 'Job title is required').max(100),
    managerId: z.string().uuid().nullable().optional(),
    managerEmail: z.string().email().optional(),
    level: z.number().int().min(1).max(10).optional(),
    department: z.string().max(100).optional(),
    role: z.enum(['admin', 'standard']).optional().default('standard'),
});

export const updateUserAdminSchema = z.object({
    displayName: z.string().min(1).max(100).optional(),
    jobTitle: z.string().min(1).max(100).optional(),
    role: z.enum(['admin', 'standard']).optional(),
    managerId: z.string().uuid().nullable().optional(),
    level: z.number().int().min(1).max(5).optional(),
    department: z.string().max(100).optional(),
});

const targetDateTypeSchema = z.enum(['quarterly', 'annual', 'arbitrary']);
const targetDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be YYYY-MM-DD');

export const companyObjectiveSchema = z.object({
    cycleId: z.string().uuid('Cycle ID must be a valid UUID'),
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional().default(''),
    targetDateType: targetDateTypeSchema.default('quarterly'),
    targetDate: targetDateSchema,
});

export const adminCreateObjectiveForUserSchema = z.object({
    ownerId: z.string().uuid('Owner ID must be a valid UUID'),
    cycleId: z.string().uuid('Cycle ID must be a valid UUID'),
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional().default(''),
    parentObjectiveId: z.string().uuid().nullable().optional().default(null),
    parentKeyResultId: z.string().uuid().nullable().optional().default(null),
    targetDateType: targetDateTypeSchema.default('quarterly'),
    targetDate: targetDateSchema,
});

export type AdminCreateUserBody = z.infer<typeof adminCreateUserSchema>;
export type UpdateUserAdminBody = z.infer<typeof updateUserAdminSchema>;
export type CompanyObjectiveBody = z.infer<typeof companyObjectiveSchema>;
export type AdminCreateObjectiveForUserBody = z.input<typeof adminCreateObjectiveForUserSchema>;
