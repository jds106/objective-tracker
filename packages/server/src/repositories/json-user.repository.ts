import { join } from 'node:path';
import { unlink } from 'node:fs/promises';
import type {
  UserRepository,
  CreateUserInput,
  UpdateUserInput,
  User,
  UserWithPassword,
  UserFile,
  UserRole,
} from '@objective-tracker/shared';
import { NotFoundError, ConcurrencyError, generateId, nowISO } from '@objective-tracker/shared';
import { readJsonFile, writeJsonFile, withWriteLock, ensureDir } from './file-helpers.js';

interface OrgIndex {
  users: OrgIndexEntry[];
}

interface OrgIndexEntry {
  id: string;
  email: string;
  displayName: string;
  jobTitle: string;
  managerId: string | null;
  level: number;
  department?: string;
  avatarUrl?: string;
  role?: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export class JsonUserRepository implements UserRepository {
  private readonly usersDir: string;
  private readonly orgPath: string;
  private readonly objectivesIndexPath: string;
  private readonly keyResultsIndexPath: string;

  constructor(private readonly dataDir: string) {
    this.usersDir = join(dataDir, 'users');
    this.orgPath = join(dataDir, 'org.json');
    this.objectivesIndexPath = join(dataDir, 'objectives-index.json');
    this.keyResultsIndexPath = join(dataDir, 'key-results-index.json');
  }

  async init(): Promise<void> {
    await ensureDir(this.usersDir);
    const existing = await readJsonFile<OrgIndex>(this.orgPath);
    if (!existing) {
      await writeJsonFile(this.orgPath, { users: [] });
    }
  }

  async getById(id: string): Promise<UserWithPassword | null> {
    const file = await this.readUserFile(id);
    if (!file) return null;
    return file.user;
  }

  async getByEmail(email: string): Promise<UserWithPassword | null> {
    const org = await this.readOrgIndex();
    const entry = org.users.find(u => u.email === email);
    if (!entry) return null;
    return this.getById(entry.id);
  }

  async getAll(): Promise<User[]> {
    const org = await this.readOrgIndex();
    return org.users.map(stripOrgEntry);
  }

  async getDirectReports(managerId: string): Promise<User[]> {
    const org = await this.readOrgIndex();
    return org.users
      .filter(u => u.managerId === managerId)
      .map(stripOrgEntry);
  }

  async getReportingChain(userId: string): Promise<User[]> {
    const org = await this.readOrgIndex();
    const chain: User[] = [];
    let currentId: string | null = userId;

    // Walk up the chain from the user
    while (currentId) {
      const entry = org.users.find(u => u.id === currentId);
      if (!entry) break;
      if (entry.id !== userId) {
        chain.push(stripOrgEntry(entry));
      }
      currentId = entry.managerId;
    }

    return chain;
  }

  async getDownwardTree(userId: string): Promise<User[]> {
    const org = await this.readOrgIndex();
    const result: User[] = [];
    const queue = [userId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const reports = org.users.filter(u => u.managerId === currentId);
      for (const report of reports) {
        result.push(stripOrgEntry(report));
        queue.push(report.id);
      }
    }

    return result;
  }

  async create(input: CreateUserInput): Promise<User> {
    const id = generateId();
    const now = nowISO();

    const user: UserWithPassword = {
      id,
      email: input.email,
      displayName: input.displayName,
      jobTitle: input.jobTitle,
      managerId: input.managerId,
      level: input.level,
      department: input.department,
      role: input.role ?? 'standard',
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    const userFile: UserFile = {
      version: 1,
      user,
      objectives: [],
    };

    await writeJsonFile(this.userFilePath(id), userFile);
    await this.addToOrgIndex(user);

    return stripPassword(user);
  }

  async update(id: string, updates: UpdateUserInput): Promise<User> {
    return withWriteLock(this.userFilePath(id), async () => {
      const file = await this.readUserFile(id);
      if (!file) throw new NotFoundError('User not found');

      const now = nowISO();
      // Handle avatarUrl: null → remove the field (undefined)
      const { avatarUrl, ...restUpdates } = updates;
      const updatedUser: UserWithPassword = {
        ...file.user,
        ...restUpdates,
        ...(avatarUrl !== undefined && { avatarUrl: avatarUrl ?? undefined }),
        updatedAt: now,
      };

      const updatedFile: UserFile = {
        ...file,
        version: file.version + 1,
        user: updatedUser,
      };

      await writeJsonFile(this.userFilePath(id), updatedFile);
      await this.updateOrgIndex(updatedUser);

      return stripPassword(updatedUser);
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    return withWriteLock(this.userFilePath(id), async () => {
      const file = await this.readUserFile(id);
      if (!file) throw new NotFoundError('User not found');

      const now = nowISO();
      const updatedUser: UserWithPassword = {
        ...file.user,
        passwordHash,
        updatedAt: now,
      };

      const updatedFile: UserFile = {
        ...file,
        version: file.version + 1,
        user: updatedUser,
      };

      await writeJsonFile(this.userFilePath(id), updatedFile);
    });
  }

  async delete(id: string): Promise<void> {
    const file = await this.readUserFile(id);
    if (!file) throw new NotFoundError('User not found');

    // BUG-071: Collect objective and key result IDs before deletion for index cleanup
    const objectiveIds = file.objectives.map(o => o.id);
    const keyResultIds = file.objectives.flatMap(o => o.keyResults.map(kr => kr.id));

    // Remove user file
    await unlink(this.userFilePath(id));

    // Remove from org index
    await withWriteLock(this.orgPath, async () => {
      const org = await this.readOrgIndex();
      org.users = org.users.filter(u => u.id !== id);
      await writeJsonFile(this.orgPath, org);
    });

    // BUG-071: Clean up objectives index
    if (objectiveIds.length > 0) {
      await withWriteLock(this.objectivesIndexPath, async () => {
        const raw = await readJsonFile<Record<string, string>>(this.objectivesIndexPath);
        if (!raw) return;
        for (const objId of objectiveIds) {
          delete raw[objId];
        }
        await writeJsonFile(this.objectivesIndexPath, raw);
      });
    }

    // BUG-071: Clean up key results index
    if (keyResultIds.length > 0) {
      await withWriteLock(this.keyResultsIndexPath, async () => {
        const raw = await readJsonFile<Record<string, unknown>>(this.keyResultsIndexPath);
        if (!raw) return;
        for (const krId of keyResultIds) {
          delete raw[krId];
        }
        await writeJsonFile(this.keyResultsIndexPath, raw);
      });
    }
  }

  // Internal helpers used by objective and key result repos
  async readUserFile(id: string): Promise<UserFile | null> {
    return readJsonFile<UserFile>(this.userFilePath(id));
  }

  async writeUserFile(id: string, file: UserFile, expectedVersion: number): Promise<void> {
    return withWriteLock(this.userFilePath(id), async () => {
      const current = await this.readUserFile(id);
      if (current && current.version !== expectedVersion) {
        throw new ConcurrencyError();
      }
      await writeJsonFile(this.userFilePath(id), file);
    });
  }

  private userFilePath(id: string): string {
    return join(this.usersDir, `${id}.json`);
  }

  private async readOrgIndex(): Promise<OrgIndex> {
    const org = await readJsonFile<OrgIndex>(this.orgPath);
    return org ?? { users: [] };
  }

  private async addToOrgIndex(user: UserWithPassword): Promise<void> {
    return withWriteLock(this.orgPath, async () => {
      const org = await this.readOrgIndex();
      org.users.push(toOrgEntry(user));
      await writeJsonFile(this.orgPath, org);
    });
  }

  private async updateOrgIndex(user: UserWithPassword): Promise<void> {
    return withWriteLock(this.orgPath, async () => {
      const org = await this.readOrgIndex();
      const idx = org.users.findIndex(u => u.id === user.id);
      if (idx >= 0) {
        org.users[idx] = toOrgEntry(user);
        await writeJsonFile(this.orgPath, org);
      }
    });
  }
}

function toOrgEntry(user: UserWithPassword | User): OrgIndexEntry {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    jobTitle: user.jobTitle,
    managerId: user.managerId,
    level: user.level,
    department: user.department,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function stripOrgEntry(entry: OrgIndexEntry): User {
  return {
    id: entry.id,
    email: entry.email,
    displayName: entry.displayName,
    jobTitle: entry.jobTitle,
    managerId: entry.managerId,
    level: entry.level,
    department: entry.department,
    avatarUrl: entry.avatarUrl,
    role: entry.role ?? 'standard',
    createdAt: entry.createdAt ?? '',
    updatedAt: entry.updatedAt ?? '',
  };
}

function stripPassword(user: UserWithPassword): User {
  const { passwordHash: _, ...rest } = user;
  return rest;
}
