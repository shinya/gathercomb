import * as Y from 'yjs';
import { StickyNote } from '@gathercomb/shared';

// Yjs document structure for a board
export interface BoardDoc {
  stickies: Y.Map<Y.Map<any>>;
  layers: Y.Array<string>;
  meta: Y.Map<any>;
}

// Sticky note structure in Yjs
export interface StickyNoteDoc {
  text: Y.Text;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

// Board metadata structure
export interface BoardMeta {
  title: string;
  background: string;
  grid: {
    enabled: boolean;
    size: number;
    color: string;
  };
  zoom: {
    level: number;
    min: number;
    max: number;
  };
  pan: {
    x: number;
    y: number;
  };
}

// Helper functions for Yjs document operations
export class BoardDocument {
  private doc: Y.Doc;
  private boardMap: Y.Map<any>;

  constructor(doc: Y.Doc) {
    this.doc = doc;
    this.boardMap = doc.getMap('board');
  }

  // Initialize board structure
  initializeBoard(title: string): void {
    if (this.boardMap.get('stickies') === undefined) {
      this.boardMap.set('stickies', new Y.Map());
    }
    if (this.boardMap.get('layers') === undefined) {
      this.boardMap.set('layers', new Y.Array());
    }
    if (this.boardMap.get('meta') === undefined) {
      const meta = new Y.Map();
      meta.set('title', title);
      meta.set('background', '#f5f5f5');
      meta.set('grid', {
        enabled: true,
        size: 20,
        color: '#e0e0e0',
      });
      meta.set('zoom', {
        level: 1,
        min: 0.1,
        max: 3,
      });
      meta.set('pan', {
        x: 0,
        y: 0,
      });
      this.boardMap.set('meta', meta);
    }
  }

  // Get board structure
  getBoardDoc(): BoardDoc {
    return {
      stickies: this.boardMap.get('stickies') as Y.Map<Y.Map<any>>,
      layers: this.boardMap.get('layers') as Y.Array<string>,
      meta: this.boardMap.get('meta') as Y.Map<any>,
    };
  }

  // Create a new sticky note
  createStickyNote(
    id: string,
    data: Partial<StickyNote>,
    userId: string
  ): void {
    const stickies = this.boardMap.get('stickies') as Y.Map<Y.Map<any>>;
    const layers = this.boardMap.get('layers') as Y.Array<string>;

    if (!stickies || !layers) {
      console.error('Board not initialized. Call initializeBoard() first.');
      return;
    }

    const stickyMap = new Y.Map();
    stickyMap.set('text', new Y.Text(data.text || ''));
    stickyMap.set('color', data.color || '#ffff00');
    stickyMap.set('x', data.x || 0);
    stickyMap.set('y', data.y || 0);
    stickyMap.set('width', data.width || 200);
    stickyMap.set('height', data.height || 150);
    stickyMap.set('rotation', data.rotation || 0);
    stickyMap.set('zIndex', data.zIndex || 0);
    stickyMap.set('createdBy', userId);
    stickyMap.set('createdAt', Date.now());
    stickyMap.set('updatedAt', Date.now());

    stickies.set(id, stickyMap);
    layers.push([id]);
  }

  // Update a sticky note
  updateStickyNote(id: string, updates: Partial<StickyNote>): void {
    const stickies = this.boardMap.get('stickies') as Y.Map<Y.Map<any>>;

    if (!stickies) {
      console.error('Board not initialized. Call initializeBoard() first.');
      return;
    }

    const stickyMap = stickies.get(id);
    if (!stickyMap) return;

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'text' && typeof value === 'string') {
        const text = stickyMap.get('text') as Y.Text;
        text.delete(0, text.length);
        text.insert(0, value);
      } else if (value !== undefined) {
        stickyMap.set(key, value);
      }
    });

    stickyMap.set('updatedAt', Date.now());
  }

  // Delete a sticky note
  deleteStickyNote(id: string): void {
    const stickies = this.boardMap.get('stickies') as Y.Map<Y.Map<any>>;
    const layers = this.boardMap.get('layers') as Y.Array<string>;

    if (!stickies || !layers) {
      console.error('Board not initialized. Call initializeBoard() first.');
      return;
    }

    stickies.delete(id);

    // Remove from layers array
    const index = layers.toArray().indexOf(id);
    if (index !== -1) {
      layers.delete(index, 1);
    }
  }

  // Get all sticky notes
  getStickyNotes(): Map<string, StickyNote> {
    const stickies = this.boardMap.get('stickies') as Y.Map<Y.Map<any>>;
    const result = new Map<string, StickyNote>();

    if (!stickies) {
      return result; // Return empty map if stickies is not initialized
    }

    stickies.forEach((stickyMap, id) => {
      const text = stickyMap.get('text') as Y.Text;
      result.set(id, {
        id,
        text: text.toString(),
        color: stickyMap.get('color'),
        x: stickyMap.get('x'),
        y: stickyMap.get('y'),
        width: stickyMap.get('width'),
        height: stickyMap.get('height'),
        rotation: stickyMap.get('rotation'),
        zIndex: stickyMap.get('zIndex'),
        createdBy: stickyMap.get('createdBy'),
      });
    });

    return result;
  }

  // Get board metadata
  getBoardMeta(): BoardMeta {
    const meta = this.boardMap.get('meta') as Y.Map<any>;

    if (!meta) {
      // Return default metadata if not initialized
      return {
        title: 'Untitled Board',
        background: '#f5f5f5',
        grid: {
          enabled: true,
          size: 20,
          color: '#e0e0e0',
        },
        zoom: {
          level: 1,
          min: 0.1,
          max: 3,
        },
        pan: {
          x: 0,
          y: 0,
        },
      };
    }

    return {
      title: meta.get('title') || 'Untitled Board',
      background: meta.get('background') || '#f5f5f5',
      grid: meta.get('grid') || {
        enabled: true,
        size: 20,
        color: '#e0e0e0',
      },
      zoom: meta.get('zoom') || {
        level: 1,
        min: 0.1,
        max: 3,
      },
      pan: meta.get('pan') || {
        x: 0,
        y: 0,
      },
    };
  }

  // Update board metadata
  updateBoardMeta(updates: Partial<BoardMeta>): void {
    const meta = this.boardMap.get('meta') as Y.Map<any>;

    if (!meta) {
      console.error('Board not initialized. Call initializeBoard() first.');
      return;
    }

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        meta.set(key, value);
      }
    });
  }

  // Get document state as update
  getStateAsUpdate(): Uint8Array {
    return Y.encodeStateAsUpdate(this.doc);
  }

  // Apply update to document
  applyUpdate(update: Uint8Array): void {
    Y.applyUpdate(this.doc, update);
  }
}
