import React from 'react';

interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutEntry {
  keys: string;
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutEntry[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'General',
    shortcuts: [
      { keys: 'Ctrl/Cmd + Z', description: 'Undo' },
      { keys: 'Ctrl/Cmd + Shift + Z / Ctrl/Cmd + Y', description: 'Redo' },
      { keys: 'Delete / Backspace', description: 'Delete selected' },
      { keys: 'Ctrl/Cmd + D', description: 'Duplicate selected' },
      { keys: '?', description: 'Toggle shortcuts panel' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: 'Scroll', description: 'Zoom in/out' },
      { keys: 'Drag canvas', description: 'Pan' },
    ],
  },
  {
    title: 'Selection',
    shortcuts: [
      { keys: 'Click', description: 'Select object' },
      { keys: 'Ctrl/Cmd + Click', description: 'Multi-select' },
    ],
  },
];

export const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          padding: '24px',
          minWidth: '420px',
          maxWidth: '520px',
          maxHeight: '80vh',
          overflowY: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            color: '#666',
            fontSize: '18px',
            lineHeight: 1,
            width: '28px',
            height: '28px',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f0f0f0';
            (e.currentTarget as HTMLButtonElement).style.color = '#333';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = '#666';
          }}
        >
          X
        </button>

        {/* Title */}
        <h2 style={{
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: 600,
          color: '#333',
          fontFamily: 'Arial, sans-serif',
        }}>
          Keyboard Shortcuts
        </h2>

        {/* Shortcut groups */}
        {shortcutGroups.map((group, groupIndex) => (
          <div key={group.title} style={{ marginBottom: groupIndex < shortcutGroups.length - 1 ? '20px' : '0' }}>
            <h3 style={{
              margin: '0 0 10px 0',
              fontSize: '13px',
              fontWeight: 600,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontFamily: 'Arial, sans-serif',
            }}>
              {group.title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {group.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.keys}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#f8f8f8',
                  }}
                >
                  <span style={{
                    fontSize: '13px',
                    color: '#555',
                    fontFamily: 'Arial, sans-serif',
                  }}>
                    {shortcut.description}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: '#333',
                    fontFamily: 'monospace',
                    backgroundColor: '#e8e8e8',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #d0d0d0',
                    whiteSpace: 'nowrap',
                  }}>
                    {shortcut.keys}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
