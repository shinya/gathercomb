import { IncomingMessage } from 'http';
import cookie from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { queryOne } from '../utils/database.js';

interface WsVerifyInfo {
  origin: string;
  secure: boolean;
  req: IncomingMessage;
}

/**
 * Parse session token from cookies or Authorization header
 */
function extractToken(req: IncomingMessage): string | null {
  // Try cookies first
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    if (cookies.session) {
      return cookies.session;
    }
  }

  // Try Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Simple cookie parser
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(part => {
    const [key, ...rest] = part.trim().split('=');
    if (key) {
      cookies[key] = decodeURIComponent(rest.join('='));
    }
  });
  return cookies;
}

/**
 * Extract board ID from WebSocket URL path
 * Expected formats: /board:boardId or path ending with board:boardId
 */
function extractBoardId(req: IncomingMessage): string | null {
  try {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const room = url.pathname.split('/').pop();
    if (room?.startsWith('board:')) {
      return room.substring(6);
    }
    return room || null;
  } catch {
    return null;
  }
}

/**
 * Verify WebSocket client: check JWT token and board access
 */
export async function verifyWebSocketClient(
  info: WsVerifyInfo,
  callback: (result: boolean, code?: number, message?: string) => void
): Promise<void> {
  try {
    const token = extractToken(info.req);

    if (!token) {
      logger.warn({ origin: info.origin }, 'WebSocket connection rejected: no token');
      callback(false, 401, 'Authentication required');
      return;
    }

    // Verify JWT
    let decoded: { userId: string; email: string };
    try {
      decoded = jwt.verify(token, config.jwtSecret) as { userId: string; email: string };
    } catch (err) {
      logger.warn({ origin: info.origin }, 'WebSocket connection rejected: invalid token');
      callback(false, 401, 'Invalid token');
      return;
    }

    // Check user exists
    const user = await queryOne(
      'SELECT id FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!user) {
      logger.warn({ userId: decoded.userId }, 'WebSocket connection rejected: user not found');
      callback(false, 401, 'User not found');
      return;
    }

    // Check board access
    const boardId = extractBoardId(info.req);
    if (boardId) {
      const membership = await queryOne(
        'SELECT role FROM memberships WHERE board_id = $1 AND user_id = $2',
        [boardId, decoded.userId]
      );

      if (!membership) {
        logger.warn({ userId: decoded.userId, boardId }, 'WebSocket connection rejected: no board access');
        callback(false, 403, 'Access denied to this board');
        return;
      }

      // Store user info and role on the request for downstream use
      (info.req as any).userId = decoded.userId;
      (info.req as any).userRole = membership.role;
      (info.req as any).boardId = boardId;
    }

    logger.info({ userId: decoded.userId, boardId }, 'WebSocket connection authenticated');
    callback(true);
  } catch (error) {
    logger.error({ error }, 'WebSocket authentication error');
    callback(false, 500, 'Internal server error');
  }
}
