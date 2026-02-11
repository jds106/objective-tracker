import type {
  CheckIn,
  KeyResultRepository,
} from '@objective-tracker/shared';
import { NotFoundError, calculateProgress } from '@objective-tracker/shared';
import type { CheckInBody } from '@objective-tracker/shared';

export class CheckInService {
  constructor(private readonly keyResultRepo: KeyResultRepository) {}

  async recordCheckIn(
    keyResultId: string,
    userId: string,
    input: CheckInBody,
  ): Promise<CheckIn> {
    const kr = await this.keyResultRepo.getById(keyResultId);
    if (!kr) throw new NotFoundError('Key result not found');

    const newProgress = calculateProgress(input.config);

    const checkIn: Omit<CheckIn, 'id'> = {
      keyResultId,
      userId,
      timestamp: new Date().toISOString(),
      previousProgress: kr.progress,
      newProgress,
      note: input.note,
      source: input.source,
      configSnapshot: input.config,
    };

    return this.keyResultRepo.addCheckIn(keyResultId, checkIn);
  }
}
