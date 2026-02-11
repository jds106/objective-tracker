export class TokenBlacklist {
  private readonly revoked = new Set<string>();

  add(token: string): void {
    this.revoked.add(token);
  }

  has(token: string): boolean {
    return this.revoked.has(token);
  }
}
