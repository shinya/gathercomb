import { Pool, PoolClient } from 'pg';
import { logger } from './logger.js';
import { config } from './config.js';

// PostgreSQL connection pool
let pool: Pool | null = null;

export const initializeDatabase = async (): Promise<void> => {
  try {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('Database connection established');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize database');
    throw error;
  }
};

export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
};

export const getClient = async (): Promise<PoolClient> => {
  const pool = getPool();
  return pool.connect();
};

// Yjs snapshot operations
export const saveSnapshot = async (
  boardId: string,
  stateBinary: Uint8Array
): Promise<void> => {
  const client = await getClient();
  try {
    await client.query(
      'INSERT INTO y_snapshots (board_id, ts, state_bin) VALUES ($1, $2, $3)',
      [boardId, Date.now(), Buffer.from(stateBinary)]
    );
    logger.debug({ boardId, size: stateBinary.length }, 'Snapshot saved');
  } catch (error) {
    logger.error({ error, boardId }, 'Failed to save snapshot');
    throw error;
  } finally {
    client.release();
  }
};

export const getLatestSnapshot = async (
  boardId: string
): Promise<Uint8Array | null> => {
  const client = await getClient();
  try {
    const result = await client.query(
      'SELECT state_bin FROM y_snapshots WHERE board_id = $1 ORDER BY ts DESC LIMIT 1',
      [boardId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const stateBinary = result.rows[0].state_bin;
    return new Uint8Array(stateBinary);
  } catch (error) {
    logger.error({ error, boardId }, 'Failed to get latest snapshot');
    throw error;
  } finally {
    client.release();
  }
};

export const cleanupOldSnapshots = async (
  boardId: string,
  keepCount: number = 5
): Promise<void> => {
  const client = await getClient();
  try {
    await client.query(
      `DELETE FROM y_snapshots
       WHERE board_id = $1
       AND id NOT IN (
         SELECT id FROM y_snapshots
         WHERE board_id = $1
         ORDER BY ts DESC
         LIMIT $2
       )`,
      [boardId, keepCount]
    );
    logger.debug({ boardId, keepCount }, 'Old snapshots cleaned up');
  } catch (error) {
    logger.error({ error, boardId }, 'Failed to cleanup old snapshots');
    throw error;
  } finally {
    client.release();
  }
};

// Helper functions for common queries
export const queryOne = async (text: string, params?: any[]): Promise<any> => {
  const client = await getClient();
  try {
    const result = await client.query(text, params);
    return result.rows[0] || null;
  } catch (error) {
    logger.error({ error, text, params }, 'Query failed');
    throw error;
  } finally {
    client.release();
  }
};

export const queryMany = async (text: string, params?: any[]): Promise<any[]> => {
  const client = await getClient();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } catch (error) {
    logger.error({ error, text, params }, 'Query failed');
    throw error;
  } finally {
    client.release();
  }
};

export const execute = async (text: string, params?: any[]): Promise<void> => {
  const client = await getClient();
  try {
    await client.query(text, params);
  } catch (error) {
    logger.error({ error, text, params }, 'Execute failed');
    throw error;
  } finally {
    client.release();
  }
};

// Graceful shutdown
export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection pool closed');
  }
};