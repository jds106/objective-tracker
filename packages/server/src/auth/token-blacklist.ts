import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { logger } from '../logger.js';

const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const PERSIST_DEBOUNCE_MS = 2_000; // Debounce writes to avoid excessive I/O

export class TokenBlacklist {
  /** Map of token → expiry timestamp (ms since epoch) */
  private readonly revoked = new Map<string, number>();
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly persistPath: string | null;

  /**
   * @param persistPath  Optional file path for persisting blacklisted tokens.
   *                     If omitted, tokens are in-memory only (lost on restart).
   */
  constructor(persistPath?: string) {
    this.persistPath = persistPath ?? null;
  }

  /** Load previously persisted tokens from disk. Call once at startup. */
  async load(): Promise<void> {
    if (!this.persistPath) return;
    try {
      const raw = await readFile(this.persistPath, 'utf-8');
      const entries: Array<[string, number]> = JSON.parse(raw);
      const now = Date.now();
      let loaded = 0;
      for (const [token, expiresAt] of entries) {
        if (now <= expiresAt) {
          this.revoked.set(token, expiresAt);
          loaded++;
        }
      }
      logger.info({ loaded, expired: entries.length - loaded }, 'Token blacklist loaded from disk');
    } catch {
      // File doesn't exist yet — that's fine
    }
  }

  /**
   * Revoke a token, storing its expiry so it can be cleaned up later.
   * @param token  The JWT to blacklist
   * @param expiresAt  Epoch ms when the token expires. Defaults to 24 hours from now.
   */
  add(token: string, expiresAt?: number): void {
    this.revoked.set(token, expiresAt ?? Date.now() + DEFAULT_EXPIRY_MS);
    this.schedulePersist();
  }

  /**
   * Check whether a token has been revoked.
   * Also triggers cleanup of expired entries on every call.
   */
  has(token: string): boolean {
    this.cleanup();
    return this.revoked.has(token);
  }

  /** Remove all entries whose expiry timestamp has passed. */
  cleanup(): void {
    const now = Date.now();
    let cleaned = false;
    for (const [token, expiresAt] of this.revoked) {
      if (now > expiresAt) {
        this.revoked.delete(token);
        cleaned = true;
      }
    }
    if (cleaned) this.schedulePersist();
  }

  /** Debounced write to disk. */
  private schedulePersist(): void {
    if (!this.persistPath) return;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      void this.persist();
    }, PERSIST_DEBOUNCE_MS);
  }

  /** Write current blacklist to disk. */
  private async persist(): Promise<void> {
    if (!this.persistPath) return;
    try {
      await mkdir(dirname(this.persistPath), { recursive: true });
      const entries = [...this.revoked.entries()];
      await writeFile(this.persistPath, JSON.stringify(entries), 'utf-8');
    } catch (err) {
      logger.error({ err }, 'Failed to persist token blacklist');
    }
  }

  /** Flush pending writes immediately. Call on shutdown. */
  async flush(): Promise<void> {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    await this.persist();
  }
}
