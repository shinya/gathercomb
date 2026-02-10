import React, { useRef, useState, useEffect } from 'react';
import { Group, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { StickyNote } from '@gathercomb/shared';

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

export const StickyNoteComponent: React.FC<StickyNoteComponentProps> = ({
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

  useEffect(() => {
    setEditText(note.text);
  }, [note.text]);

  return (
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
      <Text
        ref={textRef}
        x={10}
        y={10}
        width={note.width - 20}
        height={note.height - 20}
        text={isEditing ? '' : editText}
        fontSize={note.fontSize || 14}
        fontFamily="Arial, sans-serif"
        fill={note.textColor || '#333'}
        wrap="word"
        align="center"
        verticalAlign="middle"
        listening={!isEditing}
      />
    </Group>
  );
};
