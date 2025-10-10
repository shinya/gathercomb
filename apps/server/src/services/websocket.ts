import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger.js';
import { getBoardPersistence } from './persistence.js';

// Store active rooms
const rooms = new Map<string, Set<WebSocket>>();

// Store board persistence for each room
const roomPersistence = new Map<string, any>();

export const setupWebSocketServer = (wss: WebSocketServer): void => {
  logger.info('Setting up WebSocket server');

  wss.on('connection', (ws: WebSocket, req) => {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const room = url.pathname.split('/').pop();

      if (!room) {
        logger.error('No room specified in WebSocket connection');
        ws.close();
        return;
      }

      // Extract board ID from room (format: board:boardId)
      const boardId = room.startsWith('board:') ? room.substring(6) : room;

      logger.info({ room, boardId, clientIP: req.socket.remoteAddress }, 'WebSocket connection established');

      // Initialize or get board persistence
      if (!roomPersistence.has(room)) {
        const persistence = getBoardPersistence(boardId);
        roomPersistence.set(room, persistence);
      }
      const persistence = roomPersistence.get(room);

      // Add to room
      if (!rooms.has(room)) {
        rooms.set(room, new Set());
      }
      rooms.get(room)!.add(ws);

      // Send current state to new client
      const currentState = persistence.getStateAsUpdate();
      if (currentState.length > 0) {
        ws.send(currentState);
      }

      // Handle Yjs messages
      ws.on('message', (data: Buffer) => {
        try {
          const update = new Uint8Array(data);

          // Apply update to persistence
          persistence.applyUpdate(update);

          // Broadcast to other clients in the same room
          const roomClients = rooms.get(room);
          if (roomClients) {
            roomClients.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data);
              }
            });
          }

          logger.debug({ room, boardId, messageSize: data.length }, 'Processed and broadcasted Yjs update');
        } catch (error) {
          logger.error({ error, room, boardId }, 'Error handling Yjs message');
        }
      });

      ws.on('close', () => {
        logger.info({ room, boardId }, 'WebSocket connection closed');

        // Remove from room
        const roomClients = rooms.get(room);
        if (roomClients) {
          roomClients.delete(ws);
          if (roomClients.size === 0) {
            rooms.delete(room);
            // Clean up persistence when no clients remain
            const persistence = roomPersistence.get(room);
            if (persistence) {
              persistence.destroy();
              roomPersistence.delete(room);
            }
          }
        }
      });

      ws.on('error', (error) => {
        logger.error({ error, room, boardId }, 'WebSocket error');

        // Remove from room on error
        const roomClients = rooms.get(room);
        if (roomClients) {
          roomClients.delete(ws);
          if (roomClients.size === 0) {
            rooms.delete(room);
            // Clean up persistence when no clients remain
            const persistence = roomPersistence.get(room);
            if (persistence) {
              persistence.destroy();
              roomPersistence.delete(room);
            }
          }
        }
      });

    } catch (error) {
      logger.error({ error }, 'Error handling WebSocket connection');
      ws.close();
    }
  });
};
