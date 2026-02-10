import React, { useEffect, useState } from 'react';
import { Group, Line, Rect, Text } from 'react-konva';
import type { BoardProvider } from '../../yjs/BoardProvider';
import type { AwarenessState } from '@gathercomb/shared';

interface PresenceCursorsProps {
  boardProvider: BoardProvider;
  localUserId: string;
}

interface RemoteCursor {
  clientId: number;
  userId: string;
  displayName: string;
  color: string;
  cursor: { x: number; y: number };
}

export const PresenceCursors: React.FC<PresenceCursorsProps> = ({
  boardProvider,
  localUserId,
}) => {
  const [cursors, setCursors] = useState<RemoteCursor[]>([]);

  useEffect(() => {
    const updateCursors = () => {
      const awareness = boardProvider.getAwareness();
      if (!awareness) return;

      const states = awareness.getStates() as Map<number, AwarenessState>;
      const remoteCursors: RemoteCursor[] = [];

      states.forEach((state, clientId) => {
        // Skip the local user
        if (state.userId === localUserId) return;
        // Skip users without a cursor position
        if (!state.cursor) return;

        remoteCursors.push({
          clientId,
          userId: state.userId,
          displayName: state.displayName,
          color: state.color,
          cursor: state.cursor,
        });
      });

      setCursors(remoteCursors);
    };

    // Fetch initial state
    updateCursors();

    // Subscribe to changes
    const unsubscribe = boardProvider.onAwarenessChange(updateCursors);
    return unsubscribe;
  }, [boardProvider, localUserId]);

  return (
    <>
      {cursors.map((cursor) => (
        <CursorPointer
          key={cursor.clientId}
          x={cursor.cursor.x}
          y={cursor.cursor.y}
          color={cursor.color}
          name={cursor.displayName}
        />
      ))}
    </>
  );
};

interface CursorPointerProps {
  x: number;
  y: number;
  color: string;
  name: string;
}

const CursorPointer: React.FC<CursorPointerProps> = ({ x, y, color, name }) => {
  // Arrow/pointer shape: a small triangle pointing top-left
  const pointerPoints = [
    0, 0,      // tip
    0, 16,     // bottom-left
    4, 13,     // inner notch
    10, 20,    // bottom-right tail
    13, 18,    // tail edge
    7, 11,     // inner notch right
    12, 10,    // right wing
  ];

  const labelOffsetX = 12;
  const labelOffsetY = 16;
  const labelPaddingX = 4;
  const labelPaddingY = 2;
  const fontSize = 11;

  // Estimate text width (rough approximation)
  const textWidth = name.length * fontSize * 0.6 + labelPaddingX * 2;
  const textHeight = fontSize + labelPaddingY * 2;

  return (
    <Group x={x} y={y} listening={false}>
      {/* Cursor arrow */}
      <Line
        points={pointerPoints}
        fill={color}
        stroke="#ffffff"
        strokeWidth={1}
        closed
      />
      {/* Name label background */}
      <Rect
        x={labelOffsetX}
        y={labelOffsetY}
        width={textWidth}
        height={textHeight}
        fill={color}
        cornerRadius={3}
      />
      {/* Name label text */}
      <Text
        x={labelOffsetX + labelPaddingX}
        y={labelOffsetY + labelPaddingY}
        text={name}
        fontSize={fontSize}
        fontFamily="Arial, sans-serif"
        fill="#ffffff"
      />
    </Group>
  );
};
