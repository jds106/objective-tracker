import type { UserRepository } from '@objective-tracker/shared';

export class VisibilityService {
  constructor(private readonly userRepo: UserRepository) {}

  async canView(requesterId: string, targetUserId: string): Promise<boolean> {
    if (requesterId === targetUserId) return true;

    // Company objectives are visible to all authenticated users
    if (targetUserId === 'company') return true;

    // Admins can see all users and all objectives
    const requester = await this.userRepo.getById(requesterId);
    if (requester?.role === 'admin') return true;

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

    // Admins can edit any user's objectives
    const requester = await this.userRepo.getById(requesterId);
    if (requester?.role === 'admin') return true;

    // Company objectives can only be edited by admins (handled above)
    if (targetUserId === 'company') return false;

    // Can edit if target is in downward tree (manager can edit down)
    const tree = await this.userRepo.getDownwardTree(requesterId);
    return tree.some(u => u.id === targetUserId);
  }
}
