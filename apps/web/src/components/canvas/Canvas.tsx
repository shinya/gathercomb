import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Group, Rect, Text, Transformer, Ellipse, TextPath } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../../stores/boardStore';
import { useBoardStore } from '../../stores/boardStore';
import { StickyNote, Rectangle, Circle, TextShape, DEFAULT_STICKY_SIZE, DEFAULT_SHAPE_SIZE } from '@gathercomb/shared';
import { Toolbar } from './Toolbar';
import { ContextMenu } from './ContextMenu';

// StickyNote Textarea Component
interface StickyNoteTextareaProps {
  editingSticky: {
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  onTextChange: (text: string) => void;
  onComplete: () => void;
  onCancel: () => void;
  zoom: number;
  panX: number;
  panY: number;
}

const StickyNoteTextarea: React.FC<StickyNoteTextareaProps> = ({
  editingSticky,
  onTextChange,
  onComplete,
  onCancel,
  zoom,
  panX,
  panY,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus and move cursor to end when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end of text
      const textLength = editingSticky.text.length;
      textareaRef.current.setSelectionRange(textLength, textLength);
    }
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        left: editingSticky.x * zoom + panX + 10,
        top: editingSticky.y * zoom + panY + 10,
        width: (editingSticky.width - 20) * zoom,
        height: (editingSticky.height - 20) * zoom,
        zIndex: 1000,
      }}
    >
      <textarea
        ref={textareaRef}
        value={editingSticky.text}
        onChange={(e) => {
          onTextChange(e.target.value);
        }}
        onBlur={onComplete}
        onKeyDown={(e) => {
          // Prevent event propagation to avoid triggering canvas keyboard handlers
          e.stopPropagation();

          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onComplete();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: `${14 * zoom}px`,
          fontFamily: 'Arial, sans-serif',
          color: '#333',
          resize: 'none',
          padding: 0,
          margin: 0,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    </div>
  );
};

// TextShape Textarea Component
interface TextShapeTextareaProps {
  editingTextShape: {
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  onTextChange: (text: string) => void;
  onComplete: () => void;
  onCancel: () => void;
  zoom: number;
  panX: number;
  panY: number;
}

const TextShapeTextarea: React.FC<TextShapeTextareaProps> = ({
  editingTextShape,
  onTextChange,
  onComplete,
  onCancel,
  zoom,
  panX,
  panY,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus and select all text when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        left: editingTextShape.x * zoom + panX,
        top: editingTextShape.y * zoom + panY,
        width: editingTextShape.width * zoom,
        height: editingTextShape.height * zoom,
        zIndex: 1000,
      }}
    >
      <textarea
        ref={textareaRef}
        value={editingTextShape.text}
        onChange={(e) => {
          onTextChange(e.target.value);
        }}
        onBlur={onComplete}
        onKeyDown={(e) => {
          // Prevent event propagation to avoid triggering canvas keyboard handlers
          e.stopPropagation();

          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onComplete();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: `${14 * zoom}px`,
          fontFamily: 'Arial, sans-serif',
          color: '#333',
          resize: 'none',
          padding: 0,
          margin: 0,
        }}
      />
    </div>
  );
};

interface CanvasProps {
  width: number;
  height: number;
}

