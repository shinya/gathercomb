import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger.js';
import * as Y from 'yjs';

// Store active rooms
const rooms = new Map<string, Set<WebSocket>>();

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

      logger.info({ room, clientIP: req.socket.remoteAddress }, 'WebSocket connection established');

      // Add to room
      if (!rooms.has(room)) {
        rooms.set(room, new Set());
      }
      rooms.get(room)!.add(ws);

      // Handle Yjs messages
      ws.on('message', (data: Buffer) => {
        try {
          // Broadcast to other clients in the same room
          const roomClients = rooms.get(room);
          if (roomClients) {
            roomClients.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data);
              }
            });
          }

          logger.debug({ room, messageSize: data.length }, 'Broadcasted WebSocket message');
        } catch (error) {
          logger.error({ error, room }, 'Error handling WebSocket message');
        }
      });

      ws.on('close', () => {
        logger.info({ room }, 'WebSocket connection closed');

        // Remove from room
        const roomClients = rooms.get(room);
        if (roomClients) {
          roomClients.delete(ws);
          if (roomClients.size === 0) {
            rooms.delete(room);
          }
        }
      });

      ws.on('error', (error) => {
        logger.error({ error, room }, 'WebSocket error');

        // Remove from room on error
        const roomClients = rooms.get(room);
        if (roomClients) {
          roomClients.delete(ws);
          if (roomClients.size === 0) {
            rooms.delete(room);
          }
        }
      });

    } catch (error) {
      logger.error({ error }, 'Error handling WebSocket connection');
      ws.close();
    }
  });
};
