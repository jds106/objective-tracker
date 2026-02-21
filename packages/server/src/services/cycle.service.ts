import type { Cycle, CycleRepository } from '@objective-tracker/shared';
import { NotFoundError } from '@objective-tracker/shared';

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
}
