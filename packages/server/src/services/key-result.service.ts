import type {
  KeyResult,
  KeyResultRepository,
  CreateKeyResultInput,
  UpdateKeyResultInput,
  ObjectiveRepository,
} from '@objective-tracker/shared';
import { NotFoundError } from '@objective-tracker/shared';

export class KeyResultService {
  constructor(
    private readonly keyResultRepo: KeyResultRepository,
    private readonly objectiveRepo: ObjectiveRepository,
  ) {}

  async getById(id: string): Promise<KeyResult> {
    const kr = await this.keyResultRepo.getById(id);
    if (!kr) throw new NotFoundError('Key result not found');
    return kr;
  }

  async create(objectiveId: string, input: Omit<CreateKeyResultInput, 'objectiveId'>): Promise<KeyResult> {
    const objective = await this.objectiveRepo.getById(objectiveId);
    if (!objective) throw new NotFoundError('Objective not found');

    return this.keyResultRepo.create({ ...input, objectiveId });
  }

  async update(id: string, updates: UpdateKeyResultInput): Promise<KeyResult> {
    const kr = await this.keyResultRepo.getById(id);
    if (!kr) throw new NotFoundError('Key result not found');
    return this.keyResultRepo.update(id, updates);
  }

  async delete(id: string): Promise<void> {
    const kr = await this.keyResultRepo.getById(id);
    if (!kr) throw new NotFoundError('Key result not found');
    return this.keyResultRepo.delete(id);
  }
}
