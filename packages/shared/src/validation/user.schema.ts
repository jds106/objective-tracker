import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(100).optional(),
  jobTitle: z.string().min(1, 'Job title is required').max(100).optional(),
  department: z.string().max(100).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
