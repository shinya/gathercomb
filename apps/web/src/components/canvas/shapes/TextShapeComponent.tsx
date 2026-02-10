import React from 'react';
import { Group, Text } from 'react-konva';
import Konva from 'konva';
import { TextShape } from '@gathercomb/shared';

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

export const TextShapeComponent: React.FC<TextShapeComponentProps> = ({
  shape,
  isSelected,
  isEditing,
  onClick,
  onDoubleClick,
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
  );
};
