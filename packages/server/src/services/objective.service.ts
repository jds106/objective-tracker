import type {
  Objective,
  ObjectiveRepository,
  CreateObjectiveInput,
  UpdateObjectiveInput,
  CycleRepository,
  KeyResultRepository,
  Cycle,
  TargetDateType,
} from '@objective-tracker/shared';
import { NotFoundError, ValidationError } from '@objective-tracker/shared';

export class ObjectiveService {
  constructor(
    private readonly objectiveRepo: ObjectiveRepository,
    private readonly cycleRepo: CycleRepository,
    private readonly keyResultRepo?: KeyResultRepository,
  ) {}

  /** Fill in default targetDateType/targetDate for objectives created before this feature existed. */
  private async backfillTargetDate(objectives: Objective[]): Promise<Objective[]> {
    const cycleLookup = new Map<string, Cycle>();
    const result: Objective[] = [];
    for (const obj of objectives) {
      if (!obj.targetDate) {
        let cycle = cycleLookup.get(obj.cycleId);
        if (!cycle) {
          const fetched = await this.cycleRepo.getById(obj.cycleId);
          if (fetched) {
            cycle = fetched;
            cycleLookup.set(obj.cycleId, cycle);
          }
        }
        result.push({
          ...obj,
          targetDateType: 'quarterly',
          targetDate: cycle?.endDate ?? new Date().toISOString().split('T')[0]!,
        });
      } else {
        result.push(obj);
      }
    }
    return result;
  }

  async getByUserId(userId: string, cycleId?: string): Promise<Objective[]> {
    const objectives = await this.objectiveRepo.getByUserId(userId, cycleId);
    return this.backfillTargetDate(objectives);
  }

  async getById(id: string): Promise<Objective> {
    const objective = await this.objectiveRepo.getById(id);
    if (!objective) throw new NotFoundError('Objective not found');
    const [filled] = await this.backfillTargetDate([objective]);
    return filled;
  }

  async create(ownerId: string, input: Omit<CreateObjectiveInput, 'ownerId'>): Promise<Objective> {
    const cycle = await this.cycleRepo.getById(input.cycleId);
    if (!cycle) throw new NotFoundError('Cycle not found');
    if (cycle.status === 'closed') {
      throw new ValidationError('Cannot add objectives to a closed cycle');
    }

    return this.objectiveRepo.create({ ...input, ownerId });
  }

  async update(id: string, updates: UpdateObjectiveInput, options?: { requesterRole?: string }): Promise<Objective> {
    const objective = await this.objectiveRepo.getById(id);
    if (!objective) throw new NotFoundError('Objective not found');

    if (updates.status) {
      this.validateStatusTransition(objective.status, updates.status, options?.requesterRole);
    }

    return this.objectiveRepo.update(id, updates);
  }

  /**
   * Find objectives whose `parentObjectiveId` is the given ID.
   * Requires the repo to support `getAll()`.
   */
  async getLinkedChildren(objectiveId: string): Promise<Objective[]> {
    if (!this.objectiveRepo.getAll) return [];
    const all = await this.objectiveRepo.getAll();
    return all.filter(o => o.parentObjectiveId === objectiveId);
  }

  async delete(id: string, force = false): Promise<void> {
    const objective = await this.objectiveRepo.getById(id);
    if (!objective) throw new NotFoundError('Objective not found');
    if (objective.status !== 'draft') {
      throw new ValidationError('Only draft objectives can be deleted');
    }

    // Check for linked children
    if (!force) {
      const children = await this.getLinkedChildren(id);
      if (children.length > 0) {
        const err = new ValidationError(
          `This objective has ${children.length} linked child objective${children.length !== 1 ? 's' : ''}. Use force=true to delete anyway.`,
        );
        (err as ValidationError & { linkedChildren: Array<{ id: string; title: string; ownerId: string }> }).linkedChildren =
          children.map(c => ({ id: c.id, title: c.title, ownerId: c.ownerId }));
        throw err;
      }
    }

    // If force-deleting, unlink children first
    if (force) {
      const children = await this.getLinkedChildren(id);
      for (const child of children) {
        await this.objectiveRepo.update(child.id, { parentObjectiveId: null });
      }
    }

    return this.objectiveRepo.delete(id);
  }

