import type {
  Objective,
  ObjectiveRepository,
  CreateObjectiveInput,
  UpdateObjectiveInput,
  CycleRepository,
} from '@objective-tracker/shared';
import { NotFoundError, ValidationError } from '@objective-tracker/shared';

export class ObjectiveService {
  constructor(
    private readonly objectiveRepo: ObjectiveRepository,
    private readonly cycleRepo: CycleRepository,
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

  private validateStatusTransition(current: string, next: string): void {
    const allowed: Record<string, string[]> = {
      draft: ['active'],
      active: ['completed', 'cancelled'],
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
