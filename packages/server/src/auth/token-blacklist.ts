const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export class TokenBlacklist {
  /** Map of token → expiry timestamp (ms since epoch) */
  private readonly revoked = new Map<string, number>();

  /**
   * Revoke a token, storing its expiry so it can be cleaned up later.
   * @param token  The JWT to blacklist
   * @param expiresAt  Epoch ms when the token expires. Defaults to 24 hours from now.
   */
  add(token: string, expiresAt?: number): void {
    this.revoked.set(token, expiresAt ?? Date.now() + DEFAULT_EXPIRY_MS);
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
    for (const [token, expiresAt] of this.revoked) {
      if (now > expiresAt) {
        this.revoked.delete(token);
      }
    }
  }
}
