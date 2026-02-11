import { join } from 'node:path';
import type { CycleRepository, Cycle } from '@objective-tracker/shared';
import { generateId } from '@objective-tracker/shared';
import { readJsonFile, writeJsonFile, withWriteLock } from './file-helpers.js';

interface CyclesFile {
  version: number;
  cycles: Cycle[];
}

export class JsonCycleRepository implements CycleRepository {
  private readonly filePath: string;

  constructor(dataDir: string) {
    this.filePath = join(dataDir, 'cycles.json');
  }

  async init(): Promise<void> {
    const existing = await readJsonFile<CyclesFile>(this.filePath);
    if (!existing) {
      await writeJsonFile(this.filePath, { version: 1, cycles: [] });
    }
  }

  async getAll(): Promise<Cycle[]> {
    const file = await this.readFile();
    return file.cycles;
  }

  async getActive(): Promise<Cycle | null> {
    const file = await this.readFile();
    return file.cycles.find(c => c.status === 'active') ?? null;
  }

  async getById(id: string): Promise<Cycle | null> {
    const file = await this.readFile();
    return file.cycles.find(c => c.id === id) ?? null;
  }

  async create(cycle: Omit<Cycle, 'id'>): Promise<Cycle> {
    return withWriteLock(this.filePath, async () => {
      const file = await this.readFile();

      const newCycle: Cycle = {
        ...cycle,
        id: generateId(),
        quarters: cycle.quarters.map(q => ({
          ...q,
          id: q.id ?? generateId(),
        })),
      };

      const updatedFile: CyclesFile = {
        version: file.version + 1,
        cycles: [...file.cycles, newCycle],
      };

      await writeJsonFile(this.filePath, updatedFile);
      return newCycle;
    });
  }

  private async readFile(): Promise<CyclesFile> {
    const file = await readJsonFile<CyclesFile>(this.filePath);
    return file ?? { version: 1, cycles: [] };
  }
}
