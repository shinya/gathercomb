import * as Y from 'yjs';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import { saveSnapshot, getLatestSnapshot, cleanupOldSnapshots } from '../utils/database.js';

// Store Yjs documents for each board
const boardDocuments = new Map<string, Y.Doc>();

// Track update counts for each board
const updateCounts = new Map<string, number>();

// Track last snapshot time for each board
const lastSnapshotTimes = new Map<string, number>();

export class BoardPersistence {
  private boardId: string;
  private doc: Y.Doc;
  private updateCount: number = 0;
  private lastSnapshotTime: number = 0;

  constructor(boardId: string) {
    this.boardId = boardId;
    this.doc = new Y.Doc();

    // Load existing snapshot if available
    this.loadSnapshot();

    // Set up update listener
    this.doc.on('update', this.handleUpdate.bind(this));

    // Set up periodic snapshot timer
    this.setupPeriodicSnapshot();

    // Store in global map
    boardDocuments.set(boardId, this.doc);
    updateCounts.set(boardId, 0);
    lastSnapshotTimes.set(boardId, Date.now());
  }

  private async loadSnapshot(): Promise<void> {
    try {
      const snapshot = await getLatestSnapshot(this.boardId);
      if (snapshot) {
        Y.applyUpdate(this.doc, snapshot);
        logger.info({ boardId: this.boardId, size: snapshot.length }, 'Loaded snapshot');
      } else {
        logger.info({ boardId: this.boardId }, 'No existing snapshot found, starting fresh');
      }
    } catch (error) {
      logger.error({ error, boardId: this.boardId }, 'Failed to load snapshot');
    }
  }

  private handleUpdate(_update: Uint8Array, origin: any): void {
    // Don't save snapshots for updates that come from this server
    if (origin === this) {
      return;
    }

    this.updateCount++;
    updateCounts.set(this.boardId, this.updateCount);

    // Check if we should save a snapshot
    this.checkSnapshotConditions();
  }

  private checkSnapshotConditions(): void {
    const now = Date.now();
    const timeSinceLastSnapshot = now - this.lastSnapshotTime;
    const shouldSaveByCount = this.updateCount >= config.snapshotInterval;
    const shouldSaveByTime = timeSinceLastSnapshot >= (config.snapshotPeriodSec * 1000);

    if (shouldSaveByCount || shouldSaveByTime) {
      this.saveSnapshot();
    }
  }

  private async saveSnapshot(): Promise<void> {
    try {
      const stateBinary = Y.encodeStateAsUpdate(this.doc);
      await saveSnapshot(this.boardId, stateBinary);

      this.lastSnapshotTime = Date.now();
      this.updateCount = 0;
      lastSnapshotTimes.set(this.boardId, this.lastSnapshotTime);
      updateCounts.set(this.boardId, 0);

      logger.debug({
        boardId: this.boardId,
        size: stateBinary.length,
        updateCount: this.updateCount
      }, 'Snapshot saved');

      // Cleanup old snapshots (keep only the latest 5)
      await cleanupOldSnapshots(this.boardId, 5);
    } catch (error) {
      logger.error({ error, boardId: this.boardId }, 'Failed to save snapshot');
    }
  }

  private setupPeriodicSnapshot(): void {
    // Check every 30 seconds if we need to save by time
    setInterval(() => {
      this.checkSnapshotConditions();
    }, 30000);
  }

  public getDocument(): Y.Doc {
    return this.doc;
  }

  public applyUpdate(update: Uint8Array): void {
    Y.applyUpdate(this.doc, update, this);
  }

  public getStateAsUpdate(): Uint8Array {
    return Y.encodeStateAsUpdate(this.doc);
  }

  public destroy(): void {
    // Save final snapshot before destroying
    this.saveSnapshot();

    // Cleanup
    boardDocuments.delete(this.boardId);
    updateCounts.delete(this.boardId);
    lastSnapshotTimes.delete(this.boardId);

    this.doc.destroy();
  }
}

// Factory function to get or create board persistence
export const getBoardPersistence = (boardId: string): BoardPersistence => {
  if (!boardDocuments.has(boardId)) {
    return new BoardPersistence(boardId);
  }

  // Return existing persistence wrapper
  const doc = boardDocuments.get(boardId)!;
  return {
    getDocument: () => doc,
    applyUpdate: (update: Uint8Array) => Y.applyUpdate(doc, update),
    getStateAsUpdate: () => Y.encodeStateAsUpdate(doc),
    destroy: () => {
      // Don't destroy shared document, just cleanup tracking
      boardDocuments.delete(boardId);
      updateCounts.delete(boardId);
      lastSnapshotTimes.delete(boardId);
    }
  } as BoardPersistence;
};

// Cleanup function for graceful shutdown
export const cleanupAllPersistence = async (): Promise<void> => {
  logger.info('Cleaning up all board persistence');

  for (const [boardId, doc] of boardDocuments) {
    try {
      const stateBinary = Y.encodeStateAsUpdate(doc);
      await saveSnapshot(boardId, stateBinary);
      doc.destroy();
    } catch (error) {
      logger.error({ error, boardId }, 'Failed to save final snapshot');
    }
  }

  boardDocuments.clear();
  updateCounts.clear();
  lastSnapshotTimes.clear();
};
