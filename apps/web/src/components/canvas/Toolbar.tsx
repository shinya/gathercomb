import React from 'react';
import { STICKY_COLORS, ToolType } from '@gathercomb/shared';

// SVG Icon Components
const SelectIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
    <path d="M13 13l6 6"/>
  </svg>
);

const StickyNoteIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

const RectangleIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
  </svg>
);

const CircleIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
  </svg>
);

const TextIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4,7 4,4 20,4 20,7"/>
    <line x1="9" y1="20" x2="15" y2="20"/>
    <line x1="12" y1="4" x2="12" y2="20"/>
  </svg>
);

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
    { id: 'select', icon: SelectIcon, label: 'Select', action: null },
    { id: 'sticky', icon: StickyNoteIcon, label: 'Sticky Note', action: onCreateSticky },
    { id: 'rectangle', icon: RectangleIcon, label: 'Rectangle', action: onCreateRectangle },
    { id: 'circle', icon: CircleIcon, label: 'Circle', action: onCreateCircle },
    { id: 'text', icon: TextIcon, label: 'Text', action: onCreateTextShape },
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
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          return (
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
              <IconComponent
                size={20}
                color={selectedTool === tool.id ? 'white' : '#333'}
              />
            </button>
          );
        })}
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
