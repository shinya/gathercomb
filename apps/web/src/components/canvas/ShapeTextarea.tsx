import React, { useRef, useEffect } from 'react';

interface ShapeTextareaProps {
  editingShape: {
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    textColor: string;
  };
  onTextChange: (text: string) => void;
  onComplete: () => void;
  onCancel: () => void;
  zoom: number;
  panX: number;
  panY: number;
  align: 'left' | 'center';
  verticalAlign: 'top' | 'middle';
}

export const ShapeTextarea: React.FC<ShapeTextareaProps> = ({
  editingShape,
  onTextChange,
  onComplete,
  onCancel,
  zoom,
  panX,
  panY,
  align,
  verticalAlign,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus and select all text when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  const getPosition = () => {
    const x = editingShape.x * zoom + panX;
    const y = editingShape.y * zoom + panY;
    const width = editingShape.width * zoom;
    const height = editingShape.height * zoom;

    return { x, y, width, height };
  };

  const { x, y, width, height } = getPosition();

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: width,
        height: height,
        zIndex: 1000,
      }}
    >
      <textarea
        ref={textareaRef}
        value={editingShape.text}
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
          fontSize: `${editingShape.fontSize * zoom}px`,
          fontFamily: 'Arial, sans-serif',
          color: editingShape.textColor,
          resize: 'none',
          padding: '8px',
          margin: 0,
          textAlign: align,
          display: 'flex',
          alignItems: verticalAlign === 'middle' ? 'center' : 'flex-start',
          justifyContent: align === 'center' ? 'center' : 'flex-start',
        }}
      />
    </div>
  );
};
