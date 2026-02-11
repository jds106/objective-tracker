import bcrypt from 'bcrypt';
import type { AuthProvider, AuthResult, User, UserRepository } from '@objective-tracker/shared';
import { AuthenticationError } from '@objective-tracker/shared';
import { loginSchema } from '@objective-tracker/shared';
import { JwtService } from './jwt.service.js';
import type { TokenBlacklist } from './token-blacklist.js';

const SALT_ROUNDS = 12;

export class PasswordAuthProvider implements AuthProvider {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
    private readonly blacklist: TokenBlacklist,
  ) {}

  async authenticate(credentials: unknown): Promise<AuthResult> {
    const { email, password } = loginSchema.parse(credentials);
    const user = await this.userRepo.getByEmail(email);
    if (!user) throw new AuthenticationError('Invalid email or password');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AuthenticationError('Invalid email or password');

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    const decoded = this.jwtService.verify(token);

    const { passwordHash: _, ...safeUser } = user;

    return {
      user: safeUser,
      token,
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
    };
  }

  async validateToken(token: string): Promise<User | null> {
    if (this.blacklist.has(token)) return null;
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userRepo.getById(payload.sub);
      if (!user) return null;
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    } catch {
      return null;
    }
  }

  async revokeToken(token: string): Promise<void> {
    this.blacklist.add(token);
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }
}
