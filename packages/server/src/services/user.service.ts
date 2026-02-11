import type { User, UserRepository } from '@objective-tracker/shared';
import { NotFoundError } from '@objective-tracker/shared';

export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async getById(id: string): Promise<User> {
    const user = await this.userRepo.getById(id);
    if (!user) throw new NotFoundError('User not found');
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async getDirectReports(managerId: string): Promise<User[]> {
    return this.userRepo.getDirectReports(managerId);
  }

  async getReportingChain(userId: string): Promise<User[]> {
    return this.userRepo.getReportingChain(userId);
  }
}