export const Canvas: React.FC<CanvasProps> = ({ width, height }) => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // State for text editing
  const [editingSticky, setEditingSticky] = useState<{
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [editingTextShape, setEditingTextShape] = useState<{
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const {
    zoom,
    panX,
    panY,
    selectedStickyIds,
    showGrid,
    gridSize,
    setZoom,
    setPan,
    setSelectedStickyIds,
    zoomIn,
    zoomOut,
    resetView,
  } = useCanvasStore();

  const {
    stickyNotes,
    shapes,
    selectedTool,
    selectedColor,
    contextMenu,
    createStickyNote,
    createRectangle,
    createCircle,
    createTextShape,
    updateStickyNoteData,
    updateShapeData,
    deleteStickyNoteData,
    deleteShapeData,
    setSelectedTool,
    setSelectedColor,
    showContextMenu,
    hideContextMenu,
    changeStickyColor,
    changeShapeColor,
  } = useBoardStore();

  // Handle wheel zoom
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(3, newScale));

    setZoom(clampedScale);
    setPan(
      pointer.x - mousePointTo.x * clampedScale,
      pointer.y - mousePointTo.y * clampedScale
    );
  };

  // Handle stage click
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedStickyIds([]);
      // Switch to select tool when clicking on empty space
      if (selectedTool !== 'select') {
        setSelectedTool('select');
      }
    }
  };

  // Handle sticky note click
  const handleStickyClick = (id: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;

    // Switch to select tool when clicking on objects
    if (selectedTool !== 'select') {
      setSelectedTool('select');
    }

    if (e.evt.ctrlKey || e.evt.metaKey) {
      // Multi-select
      const newSelection = selectedStickyIds.includes(id)
        ? selectedStickyIds.filter(selectedId => selectedId !== id)
        : [...selectedStickyIds, id];
      setSelectedStickyIds(newSelection);
    } else {
      // Single select
      setSelectedStickyIds([id]);
    }
  };

  // Handle sticky note double click for editing
  const handleStickyDoubleClick = (id: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    const sticky = stickyNotes.get(id);
    if (sticky) {
      setEditingSticky({
        id: sticky.id,
        text: sticky.text,
        x: sticky.x,
        y: sticky.y,
        width: sticky.width,
        height: sticky.height,
      });
    }
  };

  const handleTextEditComplete = (newText: string) => {
    if (editingSticky) {
      updateStickyNoteData(editingSticky.id, { text: newText });
      setEditingSticky(null);
    }
  };

  const handleTextEditCancel = () => {
    setEditingSticky(null);
  };

  // Handle text shape double click for editing
  const handleTextShapeDoubleClick = (id: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    const textShape = shapes.get(id);
    if (textShape) {
      setEditingTextShape({
        id: textShape.id,
        text: textShape.text,
        x: textShape.x,
        y: textShape.y,
        width: textShape.width,
        height: textShape.height,
      });
    }
  };

  const handleTextShapeEditComplete = (newText: string) => {
    if (editingTextShape) {
      updateShapeData(editingTextShape.id, { text: newText });
      setEditingTextShape(null);
    }
  };

  const handleTextShapeEditCancel = () => {
    setEditingTextShape(null);
  };

  // Handle sticky note drag
  const handleStickyDrag = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    updateStickyNoteData(id, { x: newX, y: newY });
  };

  // Handle stage drag for panning
  const handleStageDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Only allow panning if clicking on the stage itself (not on a sticky note)
    if (e.target === e.target.getStage()) {
      // Stage is already draggable, no need to set it again
    }
  };

  const handleStageDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const newX = stage.x();
    const newY = stage.y();

    setPan(newX, newY);
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle delete/backspace if we're currently editing text
      if (editingSticky || editingTextShape) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedStickyIds.length > 0) {
          selectedStickyIds.forEach(id => {
            deleteStickyNoteData(id);
          });
          setSelectedStickyIds([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStickyIds, deleteStickyNoteData, setSelectedStickyIds, editingSticky, editingTextShape]);

  // Update transformer when selection changes
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const stage = stageRef.current;
    if (!stage) return;

    if (selectedStickyIds.length === 1) {
      const node = stage.findOne(`#${selectedStickyIds[0]}`);
      if (node) {
        transformer.nodes([node]);
        // Enable listening for transformer when an object is selected
        transformer.listening(true);
        transformer.getLayer()?.batchDraw();
      }
    } else {
      transformer.nodes([]);
      // Disable listening when no objects are selected
      transformer.listening(false);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedStickyIds]);

  // Render grid
  const renderGrid = () => {
    if (!showGrid) return null;

    const lines = [];
    const scaledGridSize = gridSize * zoom;

    // Vertical lines
    for (let i = 0; i < width / scaledGridSize; i++) {
      lines.push(
        <Rect
          key={`v-${i}`}
          x={i * scaledGridSize + (panX % scaledGridSize)}
          y={0}
          width={1}
          height={height}
          fill="#e0e0e0"
        />
      );
    }

    // Horizontal lines
    for (let i = 0; i < height / scaledGridSize; i++) {
      lines.push(
        <Rect
          key={`h-${i}`}
          x={0}
          y={i * scaledGridSize + (panY % scaledGridSize)}
          width={width}
          height={1}
          fill="#e0e0e0"
        />
      );
    }

    return lines;
  };

  // Handle toolbar create sticky
  const handleCreateSticky = () => {
    const centerX = width / 2;
    const centerY = height / 2;
    const x = (centerX - panX) / zoom;
    const y = (centerY - panY) / zoom;

    const id = `sticky-${Date.now()}`;
    createStickyNote(id, {
      x,
      y,
      text: 'New sticky note',
      color: selectedColor,
      width: DEFAULT_STICKY_SIZE.width,
      height: DEFAULT_STICKY_SIZE.height,
    });
  };

  // Handle toolbar create rectangle
  const handleCreateRectangle = () => {
    const centerX = width / 2;
    const centerY = height / 2;
    const x = (centerX - panX) / zoom;
    const y = (centerY - panY) / zoom;

    const id = `rectangle-${Date.now()}`;
    createRectangle(id, {
      x,
      y,
      fill: selectedColor,
      stroke: '#333',
      strokeWidth: 2,
      width: DEFAULT_SHAPE_SIZE.width,
      height: DEFAULT_SHAPE_SIZE.height,
    });
  };

  // Handle toolbar create circle
  const handleCreateCircle = () => {
    const centerX = width / 2;
    const centerY = height / 2;
    const x = (centerX - panX) / zoom;
    const y = (centerY - panY) / zoom;

    const id = `circle-${Date.now()}`;
    createCircle(id, {
      x,
      y,
      fill: selectedColor,
      stroke: '#333',
      strokeWidth: 2,
      width: DEFAULT_SHAPE_SIZE.width,
      height: DEFAULT_SHAPE_SIZE.height,
    });
  };

  // Handle toolbar create text shape
  const handleCreateTextShape = () => {
    const centerX = width / 2;
    const centerY = height / 2;
    const x = (centerX - panX) / zoom;
    const y = (centerY - panY) / zoom;

    const id = `text-${Date.now()}`;
    createTextShape(id, {
      x,
      y,
      text: 'Text',
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      fill: '#333',
      width: 100,
      height: 30,
    });
  };

  // Handle context menu
  const handleContextMenu = (e: Konva.KonvaEventObject<MouseEvent>, stickyId?: string, shapeId?: string) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Convert stage coordinates to screen coordinates
    const screenX = pointer.x;
    const screenY = pointer.y;

    showContextMenu(screenX, screenY, stickyId || null, shapeId || null);
  };

  // Render shapes
  const renderShapes = () => {
    return Array.from(shapes.values()).map((shape) => {
      if (shape.type === 'rectangle') {
        return (
          <RectangleComponent
            key={shape.id}
            shape={shape as Rectangle}
            isSelected={selectedStickyIds.includes(shape.id)}
            onClick={(e) => handleStickyClick(shape.id, e)}
            onDragEnd={(e) => handleShapeDrag(shape.id, e)}
            onContextMenu={(e) => handleContextMenu(e, undefined, shape.id)}
            onTransformEnd={(e) => handleShapeTransform(shape.id, e)}
          />
        );
      } else if (shape.type === 'circle') {
        return (
          <CircleComponent
            key={shape.id}
            shape={shape as Circle}
            isSelected={selectedStickyIds.includes(shape.id)}
            onClick={(e) => handleStickyClick(shape.id, e)}
            onDragEnd={(e) => handleShapeDrag(shape.id, e)}
            onContextMenu={(e) => handleContextMenu(e, undefined, shape.id)}
            onTransformEnd={(e) => handleShapeTransform(shape.id, e)}
          />
        );
      } else if (shape.type === 'text') {
        return (
          <TextShapeComponent
            key={shape.id}
            shape={shape as TextShape}
            isSelected={selectedStickyIds.includes(shape.id)}
            isEditing={editingTextShape?.id === shape.id}
            onClick={(e) => handleStickyClick(shape.id, e)}
            onDoubleClick={(e) => handleTextShapeDoubleClick(shape.id, e)}
            onDragEnd={(e) => handleShapeDrag(shape.id, e)}
            onContextMenu={(e) => handleContextMenu(e, undefined, shape.id)}
            onTransformEnd={(e) => handleShapeTransform(shape.id, e)}
          />
        );
      }
      return null;
    });
  };

  // Handle shape drag
  const handleShapeDrag = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    updateShapeData(id, { x: newX, y: newY });
  };

  // Handle shape transform (resize)
  const handleShapeTransform = (id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Group;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and update size
    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.max(20, node.width() * scaleX);
    const newHeight = Math.max(20, node.height() * scaleY);

    updateShapeData(id, {
      width: newWidth,
      height: newHeight,
    });
  };

  // Render sticky notes
  const renderStickyNotes = () => {
    return Array.from(stickyNotes.values()).map((note) => (
      <StickyNoteComponent
        key={note.id}
        note={note}
        isSelected={selectedStickyIds.includes(note.id)}
        isEditing={editingSticky?.id === note.id}
        onClick={(e) => handleStickyClick(note.id, e)}
        onDoubleClick={(e) => handleStickyDoubleClick(note.id, e)}
        onDragEnd={(e) => handleStickyDrag(note.id, e)}
        onContextMenu={(e) => handleContextMenu(e, note.id)}
        onTransformEnd={(e) => handleStickyTransform(note.id, e)}
      />
    ));
  };

  // Handle sticky note transform (resize)
  const handleStickyTransform = (id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Group;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and update size
    node.scaleX(1);
    node.scaleY(1);

    // Use the smaller scale to maintain square aspect ratio
    const scale = Math.min(scaleX, scaleY);
    const size = Math.max(50, node.width() * scale);

    node.width(size);
    node.height(size);

    updateStickyNoteData(id, {
      x: node.x(),
      y: node.y(),
      width: size,
      height: size,
      rotation: node.rotation(),
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={zoom}
        scaleY={zoom}
        x={panX}
        y={panY}
        draggable={true}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onDragStart={handleStageDragStart}
        onDragEnd={handleStageDragEnd}
      >
        <Layer>
          {renderGrid()}
        </Layer>
        <Layer>
          {renderStickyNotes()}
          {renderShapes()}
          <Transformer
            ref={transformerRef}
            keepRatio={true}
            listening={false}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize (minimum 50x50 for square)
              if (newBox.width < 50 || newBox.height < 50) {
                return oldBox;
              }
              // Ensure square aspect ratio
              const size = Math.min(newBox.width, newBox.height);
              return {
                ...newBox,
                width: size,
                height: size,
              };
            }}
          />
        </Layer>
      </Stage>

      {/* HTML Input Overlay for editing sticky notes */}
      {editingSticky && (
        <StickyNoteTextarea
          editingSticky={editingSticky}
          onTextChange={(text) => {
            setEditingSticky(prev => prev ? { ...prev, text } : null);
          }}
          onComplete={() => handleTextEditComplete(editingSticky.text)}
          onCancel={handleTextEditCancel}
          zoom={zoom}
          panX={panX}
          panY={panY}
        />
      )}

      {/* HTML Input Overlay for editing text shapes */}
      {editingTextShape && (
        <TextShapeTextarea
          editingTextShape={editingTextShape}
          onTextChange={(text) => {
            setEditingTextShape(prev => prev ? { ...prev, text } : null);
          }}
          onComplete={() => handleTextShapeEditComplete(editingTextShape.text)}
          onCancel={handleTextShapeEditCancel}
          zoom={zoom}
          panX={panX}
          panY={panY}
        />
      )}

      {/* Toolbar */}
      <Toolbar
        selectedTool={selectedTool}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        onCreateSticky={handleCreateSticky}
        onCreateRectangle={handleCreateRectangle}
        onCreateCircle={handleCreateCircle}
        onCreateTextShape={handleCreateTextShape}
      />

      {/* Canvas controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <button onClick={zoomIn} className="btn btn-secondary">
          Zoom In
        </button>
        <button onClick={zoomOut} className="btn btn-secondary">
          Zoom Out
        </button>
        <button onClick={resetView} className="btn btn-secondary">
          Reset View
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (contextMenu.stickyId || contextMenu.shapeId) && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={hideContextMenu}
          onDelete={() => {
            if (contextMenu.stickyId) {
              deleteStickyNoteData(contextMenu.stickyId);
            } else if (contextMenu.shapeId) {
              deleteShapeData(contextMenu.shapeId);
            }
          }}
          onColorChange={(color) => {
            if (contextMenu.stickyId) {
              changeStickyColor(contextMenu.stickyId, color);
            } else if (contextMenu.shapeId) {
              changeShapeColor(contextMenu.shapeId, color);
            }
          }}
          currentColor={
            contextMenu.stickyId
              ? stickyNotes.get(contextMenu.stickyId)?.color || selectedColor
              : contextMenu.shapeId
                ? (shapes.get(contextMenu.shapeId) as any)?.fill || selectedColor
                : selectedColor
          }
        />
      )}
    </div>
  );
};

interface StickyNoteComponentProps {
  note: StickyNote;
  isSelected: boolean;
  isEditing: boolean;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDoubleClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onContextMenu: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}

const StickyNoteComponent: React.FC<StickyNoteComponentProps> = ({
  note,
  isSelected,
  isEditing,
  onClick,
  onDoubleClick,
  onDragEnd,
  onContextMenu,
  onTransformEnd,
}) => {
  const [editText, setEditText] = useState(note.text);
  const textRef = useRef<Konva.Text>(null);
  const { zoom, panX, panY } = useCanvasStore();

  // Update edit text when note text changes
  useEffect(() => {
    setEditText(note.text);
  }, [note.text]);





  return (
    <>
      <Group
        id={note.id}
        x={note.x}
        y={note.y}
        width={note.width}
        height={note.height}
        draggable
        onClick={onClick}
        onDblClick={onDoubleClick}
        onDragEnd={onDragEnd}
        onContextMenu={onContextMenu}
        onTransformEnd={onTransformEnd}
      >
        {/* Background */}
        <Rect
          width={note.width}
          height={note.height}
          fill={note.color}
          stroke={isSelected ? '#007bff' : 'transparent'}
          strokeWidth={isSelected ? 2 : 0}
          shadowColor="black"
          shadowBlur={5}
          shadowOffset={{ x: 2, y: 2 }}
          shadowOpacity={0.2}
          cornerRadius={8}
        />

        {/* Text */}
        <Text
          ref={textRef}
          x={10}
          y={10}
          width={note.width - 20}
          height={note.height - 20}
          text={isEditing ? '' : editText}
          fontSize={14}
          fontFamily="Arial, sans-serif"
          fill="#333"
          wrap="word"
          align="center"
          verticalAlign="middle"
          listening={!isEditing}
        />
      </Group>
    </>
  );
};

