import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { BoardDocument } from './BoardDocument.js';

// Generate a deterministic color from a userId string
function userIdToColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 45%)`;
}

export class BoardProvider {
  private doc: Y.Doc;
  private wsProvider: WebsocketProvider | null = null;
  private indexeddbProvider: IndexeddbPersistence | null = null;
  private boardDoc: BoardDocument;
  private boardId: string;
  private userId: string;
  private displayName: string;
  private userColor: string;
  private _isConnected: boolean = false;
  private undoManager: Y.UndoManager | null = null;

  constructor(boardId: string, userId: string, displayName: string) {
    this.boardId = boardId;
    this.userId = userId;
    this.displayName = displayName;
    this.userColor = userIdToColor(userId);
    this.doc = new Y.Doc();
    this.boardDoc = new BoardDocument(this.doc);
  }

  // Initialize the board with WebSocket and IndexedDB providers
  async initialize(): Promise<void> {
    // Initialize IndexedDB persistence for offline support
    this.indexeddbProvider = new IndexeddbPersistence(
      `board-${this.boardId}`,
      this.doc
    );

    // Wait for IndexedDB to load
    await new Promise<void>((resolve) => {
      this.indexeddbProvider!.on('synced', () => {
        resolve();
      });
    });

    // Initialize WebSocket provider for real-time collaboration
    const wsUrl = this.getWebSocketUrl();
    this.wsProvider = new WebsocketProvider(wsUrl, `board:${this.boardId}`, this.doc, {
      connect: true,
    });

    // Handle connection events
    this.wsProvider.on('status', (event: any) => {
      this._isConnected = event.status === 'connected';
    });

    this.wsProvider.on('connection-close', (event: any) => {
      this._isConnected = false;
    });

    this.wsProvider.on('connection-error', (event: any) => {
      this._isConnected = false;
    });

    // Handle WebSocket message errors (suppress "Unknown message type" errors)
    this.wsProvider.on('message', (event: any) => {
      // This event handler can be used to filter out problematic messages
      // The actual message handling is done internally by y-websocket
    });

    // Add error handling for the WebSocket connection
    if (this.wsProvider.ws) {
      this.wsProvider.ws.addEventListener('error', (event) => {
        console.error('WebSocket error:', event);
      });
    }

    // Set initial connection state
    this._isConnected = this.wsProvider.wsconnected || false;

    // Set local awareness state
    this.wsProvider.awareness.setLocalStateField('userId', this.userId);
    this.wsProvider.awareness.setLocalStateField('displayName', this.displayName);
    this.wsProvider.awareness.setLocalStateField('color', this.userColor);

    // Ensure board is initialized
    this.boardDoc.initializeBoard(`Board ${this.boardId}`);

    // Initialize UndoManager tracking stickies and shapes
    const boardMap = this.doc.getMap('board');
    const stickies = boardMap.get('stickies') as Y.Map<any>;
    const shapes = boardMap.get('shapes') as Y.Map<any>;
    if (stickies && shapes) {
      this.undoManager = new Y.UndoManager([stickies, shapes], {
        trackedOrigins: new Set([null]), // Track local changes
      });
    }
  }

  // Get WebSocket URL
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use backend host for WebSocket connection
    const backendHost = import.meta.env?.VITE_WS_URL || 'localhost:8080';
    return `${protocol}//${backendHost}`;
  }

  // Get the board document
  getBoardDocument(): BoardDocument {
    return this.boardDoc;
  }

  // Get the Yjs document
  getDocument(): Y.Doc {
    return this.doc;
  }

  // Get awareness (for presence)
  getAwareness() {
    return this.wsProvider?.awareness;
  }

  // Get the local user's ID
  getUserId(): string {
    return this.userId;
  }

  // Update local cursor position in awareness
  setLocalCursor(x: number, y: number): void {
    const awareness = this.getAwareness();
    if (awareness) {
      awareness.setLocalStateField('cursor', { x, y });
    }
  }

  // Update local selection in awareness
  setLocalSelection(ids: string[]): void {
    const awareness = this.getAwareness();
    if (awareness) {
      awareness.setLocalStateField('selection', ids);
    }
  }

  // Listen for awareness changes; returns an unsubscribe function
  onAwarenessChange(callback: () => void): () => void {
    const awareness = this.getAwareness();
    if (!awareness) return () => {};
    awareness.on('change', callback);
    return () => {
      awareness.off('change', callback);
    };
  }

  // Initialize board with title
  initializeBoard(title: string): void {
    this.boardDoc.initializeBoard(title);
  }

  // Create sticky note
  createStickyNote(id: string, data: any): void {
    this.boardDoc.createStickyNote(id, data, this.userId);
  }

  // Update sticky note
  updateStickyNote(id: string, updates: any): void {
    this.boardDoc.updateStickyNote(id, updates);
  }

  // Delete sticky note
  deleteStickyNote(id: string): void {
    this.boardDoc.deleteStickyNote(id);
  }

  // Get all sticky notes
  getStickyNotes(): Map<string, any> {
    return this.boardDoc.getStickyNotes();
  }

  // Create rectangle
  createRectangle(id: string, data: any): void {
    this.boardDoc.createRectangle(id, data, this.userId);
  }

  // Create circle
  createCircle(id: string, data: any): void {
    this.boardDoc.createCircle(id, data, this.userId);
  }

  // Create text shape
  createTextShape(id: string, data: any): void {
    this.boardDoc.createTextShape(id, data, this.userId);
  }

  // Update shape
  updateShape(id: string, updates: any): void {
    this.boardDoc.updateShape(id, updates);
  }

  // Delete shape
  deleteShape(id: string): void {
    this.boardDoc.deleteShape(id);
  }

  // Get all shapes
  getShapes(): Map<string, any> {
    return this.boardDoc.getShapes();
  }

  // Get board metadata
  getBoardMeta(): any {
    return this.boardDoc.getBoardMeta();
  }

  // Update board metadata
  updateBoardMeta(updates: any): void {
    this.boardDoc.updateBoardMeta(updates);
  }

  // Get document state as update
  getStateAsUpdate(): Uint8Array {
    return this.boardDoc.getStateAsUpdate();
  }

  // Apply update to document
  applyUpdate(update: Uint8Array): void {
    this.boardDoc.applyUpdate(update);
  }

  // Check if connected
  isConnected(): boolean {
    return this._isConnected;
  }

  // Z-index management methods
  moveToFront = (id: string): void => {
    this.boardDoc.moveToFront(id);
  };

  moveToBack = (id: string): void => {
    this.boardDoc.moveToBack(id);
  };

  moveForward = (id: string): void => {
    this.boardDoc.moveForward(id);
  };

  moveBackward = (id: string): void => {
    this.boardDoc.moveBackward(id);
  };

  // Undo/Redo
  undo(): void {
    this.undoManager?.undo();
  }

  redo(): void {
    this.undoManager?.redo();
  }

  canUndo(): boolean {
    return this.undoManager?.canUndo() ?? false;
  }

  canRedo(): boolean {
    return this.undoManager?.canRedo() ?? false;
  }

  // Disconnect and cleanup
  destroy(): void {
    this.undoManager?.destroy();
    if (this.wsProvider) {
      this.wsProvider.destroy();
    }
    if (this.indexeddbProvider) {
      this.indexeddbProvider.destroy();
    }
    this.doc.destroy();
  }
}
