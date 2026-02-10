import { describe, it, expect } from 'vitest';
import { authRateLimiter, apiRateLimiter } from '../middleware/rateLimit.js';

describe('rate limit configuration', () => {
  describe('authRateLimiter', () => {
    it('is exported and is a function (Express middleware)', () => {
      expect(authRateLimiter).toBeDefined();
      expect(typeof authRateLimiter).toBe('function');
    });
  });

  describe('apiRateLimiter', () => {
    it('is exported and is a function (Express middleware)', () => {
      expect(apiRateLimiter).toBeDefined();
      expect(typeof apiRateLimiter).toBe('function');
    });
  });
});
