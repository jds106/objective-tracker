import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createObjectiveSchema,
  updateObjectiveSchema,
  createKeyResultSchema,
  updateKeyResultSchema,
  checkInSchema,
  keyResultConfigSchema,
  createCycleSchema,
  updateUserAdminSchema,
  companyObjectiveSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './index.js';

// ── Auth Schemas ────────────────────────────────────────────────

describe('loginSchema', () => {
  it('should accept valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'admin', password: 'pass' }).success).toBe(true);
  });

  it('should accept email as username', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'pw123' }).success).toBe(true);
  });

  it('should reject empty email', () => {
    expect(loginSchema.safeParse({ email: '', password: 'pass' }).success).toBe(false);
  });

  it('should reject empty password', () => {
    expect(loginSchema.safeParse({ email: 'user', password: '' }).success).toBe(false);
  });

  it('should reject missing fields', () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'user' }).success).toBe(false);
  });
});

describe('registerSchema', () => {
  const valid = {
    email: 'user@example.com',
    password: 'password123',
    displayName: 'Test User',
    jobTitle: 'Engineer',
  };

  it('should accept valid registration', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('should accept optional fields', () => {
    const withOptionals = { ...valid, managerId: '550e8400-e29b-41d4-a716-446655440000', level: 3, department: 'Engineering' };
    expect(registerSchema.safeParse(withOptionals).success).toBe(true);
  });

  it('should reject non-email string', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });

  it('should reject short password (< 8 chars)', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'short' }).success).toBe(false);
  });

  it('should reject empty displayName', () => {
    expect(registerSchema.safeParse({ ...valid, displayName: '' }).success).toBe(false);
  });

  it('should reject displayName over 100 chars', () => {
    expect(registerSchema.safeParse({ ...valid, displayName: 'a'.repeat(101) }).success).toBe(false);
  });

  it('should reject non-UUID managerId', () => {
    expect(registerSchema.safeParse({ ...valid, managerId: 'not-a-uuid' }).success).toBe(false);
  });

  it('should accept null managerId', () => {
    expect(registerSchema.safeParse({ ...valid, managerId: null }).success).toBe(true);
  });
});

describe('forgotPasswordSchema', () => {
  it('should accept a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(true);
  });

  it('should reject invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'not-email' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('should accept valid token and password', () => {
    expect(resetPasswordSchema.safeParse({ token: 'abc123', password: 'newpass12' }).success).toBe(true);
  });

  it('should reject empty token', () => {
    expect(resetPasswordSchema.safeParse({ token: '', password: 'newpass12' }).success).toBe(false);
  });

  it('should reject short password', () => {
    expect(resetPasswordSchema.safeParse({ token: 'abc', password: 'short' }).success).toBe(false);
  });
});

// ── Objective Schemas ───────────────────────────────────────────

describe('createObjectiveSchema', () => {
  const valid = {
    cycleId: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Improve platform reliability',
  };

  it('should accept minimal valid input', () => {
    const result = createObjectiveSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('');
      expect(result.data.parentKeyResultId).toBeNull();
      expect(result.data.parentObjectiveId).toBeNull();
    }
  });

  it('should accept full input with parent linkage', () => {
    const full = {
      ...valid,
      description: 'Reduce downtime by 50%',
      parentKeyResultId: '550e8400-e29b-41d4-a716-446655440001',
      parentObjectiveId: '550e8400-e29b-41d4-a716-446655440002',
    };
    expect(createObjectiveSchema.safeParse(full).success).toBe(true);
  });

  it('should reject non-UUID cycleId', () => {
    expect(createObjectiveSchema.safeParse({ ...valid, cycleId: 'bad' }).success).toBe(false);
  });

  it('should reject empty title', () => {
    expect(createObjectiveSchema.safeParse({ ...valid, title: '' }).success).toBe(false);
  });

  it('should reject title over 200 chars', () => {
    expect(createObjectiveSchema.safeParse({ ...valid, title: 'x'.repeat(201) }).success).toBe(false);
  });

  it('should reject description over 2000 chars', () => {
    expect(createObjectiveSchema.safeParse({ ...valid, description: 'x'.repeat(2001) }).success).toBe(false);
  });
});

describe('updateObjectiveSchema', () => {
  it('should accept empty update (all optional)', () => {
    expect(updateObjectiveSchema.safeParse({}).success).toBe(true);
  });

  it('should accept valid status transitions', () => {
    for (const status of ['draft', 'active', 'completed', 'cancelled', 'rolled_forward'] as const) {
      expect(updateObjectiveSchema.safeParse({ status }).success).toBe(true);
    }
  });

  it('should reject invalid status', () => {
    expect(updateObjectiveSchema.safeParse({ status: 'archived' }).success).toBe(false);
  });
});

// ── Key Result Schemas ──────────────────────────────────────────

