import { describe, it, expect } from 'vitest';
import { ApiError } from '../services/api-client.js';
import { getErrorMessage } from './error.js';

describe('getErrorMessage', () => {
  it('should return message from an ApiError', () => {
    const err = new ApiError(400, 'Bad request');
    expect(getErrorMessage(err)).toBe('Bad request');
  });

  it('should extract field errors from Zod details', () => {
    const err = new ApiError(400, 'Validation failed', {
      fieldErrors: { email: ['Invalid email format'], password: ['Too short'] },
      formErrors: [],
    });
    const msg = getErrorMessage(err);
    expect(msg).toContain('email: Invalid email format');
    expect(msg).toContain('password: Too short');
  });

  it('should extract form-level errors from Zod details', () => {
    const err = new ApiError(400, 'Validation failed', {
      fieldErrors: {},
      formErrors: ['Start date must be before end date'],
    });
    expect(getErrorMessage(err)).toBe('Start date must be before end date');
  });

  it('should fall back to message when details is empty', () => {
    const err = new ApiError(400, 'Something went wrong', {
      fieldErrors: {},
      formErrors: [],
    });
    expect(getErrorMessage(err)).toBe('Something went wrong');
  });

  it('should handle generic Error', () => {
    const err = new Error('Network error');
    expect(getErrorMessage(err)).toBe('Network error');
  });

  it('should return fallback for non-Error objects', () => {
    expect(getErrorMessage('string error')).toBe('An unexpected error occurred');
    expect(getErrorMessage(42)).toBe('An unexpected error occurred');
    expect(getErrorMessage(null)).toBe('An unexpected error occurred');
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
  });

  it('should use custom fallback message', () => {
    expect(getErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
  });

  it('should handle ApiError with non-object details', () => {
    const err = new ApiError(500, 'Internal error', 'raw string detail');
    expect(getErrorMessage(err)).toBe('Internal error');
  });
});
