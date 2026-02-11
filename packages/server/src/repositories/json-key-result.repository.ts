import { join } from 'node:path';
import type {
  KeyResultRepository,
  CreateKeyResultInput,
  UpdateKeyResultInput,
  KeyResult,
  CheckIn,
  UserFile,
} from '@objective-tracker/shared';
import { NotFoundError, generateId, nowISO, calculateProgress } from '@objective-tracker/shared';
import { readJsonFile, writeJsonFile, withWriteLock } from './file-helpers.js';
import type { JsonUserRepository } from './json-user.repository.js';

interface KeyResultsIndex {
  [keyResultId: string]: { userId: string; objectiveId: string };
}

export class JsonKeyResultRepository implements KeyResultRepository {
  private readonly indexPath: string;

  constructor(
    private readonly dataDir: string,
    private readonly userRepo: JsonUserRepository,
  ) {
    this.indexPath = join(dataDir, 'key-results-index.json');
  }

  async init(): Promise<void> {
    const existing = await readJsonFile<KeyResultsIndex>(this.indexPath);
    if (!existing) {
      await writeJsonFile(this.indexPath, {});
    }
  }

  async getById(id: string): Promise<KeyResult | null> {
    const location = await this.lookupLocation(id);
    if (!location) return null;

    const file = await this.userRepo.readUserFile(location.userId);
    if (!file) return null;

    const objective = file.objectives.find(o => o.id === location.objectiveId);
    if (!objective) return null;

    return objective.keyResults.find(kr => kr.id === id) ?? null;
  }

  async create(input: CreateKeyResultInput): Promise<KeyResult> {
    const id = generateId();
    const now = nowISO();

    const progress = calculateProgress(input.config);

    const keyResult: KeyResult = {
      id,
      objectiveId: input.objectiveId,
      title: input.title,
      type: input.type,
      config: input.config,
      progress,
      checkIns: [],
      createdAt: now,
      updatedAt: now,
    };

    // Find which user owns this objective
    const userId = await this.findUserByObjective(input.objectiveId);
    if (!userId) throw new NotFoundError('Objective not found');

    const file = await this.userRepo.readUserFile(userId);
    if (!file) throw new NotFoundError('User not found');

    const objIndex = file.objectives.findIndex(o => o.id === input.objectiveId);
    if (objIndex < 0) throw new NotFoundError('Objective not found');

    const updatedObjectives = [...file.objectives];
    updatedObjectives[objIndex] = {
      ...updatedObjectives[objIndex]!,
      keyResults: [...updatedObjectives[objIndex]!.keyResults, keyResult],
      updatedAt: now,
    };

    const updatedFile: UserFile = {
      ...file,
      version: file.version + 1,
      objectives: updatedObjectives,
    };

    await this.userRepo.writeUserFile(userId, updatedFile, file.version);
    await this.updateIndex(id, userId, input.objectiveId);

    return keyResult;
  }

  async update(id: string, updates: UpdateKeyResultInput): Promise<KeyResult> {
    const location = await this.lookupLocation(id);
    if (!location) throw new NotFoundError('Key result not found');

    const file = await this.userRepo.readUserFile(location.userId);
    if (!file) throw new NotFoundError('User not found');

    const now = nowISO();
    const objIndex = file.objectives.findIndex(o => o.id === location.objectiveId);
    if (objIndex < 0) throw new NotFoundError('Objective not found');

    const objective = file.objectives[objIndex]!;
    const krIndex = objective.keyResults.findIndex(kr => kr.id === id);
    if (krIndex < 0) throw new NotFoundError('Key result not found');

    const existingKr = objective.keyResults[krIndex]!;
    const updatedConfig = updates.config ?? existingKr.config;
    const progress = calculateProgress(updatedConfig);

    const updatedKr: KeyResult = {
      ...existingKr,
      ...updates,
      config: updatedConfig,
      progress,
      updatedAt: now,
    };

    const updatedKeyResults = [...objective.keyResults];
    updatedKeyResults[krIndex] = updatedKr;

    const updatedObjectives = [...file.objectives];
    updatedObjectives[objIndex] = {
      ...objective,
      keyResults: updatedKeyResults,
      updatedAt: now,
    };

    const updatedFile: UserFile = {
      ...file,
      version: file.version + 1,
      objectives: updatedObjectives,
    };

    await this.userRepo.writeUserFile(location.userId, updatedFile, file.version);

    return updatedKr;
  }

