import React from 'react';
import { STICKY_COLORS, ToolType } from '@gathercomb/shared';

interface ToolbarProps {
  selectedTool: ToolType;
  selectedColor: string;
  onColorChange: (color: string) => void;
  onCreateSticky: () => void;
  onCreateRectangle: () => void;
  onCreateCircle: () => void;
  onCreateTextShape: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  selectedColor,
  onColorChange,
  onCreateSticky,
  onCreateRectangle,
  onCreateCircle,
  onCreateTextShape,
}) => {
  const tools = [
    { id: 'select', icon: '↖️', label: 'Select', action: null },
    { id: 'sticky', icon: '📝', label: 'Sticky Note', action: onCreateSticky },
    { id: 'rectangle', icon: '⬜', label: 'Rectangle', action: onCreateRectangle },
    { id: 'circle', icon: '⭕', label: 'Circle', action: onCreateCircle },
    { id: 'text', icon: '📄', label: 'Text', action: onCreateTextShape },
  ] as const;

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '8px 16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      zIndex: 1000,
      border: '1px solid #e0e0e0',
    }}>
      {/* Tool Selection */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={tool.action || undefined}
            style={{
              width: '40px',
              height: '40px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: selectedTool === tool.id ? '#007bff' : 'transparent',
              color: selectedTool === tool.id ? 'white' : '#333',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
            title={tool.label}
            onMouseEnter={(e) => {
              if (selectedTool !== tool.id) {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTool !== tool.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{
        width: '1px',
        height: '32px',
        backgroundColor: '#e0e0e0',
      }} />

      {/* Color Palette */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '500',
          color: '#666',
        }}>
          Color:
        </div>
        <div style={{
          display: 'flex',
          gap: '4px',
        }}>
          {STICKY_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: color,
                border: selectedColor === color ? '3px solid #007bff' : '2px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease',
              }}
              title={`Select ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Current Color Display */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        fontSize: '11px',
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          backgroundColor: selectedColor,
          borderRadius: '2px',
          border: '1px solid #ddd',
        }} />
        <span style={{ color: '#666' }}>
          {selectedColor}
        </span>
      </div>
    </div>
  );
};
