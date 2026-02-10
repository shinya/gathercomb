import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { useBoardStore } from '../stores/boardStore';
import { BoardProvider } from '../yjs/BoardProvider';
import { Canvas } from '../components/canvas/Canvas';
import { boardService } from '../services/board';
import { MemberPanel } from '../components/MemberPanel';

export const BoardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [showMemberPanel, setShowMemberPanel] = useState(false);

  const {
    boardTitle,
    stickyNotes,
    shapes,
    boardProvider,
    isLoading,
    isConnected,
    error,
    setBoardTitle,
    setStickyNotes,
    setShapes,
    setBoardProvider,
    setIsLoading,
    setIsConnected,
    setError,
  } = useBoardStore();

  useEffect(() => {
    if (!user || !id) return;

    const initializeBoard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch board information from API to get the actual title
        const board = await boardService.getBoard(id!);
        setBoardTitle(board.title);

        // Create board provider
        const provider = new BoardProvider(id, user.id, user.displayName);
        await provider.initialize();

        setBoardProvider(provider);
        setIsConnected(provider.isConnected());

        // Set initial data
        setStickyNotes(provider.getStickyNotes());
        setShapes(provider.getShapes());

        // Update board title from Yjs if available, otherwise keep API title
        const yjsTitle = provider.getBoardMeta().title;
        if (yjsTitle && yjsTitle !== 'Untitled Board' && yjsTitle !== `Board ${id}`) {
          setBoardTitle(yjsTitle);
        }

        // Listen for changes
        provider.getDocument().on('update', (_update: Uint8Array, _origin: any) => {
          setStickyNotes(provider.getStickyNotes());
          setShapes(provider.getShapes());
        });

        // Listen for changes to the board document structure
        const boardDoc = provider.getBoardDocument();
        const stickiesMap = boardDoc.getBoardDoc().stickies;
        const shapesMap = boardDoc.getBoardDoc().shapes;

        stickiesMap.observe(() => {
          setStickyNotes(provider.getStickyNotes());
        });

        shapesMap.observe(() => {
          setShapes(provider.getShapes());
        });

        // Listen for connection status changes
        const checkConnectionStatus = () => {
          setIsConnected(provider.isConnected());
        };

        // Check connection status periodically
        const connectionInterval = setInterval(checkConnectionStatus, 1000);

        // Cleanup interval on unmount
        return () => {
          clearInterval(connectionInterval);
        };

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize board');
      } finally {
        setIsLoading(false);
      }
    };

    initializeBoard();

    // Cleanup on unmount
    return () => {
      if (boardProvider) {
        boardProvider.destroy();
      }
    };
  }, [user, id]);

  // Update canvas size on window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight - 60, // Account for header
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  if (!user) {
    return <div>Please log in to view this board.</div>;
  }

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Loading board...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#dc3545' }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '16px',
        backgroundColor: 'white',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary"
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Home
          </button>
          <div>
            {isEditingTitle ? (
              <input
                type="text"
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                onBlur={async () => {
                  const trimmed = editTitleValue.trim();
                  if (trimmed && trimmed !== boardTitle && id) {
                    try {
                      await boardService.updateBoard(id, { title: trimmed });
                      setBoardTitle(trimmed);
                    } catch { /* keep existing title */ }
                  }
                  setIsEditingTitle(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  if (e.key === 'Escape') { setIsEditingTitle(false); }
                }}
                autoFocus
                style={{
                  margin: 0,
                  fontSize: '1.5em',
                  fontWeight: 'bold',
                  border: '1px solid #007bff',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  outline: 'none',
                  width: '300px',
                }}
              />
            ) : (
              <h2
                style={{ margin: 0, cursor: 'pointer' }}
                onClick={() => {
                  setEditTitleValue(boardTitle || '');
                  setIsEditingTitle(true);
                }}
                title="Click to edit title"
              >
                {boardTitle || 'Untitled Board'}
              </h2>
            )}
            <div style={{ fontSize: '12px', color: '#666' }}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'} •
              {stickyNotes.size} sticky notes • {shapes.size} shapes
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowMemberPanel(true)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            Members
          </button>
          <span>Welcome, {user.displayName}</span>
        </div>
      </div>

      <div style={{
        flex: 1,
        backgroundColor: '#f5f5f5',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {canvasSize.width > 0 && canvasSize.height > 0 && (
          <Canvas width={canvasSize.width} height={canvasSize.height} />
        )}
      </div>

      {id && (
        <MemberPanel
          boardId={id}
          isOpen={showMemberPanel}
          onClose={() => setShowMemberPanel(false)}
          currentUserId={user.id}
        />
      )}
    </div>
  );
};
