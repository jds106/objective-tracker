import type {
  Objective,
  ObjectiveRepository,
  CreateObjectiveInput,
  UpdateObjectiveInput,
  CycleRepository,
  KeyResultRepository,
} from '@objective-tracker/shared';
import { NotFoundError, ValidationError } from '@objective-tracker/shared';

export class ObjectiveService {
  constructor(
    private readonly objectiveRepo: ObjectiveRepository,
    private readonly cycleRepo: CycleRepository,
    private readonly keyResultRepo?: KeyResultRepository,
  ) {}

  async getByUserId(userId: string, cycleId?: string): Promise<Objective[]> {
    return this.objectiveRepo.getByUserId(userId, cycleId);
  }

  async getById(id: string): Promise<Objective> {
    const objective = await this.objectiveRepo.getById(id);
    if (!objective) throw new NotFoundError('Objective not found');
    return objective;
  }

  async create(ownerId: string, input: Omit<CreateObjectiveInput, 'ownerId'>): Promise<Objective> {
    const cycle = await this.cycleRepo.getById(input.cycleId);
    if (!cycle) throw new NotFoundError('Cycle not found');
    if (cycle.status === 'closed') {
      throw new ValidationError('Cannot add objectives to a closed cycle');
    }

    return this.objectiveRepo.create({ ...input, ownerId });
  }

  async update(id: string, updates: UpdateObjectiveInput): Promise<Objective> {
    const objective = await this.objectiveRepo.getById(id);
    if (!objective) throw new NotFoundError('Objective not found');

    if (updates.status) {
      this.validateStatusTransition(objective.status, updates.status);
    }

    return this.objectiveRepo.update(id, updates);
  }

  async delete(id: string): Promise<void> {
    const objective = await this.objectiveRepo.getById(id);
    if (!objective) throw new NotFoundError('Objective not found');
    if (objective.status !== 'draft') {
      throw new ValidationError('Only draft objectives can be deleted');
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

    // Create a copy of the objective in the new cycle
    const newObjective = await this.objectiveRepo.create({
      ownerId: original.ownerId,
      cycleId: targetCycleId,
      title: original.title,
      description: original.description,
      parentKeyResultId: null, // Don't carry forward parent links — they may not exist in the new cycle
      parentObjectiveId: null,
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

  private validateStatusTransition(current: string, next: string): void {
    const allowed: Record<string, string[]> = {
      draft: ['active'],
      active: ['completed', 'cancelled', 'rolled_forward'],
      completed: [],
      cancelled: [],
      rolled_forward: [],
    };

    if (!allowed[current]?.includes(next)) {
      throw new ValidationError(
        `Cannot transition from '${current}' to '${next}'`,
      );
    }
  }
}
