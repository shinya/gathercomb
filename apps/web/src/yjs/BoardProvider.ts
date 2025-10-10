import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { BoardDocument } from './BoardDocument.js';

export class BoardProvider {
  private doc: Y.Doc;
  private wsProvider: WebsocketProvider | null = null;
  private indexeddbProvider: IndexeddbPersistence | null = null;
  private boardDoc: BoardDocument;
  private boardId: string;
  private userId: string;
  private _isConnected: boolean = false;

  constructor(boardId: string, userId: string) {
    this.boardId = boardId;
    this.userId = userId;
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
        console.log('IndexedDB synced');
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
      console.log('WebSocket status:', event);
      this._isConnected = event.status === 'connected';
    });

    this.wsProvider.on('connection-close', (event: any) => {
      console.log('WebSocket connection closed:', event);
      this._isConnected = false;
    });

    this.wsProvider.on('connection-error', (event: any) => {
      console.log('WebSocket connection error:', event);
      this._isConnected = false;
    });

    // Set initial connection state
    this._isConnected = this.wsProvider.wsconnected || false;

    // Ensure board is initialized
    this.boardDoc.initializeBoard(`Board ${this.boardId}`);
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

  // Disconnect and cleanup
  destroy(): void {
    if (this.wsProvider) {
      this.wsProvider.destroy();
    }
    if (this.indexeddbProvider) {
      this.indexeddbProvider.destroy();
    }
    this.doc.destroy();
  }
}
