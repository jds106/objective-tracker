import type { Cycle, CycleRepository, CycleStatus, UpdateCycleInput } from '@objective-tracker/shared';
import { NotFoundError } from '@objective-tracker/shared';

const VALID_STATUS_TRANSITIONS: Record<CycleStatus, CycleStatus[]> = {
  planning: ['active'],
  active: ['review'],
  review: ['closed'],
  closed: [],
};

export class CycleService {
  constructor(private readonly cycleRepo: CycleRepository) {}

  async getAll(): Promise<Cycle[]> {
    return this.cycleRepo.getAll();
  }

  async getActive(): Promise<Cycle> {
    const cycle = await this.cycleRepo.getActive();
    if (!cycle) throw new NotFoundError('No active cycle found');
    return cycle;
  }

  async getById(id: string): Promise<Cycle> {
    const cycle = await this.cycleRepo.getById(id);
    if (!cycle) throw new NotFoundError('Cycle not found');
    return cycle;
  }

  async create(input: Omit<Cycle, 'id'>): Promise<Cycle> {
    return this.cycleRepo.create(input);
  }

  async update(id: string, updates: UpdateCycleInput): Promise<Cycle> {
    const existing = await this.cycleRepo.getById(id);
    if (!existing) throw new NotFoundError('Cycle not found');

    // Validate status transition if status is being changed
    if (updates.status && updates.status !== existing.status) {
      const allowed = VALID_STATUS_TRANSITIONS[existing.status];
      if (!allowed.includes(updates.status)) {
        throw new Error(
          `Invalid status transition: cannot go from '${existing.status}' to '${updates.status}'. ` +
          `Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'none (cycle is closed)'}.`
        );
      }

      // If transitioning to 'active', check no other cycle is already active
      if (updates.status === 'active') {
        const currentActive = await this.cycleRepo.getActive();
        if (currentActive && currentActive.id !== id) {
          throw new Error(
            `Cannot activate this cycle: '${currentActive.name}' is already active. ` +
            `Transition that cycle to 'review' or 'closed' first.`
          );
        }
      }
    }

    return this.cycleRepo.update(id, updates);
  }
}
