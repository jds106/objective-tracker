export function nowISO(): string {
  return new Date().toISOString();
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

export function isBeforeDate(a: string, b: string): boolean {
  return new Date(a).getTime() < new Date(b).getTime();
}

export function isWithinRange(date: string, start: string, end: string): boolean {
  const d = new Date(date).getTime();
  return d >= new Date(start).getTime() && d <= new Date(end).getTime();
}
