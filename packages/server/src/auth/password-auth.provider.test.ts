import { describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import type { UserWithPassword, UserRepository } from '@objective-tracker/shared';
import { AuthenticationError } from '@objective-tracker/shared';
import { PasswordAuthProvider } from './password-auth.provider.js';
import { JwtService } from './jwt.service.js';
import { TokenBlacklist } from './token-blacklist.js';

// ── Helpers ─────────────────────────────────────────────────────

const SALT_ROUNDS = 4; // fast for testing

async function makeUserWithHash(
  overrides: Partial<UserWithPassword> & { id: string; email: string; password: string },
): Promise<UserWithPassword> {
  const hash = await bcrypt.hash(overrides.password, SALT_ROUNDS);
  return {
    displayName: overrides.displayName ?? 'Test User',
    jobTitle: overrides.jobTitle ?? 'Engineer',
    managerId: overrides.managerId ?? null,
    level: overrides.level ?? 3,
    role: overrides.role ?? 'standard',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
    passwordHash: hash,
  };
}

function buildMockUserRepo(users: UserWithPassword[]): UserRepository {
  const byId = new Map(users.map(u => [u.id, u]));
  const byEmail = new Map(users.map(u => [u.email, u]));

  return {
    getById: async (id) => byId.get(id) ?? null,
    getByEmail: async (email) => byEmail.get(email) ?? null,
    getAll: async () => users.map(({ passwordHash: _, ...rest }) => rest),
    getDirectReports: async () => [],
    getReportingChain: async () => [],
    getDownwardTree: async () => [],
    create: async () => { throw new Error('not needed'); },
    update: async () => { throw new Error('not needed'); },
    updatePassword: async (id: string, hash: string) => {
      const user = byId.get(id);
      if (user) {
        user.passwordHash = hash;
      }
    },
    delete: async () => { throw new Error('not needed'); },
  };
}

// ── Tests ───────────────────────────────────────────────────────

describe('PasswordAuthProvider', () => {
  let provider: PasswordAuthProvider;
  let userRepo: UserRepository;
  let jwtService: JwtService;
  let blacklist: TokenBlacklist;
  let testUser: UserWithPassword;

  beforeEach(async () => {
    testUser = await makeUserWithHash({
      id: 'user-1',
      email: 'test@example.com',
      password: 'correctpassword',
      displayName: 'Test User',
    });

    userRepo = buildMockUserRepo([testUser]);
    jwtService = new JwtService({
      JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
      JWT_EXPIRY: '1h',
    });
    blacklist = new TokenBlacklist();
    provider = new PasswordAuthProvider(userRepo, jwtService, blacklist, SALT_ROUNDS);
  });

  // ── authenticate ──────────────────────────────────────────

  describe('authenticate', () => {
    it('should return user and token for valid credentials', async () => {
      const result = await provider.authenticate({
        email: 'test@example.com',
        password: 'correctpassword',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.displayName).toBe('Test User');
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.expiresAt).toBeDefined();
    });

    it('should not leak passwordHash in the returned user', async () => {
      const result = await provider.authenticate({
        email: 'test@example.com',
        password: 'correctpassword',
      });

      expect('passwordHash' in result.user).toBe(false);
    });

    it('should throw AuthenticationError for wrong password', async () => {
      await expect(
        provider.authenticate({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for non-existent email', async () => {
      await expect(
        provider.authenticate({
          email: 'nonexistent@example.com',
          password: 'correctpassword',
        }),
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw for invalid input shape', async () => {
      await expect(
        provider.authenticate({ foo: 'bar' }),
      ).rejects.toThrow();
    });
  });

  // ── validateToken ─────────────────────────────────────────

  describe('validateToken', () => {
    it('should return user for a valid token', async () => {
      const { token } = await provider.authenticate({
        email: 'test@example.com',
        password: 'correctpassword',
      });

      const user = await provider.validateToken(token);
      expect(user).not.toBeNull();
      expect(user!.email).toBe('test@example.com');
    });

    it('should not leak passwordHash from validated token', async () => {
      const { token } = await provider.authenticate({
        email: 'test@example.com',
        password: 'correctpassword',
      });

      const user = await provider.validateToken(token);
      expect(user).not.toBeNull();
      expect('passwordHash' in user!).toBe(false);
    });

    it('should return null for an invalid token', async () => {
      const user = await provider.validateToken('invalid.jwt.token');
      expect(user).toBeNull();
    });

    it('should return null for a revoked token', async () => {
      const { token } = await provider.authenticate({
        email: 'test@example.com',
        password: 'correctpassword',
      });

      await provider.revokeToken(token);
      const user = await provider.validateToken(token);
      expect(user).toBeNull();
    });
  });

  // ── revokeToken ───────────────────────────────────────────

  describe('revokeToken', () => {
    it('should add token to blacklist', async () => {
      const { token } = await provider.authenticate({
        email: 'test@example.com',
        password: 'correctpassword',
      });

      await provider.revokeToken(token);
      expect(blacklist.has(token)).toBe(true);
    });
  });

  // ── verifyPassword ────────────────────────────────────────

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const result = await provider.verifyPassword('user-1', 'correctpassword');
      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const result = await provider.verifyPassword('user-1', 'wrongpassword');
      expect(result).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      const result = await provider.verifyPassword('nonexistent', 'correctpassword');
      expect(result).toBe(false);
    });
  });

  // ── changePassword ────────────────────────────────────────

  describe('changePassword', () => {
    it('should update the password hash in the repository', async () => {
      await provider.changePassword('user-1', 'newpassword123');

      // Should now be able to verify the new password
      const result = await provider.verifyPassword('user-1', 'newpassword123');
      expect(result).toBe(true);
    });

    it('should invalidate the old password', async () => {
      await provider.changePassword('user-1', 'newpassword123');

      const result = await provider.verifyPassword('user-1', 'correctpassword');
      expect(result).toBe(false);
    });
  });

  // ── hashPassword (static) ────────────────────────────────

  describe('hashPassword (static)', () => {
    it('should produce a valid bcrypt hash', async () => {
      const hash = await PasswordAuthProvider.hashPassword('testpassword', SALT_ROUNDS);
      expect(hash).toMatch(/^\$2[aby]\$/);
      const valid = await bcrypt.compare('testpassword', hash);
      expect(valid).toBe(true);
    });

    it('should produce different hashes for same password (salted)', async () => {
      const hash1 = await PasswordAuthProvider.hashPassword('same', SALT_ROUNDS);
      const hash2 = await PasswordAuthProvider.hashPassword('same', SALT_ROUNDS);
      expect(hash1).not.toBe(hash2);
    });
  });
});
