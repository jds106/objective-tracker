import { describe, it, expect, beforeEach } from 'vitest';
import type { User, UserWithPassword, UserRepository } from '@objective-tracker/shared';
import { VisibilityService } from './visibility.service.js';

// ── Helpers ─────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> & { id: string }): UserWithPassword {
  return {
    email: `${overrides.id}@test.com`,
    displayName: overrides.displayName ?? overrides.id,
    jobTitle: overrides.jobTitle ?? 'Engineer',
    managerId: overrides.managerId ?? null,
    level: overrides.level ?? 5,
    role: overrides.role ?? 'standard',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    passwordHash: 'hashed',
    ...overrides,
  };
}

/**
 * Builds an in-memory UserRepository stub for a given set of users.
 * Derives reporting chain and downward tree from managerId fields.
 */
function buildMockUserRepo(users: UserWithPassword[]): UserRepository {
  const byId = new Map(users.map(u => [u.id, u]));

  return {
    getById: async (id) => byId.get(id) ?? null,
    getByEmail: async (email) => users.find(u => u.email === email) ?? null,
    getAll: async () => users.map(({ passwordHash: _, ...rest }) => rest),
    getDirectReports: async (managerId) =>
      users.filter(u => u.managerId === managerId).map(({ passwordHash: _, ...rest }) => rest),

    getReportingChain: async (userId) => {
      const chain: User[] = [];
      let current = byId.get(userId);
      while (current?.managerId) {
        const manager = byId.get(current.managerId);
        if (!manager) break;
        const { passwordHash: _, ...safe } = manager;
        chain.push(safe);
        current = manager;
      }
      return chain;
    },

    getDownwardTree: async (userId) => {
      const result: User[] = [];
      const queue = [userId];
      while (queue.length > 0) {
        const parentId = queue.shift()!;
        const reports = users.filter(u => u.managerId === parentId);
        for (const r of reports) {
          const { passwordHash: _, ...safe } = r;
          result.push(safe);
          queue.push(r.id);
        }
      }
      return result;
    },

    create: async () => { throw new Error('not needed'); },
    update: async () => { throw new Error('not needed'); },
    updatePassword: async () => { throw new Error('not needed'); },
    delete: async () => { throw new Error('not needed'); },
  };
}

// ── Test data ───────────────────────────────────────────────────
//
// Org structure:
//   cto (L1)
//   ├── gh-a (L2)
//   │   ├── tl-a1 (L3)
//   │   │   └── ic-a1a (L5)
//   │   └── tl-a2 (L3)
//   └── gh-b (L2)
//       └── tl-b1 (L3)
//

const cto  = makeUser({ id: 'cto',   level: 1, managerId: null,  role: 'admin' });
const ghA  = makeUser({ id: 'gh-a',  level: 2, managerId: 'cto'  });
const ghB  = makeUser({ id: 'gh-b',  level: 2, managerId: 'cto'  });
const tlA1 = makeUser({ id: 'tl-a1', level: 3, managerId: 'gh-a' });
const tlA2 = makeUser({ id: 'tl-a2', level: 3, managerId: 'gh-a' });
const tlB1 = makeUser({ id: 'tl-b1', level: 3, managerId: 'gh-b' });
const icA1a = makeUser({ id: 'ic-a1a', level: 5, managerId: 'tl-a1' });

const allUsers = [cto, ghA, ghB, tlA1, tlA2, tlB1, icA1a];

// ── Tests ───────────────────────────────────────────────────────

