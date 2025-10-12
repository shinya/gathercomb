import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';
import { logger } from '../utils/logger.js';
import { getBoardPersistence } from './persistence.js';

// Store board persistence for each room
const roomPersistence = new Map<string, any>();

export const setupWebSocketServer = (wss: WebSocketServer): void => {
  logger.info('Setting up Yjs WebSocket server');

  wss.on('connection', (ws, req) => {
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

      logger.info({ room, boardId, clientIP: req.socket.remoteAddress }, 'Yjs WebSocket connection established');

      // Initialize or get board persistence
      if (!roomPersistence.has(room)) {
        const persistence = getBoardPersistence(boardId);
        roomPersistence.set(room, persistence);
      }
      const persistence = roomPersistence.get(room);

      // Setup Yjs WebSocket connection with custom persistence
      setupWSConnection(ws, req, {
        // Custom persistence provider
        persistence: {
          bindState: (roomName: string, doc: any) => {
            logger.debug({ room: roomName }, 'Binding state for room');
            const currentState = persistence.getStateAsUpdate();
            if (currentState.length > 0) {
              doc.applyUpdate(currentState);
            }
          },
          writeState: (roomName: string, doc: any) => {
            logger.debug({ room: roomName }, 'Writing state for room');
            const update = doc.getStateAsUpdate();
            persistence.applyUpdate(update);
            return Promise.resolve();
          },
          onUpdate: (roomName: string, update: Uint8Array) => {
            logger.debug({ room: roomName, updateSize: update.length }, 'Received update for room');
            persistence.applyUpdate(update);
          },
          destroy: () => {
            logger.debug({ room }, 'Destroying persistence for room');
            persistence.destroy();
            roomPersistence.delete(room);
          }
        }
      });

    } catch (error) {
      logger.error({ error }, 'Error setting up Yjs WebSocket connection');
      ws.close();
    }
  });
};