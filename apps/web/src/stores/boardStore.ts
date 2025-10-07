import { create } from 'zustand';
import { BoardProvider } from '../yjs/BoardProvider.js';
import { StickyNote } from '@gathercomb/shared';

interface CanvasState {
  // Canvas view state
  zoom: number;
  panX: number;
  panY: number;

  // Selection state
  selectedStickyIds: string[];

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

  // Provider
  boardProvider: BoardProvider | null;

  // Loading state
  isLoading: boolean;
  isConnected: boolean;

  // Error state
  error: string | null;

  // Actions
  setBoardId: (boardId: string) => void;
  setBoardTitle: (title: string) => void;
  setStickyNotes: (notes: Map<string, StickyNote>) => void;
  setBoardProvider: (provider: BoardProvider | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;

  // Sticky note actions
  addStickyNote: (note: StickyNote) => void;
  updateStickyNote: (id: string, updates: Partial<StickyNote>) => void;
  removeStickyNote: (id: string) => void;

  // Board actions
  initializeBoard: (title: string) => void;
  createStickyNote: (id: string, data: Partial<StickyNote>) => void;
  updateStickyNoteData: (id: string, updates: Partial<StickyNote>) => void;
  deleteStickyNoteData: (id: string) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  // Initial state
  boardId: null,
  boardTitle: '',
  stickyNotes: new Map(),
  boardProvider: null,
  isLoading: false,
  isConnected: false,
  error: null,

  // Actions
  setBoardId: (boardId) => set({ boardId }),
  setBoardTitle: (boardTitle) => set({ boardTitle }),
  setStickyNotes: (stickyNotes) => set({ stickyNotes }),
  setBoardProvider: (boardProvider) => set({ boardProvider }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setError: (error) => set({ error }),

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
    const { boardProvider } = get();
    if (boardProvider) {
      boardProvider.updateStickyNote(id, updates);
    }
  },

  deleteStickyNoteData: (id) => {
    const { boardProvider } = get();
    if (boardProvider) {
      boardProvider.deleteStickyNote(id);
    }
  },
}));