describe('VisibilityService', () => {
  let service: VisibilityService;

  beforeEach(() => {
    service = new VisibilityService(buildMockUserRepo(allUsers));
  });

  // ── canView ─────────────────────────────────────────────

  describe('canView', () => {
    it('should allow a user to view themselves', async () => {
      expect(await service.canView('tl-a1', 'tl-a1')).toBe(true);
    });

    it('should allow viewing upward chain (report → manager)', async () => {
      expect(await service.canView('ic-a1a', 'tl-a1')).toBe(true);
      expect(await service.canView('ic-a1a', 'gh-a')).toBe(true);
      expect(await service.canView('ic-a1a', 'cto')).toBe(true);
    });

    it('should allow viewing downward tree (manager → reports)', async () => {
      expect(await service.canView('gh-a', 'tl-a1')).toBe(true);
      expect(await service.canView('gh-a', 'tl-a2')).toBe(true);
      expect(await service.canView('gh-a', 'ic-a1a')).toBe(true);
    });

    it('should deny viewing across peer groups (no sideways visibility)', async () => {
      // tl-a1 cannot see tl-b1 (different group head)
      expect(await service.canView('tl-a1', 'tl-b1')).toBe(false);
    });

    it('should deny viewing peer at same level under same manager', async () => {
      // tl-a1 cannot see tl-a2 (peers — not in upward chain or downward tree)
      expect(await service.canView('tl-a1', 'tl-a2')).toBe(false);
    });

    it('should deny viewing across group heads', async () => {
      // gh-a cannot see tl-b1 (under gh-b)
      expect(await service.canView('gh-a', 'tl-b1')).toBe(false);
    });

    it('should allow CTO to view everyone (all are in downward tree)', async () => {
      for (const user of allUsers) {
        expect(await service.canView('cto', user.id)).toBe(true);
      }
    });

    it('should allow anyone to view company objectives', async () => {
      expect(await service.canView('ic-a1a', 'company')).toBe(true);
      expect(await service.canView('tl-b1', 'company')).toBe(true);
    });

    it('should return false for a non-existent requester', async () => {
      expect(await service.canView('nonexistent', 'cto')).toBe(false);
    });

    it('should allow admin to view any user regardless of reporting chain', async () => {
      // CTO is admin and happens to be at the top of the tree.
      // To truly test admin bypass, make gh-b an admin — they should see tl-a1 (different subtree).
      const users = allUsers.map(u => u.id === 'gh-b' ? { ...u, role: 'admin' as const } : u);
      const adminService = new VisibilityService(buildMockUserRepo(users));
      // gh-b (admin) should see tl-a1 (under gh-a, not in gh-b's tree)
      expect(await adminService.canView('gh-b', 'tl-a1')).toBe(true);
      expect(await adminService.canView('gh-b', 'ic-a1a')).toBe(true);
    });
  });

  // ── canEdit ─────────────────────────────────────────────

  describe('canEdit', () => {
    it('should allow a user to edit their own objectives', async () => {
      expect(await service.canEdit('tl-a1', 'tl-a1')).toBe(true);
    });

    it('should allow editing downward (manager edits report)', async () => {
      expect(await service.canEdit('gh-a', 'tl-a1')).toBe(true);
      expect(await service.canEdit('gh-a', 'ic-a1a')).toBe(true);
    });

    it('should deny editing upward (report cannot edit manager)', async () => {
      expect(await service.canEdit('tl-a1', 'gh-a')).toBe(false);
      expect(await service.canEdit('ic-a1a', 'cto')).toBe(false);
    });

    it('should deny editing across peer groups', async () => {
      expect(await service.canEdit('tl-a1', 'tl-b1')).toBe(false);
      expect(await service.canEdit('gh-a', 'gh-b')).toBe(false);
    });

    it('should deny editing peers under same manager', async () => {
      expect(await service.canEdit('tl-a1', 'tl-a2')).toBe(false);
    });

    it('should allow admin to edit company objectives', async () => {
      expect(await service.canEdit('cto', 'company')).toBe(true);
    });

    it('should deny standard user from editing company objectives', async () => {
      expect(await service.canEdit('gh-a', 'company')).toBe(false);
    });

    it('should allow CTO to edit all reports', async () => {
      for (const user of allUsers) {
        expect(await service.canEdit('cto', user.id)).toBe(true);
      }
    });

    it('should allow admin to edit any user regardless of reporting chain', async () => {
      // Make gh-b an admin — they should be able to edit tl-a1 (different subtree)
      const users = allUsers.map(u => u.id === 'gh-b' ? { ...u, role: 'admin' as const } : u);
      const adminService = new VisibilityService(buildMockUserRepo(users));
      expect(await adminService.canEdit('gh-b', 'tl-a1')).toBe(true);
      expect(await adminService.canEdit('gh-b', 'ic-a1a')).toBe(true);
      expect(await adminService.canEdit('gh-b', 'gh-a')).toBe(true);
    });

    it('should allow admin to edit company objectives', async () => {
      // Make gh-a an admin — they should be able to edit company objectives
      const users = allUsers.map(u => u.id === 'gh-a' ? { ...u, role: 'admin' as const } : u);
      const adminService = new VisibilityService(buildMockUserRepo(users));
      expect(await adminService.canEdit('gh-a', 'company')).toBe(true);
    });
  });
});
