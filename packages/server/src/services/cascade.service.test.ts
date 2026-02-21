import { describe, it, expect, beforeEach } from 'vitest';
import type { User, UserWithPassword, UserRepository, Objective, ObjectiveRepository } from '@objective-tracker/shared';
import { VisibilityService } from './visibility.service.js';
import { CascadeService } from './cascade.service.js';

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

function makeObjective(overrides: Partial<Objective> & { id: string; ownerId: string }): Objective {
  return {
    cycleId: 'cycle-1',
    title: `Objective ${overrides.id}`,
    description: '',
    parentKeyResultId: null,
    parentObjectiveId: null,
    status: 'active',
    keyResults: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

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

function buildMockObjectiveRepo(objectives: Objective[]): ObjectiveRepository {
  const byId = new Map(objectives.map(o => [o.id, o]));

  return {
    getByUserId: async (userId, cycleId) =>
      objectives.filter(o => o.ownerId === userId && (!cycleId || o.cycleId === cycleId)),
    getById: async (id) => byId.get(id) ?? null,
    create: async () => { throw new Error('not needed'); },
    update: async () => { throw new Error('not needed'); },
    delete: async () => { throw new Error('not needed'); },
  };
}

// ── Test data ───────────────────────────────────────────────────
//
// Org:
//   admin (L1, admin)
//   ├── manager (L2)
//   │   └── ic (L3)
//   └── manager-b (L2)
//

const admin    = makeUser({ id: 'admin',     level: 1, managerId: null,     role: 'admin' });
const manager  = makeUser({ id: 'manager',   level: 2, managerId: 'admin'   });
const ic       = makeUser({ id: 'ic',        level: 3, managerId: 'manager' });
const managerB = makeUser({ id: 'manager-b', level: 2, managerId: 'admin'   });

const allUsers = [admin, manager, ic, managerB];

// Objectives cascade: company → admin → manager → ic
const companyObj  = makeObjective({ id: 'co-1', ownerId: 'company', title: 'Company Goal' });
const adminObj    = makeObjective({ id: 'ao-1', ownerId: 'admin',   parentObjectiveId: 'co-1' });
const managerObj  = makeObjective({ id: 'mo-1', ownerId: 'manager', parentObjectiveId: 'ao-1' });
const icObj       = makeObjective({ id: 'io-1', ownerId: 'ic',      parentObjectiveId: 'mo-1' });
const managerBObj = makeObjective({ id: 'mb-1', ownerId: 'manager-b' });

const allObjectives = [companyObj, adminObj, managerObj, icObj, managerBObj];

// ── Tests ───────────────────────────────────────────────────────

describe('CascadeService', () => {
  let service: CascadeService;
  let userRepo: UserRepository;
  let objectiveRepo: ObjectiveRepository;

  beforeEach(() => {
    userRepo = buildMockUserRepo(allUsers);
    objectiveRepo = buildMockObjectiveRepo(allObjectives);
    const visibilityService = new VisibilityService(userRepo);
    service = new CascadeService(userRepo, objectiveRepo, visibilityService);
  });

  describe('getTree', () => {
    it('should return the full tree for admin (sees all users)', async () => {
      const tree = await service.getTree('admin');
      // Should include company objective + admin + manager + ic + manager-b roots or nested
      const allIds = flattenNodeIds(tree);
      expect(allIds).toContain('co-1');
      expect(allIds).toContain('ao-1');
      expect(allIds).toContain('mo-1');
      expect(allIds).toContain('io-1');
      expect(allIds).toContain('mb-1');
    });

    it('should nest children under their parent objectives', async () => {
      const tree = await service.getTree('admin');
      const companyNode = tree.find(n => n.objective.id === 'co-1');
      expect(companyNode).toBeDefined();
      expect(companyNode!.children).toHaveLength(1);
      expect(companyNode!.children[0].objective.id).toBe('ao-1');

      const adminNode = companyNode!.children[0];
      expect(adminNode.children).toHaveLength(1);
      expect(adminNode.children[0].objective.id).toBe('mo-1');
    });

    it('should scope to visible users for standard user', async () => {
      // IC can see: self, manager, admin (upward chain)
      // Cannot see: manager-b (different branch)
      const tree = await service.getTree('ic');
      const allIds = flattenNodeIds(tree);
      expect(allIds).toContain('co-1');  // company visible to all
      expect(allIds).toContain('ao-1');  // admin's objective (in upward chain)
      expect(allIds).toContain('mo-1');  // manager's objective
      expect(allIds).toContain('io-1');  // own objective
      expect(allIds).not.toContain('mb-1'); // manager-b not in visibility
    });

    it('should return empty array for non-existent user', async () => {
      const tree = await service.getTree('nonexistent');
      expect(tree).toEqual([]);
    });

    it('should filter by cycle when cycleId provided', async () => {
      // All test objectives use cycle-1; filtering by non-existent cycle returns empty tree
      const tree = await service.getTree('admin', 'nonexistent-cycle');
      expect(flattenNodeIds(tree)).toHaveLength(0);
    });

    it('should include owner info on each node', async () => {
      const tree = await service.getTree('manager');
      const managerNode = findNode(tree, 'mo-1');
      expect(managerNode).toBeDefined();
      expect(managerNode!.owner.displayName).toBe('manager');
      expect(managerNode!.owner.id).toBe('manager');
    });

    it('should label company-owned nodes as "Company"', async () => {
      const tree = await service.getTree('admin');
      const companyNode = findNode(tree, 'co-1');
      expect(companyNode).toBeDefined();
      expect(companyNode!.owner.displayName).toBe('Company');
    });
  });

  describe('getCascadePath', () => {
    it('should return the full cascade path from leaf to root', async () => {
      const path = await service.getCascadePath('io-1', 'ic');
      // IC can see up: company → admin → manager → ic objective
      expect(path).toHaveLength(4);
      // First element should be the root (company)
      const firstEntry = path[0];
      expect('restricted' in firstEntry ? firstEntry.restricted : false).toBe(false);
      if (!('restricted' in firstEntry)) {
        expect(firstEntry.id).toBe('co-1');
      }
    });

    it('should return restricted entries for invisible objectives', async () => {
      // manager-b cannot see manager's objective (different branch)
      // Path from io-1: company → admin → manager → ic
      // manager-b can see: company (all), admin (upward chain)
      // manager-b cannot see: manager, ic (different branch)
      const path = await service.getCascadePath('io-1', 'manager-b');
      expect(path.length).toBe(4);

      // Company objective: visible
      expect('restricted' in path[0]).toBe(false);
      // Admin objective: visible (upward chain)
      expect('restricted' in path[1]).toBe(false);
      // Manager objective: restricted (different branch)
      expect('restricted' in path[2]).toBe(true);
      // IC objective: restricted (different branch)
      expect('restricted' in path[3]).toBe(true);
    });

    it('should return empty path for non-existent objective', async () => {
      const path = await service.getCascadePath('nonexistent', 'admin');
      expect(path).toEqual([]);
    });

    it('should return single entry for an unlinked root objective', async () => {
      const path = await service.getCascadePath('mb-1', 'admin');
      expect(path).toHaveLength(1);
      if (!('restricted' in path[0])) {
        expect(path[0].id).toBe('mb-1');
      }
    });
  });

  describe('getVisibleUsers (via getTree)', () => {
    it('should include admin seeing all users', async () => {
      // Admin tree should include objectives from all users
      const tree = await service.getTree('admin');
      const ownerIds = new Set(flattenOwnerIds(tree));
      expect(ownerIds.has('admin')).toBe(true);
      expect(ownerIds.has('manager')).toBe(true);
      expect(ownerIds.has('ic')).toBe(true);
      expect(ownerIds.has('manager-b')).toBe(true);
    });

    it('should scope manager to self + reports + upward chain', async () => {
      const tree = await service.getTree('manager');
      const ownerIds = new Set(flattenOwnerIds(tree));
      expect(ownerIds.has('manager')).toBe(true);
      expect(ownerIds.has('admin')).toBe(true);   // upward chain
      expect(ownerIds.has('ic')).toBe(true);       // downward tree
      expect(ownerIds.has('manager-b')).toBe(false); // different branch
    });
  });
});

// ── Helpers ─────────────────────────────────────────────────────

function flattenNodeIds(nodes: { objective: { id: string }; children: unknown[] }[]): string[] {
  const result: string[] = [];
  for (const node of nodes) {
    result.push(node.objective.id);
    result.push(...flattenNodeIds(node.children as typeof nodes));
  }
  return result;
}

function flattenOwnerIds(nodes: { owner: { id: string }; children: unknown[] }[]): string[] {
  const result: string[] = [];
  for (const node of nodes) {
    result.push(node.owner.id);
    result.push(...flattenOwnerIds(node.children as typeof nodes));
  }
  return result;
}

function findNode(
  nodes: { objective: { id: string }; children: unknown[] }[],
  objectiveId: string,
): { objective: { id: string }; owner: { id: string; displayName: string }; children: unknown[] } | undefined {
  for (const node of nodes) {
    if (node.objective.id === objectiveId) return node as ReturnType<typeof findNode>;
    const found = findNode(node.children as typeof nodes, objectiveId);
    if (found) return found;
  }
  return undefined;
}
