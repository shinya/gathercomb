import { create } from 'zustand';
import { BoardProvider } from '../yjs/BoardProvider.js';
import { StickyNote, Rectangle, Circle, TextShape, ToolType, STICKY_COLORS } from '@gathercomb/shared';

interface CanvasState {
  // Canvas view state
  zoom: number;
  panX: number;
  panY: number;

  // Selection state
  selectedStickyIds: string[];
  selectedShapeIds: string[];

  // UI state
  isDragging: boolean;
  isResizing: boolean;
  isPanning: boolean;

  // Tool state
  currentTool: 'select' | 'create' | 'pan';

  // Grid state
  showGrid: boolean;
  gridSize: number;

  // Actions
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setSelectedStickyIds: (ids: string[]) => void;
  setSelectedShapeIds: (ids: string[]) => void;
  setIsDragging: (isDragging: boolean) => void;
  setIsResizing: (isResizing: boolean) => void;
  setIsPanning: (isPanning: boolean) => void;
  setCurrentTool: (tool: 'select' | 'create' | 'pan') => void;
  setShowGrid: (show: boolean) => void;
  setGridSize: (size: number) => void;

  // Canvas transformations
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  panTo: (x: number, y: number) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // Initial state
  zoom: 1,
  panX: 0,
  panY: 0,
  selectedStickyIds: [],
  selectedShapeIds: [],
  isDragging: false,
  isResizing: false,
  isPanning: false,
  currentTool: 'select',
  showGrid: true,
  gridSize: 20,

  // Actions
  setZoom: (zoom) => set({ zoom }),
  setPan: (panX, panY) => set({ panX, panY }),
  setSelectedStickyIds: (selectedStickyIds) => set({ selectedStickyIds }),
  setSelectedShapeIds: (selectedShapeIds) => set({ selectedShapeIds }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setIsResizing: (isResizing) => set({ isResizing }),
  setIsPanning: (isPanning) => set({ isPanning }),
  setCurrentTool: (currentTool) => set({ currentTool }),
  setShowGrid: (showGrid) => set({ showGrid }),
  setGridSize: (gridSize) => set({ gridSize }),

  // Canvas transformations
  zoomIn: () => {
    const { zoom } = get();
    const newZoom = Math.min(zoom * 1.2, 3);
    set({ zoom: newZoom });
  },

  zoomOut: () => {
    const { zoom } = get();
    const newZoom = Math.max(zoom / 1.2, 0.1);
    set({ zoom: newZoom });
  },

  resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),

  panTo: (x, y) => set({ panX: x, panY: y }),
}));

interface BoardState {
  // Board data
  boardId: string | null;
  boardTitle: string;
  stickyNotes: Map<string, StickyNote>;
  shapes: Map<string, Rectangle | Circle | TextShape>;

  // Provider
  boardProvider: BoardProvider | null;

  // Loading state
  isLoading: boolean;
  isConnected: boolean;

  // Error state
  error: string | null;

