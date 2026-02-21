import { ApiError } from '../services/api-client.js';

/**
 * Extract a user-friendly error message from an unknown caught error.
 *
 * - For `ApiError` instances, includes validation details if present.
 * - For generic `Error` instances, uses the message.
 * - For anything else, returns the fallback string.
 */
export function getErrorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
  if (err instanceof ApiError) {
    // If the API returned Zod validation details, surface them
    if (err.details && typeof err.details === 'object') {
      const details = err.details as { fieldErrors?: Record<string, string[]>; formErrors?: string[] };

      // Zod's flatten() format: { formErrors: [...], fieldErrors: { field: [...] } }
      if (details.fieldErrors) {
        const messages = Object.entries(details.fieldErrors)
          .flatMap(([field, errors]) => errors.map(e => `${field}: ${e}`));
        if (messages.length > 0) {
          return messages.join('. ');
        }
      }

      if (details.formErrors && details.formErrors.length > 0) {
        return details.formErrors.join('. ');
      }
    }

    return err.message;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return fallback;
}
