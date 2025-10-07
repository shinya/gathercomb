import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../utils/config.js';
import { CustomError } from '../middleware/errorHandler.js';
import { CreateUser, Login, User } from '@gathercomb/shared';
import { emailService } from './email.js';
import { queryOne } from '../utils/database.js';

export const authService = {
  async signup(userData: CreateUser): Promise<User> {
    // Check if user already exists
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = $1',
      [userData.email]
    );

    if (existingUser) {
      throw new CustomError('User with this email already exists', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 12);

    // Create user
    const user: User = {
      id: uuidv4(),
      email: userData.email,
      displayName: userData.displayName,
      createdAt: Date.now(),
    };

    // Store user in database
    await queryOne(
      'INSERT INTO users (id, email, password_hash, display_name, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [user.id, user.email, passwordHash, user.displayName, user.createdAt]
    );

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.displayName);
    } catch (error) {
      // Log error but don't fail signup
      console.error('Failed to send welcome email:', error);
    }

    return user;
  },

  async login(loginData: Login): Promise<{ user: User; token: string }> {
    // Find user with password hash
    const userWithHash = await queryOne(
      'SELECT id, email, password_hash, display_name, created_at FROM users WHERE email = $1',
      [loginData.email]
    );

    if (!userWithHash) {
      throw new CustomError('Invalid email or password', 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(loginData.password, userWithHash.password_hash);
    if (!isValid) {
      throw new CustomError('Invalid email or password', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: userWithHash.id, email: userWithHash.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const user: User = {
      id: userWithHash.id,
      email: userWithHash.email,
      displayName: userWithHash.display_name,
      createdAt: userWithHash.created_at,
    };

    return { user, token };
  },

  async verifyToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; email: string };

      const user = await queryOne(
        'SELECT id, email, display_name, created_at FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (!user) {
        throw new CustomError('User not found', 401);
      }

      return {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        createdAt: user.created_at,
      };
    } catch (error) {
      throw new CustomError('Invalid token', 401);
    }
  },
};