describe('keyResultConfigSchema', () => {
  it('should accept valid percentage config', () => {
    expect(keyResultConfigSchema.safeParse({ type: 'percentage', currentValue: 50 }).success).toBe(true);
  });

  it('should reject percentage above 100', () => {
    expect(keyResultConfigSchema.safeParse({ type: 'percentage', currentValue: 101 }).success).toBe(false);
  });

  it('should reject percentage below 0', () => {
    expect(keyResultConfigSchema.safeParse({ type: 'percentage', currentValue: -1 }).success).toBe(false);
  });

  it('should accept valid metric config (increase)', () => {
    const config = { type: 'metric', startValue: 0, currentValue: 50, targetValue: 100, unit: 'ms', direction: 'increase' };
    expect(keyResultConfigSchema.safeParse(config).success).toBe(true);
  });

  it('should accept valid metric config (decrease)', () => {
    const config = { type: 'metric', startValue: 100, currentValue: 50, targetValue: 20, unit: 'incidents/month', direction: 'decrease' };
    expect(keyResultConfigSchema.safeParse(config).success).toBe(true);
  });

  it('should reject metric with invalid direction', () => {
    const config = { type: 'metric', startValue: 0, currentValue: 50, targetValue: 100, unit: 'ms', direction: 'sideways' };
    expect(keyResultConfigSchema.safeParse(config).success).toBe(false);
  });

  it('should reject metric with empty unit', () => {
    const config = { type: 'metric', startValue: 0, currentValue: 50, targetValue: 100, unit: '', direction: 'increase' };
    expect(keyResultConfigSchema.safeParse(config).success).toBe(false);
  });

  it('should accept valid milestone config', () => {
    const config = {
      type: 'milestone',
      milestones: [
        { id: '550e8400-e29b-41d4-a716-446655440000', title: 'Phase 1', completed: false },
        { id: '550e8400-e29b-41d4-a716-446655440001', title: 'Phase 2', completed: true, completedAt: '2026-06-15T10:00:00.000Z' },
      ],
    };
    expect(keyResultConfigSchema.safeParse(config).success).toBe(true);
  });

  it('should reject milestone with empty milestones array', () => {
    expect(keyResultConfigSchema.safeParse({ type: 'milestone', milestones: [] }).success).toBe(false);
  });

  it('should reject milestone with non-UUID id', () => {
    const config = {
      type: 'milestone',
      milestones: [{ id: 'bad-id', title: 'Phase 1', completed: false }],
    };
    expect(keyResultConfigSchema.safeParse(config).success).toBe(false);
  });

  it('should accept valid binary config', () => {
    expect(keyResultConfigSchema.safeParse({ type: 'binary', completed: false }).success).toBe(true);
    expect(keyResultConfigSchema.safeParse({ type: 'binary', completed: true, completedAt: '2026-06-15T10:00:00.000Z' }).success).toBe(true);
  });

  it('should reject unknown type', () => {
    expect(keyResultConfigSchema.safeParse({ type: 'custom', value: 42 }).success).toBe(false);
  });
});

describe('createKeyResultSchema', () => {
  it('should accept valid key result', () => {
    const valid = {
      title: 'Reduce latency to <200ms',
      type: 'metric',
      config: { type: 'metric', startValue: 500, currentValue: 500, targetValue: 200, unit: 'ms', direction: 'decrease' },
    };
    expect(createKeyResultSchema.safeParse(valid).success).toBe(true);
  });

  it('should reject empty title', () => {
    const invalid = {
      title: '',
      type: 'binary',
      config: { type: 'binary', completed: false },
    };
    expect(createKeyResultSchema.safeParse(invalid).success).toBe(false);
  });

  it('should reject mismatched type and config.type', () => {
    const mismatched = {
      title: 'Complete migration',
      type: 'binary',
      config: { type: 'percentage', currentValue: 50 },
    };
    const result = createKeyResultSchema.safeParse(mismatched);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message === 'Key result type must match config type')).toBe(true);
    }
  });
});

describe('checkInSchema', () => {
  it('should accept valid check-in with note', () => {
    const valid = {
      config: { type: 'percentage', currentValue: 75 },
      note: 'Good progress this week',
      source: 'web',
    };
    expect(checkInSchema.safeParse(valid).success).toBe(true);
  });

  it('should default source to web', () => {
    const result = checkInSchema.safeParse({ config: { type: 'binary', completed: true } });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe('web');
    }
  });

  it('should reject note over 1000 chars', () => {
    const invalid = {
      config: { type: 'percentage', currentValue: 50 },
      note: 'x'.repeat(1001),
    };
    expect(checkInSchema.safeParse(invalid).success).toBe(false);
  });

  it('should accept all three source types', () => {
    for (const source of ['web', 'slack', 'mcp'] as const) {
      expect(checkInSchema.safeParse({ config: { type: 'binary', completed: false }, source }).success).toBe(true);
    }
  });
});

