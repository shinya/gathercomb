import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { setupWebSocketServer } from './services/websocket.js';
import { setupRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { config } from './utils/config.js';
import { initializeDatabase, closeDatabase } from './utils/database.js';

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
}));

// CORS configuration
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging
app.use((req, _res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  }, 'HTTP Request');
  next();
});

// Setup routes
setupRoutes(app);

// Health check endpoint
app.get('/api/admin/health', (_req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
    version: process.env.npm_package_version || '0.1.0',
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Setup WebSocket server
const wss = new WebSocketServer({
  server,
  verifyClient: (info: any) => {
    logger.info({ url: info.req.url, origin: info.origin }, 'WebSocket connection attempt');
    return true; // Accept all connections for now
  },
});

// Add WebSocket server event listeners for debugging
wss.on('listening', () => {
  logger.info('WebSocket server is listening');
});

wss.on('error', (error) => {
  logger.error({ error }, 'WebSocket server error');
});

setupWebSocketServer(wss);

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();

    const PORT = config.port;
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await closeDatabase();
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await closeDatabase();
    logger.info('Server closed');
    process.exit(0);
  });
});
