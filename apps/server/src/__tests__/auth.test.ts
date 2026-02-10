import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// Mock dependencies before importing the module under test
vi.mock('../utils/database.js', () => ({
  queryOne: vi.fn(),
}));

vi.mock('../utils/config.js', () => ({
  config: {
    jwtSecret: 'test-secret-key-that-is-at-least-32-chars-long',
    nodeEnv: 'test',
    smtpHost: 'localhost',
    smtpPort: 1025,
    smtpUser: '',
    smtpPass: '',
    smtpFrom: 'noreply@gathercomb.local',
  },
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../services/email.js', () => ({
  emailService: {
    sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => '00000000-0000-0000-0000-000000000001'),
}));

import { authService } from '../services/auth.js';
import { queryOne } from '../utils/database.js';
import { config } from '../utils/config.js';

const mockedQueryOne = vi.mocked(queryOne);

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signup', () => {
    const signupData = {
      email: 'test@example.com',
      password: 'securepassword123',
      displayName: 'Test User',
    };

    it('creates user, hashes password, and returns user without password', async () => {
      // First call: check for existing user -> not found
      mockedQueryOne.mockResolvedValueOnce(null);
      // Second call: insert user -> return id
      mockedQueryOne.mockResolvedValueOnce({ id: '00000000-0000-0000-0000-000000000001' });

      const user = await authService.signup(signupData);

      // Should have checked for existing user
      expect(mockedQueryOne).toHaveBeenCalledWith(
        'SELECT id FROM users WHERE email = $1',
        ['test@example.com']
      );

      // Should have inserted the user with a hashed password (not the plain one)
      const insertCall = mockedQueryOne.mock.calls[1];
      expect(insertCall[0]).toBe(
        'INSERT INTO users (id, email, password_hash, display_name, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id'
      );
      const insertParams = insertCall[1]!;
      expect(insertParams[0]).toBe('00000000-0000-0000-0000-000000000001'); // id
      expect(insertParams[1]).toBe('test@example.com'); // email
      // password_hash should be a bcrypt hash, not the raw password
      expect(insertParams[2]).not.toBe('securepassword123');
      expect(insertParams[2]).toMatch(/^\$2[aby]\$/); // bcrypt hash prefix
      expect(insertParams[3]).toBe('Test User'); // displayName

      // Returned user should not contain a password field
      expect(user).toEqual({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: expect.any(Number),
      });
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).not.toHaveProperty('password_hash');
    });

    it('rejects duplicate emails', async () => {
      // Existing user found
      mockedQueryOne.mockResolvedValueOnce({ id: 'existing-id' });

      await expect(authService.signup(signupData)).rejects.toThrow(
        'User with this email already exists'
      );

      // Should only have queried once (the existence check), not attempted an insert
      expect(mockedQueryOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'securepassword123',
    };

    it('returns user and JWT token for valid credentials', async () => {
      // We need a real bcrypt hash of 'securepassword123' for comparison
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash('securepassword123', 12);

      mockedQueryOne.mockResolvedValueOnce({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test@example.com',
        password_hash: hash,
        display_name: 'Test User',
        created_at: 1700000000000,
      });

      const result = await authService.login(loginData);

      // Should have looked up the user by email
      expect(mockedQueryOne).toHaveBeenCalledWith(
        'SELECT id, email, password_hash, display_name, created_at FROM users WHERE email = $1',
        ['test@example.com']
      );

      // Should return user without password
      expect(result.user).toEqual({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: 1700000000000,
      });

      // Should return a valid JWT token
      expect(result.token).toBeDefined();
      const decoded = jwt.verify(result.token, config.jwtSecret) as {
        userId: string;
        email: string;
      };
      expect(decoded.userId).toBe('00000000-0000-0000-0000-000000000001');
      expect(decoded.email).toBe('test@example.com');
    });

    it('rejects invalid password', async () => {
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash('differentpassword', 12);

      mockedQueryOne.mockResolvedValueOnce({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test@example.com',
        password_hash: hash,
        display_name: 'Test User',
        created_at: 1700000000000,
      });

      await expect(authService.login(loginData)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('rejects non-existent user', async () => {
      mockedQueryOne.mockResolvedValueOnce(null);

      await expect(authService.login(loginData)).rejects.toThrow(
        'Invalid email or password'
      );
    });
  });

  describe('verifyToken', () => {
    it('returns user for valid token', async () => {
      const token = jwt.sign(
        { userId: '00000000-0000-0000-0000-000000000001', email: 'test@example.com' },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      mockedQueryOne.mockResolvedValueOnce({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test@example.com',
        display_name: 'Test User',
        created_at: 1700000000000,
      });

      const user = await authService.verifyToken(token);

      expect(mockedQueryOne).toHaveBeenCalledWith(
        'SELECT id, email, display_name, created_at FROM users WHERE id = $1',
        ['00000000-0000-0000-0000-000000000001']
      );

      expect(user).toEqual({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: 1700000000000,
      });
    });

    it('rejects invalid token', async () => {
      await expect(authService.verifyToken('invalid-token')).rejects.toThrow(
        'Invalid token'
      );

      // Should not have queried the database
      expect(mockedQueryOne).not.toHaveBeenCalled();
    });

    it('rejects expired token', async () => {
      const token = jwt.sign(
        { userId: '00000000-0000-0000-0000-000000000001', email: 'test@example.com' },
        config.jwtSecret,
        { expiresIn: '0s' } // Immediately expired
      );

      // Small delay to ensure the token is expired
      await new Promise((resolve) => setTimeout(resolve, 10));

      await expect(authService.verifyToken(token)).rejects.toThrow(
        'Invalid token'
      );

      expect(mockedQueryOne).not.toHaveBeenCalled();
    });

    it('rejects token signed with wrong secret', async () => {
      const token = jwt.sign(
        { userId: '00000000-0000-0000-0000-000000000001', email: 'test@example.com' },
        'wrong-secret-key-that-is-completely-different',
        { expiresIn: '7d' }
      );

      await expect(authService.verifyToken(token)).rejects.toThrow(
        'Invalid token'
      );

      expect(mockedQueryOne).not.toHaveBeenCalled();
    });

    it('rejects valid token when user not found in database', async () => {
      const token = jwt.sign(
        { userId: '00000000-0000-0000-0000-000000000099', email: 'deleted@example.com' },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      mockedQueryOne.mockResolvedValueOnce(null);

      await expect(authService.verifyToken(token)).rejects.toThrow(
        'Invalid token'
      );
    });
  });
});