  async rollforward(id: string, targetCycleId: string): Promise<Objective> {
    const original = await this.objectiveRepo.getById(id);
    if (!original) throw new NotFoundError('Objective not found');

    // Only active or at-risk objectives can be rolled forward
    if (original.status !== 'active') {
      throw new ValidationError('Only active objectives can be rolled forward');
    }

    const targetCycle = await this.cycleRepo.getById(targetCycleId);
    if (!targetCycle) throw new NotFoundError('Target cycle not found');
    if (targetCycle.status === 'closed') {
      throw new ValidationError('Cannot roll forward to a closed cycle');
    }

    // Compute target date for the rolled-forward copy
    const originalCycle = await this.cycleRepo.getById(original.cycleId);
    let newTargetDateType: TargetDateType = original.targetDateType ?? 'quarterly';
    let newTargetDate: string;

    if (newTargetDateType === 'quarterly' && targetCycle.quarters.length > 0) {
      // Find same-index quarter in target cycle
      const origQuarterIndex = originalCycle
        ? originalCycle.quarters.findIndex(q => original.targetDate <= q.endDate && original.targetDate >= q.startDate)
        : -1;
      const targetQuarter = origQuarterIndex >= 0 && origQuarterIndex < targetCycle.quarters.length
        ? targetCycle.quarters[origQuarterIndex]
        : targetCycle.quarters[0];
      newTargetDate = targetQuarter!.endDate;
    } else if (newTargetDateType === 'annual') {
      const targetYear = new Date(targetCycle.startDate).getFullYear();
      newTargetDate = `${targetYear}-12-31`;
    } else {
      // arbitrary: shift date forward by the difference between cycle start dates
      if (originalCycle) {
        const origStart = new Date(originalCycle.startDate).getTime();
        const targetStart = new Date(targetCycle.startDate).getTime();
        const shiftMs = targetStart - origStart;
        const origTarget = new Date(original.targetDate ?? originalCycle.endDate);
        const shifted = new Date(origTarget.getTime() + shiftMs);
        newTargetDate = shifted.toISOString().split('T')[0]!;
      } else {
        newTargetDate = targetCycle.endDate;
      }
    }

    // Create a copy of the objective in the new cycle
    const newObjective = await this.objectiveRepo.create({
      ownerId: original.ownerId,
      cycleId: targetCycleId,
      title: original.title,
      description: original.description,
      parentKeyResultId: null, // Don't carry forward parent links — they may not exist in the new cycle
      parentObjectiveId: null,
      targetDateType: newTargetDateType,
      targetDate: newTargetDate,
    });

    // Copy key results with progress reset to 0
    if (this.keyResultRepo) {
      for (const kr of original.keyResults) {
        const resetConfig = { ...kr.config };
        // Reset progress-related config values
        if ('current' in resetConfig) {
          (resetConfig as Record<string, unknown>).current = (resetConfig as Record<string, unknown>).start ?? 0;
        }
        if ('completed' in resetConfig) {
          (resetConfig as Record<string, unknown>).completed = false;
        }
        if ('items' in resetConfig && Array.isArray((resetConfig as Record<string, unknown>).items)) {
          (resetConfig as { items: Array<{ completed: boolean }> }).items =
            (resetConfig as { items: Array<{ completed: boolean; name: string }> }).items.map(item => ({
              ...item,
              completed: false,
            }));
        }

        await this.keyResultRepo.create({
          objectiveId: newObjective.id,
          title: kr.title,
          type: kr.type,
          config: resetConfig,
        });
      }
    }

    // Mark the original as rolled forward
    await this.objectiveRepo.update(id, { status: 'rolled_forward' });

    // Return the new objective (re-fetch to get attached KRs)
    return this.objectiveRepo.getById(newObjective.id) as Promise<Objective>;
  }

  private validateStatusTransition(current: string, next: string, requesterRole?: string): void {
    const allowed: Record<string, string[]> = {
      draft: ['active'],
      active: ['completed', 'cancelled', 'rolled_forward'],
      completed: [],
      cancelled: [],
      rolled_forward: [],
    };

    // Admin-only: allow reverting active objectives back to draft
    if (current === 'active' && next === 'draft' && requesterRole === 'admin') {
      return;
    }

    if (!allowed[current]?.includes(next)) {
      throw new ValidationError(
        `Cannot transition from '${current}' to '${next}'`,
      );
    }
  }
}
