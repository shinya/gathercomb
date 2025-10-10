import React from 'react';
import { STICKY_COLORS } from '@gathercomb/shared';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDelete: () => void;
  onColorChange: (color: string) => void;
  currentColor: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onDelete,
  onColorChange,
  currentColor,
}) => {
  const handleColorClick = (color: string) => {
    onColorChange(color);
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 998,
        }}
        onClick={onClose}
      />

      {/* Menu */}
      <div
        style={{
          position: 'fixed',
          left: x,
          top: y,
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          padding: '8px 0',
          minWidth: '180px',
          zIndex: 999,
          border: '1px solid #e0e0e0',
        }}
      >
        {/* Delete Option */}
        <button
          onClick={handleDelete}
          style={{
            width: '100%',
            padding: '8px 16px',
            border: 'none',
            backgroundColor: 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#dc3545',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8f9fa';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span>🗑️</span>
          Delete
        </button>

        {/* Divider */}
        <div style={{
          height: '1px',
          backgroundColor: '#e0e0e0',
          margin: '4px 0',
        }} />

        {/* Color Change Section */}
        <div style={{
          padding: '8px 16px 4px',
          fontSize: '12px',
          fontWeight: '500',
          color: '#666',
        }}>
          Change Color:
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '4px',
          padding: '8px 12px',
        }}>
          {STICKY_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleColorClick(color)}
              style={{
                width: '28px',
                height: '28px',
                backgroundColor: color,
                border: currentColor === color ? '3px solid #007bff' : '2px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
              }}
              title={`Change to ${color}`}
              onMouseEnter={(e) => {
                if (currentColor !== color) {
                  e.currentTarget.style.borderColor = '#007bff';
                }
              }}
              onMouseLeave={(e) => {
                if (currentColor !== color) {
                  e.currentTarget.style.borderColor = '#ddd';
                }
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
};
