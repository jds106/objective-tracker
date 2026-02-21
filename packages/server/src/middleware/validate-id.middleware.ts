import type { Request, Response, NextFunction } from 'express';

/**
 * UUID v4 format: 8-4-4-4-12 hex characters.
 * Also matches the `company` pseudo-ID used for company-level objectives.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Special non-UUID IDs that are valid in the system */
const ALLOWED_SPECIAL_IDS = new Set(['company']);

/**
 * Express middleware that validates a route parameter is a valid UUID v4 format
 * or one of the known special IDs (e.g. "company").
 *
 * @param paramName - The name of the route parameter to validate (default: "id")
 */
export function validateId(paramName = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];

    if (!value) {
      res.status(400).json({ error: `Missing required parameter: ${paramName}` });
      return;
    }

    if (!UUID_REGEX.test(value) && !ALLOWED_SPECIAL_IDS.has(value)) {
      res.status(400).json({ error: `Invalid ${paramName} format — expected UUID` });
      return;
    }

    next();
  };
}
