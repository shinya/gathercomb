import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

// Methods that require CSRF validation
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Generate a cryptographically random CSRF token
 */
function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * CSRF middleware using Double Submit Cookie pattern.
 * - Sets a CSRF token cookie (readable by JS, not httpOnly)
 * - Validates that the X-CSRF-Token header matches the cookie on state-changing requests
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Set CSRF cookie if not present
  if (!req.cookies[CSRF_COOKIE_NAME]) {
    const token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be readable by frontend JS
      secure: false,   // Set to true in production
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    // Also set on request for this first request
    req.cookies[CSRF_COOKIE_NAME] = token;
  }

  // Skip validation for safe methods
  if (!UNSAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  // Validate CSRF token
  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    logger.warn({
      method: req.method,
      url: req.url,
      ip: req.ip,
      hasCookie: !!cookieToken,
      hasHeader: !!headerToken,
    }, 'CSRF token validation failed');
    res.status(403).json({
      success: false,
      error: 'CSRF token validation failed',
    });
    return;
  }

  next();
}