// Shape Components
interface RectangleComponentProps {
  shape: Rectangle;
  isSelected: boolean;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onContextMenu: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}

const RectangleComponent: React.FC<RectangleComponentProps> = ({
  shape,
  isSelected,
  onClick,
  onDragEnd,
  onContextMenu,
  onTransformEnd,
}) => {
  return (
    <Group
      id={shape.id}
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      draggable
      onClick={onClick}
      onDragEnd={onDragEnd}
      onContextMenu={onContextMenu}
      onTransformEnd={onTransformEnd}
    >
      <Rect
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        stroke={isSelected ? '#007bff' : shape.stroke}
        strokeWidth={isSelected ? 3 : shape.strokeWidth}
        shadowColor="black"
        shadowBlur={5}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={0.2}
      />
    </Group>
  );
};

interface CircleComponentProps {
  shape: Circle;
  isSelected: boolean;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onContextMenu: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}

const CircleComponent: React.FC<CircleComponentProps> = ({
  shape,
  isSelected,
  onClick,
  onDragEnd,
  onContextMenu,
  onTransformEnd,
}) => {
  return (
    <Group
      id={shape.id}
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      draggable
      onClick={onClick}
      onDragEnd={onDragEnd}
      onContextMenu={onContextMenu}
      onTransformEnd={onTransformEnd}
    >
      <Ellipse
        radiusX={shape.width / 2}
        radiusY={shape.height / 2}
        x={shape.width / 2}
        y={shape.height / 2}
        fill={shape.fill}
        stroke={isSelected ? '#007bff' : shape.stroke}
        strokeWidth={isSelected ? 3 : shape.strokeWidth}
        shadowColor="black"
        shadowBlur={5}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={0.2}
      />
    </Group>
  );
};

interface TextShapeComponentProps {
  shape: TextShape;
  isSelected: boolean;
  isEditing: boolean;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDoubleClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onContextMenu: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}

const TextShapeComponent: React.FC<TextShapeComponentProps> = ({
  shape,
  isSelected,
  isEditing,
  onClick,
  onDoubleClick,
  onDragEnd,
  onContextMenu,
  onTransformEnd,
}) => {
  const { zoom, panX, panY } = useCanvasStore();

  return (
    <>
      <Group
        id={shape.id}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        draggable
        onClick={onClick}
        onDblClick={onDoubleClick}
        onDragEnd={onDragEnd}
        onContextMenu={onContextMenu}
        onTransformEnd={onTransformEnd}
      >
        <Text
          x={0}
          y={0}
          width={shape.width}
          height={shape.height}
          text={isEditing ? '' : shape.text}
          fontSize={shape.fontSize}
          fontFamily={shape.fontFamily}
          fill={shape.fill}
          wrap="word"
          align="left"
          verticalAlign="top"
          listening={!isEditing}
          stroke={isSelected ? '#007bff' : 'transparent'}
          strokeWidth={isSelected ? 1 : 0}
        />
      </Group>
    </>
  );
};