// ── Cycle Schema ────────────────────────────────────────────────

describe('createCycleSchema', () => {
  const valid = {
    name: 'FY2026',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    quarters: [{
      name: 'Q1',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
      reviewDeadline: '2026-04-07',
    }],
  };

  it('should accept valid cycle', () => {
    expect(createCycleSchema.safeParse(valid).success).toBe(true);
  });

  it('should default status to planning', () => {
    const result = createCycleSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('planning');
    }
  });

  it('should reject empty quarters array', () => {
    expect(createCycleSchema.safeParse({ ...valid, quarters: [] }).success).toBe(false);
  });

  it('should reject cycle where start date is after end date', () => {
    const bad = { ...valid, startDate: '2027-01-01', endDate: '2026-12-31' };
    expect(createCycleSchema.safeParse(bad).success).toBe(false);
  });

  it('should reject quarter where start date is after end date', () => {
    const bad = {
      ...valid,
      quarters: [{
        name: 'Q1',
        startDate: '2026-06-30',
        endDate: '2026-01-01',
        reviewDeadline: '2026-04-07',
      }],
    };
    expect(createCycleSchema.safeParse(bad).success).toBe(false);
  });

  it('should reject invalid date format', () => {
    expect(createCycleSchema.safeParse({ ...valid, startDate: 'Jan 2026' }).success).toBe(false);
  });

  it('should accept all valid statuses', () => {
    for (const status of ['planning', 'active', 'review', 'closed'] as const) {
      expect(createCycleSchema.safeParse({ ...valid, status }).success).toBe(true);
    }
  });
});

// ── Admin Schemas ───────────────────────────────────────────────

describe('updateUserAdminSchema', () => {
  it('should accept empty update (all optional)', () => {
    expect(updateUserAdminSchema.safeParse({}).success).toBe(true);
  });

  it('should accept valid role change', () => {
    expect(updateUserAdminSchema.safeParse({ role: 'admin' }).success).toBe(true);
    expect(updateUserAdminSchema.safeParse({ role: 'standard' }).success).toBe(true);
  });

  it('should reject invalid role', () => {
    expect(updateUserAdminSchema.safeParse({ role: 'superadmin' }).success).toBe(false);
  });

  it('should accept level 1 through 5', () => {
    for (let i = 1; i <= 5; i++) {
      expect(updateUserAdminSchema.safeParse({ level: i }).success).toBe(true);
    }
  });

  it('should reject level 0', () => {
    expect(updateUserAdminSchema.safeParse({ level: 0 }).success).toBe(false);
  });

  it('should reject level above 5', () => {
    expect(updateUserAdminSchema.safeParse({ level: 6 }).success).toBe(false);
    expect(updateUserAdminSchema.safeParse({ level: 10 }).success).toBe(false);
  });

  it('should accept null managerId', () => {
    expect(updateUserAdminSchema.safeParse({ managerId: null }).success).toBe(true);
  });

  it('should reject non-UUID managerId', () => {
    expect(updateUserAdminSchema.safeParse({ managerId: 'not-uuid' }).success).toBe(false);
  });
});

describe('companyObjectiveSchema', () => {
  it('should accept valid company objective', () => {
    const valid = {
      cycleId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Achieve 99.95% uptime',
    };
    expect(companyObjectiveSchema.safeParse(valid).success).toBe(true);
  });

  it('should reject empty title', () => {
    expect(companyObjectiveSchema.safeParse({ cycleId: '550e8400-e29b-41d4-a716-446655440000', title: '' }).success).toBe(false);
  });

  it('should default description to empty string', () => {
    const result = companyObjectiveSchema.safeParse({ cycleId: '550e8400-e29b-41d4-a716-446655440000', title: 'Test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('');
    }
  });
});

// ── Profile Schemas ─────────────────────────────────────────────

describe('updateProfileSchema', () => {
  it('should accept empty update', () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(true);
  });

  it('should accept valid profile fields', () => {
    expect(updateProfileSchema.safeParse({ displayName: 'New Name', jobTitle: 'Senior Engineer' }).success).toBe(true);
  });

  it('should reject empty displayName', () => {
    expect(updateProfileSchema.safeParse({ displayName: '' }).success).toBe(false);
  });

  it('should reject displayName over 100 chars', () => {
    expect(updateProfileSchema.safeParse({ displayName: 'a'.repeat(101) }).success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('should accept valid password change', () => {
    expect(changePasswordSchema.safeParse({ currentPassword: 'old123', newPassword: 'newpass12' }).success).toBe(true);
  });

  it('should reject empty current password', () => {
    expect(changePasswordSchema.safeParse({ currentPassword: '', newPassword: 'newpass12' }).success).toBe(false);
  });

  it('should reject short new password', () => {
    expect(changePasswordSchema.safeParse({ currentPassword: 'old123', newPassword: 'short' }).success).toBe(false);
  });
});
