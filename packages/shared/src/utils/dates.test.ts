import { describe, it, expect, vi, afterEach } from 'vitest';
import { nowISO, toISODate, isBeforeDate, isWithinRange, formatDate, formatDateTime, formatRelativeTime } from './dates.js';

describe('Date utilities', () => {
  describe('nowISO', () => {
    it('should return a valid ISO 8601 string', () => {
      const result = nowISO();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return the current time (±2 seconds)', () => {
      const before = Date.now();
      const result = new Date(nowISO()).getTime();
      const after = Date.now();
      expect(result).toBeGreaterThanOrEqual(before - 100);
      expect(result).toBeLessThanOrEqual(after + 100);
    });
  });

  describe('toISODate', () => {
    it('should extract the date portion from a Date object', () => {
      expect(toISODate(new Date('2026-06-15T14:30:00.000Z'))).toBe('2026-06-15');
    });

    it('should handle midnight dates', () => {
      expect(toISODate(new Date('2026-01-01T00:00:00.000Z'))).toBe('2026-01-01');
    });

    it('should handle end-of-day dates', () => {
      expect(toISODate(new Date('2026-12-31T23:59:59.999Z'))).toBe('2026-12-31');
    });
  });

  describe('isBeforeDate', () => {
    it('should return true when first date is before second', () => {
      expect(isBeforeDate('2026-01-01', '2026-06-01')).toBe(true);
    });

    it('should return false when first date is after second', () => {
      expect(isBeforeDate('2026-06-01', '2026-01-01')).toBe(false);
    });

    it('should return false when dates are equal', () => {
      expect(isBeforeDate('2026-03-15', '2026-03-15')).toBe(false);
    });

    it('should work with full ISO datetime strings', () => {
      expect(isBeforeDate('2026-01-01T10:00:00Z', '2026-01-01T10:00:01Z')).toBe(true);
      expect(isBeforeDate('2026-01-01T10:00:01Z', '2026-01-01T10:00:00Z')).toBe(false);
    });
  });

  describe('isWithinRange', () => {
    it('should return true when date is inside range', () => {
      expect(isWithinRange('2026-06-15', '2026-01-01', '2026-12-31')).toBe(true);
    });

    it('should return true when date equals start of range', () => {
      expect(isWithinRange('2026-01-01', '2026-01-01', '2026-12-31')).toBe(true);
    });

    it('should return true when date equals end of range', () => {
      expect(isWithinRange('2026-12-31', '2026-01-01', '2026-12-31')).toBe(true);
    });

    it('should return false when date is before range', () => {
      expect(isWithinRange('2025-12-31', '2026-01-01', '2026-12-31')).toBe(false);
    });

    it('should return false when date is after range', () => {
      expect(isWithinRange('2027-01-01', '2026-01-01', '2026-12-31')).toBe(false);
    });
  });

  describe('formatDate', () => {
    it('should format an ISO timestamp as YYYY-MM-DD', () => {
      expect(formatDate('2026-06-15T14:30:00.000Z')).toBe('2026-06-15');
    });

    it('should format a date-only string as YYYY-MM-DD', () => {
      expect(formatDate('2026-01-01')).toBe('2026-01-01');
    });

    it('should pad single-digit months and days', () => {
      expect(formatDate('2026-03-05T00:00:00.000Z')).toBe('2026-03-05');
    });

    it('should return the input string for invalid dates', () => {
      expect(formatDate('not-a-date')).toBe('not-a-date');
    });

    it('should handle end-of-year dates', () => {
      expect(formatDate('2026-12-31T23:59:59.999Z')).toBe('2026-12-31');
    });
  });

  describe('formatDateTime', () => {
    it('should format a timestamp as YYYY-MM-DD HH:MM:SS', () => {
      // Use a fixed UTC date and check that it produces local time correctly
      const d = new Date(2026, 5, 15, 14, 30, 45); // June 15, 2026 14:30:45 local
      const result = formatDateTime(d.toISOString());
      expect(result).toBe('2026-06-15 14:30:45');
    });

    it('should pad single-digit hours, minutes, seconds', () => {
      const d = new Date(2026, 0, 5, 3, 7, 9); // Jan 5, 2026 03:07:09 local
      const result = formatDateTime(d.toISOString());
      expect(result).toBe('2026-01-05 03:07:09');
    });

    it('should handle midnight', () => {
      const d = new Date(2026, 0, 1, 0, 0, 0);
      const result = formatDateTime(d.toISOString());
      expect(result).toBe('2026-01-01 00:00:00');
    });

    it('should return the input string for invalid dates', () => {
      expect(formatDateTime('garbage')).toBe('garbage');
    });
  });

  describe('formatRelativeTime', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return "just now" for timestamps less than 1 minute ago', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);
      const timestamp = new Date(now - 30_000).toISOString(); // 30 seconds ago
      expect(formatRelativeTime(timestamp)).toBe('just now');
    });

    it('should return "Xm ago" for timestamps less than 1 hour ago', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);
      const timestamp = new Date(now - 15 * 60_000).toISOString(); // 15 minutes ago
      expect(formatRelativeTime(timestamp)).toBe('15m ago');
    });

    it('should return "Xh ago" for timestamps less than 24 hours ago', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);
      const timestamp = new Date(now - 5 * 60 * 60_000).toISOString(); // 5 hours ago
      expect(formatRelativeTime(timestamp)).toBe('5h ago');
    });

    it('should return "Xd ago" for timestamps less than 7 days ago', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);
      const timestamp = new Date(now - 3 * 24 * 60 * 60_000).toISOString(); // 3 days ago
      expect(formatRelativeTime(timestamp)).toBe('3d ago');
    });

    it('should return YYYY-MM-DD for timestamps 7+ days ago', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);
      const old = new Date(now - 14 * 24 * 60 * 60_000); // 14 days ago
      const result = formatRelativeTime(old.toISOString());
      // Should be a YYYY-MM-DD format string
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return the input string for invalid dates', () => {
      expect(formatRelativeTime('invalid')).toBe('invalid');
    });
  });
});
