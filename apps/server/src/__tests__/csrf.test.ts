import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Mock dependencies before importing the module under test
vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { csrfProtection } from '../middleware/csrf.js';

/**
 * Helper to create a mock Express request object.
 */
function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    url: '/test',
    ip: '127.0.0.1',
    cookies: {},
    headers: {},
    ...overrides,
  } as unknown as Request;
}

/**
 * Helper to create a mock Express response object.
 */
function createMockResponse(): Response {
  const res: Partial<Response> = {
    cookie: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

describe('csrfProtection', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it('sets CSRF cookie on GET requests when no cookie is present', () => {
    const req = createMockRequest({ method: 'GET', cookies: {} });
    const res = createMockResponse();

    csrfProtection(req, res, next);

    // Should set a CSRF cookie
    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect(res.cookie).toHaveBeenCalledWith(
      'csrf-token',
      expect.any(String),
      expect.objectContaining({
        httpOnly: false,
        sameSite: 'lax',
      })
    );

    // The cookie value should be a 64-character hex string (32 random bytes)
    const tokenArg = (res.cookie as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(tokenArg).toMatch(/^[0-9a-f]{64}$/);

    // Should call next() for safe GET method
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows GET requests without CSRF header', () => {
    const req = createMockRequest({
      method: 'GET',
      cookies: { 'csrf-token': 'existing-token' },
    });
    const res = createMockResponse();

    csrfProtection(req, res, next);

    // Should not set a new cookie (one already exists)
    expect(res.cookie).not.toHaveBeenCalled();

    // Should call next() without error
    expect(next).toHaveBeenCalledTimes(1);

    // Should not return a 403
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects POST requests without matching CSRF header', () => {
    const req = createMockRequest({
      method: 'POST',
      cookies: { 'csrf-token': 'valid-token' },
      headers: {},
    });
    const res = createMockResponse();

    csrfProtection(req, res, next);

    // Should NOT call next
    expect(next).not.toHaveBeenCalled();

    // Should return 403
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'CSRF token validation failed',
    });
  });

  it('rejects POST requests with mismatched CSRF header', () => {
    const req = createMockRequest({
      method: 'POST',
      cookies: { 'csrf-token': 'token-a' },
      headers: { 'x-csrf-token': 'token-b' },
    });
    const res = createMockResponse();

    csrfProtection(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'CSRF token validation failed',
    });
  });

  it('allows POST requests with matching CSRF header', () => {
    const token = 'abc123def456';
    const req = createMockRequest({
      method: 'POST',
      cookies: { 'csrf-token': token },
      headers: { 'x-csrf-token': token },
    });
    const res = createMockResponse();

    csrfProtection(req, res, next);

    // Should call next() successfully
    expect(next).toHaveBeenCalledTimes(1);

    // Should NOT return 403
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects PUT requests without matching CSRF header', () => {
    const req = createMockRequest({
      method: 'PUT',
      cookies: { 'csrf-token': 'valid-token' },
      headers: {},
    });
    const res = createMockResponse();

    csrfProtection(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('rejects DELETE requests without matching CSRF header', () => {
    const req = createMockRequest({
      method: 'DELETE',
      cookies: { 'csrf-token': 'valid-token' },
      headers: {},
    });
    const res = createMockResponse();

    csrfProtection(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows PATCH requests with matching CSRF header', () => {
    const token = 'matching-token';
    const req = createMockRequest({
      method: 'PATCH',
      cookies: { 'csrf-token': token },
      headers: { 'x-csrf-token': token },
    });
    const res = createMockResponse();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('sets cookie and also updates req.cookies for the first request', () => {
    const req = createMockRequest({
      method: 'POST',
      cookies: {},
      headers: {},
    });
    const res = createMockResponse();

    csrfProtection(req, res, next);

    // Cookie should have been set on the response
    expect(res.cookie).toHaveBeenCalledTimes(1);

    // The req.cookies should now contain the csrf-token
    expect(req.cookies['csrf-token']).toBeDefined();
    expect(req.cookies['csrf-token']).toMatch(/^[0-9a-f]{64}$/);
  });
});
