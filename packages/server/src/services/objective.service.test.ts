import { describe, it, expect, beforeEach } from 'vitest';
import type {
  Objective,
  ObjectiveRepository,
  CycleRepository,
  Cycle,
  CreateObjectiveInput,
  UpdateObjectiveInput,
} from '@objective-tracker/shared';
import { NotFoundError, ValidationError } from '@objective-tracker/shared';
import { ObjectiveService } from './objective.service.js';

// ── Helpers ─────────────────────────────────────────────────────

function makeObjective(overrides: Partial<Objective> & { id: string; ownerId: string }): Objective {
  return {
    cycleId: 'cycle-1',
    title: `Objective ${overrides.id}`,
    description: '',
    parentKeyResultId: null,
    parentObjectiveId: null,
    status: 'draft',
    keyResults: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const activeCycle: Cycle = {
  id: 'cycle-1',
  name: 'FY2026',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  quarters: [],
  status: 'active',
};

const closedCycle: Cycle = {
  id: 'cycle-closed',
  name: 'FY2025',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  quarters: [],
  status: 'closed',
};

function buildMockObjectiveRepo(objectives: Objective[]): ObjectiveRepository {
  const store = new Map(objectives.map(o => [o.id, { ...o }]));

  return {
    getByUserId: async (userId, cycleId) =>
      [...store.values()].filter(o => o.ownerId === userId && (!cycleId || o.cycleId === cycleId)),
    getById: async (id) => store.get(id) ?? null,
    create: async (input: CreateObjectiveInput) => {
      const obj = makeObjective({
        id: `new-${Date.now()}`,
        ...input,
      });
      store.set(obj.id, obj);
      return obj;
    },
    update: async (id, updates: UpdateObjectiveInput) => {
      const existing = store.get(id);
      if (!existing) throw new NotFoundError('Objective not found');
      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      store.set(id, updated);
      return updated;
    },
    delete: async (id) => {
      store.delete(id);
    },
  };
}

function buildMockCycleRepo(cycles: Cycle[]): CycleRepository {
  const byId = new Map(cycles.map(c => [c.id, c]));
  return {
    getAll: async () => cycles,
    getActive: async () => cycles.find(c => c.status === 'active') ?? null,
    getById: async (id) => byId.get(id) ?? null,
    create: async () => { throw new Error('not needed'); },
    update: async () => { throw new Error('not needed'); },
  };
}

// ── Test data ───────────────────────────────────────────────────

const draftObj = makeObjective({ id: 'obj-1', ownerId: 'user-1', status: 'draft' });
const activeObj = makeObjective({ id: 'obj-2', ownerId: 'user-1', status: 'active' });
const completedObj = makeObjective({ id: 'obj-3', ownerId: 'user-1', status: 'completed' });
const cancelledObj = makeObjective({ id: 'obj-4', ownerId: 'user-1', status: 'cancelled' });

// ── Tests ───────────────────────────────────────────────────────

describe('ObjectiveService', () => {
  let service: ObjectiveService;

  beforeEach(() => {
    const objectiveRepo = buildMockObjectiveRepo([draftObj, activeObj, completedObj, cancelledObj]);
    const cycleRepo = buildMockCycleRepo([activeCycle, closedCycle]);
    service = new ObjectiveService(objectiveRepo, cycleRepo);
  });

  // ── getByUserId ─────────────────────────────────────────

  describe('getByUserId', () => {
    it('should return objectives for a user', async () => {
      const objectives = await service.getByUserId('user-1');
      expect(objectives).toHaveLength(4);
    });

    it('should return empty array for unknown user', async () => {
      const objectives = await service.getByUserId('nonexistent');
      expect(objectives).toEqual([]);
    });

    it('should filter by cycleId', async () => {
      const objectives = await service.getByUserId('user-1', 'nonexistent-cycle');
      expect(objectives).toEqual([]);
    });
  });

  // ── getById ─────────────────────────────────────────────

  describe('getById', () => {
    it('should return an objective by id', async () => {
      const obj = await service.getById('obj-1');
      expect(obj.id).toBe('obj-1');
      expect(obj.title).toBe('Objective obj-1');
    });

    it('should throw NotFoundError for unknown id', async () => {
      await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  // ── create ──────────────────────────────────────────────

  describe('create', () => {
    it('should create an objective in an active cycle', async () => {
      const created = await service.create('user-1', {
        cycleId: 'cycle-1',
        title: 'New Objective',
        description: 'Description',
        parentKeyResultId: null,
        parentObjectiveId: null,
      });
      expect(created.title).toBe('New Objective');
      expect(created.ownerId).toBe('user-1');
    });

    it('should throw NotFoundError for a non-existent cycle', async () => {
      await expect(
        service.create('user-1', {
          cycleId: 'no-such-cycle',
          title: 'Test',
          description: '',
          parentKeyResultId: null,
          parentObjectiveId: null,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for a closed cycle', async () => {
      await expect(
        service.create('user-1', {
          cycleId: 'cycle-closed',
          title: 'Test',
          description: '',
          parentKeyResultId: null,
          parentObjectiveId: null,
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ── update ──────────────────────────────────────────────

  describe('update', () => {
    it('should update title', async () => {
      const updated = await service.update('obj-1', { title: 'Updated Title' });
      expect(updated.title).toBe('Updated Title');
    });

    it('should throw NotFoundError for unknown id', async () => {
      await expect(service.update('nonexistent', { title: 'Test' })).rejects.toThrow(NotFoundError);
    });

    it('should allow valid status transition: draft → active', async () => {
      const updated = await service.update('obj-1', { status: 'active' });
      expect(updated.status).toBe('active');
    });

    it('should allow valid status transition: active → completed', async () => {
      const updated = await service.update('obj-2', { status: 'completed' });
      expect(updated.status).toBe('completed');
    });

    it('should allow valid status transition: active → cancelled', async () => {
      const updated = await service.update('obj-2', { status: 'cancelled' });
      expect(updated.status).toBe('cancelled');
    });

    it('should reject invalid transition: draft → completed', async () => {
      await expect(
        service.update('obj-1', { status: 'completed' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject invalid transition: draft → cancelled', async () => {
      await expect(
        service.update('obj-1', { status: 'cancelled' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject invalid transition: completed → active', async () => {
      await expect(
        service.update('obj-3', { status: 'active' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject invalid transition: cancelled → active', async () => {
      await expect(
        service.update('obj-4', { status: 'active' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject transition: completed → draft', async () => {
      await expect(
        service.update('obj-3', { status: 'draft' }),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ── delete ──────────────────────────────────────────────

  describe('delete', () => {
    it('should delete a draft objective', async () => {
      await service.delete('obj-1');
      await expect(service.getById('obj-1')).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for unknown id', async () => {
      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when deleting a non-draft objective', async () => {
      await expect(service.delete('obj-2')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when deleting a completed objective', async () => {
      await expect(service.delete('obj-3')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when deleting a cancelled objective', async () => {
      await expect(service.delete('obj-4')).rejects.toThrow(ValidationError);
    });
  });
});