  // UI state
  selectedTool: ToolType;
  selectedColor: string;
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
    stickyId: string | null;
    shapeId: string | null;
  };

  // Actions
  setBoardId: (boardId: string) => void;
  setBoardTitle: (title: string) => void;
  setStickyNotes: (notes: Map<string, StickyNote>) => void;
  setShapes: (shapes: Map<string, Rectangle | Circle | TextShape>) => void;
  setBoardProvider: (provider: BoardProvider | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedTool: (tool: ToolType) => void;
  setSelectedColor: (color: string) => void;
  setContextMenu: (menu: { visible: boolean; x: number; y: number; stickyId: string | null; shapeId: string | null }) => void;

  // Sticky note actions
  addStickyNote: (note: StickyNote) => void;
  updateStickyNote: (id: string, updates: Partial<StickyNote>) => void;
  removeStickyNote: (id: string) => void;

  // Shape actions
  addShape: (shape: Rectangle | Circle | TextShape) => void;
  updateShape: (id: string, updates: Partial<Rectangle | Circle | TextShape>) => void;
  removeShape: (id: string) => void;

  // Board actions
  initializeBoard: (title: string) => void;
  createStickyNote: (id: string, data: Partial<StickyNote>) => void;
  updateStickyNoteData: (id: string, updates: Partial<StickyNote>) => void;
  deleteStickyNoteData: (id: string) => void;

  // Shape board actions
  createRectangle: (id: string, data: Partial<Rectangle>) => void;
  createCircle: (id: string, data: Partial<Circle>) => void;
  createTextShape: (id: string, data: Partial<TextShape>) => void;
  updateShapeData: (id: string, updates: Partial<Rectangle | Circle | TextShape>) => void;
  deleteShapeData: (id: string) => void;

  // Context menu actions
  showContextMenu: (x: number, y: number, stickyId: string | null, shapeId: string | null) => void;
  hideContextMenu: () => void;
  changeStickyColor: (stickyId: string, color: string) => void;
  changeShapeColor: (shapeId: string, color: string) => void;

  // Z-index management actions
  moveToFront: (id: string) => void;
  moveToBack: (id: string) => void;
  moveForward: (id: string) => void;
  moveBackward: (id: string) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  // Initial state
  boardId: null,
  boardTitle: '',
  stickyNotes: new Map(),
  shapes: new Map(),
  boardProvider: null,
  isLoading: false,
  isConnected: false,
  error: null,
  selectedTool: 'select',
  selectedColor: STICKY_COLORS[0], // Default to first color (yellow)
  contextMenu: {
    visible: false,
    x: 0,
    y: 0,
    stickyId: null,
    shapeId: null,
  },

  // Actions
  setBoardId: (boardId) => set({ boardId }),
  setBoardTitle: (boardTitle) => set({ boardTitle }),
  setStickyNotes: (stickyNotes) => set({ stickyNotes }),
  setShapes: (shapes) => set({ shapes }),
  setBoardProvider: (boardProvider) => set({ boardProvider }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setError: (error) => set({ error }),
  setSelectedTool: (selectedTool) => set({ selectedTool }),
  setSelectedColor: (selectedColor) => set({ selectedColor }),
  setContextMenu: (contextMenu) => set({ contextMenu }),

  // Sticky note actions
  addStickyNote: (note) => {
    const { stickyNotes } = get();
    const newNotes = new Map(stickyNotes);
    newNotes.set(note.id, note);
    set({ stickyNotes: newNotes });
  },

  updateStickyNote: (id, updates) => {
    const { stickyNotes } = get();
    const newNotes = new Map(stickyNotes);
    const existingNote = newNotes.get(id);
    if (existingNote) {
      newNotes.set(id, { ...existingNote, ...updates });
      set({ stickyNotes: newNotes });
    }
  },

  removeStickyNote: (id) => {
    const { stickyNotes } = get();
    const newNotes = new Map(stickyNotes);
    newNotes.delete(id);
    set({ stickyNotes: newNotes });
  },

  // Shape actions
  addShape: (shape) => {
    const { shapes } = get();
    const newShapes = new Map(shapes);
    newShapes.set(shape.id, shape as Rectangle | Circle | TextShape);
    set({ shapes: newShapes });
  },

  updateShape: (id, updates) => {
    const { shapes } = get();
    const newShapes = new Map(shapes);
    const existingShape = newShapes.get(id);
    if (existingShape) {
      newShapes.set(id, { ...existingShape, ...updates } as Rectangle | Circle | TextShape);
      set({ shapes: newShapes });
    }
  },

  removeShape: (id) => {
    const { shapes } = get();
    const newShapes = new Map(shapes);
    newShapes.delete(id);
    set({ shapes: newShapes });
  },

  // Board actions
  initializeBoard: (title) => {
    const { boardProvider } = get();
    if (boardProvider) {
      boardProvider.initializeBoard(title);
      set({ boardTitle: title });
    }
  },

  createStickyNote: (id, data) => {
    const { boardProvider } = get();
    if (boardProvider) {
      boardProvider.createStickyNote(id, data);
    }
  },

  updateStickyNoteData: (id, updates) => {
    console.log('🔍 boardStore: updateStickyNoteData called', { id, updates });
    const { boardProvider } = get();
    if (boardProvider) {
      console.log('🔍 boardStore: boardProvider exists, calling updateStickyNote');
      boardProvider.updateStickyNote(id, updates);
    } else {
      console.error('🔍 boardStore: boardProvider is null!');
    }
  },

  deleteStickyNoteData: (id) => {
    const { boardProvider } = get();
    if (boardProvider) {
      boardProvider.deleteStickyNote(id);
    }
  },

  // Shape board actions
  createRectangle: (id, data) => {
    const { boardProvider } = get();
    if (boardProvider) {
      boardProvider.createRectangle(id, data as Partial<Rectangle>);
    }
  },

  createCircle: (id, data) => {
    const { boardProvider } = get();
    if (boardProvider) {
      boardProvider.createCircle(id, data as Partial<Circle>);
    }
  },

  createTextShape: (id, data) => {
    const { boardProvider } = get();
    if (boardProvider) {
      boardProvider.createTextShape(id, data as Partial<TextShape>);
    }
  },

  updateShapeData: (id, updates) => {
    const { boardProvider } = get();
    if (boardProvider) {
      boardProvider.updateShape(id, updates);
    }
  },

  deleteShapeData: (id) => {
    const { boardProvider } = get();
    if (boardProvider) {
      boardProvider.deleteShape(id);
    }
  },

  // Context menu actions
  showContextMenu: (x, y, stickyId, shapeId) => {
    set({
      contextMenu: {
        visible: true,
        x,
        y,
        stickyId,
        shapeId,
      },
    });
  },

  hideContextMenu: () => {
    set({
      contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        stickyId: null,
        shapeId: null,
      },
    });
  },

  changeStickyColor: (stickyId, color) => {
    const { boardProvider } = get();
    if (boardProvider) {
      boardProvider.updateStickyNote(stickyId, { color });
    }
  },

  changeShapeColor: (shapeId, color) => {
    const { boardProvider } = get();
    if (boardProvider) {
      boardProvider.updateShape(shapeId, { fill: color });
    }
  },

  // Z-index management actions
  moveToFront: (id) => {
    const { boardProvider } = get();
    if (boardProvider) {
      boardProvider.moveToFront(id);
    }
  },

  moveToBack: (id) => {
    const { boardProvider } = get();
    if (boardProvider) {
      boardProvider.moveToBack(id);
    }
  },

  moveForward: (id) => {
    const { boardProvider } = get();
    if (boardProvider) {
      boardProvider.moveForward(id);
    }
  },

  moveBackward: (id) => {
    const { boardProvider } = get();
    if (boardProvider) {
      boardProvider.moveBackward(id);
    }
  },
}));
