import { Router } from 'express';
import { authService } from '../services/auth.js';
import { CustomError } from '../middleware/errorHandler.js';
import { LoginSchema, CreateUserSchema } from '@gathercomb/shared';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
  try {
    const userData = CreateUserSchema.parse(req.body);
    const user = await authService.signup(userData);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const loginData = LoginSchema.parse(req.body);
    const { user, token } = await authService.login(loginData);

    // Set HTTP-only cookie
    res.cookie('session', token, {
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('session');
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// GET /api/auth/me
router.get('/me', async (req, res, next) => {
  try {
    const token = req.cookies.session || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new CustomError('No authentication token provided', 401);
    }

    const user = await authService.verifyToken(token);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/test-email (for testing email functionality)
router.post('/test-email', async (req, res, next) => {
  try {
    const { email, displayName } = req.body;

    if (!email || !displayName) {
      throw new CustomError('Email and displayName are required', 400);
    }

    const { emailService } = await import('../services/email.js');
    await emailService.sendWelcomeEmail(email, displayName);

    res.json({
      success: true,
      message: 'Test email sent successfully',
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };
