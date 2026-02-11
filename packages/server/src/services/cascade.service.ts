import type {
  User,
  Objective,
  UserRepository,
  ObjectiveRepository,
} from '@objective-tracker/shared';

export interface CascadeNode {
  objective: Objective;
  owner: { id: string; displayName: string; jobTitle: string; level: number };
  children: CascadeNode[];
}

export class CascadeService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly objectiveRepo: ObjectiveRepository,
  ) {}

  async getTree(requesterId: string, cycleId?: string): Promise<CascadeNode[]> {
    // Gather visible users: self + upward chain + downward tree
    const visibleUsers = await this.getVisibleUsers(requesterId);
    const userMap = new Map<string, User>();
    for (const u of visibleUsers) {
      userMap.set(u.id, u);
    }

    // Fetch objectives for all visible users
    const allObjectives: Objective[] = [];
    for (const user of visibleUsers) {
      const objectives = await this.objectiveRepo.getByUserId(user.id, cycleId);
      allObjectives.push(...objectives);
    }

    // Build a map of objective ID → objective
    const objectiveMap = new Map<string, Objective>();
    for (const obj of allObjectives) {
      objectiveMap.set(obj.id, obj);
    }

    // Build tree: objectives without a parent (or whose parent isn't in the set) become roots
    const childMap = new Map<string, CascadeNode[]>();
    const roots: CascadeNode[] = [];

    for (const obj of allObjectives) {
      const owner = userMap.get(obj.ownerId);
      const node: CascadeNode = {
        objective: obj,
        owner: owner
          ? { id: owner.id, displayName: owner.displayName, jobTitle: owner.jobTitle, level: owner.level }
          : { id: obj.ownerId, displayName: 'Unknown', jobTitle: '', level: 0 },
        children: [],
      };

      if (obj.parentObjectiveId && objectiveMap.has(obj.parentObjectiveId)) {
        const existing = childMap.get(obj.parentObjectiveId) ?? [];
        existing.push(node);
        childMap.set(obj.parentObjectiveId, existing);
      } else {
        roots.push(node);
      }
    }

    // Attach children recursively
    const attachChildren = (node: CascadeNode): void => {
      const children = childMap.get(node.objective.id) ?? [];
      node.children = children;
      for (const child of children) {
        attachChildren(child);
      }
    };

    for (const root of roots) {
      attachChildren(root);
    }

    return roots;
  }

  async getCascadePath(objectiveId: string, requesterId: string): Promise<Objective[]> {
    const path: Objective[] = [];
    let currentId: string | null = objectiveId;

    while (currentId) {
      const obj = await this.objectiveRepo.getById(currentId);
      if (!obj) break;
      path.unshift(obj);
      currentId = obj.parentObjectiveId;
    }

    return path;
  }

  private async getVisibleUsers(requesterId: string): Promise<User[]> {
    const self = await this.userRepo.getById(requesterId);
    if (!self) return [];

    const { passwordHash: _, ...safeUser } = self;
    const chain = await this.userRepo.getReportingChain(requesterId);
    const tree = await this.userRepo.getDownwardTree(requesterId);

    const seen = new Set<string>();
    const result: User[] = [];

    for (const u of [safeUser, ...chain, ...tree]) {
      if (!seen.has(u.id)) {
        seen.add(u.id);
        result.push(u);
      }
    }

    return result;
  }
}
