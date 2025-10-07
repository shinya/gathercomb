import { Express } from 'express';
import { authRoutes } from './auth.js';
import { boardRoutes } from './boards.js';

export const setupRoutes = (app: Express): void => {
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/boards', boardRoutes);
};
