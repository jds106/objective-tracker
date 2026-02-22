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

/* ── Display formatters (YYYY-MM-DD / 24-hour HH:MM:SS) ─── */

/** Pad a number to two digits */
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Format an ISO date/timestamp string as YYYY-MM-DD */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Format an ISO timestamp string as YYYY-MM-DD HH:MM:SS (24-hour) */
export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${formatDate(dateStr)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

/**
 * Format relative time for recent events, falling back to YYYY-MM-DD for older dates.
 * - < 1 min → "just now"
 * - < 60 min → "Xm ago"
 * - < 24 hours → "Xh ago"
 * - < 7 days → "Xd ago"
 * - ≥ 7 days → YYYY-MM-DD
 */
/**
 * Find the quarter in a cycle whose date range contains today and return its endDate.
 * Falls back to the cycle's endDate if no quarter matches.
 */
export function getCurrentQuarterEndDate(cycle: { quarters: Array<{ startDate: string; endDate: string }>; endDate: string }): string {
  const now = new Date();
  for (const q of cycle.quarters) {
    if (now >= new Date(q.startDate) && now <= new Date(q.endDate)) {
      return q.endDate;
    }
  }
  return cycle.endDate;
}

export function formatRelativeTime(dateStr: string): string {
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return dateStr;

  const diffMs = Date.now() - then;
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(dateStr);
}
