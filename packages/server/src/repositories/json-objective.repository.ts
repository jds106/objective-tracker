import { join } from 'node:path';
import type {
  ObjectiveRepository,
  CreateObjectiveInput,
  UpdateObjectiveInput,
  Objective,
  UserFile,
} from '@objective-tracker/shared';
import { NotFoundError, generateId, nowISO } from '@objective-tracker/shared';
import { readJsonFile, writeJsonFile, withWriteLock } from './file-helpers.js';
import type { JsonUserRepository } from './json-user.repository.js';

interface ObjectivesIndex {
  [objectiveId: string]: string; // objectiveId -> userId
}

export class JsonObjectiveRepository implements ObjectiveRepository {
  private readonly indexPath: string;

  constructor(
    private readonly dataDir: string,
    private readonly userRepo: JsonUserRepository,
  ) {
    this.indexPath = join(dataDir, 'objectives-index.json');
  }

  async init(): Promise<void> {
    const existing = await readJsonFile<ObjectivesIndex>(this.indexPath);
    if (!existing) {
      await writeJsonFile(this.indexPath, {});
    }
  }

  async getByUserId(userId: string, cycleId?: string): Promise<Objective[]> {
    const file = await this.userRepo.readUserFile(userId);
    if (!file) return [];
    if (cycleId) {
      return file.objectives.filter(o => o.cycleId === cycleId);
    }
    return file.objectives;
  }

  async getById(id: string): Promise<Objective | null> {
    const userId = await this.lookupOwner(id);
    if (!userId) return null;

    const file = await this.userRepo.readUserFile(userId);
    if (!file) return null;

    return file.objectives.find(o => o.id === id) ?? null;
  }

  async create(input: CreateObjectiveInput): Promise<Objective> {
    const id = generateId();
    const now = nowISO();

    const objective: Objective = {
      id,
      ownerId: input.ownerId,
      cycleId: input.cycleId,
      title: input.title,
      description: input.description,
      parentKeyResultId: input.parentKeyResultId,
      parentObjectiveId: input.parentObjectiveId,
      status: 'draft',
      keyResults: [],
      createdAt: now,
      updatedAt: now,
    };

    let file = await this.userRepo.readUserFile(input.ownerId);

    // Auto-create a pseudo-user file for company-level objectives
    if (!file && input.ownerId === 'company') {
      const companyFile: UserFile = {
        version: 1,
        user: {
          id: 'company',
          email: 'company@system',
          displayName: 'Company',
          jobTitle: '',
          managerId: null,
          level: 0,
          department: '',
          role: 'standard',
          passwordHash: '',
          createdAt: nowISO(),
          updatedAt: nowISO(),
        },
        objectives: [],
      };
      await writeJsonFile(join(this.dataDir, 'users', 'company.json'), companyFile);
      file = companyFile;
    }

    if (!file) throw new NotFoundError('User not found');

    const updatedFile: UserFile = {
      ...file,
      version: file.version + 1,
      objectives: [...file.objectives, objective],
    };

    await this.userRepo.writeUserFile(input.ownerId, updatedFile, file.version);
    await this.updateIndex(id, input.ownerId);

    return objective;
  }

  async update(id: string, updates: UpdateObjectiveInput): Promise<Objective> {
    const userId = await this.lookupOwner(id);
    if (!userId) throw new NotFoundError('Objective not found');

    const file = await this.userRepo.readUserFile(userId);
    if (!file) throw new NotFoundError('User not found');

    const objIndex = file.objectives.findIndex(o => o.id === id);
    if (objIndex < 0) throw new NotFoundError('Objective not found');

    const now = nowISO();
    const updated: Objective = {
      ...file.objectives[objIndex]!,
      ...updates,
      updatedAt: now,
    };

    const updatedObjectives = [...file.objectives];
    updatedObjectives[objIndex] = updated;

    const updatedFile: UserFile = {
      ...file,
      version: file.version + 1,
      objectives: updatedObjectives,
    };

    await this.userRepo.writeUserFile(userId, updatedFile, file.version);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const userId = await this.lookupOwner(id);
    if (!userId) throw new NotFoundError('Objective not found');

    const file = await this.userRepo.readUserFile(userId);
    if (!file) throw new NotFoundError('User not found');

    const updatedFile: UserFile = {
      ...file,
      version: file.version + 1,
      objectives: file.objectives.filter(o => o.id !== id),
    };

    await this.userRepo.writeUserFile(userId, updatedFile, file.version);
    await this.removeFromIndex(id);
  }

  async lookupOwner(objectiveId: string): Promise<string | null> {
    const index = await this.readIndex();
    return index[objectiveId] ?? null;
  }

  private async readIndex(): Promise<ObjectivesIndex> {
    const index = await readJsonFile<ObjectivesIndex>(this.indexPath);
    return index ?? {};
  }

  private async updateIndex(objectiveId: string, userId: string): Promise<void> {
    return withWriteLock(this.indexPath, async () => {
      const index = await this.readIndex();
      index[objectiveId] = userId;
      await writeJsonFile(this.indexPath, index);
    });
  }

  private async removeFromIndex(objectiveId: string): Promise<void> {
    return withWriteLock(this.indexPath, async () => {
      const index = await this.readIndex();
      delete index[objectiveId];
      await writeJsonFile(this.indexPath, index);
    });
  }
}