  async delete(id: string): Promise<void> {
    const location = await this.lookupLocation(id);
    if (!location) throw new NotFoundError('Key result not found');

    const file = await this.userRepo.readUserFile(location.userId);
    if (!file) throw new NotFoundError('User not found');

    const now = nowISO();
    const objIndex = file.objectives.findIndex(o => o.id === location.objectiveId);
    if (objIndex < 0) throw new NotFoundError('Objective not found');

    const objective = file.objectives[objIndex]!;
    const updatedObjectives = [...file.objectives];
    updatedObjectives[objIndex] = {
      ...objective,
      keyResults: objective.keyResults.filter(kr => kr.id !== id),
      updatedAt: now,
    };

    const updatedFile: UserFile = {
      ...file,
      version: file.version + 1,
      objectives: updatedObjectives,
    };

    await this.userRepo.writeUserFile(location.userId, updatedFile, file.version);
    await this.removeFromIndex(id);
  }

  async addCheckIn(keyResultId: string, checkIn: Omit<CheckIn, 'id'>): Promise<CheckIn> {
    const location = await this.lookupLocation(keyResultId);
    if (!location) throw new NotFoundError('Key result not found');

    const file = await this.userRepo.readUserFile(location.userId);
    if (!file) throw new NotFoundError('User not found');

    const now = nowISO();
    const objIndex = file.objectives.findIndex(o => o.id === location.objectiveId);
    if (objIndex < 0) throw new NotFoundError('Objective not found');

    const objective = file.objectives[objIndex]!;
    const krIndex = objective.keyResults.findIndex(kr => kr.id === keyResultId);
    if (krIndex < 0) throw new NotFoundError('Key result not found');

    const fullCheckIn: CheckIn = {
      ...checkIn,
      id: generateId(),
    };

    const existingKr = objective.keyResults[krIndex]!;
    const updatedKr: KeyResult = {
      ...existingKr,
      config: checkIn.configSnapshot ?? existingKr.config,
      progress: checkIn.newProgress,
      checkIns: [...existingKr.checkIns, fullCheckIn],
      updatedAt: now,
    };

    const updatedKeyResults = [...objective.keyResults];
    updatedKeyResults[krIndex] = updatedKr;

    const updatedObjectives = [...file.objectives];
    updatedObjectives[objIndex] = {
      ...objective,
      keyResults: updatedKeyResults,
      updatedAt: now,
    };

    const updatedFile: UserFile = {
      ...file,
      version: file.version + 1,
      objectives: updatedObjectives,
    };

    await this.userRepo.writeUserFile(location.userId, updatedFile, file.version);

    return fullCheckIn;
  }

  async lookupLocation(keyResultId: string): Promise<{ userId: string; objectiveId: string } | null> {
    const index = await this.readIndex();
    return index[keyResultId] ?? null;
  }

  private async findUserByObjective(objectiveId: string): Promise<string | null> {
    // Read the objectives index to find the owner
    const objIndex = await readJsonFile<Record<string, string>>(
      join(this.dataDir, 'objectives-index.json'),
    );
    return objIndex?.[objectiveId] ?? null;
  }

  private async readIndex(): Promise<KeyResultsIndex> {
    const index = await readJsonFile<KeyResultsIndex>(this.indexPath);
    return index ?? {};
  }

  private async updateIndex(keyResultId: string, userId: string, objectiveId: string): Promise<void> {
    return withWriteLock(this.indexPath, async () => {
      const index = await this.readIndex();
      index[keyResultId] = { userId, objectiveId };
      await writeJsonFile(this.indexPath, index);
    });
  }

  private async removeFromIndex(keyResultId: string): Promise<void> {
    return withWriteLock(this.indexPath, async () => {
      const index = await this.readIndex();
      delete index[keyResultId];
      await writeJsonFile(this.indexPath, index);
    });
  }
}
