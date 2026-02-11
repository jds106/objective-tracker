import type { UserRepository } from '@objective-tracker/shared';

export class VisibilityService {
  constructor(private readonly userRepo: UserRepository) {}

  async canView(requesterId: string, targetUserId: string): Promise<boolean> {
    if (requesterId === targetUserId) return true;

    // Check if target is in requester's upward chain
    const chain = await this.userRepo.getReportingChain(requesterId);
    if (chain.some(u => u.id === targetUserId)) return true;

    // Check if target is in requester's downward tree
    const tree = await this.userRepo.getDownwardTree(requesterId);
    if (tree.some(u => u.id === targetUserId)) return true;

    return false;
  }

  async canEdit(requesterId: string, targetUserId: string): Promise<boolean> {
    if (requesterId === targetUserId) return true;

    // Can edit if target is in downward tree (manager can edit down)
    const tree = await this.userRepo.getDownwardTree(requesterId);
    return tree.some(u => u.id === targetUserId);
  }
}
