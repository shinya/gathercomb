import React, { useState } from 'react';
import { STICKY_COLORS, FONT_SIZES, STROKE_COLORS, TEXT_COLORS } from '@gathercomb/shared';

// SVG Icons
const BackgroundColorIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <path d="M9 9h6v6H9z"/>
  </svg>
);

const TextColorIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4,7 4,4 20,4 20,7"/>
    <line x1="9" y1="20" x2="15" y2="20"/>
    <line x1="12" y1="4" x2="12" y2="20"/>
  </svg>
);

const FontSizeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4,7 4,4 20,4 20,7"/>
    <line x1="9" y1="20" x2="15" y2="20"/>
    <line x1="12" y1="4" x2="12" y2="20"/>
    <path d="M8 12h8"/>
  </svg>
);

const MoveForwardIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12h18"/>
    <path d="M12 3l9 9-9 9"/>
  </svg>
);

const MoveBackwardIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12h18"/>
    <path d="M12 21l-9-9 9-9"/>
  </svg>
);

const MoveToFrontIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
    <rect x="6" y="6" width="12" height="12" rx="1"/>
    <rect x="8" y="8" width="8" height="8" rx="1"/>
  </svg>
);

const MoveToBackIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="8" width="8" height="8" rx="1"/>
    <rect x="6" y="6" width="12" height="12" rx="1"/>
    <rect x="4" y="4" width="16" height="16" rx="2"/>
  </svg>
);

const StrokeColorIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <path d="M9 9h6v6H9z"/>
    <path d="M9 1v6"/>
    <path d="M15 1v6"/>
    <path d="M9 17v6"/>
    <path d="M15 17v6"/>
  </svg>
);

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onColorChange: (color: string) => void;
  currentColor: string;
  // Extended props for object editing
  objectType?: 'sticky' | 'rectangle' | 'circle' | 'text';
  currentBackgroundColor?: string;
  currentTextColor?: string;
  currentFontSize?: number;
  currentStrokeColor?: string;
  onBackgroundColorChange?: (color: string) => void;
  onTextColorChange?: (color: string) => void;
  onFontSizeChange?: (size: number) => void;
  onStrokeColorChange?: (color: string) => void;
  onMoveToFront?: () => void;
  onMoveToBack?: () => void;
  onMoveForward?: () => void;
  onMoveBackward?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onColorChange,
  currentColor,
  objectType,
  currentBackgroundColor,
  currentTextColor,
  currentFontSize,
  currentStrokeColor,
  onBackgroundColorChange,
  onTextColorChange,
  onFontSizeChange,
  onStrokeColorChange,
  onMoveToFront,
  onMoveToBack,
  onMoveForward,
  onMoveBackward,
}) => {
  const [showBackgroundColorPicker, setShowBackgroundColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [showStrokeColorPicker, setShowStrokeColorPicker] = useState(false);

  const handleColorClick = (color: string) => {
    onColorChange(color);
    onClose();
  };

  const handleBackgroundColorClick = (color: string) => {
    if (onBackgroundColorChange) {
      onBackgroundColorChange(color);
    }
    setShowBackgroundColorPicker(false);
  };

  const handleTextColorClick = (color: string) => {
    if (onTextColorChange) {
      onTextColorChange(color);
    }
    setShowTextColorPicker(false);
  };

  const handleFontSizeChange = (size: number) => {
    if (onFontSizeChange) {
      onFontSizeChange(size);
    }
    setShowFontSizePicker(false);
  };

  const handleStrokeColorClick = (color: string) => {
    if (onStrokeColorChange) {
      onStrokeColorChange(color);
    }
    setShowStrokeColorPicker(false);
  };

  // Close all sub-menus when opening a new one
  const closeAllSubMenus = () => {
    setShowBackgroundColorPicker(false);
    setShowTextColorPicker(false);
    setShowFontSizePicker(false);
    setShowStrokeColorPicker(false);
  };

  const showStrokeColorButton = objectType === 'rectangle' || objectType === 'circle';
  const isExtendedMenu = objectType && onBackgroundColorChange;

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
        {/* Extended Menu for Object Editing */}
        {isExtendedMenu && (
          <>
            {/* Divider */}
            <div style={{
              height: '1px',
              backgroundColor: '#e0e0e0',
              margin: '4px 0',
            }} />

            {/* Background Color */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  closeAllSubMenus();
                  setShowBackgroundColorPicker(!showBackgroundColorPicker);
                }}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#333',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BackgroundColorIcon size={16} color={currentBackgroundColor || currentColor} />
                  <span>Background Color</span>
                </div>
              </button>
              {showBackgroundColorPicker && (
                <div
                  style={{
                    position: 'absolute',
                    left: '100%',
                    top: '0',
                    marginLeft: '8px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    padding: '8px',
                    border: '1px solid #e0e0e0',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '4px',
                    zIndex: 1000,
                  }}
                >
                  {STICKY_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleBackgroundColorClick(color)}
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: color,
                        border: currentBackgroundColor === color ? '2px solid #007bff' : '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Text Color */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  closeAllSubMenus();
                  setShowTextColorPicker(!showTextColorPicker);
                }}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#333',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TextColorIcon size={16} color={currentTextColor || '#333'} />
                  <span>Text Color</span>
                </div>
              </button>
              {showTextColorPicker && (
                <div
                  style={{
                    position: 'absolute',
                    left: '100%',
                    top: '0',
                    marginLeft: '8px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    padding: '8px',
                    border: '1px solid #e0e0e0',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '4px',
                    zIndex: 1000,
                  }}
                >
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleTextColorClick(color)}
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: color,
                        border: currentTextColor === color ? '2px solid #007bff' : '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Font Size */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  closeAllSubMenus();
                  setShowFontSizePicker(!showFontSizePicker);
                }}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#333',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FontSizeIcon size={16} />
                  <span>Font Size ({currentFontSize || 14}px)</span>
                </div>
              </button>
              {showFontSizePicker && (
                <div
                  style={{
                    position: 'absolute',
                    left: '100%',
                    top: '0',
                    marginLeft: '8px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    zIndex: 1000,
                    minWidth: '160px',
                  }}
                >
                  <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '500' }}>
                    Font Size: {currentFontSize || 14}px
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="48"
                    value={currentFontSize || 14}
                    onChange={(e) => onFontSizeChange?.(parseInt(e.target.value))}
                    style={{ width: '100%', marginBottom: '12px' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                    {FONT_SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => handleFontSizeChange(size)}
                        style={{
                          padding: '6px 8px',
                          backgroundColor: currentFontSize === size ? '#007bff' : '#f8f9fa',
                          color: currentFontSize === size ? 'white' : '#333',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{
              height: '1px',
              backgroundColor: '#e0e0e0',
              margin: '4px 0',
            }} />

            {/* Z-Index Controls */}
            <button
              onClick={() => onMoveForward?.()}
              style={{
                width: '100%',
                padding: '8px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#333',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MoveForwardIcon size={16} />
                <span>Move Forward</span>
              </div>
            </button>

            <button
              onClick={() => onMoveBackward?.()}
              style={{
                width: '100%',
                padding: '8px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#333',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MoveBackwardIcon size={16} />
                <span>Move Backward</span>
              </div>
            </button>

            <button
              onClick={() => onMoveToFront?.()}
              style={{
                width: '100%',
                padding: '8px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#333',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MoveToFrontIcon size={16} />
                <span>Move to Front</span>
              </div>
            </button>

            <button
              onClick={() => onMoveToBack?.()}
              style={{
                width: '100%',
                padding: '8px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#333',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MoveToBackIcon size={16} />
                <span>Move to Back</span>
              </div>
            </button>

            {/* Stroke Color (only for rectangle and circle) */}
            {showStrokeColorButton && (
              <>
                {/* Divider */}
                <div style={{
                  height: '1px',
                  backgroundColor: '#e0e0e0',
                  margin: '4px 0',
                }} />

                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => {
                      closeAllSubMenus();
                      setShowStrokeColorPicker(!showStrokeColorPicker);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      color: '#333',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StrokeColorIcon size={16} color={currentStrokeColor || '#333'} />
                      <span>Stroke Color</span>
                    </div>
                  </button>
                  {showStrokeColorPicker && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '100%',
                        top: '0',
                        marginLeft: '8px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        padding: '8px',
                        border: '1px solid #e0e0e0',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '4px',
                        zIndex: 1000,
                      }}
                    >
                      {STROKE_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleStrokeColorClick(color)}
                          style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: color,
                            border: currentStrokeColor === color ? '2px solid #007bff' : '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};
