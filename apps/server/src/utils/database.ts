import { Pool } from 'pg';
import { config } from './config.js';
import { logger } from './logger.js';

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  logger.info('Database connected');
});

pool.on('error', (err) => {
  logger.error({ error: err }, 'Database connection error');
});

// Helper function to execute queries
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug({ query: text, duration, rows: res.rowCount }, 'Executed query');
    return res;
  } catch (error) {
    logger.error({ error, query: text }, 'Query execution failed');
    throw error;
  }
};

// Helper function to get a single row
export const queryOne = async (text: string, params?: any[]) => {
  const res = await query(text, params);
  return res.rows[0] || null;
};

// Helper function to get multiple rows
export const queryMany = async (text: string, params?: any[]) => {
  const res = await query(text, params);
  return res.rows;
};
