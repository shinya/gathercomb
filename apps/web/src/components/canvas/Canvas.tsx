import React, { useRef, useState } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../../stores/boardStore';
import { useBoardStore } from '../../stores/boardStore';
import { StickyNote } from '@gathercomb/shared';

interface CanvasProps {
  width: number;
  height: number;
}

export const Canvas: React.FC<CanvasProps> = ({ width, height }) => {
  const stageRef = useRef<Konva.Stage>(null);

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
    createStickyNote,
    updateStickyNoteData,
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
    }
  };

  // Handle sticky note click
  const handleStickyClick = (id: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;

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

  // Handle sticky note drag
  const handleStickyDrag = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    updateStickyNoteData(id, { x: newX, y: newY });
  };

  // Handle double click to create sticky note
  const handleStageDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const x = (pointer.x - panX) / zoom;
    const y = (pointer.y - panY) / zoom;

    const id = `sticky-${Date.now()}`;
    createStickyNote(id, {
      x,
      y,
      text: 'New sticky note',
      color: '#ffff00',
      width: 200,
      height: 150,
    });
  };

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

  // Render sticky notes
  const renderStickyNotes = () => {
    return Array.from(stickyNotes.values()).map((note) => (
      <StickyNoteComponent
        key={note.id}
        note={note}
        isSelected={selectedStickyIds.includes(note.id)}
        onClick={(e) => handleStickyClick(note.id, e)}
        onDragEnd={(e) => handleStickyDrag(note.id, e)}
      />
    ));
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
        onWheel={handleWheel}
        onClick={handleStageClick}
        onDblClick={handleStageDoubleClick}
      >
        <Layer>
          {renderGrid()}
        </Layer>
        <Layer>
          {renderStickyNotes()}
        </Layer>
      </Stage>

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
    </div>
  );
};

interface StickyNoteComponentProps {
  note: StickyNote;
  isSelected: boolean;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

const StickyNoteComponent: React.FC<StickyNoteComponentProps> = ({
  note,
  isSelected,
  onClick,
  onDragEnd,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);

  const handleTextClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    setIsEditing(true);
  };

  const handleTextBlur = () => {
    setIsEditing(false);
    if (editText !== note.text) {
      // Update text in store
      const { updateStickyNoteData } = useBoardStore.getState();
      updateStickyNoteData(note.id, { text: editText });
    }
  };

  const handleKeyDown = (e: Konva.KonvaEventObject<KeyboardEvent>) => {
    if (e.evt.key === 'Enter') {
      handleTextBlur();
    } else if (e.evt.key === 'Escape') {
      setEditText(note.text);
      setIsEditing(false);
    }
  };

  return (
    <Rect
      x={note.x}
      y={note.y}
      width={note.width}
      height={note.height}
      fill={note.color}
      stroke={isSelected ? '#007bff' : 'transparent'}
      strokeWidth={isSelected ? 2 : 0}
      shadowColor="black"
      shadowBlur={5}
      shadowOffset={{ x: 2, y: 2 }}
      shadowOpacity={0.2}
      draggable
      onClick={onClick}
      onDragEnd={onDragEnd}
    >
      <Text
        x={10}
        y={10}
        width={note.width - 20}
        height={note.height - 20}
        text={isEditing ? editText : note.text}
        fontSize={14}
        fontFamily="Arial"
        fill="#333"
        wrap="word"
        onClick={handleTextClick}
        onBlur={handleTextBlur}
        onKeyDown={handleKeyDown}
        editable={isEditing}
      />
    </Rect>
  );
};
