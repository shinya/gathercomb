import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { Rectangle } from '@gathercomb/shared';

interface RectangleComponentProps {
  shape: Rectangle;
  isSelected: boolean;
  isEditing: boolean;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDoubleClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onContextMenu: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}

export const RectangleComponent: React.FC<RectangleComponentProps> = ({
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
      {!isEditing && shape.text && (
        <Text
          x={8}
          y={8}
          width={shape.width - 16}
          height={shape.height - 16}
          text={shape.text}
          fontSize={shape.fontSize || 14}
          fontFamily="Arial, sans-serif"
          fill={shape.textColor || '#333'}
          wrap="word"
          align="left"
          verticalAlign="top"
          listening={false}
        />
      )}
    </Group>
  );
};
