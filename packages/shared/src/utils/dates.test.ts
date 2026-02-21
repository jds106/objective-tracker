import { describe, it, expect } from 'vitest';
import { nowISO, toISODate, isBeforeDate, isWithinRange } from './dates.js';

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
});
